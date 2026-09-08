const fs = require('fs');
const path = require('path');

const html = fs.readFileSync(path.join(__dirname, '../public/index.html'), 'utf8');
const regex = /onclick="([^"]+)"/g;
let match;
const onclicks = new Set();
while ((match = regex.exec(html)) !== null) {
    onclicks.add(match[1]);
}

console.log('--- ONCLICKs em index.html ---');
for (const oc of onclicks) {
    console.log(oc);
}
