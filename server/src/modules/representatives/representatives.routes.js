const express = require('express');
const router = express.Router();
const bcrypt = require('bcryptjs');
const jwt = require('jsonwebtoken');
const db = require('../../database/db');
const { authenticateToken, authorizeRoles, JWT_SECRET } = require('../../middlewares/auth');

const REP_STATUS = Object.freeze({
    PENDING: 'PENDING_APPROVAL',
    ACTIVE: 'ACTIVE',
    REJECTED: 'REJECTED',
    SUSPENDED: 'SUSPENDED'
});

function formatBrl(cents) {
    const val = (Number(cents || 0) / 100).toFixed(2).replace('.', ',');
    return `R$ ${val}`;
}

// Mascara CNPJ no formato oficial exigido: XX.XXX.***/0001-XX
function maskCnpj(rawCnpj) {
    const digits = String(rawCnpj || '').replace(/\D/g, '').padStart(14, '0').slice(0, 14);
    const p1 = digits.slice(0, 2);
    const p2 = digits.slice(2, 5);
    const branch = digits.slice(8, 12) || '0001';
    const check = digits.slice(12, 14);
    return `${p1}.${p2}.***/${branch}-${check}`;
}

// Constrói a mensagem sugerida oficial do WhatsApp (Seção 10)
function buildSuggestedWhatsAppMessage(referralUrl) {
    return `Olá! Sou representante autorizado do DNA AUTO.\nQuero apresentar uma plataforma que permite cadastrar o cliente no aplicativo, receber 50% do valor do cadastro e acompanhar futuras manutenções do veículo por quilometragem.\nUse meu link oficial para conhecer e cadastrar sua oficina:\n${referralUrl}`;
}

function getBaseOrigin(req) {
    if (process.env.SERVER_URL) return process.env.SERVER_URL.replace(/\/+$/, '');
    const proto = req.headers['x-forwarded-proto'] || req.protocol || 'https';
    const host = req.headers['x-forwarded-host'] || req.get('host') || 'dna-auto-vua4.onrender.com';
    return `${proto}://${host}`;
}

function generateNextRepCode() {
    const row = db.prepare(`SELECT COUNT(*) as total FROM representatives`).get();
    let num = (row ? row.total : 0) + 124;
    let code = `REP${String(num).padStart(6, '0')}`;
    while (db.prepare(`SELECT id FROM representatives WHERE UPPER(rep_code) = UPPER(?)`).get(code)) {
        num++;
        code = `REP${String(num).padStart(6, '0')}`;
    }
    return code;
}

function buildRepresentativePayload(rep, req) {
    const origin = getBaseOrigin(req);
    const referralUrl = `${origin}/representante/indicacao/${rep.rep_code}`;
    const suggestedMsg = buildSuggestedWhatsAppMessage(referralUrl);
    const qrCodeUrl = `https://api.qrserver.com/v1/create-qr-code/?size=280x280&data=${encodeURIComponent(referralUrl)}&color=00C6FF&bgcolor=0B162C`;
    const whatsappShareUrl = `https://wa.me/?text=${encodeURIComponent(suggestedMsg)}`;

    return {
        id: rep.id,
        user_id: rep.user_id,
        rep_code: rep.rep_code,
        name: rep.name,
        full_name: rep.name,
        cpf_cnpj: rep.cpf_cnpj,
        email: rep.email,
        phone: rep.phone,
        city: rep.city,
        state: rep.state,
        city_state: `${rep.city || 'São Paulo'}/${rep.state || 'SP'}`,
        pix_key: rep.pix_key,
        experience: rep.experience,
        status: rep.status,
        max_workshops_limit: rep.max_workshops_limit || 15,
        portfolio_limit: rep.max_workshops_limit || 15,
        monthly_goal_workshops: rep.monthly_goal_workshops || 5,
        monthly_goal_activations: rep.monthly_goal_activations || 220,
        links_shared_count: rep.links_shared_count || 0,
        training_completed: Boolean(rep.training_completed),
        referral_url: referralUrl,
        referral_link: referralUrl,
        qr_code_url: qrCodeUrl,
        qr_code_payload: referralUrl,
        whatsapp_suggested_message: suggestedMsg,
        suggested_message: suggestedMsg,
        whatsapp_share_url: whatsappShareUrl,
        remuneration_rules: {
            client_registration_cents: 4990,
            client_registration_formatted: 'R$ 49,90',
            workshop_split_cents: 2495,
            workshop_split_formatted: 'R$ 24,95 (50%)',
            platform_split_cents: 2495,
            platform_split_formatted: 'R$ 24,95 (50%)',
            rep_commission_cents: 590,
            rep_commission_formatted: 'R$ 5,90',
            validity_months: 24
        },
        security_rules: {
            can_access_workshop_app: false,
            can_access_client_app: false,
            can_register_workshop_directly: false,
            can_view_client_pii: false,
            notice: 'REGRA ABSOLUTA: O representante comercial NÃO pode acessar o aplicativo da oficina nem o aplicativo do cliente. Apenas o proprietário da oficina realiza o cadastro e utiliza o aplicativo.'
        }
    };
}

