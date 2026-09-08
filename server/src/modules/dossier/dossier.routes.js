const express = require('express');
const router = express.Router();
const db = require('../../database/db');

// Helper para calcular a pontuação de integridade do histórico do veículo
function calculateHealthScore(vehicleId) {
    const services = db.prepare(`SELECT * FROM service_records WHERE vehicle_id = ?`).all(vehicleId);
    const invoices = db.prepare(`SELECT * FROM invoices WHERE vehicle_id = ?`).all(vehicleId);
    const photos = db.prepare(`SELECT * FROM vehicle_photos WHERE vehicle_id = ?`).all(vehicleId);
    const mileages = db.prepare(`SELECT * FROM mileage_records WHERE vehicle_id = ? ORDER BY recorded_at ASC`).all(vehicleId);
    const workshops = db.prepare(`SELECT DISTINCT workshop_id FROM service_records WHERE vehicle_id = ? AND workshop_id IS NOT NULL`).all(vehicleId);

    const provenServices = services.filter(s => s.proof_level === 4 || s.proof_level === 3);
    const totalServices = services.length;

    // Fatores de cálculo transparentes:
    // 1. Serviços comprovados (até 40 pts)
    const provenScore = totalServices > 0 ? Math.min(40, Math.round((provenServices.length / totalServices) * 40)) : 0;
    // 2. Notas fiscais e fotos anexadas (até 25 pts)
    const docScore = (invoices.length > 0 ? 15 : 0) + (photos.length > 0 ? 10 : 0);
    // 3. Continuidade e coerência de km (até 20 pts)
    let kmCoherent = true;
    for (let i = 1; i < mileages.length; i++) {
        if (mileages[i].mileage < mileages[i - 1].mileage) {
            kmCoherent = false;
            break;
        }
    }
    const kmScore = mileages.length >= 2 && kmCoherent ? 20 : (mileages.length >= 1 ? 10 : 0);
    // 4. Atendimento por oficinas verificadas (até 15 pts)
    const workshopScore = workshops.length > 0 ? 15 : 5;

    const overallScore = Math.min(100, Math.max(10, provenScore + docScore + kmScore + workshopScore));
    const documentedPercentage = totalServices > 0 ? Math.round((provenServices.length / totalServices) * 100) : 50;

    let continuityStatus = 'EXCELLENT';
    if (overallScore < 70) continuityStatus = 'REGULAR';
    else if (overallScore < 85) continuityStatus = 'GOOD';

    return {
        overallScore,
        documentedPercentage,
        provenServicesCount: provenServices.length,
        invoicesCount: invoices.length,
        verifiedWorkshopsCount: workshops.length,
        mileageRecordsCount: mileages.length,
        continuityStatus,
        rationale: 'O índice representa exclusivamente a qualidade e integridade documental dos registros no DNA AUTO, não substituindo inspeção física profissional.'
    };
}

