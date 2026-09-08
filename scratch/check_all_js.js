const fs = require('fs');
const path = require('path');
const { execSync } = require('child_process');

function checkDir(dir) {
    const entries = fs.readdirSync(dir, { withFileTypes: true });
    for (const entry of entries) {
        const full = path.join(dir, entry.name);
        if (entry.isDirectory()) {
            checkDir(full);
        } else if (entry.name.endsWith('.js')) {
            try {
                execSync(`node -c "${full}"`);
                console.log(`✅ ${path.relative(process.cwd(), full)} OK`);
            } catch (e) {
                console.error(`❌ Erro de sintaxe em ${path.relative(process.cwd(), full)}`);
            }
        }
    }
}

console.log('--- Verificando sintaxe de todos os arquivos JS ---');
checkDir(path.join(__dirname, '../public/js'));
checkDir(path.join(__dirname, '../server/src'));
