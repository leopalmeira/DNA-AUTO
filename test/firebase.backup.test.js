'use strict';
const assert = require('node:assert/strict');
const fs = require('node:fs');
const os = require('node:os');
const path = require('node:path');
const crypto = require('node:crypto');
const Database = require('better-sqlite3');

async function main() {
    const directory = fs.mkdtempSync(path.join(os.tmpdir(), 'dna-firebase-test-'));
    const dbPath = path.join(directory, 'test.db');
    const local = new Database(dbPath);
    local.exec("CREATE TABLE preserved (id INTEGER PRIMARY KEY, value TEXT)");
    local.prepare("INSERT INTO preserved(value) VALUES (?)").run("cliente_antes_do_commit");
    local.close();
    const original = fs.readFileSync(dbPath);
    fs.unlinkSync(dbPath);
    const { privateKey } = crypto.generateKeyPairSync('rsa', { modulusLength: 2048 });
    process.env.NODE_ENV = 'test';
    process.env.DB_PATH = dbPath;
    process.env.FIREBASE_STORAGE_BUCKET = 'dna-auto-unit-test.firebasestorage.app';
    process.env.FIREBASE_SERVICE_ACCOUNT_JSON = JSON.stringify({
        project_id: 'dna-test',
        client_email: 'dna-unit-test@dna-test.iam.gserviceaccount.com',
        private_key: privateKey.export({ type: 'pkcs8', format: 'pem' })
    });
    delete process.env.FIREBASE_ALLOW_EMPTY_INIT;

    let cloud = null;
    let uploads = 0;
    const originalFetch = global.fetch;
    global.fetch = async (url, init = {}) => {
        if (String(url).includes('oauth2.googleapis.com/token'))
            return new Response(JSON.stringify({ access_token: 'fake-token', expires_in: 3500 }), { status: 200 });
        if (String(url).includes('upload/storage/v1')) {
            cloud = Buffer.from(init.body);
            uploads++;
            return new Response(JSON.stringify({ name: 'dna-auto/production/sqlite-latest.db' }), { status: 200 });
        }
        if (String(url).includes('storage/v1'))
            return cloud ? new Response(cloud, { status: 200 }) : new Response('missing', { status: 404 });
        throw new Error('URL inesperada: ' + url);
    };
    try {
        const backup = require('../server/src/services/firebaseBackup.service');
        await assert.rejects(backup.restoreOnBoot(), /nenhum banco local ou remoto/, 'Ausencia de backup nao pode causar reset');
        cloud = original;
        assert.equal((await backup.restoreOnBoot()).status, 'restored');
        const recovered = new Database(dbPath, { readonly: true });
        assert.equal(recovered.prepare('SELECT value FROM preserved').get().value, 'cliente_antes_do_commit');
        recovered.close();
        assert.deepEqual(fs.readFileSync(dbPath), original, 'Backup deve restaurar bytes originais');

        const db = require('../server/src/database/db');
        db.prepare('INSERT INTO preserved(value) VALUES (?)').run('cliente_depois_do_commit');
        const result = await backup.backupNow(true);
        assert.equal(result.status, 'uploaded');
        assert.equal(uploads, 1);
        const cloudCopy = path.join(directory, 'uploaded.db');
        fs.writeFileSync(cloudCopy, cloud);
        const online = new Database(cloudCopy, { readonly: true });
        assert.deepEqual(online.prepare('SELECT value FROM preserved ORDER BY id').all().map(x => x.value),
            ['cliente_antes_do_commit', 'cliente_depois_do_commit']);
        online.close();
        assert.equal((await backup.backupNow()).status, 'unchanged');
        db.close();
        console.log('✅ Firebase Backup: restauracao, protecao contra reset, snapshots SQLite e upload aprovados.');
    } finally {
        global.fetch = originalFetch;
        fs.rmSync(directory, { recursive: true, force: true });
    }
}
main().catch(error => { console.error(error); process.exitCode = 1; });
