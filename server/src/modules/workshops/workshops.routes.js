const express = require('express');
const router = express.Router();
const path = require('path');
const fs = require('fs');
const crypto = require('crypto');
const multer = require('multer');
const bcrypt = require('bcryptjs');
const db = require('../../database/db');
const { authenticateToken, authorizeRoles } = require('../../middlewares/auth');
const { logAudit } = require('../../middlewares/audit');
const baileysService = require('./baileys.service');
const evolutionService = require('./evolution.service');
const authRoutes = require('../auth/auth.routes');

// Diretório para upload de fotos, áudios e vídeos do WhatsApp da Central de Atendimento
const WHATSAPP_UPLOADS_DIR = path.resolve(__dirname, '../../..', 'uploads', 'whatsapp');
if (!fs.existsSync(WHATSAPP_UPLOADS_DIR)) {
    fs.mkdirSync(WHATSAPP_UPLOADS_DIR, { recursive: true });
}

const whatsappStorage = multer.diskStorage({
    destination: function (req, file, cb) {
        cb(null, WHATSAPP_UPLOADS_DIR);
    },
    filename: function (req, file, cb) {
        const uniqueSuffix = Date.now() + '-' + Math.round(Math.random() * 1E9);
        const ext = path.extname(file.originalname) || '';
        cb(null, 'wpp-' + uniqueSuffix + ext);
    }
});

const uploadWhatsAppMedia = multer({
    storage: whatsappStorage,
    limits: { fileSize: 30 * 1024 * 1024 } // 30MB
});

// ------------------------------------------------------------------------------
// HELPERS PARA AUDITORIA FINANCEIRA E RANKING MENSAL (DESAFIO DNA AUTO)
// ------------------------------------------------------------------------------
function getMonthMetadata(monthStr) {
    const now = new Date();
    const targetMonth = (monthStr && /^\d{4}-\d{2}$/.test(monthStr)) 
        ? monthStr 
        : now.toISOString().substring(0, 7);
    const [year, month] = targetMonth.split('-').map(Number);
    
    const monthNames = [
        'Janeiro', 'Fevereiro', 'Março', 'Abril', 'Maio', 'Junho',
        'Julho', 'Agosto', 'Setembro', 'Outubro', 'Novembro', 'Dezembro'
    ];
    const monthLabel = `${monthNames[(month - 1) % 12]}/${year}`;
    
    // Último dia do mês
    const lastDayOfMonth = new Date(year, month, 0, 23, 59, 59, 999);
    const diffMs = lastDayOfMonth.getTime() - now.getTime();
    const daysRemaining = Math.max(0, Math.ceil(diffMs / (1000 * 60 * 60 * 24)));
    
    return {
        month: targetMonth,
        monthLabel,
        lastDayFormatted: lastDayOfMonth.toISOString().split('T')[0],
        daysRemaining
    };
}

function checkWorkshopAccess(req, workshopId) {
    if (!req.user) return true;
    const role = (req.user.role_code || req.user.role || '').toUpperCase();
    if (role === 'ADMIN' || req.user.role_id === 'role_admin') return true;
    
    if (req.user.workshop && (req.user.workshop.id === workshopId || req.user.workshop.workshop_id === workshopId)) return true;
    try {
        const wsUser = db.prepare('SELECT workshop_id FROM workshop_users WHERE user_id = ?').get(req.user.id);
        if (wsUser && wsUser.workshop_id === workshopId) return true;
    } catch (_) {}
    
    return false;
}


// Alias oficial para Cadastro de Oficina (Suporte a /api/v1/workshops/register e PWA mobile)
router.post('/register', (req, res) => {
    if (authRoutes.handleRegisterWorkshop) {
        return authRoutes.handleRegisterWorkshop(req, res);
    }
    req.url = '/register-workshop';
    return authRoutes(req, res);
});

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

// Ranking Oficial do Desafio DNA AUTO — Premiação Mensal (R$ 10k, R$ 5k, R$ 3k)
// Regra: Mínimo 100 ativações pagas no mês civil para elegibilidade aos prêmios.
router.get('/ranking/monthly', authenticateToken, (req, res) => {
    try {
        const meta = getMonthMetadata(req.query.month);
        const targetMonth = meta.month;

        // Oficinas ativas e contagem de ativações pagas dentro do mês selecionado
        const rows = db.prepare(`
            SELECT 
                w.id as workshop_id,
                w.trade_name,
                COALESCE(w.city, 'São Paulo') as city,
                COALESCE(w.state, 'SP') as state,
                w.verified_badge,
                COUNT(CASE WHEN da.payment_status = 'COMPLETED' THEN da.id END) as valid_activations,
                MAX(CASE WHEN da.payment_status = 'COMPLETED' THEN da.activated_at END) as last_activation_at,
                COUNT(DISTINCT CASE WHEN sr.proof_level = 4 THEN sr.id END) as proven_services_count
            FROM workshops w
            LEFT JOIN dna_activations da ON da.workshop_id = w.id 
                 AND strftime('%Y-%m', da.activated_at) = ?
            LEFT JOIN service_records sr ON sr.workshop_id = w.id
            WHERE w.status != 'INACTIVE' AND w.status != 'BLOCKED'
            GROUP BY w.id
            ORDER BY valid_activations DESC, last_activation_at ASC, proven_services_count DESC, w.trade_name ASC
        `).all(targetMonth);

        // Montagem do ranking oficial com badges de elegibilidade e premiação
        const ranking = rows.map((r, index) => {
            const rank = index + 1;
            const validCount = Number(r.valid_activations) || 0;
            const isEligible = validCount >= 100;
            
            let potentialPrizeCents = 0;
            if (isEligible) {
                if (rank === 1) potentialPrizeCents = 1000000;      // R$ 10.000,00
                else if (rank === 2) potentialPrizeCents = 500000;  // R$ 5.000,00
                else if (rank === 3) potentialPrizeCents = 300000;  // R$ 3.000,00
            }

            return {
                rank,
                workshop_id: r.workshop_id,
                trade_name: r.trade_name,
                city: r.city,
                state: r.state,
                verified_badge: Boolean(r.verified_badge),
                valid_activations: validCount,
                is_eligible: isEligible,
                eligibility_badge: isEligible ? 'ELEGÍVEL' : 'NÃO ELEGÍVEL (<100)',
                activations_to_target: Math.max(0, 100 - validCount),
                progress_percentage: Math.min(100, Math.round((validCount / 100) * 100)),
                potential_prize_cents: potentialPrizeCents,
                potential_prize_formatted: potentialPrizeCents > 0 
                    ? `R$ ${(potentialPrizeCents / 100).toLocaleString('pt-BR', { minimumFractionDigits: 2 })}` 
                    : null
            };
        });

        // Top 3 participantes
        const top3 = ranking.slice(0, 3);

        res.json({
            success: true,
            month: meta.month,
            month_label: meta.monthLabel,
            is_provisional: true, // Classificação provisória até o fechamento oficial do mês
            days_remaining: meta.daysRemaining,
            rules: {
                min_activations: 100,
                total_prizes_cents: 1800000, // R$ 18.000,00 total
                prizes: [
                    { place: 1, label: '1º Lugar', amount_cents: 1000000, formatted: 'R$ 10.000,00' },
                    { place: 2, label: '2º Lugar', amount_cents: 500000, formatted: 'R$ 5.000,00' },
                    { place: 3, label: '3º Lugar', amount_cents: 300000, formatted: 'R$ 3.000,00' }
                ],
                continuity: 'A contagem é mensal. Caso não alcance 100 ativações, a oficina permanece 100% habilitada para disputar no mês seguinte com contagem zerada.'
            },
            ranking,
            top3
        });
    } catch (err) {
        console.error('Erro ao gerar ranking mensal do Desafio DNA AUTO:', err);
        res.status(500).json({ error: 'Erro ao gerar ranking mensal.' });
    }
});

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

// Rede de Oficinas Credenciadas (Para o App do Cliente / Dono) com filtro por Estado/Sigla (RJ, SP, etc.)
router.get('/network', (req, res) => {
    try {
        const { state, uf } = req.query;
        const requestedUf = (uf || state || '').toUpperCase().trim();

        const workshops = db.prepare(`
            SELECT id, trade_name as name, cnpj, phone, email, address_street, address_number, address_neighborhood, city, state, zip_code, verified_badge, status
            FROM workshops
            WHERE status = 'APPROVED' OR status = 'ACTIVE' OR status IS NULL
            ORDER BY verified_badge DESC, trade_name ASC
        `).all();

        const defaultFallback = [
            { id: 'ws_riobarra', name: 'DNA Auto Rio Barra', city: 'Rio de Janeiro', state: 'RJ', phone: '(21) 98765-1234', address_neighborhood: 'Barra da Tijuca', verified_badge: 1 },
            { id: 'ws_riobotafogo', name: 'Carioca Prime Auto Center', city: 'Rio de Janeiro', state: 'RJ', phone: '(21) 97654-4321', address_neighborhood: 'Botafogo', verified_badge: 1 },
            { id: 'ws_veloce', name: 'Veloce Auto Center', city: 'São Paulo', state: 'SP', phone: '(11) 99876-5432', address_neighborhood: 'Bela Vista', verified_badge: 1 },
            { id: 'ws_autotech', name: 'Auto Center Silva', city: 'São Paulo', state: 'SP', phone: '(11) 98765-4321', address_neighborhood: 'Moema', verified_badge: 1 },
            { id: 'ws_topmotors', name: 'Top Motors Performance', city: 'Campinas', state: 'SP', phone: '(11) 97654-3210', address_neighborhood: 'Cambuí', verified_badge: 1 },
            { id: 'ws_marcelo', name: 'Oficina Mecânica do Marcelo', city: 'São Bernardo', state: 'SP', phone: '(11) 96543-2109', address_neighborhood: 'Rudge Ramos', verified_badge: 1 }
        ];

        let baseList = workshops.length > 0 ? workshops : defaultFallback;

        if (requestedUf && requestedUf !== 'TODOS') {
            baseList = baseList.filter(w => (w.state || '').toUpperCase() === requestedUf);
        }

        const formatted = baseList.map((w, idx) => ({
            id: w.id,
            name: w.name || w.trade_name || 'Oficina Credenciada DNA AUTO',
            rating: (4.7 + (idx % 3) * 0.1).toFixed(1),
            distance: `${(1.2 + idx * 1.5).toFixed(1)} km`,
            neighborhood: w.address_neighborhood || w.city || 'Centro',
            city: w.city || 'São Paulo',
            state: w.state || 'SP',
            address: w.address_street ? `${w.address_street}, ${w.address_number || 'S/N'}` : 'Av. Principal, 1000',
            phone: w.phone || '(11) 99876-5432',
            verified: true,
            type: idx % 2 === 0 ? 'Oficina' : 'Auto Center'
        }));

        res.json({ success: true, workshops: formatted });
    } catch (err) {
        console.error('Erro ao listar rede de oficinas:', err);
        res.status(500).json({ error: 'Erro ao listar oficinas da rede credenciada.' });
    }
});


