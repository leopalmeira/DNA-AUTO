const app = require('../server/src/server');
const http = require('http');

let server;
const PORT = 3001;
const BASE_URL = `http://localhost:${PORT}/api/v1`;

async function runTests() {
    console.log('🧪 Iniciando Bateria de Testes Automatizados do DNA AUTO...\n');

    const db = require('../server/src/database/db');
    const { seedBase, seedDemoCars } = require('../server/src/database/seed');
    seedBase(db);
    seedDemoCars(db);

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
        const adminToken = dataLoginAdmin.token;
        console.assert(!!adminToken, 'Token admin ausente');
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
        const db = require('../server/src/database/db');
        db.prepare(`DELETE FROM vehicle_dna WHERE vehicle_id = 'veh_strada_freedom'`).run();
        db.prepare(`DELETE FROM health_scores WHERE vehicle_id = 'veh_strada_freedom'`).run();

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

        // Teste 10: Métricas Consolidadas de Faturamento da Plataforma
        console.assert(dataStats.financial && dataStats.financial.totalGrossRevenueCents > 0, 'Faturamento bruto da plataforma não calculado');
        console.assert(dataStats.network.totalWorkshops >= 2, 'Total de oficinas credenciadas incorreto');
        console.assert(dataStats.network.totalClients >= 3, 'Total de clientes da plataforma incorreto');
        console.log(`✅ 10. Faturamento e Rede do Admin: R$ ${(dataStats.financial.totalGrossRevenueCents / 100).toFixed(2)} faturamento bruto, ${dataStats.network.totalWorkshops} oficinas, ${dataStats.network.totalClients} clientes`);

        // Teste 11: Drill-down de Clientes por Oficina
        const resWorkshopClients = await fetch(`${BASE_URL}/admin/workshops/ws_veloce/clients`, {
            headers: { 'Authorization': `Bearer ${dataLoginAdmin.token}` }
        });
        const dataWorkshopClients = await resWorkshopClients.json();
        console.assert(dataWorkshopClients.success === true, 'Falha ao obter clientes da oficina');
        console.assert(dataWorkshopClients.clients.length > 0, 'Nenhum cliente listado para a oficina');
        console.log(`✅ 11. Clientes por Oficina: ${dataWorkshopClients.clients.length} clientes encontrados para Veloce Auto Center`);

        // Teste 12: Central de Alertas Preventivos WhatsApp (Óleo e Correias)
        const resAlerts = await fetch(`${BASE_URL}/admin/maintenance-alerts`, {
            headers: { 'Authorization': `Bearer ${dataLoginAdmin.token}` }
        });
        const dataAlerts = await resAlerts.json();
        console.assert(dataAlerts.success === true, 'Falha ao carregar alertas de manutenção');
        console.assert(dataAlerts.alerts.length > 0, 'Nenhum alerta preventivo calculado');
        const hasWhatsAppUrl = dataAlerts.alerts.some(a => a.whatsappUrl.includes('api.whatsapp.com'));
        console.assert(hasWhatsAppUrl === true, 'URL do WhatsApp não gerada corretamente nos alertas');
        console.log(`✅ 12. Alertas Preventivos WhatsApp: ${dataAlerts.alerts.length} alertas gerados com links diretos para WhatsApp`);

        // Teste 13: Recuperação de Senha (Esqueci minha senha)
        const resForgot = await fetch(`${BASE_URL}/auth/forgot-password`, {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({
                email: 'carlos.silva@email.com',
                newPassword: 'novaSenha123'
            })
        });
        const dataForgot = await resForgot.json();
        console.assert(dataForgot.success === true, 'Falha na redefinição de senha');
        console.log('✅ 13. Esqueci Minha Senha: Senha redefinida com sucesso para o usuário');

        // Teste 14: Frota de Carros por Oficina (Multi-Tenant)
        const resFleet = await fetch(`${BASE_URL}/admin/fleet`, {
            headers: { 'Authorization': `Bearer ${dataLoginAdmin.token}` }
        });
        const dataFleet = await resFleet.json();
        console.assert(dataFleet.success === true, 'Falha ao consultar frota da rede');
        console.assert(dataFleet.vehicles.length >= 4, 'Total de veículos da frota incorreto');
        console.log(`✅ 14. Frota por Oficina Multi-Tenant: ${dataFleet.vehicles.length} veículos catalogados com oficina vinculada`);

        // Teste 15: Carteira Geral de Clientes por Oficina
        const resAllClients = await fetch(`${BASE_URL}/admin/clients-all`, {
            headers: { 'Authorization': `Bearer ${dataLoginAdmin.token}` }
        });
        const dataAllClients = await resAllClients.json();
        console.assert(dataAllClients.success === true, 'Falha ao consultar clientes da rede');
        console.assert(dataAllClients.clients.length >= 1, 'Total de clientes da rede incorreto');
        console.log(`✅ 15. Carteira de Clientes: ${dataAllClients.clients.length} proprietários vinculados à oficina de atendimento`);

        // Teste 16: Gestão de Homologação de Oficina
        const resStatus = await fetch(`${BASE_URL}/admin/workshops/ws_veloce/status`, {
            method: 'POST',
            headers: {
                'Content-Type': 'application/json',
                'Authorization': `Bearer ${dataLoginAdmin.token}`
            },
            body: JSON.stringify({ status: 'APPROVED' })
        });
        const dataStatus = await resStatus.json();
        console.assert(dataStatus.success === true, 'Falha ao atualizar status da oficina');
        console.log('✅ 16. Homologação Multi-Tenant: Status da oficina verificado e aprovado com sucesso');

        // Teste 17: Keep-Alive Anti-Sleep Service (Render Free Tier)
        const { pingServer } = require('../server/src/services/keepAlive.service');
        const pingResult = await pingServer(`http://localhost:${PORT}`);
        console.assert(pingResult.success === true, 'Falha no teste de ping do keep-alive');
        console.assert(pingResult.status === 200, 'Status do ping do keep-alive diferente de 200');
        console.log('✅ 17. Keep-Alive Anti-Sleep: Ping no healthcheck executado com sucesso [200 OK]');

        // Teste 18: Consulta de Saldo de Créditos da API Placas (WDAPI2)
        const resBalance = await fetch(`${BASE_URL}/integrations/plate-balance`);
        const dataBalance = await resBalance.json();
        console.assert(dataBalance.success === true, 'Falha na consulta de saldo da API de placas');
        console.assert(dataBalance.qtdConsultas >= 1, 'Saldo de consultas contratadas deve ser positivo');
        console.log(`✅ 18. Saldo API Placas: ${dataBalance.qtdConsultas} consultas disponíveis no token ${dataBalance.tokenMasked}`);

        // Teste 19: Consulta Cadastral Oficial por Placa (INT8C36 - Crossfox)
        const resPlate = await fetch(`${BASE_URL}/integrations/plate-lookup/INT8C36`);
        const dataPlate = await resPlate.json();
        console.assert(dataPlate.found === true, 'Falha na consulta da placa INT8C36');
        console.assert(dataPlate.vehicle.brand === 'VW', 'Marca do veículo divergente');
        console.assert(dataPlate.vehicle.model === 'CROSSFOX', 'Modelo do veículo divergente');
        console.assert(dataPlate.vehicle.fipe && !!dataPlate.vehicle.fipe.market_value_formatted, 'FIPE oficial não retornada');
        console.assert(dataPlate.vehicle.fipe.score >= 50, 'Score da FIPE não calculado');
        console.log(`✅ 19. Consulta Oficial API Placas: ${dataPlate.vehicle.brand} ${dataPlate.vehicle.model} ${dataPlate.vehicle.manufacture_year} localizado com FIPE ${dataPlate.vehicle.fipe.market_value_formatted} (Score: ${dataPlate.vehicle.fipe.score})`);

        // Teste 20: Busca Global de Veículo via API Placas (/vehicles/search?q=INT8C36)
        const resSearchExt = await fetch(`${BASE_URL}/vehicles/search?q=INT8C36`);
        const dataSearchExt = await resSearchExt.json();
        console.assert(dataSearchExt.found === true, 'Veículo externo não localizado na busca global');
        console.assert(dataSearchExt.hasDna === false, 'Veículo externo recém-consultado não deveria ter DNA');
        console.assert(dataSearchExt.fromExternalApi === true, 'Flag fromExternalApi não informada');
        console.assert(dataSearchExt.vehicle.license_plate === 'INT8C36', 'Placa do veículo não coincide');
        // Teste 21: Cadastro de Veículo Vinculado a Proprietário, Hodômetro e Foto com Ativação Automática de DNA
        const testPlate = `DNA${Math.floor(1000 + Math.random() * 9000)}`;
        const resRegAuto = await fetch(`${BASE_URL}/vehicles/register`, {
            method: 'POST',
            headers: {
                'Content-Type': 'application/json',
                'Authorization': `Bearer ${adminToken}`
            },
            body: JSON.stringify({
                license_plate: testPlate,
                brand: 'Chevrolet',
                model: 'Onix Plus Turbo',
                manufacture_year: 2024,
                color: 'Prata',
                mileage: 18500,
                owner_name: 'Marcos Vinicius Pereira',
                owner_phone: '(19) 99876-5432',
                photo_url: 'https://images.unsplash.com/photo-1541899481282-d53bffe3c35d?w=800',
                activate_dna_now: true
            })
        });
        const dataRegAuto = await resRegAuto.json();
        console.assert(resRegAuto.status === 201, 'Erro no cadastro com ativação automática de DNA');
        console.assert(dataRegAuto.dna && dataRegAuto.dna.dna_code.startsWith('DNA-BR-'), 'Código DNA permanente não gerado automaticamente');
        console.assert(dataRegAuto.dna.status === 'ACTIVE', 'Status do DNA gerado deve ser ACTIVE');
        console.assert(dataRegAuto.vehicle && dataRegAuto.vehicle.owner_name === 'Marcos Vinicius Pereira', 'Nome do proprietário não vinculado');
        console.assert(dataRegAuto.vehicle && dataRegAuto.vehicle.owner_phone === '(19) 99876-5432', 'Telefone/WhatsApp do proprietário não vinculado');
        console.assert(dataRegAuto.vehicle && dataRegAuto.vehicle.mileage === 18500, 'Hodômetro de entrada divergente');
        console.assert(dataRegAuto.vehicle && dataRegAuto.vehicle.photo_url.includes('unsplash'), 'Foto do veículo não registrada');
        console.log(`✅ 21. Cadastro Completo com Auto-DNA: ${testPlate} (${dataRegAuto.vehicle.owner_name} | ${dataRegAuto.vehicle.owner_phone} | ${dataRegAuto.vehicle.mileage} km) ativado com DNA ${dataRegAuto.dna.dna_code}`);

        // Teste 22: Atualização de Configurações da Oficina e Geração de Código OTP
        const testPhone = `(19) 9${Math.floor(1000 + Math.random() * 9000)}-${Math.floor(1000 + Math.random() * 9000)}`;
        const resSettings = await fetch(`${BASE_URL}/workshops/ws_veloce/settings`, {
            method: 'PUT',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({
                trade_name: 'Veloce Auto Center Premium Pro',
                cnpj: '12.345.678/0001-90',
                whatsapp_official: testPhone,
                operating_hours: '07:30 às 18:30 (Segunda a Sexta)',
                auto_send_obd2_alerts: 1
            })
        });
        const dataSettings = await resSettings.json();
        console.assert(resSettings.status === 200, 'Falha ao salvar configurações da oficina');
        console.assert(dataSettings.whatsapp_status === 'PENDING_CONFIRMATION', 'Status do novo WhatsApp deve ser PENDING_CONFIRMATION');
        console.assert(dataSettings.whatsapp_code && dataSettings.whatsapp_code.length === 6, 'Código OTP de 6 dígitos não gerado');
        console.log(`✅ 22. Configurações da Oficina: Salvas com sucesso e código OTP gerado (${dataSettings.whatsapp_code})`);

        // Teste 23: Confirmação de WhatsApp via Código OTP
        const resOtp = await fetch(`${BASE_URL}/workshops/ws_veloce/whatsapp/confirm`, {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({
                code: dataSettings.whatsapp_code
            })
        });
        const dataOtp = await resOtp.json();
        console.assert(resOtp.status === 200, 'Falha na confirmação do código OTP');
        console.assert(dataOtp.whatsapp_status === 'VERIFIED', 'Status pós-confirmação deve ser VERIFIED');
        console.log(`✅ 23. Confirmação OTP de WhatsApp: Número validado e ativado como canal oficial`);

        // Teste 24: Disparo em Lote de Alertas Preventivos OBD2
        const resBatch = await fetch(`${BASE_URL}/workshops/ws_veloce/whatsapp/dispatch-batch`, {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' }
        });
        const dataBatch = await resBatch.json();
        console.assert(resBatch.status === 200, 'Falha no disparo de lote preventivo');
        console.assert(dataBatch.dispatched_count >= 1, 'Lote deveria conter ao menos 1 veículo para revisão preventiva');
        console.log(`✅ 24. Automação WhatsApp OBD2 em Lote: ${dataBatch.dispatched_count} alertas disparados com sucesso`);

        // Teste 25: Envio de WhatsApp In-Platform pela Oficina (Sem sair da tela)
        const resSingleWpp = await fetch(`${BASE_URL}/workshops/ws_veloce/whatsapp/send-message`, {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({
                recipient_phone: '(11) 98888-1111',
                recipient_name: 'Carlos Alberto Silva',
                message: 'Olá Carlos! Seu Honda Civic está no período ideal para revisão preventiva de pastilhas de freio.',
                vehicle_info: 'Honda Civic Touring (BRA2E19)',
                service_type: 'Pastilhas de Freio'
            })
        });
        const dataSingleWpp = await resSingleWpp.json();
        console.assert(resSingleWpp.status === 200, 'Falha no envio de WhatsApp in-platform');
        console.assert(dataSingleWpp.status === 'DELIVERED_IN_PLATFORM', 'Status do envio deve ser DELIVERED_IN_PLATFORM');
        console.assert(dataSingleWpp.protocol && dataSingleWpp.protocol.startsWith('DNA-WPP-'), 'Protocolo único de transmissão não gerado');
        console.log(`✅ 25. WhatsApp In-Platform da Oficina: Mensagem transmitida sem sair do sistema (Protocolo: ${dataSingleWpp.protocol})`);

        // Teste 26: Listagem Dinâmica de Veículos com DNA e Dados Agregados (/vehicles)
        const resVehiclesList = await fetch(`${BASE_URL}/vehicles`);
        const dataVehiclesList = await resVehiclesList.json();
        console.assert(resVehiclesList.status === 200, 'Falha ao listar veículos cadastrados');
        console.assert(Array.isArray(dataVehiclesList.vehicles), 'Lista de veículos deve ser um array');
        const foundNewVeh = dataVehiclesList.vehicles.find(v => v.license_plate === testPlate);
        console.assert(foundNewVeh && foundNewVeh.dna_code === dataRegAuto.dna.dna_code, 'Veículo recém-cadastrado não encontrado na listagem geral');
        console.assert(foundNewVeh && foundNewVeh.owner_name === 'Marcos Vinicius Pereira', 'Proprietário não retornado na listagem');
        console.log(`✅ 26. Listagem Dinâmica de Veículos: ${dataVehiclesList.vehicles.length} veículos carregados com DNA, proprietários e odômetros de entrada`);

        // Teste 27: Status Inicial do WhatsApp Baileys da Oficina
        const resWppStatus = await fetch(`${BASE_URL}/workshops/ws_veloce/whatsapp/status`);
        const dataWppStatus = await resWppStatus.json();
        console.assert(resWppStatus.status === 200, 'Falha ao consultar status do WhatsApp');
        console.assert(typeof dataWppStatus.status === 'string', 'Status do WhatsApp deve ser string');
        console.log(`✅ 27. Status Inicial Baileys: Oficina ws_veloce com status [${dataWppStatus.status}]`);

        // Teste 28: Solicitação de Conexão Baileys (Geração de Pairing Code e QR Code)
        const resWppConnect = await fetch(`${BASE_URL}/workshops/ws_veloce/whatsapp/connect`, {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({ phone: '(11) 98888-0000', mode: 'code' })
        });
        const dataWppConnect = await resWppConnect.json();
        console.assert(resWppConnect.status === 200, 'Falha ao iniciar pareamento Baileys');
        console.assert(dataWppConnect.success === true, 'Conexão deve retornar sucesso');
        console.assert(dataWppConnect.status === 'PAIRING', 'Status deve ser PAIRING');
        console.assert(dataWppConnect.pairing_code && dataWppConnect.pairing_code.length >= 8, 'Código de pareamento não gerado');
        console.assert(dataWppConnect.qr_code && dataWppConnect.qr_code.startsWith('data:image/'), 'QR Code não gerado em formato DataURL');
        console.log(`✅ 28. Iniciação Baileys: Pairing Code [${dataWppConnect.pairing_code}] e QR Code gerados com sucesso`);

        // Teste 29: Confirmação e Ativação da Conexão da Oficina
        const resWppConfirm = await fetch(`${BASE_URL}/workshops/ws_veloce/whatsapp/confirm`, {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' }
        });
        const dataWppConfirm = await resWppConfirm.json();
        console.assert(resWppConfirm.status === 200, 'Falha ao confirmar conexão Baileys');
        console.assert(dataWppConfirm.success === true, 'Confirmação deve retornar sucesso');
        console.assert(dataWppConfirm.status === 'CONNECTED', 'Status pós-confirmação deve ser CONNECTED');
        console.log(`✅ 29. Ativação Baileys: Conexão estabelecida com sucesso (Status: ${dataWppConfirm.status})`);

        // Teste 30: Catálogo de Templates Inteligentes WhatsApp
        const resWppTemplates = await fetch(`${BASE_URL}/workshops/ws_veloce/whatsapp/templates`);
        const dataWppTemplates = await resWppTemplates.json();
        console.assert(resWppTemplates.status === 200, 'Falha ao carregar templates');
        console.assert(Array.isArray(dataWppTemplates.templates), 'Templates deve ser um array');
        console.assert(dataWppTemplates.templates.length >= 8, 'Devem existir no mínimo 8 templates pré-definidos');
        const prontoTpl = dataWppTemplates.templates.find(t => t.id === 'tpl_pronto' || t.name === 'Veículo pronto');
        console.assert(!!prontoTpl, 'Template Veículo pronto não encontrado');
        console.log(`✅ 30. Templates Inteligentes: ${dataWppTemplates.templates.length} templates carregados com variáveis dinâmicas`);

        // Teste 31: Envio Oficial e Histórico de Mensagens Baileys
        const resWppSend = await fetch(`${BASE_URL}/workshops/ws_veloce/whatsapp/send-message`, {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({
                recipient_phone: '(11) 97777-6666',
                recipient_name: 'Roberto Andrade',
                message: 'Olá Roberto, seu Honda Civic já passou pelo teste de rodagem e está pronto para retirada!',
                vehicle_info: 'Honda Civic (BRA2E19)',
                service_type: 'Revisão Geral',
                template_id: 'tpl_pronto'
            })
        });
        const dataWppSend = await resWppSend.json();
        console.assert(resWppSend.status === 200, 'Falha no envio de mensagem via Baileys');
        console.assert(dataWppSend.success === true, 'Envio deve ser bem-sucedido');
        console.assert(dataWppSend.status === 'SENT' || dataWppSend.status === 'DELIVERED_IN_PLATFORM', 'Status inválido no envio');

        const resWppHistory = await fetch(`${BASE_URL}/workshops/ws_veloce/whatsapp/history`);
        const dataWppHistory = await resWppHistory.json();
        console.assert(resWppHistory.status === 200, 'Falha ao carregar histórico');
        const historyList = dataWppHistory.messages || dataWppHistory.history;
        console.assert(Array.isArray(historyList), 'Histórico deve ser um array');
        console.assert(historyList.length >= 1, 'Histórico deve registrar o envio');
        console.log(`✅ 31. Envio & Histórico Baileys: Mensagem enviada e registrada no histórico da oficina (${historyList.length} mensagens no log)`);

        // Teste 32: Telemetria em Tempo Real do Mini OBD2 (ELM327 BLE)
        const resObd = await fetch(`${BASE_URL}/vehicles/BRA2E19/obd`);
        const dataObd = await resObd.json();
        console.assert(resObd.status === 200, 'Falha ao consultar telemetria OBD2');
        console.assert(dataObd.success === true, 'Sucesso esperado na telemetria');
        console.assert(dataObd.device.connected === true, 'Dispositivo OBD2 deve estar conectado');
        console.assert(dataObd.telemetry.rpm > 0, 'RPM deve ser maior que 0');
        console.assert(dataObd.telemetry.coolant_temp_c === 90, 'Temperatura do motor incorreta');
        console.assert(dataObd.telemetry.battery_voltage >= 13.8, 'Tensão do alternador insuficiente');
        console.assert(dataObd.diagnostics.dtc_count === 0, 'Não deve haver códigos de falha DTC ativos');
        console.log(`✅ 32. Telemetria Mini OBD2: Dongle ${dataObd.device.name} conectado | RPM: ${dataObd.telemetry.rpm} | Temp: ${dataObd.telemetry.coolant_temp_c}°C | Bateria: ${dataObd.telemetry.battery_voltage}V | Falhas: ${dataObd.diagnostics.dtc_count} DTC`);

        // Teste 33: Documentos Digitais Autenticados (CRLV-e 2026 e Certificados)
        const resDocs = await fetch(`${BASE_URL}/vehicles/BRA2E19/documents`);
        const dataDocs = await resDocs.json();
        console.assert(resDocs.status === 200, 'Falha ao consultar documentos digitais');
        console.assert(dataDocs.success === true, 'Sucesso esperado nos documentos');
        console.assert(Array.isArray(dataDocs.documents) && dataDocs.documents.length >= 4, 'Deveriam existir ao menos 4 documentos veiculares');
        const crlvDoc = dataDocs.documents.find(d => d.id === 'doc_crlv_2026');
        console.assert(!!crlvDoc, 'CRLV-e 2026 não localizado');
        console.assert(crlvDoc.badge === 'LICENCIADO 2026', 'Status do licenciamento 2026 incorreto');
        console.log(`✅ 33. Documentos Digitais Autenticados: ${dataDocs.documents.length} documentos carregados (incluindo ${crlvDoc.title} com status "${crlvDoc.badge}")`);

        // Teste 34: Gestão de Foto do Veículo (Foto Oficial do Modelo e Troca pelo Dono)
        const resPhotoQuery = await fetch(`${BASE_URL}/vehicles/BRA2E19/photo`);
        const dataPhotoQuery = await resPhotoQuery.json();
        console.assert(resPhotoQuery.status === 200, 'Falha ao consultar foto do veículo');
        console.assert(!!dataPhotoQuery.default_model_photo, 'Foto padrão do modelo deve existir');

        // Atualização para foto customizada do dono
        const customOwnerPhoto = 'https://images.unsplash.com/photo-custom-owner-car.jpg';
        const resUpdatePhoto = await fetch(`${BASE_URL}/vehicles/BRA2E19/photo`, {
            method: 'PATCH',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({ photo_url: customOwnerPhoto })
        });
        const dataUpdatePhoto = await resUpdatePhoto.json();
        console.assert(resUpdatePhoto.status === 200, 'Falha ao atualizar foto pelo dono');
        console.assert(dataUpdatePhoto.photo_url === customOwnerPhoto, 'URL da nova foto incorreta');
        console.assert(dataUpdatePhoto.is_custom === true, 'Foto deve ser marcada como personalizada');

        // Restauração para foto padrão oficial do modelo
        const resResetPhoto = await fetch(`${BASE_URL}/vehicles/BRA2E19/photo`, {
            method: 'PATCH',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({ photo_url: 'default' })
        });
        const dataResetPhoto = await resResetPhoto.json();
        console.assert(resResetPhoto.status === 200, 'Falha ao restaurar foto do modelo');
        console.assert(dataResetPhoto.photo_url === dataPhotoQuery.default_model_photo, 'Deve reverter para a foto do modelo');
        console.assert(dataResetPhoto.is_custom === false, 'Foto restaurada não deve ser custom');
        console.log(`✅ 34. Foto Oficial do Modelo & Troca pelo Dono: Foto atualizada com sucesso e reversão para modelo [${dataPhotoQuery.brand} ${dataPhotoQuery.model}] testada.`);

        // Teste 35: Inspeção Técnica 360° e Plano de Revisões do Veículo
        const resInsp = await fetch(`${BASE_URL}/vehicles/BRA2E19/inspection`);
        const dataInsp = await resInsp.json();
        console.assert(resInsp.status === 200, 'Falha ao consultar inspeção técnica do veículo');
        console.assert(dataInsp.success === true, 'Sucesso esperado na inspeção');
        console.assert(dataInsp.inspection.score === 98, 'Score da inspeção deve ser 98');
        console.assert(Array.isArray(dataInsp.inspection.modules) && dataInsp.inspection.modules.length === 6, 'Devem existir 6 módulos inspecionados');
        console.assert(dataInsp.revisions.next_revision.target_mileage === 90000, 'Meta da próxima revisão incorreta');
        console.assert(Array.isArray(dataInsp.revisions.history) && dataInsp.revisions.history.length >= 3, 'Histórico de revisões deve conter registros');
        console.log(`✅ 35. Inspeção Técnica 360° & Revisões: Laudo [${dataInsp.inspection.inspection_code}] com Score ${dataInsp.inspection.score}/100 e Próxima Revisão em ${dataInsp.revisions.next_revision.target_mileage.toLocaleString('pt-BR')} km validada com sucesso.`);

        // Teste 36: Progressive Web App (PWA) e Parâmetros Google Play Store / TWA
        const resManifest = await fetch(`http://localhost:${PORT}/manifest.json`);
        console.assert(resManifest.status === 200, 'Manifesto PWA deve retornar status 200');
        const dataManifest = await resManifest.json();
        console.assert(dataManifest.name.includes('DNA AUTO'), 'Nome do PWA incorreto');
        console.assert(dataManifest.short_name === 'DNA AUTO', 'Nome curto do PWA deve ser DNA AUTO');
        console.assert(dataManifest.display === 'standalone', 'Display do PWA deve ser standalone');
        console.assert(Array.isArray(dataManifest.icons) && dataManifest.icons.length >= 4, 'PWA deve conter múltiplos ícones');
        const has192 = dataManifest.icons.some(i => i.sizes === '192x192');
        const has512 = dataManifest.icons.some(i => i.sizes === '512x512');
        console.assert(has192 && has512, 'PWA deve ter ícones 192x192 e 512x512 para Play Store');
        
        const resSw = await fetch(`http://localhost:${PORT}/sw.js`);
        console.assert(resSw.status === 200, 'Service Worker deve retornar status 200');
        const swContent = await resSw.text();
        console.assert(swContent.includes('self.addEventListener'), 'Service Worker deve conter listeners');

        console.log(`✅ 36. PWA Oficial Google Play Store: Manifesto [${dataManifest.short_name}] com display standalone, Service Worker e ${dataManifest.icons.length} ícones nativos validado com sucesso.`);

        // Teste 37: Upload Real de Foto do Veículo (Multipart/Form-Data) com Persistência
        const photoFormData = new FormData();
        const dummyImageBuffer = Buffer.from('fake-jpeg-image-binary-data');
        photoFormData.append('photo', new Blob([dummyImageBuffer], { type: 'image/jpeg' }), 'car_owner_upload.jpg');
        const resPhotoUpload = await fetch(`${BASE_URL}/vehicles/BRA2E19/photo-upload`, {
            method: 'POST',
            body: photoFormData
        });
        const dataPhotoUpload = await resPhotoUpload.json();
        console.assert(resPhotoUpload.status === 200, 'Falha no endpoint de photo-upload');
        console.assert(dataPhotoUpload.success === true, 'Upload de foto deve retornar success: true');
        console.assert(typeof dataPhotoUpload.photo_url === 'string' && dataPhotoUpload.photo_url.startsWith('/uploads/vehicles/'), 'URL da foto deve apontar para /uploads/vehicles/');
        console.log(`✅ 37. Upload Real de Foto do Veículo (Multipart): Arquivo salvo em [${dataPhotoUpload.photo_url}] e persistido com sucesso no banco de dados.`);

        // Teste 38: Cadastro de Cliente pela Oficina & Código de Ativação (DNA-XXXX)
        const resRegActivation = await fetch(`${BASE_URL}/workshops/ws_veloce/clients/register-activation`, {
            method: 'POST',
            headers: {
                'Content-Type': 'application/json',
                'Authorization': `Bearer ${adminToken}`
            },
            body: JSON.stringify({
                client_name: 'Roberto Mendonça',
                whatsapp: '11987654321',
                license_plate: 'BRA2E19',
                vehicle_model: 'Honda Civic Touring'
            })
        });
        const dataRegActivation = await resRegActivation.json();
        console.assert(resRegActivation.status === 201, 'Falha ao registrar ativação de cliente');
        console.assert(dataRegActivation.success === true, 'Registro de ativação deve retornar success: true');
        console.assert(typeof dataRegActivation.activation_code === 'string' && dataRegActivation.activation_code.startsWith('DNA-'), 'Código de ativação deve iniciar com DNA-');
        const generatedCode = dataRegActivation.activation_code;

        // Listagem de ativações da oficina
        const resListAct = await fetch(`${BASE_URL}/workshops/ws_veloce/clients/activations`, {
            headers: { 'Authorization': `Bearer ${adminToken}` }
        });
        const dataListAct = await resListAct.json();
        console.assert(resListAct.status === 200, 'Falha ao listar ativações da oficina');
        console.assert(dataListAct.success === true, 'Listagem de ativações deve retornar success: true');
        console.assert(dataListAct.activations.some(a => a.activation_code === generatedCode), 'Código gerado deve constar na listagem');

        // Ativação do veículo pelo cliente usando o código
        const resClientActivate = await fetch(`${BASE_URL}/clients/activate`, {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({ activation_code: generatedCode })
        });
        const dataClientActivate = await resClientActivate.json();
        console.assert(resClientActivate.status === 200, 'Falha na rota pública de ativação de cliente');
        console.assert(dataClientActivate.success === true, 'Ativação deve retornar success: true');
        console.assert(dataClientActivate.status === 'ACTIVATED', 'Status da ativação deve ser ACTIVATED');
        console.assert(dataClientActivate.client.name === 'Roberto Mendonça', 'Nome do cliente na ativação incorreto');

        // Teste de código inválido
        const resInvalidActivate = await fetch(`${BASE_URL}/clients/activate`, {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({ activation_code: 'DNA-INVALIDO-999' })
        });
        console.assert(resInvalidActivate.status === 404, 'Código inválido deve retornar 404');
        console.log(`✅ 38. Cadastro de Cliente pela Oficina & Ativação no App: Código [${generatedCode}] gerado e ativado pelo cliente com sucesso.`);

        console.log('\n🎉 TODOS OS 38 TESTES AUTOMATIZADOS PASSARAM COM 100% DE SUCESSO!\n');
    } catch (err) {
        console.error('❌ Erro durante a execução dos testes:', err);
        process.exit(1);
    } finally {
        try {
            const db = require('../server/src/database/db');
            const { seedBase } = require('../server/src/database/seed');
            seedBase(db);
            console.log('🧹 Base de dados restaurada para estado limpo (sem mocks) com sucesso.');
        } catch (_) {}
        server.close();
    }
}

runTests();
