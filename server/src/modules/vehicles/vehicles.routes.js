const express = require('express');
const router = express.Router();
const crypto = require('crypto');
const db = require('../../database/db');
const { authenticateToken } = require('../../middlewares/auth');
const { logAudit } = require('../../middlewares/audit');

// Gerador padronizado de código permanente DNA (Ex: DNA-BR-8F72-29A4-X91)
function generateDnaCode() {
    const chars = '23456789ABCDEFGHJKLMNPQRSTUVWXYZ';
    const randomBlock = (len) => {
        let str = '';
        const bytes = crypto.randomBytes(len);
        for (let i = 0; i < len; i++) {
            str += chars[bytes[i] % chars.length];
        }
        return str;
    };
    return `DNA-BR-${randomBlock(4)}-${randomBlock(4)}-${randomBlock(3)}`;
}

// Pesquisa Rápida de Veículo (Placa, Chassi ou DNA)
router.get('/search', (req, res) => {
    try {
        const query = (req.query.q || '').trim().toUpperCase();
        if (!query) {
            return res.status(400).json({ error: 'Termo de pesquisa obrigatório.' });
        }

        const vehicle = db.prepare(`
            SELECT v.*,
                   vd.dna_code, vd.status as dna_status, vd.activated_at as dna_activated_at,
                   vd.activation_modality,
                   w.trade_name as activated_by_workshop_name,
                   (SELECT COUNT(*) FROM service_records sr WHERE sr.vehicle_id = v.id) as services_count,
                   (SELECT MAX(mileage) FROM mileage_records mr WHERE mr.vehicle_id = v.id) as latest_mileage
            FROM vehicles v
            LEFT JOIN vehicle_dna vd ON vd.vehicle_id = v.id
            LEFT JOIN workshops w ON vd.activated_by_workshop_id = w.id
            WHERE UPPER(v.license_plate) = ?
               OR UPPER(REPLACE(v.license_plate, '-', '')) = ?
               OR UPPER(v.chassis_vin) = ?
               OR UPPER(vd.dna_code) = ?
        `).get(query, query.replace('-', ''), query, query);

        if (!vehicle) {
            return res.status(404).json({
                found: false,
                message: 'Nenhum veículo cadastrado com esta placa ou chassi.'
            });
        }

        res.json({
            found: true,
            hasDna: !!vehicle.dna_code,
            vehicle
        });
    } catch (err) {
        res.status(500).json({ error: 'Erro ao pesquisar veículo.' });
    }
});

// Ativar DNA para um Veículo Existente (Item 16 e 17)
router.post('/activate-dna', authenticateToken, (req, res) => {
    try {
        const { vehicle_id, workshop_id, pricing_plan_id, modality, notes } = req.body;

        if (!vehicle_id) {
            return res.status(400).json({ error: 'ID do veículo é obrigatório.' });
        }

        const vehicle = db.prepare(`SELECT * FROM vehicles WHERE id = ?`).get(vehicle_id);
        if (!vehicle) {
            return res.status(404).json({ error: 'Veículo não encontrado.' });
        }

        // Verificar se já possui DNA
        const existingDna = db.prepare(`SELECT * FROM vehicle_dna WHERE vehicle_id = ?`).get(vehicle_id);
        if (existingDna) {
            return res.status(400).json({
                error: 'Este veículo já possui um DNA ativado.',
                dna_code: existingDna.dna_code
            });
        }

        // Buscar plano selecionado
        let plan = null;
        if (pricing_plan_id) {
            plan = db.prepare(`SELECT * FROM pricing_plans WHERE id = ?`).get(pricing_plan_id);
        } else {
            plan = db.prepare(`SELECT * FROM pricing_plans WHERE code = 'PLAN_WORKSHOP_PROMO'`).get();
        }

        const dnaCode = generateDnaCode();
        const dnaId = 'dna_' + Date.now();
        const activationId = 'act_' + Date.now();
        const certificateHash = crypto.createHash('sha256').update(dnaCode + vehicle.chassis_vin + Date.now()).digest('hex');

        const feeCents = plan ? plan.price_cents : 7900;
        const commissionCents = plan ? Math.round((feeCents * (plan.commission_percentage || 20)) / 100) : 0;
        const effectiveWorkshopId = workshop_id || (req.user.workshop ? req.user.workshop.workshop_id : null);

        db.transaction(() => {
            // 1. Criar Registro do DNA Permanente
            db.prepare(`
                INSERT INTO vehicle_dna (
                    id, vehicle_id, dna_code, status, activated_at,
                    activated_by_workshop_id, activation_modality, activation_fee_cents, certificate_hash
                ) VALUES (?, ?, ?, 'ACTIVE', CURRENT_TIMESTAMP, ?, ?, ?, ?)
            `).run(dnaId, vehicle_id, dnaCode, effectiveWorkshopId, modality || 'NORMAL', feeCents, certificateHash);

            // 2. Registrar Ativação Comercial
            db.prepare(`
                INSERT INTO dna_activations (
                    id, vehicle_dna_id, workshop_id, pricing_plan_id, payment_status,
                    amount_paid_cents, commission_amount_cents, notes
                ) VALUES (?, ?, ?, ?, 'COMPLETED', ?, ?, ?)
            `).run(activationId, dnaId, effectiveWorkshopId, plan ? plan.id : null, feeCents, commissionCents, notes || null);

            // 3. Registrar Comissão para a Oficina se aplicável
            if (effectiveWorkshopId && commissionCents > 0) {
                db.prepare(`
                    INSERT INTO commissions (id, workshop_id, dna_activation_id, amount_cents, status)
                    VALUES (?, ?, ?, ?, 'AVAILABLE')
                `).run('comm_' + Date.now(), effectiveWorkshopId, activationId, commissionCents);
            }

            // 4. Inicializar Score de Saúde do Histórico
            db.prepare(`
                INSERT INTO health_scores (
                    id, vehicle_id, overall_score, documented_percentage, proven_services_count,
                    invoices_count, verified_workshops_count, mileage_records_count, continuity_status, score_rationale
                ) VALUES (?, ?, 60, 50, 0, 0, 1, 0, 'REGULAR', 'DNA recém-ativado na rede DNA AUTO. Histórico em fase de alimentação documental.')
            `).run('hs_' + Date.now(), vehicle_id);
        })();

        logAudit({
            user: req.user,
            action: 'ACTIVATE_DNA',
            entityType: 'VEHICLE_DNA',
            entityId: dnaId,
            vehicleDnaCode: dnaCode,
            ipAddress: req.ip,
            dataAfter: { dnaCode, vehiclePlate: vehicle.license_plate, feeCents, modality }
        });

        res.status(201).json({
            success: true,
            dna_code: dnaCode,
            message: `DNA ativado com sucesso para o veículo ${vehicle.brand} ${vehicle.model} (${vehicle.license_plate})!`
        });
    } catch (err) {
        console.error('Erro ao ativar DNA:', err);
        res.status(500).json({ error: 'Erro ao ativar DNA do veículo.' });
    }
});

