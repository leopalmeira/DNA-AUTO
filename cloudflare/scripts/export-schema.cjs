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
        const target = path.resolve(process.argv[2] || path.join(os.tmpdir(), 'dna-d1-schema.sql'));
        fs.mkdirSync(path.dirname(target), { recursive: true });
        fs.writeFileSync(target, contents, { mode: 0o600 });
        console.log('Exportacao segura validada: ' + expected + ' tabelas, somente esquema: ' + target);
    } finally { check.close(); }
} finally {
    if (db) db.close();
    fs.rmSync(temporaryDirectory, { recursive: true, force: true });
}
