const express = require('express');
const router = express.Router();
const db = require('../../database/db');

// Estatísticas Globais da Rede DNA AUTO com Foco em Negócio e Faturamento
router.get('/network-stats', (req, res) => {
    try {
        const totalVehicles = db.prepare(`SELECT COUNT(*) as count FROM vehicles`).get().count;
        const vehiclesWithDna = db.prepare(`SELECT COUNT(*) as count FROM vehicle_dna WHERE status = 'ACTIVE'`).get().count;
        const totalWorkshops = db.prepare(`SELECT COUNT(*) as count FROM workshops`).get().count;
        const activeWorkshops = db.prepare(`SELECT COUNT(*) as count FROM workshops WHERE status = 'APPROVED'`).get().count;
        const pendingWorkshops = db.prepare(`SELECT COUNT(*) as count FROM workshops WHERE status = 'PENDING'`).get().count;

        const totalServices = db.prepare(`SELECT COUNT(*) as count FROM service_records`).get().count;
        const provenServices = db.prepare(`SELECT COUNT(*) as count FROM service_records WHERE proof_level = 4`).get().count;
        const confirmedServices = db.prepare(`SELECT COUNT(*) as count FROM service_records WHERE proof_level = 3`).get().count;
        const declaredServices = db.prepare(`SELECT COUNT(*) as count FROM service_records WHERE proof_level = 1`).get().count;
        const pendingServices = db.prepare(`SELECT COUNT(*) as count FROM service_records WHERE workshop_confirmation_status = 'PENDING'`).get().count;

        const totalOwners = db.prepare(`SELECT COUNT(*) as count FROM owners`).get().count;
        const totalTransfers = db.prepare(`SELECT COUNT(*) as count FROM ownership_transfers WHERE status = 'COMPLETED'`).get().count;
        const totalInvoices = db.prepare(`SELECT COUNT(*) as count FROM invoices`).get().count;
        const totalPhotos = db.prepare(`SELECT COUNT(*) as count FROM vehicle_photos`).get().count;

        // Faturamento da Plataforma: Ativações de DNA + Comissões
        const dnaRevenueCents = db.prepare(`SELECT COALESCE(SUM(activation_fee_cents), 0) as total FROM vehicle_dna WHERE status = 'ACTIVE'`).get().total;
        const servicesVolumeCents = db.prepare(`SELECT COALESCE(SUM(total_cost_cents), 0) as total FROM service_records`).get().total;
        const totalCommissionsCents = db.prepare(`SELECT COALESCE(SUM(amount_cents), 0) as total FROM commissions`).get().total;

        // Volume bruto total movimentado na rede
        const totalGrossRevenueCents = dnaRevenueCents + servicesVolumeCents;
        const averageServiceTicketCents = totalServices > 0 ? Math.round(servicesVolumeCents / totalServices) : 0;

        // Cidades atendidas
        const citiesCount = db.prepare(`SELECT COUNT(DISTINCT city) as count FROM workshops WHERE status = 'APPROVED'`).get().count;

        // Crescimento recente (serviços e DNAs por categoria)
        const recentServices = db.prepare(`
            SELECT sr.*, v.license_plate, v.brand, v.model, vd.dna_code, w.trade_name as workshop_name
            FROM service_records sr
            JOIN vehicles v ON sr.vehicle_id = v.id
            LEFT JOIN vehicle_dna vd ON vd.vehicle_id = v.id
            LEFT JOIN workshops w ON sr.workshop_id = w.id
            ORDER BY sr.service_date DESC, sr.created_at DESC
            LIMIT 10
        `).all();

        // Oficinas com estatísticas de clientes, carros e faturamento gerado
        const growthByWorkshops = db.prepare(`
            SELECT w.id, w.company_name, w.trade_name, w.cnpj, w.phone, w.email, w.city, w.state, w.status,
                   COUNT(DISTINCT vd.id) as dnas_activated,
                   COUNT(DISTINCT sr.id) as services_recorded,
                   SUM(CASE WHEN sr.proof_level = 4 THEN 1 ELSE 0 END) as proven_services,
                   COALESCE(SUM(sr.total_cost_cents), 0) as total_services_amount_cents,
                   COUNT(DISTINCT sr.vehicle_id) as distinct_vehicles_serviced
            FROM workshops w
            LEFT JOIN vehicle_dna vd ON vd.activated_by_workshop_id = w.id
            LEFT JOIN service_records sr ON sr.workshop_id = w.id
            GROUP BY w.id
            ORDER BY dnas_activated DESC, proven_services DESC, total_services_amount_cents DESC
        `).all();

        res.json({
            network: {
                totalVehicles,
                vehiclesWithDna,
                vehiclesWithoutDna: totalVehicles - vehiclesWithDna,
                totalWorkshops,
                activeWorkshops,
                pendingWorkshops,
                totalClients: totalOwners,
                totalServices,
                provenServices,
                confirmedServices,
                declaredServices,
                pendingServices,
                totalTransfers,
                totalInvoices,
                totalPhotos,
                citiesCount,
                dnaRevenueCents,
                servicesVolumeCents,
                totalGrossRevenueCents,
                averageServiceTicketCents,
                totalCommissionsCents
            },
            financial: {
                totalGrossRevenueCents,
                dnaRevenueCents,
                servicesVolumeCents,
                averageServiceTicketCents,
                totalCommissionsCents
            },
            recentServices,
            growthByWorkshops
        });
    } catch (err) {
        console.error('Erro ao obter estatísticas da rede:', err);
        res.status(500).json({ error: 'Erro ao gerar métricas da rede DNA AUTO.' });
    }
});

