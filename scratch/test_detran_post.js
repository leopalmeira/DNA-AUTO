async function testDetranPost(plate) {
    try {
        const url = 'https://www2.detran.rj.gov.br/portal/veiculos/consultaCadastro';
        const params = new URLSearchParams();
        params.append('data[placa]', plate);
        params.append('g-recaptcha-response', '');

        const res = await fetch(url, {
            method: 'POST',
            headers: {
                'User-Agent': 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/120.0.0.0 Safari/537.36',
                'X-Requested-With': 'XMLHttpRequest',
                'X-Update': 'retorno',
                'Content-Type': 'application/x-www-form-urlencoded; charset=UTF-8',
                'Origin': 'https://www2.detran.rj.gov.br',
                'Referer': 'https://www2.detran.rj.gov.br/portal/veiculos/consultaCadastro'
            },
            body: params.toString()
        });

        console.log('Status Detran POST:', res.status);
        const text = await res.text();
        console.log('Resposta Detran RJ (primeiros 1000 chars):');
        console.log(text.substring(0, 1000));
    } catch (e) {
        console.error('Erro:', e.message);
    }
}

testDetranPost('LPS0905');
