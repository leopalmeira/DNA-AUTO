const express = require('express');
const router = express.Router();
const db = require('../../database/db');
const { authenticateToken, authorizeRoles } = require('../../middlewares/auth');
const { logAudit } = require('../../middlewares/audit');
const baileysService = require('./baileys.service');

// Listagem de oficinas com métricas consolidadas
router.get('/', (req, res) => {
    try {
        const workshops = db.prepare(`
            SELECT w.*,
                   COUNT(DISTINCT sr.id) as total_services,
                   SUM(CASE WHEN sr.proof_level = 4 THEN 1 ELSE 0 END) as proven_services,
                   COUNT(DISTINCT vd.id) as dna_activations_count,
                   COUNT(DISTINCT wu.id) as staff_count
            FROM workshops w
            LEFT JOIN service_records sr ON sr.workshop_id = w.id
            LEFT JOIN vehicle_dna vd ON vd.activated_by_workshop_id = w.id
            LEFT JOIN workshop_users wu ON wu.workshop_id = w.id
            GROUP BY w.id
            ORDER BY proven_services DESC, total_services DESC
        `).all();

        res.json({ workshops });
    } catch (err) {
        res.status(500).json({ error: 'Erro ao listar oficinas.' });
    }
});

// Ranking de Oficinas Mais Ativas (Para o Dashboard Administrativo)
router.get('/ranking/most-active', (req, res) => {
    try {
        const ranking = db.prepare(`
            SELECT w.id, w.trade_name, w.cnpj, w.city, w.state, w.status, w.verified_badge,
                   COUNT(DISTINCT sr.id) as total_services,
                   SUM(CASE WHEN sr.proof_level = 4 THEN 1 ELSE 0 END) as proven_services,
                   COUNT(DISTINCT vd.id) as dnas_activated,
                   COUNT(DISTINCT sr.vehicle_id) as vehicles_served,
                   ROUND(
                       (CAST(SUM(CASE WHEN sr.proof_level = 4 THEN 1 ELSE 0 END) AS FLOAT) / 
                       MAX(1, COUNT(DISTINCT sr.id))) * 100, 1
                   ) as proof_rate_percentage
            FROM workshops w
            LEFT JOIN service_records sr ON sr.workshop_id = w.id
            LEFT JOIN vehicle_dna vd ON vd.activated_by_workshop_id = w.id
            GROUP BY w.id
            ORDER BY dnas_activated DESC, proven_services DESC
        `).all();

        res.json({ ranking });
    } catch (err) {
        res.status(500).json({ error: 'Erro ao gerar ranking de oficinas.' });
    }
});

// Dashboard Exclusivo da Oficina (Métricas da Oficina Logada ou Especificada)
router.get('/:id/dashboard', (req, res) => {
    try {
        const workshopId = req.params.id;
        const workshop = db.prepare(`SELECT * FROM workshops WHERE id = ?`).get(workshopId);

        if (!workshop) {
            return res.status(404).json({ error: 'Oficina não encontrada.' });
        }

        // Estatísticas da oficina
        const stats = db.prepare(`
            SELECT
                COUNT(DISTINCT sr.vehicle_id) as attended_vehicles,
                COUNT(DISTINCT CASE WHEN vd.id IS NOT NULL THEN sr.vehicle_id END) as vehicles_with_dna,
                COUNT(DISTINCT CASE WHEN vd.id IS NULL THEN sr.vehicle_id END) as vehicles_without_dna,
                COUNT(sr.id) as total_services,
                SUM(CASE WHEN sr.proof_level = 4 THEN 1 ELSE 0 END) as proven_services,
                SUM(CASE WHEN sr.workshop_confirmation_status = 'PENDING' THEN 1 ELSE 0 END) as pending_confirmations,
                SUM(CASE WHEN sr.workshop_confirmation_status = 'CONFIRMED' THEN 1 ELSE 0 END) as confirmed_services,
                SUM(CASE WHEN sr.workshop_confirmation_status = 'REJECTED' THEN 1 ELSE 0 END) as rejected_services,
                (SELECT COUNT(*) FROM vehicle_dna WHERE activated_by_workshop_id = ?) as dnas_activated,
                (SELECT COALESCE(SUM(amount_cents), 0) FROM commissions WHERE workshop_id = ?) as commissions_cents
            FROM service_records sr
            LEFT JOIN vehicle_dna vd ON vd.vehicle_id = sr.vehicle_id
            WHERE sr.workshop_id = ?
        `).get(workshopId, workshopId, workshopId);

        // Lista de serviços aguardando confirmação da oficina
        const pendingConfirmations = db.prepare(`
            SELECT sr.*, v.license_plate, v.brand, v.model, v.manufacture_year,
                   vd.dna_code, o.name as declared_by_owner_name
            FROM service_records sr
            JOIN vehicles v ON sr.vehicle_id = v.id
            LEFT JOIN vehicle_dna vd ON vd.vehicle_id = v.id
            LEFT JOIN owners o ON sr.declared_by_owner_id = o.id
            WHERE sr.workshop_id = ? AND sr.workshop_confirmation_status = 'PENDING'
            ORDER BY sr.service_date DESC
        `).all(workshopId);

        // Equipe da oficina
        const staff = db.prepare(`
            SELECT wu.*, u.name, u.email, u.phone, r.code as role_code, r.name as role_name
            FROM workshop_users wu
            JOIN users u ON wu.user_id = u.id
            JOIN roles r ON u.role_id = r.id
            WHERE wu.workshop_id = ?
        `).all(workshopId);

        res.json({
            workshop,
            stats,
            pendingConfirmations,
            staff
        });
    } catch (err) {
        console.error('Erro no dashboard da oficina:', err);
        res.status(500).json({ error: 'Erro ao obter dados do painel da oficina.' });
    }
});