// Detalhes de uma Oficina: Lista de Clientes e seus Veículos Atendidos
router.get('/workshops/:id/clients', (req, res) => {
    try {
        const workshopId = req.params.id;
        const workshop = db.prepare('SELECT * FROM workshops WHERE id = ?').get(workshopId);

        if (!workshop) {
            return res.status(404).json({ error: 'Oficina não encontrada.' });
        }

        // Buscar veículos atendidos pela oficina com dados do proprietário atual
        const clients = db.prepare(`
            SELECT 
                v.id as vehicle_id,
                v.license_plate,
                v.brand,
                v.model,
                v.version_label,
                v.model_year,
                v.color,
                v.photo_url,
                vd.dna_code,
                vd.status as dna_status,
                vd.activated_at as dna_activated_at,
                COALESCE(o.name, u.name, 'Proprietário Particular') as owner_name,
                COALESCE(o.phone, u.phone, '(11) 98888-0000') as owner_phone,
                COALESCE(o.email, u.email, 'cliente@email.com') as owner_email,
                MAX(sr.service_date) as last_service_date,
                MAX(sr.mileage) as last_recorded_mileage,
                COUNT(sr.id) as workshop_services_count,
                COALESCE(SUM(sr.total_cost_cents), 0) as total_spent_cents
            FROM vehicles v
            LEFT JOIN vehicle_dna vd ON vd.vehicle_id = v.id
            LEFT JOIN service_records sr ON sr.vehicle_id = v.id AND sr.workshop_id = ?
            LEFT JOIN ownership_transfers ot ON ot.vehicle_id = v.id AND ot.status = 'COMPLETED'
            LEFT JOIN owners o ON o.id = ot.new_owner_id OR o.id = sr.declared_by_owner_id
            LEFT JOIN users u ON u.id = o.user_id
            WHERE sr.workshop_id = ? OR vd.activated_by_workshop_id = ?
            GROUP BY v.id
            ORDER BY last_service_date DESC, total_spent_cents DESC
        `).all(workshopId, workshopId, workshopId);

        res.json({
            success: true,
            workshop,
            clientsCount: clients.length,
            clients
        });
    } catch (err) {
        console.error('Erro ao buscar clientes da oficina:', err);
        res.status(500).json({ error: 'Erro ao consultar clientes da oficina.' });
    }
});

