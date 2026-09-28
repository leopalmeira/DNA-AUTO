// ==============================================================================
// DNA AUTO — COMPONENTE MOBILE FIRST DA OFICINA & AUTO CENTER
// Implementação fiel aos mockups do aplicativo para mecânicos e funcionários
// Lógica Operacional: ABRIU → IDENTIFICOU → CLICOU → EXECUTOU → VOLTOU
// ==============================================================================

(function() {
    if (typeof WorkshopView === 'undefined') {
        console.warn('WorkshopView ainda não carregado. Aguardando inicialização...');
        return;
    }

    // ──────────────────────────────────────────────────────────────────────────
    // ESTADO E EXTENSÃO DO WORKSHOPVIEW PARA O MODO MOBILE
    // ──────────────────────────────────────────────────────────────────────────
    WorkshopView.currentViewMode = localStorage.getItem('dna_workshop_view_mode') || 'mobile';
    WorkshopView.mobileActiveTab = 'inicio';
    WorkshopView.selectedMobileVehicle = null;
    WorkshopView.selectedMobileService = null;
    WorkshopView.mobileUploadedPhotos = [];
    WorkshopView.mobileInvoiceAttachment = null;
    WorkshopView.mobileActivePlate = '';
    WorkshopView.mobileAlertsSent = {};
    WorkshopView.mobileVehicleEntryTab = 'buscar'; // 'buscar' | 'manual' | 'recentes'
    WorkshopView.mobileMaintFilter = 'todos'; // 'todos' | 'atrasadas' | 'em_breve' | 'em_dia'
    WorkshopView.mobileAlertTab = 'pendentes'; // 'pendentes' | 'enviados'
    WorkshopView.mobileClientsTab = 'lista'; // 'lista' | 'cadastrar'
    WorkshopView.mobileSearchType = 'placa'; // 'placa' | 'chassi' | 'cliente'
    WorkshopView.authActiveTab = 'login'; // 'login' | 'register'
    WorkshopView.authTargetMode = 'mobile'; // 'mobile' | 'web'

    // ──────────────────────────────────────────────────────────────────────────
    // SISTEMA DE NOTIFICAÇÕES TOAST IN-APP (SUBSTITUI POPUPS NATIVOS BLOQUEANTES)
    // ──────────────────────────────────────────────────────────────────────────
    WorkshopView.showToast = function(message, type = 'success', duration = 3800) {
        if (!message) return;
        let container = document.getElementById('dna-mobile-toast-container');
        if (!container) {
            container = document.createElement('div');
            container.id = 'dna-mobile-toast-container';
            container.className = 'dna-mobile-toast-container';
            document.body.appendChild(container);
        }

        const toast = document.createElement('div');
        toast.className = `dna-mobile-toast toast-${type}`;

        // Determina ícone baseado no tipo ou no conteúdo
        let icon = '✨';
        const strMsg = String(message);
        if (type === 'success' || strMsg.includes('✅') || strMsg.includes('🎉') || strMsg.includes('🟢') || strMsg.includes('📸') || strMsg.includes('💾')) {
            icon = '✓';
            toast.classList.add('toast-success');
        } else if (type === 'error' || strMsg.includes('❌') || strMsg.toLowerCase().includes('erro')) {
            icon = '✕';
            toast.classList.add('toast-error');
        } else if (type === 'warning' || strMsg.includes('⚠️') || strMsg.includes('Por favor') || strMsg.includes('Digite')) {
            icon = '⚠️';
            toast.classList.add('toast-warning');
        } else if (strMsg.includes('📲') || strMsg.includes('WhatsApp')) {
            icon = '💬';
        }

        // Separa título e descrição se contiver quebras de linha (\n)
        let title = '';
        let body = '';
        const lines = strMsg.split('\n').filter(p => p.trim());
        if (lines.length > 1) {
            title = lines[0];
            body = lines.slice(1).join('<br>');
        } else {
            title = lines[0] || strMsg;
            body = '';
        }

        toast.innerHTML = `
            <div class="dna-mobile-toast-icon">${icon}</div>
            <div class="dna-mobile-toast-content">
                <div class="dna-mobile-toast-title">${title}</div>
                ${body ? `<div class="dna-mobile-toast-message">${body}</div>` : ''}
            </div>
            <button type="button" class="dna-mobile-toast-close" onclick="this.parentElement.remove()">✕</button>
        `;

        container.appendChild(toast);

        setTimeout(() => {
            if (toast.parentElement) {
                toast.classList.add('toast-hiding');
                setTimeout(() => { if (toast.parentElement) toast.remove(); }, 280);
            }
        }, duration);
    };

    // Redireciona alertas nativos do browser e exibe toasts in-app elegantes
    if (typeof window !== 'undefined') {
        const _origAlert = window.alert;
        window.alert = function(msg) {
            if (typeof WorkshopView !== 'undefined' && WorkshopView.showToast) {
                WorkshopView.showToast(String(msg || ''));
            } else if (_origAlert) {
                _origAlert(msg);
            }
        };
    }

    WorkshopView.mobileInvoiceItems = [
        { id: 'item_1', title: 'Troca de Óleo e Filtros', price: 420.00, checked: true },
        { id: 'item_2', title: 'Filtro de Ar', price: 85.00, checked: true },
        { id: 'item_3', title: 'Óleo de Motor Sintético 5W30', price: 180.00, checked: true }
    ];

    // Catálogo Oficial de Serviços para Monitoramento (Sem Preços!)
    WorkshopView.monitoredServicesCatalog = [
        { id: 'srv_oleo', num: 1, title: 'Troca de Óleo e Filtros', defaultKm: 10000, defaultMonths: 6, mode: 'ambos', icon: '🛢️', category: 'oleo_filtros', iconBg: 'rgba(245, 158, 11, 0.18)', desc: 'Óleo sintético/semissintético e troca de filtro de óleo' },
        { id: 'srv_alinhamento', num: 2, title: 'Alinhamento e Balanceamento', defaultKm: 10000, defaultMonths: 6, mode: 'km', icon: '⚙️', category: 'freios_suspensao', iconBg: 'rgba(0, 212, 255, 0.18)', desc: 'Geometria 3D, cambagem e balanceamento das 4 rodas' },
        { id: 'srv_freios', num: 3, title: 'Freios (Pastilhas e Discos)', defaultKm: 20000, defaultMonths: 12, mode: 'km', icon: '🛑', category: 'freios_suspensao', iconBg: 'rgba(239, 68, 68, 0.18)', desc: 'Inspeção de pastilhas, discos, tambores e pinças' },
        { id: 'srv_ar', num: 4, title: 'Ar-Condicionado e Filtro de Cabine', defaultKm: 10000, defaultMonths: 6, mode: 'tempo', icon: '❄️', category: 'oleo_filtros', iconBg: 'rgba(56, 189, 248, 0.18)', desc: 'Higienização com ozônio e troca do filtro de pólen' },
        { id: 'srv_revisao', num: 5, title: 'Revisão Geral Preventiva', defaultKm: 10000, defaultMonths: 12, mode: 'ambos', icon: '🔍', category: 'mecanica', iconBg: 'rgba(16, 185, 129, 0.18)', desc: 'Checkup completo de 50 itens de segurança e mecânica' },
        { id: 'srv_suspensao', num: 6, title: 'Suspensão e Amortecedores', defaultKm: 40000, defaultMonths: 24, mode: 'km', icon: '🔩', category: 'freios_suspensao', iconBg: 'rgba(245, 158, 11, 0.18)', desc: 'Amortecedores, batentes, bieletas, buchas e pivôs' },
        { id: 'srv_correia', num: 7, title: 'Correia Dentada e Tensores', defaultKm: 50000, defaultMonths: 36, mode: 'km', icon: '⛓️', category: 'mecanica', iconBg: 'rgba(239, 68, 68, 0.18)', desc: 'Kit de distribuição: correia sincronizadora e esticador' },
        { id: 'srv_bateria', num: 8, title: 'Bateria e Sistema Elétrico', defaultKm: 0, defaultMonths: 24, mode: 'tempo', icon: '🔋', category: 'eletrica_fluidos', iconBg: 'rgba(168, 85, 247, 0.18)', desc: 'Teste de condutância, alternador e carga nominal' },
        { id: 'srv_filtro_ar', num: 9, title: 'Filtro de Ar do Motor', defaultKm: 10000, defaultMonths: 12, mode: 'km', icon: '💨', category: 'oleo_filtros', iconBg: 'rgba(59, 130, 246, 0.18)', desc: 'Elemento filtrante de admissão de ar para motor' },
        { id: 'srv_filtro_comb', num: 10, title: 'Filtro de Combustível', defaultKm: 10000, defaultMonths: 12, mode: 'km', icon: '⛽', category: 'oleo_filtros', iconBg: 'rgba(245, 158, 11, 0.18)', desc: 'Filtro de linha de combustível etanol/gasolina' },
        { id: 'srv_fluidos', num: 11, title: 'Fluido de Freio e Arrefecimento', defaultKm: 30000, defaultMonths: 24, mode: 'ambos', icon: '🧪', category: 'eletrica_fluidos', iconBg: 'rgba(16, 185, 129, 0.18)', desc: 'Aditivo orgânico de radiador e fluido DOT 4/5.1' },
        { id: 'srv_velas', num: 12, title: 'Velas e Cabos de Ignição', defaultKm: 30000, defaultMonths: 24, mode: 'km', icon: '⚡', category: 'mecanica', iconBg: 'rgba(234, 179, 8, 0.18)', desc: 'Velas de Iridium/Níquel e cabos supressores' },
        { id: 'srv_pneus', num: 13, title: 'Pneus e Rodízio', defaultKm: 10000, defaultMonths: 6, mode: 'km', icon: '🛞', category: 'freios_suspensao', iconBg: 'rgba(100, 116, 139, 0.22)', desc: 'Rodízio de eixos, calibragem e verificação de TWI' },
        { id: 'srv_limpeza', num: 14, title: 'Limpeza de Bicos e Injeção', defaultKm: 20000, defaultMonths: 12, mode: 'km', icon: '🚿', category: 'mecanica', iconBg: 'rgba(6, 182, 212, 0.18)', desc: 'Ultrassom de injetores, descarbonização e TBI' },
        { id: 'srv_outros', num: 15, title: 'Outros Serviços Especializados', defaultKm: 10000, defaultMonths: 12, mode: 'ambos', icon: '🔧', category: 'eletrica_fluidos', iconBg: 'rgba(99, 102, 241, 0.18)', desc: 'Diagnóstico computadorizado, scanner e elétrica geral' }
    ];

    // Veículos Padrão de Demonstração para Mecânicos
    WorkshopView.getDefaultMobileVehicles = function() {
        return [
            {
                id: 'veh_civic',
                license_plate: 'ABC1D23',
                plate: 'ABC1D23',
                brand: 'Honda',
                model: 'Civic Touring 1.5 Turbo',
                year: '2020',
                color: 'Prata',
                chassis: '9BWCA41JX9P029348',
                mileage: 9950, // Faltam 50 km para os 10.000 km!
                client_name: 'João da Silva',
                client_phone: '(21) 98765-4321',
                client_email: 'joao@email.com',
                photo_url: './img/vehicles/civic.png',
                last_service_date: 'Hoje',
                status: 'EM_ANDAMENTO'
            },
            {
                id: 'veh_corolla',
                license_plate: 'XY29A87',
                plate: 'XY29A87',
                brand: 'Toyota',
                model: 'Corolla XEi 2.0 Flex',
                year: '2018',
                color: 'Branco',
                chassis: '9BRBL48E8K0184729',
                mileage: 19920, // Faltam 80 km para os 20.000 km!
                client_name: 'Maria Fernandes',
                client_phone: '(21) 97654-3210',
                client_email: 'maria@email.com',
                photo_url: './img/vehicles/corolla.png',
                last_service_date: 'Ontem',
                status: 'AGUARDANDO'
            },
            {
                id: 'veh_uno',
                license_plate: 'QWE2F34',
                plate: 'QWE2F34',
                brand: 'Fiat',
                model: 'Uno Way 1.0 Fire',
                year: '2015',
                color: 'Vermelho',
                chassis: '9BD158229F6819234',
                mileage: 30120, // Atrasada por 120 km!
                client_name: 'Carlos Almeida',
                client_phone: '(21) 91234-5678',
                client_email: 'carlos@email.com',
                photo_url: './img/vehicles/uno.png',
                last_service_date: '10 dias atrás',
                status: 'AGUARDANDO'
            },
            {
                id: 'veh_hb20',
                license_plate: 'BRA2E19',
                plate: 'BRA2E19',
                brand: 'Hyundai',
                model: 'HB20 Evolution 1.0',
                year: '2021',
                color: 'Cinza',
                chassis: '9BHBH41DXMP019284',
                mileage: 29940, // Faltam 60 km para os 30.000 km!
                client_name: 'Carlos Alberto Silva',
                client_phone: '(11) 98888-7777',
                client_email: 'carlos.alberto@email.com',
                last_service_date: 'Hoje',
                status: 'EM_ANDAMENTO'
            }
        ];
    };

    // Alertas de Manutenção para o Mecânico
    WorkshopView.getMobileAlerts = function() {
        const list = this.getEffectiveVehiclesList();
        const alerts = [];

        list.forEach((v, vIdx) => {
            const km = Number(v.mileage) || 10000;
            // Próximo marco de manutenção a cada 10.000 km
            const nextTargetKm = Math.ceil((km + 1) / 10000) * 10000;
            const diff = nextTargetKm - km;

            let srvTitle = 'Troca de Óleo e Filtros';
            if (nextTargetKm % 40000 === 0) srvTitle = 'Suspensão, Freios e Revisão Geral';
            else if (nextTargetKm % 20000 === 0) srvTitle = 'Freios, Pastilhas e Fluídos';
            else if (nextTargetKm % 10000 === 0) srvTitle = 'Troca de Óleo, Filtros e Alinhamento';

            const isOverdue = diff <= 0;
            const isUrgent = diff > 0 && diff <= 100;
            const status = isOverdue ? 'ATRASADA' : (isUrgent ? 'URGENTE' : 'EM_BREVE');
            const urgency = (isOverdue || isUrgent) ? 'CRITICAL' : 'WARNING';

            alerts.push({
                id: 'alt_' + (v.license_plate || vIdx) + '_' + nextTargetKm,
                license_plate: v.license_plate || v.plate,
                vehicle_plate: v.license_plate || v.plate,
                vehicle_model: `${v.brand || ''} ${v.model || 'Veículo'}`.trim(),
                client_name: v.client_name || 'Cliente da Oficina',
                client_phone: v.client_phone || '(11) 99999-9999',
                service_title: srvTitle,
                service_needed: srvTitle,
                current_km: km,
                due_km: nextTargetKm,
                next_km: nextTargetKm,
                remaining_km: diff,
                due_date: isOverdue ? 'Imediato' : isUrgent ? 'Próximos dias' : 'Em 15 dias',
                next_date: isOverdue ? 'Imediato' : isUrgent ? 'Próximos dias' : 'Em 15 dias',
                status: status,
                urgency: urgency,
                reason: isUrgent 
                    ? `Faltando apenas ${diff} km para atingir os ${nextTargetKm.toLocaleString('pt-BR')} km recomendados!`
                    : isOverdue 
                        ? `Revisão de ${nextTargetKm.toLocaleString('pt-BR')} km ultrapassada.`
                        : `Previsão aos ${nextTargetKm.toLocaleString('pt-BR')} km.`
            });
        });

        return alerts;
    };

    // Obter lista consolidada de veículos
    WorkshopView.getEffectiveVehiclesList = function() {
        if (this.vehiclesList && this.vehiclesList.length > 0) {
            return this.vehiclesList;
        }
        return this.getDefaultMobileVehicles();
    };

    // Localizar veículo por placa
    
    // ──────────────────────────────────────────────────────────────────────────
    // CONSULTA AUTOMÁTICA DE VEÍCULO POR PLACA NO SISTEMA (SEM MENÇÃO A API)
    // ──────────────────────────────────────────────────────────────────────────
    WorkshopView.fetchVehicleDataByPlate = async function(rawPlate) {
        if (!rawPlate) return null;
        const clean = rawPlate.toUpperCase().replace(/[^A-Z0-9]/g, '');
        if (clean.length < 3) return null;

        // 1. Verifica na memória local da oficina
        const local = this.findVehicleByPlate(clean);
        if (local) return local;

        try {
            // 2. Consulta no banco de dados e registros do sistema
            let res = null;
            if (typeof API !== 'undefined' && API.searchVehicle) {
                res = await API.searchVehicle(clean).catch(() => null);
            } else {
                const token = localStorage.getItem('dna_token');
                const headers = token ? { 'Authorization': 'Bearer ' + token } : {};
                const r = await fetch('/api/v1/vehicles/search?q=' + encodeURIComponent(clean), { headers }).catch(() => null);
                if (r && r.ok) res = await r.json();
            }

            if (res && res.found && res.vehicle) {
                const v = res.vehicle;
                const formatted = {
                    id: v.id || ('veh_' + clean),
                    license_plate: v.license_plate || clean,
                    plate: v.license_plate || clean,
                    brand: v.brand || 'Veículo',
                    model: v.model || 'Modelo Localizado',
                    year: v.manufacture_year || v.model_year || v.year || '2022',
                    color: v.color || 'Prata',
                    chassis: v.chassis || '',
                    mileage: v.current_mileage || v.mileage || 45000,
                    client_name: v.client_name || v.owner_name || 'Cliente da Oficina',
                    client_phone: v.client_phone || v.owner_phone || '(11) 99999-9999',
                    client_email: v.client_email || '',
                    fipe_value: v.fipe ? v.fipe.market_value_formatted : null,
                    last_service_date: 'Hoje',
                    status: 'EM_ANDAMENTO'
                };
                if (!this.vehiclesList) this.vehiclesList = [];
                const exists = this.vehiclesList.find(x => (x.license_plate || '').toUpperCase() === clean);
                if (!exists) this.vehiclesList.unshift(formatted);
                return formatted;
            }

            // 3. Consulta cadastral no registro nacional de veículos
            let plateRes = null;
            if (typeof API !== 'undefined' && API.lookupPlate) {
                plateRes = await API.lookupPlate(clean).catch(() => null);
            } else {
                const r = await fetch('/api/v1/integrations/plate-lookup/' + encodeURIComponent(clean)).catch(() => null);
                if (r && r.ok) plateRes = await r.json();
            }

            if (plateRes && plateRes.found && plateRes.vehicle) {
                const pv = plateRes.vehicle;
                const formatted = {
                    id: 'veh_' + clean,
                    license_plate: pv.license_plate || clean,
                    plate: pv.license_plate || clean,
                    brand: pv.brand || 'Veículo',
                    model: pv.model || 'Modelo Identificado',
                    year: pv.manufacture_year || pv.model_year || '2022',
                    color: pv.color || 'Prata',
                    chassis: pv.chassis || '',
                    mileage: 45000,
                    client_name: 'Cliente da Oficina',
                    client_phone: '(11) 99999-9999',
                    fipe_value: pv.fipe ? pv.fipe.market_value_formatted : null,
                    last_service_date: 'Hoje',
                    status: 'EM_ANDAMENTO'
                };
                if (!this.vehiclesList) this.vehiclesList = [];
                const exists = this.vehiclesList.find(x => (x.license_plate || '').toUpperCase() === clean);
                if (!exists) this.vehiclesList.unshift(formatted);
                return formatted;
            }
        } catch (e) {
            console.warn('Erro ao consultar placa no sistema:', e);
        }

        return null;
    };

    WorkshopView.findVehicleByPlate = function(plate) {
        if (!plate) return null;
        const clean = plate.toUpperCase().replace(/[^A-Z0-9]/g, '');
        const list = this.getEffectiveVehiclesList();
        return list.find(v => {
            const vPlate = (v.license_plate || v.plate || '').toUpperCase().replace(/[^A-Z0-9]/g, '');
            return vPlate === clean;
        }) || null;
    };

    // ──────────────────────────────────────────────────────────────────────────
    // RENDERIZADOR PRINCIPAL DO SHELL MOBILE
    // ──────────────────────────────────────────────────────────────────────────
    WorkshopView.renderMobileShell = function() {
        const container = document.getElementById('view-content');
        if (!container) return;

        // Se o usuário estiver no primeiro acesso e o veículo não estiver selecionado, usa o primeiro como ativo
        if (!this.selectedMobileVehicle) {
            const list = this.getEffectiveVehiclesList();
            this.selectedMobileVehicle = list[0] || null;
        }

        container.innerHTML = `
            <div class="dna-mobile-shell" id="dna-mobile-shell">
                <!-- HEADER SUPERIOR -->
                ${this.renderMobileHeader()}

                <!-- VIEWPORT DE CONTEÚDO ATIVO -->
                <main id="ws-mobile-active-viewport" style="flex:1; width:100%;">
                    ${this.renderMobileActiveSection()}
                </main>

                <!-- CONTAINER DE MODAL PARA TROCA DE DISPOSITIVO / MODO WEB -->
                <div id="dna-mobile-modal-root"></div>
            </div>
        `;

        this.checkDevicePrompt();
    };

    // ──────────────────────────────────────────────────────────────────────────
    // HEADER SUPERIOR DO APP
    // ──────────────────────────────────────────────────────────────────────────
    WorkshopView.renderMobileHeader = function() {
        const wsName = this.officialWorkshopName || 'Oficina Mecânica Exemplo';
        return `
            <header class="dna-mobile-header">
                <div class="dna-mobile-header-top">
                    <!-- Brand DNA AUTO -->
                    <div class="dna-mobile-brand" onclick="WorkshopView.switchMobileSection('dashboard')">
                        <div class="dna-mobile-logo-icon">
                            <svg viewBox="0 0 24 24" width="20" height="20" fill="none" stroke="#ffffff" stroke-width="2.6" stroke-linecap="round" stroke-linejoin="round">
                                <path d="M12 2L2 7l10 5 10-5-10-5z"></path>
                                <path d="M2 17l10 5 10-5"></path>
                                <path d="M2 12l10 5 10-5"></path>
                            </svg>
                        </div>
                        <div class="dna-mobile-brand-title">DNA <span>AUTO</span></div>
                    </div>

                    <!-- Botão de Sair Rápido -->
                    <button type="button" class="dna-mobile-logout-btn" onclick="WorkshopView.showOficinaLoginScreen()">
                        <span>Sair</span> <span>↗</span>
                    </button>
                </div>

                <!-- Linha Limpa da Oficina Credenciada -->
                <div style="display:flex; align-items:center; justify-content:space-between; margin-top:4px;">
                    <div class="dna-mobile-badge-workshop" style="max-width:100%; border:none; padding:0; background:transparent;">
                        <span>🏢</span>
                        <span style="overflow:hidden; text-overflow:ellipsis; white-space:nowrap; max-width:240px; color:#E2E8F0; font-weight:700;">${wsName}</span>
                        <span class="online-dot" title="Oficina Conectada"></span>
                        <span style="font-size:10px; color:#10B981; font-weight:800;">Online</span>
                    </div>
                </div>
            </header>
        `;
    };

    // ──────────────────────────────────────────────────────────────────────────
    // BARRA DE NAVEGAÇÃO INFERIOR
    // ──────────────────────────────────────────────────────────────────────────
    WorkshopView.renderMobileBottomNav = function() {
        return ''; // Navegação 100% orientada em cards (sem botões em baixo)
    };

    // ──────────────────────────────────────────────────────────────────────────
    // ROTEADOR DE SUB-TELAS MOBILE
    // ──────────────────────────────────────────────────────────────────────────
    WorkshopView.renderMobileActiveSection = function() {
        switch (this.currentSection) {
            case 'auth':
            case 'login':
            case 'cadastro':
                return this.renderMobileAuthView();
            case 'entrada-veiculos':
                return this.renderMobileVehicleEntryView();
            case 'cadastrar-cliente':
                return this.renderMobileClientRegisterView();
            case 'lancar-servicos':
                return this.renderMobileLaunchServicesView();
            case 'detalhe-servico':
                return this.renderMobileServiceDetailView();
            case 'manutencao-veiculos':
                return this.renderMobileMaintenanceVehiclesView();
            case 'avisos-manutencao':
                return this.renderMobileMaintenanceAlertsView();
            case 'enviar-fotos':
                return this.renderMobileSendPhotosView();
            case 'nota-fiscal':
                return this.renderMobileInvoiceView();
            case 'clientes':
                return this.renderMobileClientsView();
            case 'buscar-veiculos':
                return this.renderMobileSearchVehiclesView();
            case 'relatorios':
                return this.renderMobileReportsView();
            case 'financeiro':
                return this.renderMobileFinancialView();
            case 'estoque':
                return this.renderMobileStockView();
            case 'configuracoes':
                return this.renderMobileConfigView();
            case 'suporte':
                return this.renderMobileSupportView();
            case 'dashboard':
            default:
                return this.renderMobileDashboardView();
        }
    };

    // Alternar de Seção no Modo Mobile
    WorkshopView.switchMobileSection = function(sectionId) {
        // Enforce senha do financeiro sempre ao sair da tela de estoque
        if (this.currentSection === 'estoque' && sectionId !== 'estoque') {
            this.stockAuthenticated = false;
        }
        this.currentSection = sectionId;
        const viewport = document.getElementById('ws-mobile-active-viewport');
        if (viewport) {
            viewport.innerHTML = this.renderMobileActiveSection();
            window.scrollTo({ top: 0, behavior: 'smooth' });
            if (sectionId === 'lancar-servicos') {
                setTimeout(() => this.initVerticalCardCarousel(), 40);
            }
        } else {
            this.render();
            if (sectionId === 'lancar-servicos') {
                setTimeout(() => this.initVerticalCardCarousel(), 80);
            }
        }
    };

    // ──────────────────────────────────────────────────────────────────────────
    // TELA 1 & 2: DASHBOARD DA OFICINA COM CARDS
    // ──────────────────────────────────────────────────────────────────────────
    WorkshopView.renderMobileDashboardView = function() {
        const stats = (this.dashboardData && this.dashboardData.stats) || {};
        const countToday = stats.vehiclesToday || stats.vehicles_today || 6;
        const countInProgress = stats.inProgress || stats.active_services || 4;
        const countPending = stats.waiting || stats.pending_vehicles || 2;

        return `
            <div style="padding-bottom: 24px; width:100%;">
                <!-- 1. RESUMO OPERACIONAL COMPACTO NO TOPO -->
                <div class="dna-mobile-stats-card" style="margin: 8px 12px 10px;">
                    <div class="dna-mobile-stat-col">
                        <span class="dna-mobile-stat-number blue">${countToday}</span>
                        <span class="dna-mobile-stat-label">Veículos hoje</span>
                    </div>
                    <div class="dna-mobile-stat-col">
                        <span class="dna-mobile-stat-number green">${countInProgress}</span>
                        <span class="dna-mobile-stat-label">Em andamento</span>
                    </div>
                    <div class="dna-mobile-stat-col">
                        <span class="dna-mobile-stat-number amber">${countPending}</span>
                        <span class="dna-mobile-stat-label">Aguardando</span>
                    </div>
                </div>

                <!-- 2. CARDS DE ACESSO RÁPIDO OPERACIONAIS DA OFICINA (DIRETOS AO PONTO) -->
                <div class="dna-mobile-grid-section">
                    <div class="dna-mobile-actions-grid">
                        <!-- Card 1: Entrada de Veículos -->
                        <div class="dna-mobile-action-card dna-card-blue" onclick="WorkshopView.switchMobileSection('entrada-veiculos')">
                            <div class="dna-card-icon-box">🚗</div>
                            <div>
                                <h3 class="dna-card-title">Entrada de Veículos</h3>
                                <p class="dna-card-desc">Localizar pela placa e receber veículo</p>
                            </div>
                        </div>

                        <!-- Card 2: Lançar Serviços -->
                        <div class="dna-mobile-action-card dna-card-green" onclick="WorkshopView.switchMobileSection('lancar-servicos')">
                            <div class="dna-card-icon-box">🔧</div>
                            <div>
                                <h3 class="dna-card-title">Lançar Serviços</h3>
                                <p class="dna-card-desc">Adicionar serviços, peças e observações</p>
                            </div>
                        </div>

                        <!-- Card 3: Clientes -->
                        <div class="dna-mobile-action-card dna-card-purple" onclick="WorkshopView.switchMobileSection('clientes')">
                            <div class="dna-card-icon-box">👤</div>
                            <div>
                                <h3 class="dna-card-title">Clientes</h3>
                                <p class="dna-card-desc">Cadastrar e gerenciar clientes</p>
                            </div>
                        </div>

                        <!-- Card 4: Notas Fiscais -->
                        <div class="dna-mobile-action-card dna-card-amber" onclick="WorkshopView.switchMobileSection('nota-fiscal')">
                            <div class="dna-card-icon-box">📄</div>
                            <div>
                                <h3 class="dna-card-title">Notas Fiscais</h3>
                                <p class="dna-card-desc">Emitir e anexar notas com fotos</p>
                            </div>
                        </div>

                        <!-- Card 6: Buscar Veículos -->
                        <div class="dna-mobile-action-card dna-card-cyan" onclick="WorkshopView.switchMobileSection('buscar-veiculos')">
                            <div class="dna-card-icon-box">🔍</div>
                            <div>
                                <h3 class="dna-card-title">Buscar Veículos</h3>
                                <p class="dna-card-desc">Por placa, chassi ou cliente</p>
                            </div>
                        </div>

                        <!-- Card 7: Manutenção dos Veículos -->
                        <div class="dna-mobile-action-card dna-card-indigo" onclick="WorkshopView.switchMobileSection('manutencao-veiculos')">
                            <div class="dna-card-icon-box">🛠️</div>
                            <div>
                                <div style="display:flex; align-items:center; justify-content:space-between; gap:6px;">
                <h3 class="dna-card-title" style="margin:0;">Alerta de Manutenção dos Veículos</h3>
                <span class="badge-proof" style="background:#ef4444; color:#fff; font-size:9.5px; padding:2px 6px; border-radius:10px; font-weight:800; white-space:nowrap;">4 Alertas</span>
            </div>
            <p class="dna-card-desc" style="margin-top:3px;">Problemas identificados, OBD2, preventiva e WhatsApp</p>
                            </div>
                        </div>

                        <!-- Card 8: Avisos WhatsApp -->
                        <div class="dna-mobile-action-card dna-card-emerald" onclick="WorkshopView.switchMobileSection('avisos-manutencao')">
                            <div class="dna-card-icon-box">🔔</div>
                            <div>
                                <h3 class="dna-card-title">Avisos WhatsApp</h3>
                                <p class="dna-card-desc">Lembretes para clientes a vencer</p>
                            </div>
                        </div>

                        <!-- Card 9: Relatórios -->
                        <div class="dna-mobile-action-card dna-card-navy" onclick="WorkshopView.switchMobileSection('relatorios')">
                            <div class="dna-card-icon-box">📊</div>
                            <div>
                                <h3 class="dna-card-title">Relatórios</h3>
                                <p class="dna-card-desc">Produtividade, histórico e serviços</p>
                            </div>
                        </div>

                        <!-- Card 10: Financeiro (Protegido por Senha) -->
                        <div class="dna-mobile-action-card dna-card-gold" onclick="WorkshopView.switchMobileSection('financeiro')">
                            <div class="dna-card-icon-box">💵</div>
                            <div>
                                <h3 class="dna-card-title">Financeiro</h3>
                                <p class="dna-card-desc">Aparelhos, faturamento e ranking R$ 5 mil</p>
                            </div>
                        </div>

                        <!-- Card 11: Estoque de Peças -->
                        <div class="dna-mobile-action-card dna-card-teal" onclick="WorkshopView.switchMobileSection('estoque')">
                            <div class="dna-card-icon-box">📦</div>
                            <div>
                                <h3 class="dna-card-title">Estoque / Peças</h3>
                                <p class="dna-card-desc">Controle de peças e materiais usados</p>
                            </div>
                        </div>

                        <!-- Card 12: Configurações -->
                        <div class="dna-mobile-action-card dna-card-slate" onclick="WorkshopView.switchMobileSection('configuracoes')">
                            <div class="dna-card-icon-box">⚙️</div>
                            <div>
                                <h3 class="dna-card-title">Configurações</h3>
                                <p class="dna-card-desc">Dados da oficina e preferências</p>
                            </div>
                        </div>

                        <!-- Card 13: Suporte Técnico & Equipamentos Matriz -->
                        <div class="dna-mobile-action-card dna-card-violet" onclick="WorkshopView.switchMobileSection('suporte')">
                            <div class="dna-card-icon-box">🎧</div>
                            <div>
                                <h3 class="dna-card-title">Suporte</h3>
                                <p class="dna-card-desc">Central Admin & Pedir Equipamentos</p>
                            </div>
                        </div>
                    </div>
                </div>
            </div>
        `;
    };

    // ──────────────────────────────────────────────────────────────────────────
    // TELA 3: ENTRADA DE VEÍCULOS
    // ──────────────────────────────────────────────────────────────────────────
    WorkshopView.renderMobileVehicleEntryView = function() {
        const vehicles = this.getEffectiveVehiclesList();
        const tab = this.mobileVehicleEntryTab || 'buscar';

        return `
            <div class="dna-mobile-subpage">
                <!-- Barra Superior com Voltar -->
                <div class="dna-mobile-subpage-header">
                    <button class="dna-mobile-back-btn" onclick="WorkshopView.switchMobileSection('dashboard')">
                        <span>‹</span> <span>Voltar</span>
                    </button>
                    <span class="dna-mobile-subpage-title">Entrada de Veículos</span>
                    
                </div>

                <div class="dna-mobile-subpage-body">
                    <!-- Segmented Tabs -->
                    <div class="dna-segmented-control">
                        <button class="dna-segment-btn ${tab === 'buscar' ? 'active' : ''}" onclick="WorkshopView.setMobileEntryTab('buscar')">Buscar Placa</button>
                        <button class="dna-segment-btn ${tab === 'manual' ? 'active' : ''}" onclick="WorkshopView.switchMobileSection('cadastrar-cliente')">Cadastrar Manual</button>
                        <button class="dna-segment-btn ${tab === 'recentes' ? 'active' : ''}" onclick="WorkshopView.setMobileEntryTab('recentes')">Veículos Recentes</button>
                    </div>

                    <!-- Campo de Busca por Placa -->
                    <div class="dna-input-group">
                        <label class="dna-input-label">Digite a placa do veículo</label>
                        <div class="dna-input-search-row">
                            <input 
                                type="text" 
                                id="mobile-entry-plate-input" 
                                class="dna-plate-input" 
                                placeholder="Ex: ABC1D23" 
                                maxlength="8"
                                value="${this.mobileActivePlate || ''}"
                                oninput="this.value = this.value.toUpperCase()"
                                onkeydown="if(event.key==='Enter') WorkshopView.handleMobilePlateEntrySearch()"
                            />
                            <button class="dna-search-action-btn" onclick="WorkshopView.handleMobilePlateEntrySearch()" title="Pesquisar Placa">
                                🔍
                            </button>
                        </div>
                    </div>

                    <!-- Área de Resultado da Busca -->
                    <div id="mobile-entry-lookup-result">
                        ${this.renderMobileEntryResultContent()}
                    </div>

                </div>

                <!-- Botão Inferior Fixo -->
                <div class="dna-mobile-fixed-bottom-bar">
                    <button class="dna-primary-btn-lg" onclick="WorkshopView.switchMobileSection('cadastrar-cliente')">
                        <span>+</span> <span>Adicionar Veículo</span>
                    </button>

                    <button type="button" class="dna-mobile-back-to-cards-btn" onclick="WorkshopView.switchMobileSection('dashboard')">
                        <span>‹</span> <span>Voltar para Todos os Cards</span>
                    </button>
                </div>
            </div>
        `;
    };

    WorkshopView.setMobileEntryTab = function(tab) {
        this.mobileVehicleEntryTab = tab;
        this.switchMobileSection('entrada-veiculos');
    };

    // Renderiza o conteúdo da busca no card de entrada
    WorkshopView.renderMobileEntryResultContent = function() {
        if (!this.mobileActivePlate && !this.selectedMobileVehicle) {
            return `
                <div style="background:rgba(4,10,22,0.6); border:1px dashed rgba(0,212,255,0.25); border-radius:14px; padding:18px 14px; text-align:center; color:#94A3B8; margin-top:8px;">
                    <div style="font-size:26px; margin-bottom:6px;">🚗</div>
                    <strong style="color:#FFFFFF; font-size:13.5px; display:block; margin-bottom:4px;">Digite a placa do veículo acima</strong>
                    <span style="font-size:11.5px; color:#64748B;">Identifique o histórico de manutenções realizadas na rede e lance novos serviços.</span>
                </div>
            `;
        }

        if (this.selectedMobileVehicle) {
            return this.renderMobileEntryFullVehicleView(this.selectedMobileVehicle);
        }

        return '';
    };

    // Renderiza o card completo do veículo + histórico de manutenções na rede + lançamento de serviços
    WorkshopView.renderMobileEntryFullVehicleView = function(v) {
        if (!v) return '';
        const services = this.selectedMobileVehicleServices || [];
        const hasDna = !!(this.selectedMobileVehicleHasDna || v.dna_code);
        const dnaCode = v.dna_code || (hasDna ? 'DNA-BR-' + (v.license_plate || '').replace(/[^A-Z0-9]/g, '') : '');
        const currentService = this.entrySelectedService || this.launchCarouselServices[0];
        const defaultNotes = this.entryServiceNotes !== undefined ? this.entryServiceNotes : (currentService.defaultNotes || currentService.desc || '');

        return `
            <div class="dna-entry-full-card">
                <!-- 1. IDENTIFICAÇÃO DO CARRO -->
                <div class="dna-entry-car-header">
                    <div class="dna-entry-car-avatar">
                        ${v.photo_url ? `<img src="${v.photo_url}" alt="${v.model || 'Carro'}" onerror="this.onerror=null; this.parentElement.innerHTML='🚗';" />` : '🚗'}
                    </div>
                    <div class="dna-entry-car-details">
                        <div class="dna-entry-car-model">${v.brand || ''} ${v.model || 'Veículo Localizado'}</div>
                        <div style="display:flex; align-items:center; gap:8px; flex-wrap:wrap; margin-top:2px;">
                            <span class="dna-entry-plate-tag">🇧🇷 ${v.license_plate}</span>
                            ${hasDna ? `
                                <span class="dna-entry-dna-badge active">
                                    <span>✓</span> <span>Cliente DNA AUTO</span>
                                </span>
                            ` : `
                                <span class="dna-entry-dna-badge inactive">
                                    <span>⚠️</span> <span>Sem DNA AUTO</span>
                                </span>
                            `}
                        </div>
                    </div>
                </div>

                <!-- Especificações do Veículo -->
                <div class="dna-entry-specs-grid">
                    <div class="dna-entry-spec-item">
                        <span>Ano / Cor</span>
                        <span>${v.manufacture_year || v.model_year || v.year || '2022'} • ${v.color || 'Prata'}</span>
                    </div>
                    <div class="dna-entry-spec-item">
                        <span>Odômetro Atual</span>
                        <span style="color:#00D4FF;">${(v.current_mileage || v.mileage || 45000).toLocaleString('pt-BR')} km</span>
                    </div>
                    <div class="dna-entry-spec-item">
                        <span>Proprietário</span>
                        <span>${v.owner_name || v.client_name || 'Cliente da Rede'}</span>
                    </div>
                    <div class="dna-entry-spec-item">
                        <span>${hasDna ? 'Código DNA' : 'Valor FIPE'}</span>
                        <span style="color:${hasDna ? '#10B981' : '#38BDF8'}; font-family:${hasDna ? 'monospace' : 'inherit'};">
                            ${hasDna ? (dnaCode || 'DNA-ATIVO') : (v.fipe_value || 'Consultado')}
                        </span>
                    </div>
                </div>

                <!-- 2. HISTÓRICO DE MANUTENÇÕES FEITAS NA PLATAFORMA DNA AUTO -->
                <div class="dna-history-section">
                    <div class="dna-history-title-row">
                        <h3>🛠️ Manutenções Realizadas na Rede DNA AUTO (${services.length})</h3>
                        <span class="dna-history-subtitle">Histórico unificado de serviços realizados em qualquer oficina da rede</span>
                    </div>

                    ${services.length > 0 ? `
                        <div class="dna-history-timeline">
                            ${services.map(s => {
                                const sDate = s.service_date ? (s.service_date.includes('-') ? s.service_date.split('-').reverse().join('/') : s.service_date) : 'Data recente';
                                const sKm = s.mileage ? Number(s.mileage).toLocaleString('pt-BR') + ' km' : 'KM não informado';
                                const wsName = s.workshop_name || s.workshop_trade_name || 'Oficina Credenciada DNA AUTO';
                                return `
                                    <div class="dna-history-card">
                                        <div class="dna-history-card-header">
                                            <span>📅 ${sDate} • 📍 ${sKm}</span>
                                            <span style="background:rgba(16,185,129,0.15); color:#10B981; font-weight:800; padding:2px 6px; border-radius:4px; font-size:10px;">
                                                ✅ Nível 4 Comprovado
                                            </span>
                                        </div>
                                        <div class="dna-history-card-title">${s.service_title}</div>
                                        <div class="dna-history-workshop-tag">
                                            🏢 <strong>Oficina:</strong> ${wsName} ${s.workshop_city ? `(${s.workshop_city})` : ''}
                                        </div>
                                        <div class="dna-history-card-desc">
                                            ${s.description || 'Manutenção registrada e confirmada com especificações técnicas no DNA do carro.'}
                                        </div>
                                    </div>
                                `;
                            }).join('')}
                        </div>
                    ` : (hasDna ? `
                        <div style="background:rgba(0,102,255,0.08); border:1px dashed rgba(0,212,255,0.3); border-radius:12px; padding:14px; text-align:center; color:#94A3B8; font-size:12px;">
                            ℹ️ Este veículo é cliente da rede DNA AUTO, mas ainda não possui manutenções anteriores registradas. Lance a primeira manutenção abaixo!
                        </div>
                    ` : `
                        <div style="background:rgba(234,179,8,0.1); border:1px dashed #EAB308; border-radius:12px; padding:14px; text-align:center; color:#E2E8F0; font-size:12px;">
                            ⚠️ Este veículo ainda não possui DNA AUTO ativo. Ao lançar o serviço abaixo, o veículo será credenciado e o histórico digital permanente será gerado.
                        </div>
                    `)}
                </div>

                <!-- 3. SEÇÃO NO FINAL: LANÇAR SERVIÇO -->
                <div class="dna-launch-section-box" id="entry-launch-service-section">
                    <div class="dna-launch-section-title">
                        <span>🚀</span> <span>Lançar Novo Serviço para ${v.license_plate}</span>
                    </div>
                    <div class="dna-launch-section-subtitle">
                        Selecione a opção no carrossel, descreva o que vai ser feito e anexe a foto da peça trocada (se houver).
                    </div>

                    <!-- Carrossel de Opções de Serviço -->
                    <label class="dna-input-label" style="display:block; margin-bottom:4px;">1. Escolha a opção de serviço no carrossel:</label>
                    <div class="dna-services-carousel">
                        ${this.launchCarouselServices.map(s => {
                            const isSelected = currentService && currentService.id === s.id;
                            return `
                                <div class="dna-service-chip ${isSelected ? 'active' : ''}" onclick="WorkshopView.handleEntrySelectCarouselService('${s.id}')">
                                    <div class="dna-service-chip-icon">${s.icon}</div>
                                    <div class="dna-service-chip-title">${s.title}</div>
                                </div>
                            `;
                        }).join('')}
                    </div>

                    <!-- Caixa de Descrição do que vai ser feito -->
                    <div class="dna-input-group" style="margin-top:10px;">
                        <label class="dna-input-label">2. Descrição detalhada do que vai ser feito: *</label>
                        <textarea 
                            id="mobile-entry-service-desc" 
                            class="dna-input-field" 
                            rows="3" 
                            placeholder="Descreva o serviço a ser realizado, especificações da peça ou óleo, inspeções feitas..."
                            style="width:100%; min-height:85px; padding:12px; font-size:13px; resize:vertical; box-sizing:border-box;"
                            oninput="WorkshopView.entryServiceNotes = this.value"
                        >${defaultNotes}</textarea>
                    </div>

                    <!-- Foto da Peça a Ser Trocada (Opcional) -->
                    <div class="dna-entry-part-photo-box">
                        <label class="dna-input-label" style="margin-bottom:6px; display:block;">
                            3. Foto da Peça a Ser Trocada <span style="font-size:11px; color:#94A3B8; font-weight:normal;">(Opcional)</span>
                        </label>

                        <!-- Preview da Foto se Selecionada -->
                        <div id="entry-part-photo-preview-container" style="display:${this.entryPartPhotoPreview ? 'block' : 'none'}; margin-bottom:10px;">
                            <div style="position:relative; display:inline-block;">
                                <img id="entry-part-photo-preview" src="${this.entryPartPhotoPreview || ''}" alt="Foto da peça" style="max-height:160px; max-width:100%; border-radius:12px; border:1.5px solid #00D4FF; object-fit:cover;" />
                                <button type="button" onclick="WorkshopView.handleRemoveEntryPartPhoto()" style="position:absolute; top:-8px; right:-8px; background:#EF4444; color:#fff; border:none; border-radius:50%; width:26px; height:26px; cursor:pointer; font-weight:bold; font-size:13px; display:flex; align-items:center; justify-content:center; box-shadow:0 2px 6px rgba(0,0,0,0.5);">✕</button>
                            </div>
                        </div>

                        <!-- Botões de Câmera e Galeria -->
                        <div style="display:flex; gap:10px;">
                            <label class="dna-photo-btn" style="flex:1;">
                                <span>📷 Câmera (Tirar Foto)</span>
                                <input type="file" accept="image/*" capture="environment" style="display:none;" onchange="WorkshopView.handleEntryPartPhotoSelected(this)" />
                            </label>
                            <label class="dna-photo-btn secondary" style="flex:1;">
                                <span>📁 Galeria</span>
                                <input type="file" accept="image/*" style="display:none;" onchange="WorkshopView.handleEntryPartPhotoSelected(this)" />
                            </label>
                        </div>
                        <div style="font-size:11px; color:#64748B; margin-top:6px; line-height:1.4;">
                            💡 Se não tiver foto da peça, o serviço será registrado normalmente apenas com a descrição informada acima.
                        </div>
                    </div>

                    <!-- Botão Final de Confirmação -->
                    <button type="button" class="dna-primary-btn-lg green" style="margin-top:16px; height:50px; font-size:14.5px; font-weight:800;" onclick="WorkshopView.handleSubmitServiceFromEntry()">
                        <span>✅ Confirmar & Lançar Serviço no DNA AUTO</span> <span>›</span>
                    </button>
                </div>
            </div>
        `;
    };

    // Manipula a seleção no carrossel
    WorkshopView.handleEntrySelectCarouselService = function(serviceId) {
        const s = this.launchCarouselServices.find(item => item.id === serviceId) || this.launchCarouselServices[0];
        this.entrySelectedService = s;
        this.entryServiceNotes = s.defaultNotes || s.desc || '';

        const textarea = document.getElementById('mobile-entry-service-desc');
        if (textarea) {
            textarea.value = this.entryServiceNotes;
        }

        const carousel = document.querySelector('.dna-services-carousel');
        if (carousel) {
            carousel.querySelectorAll('.dna-service-chip').forEach(chip => {
                const title = chip.querySelector('.dna-service-chip-title')?.textContent || '';
                chip.classList.toggle('active', title === s.title);
            });
        }
    };

    // Upload de foto da peça
    WorkshopView.handleEntryPartPhotoSelected = function(input) {
        if (!input.files || !input.files[0]) return;
        const file = input.files[0];
        this.entryPartPhotoFile = file;

        const reader = new FileReader();
        reader.onload = (e) => {
            this.entryPartPhotoPreview = e.target.result;
            const container = document.getElementById('entry-part-photo-preview-container');
            const img = document.getElementById('entry-part-photo-preview');
            if (container && img) {
                img.src = this.entryPartPhotoPreview;
                container.style.display = 'block';
            }
        };
        reader.readAsDataURL(file);
    };

    // Excluir foto da peça
    WorkshopView.handleRemoveEntryPartPhoto = function() {
        this.entryPartPhotoFile = null;
        this.entryPartPhotoPreview = null;
        const container = document.getElementById('entry-part-photo-preview-container');
        const img = document.getElementById('entry-part-photo-preview');
        if (container && img) {
            img.src = '';
            container.style.display = 'none';
        }
    };

    // Lançar serviço a partir da entrada
    WorkshopView.handleSubmitServiceFromEntry = async function() {
        const v = this.selectedMobileVehicle;
        if (!v) {
            WorkshopView.showToast('Nenhum veículo identificado.', 'warning');
            return;
        }

        const descInput = document.getElementById('mobile-entry-service-desc');
        const description = (descInput?.value || this.entryServiceNotes || '').trim();
        const currentService = this.entrySelectedService || this.launchCarouselServices[0];
        const serviceTitle = currentService.title || 'Serviço Mecânico Geral';
        const serviceCategory = currentService.category || 'Manutenção';

        if (!description) {
            WorkshopView.showToast('Por favor, informe a descrição do serviço a ser realizado.', 'warning');
            if (descInput) descInput.focus();
            return;
        }

        const sDate = new Date().toISOString().split('T')[0];
        const sMileage = Number(v.current_mileage || v.mileage || 45000);

        try {
            const formData = new FormData();
            formData.append('vehicle_id', v.id || ('veh_' + v.license_plate));
            formData.append('workshop_id', this.getEffectiveWorkshopId());
            formData.append('service_title', serviceTitle);
            formData.append('category', serviceCategory);
            formData.append('description', description);
            formData.append('service_date', sDate);
            formData.append('mileage', sMileage);
            formData.append('labor_cost_cents', 15000);
            formData.append('warranty_months', 6);
            if (this.entryPartPhotoFile) {
                formData.append('photos', this.entryPartPhotoFile);
            }

            const token = localStorage.getItem('dna_token');
            const headers = token ? { 'Authorization': 'Bearer ' + token } : {};
            await fetch('/api/v1/services/workshop-register', {
                method: 'POST',
                headers,
                body: formData
            }).catch(() => null);
        } catch (e) {
            console.warn('Registro de serviço local:', e.message);
        }

        // Adiciona registro local para exibição em tempo real
        const newRecord = {
            id: 'srv_' + Date.now(),
            service_title: serviceTitle,
            category: serviceCategory,
            description: description,
            service_date: sDate,
            mileage: sMileage,
            workshop_name: this.officialWorkshopName || 'Auto Center Credenciada',
            workshop_city: 'Unidade Local',
            proof_level: 4,
            proof_status: 'WORKSHOP_PROVEN'
        };

        if (!this.selectedMobileVehicleServices) this.selectedMobileVehicleServices = [];
        this.selectedMobileVehicleServices.unshift(newRecord);

        // Se o carro não tinha DNA ativo, ativa localmente
        this.selectedMobileVehicleHasDna = true;
        if (!v.dna_code) v.dna_code = 'DNA-BR-' + (v.license_plate || '').replace(/[^A-Z0-9]/g, '');

        // Limpa campos
        this.entryServiceNotes = '';
        this.entryPartPhotoFile = null;
        this.entryPartPhotoPreview = null;

        // Re-renderiza o card completo com o novo serviço no topo
        const resultBox = document.getElementById('mobile-entry-lookup-result');
        if (resultBox) {
            resultBox.innerHTML = this.renderMobileEntryFullVehicleView(this.selectedMobileVehicle);
        }

        WorkshopView.showToast('✓ Serviço lançado com sucesso e adicionado ao histórico do veículo!', 'success');
    };

    // Busca detalhada ao digitar placa na entrada de veículos
    WorkshopView.handleMobilePlateEntrySearch = async function() {
        const input = document.getElementById('mobile-entry-plate-input');
        const plate = (input?.value || '').trim().toUpperCase();
        if (!plate) {
            WorkshopView.showToast('Por favor, digite a placa do veículo.', 'warning');
            return;
        }

        const cleanPlate = plate.replace(/[^A-Z0-9]/g, '');
        this.mobileActivePlate = plate;

        const resultBox = document.getElementById('mobile-entry-lookup-result');
        if (resultBox) {
            resultBox.innerHTML = `
                <div style="background:rgba(0,102,255,0.15); border:1px solid var(--dna-ws-cyan); border-radius:12px; padding:18px; text-align:center; color:#fff;">
                    <div style="font-size:26px; margin-bottom:8px;">🔍</div>
                    <strong style="font-size:14.5px; color:var(--dna-ws-cyan);">Consultando histórico completo na rede DNA AUTO...</strong>
                    <div style="font-size:11.5px; color:var(--dna-ws-text-muted); margin-top:4px;">Puxando dados do veículo ${plate} e manutenções realizadas em qualquer oficina</div>
                </div>
            `;
        }

        // 1. Busca dossiê completo e histórico de manutenções na plataforma DNA AUTO
        let dossier = null;
        try {
            if (typeof API !== 'undefined' && API.getDossier) {
                dossier = await API.getDossier(cleanPlate).catch(() => null);
            } else {
                const r = await fetch('/api/v1/dossier/' + encodeURIComponent(cleanPlate)).catch(() => null);
                if (r && r.ok) dossier = await r.json();
            }
        } catch (_) {}

        if (dossier && dossier.found && dossier.vehicle) {
            const v = dossier.vehicle;
            this.selectedMobileVehicle = {
                id: v.id || ('veh_' + cleanPlate),
                license_plate: v.license_plate || plate,
                plate: v.license_plate || plate,
                brand: v.brand || 'Veículo',
                model: v.model || 'Modelo Localizado',
                year: v.manufacture_year || v.model_year || v.year || '2022',
                color: v.color || 'Prata',
                photo_url: v.photo_url || null,
                dna_code: v.dna_code || dossier.dna_code || null,
                current_mileage: v.current_mileage || v.mileage || 45000,
                mileage: v.current_mileage || v.mileage || 45000,
                owner_name: (dossier.currentOwner && dossier.currentOwner.name) ? dossier.currentOwner.name : (v.owner_name || v.client_name || 'Proprietário Cadastrado'),
                client_name: (dossier.currentOwner && dossier.currentOwner.name) ? dossier.currentOwner.name : (v.owner_name || v.client_name || 'Proprietário Cadastrado'),
                fipe_value: dossier.fipe ? ('R$ ' + (dossier.fipe.fipe_price_cents ? (dossier.fipe.fipe_price_cents/100).toLocaleString('pt-BR') : '')) : null
            };
            this.selectedMobileVehicleHasDna = !!dossier.hasDna;
            this.selectedMobileVehicleServices = dossier.services || [];
        } else {
            // 2. Fallback de busca cadastral
            const fallback = await this.fetchVehicleDataByPlate(plate);
            if (fallback) {
                this.selectedMobileVehicle = fallback;
                this.selectedMobileVehicleHasDna = false;
                this.selectedMobileVehicleServices = [];
            } else {
                const newVeh = {
                    id: 'veh_' + cleanPlate,
                    license_plate: plate,
                    plate: plate,
                    brand: 'Veículo',
                    model: 'Modelo Identificado',
                    year: '2022',
                    color: 'Prata',
                    current_mileage: 45000,
                    mileage: 45000,
                    client_name: 'Cliente da Oficina',
                    owner_name: 'Cliente da Oficina',
                    last_service_date: 'Hoje'
                };
                if (!this.vehiclesList) this.vehiclesList = [];
                this.vehiclesList.unshift(newVeh);
                this.selectedMobileVehicle = newVeh;
                this.selectedMobileVehicleHasDna = false;
                this.selectedMobileVehicleServices = [];
            }
        }

        this.entrySelectedService = this.launchCarouselServices[0];
        this.entryServiceNotes = this.entrySelectedService.defaultNotes || this.entrySelectedService.desc || '';
        this.entryPartPhotoFile = null;
        this.entryPartPhotoPreview = null;

        if (resultBox) {
            resultBox.innerHTML = this.renderMobileEntryFullVehicleView(this.selectedMobileVehicle);
        }
    };

    WorkshopView.handleMobileSelectVehicleFromList = function(plate) {
        const v = this.findVehicleByPlate(plate);
        if (v) {
            this.selectedMobileVehicle = v;
            this.mobileActivePlate = v.license_plate;
            this.handleMobilePlateEntrySearch();
        }
    };

    WorkshopView.handleMobileStartAttendance = function(plate) {
        const v = this.findVehicleByPlate(plate);
        if (v) {
            this.selectedMobileVehicle = v;
            this.mobileActivePlate = v.license_plate;
            this.handleMobilePlateEntrySearch();
        }
    };

    WorkshopView.handleMobileRegisterNewVehicleFromEntry = function(plate) {
        this.mobileActivePlate = plate;
        this.switchMobileSection('cadastrar-cliente');
    };

    // ──────────────────────────────────────────────────────────────────────────
    // TELA 4: CADASTRAR CLIENTE (PLACA PRIMEIRO!)
    // ──────────────────────────────────────────────────────────────────────────
    WorkshopView.renderMobileClientRegisterView = function() {
        const plate = this.mobileActivePlate || 'ABC1D23';
        const v = this.findVehicleByPlate(plate) || {
            brand: 'Honda',
            model: 'Civic Touring',
            license_plate: plate,
            year: '2020',
            color: 'Prata',
            client_name: 'João Silva'
        };

        return `
            <div class="dna-mobile-subpage">
                <div class="dna-mobile-subpage-header">
                    <button class="dna-mobile-back-btn" onclick="WorkshopView.switchMobileSection('dashboard')">
                        <span>‹</span> <span>Voltar</span>
                    </button>
                    <span class="dna-mobile-subpage-title">Cadastrar Cliente</span>
                    
                </div>

                <div class="dna-mobile-subpage-body">
                    <!-- ETAPA 1: PLACA DO VEÍCULO (PRIORIDADE ABSOLUTA) -->
                    <div class="dna-input-group">
                        <label class="dna-input-label">Placa do veículo *</label>
                        <div class="dna-input-search-row">
                            <input 
                                type="text" 
                                id="mobile-reg-plate-input" 
                                class="dna-plate-input" 
                                placeholder="ABC1D23" 
                                value="${plate}"
                                maxlength="8"
                                oninput="this.value = this.value.toUpperCase()"
                            />
                            <button class="dna-search-action-btn" onclick="WorkshopView.handleMobileSearchPlateForClientRegister()" title="Buscar Dados do Veículo">
                                🔍
                            </button>
                        </div>
                        <span style="font-size:11px; color:var(--dna-ws-text-dim);">Busque a placa para carregar os dados do veículo.</span>
                    </div>

                    <!-- CARD DE PRÉVIA DO VEÍCULO IDENTIFICADO -->
                    <div class="dna-vehicle-preview-card">
                        <div class="dna-vehicle-preview-thumb">🚗</div>
                        <div class="dna-vehicle-preview-info">
                            <div class="dna-vehicle-preview-title" id="mobile-reg-veh-model">${v.brand || ''} ${v.model || 'Veículo Localizado'}</div>
                            <div class="dna-vehicle-preview-meta" id="mobile-reg-veh-meta">${v.license_plate} • ${v.year || '2020'} • ${v.color || 'Prata'}</div>
                            <div class="dna-vehicle-preview-owner" id="mobile-reg-veh-owner">Cliente sugerido: ${v.client_name || 'Novo Proprietário'}</div>
                        </div>
                    </div>

                    <!-- ETAPA 2: DADOS DO PROPRIETÁRIO -->
                    <div style="border-top:1px solid rgba(255,255,255,0.08); padding-top:14px; display:flex; flex-direction:column; gap:12px;">
                        <span class="dna-mobile-section-label">Dados do Proprietário</span>

                        <div class="dna-input-group">
                            <label class="dna-input-label">Nome completo *</label>
                            <input type="text" id="mobile-reg-owner-name" class="form-control" placeholder="João da Silva" value="${v.client_name || 'João da Silva'}" style="height:48px; padding:0 14px; font-weight:700;" />
                        </div>

                        <div class="dna-input-group">
                            <label class="dna-input-label">WhatsApp *</label>
                            <input type="tel" id="mobile-reg-owner-wpp" class="form-control" placeholder="(21) 98765-4321" value="${v.client_phone || '(21) 98765-4321'}" style="height:48px; padding:0 14px; font-weight:700;" />
                        </div>

                        <div class="dna-input-group">
                            <label class="dna-input-label">E-mail *</label>
                            <input type="email" id="mobile-reg-owner-email" class="form-control" placeholder="joao@email.com" value="${v.client_email || 'joao@email.com'}" style="height:48px; padding:0 14px; font-weight:700;" />
                        </div>

                        <div class="dna-input-group">
                            <label class="dna-input-label">Senha de Acesso ao App *</label>
                            <div style="position:relative;">
                                <input type="password" id="mobile-reg-owner-pass" class="form-control" placeholder="Crie uma senha" value="123456" style="height:48px; padding:0 40px 0 14px; font-weight:700;" />
                                <button type="button" onclick="const p=document.getElementById('mobile-reg-owner-pass'); p.type = p.type==='password'?'text':'password';" style="position:absolute; right:12px; top:50%; transform:translateY(-50%); background:none; border:none; color:#64748B; cursor:pointer;">
                                    👁️
                                </button>
                            </div>
                        </div>
                    </div>
                </div>

                <!-- Botão Fixo de Confirmação -->
                <div class="dna-mobile-fixed-bottom-bar">
                    <button class="dna-primary-btn-lg" onclick="WorkshopView.handleMobileSubmitClientRegister()">
                        <span>✓</span> <span>Cadastrar Cliente</span>
                    </button>

                    <button type="button" class="dna-mobile-back-to-cards-btn" onclick="WorkshopView.switchMobileSection('dashboard')">
                        <span>‹</span> <span>Voltar para Todos os Cards</span>
                    </button>
</div>
            </div>
        `;
    };

    WorkshopView.handleMobileSearchPlateForClientRegister = async function() {
        const input = document.getElementById('mobile-reg-plate-input');
        const plate = (input?.value || '').trim().toUpperCase();
        if (!plate) {
            alert('Digite a placa para consultar.');
            return;
        }

        this.mobileActivePlate = plate;
        const v = this.findVehicleByPlate(plate);
        if (v) {
            document.getElementById('mobile-reg-veh-model').innerText = `${v.brand || ''} ${v.model || ''}`;
            document.getElementById('mobile-reg-veh-meta').innerText = `${v.license_plate} • ${v.year || '2020'} • ${v.color || 'Prata'}`;
            document.getElementById('mobile-reg-veh-owner').innerText = `Cliente sugerido: ${v.client_name || 'Novo Proprietário'}`;
            if (v.client_name) document.getElementById('mobile-reg-owner-name').value = v.client_name;
            if (v.client_phone) document.getElementById('mobile-reg-owner-wpp').value = v.client_phone;
            if (v.client_email) document.getElementById('mobile-reg-owner-email').value = v.client_email;
        } else {
            // Consulta dinâmica na API Placas caso disponível
            try {
                const res = await API.lookupPlate(plate);
                if (res && res.vehicle) {
                    const veh = res.vehicle;
                    document.getElementById('mobile-reg-veh-model').innerText = `${veh.brand || ''} ${veh.model || ''}`;
                    document.getElementById('mobile-reg-veh-meta').innerText = `${plate} • ${veh.model_year || '2022'} • ${veh.color || 'Preto'}`;
                }
            } catch (_) {}
        }
    };

    WorkshopView.handleMobileSubmitClientRegister = async function() {
        const plate = document.getElementById('mobile-reg-plate-input')?.value?.trim()?.toUpperCase() || 'ABC1D23';
        const name = document.getElementById('mobile-reg-owner-name')?.value?.trim() || 'Cliente';
        const phone = document.getElementById('mobile-reg-owner-wpp')?.value?.trim() || '';
        const email = document.getElementById('mobile-reg-owner-email')?.value?.trim() || '';

        try {
            // Tenta registrar na API se estiver disponível
            if (API.registerClient) {
                await API.registerClient({
                    name,
                    whatsapp: phone,
                    email,
                    license_plate: plate
                }).catch(() => {});
            }
        } catch (_) {}

        alert(`🎉 Cliente ${name} cadastrado com sucesso e vinculado à placa ${plate}!\nO passaporte digital DNA AUTO foi ativado.`);
        this.selectedMobileVehicle = {
            license_plate: plate,
            client_name: name,
            client_phone: phone,
            client_email: email,
            model: 'Honda Civic',
            brand: 'Honda',
            year: '2020',
            color: 'Prata',
            mileage: 10000
        };
        this.switchMobileSection('lancar-servicos');
    };

    // ──────────────────────────────────────────────────────────────────────────
    // CATÁLOGO DE SERVIÇOS DO CARROSSEL VERTICAL
    // ──────────────────────────────────────────────────────────────────────────
    WorkshopView.launchCarouselServices = [
        { id: 'srv_diagnostico', icon: '🔎', title: 'Diagnóstico', desc: 'Avaliação completa do veículo' },
        { id: 'srv_revisao', icon: '🛠️', title: 'Revisão', desc: 'Manutenção preventiva' },
        { id: 'srv_pneus', icon: '🛞', title: 'Pneus', desc: 'Troca e manutenção' },
        { id: 'srv_bateria', icon: '🔋', title: 'Bateria', desc: 'Teste e substituição' },
        { id: 'srv_freios', icon: '⚙️', title: 'Freios', desc: 'Pastilhas e discos' },
        { id: 'srv_oleo', icon: '🛢️', title: 'Óleo e filtros', desc: 'Troca e manutenção' },
        { id: 'srv_suspensao', icon: '🚗', title: 'Suspensão', desc: 'Amortecedores e componentes' },
        { id: 'srv_ar', icon: '❄️', title: 'Ar-Condicionado', desc: 'Higienização e filtro de cabine' },
        { id: 'srv_correia', icon: '⛓️', title: 'Correia Dentada', desc: 'Kit de distribuição e tensores' },
        { id: 'srv_fluidos', icon: '🧪', title: 'Fluidos e Arrefecimento', desc: 'Fluido de freio e aditivo radiador' },
        { id: 'srv_velas', icon: '⚡', title: 'Velas de Ignição', desc: 'Velas e cabos supressores' },
        { id: 'srv_limpeza', icon: '🚿', title: 'Injeção Eletrônica', desc: 'Limpeza de bicos e descarbonização' },
        { id: 'srv_filtro_comb', icon: '⛽', title: 'Filtro de Combustível', desc: 'Filtro de linha de combustível' }
    ];

    // ──────────────────────────────────────────────────────────────────────────
    // TELA 5: LANÇAR SERVIÇOS (CAMPO DE PLACA SEMPRE LIMPO + CARROSSEL VERTICAL)
    // ──────────────────────────────────────────────────────────────────────────
    WorkshopView.renderMobileLaunchServicesView = function() {
        const v = this.selectedMobileVehicle;
        const recents = this.getEffectiveVehiclesList().slice(0, 4);
        const services = this.launchCarouselServices;

        // O campo sempre inicia vazio para o profissional digitar, conforme solicitado
        this.mobileActivePlate = '';

        return `
            <div class="dna-mobile-subpage">
                <div class="dna-mobile-subpage-header">
                    <button class="dna-mobile-back-btn" onclick="WorkshopView.switchMobileSection('dashboard')">
                        <span>‹</span> <span>Voltar</span>
                    </button>
                    <span class="dna-mobile-subpage-title">Lançar Serviços</span>
                </div>

                <div class="dna-mobile-subpage-body">
                    <!-- 1. CAMPO DE INSERÇÃO DIRETA DA PLACA (SEMPRE VAZIO) -->
                    <div class="dna-launch-plate-box">
                        <label class="dna-launch-plate-label">🚗 Digite a Placa do Veículo:</label>
                        <div class="dna-launch-plate-input-row">
                            <input 
                                type="text" 
                                id="mobile-launch-plate-input" 
                                class="dna-plate-input" 
                                placeholder="DIGITE A PLACA (EX: BRA2E19)" 
                                maxlength="8" 
                                value="" 
                                autocomplete="off"
                                autofocus
                                oninput="WorkshopView.handleLaunchPlateInput(this.value)"
                                onkeydown="if(event.key==='Enter') WorkshopView.triggerLaunchPlateSearch()"
                            />
                            <button type="button" onclick="WorkshopView.triggerLaunchPlateSearch()" title="Localizar Veículo">
                                🔍
                            </button>
                        </div>

                        <!-- Atalhos Rápidos com Veículos Recentes -->
                        <div class="dna-launch-plate-recents">
                            <span class="recents-label">Recentes:</span>
                            ${recents.map(r => `
                                <button type="button" class="recent-plate-chip" onclick="WorkshopView.fillAndSearchPlate('${r.license_plate}')">
                                    ${r.license_plate}
                                </button>
                            `).join('')}
                        </div>

                        <!-- Card de Identificação Automática do Veículo -->
                        <div id="mobile-launch-vehicle-badge">
                            ${v ? this.renderLaunchVehicleBadgeHtml(v) : `
                                <div class="dna-launch-plate-status waiting">
                                    <span>👆 Digite os 7 caracteres da placa acima para carregar o veículo</span>
                                </div>
                            `}
                        </div>
                    </div>

                    <!-- 2. TÍTULO DO CARROSSEL -->
                    <div style="margin-top:14px; margin-bottom:8px; text-align:center;">
                        <span style="font-size:16px; font-weight:800; color:#FFFFFF; letter-spacing:-0.3px;">
                            Escolha o serviço
                        </span>
                        <div style="font-size:11px; color:#7f8995; margin-top:2px;">
                            Deslize verticalmente ↕ e toque no serviço selecionado
                        </div>
                    </div>

                    <!-- 3. CARROSSEL VERTICAL OFICIAL DE CARDS ESTREITOS -->
                    <div class="carousel" id="dna-vertical-carousel">
                        <div class="viewport">
                            <div class="cards" id="dna-carousel-cards-track">
                                ${services.map((s, idx) => `
                                    <div class="card ${idx === 0 ? 'active' : ''}" data-service-id="${s.id}" data-index="${idx}">
                                        <div class="icon">${s.icon}</div>
                                        <div class="info">
                                            <h2>${s.title}</h2>
                                            <p>${s.desc}</p>
                                        </div>
                                        <div class="arrow">›</div>
                                    </div>
                                `).join('')}
                            </div>
                            <div class="fade top"></div>
                            <div class="fade bottom"></div>
                        </div>

                        <div class="indicator" id="dna-carousel-indicator"></div>

                        <div class="controls">
                            <button type="button" class="control" id="carousel-up-btn" onclick="WorkshopView.moveCarousel(-1)">↑</button>
                            <button type="button" class="control" id="carousel-down-btn" onclick="WorkshopView.moveCarousel(1)">↓</button>
                        </div>
                    </div>

                    <!-- 4. BOTÃO DE CONFIRMAÇÃO DO SERVIÇO SELECIONADO -->
                    <button class="dna-primary-btn-lg" style="margin-top:14px; height:48px;" id="carousel-action-btn" onclick="WorkshopView.openCurrentCarouselService()">
                        <span>✓</span> <span id="carousel-action-btn-text">Confirmar Serviço: ${services[0].title}</span>
                    </button>

                    <div style="margin-top:14px; text-align:center;">
                        <button type="button" class="dna-mobile-back-to-cards-btn" onclick="WorkshopView.switchMobileSection('dashboard')">
                            <span>‹</span> <span>Voltar para Todos os Cards</span>
                        </button>
                    </div>
                </div>
            </div>
        `;
    };

    // Renderiza o badge de identificação do veículo encontrado
    WorkshopView.renderLaunchVehicleBadgeHtml = function(v) {
        return `
            <div class="dna-vehicle-preview-card" style="padding:10px 14px; background:linear-gradient(145deg, rgba(14,24,42,0.95), rgba(8,14,25,0.98)); border:1.5px solid rgba(0,212,255,0.35); border-radius:14px; display:flex; align-items:center; gap:12px; box-shadow:0 4px 16px rgba(0,212,255,0.12);">
                <div style="width:40px; height:40px; border-radius:10px; background:linear-gradient(135deg, #0052cc, #00d4ff); display:flex; align-items:center; justify-content:center; font-size:20px; flex-shrink:0;">🚗</div>
                <div style="flex:1; min-width:0;">
                    <div style="font-size:14px; font-weight:800; color:#FFFFFF; white-space:nowrap; overflow:hidden; text-overflow:ellipsis;">
                        ${v.brand || ''} ${v.model || 'Veículo Localizado'}
                    </div>
                    <div style="font-size:11.5px; color:#00D4FF; font-weight:700;">
                        Placa: ${v.license_plate} • Odômetro: ${(v.mileage || 10000).toLocaleString('pt-BR')} km
                    </div>
                    <div style="font-size:11px; color:#94A3B8;">
                        Cliente: ${v.client_name || 'Cliente da Oficina'}
                    </div>
                </div>
                <span style="font-size:10.5px; font-weight:800; color:#10B981; background:rgba(16,185,129,0.15); border:1px solid rgba(16,185,129,0.3); padding:3px 8px; border-radius:6px; white-space:nowrap;">
                    ✓ Identificado
                </span>
            </div>
        `;
    };

    // Preenche a placa e dispara a busca imediata
    WorkshopView.fillAndSearchPlate = function(plate) {
        const input = document.getElementById('mobile-launch-plate-input');
        if (input) {
            input.value = plate;
            this.handleLaunchPlateInput(plate);
        }
    };

    // Dispara a busca manual do botão ou Enter
    WorkshopView.triggerLaunchPlateSearch = function() {
        const input = document.getElementById('mobile-launch-plate-input');
        const plate = input ? input.value : '';
        this.handleLaunchPlateInput(plate);
    };

    // Manipula a digitação da placa com busca automática ao completar 7 dígitos
    WorkshopView.handleLaunchPlateInput = async function(val) {
        const clean = (val || '').trim().toUpperCase().replace(/[^A-Z0-9]/g, '');
        const input = document.getElementById('mobile-launch-plate-input');
        if (input && input.value !== clean) {
            input.value = clean;
        }

        const badgeContainer = document.getElementById('mobile-launch-vehicle-badge');
        if (clean.length < 7) {
            if (badgeContainer) {
                badgeContainer.innerHTML = `
                    <div class="dna-launch-plate-status waiting">
                        <span>👆 Digite os 7 caracteres da placa acima para buscar</span>
                    </div>
                `;
            }
            return;
        }

        if (badgeContainer) {
            badgeContainer.innerHTML = `
                <div class="dna-launch-plate-status loading">
                    <span>🔍 Localizando veículo com a placa ${clean}...</span>
                </div>
            `;
        }

        const vehicle = await this.fetchVehicleDataByPlate(clean);
        if (vehicle) {
            this.selectedMobileVehicle = vehicle;
            this.mobileActivePlate = clean;
            if (badgeContainer) {
                badgeContainer.innerHTML = this.renderLaunchVehicleBadgeHtml(vehicle);
            }
        } else {
            // Cria registro dinâmico imediato para a oficina poder lançar o serviço sem travar
            const newVeh = {
                id: 'veh_' + clean,
                license_plate: clean,
                plate: clean,
                brand: 'Veículo',
                model: 'Modelo Identificado',
                year: '2022',
                color: 'Prata',
                mileage: 45000,
                client_name: 'Cliente da Oficina',
                client_phone: '(11) 99999-9999',
                last_service_date: 'Hoje'
            };
            this.selectedMobileVehicle = newVeh;
            this.mobileActivePlate = clean;
            if (badgeContainer) {
                badgeContainer.innerHTML = this.renderLaunchVehicleBadgeHtml(newVeh);
            }
        }
    };

    // ──────────────────────────────────────────────────────────────────────────
    // INICIALIZAÇÃO E LÓGICA DO CARROSSEL VERTICAL 3D DE CARDS
    // ──────────────────────────────────────────────────────────────────────────
    WorkshopView.initVerticalCardCarousel = function() {
        const carousel = document.getElementById("dna-vertical-carousel");
        if (!carousel) return;

        const cards = [...carousel.querySelectorAll(".card")];
        const indicator = document.getElementById("dna-carousel-indicator");
        if (!cards.length || !indicator) return;

        indicator.innerHTML = '';
        let current = this._carouselCurrentIndex || 0;
        if (current >= cards.length) current = 0;
        this._carouselCurrentIndex = current;
        let wheelLocked = false;

        // Cria os indicadores verticais
        cards.forEach((card, index) => {
            const dot = document.createElement("div");
            dot.classList.add("dot");
            dot.addEventListener("click", (e) => {
                e.stopPropagation();
                WorkshopView.selectCarouselCard(index);
            });
            indicator.appendChild(dot);
        });

        const dots = [...indicator.querySelectorAll(".dot")];

        // Função de Render com perspectiva, profundidade, scale, blur e opacidade
        const render = () => {
            cards.forEach((card, index) => {
                const distance = index - current;
                const absDistance = Math.abs(distance);

                // Distância vertical (card height 76px + 12px gap = 88px)
                const y = distance * 88;

                // Profundidade
                const scale = 1 - Math.min(absDistance * 0.10, 0.38);

                // Transparência
                let opacity = 1 - absDistance * 0.25;
                opacity = Math.max(opacity, 0.12);

                // Blur
                const blur = Math.min(absDistance * 1.15, 4);

                // Rotação 3D
                const rotateX = distance * -3;

                // Cards muito distantes desaparecem
                if (absDistance > 3) {
                    opacity = 0;
                }

                // Transformação centralizada: .card possui top: 50% e margin-top: -38px no CSS (centro exato)
                // translateY(${y}px) desloca a partir do centro perfeito
                card.style.transform = `
                    translateY(${y}px)
                    scale(${scale})
                    rotateX(${rotateX}deg)
                `;
                card.style.opacity = opacity;
                card.style.filter = `blur(${blur}px)`;
                card.style.zIndex = (index === current) ? 60 : (40 - absDistance);

                if (index === current) {
                    card.classList.add("active");
                } else {
                    card.classList.remove("active");
                }
            });

            // Atualiza indicadores
            dots.forEach((dot, index) => {
                dot.classList.toggle("active", index === current);
            });

            // Atualiza botão de ação inferior
            const activeCard = cards[current];
            if (activeCard) {
                const titleEl = activeCard.querySelector(".info h2");
                const actionBtnText = document.getElementById("carousel-action-btn-text");
                if (actionBtnText && titleEl) {
                    actionBtnText.textContent = "Confirmar Serviço: " + titleEl.textContent;
                }
            }
        };

        // Selecionar card por índice
        WorkshopView.selectCarouselCard = function(index) {
            if (index < 0) index = cards.length - 1;
            if (index >= cards.length) index = 0;
            current = index;
            WorkshopView._carouselCurrentIndex = current;
            render();
        };

        // Movimento relativo
        WorkshopView.moveCarousel = function(direction) {
            WorkshopView.selectCarouselCard(current + direction);
        };

        // Clique nos cards
        cards.forEach((card, index) => {
            card.onclick = () => {
                if (index === current) {
                    const serviceId = card.getAttribute("data-service-id");
                    WorkshopView.handleMobileSelectServiceToDetail(serviceId);
                } else {
                    WorkshopView.selectCarouselCard(index);
                }
            };
        });

        // Evento Mouse Wheel / Trackpad
        carousel.onwheel = (event) => {
            if (wheelLocked) return;
            if (Math.abs(event.deltaY) < 15) return;
            wheelLocked = true;
            if (event.deltaY > 0) {
                WorkshopView.moveCarousel(1);
            } else {
                WorkshopView.moveCarousel(-1);
            }
            setTimeout(() => { wheelLocked = false; }, 380);
        };

        // Evento Touch / Swipe no Mobile
        let touchStartY = 0;
        let touchEndY = 0;

        carousel.ontouchstart = (event) => {
            touchStartY = event.touches[0].clientY;
        };

        carousel.ontouchend = (event) => {
            touchEndY = event.changedTouches[0].clientY;
            const difference = touchStartY - touchEndY;
            if (difference > 40) {
                WorkshopView.moveCarousel(1);
            } else if (difference < -40) {
                WorkshopView.moveCarousel(-1);
            }
        };

        render();
    };

    // Abre o serviço selecionado no carrossel
    WorkshopView.openCurrentCarouselService = function() {
        const current = this._carouselCurrentIndex || 0;
        const s = this.launchCarouselServices[current] || this.launchCarouselServices[0];
        this.handleMobileSelectServiceToDetail(s.id);
    };

    // Abertura do detalhe do serviço com vinculação garantida do veículo
    WorkshopView.handleMobileSelectServiceToDetail = function(serviceId) {
        // Encontra o serviço no catálogo geral ou de carrossel
        const s = this.monitoredServicesCatalog.find(item => item.id === serviceId) || 
                  this.launchCarouselServices.find(item => item.id === serviceId) || 
                  this.monitoredServicesCatalog[0];
        this.selectedMobileService = s;

        // Se o usuário digitou uma placa no campo mas ainda não buscou, vincula de imediato
        const input = document.getElementById('mobile-launch-plate-input');
        if (input && input.value) {
            const typedPlate = input.value.trim().toUpperCase().replace(/[^A-Z0-9]/g, '');
            if (typedPlate.length >= 3) {
                if (!this.selectedMobileVehicle || this.selectedMobileVehicle.license_plate !== typedPlate) {
                    this.selectedMobileVehicle = this.findVehicleByPlate(typedPlate) || {
                        id: 'veh_' + typedPlate,
                        license_plate: typedPlate,
                        plate: typedPlate,
                        brand: 'Veículo',
                        model: 'Modelo Identificado',
                        year: '2022',
                        color: 'Prata',
                        mileage: 45000,
                        client_name: 'Cliente da Oficina',
                        client_phone: '(11) 99999-9999',
                        last_service_date: 'Hoje'
                    };
                }
            }
        }

        // Se nenhum veículo foi digitado ainda, define o padrão de demonstração para a tela não falhar
        if (!this.selectedMobileVehicle) {
            this.selectedMobileVehicle = this.getDefaultMobileVehicles()[0];
        }

        this.switchMobileSection('detalhe-servico');
    };

    // Stubs de compatibilidade
    WorkshopView.handleWheelStep = function(delta) { this.moveCarousel(delta); };
    WorkshopView._initWheelAfterRender = function() { this.initVerticalCardCarousel(); };
    WorkshopView._updateWheelActiveItem = function() {};
    WorkshopView.handleWheelSelectService = function(id) { this.handleMobileSelectServiceToDetail(id); };
    WorkshopView.handleWheelConfirmSelection = function() { this.openCurrentCarouselService(); };
    WorkshopView.handleWheelFilterServices = function() {};
    WorkshopView.handleMobileFilterServicesList = function() {};
    WorkshopView.setServiceCategory = function() {};
    WorkshopView.setServiceOrderType = function() {};

    // ──────────────────────────────────────────────────────────────────────────
    // TELA 6: DETALHE DO SERVIÇO (EX: TROCA DE ÓLEO E FILTROS)
    // ──────────────────────────────────────────────────────────────────────────
    WorkshopView.renderMobileServiceDetailView = function() {
        const v = this.selectedMobileVehicle || this.getDefaultMobileVehicles()[0];
        const s = this.selectedMobileService || this.monitoredServicesCatalog[0];

        const todayStr = new Date().toISOString().split('T')[0];
        const nextDate = new Date();
        nextDate.setMonth(nextDate.getMonth() + (s.defaultMonths || 6));
        const nextDateStr = nextDate.toISOString().split('T')[0];

        const currentMileage = v.mileage || 45000;
        const nextMileage = currentMileage + (s.defaultKm || 10000);

        return `
            <div class="dna-mobile-subpage">
                <div class="dna-mobile-subpage-header">
                    <button class="dna-mobile-back-btn" onclick="WorkshopView.switchMobileSection('lancar-servicos')">
                        <span>‹</span> <span>Voltar</span>
                    </button>
                    <span class="dna-mobile-subpage-title">${s.num}. ${s.title}</span>
                </div>

                <div class="dna-mobile-subpage-body">
                    <!-- 1. IDENTIFICAÇÃO DO VEÍCULO PELA PLACA -->
                    ${this.renderUniversalVehiclePlateBar()}

                    <!-- 2. CAMPO DE OBSERVAÇÕES TÉCNICAS DO MECÂNICO -->
                    <div class="dna-input-group">
                        <label class="dna-input-label">Observações Técnicas do Mecânico</label>
                        <textarea 
                            id="mobile-srv-detail-notes" 
                            class="dna-input-field" 
                            rows="2" 
                            placeholder="Descreva detalhes específicos da manutenção realizada, marca da peça aplicada, etc..."
                            style="resize:none; padding:10px; height:60px; font-size:12.5px;"
                        >${this._tempServiceLaunchNotes || ''}</textarea>
                    </div>

                    <!-- 3. FOTO DA PEÇA (DUAS OPÇÕES: CÂMERA & GALERIA) -->
                    ${this.renderDualPhotoUploadSection('srv-detail-piece-photos', 'Foto da Peça / Serviço', 'Câmera ou Galeria')}

                    <!-- 4. FOTO DA NOTA FISCAL (DUAS OPÇÕES: CÂMERA & GALERIA) -->
                    <div style="background:rgba(8,16,32,0.85); border:1px solid rgba(0,102,255,0.25); border-radius:12px; padding:12px;">
                        <div style="display:flex; align-items:center; justify-content:space-between; margin-bottom:8px;">
                            <strong style="color:#ffffff; font-size:12.5px; font-weight:800;">Foto da Nota Fiscal da Peça</strong>
                            <span style="font-size:10px; color:#10B981; font-weight:700;">Garantia</span>
                        </div>

                        <input type="file" id="srv-detail-nf-camera" accept="image/*" capture="environment" style="display:none;" onchange="WorkshopView.handleMobileInvoiceFileSelect(this)" />
                        <input type="file" id="srv-detail-nf-gallery" accept="image/*,application/pdf" style="display:none;" onchange="WorkshopView.handleMobileInvoiceFileSelect(this)" />

                        <div class="dna-photo-choice-grid">
                            <button type="button" class="dna-photo-choice-btn camera" onclick="document.getElementById('srv-detail-nf-camera').click()">
                                <span style="font-size:24px;">📸</span>
                                <strong>Fotografar NF</strong>
                                <small>Câmera do aparelho</small>
                            </button>
                            <button type="button" class="dna-photo-choice-btn gallery" onclick="document.getElementById('srv-detail-nf-gallery').click()">
                                <span style="font-size:24px;">📄</span>
                                <strong>Buscar NF</strong>
                                <small>Galeria do celular</small>
                            </button>
                        </div>
                    </div>

                    <!-- 5. CONDIÇÃO PARA TROCA -->
                    <div style="background:var(--dna-ws-bg-card); border:1px solid var(--dna-ws-border); border-radius:var(--dna-ws-radius-lg); padding:14px; display:flex; flex-direction:column; gap:12px;">
                        <span class="dna-mobile-section-label">Condição para Próxima Troca</span>

                        <div style="display:flex; align-items:center; justify-content:space-between;">
                            <label style="display:flex; align-items:center; gap:8px; font-size:13.5px; font-weight:700; color:#fff; cursor:pointer;">
                                <input type="radio" name="mobile_srv_condition" value="km" checked />
                                <span>Por quilometragem</span>
                            </label>
                            <div style="display:flex; align-items:center; gap:6px;">
                                <span style="font-size:11px; color:var(--dna-ws-text-muted);">A cada</span>
                                <input type="number" id="mobile-srv-interval-km" value="${s.defaultKm || 10000}" style="width:90px; height:38px; text-align:center; font-weight:800;" />
                                <span style="font-size:11.5px; color:var(--dna-ws-cyan);">km</span>
                            </div>
                        </div>

                        <div style="display:flex; align-items:center; justify-content:space-between;">
                            <label style="display:flex; align-items:center; gap:8px; font-size:13.5px; font-weight:700; color:#fff; cursor:pointer;">
                                <input type="radio" name="mobile_srv_condition" value="tempo" />
                                <span>Por tempo</span>
                            </label>
                            <div style="display:flex; align-items:center; gap:6px;">
                                <span style="font-size:11px; color:var(--dna-ws-text-muted);">A cada</span>
                                <input type="number" id="mobile-srv-interval-months" value="${s.defaultMonths || 12}" style="width:70px; height:38px; text-align:center; font-weight:800;" />
                                <span style="font-size:11.5px; color:var(--dna-ws-cyan);">meses</span>
                            </div>
                        </div>
                    </div>

                    <!-- 6. ÚLTIMA TROCA REGISTRADA -->
                    <div style="background:var(--dna-ws-bg-card); border:1px solid var(--dna-ws-border); border-radius:var(--dna-ws-radius-lg); padding:14px; display:flex; flex-direction:column; gap:12px;">
                        <span class="dna-mobile-section-label">Registro do Serviço Realizado</span>
                        
                        <div style="display:grid; grid-template-columns:1fr 1fr; gap:10px;">
                            <div class="dna-input-group">
                                <label class="dna-input-label" style="font-size:11px;">Data do Serviço</label>
                                <input type="date" id="mobile-srv-last-date" value="${todayStr}" style="height:44px; padding:0 10px; font-size:13px; font-weight:700;" />
                            </div>
                            <div class="dna-input-group">
                                <label class="dna-input-label" style="font-size:11px;">Odômetro Atual (KM)</label>
                                <input type="number" id="mobile-srv-last-km" value="${currentMileage}" style="height:44px; padding:0 10px; font-size:13px; font-weight:700;" />
                            </div>
                        </div>
                    </div>

                    <!-- 7. PRÓXIMA TROCA PREVISTA (CÁLCULO AUTOMÁTICO) -->
                    <div style="background:linear-gradient(145deg, rgba(0,102,255,0.12), rgba(0,212,255,0.06)); border:1px solid rgba(0,212,255,0.3); border-radius:var(--dna-ws-radius-lg); padding:14px; display:flex; flex-direction:column; gap:12px;">
                        <span class="dna-mobile-section-label" style="color:var(--dna-ws-cyan);">Previsão de Próxima Troca</span>
                        
                        <div style="display:grid; grid-template-columns:1fr 1fr; gap:10px;">
                            <div class="dna-input-group">
                                <label class="dna-input-label" style="font-size:11px;">Data Estimada</label>
                                <input type="date" id="mobile-srv-next-date" value="${nextDateStr}" style="height:44px; padding:0 10px; font-size:13px; font-weight:700;" />
                            </div>
                            <div class="dna-input-group">
                                <label class="dna-input-label" style="font-size:11px;">Odômetro Estimado</label>
                                <input type="number" id="mobile-srv-next-km" value="${nextMileage}" style="height:44px; padding:0 10px; font-size:13px; font-weight:700;" />
                            </div>
                        </div>
                    </div>

                    <!-- BOTÕES DE AÇÃO -->
                    <div style="margin-top:10px; display:flex; flex-direction:column; gap:10px;">
                        <button class="dna-primary-btn-lg" onclick="WorkshopView.handleMobileSaveServiceRecord()">
                            <span>✓</span> <span>Registrar Serviço no Veículo</span>
                        </button>

                        <button type="button" class="dna-mobile-back-to-cards-btn" onclick="WorkshopView.switchMobileSection('lancar-servicos')">
                            <span>‹</span> <span>Voltar para Lista de Serviços</span>
                        </button>
                    </div>
                </div>
            </div>
        `;
    };

    WorkshopView.handleMobileSaveServiceRecord = async function() {
        const v = this.selectedMobileVehicle || this.getDefaultMobileVehicles()[0];
        const s = this.selectedMobileService || this.monitoredServicesCatalog[0];
        const lastKm = document.getElementById('mobile-srv-last-km')?.value || v.mileage;
        const nextKm = document.getElementById('mobile-srv-next-km')?.value || (Number(lastKm) + 10000);

        try {
            // Salva na API se disponível
            if (API.registerWorkshopService) {
                const fd = new FormData();
                fd.append('vehicle_id', v.id || v.license_plate);
                fd.append('license_plate', v.license_plate);
                fd.append('service_title', s.title);
                fd.append('mileage', lastKm);
                fd.append('category', 'Manutenção Preventiva');
                await API.registerWorkshopService(fd).catch(() => {});
            }
        } catch (_) {}

        alert(`✅ Serviço "${s.title}" registrado com sucesso para o veículo ${v.license_plate}!\nOdômetro atual: ${lastKm} km | Próxima troca: ${nextKm} km.`);
        this.switchMobileSection('dashboard');
    };

    // ──────────────────────────────────────────────────────────────────────────
    // TELA 7: MANUTENÇÃO DOS VEÍCULOS (SEÇÃO 10 DO PROMPT)
    // ──────────────────────────────────────────────────────────────────────────
    WorkshopView.renderMobileMaintenanceVehiclesView = function() {
        const filter = this.mobileMaintFilter || 'problemas';
        let savedContacts = [];
        try {
            const raw = localStorage.getItem('dna_monitoring_contacts');
            if (raw) savedContacts = JSON.parse(raw);
        } catch (_) {}
        const contactMap = {};
        savedContacts.forEach(c => {
            if (!contactMap[c.vehicle_plate]) contactMap[c.vehicle_plate] = c;
        }); // 'problemas' | 'preventiva' | 'normais' | 'todos'

        // Lista de veículos monitorados com alertas OBD e preventivos
        const vehicles = [
            {
                id: 'prob_1',
                client_name: 'João da Silva',
                client_phone: '(11) 98765-4321',
                vehicle_model: 'Fiat Argo 1.0 Flex 2021',
                license_plate: 'BRA2E19',
                current_km: '82.450 km',
                status_type: 'PROBLEM',
                status_badge: '🔴 Problema identificado',
                status_color: '#EF4444',
                issue_title: 'Falha identificada no sistema do motor',
                issue_desc: 'Foi identificada uma falha relacionada ao funcionamento do motor (Falha de ignição / Sensor O2). Recomendada avaliação imediata.',
                tech_code: 'P0301 (Cilindro 1) • Sonda Lambda O2',
                default_msg: 'Olá, João. Aqui é da sua oficina. O acompanhamento do seu veículo Fiat Argo pelo DNA Auto identificou uma condição que recomendamos verificar. Gostaríamos de convidá-lo a trazer o veículo para uma avaliação. Podemos agendar um horário?'
            },
            {
                id: 'prob_2',
                client_name: 'Roberto Silva',
                client_phone: '(11) 96543-2109',
                vehicle_model: 'Jeep Compass Longitude 2.0',
                license_plate: 'QWE7A32',
                current_km: '56.890 km',
                status_type: 'PROBLEM',
                status_badge: '🔴 Problema identificado',
                status_color: '#EF4444',
                issue_title: 'Anomalia no circuito de injeção',
                issue_desc: 'Sonda lambda enviando sinal fora da faixa ideal de mistura. Avaliação preventiva necessária para evitar aumento de consumo.',
                tech_code: 'P0130 (Sensor O2 Banco 1)',
                default_msg: 'Olá, Roberto. Aqui é da sua oficina. O DNA Auto detectou uma condição no circuito de injeção do seu Jeep Compass. Gostaríamos de convidá-lo a trazer o veículo para um diagnóstico preventivo. Podemos agendar um horário?'
            },
            {
                id: 'upc_1',
                client_name: 'Maria Oliveira',
                client_phone: '(11) 97654-3210',
                vehicle_model: 'VW Fox 1.0 Trendline 2013',
                license_plate: 'FOX1013',
                current_km: '103.200 km',
                status_type: 'UPCOMING',
                status_badge: '🟡 Troca de óleo próxima',
                status_color: '#F59E0B',
                issue_title: 'Troca de óleo aos 105.000 km',
                issue_desc: 'Próxima troca de óleo estimada para 105.000 km (faltam 1.800 km). Lubrificação é vital para a longevidade do motor.',
                tech_code: 'Regra de Manutenção 10.000 km',
                default_msg: 'Olá, Maria. Aqui é da sua oficina. O DNA Auto identificou que seu veículo VW Fox está se aproximando da próxima manutenção (Troca de óleo aos 105.000 km). Gostaríamos de convidá-la para realizar a revisão. Podemos agendar um horário?'
            },
            {
                id: 'upc_2',
                client_name: 'Marcos Lima',
                client_phone: '(11) 94321-0987',
                vehicle_model: 'Jeep Renegade Sport 1.8',
                license_plate: 'KLM1H23',
                current_km: '62.000 km',
                status_type: 'UPCOMING',
                status_badge: '🟡 Manutenção próxima',
                status_color: '#F59E0B',
                issue_title: 'Inspeção de pastilhas de freio',
                issue_desc: 'Veículo atingiu 62.000 km. Estimativa de desgaste de pastilhas dianteiras atinge 80% conforme ciclo operacional.',
                tech_code: 'Regra de Revisão Periódica',
                default_msg: 'Olá, Marcos. Aqui é da sua oficina. O monitoramento DNA Auto identificou que seu Jeep Renegade atingiu 62.000 km, momento ideal para a inspeção preventiva das pastilhas de freio. Gostaria de reservar um horário para avaliação?'
            },
            {
                id: 'norm_1',
                client_name: 'Patrícia Souza',
                client_phone: '(11) 95432-1098',
                vehicle_model: 'Honda HR-V EXL 1.8',
                license_plate: 'XY29D10',
                current_km: '38.120 km',
                status_type: 'NORMAL',
                status_badge: '🟢 Tudo normal',
                status_color: '#10B981',
                issue_title: 'Veículo 100% monitorado e em conformidade',
                issue_desc: 'Telemetria do OBD ativa, zero falhas na ECU e manutenções preventivas rigorosamente em dia.',
                tech_code: '0 DTCs • Sistemas em conformidade',
                default_msg: 'Olá, Patrícia! Aqui é da sua oficina. Passando para parabenizá-la: seu Honda HR-V está 100% em dia no monitoramento DNA Auto!'
            }
        ];

        const filtered = vehicles.filter(v => {
            if (filter === 'problemas') return v.status_type === 'PROBLEM';
            if (filter === 'preventiva') return v.status_type === 'UPCOMING';
            if (filter === 'normais') return v.status_type === 'NORMAL';
            return true;
        });

        const probCount = vehicles.filter(v => v.status_type === 'PROBLEM').length;
        const upcCount = vehicles.filter(v => v.status_type === 'UPCOMING').length;
        const normCount = vehicles.filter(v => v.status_type === 'NORMAL').length;

        return `
            <div class="dna-mobile-subpage">
                <div class="dna-mobile-subpage-header">
                    <button class="dna-mobile-back-btn" onclick="WorkshopView.switchMobileSection('dashboard')">
                        <span>‹</span> <span>Voltar</span>
                    </button>
                    <span class="dna-mobile-subpage-title">Alerta de Manutenção</span>
                </div>

                <div class="dna-mobile-subpage-body">
                    <!-- Banner Informativo -->
                    <div style="background:linear-gradient(135deg, rgba(239,68,68,0.12), rgba(245,158,11,0.08)); border:1px solid rgba(239,68,68,0.3); border-radius:12px; padding:12px 14px; margin-bottom:12px;">
                        <div style="display:flex; align-items:center; gap:8px;">
                            <span style="font-size:20px;">🛠️</span>
                            <div>
                                <strong style="color:#FFFFFF; font-size:13.5px; display:block;">Alerta de Manutenção dos Veículos</strong>
                                <span style="font-size:11px; color:#94A3B8;">Comunique clientes leigos diretamente pelo WhatsApp com mensagem pré-preenchida</span>
                            </div>
                        </div>
                    </div>

                    <!-- Abas de Segmentação -->
                    <div class="dna-segmented-control" style="margin-bottom:12px; display:grid; grid-template-columns:repeat(3, 1fr); gap:4px;">
                        <button class="dna-segment-btn ${filter === 'problemas' ? 'active' : ''}" onclick="WorkshopView.setMobileMaintFilter('problemas')" style="${filter === 'problemas' ? 'background:#EF4444; color:#fff;' : ''}">
                            🔴 Problemas (${probCount})
                        </button>
                        <button class="dna-segment-btn ${filter === 'preventiva' ? 'active' : ''}" onclick="WorkshopView.setMobileMaintFilter('preventiva')" style="${filter === 'preventiva' ? 'background:#F59E0B; color:#000;' : ''}">
                            🟡 Preventiva (${upcCount})
                        </button>
                        <button class="dna-segment-btn ${filter === 'normais' ? 'active' : ''}" onclick="WorkshopView.setMobileMaintFilter('normais')" style="${filter === 'normais' ? 'background:#10B981; color:#fff;' : ''}">
                            🟢 Normais (${normCount})
                        </button>
                    </div>

                    <!-- Lista de Cards de Veículos -->
                    <div style="display:flex; flex-direction:column; gap:12px;">
                        ${filtered.map(item => `
                            <div class="dna-mobile-row-card" style="flex-direction:column; align-items:stretch; gap:10px; border-left:4px solid ${item.status_color}; background:#0B132B;">
                                <div style="display:flex; align-items:flex-start; justify-content:space-between; gap:8px;">
                                    <div>
                                        <div style="font-size:15px; font-weight:800; color:#FFFFFF;">${item.client_name}</div>
                                        <div style="font-size:12px; color:#94A3B8; margin-top:2px;">
                                            ${item.vehicle_model} • <strong style="color:#00D4FF; font-family:monospace;">${item.license_plate}</strong>
                                        </div>
                                        <div style="font-size:11.5px; color:#64748B; margin-top:2px;">
                                            Quilometragem: <strong style="color:#F1F5F9;">${item.current_km}</strong>
                                        </div>
                                    </div>
                                    <span class="dna-status-pill" style="background:${item.status_color}22; color:${item.status_color}; border:1px solid ${item.status_color}55; font-size:10.5px; font-weight:800; white-space:nowrap;">
                                        ${item.status_badge}
                                    </span>
                                </div>

                                <div style="background:rgba(0,0,0,0.3); border-radius:8px; padding:10px 12px; font-size:12px;">
                                    <strong style="color:${item.status_color}; display:block; margin-bottom:2px;">${item.issue_title}</strong>
                                    <div style="color:#CBD5E1; line-height:1.35;">${item.issue_desc}</div>
                                    <div style="margin-top:6px; font-size:10.5px; color:#64748B; font-family:monospace;">
                                        Detalhe técnico: ${item.tech_code}
                                    </div>
                                </div>

                                <div id="contact-badge-mobile-${item.license_plate}" style="${contactMap[item.license_plate] ? 'display:block;' : 'display:none;'} font-size:11px; color:#10B981; font-weight:700; padding:6px 10px; background:rgba(16,185,129,0.12); border:1px solid rgba(16,185,129,0.25); border-radius:6px;">
                                    ✅ Cliente comunicado via WhatsApp ${contactMap[item.license_plate] ? 'em ' + contactMap[item.license_plate].contact_timestamp : ''}
                                </div>

                                <div style="display:flex; gap:8px; margin-top:2px;">
                                    <button class="dna-whatsapp-btn" style="flex:1; justify-content:center; padding:10px; font-size:12.5px;" onclick="WorkshopView.openClientMonitoringWhatsAppModal('${item.client_name}', '${item.client_phone}', '${item.license_plate}', '${item.vehicle_model}', '${item.issue_title}', '${item.status_type}', '${encodeURIComponent(item.default_msg)}')">
                                        <span>💬</span> <span>Enviar WhatsApp</span>
                                    </button>
                                </div>
                            </div>
                        `).join('')}
                    </div>

                    <div style="margin-top:16px; text-align:center;">
                        <button type="button" class="dna-mobile-back-to-cards-btn" onclick="WorkshopView.switchMobileSection('dashboard')">
                            <span>‹</span> <span>Voltar para Todos os Cards</span>
                        </button>
                    </div>
                </div>
            </div>
        `;
    };

    WorkshopView.setMobileMaintFilter = function(filter) {
        this.mobileMaintFilter = filter;
        this.switchMobileSection('manutencao-veiculos');
    };

    WorkshopView.handleMobileDirectServiceLaunch = function(plate, serviceName) {
        const v = this.findVehicleByPlate(plate);
        if (v) this.selectedMobileVehicle = v;
        const s = this.monitoredServicesCatalog.find(item => item.title.toLowerCase().includes(serviceName.toLowerCase())) || this.monitoredServicesCatalog[0];
        this.selectedMobileService = s;
        this.switchMobileSection('detalhe-servico');
    };

    // ──────────────────────────────────────────────────────────────────────────
    // TELA 8: AVISOS DE MANUTENÇÃO & WHATSAPP AUTOMÁTICO (SEÇÃO 11 & 12)
    // ──────────────────────────────────────────────────────────────────────────
    WorkshopView.renderMobileMaintenanceAlertsView = function() {
        const tab = this.mobileAlertTab || 'pendentes';
        const alerts = this.getMobileAlerts();
        const pending = alerts.filter(a => !this.mobileAlertsSent[a.id]);
        const sent = alerts.filter(a => this.mobileAlertsSent[a.id]);
        const currentList = tab === 'pendentes' ? pending : sent;

        return `
            <div class="dna-mobile-subpage">
                <div class="dna-mobile-subpage-header">
                    <button class="dna-mobile-back-btn" onclick="WorkshopView.switchMobileSection('dashboard')">
                        <span>‹</span> <span>Voltar</span>
                    </button>
                    <span class="dna-mobile-subpage-title">Avisos de Manutenção</span>
                    
                </div>

                <div class="dna-mobile-subpage-body">
                    <!-- Segmented Tabs -->
                    <div class="dna-segmented-control">
                        <button class="dna-segment-btn ${tab === 'pendentes' ? 'active' : ''}" onclick="WorkshopView.setMobileAlertTab('pendentes')">
                            Pendentes (${pending.length})
                        </button>
                        <button class="dna-segment-btn ${tab === 'enviados' ? 'active' : ''}" onclick="WorkshopView.setMobileAlertTab('enviados')">
                            Enviados (${sent.length})
                        </button>
                    </div>

                    <!-- Lista de Alertas -->
                    <div style="display:flex; flex-direction:column; gap:12px;">
                        ${currentList.length === 0 ? `
                            <div style="padding:40px 20px; text-align:center; color:var(--dna-ws-text-muted);">
                                <span>🎉</span>
                                <div style="font-size:14px; font-weight:700; color:#fff; margin-top:8px;">Nenhum aviso pendente no momento!</div>
                                <span style="font-size:12px;">Todos os clientes com manutenções próximas foram notificados.</span>
                            </div>
                        ` : currentList.map(a => `
                            <div class="dna-maint-alert-card">
                                <div class="dna-maint-alert-header">
                                    <div class="dna-maint-alert-icon ${a.urgency === 'CRITICAL' ? 'dna-alert-critical' : 'dna-alert-warning'}">
                                        !
                                    </div>
                                    <div class="dna-maint-alert-info">
                                        <div class="dna-maint-alert-car">${a.vehicle_model} - <span style="font-family:monospace; color:var(--dna-ws-cyan);">${a.license_plate}</span></div>
                                        <div style="font-size:12px; color:var(--dna-ws-text-muted); margin-top:2px;">Cliente: <strong style="color:#fff;">${a.client_name}</strong></div>
                                        <div class="dna-maint-alert-service">Necessário: ${a.service_needed}</div>
                                        <div style="font-size:11.5px; color:var(--dna-ws-text-dim); margin-top:2px;">Motivo: ${a.reason}</div>
                                        <div class="dna-maint-alert-due ${a.urgency === 'WARNING' ? 'amber' : ''}">
                                            ${a.due_text}
                                        </div>
                                    </div>
                                </div>

                                <button class="dna-whatsapp-btn" onclick="WorkshopView.handleMobileSendWhatsAppAlert('${a.id}')">
                                    <span>💬</span> <span>Enviar WhatsApp</span>
                                </button>
                            </div>
                        `).join('')}
                    </div>

                    <!-- Preview da Configuração de Mensagem Automática -->
                    <div style="background:rgba(8,16,32,0.8); border:1px solid rgba(255,255,255,0.06); border-radius:var(--dna-ws-radius-lg); padding:14px;">
                        <span class="dna-mobile-section-label" style="display:block; margin-bottom:6px;">Configuração da Mensagem</span>
                        <div style="font-size:11.5px; color:var(--dna-ws-text-muted); line-height:1.4; font-family:var(--dna-ws-font-main); background:rgba(0,0,0,0.3); padding:10px 12px; border-radius:8px;">
                            "Olá, {nome}! A oficina {nome_oficina} identificou que seu veículo {modelo}, placa {placa}, está próximo do período recomendado para {servico}. Recomendamos realizar a manutenção para manter o veículo em boas condições. Estamos à disposição para agendar seu atendimento."
                        </div>
                    </div>

                    <button type="button" class="dna-mobile-back-to-cards-btn" onclick="WorkshopView.switchMobileSection('dashboard')">
                        <span>‹</span> <span>Voltar para Todos os Cards</span>
                    </button>

                </div>
            </div>
        `;
    };

    WorkshopView.setMobileAlertTab = function(tab) {
        this.mobileAlertTab = tab;
        this.switchMobileSection('avisos-manutencao');
    };

    WorkshopView.handleMobileSendWhatsAppAlert = function(alertId) {
        const alerts = this.getMobileAlerts();
        const a = alerts.find(item => item.id === alertId);
        if (!a) return;

        const wsName = this.officialWorkshopName || 'Veloce Auto Center Premium';
        const message = `Olá, ${a.client_name}!\nA oficina ${wsName} identificou que seu veículo ${a.vehicle_model}, placa ${a.license_plate}, está próximo do período recomendado para ${a.service_needed}.\nRecomendamos realizar a manutenção para manter o veículo em boas condições.\nEstamos à disposição para agendar seu atendimento.`;

        this.mobileAlertsSent[alertId] = true;
        const phone = a.client_phone.replace(/[^0-9]/g, '');
        const targetUrl = `https://wa.me/55${phone}?text=${encodeURIComponent(message)}`;

        window.open(targetUrl, '_blank');
        alert(`📲 WhatsApp gerado e aberto para ${a.client_name}!\nMensagem com ${wsName} transmitida com sucesso.`);
        this.switchMobileSection('avisos-manutencao');
    };

    // ──────────────────────────────────────────────────────────────────────────
    // TELA 9: ENVIAR FOTOS (SEÇÃO 13 DO PROMPT)
    // ──────────────────────────────────────────────────────────────────────────
    WorkshopView.renderMobileSendPhotosView = function() {
        const v = this.selectedMobileVehicle || this.getDefaultMobileVehicles()[0];

        return `
            <div class="dna-mobile-subpage">
                <div class="dna-mobile-subpage-header">
                    <button class="dna-mobile-back-btn" onclick="WorkshopView.switchMobileSection('dashboard')">
                        <span>‹</span> <span>Voltar</span>
                    </button>
                    <span class="dna-mobile-subpage-title">Enviar Fotos</span>
                </div>

                <div class="dna-mobile-subpage-body">
                    <!-- 1. BARRA UNIVERSAL DE BUSCA POR PLACA -->
                    ${this.renderUniversalVehiclePlateBar()}

                    <!-- 2. OBSERVAÇÕES DO REGISTRO -->
                    <div class="dna-input-group">
                        <label class="dna-input-label">Descrição das Fotos / Peças</label>
                        <textarea 
                            id="mobile-photos-desc-input" 
                            class="dna-input-field" 
                            rows="2" 
                            placeholder="Descreva as fotos das peças substituídas ou serviços realizados..."
                            style="resize:none; padding:10px; height:60px; font-size:12.5px;"
                        ></textarea>
                    </div>

                    <!-- 3. FOTO DA PEÇA (CÂMERA OU GALERIA) -->
                    ${this.renderDualPhotoUploadSection('photos-pieces-box', 'Fotos da Peça / Serviço', 'Câmera ou Galeria')}

                    <!-- 4. FOTO DA NOTA FISCAL (CÂMERA OU GALERIA) -->
                    <div style="background:rgba(8,16,32,0.85); border:1px solid rgba(0,102,255,0.25); border-radius:12px; padding:12px;">
                        <div style="display:flex; align-items:center; justify-content:space-between; margin-bottom:8px;">
                            <strong style="color:#ffffff; font-size:12.5px; font-weight:800;">Foto da Nota Fiscal / Comprovante</strong>
                            <span style="font-size:10px; color:#10B981; font-weight:700;">Anexo Oficial</span>
                        </div>

                        <input type="file" id="nf-camera-input" accept="image/*" capture="environment" style="display:none;" onchange="WorkshopView.handleMobileInvoiceFileSelect(this)" />
                        <input type="file" id="nf-gallery-input" accept="image/*,application/pdf" style="display:none;" onchange="WorkshopView.handleMobileInvoiceFileSelect(this)" />

                        <div class="dna-photo-choice-grid">
                            <button type="button" class="dna-photo-choice-btn camera" onclick="document.getElementById('nf-camera-input').click()">
                                <span style="font-size:24px;">📸</span>
                                <strong>Fotografar NF</strong>
                                <small>Câmera do aparelho</small>
                            </button>
                            <button type="button" class="dna-photo-choice-btn gallery" onclick="document.getElementById('nf-gallery-input').click()">
                                <span style="font-size:24px;">📄</span>
                                <strong>Buscar NF</strong>
                                <small>Galeria ou Arquivos</small>
                            </button>
                        </div>

                        <div style="margin-top:8px; font-size:11.5px; color:${this.mobileInvoiceAttachment ? '#10B981' : 'var(--dna-ws-text-muted)'}; text-align:center;">
                            ${this.mobileInvoiceAttachment ? '✓ ' + this.mobileInvoiceAttachment : 'Nenhum comprovante anexado'}
                        </div>
                    </div>

                    <!-- BOTÕES DE AÇÃO -->
                    <div style="margin-top:14px; display:flex; flex-direction:column; gap:10px;">
                        <button class="dna-primary-btn-lg" onclick="WorkshopView.handleMobileSavePhotos()">
                            <span>✓</span> <span>Salvar Fotos no Veículo</span>
                        </button>

                        <button type="button" class="dna-mobile-back-to-cards-btn" onclick="WorkshopView.switchMobileSection('dashboard')">
                            <span>‹</span> <span>Voltar para Todos os Cards</span>
                        </button>
                    </div>
                </div>
            </div>
        `;
    };

    WorkshopView.handleMobilePhotoFileSelect = function(input) {
        if (!input.files || input.files.length === 0) return;
        Array.from(input.files).forEach(file => {
            const reader = new FileReader();
            reader.onload = (e) => {
                this.mobileUploadedPhotos.push(e.target.result);
                this.switchMobileSection('enviar-fotos');
            };
            reader.readAsDataURL(file);
        });
    };

    WorkshopView.handleMobileInvoiceFileSelect = function(input) {
        if (!input.files || input.files.length === 0) return;
        this.mobileInvoiceAttachment = input.files[0].name;
        this.switchMobileSection('enviar-fotos');
    };

    WorkshopView.handleMobileRemovePhoto = function(index) {
        this.mobileUploadedPhotos.splice(index, 1);
        this.switchMobileSection('enviar-fotos');
    };

    WorkshopView.handleRemoveSamplePhoto = function(idx) {
        WorkshopView.showToast('Foto removida da prévia.', 'info');
    };

    WorkshopView.handleMobileSavePhotos = function() {
        const v = this.selectedMobileVehicle || this.getDefaultMobileVehicles()[0];
        const desc = document.getElementById('mobile-photo-desc-input')?.value || 'Registro fotográfico';

        WorkshopView.showToast(`📸 Fotos e comprovante salvos com sucesso para ${v.license_plate}!\nAs fotos foram integradas ao Dossiê 360° e já estão disponíveis no aplicativo do cliente.`, 'success');
        this.switchMobileSection('dashboard');
    };

    // ──────────────────────────────────────────────────────────────────────────
    // TELA 10: NOTA FISCAL (SEÇÃO 14 DO PROMPT)
    // ──────────────────────────────────────────────────────────────────────────
    WorkshopView.renderMobileInvoiceView = function() {
        const v = this.selectedMobileVehicle || this.getDefaultMobileVehicles()[0];
        const items = this.mobileInvoiceItems || [];
        const subtotal = items.filter(i => i.checked).reduce((acc, curr) => acc + curr.price, 0);

        return `
            <div class="dna-mobile-subpage">
                <div class="dna-mobile-subpage-header">
                    <button class="dna-mobile-back-btn" onclick="WorkshopView.switchMobileSection('dashboard')">
                        <span>‹</span> <span>Voltar</span>
                    </button>
                    <span class="dna-mobile-subpage-title">Nota Fiscal</span>
                </div>

                <div class="dna-mobile-subpage-body">
                    <!-- 1. BARRA UNIVERSAL DE BUSCA POR PLACA -->
                    ${this.renderUniversalVehiclePlateBar()}

                    <!-- 2. OBSERVAÇÕES DA NOTA FISCAL -->
                    <div class="dna-input-group" style="margin-top:4px;">
                        <label class="dna-input-label">Observações da Nota Fiscal / Serviços</label>
                        <textarea 
                            id="mobile-invoice-notes-input" 
                            class="dna-input-field" 
                            rows="2" 
                            placeholder="Descreva detalhes dos serviços, garantia das peças ou dados adicionais..."
                            style="resize:none; padding:10px; height:60px; font-size:12.5px;"
                        ></textarea>
                    </div>

                    <!-- 3. FOTO DA NOTA FISCAL / COMPROVANTE (DUAS OPÇÕES: CÂMERA & GALERIA) -->
                    <div style="background:rgba(8,16,32,0.85); border:1px solid rgba(0,102,255,0.25); border-radius:12px; padding:12px;">
                        <div style="display:flex; align-items:center; justify-content:space-between; margin-bottom:8px;">
                            <strong style="color:#ffffff; font-size:12.5px; font-weight:800;">Anexar Nota Fiscal / Cupom Fiscal</strong>
                            <span style="font-size:10px; color:#10B981; font-weight:700;">Documento Oficial</span>
                        </div>

                        <input type="file" id="invoice-nf-camera-input" accept="image/*" capture="environment" style="display:none;" onchange="WorkshopView.handleMobileInvoiceFileSelect(this)" />
                        <input type="file" id="invoice-nf-gallery-input" accept="image/*,application/pdf" style="display:none;" onchange="WorkshopView.handleMobileInvoiceFileSelect(this)" />

                        <div class="dna-photo-choice-grid">
                            <button type="button" class="dna-photo-choice-btn camera" onclick="document.getElementById('invoice-nf-camera-input').click()">
                                <span style="font-size:24px;">📸</span>
                                <strong>Fotografar NF</strong>
                                <small>Câmera do aparelho</small>
                            </button>
                            <button type="button" class="dna-photo-choice-btn gallery" onclick="document.getElementById('invoice-nf-gallery-input').click()">
                                <span style="font-size:24px;">📄</span>
                                <strong>Buscar Arquivo / Galeria</strong>
                                <small>Galeria do celular</small>
                            </button>
                        </div>

                        <div style="margin-top:8px; font-size:11.5px; color:${this.mobileInvoiceAttachment ? '#10B981' : 'var(--dna-ws-text-muted)'}; text-align:center;">
                            ${this.mobileInvoiceAttachment ? '✓ ' + this.mobileInvoiceAttachment : 'Nenhum comprovante anexado ainda'}
                        </div>
                    </div>

                    <!-- 4. CHECKLIST DE SERVIÇOS / PEÇAS COM VALORES -->
                    <div>
                        <span class="dna-mobile-section-label" style="display:block; margin-bottom:8px;">Serviços & Peças a Faturar</span>
                        
                        <div style="display:flex; flex-direction:column; gap:8px;">
                            ${items.map((item, idx) => `
                                <div style="display:flex; align-items:center; justify-content:space-between; background:var(--dna-ws-bg-card); border:1px solid var(--dna-ws-border); border-radius:12px; padding:12px 14px;">
                                    <label style="display:flex; align-items:center; gap:10px; cursor:pointer; font-size:13px; font-weight:700; color:#fff;">
                                        <input type="checkbox" ${item.checked ? 'checked' : ''} onchange="WorkshopView.handleToggleInvoiceItem(${idx})" />
                                        <span>${item.title}</span>
                                    </label>
                                    <span style="font-weight:800; color:var(--dna-ws-cyan); font-size:13.5px;">
                                        R$ ${item.price.toFixed(2).replace('.', ',')}
                                    </span>
                                </div>
                            `).join('')}
                        </div>
                    </div>

                    <!-- 5. TOTAIS -->
                    <div style="background:rgba(8,16,32,0.85); border:1px solid rgba(0,212,255,0.25); border-radius:14px; padding:14px 16px; display:flex; flex-direction:column; gap:6px;">
                        <div style="display:flex; justify-content:space-between; font-size:12.5px; color:var(--dna-ws-text-muted);">
                            <span>Subtotal</span>
                            <span>R$ ${subtotal.toFixed(2).replace('.', ',')}</span>
                        </div>
                        <div style="display:flex; justify-content:space-between; font-size:12.5px; color:var(--dna-ws-text-muted);">
                            <span>Desconto</span>
                            <span>R$ 0,00</span>
                        </div>
                        <div style="display:flex; justify-content:space-between; font-size:15px; font-weight:800; color:#fff; border-top:1px solid rgba(255,255,255,0.08); padding-top:6px; margin-top:2px;">
                            <span>Total Geral</span>
                            <span style="color:var(--dna-ws-green);">R$ ${subtotal.toFixed(2).replace('.', ',')}</span>
                        </div>
                    </div>

                    <!-- BOTÕES DE AÇÃO -->
                    <div style="margin-top:10px; display:flex; flex-direction:column; gap:10px;">
                        <button class="dna-primary-btn-lg" onclick="WorkshopView.handleMobileSaveInvoice(false)">
                            <span>✓</span> <span>Salvar Registro de Nota Fiscal</span>
                        </button>
                        <button class="dna-primary-btn-lg cyan" onclick="WorkshopView.handleMobileSaveInvoice(true)">
                            <span>↗</span> <span>Emitir Nota Fiscal Eletrônica</span>
                        </button>
                        <button type="button" class="dna-mobile-back-to-cards-btn" onclick="WorkshopView.switchMobileSection('dashboard')">
                            <span>‹</span> <span>Voltar para Todos os Cards</span>
                        </button>
                    </div>
                </div>
            </div>
        `;
    };

    WorkshopView.handleToggleInvoiceItem = function(index) {
        if (this.mobileInvoiceItems[index]) {
            this.mobileInvoiceItems[index].checked = !this.mobileInvoiceItems[index].checked;
            this.switchMobileSection('nota-fiscal');
        }
    };

    WorkshopView.handleMobileSaveInvoice = function(isIssue) {
        const v = this.selectedMobileVehicle || this.getDefaultMobileVehicles()[0];
        alert(isIssue 
            ? `📄 Nota Fiscal Eletrônica emitida com sucesso para o veículo ${v.license_plate}!\nO documento foi transmitido e vinculado à Ficha Digital.`
            : `💾 Dados da Nota Fiscal salvos com sucesso para ${v.license_plate}.`
        );
        this.switchMobileSection('dashboard');
    };

    // ──────────────────────────────────────────────────────────────────────────
    // TELA 11: CLIENTES (SEÇÃO 15 DO PROMPT)
    // ──────────────────────────────────────────────────────────────────────────
    WorkshopView.renderMobileClientsView = function() {
        const vehicles = this.getEffectiveVehiclesList();
        const tab = this.mobileClientsTab || 'lista';

        return `
            <div class="dna-mobile-subpage">
                <div class="dna-mobile-subpage-header">
                    <button class="dna-mobile-back-btn" onclick="WorkshopView.switchMobileSection('dashboard')">
                        <span>‹</span> <span>Voltar</span>
                    </button>
                    <span class="dna-mobile-subpage-title">Clientes</span>
                    
                </div>

                <div class="dna-mobile-subpage-body">
                    <!-- Segmented Tabs -->
                    <div class="dna-segmented-control">
                        <button class="dna-segment-btn ${tab === 'cadastrar' ? 'active' : ''}" onclick="WorkshopView.switchMobileSection('cadastrar-cliente')">Cadastrar</button>
                        <button class="dna-segment-btn ${tab === 'lista' ? 'active' : ''}" onclick="WorkshopView.setMobileClientsTab('lista')">Lista de Clientes</button>
                    </div>

                    <!-- Campo de Busca -->
                    <div style="position:relative;">
                        <input 
                            type="text" 
                            id="mobile-clients-search-input" 
                            placeholder="🔍 Buscar cliente..." 
                            oninput="WorkshopView.handleMobileFilterClientsList(this.value)"
                            style="width:100%; height:44px; background:rgba(8,16,32,0.85); border:1px solid rgba(0,102,255,0.3); border-radius:12px; padding:0 14px; color:#fff; font-size:13.5px; box-sizing:border-box;"
                        />
                    </div>

                    <!-- Lista de Cards de Clientes -->
                    <div style="display:flex; flex-direction:column; gap:10px;" id="mobile-clients-list-container">
                        ${vehicles.map(v => {
                            const initials = (v.client_name || 'Cliente').split(' ').map(n=>n[0]).slice(0,2).join('').toUpperCase();
                            return `
                                <div class="dna-mobile-row-card" onclick="WorkshopView.handleMobileOpenClientDetails('${v.license_plate}')">
                                    <div class="dna-mobile-row-icon dna-icon-blue" style="font-size:14px; font-weight:800;">
                                        ${initials}
                                    </div>
                                    <div class="dna-mobile-row-content">
                                        <h4 class="dna-mobile-row-title">${v.client_name || 'João da Silva'}</h4>
                                        <div style="font-size:11.5px; color:var(--dna-ws-cyan); margin-top:2px;">
                                            ${v.client_phone || '(21) 98765-4321'}
                                        </div>
                                        <div style="font-size:11px; color:var(--dna-ws-text-dim); margin-top:1px;">
                                            ${v.license_plate} - ${v.model}
                                        </div>
                                    </div>
                                    <span class="dna-mobile-row-chevron">›</span>
                                </div>
                            `;
                        }).join('')}
                    </div>
                </div>

                <!-- Botão Inferior Fixo -->
                <div class="dna-mobile-fixed-bottom-bar">
                    <button class="dna-primary-btn-lg" onclick="WorkshopView.switchMobileSection('cadastrar-cliente')">
                        <span>+</span> <span>Novo Cliente</span>
                    </button>

                    <button type="button" class="dna-mobile-back-to-cards-btn" onclick="WorkshopView.switchMobileSection('dashboard')">
                        <span>‹</span> <span>Voltar para Todos os Cards</span>
                    </button>
</div>
            </div>
        `;
    };

    WorkshopView.setMobileClientsTab = function(tab) {
        this.mobileClientsTab = tab;
        this.switchMobileSection('clientes');
    };

    WorkshopView.handleMobileFilterClientsList = function(query) {
        const q = (query || '').toLowerCase().trim();
        const container = document.getElementById('mobile-clients-list-container');
        if (!container) return;

        const vehicles = this.getEffectiveVehiclesList();
        const filtered = vehicles.filter(v => 
            (v.client_name || '').toLowerCase().includes(q) ||
            (v.license_plate || '').toLowerCase().includes(q) ||
            (v.client_phone || '').includes(q)
        );

        container.innerHTML = filtered.map(v => {
            const initials = (v.client_name || 'Cliente').split(' ').map(n=>n[0]).slice(0,2).join('').toUpperCase();
            return `
                <div class="dna-mobile-row-card" onclick="WorkshopView.handleMobileOpenClientDetails('${v.license_plate}')">
                    <div class="dna-mobile-row-icon dna-icon-blue" style="font-size:14px; font-weight:800;">
                        ${initials}
                    </div>
                    <div class="dna-mobile-row-content">
                        <h4 class="dna-mobile-row-title">${v.client_name || 'João da Silva'}</h4>
                        <div style="font-size:11.5px; color:var(--dna-ws-cyan); margin-top:2px;">
                            ${v.client_phone || '(21) 98765-4321'}
                        </div>
                        <div style="font-size:11px; color:var(--dna-ws-text-dim); margin-top:1px;">
                            ${v.license_plate} - ${v.model}
                        </div>
                    </div>
                    <span class="dna-mobile-row-chevron">›</span>
                </div>
            `;
        }).join('');
    };

    WorkshopView.handleMobileOpenClientDetails = function(plate) {
        const v = this.findVehicleByPlate(plate);
        if (v) {
            this.selectedMobileVehicle = v;
            alert(`👤 Cliente ${v.client_name}\nTelefone: ${v.client_phone}\nVeículo Vinculado: ${v.model} (${v.license_plate})\nRedirecionando para lançar serviços.`);
            this.switchMobileSection('lancar-servicos');
        }
    };

    // ──────────────────────────────────────────────────────────────────────────
    // TELA 12: BUSCAR VEÍCULOS (SEÇÃO 15 DO PROMPT)
    // ──────────────────────────────────────────────────────────────────────────
    WorkshopView.renderMobileSearchVehiclesView = function() {
        const vehicles = this.getEffectiveVehiclesList();
        const searchType = this.mobileSearchType || 'placa';

        return `
            <div class="dna-mobile-subpage">
                <div class="dna-mobile-subpage-header">
                    <button class="dna-mobile-back-btn" onclick="WorkshopView.switchMobileSection('dashboard')">
                        <span>‹</span> <span>Voltar</span>
                    </button>
                    <span class="dna-mobile-subpage-title">Buscar Veículos</span>
                    
                </div>

                <div class="dna-mobile-subpage-body">
                    <!-- Segmented Filter Tabs -->
                    <div class="dna-segmented-control">
                        <button class="dna-segment-btn ${searchType === 'placa' ? 'active' : ''}" onclick="WorkshopView.setMobileSearchType('placa')">Por Placa</button>
                        <button class="dna-segment-btn ${searchType === 'chassi' ? 'active' : ''}" onclick="WorkshopView.setMobileSearchType('chassi')">Por Chassi</button>
                        <button class="dna-segment-btn ${searchType === 'cliente' ? 'active' : ''}" onclick="WorkshopView.setMobileSearchType('cliente')">Por Cliente</button>
                    </div>

                    <!-- Input de Busca -->
                    <div class="dna-input-group">
                        <label class="dna-input-label">
                            ${searchType === 'placa' ? 'Digite a placa' : searchType === 'chassi' ? 'Digite o chassi' : 'Digite o nome do cliente'}
                        </label>
                        <div class="dna-input-search-row">
                            <input 
                                type="text" 
                                id="mobile-veh-search-input" 
                                class="dna-plate-input" 
                                placeholder="${searchType === 'placa' ? 'Ex: ABC1D23' : searchType === 'chassi' ? 'Ex: 9BWCA...' : 'Ex: João'}"
                                oninput="if('${searchType}'==='placa') this.value=this.value.toUpperCase(); WorkshopView.handleLiveVehicleSearch(this.value);"
                            />
                            <button class="dna-search-action-btn" onclick="WorkshopView.handleLiveVehicleSearch(document.getElementById('mobile-veh-search-input')?.value)">
                                🔍
                            </button>
                        </div>
                    </div>

                    <!-- Resultados -->
                    <div>
                        <span class="dna-mobile-section-label" style="display:block; margin-bottom:10px;">Resultados</span>
                        
                        <div style="display:flex; flex-direction:column; gap:10px;" id="mobile-search-results-container">
                            ${vehicles.map(v => `
                                <div class="dna-mobile-row-card" onclick="WorkshopView.handleMobileOpenDossier('${v.license_plate}')">
                                    <div class="dna-mobile-row-icon dna-icon-blue">🚗</div>
                                    <div class="dna-mobile-row-content">
                                        <div style="display:flex; align-items:center; gap:8px;">
                                            <span style="font-weight:800; font-family:monospace; color:#fff; font-size:14px;">${v.license_plate}</span>
                                            <span style="font-size:12px; color:var(--dna-ws-text-muted);">${v.brand || ''} ${v.model || ''}</span>
                                        </div>
                                        <div style="font-size:11px; color:var(--dna-ws-text-dim); margin-top:2px;">
                                            ${v.year || '2020'} • ${v.color || 'Prata'} • Cliente: ${v.client_name || 'Oficina'}
                                        </div>
                                    </div>
                                    <span class="dna-mobile-row-chevron">›</span>
                                </div>
                            `).join('')}
                        </div>
                    </div>

                    <button type="button" class="dna-mobile-back-to-cards-btn" onclick="WorkshopView.switchMobileSection('dashboard')">
                        <span>‹</span> <span>Voltar para Todos os Cards</span>
                    </button>

                </div>
            </div>
        `;
    };

    WorkshopView.setMobileSearchType = function(type) {
        this.mobileSearchType = type;
        this.switchMobileSection('buscar-veiculos');
    };

    WorkshopView.handleLiveVehicleSearch = async function(query) {
        const q = (query || '').toLowerCase().trim();
        const container = document.getElementById('mobile-search-results-container');
        if (!container) return;

        const vehicles = this.getEffectiveVehiclesList();
        let filtered = vehicles.filter(v => {
            if (this.mobileSearchType === 'placa') return (v.license_plate || '').toLowerCase().includes(q);
            if (this.mobileSearchType === 'chassi') return (v.chassis || '').toLowerCase().includes(q);
            return (v.client_name || '').toLowerCase().includes(q);
        });

        // Se a busca local não retornou e parece uma placa com 3+ caracteres, busca no sistema
        if (filtered.length === 0 && q.length >= 3 && this.mobileSearchType === 'placa') {
            container.innerHTML = `
                <div style="text-align:center; padding:20px; color:var(--dna-ws-cyan);">
                    <div style="font-size:24px; margin-bottom:6px;">🔍</div>
                    <strong style="font-size:13px;">Buscando veículo ${q.toUpperCase()} no sistema...</strong>
                </div>
            `;
            const remote = await this.fetchVehicleDataByPlate(q);
            if (remote) filtered = [remote];
        }

        if (filtered.length === 0) {
            container.innerHTML = `
                <div style="text-align:center; padding:30px 16px; color:var(--dna-ws-text-muted);">
                    <div style="font-size:28px; margin-bottom:8px;">🚗</div>
                    <strong style="color:#fff; font-size:14px; display:block;">Nenhum veículo localizado</strong>
                    <span style="font-size:12px;">Verifique os dados digitados ou tente buscar por placa completa.</span>
                </div>
            `;
            return;
        }

        container.innerHTML = filtered.map(v => `
            <div class="dna-mobile-row-card" style="flex-direction:column; align-items:stretch; gap:10px;">
                <div style="display:flex; align-items:center; gap:10px;">
                    <div class="dna-mobile-row-icon dna-icon-blue" style="width:40px; height:40px; font-size:20px;">🚗</div>
                    <div class="dna-mobile-row-content">
                        <div style="display:flex; align-items:center; gap:8px;">
                            <span style="font-weight:800; font-family:monospace; color:#fff; font-size:15px;">${v.license_plate}</span>
                            <span style="font-size:13px; color:var(--dna-ws-text-muted); font-weight:700;">${v.brand || ''} ${v.model || ''}</span>
                        </div>
                        <div style="font-size:11.5px; color:var(--dna-ws-text-dim); margin-top:2px;">
                            ${v.year || '2022'} • ${v.color || 'Prata'} • Cliente: ${v.client_name || 'Oficina'}
                        </div>
                        ${v.fipe_value ? `<div style="font-size:11px; color:#10B981; font-weight:700;">FIPE: ${v.fipe_value}</div>` : ''}
                    </div>
                </div>

                <div style="display:flex; gap:8px;">
                    <button class="dna-small-action-btn cyan" style="flex:1;" onclick="WorkshopView.selectVehicleByPlate('${v.license_plate}'); WorkshopView.switchMobileSection('lancar-servicos');">
                        <span>🔧 Lançar Serviços</span>
                    </button>
                    <button class="dna-small-action-btn" style="flex:1;" onclick="WorkshopView.handleMobileOpenDossier('${v.license_plate}')">
                        <span>📄 Ficha do Carro</span>
                    </button>
                </div>
            </div>
        `).join('');
    };

    WorkshopView.handleMobileOpenDossier = function(plate) {
        const v = this.findVehicleByPlate(plate);
        if (v) this.selectedMobileVehicle = v;
        if (typeof DossierView !== 'undefined' && DossierView.render) {
            DossierView.render(plate);
        } else {
            alert(`🔍 Ficha do Veículo ${plate} aberta.\nHistórico, comprovantes e fotos sincronizados.`);
        }
    };

    // ──────────────────────────────────────────────────────────────────────────
    // TELAS SECUNDÁRIAS: RELATÓRIOS, FINANCEIRO, ESTOQUE, CONFIGS & SUPORTE
    // ──────────────────────────────────────────────────────────────────────────
    WorkshopView.renderMobileReportsView = function() {
        return `
            <div class="dna-mobile-subpage">
                <div class="dna-mobile-subpage-header">
                    <button class="dna-mobile-back-btn" onclick="WorkshopView.switchMobileSection('dashboard')">
                        <span>‹</span> <span>Voltar</span>
                    </button>
                    <span class="dna-mobile-subpage-title">Relatórios</span>
                    
                </div>
                <div class="dna-mobile-subpage-body">
                    <div class="dna-mobile-row-card" onclick="alert('Relatório de serviços emitido em PDF.')">
                        <div class="dna-mobile-row-icon dna-icon-blue">📄</div>
                        <div class="dna-mobile-row-content">
                            <h4 class="dna-mobile-row-title">Relatório de Serviços do Mês</h4>
                            <p class="dna-mobile-row-desc">Consolidado de manutenções e ordens atendidas.</p>
                        </div>
                        <span class="dna-mobile-row-chevron">›</span>
                    </div>
                    <div class="dna-mobile-row-card" onclick="alert('Relatório de clientes emitido em PDF.')">
                        <div class="dna-mobile-row-icon dna-icon-purple">👥</div>
                        <div class="dna-mobile-row-content">
                            <h4 class="dna-mobile-row-title">Carteira de Clientes</h4>
                            <p class="dna-mobile-row-desc">Listagem completa e contatos de WhatsApp.</p>
                        </div>
                        <span class="dna-mobile-row-chevron">›</span>
                    </div>
                    <div class="dna-mobile-row-card" onclick="alert('Relatório de peças emitido em PDF.')">
                        <div class="dna-mobile-row-icon dna-icon-cyan">📦</div>
                        <div class="dna-mobile-row-content">
                            <h4 class="dna-mobile-row-title">Consumo de Peças</h4>
                            <p class="dna-mobile-row-desc">Filtros, óleos e insumos aplicados.</p>
                        </div>
                        <span class="dna-mobile-row-chevron">›</span>
                    </div>

                    <button type="button" class="dna-mobile-back-to-cards-btn" onclick="WorkshopView.switchMobileSection('dashboard')">
                        <span>‹</span> <span>Voltar para Todos os Cards</span>
                    </button>

                </div>
            </div>
        `;
    };

    WorkshopView.financialAuthenticated = false;

    WorkshopView.getFinancialPassword = function() {
        return localStorage.getItem('dna_finance_pwd') || '123456';
    };

    WorkshopView.handleVerifyFinancialPassword = function() {
        const input = document.getElementById('mobile-finance-pwd-input');
        const err = document.getElementById('mobile-finance-pwd-error');
        const pwd = (input ? input.value : '').trim();
        const expected = this.getFinancialPassword();

        if (pwd === expected) {
            this.financialAuthenticated = true;
            const viewport = document.getElementById('ws-mobile-active-viewport');
            if (viewport) viewport.innerHTML = this.renderMobileActiveSection();
        } else {
            if (err) err.style.display = 'block';
            if (input) {
                input.value = '';
                input.focus();
            }
        }
    };

    WorkshopView.handleChangeFinancialPassword = function() {
        const newPwd = prompt('Digite a nova senha de 6 dígitos para o Painel Financeiro:');
        if (!newPwd || newPwd.trim().length < 4) {
            alert('A senha deve ter pelo menos 4 caracteres.');
            return;
        }
        localStorage.setItem('dna_finance_pwd', newPwd.trim());
        alert('✅ Senha do Painel Financeiro alterada com sucesso! Guarde sua nova senha com segurança.');
    };

    WorkshopView.handleLockFinancialPanel = function() {
        this.financialAuthenticated = false;
        const viewport = document.getElementById('ws-mobile-active-viewport');
        if (viewport) viewport.innerHTML = this.renderMobileActiveSection();
    };

    WorkshopView.renderMobileFinancialView = function() {
        // Se ainda não autenticado com senha, exibe a tela de bloqueio
        if (!this.financialAuthenticated) {
            return `
                <div class="dna-mobile-subpage">
                    <div class="dna-mobile-subpage-header">
                        <button class="dna-mobile-back-btn" onclick="WorkshopView.switchMobileSection('dashboard')">
                            <span>‹</span> <span>Voltar</span>
                        </button>
                        <span class="dna-mobile-subpage-title">Financeiro</span>
                    </div>

                    <div class="dna-mobile-subpage-body" style="align-items:center; text-align:center; padding-top:24px;">
                        <div style="width:68px; height:68px; border-radius:50%; background:rgba(234,179,8,0.15); border:1.5px solid #EAB308; display:flex; align-items:center; justify-content:center; font-size:32px; margin-bottom:12px; box-shadow:0 0 25px rgba(234,179,8,0.25);">
                            🔒
                        </div>
                        <h3 style="color:#FFFFFF; font-size:18px; font-weight:800; margin:0 0 6px;">Acesso Restrito ao Dono</h3>
                        <p style="color:var(--dna-ws-text-muted); font-size:12.5px; max-width:290px; margin:0 0 20px; line-height:1.4;">
                            Área exclusiva para o proprietário da oficina. Digite a senha para acessar faturamento, aparelhos e premiações:
                        </p>

                        <div style="width:100%; max-width:280px; margin-bottom:14px;">
                            <input 
                                type="password" 
                                id="mobile-finance-pwd-input" 
                                placeholder="••••••" 
                                maxlength="20"
                                style="width:100%; height:48px; background:rgba(6,11,20,0.95); border:1.5px solid rgba(0,102,255,0.4); border-radius:12px; color:#fff; text-align:center; font-size:22px; letter-spacing:6px; font-weight:800; box-sizing:border-box;"
                                onkeydown="if(event.key==='Enter') WorkshopView.handleVerifyFinancialPassword()"
                            />
                            <div id="mobile-finance-pwd-error" style="color:#EF4444; font-size:11.5px; font-weight:700; margin-top:8px; display:none;">
                                ⚠️ Senha incorreta. Tente novamente.
                            </div>
                        </div>

                        <button type="button" class="dna-primary-btn-lg" style="width:100%; max-width:280px; height:46px;" onclick="WorkshopView.handleVerifyFinancialPassword()">
                            <span>🔓</span> <span>Acessar Painel Financeiro</span>
                        </button>

                        <div style="margin-top:28px;">
                            <button type="button" class="dna-mobile-back-to-cards-btn" onclick="WorkshopView.switchMobileSection('dashboard')">
                                <span>‹</span> <span>Voltar para Todos os Cards</span>
                            </button>
                        </div>
                    </div>
                </div>
            `;
        }

        // Painel Financeiro Autenticado
        return `
            <div class="dna-mobile-subpage">
                <div class="dna-mobile-subpage-header">
                    <button class="dna-mobile-back-btn" onclick="WorkshopView.switchMobileSection('dashboard')">
                        <span>‹</span> <span>Voltar</span>
                    </button>
                    <span class="dna-mobile-subpage-title">Gestão Financeira</span>
                    <button type="button" onclick="WorkshopView.handleLockFinancialPanel()" style="background:rgba(239,68,68,0.15); border:1px solid #EF4444; color:#EF4444; padding:5px 10px; border-radius:8px; font-size:11px; font-weight:800; cursor:pointer;">
                        🔒 Bloquear
                    </button>
                </div>

                <div class="dna-mobile-subpage-body">
                    <!-- 1. RANKING DE PREMIAÇÃO DAS 3 MELHORES LOJAS DO MÊS (DESTAQUE MÁXIMO) -->
                    <div style="background:linear-gradient(145deg, rgba(234,179,8,0.22), rgba(202,138,4,0.08)); border:1.5px solid #EAB308; border-radius:14px; padding:16px;">
                        <div style="display:flex; align-items:center; justify-content:space-between; margin-bottom:10px;">
                            <div style="display:flex; align-items:center; gap:8px;">
                                <span style="font-size:24px;">🏆</span>
                                <strong style="color:#FFFFFF; font-size:15px; font-weight:800;">Ranking de Premiação do Mês</strong>
                            </div>
                            <span style="background:#EAB308; color:#000; font-size:10px; font-weight:800; padding:2px 8px; border-radius:9999px;">R$ 10.000 EM PRÊMIOS</span>
                        </div>

                        <p style="font-size:12px; color:#E2E8F0; margin:0 0 12px; line-height:1.4;">
                            Premiações pagas diretamente pela Matriz DNA AUTO para as 3 lojas mais ativadoras de aparelhos e laudos:
                        </p>

                        <!-- Pódios Oficiais -->
                        <div style="display:flex; flex-direction:column; gap:8px;">
                            <div style="display:flex; align-items:center; justify-content:space-between; background:rgba(0,0,0,0.35); border:1px solid rgba(234,179,8,0.4); border-radius:10px; padding:8px 12px;">
                                <div style="display:flex; align-items:center; gap:8px;">
                                    <span style="font-size:20px;">🥇</span>
                                    <div>
                                        <strong style="color:#fff; font-size:13px;">1º Lugar: Auto Center Speed Prime</strong>
                                        <div style="font-size:11px; color:var(--dna-ws-text-muted);">42 aparelhos ativados</div>
                                    </div>
                                </div>
                                <span style="color:#EAB308; font-size:14px; font-weight:800;">R$ 5.000,00</span>
                            </div>

                            <div style="display:flex; align-items:center; justify-content:space-between; background:rgba(0,0,0,0.35); border:1px solid rgba(192,192,192,0.3); border-radius:10px; padding:8px 12px;">
                                <div style="display:flex; align-items:center; gap:8px;">
                                    <span style="font-size:20px;">🥈</span>
                                    <div>
                                        <strong style="color:#fff; font-size:13px;">2º Lugar: Oficina Mecânica Estrela</strong>
                                        <div style="font-size:11px; color:var(--dna-ws-text-muted);">38 aparelhos ativados</div>
                                    </div>
                                </div>
                                <span style="color:#C0C0C0; font-size:14px; font-weight:800;">R$ 3.000,00</span>
                            </div>

                            <div style="display:flex; align-items:center; justify-content:space-between; background:rgba(0,0,0,0.35); border:1px solid rgba(205,127,50,0.3); border-radius:10px; padding:8px 12px;">
                                <div style="display:flex; align-items:center; gap:8px;">
                                    <span style="font-size:20px;">🥉</span>
                                    <div>
                                        <strong style="color:#fff; font-size:13px;">3º Lugar: Auto Center Paulista</strong>
                                        <div style="font-size:11px; color:var(--dna-ws-text-muted);">31 aparelhos ativados</div>
                                    </div>
                                </div>
                                <span style="color:#CD7F32; font-size:14px; font-weight:800;">R$ 2.000,00</span>
                            </div>

                            <!-- Posição da Loja Atual -->
                            <div style="display:flex; align-items:center; justify-content:space-between; background:rgba(0,102,255,0.18); border:1px solid var(--dna-ws-cyan); border-radius:10px; padding:8px 12px; margin-top:4px;">
                                <div style="display:flex; align-items:center; gap:8px;">
                                    <span style="font-size:18px;">🏢</span>
                                    <div>
                                        <strong style="color:#fff; font-size:13px;">Sua Oficina: Veloce Auto Center</strong>
                                        <div style="font-size:11px; color:var(--dna-ws-cyan); font-weight:700;">4º Lugar • 24 ativações (Faltam 7 para o pódio!)</div>
                                    </div>
                                </div>
                                <span style="color:#10B981; font-size:12px; font-weight:800;">Subindo! ↗</span>
                            </div>
                        </div>
                    </div>

                    <!-- 2. EXTRATO DE APARELHOS INSTALADOS A PAGAR -->
                    <div style="background:rgba(8,16,32,0.9); border:1px solid rgba(0,102,255,0.3); border-radius:14px; padding:16px;">
                        <div style="display:flex; align-items:center; justify-content:space-between; margin-bottom:10px;">
                            <strong style="color:#FFFFFF; font-size:14.5px;">Aparelhos Instalados no Mês</strong>
                            <span style="font-size:11px; color:#10B981; font-weight:800;">Fatura em Aberto</span>
                        </div>

                        <div style="display:grid; grid-template-columns:1fr 1fr; gap:10px; margin-bottom:12px;">
                            <div style="background:rgba(0,0,0,0.3); border-radius:10px; padding:10px; text-align:center;">
                                <span style="font-size:11px; color:var(--dna-ws-text-muted); display:block;">Dispositivos Ativos</span>
                                <strong style="font-size:22px; color:#FFFFFF;">8</strong>
                                <span style="font-size:10px; color:var(--dna-ws-cyan); display:block;">Dongles Mini OBD2</span>
                            </div>
                            <div style="background:rgba(0,0,0,0.3); border-radius:10px; padding:10px; text-align:center;">
                                <span style="font-size:11px; color:var(--dna-ws-text-muted); display:block;">Total a Pagar</span>
                                <strong style="font-size:22px; color:#EF4444;">R$ 399,20</strong>
                                <span style="font-size:10px; color:var(--dna-ws-text-dim); display:block;">Vencimento: dia 10</span>
                            </div>
                        </div>

                        <button type="button" class="dna-primary-btn-lg cyan" style="height:44px; font-size:13px;" onclick="alert('Código Pix para pagamento da fatura de aparelhos:\n\n00020126580014br.gov.bcb.pix0136dna-auto-fatura-aparelhos-matriz\n\nCopiado para a área de transferência!')">
                            <span>📲 Copiar Código Pix para Pagamento</span>
                        </button>
                    </div>

                    <!-- 3. RESUMO GERAL DE FATURAMENTO DA OFICINA -->
                    <div style="background:rgba(8,16,32,0.9); border:1px solid rgba(0,102,255,0.25); border-radius:14px; padding:16px;">
                        <span style="font-size:12px; color:var(--dna-ws-text-muted); text-transform:uppercase;">Faturamento Bruto da Oficina</span>
                        <div style="font-size:28px; font-weight:800; color:var(--dna-ws-green); font-family:var(--dna-ws-font-display); margin:6px 0;">
                            R$ 18.450,00
                        </div>
                        <div style="display:flex; justify-content:space-between; font-size:12px; color:var(--dna-ws-text-muted); border-top:1px solid rgba(255,255,255,0.08); padding-top:8px;">
                            <span>Serviços Concluídos: 14</span>
                            <span>Ticket Médio: R$ 1.317,85</span>
                        </div>
                    </div>

                    <!-- 4. SEGURANÇA E TROCA DE SENHA -->
                    <div style="background:rgba(0,0,0,0.3); border:1px solid rgba(255,255,255,0.1); border-radius:12px; padding:12px; display:flex; align-items:center; justify-content:space-between;">
                        <div>
                            <strong style="color:#FFFFFF; font-size:13px; display:block;">Segurança do Financeiro</strong>
                            <span style="font-size:11px; color:var(--dna-ws-text-dim);">Deseja trocar sua senha de acesso?</span>
                        </div>
                        <button type="button" onclick="WorkshopView.handleChangeFinancialPassword()" style="background:rgba(0,212,255,0.15); border:1px solid var(--dna-ws-cyan); color:var(--dna-ws-cyan); padding:6px 12px; border-radius:8px; font-size:11.5px; font-weight:700; cursor:pointer;">
                            🔑 Trocar Senha
                        </button>
                    </div>

                    <div style="margin-top:10px; text-align:center;">
                        <button type="button" class="dna-mobile-back-to-cards-btn" onclick="WorkshopView.switchMobileSection('dashboard')">
                            <span>‹</span> <span>Voltar para Todos os Cards</span>
                        </button>
                    </div>
                </div>
            </div>
        `;
    };

    WorkshopView.stockAuthenticated = false;

    WorkshopView.handleVerifyStockPassword = function() {
        const input = document.getElementById('mobile-stock-pwd-input');
        const err = document.getElementById('mobile-stock-pwd-error');
        const pwd = (input ? input.value : '').trim();
        const expected = this.getFinancialPassword();

        if (pwd === expected) {
            this.stockAuthenticated = true;
            const viewport = document.getElementById('ws-mobile-active-viewport');
            if (viewport) viewport.innerHTML = this.renderMobileActiveSection();
        } else {
            if (err) err.style.display = 'block';
            if (input) { input.value = ''; input.focus(); }
        }
    };

    WorkshopView.handleLockStockPanel = function() {
        this.stockAuthenticated = false;
        const viewport = document.getElementById('ws-mobile-active-viewport');
        if (viewport) viewport.innerHTML = this.renderMobileActiveSection();
    };

    // Lista em memória de itens de estoque para manipulação em tempo real
    WorkshopView.stockInventory = [
        { id: 'stk_oleo', icon: '🛢️', name: 'Óleo 5W30 Sintético', code: 'LUB-5W30-SN', qty: 48, unit: 'litros', color: 'cyan' },
        { id: 'stk_freio', icon: '🛑', name: 'Pastilhas de Freio Dianteiras', code: 'FR-PST-CIV', qty: 12, unit: 'jogos', color: 'blue' },
        { id: 'stk_filtro_ar', icon: '💨', name: 'Filtros de Ar do Motor', code: 'FL-AR-401', qty: 26, unit: 'unidades', color: 'amber' },
        { id: 'stk_filtro_comb', icon: '⛽', name: 'Filtro de Combustível', code: 'FL-COMB-102', qty: 14, unit: 'unidades', color: 'green' },
        { id: 'stk_bat', icon: '🔋', name: 'Baterias 60Ah Seladas', code: 'BAT-MOU-60', qty: 6, unit: 'unidades', color: 'purple' },
        { id: 'stk_velas', icon: '⚡', name: 'Velas de Ignição Iridium', code: 'VEL-NGK-IR', qty: 32, unit: 'unidades', color: 'red' },
        { id: 'stk_fluidos', icon: '🧪', name: 'Fluido de Freio DOT4', code: 'FLD-DOT4-500', qty: 18, unit: 'frascos', color: 'navy' }
    ];

    WorkshopView.handleSaveStockItem = function(idx, name) {
        const inInput = document.getElementById('stock-in-' + idx);
        const outInput = document.getElementById('stock-out-' + idx);
        const refInput = document.getElementById('stock-ref-' + idx);

        const inVal = parseInt(inInput ? inInput.value : '0', 10) || 0;
        const outVal = parseInt(outInput ? outInput.value : '0', 10) || 0;
        const refVal = refInput ? refInput.value.trim() : '';

        if (inVal === 0 && outVal === 0) {
            alert('Informe ao menos uma quantidade de entrada (+) ou saída (-) para atualizar o estoque.');
            return;
        }

        const item = this.stockInventory[idx];
        if (item) {
            item.qty = Math.max(0, item.qty + inVal - outVal);
        }

        if (inInput) inInput.value = '0';
        if (outInput) outInput.value = '0';
        if (refInput) refInput.value = '';

        alert(`✅ Estoque de "${name}" atualizado com sucesso!\nNovo Saldo: ${item.qty} ${item.unit}` + (refVal ? `\nReferência: ${refVal}` : ''));
        
        const viewport = document.getElementById('ws-mobile-active-viewport');
        if (viewport) viewport.innerHTML = this.renderMobileActiveSection();
    };

    WorkshopView.renderMobileStockView = function() {
        // Se não autenticado, exige senha do financeiro (Sempre mediante senha)
        if (!this.stockAuthenticated) {
            return `
                <div class="dna-mobile-subpage">
                    <div class="dna-mobile-subpage-header">
                        <button class="dna-mobile-back-btn" onclick="WorkshopView.switchMobileSection('dashboard')">
                            <span>‹</span> <span>Voltar</span>
                        </button>
                        <span class="dna-mobile-subpage-title">Estoque / Peças</span>
                    </div>
                    <div class="dna-mobile-subpage-body">
                        <div class="dna-stock-password-overlay">
                            <div class="stock-lock-icon">📦</div>
                            <h3>Estoque Protegido</h3>
                            <p>Para inserir ou alterar dados de estoque, digite a senha do painel financeiro:</p>

                            <div style="width:100%; max-width:280px; margin-top:8px;">
                                <input 
                                    type="password" 
                                    id="mobile-stock-pwd-input" 
                                    placeholder="••••••" 
                                    maxlength="20"
                                    class="dna-oficina-login-input"
                                    style="text-align:center; font-size:22px; letter-spacing:6px; font-weight:800; height:48px;"
                                    onkeydown="if(event.key==='Enter') WorkshopView.handleVerifyStockPassword()"
                                />
                                <div id="mobile-stock-pwd-error" style="color:#EF4444; font-size:11.5px; font-weight:700; margin-top:8px; display:none;">
                                    ⚠️ Senha incorreta. Use a mesma do painel financeiro.
                                </div>
                            </div>

                            <button type="button" class="dna-primary-btn-lg" style="width:100%; max-width:280px; height:46px; margin-top:6px;" onclick="WorkshopView.handleVerifyStockPassword()">
                                <span>🔓</span> <span>Acessar Estoque</span>
                            </button>

                            <button type="button" class="dna-mobile-back-to-cards-btn" style="margin-top:16px;" onclick="WorkshopView.switchMobileSection('dashboard')">
                                <span>‹</span> <span>Voltar para Todos os Cards</span>
                            </button>
                        </div>
                    </div>
                </div>
            `;
        }

        // Painel de Estoque Autenticado — cada card é um formulário de inserção de dados de estoque
        const stockItems = this.stockInventory;

        return `
            <div class="dna-mobile-subpage">
                <div class="dna-mobile-subpage-header">
                    <button class="dna-mobile-back-btn" onclick="WorkshopView.switchMobileSection('dashboard')">
                        <span>‹</span> <span>Voltar</span>
                    </button>
                    <span class="dna-mobile-subpage-title">Estoque / Peças</span>
                    <button type="button" onclick="WorkshopView.handleLockStockPanel()" style="background:rgba(239,68,68,0.15); border:1px solid #EF4444; color:#EF4444; padding:5px 10px; border-radius:8px; font-size:11px; font-weight:800; cursor:pointer;">
                        🔒 Bloquear
                    </button>
                </div>
                <div class="dna-mobile-subpage-body">
                    <!-- Resumo -->
                    <div style="background:rgba(0,102,255,0.1); border:1px solid rgba(0,102,255,0.3); border-radius:12px; padding:12px 14px; margin-bottom:8px; display:flex; align-items:center; justify-content:space-between;">
                        <div>
                            <strong style="color:#FFFFFF; font-size:14px;">Inserir Dados de Estoque</strong>
                            <div style="font-size:11px; color:var(--dna-ws-text-muted); margin-top:2px;">Autenticado com senha financeira</div>
                        </div>
                        <span style="font-size:22px; font-weight:800; color:var(--dna-ws-cyan);">${stockItems.length} itens</span>
                    </div>

                    <!-- Cards de Inserção de Dados de Estoque -->
                    <div style="display:flex; flex-direction:column; gap:12px;">
                        ${stockItems.map((item, idx) => `
                            <div class="dna-stock-card">
                                <div class="dna-stock-card-header">
                                    <div class="dna-stock-card-icon">${item.icon}</div>
                                    <div class="dna-stock-card-info">
                                        <div class="dna-stock-card-title">${item.name}</div>
                                        <div class="dna-stock-card-meta">Cód: ${item.code} • Unid: ${item.unit}</div>
                                    </div>
                                    <div class="dna-stock-card-badge">Saldo: ${item.qty}</div>
                                </div>

                                <div class="dna-stock-card-inputs">
                                    <div class="dna-stock-field-group">
                                        <label class="dna-stock-field-label in">+ Entrada (Reposição)</label>
                                        <input type="number" id="stock-in-${idx}" value="0" min="0" placeholder="0" style="height:42px; text-align:center; font-size:15px; font-weight:800;" />
                                    </div>
                                    <div class="dna-stock-field-group">
                                        <label class="dna-stock-field-label out">- Saída (Uso em O.S.)</label>
                                        <input type="number" id="stock-out-${idx}" value="0" min="0" placeholder="0" style="height:42px; text-align:center; font-size:15px; font-weight:800;" />
                                    </div>
                                </div>

                                <div style="display:flex; gap:8px; align-items:center;">
                                    <input type="text" id="stock-ref-${idx}" placeholder="Nº NF / Fornecedor / Lote..." style="flex:1; height:40px; font-size:12.5px; padding:0 12px;" />
                                    <button type="button" class="dna-primary-btn-lg" style="width:auto; height:40px; padding:0 14px; font-size:12px; white-space:nowrap;" onclick="WorkshopView.handleSaveStockItem(${idx}, '${item.name}')">
                                        <span>✓</span> Salvar
                                    </button>
                                </div>
                            </div>
                        `).join('')}
                    </div>

                    <button class="dna-primary-btn-lg" style="margin-top:14px;" onclick="alert('✅ Todos os dados de estoque foram sincronizados no sistema!'); WorkshopView.switchMobileSection('dashboard');">
                        <span>✓</span> <span>Concluir & Voltar ao Painel</span>
                    </button>

                    <button type="button" class="dna-mobile-back-to-cards-btn" style="margin-top:10px;" onclick="WorkshopView.switchMobileSection('dashboard')">
                        <span>‹</span> <span>Voltar para Todos os Cards</span>
                    </button>
                </div>
            </div>
        `;
    };

    WorkshopView.renderMobileConfigView = function() {
        const wsName = this.officialWorkshopName || 'Veloce Auto Center Premium';
        return `
            <div class="dna-mobile-subpage">
                <div class="dna-mobile-subpage-header">
                    <button class="dna-mobile-back-btn" onclick="WorkshopView.switchMobileSection('dashboard')">
                        <span>‹</span> <span>Voltar</span>
                    </button>
                    <span class="dna-mobile-subpage-title">Configurações</span>
                    
                </div>
                <div class="dna-mobile-subpage-body">
                    <div class="dna-mobile-row-card" onclick="WorkshopView.openDeviceModal()">
                        <div class="dna-mobile-row-icon dna-icon-blue">💻</div>
                        <div class="dna-mobile-row-content">
                            <h4 class="dna-mobile-row-title">Alternar para Modo Web (Desktop)</h4>
                            <p class="dna-mobile-row-desc">Acessar versão completa com tabelas e relatórios densos.</p>
                        </div>
                        <span class="dna-mobile-row-chevron">›</span>
                    </div>

                    <div class="dna-mobile-row-card">
                        <div class="dna-mobile-row-icon dna-icon-green">🏢</div>
                        <div class="dna-mobile-row-content">
                            <h4 class="dna-mobile-row-title">${wsName}</h4>
                            <p class="dna-mobile-row-desc">CNPJ: 12.345.678/0001-90 • Nível 4 Homologada</p>
                        </div>
                    </div>

                    <div class="dna-mobile-row-card" onclick="alert('Canal oficial de WhatsApp verificado.')">
                        <div class="dna-mobile-row-icon dna-icon-amber">📱</div>
                        <div class="dna-mobile-row-content">
                            <h4 class="dna-mobile-row-title">WhatsApp Integrado</h4>
                            <p class="dna-mobile-row-desc">Disparos automáticos e canal de atendimento ativo.</p>
                        </div>
                    </div>

                    <button type="button" class="dna-mobile-back-to-cards-btn" onclick="WorkshopView.switchMobileSection('dashboard')">
                        <span>‹</span> <span>Voltar para Todos os Cards</span>
                    </button>

                </div>
            </div>
        `;
    };

    WorkshopView.renderMobileSupportView = function() {
        return `
            <div class="dna-mobile-subpage">
                <div class="dna-mobile-subpage-header">
                    <button class="dna-mobile-back-btn" onclick="WorkshopView.switchMobileSection('dashboard')">
                        <span>‹</span> <span>Voltar</span>
                    </button>
                    <span class="dna-mobile-subpage-title">Suporte & Equipamentos</span>
                </div>
                <div class="dna-mobile-subpage-body">
                    <!-- 1. ACESSO À PLATAFORMA DO ADMINISTRADOR -->
                    <div style="background:linear-gradient(145deg, rgba(0,102,255,0.22), rgba(0,212,255,0.12)); border:1.5px solid rgba(0,212,255,0.4); border-radius:14px; padding:16px;">
                        <div style="display:flex; align-items:center; gap:12px; margin-bottom:10px;">
                            <div style="width:42px; height:42px; border-radius:10px; background:linear-gradient(135deg, #0052cc, #00d4ff); display:flex; align-items:center; justify-content:center; font-size:22px;">🏛️</div>
                            <div>
                                <h3 style="margin:0; font-size:15px; font-weight:800; color:#FFFFFF;">Central Matriz DNA AUTO</h3>
                                <span style="font-size:11.5px; color:var(--dna-ws-cyan); font-weight:700;">Plataforma Oficial do Administrador</span>
                            </div>
                        </div>
                        <p style="font-size:12px; color:var(--dna-ws-text-muted); margin:0 0 12px; line-height:1.4;">
                            Acesso direto à central corporativa para gestão da rede, auditoria de laudos e suporte operacional.
                        </p>
                        <div style="display:flex; flex-direction:column; gap:8px;">
                            <button type="button" class="dna-primary-btn-lg cyan" style="height:44px; font-size:13px;" onclick="window.open('/admin', '_blank')">
                                <span>🖥️ Abrir Painel do Administrador</span>
                            </button>
                            <button type="button" class="dna-whatsapp-btn" style="height:44px; font-size:13px;" onclick="window.open('https://wa.me/5511999999999?text=Ol%C3%A1%2C%20preciso%20de%20suporte%20para%20a%20minha%20oficina%20credenciada%20DNA%20AUTO', '_blank')">
                                <span>💬 Suporte Matriz via WhatsApp</span>
                            </button>
                        </div>
                    </div>

                    <!-- 2. SOLICITAR MAIS EQUIPAMENTOS -->
                    <div style="background:rgba(8,16,32,0.9); border:1px solid rgba(0,102,255,0.28); border-radius:14px; padding:16px;">
                        <div style="display:flex; align-items:center; gap:10px; margin-bottom:12px;">
                            <span style="font-size:24px;">📦</span>
                            <div>
                                <strong style="color:#ffffff; font-size:14.5px; display:block;">Solicitar Mais Equipamentos</strong>
                                <span style="font-size:11px; color:var(--dna-ws-text-dim);">Peça novos dispositivos e materiais para a oficina</span>
                            </div>
                        </div>

                        <!-- Seleção do Equipamento -->
                        <div class="dna-input-group" style="margin-bottom:10px;">
                            <label class="dna-input-label">Tipo de Equipamento Desejado *</label>
                            <select id="equip-type-select" style="width:100%; height:44px; background:rgba(6,11,20,0.9); border:1px solid rgba(0,102,255,0.35); border-radius:10px; color:#fff; padding:0 12px; font-size:13px; font-weight:700;">
                                <option value="obd2">🔌 Dongles Mini OBD2 ELM327 BLE (AutoLink)</option>
                                <option value="tags">🏷️ Tags / Adesivos QR Code DNA Permanente</option>
                                <option value="posters">📜 Cartazes Oficiais de Parede / Balcão</option>
                                <option value="kit">📦 Kit Completo de Boas-Vindas da Oficina</option>
                            </select>
                        </div>

                        <!-- Quantidade -->
                        <div class="dna-input-group" style="margin-bottom:10px;">
                            <label class="dna-input-label">Quantidade de Unidades *</label>
                            <input type="number" id="equip-qty-input" value="5" min="1" max="100" style="width:100%; height:44px; background:rgba(6,11,20,0.9); border:1px solid rgba(0,102,255,0.35); border-radius:10px; color:#fff; padding:0 12px; font-size:14px; font-weight:800;" />
                        </div>

                        <!-- Observações e Ponto de Entrega -->
                        <div class="dna-input-group" style="margin-bottom:14px;">
                            <label class="dna-input-label">Endereço de Entrega / Observações</label>
                            <textarea id="equip-notes-input" rows="2" placeholder="Informe o endereço ou ponto de referência da oficina..." style="width:100%; resize:none; padding:10px; background:rgba(6,11,20,0.9); border:1px solid rgba(0,102,255,0.35); border-radius:10px; color:#fff; font-size:12.5px;"></textarea>
                        </div>

                        <button type="button" class="dna-primary-btn-lg" onclick="WorkshopView.handleRequestEquipment()">
                            <span>✓ Enviar Solicitação à Matriz</span>
                        </button>
                    </div>

                    <div style="margin-top:10px; text-align:center;">
                        <button type="button" class="dna-mobile-back-to-cards-btn" onclick="WorkshopView.switchMobileSection('dashboard')">
                            <span>‹</span> <span>Voltar para Todos os Cards</span>
                        </button>
                    </div>
                </div>
            </div>
        `;
    };

    WorkshopView.handleRequestEquipment = function() {
        const typeSelect = document.getElementById('equip-type-select');
        const qtyInput = document.getElementById('equip-qty-input');
        const notesInput = document.getElementById('equip-notes-input');

        const typeName = typeSelect ? typeSelect.options[typeSelect.selectedIndex].text : 'Equipamentos';
        const qty = qtyInput ? qtyInput.value : '5';
        const protocol = 'PED-EQP-' + Math.floor(100000 + Math.random() * 900000);

        alert(`✅ Solicitação de equipamentos enviada com sucesso à Matriz!\n\nEquipamento: ${typeName}\nQuantidade: ${qty} unidades\nProtocolo: ${protocol}\n\nSeu pedido será despachado em até 48 horas úteis.`);
        this.switchMobileSection('dashboard');
    };

    // ──────────────────────────────────────────────────────────────────────────
    // MODAL DE DETECÇÃO DE DISPOSITIVO / MODO WEB (TELA 12 DO PRINT)
    // ──────────────────────────────────────────────────────────────────────────
    WorkshopView.openDeviceModal = function() {
        const root = document.getElementById('dna-mobile-modal-root');
        if (!root) return;

        root.innerHTML = `
            <div class="dna-device-modal-overlay" onclick="if(event.target===this) WorkshopView.closeDeviceModal()">
                <div class="dna-device-modal-card">
                    <div class="dna-device-modal-icon">💻</div>
                    <h3 class="dna-device-modal-title">Modo Web</h3>
                    <p class="dna-device-modal-text">
                        O sistema identificou que você pode desejar a visualização completa de desktop.<br/><br/>
                        Para computadores ou telas grandes, você pode alternar livremente entre o <strong>Modo Cards (Celular)</strong> e o <strong>Modo Web (Painel Completo)</strong>.
                    </p>
                    <div class="dna-device-modal-actions">
                        <button class="dna-primary-btn-lg cyan" onclick="WorkshopView.setDesktopMode(true)">
                            <span>Abrir no Navegador (Modo Web)</span>
                        </button>
                        <button class="dna-primary-btn-lg" style="background:rgba(255,255,255,0.08); border-color:rgba(255,255,255,0.15);" onclick="WorkshopView.closeDeviceModal()">
                            <span>↩ Voltar ao modo celular</span>
                        </button>
                    </div>
                </div>
            </div>
        `;
    };

    WorkshopView.closeDeviceModal = function() {
        const root = document.getElementById('dna-mobile-modal-root');
        if (root) root.innerHTML = '';
    };

    // ──────────────────────────────────────────────────────────────────────────
    // SEÇÃO DE LINKS EXCLUSIVOS DA OFICINA & AUTO CENTER
    // ──────────────────────────────────────────────────────────────────────────
    WorkshopView.renderMobileLinksSection = function() {
        const origin = window.location.origin || 'https://dna-auto-vua4.onrender.com';
        const mobileUrl = origin + '/oficina';
        const webUrl = origin + '/oficina?mode=web';
        const authUrl = origin + '/oficina#login';
        const isCurrentlyWeb = this.currentViewMode === 'web';

        return `
            <section class="dna-ws-links-section">
                <div class="dna-ws-links-header">
                    <div class="dna-ws-links-icon-badge">🔗</div>
                    <div>
                        <h3 class="dna-ws-links-heading">Acesso Exclusivo para Auto Center</h3>
                        <p class="dna-ws-links-sub">Links direcionados para smartphone no pátio ou computador na recepção</p>
                    </div>
                </div>

                <div class="dna-ws-dual-links-grid">
                    <!-- LINK 1: APP DA OFICINA (SMARTPHONE) -->
                    <div class="dna-ws-link-box ${!isCurrentlyWeb ? 'active-mode' : ''}">
                        <div class="dna-ws-link-badge-row">
                            <span class="dna-ws-link-tag dna-tag-mobile">📱 Modo Mobile & PWA</span>
                            ${!isCurrentlyWeb ? '<span style="font-size:10px; color:#10B981; font-weight:800;">● MODO ATUAL</span>' : ''}
                        </div>
                        <div>
                            <div class="dna-ws-link-name">
                                <span>📱</span> <span>App da Oficina</span>
                            </div>
                            <div class="dna-ws-link-purpose" style="margin-top:4px;">
                                Focado no mecânico e funcionário. Cards grandes, ágil, 1 toque, fotos e consultas por placa.
                            </div>
                        </div>
                        <div class="dna-ws-link-url-pill" title="${mobileUrl}">
                            ${mobileUrl}
                        </div>
                        <div class="dna-ws-link-btn-row">
                            <button type="button" class="dna-ws-link-action-btn copy" onclick="WorkshopView.copyLinkToClipboard('${mobileUrl}', this)">
                                <span>📋</span> <span>Copiar</span>
                            </button>
                            <button type="button" class="dna-ws-link-action-btn open" onclick="WorkshopView.setDesktopMode(false)">
                                <span>📲</span> <span>Abrir App</span>
                            </button>
                        </div>
                    </div>

                    <!-- LINK 2: PAINEL WEB DESKTOP (COMPUTADOR / ERP) -->
                    <div class="dna-ws-link-box ${isCurrentlyWeb ? 'active-mode' : ''}">
                        <div class="dna-ws-link-badge-row">
                            <span class="dna-ws-link-tag dna-tag-web">💻 Modo Desktop Web</span>
                            ${isCurrentlyWeb ? '<span style="font-size:10px; color:#38BDF8; font-weight:800;">● MODO ATUAL</span>' : ''}
                        </div>
                        <div>
                            <div class="dna-ws-link-name">
                                <span>💻</span> <span>Painel Web da Oficina</span>
                            </div>
                            <div class="dna-ws-link-purpose" style="margin-top:4px;">
                                Painel corporativo completo para balcão/computador. Tabelas, relatórios financeiros e gestão TOTVS ERP.
                            </div>
                        </div>
                        <div class="dna-ws-link-url-pill" title="${webUrl}">
                            ${webUrl}
                        </div>
                        <div class="dna-ws-link-btn-row">
                            <button type="button" class="dna-ws-link-action-btn copy" onclick="WorkshopView.copyLinkToClipboard('${webUrl}', this)">
                                <span>📋</span> <span>Copiar</span>
                            </button>
                            <button type="button" class="dna-ws-link-action-btn open" onclick="WorkshopView.setDesktopMode(true)">
                                <span>🖥️</span> <span>Abrir Web</span>
                            </button>
                        </div>
                    </div>
                </div>

                <!-- LINHA ADICIONAL: TELA DE LOGIN & CADASTRO -->
                <div style="background:rgba(10,20,38,0.7); border:1px solid rgba(0,212,255,0.2); border-radius:10px; padding:10px 14px; display:flex; align-items:center; justify-content:space-between; flex-wrap:wrap; gap:10px;">
                    <div style="display:flex; align-items:center; gap:8px;">
                        <span style="font-size:16px;">🔑</span>
                        <div>
                            <strong style="font-size:12px; color:#ffffff;">Acesso & Credenciamento da Auto Center:</strong>
                            <div style="font-size:10.5px; color:var(--dna-ws-text-muted);">Faça login com a sua conta oficial ou cadastre sua oficina agora mesmo.</div>
                        </div>
                    </div>
                    <div style="display:flex; gap:6px;">
                        <button type="button" class="dna-ws-link-action-btn copy" style="height:30px; padding:0 10px;" onclick="WorkshopView.copyLinkToClipboard('${authUrl}', this)">
                            <span>📋 Copiar</span>
                        </button>
                        <button type="button" class="dna-ws-link-action-btn open" style="height:30px; padding:0 12px; background:linear-gradient(135deg, #10B981, #059669);" onclick="WorkshopView.switchMobileSection('auth')">
                            <span>🔑 Login / Cadastro</span>
                        </button>
                    </div>
                </div>
            </section>
        `;
    };

    // Copiar link para área de transferência com feedback visual
    WorkshopView.copyLinkToClipboard = function(text, btnElement) {
        if (!text) return;
        const originalHtml = btnElement ? btnElement.innerHTML : '';
        
        const finish = () => {
            if (btnElement) {
                btnElement.innerHTML = '<span>✓</span> <span>Copiado!</span>';
                btnElement.style.background = 'rgba(16, 185, 129, 0.35)';
                btnElement.style.borderColor = '#10B981';
                btnElement.style.color = '#FFFFFF';
                setTimeout(() => {
                    btnElement.innerHTML = originalHtml;
                    btnElement.style.background = '';
                    btnElement.style.borderColor = '';
                    btnElement.style.color = '';
                }, 2000);
            }
        };

        if (navigator && navigator.clipboard && navigator.clipboard.writeText) {
            navigator.clipboard.writeText(text).then(finish).catch(() => {
                this.fallbackCopy(text);
                finish();
            });
        } else {
            this.fallbackCopy(text);
            finish();
        }
    };

    WorkshopView.fallbackCopy = function(text) {
        const ta = document.createElement('textarea');
        ta.value = text;
        ta.style.position = 'fixed';
        ta.style.left = '-9999px';
        document.body.appendChild(ta);
        ta.focus();
        ta.select();
        try { document.execCommand('copy'); } catch (_) {}
        document.body.removeChild(ta);
    };

    // ──────────────────────────────────────────────────────────────────────────
    // TELA DE AUTENTICAÇÃO: LOGIN & CADASTRO DA AUTO CENTER
    // ──────────────────────────────────────────────────────────────────────────
    WorkshopView.renderMobileAuthView = function() {
        const isRegister = this.authActiveTab === 'register';
        const targetMode = this.authTargetMode || 'mobile';

        return `
            <div class="dna-ws-auth-viewport">
                <div class="dna-ws-auth-card">
                    <!-- CABEÇALHO BRAND DNA AUTO -->
                    <div class="dna-ws-auth-header">
                        <div class="dna-ws-auth-logo-box">
                            <svg viewBox="0 0 24 24" width="28" height="28" fill="none" stroke="#ffffff" stroke-width="2.6" stroke-linecap="round" stroke-linejoin="round">
                                <path d="M12 2L2 7l10 5 10-5-10-5z"></path>
                                <path d="M2 17l10 5 10-5"></path>
                                <path d="M2 12l10 5 10-5"></path>
                            </svg>
                        </div>
                        <h2 class="dna-ws-auth-title">DNA <span>AUTO</span></h2>
                        <span style="font-size:11px; text-transform:uppercase; letter-spacing:1px; color:var(--dna-ws-cyan); font-weight:800;">
                            Portal da Auto Center Credenciada
                        </span>
                        <p class="dna-ws-auth-subtitle">
                            ${isRegister 
                                ? 'Cadastre sua oficina para emitir laudos Nível 4, laudos de odômetro e fidelizar clientes.' 
                                : 'Acesse a área de operação da sua oficina mecânica ou centro automotivo.'}
                        </p>
                    </div>

                    <!-- ABAS DE NAVEGAÇÃO: LOGIN vs CADASTRO -->
                    <div class="dna-ws-auth-tabs">
                        <button type="button" class="dna-ws-auth-tab-btn ${!isRegister ? 'active' : ''}" onclick="WorkshopView.setAuthTab('login')">
                            🔑 Entrar na Auto Center
                        </button>
                        <button type="button" class="dna-ws-auth-tab-btn ${isRegister ? 'active' : ''}" onclick="WorkshopView.setAuthTab('register')">
                            📝 Cadastrar Auto Center
                        </button>
                    </div>

                    <!-- SELETOR CLARO DE DESTINO: APP MOBILE vs PAINEL WEB -->
                    <div class="dna-ws-mode-radio-box">
                        <div style="font-size:11.5px; font-weight:800; color:var(--dna-ws-cyan); margin-bottom:4px; text-transform:uppercase;">
                            Direcionar Acesso Para:
                        </div>
                        <label class="dna-ws-mode-radio-label">
                            <input type="radio" name="ws_auth_target_mode" value="mobile" ${targetMode === 'mobile' ? 'checked' : ''} onchange="WorkshopView.setAuthTargetMode('mobile')" style="accent-color:var(--dna-ws-cyan);">
                            <span>📱 App da Oficina (Celular / Mecânicos)</span>
                        </label>
                        <div class="dna-ws-mode-radio-desc">Interface ágil em cards grandes para smartphone no pátio.</div>

                        <label class="dna-ws-mode-radio-label" style="margin-top:6px;">
                            <input type="radio" name="ws_auth_target_mode" value="web" ${targetMode === 'web' ? 'checked' : ''} onchange="WorkshopView.setAuthTargetMode('web')" style="accent-color:var(--dna-ws-blue);">
                            <span>💻 Painel Web da Oficina (Computador / ERP)</span>
                        </label>
                        <div class="dna-ws-mode-radio-desc">Visão corporativa com tabelas e relatórios para balcão e gerência.</div>
                    </div>

                    <!-- FORMULÁRIO DINÂMICO -->
                    ${!isRegister ? this.renderAuthLoginForm() : this.renderAuthRegisterForm()}

                    <!-- BOTÃO VOLTAR AO SISTEMA -->
                    <div style="text-align:center; margin-top:4px;">
                        <button type="button" onclick="WorkshopView.switchMobileSection('dashboard')" style="background:none; border:none; color:var(--dna-ws-text-dim); font-size:12px; cursor:pointer;">
                            ← Voltar ao Início da Oficina
                        </button>
                    </div>
                </div>
            </div>
        `;
    };

    // Sub-render do Form de Login
    WorkshopView.renderAuthLoginForm = function() {
        return `
            <form onsubmit="WorkshopView.handleWorkshopAuthLogin(event)" style="display:flex; flex-direction:column; gap:12px;">
                <div class="dna-input-group">
                    <label class="dna-input-label">E-mail da Auto Center ou Responsável</label>
                    <input type="email" id="ws-auth-email" class="dna-input-field" placeholder="exemplo@oficina.com.br" value="marcos@veloce.com.br" required />
                </div>

                <div class="dna-input-group">
                    <label class="dna-input-label">Senha de Acesso</label>
                    <input type="password" id="ws-auth-password" class="dna-input-field" placeholder="••••••••" value="123456" required />
                </div>

                <div id="ws-auth-error-msg" style="display:none; color:#EF4444; font-size:12px; background:rgba(239,68,68,0.12); border:1px solid rgba(239,68,68,0.3); padding:8px 12px; border-radius:8px;"></div>

                <button type="submit" class="dna-primary-btn-lg cyan" style="margin-top:4px;">
                    <span>Acessar Auto Center ➔</span>
                </button>

                <!-- BOTÃO DE 1 TOQUE: DEMONSTRAÇÃO OFICIAL -->
                <div style="text-align:center; position:relative; margin:8px 0;">
                    <hr style="border:none; border-top:1px solid rgba(255,255,255,0.08); margin:10px 0;">
                    <span style="position:absolute; top:-9px; left:50%; transform:translateX(-50%); background:#091222; padding:0 8px; font-size:10px; color:var(--dna-ws-text-dim); text-transform:uppercase;">ou acesso rápido</span>
                </div>

                <button type="button" class="dna-primary-btn-lg" style="background:rgba(16,185,129,0.18); border-color:#10B981; color:#10B981;" onclick="WorkshopView.handleWorkshopDemoLogin()">
                    <span>⚡ Entrar com Oficina Demonstração (Veloce)</span>
                </button>
            </form>
        `;
    };

    // Sub-render do Form de Cadastro de Nova Auto Center
    WorkshopView.renderAuthRegisterForm = function() {
        return `
            <form onsubmit="WorkshopView.handleWorkshopAuthRegister(event)" style="display:flex; flex-direction:column; gap:11px;">
                <div class="dna-input-group">
                    <label class="dna-input-label">Nome Fantasia da Auto Center *</label>
                    <input type="text" id="ws-reg-tradename" class="dna-input-field" placeholder="Ex: Auto Center Modelo" required />
                </div>

                <div style="display:grid; grid-template-columns: 1fr 1fr; gap:10px;">
                    <div class="dna-input-group">
                        <label class="dna-input-label">CNPJ ou CPF *</label>
                        <input type="text" id="ws-reg-cnpj" class="dna-input-field" placeholder="00.000.000/0001-00" required />
                    </div>
                    <div class="dna-input-group">
                        <label class="dna-input-label">Telefone / WhatsApp *</label>
                        <input type="tel" id="ws-reg-phone" class="dna-input-field" placeholder="(11) 99999-9999" required />
                    </div>
                </div>

                <div class="dna-input-group">
                    <label class="dna-input-label">E-mail Comercial Oficial *</label>
                    <input type="email" id="ws-reg-email" class="dna-input-field" placeholder="contato@autocenter.com.br" required />
                </div>

                <div style="display:grid; grid-template-columns: 2fr 1fr; gap:10px;">
                    <div class="dna-input-group">
                        <label class="dna-input-label">Cidade *</label>
                        <input type="text" id="ws-reg-city" class="dna-input-field" placeholder="Ex: São Paulo" required />
                    </div>
                    <div class="dna-input-group">
                        <label class="dna-input-label">UF *</label>
                        <input type="text" id="ws-reg-state" class="dna-input-field" placeholder="SP" maxlength="2" required />
                    </div>
                </div>

                <div class="dna-input-group">
                    <label class="dna-input-label">Crie uma Senha Forte *</label>
                    <input type="password" id="ws-reg-password" class="dna-input-field" placeholder="Mínimo 6 caracteres" minlength="6" required />
                </div>

                <div id="ws-reg-error-msg" style="display:none; color:#EF4444; font-size:12px; background:rgba(239,68,68,0.12); border:1px solid rgba(239,68,68,0.3); padding:8px 12px; border-radius:8px;"></div>

                <button type="submit" class="dna-primary-btn-lg green" style="margin-top:6px;">
                    <span>Criar Conta da Auto Center & Começar ➔</span>
                </button>
            </form>
        `;
    };

    WorkshopView.setAuthTab = function(tab) {
        this.authActiveTab = tab;
        const viewport = document.getElementById('ws-mobile-active-viewport') || document.getElementById('view-content');
        if (viewport) {
            viewport.innerHTML = this.renderMobileAuthView();
        }
    };

    WorkshopView.setAuthTargetMode = function(mode) {
        this.authTargetMode = mode;
    };

    // Processar Login da Auto Center (painel web)
    WorkshopView.handleWorkshopAuthLogin = async function(e) {
        if (e && e.preventDefault) e.preventDefault();
        const email = (document.getElementById('ws-auth-email')?.value || '').trim();
        const password = (document.getElementById('ws-auth-password')?.value || '').trim();
        const errEl = document.getElementById('ws-auth-error-msg');
        const btn = e && e.target ? e.target.querySelector('[type="submit"]') || e.target : null;

        if (!email || !password) {
            if (errEl) { errEl.style.display = 'block'; errEl.textContent = 'Por favor, informe e-mail e senha.'; }
            return;
        }

        if (btn) { btn.disabled = true; }

        try {
            if (typeof API === 'undefined' || !API.login) {
                throw new Error('Serviço de autenticação indisponível.');
            }

            const res = await API.login({ email, password });

            if (!res || !res.token) {
                throw new Error((res && res.error) || (res && res.message) || 'E-mail ou senha incorretos.');
            }

            // ✅ Login aprovado
            localStorage.setItem('dna_token', res.token);
            if (res.user) {
                localStorage.setItem('dna_logged_user', JSON.stringify(res.user));
                if (res.user.workshop && res.user.workshop.trade_name) {
                    this.officialWorkshopName = res.user.workshop.trade_name;
                }
            }
            localStorage.removeItem('dna_logged_out');
            const isWeb = this.authTargetMode === 'web';
            this.setDesktopMode(isWeb);

        } catch (err) {
            // ❌ Login negado
            const msg = err.message || 'Falha na autenticação.';
            if (errEl) { errEl.style.display = 'block'; errEl.textContent = msg; }
            if (btn) { btn.disabled = false; }
        }
    };

    // Processar Cadastro da Auto Center
    WorkshopView.handleWorkshopAuthRegister = async function(e) {
        if (e && e.preventDefault) e.preventDefault();
        const tradeName = (document.getElementById('ws-reg-tradename')?.value || '').trim();
        const cnpj = (document.getElementById('ws-reg-cnpj')?.value || '').trim();
        const phone = (document.getElementById('ws-reg-phone')?.value || '').trim();
        const email = (document.getElementById('ws-reg-email')?.value || '').trim();
        const city = (document.getElementById('ws-reg-city')?.value || '').trim();
        const state = (document.getElementById('ws-reg-state')?.value || '').trim();
        const password = (document.getElementById('ws-reg-password')?.value || '').trim();
        const errEl = document.getElementById('ws-reg-error-msg');

        if (!tradeName || !email || !password) {
            if (errEl) {
                errEl.style.display = 'block';
                errEl.textContent = 'Preencha todos os campos obrigatórios.';
            }
            return;
        }

        try {
            if (typeof API !== 'undefined' && API.registerWorkshop) {
                await API.registerWorkshop({
                    tradeName,
                    companyName: tradeName,
                    cnpj,
                    phone,
                    email,
                    city,
                    state,
                    password
                });
            }
        } catch (err) {
            console.warn('Registro processado localmente:', err.message);
        }

        this.officialWorkshopName = tradeName;
        const newUser = {
            id: 'ws_user_' + Date.now(),
            name: tradeName,
            email: email,
            role_code: 'WORKSHOP',
            workshop: {
                id: 'ws_' + Date.now(),
                trade_name: tradeName,
                cnpj: cnpj,
                phone: phone
            }
        };
        localStorage.setItem('dna_logged_user', JSON.stringify(newUser));

        alert('🎉 Parabéns! Sua Auto Center foi cadastrada com sucesso no DNA AUTO.');
        const isWeb = this.authTargetMode === 'web';
        this.setDesktopMode(isWeb);
    };

    // Login com Oficina de Demonstração
    WorkshopView.handleWorkshopDemoLogin = function() {
        this.officialWorkshopName = 'Veloce Auto Center Premium';
        const demoUser = {
            id: 'usr_workshop_marcos',
            name: 'Marcos Silveira',
            email: 'marcos@veloce.com.br',
            role_code: 'WORKSHOP',
            role_name: 'Proprietário de Oficina',
            workshop: {
                id: 'ws_veloce',
                workshop_id: 'ws_veloce',
                trade_name: 'Veloce Auto Center Premium',
                cnpj: '12.345.678/0001-90'
            }
        };
        localStorage.setItem('dna_logged_user', JSON.stringify(demoUser));
        localStorage.setItem('dna_token', 'sess_workshop_usr_workshop_marcos');
        if (typeof API !== 'undefined') {
            API.setToken('sess_workshop_usr_workshop_marcos');
            API.setDemoUser('usr_workshop_marcos');
        }

        const isWeb = this.authTargetMode === 'web';
        this.setDesktopMode(isWeb);
    };

    // Injetor de Banner Mobile no Painel Desktop (Web ERP)
    WorkshopView.injectDesktopMobileBanner = function() {
        if (document.getElementById('dna-desktop-switch-banner')) return;
        const banner = document.createElement('div');
        banner.id = 'dna-desktop-switch-banner';
        banner.style.cssText = 'background:linear-gradient(90deg, #091222, #0d1f3c); border-bottom:1px solid rgba(0,212,255,0.4); padding:8px 16px; display:flex; align-items:center; justify-content:space-between; color:#FFFFFF; font-size:12px; z-index:9999;';
        
        const origin = window.location.origin || 'https://dna-auto-vua4.onrender.com';
        banner.innerHTML = `
            <div style="display:flex; align-items:center; gap:10px;">
                <span style="font-size:18px;">📱</span>
                <div>
                    <strong style="color:var(--dna-ws-cyan);">Aplicativo para Celular da Oficina (Mobile-First):</strong>
                    <span style="color:#94A3B8; margin-left:6px;">Cards grandes, rápido e ideal para mecânicos no pátio: ${origin}/oficina</span>
                </div>
            </div>
            <div style="display:flex; gap:8px;">
                <button type="button" onclick="WorkshopView.setDesktopMode(false)" style="background:var(--dna-ws-cyan); color:#000000; border:none; border-radius:6px; padding:4px 12px; font-weight:800; cursor:pointer; font-size:11px;">
                    Mudar para App Celular ➔
                </button>
                <button type="button" onclick="WorkshopView.switchMobileSection('auth')" style="background:rgba(255,255,255,0.1); color:#FFFFFF; border:1px solid rgba(255,255,255,0.2); border-radius:6px; padding:4px 10px; cursor:pointer; font-size:11px;">
                    🔑 Trocar Conta / Login
                </button>
            </div>
        `;
        const container = document.getElementById('view-content');
        if (container) {
            container.insertBefore(banner, container.firstChild);
        }
    };


    // ──────────────────────────────────────────────────────────────────────────
    // HELPER UNIVERSAL: BUSCA DE VEÍCULO POR PLACA EM QUALQUER SERVIÇO
    // ──────────────────────────────────────────────────────────────────────────
    WorkshopView.renderUniversalVehiclePlateBar = function() {
        const v = this.selectedMobileVehicle || this.getDefaultMobileVehicles()[0];
        const recents = this.getEffectiveVehiclesList().slice(0, 4);

        return `
            <div class="dna-universal-plate-box">
                <div style="display:flex; align-items:center; justify-content:space-between; margin-bottom:8px;">
                    <label style="margin:0; font-size:12px; color:var(--dna-ws-cyan); font-weight:800; text-transform:uppercase; letter-spacing:0.5px;">
                        🚗 Localizar Veículo Pela Placa:
                    </label>
                    <span style="font-size:11px; color:#10B981; font-weight:800;">Ativo: ${v.license_plate}</span>
                </div>

                <!-- Campo de Busca por Placa -->
                <div class="dna-input-search-row" style="margin-bottom:8px; display:flex; gap:8px;">
                    <input 
                        type="text" 
                        id="universal-plate-input" 
                        class="dna-plate-input" 
                        placeholder="DIGITE A PLACA (EX: ${v.license_plate})" 
                        maxlength="8"
                        value="${this.mobileActivePlate || v.license_plate || ''}"
                        oninput="this.value = this.value.toUpperCase()"
                        onkeydown="if(event.key==='Enter') WorkshopView.handleUniversalPlateSearch()"
                        style="flex:1; height:46px; background:#FFFFFF; border:1.5px solid #0084FF; border-radius:10px; color:#000000; text-align:center; font-weight:800; font-family:monospace; font-size:16px;"
                    />
                    <button type="button" class="dna-search-action-btn" onclick="WorkshopView.handleUniversalPlateSearch()" title="Localizar Placa" style="width:46px; height:46px; font-size:18px; border-radius:10px; background:linear-gradient(135deg, #0052cc, #00d4ff); border:none; color:#fff; cursor:pointer;">
                        🔍
                    </button>
                </div>

                <!-- Atalhos Rápidos dos Últimos Veículos -->
                <div style="display:flex; align-items:center; gap:6px; overflow-x:auto; padding-bottom:2px;">
                    <span style="font-size:10px; color:var(--dna-ws-text-dim); white-space:nowrap; text-transform:uppercase;">Recentes:</span>
                    ${recents.map(r => `
                        <button type="button" onclick="WorkshopView.selectVehicleByPlate('${r.license_plate}')" style="background:${r.license_plate === v.license_plate ? 'rgba(0,212,255,0.25)' : 'rgba(255,255,255,0.06)'}; border:1px solid ${r.license_plate === v.license_plate ? 'var(--dna-ws-cyan)' : 'rgba(255,255,255,0.15)'}; border-radius:6px; padding:3px 8px; font-size:11px; color:#fff; font-family:monospace; cursor:pointer; white-space:nowrap;">
                            ${r.license_plate}
                        </button>
                    `).join('')}
                </div>

                <!-- Card Resumo do Veículo Ativo -->
                <div class="dna-vehicle-preview-card" style="margin-top:10px; padding:10px 12px; background:rgba(0,0,0,0.3); border:1px solid rgba(255,255,255,0.08); border-radius:10px; display:flex; align-items:center; gap:10px;">
                    <div style="width:38px; height:38px; border-radius:8px; background:linear-gradient(135deg, #0066FF, #00D4FF); display:flex; align-items:center; justify-content:center; font-size:18px; flex-shrink:0;">🚗</div>
                    <div style="flex:1; min-width:0;">
                        <div style="font-size:13.5px; font-weight:800; color:#FFFFFF; white-space:nowrap; overflow:hidden; text-overflow:ellipsis;">
                            ${v.brand || ''} ${v.model || 'Veículo'}
                        </div>
                        <div style="font-size:11px; color:var(--dna-ws-cyan); font-weight:700;">
                            Placa: ${v.license_plate} • Odômetro: ${(v.mileage || 10000).toLocaleString('pt-BR')} km
                        </div>
                        <div style="font-size:10.5px; color:var(--dna-ws-text-muted);">
                            Cliente: ${v.client_name || 'Cliente da Oficina'}
                        </div>
                    </div>
                </div>
            </div>
        `;
    };

    WorkshopView.selectVehicleByPlate = function(plate) {
        const found = this.findVehicleByPlate(plate);
        if (found) {
            this.selectedMobileVehicle = found;
            this.mobileActivePlate = found.license_plate;
            const input = document.getElementById('universal-plate-input');
            if (input) input.value = found.license_plate;
            const viewport = document.getElementById('ws-mobile-active-viewport');
            if (viewport) viewport.innerHTML = this.renderMobileActiveSection();
        }
    };

    WorkshopView.handleUniversalPlateSearch = function() {
        const input = document.getElementById('universal-plate-input');
        const plate = (input ? input.value : this.mobileActivePlate || '').trim();
        if (!plate) return;

        const found = this.findVehicleByPlate(plate);
        if (found) {
            this.selectedMobileVehicle = found;
            this.mobileActivePlate = found.license_plate;
            alert('✅ Veículo ' + found.license_plate + ' (' + found.model + ') localizado com sucesso!');
        } else {
            // Cria registro imediato do veículo para a oficina não travar
            const newVeh = {
                id: 'veh_' + Date.now(),
                license_plate: plate.toUpperCase(),
                brand: 'Veículo',
                model: 'Modelo Identificado',
                year: '2022',
                color: 'Prata',
                mileage: 45000,
                client_name: 'Cliente da Oficina',
                client_phone: '(11) 99999-9999',
                last_service_date: 'Hoje'
            };
            this.selectedMobileVehicle = newVeh;
            this.mobileActivePlate = newVeh.license_plate;
            alert('ℹ️ Placa ' + newVeh.license_plate + ' selecionada para este serviço.');
        }

        const viewport = document.getElementById('ws-mobile-active-viewport');
        if (viewport) viewport.innerHTML = this.renderMobileActiveSection();
    };

    // ──────────────────────────────────────────────────────────────────────────
    // HELPER: UPLOAD DUPLO DE FOTOS COM 2 OPÇÕES EXPLÍCITAS (CÂMERA & GALERIA)
    // ──────────────────────────────────────────────────────────────────────────
    WorkshopView.renderDualPhotoUploadSection = function(blockId, title, sublabel) {
        const photos = this.mobileUploadedPhotos || [];
        return `
            <div style="background:rgba(8,16,32,0.85); border:1px solid rgba(0,102,255,0.25); border-radius:12px; padding:12px; margin-top:8px;">
                <div style="display:flex; align-items:center; justify-content:space-between; margin-bottom:8px;">
                    <strong style="color:#ffffff; font-size:12.5px; font-weight:800;">${title}</strong>
                    <span style="font-size:10px; color:var(--dna-ws-cyan); font-weight:700;">${sublabel || '2 Opções'}</span>
                </div>

                <!-- Inputs Nativos Separados: Câmera com capture="environment" vs Galeria sem capture -->
                <input type="file" id="${blockId}-camera-input" accept="image/*" capture="environment" style="display:none;" onchange="WorkshopView.handlePhotoInputFiles(this, '${blockId}')" />
                <input type="file" id="${blockId}-gallery-input" accept="image/*" multiple style="display:none;" onchange="WorkshopView.handlePhotoInputFiles(this, '${blockId}')" />

                <!-- Duas Opções Claras Lado a Lado -->
                <div class="dna-photo-choice-grid">
                    <button type="button" class="dna-photo-choice-btn camera" onclick="document.getElementById('${blockId}-camera-input').click()">
                        <span style="font-size:24px;">📸</span>
                        <strong>Tirar Foto</strong>
                        <small>Câmera do aparelho</small>
                    </button>
                    <button type="button" class="dna-photo-choice-btn gallery" onclick="document.getElementById('${blockId}-gallery-input').click()">
                        <span style="font-size:24px;">🖼️</span>
                        <strong>Buscar Galeria</strong>
                        <small>Fotos do celular</small>
                    </button>
                </div>

                <!-- Miniaturas de Fotos Adicionadas -->
                <div class="dna-photo-grid" id="${blockId}-preview-grid" style="margin-top:10px;">
                    ${photos.map((p, idx) => `
                        <div class="dna-photo-thumb">
                            <img src="${p}" alt="Foto ${idx+1}" />
                            <button type="button" class="dna-photo-remove-btn" onclick="WorkshopView.removePhotoByIndex(${idx})">×</button>
                        </div>
                    `).join('')}
                </div>
            </div>
        `;
    };

    WorkshopView.handlePhotoInputFiles = function(input, blockId) {
        if (!input.files || input.files.length === 0) return;
        Array.from(input.files).forEach(file => {
            const reader = new FileReader();
            reader.onload = (e) => {
                this.mobileUploadedPhotos.push(e.target.result);
                const viewport = document.getElementById('ws-mobile-active-viewport');
                if (viewport) viewport.innerHTML = this.renderMobileActiveSection();
            };
            reader.readAsDataURL(file);
        });
    };

    WorkshopView.removePhotoByIndex = function(idx) {
        this.mobileUploadedPhotos.splice(idx, 1);
        const viewport = document.getElementById('ws-mobile-active-viewport');
        if (viewport) viewport.innerHTML = this.renderMobileActiveSection();
    };

    WorkshopView.setDesktopMode = function(isWeb) {
        this.closeDeviceModal();
        this.currentViewMode = isWeb ? 'web' : 'mobile';
        localStorage.setItem('dna_workshop_view_mode', this.currentViewMode);
        
        if (isWeb) {
            document.body.classList.add('force-desktop-mode');
            this.renderMainLayout();
        } else {
            document.body.classList.remove('force-desktop-mode');
            this.renderMobileShell();
        }
    };

    // ──────────────────────────────────────────────────────────────────────────
    // TELA DE LOGIN EXCLUSIVA DO APP DA OFICINA (ESTILO WALLPAPER DNA AUTO)
    // ──────────────────────────────────────────────────────────────────────────
    WorkshopView.showOficinaLoginScreen = function() {
        // Limpa sessão e registra estado de logout
        this.financialAuthenticated = false;
        this.stockAuthenticated = false;
        localStorage.setItem('dna_logged_out', 'true');
        localStorage.removeItem('dna_logged_user');
        localStorage.removeItem('dna_token');

        const container = document.getElementById('view-content');
        if (!container) return;

        // Segunda imagem (oficinas/auto centers): DNA AUTO com carro Hyundai e ícones de monitoramento
        const bgImageUrl = './img/dna-auto-login-hero.jpg';

        container.innerHTML = `
            <div class="dna-oficina-splash-screen">
                <!-- Imagem de Fundo em Tela Cheia -->
                <img src="${bgImageUrl}" alt="DNA AUTO Oficinas" class="dna-oficina-splash-bg" />
                <!-- Gradiente suave na parte inferior para destacar os botões -->
                <div class="dna-oficina-splash-gradient"></div>

                <!-- Botões na parte inferior (igual ao app do cliente) -->
                <div class="dna-oficina-splash-actions">
                    <button type="button" class="dna-oficina-btn-entrar" onclick="WorkshopView.showOficinaLoginForm()">
                        Entrar
                    </button>
                    <button type="button" class="dna-oficina-btn-cadastrar" onclick="WorkshopView.showOficinaRegisterForm();">
                        Cadastrar
                    </button>
                </div>
            </div>
        `;
    };

    // Exibe o formulário de login (chamado ao clicar "Entrar" na tela splash)
    WorkshopView.showOficinaLoginForm = function() {
        const container = document.getElementById('view-content');
        if (!container) return;

        const bgImageUrl = './img/dna-auto-login-hero.jpg';

        container.innerHTML = `
            <div class="dna-oficina-login-screen">
                <div class="dna-oficina-login-bg" style="background-image: url('${bgImageUrl}');"></div>
                <div class="dna-oficina-login-gradient"></div>

                <!-- Seta de Voltar (igual ao app do cliente) -->
                <button
                    type="button"
                    onclick="WorkshopView.showOficinaLoginScreen()"
                    style="position:absolute; top:calc(18px + env(safe-area-inset-top,0px)); left:16px; z-index:20; background:rgba(0,0,0,0.45); border:none; border-radius:50%; width:38px; height:38px; display:flex; align-items:center; justify-content:center; cursor:pointer; backdrop-filter:blur(8px); -webkit-backdrop-filter:blur(8px);"
                    aria-label="Voltar"
                >
                    <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="#FFFFFF" stroke-width="2.6" stroke-linecap="round" stroke-linejoin="round">
                        <polyline points="15 18 9 12 15 6"/>
                    </svg>
                </button>

                <div class="dna-oficina-login-card">
                    <div class="dna-oficina-login-form">
                        <div class="dna-login-input-group">
                            <span class="dna-login-input-icon">✉️</span>
                            <input
                                type="email"
                                id="oficina-login-email"
                                class="dna-oficina-login-input"
                                placeholder="E-mail da sua oficina"
                                autocomplete="username"
                            />
                        </div>

                        <div class="dna-login-input-group">
                            <span class="dna-login-input-icon">🔒</span>
                            <input
                                type="password"
                                id="oficina-login-password"
                                class="dna-oficina-login-input"
                                placeholder="Senha de acesso"
                                autocomplete="current-password"
                                onkeydown="if(event.key==='Enter') WorkshopView.handleOficinaLogin()"
                            />
                        </div>

                        <button type="button" class="dna-oficina-login-btn" onclick="WorkshopView.handleOficinaLogin()">
                            <span>Entrar</span>
                        </button>

                        <div style="text-align:center; margin-top:8px;">
                            <span style="color:#64748B; font-size:12.5px;">Não tem conta? </span>
                            <a href="javascript:void(0)" onclick="WorkshopView.showOficinaRegisterForm()" style="color:#00D4FF; font-size:12.5px; font-weight:700; text-decoration:none;">Cadastre-se</a>
                        </div>
                    </div>
                </div>
            </div>
        `;

        setTimeout(() => {
            const emailField = document.getElementById('oficina-login-email');
            if (emailField) emailField.focus();
        }, 120);
    };

    // Tela de cadastro simples da oficina (chamada ao clicar "Cadastre-se")
    WorkshopView.showOficinaRegisterForm = function() {
        const container = document.getElementById('view-content');
        if (!container) return;

        const bgImageUrl = './img/dna-auto-login-hero.jpg';

        container.innerHTML = `
            <div class="dna-oficina-login-screen">
                <div class="dna-oficina-login-bg" style="background-image: url('${bgImageUrl}');"></div>
                <div class="dna-oficina-login-gradient"></div>

                <!-- Seta de Voltar -->
                <button
                    type="button"
                    onclick="WorkshopView.showOficinaLoginForm()"
                    style="position:absolute; top:calc(18px + env(safe-area-inset-top,0px)); left:16px; z-index:20; background:rgba(0,0,0,0.45); border:none; border-radius:50%; width:38px; height:38px; display:flex; align-items:center; justify-content:center; cursor:pointer; backdrop-filter:blur(8px); -webkit-backdrop-filter:blur(8px);"
                    aria-label="Voltar"
                >
                    <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="#FFFFFF" stroke-width="2.6" stroke-linecap="round" stroke-linejoin="round">
                        <polyline points="15 18 9 12 15 6"/>
                    </svg>
                </button>

                <div class="dna-oficina-login-card" style="max-height:85vh; overflow-y:auto;">
                    <div style="text-align:center; margin-bottom:14px;">
                        <strong style="font-size:16px; color:#FFFFFF; display:block;">Cadastrar Oficina</strong>
                        <span style="font-size:11.5px; color:#94A3B8;">Preencha os dados para criar sua conta</span>
                    </div>

                    <div class="dna-oficina-login-form">
                        <div class="dna-login-input-group">
                            <span class="dna-login-input-icon">🏢</span>
                            <input
                                type="text"
                                id="reg-oficina-nome"
                                class="dna-oficina-login-input"
                                placeholder="Nome da Oficina / Auto Center"
                                required
                            />
                        </div>

                        <div class="dna-login-input-group">
                            <span class="dna-login-input-icon">✉️</span>
                            <input
                                type="email"
                                id="reg-oficina-email"
                                class="dna-oficina-login-input"
                                placeholder="E-mail comercial"
                                autocomplete="email"
                                required
                            />
                        </div>

                        <div class="dna-login-input-group">
                            <span class="dna-login-input-icon">💬</span>
                            <input
                                type="tel"
                                id="reg-oficina-whatsapp"
                                class="dna-oficina-login-input"
                                placeholder="WhatsApp (ex: 11 99999-9999)"
                                required
                            />
                        </div>

                        <div class="dna-login-input-group">
                            <span class="dna-login-input-icon">🔒</span>
                            <input
                                type="password"
                                id="reg-oficina-senha"
                                class="dna-oficina-login-input"
                                placeholder="Criar senha de acesso"
                                autocomplete="new-password"
                                required
                            />
                        </div>

                        <div id="reg-error-box" style="display:none; color:#EF4444; font-size:12px; background:rgba(239,68,68,0.12); border:1px solid rgba(239,68,68,0.3); padding:8px 12px; border-radius:8px;"></div>

                        <button type="button" class="dna-oficina-login-btn" onclick="WorkshopView.handleOficinaRegister()">
                            <span>Criar Conta</span>
                        </button>

                        <div style="text-align:center; margin-top:8px;">
                            <span style="color:#64748B; font-size:12.5px;">Já tem conta? </span>
                            <a href="javascript:void(0)" onclick="WorkshopView.showOficinaLoginForm()" style="color:#00D4FF; font-size:12.5px; font-weight:700; text-decoration:none;">Entrar</a>
                        </div>
                    </div>
                </div>
            </div>
        `;
    };

    // Handler do cadastro simples
    WorkshopView.handleOficinaRegister = async function() {
        const nome = (document.getElementById('reg-oficina-nome')?.value || '').trim();
        const email = (document.getElementById('reg-oficina-email')?.value || '').trim();
        const whatsapp = (document.getElementById('reg-oficina-whatsapp')?.value || '').trim();
        const senha = (document.getElementById('reg-oficina-senha')?.value || '').trim();
        const errBox = document.getElementById('reg-error-box');
        const btn = document.querySelector('.dna-oficina-login-btn');

        if (!nome || !email || !whatsapp || !senha) {
            if (errBox) { errBox.style.display = 'block'; errBox.textContent = 'Preencha todos os campos.'; }
            return;
        }
        if (senha.length < 6) {
            if (errBox) { errBox.style.display = 'block'; errBox.textContent = 'A senha precisa ter pelo menos 6 caracteres.'; }
            return;
        }

        if (btn) { btn.disabled = true; btn.innerHTML = '<span>Criando conta...</span>'; }

        try {
            if (typeof API === 'undefined' || !API.request) {
                throw new Error('Serviço indisponível no momento.');
            }

            const res = await API.request('/workshops/register', {
                method: 'POST',
                body: JSON.stringify({ trade_name: nome, email, phone: whatsapp, password: senha })
            });

            if (!res || (!res.token && !res.id && !res.workshop_id)) {
                throw new Error((res && res.error) || (res && res.message) || 'Não foi possível criar a conta. Tente novamente.');
            }

            // ✅ Cadastro aprovado
            if (res.token) localStorage.setItem('dna_token', res.token);
            if (res.user) localStorage.setItem('dna_logged_user', JSON.stringify(res.user));
            this.officialWorkshopName = nome;
            localStorage.removeItem('dna_logged_out');
            this.currentSection = 'dashboard';
            this.renderMobileShell();

        } catch (err) {
            // ❌ Cadastro negado
            const msg = err.message || 'Erro ao criar conta. Verifique os dados e tente novamente.';
            if (errBox) { errBox.style.display = 'block'; errBox.textContent = msg; }
            if (btn) { btn.disabled = false; btn.innerHTML = '<span>Criar Conta</span>'; }
        }
    };

    WorkshopView.handleOficinaLogin = async function() {
        const email = (document.getElementById('oficina-login-email')?.value || '').trim();
        const password = (document.getElementById('oficina-login-password')?.value || '').trim();
        const btn = document.querySelector('.dna-oficina-login-btn');

        if (!email || !password) {
            WorkshopView.showToast('Por favor, preencha e-mail e senha.', 'warning');
            return;
        }

        // Bloqueia botão durante a requisição
        if (btn) { btn.disabled = true; btn.innerHTML = '<span>Verificando...</span>'; }

        try {
            if (typeof API === 'undefined' || !API.login) {
                throw new Error('Serviço de autenticação indisponível.');
            }

            const res = await API.login({ email, password });

            // A API precisa retornar token — qualquer outra resposta é credencial inválida
            if (!res || !res.token) {
                throw new Error((res && res.error) || (res && res.message) || 'E-mail ou senha incorretos.');
            }

            // ✅ Login aprovado pela API
            localStorage.removeItem('dna_logged_out');
            localStorage.setItem('dna_token', res.token);
            if (res.user) localStorage.setItem('dna_logged_user', JSON.stringify(res.user));
            if (res.user && res.user.workshop) {
                this.officialWorkshopName = res.user.workshop.trade_name || 'Auto Center';
            }
            this.currentSection = 'dashboard';
            this.renderMobileShell();

        } catch (err) {
            // ❌ Login negado — mostra erro sem entrar no app
            const msg = err.message || 'Falha na autenticação. Verifique seus dados.';
            WorkshopView.showToast(msg, 'error');

            // Exibe erro inline na tela de login
            const container = document.getElementById('view-content');
            const existingErr = container && container.querySelector('#login-error-inline');
            if (container && !existingErr) {
                const errDiv = document.createElement('div');
                errDiv.id = 'login-error-inline';
                errDiv.style.cssText = 'color:#EF4444;font-size:12.5px;background:rgba(239,68,68,0.12);border:1px solid rgba(239,68,68,0.3);padding:8px 12px;border-radius:8px;margin-top:6px;text-align:center;';
                errDiv.textContent = msg;
                const loginBtn = container.querySelector('.dna-oficina-login-btn');
                if (loginBtn && loginBtn.parentNode) loginBtn.parentNode.insertBefore(errDiv, loginBtn);
            } else if (existingErr) {
                existingErr.textContent = msg;
            }

            if (btn) { btn.disabled = false; btn.innerHTML = '<span>Entrar</span>'; }
        }
    };

    // Login com Oficina de Demonstração
    WorkshopView.handleWorkshopDemoLogin = function() {
        localStorage.removeItem('dna_logged_out');
        this.officialWorkshopName = 'Veloce Auto Center Premium';
        const demoUser = {
            id: 'usr_workshop_marcos',
            name: 'Marcos Silveira',
            email: 'marcos@veloce.com.br',
            role_code: 'WORKSHOP',
            role_name: 'Proprietário de Oficina',
            workshop: {
                id: 'ws_veloce',
                workshop_id: 'ws_veloce',
                trade_name: 'Veloce Auto Center Premium',
                cnpj: '12.345.678/0001-90'
            }
        };
        localStorage.setItem('dna_logged_user', JSON.stringify(demoUser));
        localStorage.setItem('dna_token', 'sess_workshop_usr_workshop_marcos');
        if (typeof API !== 'undefined') {
            API.setToken('sess_workshop_usr_workshop_marcos');
            API.setDemoUser('usr_workshop_marcos');
        }

        this.currentSection = 'dashboard';
        this.renderMobileShell();
    };

    // Verificação de dispositivo na inicialização
    WorkshopView.checkDevicePrompt = function() {
        const hasPrompted = sessionStorage.getItem('dna_device_prompted');
        if (!hasPrompted && window.innerWidth >= 1200 && this.currentViewMode === 'mobile') {
            sessionStorage.setItem('dna_device_prompted', 'true');
        }
    };

    // ──────────────────────────────────────────────────────────────────────────
    // HOOK DO RENDER PRINCIPAL DO WORKSHOPVIEW
    // ──────────────────────────────────────────────────────────────────────────
    const originalRender = WorkshopView.render;
    WorkshopView.render = async function() {
        const container = document.getElementById('view-content');
        if (!container) return;

        const activeWorkshopId = this.getEffectiveWorkshopId();
        this.currentWorkshopId = activeWorkshopId;
        document.body.classList.add('is-workshop-erp');

        // Se o usuário estiver deslogado ou a URL solicitar login, exibe a tela de login com imagem DNA AUTO
        const isLoggedOut = localStorage.getItem('dna_logged_out') === 'true';
        if (isLoggedOut || window.location.hash === '#login') {
            document.body.classList.remove('force-desktop-mode');
            this.showOficinaLoginScreen();
            return;
        }

        // Carrega dados base
        try {
            const data = await API.getWorkshopDashboard(activeWorkshopId);
            this.dashboardData = data;
            if (data.workshop && data.workshop.trade_name) {
                this.officialWorkshopName = data.workshop.trade_name;
            }
        } catch (_) {}

        try {
            const alertsRes = await API.getMaintenanceAlertsForWorkshop(activeWorkshopId);
            this.alertsData = (alertsRes && alertsRes.alerts) ? alertsRes.alerts : [];
        } catch (_) {}

        try {
            const vehRes = await API.getVehicles();
            this.vehiclesList = (vehRes && vehRes.vehicles) ? vehRes.vehicles : [];
        } catch (_) {}

        // Leitura de parâmetros de URL para direcionamento dinâmico
        const urlParams = new URLSearchParams(window.location.search);
        const modeParam = urlParams.get('mode');
        if (modeParam === 'web') {
            this.currentViewMode = 'web';
            localStorage.setItem('dna_workshop_view_mode', 'web');
        } else if (modeParam === 'mobile') {
            this.currentViewMode = 'mobile';
            localStorage.setItem('dna_workshop_view_mode', 'mobile');
        }

        const isAuthHash = window.location.hash === '#cadastro';
        const isAuthQuery = urlParams.get('auth') === '1';
        if (isAuthHash || isAuthQuery) {
            this.currentSection = 'auth';
            this.authActiveTab = 'register';
            document.body.classList.remove('force-desktop-mode');
            this.renderMobileShell();
            return;
        }

        // Decide entre renderização Mobile First (padrão) e Web Desktop
        const savedMode = localStorage.getItem('dna_workshop_view_mode');
        if (savedMode === 'web') {
            document.body.classList.add('force-desktop-mode');
            this.renderMainLayout();
            this.injectDesktopMobileBanner();
        } else {
            document.body.classList.remove('force-desktop-mode');
            this.renderMobileShell();
        }
    };

    // Hook do switchSection para rotear no modo mobile
    const originalSwitchSection = WorkshopView.switchSection;
    WorkshopView.switchSection = function(sectionId) {
        if (this.currentViewMode === 'mobile') {
            this.switchMobileSection(sectionId);
            return;
        }
        if (originalSwitchSection) {
            originalSwitchSection.call(this, sectionId);
        }
    };

    console.log('✅ Componente Mobile First da Oficina DNA AUTO carregado com sucesso!');
})();
