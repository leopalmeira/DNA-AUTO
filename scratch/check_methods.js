const fs = require('fs');
const path = require('path');

const compDir = path.join(__dirname, '../public/js/components');
const files = fs.readdirSync(compDir).filter(f => f.endsWith('.js'));

const calledMethods = [];

for (const file of files) {
    const content = fs.readFileSync(path.join(compDir, file), 'utf8');
    const regex = /onclick="([A-Za-z0-9_]+)\.([A-Za-z0-9_]+)\([^"]*\)"/g;
    let match;
    while ((match = regex.exec(content)) !== null) {
        calledMethods.push({
            file,
            object: match[1],
            method: match[2]
        });
    }
}

// Ler conteúdo de todos os componentes
const componentContents = {};
for (const file of files) {
    componentContents[file] = fs.readFileSync(path.join(compDir, file), 'utf8');
}
const appJs = fs.readFileSync(path.join(__dirname, '../public/js/app.js'), 'utf8');

console.log('--- Verificando Métodos Chamados em ONCLICK ---');
for (const call of calledMethods) {
    const targetObj = call.object;
    const targetMethod = call.method;
    let found = false;

    // Procura se o método existe em algum arquivo
    for (const [f, content] of Object.entries(componentContents)) {
        if (content.includes(`${targetObj} =`) || content.includes(`const ${targetObj} =`)) {
            if (content.includes(`${targetMethod}(`) || content.includes(`${targetMethod}:`)) {
                found = true;
                break;
            }
        }
    }
    if (!found && (appJs.includes(`${targetObj} =`) || appJs.includes(`const ${targetObj} =`))) {
        if (appJs.includes(`${targetMethod}(`) || appJs.includes(`${targetMethod}:`)) {
            found = true;
        }
    }

    if (!found) {
        console.log(`❌ Chamada potencialmente quebrada em ${call.file}: ${call.object}.${call.method}()`);
    }
}
console.log('--- Verificação Concluída ---');