// 1. Cadastro de Novo Representante Comercial
router.post('/register', (req, res) => {
    try {
        const name = String(req.body.full_name || req.body.name || req.body.nome || '').trim();
        const cpfCnpj = String(req.body.cpf_cnpj || req.body.cpfCnpj || req.body.document || '').trim();
        const email = String(req.body.email || '').trim().toLowerCase();
        const phone = String(req.body.phone || req.body.whatsapp || '').trim();
        const rawCityState = String(req.body.city_state || '').trim();
        const defaultCity = rawCityState ? rawCityState.split(/[\/\-]/)[0].trim() : 'São Paulo';
        const defaultState = rawCityState && rawCityState.includes('/') ? rawCityState.split('/')[1].trim() : 'SP';
        const city = String(req.body.city || req.body.cidade || defaultCity || 'São Paulo').trim();
        const state = String(req.body.state || req.body.uf || defaultState || 'SP').trim().toUpperCase().slice(0, 2);
        const pixKey = String(req.body.pix_key || req.body.pixKey || email).trim();
        const experience = String(req.body.experience || req.body.experiencia || 'Vendas B2B Automotivo').trim();
        const password = String(req.body.password || req.body.senha || 'rep123456').trim();

        if (!name || !email || !phone || !cpfCnpj) {
            return res.status(400).json({ error: 'Nome completo, CPF/CNPJ, e-mail e WhatsApp são obrigatórios.' });
        }

        if (password.length < 6) {
            return res.status(400).json({ error: 'A senha deve ter no mínimo 6 caracteres.' });
        }

        const existingUser = db.prepare('SELECT id, role_id FROM users WHERE LOWER(email) = ?').get(email);
        if (existingUser) {
            return res.status(400).json({ error: 'Já existe uma conta cadastrada com este e-mail.' });
        }

        const repCode = generateNextRepCode();
        const userId = `usr_rep_${Date.now()}_${Math.random().toString(36).slice(2, 6)}`;
        const repId = `rep_${Date.now()}_${Math.random().toString(36).slice(2, 6)}`;
        const passwordHash = bcrypt.hashSync(password, 10);

        db.transaction(() => {
            db.prepare(`
                INSERT OR IGNORE INTO roles (id, code, name, description)
                VALUES ('role_representative', 'REPRESENTATIVE', 'Representante Comercial', 'Indicação comercial de oficinas e acompanhamento de comissões')
            `).run();

            db.prepare(`
                INSERT INTO users (id, name, email, password_hash, phone, role_id, status, is_demo)
                VALUES (?, ?, ?, ?, ?, 'role_representative', 'ACTIVE', 0)
            `).run(userId, name, email, passwordHash, phone);

            db.prepare(`
                INSERT INTO representatives (
                    id, user_id, rep_code, name, cpf_cnpj, email, phone,
                    city, state, pix_key, experience, status,
                    max_workshops_limit, monthly_goal_workshops, monthly_goal_activations,
                    links_shared_count, training_completed
                ) VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, '${REP_STATUS.PENDING}', 15, 5, 220, 0, 0)
            `).run(repId, userId, repCode, name, cpfCnpj, email, phone, city, state, pixKey, experience);

            db.prepare(`
                INSERT INTO representative_audit_logs (
                    id, representative_id, workshop_id, action, actor_id, actor_role, justification, metadata_json, ip_address
                ) VALUES (?, ?, NULL, 'REPRESENTATIVE_REGISTERED', ?, 'REPRESENTATIVE', 'Cadastro recebido — aguardando aprovação da DNA AUTO', ?, ?)
            `).run(
                `ral_${Date.now()}_${Math.random().toString(36).slice(2, 6)}`,
                repId,
                userId,
                JSON.stringify({ rep_code: repCode, email, city, state }),
                req.ip || '127.0.0.1'
            );
        })();

        // Sem token: o acesso ao painel só é liberado após a aprovação da DNA AUTO
        res.status(201).json({
            success: true,
            approval_status: REP_STATUS.PENDING,
            message: `Cadastro recebido, ${name}! Sua solicitação está em análise pela equipe DNA AUTO. Você receberá a confirmação e poderá fazer login assim que for aprovado.`,
            representative: { id: repId, rep_code: repCode, name, email, status: REP_STATUS.PENDING }
        });
    } catch (err) {
        console.error('Erro ao cadastrar representante:', err);
        res.status(500).json({ error: 'Erro interno ao credenciar representante: ' + err.message });
    }
});

// 2. Login Exclusivo do Portal do Representante (/representante)
router.post('/login', (req, res) => {
    try {
        const identifier = String(req.body.email || req.body.identifier || req.body.rep_code || '').trim();
        const password = String(req.body.password || req.body.senha || '').trim();

        if (!identifier || !password) {
            return res.status(400).json({ error: 'Informe seu e-mail (ou código REP) e senha.' });
        }

        const rep = db.prepare(`
            SELECT r.*, u.password_hash, u.status as user_status, rl.code as role_code
            FROM representatives r
            JOIN users u ON r.user_id = u.id
            JOIN roles rl ON u.role_id = rl.id
            WHERE LOWER(r.email) = LOWER(?) OR UPPER(r.rep_code) = UPPER(?)
        `).get(identifier, identifier);

        if (!rep) {
            return res.status(401).json({ error: 'Credenciais de representante inválidas.' });
        }

        const match = bcrypt.compareSync(password, rep.password_hash);
        if (!match) {
            return res.status(401).json({ error: 'Credenciais de representante inválidas.' });
        }

        // Status só é revelado após a senha correta, evitando enumeração de contas
        if (rep.status === REP_STATUS.PENDING) {
            return res.status(403).json({
                code: 'REPRESENTATIVE_PENDING_APPROVAL',
                error: 'Seu cadastro está em análise pela equipe DNA AUTO. O painel e o treinamento serão liberados assim que sua solicitação for aprovada.'
            });
        }
        if (rep.status === REP_STATUS.REJECTED) {
            return res.status(403).json({
                code: 'REPRESENTATIVE_REJECTED',
                error: 'Sua solicitação de credenciamento não foi aprovada pela DNA AUTO. Em caso de dúvidas, fale com o suporte comercial.'
            });
        }
        if (rep.status !== REP_STATUS.ACTIVE || rep.user_status !== 'ACTIVE') {
            return res.status(403).json({ code: 'REPRESENTATIVE_INACTIVE', error: 'Cadastro de representante inativo ou bloqueado.' });
        }

        const token = jwt.sign(
            { id: rep.user_id, email: rep.email, role_code: 'REPRESENTATIVE', rep_id: rep.id, rep_code: rep.rep_code },
            JWT_SECRET,
            { expiresIn: '7d' }
        );

        db.prepare(`
            INSERT INTO representative_audit_logs (
                id, representative_id, workshop_id, action, actor_id, actor_role, justification, metadata_json, ip_address
            ) VALUES (?, ?, NULL, 'REPRESENTATIVE_LOGIN', ?, 'REPRESENTATIVE', 'Acesso autenticado ao portal comercial /representante', ?, ?)
        `).run(
            `ral_${Date.now()}_${Math.random().toString(36).slice(2, 6)}`,
            rep.id,
            rep.user_id,
            JSON.stringify({ rep_code: rep.rep_code }),
            req.ip || '127.0.0.1'
        );

        res.json({
            success: true,
            token,
            representative: buildRepresentativePayload(rep, req)
        });
    } catch (err) {
        console.error('Erro no login de representante:', err);
        res.status(500).json({ error: 'Erro interno ao autenticar representante.' });
    }
});

// Helper para obter o representante autenticado
function getAuthenticatedRep(req) {
    if (req.user && req.user.representative) return req.user.representative;
    if (req.user && req.user.id) {
        return db.prepare('SELECT * FROM representatives WHERE user_id = ?').get(req.user.id);
    }
    return null;
}

// Somente representantes aprovados pela DNA AUTO acessam o painel (/me/*)
function requireApprovedRepresentative(req, res, next) {
    const rep = getAuthenticatedRep(req);
    if (!rep) {
        return res.status(404).json({ error: 'Perfil de representante não encontrado.' });
    }
    if (rep.status !== REP_STATUS.ACTIVE) {
        return res.status(403).json({
            code: rep.status === REP_STATUS.PENDING ? 'REPRESENTATIVE_PENDING_APPROVAL' : 'REPRESENTATIVE_INACTIVE',
            error: 'Acesso ao painel liberado somente para representantes aprovados pela DNA AUTO.'
        });
    }
    next();
}

const repAuth = [authenticateToken, authorizeRoles('REPRESENTATIVE'), requireApprovedRepresentative];

// 3. Dados do Representante Autenticado, Link Exclusivo, QR Code e Mensagem WhatsApp (Seções 2 e 10)
router.get(['/me', '/me/workspace'], repAuth, (req, res) => {
    try {
        const rep = getAuthenticatedRep(req);
        if (!rep) {
            return res.status(404).json({ error: 'Perfil de representante não encontrado.' });
        }
        res.json({
            success: true,
            representative: buildRepresentativePayload(rep, req)
        });
    } catch (err) {
        res.status(500).json({ error: 'Erro ao carregar dados do representante.' });
    }
});