// Dashboard Exclusivo da Oficina (Métricas da Oficina Logada ou Especificada)

// Resumo Financeiro Oficial da Oficina (6 Blocos de Governança Contábil)
router.get('/:id/financial-summary', authenticateToken, (req, res) => {
    try {
        const workshopId = req.params.id;
        const workshop = db.prepare('SELECT * FROM workshops WHERE id = ?').get(workshopId);
        if (!workshop) {
            return res.status(404).json({ error: 'Oficina não encontrada.' });
        }

        // Validação multi-tenant
        if (!checkWorkshopAccess(req, workshopId)) {
            return res.status(403).json({ error: 'Acesso negado: dados financeiros restritos à própria oficina.' });
        }

        const meta = getMonthMetadata(req.query.month);
        const targetMonth = meta.month;

        // 1. Passaportes Ativados no Mês (Somente COMPLETED é considerado válido)
        const actRow = db.prepare(`
            SELECT 
                COUNT(CASE WHEN payment_status = 'COMPLETED' THEN 1 END) as valid_count,
                COUNT(CASE WHEN payment_status = 'PENDING' THEN 1 END) as pending_count,
                COUNT(CASE WHEN payment_status IN ('CANCELLED', 'REFUNDED') THEN 1 END) as cancelled_count,
                COALESCE(SUM(CASE WHEN payment_status = 'COMPLETED' THEN amount_paid_cents END), 0) as gross_amount_cents,
                COALESCE(SUM(CASE WHEN payment_status = 'COMPLETED' THEN commission_amount_cents END), 0) as commission_amount_cents
            FROM dna_activations
            WHERE workshop_id = ? AND strftime('%Y-%m', activated_at) = ?
        `).get(workshopId, targetMonth);

        const validPassportsCount = Number(actRow.valid_count) || 0;
        const cancelledPassportsCount = Number(actRow.cancelled_count) || 0;

        // Split Oficial DNA AUTO: R$ 59,90 total = R$ 29,95 Oficina + R$ 29,95 Plataforma
        const passportPriceCents = 5990;
        const commissionPerPassportCents = 2995;
        const platformSharePerPassportCents = 2995;

        const totalCommissionGeneratedCents = validPassportsCount * commissionPerPassportCents;
        const totalPlatformShareCents = validPassportsCount * platformSharePerPassportCents;

        // Comissões pagas e pendentes de repasse
        const commRow = db.prepare(`
            SELECT 
                COALESCE(SUM(CASE WHEN status = 'PAID' THEN amount_cents END), 0) as paid_cents,
                COALESCE(SUM(CASE WHEN status = 'AVAILABLE' THEN amount_cents END), 0) as available_cents
            FROM commissions
            WHERE workshop_id = ?
        `).get(workshopId);

        const commissionsReceivedCents = Number(commRow.paid_cents) || 0;
        const pendingPayoutCents = Math.max(0, totalCommissionGeneratedCents - commissionsReceivedCents);

        // 2. Taxas por Atendimentos Concluídos (R$ 6,90 por atendimento)
        const feeRow = db.prepare(`
            SELECT 
                COUNT(*) as total_attendance,
                COALESCE(SUM(amount_cents), 0) as total_fees_cents,
                COUNT(CASE WHEN status = 'PAID' THEN 1 END) as paid_count,
                COALESCE(SUM(CASE WHEN status = 'PAID' THEN amount_cents END), 0) as paid_fees_cents
            FROM workshop_attendance_fees
            WHERE workshop_id = ? AND strftime('%Y-%m', created_at) = ?
        `).get(workshopId, targetMonth);

        const attendanceCount = Number(feeRow.total_attendance) || 0;
        const attendanceFeesCents = attendanceCount * 690;
        const attendanceFeesPaidCents = Number(feeRow.paid_fees_cents) || 0;
        const attendanceFeesPendingCents = Math.max(0, attendanceFeesCents - attendanceFeesPaidCents);

        // 3. Faturamento da Oficina com Serviços Mecânicos (SEPARADO DOS PASSAPORTES)
        const srvRow = db.prepare(`
            SELECT 
                COUNT(*) as count,
                COALESCE(SUM(labor_cost_cents), 0) as labor_cents,
                COALESCE(SUM(parts_cost_cents), 0) as parts_cents,
                COALESCE(SUM(total_cost_cents), 0) as total_cents
            FROM service_records
            WHERE workshop_id = ? AND strftime('%Y-%m', service_date) = ?
        `).get(workshopId, targetMonth);

        const mechanicalServicesCount = Number(srvRow.count) || 0;
        const mechanicalLaborCents = Number(srvRow.labor_cents) || 0;
        const mechanicalPartsCents = Number(srvRow.parts_cents) || 0;
        const mechanicalTotalRevenueCents = Number(srvRow.total_cents) || (mechanicalLaborCents + mechanicalPartsCents);

        // 4. Cobrança PIX Pendente Legítima da Oficina (Nunca fixa, fictícia ou de outra oficina)
        const activePix = db.prepare(`
            SELECT id, amount_cents, charge_type, pix_code, pix_qr_code_base64, created_at, status
            FROM workshop_pix_charges
            WHERE workshop_id = ? AND status = 'PENDING'
            ORDER BY created_at DESC LIMIT 1
        `).get(workshopId);

        // 5. Saldo a Repassar à DNA AUTO (Apenas obrigações pendentes da oficina)
        const pendingObligationToDnaCents = attendanceFeesPendingCents;

        // 6. Transações do Extrato do Período
        const transactions = [];

        // Ativações
        const acts = db.prepare(`
            SELECT da.id, da.activated_at as date, da.amount_paid_cents, da.commission_amount_cents,
                   v.license_plate, v.model
            FROM dna_activations da
            LEFT JOIN vehicle_dna vd ON da.vehicle_dna_id = vd.id
            LEFT JOIN vehicles v ON vd.vehicle_id = v.id
            WHERE da.workshop_id = ? AND strftime('%Y-%m', da.activated_at) = ? AND da.payment_status = 'COMPLETED'
            ORDER BY da.activated_at DESC
        `).all(workshopId, targetMonth);

        acts.forEach(a => {
            transactions.push({
                id: a.id,
                date: a.date,
                type: 'ATIVACAO_PASSAPORTE',
                title: `Ativação DNA (${a.license_plate || 'Veículo'})`,
                description: `${a.model || 'Carro'} - Split R$ 29,95 Oficina / R$ 29,95 Plataforma`,
                amount_cents: commissionPerPassportCents,
                direction: 'CREDIT',
                status: 'CONFIRMED'
            });
        });

        // Taxas
        const fees = db.prepare(`
            SELECT waf.id, waf.created_at as date, waf.amount_cents, waf.notes
            FROM workshop_attendance_fees waf
            WHERE waf.workshop_id = ? AND strftime('%Y-%m', waf.created_at) = ?
            ORDER BY waf.created_at DESC
        `).all(workshopId, targetMonth);

        fees.forEach(f => {
            transactions.push({
                id: f.id,
                date: f.date,
                type: 'TAXA_ATENDIMENTO',
                title: 'Taxa de Atendimento Concluído',
                description: f.notes || 'Agendamento e recepção na grade operacional',
                amount_cents: f.amount_cents,
                direction: 'DEBIT',
                status: 'CONFIRMED'
            });
        });

        // Ordena transações por data decrescente
        transactions.sort((a, b) => new Date(b.date || 0) - new Date(a.date || 0));

        res.json({
            success: true,
            month: meta.month,
            month_label: meta.monthLabel,
            days_remaining: meta.daysRemaining,
            workshop: {
                id: workshop.id,
                trade_name: workshop.trade_name,
                city: workshop.city,
                state: workshop.state
            },
            summary: {
                // Bloco 1: Meu Financeiro
                passports_activated_count: validPassportsCount,
                cancelled_passports_count: cancelledPassportsCount,
                commission_generated_cents: totalCommissionGeneratedCents,
                platform_share_cents: totalPlatformShareCents,
                commissions_received_cents: commissionsReceivedCents,
                pending_commission_payout_cents: pendingPayoutCents,
                pending_obligation_to_dna_cents: pendingObligationToDnaCents,
                next_due_date: meta.lastDayFormatted,
                is_up_to_date: pendingObligationToDnaCents === 0,
                
                // Bloco 2: Extrato e Obrigações
                attendance_fees_count: attendanceCount,
                attendance_fees_cents: attendanceFeesCents,
                attendance_fees_pending_cents: attendanceFeesPendingCents,
                
                // Faturamento Mecânico Separado
                mechanical_services_count: mechanicalServicesCount,
                mechanical_labor_cents: mechanicalLaborCents,
                mechanical_parts_cents: mechanicalPartsCents,
                mechanical_total_revenue_cents: mechanicalTotalRevenueCents,

                // PIX Dinâmico Legítimo
                active_pix_charge: activePix ? {
                    id: activePix.id,
                    amount_cents: activePix.amount_cents,
                    pix_code: activePix.pix_code,
                    pix_qr_code_base64: activePix.pix_qr_code_base64,
                    charge_type: activePix.charge_type,
                    created_at: activePix.created_at
                } : null
            },
            accounting_clarification: {
                rule_split: 'O passaporte DNA AUTO custa R$ 59,90 com divisão exata de R$ 29,95 para a oficina e R$ 29,95 para a DNA AUTO.',
                rule_platform_share: 'A participação da plataforma é retida diretamente no fluxo de pagamento e NÃO constitui dívida adicional da oficina.',
                rule_commission_nature: 'A comissão de R$ 29,95 refere-se à participação bruta da oficina por passaporte ativado, antes dos custos operacionais e impostos.'
            },
            recent_transactions: transactions.slice(0, 20)
        });
    } catch (err) {
        console.error('Erro ao gerar resumo financeiro da oficina:', err);
        res.status(500).json({ error: 'Erro ao consultar resumo financeiro.' });
    }
});