// Central de Alertas Preventivos WhatsApp (Troca de Óleo, Correias e Freios)
router.get('/maintenance-alerts', (req, res) => {
    try {
        const vehicles = db.prepare(`
            SELECT v.id, v.license_plate, v.brand, v.model, v.version_label, v.model_year, v.color,
                   vd.dna_code, vd.status as dna_status,
                   COALESCE(o.name, u.name, 'Proprietário') as owner_name,
                   COALESCE(o.phone, u.phone, '11977773333') as owner_phone,
                   COALESCE(o.email, u.email, '') as owner_email,
                   w.trade_name as preferred_workshop_name,
                   w.phone as preferred_workshop_phone,
                   COALESCE(MAX(mr.mileage), MAX(sr.mileage), 50000) as current_mileage
            FROM vehicles v
            LEFT JOIN vehicle_dna vd ON vd.vehicle_id = v.id
            LEFT JOIN ownership_transfers ot ON ot.vehicle_id = v.id AND ot.status = 'COMPLETED'
            LEFT JOIN owners o ON o.id = ot.new_owner_id
            LEFT JOIN users u ON u.id = o.user_id
            LEFT JOIN mileage_records mr ON mr.vehicle_id = v.id
            LEFT JOIN service_records sr ON sr.vehicle_id = v.id
            LEFT JOIN workshops w ON w.id = sr.workshop_id OR w.id = vd.activated_by_workshop_id
            GROUP BY v.id
        `).all();

        const alerts = [];

        for (const veh of vehicles) {
            const currentKm = Number(veh.current_mileage) || 0;

            // 1. Última Troca de Óleo
            const lastOil = db.prepare(`
                SELECT service_date, mileage, service_title
                FROM service_records
                WHERE vehicle_id = ? AND (LOWER(category) LIKE '%lubrific%' OR LOWER(service_title) LIKE '%óleo%' OR LOWER(service_title) LIKE '%oleo%')
                ORDER BY service_date DESC, mileage DESC
                LIMIT 1
            `).get(veh.id);

            const lastOilKm = lastOil ? Number(lastOil.mileage) : (currentKm > 10000 ? currentKm - 11000 : 0);
            const kmSinceOil = currentKm - lastOilKm;

            if (kmSinceOil >= 8000) {
                const urgency = kmSinceOil >= 10000 ? 'CRITICAL' : 'WARNING';
                const formattedPhone = String(veh.owner_phone).replace(/\D/g, '');
                const cleanPhone = formattedPhone.startsWith('55') ? formattedPhone : `55${formattedPhone}`;
                const workshopName = veh.preferred_workshop_name || 'Rede DNA AUTO';

                const message = `Olá ${veh.owner_name}! Tudo bem?\n\nAqui é do DNA AUTO em parceria com a oficina *${workshopName}*.\n\nConstatamos que o seu *${veh.brand} ${veh.model}* (Placa: *${veh.license_plate}*) atingiu *${currentKm.toLocaleString('pt-BR')} km*.\n\nPelos registros do seu Passaporte Digital, já se passaram *${kmSinceOil.toLocaleString('pt-BR')} km* desde a última revisão de óleo. Está na hora de realizar a *Troca Preventiva de Óleo e Filtros* para manter seu histórico Nível 4 sempre valorizado e evitar desgastes.\n\nDeseja que reservemos o seu horário com condições especiais exclusivas da rede? 🚗✨`;

                alerts.push({
                    id: `alert_oil_${veh.id}`,
                    vehicleId: veh.id,
                    licensePlate: veh.license_plate,
                    vehicleModel: `${veh.brand} ${veh.model}`,
                    currentMileage: currentKm,
                    ownerName: veh.owner_name,
                    ownerPhone: veh.owner_phone,
                    workshopName,
                    serviceType: 'Troca de Óleo e Filtros',
                    urgency,
                    reason: `${kmSinceOil.toLocaleString('pt-BR')} km rodados desde a última troca de lubrificante`,
                    recommendation: 'Recomendada troca a cada 10.000 km ou 6 meses.',
                    whatsappUrl: `https://api.whatsapp.com/send?phone=${cleanPhone}&text=${encodeURIComponent(message)}`,
                    whatsappMessage: message
                });
            }

            // 2. Revisão de Correia Dentada / Kit de Acessórios
            const lastBelt = db.prepare(`
                SELECT service_date, mileage, service_title
                FROM service_records
                WHERE vehicle_id = ? AND (LOWER(category) LIKE '%correia%' OR LOWER(service_title) LIKE '%correia%' OR LOWER(service_title) LIKE '%dentada%')
                ORDER BY service_date DESC, mileage DESC
                LIMIT 1
            `).get(veh.id);

            const lastBeltKm = lastBelt ? Number(lastBelt.mileage) : 0;
            const kmSinceBelt = currentKm - lastBeltKm;

            if (currentKm >= 50000 && kmSinceBelt >= 50000) {
                const urgency = kmSinceBelt >= 60000 ? 'CRITICAL' : 'WARNING';
                const formattedPhone = String(veh.owner_phone).replace(/\D/g, '');
                const cleanPhone = formattedPhone.startsWith('55') ? formattedPhone : `55${formattedPhone}`;
                const workshopName = veh.preferred_workshop_name || 'Rede DNA AUTO';

                const message = `Olá ${veh.owner_name}! Tudo bem?\n\nAqui é da equipe técnica do DNA AUTO / *${workshopName}*.\n\nNotamos que o seu *${veh.brand} ${veh.model}* (Placa: *${veh.license_plate}*) está com *${currentKm.toLocaleString('pt-BR')} km* rodados.\n\nConforme o manual e histórico digital do veículo, é fundamental realizar a *Inspeção/Substituição Preventiva do Kit Correia Dentada e Tensores* para prevenir quebras e prejuízos no motor.\n\nPodemos agendar uma verificação gratuita na oficina credenciada esta semana? 🔧🛡️`;

                alerts.push({
                    id: `alert_belt_${veh.id}`,
                    vehicleId: veh.id,
                    licensePlate: veh.license_plate,
                    vehicleModel: `${veh.brand} ${veh.model}`,
                    currentMileage: currentKm,
                    ownerName: veh.owner_name,
                    ownerPhone: veh.owner_phone,
                    workshopName,
                    serviceType: 'Kit Correia Dentada & Tensores',
                    urgency,
                    reason: `Veículo com ${currentKm.toLocaleString('pt-BR')} km sem registro recente de troca de correia`,
                    recommendation: 'Troca preventiva recomendada a cada 50.000 a 60.000 km.',
                    whatsappUrl: `https://api.whatsapp.com/send?phone=${cleanPhone}&text=${encodeURIComponent(message)}`,
                    whatsappMessage: message
                });
            }
        }

        res.json({
            success: true,
            totalAlerts: alerts.length,
            alerts
        });
    } catch (err) {
        console.error('Erro ao gerar alertas de manutenção:', err);
        res.status(500).json({ error: 'Erro ao processar alertas preventivos.' });
    }
});

