const express = require('express');
const router = express.Router();
const db = require('../../database/db');
const upload = require('../../middlewares/upload');
const { authenticateToken } = require('../../middlewares/auth');
const { logAudit } = require('../../middlewares/audit');

// Listar catálogo de peças disponíveis para seleção rápida no cadastro de serviços
router.get('/catalog/parts', (req, res) => {
    try {
        const parts = db.prepare(`SELECT * FROM parts ORDER BY category ASC, name ASC`).all();
        res.json({ parts });
    } catch (err) {
        res.status(500).json({ error: 'Erro ao listar peças do catálogo.' });
    }
});

// Registrar Serviço pela Oficina (Nível 4: ✅ SERVIÇO COMPROVADO)
router.post('/workshop-register', authenticateToken, upload.fields([
    { name: 'photos', maxCount: 6 },
    { name: 'invoice', maxCount: 1 }
]), (req, res) => {
    try {
        const {
            vehicle_id,
            workshop_id,
            service_title,
            category,
            description,
            service_date,
            mileage,
            labor_cost_cents,
            responsible_technician_name,
            warranty_months,
            parts_json,
            invoice_number,
            invoice_amount_cents
        } = req.body;

        if (!vehicle_id || !service_title || !mileage || !service_date) {
            return res.status(400).json({ error: 'Campos obrigatórios: veículo, título do serviço, data e quilometragem.' });
        }

        const vehicle = db.prepare(`
            SELECT v.*, vd.dna_code FROM vehicles v
            LEFT JOIN vehicle_dna vd ON vd.vehicle_id = v.id
            WHERE v.id = ?
        `).get(vehicle_id);

        if (!vehicle) {
            return res.status(404).json({ error: 'Veículo não encontrado.' });
        }

        const serviceId = 'srv_' + Date.now();
        let parsedParts = [];
        if (parts_json) {
            try {
                parsedParts = typeof parts_json === 'string' ? JSON.parse(parts_json) : parts_json;
            } catch (e) {
                console.warn('Erro ao decodificar peças JSON:', e);
            }
        }

        let partsCostCents = 0;
        parsedParts.forEach(p => {
            partsCostCents += (Number(p.unit_price_cents) || 0) * (Number(p.quantity) || 1);
        });

        const laborCost = Number(labor_cost_cents) || 0;
        const totalCost = partsCostCents + laborCost;

        // Executa inserção em transação atômica
        db.transaction(() => {
            // 1. Inserir Registro de Serviço como Nível 4 (COMPROVADO PELA OFICINA)
            db.prepare(`
                INSERT INTO service_records (
                    id, vehicle_id, workshop_id, declared_by_owner_id, responsible_technician_name,
                    service_date, mileage, category, service_title, description,
                    parts_cost_cents, labor_cost_cents, total_cost_cents, warranty_months,
                    proof_level, proof_status, workshop_confirmation_status, workshop_confirmation_date
                ) VALUES (
                    @id, @vehicle_id, @workshop_id, NULL, @responsible_technician_name,
                    @service_date, @mileage, @category, @service_title, @description,
                    @parts_cost_cents, @labor_cost_cents, @total_cost_cents, @warranty_months,
                    4, 'WORKSHOP_PROVEN', 'CONFIRMED', CURRENT_TIMESTAMP
                )
            `).run({
                id: serviceId,
                vehicle_id,
                workshop_id: workshop_id || (req.user && req.user.workshop ? req.user.workshop.workshop_id : null),
                responsible_technician_name: responsible_technician_name || req.user.name,
                service_date,
                mileage: Number(mileage),
                category: category || 'Geral',
                service_title,
                description: description || 'Serviço executado e inspecionado conforme especificações técnicas.',
                parts_cost_cents: partsCostCents,
                labor_cost_cents: laborCost,
                total_cost_cents: totalCost,
                warranty_months: Number(warranty_months) || 6
            });

            // 2. Inserir Peças Vinculadas
            for (let i = 0; i < parsedParts.length; i++) {
                const partItem = parsedParts[i];
                let partId = partItem.part_id;

                // Se for nova peça cadastrada na hora
                if (!partId && partItem.name) {
                    partId = 'part_' + Date.now() + '_' + i;
                    db.prepare(`
                        INSERT INTO parts (id, name, manufacturer, part_number, category)
                        VALUES (?, ?, ?, ?, ?)
                    `).run(
                        partId,
                        partItem.name,
                        partItem.manufacturer || 'Original/Aftermarket',
                        partItem.part_number || null,
                        category || 'Peças'
                    );
                }

                if (partId) {
                    db.prepare(`
                        INSERT INTO part_installations (
                            id, service_record_id, part_id, quantity, unit_price_cents,
                            part_condition, warranty_months, notes
                        ) VALUES (
                            ?, ?, ?, ?, ?, ?, ?, ?
                        )
                    `).run(
                        'pi_' + Date.now() + '_' + i,
                        serviceId,
                        partId,
                        Number(partItem.quantity) || 1,
                        Number(partItem.unit_price_cents) || 0,
                        partItem.condition || 'NEW',
                        Number(partItem.warranty_months) || 12,
                        partItem.notes || null
                    );
                }
            }

            // 3. Inserir Registro de Quilometragem
            db.prepare(`
                INSERT INTO mileage_records (id, vehicle_id, service_record_id, mileage, recorded_at, source, verified)
                VALUES (?, ?, ?, ?, ?, 'WORKSHOP_SERVICE', 1)
            `).run('mil_' + Date.now(), vehicle_id, serviceId, Number(mileage), service_date);

            // 4. Inserir Nota Fiscal se enviada
            if (req.files && req.files['invoice'] && req.files['invoice'].length > 0) {
                const invFile = req.files['invoice'][0];
                db.prepare(`
                    INSERT INTO invoices (
                        id, vehicle_id, service_record_id, invoice_number, issuer_name,
                        issue_date, total_amount_cents, file_path, verified
                    ) VALUES (?, ?, ?, ?, ?, ?, ?, ?, 1)
                `).run(
                    'inv_' + Date.now(),
                    vehicle_id,
                    serviceId,
                    invoice_number || 'NF-e ' + Math.floor(1000 + Math.random() * 9000),
                    req.user.workshop ? req.user.workshop.workshop_name : 'Oficina Credenciada',
                    service_date,
                    Number(invoice_amount_cents) || totalCost,
                    '/uploads/invoices/' + invFile.filename
                );
            }

            // 5. Inserir Fotos se enviadas
            if (req.files && req.files['photos']) {
                req.files['photos'].forEach((f, idx) => {
                    db.prepare(`
                        INSERT INTO vehicle_photos (
                            id, vehicle_id, service_record_id, workshop_id, photo_category,
                            title, file_path, registered_by_user_id
                        ) VALUES (?, ?, ?, ?, ?, ?, ?, ?)
                    `).run(
                        'pho_' + Date.now() + '_' + idx,
                        vehicle_id,
                        serviceId,
                        workshop_id || (req.user.workshop ? req.user.workshop.workshop_id : null),
                        idx === 0 ? 'INSTALLED_PART' : 'SERVICE_DONE',
                        `Registro Fotográfico do Serviço - ${service_title}`,
                        '/uploads/photos/' + f.filename,
                        req.user.id
                    );
                });
            }
        })();

        logAudit({
            user: req.user,
            action: 'REGISTER_PROVEN_SERVICE',
            entityType: 'SERVICE',
            entityId: serviceId,
            vehicleDnaCode: vehicle.dna_code,
            ipAddress: req.ip,
            dataAfter: { service_title, mileage, totalCost, proof_level: 4 }
        });

        res.status(201).json({
            success: true,
            serviceId,
            proof_level: 4,
            proof_status: 'WORKSHOP_PROVEN',
            message: 'Serviço registrado e comprovado com sucesso no DNA AUTO!'
        });
    } catch (err) {
        console.error('Erro ao registrar serviço na oficina:', err);
        res.status(500).json({ error: 'Erro ao registrar serviço comprovado.' });
    }
});

