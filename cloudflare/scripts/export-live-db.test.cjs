'use strict';
const { test } = require('node:test');
const assert = require('node:assert/strict');
const fs = require('node:fs');
const os = require('node:os');
const path = require('node:path');
const { spawnSync } = require('node:child_process');
const Database = require('better-sqlite3');
const exporter = path.join(__dirname, 'export-live-db.cjs');
function run(db, sql) {
    return spawnSync(process.execPath, [exporter, db, sql], { encoding: 'utf8', timeout: 20000 });
}
test('dump com FK, int64, blob, acento e aspas preserva dados e manifesta contagens', () => {
    const dir = fs.mkdtempSync(path.join(os.tmpdir(), 'dna-export-test-'));
    try {
        const sourceFile = path.join(dir, 'source.db');
        const sqlFile = path.join(dir, 'dump.sql');
        const source = new Database(sourceFile);
        source.exec("PRAGMA foreign_keys = ON; CREATE TABLE groups(id INTEGER PRIMARY KEY, name TEXT); CREATE TABLE clients(id INTEGER PRIMARY KEY, group_id INTEGER REFERENCES groups(id), display TEXT, payload BLOB, big INTEGER); CREATE INDEX idx_clients_group ON clients(group_id);");
        source.prepare('INSERT INTO groups VALUES (?, ?)').run(1, 'Oficina São João');
        source.prepare('INSERT INTO clients VALUES (?, ?, ?, ?, ?)').run(10, 1, "D'Ávila", Buffer.from([0,1,255]), 9007199254740991n);
        source.close();
        const res = run(sourceFile, sqlFile);
        assert.equal(res.status, 0, res.stderr);
        const sql = fs.readFileSync(sqlFile, 'utf8');
        assert.ok(sql.includes("D''Ávila"));
        assert.ok(!sql.includes('BEGIN TRANSACTION'));
        assert.ok(!sql.includes('\nCOMMIT;'));
        const restored = new Database(':memory:');
        restored.exec(sql);
        assert.equal(restored.prepare('SELECT count(*) AS c FROM clients').get().c, 1);
        const row = restored.prepare('SELECT * FROM clients').get();
        assert.equal(row.display, "D'Ávila");
        assert.deepEqual(row.payload, Buffer.from([0,1,255]));
        assert.equal(row.big, 9007199254740991);
        assert.deepEqual(restored.pragma('foreign_key_check'), []);
        restored.close();
        const manifest = JSON.parse(fs.readFileSync(sqlFile + '.manifest.json', 'utf8'));
        assert.equal(manifest.total_rows, 2);
        assert.equal(manifest.tables.length, 2);
        assert.match(manifest.sql_sha256, /^[0-9a-f]{64}$/);
        const again = run(sourceFile, sqlFile);
        assert.notEqual(again.status, 0, 'nao pode sobrescrever backup existente');
    } finally { fs.rmSync(dir, { recursive: true, force: true }); }
});
test('rejeita dump dentro do repositorio e nao cria dados versionaveis', () => {
    const dir = fs.mkdtempSync(path.join(os.tmpdir(), 'dna-export-test-'));
    try {
        const dbFile = path.join(dir, 'source.db');
        const db = new Database(dbFile);
        db.exec('CREATE TABLE t(id INTEGER PRIMARY KEY);');
        db.close();
        const forbidden = path.join(__dirname, 'nao-criar-dump.sql');
        const result = run(dbFile, forbidden);
        assert.notEqual(result.status, 0);
        assert.equal(fs.existsSync(forbidden), false);
    } finally { fs.rmSync(dir, { recursive: true, force: true }); }
});
test('rejeita linha que excederia limite SQL do D1 sem gerar dump parcial', () => {
    const dir = fs.mkdtempSync(path.join(os.tmpdir(), 'dna-export-test-'));
    try {
        const dbFile = path.join(dir, 'source.db');
        const sqlFile = path.join(dir, 'oversize.sql');
        const db = new Database(dbFile);
        db.exec('CREATE TABLE t(id INTEGER PRIMARY KEY, body TEXT);');
        db.prepare('INSERT INTO t VALUES (1, ?)').run('X'.repeat(97000));
        db.close();
        const result = run(dbFile, sqlFile);
        assert.notEqual(result.status, 0);
        assert.equal(fs.existsSync(sqlFile), false);
    } finally { fs.rmSync(dir, { recursive: true, force: true }); }
});