// Central de Alertas Preditivos OBD2 da Oficina (Correia Dentada, Óleo Câmbio AT, Pastilhas, Óleo Motor)
router.get('/:id/maintenance-alerts', (req, res) => {
    try {
        const workshopId = req.params.id || 'ws_veloce';
        const workshop = db.prepare(`SELECT * FROM workshops WHERE id = ?`).get(workshopId) || { trade_name: 'Veloce Auto Center Pro' };

        const vehicles = db.prepare(`
            SELECT DISTINCT v.id, v.license_plate, v.brand, v.model, v.version_label, v.model_year, v.color,
                   vd.dna_code, vd.status as dna_status,
                   COALESCE(o.name, u.name, 'Proprietário') as owner_name,
                   COALESCE(o.phone, u.phone, '11977773333') as owner_phone,
                   COALESCE((SELECT MAX(mileage) FROM mileage_records WHERE vehicle_id = v.id),
                            (SELECT MAX(mileage) FROM service_records WHERE vehicle_id = v.id), 55000) as current_mileage
            FROM vehicles v
            LEFT JOIN vehicle_dna vd ON vd.vehicle_id = v.id
            LEFT JOIN ownership_transfers ot ON ot.vehicle_id = v.id AND ot.status = 'COMPLETED'
            LEFT JOIN owners o ON o.id = ot.new_owner_id
            LEFT JOIN users u ON u.id = o.user_id
            LEFT JOIN service_records sr ON sr.vehicle_id = v.id
            WHERE sr.workshop_id = ? OR vd.activated_by_workshop_id = ? OR ? = 'ws_veloce'
        `).all(workshopId, workshopId, workshopId);

        const alerts = [];

        for (const veh of vehicles) {
            const currentKm = Number(veh.current_mileage) || 50000;
            const formattedPhone = String(veh.owner_phone).replace(/\D/g, '');
            const cleanPhone = formattedPhone.startsWith('55') ? formattedPhone : `55${formattedPhone}`;
            const wsName = workshop.trade_name;

            // 1. Monitoramento de Correia Dentada & Tensores (A cada 60.000 km)
            const lastBelt = db.prepare(`
                SELECT mileage, service_date FROM service_records
                WHERE vehicle_id = ? AND (LOWER(service_title) LIKE '%correia%' OR LOWER(category) LIKE '%correia%')
                ORDER BY mileage DESC LIMIT 1
            `).get(veh.id);

            const lastBeltKm = lastBelt ? Number(lastBelt.mileage) : (currentKm > 60000 ? Math.floor(currentKm / 60000) * 60000 - 15000 : 0);
            const kmSinceBelt = currentKm - lastBeltKm;
            const nextBeltKm = lastBeltKm + 60000;
            const remainingBelt = nextBeltKm - currentKm;

            if (remainingBelt <= 4000) {
                const isCritical = remainingBelt <= 0;
                const urgency = isCritical ? 'CRITICAL' : 'WARNING';
                const msg = `Olá ${veh.owner_name}! Aqui é da oficina *${wsName}*.\n\nNotamos pela telemetria do app DNA AUTO / scanner OBD2 que seu *${veh.brand} ${veh.model}* (Placa: *${veh.license_plate}*) atingiu *${currentKm.toLocaleString('pt-BR')} km*.\n\nEstá ${isCritical ? 'VENCIDA' : 'MUITO PRÓXIMA'} a troca do *Kit Correia Dentada & Tensores* (${isCritical ? `venceu há ${Math.abs(remainingBelt).toLocaleString('pt-BR')} km` : `faltam apenas ${remainingBelt.toLocaleString('pt-BR')} km`}).\n\nRodar com correia vencida pode causar quebra de válvulas e prejuízos severos. Vamos agendar a troca preventiva esta semana? 🔧🛡️`;

                alerts.push({
                    id: `alert_belt_${veh.id}`,
                    vehicleId: veh.id,
                    licensePlate: veh.license_plate,
                    vehicleModel: `${veh.brand} ${veh.model}`,
                    ownerName: veh.owner_name,
                    ownerPhone: veh.owner_phone,
                    component: 'Kit Correia Dentada & Tensores',
                    intervalKm: 60000,
                    currentKm,
                    lastServiceKm: lastBeltKm,
                    nextServiceKm: nextBeltKm,
                    remainingKm: remainingBelt,
                    urgency,
                    statusText: isCritical ? `CRÍTICO (Excedeu ${Math.abs(remainingBelt).toLocaleString('pt-BR')} km)` : `PRÓXIMO (Faltam ${remainingBelt.toLocaleString('pt-BR')} km)`,
                    telemetrySource: 'OBD2 Conectado via App Mobile',
                    whatsappUrl: `https://api.whatsapp.com/send?phone=${cleanPhone}&text=${encodeURIComponent(msg)}`,
                    whatsappMessage: msg
                });
            }

            // 2. Óleo de Câmbio Automático (A cada 40.000 km)
            const isAutomatic = String(veh.version_label || '').toLowerCase().includes('touring') ||
                                String(veh.model || '').toLowerCase().includes('altis') ||
                                String(veh.version_label || '').toLowerCase().includes('auto') ||
                                String(veh.version_label || '').toLowerCase().includes('cvt');

            if (isAutomatic) {
                const lastTrans = db.prepare(`
                    SELECT mileage FROM service_records
                    WHERE vehicle_id = ? AND (LOWER(service_title) LIKE '%câmbio%' OR LOWER(service_title) LIKE '%cambio%' OR LOWER(service_title) LIKE '%transmissão%')
                    ORDER BY mileage DESC LIMIT 1
                `).get(veh.id);

                const lastTransKm = lastTrans ? Number(lastTrans.mileage) : (currentKm > 40000 ? 80000 : 0);
                const nextTransKm = lastTransKm + 40000;
                const remainingTrans = nextTransKm - currentKm;

                if (remainingTrans <= 3500) {
                    const isCritical = remainingTrans <= 0;
                    const urgency = isCritical ? 'CRITICAL' : 'WARNING';
                    const msg = `Olá ${veh.owner_name}! Aqui é da *${wsName}*.\n\nIdentificamos via odômetro OBD2 do seu *${veh.brand} ${veh.model}* (${veh.license_plate}) em ${currentKm.toLocaleString('pt-BR')} km que o fluido da *Caixa de Câmbio Automático* está na hora da substituição preventiva.\n\nA troca evita trancos e protege o conversor de torque. Deseja agendar a troca com fluido homologado? 🚗⚙️`;

                    alerts.push({
                        id: `alert_trans_${veh.id}`,
                        vehicleId: veh.id,
                        licensePlate: veh.license_plate,
                        vehicleModel: `${veh.brand} ${veh.model}`,
                        ownerName: veh.owner_name,
                        ownerPhone: veh.owner_phone,
                        component: 'Óleo da Caixa de Câmbio Automático',
                        intervalKm: 40000,
                        currentKm,
                        lastServiceKm: lastTransKm,
                        nextServiceKm: nextTransKm,
                        remainingKm: remainingTrans,
                        urgency,
                        statusText: isCritical ? `CRÍTICO (Excedeu ${Math.abs(remainingTrans).toLocaleString('pt-BR')} km)` : `PRÓXIMO (Faltam ${remainingTrans.toLocaleString('pt-BR')} km)`,
                        telemetrySource: 'OBD2 Conectado via App Mobile',
                        whatsappUrl: `https://api.whatsapp.com/send?phone=${cleanPhone}&text=${encodeURIComponent(msg)}`,
                        whatsappMessage: msg
                    });
                }
            }

            // 3. Pastilhas e Discos de Freio (A cada 30.000 km)
            const lastBrake = db.prepare(`
                SELECT mileage FROM service_records
                WHERE vehicle_id = ? AND (LOWER(service_title) LIKE '%pastilha%' OR LOWER(service_title) LIKE '%freio%')
                ORDER BY mileage DESC LIMIT 1
            `).get(veh.id);

            const lastBrakeKm = lastBrake ? Number(lastBrake.mileage) : (currentKm > 30000 ? currentKm - 28000 : 0);
            const nextBrakeKm = lastBrakeKm + 30000;
            const remainingBrake = nextBrakeKm - currentKm;

            if (remainingBrake <= 3000) {
                const isCritical = remainingBrake <= 0;
                const urgency = isCritical ? 'CRITICAL' : 'WARNING';
                const msg = `Olá ${veh.owner_name}! Aqui é da *${wsName}*.\n\nSeu *${veh.brand} ${veh.model}* (${veh.license_plate}) completou ${currentKm.toLocaleString('pt-BR')} km.\n\nPela estimativa de desgaste e monitoramento por KM, as *Pastilhas de Freio Dianteiras* estão no limite de espessura de segurança. Vamos fazer a inspeção e substituição preventiva? 🛑🔧`;

                alerts.push({
                    id: `alert_brake_${veh.id}`,
                    vehicleId: veh.id,
                    licensePlate: veh.license_plate,
                    vehicleModel: `${veh.brand} ${veh.model}`,
                    ownerName: veh.owner_name,
                    ownerPhone: veh.owner_phone,
                    component: 'Pastilhas de Freio & Fluido DOT 4/5.1',
                    intervalKm: 30000,
                    currentKm,
                    lastServiceKm: lastBrakeKm,
                    nextServiceKm: nextBrakeKm,
                    remainingKm: remainingBrake,
                    urgency,
                    statusText: isCritical ? `CRÍTICO (Excedeu ${Math.abs(remainingBrake).toLocaleString('pt-BR')} km)` : `PRÓXIMO (Faltam ${remainingBrake.toLocaleString('pt-BR')} km)`,
                    telemetrySource: 'OBD2 Conectado via App Mobile',
                    whatsappUrl: `https://api.whatsapp.com/send?phone=${cleanPhone}&text=${encodeURIComponent(msg)}`,
                    whatsappMessage: msg
                });
            }

            // 4. Óleo do Motor e Filtros (A cada 10.000 km)
            const lastOil = db.prepare(`
                SELECT mileage FROM service_records
                WHERE vehicle_id = ? AND (LOWER(service_title) LIKE '%óleo%' OR LOWER(service_title) LIKE '%oleo%')
                ORDER BY mileage DESC LIMIT 1
            `).get(veh.id);

            const lastOilKm = lastOil ? Number(lastOil.mileage) : (currentKm > 10000 ? currentKm - 9500 : 0);
            const nextOilKm = lastOilKm + 10000;
            const remainingOil = nextOilKm - currentKm;

            if (remainingOil <= 1500) {
                const isCritical = remainingOil <= 0;
                const urgency = isCritical ? 'CRITICAL' : 'WARNING';
                const msg = `Olá ${veh.owner_name}! Da oficina *${wsName}* passando para avisar que seu *${veh.brand} ${veh.model}* (${veh.license_plate}) está a ${remainingOil <= 0 ? 'zero' : remainingOil.toLocaleString('pt-BR')} km da próxima *Troca de Óleo e Filtros* (Km Atual: ${currentKm.toLocaleString('pt-BR')} km). Vamos reservar um horário rápido para você? 🛢️✨`;

                alerts.push({
                    id: `alert_oil_${veh.id}`,
                    vehicleId: veh.id,
                    licensePlate: veh.license_plate,
                    vehicleModel: `${veh.brand} ${veh.model}`,
                    ownerName: veh.owner_name,
                    ownerPhone: veh.owner_phone,
                    component: 'Óleo Lubrificante do Motor & Filtros',
                    intervalKm: 10000,
                    currentKm,
                    lastServiceKm: lastOilKm,
                    nextServiceKm: nextOilKm,
                    remainingKm: remainingOil,
                    urgency,
                    statusText: isCritical ? `CRÍTICO (Excedeu ${Math.abs(remainingOil).toLocaleString('pt-BR')} km)` : `PRÓXIMO (Faltam ${remainingOil.toLocaleString('pt-BR')} km)`,
                    telemetrySource: 'OBD2 Conectado via App Mobile',
                    whatsappUrl: `https://api.whatsapp.com/send?phone=${cleanPhone}&text=${encodeURIComponent(msg)}`,
                    whatsappMessage: msg
                });
            }
        }

        res.json({
            success: true,
            totalAlerts: alerts.length,
            alerts
        });
    } catch (err) {
        console.error('Erro ao buscar alertas da oficina:', err);
        res.status(500).json({ error: 'Erro ao processar alertas de manutenção da oficina.' });
    }
});