// Registrar Declaração de Serviço pelo Proprietário (com Peças e Foto da Nota Fiscal vinculada ao CNPJ da Oficina)
router.post('/owner-declare', authenticateToken, upload.fields([
    { name: 'invoice', maxCount: 1 },
    { name: 'photos', maxCount: 4 }
]), (req, res) => {
    try {
        const {
            vehicle_id,
            workshop_cnpj,
            workshop_name,
            service_title,
            description,
            service_date,
            mileage,
            total_cost_cents,
            parts_json
        } = req.body;

        if (!vehicle_id || !service_title || !service_date || !mileage) {
            return res.status(400).json({ error: 'Campos obrigatórios: veículo, título do serviço, data e km.' });
        }

        const vehicle = db.prepare(`SELECT v.*, vd.dna_code FROM vehicles v LEFT JOIN vehicle_dna vd ON vd.vehicle_id = v.id WHERE v.id = ?`).get(vehicle_id);
        if (!vehicle) {
            return res.status(404).json({ error: 'Veículo não encontrado.' });
        }

        // Localizar ou registrar oficina pelo CNPJ
        let targetWorkshop = null;
        if (workshop_cnpj) {
            const cleanCnpj = workshop_cnpj.replace(/[^0-9]/g, '');
            targetWorkshop = db.prepare(`
                SELECT * FROM workshops
                WHERE REPLACE(REPLACE(REPLACE(cnpj, '.', ''), '/', ''), '-', '') = ?
                   OR cnpj = ?
            `).get(cleanCnpj, workshop_cnpj.trim());

            // Se a oficina não estiver cadastrada ainda, cadastra com status PENDING para credenciamento
            if (!targetWorkshop && cleanCnpj.length >= 14) {
                const newWsId = 'ws_ext_' + Date.now();
                db.prepare(`
                    INSERT INTO workshops (
                        id, company_name, trade_name, cnpj, status, verified_badge, notes
                    ) VALUES (?, ?, ?, ?, 'PENDING', 0, 'Oficina externa cadastrada via declaração de serviço pelo cliente')
                `).run(newWsId, workshop_name || 'Oficina Mecânica ' + workshop_cnpj, workshop_name || 'Oficina ' + workshop_cnpj, workshop_cnpj);

                targetWorkshop = db.prepare(`SELECT * FROM workshops WHERE id = ?`).get(newWsId);
            }
        }

        // Buscar proprietário logado
        const owner = db.prepare(`SELECT * FROM owners WHERE user_id = ?`).get(req.user.id);
        const ownerId = owner ? owner.id : null;
        const serviceId = 'srv_decl_' + Date.now();

        // Processar peças
        let parsedParts = [];
        if (parts_json) {
            try {
                parsedParts = typeof parts_json === 'string' ? JSON.parse(parts_json) : parts_json;
            } catch (e) {
                console.warn('Erro ao decodificar peças JSON:', e);
            }
        }

        let partsCostCents = 0;
        parsedParts.forEach(p => {
            partsCostCents += (Number(p.unit_price_cents) || 0) * (Number(p.quantity) || 1);
        });

        const totalCost = Number(total_cost_cents) || partsCostCents;

        db.transaction(() => {
            // 1. Inserir Registro de Serviço como Nível 1 (DECLARADO PELO PROPRIETÁRIO COM NOTA E PEÇAS)
            db.prepare(`
                INSERT INTO service_records (
                    id, vehicle_id, workshop_id, declared_by_owner_id, responsible_technician_name,
                    service_date, mileage, category, service_title, description,
                    parts_cost_cents, labor_cost_cents, total_cost_cents, warranty_months,
                    proof_level, proof_status, workshop_confirmation_status
                ) VALUES (
                    @id, @vehicle_id, @workshop_id, @declared_by_owner_id, NULL,
                    @service_date, @mileage, 'Manutenção Periódica', @service_title, @description,
                    @parts_cost_cents, 0, @total_cost_cents, 3,
                    1, 'OWNER_DECLARED', 'PENDING'
                )
            `).run({
                id: serviceId,
                vehicle_id,
                workshop_id: targetWorkshop ? targetWorkshop.id : null,
                declared_by_owner_id: ownerId,
                service_date,
                mileage: Number(mileage),
                service_title,
                description: description || 'Serviço e peças declarados pelo proprietário com comprovante anexado para validação da oficina.',
                parts_cost_cents: partsCostCents,
                total_cost_cents: totalCost
            });

            // 2. Inserir Peças Vinculadas
            for (let i = 0; i < parsedParts.length; i++) {
                const partItem = parsedParts[i];
                let partId = 'part_item_' + Date.now() + '_' + i;
                db.prepare(`
                    INSERT INTO parts (id, name, manufacturer, part_number, category)
                    VALUES (?, ?, ?, ?, 'Peças Declaradas')
                `).run(
                    partId,
                    partItem.name || 'Peça Automotiva',
                    partItem.manufacturer || 'Original/Mercado',
                    partItem.part_number || null
                );

                db.prepare(`
                    INSERT INTO part_installations (
                        id, service_record_id, part_id, quantity, unit_price_cents,
                        part_condition, warranty_months, notes
                    ) VALUES (?, ?, ?, ?, ?, 'NEW', 12, ?)
                `).run(
                    'pi_decl_' + Date.now() + '_' + i,
                    serviceId,
                    partId,
                    Number(partItem.quantity) || 1,
                    Number(partItem.unit_price_cents) || 0,
                    partItem.notes || null
                );
            }

            // 3. Inserir Nota Fiscal se anexada
            if (req.files && req.files['invoice'] && req.files['invoice'].length > 0) {
                const invFile = req.files['invoice'][0];
                db.prepare(`
                    INSERT INTO invoices (
                        id, vehicle_id, service_record_id, invoice_number, issuer_name,
                        issue_date, total_amount_cents, file_path, verified
                    ) VALUES (?, ?, ?, ?, ?, ?, ?, ?, 0)
                `).run(
                    'inv_decl_' + Date.now(),
                    vehicle_id,
                    serviceId,
                    'NF-e Declarada',
                    targetWorkshop ? targetWorkshop.trade_name : (workshop_name || 'Mecânica Responsável'),
                    service_date,
                    totalCost,
                    '/uploads/invoices/' + invFile.filename
                );
            }

            // 4. Inserir Fotos se enviadas
            if (req.files && req.files['photos']) {
                req.files['photos'].forEach((f, idx) => {
                    db.prepare(`
                        INSERT INTO vehicle_photos (
                            id, vehicle_id, service_record_id, workshop_id, photo_category,
                            title, file_path, registered_by_user_id
                        ) VALUES (?, ?, ?, ?, 'RECEIPT', ?, ?, ?)
                    `).run(
                        'pho_decl_' + Date.now() + '_' + idx,
                        vehicle_id,
                        serviceId,
                        targetWorkshop ? targetWorkshop.id : null,
                        `Comprovante do Serviço - ${service_title}`,
                        '/uploads/photos/' + f.filename,
                        req.user.id
                    );
                });
            }

            // 5. Atualizar ou registrar quilometragem
            db.prepare(`
                INSERT INTO mileage_records (id, vehicle_id, service_record_id, mileage, recorded_at, source, verified)
                VALUES (?, ?, ?, ?, ?, 'OWNER_DECLARATION', 0)
            `).run('mil_decl_' + Date.now(), vehicle_id, serviceId, Number(mileage), service_date);
        })();

        logAudit({
            user: req.user,
            action: 'DECLARE_SERVICE_WITH_PARTS',
            entityType: 'SERVICE',
            entityId: serviceId,
            vehicleDnaCode: vehicle.dna_code,
            ipAddress: req.ip,
            dataAfter: { service_title, mileage, workshop_cnpj, parts_count: parsedParts.length }
        });

        res.status(201).json({
            success: true,
            serviceId,
            workshopName: targetWorkshop ? targetWorkshop.trade_name : (workshop_name || 'Oficina Informada'),
            message: 'Serviço, peças e nota fiscal registrados com sucesso! Enviado para validação da oficina pelo CNPJ.'
        });
    } catch (err) {
        console.error('Erro ao declarar serviço pelo proprietário:', err);
        res.status(500).json({ error: 'Erro ao processar declaração de serviço.' });
    }
});

