const http = require('http');

function testSearch(q) {
    http.get('http://localhost:3000/api/v1/dossier/DNA-BR-8F72-29A4-X91/search?q=' + encodeURIComponent(q), (res) => {
        let d = '';
        res.on('data', c => d += c);
        res.on('end', () => {
            const parsed = JSON.parse(d);
            console.log(`Query "${q}": ${parsed.totalMatches} matches encontrados.`);
        });
    });
}

testSearch('oleo');
testSearch('óleo');
testSearch('pastilha');
testSearch('amortecedor');
