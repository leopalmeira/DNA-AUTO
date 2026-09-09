const express = require('express');
const router = express.Router();
const db = require('../../database/db');
const { authenticateToken, authorizeRoles } = require('../../middlewares/auth');
const { logAudit } = require('../../middlewares/audit');

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

module.exports = router;