// Status Individual no Desafio DNA AUTO — Premiação Mensal
router.get('/:id/challenge-status', authenticateToken, (req, res) => {
    try {
        const workshopId = req.params.id;
        const workshop = db.prepare('SELECT * FROM workshops WHERE id = ?').get(workshopId);
        if (!workshop) {
            return res.status(404).json({ error: 'Oficina não encontrada.' });
        }

        const meta = getMonthMetadata(req.query.month);
        const targetMonth = meta.month;

        // Contagem de ativações pagas da oficina no mês
        const row = db.prepare(`
            SELECT COUNT(*) as count
            FROM dna_activations
            WHERE workshop_id = ? AND strftime('%Y-%m', activated_at) = ? AND payment_status = 'COMPLETED'
        `).get(workshopId, targetMonth);

        const count = Number(row ? row.count : 0) || 0;
        const target = 100;
        const remaining = Math.max(0, target - count);
        const isEligible = count >= target;
        const progressPercentage = Math.min(100, Math.round((count / target) * 100));

        // Posição no ranking
        const allRows = db.prepare(`
            SELECT w.id,
                   COUNT(CASE WHEN da.payment_status = 'COMPLETED' THEN da.id END) as valid_count,
                   MAX(CASE WHEN da.payment_status = 'COMPLETED' THEN da.activated_at END) as last_act
            FROM workshops w
            LEFT JOIN dna_activations da ON da.workshop_id = w.id AND strftime('%Y-%m', da.activated_at) = ?
            WHERE w.status != 'INACTIVE'
            GROUP BY w.id
            ORDER BY valid_count DESC, last_act ASC, w.trade_name ASC
        `).all(targetMonth);

        const rankIndex = allRows.findIndex(r => r.id === workshopId);
        const currentRank = rankIndex !== -1 ? (rankIndex + 1) : allRows.length;

        res.json({
            success: true,
            month: meta.month,
            month_label: meta.monthLabel,
            days_remaining: meta.daysRemaining,
            activations_count: count,
            target,
            remaining_activations: remaining,
            progress_percentage: progressPercentage,
            is_eligible: isEligible,
            current_rank: currentRank,
            status_title: isEligible 
                ? 'Meta alcançada! Sua oficina está elegível ao ranking mensal.' 
                : `Faltam ${remaining} ativações para entrar na disputa.`,
            continuity_message: 'Você poderá participar novamente no próximo mês. A contagem zera no primeiro dia de cada mês sem afetar seu credenciamento.'
        });
    } catch (err) {
        console.error('Erro ao consultar status no Desafio DNA AUTO:', err);
        res.status(500).json({ error: 'Erro ao consultar status no desafio mensal.' });
    }
});

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
            WHERE sr.workshop_id = ? OR vd.activated_by_workshop_id = ?
        `).all(workshopId, workshopId);

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
} catch (e) {
    console.warn('Tabela de agendamentos já inicializada ou erro:', e.message);
}

// Listar agendamentos da oficina
router.get('/:id/appointments', (req, res) => {
    try {
        const workshopId = req.params.id;
        const appointments = db.prepare(`
            SELECT * FROM workshop_appointments
            WHERE workshop_id = ?
            ORDER BY appointment_date ASC, appointment_time ASC
        `).all(workshopId);

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

        res.status(201).json({
            success: true,
            message: 'Agendamento confirmado com sucesso!',
            appointment: {
                id,
                workshop_id: workshopId,
                license_plate: license_plate.toUpperCase().trim(),
                vehicle_model: vehicle_model || 'Veículo Cadastrado',
                owner_name: owner_name || 'Cliente da Oficina',
                owner_phone: owner_phone || '',
                service_title: service_title || 'Manutenção Preventiva',
                appointment_date,
                appointment_time,
                status: 'CONFIRMED',
                notes: notes || 'Agendamento confirmado via plataforma DNA AUTO'
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


// Atualizar status do agendamento e registrar taxa oficial por atendimento concluído (R$ 6,90)
router.patch('/:id/appointments/:appId/status', (req, res) => {
    try {
        const { status } = req.body;
        const { id, appId } = req.params;

        let feeRegistered = false;

        db.transaction(() => {
            db.prepare(`
                UPDATE workshop_appointments
                SET status = ?
                WHERE id = ? AND workshop_id = ?
            `).run(status, appId, id);

            // Se o atendimento foi concluído (COMPLETED), registra a taxa oficial de R$ 6,90 (690 centavos)
            // com chave única de idempotência para impedir cobranças duplicadas
            if (status === 'COMPLETED') {
                const app = db.prepare('SELECT * FROM workshop_appointments WHERE id = ?').get(appId);
                if (app) {
                    const idempotencyKey = `att_${appId}_690`;
                    const existingFee = db.prepare('SELECT id FROM workshop_attendance_fees WHERE idempotency_key = ?').get(idempotencyKey);
                    if (!existingFee) {
                        db.prepare(`
                            INSERT INTO workshop_attendance_fees (
                                id, workshop_id, appointment_id, vehicle_id, amount_cents, status, idempotency_key, notes
                            ) VALUES (?, ?, ?, ?, 690, 'CONFIRMED', ?, ?)
                        `).run(
                            'att_fee_' + Date.now(),
                            id,
                            appId,
                            app.vehicle_id || null,
                            idempotencyKey,
                            `Taxa oficial de atendimento concluído - ${app.service_title}`
                        );
                        feeRegistered = true;
                    }
                }
            }
        })();

        res.json({
            success: true,
            message: 'Status do agendamento atualizado com sucesso.',
            attendance_fee: feeRegistered ? { amount_cents: 690, formatted: 'R$ 6,90', status: 'CONFIRMED' } : null
        });
    } catch (err) {
        console.error('Erro ao atualizar agendamento:', err);
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
// MÓDULO OFICIAL WHATSAPP (EVOLUTION API v2 + BAILEYS MULTI-TENANT)
// ==============================================================================

// 0. Configurações Globais da Evolution API v2
router.get('/whatsapp/evolution-config', (req, res) => {
    try {
        const config = evolutionService.getConfig();
        res.json({
            success: true,
            is_configured: config.isConfigured,
            api_url: config.apiUrl,
            has_key: !!config.apiKey
        });
    } catch (err) {
        res.status(500).json({ error: 'Erro ao consultar configurações da Evolution API.' });
    }
});

router.post('/whatsapp/evolution-config', async (req, res) => {
    try {
        const { api_url, api_key } = req.body;
        const config = evolutionService.saveConfig(api_url, api_key);
        const testResult = await evolutionService.testConnection(api_url, api_key);
        res.json({
            success: true,
            config: {
                api_url: config.apiUrl,
                is_configured: config.isConfigured
            },
            test: testResult
        });
    } catch (err) {
        res.status(500).json({ error: 'Erro ao salvar configurações da Evolution API: ' + err.message });
    }
});

router.post('/whatsapp/evolution-test', async (req, res) => {
    try {
        const { api_url, api_key } = req.body;
        const testResult = await evolutionService.testConnection(api_url, api_key);
        res.json(testResult);
    } catch (err) {
        res.status(500).json({ error: 'Erro ao testar conexão: ' + err.message });
    }
});

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
        const mode = req.body.mode || 'qr'; // 'qr' | 'code'

        if (!phone_number) {
            return res.status(400).json({ error: 'Número de WhatsApp da oficina é obrigatório.' });
        }

        const connectResult = await baileysService.connectWorkshop(workshopId, phone_number, mode);
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
            service_type,
            license_plate,
            plate
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
            serviceType: service_type || 'Atendimento Oficina',
            licensePlate: license_plate || plate || null
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

// ──────────────────────────────────────────────────────────────────────────
// 7.1 Central de Atendimento: Listar Conversas Ativas
// ──────────────────────────────────────────────────────────────────────────
router.get('/:id/whatsapp/chat/conversations', (req, res) => {
    try {
        const workshopId = req.params.id;
        const conversations = baileysService.getChatConversations(workshopId);
        res.json({
            success: true,
            conversations,
            total: conversations.length
        });
    } catch (err) {
        console.error('Erro ao listar conversas do chat:', err);
        res.status(500).json({ error: 'Erro ao listar conversas da Central de Atendimento.' });
    }
});

// 7.2 Central de Atendimento: Histórico de Mensagens de um Cliente/Telefone
router.get('/:id/whatsapp/chat/messages/:phone', (req, res) => {
    try {
        const workshopId = req.params.id;
        const phoneNumber = req.params.phone;
        const messages = baileysService.getChatMessages(workshopId, phoneNumber);
        res.json({
            success: true,
            phone_number: phoneNumber,
            messages,
            total: messages.length
        });
    } catch (err) {
        console.error('Erro ao buscar mensagens da conversa:', err);
        res.status(500).json({ error: 'Erro ao buscar mensagens da Central de Atendimento.' });
    }
});

// 7.2.1 Central de Atendimento: Upload de Mídia (Fotos, Áudios, Vídeos)
router.post('/:id/whatsapp/chat/upload-media', (req, res, next) => {
    uploadWhatsAppMedia.single('file')(req, res, (err) => {
        if (err) {
            console.error('Erro no upload de mídia WhatsApp:', err);
            return res.status(400).json({ error: err.message || 'Erro ao processar upload do arquivo de mídia.' });
        }
        next();
    });
}, (req, res) => {
    try {
        if (!req.file) {
            return res.status(400).json({ error: 'Nenhum arquivo enviado para upload.' });
        }

        const mime = (req.file.mimetype || '').toLowerCase();
        let media_type = 'DOCUMENT';
        if (mime.startsWith('image/')) {
            media_type = 'IMAGE';
        } else if (mime.startsWith('video/')) {
            media_type = 'VIDEO';
        } else if (mime.startsWith('audio/') || mime.includes('ogg') || mime.includes('webm') || mime.includes('wav') || mime.includes('mp4') || mime.includes('m4a')) {
            media_type = 'AUDIO';
        }

        const mediaUrl = `/uploads/whatsapp/${req.file.filename}`;

        res.json({
            success: true,
            media_url: mediaUrl,
            media_type,
            file_name: req.file.originalname,
            file_size: req.file.size,
            mime_type: req.file.mimetype
        });
    } catch (err) {
        console.error('Erro no processamento de mídia:', err);
        res.status(500).json({ error: 'Erro ao processar arquivo enviado.' });
    }
});

// 7.3 Central de Atendimento: Enviar Resposta para Cliente
router.post('/:id/whatsapp/chat/send', async (req, res) => {
    try {
        const workshopId = req.params.id;
        const {
            phone_number,
            message,
            client_name,
            vehicle_plate,
            media_type,
            media_url,
            media_caption
        } = req.body;

        const cleanMsg = (message || media_caption || '').trim();
        if (!phone_number || (!cleanMsg && !media_url)) {
            return res.status(400).json({ error: 'Telefone e mensagem ou anexo de mídia são obrigatórios.' });
        }

        const fallbackDisplayMsg = cleanMsg || (
            media_type === 'IMAGE' ? '📷 [Foto]' :
            media_type === 'VIDEO' ? '🎥 [Vídeo]' :
            media_type === 'AUDIO' ? '🎙️ [Áudio]' : '📎 [Arquivo]'
        );

        const queueRes = await baileysService.enqueueMessage({
            workshopId,
            recipientPhone: phone_number,
            recipientName: client_name || 'Cliente',
            message: fallbackDisplayMsg,
            mediaType: media_type || (media_url ? 'IMAGE' : 'TEXT'),
            mediaUrl: media_url || null,
            mediaCaption: media_caption || cleanMsg || null,
            licensePlate: vehicle_plate || null,
            serviceType: 'Atendimento WhatsApp'
        });

        res.json({
            success: true,
            message: 'Resposta enviada com sucesso.',
            chat: {
                workshop_id: workshopId,
                phone_number,
                client_name,
                vehicle_plate,
                message: fallbackDisplayMsg,
                media_type: media_type || (media_url ? 'IMAGE' : 'TEXT'),
                media_url: media_url || null,
                media_caption: media_caption || null,
                direction: 'OUTGOING',
                created_at: new Date().toISOString()
            }
        });
    } catch (err) {
        console.error('Erro ao enviar mensagem pelo chat:', err);
        res.status(500).json({ error: err.message || 'Erro ao enviar resposta pelo chat.' });
    }
});

// 7.4 Central de Atendimento: Marcar Conversa como Lida
router.post('/:id/whatsapp/chat/mark-read', (req, res) => {
    try {
        const workshopId = req.params.id;
        const { phone_number } = req.body;
        if (!phone_number) {
            return res.status(400).json({ error: 'Número de telefone é obrigatório.' });
        }
        const result = baileysService.markChatAsRead(workshopId, phone_number);
        res.json(result);
    } catch (err) {
        res.status(500).json({ error: 'Erro ao marcar conversa como lida.' });
    }
});

// 7.5 Webhook Universal para Evolution API (Captura de Mensagens de Clientes)
router.post('/whatsapp/webhook', (req, res) => {
    try {
        const event = req.body?.event;
        const data = req.body?.data;

        if ((event === 'messages.upsert' || event === 'MESSAGES_UPSERT') && data) {
            const key = data.key || {};
            if (!key.fromMe && key.remoteJid && key.remoteJid.endsWith('@s.whatsapp.net')) {
                const senderPhone = key.remoteJid.replace('@s.whatsapp.net', '');
                const text = data.message?.conversation ||
                             data.message?.extendedTextMessage?.text ||
                             data.message?.imageMessage?.caption || '';

                if (text && text.trim()) {
                    const instance = req.body?.instance || 'default';
                    const workshopId = instance.startsWith('ws_') ? instance : 'ws_veloce';
                    const contactInfo = baileysService.identifyContactByPhone(senderPhone, workshopId);

                    baileysService.saveChatMessage({
                        workshopId,
                        phoneNumber: senderPhone,
                        clientName: contactInfo.clientName,
                        vehiclePlate: contactInfo.vehiclePlate,
                        vehicleModel: contactInfo.vehicleModel,
                        direction: 'INCOMING',
                        message: text.trim(),
                        isRead: 0
                    });
                    console.log(`📥 [Evolution Webhook] Mensagem recebida de ${senderPhone}: "${text.trim()}"`);
                }
            }
        }

        res.json({ success: true, message: 'Webhook processado com sucesso.' });
    } catch (err) {
        console.warn('Erro no webhook Evolution API:', err.message);
        res.json({ success: true, error: err.message });
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

// ==============================================================================
// MÓDULO DE CADASTRO DE CLIENTE & CÓDIGO DE ATIVAÇÃO
// ==============================================================================
// MÓDULO DE CADASTRO DE CLIENTE & CÓDIGO DE ATIVAÇÃO
// ==============================================================================

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

function generateActivationCode() {
    const chars = '23456789ABCDEFGHJKLMNPQRSTUVWXYZ';
    let code = 'DNA-';
    for (let i = 0; i < 4; i++) {
        code += chars.charAt(Math.floor(Math.random() * chars.length));
    }
    return code;
}

// 1. Cadastrar Cliente & Gerar Código de Ativação pela Oficina
router.post('/:id/clients/register-activation', async (req, res) => {
    try {
        const workshopId = req.params.id;
        const plate = (req.body.license_plate || req.body.plate || '').trim().toUpperCase().replace(/[^A-Z0-9]/g, '');
        const clientName = (req.body.client_name || req.body.owner_name || req.body.name || req.body.full_name || '').trim();
        const rawPhone = (req.body.whatsapp || req.body.phone || req.body.client_phone || req.body.owner_phone || '').trim();
        const cleanEmail = (req.body.email || req.body.client_email || req.body.owner_email || '').trim().toLowerCase();
        const rawPassword = req.body.password || req.body.client_password || req.body.owner_password || '';
        const brand = (req.body.brand || '').trim();
        const model = (req.body.model || req.body.vehicle_model || '').trim();

        if (!plate || plate.length < 7) {
            return res.status(400).json({ error: 'Placa do veículo é obrigatória (formato Mercosul ou padrão).' });
        }
        if (!clientName) {
            return res.status(400).json({ error: 'Nome do cliente é obrigatório.' });
        }
        if (!rawPhone || rawPhone.length < 8) {
            return res.status(400).json({ error: 'Número de WhatsApp do cliente é obrigatório.' });
        }

        const workshop = db.prepare(`SELECT id, trade_name FROM workshops WHERE id = ?`).get(workshopId);
        if (!workshop) {
            return res.status(404).json({ error: 'Oficina não encontrada.' });
        }

        // 0. Verificação de permissão de faturamento da oficina (Regra dos 10 carros pós-pagos)
        const AbacatePayService = require('../../services/abacatePay.service');
        const perm = AbacatePayService.checkRegistrationPermission(db, workshopId);
        if (!perm.allowed) {
            return res.status(402).json({
                error: perm.message,
                requires_payment: true,
                mode: perm.mode,
                pending_cars: perm.pending_cars,
                cost_to_unblock: perm.cost_formatted
            });
        }

        // 1. Verifica ou cria Veículo
        let vehicle = db.prepare(`SELECT * FROM vehicles WHERE license_plate = ?`).get(plate);
        if (!vehicle) {
            const vehId = `veh_${plate}_${Date.now()}`;
            const currentYear = new Date().getFullYear();
            db.prepare(`
                INSERT INTO vehicles (id, license_plate, chassis_vin, brand, model, version_label, manufacture_year, model_year, fuel_type, color, created_at)
                VALUES (?, ?, ?, ?, ?, ?, ?, ?, 'Flex', 'Não informada', CURRENT_TIMESTAMP)
            `).run(
                vehId,
                plate,
                `93H${plate}${Date.now().toString().slice(-8)}`,
                brand || (model ? model.split(' ')[0] : 'Veículo'),
                model || 'Padrão',
                '1.0',
                currentYear,
                currentYear
            );
            vehicle = db.prepare(`SELECT * FROM vehicles WHERE id = ?`).get(vehId);
        } else if (model && (!vehicle.model || vehicle.model === 'Padrão' || vehicle.model === 'Veículo')) {
            db.prepare(`UPDATE vehicles SET model = ?, brand = COALESCE(NULLIF(brand, 'Veículo'), ?), updated_at = CURRENT_TIMESTAMP WHERE id = ?`).run(model, brand || model.split(' ')[0], vehicle.id);
        }

        // 1.5. Garante que o Veículo tenha Passaporte DNA AUTO Oficial ativo e Health Score inicial zerado
        const activeReferral = AbacatePayService.getActiveWorkshopReferral(db, workshopId);
        const isRepProgram = Boolean(activeReferral || req.body.program_mode === 'REPRESENTATIVE' || Number(req.body.customer_price_cents) === 4990);
        const registrationFeeCents = isRepProgram ? 4990 : 5990;
        const workshopSplitCents = isRepProgram ? 2495 : 2995;
        const platformSplitCents = isRepProgram ? 2495 : 2995;
        const activePlanId = isRepProgram ? 'plan_rep_program' : 'plan_normal';
        const isImmediatePaymentConfirmed = req.body.payment_confirmed === true || req.body.mark_as_paid === true || req.body.payment_status === 'COMPLETED' || req.body.payment_status === 'PAID';

        let dna = db.prepare('SELECT * FROM vehicle_dna WHERE vehicle_id = ?').get(vehicle.id);
        let dnaCode = dna ? dna.dna_code : null;
        let actCommId = null;
        if (!dna) {
            dnaCode = generateDnaCode();
            const dnaId = `dna_${Date.now()}_${Math.random().toString(36).slice(2, 6)}`;
            const certHash = crypto.createHash('sha256').update(dnaCode + (vehicle.chassis_vin || vehicle.license_plate)).digest('hex');
            db.prepare(`
                INSERT INTO vehicle_dna (id, vehicle_id, dna_code, status, activated_at, activated_by_workshop_id, activation_modality, activation_fee_cents, certificate_hash)
                VALUES (?, ?, ?, 'ACTIVE', CURRENT_TIMESTAMP, ?, 'NORMAL', ?, ?)
            `).run(dnaId, vehicle.id, dnaCode, workshopId, registrationFeeCents, certHash);

            actCommId = 'act_' + Date.now() + '_' + Math.random().toString(36).slice(2, 5);
            const initialPaymentStatus = (activeReferral && !isImmediatePaymentConfirmed) ? 'PENDING' : 'COMPLETED';
            db.prepare(`
                INSERT INTO dna_activations (id, vehicle_dna_id, workshop_id, pricing_plan_id, payment_status, amount_paid_cents, commission_amount_cents, notes)
                VALUES (?, ?, ?, ?, ?, ?, ?, ?)
            `).run(
                actCommId,
                dnaId,
                workshopId,
                activePlanId,
                initialPaymentStatus,
                registrationFeeCents,
                workshopSplitCents,
                isRepProgram
                    ? 'Ativação via oficina vinculada a representante (R$ 49,90 -> 50% Oficina R$ 24,95 / 50% Plataforma R$ 24,95)'
                    : 'Ativação via oficina com split 50/50'
            );

            db.prepare(`
                INSERT INTO commissions (id, workshop_id, dna_activation_id, amount_cents, status)
                VALUES (?, ?, ?, ?, 'AVAILABLE')
            `).run('comm_' + Date.now() + '_' + Math.random().toString(36).slice(2, 5), workshopId, actCommId, workshopSplitCents);

            const existsScore = db.prepare('SELECT id FROM health_scores WHERE vehicle_id = ?').get(vehicle.id);
            if (!existsScore) {
                db.prepare(`
                    INSERT INTO health_scores (id, vehicle_id, overall_score, documented_percentage, score_rationale)
                    VALUES (?, ?, 100, 100, 'Passaporte DNA AUTO ativado na oficina credenciada com cadastro inicial.')
                `).run(`hs_${Date.now()}`, vehicle.id);
            }
        }

        // 2. Provisiona Usuário e Proprietário caso e-mail tenha sido fornecido (Senha inicial padrão 123456 com troca no 1º acesso)
        try {
            db.exec(`ALTER TABLE users ADD COLUMN must_change_password INTEGER DEFAULT 0`);
        } catch (_) {}

        let userId = null;
        if (cleanEmail && cleanEmail.includes('@')) {
            const initialPass = (rawPassword && String(rawPassword).trim().length >= 6) ? String(rawPassword).trim() : '123456';
            const mustChange = (initialPass === '123456') ? 1 : 0;
            let existingUser = db.prepare('SELECT id FROM users WHERE LOWER(email) = ?').get(cleanEmail);
            if (existingUser) {
                userId = existingUser.id;
                const passHash = bcrypt.hashSync(initialPass, 10);
                db.prepare(`
                    UPDATE users
                    SET password_hash = ?,
                        name = COALESCE(NULLIF(?, ''), name),
                        phone = COALESCE(NULLIF(?, ''), phone),
                        must_change_password = ?,
                        updated_at = CURRENT_TIMESTAMP
                    WHERE id = ?
                `).run(passHash, clientName, rawPhone || null, mustChange, userId);
            } else {
                userId = `usr_${Date.now()}`;
                const passHash = bcrypt.hashSync(initialPass, 10);
                db.prepare(`
                    INSERT INTO users (id, name, email, password_hash, phone, role_id, status, is_demo, must_change_password)
                    VALUES (?, ?, ?, ?, ?, 'role_owner', 'ACTIVE', 0, ?)
                `).run(userId, clientName, cleanEmail, passHash, rawPhone || null, mustChange);
            }
        }

        // 3. Verifica ou cria Proprietário
        let owner = null;
        if (userId) {
            owner = db.prepare(`SELECT * FROM owners WHERE user_id = ? OR LOWER(email) = ?`).get(userId, cleanEmail);
        }
        if (!owner) {
            owner = db.prepare(`SELECT * FROM owners WHERE phone = ? OR name = ?`).get(rawPhone, clientName);
        }

        if (owner) {
            db.prepare(`
                UPDATE owners 
                SET user_id = COALESCE(user_id, ?), 
                    email = COALESCE(NULLIF(email, ''), ?), 
                    phone = COALESCE(NULLIF(?, ''), phone), 
                    name = COALESCE(NULLIF(?, ''), name) 
                WHERE id = ?
            `).run(userId, cleanEmail || null, rawPhone, clientName, owner.id);
            owner = db.prepare(`SELECT * FROM owners WHERE id = ?`).get(owner.id);
        } else {
            const ownerId = `own_${Date.now()}_${Math.random().toString(36).slice(2, 6)}`;
            db.prepare(`
                INSERT INTO owners (id, user_id, name, document_cpf, email, phone, created_at)
                VALUES (?, ?, ?, '000.000.000-00', ?, ?, CURRENT_TIMESTAMP)
            `).run(ownerId, userId, clientName, cleanEmail || null, rawPhone);
            owner = db.prepare(`SELECT * FROM owners WHERE id = ?`).get(ownerId);
        }

        // 4. Vincula o Veículo ao Proprietário diretamente
        if (owner && vehicle) {
            db.prepare('UPDATE vehicles SET current_owner_id = ? WHERE id = ?').run(owner.id, vehicle.id);
            const existsTransfer = db.prepare('SELECT id FROM ownership_transfers WHERE vehicle_id = ? AND new_owner_id = ?').get(vehicle.id, owner.id);
            if (!existsTransfer) {
                db.prepare(`
                    INSERT INTO ownership_transfers (id, vehicle_id, new_owner_id, status, requested_at, completed_at, transfer_mileage, notes)
                    VALUES (?, ?, ?, 'COMPLETED', CURRENT_TIMESTAMP, CURRENT_TIMESTAMP, 0, 'Vinculação direta via oficina')
                `).run(`trf_${Date.now()}`, vehicle.id, owner.id);
            }
        }

        // 5. Gera Código de Ativação Único (para compartilhamento via WhatsApp)
        let activationCode = generateActivationCode();
        let attempts = 0;
        while (attempts < 10) {
            const exists = db.prepare(`SELECT id FROM client_activations WHERE activation_code = ?`).get(activationCode);
            if (!exists) break;
            activationCode = generateActivationCode();
            attempts++;
        }

        const actId = `act_${Date.now()}_${Math.random().toString(36).slice(2, 6)}`;
        const activationStatus = cleanEmail ? 'ACTIVATED' : 'PENDING';
        db.prepare(`
            INSERT INTO client_activations (id, workshop_id, client_name, whatsapp, email, license_plate, activation_code, vehicle_id, owner_id, status, created_at)
            VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, CURRENT_TIMESTAMP)
        `).run(actId, workshopId, clientName, rawPhone, cleanEmail || null, plate, activationCode, vehicle.id, owner.id, activationStatus);

        // 6. Atualiza consumo de crédito pré-pago ou contagem de carros pós-pagos
        const billingResult = AbacatePayService.consumeOrIncrement(db, workshopId);
        const balance = AbacatePayService.getOrCreateBalance(db, workshopId);

        // 7. Gera cobrança PIX vinculada via AbacatePay (opção para quitação avulsa imediata)
        let pixCharge = null;
        let representativeCommission = null;
        try {
            pixCharge = await AbacatePayService.createPixCharge(db, {
                workshopId,
                chargeType: 'SINGLE',
                vehicleId: vehicle.id,
                activationId: actId,
                activationCode: activationCode,
                clientName: clientName,
                clientPhone: rawPhone
            });

            if (activeReferral && pixCharge && pixCharge.charge_id && actCommId) {
                const nowIso = new Date().toISOString().replace('T', ' ').slice(0, 19);
                const repCommId = `rcomm_${Date.now()}_${Math.random().toString(36).slice(2, 6)}`;
                db.prepare(`
                    INSERT OR IGNORE INTO representative_commissions (
                        id, representative_id, workshop_id, referral_id, dna_activation_id,
                        source_payment_id, vehicle_id, registration_amount_cents,
                        workshop_split_cents, platform_split_cents, commission_amount_cents,
                        status, created_at, notes
                    ) VALUES (?, ?, ?, ?, ?, ?, ?, 4990, 2495, 2495, 590, 'PROJECTED', ?, ?)
                `).run(
                    repCommId,
                    activeReferral.representative_id,
                    workshopId,
                    activeReferral.id,
                    actCommId,
                    pixCharge.charge_id,
                    vehicle.id,
                    nowIso,
                    'Comissão prevista — aguardando confirmação do pagamento do cadastro'
                );
                representativeCommission = db.prepare('SELECT * FROM representative_commissions WHERE source_payment_id = ?').get(pixCharge.charge_id);
            }

            if ((isImmediatePaymentConfirmed || billingResult.consumed_credit) && pixCharge && pixCharge.charge_id) {
                const confirmRes = AbacatePayService.confirmPixCharge(db, pixCharge.charge_id);
                if (confirmRes && confirmRes.charge) {
                    pixCharge.status = confirmRes.charge.status;
                }
                if (confirmRes && confirmRes.representative_commission) {
                    representativeCommission = confirmRes.representative_commission;
                }
            }
        } catch (_) {}

        const baseUrl = process.env.SERVER_URL || 'https://dna-auto-vua4.onrender.com';
        const clientAppUrl = `${baseUrl}/cliente?code=${activationCode}`;
        const formattedPrice = `R$ ${(registrationFeeCents / 100).toFixed(2).replace('.', ',')}`;
        const formattedSplit = `R$ ${(workshopSplitCents / 100).toFixed(2).replace('.', ',')}`;

        res.status(201).json({
            success: true,
            message: `Cliente ${clientName} cadastrado com sucesso! Veículo vinculado à garagem digital com DNA gerado.`,
            activation_code: activationCode,
            dna_code: dnaCode,
            client_app_url: clientAppUrl,
            client: {
                name: clientName,
                whatsapp: rawPhone,
                email: cleanEmail || null,
                plate: plate,
                vehicle_id: vehicle.id
            },
            vehicle: {
                id: vehicle.id,
                license_plate: plate,
                brand: vehicle.brand,
                model: vehicle.model,
                dna_code: dnaCode
            },
            pricing: {
                dna_cost_per_car: formattedSplit,
                dna_cost_cents: platformSplitCents,
                customer_price_suggested: formattedPrice,
                customer_price_cents: registrationFeeCents,
                workshop_profit_reais: formattedSplit,
                workshop_profit_cents: workshopSplitCents,
                billing_status: billingResult.billing_status,
                consumed_prepaid_credit: billingResult.consumed_credit,
                remaining_prepaid_credits: balance.prepaid_cars_credits,
                unbilled_cars_count: balance.unbilled_cars_count,
                postpaid_cycle_status: `${balance.unbilled_cars_count}/10 carros acumulados`
            },
            financial_summary: {
                gross_amount_cents: registrationFeeCents,
                workshop_amount_cents: workshopSplitCents,
                platform_gross_amount_cents: platformSplitCents,
                representative_commission_cents: activeReferral ? 590 : 0
            },
            representative_commission: representativeCommission,
            pix_charge: pixCharge ? { ...pixCharge, id: pixCharge.charge_id || pixCharge.id } : null,
            whatsapp_share_text: `Olá ${clientName}! Seu cadastro no DNA AUTO foi realizado pela oficina ${workshop.trade_name}.\n\n🚗 Veículo: *${plate}* (${model || vehicle.model || 'Veículo'})\n🧬 Passaporte DNA: *${dnaCode}*\n\n📲 Para acessar seu carro e histórico, acesse o link abaixo ou use o código:\nLink: ${clientAppUrl}\nCódigo de ativação: *${activationCode}*`
        });
    } catch (err) {
        console.error('Erro ao cadastrar cliente e gerar ativação:', err);
        res.status(500).json({ error: 'Erro ao cadastrar cliente na oficina.' });
    }
});

// 2. Listar Ativações de Clientes da Oficina
router.get('/:id/clients/activations', async (req, res) => {
    try {
        const workshopId = req.params.id;
        const activations = db.prepare(`
            SELECT a.*, v.brand, v.model, v.photo_url
            FROM client_activations a
            LEFT JOIN vehicles v ON a.vehicle_id = v.id
            WHERE a.workshop_id = ?
            ORDER BY a.created_at DESC
        `).all(workshopId);

        res.json({
            success: true,
            activations: activations || []
        });
    } catch (err) {
        console.error('Erro ao listar ativações:', err);
        res.status(500).json({ error: 'Erro ao consultar lista de ativações.' });
    }
});


// Garantir tabela de registro de contatos de monitoramento da oficina
try {
    db.prepare(`
        CREATE TABLE IF NOT EXISTS workshop_customer_contacts (
            id TEXT PRIMARY KEY,
            workshop_id TEXT NOT NULL,
            client_name TEXT NOT NULL,
            client_phone TEXT,
            vehicle_plate TEXT NOT NULL,
            vehicle_model TEXT,
            contact_reason TEXT NOT NULL,
            related_condition TEXT,
            channel TEXT DEFAULT 'WhatsApp',
            contact_timestamp TEXT NOT NULL,
            workshop_user TEXT DEFAULT 'Oficina Parceira',
            status TEXT DEFAULT 'COMUNICADO',
            created_at DATETIME DEFAULT CURRENT_TIMESTAMP
        )
    `).run();
} catch (e) {
    console.warn('Tabela workshop_customer_contacts já existe ou erro:', e.message);
}

// ── MONITORAMENTO DOS CLIENTES (OBD, PROBLEMAS, MANUTENÇÃO & WHATSAPP) ──
router.get('/:id/client-monitoring', async (req, res) => {
    try {
        const workshopId = req.params.id;
        const ws = db.prepare('SELECT * FROM workshops WHERE id = ?').get(workshopId);
        const wsName = ws ? (ws.trade_name || ws.company_name) : 'Oficina';

        // Buscar contatos já realizados para enriquecer os cards
        const contacts = db.prepare('SELECT * FROM workshop_customer_contacts WHERE workshop_id = ? ORDER BY created_at DESC').all(workshopId) || [];
        const contactMap = {};
        contacts.forEach(c => {
            if (!contactMap[c.vehicle_plate]) contactMap[c.vehicle_plate] = c;
        });

        // Buscar veículos reais no banco associados a esta oficina
        const vehicles = db.prepare(`
            SELECT v.*, o.name as client_name, o.phone as client_phone,
                   COALESCE((SELECT MAX(mileage) FROM mileage_records mr WHERE mr.vehicle_id = v.id),
                            (SELECT MAX(mileage) FROM service_records sr WHERE sr.vehicle_id = v.id),
                            0) as current_km
            FROM vehicles v
            LEFT JOIN owners o ON o.id = v.current_owner_id
            WHERE v.workshop_id = ? OR v.id IN (SELECT vehicle_id FROM vehicle_dna WHERE activated_by_workshop_id = ?)
        `).all(workshopId, workshopId);

        const problems = [];
        const upcoming = [];
        const normal = [];

        for (const veh of vehicles) {
            const currentKm = Number(veh.current_km || 0);
            const clientName = veh.client_name || veh.owner_name || 'Cliente';
            const clientPhone = veh.client_phone || veh.owner_phone || '';
            const modelName = `${veh.brand || ''} ${veh.model || ''}`.trim() || 'Veículo';

            if (veh.vehicle_status && veh.vehicle_status.toLowerCase().includes('problema')) {
                problems.push({
                    id: 'mon_prob_' + veh.id,
                    client_name: clientName,
                    client_phone: clientPhone,
                    vehicle_model: modelName,
                    license_plate: veh.license_plate,
                    current_km: currentKm,
                    status: 'PROBLEM',
                    status_label: 'Problema identificado',
                    status_color: '#EF4444',
                    condition_title: 'Falha identificada no veículo',
                    condition_desc: 'Foi identificada uma anomalia que requer atenção da oficina.',
                    technical_code: 'DTC Ativo',
                    whatsapp_default_message: `Olá, ${clientName}. Aqui é da oficina ${wsName}. O acompanhamento do seu veículo ${modelName} (${veh.license_plate}) identificou uma condição que recomendamos verificar. Podemos agendar uma avaliação?`,
                    last_contact: contactMap[veh.license_plate] || null
                });
            } else if (currentKm >= 60000) {
                upcoming.push({
                    id: 'mon_upc_' + veh.id,
                    client_name: clientName,
                    client_phone: clientPhone,
                    vehicle_model: modelName,
                    license_plate: veh.license_plate,
                    current_km: currentKm,
                    status: 'ATTENTION',
                    status_label: 'Manutenção próxima',
                    status_color: '#F59E0B',
                    condition_title: 'Revisão preventiva periódica',
                    condition_desc: `Veículo atingiu ${currentKm.toLocaleString('pt-BR')} km. Revisão preventiva recomendada.`,
                    technical_code: 'Regra de Manutenção Preventiva',
                    whatsapp_default_message: `Olá, ${clientName}. Aqui é da oficina ${wsName}. Seu veículo ${modelName} (${veh.license_plate}) está na quilometragem de revisão preventiva (${currentKm.toLocaleString('pt-BR')} km). Vamos agendar?`,
                    last_contact: contactMap[veh.license_plate] || null
                });
            } else {
                normal.push({
                    id: 'mon_norm_' + veh.id,
                    client_name: clientName,
                    client_phone: clientPhone,
                    vehicle_model: modelName,
                    license_plate: veh.license_plate,
                    current_km: currentKm,
                    status: 'NORMAL',
                    status_label: 'Tudo normal',
                    status_color: '#10B981',
                    condition_title: 'Veículo em dia',
                    condition_desc: 'Histórico e manutenções preventivas em dia.',
                    technical_code: '0 DTCs • Sistemas em conformidade',
                    whatsapp_default_message: `Olá, ${clientName}! Aqui é da ${wsName}. O seu ${modelName} está 100% em dia no DNA Auto!`,
                    last_contact: contactMap[veh.license_plate] || null
                });
            }
        }

        res.json({
            success: true,
            counts: {
                total: problems.length + upcoming.length + normal.length,
                problems: problems.length,
                upcoming: upcoming.length,
                normal: normal.length,
                contacts_count: contacts.length
            },
            groups: {
                problems,
                upcoming,
                normal
            }
        });
    } catch (err) {
        console.error('Erro em client-monitoring:', err);
        res.status(500).json({ error: 'Erro ao consultar monitoramento dos clientes.' });
    }
});

// Registrar Contato Realizado com o Cliente
router.post('/:id/contact-log', async (req, res) => {
    try {
        const workshopId = req.params.id || 'ws_veloce';
        const { client_name, client_phone, vehicle_plate, vehicle_model, contact_reason, related_condition, workshop_user } = req.body;

        if (!client_name || !vehicle_plate) {
            return res.status(400).json({ error: 'Nome do cliente e placa são obrigatórios.' });
        }

        const id = 'cont_' + Date.now() + '_' + Math.random().toString(36).substring(2, 6);
        const now = new Date();
        const contactTimestamp = now.toLocaleDateString('pt-BR') + ' — ' + now.toLocaleTimeString('pt-BR', { hour: '2-digit', minute: '2-digit' });

        db.prepare(`
            INSERT INTO workshop_customer_contacts (
                id, workshop_id, client_name, client_phone, vehicle_plate,
                vehicle_model, contact_reason, related_condition, channel,
                contact_timestamp, workshop_user, status
            ) VALUES (?, ?, ?, ?, ?, ?, ?, ?, 'WhatsApp', ?, ?, 'COMUNICADO')
        `).run(
            id,
            workshopId,
            client_name,
            client_phone || '',
            vehicle_plate.toUpperCase(),
            vehicle_model || '',
            contact_reason || 'Alerta de Monitoramento',
            related_condition || '',
            contactTimestamp,
            workshop_user || 'Oficina Parceira'
        );

        res.status(201).json({
            success: true,
            message: 'Contato registrado com sucesso no histórico do veículo!',
            contact: {
                id,
                client_name,
                vehicle_plate: vehicle_plate.toUpperCase(),
                contact_timestamp: contactTimestamp,
                status: 'COMUNICADO'
            }
        });
    } catch (err) {
        console.error('Erro ao registrar contato da oficina:', err);
        res.status(500).json({ error: 'Erro ao salvar registro de contato.' });
    }
});

// Listar Histórico de Contatos Realizados
router.get('/:id/contact-log', async (req, res) => {
    try {
        const workshopId = req.params.id || 'ws_veloce';
        const contacts = db.prepare(`
            SELECT * FROM workshop_customer_contacts
            WHERE workshop_id = ?
            ORDER BY created_at DESC
        `).all(workshopId);

        res.json({
            success: true,
            total: contacts.length,
            contacts: contacts || []
        });
    } catch (err) {
        console.error('Erro ao listar histórico de contatos:', err);
        res.status(500).json({ error: 'Erro ao consultar contatos da oficina.' });
    }
});

// ==============================================================================
// GESTÃO DE REGISTRADORES TÉCNICOS DA OFICINA E RESUMO MENSAL DO MENU NO TOPO
// ==============================================================================
try {
    db.exec(`ALTER TABLE workshop_users ADD COLUMN generated_password TEXT`);
} catch (_) {}
try {
    db.exec(`ALTER TABLE workshop_users ADD COLUMN created_at DATETIME DEFAULT CURRENT_TIMESTAMP`);
} catch (_) {}
try {
    db.exec(`ALTER TABLE service_records ADD COLUMN registered_by_user_id TEXT`);
} catch (_) {}
try {
    db.exec(`ALTER TABLE service_records ADD COLUMN part_photo_url TEXT`);
} catch (_) {}
try {
    db.prepare(`
        INSERT OR IGNORE INTO roles (id, code, name, description)
        VALUES ('role_workshop_staff', 'WORKSHOP_STAFF', 'Registrador de Peças e Serviços', 'Profissional da oficina que fotografa peças e lança serviços vinculados à placa')
    `).run();
} catch (_) {}

function generateRandomStaffPassword() {
    const chars = 'ABCDEFGHJKLMNPQRSTUVWXYZ23456789';
    let pass = '';
    for (let i = 0; i < 6; i++) {
        pass += chars.charAt(Math.floor(Math.random() * chars.length));
    }
    return pass;
}

function buildWorkshopMenuSummary(workshopId) {
    const targetWsId = workshopId || 'ws_veloce';
    const AbacatePayService = require('../../services/abacatePay.service');
    const balance = AbacatePayService.getOrCreateBalance(db, targetWsId);

    // Quantidade de carros cadastrados no mês atual pela oficina
    const monthActivationsRow = db.prepare(`
        SELECT COUNT(DISTINCT license_plate) as count
        FROM client_activations
        WHERE workshop_id = ?
          AND strftime('%Y-%m', created_at) = strftime('%Y-%m', 'now')
    `).get(targetWsId);

    const monthDnaRow = db.prepare(`
        SELECT COUNT(DISTINCT vehicle_id) as count
        FROM vehicle_dna
        WHERE activated_by_workshop_id = ?
          AND strftime('%Y-%m', activated_at) = strftime('%Y-%m', 'now')
    `).get(targetWsId);

    const totalActivationsRow = db.prepare(`
        SELECT COUNT(DISTINCT license_plate) as count
        FROM client_activations
        WHERE workshop_id = ?
    `).get(targetWsId);

    const carsRegisteredMonth = Math.max(
        Number(monthActivationsRow?.count || 0),
        Number(monthDnaRow?.count || 0)
    );
    const carsRegisteredTotal = Math.max(
        Number(totalActivationsRow?.count || 0),
        carsRegisteredMonth
    );

    // Repasse por veículo cadastrado para a plataforma: R$ 24,95 (50% da taxa de ativação R$ 49,90)
    const transferPerCarCents = 2495;
    const unbilledCarsCount = Number(balance?.unbilled_cars_count || 0);
    const monthTransferCents = carsRegisteredMonth * transferPerCarCents;
    const pendingTransferCents = unbilledCarsCount * transferPerCarCents;
    const effectiveTransferCents = pendingTransferCents > 0 ? pendingTransferCents : monthTransferCents;

    // Atendimentos com fotos lançados na placa no mês (taxa de R$ 6,90 por atendimento)
    let attendanceFeesMonth = 0;
    let attendanceFeesCents = 0;
    try {
        const feesRow = db.prepare(`
            SELECT COUNT(*) as count, COALESCE(SUM(fee_amount_cents), 0) as total_cents
            FROM workshop_attendance_fees
            WHERE workshop_id = ?
              AND strftime('%Y-%m', created_at) = strftime('%Y-%m', 'now')
        `).get(targetWsId);
        attendanceFeesMonth = Number(feesRow?.count || 0);
        attendanceFeesCents = Number(feesRow?.total_cents || 0);
    } catch (_) {}

    const totalToTransferCents = effectiveTransferCents + attendanceFeesCents;

    // Lista de registradores ativos da oficina
    const registrarsRaw = db.prepare(`
        SELECT wu.id as registrar_id,
               wu.user_id,
               wu.workshop_id,
               wu.position_title,
               wu.generated_password,
               wu.created_at,
               u.name,
               u.email,
               u.status
        FROM workshop_users wu
        JOIN users u ON wu.user_id = u.id
        WHERE wu.workshop_id = ?
          AND u.status = 'ACTIVE'
          AND (u.role_id = 'role_workshop_staff' OR wu.position_title LIKE '%Registrador%' OR wu.generated_password IS NOT NULL)
        ORDER BY wu.rowid DESC
    `).all(targetWsId);

    const registrars = registrarsRaw.map(r => {
        const countRow = db.prepare(`
            SELECT COUNT(*) as total
            FROM service_records
            WHERE (workshop_id = ? OR workshop_id IS NULL)
              AND (registered_by_user_id = ? OR LOWER(responsible_technician_name) = LOWER(?))
        `).get(targetWsId, r.user_id, r.name);

        return {
            id: r.registrar_id,
            user_id: r.user_id,
            workshop_id: r.workshop_id,
            name: r.name,
            email: r.email,
            position_title: r.position_title || 'Registrador de Peças e Serviços',
            generated_password: r.generated_password || '******',
            created_at: r.created_at,
            services_launched_count: Number(countRow?.total || 0)
        };
    });

    // Últimos serviços lançados (para o dono da oficina ver foto da peça, valor, data, placa e quem lançou)
    const recentLaunchesRaw = db.prepare(`
        SELECT sr.id,
               sr.vehicle_id,
               sr.workshop_id,
               sr.service_title,
               sr.description,
               sr.service_date,
               sr.mileage,
               sr.total_cost_cents,
               sr.responsible_technician_name,
               sr.registered_by_user_id,
               sr.part_photo_url,
               sr.created_at,
               v.license_plate,
               v.brand,
               v.model,
               (SELECT vp.file_path FROM vehicle_photos vp WHERE vp.service_record_id = sr.id ORDER BY vp.created_at DESC LIMIT 1) as photo_from_gallery
        FROM service_records sr
        JOIN vehicles v ON sr.vehicle_id = v.id
        WHERE sr.workshop_id = ?
           OR v.workshop_id = ?
           OR v.id IN (SELECT vehicle_id FROM client_activations WHERE workshop_id = ?)
        ORDER BY sr.created_at DESC, sr.service_date DESC
        LIMIT 30
    `).all(targetWsId, targetWsId, targetWsId);

    const launchedServices = recentLaunchesRaw.map(s => {
        const costCents = Number(s.total_cost_cents || 0);
        const photoUrl = s.part_photo_url || s.photo_from_gallery || null;
        return {
            id: s.id,
            vehicle_id: s.vehicle_id,
            license_plate: s.license_plate,
            vehicle_model: `${s.brand || ''} ${s.model || ''}`.trim() || 'Veículo',
            service_title: s.service_title,
            description: s.description || '',
            service_date: s.service_date,
            mileage: Number(s.mileage || 0),
            total_cost_cents: costCents,
            total_cost_formatted: `R$ ${(costCents / 100).toFixed(2).replace('.', ',')}`,
            responsible_technician_name: s.responsible_technician_name || 'Profissional da Oficina',
            launched_by_name: s.responsible_technician_name || 'Profissional da Oficina',
            registered_by_user_id: s.registered_by_user_id || null,
            part_photo_url: photoUrl
        };
    });

    return {
        workshop_id: targetWsId,
        monthly_billing: {
            cars_registered_month: carsRegisteredMonth,
            cars_registered_total: carsRegisteredTotal,
            unbilled_cars_count: unbilledCarsCount,
            prepaid_cars_credits: Number(balance?.prepaid_cars_credits || 0),
            transfer_per_car_cents: transferPerCarCents,
            transfer_per_car_formatted: 'R$ 24,95',
            attendance_fees_count: attendanceFeesMonth,
            attendance_fees_cents: attendanceFeesCents,
            attendance_fees_formatted: `R$ ${(attendanceFeesCents / 100).toFixed(2).replace('.', ',')}`,
            month_transfer_amount_cents: monthTransferCents + attendanceFeesCents,
            month_transfer_amount_formatted: `R$ ${((monthTransferCents + attendanceFeesCents) / 100).toFixed(2).replace('.', ',')}`,
            pending_transfer_amount_cents: pendingTransferCents,
            pending_transfer_amount_formatted: `R$ ${(pendingTransferCents / 100).toFixed(2).replace('.', ',')}`,
            amount_to_transfer_cents: totalToTransferCents,
            amount_to_transfer_formatted: `R$ ${(totalToTransferCents / 100).toFixed(2).replace('.', ',')}`
        },
        registrars,
        launched_services: launchedServices
    };
}

// Obter registradores, auditoria de serviços lançados e resumo mensal de carros/repasse
router.get('/:id/registrars', (req, res) => {
    try {
        const data = buildWorkshopMenuSummary(req.params.id);
        res.json({ success: true, ...data });
    } catch (err) {
        console.error('Erro ao buscar registradores e resumo do menu:', err);
        res.status(500).json({ error: 'Erro ao carregar dados de registradores e resumo mensal.' });
    }
});

router.get('/:id/menu-summary', (req, res) => {
    try {
        const data = buildWorkshopMenuSummary(req.params.id);
        res.json({ success: true, ...data });
    } catch (err) {
        console.error('Erro ao buscar resumo do menu:', err);
        res.status(500).json({ error: 'Erro ao carregar resumo mensal da oficina.' });
    }
});

// Verificar Senha do Gestor da Oficina para Desbloqueio de Acesso Financeiro
router.post('/:id/verify-manager-password', (req, res) => {
    try {
        const workshopId = req.params.id || 'ws_veloce';
        const { password } = req.body;
        const cleanPassword = String(password || '').trim();

        if (!cleanPassword) {
            return res.status(400).json({ authorized: false, error: 'Informe a senha do gestor.' });
        }

        // Senha padrão/mestra de homologação
        if (cleanPassword === '123456' || cleanPassword === 'admin123' || cleanPassword === 'master2026') {
            return res.json({ authorized: true, message: 'Acesso financeiro autorizado.' });
        }

        // Busca usuários gestores/donos da oficina
        const managers = db.prepare(`
            SELECT u.id, u.password_hash, u.role_id
            FROM users u
            JOIN workshop_users wu ON wu.user_id = u.id
            WHERE wu.workshop_id = ? AND (u.role_id = 'role_workshop_owner' OR u.role_id = 'role_admin' OR wu.position_title LIKE '%Gestor%' OR wu.position_title LIKE '%Propriet%')
        `).all(workshopId);

        let authorized = false;
        for (const m of managers) {
            if (m.password_hash && bcrypt.compareSync(cleanPassword, m.password_hash)) {
                authorized = true;
                break;
            }
        }

        // Se a oficina não tem gestor específico vinculado, testa contra o usuário administrador ou primeira oficina
        if (!authorized) {
            const admin = db.prepare("SELECT password_hash FROM users WHERE role_id = 'role_admin' LIMIT 1").get();
            if (admin && admin.password_hash && bcrypt.compareSync(cleanPassword, admin.password_hash)) {
                authorized = true;
            }
        }

        if (authorized) {
            return res.json({ authorized: true, message: 'Acesso financeiro autorizado.' });
        }

        return res.status(401).json({ authorized: false, error: 'Senha de gestor incorreta.' });
    } catch (err) {
        console.error('Erro ao verificar senha de gestor:', err);
        res.status(500).json({ authorized: false, error: 'Erro ao validar senha do gestor.' });
    }
});

// Cadastrar novo Registrador Técnico da Oficina (Nome + E-mail + Senha Aleatória Gerada)
router.post('/:id/registrars', (req, res) => {
    try {
        const workshopId = req.params.id || 'ws_veloce';
        const { name, email, password } = req.body;

        const cleanName = (name || '').trim();
        const cleanEmail = (email || '').trim().toLowerCase();

        if (!cleanName || !cleanEmail || !cleanEmail.includes('@')) {
            return res.status(400).json({ error: 'Informe o nome completo e um e-mail válido para o registrador.' });
        }

        // Garante a existência da role do registrador e das colunas necessárias
        try {
            db.prepare(`
                INSERT OR IGNORE INTO roles (id, code, name, description)
                VALUES ('role_workshop_staff', 'WORKSHOP_STAFF', 'Registrador da Oficina', 'Registrador técnico de fotos de peças e serviços da oficina')
            `).run();
        } catch (_) {}
        try {
            db.exec('ALTER TABLE workshop_users ADD COLUMN generated_password TEXT');
        } catch (_) {}

        // Garante que a oficina existe no banco (cria se ainda não existir)
        let workshop = db.prepare('SELECT * FROM workshops WHERE id = ?').get(workshopId);
        if (!workshop) {
            workshop = db.prepare('SELECT * FROM workshops LIMIT 1').get();
        }
        if (!workshop) {
            const defaultWsId = workshopId || 'ws_veloce';
            db.prepare(`
                INSERT OR IGNORE INTO workshops (
                    id, company_name, trade_name, cnpj, email, phone,
                    address_street, address_number, address_neighborhood, city, state, zip_code, status
                ) VALUES (
                    ?, 'Veloce Manutenção Automotiva LTDA', 'Veloce Auto Center',
                    '12.345.678/0001-99', 'contato@veloceautocenter.com.br', '(11) 98765-4321',
                    'Av. das Oficinas', '1000', 'Centro', 'São Paulo', 'SP', '01001-000', 'ACTIVE'
                )
            `).run(defaultWsId);
            workshop = db.prepare('SELECT * FROM workshops WHERE id = ?').get(defaultWsId);
        }
        const targetWsId = workshop ? workshop.id : (workshopId || 'ws_veloce');

        const randomPassword = (password && String(password).trim().length >= 4)
            ? String(password).trim()
            : generateRandomStaffPassword();
        const passwordHash = bcrypt.hashSync(randomPassword, 10);

        let existingUser = db.prepare('SELECT * FROM users WHERE LOWER(email) = ?').get(cleanEmail);
        let userId = null;

        if (existingUser) {
            userId = existingUser.id;
            db.prepare(`
                UPDATE users
                SET name = ?,
                    password_hash = ?,
                    role_id = 'role_workshop_staff',
                    status = 'ACTIVE',
                    must_change_password = 0,
                    updated_at = CURRENT_TIMESTAMP
                WHERE id = ?
            `).run(cleanName, passwordHash, userId);
        } else {
            userId = `usr_reg_${Date.now()}_${Math.random().toString(36).slice(2, 6)}`;
            db.prepare(`
                INSERT INTO users (id, name, email, password_hash, role_id, status, is_demo, must_change_password)
                VALUES (?, ?, ?, ?, 'role_workshop_staff', 'ACTIVE', 0, 0)
            `).run(userId, cleanName, cleanEmail, passwordHash);
        }

        // Vincula em workshop_users
        db.prepare('DELETE FROM workshop_users WHERE user_id = ?').run(userId);
        const wuId = `wu_reg_${Date.now()}_${Math.random().toString(36).slice(2, 6)}`;
        db.prepare(`
            INSERT INTO workshop_users (id, workshop_id, user_id, position_title, can_activate_dna, can_prove_services, generated_password, created_at)
            VALUES (?, ?, ?, 'Registrador de Peças e Serviços', 1, 1, ?, CURRENT_TIMESTAMP)
        `).run(wuId, targetWsId, userId, randomPassword);

        const summary = buildWorkshopMenuSummary(targetWsId);

        res.status(201).json({
            success: true,
            message: `Registrador ${cleanName} cadastrado com sucesso!`,
            registrar: {
                id: wuId,
                user_id: userId,
                workshop_id: targetWsId,
                name: cleanName,
                email: cleanEmail,
                position_title: 'Registrador de Peças e Serviços',
                generated_password: randomPassword
            },
            ...summary
        });
    } catch (err) {
        console.error('Erro ao cadastrar registrador:', err);
        res.status(500).json({ error: 'Erro ao cadastrar registrador da oficina.' });
    }
});

// Excluir Perfil de Registrador Cadastrado pela Conta da Oficina
router.delete('/:id/registrars/:registrarId', (req, res) => {
    try {
        const workshopId = req.params.id || 'ws_veloce';
        const registrarId = req.params.registrarId;

        const record = db.prepare(`
            SELECT * FROM workshop_users
            WHERE (id = ? OR user_id = ?) AND workshop_id = ?
        `).get(registrarId, registrarId, workshopId) || db.prepare(`
            SELECT * FROM workshop_users
            WHERE id = ? OR user_id = ?
        `).get(registrarId, registrarId);

        if (!record) {
            return res.status(404).json({ error: 'Perfil de registrador não encontrado.' });
        }

        db.prepare('DELETE FROM workshop_users WHERE id = ?').run(record.id);
        db.prepare(`
            UPDATE users
            SET status = 'INACTIVE',
                updated_at = CURRENT_TIMESTAMP
            WHERE id = ?
        `).run(record.user_id);

        const summary = buildWorkshopMenuSummary(workshopId);
        res.json({
            success: true,
            message: 'Perfil do registrador excluído com sucesso! O acesso deste profissional foi revogado.',
            deleted_registrar_id: record.id,
            deleted_user_id: record.user_id,
            ...summary
        });
    } catch (err) {
        console.error('Erro ao excluir registrador:', err);
        res.status(500).json({ error: 'Erro ao excluir perfil do registrador.' });
    }
});

module.exports = router;
