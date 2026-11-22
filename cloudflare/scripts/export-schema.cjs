'use strict';
// Exporta apenas o ESQUEMA atualizado num banco temporario. NUNCA copia cadastros ou senhas.
const fs = require('node:fs');
const os = require('node:os');
const path = require('node:path');
const Database = require('better-sqlite3');
const temporaryDirectory = fs.mkdtempSync(path.join(os.tmpdir(), 'dna-d1-schema-'));
process.env.NODE_ENV = 'test';
process.env.DB_PATH = path.join(temporaryDirectory, 'temporary.db');
let db;
try {
    db = require('../../server/src/database/db');
    // O servidor Express antigo altera colunas ao carregar rotas.
    // No Workers nao existem essas inicializacoes; persistir TODAS no schema D1.
    const runtimeColumns = [
        ['users', 'must_change_password', 'INTEGER NOT NULL DEFAULT 0'],
        ['vehicles', 'current_owner_id', 'TEXT'],
        ['vehicles', 'workshop_id', 'TEXT'],
        ['client_activations', 'email', 'TEXT'],
        ['service_records', 'registered_by_user_id', 'TEXT'],
        ['service_records', 'part_photo_url', 'TEXT']
    ];
    for (const [table, column, type] of runtimeColumns) {
        const columns = db.pragma('table_info("' + table + '")');
        if (!columns.length) throw Error('Tabela obrigatoria ausente: ' + table);
        if (!columns.some(record => record.name === column)) {
            db.exec('ALTER TABLE "' + table + '" ADD COLUMN "' + column + '" ' + type);
        }
    }
    const objects = db.prepare("SELECT type, name, sql FROM sqlite_master WHERE sql IS NOT NULL AND name NOT LIKE 'sqlite_%'").all();
    const order = { table: 0, view: 1, index: 2, trigger: 3 };
    objects.sort((a, b) => (order[a.type] ?? 9) - (order[b.type] ?? 9) || a.name.localeCompare(b.name));
    const contents = [
        '-- DNA AUTO: apenas estrutura do banco, sem usuarios, veiculos ou outras informacoes.',
        'PRAGMA defer_foreign_keys = ON;',
        ...objects.map(x => x.sql.trim().replace(/;\s*$/, '') + ';')
    ].join('\n\n') + '\n';
    // Validar que nenhum CREATE ficou de fora. Nao valida compatibilidade remota do D1.
    const check = new Database(':memory:');
    try {
        check.exec(contents);
        const expected = objects.filter(x => x.type === 'table').length;
        const actual = check.prepare("SELECT count(*) AS count FROM sqlite_master WHERE type = 'table' AND name NOT LIKE 'sqlite_%'").get().count;
        if (expected !== actual || expected < 30) throw Error('Esquema incompleto.');
        for (const [table, column] of runtimeColumns) {
            const columns = check.pragma('table_info("' + table + '")');
            if (!columns.some(record => record.name === column)) {
                throw Error('Coluna obrigatoria ausente no D1: ' + table + '.' + column);
            }
        }
        const target = path.resolve(process.argv[2] || path.join(os.tmpdir(), 'dna-d1-schema.sql'));
        fs.mkdirSync(path.dirname(target), { recursive: true });
        fs.writeFileSync(target, contents, { mode: 0o600 });
        console.log('Exportacao segura validada: ' + expected + ' tabelas, somente esquema: ' + target);
    } finally { check.close(); }
} finally {
    if (db) db.close();
    fs.rmSync(temporaryDirectory, { recursive: true, force: true });
}
