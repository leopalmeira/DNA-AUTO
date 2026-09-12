const bcrypt = require('bcryptjs');

// Limpar tabelas existentes para reset limpo e idempotente
const clearTables = [
    'client_activations', 'whatsapp_messages', 'whatsapp_sessions',
    'audit_logs', 'commissions', 'dna_activations', 'pricing_plans', 'reports',
    'notifications', 'health_scores', 'fipe_values', 'market_values', 'auctions',
    'debts', 'fines', 'taxes', 'vehicle_documents', 'mileage_records', 'vehicle_photos',
    'invoices', 'part_installations', 'parts', 'service_records', 'maintenance_records',
    'ownership_transfers', 'owners', 'vehicle_dna', 'vehicles', 'workshop_users',
    'workshops', 'users', 'role_permissions', 'roles', 'permissions', 'integrations',
    'workshop_appointments'
];

function seedBase(dbInstance) {
    const db = dbInstance || require('./db');
    console.log('🌱 Inicializando estrutura base limpa do DNA AUTO (Sem veículos mock)...');

    db.transaction(() => {
        for (const tbl of clearTables) {
            try {
                db.prepare(`DELETE FROM ${tbl}`).run();
            } catch (_) {}
        }

        // 1. Permissões
        const insertPermission = db.prepare(`
            INSERT OR REPLACE INTO permissions (id, name, category, description)
            VALUES (@id, @name, @category, @description)
        `);

        const permissions = [
            { id: 'perm_admin_all', name: 'admin:all', category: 'ADMIN', description: 'Acesso total a todas as funções' },
            { id: 'perm_workshops_manage', name: 'workshops:manage', category: 'WORKSHOPS', description: 'Homologar e gerenciar oficinas' },
            { id: 'perm_services_create', name: 'services:create', category: 'SERVICES', description: 'Registrar serviços realizados' },
            { id: 'perm_services_prove', name: 'services:prove', category: 'SERVICES', description: 'Comprovar serviços com fotos e notas' },
            { id: 'perm_services_confirm', name: 'services:confirm', category: 'SERVICES', description: 'Confirmar ou rejeitar serviços declarados' },
            { id: 'perm_dna_activate', name: 'dna:activate', category: 'DNA', description: 'Ativar passaporte digital DNA' },
            { id: 'perm_transfers_manage', name: 'transfers:manage', category: 'TRANSFERS', description: 'Solicitar e validar transferência' },
            { id: 'perm_reports_generate', name: 'reports:generate', category: 'REPORTS', description: 'Gerar dossiê para venda e laudo' },
            { id: 'perm_audit_view', name: 'audit:view', category: 'AUDIT', description: 'Consultar logs de auditoria' }
        ];
        for (const p of permissions) insertPermission.run(p);

        // 2. Roles
        const insertRole = db.prepare(`
            INSERT OR REPLACE INTO roles (id, code, name, description)
            VALUES (@id, @code, @name, @description)
        `);

        const roles = [
            { id: 'role_admin', code: 'ADMIN', name: 'Administrador DNA AUTO', description: 'Gestão completa da plataforma' },
            { id: 'role_workshop_owner', code: 'WORKSHOP_OWNER', name: 'Gestor da Oficina', description: 'Gerenciamento da oficina e equipe' },
            { id: 'role_workshop_manager', code: 'WORKSHOP_MANAGER', name: 'Gerente da Oficina', description: 'Operação e confirmação de serviços' },
            { id: 'role_workshop_mechanic', code: 'WORKSHOP_MECHANIC', name: 'Mecânico Chefe', description: 'Registro técnico de serviços e peças' },
            { id: 'role_owner', code: 'OWNER', name: 'Proprietário de Veículo', description: 'Acompanhamento do DNA e transferências' }
        ];
        for (const r of roles) insertRole.run(r);

        // 3. Usuários Padrão (senhas hasheadas)
        const passwordHash = bcrypt.hashSync('senha123', 10);
        const adminHash = bcrypt.hashSync('admin123', 10);

        const insertUser = db.prepare(`
            INSERT INTO users (id, name, email, password_hash, phone, role_id, status, is_demo)
            VALUES (@id, @name, @email, @password_hash, @phone, @role_id, @status, 1)
        `);

        insertUser.run({
            id: 'usr_admin',
            name: 'Administrador Geral',
            email: 'admin@dnaauto.com.br',
            password_hash: adminHash,
            phone: '(11) 99999-0001',
            role_id: 'role_admin',
            status: 'ACTIVE'
        });

        insertUser.run({
            id: 'usr_workshop_marcos',
            name: 'Marcos Silveira',
            email: 'marcos@veloce.com.br',
            password_hash: passwordHash,
            phone: '(19) 98888-1111',
            role_id: 'role_workshop_owner',
            status: 'ACTIVE'
        });

        insertUser.run({
            id: 'usr_workshop_roberto',
            name: 'Roberto Mecânico Chefe',
            email: 'roberto@veloce.com.br',
            password_hash: passwordHash,
            phone: '(19) 98888-2222',
            role_id: 'role_workshop_mechanic',
            status: 'ACTIVE'
        });

        insertUser.run({
            id: 'usr_owner_carlos',
            name: 'Carlos Alberto Silva',
            email: 'carlos.silva@email.com',
            password_hash: passwordHash,
            phone: '(11) 97777-3333',
            role_id: 'role_owner',
            status: 'ACTIVE'
        });

        insertUser.run({
            id: 'usr_client',
            name: 'Cliente Proprietário',
            email: 'cliente@dnaauto.com.br',
            password_hash: passwordHash,
            phone: '(11) 98888-7777',
            role_id: 'role_owner',
            status: 'ACTIVE'
        });

        // 4. Oficinas Credenciadas
        const insertWorkshop = db.prepare(`
            INSERT INTO workshops (id, company_name, trade_name, cnpj, phone, email, address_street, address_number, address_neighborhood, city, state, zip_code, status, verified_badge, notes)
            VALUES (@id, @company_name, @trade_name, @cnpj, @phone, @email, @address_street, @address_number, @address_neighborhood, @city, @state, @zip_code, @status, @verified_badge, @notes)
        `);

        insertWorkshop.run({
            id: 'ws_veloce',
            company_name: 'Auto Center Veloce Premium LTDA',
            trade_name: 'Veloce Auto Center Premium [DEMO]',
            cnpj: '12.345.678/0001-90',
            phone: '(19) 3241-8900',
            email: 'contato@veloce.com.br',
            address_street: 'Av. Barão de Itapura',
            address_number: '1420',
            address_neighborhood: 'Guanabara',
            city: 'Campinas',
            state: 'SP',
            zip_code: '13020-432',
            status: 'APPROVED',
            verified_badge: 1,
            notes: 'Centro de excelência e alta taxa de ativação de DNA.'
        });

        insertWorkshop.run({
            id: 'ws_mastercar',
            company_name: 'Oficina Mecânica MasterCar Serviços Automotivos',
            trade_name: 'MasterCar Bosch Service [DEMO]',
            cnpj: '98.765.432/0001-11',
            phone: '(11) 5012-3400',
            email: 'contato@mastercar.com.br',
            address_street: 'Rua Domingos de Morais',
            address_number: '2100',
            address_neighborhood: 'Vila Mariana',
            city: 'São Paulo',
            state: 'SP',
            zip_code: '04036-000',
            status: 'APPROVED',
            verified_badge: 1,
            notes: 'Especialista em injeção e câmbios automáticos.'
        });

        insertWorkshop.run({
            id: 'ws_pitstop',
            company_name: 'PitStop Centro Automotivo Litoral',
            trade_name: 'PitStop Express Santos [DEMO]',
            cnpj: '44.555.666/0001-22',
            phone: '(13) 3284-5500',
            email: 'pitstop@litoral.com.br',
            address_street: 'Av. Ana Costa',
            address_number: '480',
            address_neighborhood: 'Gonzaga',
            city: 'Santos',
            state: 'SP',
            zip_code: '11060-002',
            status: 'PENDING',
            verified_badge: 0,
            notes: 'Aguardando aprovação de credenciamento do administrativo.'
        });

        // Vínculo Equipe da Oficina
        const insertWorkshopUser = db.prepare(`
            INSERT INTO workshop_users (id, workshop_id, user_id, position_title, can_activate_dna, can_prove_services)
            VALUES (@id, @workshop_id, @user_id, @position_title, @can_activate_dna, @can_prove_services)
        `);

        insertWorkshopUser.run({
            id: 'wu_1',
            workshop_id: 'ws_veloce',
            user_id: 'usr_workshop_marcos',
            position_title: 'Proprietário & Diretor Técnico',
            can_activate_dna: 1,
            can_prove_services: 1
        });

        insertWorkshopUser.run({
            id: 'wu_2',
            workshop_id: 'ws_veloce',
            user_id: 'usr_workshop_roberto',
            position_title: 'Mecânico Chefe Responsável',
            can_activate_dna: 1,
            can_prove_services: 1
        });

        // 5. Planos e Preços Configuráveis
        const insertPlan = db.prepare(`
            INSERT INTO pricing_plans (id, code, title, description, price_cents, workshop_price_cents, discount_percentage, is_courtesy, commission_percentage, is_active)
            VALUES (@id, @code, @title, @description, @price_cents, @workshop_price_cents, @discount_percentage, @is_courtesy, @commission_percentage, 1)
        `);

        insertPlan.run({
            id: 'plan_normal',
            code: 'PLAN_NORMAL',
            title: 'Passaporte Digital DNA AUTO (Vitalício)',
            description: 'Histórico completo de manutenções, trocas de peças e atividades do veículo',
            price_cents: 5990,
            workshop_price_cents: 3990,
            discount_percentage: 0,
            is_courtesy: 0,
            commission_percentage: 25
        });


        insertPlan.run({
            id: 'plan_workshop_promo',
            code: 'PLAN_WORKSHOP_PROMO',
            title: 'Campanha Oficina Credenciada',
            description: 'Preço promocional aplicado durante serviços na oficina',
            price_cents: 7900,
            workshop_price_cents: 4900,
            discount_percentage: 47,
            is_courtesy: 0,
            commission_percentage: 25
        });

        insertPlan.run({
            id: 'plan_discount_50',
            code: 'PLAN_DISCOUNT_50',
            title: 'Cupom 50% de Desconto',
            description: 'Condição especial de incentivo para novos veículos',
            price_cents: 7450,
            workshop_price_cents: 4900,
            discount_percentage: 50,
            is_courtesy: 0,
            commission_percentage: 15
        });

        insertPlan.run({
            id: 'plan_courtesy',
            code: 'PLAN_COURTESY',
            title: 'Cortesia Fidelidade da Oficina',
            description: 'Oferecido gratuitamente pela oficina para fidelização',
            price_cents: 0,
            workshop_price_cents: 0,
            discount_percentage: 100,
            is_courtesy: 1,
            commission_percentage: 0
        });
    })();

    console.log('✅ Estrutura base e usuários criados com sucesso (Ambiente limpo pronto para uso).');
}