// Frota Completa de Veículos por Oficina (Multi-Tenant)
router.get('/fleet', (req, res) => {
    try {
        const { workshop_id } = req.query;
        let query = `
            SELECT 
                v.id as vehicle_id,
                v.license_plate,
                v.brand,
                v.model,
                v.version_label,
                v.model_year,
                v.manufacture_year,
                v.color,
                v.photo_url,
                vd.dna_code,
                vd.status as dna_status,
                vd.activated_at as dna_activated_at,
                COALESCE(w_act.trade_name, w_srv.trade_name, 'Sem Oficina Vinculada') as workshop_name,
                COALESCE(w_act.id, w_srv.id, 'none') as workshop_id,
                COALESCE(w_act.city, w_srv.city, '-') as workshop_city,
                COALESCE(o.name, u.name, 'Proprietário Particular') as owner_name,
                COALESCE(o.phone, u.phone, '(11) 98888-0000') as owner_phone,
                (SELECT MAX(mileage) FROM mileage_records mr WHERE mr.vehicle_id = v.id) as current_mileage,
                (SELECT COUNT(*) FROM service_records sr WHERE sr.vehicle_id = v.id) as services_count,
                (SELECT COALESCE(SUM(total_cost_cents), 0) FROM service_records sr WHERE sr.vehicle_id = v.id) as total_maintenance_cents
            FROM vehicles v
            LEFT JOIN vehicle_dna vd ON vd.vehicle_id = v.id
            LEFT JOIN workshops w_act ON vd.activated_by_workshop_id = w_act.id
            LEFT JOIN (
                SELECT vehicle_id, workshop_id FROM service_records ORDER BY service_date DESC LIMIT 1
            ) last_srv ON last_srv.vehicle_id = v.id
            LEFT JOIN workshops w_srv ON last_srv.workshop_id = w_srv.id
            LEFT JOIN ownership_transfers ot ON ot.vehicle_id = v.id AND ot.status = 'COMPLETED'
            LEFT JOIN owners o ON o.id = ot.new_owner_id
            LEFT JOIN users u ON u.id = o.user_id
            WHERE 1=1
        `;
        const params = [];
        if (workshop_id && workshop_id !== 'all') {
            query += ` AND (w_act.id = ? OR w_srv.id = ?)`;
            params.push(workshop_id, workshop_id);
        }
        query += ` ORDER BY v.brand ASC, v.model ASC`;

        const vehicles = db.prepare(query).all(...params);
        res.json({ success: true, count: vehicles.length, vehicles });
    } catch (err) {
        console.error('Erro ao listar frota da rede:', err);
        res.status(500).json({ error: 'Erro ao consultar veículos da rede.' });
    }
});