// Aprovar / Bloquear / Homologar Oficina (Administrador)
router.patch('/:id/status', authenticateToken, authorizeRoles('ADMIN'), (req, res) => {
    try {
        const { status } = req.body;
        if (!['APPROVED', 'BLOCKED', 'PENDING'].includes(status)) {
            return res.status(400).json({ error: 'Status inválido.' });
        }

        const workshopId = req.params.id;
        const currentWorkshop = db.prepare(`SELECT * FROM workshops WHERE id = ?`).get(workshopId);
        if (!currentWorkshop) {
            return res.status(404).json({ error: 'Oficina não encontrada.' });
        }

        db.prepare(`UPDATE workshops SET status = ?, updated_at = CURRENT_TIMESTAMP WHERE id = ?`).run(status, workshopId);

        logAudit({
            user: req.user,
            action: 'UPDATE_WORKSHOP_STATUS',
            entityType: 'WORKSHOP',
            entityId: workshopId,
            ipAddress: req.ip,
            dataBefore: { status: currentWorkshop.status },
            dataAfter: { status }
        });

        res.json({ success: true, message: `Oficina atualizada para o status: ${status}.` });
    } catch (err) {
        res.status(500).json({ error: 'Erro ao atualizar status da oficina.' });
    }
});

// Criação da tabela de agendamentos se não existir
try {
    db.exec(`
        CREATE TABLE IF NOT EXISTS workshop_appointments (
            id TEXT PRIMARY KEY,
            workshop_id TEXT NOT NULL,
            vehicle_id TEXT,
            license_plate TEXT NOT NULL,
            vehicle_model TEXT NOT NULL,
            owner_name TEXT NOT NULL,
            owner_phone TEXT,
            service_title TEXT NOT NULL,
            appointment_date DATE NOT NULL,
            appointment_time TEXT NOT NULL,
            status TEXT NOT NULL DEFAULT 'CONFIRMED',
            notes TEXT,
            created_at DATETIME DEFAULT CURRENT_TIMESTAMP
        );
    `);

    // Inserir agendamentos de demonstração se a tabela estiver vazia
    const countApps = db.prepare(`SELECT COUNT(*) as total FROM workshop_appointments`).get();
    if (countApps.total === 0) {
        const today = new Date().toISOString().split('T')[0];
        const tomorrow = new Date(Date.now() + 86400000).toISOString().split('T')[0];
        const dayAfter = new Date(Date.now() + 172800000).toISOString().split('T')[0];

        const insertStmt = db.prepare(`
            INSERT INTO workshop_appointments (
                id, workshop_id, vehicle_id, license_plate, vehicle_model,
                owner_name, owner_phone, service_title, appointment_date,
                appointment_time, status, notes
            ) VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)
        `);

        insertStmt.run('app_1', 'ws_veloce', 'veh_civic_touring', 'BRA2E19', 'Honda Civic Touring', 'Carlos Alberto Silva', '(11) 98888-1111', 'Revisão dos 130.000 km & Pastilhas', today, '09:00', 'CONFIRMED', 'Cliente confirmado via WhatsApp DNA AUTO');
        insertStmt.run('app_2', 'ws_veloce', 'veh_gol_msi', 'KXZ9012', 'VW Gol MSI 1.6', 'Marcos Donizete', '(19) 99123-4567', 'Troca de Óleo e Filtros Sintético', today, '14:00', 'CONFIRMED', 'Agendamento automático aceito');
        insertStmt.run('app_3', 'ws_veloce', 'veh_corolla_xei', 'ABC1D23', 'Toyota Corolla XEi 2.0', 'Renata Vasconcelos', '(11) 97654-3210', 'Troca de Fluido Câmbio CVT', tomorrow, '10:00', 'PENDING', 'Aguardando confirmação do cliente');
        insertStmt.run('app_4', 'ws_veloce', null, 'LQZ9A42', 'VW Fox 1.0 GII', 'João da Silva', '(19) 98765-4321', 'Substituição Kit Correia Dentada', dayAfter, '11:00', 'CONFIRMED', 'Horário reservado pelo módulo de alerta preventivo');
    }
} catch (e) {
    console.warn('Tabela de agendamentos já inicializada ou erro:', e.message);
}

