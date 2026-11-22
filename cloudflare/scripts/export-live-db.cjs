'use strict';
// Backup SQLite consistente + SQL para importacao D1. Nunca conecta na producao.
const fs = require('node:fs');
const os = require('node:os');
const path = require('node:path');
const crypto = require('node:crypto');
const Database = require('better-sqlite3');
const repoRoot = path.resolve(__dirname, '../..');
const MAX_SQL_BYTES = 95000; // D1 limita cada instrucao a 100 KB.
const MAX_D1_DB_BYTES = 500 * 1024 * 1024; // Limite de UM banco no Free.

function id(name) { return '"' + String(name).replace(/"/g, '""') + '"'; }
function sqlLiteral(value) {
    if (value === null) return 'NULL';
    if (Buffer.isBuffer(value)) return "X'" + value.toString('hex') + "'";
    if (typeof value === 'bigint') return value.toString();
    if (typeof value === 'number') {
        if (!Number.isFinite(value)) throw Error('Numero nao finito no banco.');
        return String(value);
    }
    if (typeof value === 'string') {
        if (value.includes('\0')) return "CAST(X'" + Buffer.from(value).toString('hex') + "' AS TEXT)";
        return "'" + value.replace(/'/g, "''") + "'";
    }
    throw Error('Tipo SQLite desconhecido: ' + typeof value);
}
function stableValue(value) {
    if (Buffer.isBuffer(value)) return { blob_hex: value.toString('hex') };
    if (typeof value === 'bigint') return { int64: value.toString() };
    return value;
}
function sortByDependencies(database, tables) {
    const indexed = new Map(tables.map(t => [t.name, t]));
    const sorted = [];
    const states = new Map();
    function visit(name, stack) {
        if (states.get(name) === 2) return;
        if (states.get(name) === 1) throw Error('Ciclo de dependencias entre tabelas: ' + [...stack, name].join(' > '));
        states.set(name, 1);
        for (const fk of database.pragma('foreign_key_list(' + id(name) + ')')) {
            if (fk.table !== name && indexed.has(fk.table)) visit(fk.table, [...stack, name]);
        }
        states.set(name, 2);
        sorted.push(indexed.get(name));
    }
    for (const t of tables) visit(t.name, []);
    return sorted;
}
function writeSql(fd, hash, content) {
    if (Buffer.byteLength(content, 'utf8') > MAX_SQL_BYTES && !content.startsWith('--')) {
        throw Error('Instrucao SQL excede 95 KB. Requer migracao por lotes/bindings sem truncar valores.');
    }
    fs.writeSync(fd, content, null, 'utf8');
    hash.update(content, 'utf8');
}
async function run() {
    const [, , sourceArg, outputArg] = process.argv;
    if (!sourceArg || !outputArg) throw Error('Uso: node cloudflare/scripts/export-live-db.cjs /copia/dna_auto.db /local-privado/dna-d1.sql');
    const sourcePath = path.resolve(sourceArg);
    const outputPath = path.resolve(outputArg);
    const manifestPath = outputPath + '.manifest.json';
    if (sourcePath === outputPath || !outputPath.endsWith('.sql')) throw Error('Saida deve ser um arquivo .sql diferente da origem.');
    const rel = path.relative(repoRoot, outputPath);
    if (!rel.startsWith('..' + path.sep) && rel !== '..' && !path.isAbsolute(rel)) {
        throw Error('REFUSADO: dump com dados pessoais nao pode ficar dentro do repositorio Git.');
    }
    if (fs.existsSync(outputPath) || fs.existsSync(manifestPath)) throw Error('Saida ja existe. Para evitar sobrescrita, escolha outro nome.');
    if (!fs.statSync(sourcePath).isFile()) throw Error('Origem nao e arquivo SQLite.');
    const tempDir = fs.mkdtempSync(path.join(os.tmpdir(), 'dna-auto-d1-'));
    const temporarySql = outputPath + '.partial-' + crypto.randomUUID();
    const temporaryManifest = manifestPath + '.partial-' + crypto.randomUUID();
    let source, backup, fd;
    try {
        source = new Database(sourcePath, { readonly: true, fileMustExist: true });
        if (source.pragma('integrity_check', { simple: true }) !== 'ok') throw Error('SQLite integrity_check falhou; exportacao abortada.');
        const fkBefore = source.pragma('foreign_key_check');
        if (fkBefore.length) throw Error('SQLite foreign_key_check falhou; exportacao abortada. Quantidade: ' + fkBefore.length);
        const snapshotPath = path.join(tempDir, 'consistent-snapshot.db');
        await source.backup(snapshotPath); // Snapshot WAL consistente: nunca copiar .db manualmente.
        source.close();
        source = null;
        backup = new Database(snapshotPath, { readonly: true, fileMustExist: true });
        backup.defaultSafeIntegers(true); // Int64 sem perda de precisao no dump.
        if (backup.pragma('integrity_check', { simple: true }) !== 'ok') throw Error('Snapshot corrompido.');
        const objects = backup.prepare(
            "SELECT type, name, sql FROM sqlite_master WHERE sql IS NOT NULL AND name NOT LIKE 'sqlite_%' AND name != '_cf_KV'"
        ).all();
        const tables = sortByDependencies(backup, objects.filter(o => o.type === 'table').sort((a,b) => a.name.localeCompare(b.name)));
        if (!tables.length) throw Error('Nenhuma tabela para exportar.');
        const snapshotSize = fs.statSync(snapshotPath).size;
        if (snapshotSize > MAX_D1_DB_BYTES) throw Error('Snapshot ultrapassa 500 MB, limite por banco D1 Free.');
        const hash = crypto.createHash('sha256');
        const totals = [];
        fd = fs.openSync(temporarySql, 'wx', 0o600);
        writeSql(fd, hash, '-- DNA AUTO: IMPORTACAO PRIVADA. NUNCA COMMITAR ESTE ARQUIVO.\n');
        writeSql(fd, hash, '-- Banco destino D1 deve estar VAZIO e ser de HOMOLOGACAO.\n');
        writeSql(fd, hash, 'PRAGMA defer_foreign_keys = ON;\n\n');
        for (const t of tables) writeSql(fd, hash, t.sql.replace(/;\s*$/, '') + ';\n\n');
        for (const t of tables) {
            const cols = backup.pragma('table_info(' + id(t.name) + ')').map(col => col.name);
            if (!cols.length) throw Error('Tabela sem colunas: ' + t.name);
            const colString = cols.map(id).join(', ');
            const digest = crypto.createHash('sha256');
            let count = 0;
            for (const row of backup.prepare('SELECT * FROM ' + id(t.name)).iterate()) {
                const values = cols.map(col => row[col]);
                digest.update(JSON.stringify(values.map(stableValue)) + '\n', 'utf8');
                const statement = 'INSERT INTO ' + id(t.name) + ' (' + colString + ') VALUES (' + values.map(sqlLiteral).join(', ') + ');\n';
                writeSql(fd, hash, statement);
                count++;
            }
            totals.push({ table: t.name, rows: count, sha256: digest.digest('hex') });
        }
        for (const o of objects.filter(o => o.type === 'index' || o.type === 'view' || o.type === 'trigger')
                               .sort((a,b) => ({index:0,view:1,trigger:2}[a.type] - {index:0,view:1,trigger:2}[b.type]) || a.name.localeCompare(b.name))) {
            writeSql(fd, hash, o.sql.replace(/;\s*$/, '') + ';\n\n');
        }
        fs.closeSync(fd); fd = undefined;
        const manifest = {
            format: 'dna-auto-d1-sql-v1', created_utc: new Date().toISOString(),
            snapshot_bytes: snapshotSize,
            schema_objects: objects.length,
            total_rows: totals.reduce((n, x) => n + x.rows, 0),
            sql_sha256: hash.digest('hex'), tables: totals,
            warning: 'Contem dados pessoais. Nao subir ao GitHub. Conferir contagens no D1 antes do corte.'
        };
        fs.writeFileSync(temporaryManifest, JSON.stringify(manifest, null, 2) + '\n', { flag: 'wx', mode: 0o600 });
        fs.renameSync(temporarySql, outputPath);
        fs.renameSync(temporaryManifest, manifestPath);
        console.log('Exportacao preparada com snapshot consistente: ' + totals.length + ' tabelas / ' + manifest.total_rows + ' linhas.');
        console.log('SQL e manifesto privados: ' + outputPath + ' (.manifest.json).');
        console.log('IMPORTANTE: apenas exportado; NAO importado no Cloudflare nem validado remotamente.');
    } finally {
        if (fd !== undefined) fs.closeSync(fd);
        if (source) source.close();
        if (backup) backup.close();
        fs.rmSync(temporarySql, { force: true });
        fs.rmSync(temporaryManifest, { force: true });
        fs.rmSync(tempDir, { recursive: true, force: true });
    }
}
if (require.main === module) run().catch(err => { console.error('EXPORTACAO ABORTADA: ' + err.message); process.exitCode = 1; });
module.exports = { sqlLiteral, sortByDependencies };
