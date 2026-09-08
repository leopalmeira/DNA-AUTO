const express = require('express');
const router = express.Router();
const crypto = require('crypto');
const db = require('../../database/db');
const { authenticateToken } = require('../../middlewares/auth');
const { logAudit } = require('../../middlewares/audit');

// 1. Solicitar Transferência de Propriedade (Gerar Código Temporário de 6 Dígitos)
router.post('/request', authenticateToken, (req, res) => {
    try {
        const { vehicle_id, transfer_mileage, notes } = req.body;
        if (!vehicle_id) {
            return res.status(400).json({ error: 'ID do veículo é obrigatório.' });
        }

        const vehicle = db.prepare(`
            SELECT v.*, vd.dna_code
            FROM vehicles v
            LEFT JOIN vehicle_dna vd ON vd.vehicle_id = v.id
            WHERE v.id = ?
        `).get(vehicle_id);

        if (!vehicle) {
            return res.status(404).json({ error: 'Veículo não encontrado.' });
        }

        // Buscar proprietário atual
        const currentOwner = db.prepare(`
            SELECT * FROM owners
            WHERE user_id = ? OR id = (
                SELECT new_owner_id FROM ownership_transfers
                WHERE vehicle_id = ? AND status = 'COMPLETED'
                ORDER BY completed_at DESC LIMIT 1
            )
        `).get(req.user.id, vehicle_id);

        // Gerar código de 6 dígitos seguro (ex: 739281)
        const transferCode = Math.floor(100000 + Math.random() * 900000).toString();
        // Expira em 48 horas
        const expiresAt = new Date(Date.now() + 48 * 60 * 60 * 1000).toISOString();
        const transferId = 'trans_' + Date.now();

        db.prepare(`
            INSERT INTO ownership_transfers (
                id, vehicle_id, previous_owner_id, transfer_code,
                transfer_code_expires_at, status, requested_at, transfer_mileage, notes
            ) VALUES (?, ?, ?, ?, ?, 'PENDING', CURRENT_TIMESTAMP, ?, ?)
        `).run(
            transferId,
            vehicle_id,
            currentOwner ? currentOwner.id : null,
            transferCode,
            expiresAt,
            transfer_mileage ? Number(transfer_mileage) : null,
            notes || 'Solicitação de transferência gerada pelo proprietário.'
        );

        logAudit({
            user: req.user,
            action: 'REQUEST_TRANSFER',
            entityType: 'TRANSFER',
            entityId: transferId,
            vehicleDnaCode: vehicle.dna_code,
            ipAddress: req.ip,
            dataAfter: { transferId, transferCode, expiresAt, transfer_mileage }
        });

        res.json({
            success: true,
            transfer_id: transferId,
            transfer_code: transferCode,
            expires_at: expiresAt,
            message: 'Código de transferência gerado com sucesso! Compartilhe este código com o comprador.'
        });
    } catch (err) {
        console.error('Erro ao solicitar transferência:', err);
        res.status(500).json({ error: 'Erro ao gerar solicitação de transferência.' });
    }
});

// 2. Confirmar Transferência pelo Novo Proprietário com o Código
router.post('/confirm', authenticateToken, (req, res) => {
    try {
        const { transfer_code, new_owner_cpf, new_owner_name } = req.body;

        if (!transfer_code) {
            return res.status(400).json({ error: 'Código de transferência de 6 dígitos é obrigatório.' });
        }

        const transfer = db.prepare(`
            SELECT ot.*, v.license_plate, v.brand, v.model, vd.dna_code,
                   po.name as previous_owner_name
            FROM ownership_transfers ot
            JOIN vehicles v ON ot.vehicle_id = v.id
            LEFT JOIN vehicle_dna vd ON vd.vehicle_id = v.id
            LEFT JOIN owners po ON ot.previous_owner_id = po.id
            WHERE ot.transfer_code = ? AND ot.status = 'PENDING'
        `).get(transfer_code.trim());

        if (!transfer) {
            return res.status(404).json({ error: 'Código de transferência inválido, já utilizado ou expirado.' });
        }

        // Criar ou localizar registro do novo proprietário
        let newOwner = db.prepare(`SELECT * FROM owners WHERE user_id = ?`).get(req.user.id);
        if (!newOwner) {
            const newOwnerId = 'own_' + Date.now();
            db.prepare(`
                INSERT INTO owners (id, user_id, name, document_cpf, email, phone)
                VALUES (?, ?, ?, ?, ?, ?)
            `).run(
                newOwnerId,
                req.user.id,
                new_owner_name || req.user.name,
                new_owner_cpf || '***.***.***-**',
                req.user.email,
                req.user.phone || null
            );
            newOwner = { id: newOwnerId, name: new_owner_name || req.user.name };
        }

        // Executa atualização da transferência
        db.transaction(() => {
            db.prepare(`
                UPDATE ownership_transfers
                SET new_owner_id = ?,
                    status = 'COMPLETED',
                    completed_at = CURRENT_TIMESTAMP,
                    notes = notes || ' | Concluída por ' || ?
                WHERE id = ?
            `).run(newOwner.id, req.user.name, transfer.id);

            // Registrar quilometragem da transferência se informada
            if (transfer.transfer_mileage) {
                db.prepare(`
                    INSERT INTO mileage_records (id, vehicle_id, mileage, recorded_at, source, verified)
                    VALUES (?, ?, ?, CURRENT_TIMESTAMP, 'TRANSFER', 1)
                `).run('mil_' + Date.now(), transfer.vehicle_id, transfer.transfer_mileage);
            }
        })();

        logAudit({
            user: req.user,
            action: 'COMPLETE_TRANSFER',
            entityType: 'TRANSFER',
            entityId: transfer.id,
            vehicleDnaCode: transfer.dna_code,
            ipAddress: req.ip,
            dataBefore: { previous_owner: transfer.previous_owner_name },
            dataAfter: { new_owner: newOwner.name, completed_at: new Date().toISOString() }
        });

        res.json({
            success: true,
            vehicle: {
                license_plate: transfer.license_plate,
                brand: transfer.brand,
                model: transfer.model,
                dna_code: transfer.dna_code
            },
            message: `Transferência concluída com sucesso! O veículo agora está vinculado a ${newOwner.name}. O DNA e todo o histórico foram integralmente preservados.`
        });
    } catch (err) {
        console.error('Erro ao confirmar transferência:', err);
        res.status(500).json({ error: 'Erro ao processar transferência.' });
    }
});

module.exports = router;