// 4. Consultar ou Registrar Compartilhamento de Link / Convite de Oficina pelo WhatsApp (Etapa 1 — Seções 3 e 10)
router.get('/me/share-link', repAuth, (req, res) => {
    try {
        const rep = getAuthenticatedRep(req);
        if (!rep) {
            return res.status(404).json({ error: 'Representante não encontrado.' });
        }
        const payload = buildRepresentativePayload(rep, req);
        res.json({
            success: true,
            rep_id: rep.id,
            rep_code: rep.rep_code,
            referral_link: payload.referral_link,
            referral_url: payload.referral_url,
            qr_code_payload: payload.qr_code_payload,
            qr_code_url: payload.qr_code_url,
            suggested_message: payload.suggested_message,
            whatsapp_suggested_message: payload.whatsapp_suggested_message,
            whatsapp_share_url: payload.whatsapp_share_url
        });
    } catch (err) {
        res.status(500).json({ error: 'Erro ao obter link de indicação.' });
    }
});

router.post('/me/share-link', repAuth, (req, res) => {
    try {
        const rep = getAuthenticatedRep(req);
        if (!rep) {
            return res.status(404).json({ error: 'Representante não encontrado.' });
        }

        const prospectWorkshopName = String(req.body.prospect_workshop_name || req.body.workshop_name || '').trim() || null;
        const prospectCnpj = String(req.body.prospect_cnpj || req.body.cnpj || '').replace(/\D/g, '') || null;
        const prospectEmail = String(req.body.prospect_email || req.body.email || '').trim().toLowerCase() || null;
        const prospectPhone = String(req.body.prospect_phone || req.body.phone || '').trim() || null;

        db.prepare(`
            UPDATE representatives
            SET links_shared_count = COALESCE(links_shared_count, 0) + 1,
                updated_at = CURRENT_TIMESTAMP
            WHERE id = ?
        `).run(rep.id);

        const inviteId = `rinv_${Date.now()}_${Math.random().toString(36).slice(2, 6)}`;
        const inviteToken = `inv_${rep.rep_code}_${Date.now().toString(36)}`;
        const nowIso = new Date().toISOString().replace('T', ' ').slice(0, 19);

        db.prepare(`
            INSERT INTO representative_invites (
                id, representative_id, rep_code, invite_token,
                prospect_workshop_name, prospect_cnpj, prospect_email, prospect_phone,
                clicks_count, status, created_at, updated_at
            ) VALUES (?, ?, ?, ?, ?, ?, ?, ?, 0, 'CREATED', ?, ?)
        `).run(
            inviteId,
            rep.id,
            rep.rep_code,
            inviteToken,
            prospectWorkshopName,
            prospectCnpj,
            prospectEmail,
            prospectPhone,
            nowIso,
            nowIso
        );

        const updatedRep = db.prepare('SELECT * FROM representatives WHERE id = ?').get(rep.id);
        const origin = getBaseOrigin(req);
        const referralUrl = `${origin}/representante/indicacao/${rep.rep_code}`;
        const customMessage = req.body.custom_message
            ? String(req.body.custom_message).replace(/\[LINK EXCLUSIVO\]/g, referralUrl)
            : buildSuggestedWhatsAppMessage(referralUrl);
        const cleanTargetPhone = (prospectPhone || '').replace(/\D/g, '');
        const whatsappTargetPhone = cleanTargetPhone.length >= 10
            ? (cleanTargetPhone.startsWith('55') ? cleanTargetPhone : `55${cleanTargetPhone}`)
            : '';
        const whatsappUrl = whatsappTargetPhone
            ? `https://wa.me/${whatsappTargetPhone}?text=${encodeURIComponent(customMessage)}`
            : `https://wa.me/?text=${encodeURIComponent(customMessage)}`;

        res.json({
            success: true,
            message: 'Link exclusivo de indicação preparado para compartilhamento!',
            links_shared_count: updatedRep.links_shared_count,
            invite_id: inviteId,
            invite_token: inviteToken,
            referral_url: referralUrl,
            whatsapp_message: customMessage,
            whatsapp_url: whatsappUrl
        });
    } catch (err) {
        console.error('Erro ao registrar compartilhamento de link:', err);
        res.status(500).json({ error: 'Erro ao preparar link de indicação.' });
    }
});