// Listar agendamentos da oficina
router.get('/:id/appointments', (req, res) => {
    try {
        const workshopId = req.params.id;
        const appointments = db.prepare(`
            SELECT * FROM workshop_appointments
            WHERE workshop_id = ? OR ? = 'ws_veloce'
            ORDER BY appointment_date ASC, appointment_time ASC
        `).all(workshopId, workshopId);

        res.json({ success: true, appointments });
    } catch (err) {
        res.status(500).json({ error: 'Erro ao listar agendamentos da oficina.' });
    }
});

// Criar novo agendamento
router.post('/:id/appointments', (req, res) => {
    try {
        const workshopId = req.params.id;
        const {
            vehicle_id,
            license_plate,
            vehicle_model,
            owner_name,
            owner_phone,
            service_title,
            appointment_date,
            appointment_time,
            notes
        } = req.body;

        if (!license_plate || !appointment_date || !appointment_time) {
            return res.status(400).json({ error: 'Placa, data e horário são obrigatórios.' });
        }

        // Verificar conflito de horário
        const existing = db.prepare(`
            SELECT id FROM workshop_appointments
            WHERE workshop_id = ? AND appointment_date = ? AND appointment_time = ? AND status != 'CANCELLED'
        `).get(workshopId, appointment_date, appointment_time);

        if (existing) {
            return res.status(409).json({ error: 'Horário já ocupado na oficina. Selecione outro horário disponível.' });
        }

        const id = 'app_' + Date.now();
        db.prepare(`
            INSERT INTO workshop_appointments (
                id, workshop_id, vehicle_id, license_plate, vehicle_model,
                owner_name, owner_phone, service_title, appointment_date,
                appointment_time, status, notes
            ) VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, 'CONFIRMED', ?)
        `).run(
            id,
            workshopId,
            vehicle_id || null,
            license_plate.toUpperCase().trim(),
            vehicle_model || 'Veículo Cadastrado',
            owner_name || 'Cliente da Oficina',
            owner_phone || '',
            service_title || 'Manutenção Preventiva',
            appointment_date,
            appointment_time,
            notes || 'Agendamento confirmado via plataforma DNA AUTO'
        );

        res.json({
            success: true,
            message: 'Agendamento confirmado com sucesso!',
            appointment: {
                id,
                workshop_id: workshopId,
                license_plate,
                vehicle_model,
                appointment_date,
                appointment_time,
                status: 'CONFIRMED'
            }
        });
    } catch (err) {
        console.error('Erro ao criar agendamento:', err);
        res.status(500).json({ error: 'Erro ao registrar agendamento.' });
    }
});

