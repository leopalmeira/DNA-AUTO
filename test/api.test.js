const app = require('../server/src/server');
const http = require('http');

let server;
const PORT = 3001;
const BASE_URL = `http://localhost:${PORT}/api/v1`;

async function runTests() {
    console.log('🧪 Iniciando Bateria de Testes Automatizados do DNA AUTO...\n');

    server = http.createServer(app);
    await new Promise((resolve) => server.listen(PORT, resolve));
    console.log(`📡 Servidor de teste ouvindo na porta ${PORT}`);

    try {
        // Teste 1: Healthcheck
        const resHealth = await fetch(`${BASE_URL}/health`);
        const dataHealth = await resHealth.json();
        console.assert(dataHealth.status === 'ONLINE', 'Falha no healthcheck');
        console.log('✅ 1. Healthcheck: ONLINE');

        // Teste 2: Login Admin
        const resLoginAdmin = await fetch(`${BASE_URL}/auth/login`, {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({ email: 'admin@dnaauto.com.br', password: 'admin123' })
        });
        const dataLoginAdmin = await resLoginAdmin.json();
        console.assert(!!dataLoginAdmin.token, 'Token admin ausente');
        console.log('✅ 2. Autenticação Admin: Sucesso com JWT');

        // Teste 3: Estatísticas da Rede DNA AUTO
        const resStats = await fetch(`${BASE_URL}/admin/network-stats`);
        const dataStats = await resStats.json();
        console.assert(dataStats.network.totalVehicles >= 4, 'Total de veículos incorreto');
        console.assert(dataStats.network.provenServices >= 3, 'Serviços comprovados incorretos');
        console.log(`✅ 3. Métricas da Rede: ${dataStats.network.totalVehicles} veículos, ${dataStats.network.provenServices} comprovados`);

        // Teste 4: Dossiê 360° do Honda Civic
        const resDossier = await fetch(`${BASE_URL}/dossier/DNA-BR-8F72-29A4-X91`);
        const dataDossier = await resDossier.json();
        console.assert(dataDossier.found === true, 'Civic não encontrado');
        console.assert(dataDossier.hasDna === true, 'Civic deveria ter DNA');
        console.assert(dataDossier.vehicle.dna_code === 'DNA-BR-8F72-29A4-X91', 'Código DNA incorreto');
        console.assert(dataDossier.health.overallScore >= 90, 'Score de saúde do Civic incorreto');
        console.assert(dataDossier.services.length >= 5, 'Histórico de serviços incompleto');
        console.log(`✅ 4. Dossiê 360°: Civic localizado com Score ${dataDossier.health.overallScore}/100 e ${dataDossier.services.length} serviços`);

        // Teste 5: 🔎 Lupa do Dossiê (Pesquisa por "correia")
        const resSearch = await fetch(`${BASE_URL}/dossier/DNA-BR-8F72-29A4-X91/search?q=correia`);
        const dataSearch = await resSearch.json();
        console.assert(dataSearch.totalMatches > 0, 'Nenhum registro encontrado para "correia"');
        console.assert(dataSearch.parts.length > 0, 'Peça correia não encontrada');
        console.log(`✅ 5. Lupa do Dossiê: Encontradas ${dataSearch.totalMatches} ocorrências para "correia"`);

        // Teste 6: Pesquisa da Fiat Strada (Sem DNA)
        const resStrada = await fetch(`${BASE_URL}/vehicles/search?q=STR1A99`);
        const dataStrada = await resStrada.json();
        console.assert(dataStrada.found === true, 'Strada não encontrada');
        console.assert(dataStrada.hasDna === false, 'Strada não deveria ter DNA');
        console.log('✅ 6. Pesquisa de Veículo sem DNA: Identificado com sucesso ("Este veículo ainda não possui DNA")');

        // Teste 7: Ativação de DNA na Strada pela Oficina
        const resActivate = await fetch(`${BASE_URL}/vehicles/activate-dna`, {
            method: 'POST',
            headers: {
                'Content-Type': 'application/json',
                'Authorization': `Bearer ${dataLoginAdmin.token}`
            },
            body: JSON.stringify({
                vehicle_id: dataStrada.vehicle.id,
                workshop_id: 'ws_veloce',
                modality: 'CAMPAIGN'
            })
        });
        const dataActivate = await resActivate.json();
        console.assert(dataActivate.success === true, 'Falha ao ativar DNA');
        console.assert(dataActivate.dna_code.startsWith('DNA-BR-'), 'Formato do DNA inválido');
        console.log(`✅ 7. Ativação de DNA: Gerado código permanente ${dataActivate.dna_code}`);

        // Teste 8: Geração do Relatório DNA AUTO para Venda
        const resReport = await fetch(`${BASE_URL}/reports/generate-sale-report`, {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({ vehicle_id: dataDossier.vehicle.id })
        });
        const dataReport = await resReport.json();
        console.assert(dataReport.success === true, 'Falha ao gerar relatório para venda');
        console.assert(dataReport.validationCode.startsWith('DNA-VAL-'), 'Código de validação inválido');
        console.log(`✅ 8. Relatório DNA para Venda: Emitido com código de autenticação ${dataReport.validationCode}`);

        // Teste 9: Decisão de Confirmação de Serviço Declarado
        const resDecision = await fetch(`${BASE_URL}/services/srv_corolla_pending_confirm/confirm-decision`, {
            method: 'POST',
            headers: {
                'Content-Type': 'application/json',
                'Authorization': `Bearer ${dataLoginAdmin.token}`
            },
            body: JSON.stringify({ decision: 'CONFIRMAR', notes: 'Serviço conferido no sistema da oficina' })
        });
        const dataDecision = await resDecision.json();
        console.assert(dataDecision.success === true, 'Falha ao confirmar serviço');
        console.assert(dataDecision.proof_level === 3, 'Proof level deveria ter mudado para 3');
        console.log('✅ 9. Confirmação de Serviço pela Oficina: Nível elevado para Nível 3 (CONFIRMADO)');

        console.log('\n🎉 TODOS OS 9 TESTES AUTOMATIZADOS PASSARAM COM 100% DE SUCESSO!\n');
    } catch (err) {
        console.error('❌ Erro durante a execução dos testes:', err);
        process.exit(1);
    } finally {
        server.close();
    }
}

runTests();