// 5. Painel "Minha Produtividade" com todos os 14 Indicadores Reais e Filtro por Período (Seção 8)
router.get('/me/productivity', repAuth, (req, res) => {
    try {
        const rep = getAuthenticatedRep(req);
        if (!rep) {
            return res.status(404).json({ error: 'Representante não encontrado.' });
        }

        const period = String(req.query.period || 'all').toLowerCase();
        const monthParam = String(req.query.month || '').trim(); // YYYY-MM

        let dateFilterSql = '';
        const now = new Date();
        const currentMonthStr = `${now.getFullYear()}-${String(now.getMonth() + 1).padStart(2, '0')}`;

        if (/^\d{4}-\d{2}$/.test(monthParam)) {
            dateFilterSql = `AND strftime('%Y-%m', created_at) = '${monthParam}'`;
        } else if (period === 'current_month') {
            dateFilterSql = `AND strftime('%Y-%m', created_at) = '${currentMonthStr}'`;
        } else if (period === 'last_30_days') {
            dateFilterSql = `AND datetime(created_at) >= datetime('now', '-30 days')`;
        } else if (period === 'last_90_days') {
            dateFilterSql = `AND datetime(created_at) >= datetime('now', '-90 days')`;
        }

        // Convites do representante
        const invites = db.prepare(`
            SELECT * FROM representative_invites
            WHERE representative_id = ? ${dateFilterSql}
        `).all(rep.id);

        // Vínculos de oficinas da carteira do representante
        const referrals = db.prepare(`
            SELECT wr.*, w.trade_name, w.company_name, w.cnpj, w.city, w.state, w.status as workshop_status
            FROM workshop_referrals wr
            JOIN workshops w ON wr.workshop_id = w.id
            WHERE wr.representative_id = ?
        `).all(rep.id);

        // Comissões do representante (filtradas pelo período quando solicitado)
        const commissions = db.prepare(`
            SELECT rc.*, w.trade_name as workshop_trade_name
            FROM representative_commissions rc
            JOIN workshops w ON rc.workshop_id = w.id
            WHERE rc.representative_id = ? ${dateFilterSql.replace(/created_at/g, 'rc.created_at')}
            ORDER BY rc.created_at DESC
        `).all(rep.id);

        // Comissões do mês corrente para o indicador 8 (Total de novos cadastros pagos no mês)
        const targetMonth = /^\d{4}-\d{2}$/.test(monthParam) ? monthParam : currentMonthStr;
        const monthlyPaidRow = db.prepare(`
            SELECT COUNT(*) as total
            FROM representative_commissions
            WHERE representative_id = ?
              AND status IN ('CONFIRMED', 'PAID')
              AND strftime('%Y-%m', COALESCE(confirmed_at, created_at)) = ?
        `).get(rep.id, targetMonth);

        const invitesAccessedCount = invites.filter(i =>
            (i.clicks_count || 0) > 0 || ['ACCESSED', 'STARTED', 'COMPLETED', 'ACTIVATED'].includes(i.status)
        ).length;

        const workshopsStartedCount = Math.max(
            invites.filter(i => ['STARTED', 'COMPLETED', 'ACTIVATED'].includes(i.status)).length,
            referrals.length
        );

        const workshopsCompletedCount = referrals.length;
        const workshopsActivatedCount = referrals.filter(r => r.workshop_status === 'APPROVED' && r.status === 'ACTIVE').length;

        // 7. Novos cadastros pagos por oficina + 6. Oficinas com clientes pagantes
        const paidRegistrationsPerWorkshop = referrals.map(r => {
            const wsComms = commissions.filter(c => c.workshop_id === r.workshop_id);
            const paidComms = wsComms.filter(c => c.status === 'CONFIRMED' || c.status === 'PAID');
            const confirmedCents = paidComms.reduce((acc, c) => acc + (c.commission_amount_cents || 0), 0);
            return {
                workshop_id: r.workshop_id,
                trade_name: r.trade_name,
                city_state: `${r.city || 'São Paulo'}/${r.state || 'SP'}`,
                paid_registrations_count: paidComms.length,
                confirmed_commissions_cents: confirmedCents,
                confirmed_commissions_formatted: formatBrl(confirmedCents)
            };
        });

        const workshopsWithPayingClientsCount = paidRegistrationsPerWorkshop.filter(w => w.paid_registrations_count > 0).length;

        const projectedCommissionsCents = commissions
            .filter(c => c.status === 'PROJECTED')
            .reduce((acc, c) => acc + (c.commission_amount_cents || 0), 0);

        const confirmedCommissionsCents = commissions
            .filter(c => c.status === 'CONFIRMED' || c.status === 'PAID')
            .reduce((acc, c) => acc + (c.commission_amount_cents || 0), 0);

        const paidCommissionsCents = commissions
            .filter(c => c.status === 'PAID')
            .reduce((acc, c) => acc + (c.commission_amount_cents || 0), 0);

        const refundedCommissionsCents = commissions
            .filter(c => c.status === 'REFUNDED')
            .reduce((acc, c) => acc + (c.commission_amount_cents || 0), 0);

        const totalPaidRegistrationsInPeriod = commissions.filter(c => c.status === 'CONFIRMED' || c.status === 'PAID').length;

        // 13. Evolução mensal (últimos 6 meses)
        const monthlyEvolution = [];
        for (let i = 5; i >= 0; i--) {
            const d = new Date(now.getFullYear(), now.getMonth() - i, 1);
            const ym = `${d.getFullYear()}-${String(d.getMonth() + 1).padStart(2, '0')}`;
            const mRow = db.prepare(`
                SELECT
                    COUNT(CASE WHEN status IN ('CONFIRMED', 'PAID') THEN 1 END) as paid_registrations,
                    COALESCE(SUM(CASE WHEN status IN ('CONFIRMED', 'PAID') THEN commission_amount_cents ELSE 0 END), 0) as confirmed_cents,
                    COALESCE(SUM(CASE WHEN status = 'REFUNDED' THEN commission_amount_cents ELSE 0 END), 0) as refunded_cents
                FROM representative_commissions
                WHERE representative_id = ?
                  AND strftime('%Y-%m', COALESCE(confirmed_at, created_at)) = ?
            `).get(rep.id, ym);

            const wsLinkedInMonth = db.prepare(`
                SELECT COUNT(*) as total
                FROM workshop_referrals
                WHERE representative_id = ?
                  AND strftime('%Y-%m', linked_at) = ?
            `).get(rep.id, ym);

            monthlyEvolution.push({
                month: ym,
                workshops_linked: wsLinkedInMonth ? wsLinkedInMonth.total : 0,
                paid_registrations: mRow ? mRow.paid_registrations : 0,
                confirmed_commissions_cents: mRow ? mRow.confirmed_cents : 0,
                confirmed_commissions_formatted: formatBrl(mRow ? mRow.confirmed_cents : 0),
                refunded_commissions_cents: mRow ? mRow.refunded_cents : 0
            });
        }

        // 14. Metas comerciais
        const maxWorkshopsLimit = rep.max_workshops_limit || 15;
        const monthlyGoalWorkshops = rep.monthly_goal_workshops || 5;
        const monthlyGoalActivations = rep.monthly_goal_activations || 220;
        const linksSharedTotal = Math.max(rep.links_shared_count || 0, invites.length);

        const pendingActivationCount = Math.max(0, workshopsCompletedCount - workshopsActivatedCount);
        const inactive30dCount = paidRegistrationsPerWorkshop.filter(w => w.paid_registrations_count === 0).length;
        const expiringSoonCount = referrals.filter(r => {
            if (!r.valid_until) return false;
            const diffDays = (new Date(r.valid_until).getTime() - now.getTime()) / (1000 * 60 * 60 * 24);
            return diffDays >= 0 && diffDays <= 60;
        }).length;

        res.json({
            success: true,
            filter: {
                period,
                month: targetMonth
            },
            indicators: {
                links_shared: linksSharedTotal,
                invites_accessed: Math.max(invitesAccessedCount, workshopsStartedCount),
                workshops_started: workshopsStartedCount,
                workshops_completed: workshopsCompletedCount,
                workshops_activated: workshopsActivatedCount,
                workshops_with_paying_clients: workshopsWithPayingClientsCount,
                paid_registrations_per_workshop: paidRegistrationsPerWorkshop,
                monthly_paid_registrations: monthlyPaidRow ? monthlyPaidRow.total : totalPaidRegistrationsInPeriod,
                total_paid_registrations: totalPaidRegistrationsInPeriod,
                projected_commissions_cents: projectedCommissionsCents,
                projected_commissions_formatted: formatBrl(projectedCommissionsCents),
                confirmed_commissions_cents: confirmedCommissionsCents,
                confirmed_commissions_formatted: formatBrl(confirmedCommissionsCents),
                paid_commissions_cents: paidCommissionsCents,
                paid_commissions_formatted: formatBrl(paidCommissionsCents),
                refunded_commissions_cents: refundedCommissionsCents,
                refunded_commissions_formatted: formatBrl(refundedCommissionsCents),
                // 14 Indicadores Obrigatórios (Chaves em Português para UI e Homologação)
                oficinas_indicadas: linksSharedTotal,
                convites_abertos: Math.max(invitesAccessedCount, workshopsStartedCount),
                cadastros_iniciados: workshopsStartedCount,
                oficinas_cadastradas: workshopsCompletedCount,
                oficinas_ativas: workshopsActivatedCount,
                oficinas_pendentes_ativacao: pendingActivationCount,
                oficinas_sem_movimento_30_dias: inactive30dCount,
                total_novos_clientes_pagos: totalPaidRegistrationsInPeriod,
                cadastros_pagos_mes_atual: monthlyPaidRow ? monthlyPaidRow.total : totalPaidRegistrationsInPeriod,
                comissoes_previstas_cents: projectedCommissionsCents,
                comissoes_confirmadas_cents: confirmedCommissionsCents,
                comissoes_pagas_cents: paidCommissionsCents,
                comissoes_acumuladas_cents: confirmedCommissionsCents,
                oficinas_proximas_encerramento_24m: expiringSoonCount,
                monthly_evolution: monthlyEvolution,
                commercial_goals: {
                    max_workshops_portfolio: maxWorkshopsLimit,
                    active_workshops_portfolio: workshopsActivatedCount,
                    remaining_portfolio_slots: Math.max(0, maxWorkshopsLimit - workshopsActivatedCount),
                    portfolio_progress_percent: Math.min(100, Math.round((workshopsActivatedCount / maxWorkshopsLimit) * 100)),
                    monthly_goal_workshops: monthlyGoalWorkshops,
                    monthly_goal_activations: monthlyGoalActivations,
                    activations_progress_percent: Math.min(100, Math.round(((monthlyPaidRow ? monthlyPaidRow.total : 0) / monthlyGoalActivations) * 100))
                }
            }
        });
    } catch (err) {
        console.error('Erro ao calcular produtividade do representante:', err);
        res.status(500).json({ error: 'Erro ao consultar indicadores de produtividade.' });
    }
});

