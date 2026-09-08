const fs = require('fs');

async function getDetranRjHtml() {
    try {
        const res = await fetch('https://www.detran.rj.gov.br/consultas/consultas-drv/cadastro-de-veiculo.html', {
            headers: {
                'User-Agent': 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/120.0.0.0 Safari/537.36'
            }
        });
        const html = await res.text();
        fs.writeFileSync('./scratch/detran_rj.html', html, 'utf8');
        console.log('Salvo detran_rj.html, tamanho:', html.length);

        const formMatches = html.match(/<form[\s\S]*?<\/form>/gi) || [];
        console.log('Forms encontrados:', formMatches.length);
        formMatches.forEach((f, idx) => {
            console.log(`--- FORM ${idx} ---`);
            console.log(f.substring(0, 300));
        });

        const iframeMatches = html.match(/<iframe[\s\S]*?<\/iframe>/gi) || [];
        console.log('Iframes encontrados:', iframeMatches.length);
        iframeMatches.forEach((f, idx) => {
            console.log(`--- IFRAME ${idx} ---`);
            console.log(f.substring(0, 300));
        });
    } catch (e) {
        console.error('Erro:', e);
    }
}

getDetranRjHtml();
