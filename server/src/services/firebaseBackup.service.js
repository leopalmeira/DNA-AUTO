'use strict';
// Backup opcional do SQLite no Firebase Cloud Storage, sem mudar a API nem os dados.
const fs = require('node:fs');
const path = require('node:path');
const os = require('node:os');
const crypto = require('node:crypto');
const jwt = require('jsonwebtoken');
const TOKEN_URL = 'https://oauth2.googleapis.com/token';
let tokenCache = null, activeBackup = null, timer = null, interval = null, lastChanges = -1;

function databasePath() {
    return path.resolve(process.env.DB_PATH || path.join(__dirname, '..', '..', 'dna_auto.db'));
}
function configured() {
    return Boolean(process.env.FIREBASE_SERVICE_ACCOUNT_JSON && process.env.FIREBASE_STORAGE_BUCKET);
}
function config() {
    if (!configured()) throw new Error('Firebase Backup exige FIREBASE_SERVICE_ACCOUNT_JSON e FIREBASE_STORAGE_BUCKET.');
    let account;
    try { account = JSON.parse(process.env.FIREBASE_SERVICE_ACCOUNT_JSON); }
    catch (_) { throw new Error('Firebase Backup: JSON da conta de servico invalido.'); }
    if (!account.project_id || !account.client_email || !account.private_key)
        throw new Error('Firebase Backup: credenciais incompletas.');
    const bucket = process.env.FIREBASE_STORAGE_BUCKET;
    const object = process.env.FIREBASE_BACKUP_OBJECT || 'dna-auto/production/sqlite-latest.db';
    if (!/^[a-z0-9][a-z0-9._-]{2,220}$/i.test(bucket) || !/^[a-z0-9][a-z0-9/_.-]{2,220}$/i.test(object) || object.includes('..'))
        throw new Error('Firebase Backup: bucket ou objeto invalido.');
    return { account, bucket, object };
}
async function token(account) {
    const now = Math.floor(Date.now() / 1000);
    if (tokenCache && tokenCache.email === account.client_email && tokenCache.exp > now + 120)
        return tokenCache.value;
    const assertion = jwt.sign({
        iss: account.client_email,
        sub: account.client_email,
        scope: 'https://www.googleapis.com/auth/devstorage.read_write',
        aud: TOKEN_URL,
        iat: now,
        exp: now + 3500
    }, account.private_key, { algorithm: 'RS256' });
    const response = await fetch(TOKEN_URL, {
        method: 'POST',
        headers: { 'Content-Type': 'application/x-www-form-urlencoded' },
        body: new URLSearchParams({
            grant_type: 'urn:ietf:params:oauth:grant-type:jwt-bearer',
            assertion
        })
    });
    if (!response.ok) throw new Error('Firebase Backup: login da conta de servico falhou (HTTP ' + response.status + ').');
    const json = await response.json();
    if (!json.access_token) throw new Error('Firebase Backup: token ausente.');
    tokenCache = { email: account.client_email, value: json.access_token, exp: now + Math.min(json.expires_in || 3500, 3500) };
    return json.access_token;
}
async function restoreOnBoot() {
    const target = databasePath();
    if (!configured()) {
        if (process.env.RENDER && !target.startsWith('/var/data/') && !target.startsWith('/data/'))
            console.error('RISCO DE PERDA: SQLite em disco efemero no Render sem backup Firebase. Cadastros podem sumir apos o deploy.');
        return { status: 'not-configured' };
    }
    const c = config();
    if (fs.existsSync(target)) return { status: 'local-present' };
    const auth = await token(c.account);
    const url = 'https://storage.googleapis.com/storage/v1/b/' + encodeURIComponent(c.bucket) + '/o/' +
        encodeURIComponent(c.object) + '?alt=media';
    const response = await fetch(url, { headers: { Authorization: 'Bearer ' + auth } });
    if (response.status === 404) {
        if (process.env.FIREBASE_ALLOW_EMPTY_INIT === '1') return { status: 'empty-authorized' };
        throw new Error('Firebase Backup: nenhum banco local ou remoto encontrado. Inicializacao bloqueada; para base nova configure FIREBASE_ALLOW_EMPTY_INIT=1 temporariamente.');
    }
    if (!response.ok) throw new Error('Firebase Backup: download falhou (HTTP ' + response.status + ').');
    const bytes = Buffer.from(await response.arrayBuffer());
    if (bytes.length < 100 || bytes.subarray(0, 16).toString() !== 'SQLite format 3\u0000')
        throw new Error('Firebase Backup: arquivo remoto nao e SQLite valido.');
    await fs.promises.mkdir(path.dirname(target), { recursive: true });
    const temp = target + '.restore-' + process.pid;
    try {
        await fs.promises.writeFile(temp, bytes, { mode: 0o600, flag: 'wx' });
        await fs.promises.rename(temp, target);
    } finally { await fs.promises.rm(temp, { force: true }).catch(() => {}); }
    console.log('Firebase Backup: SQLite restaurado da nuvem antes de abrir o banco.');
    return { status: 'restored' };
}
async function doBackup(force) {
    const db = require('../database/db');
    const changes = db.totalChanges;
    if (!force && changes === lastChanges) return { status: 'unchanged' };
    const c = config();
    const temp = path.join(os.tmpdir(), 'dna-snapshot-' + process.pid + '-' + crypto.randomUUID() + '.db');
    try {
        await db.backup(temp); // Snapshot consistente com WAL, sem copiar .db diretamente.
        const bytes = await fs.promises.readFile(temp);
        if (bytes.subarray(0, 16).toString() !== 'SQLite format 3\u0000')
            throw new Error('Firebase Backup: snapshot local invalido.');
        const auth = await token(c.account);
        const url = 'https://storage.googleapis.com/upload/storage/v1/b/' + encodeURIComponent(c.bucket) +
            '/o?uploadType=media&name=' + encodeURIComponent(c.object);
        const response = await fetch(url, {
            method: 'POST',
            headers: { Authorization: 'Bearer ' + auth, 'Content-Type': 'application/octet-stream' },
            body: bytes
        });
        if (!response.ok) throw new Error('Firebase Backup: envio falhou (HTTP ' + response.status + ').');
        lastChanges = changes;
        return { status: 'uploaded', bytes: bytes.length };
    } finally { await fs.promises.rm(temp, { force: true }).catch(() => {}); }
}
function backupNow(force = false) {
    if (!configured()) return Promise.resolve({ status: 'not-configured' });
    if (activeBackup) return activeBackup.then(() => backupNow(force));
    activeBackup = doBackup(force).finally(() => { activeBackup = null; });
    return activeBackup;
}
function scheduleBackup() {
    if (!configured() || timer) return;
    timer = setTimeout(() => {
        timer = null;
        backupNow().catch(err => console.error(err.message));
    }, 2500);
    timer.unref?.();
}
function startAutomaticBackups(server) {
    if (!configured()) return;
    backupNow(true).catch(err => console.error(err.message));
    interval = setInterval(() => backupNow().catch(err => console.error(err.message)), 30000);
    interval.unref?.();
    let closing = false;
    for (const signal of ['SIGTERM', 'SIGINT']) {
        process.once(signal, async () => {
            if (closing) return;
            closing = true;
            clearInterval(interval);
            clearTimeout(timer);
            const watchdog = setTimeout(() => process.exit(1), 20000);
            watchdog.unref?.();
            server.close();
            try { await backupNow(true); console.log('Firebase Backup: ultimo backup enviado.'); }
            catch (error) { console.error('Firebase Backup: falha ao enviar copia final:', error.message); }
            process.exit(0);
        });
    }
}
module.exports = { configured, databasePath, restoreOnBoot, backupNow, scheduleBackup, startAutomaticBackups };