// Obter Dossiê 360° do Veículo (Busca por DNA, Placa ou Chassi)
router.get('/:identifier', (req, res) => {
    try {
        const rawId = req.params.identifier.trim();
        const cleanId = rawId.replace(/[^a-zA-Z0-9-]/g, '').toUpperCase();

        // 1. Localizar Veículo
        const vehicle = db.prepare(`
            SELECT v.*,
                   vd.dna_code, vd.status as dna_status, vd.activated_at as dna_activated_at,
                   vd.activation_modality, vd.certificate_hash,
                   w_act.trade_name as activated_by_workshop_name
            FROM vehicles v
            LEFT JOIN vehicle_dna vd ON vd.vehicle_id = v.id
            LEFT JOIN workshops w_act ON vd.activated_by_workshop_id = w_act.id
            WHERE UPPER(vd.dna_code) = ?
               OR UPPER(REPLACE(v.license_plate, '-', '')) = ?
               OR UPPER(v.license_plate) = ?
               OR UPPER(v.chassis_vin) = ?
        `).get(cleanId, cleanId.replace('-', ''), rawId.toUpperCase(), rawId.toUpperCase());

        if (!vehicle) {
            return res.status(404).json({
                found: false,
                message: 'Nenhum veículo encontrado com este identificador (DNA, Placa ou Chassi).'
            });
        }

        const vehicleId = vehicle.id;

        // Se o veículo não possui DNA ativado ainda (Ex: caso da Fiat Strada)
        if (!vehicle.dna_code) {
            return res.json({
                found: true,
                hasDna: false,
                vehicle: {
                    id: vehicle.id,
                    license_plate: vehicle.license_plate,
                    chassis_vin: vehicle.chassis_vin,
                    brand: vehicle.brand,
                    model: vehicle.model,
                    version_label: vehicle.version_label,
                    manufacture_year: vehicle.manufacture_year,
                    model_year: vehicle.model_year,
                    fuel_type: vehicle.fuel_type,
                    color: vehicle.color,
                    photo_url: vehicle.photo_url
                },
                message: 'Este veículo ainda não possui DNA AUTO.'
            });
        }

        // 2. Proprietário Atual e Histórico de Donos
        const transfers = db.prepare(`
            SELECT ot.*,
                   po.name as previous_owner_name,
                   no.name as new_owner_name
            FROM ownership_transfers ot
            LEFT JOIN owners po ON ot.previous_owner_id = po.id
            LEFT JOIN owners no ON ot.new_owner_id = no.id
            WHERE ot.vehicle_id = ?
            ORDER BY ot.completed_at DESC, ot.requested_at DESC
        `).all(vehicleId);

        const currentOwner = db.prepare(`
            SELECT o.id, o.name, o.document_cpf, o.created_at
            FROM owners o
            WHERE o.id = (
                SELECT new_owner_id FROM ownership_transfers
                WHERE vehicle_id = ? AND status = 'COMPLETED'
                ORDER BY completed_at DESC LIMIT 1
            )
        `).get(vehicleId) || { name: 'Proprietário Registrado', document_cpf: '***.***.***-**' };

        // 3. Oficinas que já atenderam o veículo
        const workshops = db.prepare(`
            SELECT DISTINCT w.id, w.trade_name, w.cnpj, w.city, w.state, w.phone, w.verified_badge,
                   COUNT(sr.id) as services_count,
                   MAX(sr.service_date) as last_service_date
            FROM workshops w
            JOIN service_records sr ON sr.workshop_id = w.id
            WHERE sr.vehicle_id = ?
            GROUP BY w.id
            ORDER BY last_service_date DESC
        `).all(vehicleId);

        // 4. Serviços com 4 Níveis de Comprovação
        const services = db.prepare(`
            SELECT sr.*,
                   w.trade_name as workshop_name, w.cnpj as workshop_cnpj, w.city as workshop_city,
                   o.name as declared_by_owner_name
            FROM service_records sr
            LEFT JOIN workshops w ON sr.workshop_id = w.id
            LEFT JOIN owners o ON sr.declared_by_owner_id = o.id
            WHERE sr.vehicle_id = ?
            ORDER BY sr.service_date DESC, sr.mileage DESC
        `).all(vehicleId);

        // 5. Peças Instaladas
        const parts = db.prepare(`
            SELECT pi.*, p.name as part_name, p.manufacturer, p.part_number, p.category as part_category,
                   sr.service_date, sr.service_title, sr.mileage
            FROM part_installations pi
            JOIN parts p ON pi.part_id = p.id
            JOIN service_records sr ON pi.service_record_id = sr.id
            WHERE sr.vehicle_id = ?
            ORDER BY sr.service_date DESC
        `).all(vehicleId);

        // 6. Notas Fiscais
        const invoices = db.prepare(`
            SELECT inv.*, sr.service_title, sr.service_date
            FROM invoices inv
            LEFT JOIN service_records sr ON inv.service_record_id = sr.id
            WHERE inv.vehicle_id = ?
            ORDER BY inv.issue_date DESC
        `).all(vehicleId);

        // 7. Fotos Categorizadas
        const photos = db.prepare(`
            SELECT vp.*, w.trade_name as workshop_name, sr.service_title
            FROM vehicle_photos vp
            LEFT JOIN workshops w ON vp.workshop_id = w.id
            LEFT JOIN service_records sr ON vp.service_record_id = sr.id
            WHERE vp.vehicle_id = ?
            ORDER BY vp.taken_at DESC
        `).all(vehicleId);

        // 8. Quilometragens e Evolução
        const mileages = db.prepare(`
            SELECT * FROM mileage_records
            WHERE vehicle_id = ?
            ORDER BY recorded_at ASC, mileage ASC
        `).all(vehicleId);

        const currentMileage = mileages.length > 0 ? mileages[mileages.length - 1].mileage : 0;

        // 9. Documentos, Débitos, Multas e Leilões (Fontes Transparentes)
        const documents = db.prepare(`SELECT * FROM vehicle_documents WHERE vehicle_id = ?`).all(vehicleId);
        const taxes = db.prepare(`SELECT * FROM taxes WHERE vehicle_id = ? ORDER BY reference_year DESC`).all(vehicleId);
        const fines = db.prepare(`SELECT * FROM fines WHERE vehicle_id = ?`).all(vehicleId);
        const debts = db.prepare(`SELECT * FROM debts WHERE vehicle_id = ?`).all(vehicleId);
        const auctions = db.prepare(`SELECT * FROM auctions WHERE vehicle_id = ?`).all(vehicleId);

        // 10. Valores FIPE e Mercado
        const fipe = db.prepare(`SELECT * FROM fipe_values WHERE vehicle_id = ? ORDER BY consulted_at DESC LIMIT 1`).get(vehicleId);
        const market = db.prepare(`SELECT * FROM market_values WHERE vehicle_id = ? ORDER BY reference_date DESC LIMIT 1`).get(vehicleId);

        // 11. Saúde do Histórico (Score em Tempo Real)
        const health = calculateHealthScore(vehicleId);

        // 12. Linha do Tempo Cronológica Unificada
        const timeline = [];

        // Adiciona registro inicial do veículo
        timeline.push({
            date: vehicle.dna_activated_at ? vehicle.dna_activated_at.split(' ')[0] : '2021-03-01',
            year: vehicle.manufacture_year,
            mileage: 0,
            type: 'DNA_ACTIVATION',
            title: `Ativação do DNA AUTO (${vehicle.dna_code})`,
            description: `Passaporte Digital Permanente ativado pela oficina credenciada ${vehicle.activated_by_workshop_name || 'Rede DNA AUTO'}.`,
            badge: '✅ DNA ATIVADO',
            badgeClass: 'badge-dna'
        });

        // Adiciona transferências à timeline
        transfers.forEach(t => {
            if (t.status === 'COMPLETED') {
                timeline.push({
                    date: t.completed_at ? t.completed_at.split(' ')[0] : t.requested_at.split(' ')[0],
                    year: new Date(t.completed_at || t.requested_at).getFullYear(),
                    mileage: t.transfer_mileage || 0,
                    type: 'TRANSFER',
                    title: 'Transferência de Propriedade Registrada',
                    description: `De ${t.previous_owner_name} para ${t.new_owner_name}. Histórico e DNA preservados.`,
                    badge: '👤 TRANSFERÊNCIA',
                    badgeClass: 'badge-transfer'
                });
            }
        });

        // Adiciona serviços à timeline
        services.forEach(s => {
            let badge = '⚠️ DECLARADO';
            let badgeClass = 'badge-declared';
            if (s.proof_level === 4) {
                badge = '✅ SERVIÇO COMPROVADO';
                badgeClass = 'badge-proven';
            } else if (s.proof_level === 3) {
                badge = '✅ CONFIRMADO PELA OFICINA';
                badgeClass = 'badge-confirmed';
            } else if (s.proof_level === 2) {
                badge = '📄 DOCUMENTADO';
                badgeClass = 'badge-documented';
            }

            timeline.push({
                date: s.service_date,
                year: new Date(s.service_date).getFullYear(),
                mileage: s.mileage,
                type: 'SERVICE',
                title: s.service_title,
                description: s.description,
                workshop: s.workshop_name,
                technician: s.responsible_technician_name,
                totalCost: s.total_cost_cents,
                proofLevel: s.proof_level,
                badge,
                badgeClass,
                hasInvoice: invoices.some(inv => inv.service_record_id === s.id),
                photoCount: photos.filter(p => p.service_record_id === s.id).length,
                partsCount: parts.filter(p => p.service_record_id === s.id).length
            });
        });

        // Ordenar timeline da mais recente para a mais antiga
        timeline.sort((a, b) => new Date(b.date) - new Date(a.date));

        // 13. Auditoria Relacionada
        const auditLogs = db.prepare(`
            SELECT * FROM audit_logs
            WHERE vehicle_dna_code = ? OR entity_id = ?
            ORDER BY created_at DESC
            LIMIT 50
        `).all(vehicle.dna_code, vehicleId);

        res.json({
            found: true,
            hasDna: true,
            vehicle: {
                ...vehicle,
                current_mileage: currentMileage,
                current_owner: currentOwner.name,
                owners_count: transfers.length + 1,
                workshops_count: workshops.length,
                services_count: services.length,
                proven_services_count: health.provenServicesCount,
                parts_count: parts.length,
                invoices_count: invoices.length,
                photos_count: photos.length,
                mileage_count: mileages.length
            },
            health,
            currentOwner,
            transfers,
            workshops,
            services,
            parts,
            invoices,
            photos,
            mileages,
            documents,
            taxes,
            fines,
            debts,
            auctions,
            fipe,
            market,
            timeline,
            auditLogs
        });
    } catch (err) {
        console.error('Erro ao obter Dossiê:', err);
        res.status(500).json({ error: 'Erro ao gerar Dossiê do veículo.' });
    }
});