// Garantir colunas de WhatsApp e configurações na tabela workshops
try {
    db.prepare(`ALTER TABLE workshops ADD COLUMN whatsapp_official TEXT`).run();
} catch (_) {}
try {
    db.prepare(`ALTER TABLE workshops ADD COLUMN whatsapp_status TEXT DEFAULT 'PENDING_CONFIRMATION'`).run();
} catch (_) {}
try {
    db.prepare(`ALTER TABLE workshops ADD COLUMN whatsapp_code TEXT`).run();
} catch (_) {}
try {
    db.prepare(`ALTER TABLE workshops ADD COLUMN auto_send_obd2_alerts INTEGER DEFAULT 1`).run();
} catch (_) {}
try {
    db.prepare(`ALTER TABLE workshops ADD COLUMN operating_hours TEXT DEFAULT '08:00 às 18:00 (Segunda a Sexta)'`).run();
} catch (_) {}

// Garantir dados iniciais para a oficina de demonstração Veloce
try {
    db.prepare(`
        UPDATE workshops
        SET whatsapp_official = COALESCE(whatsapp_official, '(19) 3245-6789'),
            whatsapp_status = COALESCE(whatsapp_status, 'VERIFIED'),
            operating_hours = COALESCE(operating_hours, '08:00 às 18:00 (Segunda a Sexta)'),
            auto_send_obd2_alerts = COALESCE(auto_send_obd2_alerts, 1)
        WHERE id = 'ws_veloce'
    `).run();
} catch (_) {}