// 6. Painel "Minhas Oficinas" — Lista todas as oficinas vinculadas ao representante com as 8 colunas obrigatórias (Seção 9)
router.get('/me/workshops', repAuth, (req, res) => {
    try {
        const rep = getAuthenticatedRep(req);
        if (!rep) {
            return res.status(404).json({ error: 'Representante não encontrado.' });
        }

        const rows = db.prepare(`
            SELECT
                wr.id as referral_id,
                wr.workshop_id,
                wr.rep_code,
                wr.origin_channel,
                wr.linked_at,
                wr.valid_until,
                wr.status as referral_status,
                w.trade_name,
                w.company_name,
                w.cnpj,
                w.city,
                w.state,
                w.status as workshop_status,
                w.created_at as workshop_created_at
            FROM workshop_referrals wr
            JOIN workshops w ON wr.workshop_id = w.id
            WHERE wr.representative_id = ?
            ORDER BY wr.linked_at DESC
        `).all(rep.id);

        const workshops = rows.map(r => {
            const commStats = db.prepare(`
                SELECT
                    COUNT(CASE WHEN status IN ('CONFIRMED', 'PAID') THEN 1 END) as paid_count,
                    COUNT(CASE WHEN status = 'PROJECTED' THEN 1 END) as projected_count,
                    COALESCE(SUM(CASE WHEN status IN ('CONFIRMED', 'PAID') THEN commission_amount_cents ELSE 0 END), 0) as total_commissions_cents,
                    MAX(COALESCE(confirmed_at, created_at)) as last_comm_at
                FROM representative_commissions
                WHERE representative_id = ? AND workshop_id = ?
            `).get(rep.id, r.workshop_id);

            const paidCount = commStats ? commStats.paid_count : 0;
            const totalCommCents = commStats ? commStats.total_commissions_cents : 0;

            let activationStatus = 'Credenciada / Ativa';
            let situacaoAtivacaoCode = 'ATIVA';
            if (r.workshop_status !== 'APPROVED') {
                activationStatus = 'Em Credenciamento';
                situacaoAtivacaoCode = 'CADASTRADA';
            } else if (paidCount > 0) {
                activationStatus = 'Ativa com Clientes Pagantes';
                situacaoAtivacaoCode = 'ATIVA';
            }

            let lastActivity = `Oficina credenciada em ${String(r.linked_at).slice(0, 10)}`;
            if (commStats && commStats.last_comm_at && paidCount > 0) {
                lastActivity = `Novo cadastro pago confirmado em ${String(commStats.last_comm_at).slice(0, 16)}`;
            } else if (commStats && commStats.projected_count > 0) {
                lastActivity = `Cadastro iniciado (aguardando pagamento PIX)`;
            }

            const maskedCnpjVal = maskCnpj(r.cnpj);
            const cityStateVal = `${r.city || 'São Paulo'}/${r.state || 'SP'}`;

            return {
                referral_id: r.referral_id,
                workshop_id: r.workshop_id,
                trade_name: r.trade_name,
                nome_fantasia: r.trade_name,
                masked_cnpj: maskedCnpjVal,
                cnpj_mascarado: maskedCnpjVal,
                city: r.city || 'São Paulo',
                state: r.state || 'SP',
                city_state: cityStateVal,
                municipio_uf: cityStateVal,
                linked_at: r.linked_at,
                data_indicacao: r.linked_at,
                valid_until: r.valid_until,
                referral_status: r.referral_status,
                activation_status: activationStatus,
                situacao_ativacao: situacaoAtivacaoCode,
                paid_registrations_count: paidCount,
                novos_cadastros_pagos: paidCount,
                projected_registrations_count: commStats ? commStats.projected_count : 0,
                total_commissions_cents: totalCommCents,
                total_comissoes_geradas_cents: totalCommCents,
                total_commissions_formatted: formatBrl(totalCommCents),
                last_commercial_activity: lastActivity,
                ultima_atividade_comercial: lastActivity
            };
        });

        res.json({
            success: true,
            workshops,
            items: workshops
        });
    } catch (err) {
        console.error('Erro ao listar oficinas do representante:', err);
        res.status(500).json({ error: 'Erro ao listar carteira de oficinas.' });
    }
});