// Carteira Completa de Clientes por Oficina (Multi-Tenant)
router.get('/clients-all', (req, res) => {
    try {
        const { workshop_id } = req.query;
        let query = `
            SELECT 
                u.id as user_id,
                u.name,
                u.email,
                u.phone,
                u.created_at,
                COUNT(DISTINCT v.id) as vehicles_count,
                COUNT(DISTINCT sr.id) as services_count,
                COALESCE(SUM(sr.total_cost_cents), 0) as total_spent_cents,
                COALESCE(w.trade_name, 'Oficina Parceira') as preferred_workshop_name,
                COALESCE(w.id, 'ws_veloce') as workshop_id
            FROM users u
            JOIN owners o ON o.user_id = u.id
            LEFT JOIN ownership_transfers ot ON ot.new_owner_id = o.id AND ot.status = 'COMPLETED'
            LEFT JOIN vehicles v ON v.id = ot.vehicle_id
            LEFT JOIN service_records sr ON sr.vehicle_id = v.id
            LEFT JOIN workshops w ON w.id = sr.workshop_id
            WHERE 1=1
        `;
        const params = [];
        if (workshop_id && workshop_id !== 'all') {
            query += ` AND w.id = ?`;
            params.push(workshop_id);
        }
        query += ` GROUP BY u.id ORDER BY total_spent_cents DESC`;

        const clients = db.prepare(query).all(...params);
        res.json({ success: true, count: clients.length, clients });
    } catch (err) {
        console.error('Erro ao listar clientes da rede:', err);
        res.status(500).json({ error: 'Erro ao consultar clientes da rede.' });
    }
});

// Alternar Status de Homologação da Oficina (Aprovar / Suspender)
router.post('/workshops/:id/status', (req, res) => {
    try {
        const { status } = req.body;
        const workshopId = req.params.id;
        if (!['APPROVED', 'PENDING', 'SUSPENDED'].includes(status)) {
            return res.status(400).json({ error: 'Status inválido. Use APPROVED, PENDING ou SUSPENDED.' });
        }
        db.prepare(`UPDATE workshops SET status = ? WHERE id = ?`).run(status, workshopId);
        res.json({ success: true, message: `Status da oficina atualizado para ${status}.`, workshopId, status });
    } catch (err) {
        console.error('Erro ao atualizar status da oficina:', err);
        res.status(500).json({ error: 'Erro ao atualizar oficina.' });
    }
});

// Logs de Auditoria Globais com Filtros
router.get('/audit-logs', (req, res) => {
    try {
        const { action, dna_code, entity_type, limit } = req.query;
        let query = `SELECT * FROM audit_logs WHERE 1=1`;
        const params = [];

        if (action) {
            query += ` AND action = ?`;
            params.push(action);
        }
        if (dna_code) {
            query += ` AND UPPER(vehicle_dna_code) LIKE ?`;
            params.push(`%${dna_code.toUpperCase()}%`);
        }
        if (entity_type) {
            query += ` AND entity_type = ?`;
            params.push(entity_type);
        }

        query += ` ORDER BY created_at DESC LIMIT ?`;
        params.push(Number(limit) || 50);

        const logs = db.prepare(query).all(...params);
        res.json({ logs });
    } catch (err) {
        res.status(500).json({ error: 'Erro ao consultar auditoria.' });
    }
});

module.exports = router;