// 🔎 LUPA DO DOSSIÊ — Pesquisa inteligente em todo o histórico do veículo
router.get('/:identifier/search', (req, res) => {
    try {
        const rawId = req.params.identifier.trim();
        const query = (req.query.q || '').trim();

        if (!query) {
            return res.status(400).json({ error: 'Termo de pesquisa é obrigatório.' });
        }

        const vehicle = db.prepare(`
            SELECT v.id, vd.dna_code
            FROM vehicles v
            LEFT JOIN vehicle_dna vd ON vd.vehicle_id = v.id
            WHERE UPPER(vd.dna_code) = ?
               OR UPPER(REPLACE(v.license_plate, '-', '')) = ?
               OR UPPER(v.license_plate) = ?
               OR UPPER(v.chassis_vin) = ?
        `).get(rawId.toUpperCase(), rawId.replace('-', '').toUpperCase(), rawId.toUpperCase(), rawId.toUpperCase());

        if (!vehicle) {
            return res.status(404).json({ error: 'Veículo não encontrado.' });
        }

        const vehicleId = vehicle.id;
        const normalizedQuery = query.toString().normalize('NFD').replace(/[\u0300-\u036f]/g, '').toLowerCase().trim();
        const searchTerm = `%${normalizedQuery}%`;

        // Busca em Serviços (título, descrição, categoria, técnico)
        const matchedServices = db.prepare(`
            SELECT sr.*, w.trade_name as workshop_name
            FROM service_records sr
            LEFT JOIN workshops w ON sr.workshop_id = w.id
            WHERE sr.vehicle_id = ?
              AND (
                  unaccent(sr.service_title) LIKE ?
                  OR unaccent(sr.description) LIKE ?
                  OR unaccent(sr.category) LIKE ?
                  OR unaccent(COALESCE(sr.responsible_technician_name, '')) LIKE ?
                  OR unaccent(COALESCE(w.trade_name, '')) LIKE ?
                  OR CAST(sr.mileage AS TEXT) LIKE ?
                  OR CAST(strftime('%Y', sr.service_date) AS TEXT) LIKE ?
              )
            ORDER BY sr.service_date DESC
        `).all(vehicleId, searchTerm, searchTerm, searchTerm, searchTerm, searchTerm, searchTerm, searchTerm);

        // Busca em Peças (nome da peça, fabricante, part_number, categoria)
        const matchedParts = db.prepare(`
            SELECT pi.*, p.name as part_name, p.manufacturer, p.part_number, p.category,
                   sr.service_date, sr.service_title, sr.mileage, w.trade_name as workshop_name
            FROM part_installations pi
            JOIN parts p ON pi.part_id = p.id
            JOIN service_records sr ON pi.service_record_id = sr.id
            LEFT JOIN workshops w ON sr.workshop_id = w.id
            WHERE sr.vehicle_id = ?
              AND (
                  unaccent(p.name) LIKE ?
                  OR unaccent(p.manufacturer) LIKE ?
                  OR unaccent(COALESCE(p.part_number, '')) LIKE ?
                  OR unaccent(p.category) LIKE ?
              )
            ORDER BY sr.service_date DESC
        `).all(vehicleId, searchTerm, searchTerm, searchTerm, searchTerm);

        // Busca em Notas Fiscais (número, emitente, chave de acesso)
        const matchedInvoices = db.prepare(`
            SELECT inv.*, sr.service_title
            FROM invoices inv
            LEFT JOIN service_records sr ON inv.service_record_id = sr.id
            WHERE inv.vehicle_id = ?
              AND (
                  unaccent(inv.invoice_number) LIKE ?
                  OR unaccent(inv.issuer_name) LIKE ?
                  OR unaccent(COALESCE(inv.access_key, '')) LIKE ?
              )
            ORDER BY inv.issue_date DESC
        `).all(vehicleId, searchTerm, searchTerm, searchTerm);

        // Busca em Fotos (título, categoria)
        const matchedPhotos = db.prepare(`
            SELECT vp.*, w.trade_name as workshop_name
            FROM vehicle_photos vp
            LEFT JOIN workshops w ON vp.workshop_id = w.id
            WHERE vp.vehicle_id = ?
              AND (
                  unaccent(vp.title) LIKE ?
                  OR unaccent(vp.photo_category) LIKE ?
              )
            ORDER BY vp.taken_at DESC
        `).all(vehicleId, searchTerm, searchTerm);

        res.json({
            query,
            totalMatches: matchedServices.length + matchedParts.length + matchedInvoices.length + matchedPhotos.length,
            services: matchedServices,
            parts: matchedParts,
            invoices: matchedInvoices,
            photos: matchedPhotos
        });
    } catch (err) {
        console.error('Erro na Lupa do Dossiê:', err);
        res.status(500).json({ error: 'Erro ao executar pesquisa na história do veículo.' });
    }
});

module.exports = router;
