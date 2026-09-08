async function findRealVehicleData(plate) {
    console.log('Testando busca real para:', plate);

    // Lista de potenciais APIs públicas e abertas
    const apis = [
        // API Brasil / WDAPI / etc.
        {
            name: 'API Carros',
            url: `https://apicarros.com/v1/consulta/${plate}/json`
        },
        {
            name: 'Placa Fipe',
            url: `https://api.placafipe.xyz/placa/${plate}`
        },
        {
            name: 'Brasil API FIPE',
            url: `https://brasilapi.com.br/api/fipe/marcas/v1/carros`
        },
        {
            name: 'Fipe Parallelum',
            url: `https://parallelum.com.br/fipe/api/v1/carros/marcas`
        }
    ];

    for (const api of apis) {
        try {
            console.log(`[${api.name}] Fetching ${api.url}`);
            const res = await fetch(api.url, {
                headers: {
                    'User-Agent': 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/122.0.0.0 Safari/537.36'
                }
            });
            console.log(`[${api.name}] Status: ${res.status}`);
            const text = await res.text();
            console.log(`[${api.name}] Response (primeiros 200 chars):`, text.substring(0, 200));
        } catch (e) {
            console.log(`[${api.name}] Erro:`, e.message);
        }
    }
}

findRealVehicleData('LPS0905');