// 7. Detalhes Comerciais Autorizados de uma Oficina da Carteira (Sem dados de clientes/veículos e com isolamento entre representantes - Seção 9 e 13)
router.get('/me/workshops/:workshopId', repAuth, (req, res) => {
    try {
        const rep = getAuthenticatedRep(req);
        if (!rep) {
            return res.status(404).json({ error: 'Representante não encontrado.' });
        }

        const referral = db.prepare(`
            SELECT wr.*, w.trade_name, w.company_name, w.cnpj, w.city, w.state, w.status as workshop_status
            FROM workshop_referrals wr
            JOIN workshops w ON wr.workshop_id = w.id
            WHERE wr.workshop_id = ?
        `).get(req.params.workshopId);

        if (!referral || referral.representative_id !== rep.id) {
            return res.status(403).json({
                error: 'ACESSO NEGADO: Esta oficina não pertence à sua carteira comercial. Isolamento entre representantes ativo.',
                code: 'REPRESENTATIVE_PORTFOLIO_ISOLATION'
            });
        }

        const commSummary = db.prepare(`
            SELECT
                COUNT(CASE WHEN status IN ('CONFIRMED', 'PAID') THEN 1 END) as paid_registrations_count,
                COUNT(CASE WHEN status = 'PROJECTED' THEN 1 END) as projected_registrations_count,
                COUNT(CASE WHEN status = 'REFUNDED' THEN 1 END) as refunded_registrations_count,
                COALESCE(SUM(CASE WHEN status IN ('CONFIRMED', 'PAID') THEN commission_amount_cents ELSE 0 END), 0) as confirmed_commissions_cents,
                COALESCE(SUM(CASE WHEN status = 'PROJECTED' THEN commission_amount_cents ELSE 0 END), 0) as projected_commissions_cents,
                COALESCE(SUM(CASE WHEN status = 'PAID' THEN commission_amount_cents ELSE 0 END), 0) as paid_commissions_cents,
                COALESCE(SUM(CASE WHEN status = 'REFUNDED' THEN commission_amount_cents ELSE 0 END), 0) as refunded_commissions_cents
            FROM representative_commissions
            WHERE representative_id = ? AND workshop_id = ?
        `).get(rep.id, referral.workshop_id);

        const recentCommissions = db.prepare(`
            SELECT
                id,
                source_payment_id,
                registration_amount_cents,
                workshop_split_cents,
                platform_split_cents,
                commission_amount_cents,
                status,
                created_at,
                confirmed_at,
                paid_at,
                refunded_at
            FROM representative_commissions
            WHERE representative_id = ? AND workshop_id = ?
            ORDER BY created_at DESC
            LIMIT 25
        `).all(rep.id, referral.workshop_id);

        const detailObj = {
            workshop_id: referral.workshop_id,
            trade_name: referral.trade_name,
            nome_fantasia: referral.trade_name,
            masked_cnpj: maskCnpj(referral.cnpj),
            cnpj_mascarado: maskCnpj(referral.cnpj),
            city_state: `${referral.city || 'São Paulo'}/${referral.state || 'SP'}`,
            municipio_uf: `${referral.city || 'São Paulo'}/${referral.state || 'SP'}`,
            linked_at: referral.linked_at,
            data_indicacao: referral.linked_at,
            valid_until: referral.valid_until,
            referral_status: referral.status,
            situacao_ativacao: referral.workshop_status === 'APPROVED' ? 'ATIVA' : 'CADASTRADA',
            workshop_status: referral.workshop_status,
            paid_registrations_count: commSummary ? commSummary.paid_registrations_count : 0,
            novos_cadastros_pagos: commSummary ? commSummary.paid_registrations_count : 0,
            projected_registrations_count: commSummary ? commSummary.projected_registrations_count : 0,
            refunded_registrations_count: commSummary ? commSummary.refunded_registrations_count : 0,
            confirmed_commissions_cents: commSummary ? commSummary.confirmed_commissions_cents : 0,
            total_comissoes_geradas_cents: commSummary ? commSummary.confirmed_commissions_cents : 0,
            confirmed_commissions_formatted: formatBrl(commSummary ? commSummary.confirmed_commissions_cents : 0),
            projected_commissions_cents: commSummary ? commSummary.projected_commissions_cents : 0,
            comissoes_previstas_cents: commSummary ? commSummary.projected_commissions_cents : 0,
            projected_commissions_formatted: formatBrl(commSummary ? commSummary.projected_commissions_cents : 0),
            paid_commissions_cents: commSummary ? commSummary.paid_commissions_cents : 0,
            paid_commissions_formatted: formatBrl(commSummary ? commSummary.paid_commissions_cents : 0),
            refunded_commissions_cents: commSummary ? commSummary.refunded_commissions_cents : 0,
            refunded_commissions_formatted: formatBrl(commSummary ? commSummary.refunded_commissions_cents : 0),
            recent_commissions: recentCommissions,
            lgpd_compliance_notice: 'Dados pessoais de clientes, placas, chassis, notas fiscais e ordens de serviço são protegidos pela LGPD e inacessíveis ao perfil comercial.'
        };

        res.json({
            success: true,
            workshop_commercial_detail: detailObj,
            workshop: detailObj
        });
    } catch (err) {
        console.error('Erro ao consultar detalhe comercial da oficina:', err);
        res.status(500).json({ error: 'Erro ao carregar detalhes comerciais da oficina.' });
    }
});

// 8. Histórico de Comissões do Representante (Seção 7)
router.get('/me/commissions', repAuth, (req, res) => {
    try {
        const rep = getAuthenticatedRep(req);
        if (!rep) {
            return res.status(404).json({ error: 'Representante não encontrado.' });
        }

        const statusFilter = String(req.query.status || '').toUpperCase();
        let sql = `
            SELECT
                rc.id,
                rc.workshop_id,
                w.trade_name as workshop_trade_name,
                w.cnpj as workshop_cnpj,
                rc.source_payment_id,
                rc.registration_amount_cents,
                rc.workshop_split_cents,
                rc.platform_split_cents,
                rc.commission_amount_cents,
                rc.status,
                rc.created_at,
                rc.confirmed_at,
                rc.paid_at,
                rc.refunded_at,
                rc.notes
            FROM representative_commissions rc
            JOIN workshops w ON rc.workshop_id = w.id
            WHERE rc.representative_id = ?
        `;
        const params = [rep.id];
        if (['PROJECTED', 'CONFIRMED', 'PAID', 'REFUNDED'].includes(statusFilter)) {
            sql += ` AND rc.status = ?`;
            params.push(statusFilter);
        }
        sql += ` ORDER BY rc.created_at DESC`;

        const rows = db.prepare(sql).all(...params).map(r => ({
            id: r.id,
            workshop_id: r.workshop_id,
            workshop_trade_name: r.workshop_trade_name,
            workshop_name: r.workshop_trade_name,
            workshop_masked_cnpj: maskCnpj(r.workshop_cnpj),
            source_payment_id: r.source_payment_id,
            registration_amount_cents: r.registration_amount_cents,
            gross_registration_cents: r.registration_amount_cents,
            registration_amount_formatted: formatBrl(r.registration_amount_cents),
            workshop_split_cents: r.workshop_split_cents,
            workshop_split_formatted: formatBrl(r.workshop_split_cents),
            platform_split_cents: r.platform_split_cents,
            platform_gross_split_cents: r.platform_split_cents,
            platform_net_split_cents: Math.max(0, (r.platform_split_cents || 2495) - (r.commission_amount_cents || 590)),
            platform_split_formatted: formatBrl(r.platform_split_cents),
            commission_amount_cents: r.commission_amount_cents,
            commission_amount_formatted: formatBrl(r.commission_amount_cents),
            status: r.status,
            created_at: r.created_at,
            confirmed_at: r.confirmed_at,
            paid_at: r.paid_at,
            refunded_at: r.refunded_at,
            notes: r.notes
        }));

        res.json({
            success: true,
            commissions: rows,
            items: rows
        });
    } catch (err) {
        console.error('Erro ao listar comissões do representante:', err);
        res.status(500).json({ error: 'Erro ao carregar histórico de comissões.' });
    }
});

