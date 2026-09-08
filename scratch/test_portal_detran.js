const fs = require('fs');

async function testDetranPortal() {
    try {
        const url = 'https://www2.detran.rj.gov.br/portal/veiculos/consultaCadastro';
        const res = await fetch(url, {
            headers: {
                'User-Agent': 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36'
            }
        });
        const html = await res.text();
        fs.writeFileSync('./scratch/portal_detran.html', html, 'utf8');
        console.log('Salvo portal_detran.html');

        const formMatches = html.match(/<form[\s\S]*?<\/form>/gi) || [];
        formMatches.forEach(f => console.log(f));
    } catch (e) {
        console.error('Erro:', e.message);
    }
}
testDetranPortal();
