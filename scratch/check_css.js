const fs = require('fs');
const path = require('path');

const cssDir = path.join(__dirname, '../public/css');
const files = fs.readdirSync(cssDir).filter(f => f.endsWith('.css'));

for (const file of files) {
    const content = fs.readFileSync(path.join(cssDir, file), 'utf8');
    let openBraces = 0;
    let lines = content.split('\n');
    let errors = [];

    for (let i = 0; i < lines.length; i++) {
        const line = lines[i];
        // Remove comments and strings roughly
        const clean = line.replace(/\/\*.*?\*\//g, '').replace(/".*?"/g, '').replace(/'.*?'/g, '');
        for (const char of clean) {
            if (char === '{') openBraces++;
            if (char === '}') openBraces--;
            if (openBraces < 0) {
                errors.push(`Linha ${i + 1}: Chave de fechamento '}' inesperada.`);
                openBraces = 0;
            }
        }
    }

    if (openBraces !== 0) {
        errors.push(`Fim do arquivo: Faltam ${openBraces} chaves de fechamento '}'.`);
    }

    if (errors.length > 0) {
        console.log(`❌ Erro em ${file}:`);
        errors.forEach(e => console.log('   ' + e));
    } else {
        console.log(`✅ ${file}: Balanceamento de chaves OK!`);
    }
}