// Cadastrar Novo Veículo (Pela Oficina ou Administrador)
router.post('/register', authenticateToken, (req, res) => {
    try {
        const {
            license_plate, chassis_vin, renavam, brand, model,
            version_label, manufacture_year, model_year, fuel_type,
            transmission_type, color, photo_url, activate_dna_now,
            pricing_plan_id, modality
        } = req.body;

        if (!license_plate || !chassis_vin || !brand || !model || !manufacture_year) {
            return res.status(400).json({ error: 'Placa, chassi, marca, modelo e ano são obrigatórios.' });
        }

        const cleanPlate = license_plate.trim().toUpperCase();
        const cleanChassis = chassis_vin.trim().toUpperCase();

        const exists = db.prepare(`
            SELECT id FROM vehicles WHERE license_plate = ? OR chassis_vin = ?
        `).get(cleanPlate, cleanChassis);

        if (exists) {
            return res.status(400).json({ error: 'Já existe um veículo cadastrado com esta placa ou chassi.' });
        }

        const vehicleId = 'veh_' + Date.now();

        db.transaction(() => {
            db.prepare(`
                INSERT INTO vehicles (
                    id, license_plate, chassis_vin, renavam, brand, model, version_label,
                    manufacture_year, model_year, fuel_type, transmission_type, color, photo_url
                ) VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)
            `).run(
                vehicleId, cleanPlate, cleanChassis, renavam || null, brand, model, version_label || null,
                Number(manufacture_year), Number(model_year) || Number(manufacture_year),
                fuel_type || 'Flex', transmission_type || 'Manual', color || 'Não informada',
                photo_url || 'https://images.unsplash.com/photo-1541899481282-d53bffe3c35d?w=800&auto=format&fit=crop&q=80'
            );

            // Se solicitado ativar DNA imediatamente
            if (activate_dna_now) {
                const dnaCode = generateDnaCode();
                const dnaId = 'dna_' + Date.now();
                const certificateHash = crypto.createHash('sha256').update(dnaCode + cleanChassis).digest('hex');
                const effectiveWorkshopId = req.user.workshop ? req.user.workshop.workshop_id : null;

                db.prepare(`
                    INSERT INTO vehicle_dna (
                        id, vehicle_id, dna_code, status, activated_at,
                        activated_by_workshop_id, activation_modality, activation_fee_cents, certificate_hash
                    ) VALUES (?, ?, ?, 'ACTIVE', CURRENT_TIMESTAMP, ?, ?, 7900, ?)
                `).run(dnaId, vehicleId, dnaCode, effectiveWorkshopId, modality || 'NORMAL', certificateHash);

                db.prepare(`
                    INSERT INTO health_scores (
                        id, vehicle_id, overall_score, documented_percentage, score_rationale
                    ) VALUES (?, ?, 60, 50, 'DNA ativado no momento do cadastro inicial.')
                `).run('hs_' + Date.now(), vehicleId);
            }
        })();

        logAudit({
            user: req.user,
            action: 'REGISTER_VEHICLE',
            entityType: 'VEHICLE',
            entityId: vehicleId,
            ipAddress: req.ip,
            dataAfter: { license_plate: cleanPlate, brand, model }
        });

        res.status(201).json({
            success: true,
            vehicle_id: vehicleId,
            message: 'Veículo cadastrado com sucesso!'
        });
    } catch (err) {
        console.error('Erro ao cadastrar veículo:', err);
        res.status(500).json({ error: 'Erro ao cadastrar novo veículo.' });
    }
});

module.exports = router;