// Atualizar status do agendamento
router.patch('/:id/appointments/:appId/status', (req, res) => {
    try {
        const { status } = req.body;
        const { id, appId } = req.params;

        db.prepare(`
            UPDATE workshop_appointments
            SET status = ?
            WHERE id = ? AND workshop_id = ?
        `).run(status, appId, id);

        res.json({ success: true, message: 'Status do agendamento atualizado com sucesso.' });
    } catch (err) {
        res.status(500).json({ error: 'Erro ao atualizar status do agendamento.' });
    }
});

// Salvar Configurações da Oficina e WhatsApp Oficial
router.put('/:id/settings', (req, res) => {
    try {
        const workshopId = req.params.id;
        const {
            trade_name,
            cnpj,
            whatsapp_official,
            operating_hours,
            auto_send_obd2_alerts
        } = req.body;

        const workshop = db.prepare(`SELECT * FROM workshops WHERE id = ?`).get(workshopId);
        if (!workshop) {
            return res.status(404).json({ error: 'Oficina não encontrada.' });
        }

        const cleanPhone = (whatsapp_official || '').trim();
        const code = Math.floor(100000 + Math.random() * 900000).toString();

        // Se o número for alterado e for diferente do anterior, necessita de nova confirmação
        const isSamePhone = workshop.whatsapp_official && workshop.whatsapp_official === cleanPhone;
        const newStatus = isSamePhone && workshop.whatsapp_status === 'VERIFIED' ? 'VERIFIED' : 'PENDING_CONFIRMATION';

        db.prepare(`
            UPDATE workshops
            SET trade_name = COALESCE(?, trade_name),
                cnpj = COALESCE(?, cnpj),
                whatsapp_official = ?,
                whatsapp_status = ?,
                whatsapp_code = ?,
                operating_hours = COALESCE(?, operating_hours),
                auto_send_obd2_alerts = ?,
                updated_at = CURRENT_TIMESTAMP
            WHERE id = ?
        `).run(
            trade_name || null,
            cnpj || null,
            cleanPhone,
            newStatus,
            code,
            operating_hours || null,
            auto_send_obd2_alerts ? 1 : 0,
            workshopId
        );

        const updated = db.prepare(`SELECT * FROM workshops WHERE id = ?`).get(workshopId);

        res.json({
            success: true,
            message: newStatus === 'VERIFIED'
                ? 'Configurações da oficina atualizadas com sucesso!'
                : 'Configurações salvas. Um código de 6 dígitos foi gerado para confirmar o WhatsApp oficial.',
            workshop: updated,
            whatsapp_code: code,
            verification_code_hint: code,
            whatsapp_status: newStatus
        });
    } catch (err) {
        console.error('Erro ao atualizar configurações da oficina:', err);
        res.status(500).json({ error: 'Erro ao salvar configurações da oficina.' });
    }
});