// 9. Endpoint Público de Validação e Acesso ao Link de Indicação (/representante/indicacao/:code — Etapa 2)
router.get('/indicacao/:code/info', (req, res) => {
    try {
        const rawCode = String(req.params.code || '').trim();
        const rep = db.prepare(`
            SELECT id, rep_code, name, city, state, status
            FROM representatives
            WHERE UPPER(rep_code) = UPPER(?)
        `).get(rawCode);

        if (!rep || rep.status !== 'ACTIVE') {
            return res.status(404).json({
                valid: false,
                error: 'Link de indicação inválido ou representante inativo.'
            });
        }

        // Registra acesso ao convite se não for apenas consulta passiva
        const nowIso = new Date().toISOString().replace('T', ' ').slice(0, 19);
        let activeInvite = db.prepare(`
            SELECT * FROM representative_invites
            WHERE representative_id = ? AND status IN ('CREATED', 'ACCESSED') AND workshop_id IS NULL
            ORDER BY updated_at DESC LIMIT 1
        `).get(rep.id);

        if (activeInvite) {
            db.prepare(`
                UPDATE representative_invites
                SET clicks_count = COALESCE(clicks_count, 0) + 1,
                    status = CASE WHEN status = 'CREATED' THEN 'ACCESSED' ELSE status END,
                    accessed_at = COALESCE(accessed_at, ?),
                    updated_at = ?
                WHERE id = ?
            `).run(nowIso, nowIso, activeInvite.id);
        } else {
            const inviteId = `rinv_${Date.now()}_${Math.random().toString(36).slice(2, 6)}`;
            const inviteToken = `inv_${rep.rep_code}_${Date.now().toString(36)}`;
            db.prepare(`
                INSERT INTO representative_invites (
                    id, representative_id, rep_code, invite_token,
                    clicks_count, status, ip_address, user_agent, created_at, updated_at, accessed_at
                ) VALUES (?, ?, ?, ?, 1, 'ACCESSED', ?, ?, ?, ?, ?)
            `).run(
                inviteId,
                rep.id,
                rep.rep_code,
                inviteToken,
                req.ip || '127.0.0.1',
                req.headers['user-agent'] || '',
                nowIso,
                nowIso,
                nowIso
            );
            activeInvite = db.prepare('SELECT * FROM representative_invites WHERE id = ?').get(inviteId);
        }

        res.json({
            valid: true,
            representative: {
                rep_code: rep.rep_code,
                name: rep.name,
                city: rep.city,
                state: rep.state
            },
            invite_token: activeInvite ? activeInvite.invite_token : null,
            workshop_benefits: {
                registration_price_formatted: 'R$ 49,90',
                workshop_share_formatted: 'R$ 24,95 (50% de repasse imediato para a oficina)',
                highlights: [
                    'Lucro direto no cadastramento do cliente no app (50% do valor do cadastro)',
                    'Monitoramento inteligente por quilometragem e recomendações do fabricante',
                    'Histórico digital de manutenção do veículo (Passaporte Digital DNA AUTO)',
                    'Mais retorno de clientes para troca de óleo, câmbio automático, correia dentada, pastilhas e velas'
                ],
                flyer_image_url: '/img/folheto-comercial-representante.jpg',
                workshop_app_url: '/oficina'
            },
            security_rule: 'Somente o proprietário da oficina realiza o cadastro e cria sua própria senha no aplicativo oficial da oficina.'
        });
    } catch (err) {
        console.error('Erro ao validar link de indicação:', err);
        res.status(500).json({ error: 'Erro ao validar convite do representante.' });
    }
});

// 10. Pré-Associação de Titularidade da Oficina antes de Redirecionar para Instalação/Abertura do App (/oficina)
// Garante 100% de persistência do vínculo mesmo que o proprietário feche o navegador, instale o app e abra depois (Seções 3, 4 e 6)
router.post('/indicacao/:code/start-onboarding', (req, res) => {
    try {
        const rawCode = String(req.params.code || '').trim();
        const rep = db.prepare(`
            SELECT * FROM representatives
            WHERE UPPER(rep_code) = UPPER(?) AND status = 'ACTIVE'
        `).get(rawCode);

        if (!rep) {
            return res.status(404).json({ error: 'Código de representante inválido ou inativo.' });
        }

        const workshopName = String(req.body.trade_name || req.body.workshop_name || req.body.name || '').trim();
        const rawCnpj = String(req.body.cnpj || '').trim();
        const cleanCnpj = rawCnpj.replace(/\D/g, '');
        const cleanEmail = String(req.body.email || '').trim().toLowerCase();
        const rawPhone = String(req.body.phone || req.body.whatsapp || '').trim();

        if (!cleanCnpj && !cleanEmail && !rawPhone) {
            return res.status(400).json({
                error: 'Informe ao menos o CNPJ, e-mail ou WhatsApp da sua oficina para garantir seu benefício de credenciamento.'
            });
        }

        // Verifica se já existe oficina com este CNPJ vinculada a outro representante (Proteção contra duplicidade e conflito de carteira - Seção 4)
        if (cleanCnpj.length >= 11) {
            const existingWs = db.prepare('SELECT id, trade_name FROM workshops WHERE REPLACE(REPLACE(REPLACE(cnpj, \'.\', \'\'), \'/\', \'\'), \'-\', \'\') = ?').get(cleanCnpj);
            if (existingWs) {
                const existingRef = db.prepare('SELECT * FROM workshop_referrals WHERE workshop_id = ?').get(existingWs.id);
                if (existingRef && existingRef.representative_id !== rep.id) {
                    return res.status(409).json({
                        error: 'Esta oficina já possui vínculo comercial ativo na plataforma DNA AUTO. Vínculos anteriores são protegidos e não podem ser sobrescritos.',
                        code: 'WORKSHOP_ALREADY_LINKED_TO_ANOTHER_REP'
                    });
                }
            }
        }

        const nowIso = new Date().toISOString().replace('T', ' ').slice(0, 19);
        const inviteId = `rinv_${Date.now()}_${Math.random().toString(36).slice(2, 6)}`;
        const inviteToken = `inv_${rep.rep_code}_${Date.now().toString(36)}_${Math.random().toString(36).slice(2, 5)}`;

        db.prepare(`
            INSERT INTO representative_invites (
                id, representative_id, rep_code, invite_token,
                prospect_workshop_name, prospect_cnpj, prospect_email, prospect_phone,
                clicks_count, status, ip_address, user_agent,
                created_at, updated_at, accessed_at, started_at
            ) VALUES (?, ?, ?, ?, ?, ?, ?, ?, 1, 'STARTED', ?, ?, ?, ?, ?, ?)
        `).run(
            inviteId,
            rep.id,
            rep.rep_code,
            inviteToken,
            workshopName || null,
            cleanCnpj || null,
            cleanEmail || null,
            rawPhone || null,
            req.ip || '127.0.0.1',
            req.headers['user-agent'] || '',
            nowIso,
            nowIso,
            nowIso,
            nowIso
        );

        db.prepare(`
            INSERT INTO representative_audit_logs (
                id, representative_id, workshop_id, action, actor_id, actor_role, justification, metadata_json, ip_address
            ) VALUES (?, ?, NULL, 'WORKSHOP_ONBOARDING_STARTED', 'PROSPECT_WORKSHOP_OWNER', 'WORKSHOP_OWNER', ?, ?, ?)
        `).run(
            `ral_${Date.now()}_${Math.random().toString(36).slice(2, 6)}`,
            rep.id,
            `Proprietário da oficina iniciou credenciamento pelo link exclusivo ${rep.rep_code}`,
            JSON.stringify({ invite_id: inviteId, invite_token: inviteToken, prospect_cnpj: cleanCnpj, prospect_email: cleanEmail }),
            req.ip || '127.0.0.1'
        );

        res.status(201).json({
            success: true,
            message: 'Indicação registrada com segurança! Agora conclua o cadastro da sua oficina diretamente no aplicativo oficial.',
            rep_code: rep.rep_code,
            invite_token: inviteToken,
            redirect_url: '/oficina'
        });
    } catch (err) {
        console.error('Erro ao iniciar onboarding de oficina indicada:', err);
        res.status(500).json({ error: 'Erro ao registrar início de cadastro da oficina.' });
    }
});

