const http = require('http');

function post(path, data) {
    return new Promise((resolve, reject) => {
        const body = JSON.stringify(data);
        const req = http.request({
            hostname: 'localhost',
            port: 3000,
            path: '/api/v1' + path,
            method: 'POST',
            headers: {
                'Content-Type': 'application/json',
                'Content-Length': Buffer.byteLength(body)
            }
        }, (res) => {
            let resData = '';
            res.on('data', chunk => resData += chunk);
            res.on('end', () => {
                try {
                    resolve({ status: res.statusCode, body: JSON.parse(resData) });
                } catch (e) {
                    resolve({ status: res.statusCode, raw: resData });
                }
            });
        });
        req.on('error', reject);
        req.write(body);
        req.end();
    });
}

async function run() {
    console.log('--- Testando Cadastro de Cliente ---');
    const cliEmail = `cliente_${Date.now()}@teste.com`;
    const cliRes = await post('/auth/register-client', {
        name: 'Cliente Teste Novo',
        email: cliEmail,
        password: 'senha123',
        phone: '(11) 98888-1111',
        cpf: '123.456.789-00'
    });
    console.log('Status Cliente:', cliRes.status, 'Token gerado:', !!cliRes.body.token, 'Role:', cliRes.body.user && cliRes.body.user.role_code);

    console.log('\n--- Testando Cadastro de Oficina Parceira ---');
    const wsEmail = `oficina_${Date.now()}@teste.com`;
    const wsCnpj = `${Math.floor(10000000 + Math.random() * 90000000)}000199`;
    const wsRes = await post('/auth/register-workshop', {
        tradeName: 'Mecânica Modelo Teste',
        cnpj: wsCnpj,
        technicianName: 'Mecânico Chefe Teste',
        phone: '(11) 97777-2222',
        email: wsEmail,
        password: 'senha123',
        city: 'São Paulo',
        state: 'SP'
    });
    console.log('Status Oficina:', wsRes.status, 'Token gerado:', !!wsRes.body.token, 'Role:', wsRes.body.user && wsRes.body.user.role_code, 'Oficina Nome:', wsRes.body.user && wsRes.body.user.workshop && wsRes.body.user.workshop.workshop_name);
}

run().catch(console.error);