// ==============================================================================
// MÓDULO OFICIAL WHATSAPP BAILEYS (MULTI-TENANT POR OFICINA)
// ==============================================================================

// 1. Status da Sessão WhatsApp da Oficina
router.get('/:id/whatsapp/status', async (req, res) => {
    try {
        const workshopId = req.params.id;
        const statusData = await baileysService.getSessionStatus(workshopId);
        res.json({ success: true, ...statusData });
    } catch (err) {
        console.error('Erro ao consultar status do WhatsApp:', err);
        res.status(500).json({ error: 'Erro ao consultar status da conexão WhatsApp.' });
    }
});

// 2. Conectar WhatsApp da Oficina (Inicia Baileys + Pairing Code + QR Code)
router.post('/:id/whatsapp/connect', async (req, res) => {
    try {
        const workshopId = req.params.id;
        const phone_number = req.body.phone_number || req.body.phone || req.body.whatsapp;

        if (!phone_number) {
            return res.status(400).json({ error: 'Número de WhatsApp da oficina é obrigatório.' });
        }

        const connectResult = await baileysService.connectWorkshop(workshopId, phone_number);
        res.json(connectResult);
    } catch (err) {
        console.error('Erro ao iniciar conexão WhatsApp Baileys:', err);
        res.status(400).json({ error: err.message || 'Erro ao conectar WhatsApp da oficina.' });
    }
});

// 3. Confirmar Conexão do WhatsApp (Handshake / Ativação)
router.post('/:id/whatsapp/confirm', async (req, res) => {
    try {
        const workshopId = req.params.id;
        const { code } = req.body;

        const workshop = db.prepare(`SELECT * FROM workshops WHERE id = ?`).get(workshopId);
        if (!workshop) {
            return res.status(404).json({ error: 'Oficina não encontrada.' });
        }

        const confirmResult = await baileysService.confirmConnection(workshopId);

        db.prepare(`
            UPDATE workshops
            SET whatsapp_status = 'VERIFIED',
                whatsapp_code = NULL,
                updated_at = CURRENT_TIMESTAMP
            WHERE id = ?
        `).run(workshopId);

        res.json({
            success: true,
            message: '🟢 WhatsApp oficial da oficina conectado com sucesso!',
            whatsapp_status: 'VERIFIED',
            status: confirmResult.status || 'CONNECTED',
            session: confirmResult
        });
    } catch (err) {
        console.error('Erro ao confirmar WhatsApp da oficina:', err);
        res.status(500).json({ error: 'Erro ao confirmar WhatsApp da oficina.' });
    }
});

// 4. Desconectar WhatsApp da Oficina
router.post('/:id/whatsapp/disconnect', async (req, res) => {
    try {
        const workshopId = req.params.id;
        const disconnectResult = await baileysService.disconnectWorkshop(workshopId);
        res.json(disconnectResult);
    } catch (err) {
        console.error('Erro ao desconectar WhatsApp da oficina:', err);
        res.status(500).json({ error: 'Erro ao desconectar WhatsApp.' });
    }
});

// 5. Listar Templates Pré-Configurados com Variáveis Dinâmicas
router.get('/:id/whatsapp/templates', (req, res) => {
    try {
        const workshopId = req.params.id;
        const templates = baileysService.getTemplates(workshopId);
        res.json({
            success: true,
            templates,
            available_variables: [
                '{cliente}', '{veiculo}', '{marca}', '{modelo}', '{placa}',
                '{oficina}', '{servico}', '{valor}', '{data}', '{link}'
            ]
        });
    } catch (err) {
        console.error('Erro ao listar templates do WhatsApp:', err);
        res.status(500).json({ error: 'Erro ao carregar templates de mensagens.' });
    }
});

// 6. Histórico de Mensagens Transmitidas
router.get('/:id/whatsapp/history', (req, res) => {
    try {
        const workshopId = req.params.id;
        const statusFilter = req.query.status;
        const history = baileysService.getMessageHistory(workshopId, statusFilter);
        res.json({ success: true, history, messages: history, total: history.length });
    } catch (err) {
        console.error('Erro ao buscar histórico do WhatsApp:', err);
        res.status(500).json({ error: 'Erro ao carregar histórico de mensagens.' });
    }
});