function seedDemoCars(dbInstance) {
    const db = dbInstance || require('./db');
    console.log('🚗 Inserindo veículos de demonstração e histórico...');

    db.transaction(() => {
        // 6. Veículos
        const insertVehicle = db.prepare(`
            INSERT INTO vehicles (id, license_plate, chassis_vin, renavam, brand, model, version_label, manufacture_year, model_year, fuel_type, transmission_type, color, photo_url, is_demo)
            VALUES (@id, @license_plate, @chassis_vin, @renavam, @brand, @model, @version_label, @manufacture_year, @model_year, @fuel_type, @transmission_type, @color, @photo_url, 1)
        `);

        // Veículo 1: Honda Civic Touring 2021 (O veículo de ouro, histórico 360°)
        insertVehicle.run({
            id: 'veh_civic_touring',
            license_plate: 'BRA2E19',
            chassis_vin: '93HFC1670MZ102934',
            renavam: '01239847120',
            brand: 'Honda',
            model: 'Civic',
            version_label: 'Touring 1.5 Turbo 173cv',
            manufacture_year: 2021,
            model_year: 2021,
            fuel_type: 'Gasolina',
            transmission_type: 'Automático CVT',
            color: 'Cinza Barium Metálico',
            photo_url: 'https://images.unsplash.com/photo-1590362891988-f778047020d0?w=800&auto=format&fit=crop&q=80'
        });

        // Veículo 2: Toyota Corolla 2019 (Histórico misto)
        insertVehicle.run({
            id: 'veh_corolla_xei',
            license_plate: 'ABC1D23',
            chassis_vin: '9BRBL32E7K0192847',
            renavam: '00984716253',
            brand: 'Toyota',
            model: 'Corolla',
            version_label: 'XEi 2.0 Dual VVT-i 154cv',
            manufacture_year: 2019,
            model_year: 2020,
            fuel_type: 'Flex',
            transmission_type: 'Automático CVT',
            color: 'Prata Lunar',
            photo_url: 'https://images.unsplash.com/photo-1621007947382-bb3c3994e3fb?w=800&auto=format&fit=crop&q=80'
        });

        // Veículo 3: VW Gol 2017 (DNA recém-ativado)
        insertVehicle.run({
            id: 'veh_gol_msi',
            license_plate: 'KXZ9012',
            chassis_vin: '9BWAA05U8HT129841',
            renavam: '00718293441',
            brand: 'Volkswagen',
            model: 'Gol',
            version_label: 'Trendline 1.6 MSI 8V 104cv',
            manufacture_year: 2017,
            model_year: 2018,
            fuel_type: 'Flex',
            transmission_type: 'Manual 5M',
            color: 'Branco Cristal',
            photo_url: 'https://images.unsplash.com/photo-1541899481282-d53bffe3c35d?w=800&auto=format&fit=crop&q=80'
        });

        // Veículo 4: Fiat Strada 2023 (SEM DNA, para demonstrar o fluxo de ativação pela oficina)
        insertVehicle.run({
            id: 'veh_strada_freedom',
            license_plate: 'STR1A99',
            chassis_vin: '9BD148A1EPY384729',
            renavam: '01482938102',
            brand: 'Fiat',
            model: 'Strada',
            version_label: 'Freedom 1.3 Firefly Cabine Dupla',
            manufacture_year: 2023,
            model_year: 2023,
            fuel_type: 'Flex',
            transmission_type: 'Manual 5M',
            color: 'Vermelho Montecarlo',
            photo_url: 'https://images.unsplash.com/photo-1533473359331-0135ef1b58bf?w=800&auto=format&fit=crop&q=80'
        });

        // 7. DNA dos Veículos
        const insertDna = db.prepare(`
            INSERT INTO vehicle_dna (id, vehicle_id, dna_code, status, activated_at, activated_by_workshop_id, activation_modality, activation_fee_cents, certificate_hash)
            VALUES (@id, @vehicle_id, @dna_code, @status, @activated_at, @activated_by_workshop_id, @activation_modality, @activation_fee_cents, @certificate_hash)
        `);

        insertDna.run({
            id: 'dna_civic',
            vehicle_id: 'veh_civic_touring',
            dna_code: 'DNA-BR-8F72-29A4-X91',
            status: 'ACTIVE',
            activated_at: '2021-03-15 10:30:00',
            activated_by_workshop_id: 'ws_veloce',
            activation_modality: 'CAMPAIGN',
            activation_fee_cents: 7900,
            certificate_hash: 'a9f8e4b7c2d1e0f3456789abcdef0123456789abcdef0123456789abcdef0123'
        });

        insertDna.run({
            id: 'dna_corolla',
            vehicle_id: 'veh_corolla_xei',
            dna_code: 'DNA-BR-4B19-72C1-M40',
            status: 'ACTIVE',
            activated_at: '2022-06-20 14:15:00',
            activated_by_workshop_id: 'ws_mastercar',
            activation_modality: 'NORMAL',
            activation_fee_cents: 14900,
            certificate_hash: 'b8c7d6e5f4a3b2c10987654321fedcba0987654321fedcba0987654321fedcba'
        });

        insertDna.run({
            id: 'dna_gol',
            vehicle_id: 'veh_gol_msi',
            dna_code: 'DNA-BR-1A90-55E8-K12',
            status: 'ACTIVE',
            activated_at: '2025-11-10 09:00:00',
            activated_by_workshop_id: 'ws_veloce',
            activation_modality: 'COURTESY',
            activation_fee_cents: 0,
            certificate_hash: 'c7d8e9f0a1b2c3d4e5f60718293a4b5c6d7e8f90a1b2c3d4e5f6a7b8c9d0e1f2'
        });

        // 8. Proprietários e Histórico de Posse
        const insertOwner = db.prepare(`
            INSERT INTO owners (id, user_id, name, document_cpf, email, phone, created_at)
            VALUES (@id, @user_id, @name, @document_cpf, @email, @phone, @created_at)
        `);

        insertOwner.run({
            id: 'own_ricardo',
            user_id: null,
            name: 'Ricardo M. Mendes (1º Dono)',
            document_cpf: '***.458.918-**',
            email: 'ricardo.mendes@email.com',
            phone: '(11) 98111-****',
            created_at: '2021-03-01 08:00:00'
        });

        insertOwner.run({
            id: 'own_carlos',
            user_id: 'usr_owner_carlos',
            name: 'Carlos Alberto Silva (Proprietário Atual)',
            document_cpf: '***.782.348-**',
            email: 'carlos.silva@email.com',
            phone: '(11) 97777-****',
            created_at: '2023-04-12 14:20:00'
        });

        insertOwner.run({
            id: 'own_ana',
            user_id: null,
            name: 'Ana Carolina Martins',
            document_cpf: '***.319.488-**',
            email: 'ana.martins@email.com',
            phone: '(11) 96666-****',
            created_at: '2024-01-10 11:00:00'
        });

        // Histórico de Transferência do Civic
        const insertTransfer = db.prepare(`
            INSERT INTO ownership_transfers (id, vehicle_id, previous_owner_id, new_owner_id, transfer_code, status, requested_at, completed_at, transfer_mileage, notes)
            VALUES (@id, @vehicle_id, @previous_owner_id, @new_owner_id, @transfer_code, @status, @requested_at, @completed_at, @transfer_mileage, @notes)
        `);

        insertTransfer.run({
            id: 'trans_civic_1',
            vehicle_id: 'veh_civic_touring',
            previous_owner_id: 'own_ricardo',
            new_owner_id: 'own_carlos',
            transfer_code: '829401',
            status: 'COMPLETED',
            requested_at: '2023-04-10 15:00:00',
            completed_at: '2023-04-12 14:20:00',
            transfer_mileage: 45000,
            notes: 'Transferência concluída com sucesso no sistema DNA AUTO.'
        });

        // 9. Peças do Catálogo
        const insertPart = db.prepare(`
            INSERT INTO parts (id, name, manufacturer, part_number, category)
            VALUES (@id, @name, @manufacturer, @part_number, @category)
        `);

        const partsData = [
            { id: 'part_oleo_0w20', name: 'Óleo de Motor Sintético 0W-20 API SP', manufacturer: 'Honda Genuine Fluids', part_number: '08798-9034', category: 'Lubrificantes' },
            { id: 'part_filtro_oleo', name: 'Filtro de Óleo Blindado OEM', manufacturer: 'Honda OEM / Mahle', part_number: '15400-PLM-A02', category: 'Filtros' },
            { id: 'part_filtro_ar', name: 'Filtro de Ar do Motor', manufacturer: 'Mann Filter', part_number: 'C-24021', category: 'Filtros' },
            { id: 'part_pastilha_diant', name: 'Jogo de Pastilhas de Freio Dianteiras Cerâmica', manufacturer: 'Cobreq Cerâmica', part_number: 'N-1498C', category: 'Freios' },
            { id: 'part_fluido_dot4', name: 'Fluido de Freio DOT 4 LV', manufacturer: 'Bosch High Performance', part_number: '1987479002', category: 'Freios' },
            { id: 'part_correia_dent', name: 'Kit Correia Dentada e Tensor Automático', manufacturer: 'Gates PowerGrip', part_number: 'K015629XS', category: 'Motor' },
            { id: 'part_bomba_dagua', name: 'Bomba d Água de Alta Eficiência', manufacturer: 'Urba Brothers', part_number: 'UB-0761', category: 'Arrefecimento' },
            { id: 'part_kit_embreagem', name: 'Kit Platô, Disco e Rolamento Guia', manufacturer: 'Sachs Premium', part_number: '3000-951-820', category: 'Transmissão' },
            { id: 'part_oleo_cvt', name: 'Fluido de Transmissão CVT HCF-2', manufacturer: 'Honda OEM', part_number: '08200-9008', category: 'Lubrificantes' },
            { id: 'part_amortecedor_diant', name: 'Par de Amortecedores Dianteiros Pressurizados', manufacturer: 'Monroe OESpectrum', part_number: '742119SP', category: 'Suspensão' },
            { id: 'part_velas_iridium', name: 'Jogo de Velas de Ignição Laser Iridium', manufacturer: 'NGK Japan', part_number: 'DILKAR8J9G', category: 'Ignição' }
        ];
        for (const p of partsData) insertPart.run(p);

        // 10. Registros de Serviços (Linha do Tempo Completa do Civic)
        const insertService = db.prepare(`
            INSERT INTO service_records (
                id, vehicle_id, workshop_id, declared_by_owner_id, responsible_technician_name,
                service_date, mileage, category, service_title, description,
                parts_cost_cents, labor_cost_cents, total_cost_cents, warranty_months,
                proof_level, proof_status, workshop_confirmation_status, workshop_confirmation_date, workshop_confirmation_notes
            ) VALUES (
                @id, @vehicle_id, @workshop_id, @declared_by_owner_id, @responsible_technician_name,
                @service_date, @mileage, @category, @service_title, @description,
                @parts_cost_cents, @labor_cost_cents, @total_cost_cents, @warranty_months,
                @proof_level, @proof_status, @workshop_confirmation_status, @workshop_confirmation_date, @workshop_confirmation_notes
            )
        `);

        const insertPartInstallation = db.prepare(`
            INSERT INTO part_installations (id, service_record_id, part_id, quantity, unit_price_cents, part_condition, warranty_months, notes)
            VALUES (@id, @service_record_id, @part_id, @quantity, @unit_price_cents, @part_condition, @warranty_months, @notes)
        `);

        const insertInvoice = db.prepare(`
            INSERT INTO invoices (id, vehicle_id, service_record_id, invoice_number, access_key, issuer_name, issuer_cnpj, issue_date, total_amount_cents, file_path, verified)
            VALUES (@id, @vehicle_id, @service_record_id, @invoice_number, @access_key, @issuer_name, @issuer_cnpj, @issue_date, @total_amount_cents, @file_path, 1)
        `);

        const insertPhoto = db.prepare(`
            INSERT INTO vehicle_photos (id, vehicle_id, service_record_id, workshop_id, photo_category, title, file_path, taken_at, registered_by_user_id)
            VALUES (@id, @vehicle_id, @service_record_id, @workshop_id, @photo_category, @title, @file_path, @taken_at, @registered_by_user_id)
        `);

        const insertMileage = db.prepare(`
            INSERT INTO mileage_records (id, vehicle_id, service_record_id, mileage, recorded_at, source, verified)
            VALUES (@id, @vehicle_id, @service_record_id, @mileage, @recorded_at, @source, 1)
        `);

        // Serviço 1 (Civic - 2021 - 10.000 km) -> Nível 4: COMPROVADO PELA OFICINA
        insertService.run({
            id: 'srv_civic_1',
            vehicle_id: 'veh_civic_touring',
            workshop_id: 'ws_veloce',
            declared_by_owner_id: null,
            responsible_technician_name: 'Roberto Mecânico Chefe',
            service_date: '2021-08-10',
            mileage: 10200,
            category: 'Revisão e Lubrificação',
            service_title: 'Revisão Periódica de 10.000 km e Troca de Óleo',
            description: 'Substituição preventiva de óleo do motor sintético 0W-20, filtro de óleo genuíno e inspeção de 42 itens de segurança.',
            parts_cost_cents: 34000,
            labor_cost_cents: 18000,
            total_cost_cents: 52000,
            warranty_months: 6,
            proof_level: 4,
            proof_status: 'WORKSHOP_PROVEN',
            workshop_confirmation_status: 'CONFIRMED',
            workshop_confirmation_date: '2021-08-10 16:30:00',
            workshop_confirmation_notes: 'Revisão com checklist digital concluído sem apontamentos.'
        });
        insertPartInstallation.run({ id: 'pi_1', service_record_id: 'srv_civic_1', part_id: 'part_oleo_0w20', quantity: 4, unit_price_cents: 6500, part_condition: 'NEW', warranty_months: 6, notes: 'Óleo sintético genuíno' });
        insertPartInstallation.run({ id: 'pi_2', service_record_id: 'srv_civic_1', part_id: 'part_filtro_oleo', quantity: 1, unit_price_cents: 8000, part_condition: 'NEW', warranty_months: 6, notes: 'Filtro blindado' });
        insertInvoice.run({ id: 'inv_1', vehicle_id: 'veh_civic_touring', service_record_id: 'srv_civic_1', invoice_number: 'NF-e 001948', access_key: '35210812345678000190550010000019481928471928', issuer_name: 'Auto Center Veloce Premium LTDA', issuer_cnpj: '12.345.678/0001-90', issue_date: '2021-08-10', total_amount_cents: 52000, file_path: '/uploads/invoices/nfe_001948.pdf' });
        insertMileage.run({ id: 'mil_1', vehicle_id: 'veh_civic_touring', service_record_id: 'srv_civic_1', mileage: 10200, recorded_at: '2021-08-10', source: 'WORKSHOP_SERVICE' });

        // Serviço 2 (Civic - 2022 - 32.000 km) -> Nível 4: COMPROVADO
        insertService.run({
            id: 'srv_civic_2',
            vehicle_id: 'veh_civic_touring',
            workshop_id: 'ws_veloce',
            declared_by_owner_id: null,
            responsible_technician_name: 'Roberto Mecânico Chefe',
            service_date: '2022-04-18',
            mileage: 32400,
            category: 'Freios',
            service_title: 'Substituição de Pastilhas de Freio Dianteiras e Sangria com Fluido DOT 4',
            description: 'Instalação de pastilhas de freio de cerâmica Cobreq, desengraxe dos discos, sangria e substituição completa do fluido DOT 4.',
            parts_cost_cents: 48000,
            labor_cost_cents: 22000,
            total_cost_cents: 70000,
            warranty_months: 6,
            proof_level: 4,
            proof_status: 'WORKSHOP_PROVEN',
            workshop_confirmation_status: 'CONFIRMED',
            workshop_confirmation_date: '2022-04-18 17:00:00',
            workshop_confirmation_notes: 'Eficiência de frenagem aferida no dinamômetro.'
        });
        insertPartInstallation.run({ id: 'pi_3', service_record_id: 'srv_civic_2', part_id: 'part_pastilha_diant', quantity: 1, unit_price_cents: 39000, part_condition: 'NEW', warranty_months: 12, notes: 'Cerâmica antiruído' });
        insertPartInstallation.run({ id: 'pi_4', service_record_id: 'srv_civic_2', part_id: 'part_fluido_dot4', quantity: 2, unit_price_cents: 4500, part_condition: 'NEW', warranty_months: 12, notes: 'Fluido de alta temperatura' });
        insertInvoice.run({ id: 'inv_2', vehicle_id: 'veh_civic_touring', service_record_id: 'srv_civic_2', invoice_number: 'NF-e 002812', access_key: '35220412345678000190550010000028128912839120', issuer_name: 'Auto Center Veloce Premium LTDA', issuer_cnpj: '12.345.678/0001-90', issue_date: '2022-04-18', total_amount_cents: 70000, file_path: '/uploads/invoices/nfe_002812.pdf' });
        insertPhoto.run({ id: 'pho_1', vehicle_id: 'veh_civic_touring', service_record_id: 'srv_civic_2', workshop_id: 'ws_veloce', photo_category: 'OLD_PART', title: 'Pastilhas Antigas Desgastadas (15% restantes)', file_path: 'https://images.unsplash.com/photo-1486006920555-c77dce18193b?w=600&auto=format&fit=crop&q=80', taken_at: '2022-04-18 14:10:00', registered_by_user_id: 'usr_workshop_roberto' });
        insertPhoto.run({ id: 'pho_2', vehicle_id: 'veh_civic_touring', service_record_id: 'srv_civic_2', workshop_id: 'ws_veloce', photo_category: 'NEW_PART', title: 'Jogo Pastilhas Novas Cerâmica Cobreq na Embalagem', file_path: 'https://images.unsplash.com/photo-1619642751034-765dfdf7c58e?w=600&auto=format&fit=crop&q=80', taken_at: '2022-04-18 14:15:00', registered_by_user_id: 'usr_workshop_roberto' });
        insertPhoto.run({ id: 'pho_3', vehicle_id: 'veh_civic_touring', service_record_id: 'srv_civic_2', workshop_id: 'ws_veloce', photo_category: 'INSTALLED_PART', title: 'Pastilha Nova Instalada na Pinça Dianteira', file_path: 'https://images.unsplash.com/photo-1580273916550-e323be2ae537?w=600&auto=format&fit=crop&q=80', taken_at: '2022-04-18 15:45:00', registered_by_user_id: 'usr_workshop_roberto' });
        insertMileage.run({ id: 'mil_2', vehicle_id: 'veh_civic_touring', service_record_id: 'srv_civic_2', mileage: 32400, recorded_at: '2022-04-18', source: 'WORKSHOP_SERVICE' });

        // Serviço 3 (Civic - 2023 - 68.000 km) -> Nível 4: COMPROVADO (Oficina MasterCar)
        insertService.run({
            id: 'srv_civic_3',
            vehicle_id: 'veh_civic_touring',
            workshop_id: 'ws_mastercar',
            declared_by_owner_id: null,
            responsible_technician_name: 'Claudio Ferreira',
            service_date: '2023-09-15',
            mileage: 68100,
            category: 'Motor e Arrefecimento',
            service_title: 'Troca Preventiva de Correia de Acessórios, Tensores e Bomba d Água',
            description: 'Substituição preventiva da correia, polias de desvio e instalação de nova bomba d água Urba com fluido de arrefecimento orgânico.',
            parts_cost_cents: 95000,
            labor_cost_cents: 45000,
            total_cost_cents: 140000,
            warranty_months: 12,
            proof_level: 4,
            proof_status: 'WORKSHOP_PROVEN',
            workshop_confirmation_status: 'CONFIRMED',
            workshop_confirmation_date: '2023-09-15 18:00:00',
            workshop_confirmation_notes: 'Procedimento com travamento das árvores de comando de válvulas e torque conforme manual Honda.'
        });
        insertPartInstallation.run({ id: 'pi_5', service_record_id: 'srv_civic_3', part_id: 'part_correia_dent', quantity: 1, unit_price_cents: 55000, part_condition: 'NEW', warranty_months: 12, notes: 'Kit correia e tensor' });
        insertPartInstallation.run({ id: 'pi_6', service_record_id: 'srv_civic_3', part_id: 'part_bomba_dagua', quantity: 1, unit_price_cents: 40000, part_condition: 'NEW', warranty_months: 12, notes: 'Rotor metálico' });
        insertInvoice.run({ id: 'inv_3', vehicle_id: 'veh_civic_touring', service_record_id: 'srv_civic_3', invoice_number: 'NF-e 007621', access_key: '35230998765432000111550010000076211827364510', issuer_name: 'MasterCar Bosch Service', issuer_cnpj: '98.765.432/0001-11', issue_date: '2023-09-15', total_amount_cents: 140000, file_path: '/uploads/invoices/nfe_007621.pdf' });
        insertPhoto.run({ id: 'pho_4', vehicle_id: 'veh_civic_touring', service_record_id: 'srv_civic_3', workshop_id: 'ws_mastercar', photo_category: 'ENGINE', title: 'Kit Correia Dentada e Bomba d Água Montados no Bloco', file_path: 'https://images.unsplash.com/photo-1503376780353-7e6692767b70?w=600&auto=format&fit=crop&q=80', taken_at: '2023-09-15 16:20:00', registered_by_user_id: null });
        insertMileage.run({ id: 'mil_3', vehicle_id: 'veh_civic_touring', service_record_id: 'srv_civic_3', mileage: 68100, recorded_at: '2023-09-15', source: 'WORKSHOP_SERVICE' });

        // Serviço 4 (Civic - 2024 - 91.000 km) -> Nível 4: COMPROVADO (Veloce)
        insertService.run({
            id: 'srv_civic_4',
            vehicle_id: 'veh_civic_touring',
            workshop_id: 'ws_veloce',
            declared_by_owner_id: null,
            responsible_technician_name: 'Roberto Mecânico Chefe',
            service_date: '2024-05-22',
            mileage: 91300,
            category: 'Câmbio e Transmissão',
            service_title: 'Troca de Fluido de Transmissão CVT HCF-2 e Filtro do Trocador de Calor',
            description: 'Substituição total por diálise do fluido do câmbio CVT com produto original Honda HCF-2, troca do filtro do arrefecedor e lavagem do cárter.',
            parts_cost_cents: 110000,
            labor_cost_cents: 38000,
            total_cost_cents: 148000,
            warranty_months: 6,
            proof_level: 4,
            proof_status: 'WORKSHOP_PROVEN',
            workshop_confirmation_status: 'CONFIRMED',
            workshop_confirmation_date: '2024-05-22 17:30:00',
            workshop_confirmation_notes: 'Procedimento por diálise concluído sem limalha nos ímãs do cárter.'
        });
        insertPartInstallation.run({ id: 'pi_7', service_record_id: 'srv_civic_4', part_id: 'part_oleo_cvt', quantity: 6, unit_price_cents: 18000, part_condition: 'NEW', warranty_months: 12, notes: 'Fluido HCF-2 genuíno' });
        insertInvoice.run({ id: 'inv_4', vehicle_id: 'veh_civic_touring', service_record_id: 'srv_civic_4', invoice_number: 'NF-e 004129', access_key: '35240512345678000190550010000041299812736192', issuer_name: 'Auto Center Veloce Premium LTDA', issuer_cnpj: '12.345.678/0001-90', issue_date: '2024-05-22', total_amount_cents: 148000, file_path: '/uploads/invoices/nfe_004129.pdf' });
        insertMileage.run({ id: 'mil_4', vehicle_id: 'veh_civic_touring', service_record_id: 'srv_civic_4', mileage: 91300, recorded_at: '2024-05-22', source: 'WORKSHOP_SERVICE' });

        // Serviço 5 (Civic - 2025 - 112.000 km) -> Nível 1: DECLARADO PELO PROPRIETÁRIO
        insertService.run({
            id: 'srv_civic_5',
            vehicle_id: 'veh_civic_touring',
            workshop_id: null,
            declared_by_owner_id: 'own_carlos',
            responsible_technician_name: null,
            service_date: '2025-03-10',
            mileage: 112000,
            category: 'Lubrificação',
            service_title: 'Troca de Óleo e Filtro de Cabine em Viagem',
            description: 'Realizada troca de óleo de emergência durante viagem para o litoral. Proprietário comprou óleo sintético em posto credenciado.',
            parts_cost_cents: 28000,
            labor_cost_cents: 4000,
            total_cost_cents: 32000,
            warranty_months: 0,
            proof_level: 1,
            proof_status: 'DECLARED',
            workshop_confirmation_status: null,
            workshop_confirmation_date: null,
            workshop_confirmation_notes: null
        });
        insertMileage.run({ id: 'mil_5', vehicle_id: 'veh_civic_touring', service_record_id: 'srv_civic_5', mileage: 112000, recorded_at: '2025-03-10', source: 'OWNER_UPDATE' });

        // Serviço 6 (Civic - 2026 - 125.000 km) -> Nível 3 / 4: CONFIRMADO & COMPROVADO PELA OFICINA VELOCE
        insertService.run({
            id: 'srv_civic_6',
            vehicle_id: 'veh_civic_touring',
            workshop_id: 'ws_veloce',
            declared_by_owner_id: null,
            responsible_technician_name: 'Roberto Mecânico Chefe',
            service_date: '2026-02-14',
            mileage: 125200,
            category: 'Suspensão e Ignição',
            service_title: 'Troca de Amortecedores Dianteiros Monroe e Velas Laser Iridium NGK',
            description: 'Instalação de par de amortecedores dianteiros Monroe OESpectrum, troca de batentes e coifas, e jogo de velas Laser Iridium.',
            parts_cost_cents: 185000,
            labor_cost_cents: 42000,
            total_cost_cents: 227000,
            warranty_months: 12,
            proof_level: 4,
            proof_status: 'WORKSHOP_PROVEN',
            workshop_confirmation_status: 'CONFIRMED',
            workshop_confirmation_date: '2026-02-14 18:15:00',
            workshop_confirmation_notes: 'Veículo entregue alinhado e balanceado com laudo de geometria 3D.'
        });
        insertPartInstallation.run({ id: 'pi_8', service_record_id: 'srv_civic_6', part_id: 'part_amortecedor_diant', quantity: 2, unit_price_cents: 72500, part_condition: 'NEW', warranty_months: 24, notes: 'Garantia Monroe 2 anos' });
        insertPartInstallation.run({ id: 'pi_9', service_record_id: 'srv_civic_6', part_id: 'part_velas_iridium', quantity: 4, unit_price_cents: 10000, part_condition: 'NEW', warranty_months: 12, notes: 'Velas Laser Iridium NGK' });
        insertInvoice.run({ id: 'inv_5', vehicle_id: 'veh_civic_touring', service_record_id: 'srv_civic_6', invoice_number: 'NF-e 006840', access_key: '35260212345678000190550010000068409182736182', issuer_name: 'Auto Center Veloce Premium LTDA', issuer_cnpj: '12.345.678/0001-90', issue_date: '2026-02-14', total_amount_cents: 227000, file_path: '/uploads/invoices/nfe_006840.pdf' });
        insertPhoto.run({ id: 'pho_5', vehicle_id: 'veh_civic_touring', service_record_id: 'srv_civic_6', workshop_id: 'ws_veloce', photo_category: 'ODOMETER', title: 'Painel do Veículo com Km Exato Registrado (125.200 km)', file_path: 'https://images.unsplash.com/photo-1563720223185-11003d516935?w=600&auto=format&fit=crop&q=80', taken_at: '2026-02-14 09:30:00', registered_by_user_id: 'usr_workshop_roberto' });
        insertPhoto.run({ id: 'pho_6', vehicle_id: 'veh_civic_touring', service_record_id: 'srv_civic_6', workshop_id: 'ws_veloce', photo_category: 'INSTALLED_PART', title: 'Amortecedores Monroe OESpectrum Instalados', file_path: 'https://images.unsplash.com/photo-1486006920555-c77dce18193b?w=600&auto=format&fit=crop&q=80', taken_at: '2026-02-14 15:40:00', registered_by_user_id: 'usr_workshop_roberto' });
        insertMileage.run({ id: 'mil_6', vehicle_id: 'veh_civic_touring', service_record_id: 'srv_civic_6', mileage: 125200, recorded_at: '2026-02-14', source: 'WORKSHOP_SERVICE' });

        // 11. Serviço Pendente de Confirmação na Oficina Veloce (Para testar o fluxo de confirmação da oficina!)
        insertService.run({
            id: 'srv_corolla_pending_confirm',
            vehicle_id: 'veh_corolla_xei',
            workshop_id: 'ws_veloce',
            declared_by_owner_id: 'own_ana',
            responsible_technician_name: null,
            service_date: '2026-03-01',
            mileage: 78000,
            category: 'Ar-condicionado e Higienização',
            service_title: 'Higienização por Ozônio e Troca de Filtro Antipólen',
            description: 'Proprietária declarou ter realizado o serviço na oficina Veloce no dia 01/03/2026 com o técnico Roberto.',
            parts_cost_cents: 9000,
            labor_cost_cents: 12000,
            total_cost_cents: 21000,
            warranty_months: 3,
            proof_level: 1,
            proof_status: 'DECLARED',
            workshop_confirmation_status: 'PENDING',
            workshop_confirmation_date: null,
            workshop_confirmation_notes: null
        });

        // 12. Documentação, IPVA, Multas, Débitos e Leilões (Dados Transparentes)
        const insertDoc = db.prepare(`
            INSERT INTO vehicle_documents (id, vehicle_id, doc_type, title, file_path, issue_date, expiration_date, verification_source, status)
            VALUES (@id, @vehicle_id, @doc_type, @title, @file_path, @issue_date, @expiration_date, @verification_source, @status)
        `);
        insertDoc.run({
            id: 'doc_crlv_civic',
            vehicle_id: 'veh_civic_touring',
            doc_type: 'CRLV',
            title: 'CRLV-e Digital 2025/2026 — Licenciamento Anual em Dia',
            file_path: '/uploads/documents/crlv_civic_2025.pdf',
            issue_date: '2025-07-15',
            expiration_date: '2026-07-31',
            verification_source: 'Detran-SP Base Oficial',
            status: 'AVAILABLE'
        });

        const insertTax = db.prepare(`
            INSERT INTO taxes (id, vehicle_id, reference_year, due_date, amount_cents, status, source_message)
            VALUES (@id, @vehicle_id, @reference_year, @due_date, @amount_cents, @status, @source_message)
        `);
        insertTax.run({
            id: 'tax_ipva_2026',
            vehicle_id: 'veh_civic_touring',
            reference_year: 2026,
            due_date: '2026-01-20',
            amount_cents: 489000,
            status: 'PAID',
            source_message: 'IPVA 2026 Quitado em Cota Única (Base Sefaz-SP)'
        });
        insertTax.run({
            id: 'tax_ipva_2025',
            vehicle_id: 'veh_civic_touring',
            reference_year: 2025,
            due_date: '2025-01-20',
            amount_cents: 512000,
            status: 'PAID',
            source_message: 'IPVA 2025 Quitado Integralmente'
        });

        const insertFine = db.prepare(`
            INSERT INTO fines (id, vehicle_id, auto_infraction_code, infraction_date, description, amount_cents, points, status, source_message)
            VALUES (@id, @vehicle_id, @auto_infraction_code, @infraction_date, @description, @amount_cents, @points, @status, @source_message)
        `);
        insertFine.run({
            id: 'fine_civic_none',
            vehicle_id: 'veh_civic_touring',
            auto_infraction_code: null,
            infraction_date: null,
            description: 'Nenhuma infração ou multa pendente nos órgãos autuadores (DNIT, DER, PRF, Detran)',
            amount_cents: 0,
            points: 0,
            status: 'NONE',
            source_message: 'Base Nacional de Infrações (RENAINF) — Certidão Negativa Válida'
        });

        const insertDebt = db.prepare(`
            INSERT INTO debts (id, vehicle_id, category, description, has_restriction, source_message)
            VALUES (@id, @vehicle_id, @category, @description, @has_restriction, @source_message)
        `);
        insertDebt.run({
            id: 'debt_civic_none',
            vehicle_id: 'veh_civic_touring',
            category: 'GRAVAME',
            description: 'Veículo quitado, sem gravame financeiro ativo, sem bloqueios judiciais ou administrativos.',
            has_restriction: 0,
            source_message: 'Sistema Nacional de Gravames (SNG) / Renavam Oficial'
        });

        const insertAuction = db.prepare(`
            INSERT INTO auctions (id, vehicle_id, has_auction_record, auctioneer_name, auction_date, damage_classification, source_message)
            VALUES (@id, @vehicle_id, @has_auction_record, @auctioneer_name, @auction_date, @damage_classification, @source_message)
        `);
        insertAuction.run({
            id: 'auc_civic_none',
            vehicle_id: 'veh_civic_touring',
            has_auction_record: 0,
            auctioneer_name: null,
            auction_date: null,
            damage_classification: 'NENHUMA',
            source_message: 'Certificação de Inexistência de Passagem por Leilão ou Sinistro Indenizado'
        });

        // 13. Valores de Mercado e FIPE
        const insertFipe = db.prepare(`
            INSERT INTO fipe_values (id, vehicle_id, fipe_code, reference_month_year, fipe_price_cents)
            VALUES (@id, @vehicle_id, @fipe_code, @reference_month_year, @fipe_price_cents)
        `);
        insertFipe.run({
            id: 'fipe_civic_2026',
            vehicle_id: 'veh_civic_touring',
            fipe_code: '004495-4',
            reference_month_year: 'Março/2026',
            fipe_price_cents: 14280000 // R$ 142.800,00
        });

        const insertMarket = db.prepare(`
            INSERT INTO market_values (id, vehicle_id, reference_date, estimated_price_cents, market_source)
            VALUES (@id, @vehicle_id, @reference_date, @estimated_price_cents, @market_source)
        `);
        insertMarket.run({
            id: 'mkt_civic_2026',
            vehicle_id: 'veh_civic_touring',
            reference_date: '2026-03-01',
            estimated_price_cents: 14650000, // R$ 146.500,00 (valorização pelo histórico documentado)
            market_source: 'DNA AUTO Market Index — Histórico Documentado Superior à Média de Mercado'
        });

        // 14. Índice de Saúde do Histórico (Score 94/100 para o Civic)
        const insertHealth = db.prepare(`
            INSERT INTO health_scores (id, vehicle_id, overall_score, documented_percentage, proven_services_count, invoices_count, verified_workshops_count, mileage_records_count, continuity_status, score_rationale)
            VALUES (@id, @vehicle_id, @overall_score, @documented_percentage, @proven_services_count, @invoices_count, @verified_workshops_count, @mileage_records_count, @continuity_status, @score_rationale)
        `);
        insertHealth.run({
            id: 'hs_civic',
            vehicle_id: 'veh_civic_touring',
            overall_score: 94,
            documented_percentage: 92,
            proven_services_count: 5,
            invoices_count: 5,
            verified_workshops_count: 2,
            mileage_records_count: 6,
            continuity_status: 'EXCELLENT',
            score_rationale: 'Histórico de alta integridade com manutenções preventivas comprovadas por oficinas credenciadas, notas fiscais anexas, continuidade de quilometragem e ausência de sinistros ou débitos.'
        });

        insertHealth.run({
            id: 'hs_corolla',
            vehicle_id: 'veh_corolla_xei',
            overall_score: 78,
            documented_percentage: 75,
            proven_services_count: 3,
            invoices_count: 2,
            verified_workshops_count: 1,
            mileage_records_count: 3,
            continuity_status: 'GOOD',
            score_rationale: 'Histórico regular com serviços comprovados e pendência de confirmação pela oficina credenciada.'
        });

        insertHealth.run({
            id: 'hs_gol',
            vehicle_id: 'veh_gol_msi',
            overall_score: 62,
            documented_percentage: 58,
            proven_services_count: 1,
            invoices_count: 1,
            verified_workshops_count: 1,
            mileage_records_count: 1,
            continuity_status: 'REGULAR',
            score_rationale: 'DNA recém-ativado com histórico inicial registrado na rede.'
        });

        // 15. Conectores e Integrações
        const insertIntegration = db.prepare(`
            INSERT OR IGNORE INTO integrations (id, service_code, service_name, is_enabled, is_connected, endpoint_url, api_key_masked, status_message)
            VALUES (@id, @service_code, @service_name, @is_enabled, @is_connected, @endpoint_url, @api_key_masked, @status_message)
        `);
        insertIntegration.run({ id: 'int_fipe', service_code: 'FIPE', service_name: 'Tabela FIPE Oficial API', is_enabled: 1, is_connected: 1, endpoint_url: 'https://parallelum.com.br/fipe/api/v1', api_key_masked: 'fipe_live_****9821', status_message: 'Conexão ativa com cotações oficiais mensais' });
        insertIntegration.run({ id: 'int_placas', service_code: 'API_PLACAS', service_name: 'API Placas Nacional (WDAPI2)', is_enabled: 1, is_connected: 1, endpoint_url: 'https://wdapi2.com.br', api_key_masked: 'be1425****22dd', status_message: 'Conexão ativa com 1.000 consultas contratadas e FIPE oficial por score' });
        insertIntegration.run({ id: 'int_detran', service_code: 'DETRAN', service_name: 'Detran Base Estadual', is_enabled: 1, is_connected: 0, endpoint_url: 'https://api.detran.sp.gov.br/v2', api_key_masked: 'detran_live_****3124', status_message: 'Informação não disponível nesta fonte no momento' });
        insertIntegration.run({ id: 'int_ipva', service_code: 'IPVA', service_name: 'Sefaz IPVA & Taxas Veiculares', is_enabled: 1, is_connected: 1, endpoint_url: 'https://sefaz.sp.gov.br/api/ipva', api_key_masked: 'sefaz_****5519', status_message: 'Consulta sincronizada com a Secretaria da Fazenda' });
        insertIntegration.run({ id: 'int_multas', service_code: 'MULTAS', service_name: 'RENAINF Base Nacional', is_enabled: 1, is_connected: 1, endpoint_url: 'https://renainf.denatran.serpro.gov.br/api', api_key_masked: 'serpro_****7721', status_message: 'Consulta ativa sem multas pendentes' });
        insertIntegration.run({ id: 'int_leiloes', service_code: 'LEILOES', service_name: 'Central Nacional de Leilões', is_enabled: 1, is_connected: 1, endpoint_url: 'https://leiloesbrasil.api/v1/search', api_key_masked: 'leilao_****1290', status_message: 'Certidão negativa de leilão confirmada' });
        insertIntegration.run({ id: 'int_whatsapp', service_code: 'WHATSAPP', service_name: 'WhatsApp Business API Gateway', is_enabled: 1, is_connected: 1, endpoint_url: 'https://graph.facebook.com/v19.0/messages', api_key_masked: 'wh_token_****8819', status_message: 'Canal configurado para envio de códigos de transferência e alertas de revisão' });

        // 16. Logs de Auditoria Iniciais
        const insertAudit = db.prepare(`
            INSERT OR IGNORE INTO audit_logs (id, user_id, user_role, user_name, action, entity_type, entity_id, vehicle_dna_code, ip_address, data_before, data_after, created_at)
            VALUES (@id, @user_id, @user_role, @user_name, @action, @entity_type, @entity_id, @vehicle_dna_code, @ip_address, @data_before, @data_after, @created_at)
        `);

        insertAudit.run({
            id: 'aud_1',
            user_id: 'usr_admin',
            user_role: 'ADMIN',
            user_name: 'Administrador Geral',
            action: 'INITIALIZE_NETWORK',
            entity_type: 'SYSTEM',
            entity_id: 'system_core',
            vehicle_dna_code: null,
            ip_address: '127.0.0.1',
            data_before: null,
            data_after: JSON.stringify({ message: 'Rede DNA AUTO inicializada com sucesso' }),
            created_at: '2021-03-01 08:00:00'
        });

        insertAudit.run({
            id: 'aud_2',
            user_id: 'usr_workshop_marcos',
            user_role: 'WORKSHOP_OWNER',
            user_name: 'Marcos Silveira (Veloce)',
            action: 'ACTIVATE_DNA',
            entity_type: 'VEHICLE_DNA',
            entity_id: 'dna_civic',
            vehicle_dna_code: 'DNA-BR-8F72-29A4-X91',
            ip_address: '187.55.120.4',
            data_before: null,
            data_after: JSON.stringify({ plate: 'BRA2E19', model: 'Honda Civic Touring 2021', modality: 'CAMPAIGN' }),
            created_at: '2021-03-15 10:30:00'
        });

        insertAudit.run({
            id: 'aud_3',
            user_id: 'usr_owner_carlos',
            user_role: 'OWNER',
            user_name: 'Carlos Alberto Silva',
            action: 'CONFIRM_TRANSFER',
            entity_type: 'TRANSFER',
            entity_id: 'trans_civic_1',
            vehicle_dna_code: 'DNA-BR-8F72-29A4-X91',
            ip_address: '179.108.92.14',
            data_before: JSON.stringify({ previous_owner: 'Ricardo M. Mendes' }),
            data_after: JSON.stringify({ new_owner: 'Carlos Alberto Silva', mileage: 45000 }),
            created_at: '2023-04-12 14:20:00'
        });

        insertAudit.run({
            id: 'aud_4',
            user_id: 'usr_workshop_roberto',
            user_role: 'WORKSHOP_MECHANIC',
            user_name: 'Roberto Mecânico Chefe (Veloce)',
            action: 'PROVE_SERVICE',
            entity_type: 'SERVICE',
            entity_id: 'srv_civic_6',
            vehicle_dna_code: 'DNA-BR-8F72-29A4-X91',
            ip_address: '187.55.120.4',
            data_before: null,
            data_after: JSON.stringify({ service: 'Troca de Amortecedores Monroe e Velas Iridium', mileage: 125200, status: 'WORKSHOP_PROVEN' }),
            created_at: '2026-02-14 18:15:00'
        });
    })();

    console.log('✅ Veículos DEMO inseridos com sucesso.');
}

function runSeed(dbInstance, includeDemo = (process.env.SEED_DEMO_CARS === 'true')) {
    const db = dbInstance || require('./db');
    seedBase(db);
    if (includeDemo) {
        seedDemoCars(db);
    }
}

if (require.main === module) {
    const includeDemo = process.argv.includes('--demo') || process.env.SEED_DEMO_CARS === 'true';
    runSeed(null, includeDemo);
}

module.exports = runSeed;
module.exports.runSeed = runSeed;
module.exports.seedBase = seedBase;
module.exports.seedDemoCars = seedDemoCars;