// 11. Endpoints Administrativos para Disputa/Correção de Vínculo com Auditoria Obrigatória (Seção 4 e 7)
router.post('/admin/resolve-dispute', authenticateToken, authorizeRoles('ADMIN'), (req, res) => {
    try {
        const { workshop_id, new_representative_id, justification } = req.body;
        if (!workshop_id || !new_representative_id || !justification || String(justification).trim().length < 10) {
            return res.status(400).json({
                error: 'Para alterar ou corrigir um vínculo comercial, são obrigatórios: workshop_id, new_representative_id e justificativa detalhada para auditoria.'
            });
        }

        const newRep = db.prepare('SELECT * FROM representatives WHERE id = ? OR UPPER(rep_code) = UPPER(?)').get(new_representative_id, new_representative_id);
        if (!newRep) {
            return res.status(404).json({ error: 'Novo representante não encontrado.' });
        }

        const previousReferral = db.prepare('SELECT * FROM workshop_referrals WHERE workshop_id = ?').get(workshop_id);
        const nowIso = new Date().toISOString().replace('T', ' ').slice(0, 19);
        const validUntilDate = new Date();
        validUntilDate.setMonth(validUntilDate.getMonth() + 24);
        const validUntilIso = validUntilDate.toISOString().replace('T', ' ').slice(0, 19);

        db.transaction(() => {
            if (previousReferral) {
                db.prepare(`
                    UPDATE workshop_referrals
                    SET representative_id = ?,
                        rep_code = ?,
                        justification = ?,
                        updated_at = ?
                    WHERE workshop_id = ?
                `).run(newRep.id, newRep.rep_code, String(justification).trim(), nowIso, workshop_id);
            } else {
                db.prepare(`
                    INSERT INTO workshop_referrals (
                        id, workshop_id, representative_id, rep_code, origin_channel,
                        linked_at, valid_until, status, created_by, justification
                    ) VALUES (?, ?, ?, ?, 'ADMIN_RESOLUTION', ?, ?, 'ACTIVE', ?, ?)
                `).run(
                    `wref_${Date.now()}`,
                    workshop_id,
                    newRep.id,
                    newRep.rep_code,
                    nowIso,
                    validUntilIso,
                    req.user.id,
                    String(justification).trim()
                );
            }

            db.prepare(`
                INSERT INTO representative_audit_logs (
                    id, representative_id, workshop_id, action, actor_id, actor_role, justification, metadata_json, ip_address
                ) VALUES (?, ?, ?, 'ADMIN_DISPUTE_RESOLUTION', ?, ?, ?, ?, ?)
            `).run(
                `ral_${Date.now()}_${Math.random().toString(36).slice(2, 6)}`,
                newRep.id,
                workshop_id,
                req.user.id,
                req.user.role_code,
                String(justification).trim(),
                JSON.stringify({
                    previous_representative_id: previousReferral ? previousReferral.representative_id : null,
                    new_representative_id: newRep.id,
                    new_rep_code: newRep.rep_code
                }),
                req.ip || '127.0.0.1'
            );
        })();

        res.json({
            success: true,
            message: 'Vínculo comercial atualizado mediante auditoria administrativa.',
            workshop_id,
            representative_id: newRep.id,
            rep_code: newRep.rep_code
        });
    } catch (err) {
        console.error('Erro na resolução administrativa de vínculo:', err);
        res.status(500).json({ error: 'Erro ao processar resolução administrativa.' });
    }
});

router.get('/admin/audit-logs', authenticateToken, authorizeRoles('ADMIN'), (req, res) => {
    try {
        const logs = db.prepare(`
            SELECT * FROM representative_audit_logs
            ORDER BY created_at DESC
            LIMIT 100
        `).all();
        res.json({ success: true, logs });
    } catch (err) {
        res.status(500).json({ error: 'Erro ao consultar logs de auditoria de representantes.' });
    }
});

// 12. Aprovação de Representantes pela DNA AUTO (cadastro → análise → aprovado/recusado)
router.get('/admin/representatives', authenticateToken, authorizeRoles('ADMIN'), (req, res) => {
    try {
        const statusFilter = String(req.query.status || '').toUpperCase();
        let sql = `
            SELECT id, rep_code, name, cpf_cnpj, email, phone, city, state, experience, status, created_at, updated_at
            FROM representatives
        `;
        const params = [];
        if (Object.values(REP_STATUS).includes(statusFilter)) {
            sql += ' WHERE status = ?';
            params.push(statusFilter);
        }
        sql += ` ORDER BY CASE status WHEN '${REP_STATUS.PENDING}' THEN 0 ELSE 1 END, created_at DESC`;
        const items = db.prepare(sql).all(...params);
        const pendingCount = items.filter(r => r.status === REP_STATUS.PENDING).length;
        res.json({ success: true, count: items.length, pending_count: pendingCount, items });
    } catch (err) {
        res.status(500).json({ error: 'Erro ao listar representantes.' });
    }
});

function changeRepresentativeStatus(req, res, newStatus, action, defaultJustification) {
    try {
        const rep = db.prepare('SELECT * FROM representatives WHERE id = ? OR UPPER(rep_code) = UPPER(?)').get(req.params.id, req.params.id);
        if (!rep) {
            return res.status(404).json({ error: 'Representante não encontrado.' });
        }
        const justification = String(req.body.justification || defaultJustification).trim();
        const nowIso = new Date().toISOString().replace('T', ' ').slice(0, 19);

        db.transaction(() => {
            db.prepare('UPDATE representatives SET status = ?, updated_at = ? WHERE id = ?').run(newStatus, nowIso, rep.id);
            db.prepare(`
                INSERT INTO representative_audit_logs (
                    id, representative_id, workshop_id, action, actor_id, actor_role, justification, metadata_json, ip_address
                ) VALUES (?, ?, NULL, ?, ?, ?, ?, ?, ?)
            `).run(
                `ral_${Date.now()}_${Math.random().toString(36).slice(2, 6)}`,
                rep.id,
                action,
                req.user.id,
                req.user.role_code,
                justification,
                JSON.stringify({ rep_code: rep.rep_code, previous_status: rep.status, new_status: newStatus }),
                req.ip || '127.0.0.1'
            );
        })();

        res.json({ success: true, id: rep.id, rep_code: rep.rep_code, status: newStatus });
    } catch (err) {
        console.error('Erro ao alterar status do representante:', err);
        res.status(500).json({ error: 'Erro ao atualizar o status do representante.' });
    }
}

router.post('/admin/representatives/:id/approve', authenticateToken, authorizeRoles('ADMIN'), (req, res) =>
    changeRepresentativeStatus(req, res, REP_STATUS.ACTIVE, 'REPRESENTATIVE_APPROVED', 'Cadastro aprovado pela DNA AUTO')
);

router.post('/admin/representatives/:id/reject', authenticateToken, authorizeRoles('ADMIN'), (req, res) =>
    changeRepresentativeStatus(req, res, REP_STATUS.REJECTED, 'REPRESENTATIVE_REJECTED', 'Cadastro não aprovado pela DNA AUTO')
);

router.post('/admin/representatives/:id/suspend', authenticateToken, authorizeRoles('ADMIN'), (req, res) =>
    changeRepresentativeStatus(req, res, REP_STATUS.SUSPENDED, 'REPRESENTATIVE_SUSPENDED', 'Acesso do representante suspenso pela DNA AUTO')
);

module.exports = router;
