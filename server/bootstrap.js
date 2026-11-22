'use strict';
const backup = require('./src/services/firebaseBackup.service');
async function main() {
    // Restaura banco remoto antes da inicializacao automatica do db.js.
    await backup.restoreOnBoot();
    const app = require('./src/server');
    const server = app.startServer();
    backup.startAutomaticBackups(server);
}
if (require.main === module) {
    main().catch(err => {
        console.error('DNA AUTO: inicializacao segura interrompida:', err.message);
        process.exitCode = 1;
    });
}
module.exports = { main };