// Decisão da Oficina sobre Serviço Declarado pelo Proprietário (Item 21)
// Opções: CONFIRMAR, NÃO RECONHEÇO, SOLICITAR MAIS INFORMAÇÕES
router.post('/:id/confirm-decision', authenticateToken, (req, res) => {
    try {
        const serviceId = req.params.id;
        const { decision, notes } = req.body;

        if (!['CONFIRMAR', 'NAO_RECONHECO', 'SOLICITAR_INFO'].includes(decision)) {
            return res.status(400).json({ error: 'Decisão inválida. Use: CONFIRMAR, NAO_RECONHECO ou SOLICITAR_INFO.' });
        }

        const service = db.prepare(`
            SELECT sr.*, v.license_plate, vd.dna_code
            FROM service_records sr
            JOIN vehicles v ON sr.vehicle_id = v.id
            LEFT JOIN vehicle_dna vd ON vd.vehicle_id = v.id
            WHERE sr.id = ?
        `).get(serviceId);

        if (!service) {
            return res.status(404).json({ error: 'Registro de serviço não encontrado.' });
        }

        let newProofLevel = service.proof_level;
        let newProofStatus = service.proof_status;
        let confirmationStatus = 'PENDING';

        if (decision === 'CONFIRMAR') {
            newProofLevel = 3;
            newProofStatus = 'WORKSHOP_CONFIRMED';
            confirmationStatus = 'CONFIRMED';
        } else if (decision === 'NAO_RECONHECO') {
            confirmationStatus = 'REJECTED';
            newProofStatus = 'REJECTED';
        } else if (decision === 'SOLICITAR_INFO') {
            confirmationStatus = 'REQUESTED_INFO';
        }

        db.prepare(`
            UPDATE service_records
            SET proof_level = ?,
                proof_status = ?,
                workshop_confirmation_status = ?,
                workshop_confirmation_date = CURRENT_TIMESTAMP,
                workshop_confirmation_notes = ?,
                updated_at = CURRENT_TIMESTAMP
            WHERE id = ?
        `).run(newProofLevel, newProofStatus, confirmationStatus, notes || null, serviceId);

        logAudit({
            user: req.user,
            action: 'DECIDE_SERVICE_CONFIRMATION',
            entityType: 'SERVICE',
            entityId: serviceId,
            vehicleDnaCode: service.dna_code,
            ipAddress: req.ip,
            dataBefore: { proof_level: service.proof_level, status: service.workshop_confirmation_status },
            dataAfter: { decision, newProofLevel, confirmationStatus, notes }
        });

        res.json({
            success: true,
            decision,
            proof_level: newProofLevel,
            proof_status: newProofStatus,
            message: decision === 'CONFIRMAR'
                ? 'Serviço confirmado pela oficina com sucesso! Nível elevado para CONFIRMADO PELA OFICINA.'
                : (decision === 'NAO_RECONHECO' ? 'Serviço não reconhecido pela oficina.' : 'Mais informações solicitadas ao proprietário.')
        });
    } catch (err) {
        console.error('Erro na confirmação da oficina:', err);
        res.status(500).json({ error: 'Erro ao processar decisão da oficina.' });
    }
});

module.exports = router;