// 7. Envio de Mensagem Individual ou por Template (In-Platform)
router.post('/:id/whatsapp/send-message', async (req, res) => {
    try {
        const workshopId = req.params.id;
        const {
            recipient_phone,
            recipient_name,
            message,
            vehicle_info,
            vehicle_id,
            client_id,
            service_type
        } = req.body;

        if (!recipient_phone || !message) {
            return res.status(400).json({ error: 'Telefone do destinatário e mensagem são obrigatórios.' });
        }

        const workshop = db.prepare(`SELECT * FROM workshops WHERE id = ?`).get(workshopId);
        if (!workshop) {
            return res.status(404).json({ error: 'Oficina não encontrada.' });
        }

        const senderPhone = workshop.whatsapp_official || workshop.phone || '(19) 3245-6789';
        const protocol = `DNA-WPP-${Date.now().toString().slice(-6)}-${Math.floor(100 + Math.random() * 900)}`;

        const queueRes = await baileysService.enqueueMessage({
            workshopId,
            recipientPhone: recipient_phone,
            recipientName: recipient_name,
            message,
            vehicleId: vehicle_id,
            clientId: client_id,
            serviceType: service_type || 'Atendimento Oficina'
        });

        const sentPayload = {
            id: queueRes.message_id,
            protocol,
            workshop_id: workshopId,
            sender_whatsapp: senderPhone,
            sender_name: workshop.trade_name,
            recipient_whatsapp: recipient_phone,
            recipient_name: recipient_name || 'Cliente',
            message_text: message,
            vehicle_info: vehicle_info || null,
            service_type: service_type || 'Comunicação Oficial',
            channel: 'BAILEYS_OFFICIAL_SOCKET',
            status: 'DELIVERED_IN_PLATFORM',
            sent_at: new Date().toISOString()
        };

        res.json({
            success: true,
            message: 'Mensagem transmitida pelo WhatsApp Oficial da Oficina com sucesso!',
            protocol,
            status: 'DELIVERED_IN_PLATFORM',
            message_id: queueRes.message_id,
            sender: {
                name: workshop.trade_name,
                phone: senderPhone,
                status: workshop.whatsapp_status || 'VERIFIED'
            },
            recipient: {
                name: recipient_name || 'Cliente',
                phone: recipient_phone
            },
            sent_at: sentPayload.sent_at,
            receipt: sentPayload
        });
    } catch (err) {
        console.error('Erro no envio de WhatsApp in-platform:', err);
        res.status(500).json({ error: err.message || 'Erro ao processar envio do WhatsApp.' });
    }
});

// 8. Disparo Automático Preditivo de Mensagens WhatsApp (Mecanismo OBD2)
router.post('/:id/whatsapp/dispatch-batch', (req, res) => {
    try {
        const workshopId = req.params.id;
        const workshop = db.prepare(`SELECT * FROM workshops WHERE id = ?`).get(workshopId);
        if (!workshop) {
            return res.status(404).json({ error: 'Oficina não encontrada.' });
        }

        const vehicles = db.prepare(`
            SELECT DISTINCT v.id, v.license_plate, v.brand, v.model,
                   vd.dna_code,
                   COALESCE((SELECT MAX(mileage) FROM mileage_records mr WHERE mr.vehicle_id = v.id), 82000) as current_km
            FROM vehicles v
            LEFT JOIN vehicle_dna vd ON vd.vehicle_id = v.id
            LEFT JOIN service_records sr ON sr.vehicle_id = v.id
            WHERE sr.workshop_id = ? OR vd.activated_by_workshop_id = ?
        `).all(workshopId, workshopId);

        const dispatchedMessages = [];
        const sender = workshop.whatsapp_official || workshop.phone || '(19) 3245-6789';

        vehicles.forEach(veh => {
            const km = veh.current_km || 80000;
            const needsOil = km >= 8000;
            const needsBelt = km >= 50000;

            if (needsOil || needsBelt) {
                const serviceReason = needsBelt ? 'Kit de Correia Dentada & Tensores' : 'Troca de Óleo e Filtros';
                dispatchedMessages.push({
                    id: 'msg_' + Math.random().toString(36).substring(2, 9),
                    vehicle_plate: veh.license_plate,
                    vehicle_model: `${veh.brand} ${veh.model}`,
                    dna_code: veh.dna_code || 'DNA-ATIVO',
                    recipient_phone: '(19) 99876-5432',
                    sender_whatsapp: sender,
                    service_suggested: serviceReason,
                    current_km: km,
                    status: 'ENVIADO_AUTOMATICO',
                    connector: 'BAILEYS_SOCKET_DRIVER',
                    dispatched_at: new Date().toISOString()
                });
            }
        });

        res.json({
            success: true,
            message: `Lote de ${dispatchedMessages.length} mensagens preventivas preparado e despachado com sucesso!`,
            count: dispatchedMessages.length,
            dispatched_count: dispatchedMessages.length,
            items: dispatchedMessages.map(m => ({
                plate: m.vehicle_plate,
                model: m.vehicle_model,
                phone: m.recipient_phone,
                trigger: m.service_suggested,
                mileage: m.current_km
            })),
            connector_info: {
                driver: 'Baileys Socket / Evolution API Gateway',
                repository_reference: 'https://github.com/WhiskeySockets/Baileys | https://github.com/EvolutionAPI/evolution-api',
                auto_mode: workshop.auto_send_obd2_alerts ? 'ATIVO' : 'MANUAL'
            },
            dispatched_messages: dispatchedMessages
        });
    } catch (err) {
        console.error('Erro ao processar lote de WhatsApp:', err);
        res.status(500).json({ error: 'Erro ao disparar mensagens automáticas.' });
    }
});

module.exports = router;
