async function testApis(plate) {
    const mercosulPlate = plate.length === 7 ? (plate.substring(0, 4) + String.fromCharCode(65 + parseInt(plate[4])) + plate.substring(5)) : plate;
    console.log('Placa:', plate, 'Mercosul:', mercosulPlate);

    const endpoints = [
        `https://brasilapi.com.br/api/fipe/marcas/v1/carros`,
        `https://parallelum.com.br/fipe/api/v1/carros/marcas`,
        `https://api.fipe.org.br`,
        `https://fipeapi.appspot.com/api/1/carros/marcas.json`
    ];

    for (const ep of endpoints) {
        try {
            const res = await fetch(ep, { headers: { 'User-Agent': 'Mozilla/5.0' } });
            console.log(ep, res.status);
            if (res.ok) {
                const data = await res.json();
                console.log('OK, items:', Array.isArray(data) ? data.length : typeof data);
            }
        } catch (e) {
            console.log(ep, 'ERR:', e.message);
        }
    }
}
testApis('LPS0905');
