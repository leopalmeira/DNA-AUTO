const express = require('express');
const router = express.Router();
const crypto = require('crypto');
const db = require('../../database/db');
const { logAudit } = require('../../middlewares/audit');

// ==============================================================================
// GERAR RELATÓRIO OFICIAL DNA AUTO PARA VENDA — ULTRA DETALHADO (40+ campos)
// ==============================================================================
router.post('/generate-sale-report', (req, res) => {
    try {
        const { vehicle_id, user_id } = req.body;

        if (!vehicle_id) {
            return res.status(400).json({ error: 'ID do veículo é obrigatório.' });
        }

        // 1. DADOS COMPLETOS DO VEÍCULO + DNA
        const vehicle = db.prepare(`
            SELECT v.*, vd.dna_code, vd.activated_at as dna_activated_at,
                   vd.certificate_hash, vd.status as dna_status,
                   vd.activation_modality, vd.activation_fee_cents,
                   w.trade_name as workshop_activated_name,
                   w.city as workshop_activated_city,
                   w.state as workshop_activated_state,
                   w.cnpj as workshop_activated_cnpj,
                   w.verified_badge as workshop_activated_badge
            FROM vehicles v
            JOIN vehicle_dna vd ON vd.vehicle_id = v.id
            LEFT JOIN workshops w ON vd.activated_by_workshop_id = w.id
            WHERE v.id = ?
        `).get(vehicle_id);

        if (!vehicle) {
            return res.status(404).json({ error: 'Veículo com DNA ativo não encontrado.' });
        }

        // 2. TODOS OS SERVIÇOS DETALHADOS
        const services = db.prepare(`
            SELECT sr.*, w.trade_name as workshop_name, w.city as workshop_city,
                   w.state as workshop_state, w.cnpj as workshop_cnpj, w.verified_badge
            FROM service_records sr
            LEFT JOIN workshops w ON sr.workshop_id = w.id
            WHERE sr.vehicle_id = ?
            ORDER BY sr.service_date DESC
        `).all(vehicle_id);

        // 3. TODAS AS PEÇAS INSTALADAS COM DETALHES
        const parts = db.prepare(`
            SELECT pi.*, p.name as part_name, p.manufacturer, p.part_number,
                   p.category as part_category, pi.part_condition, pi.warranty_months as part_warranty,
                   sr.service_date, sr.service_title as service_title,
                   w.trade_name as installed_by_workshop
            FROM part_installations pi
            JOIN parts p ON pi.part_id = p.id
            JOIN service_records sr ON pi.service_record_id = sr.id
            LEFT JOIN workshops w ON sr.workshop_id = w.id
            WHERE sr.vehicle_id = ?
            ORDER BY sr.service_date DESC
        `).all(vehicle_id);

        // 4. NOTAS FISCAIS
        const invoices = db.prepare(`
            SELECT i.*, sr.service_title, sr.service_date as service_date
            FROM invoices i
            LEFT JOIN service_records sr ON i.service_record_id = sr.id
            WHERE i.vehicle_id = ?
            ORDER BY i.issue_date DESC
        `).all(vehicle_id);

        // 5. FOTOS
        const photos = db.prepare(`
            SELECT vp.*, w.trade_name as workshop_name
            FROM vehicle_photos vp
            LEFT JOIN workshops w ON vp.workshop_id = w.id
            WHERE vp.vehicle_id = ?
            ORDER BY vp.taken_at DESC
        `).all(vehicle_id);

        // 6. QUILOMETRAGEM COMPLETA
        const mileages = db.prepare(`
            SELECT * FROM mileage_records WHERE vehicle_id = ? ORDER BY recorded_at ASC
        `).all(vehicle_id);
        const currentMileage = mileages.length > 0 ? mileages[mileages.length - 1].mileage : 0;
        const firstMileage = mileages.length > 0 ? mileages[0].mileage : 0;
        const firstMileageDate = mileages.length > 0 ? mileages[0].recorded_at : null;

        // 7. OFICINAS QUE ATENDERAM
        const workshops = db.prepare(`
            SELECT DISTINCT w.id, w.trade_name, w.company_name, w.cnpj, w.city, w.state,
                   w.verified_badge, w.phone, w.address_street, w.address_number,
                   w.address_neighborhood, w.zip_code,
                   COUNT(sr.id) as services_count,
                   SUM(sr.total_cost_cents) as total_spent_cents
            FROM workshops w
            JOIN service_records sr ON sr.workshop_id = w.id
            WHERE sr.vehicle_id = ?
            GROUP BY w.id
            ORDER BY services_count DESC
        `).all(vehicle_id);

        // 8. PROPRIETÁRIOS
        const owners = db.prepare(`
            SELECT ot.*, 
                   po.name as previous_owner_name, po.document_cpf as previous_cpf,
                   no2.name as new_owner_name, no2.document_cpf as new_cpf
            FROM ownership_transfers ot
            LEFT JOIN owners po ON ot.previous_owner_id = po.id
            LEFT JOIN owners no2 ON ot.new_owner_id = no2.id
            WHERE ot.vehicle_id = ? AND ot.status = 'COMPLETED'
            ORDER BY ot.completed_at ASC
        `).all(vehicle_id);

        // Proprietário atual
        const currentOwner = db.prepare(`
            SELECT o.name, o.document_cpf, o.email, o.phone
            FROM owners o
            JOIN ownership_transfers ot ON ot.new_owner_id = o.id
            WHERE ot.vehicle_id = ? AND ot.status = 'COMPLETED'
            ORDER BY ot.completed_at DESC LIMIT 1
        `).get(vehicle_id);

        // Primeiro proprietário
        const firstOwner = db.prepare(`
            SELECT o.name, o.document_cpf
            FROM owners o
            JOIN ownership_transfers ot ON ot.previous_owner_id = o.id
            WHERE ot.vehicle_id = ? AND ot.status = 'COMPLETED'
            ORDER BY ot.completed_at ASC LIMIT 1
        `).get(vehicle_id);

        // 9. FIPE E VALORES
        const fipe = db.prepare(`SELECT * FROM fipe_values WHERE vehicle_id = ? ORDER BY consulted_at DESC LIMIT 1`).get(vehicle_id);
        const fipeHistory = db.prepare(`SELECT * FROM fipe_values WHERE vehicle_id = ? ORDER BY consulted_at DESC LIMIT 6`).all(vehicle_id);
        const marketValues = db.prepare(`SELECT * FROM market_values WHERE vehicle_id = ? ORDER BY reference_date DESC LIMIT 3`).all(vehicle_id);

        // 10. SAÚDE DO HISTÓRICO
        const health = db.prepare(`SELECT * FROM health_scores WHERE vehicle_id = ?`).get(vehicle_id);

        // 11. DOCUMENTOS DO VEÍCULO
        const documents = db.prepare(`SELECT * FROM vehicle_documents WHERE vehicle_id = ? ORDER BY issue_date DESC`).all(vehicle_id);

        // 12. IPVA E TAXAS
        const taxes = db.prepare(`SELECT * FROM taxes WHERE vehicle_id = ? ORDER BY reference_year DESC`).all(vehicle_id);

        // 13. MULTAS
        const fines = db.prepare(`SELECT * FROM fines WHERE vehicle_id = ?`).all(vehicle_id);

        // 14. DÉBITOS E RESTRIÇÕES
        const debts = db.prepare(`SELECT * FROM debts WHERE vehicle_id = ?`).all(vehicle_id);

        // 15. LEILÕES E SINISTROS
        const auctions = db.prepare(`SELECT * FROM auctions WHERE vehicle_id = ?`).all(vehicle_id);

        // 16. MANUTENÇÕES PLANEJADAS
        const maintenances = db.prepare(`
            SELECT * FROM maintenance_records WHERE vehicle_id = ? ORDER BY recommended_km ASC
        `).all(vehicle_id);

        // ==================================================================
        // CÁLCULOS DERIVADOS
        // ==================================================================
        const provenServices = services.filter(s => s.proof_level >= 3);
        const declaredServices = services.filter(s => s.proof_level <= 2);
        const totalSpentCents = services.reduce((sum, s) => sum + (s.total_cost_cents || 0), 0);
        const totalPartsCostCents = parts.reduce((sum, p) => sum + ((p.unit_price_cents || 0) * (p.quantity || 1)), 0);
        const totalLaborCostCents = services.reduce((sum, s) => sum + (s.labor_cost_cents || 0), 0);

        // Idade do veículo
        const vehicleAgeYears = new Date().getFullYear() - vehicle.manufacture_year;
        
        // Média de km/ano
        const avgKmPerYear = vehicleAgeYears > 0 ? Math.round(currentMileage / vehicleAgeYears) : currentMileage;

        // Média de km/mês
        const avgKmPerMonth = Math.round(avgKmPerYear / 12);

        // Categorias de serviços realizados
        const serviceCategories = {};
        services.forEach(s => {
            serviceCategories[s.category] = (serviceCategories[s.category] || 0) + 1;
        });

        // Último serviço
        const lastService = services.length > 0 ? services[0] : null;
        
        // Primeiro serviço
        const firstService = services.length > 0 ? services[services.length - 1] : null;

        // Total de registros de km e consistência
        const mileageConsistency = mileages.every((m, i) => {
            if (i === 0) return true;
            return m.mileage >= mileages[i - 1].mileage;
        });

        // Garantias ativas
        const activeWarranties = [];
        parts.forEach(p => {
            if (p.part_warranty && p.service_date) {
                const warrantyEnd = new Date(p.service_date);
                warrantyEnd.setMonth(warrantyEnd.getMonth() + p.part_warranty);
                if (warrantyEnd > new Date()) {
                    activeWarranties.push({
                        partName: p.part_name,
                        manufacturer: p.manufacturer,
                        serviceDate: p.service_date,
                        warrantyEndDate: warrantyEnd.toISOString().split('T')[0],
                        remainingDays: Math.ceil((warrantyEnd - new Date()) / (1000 * 60 * 60 * 24)),
                        workshop: p.installed_by_workshop
                    });
                }
            }
        });

        // Próximas manutenções vencidas ou próximas
        const upcomingMaintenances = maintenances.filter(m => m.status !== 'COMPLETED');
        const overdueMaintenances = maintenances.filter(m => m.status === 'OVERDUE');

        // Tempo desde a última manutenção
        const daysSinceLastService = lastService
            ? Math.ceil((new Date() - new Date(lastService.service_date)) / (1000 * 60 * 60 * 24))
            : null;

        // Contagem de fotos por categoria
        const photosByCategory = {};
        photos.forEach(p => {
            photosByCategory[p.photo_category] = (photosByCategory[p.photo_category] || 0) + 1;
        });

        // ==================================================================
        // MONTAR SNAPSHOT ULTRA DETALHADO DO RELATÓRIO (40+ CAMPOS)
        // ==================================================================
        const validationCode = `DNA-VAL-${new Date().getFullYear()}-${crypto.randomBytes(3).toString('hex').toUpperCase()}`;
        const reportId = 'rep_' + Date.now();

        const reportSnapshot = {
            validationCode,
            generatedAt: new Date().toISOString(),

            // ── SEÇÃO 1: IDENTIFICAÇÃO COMPLETA DO VEÍCULO (12 campos) ──
            vehicle: {
                brand: vehicle.brand,
                model: vehicle.model,
                version: vehicle.version_label,
                year: `${vehicle.manufacture_year}/${vehicle.model_year}`,
                manufactureYear: vehicle.manufacture_year,
                modelYear: vehicle.model_year,
                plate: vehicle.license_plate,
                chassis: vehicle.chassis_vin,
                renavam: vehicle.renavam || 'N/D',
                color: vehicle.color,
                fuel: vehicle.fuel_type,
                transmission: vehicle.transmission_type || 'N/D',
                currentMileage,
                vehicleAgeYears,
                avgKmPerYear,
                avgKmPerMonth,
                dnaCode: vehicle.dna_code
            },

            // ── SEÇÃO 2: CERTIFICADO DNA AUTO (8 campos) ──
            dna: {
                code: vehicle.dna_code,
                status: vehicle.dna_status,
                activatedAt: vehicle.dna_activated_at,
                activationModality: vehicle.activation_modality,
                certificateHash: vehicle.certificate_hash,
                activatedByWorkshop: vehicle.workshop_activated_name,
                activatedByCity: vehicle.workshop_activated_city ? `${vehicle.workshop_activated_city}/${vehicle.workshop_activated_state}` : null,
                activatedByCnpj: vehicle.workshop_activated_cnpj,
                workshopVerified: vehicle.workshop_activated_badge === 1
            },

            // ── SEÇÃO 3: ÍNDICE DE SAÚDE DO HISTÓRICO (10 campos) ──
            healthScore: {
                overallScore: health ? health.overall_score : 0,
                documentedPercentage: health ? health.documented_percentage : 0,
                continuityStatus: health ? health.continuity_status : 'N/A',
                scoreRationale: health ? health.score_rationale : '',
                provenServicesCount: provenServices.length,
                totalServicesCount: services.length,
                declaredServicesCount: declaredServices.length,
                invoicesCount: invoices.length,
                photosCount: photos.length,
                workshopsCount: workshops.length,
                mileageRecordsCount: mileages.length,
                mileageConsistency: mileageConsistency ? 'CONSISTENTE' : 'INCONSISTENTE',
                activeWarrantiesCount: activeWarranties.length
            },

            // ── SEÇÃO 4: HISTÓRICO DE PROPRIETÁRIOS (variável) ──
            ownership: {
                totalOwners: owners.length + 1,
                currentOwner: currentOwner ? {
                    name: currentOwner.name,
                    cpfMasked: currentOwner.document_cpf ? currentOwner.document_cpf.replace(/(\d{3})\.\d{3}\.\d{3}/, '$1.***.***') : 'N/D'
                } : null,
                firstOwner: firstOwner ? {
                    name: firstOwner.name,
                    cpfMasked: firstOwner.document_cpf ? firstOwner.document_cpf.replace(/(\d{3})\.\d{3}\.\d{3}/, '$1.***.***') : 'N/D'
                } : null,
                transfers: owners.map(t => ({
                    date: t.completed_at,
                    mileageAtTransfer: t.transfer_mileage,
                    fromOwner: t.previous_owner_name,
                    toOwner: t.new_owner_name
                }))
            },

            // ── SEÇÃO 5: RESUMO FINANCEIRO (6 campos) ──
            financials: {
                totalInvestedCents: totalSpentCents,
                totalPartsValueCents: totalPartsCostCents,
                totalLaborCostCents: totalLaborCostCents,
                totalInvoicesValueCents: invoices.reduce((s, i) => s + (i.total_amount_cents || 0), 0),
                averageCostPerServiceCents: services.length > 0 ? Math.round(totalSpentCents / services.length) : 0,
                fipePrice: fipe ? fipe.fipe_price_cents : null,
                fipeCode: fipe ? fipe.fipe_code : null,
                fipeReference: fipe ? fipe.reference_month_year : null,
                fipeHistory: fipeHistory.map(f => ({
                    reference: f.reference_month_year,
                    priceCents: f.fipe_price_cents
                })),
                marketValues: marketValues.map(m => ({
                    date: m.reference_date,
                    priceCents: m.estimated_price_cents,
                    source: m.market_source
                }))
            },

            // ── SEÇÃO 6: SERVIÇOS DETALHADOS (variável) ──
            services: services.map(s => ({
                date: s.service_date,
                title: s.service_title,
                category: s.category,
                description: s.description,
                mileage: s.mileage,
                proofLevel: s.proof_level,
                proofStatus: s.proof_status,
                workshopName: s.workshop_name,
                workshopCity: s.workshop_city ? `${s.workshop_city}/${s.workshop_state}` : null,
                workshopVerified: s.verified_badge === 1,
                technician: s.responsible_technician_name,
                totalCostCents: s.total_cost_cents,
                laborCostCents: s.labor_cost_cents,
                partsCostCents: s.parts_cost_cents,
                warrantyMonths: s.warranty_months
            })),

            // ── SEÇÃO 7: PEÇAS INSTALADAS (variável) ──
            parts: parts.map(p => ({
                name: p.part_name,
                manufacturer: p.manufacturer,
                partNumber: p.part_number,
                category: p.part_category,
                condition: p.part_condition,
                quantity: p.quantity,
                unitPriceCents: p.unit_price_cents,
                warrantyMonths: p.part_warranty,
                serviceDate: p.service_date,
                serviceTitle: p.service_title,
                installedBy: p.installed_by_workshop
            })),

            // ── SEÇÃO 8: GARANTIAS ATIVAS (variável) ──
            activeWarranties,

            // ── SEÇÃO 9: NOTAS FISCAIS (variável) ──
            invoices: invoices.map(i => ({
                number: i.invoice_number,
                issuer: i.issuer_name,
                issuerCnpj: i.issuer_cnpj,
                accessKey: i.access_key,
                issueDate: i.issue_date,
                totalAmountCents: i.total_amount_cents,
                verified: i.verified === 1,
                serviceTitle: i.service_title
            })),

            // ── SEÇÃO 10: QUILOMETRAGEM (variável) ──
            mileage: {
                current: currentMileage,
                first: firstMileage,
                firstDate: firstMileageDate,
                totalRecords: mileages.length,
                consistency: mileageConsistency,
                history: mileages.map(m => ({
                    km: m.mileage,
                    date: m.recorded_at,
                    source: m.source,
                    verified: m.verified === 1
                }))
            },

            // ── SEÇÃO 11: OFICINAS CREDENCIADAS (variável) ──
            workshops: workshops.map(w => ({
                tradeName: w.trade_name,
                companyName: w.company_name,
                cnpj: w.cnpj,
                city: `${w.city}/${w.state}`,
                phone: w.phone,
                address: `${w.address_street}, ${w.address_number} — ${w.address_neighborhood}`,
                verified: w.verified_badge === 1,
                servicesCount: w.services_count,
                totalSpentCents: w.total_spent_cents
            })),

            // ── SEÇÃO 12: CATEGORIAS DE SERVIÇO (variável) ──
            serviceCategories: Object.entries(serviceCategories).map(([cat, count]) => ({ category: cat, count })),

            // ── SEÇÃO 13: REGISTROS FOTOGRÁFICOS (variável) ──
            photos: {
                total: photos.length,
                byCategory: photosByCategory,
                items: photos.slice(0, 20).map(p => ({
                    title: p.title,
                    category: p.photo_category,
                    takenAt: p.taken_at,
                    workshop: p.workshop_name,
                    filePath: p.file_path
                }))
            },

            // ── SEÇÃO 14: DOCUMENTAÇÃO DO VEÍCULO (variável) ──
            documents: documents.map(d => ({
                type: d.doc_type,
                title: d.title,
                issueDate: d.issue_date,
                expirationDate: d.expiration_date,
                status: d.status,
                source: d.verification_source
            })),

            // ── SEÇÃO 15: IPVA E TAXAS (variável) ──
            taxes: taxes.map(t => ({
                year: t.reference_year,
                dueDate: t.due_date,
                amountCents: t.amount_cents,
                status: t.status,
                source: t.source_message
            })),

            // ── SEÇÃO 16: MULTAS (variável) ──
            fines: {
                total: fines.length,
                totalPending: fines.filter(f => f.status === 'PENDING').length,
                items: fines.map(f => ({
                    code: f.auto_infraction_code,
                    date: f.infraction_date,
                    description: f.description,
                    amountCents: f.amount_cents,
                    points: f.points,
                    status: f.status,
                    source: f.source_message
                }))
            },

            // ── SEÇÃO 17: DÉBITOS E RESTRIÇÕES (variável) ──
            debts: {
                total: debts.length,
                hasRestrictions: debts.some(d => d.has_restriction === 1),
                items: debts.map(d => ({
                    category: d.category,
                    description: d.description,
                    hasRestriction: d.has_restriction === 1,
                    source: d.source_message
                }))
            },

            // ── SEÇÃO 18: HISTÓRICO DE LEILÃO E SINISTROS ──
            auctions: {
                hasAuctionRecord: auctions.some(a => a.has_auction_record === 1),
                items: auctions.map(a => ({
                    hasRecord: a.has_auction_record === 1,
                    auctioneer: a.auctioneer_name,
                    date: a.auction_date,
                    damageClass: a.damage_classification,
                    source: a.source_message
                }))
            },

            // ── SEÇÃO 19: MANUTENÇÕES PROGRAMADAS ──
            maintenances: {
                totalPlanned: maintenances.length,
                completed: maintenances.filter(m => m.status === 'COMPLETED').length,
                overdue: overdueMaintenances.length,
                upcoming: upcomingMaintenances.length,
                items: maintenances.map(m => ({
                    title: m.title,
                    category: m.category,
                    recommendedKm: m.recommended_km,
                    recommendedDate: m.recommended_date,
                    status: m.status
                }))
            },

            // ── SEÇÃO 20: MÉTRICAS CONSOLIDADAS (resumo rápido) ──
            summary: {
                daysSinceLastService,
                lastServiceDate: lastService ? lastService.service_date : null,
                lastServiceTitle: lastService ? lastService.service_title : null,
                firstServiceDate: firstService ? firstService.service_date : null,
                totalPhotos: photos.length,
                totalParts: parts.length,
                totalInvoices: invoices.length,
                totalOwners: owners.length + 1,
                totalWorkshops: workshops.length,
                totalServices: services.length
            },

            // ── AVISO LEGAL ──
            legalDisclaimer: 'Este relatório apresenta os registros existentes no Sistema DNA AUTO com base em dados inseridos por oficinas credenciadas e proprietários cadastrados. Não substitui inspeção mecânica profissional, laudo cautelar veicular ou consulta oficial junto ao DETRAN. O DNA AUTO não se responsabiliza por informações omitidas ou falsas inseridas por terceiros. Verifique a autenticidade deste documento pelo QR Code ou pelo código de validação no site oficial.',
            legalNotice2: 'Dados de FIPE, DETRAN, IPVA, Multas e Leilões são oriundos de integrações com bases oficiais quando disponíveis. Na ausência de conexão governamental ativa, a mensagem "Informação não disponível nesta fonte" é exibida com transparência.'
        };

        // Persistir relatório
        db.prepare(`
            INSERT INTO reports (id, vehicle_id, generated_by_user_id, report_type, validation_code, expires_at, summary_data)
            VALUES (?, ?, ?, 'SALE_DOSSIER', ?, datetime('now', '+90 days'), ?)
        `).run(reportId, vehicle_id, user_id || null, validationCode, JSON.stringify(reportSnapshot));

        logAudit({
            action: 'GENERATE_SALE_REPORT',
            entityType: 'REPORT',
            entityId: reportId,
            vehicleDnaCode: vehicle.dna_code,
            ipAddress: req.ip,
            dataAfter: { validationCode, dnaCode: vehicle.dna_code, sectionsCount: 20 }
        });

        res.json({
            success: true,
            reportId,
            validationCode,
            reportData: reportSnapshot
        });
    } catch (err) {
        console.error('Erro ao gerar relatório para venda:', err);
        res.status(500).json({ error: 'Erro ao gerar relatório DNA AUTO.' });
    }
});

// Validar Relatório por Código Público
router.get('/validate/:validationCode', (req, res) => {
    try {
        const report = db.prepare(`
            SELECT r.*, v.license_plate, vd.dna_code
            FROM reports r
            JOIN vehicles v ON r.vehicle_id = v.id
            JOIN vehicle_dna vd ON vd.vehicle_id = v.id
            WHERE r.validation_code = ?
        `).get(req.params.validationCode.toUpperCase());

        if (!report) {
            return res.status(404).json({
                valid: false,
                message: 'Código de autenticação do relatório inválido ou não encontrado.'
            });
        }

        res.json({
            valid: true,
            validationCode: report.validation_code,
            generatedAt: report.created_at,
            dnaCode: report.dna_code,
            summary: JSON.parse(report.summary_data)
        });
    } catch (err) {
        res.status(500).json({ error: 'Erro ao validar autenticidade do relatório.' });
    }
});

module.exports = router;
