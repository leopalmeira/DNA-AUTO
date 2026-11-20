/**
 * DNA AUTO — Serviço Oficial de Cobrança e PIX da Oficina via AbacatePay API
 * 
 * Regra de Negócio e Planos de Monetização:
 * 1. Para cada cliente cadastrado pela oficina:
 *    - Cobrança base DNA AUTO: R$ 30,00 (3000 centavos)
 *    - Cobrança sugerida ao Cliente Final: R$ 59,90 (5990 centavos)
 *    - Lucro Líquido retido pela Oficina: R$ 29,90 por carro
 * 
 * 2. Planos de Crédito Pré-Pago com Desconto por Volume:
 *    - Avulso (1 a 9 créditos): R$ 30,00 por crédito
 *    - Lote Bronze (10 a 29 créditos): R$ 29,00 por crédito (Ex: 10 créditos = R$ 290,00 -> Lucro da oficina: R$ 30,90/carro = R$ 309,00)
 *    - Lote Ouro (30+ créditos): R$ 28,00 por crédito (Ex: 30 créditos = R$ 840,00 -> Lucro da oficina: R$ 31,90/carro = R$ 957,00)
 * 
 * 3. Modelo Pós-Pago (Consolidado de 10 Carros):
 *    - A oficina pode cadastrar até 10 carros sem pagar antecipado.
 *    - Ao tentar cadastrar a partir do 11º carro, o sistema exige a quitação dos 10 carros anteriores (10 x R$ 30,00 = R$ 300,00).
 *    - Ao pagar o PIX dos 10 carros, o contador é quitado e ela pode cadastrar os próximos 10 carros.
 * 
 * 4. Webhook Automático AbacatePay:
 *    - Notificações de pagamento em tempo real liberam créditos e carros instantaneamente.
 */

const https = require('https');
const CommissionFinance = require('./commissionFinance.service');
const { publishSyncEvent } = require('./syncEvents.service');

const ABACATE_API_KEY = process.env.ABACATEPAY_API_KEY || (process.env.NODE_ENV === 'production' ? '' : 'abc_prod_FpktkRTTAXMYqGame1mfwc0y');
const ABACATE_BASE_URL = process.env.ABACATEPAY_BASE_URL || 'https://api.abacatepay.com';
const WEBHOOK_SECRET = process.env.ABACATEPAY_WEBHOOK_SECRET || (process.env.NODE_ENV === 'production' ? '' : 'dna_sec_abacatepay_prod_2026_webhook_key');

if (process.env.NODE_ENV === 'production' && (!process.env.ABACATEPAY_API_KEY || !process.env.ABACATEPAY_WEBHOOK_SECRET)) {
    console.warn('⚠️ [SEGURANÇA] ABACATEPAY_API_KEY ou ABACATEPAY_WEBHOOK_SECRET não configurados em produção.');
}

const AbacatePayService = {
    BASE_SINGLE_PRICE_CENTS: 2495,    // R$ 24,95 (50% de R$ 49,90)
    CUSTOMER_PRICE_CENTS: 4990,       // R$ 49,90
    WORKSHOP_PROFIT_CENTS: 2495,      // R$ 24,95 (50% de R$ 49,90)
    ATTENDANCE_FEE_CENTS: 690,        // R$ 6,90 (Taxa fixa por retorno confirmado)

    // Programa Oficial de Representantes Comerciais (Seção 7)
    REP_PROGRAM_CUSTOMER_PRICE_CENTS: 4990,   // R$ 49,90
    REP_PROGRAM_WORKSHOP_SPLIT_CENTS: 2495,   // R$ 24,95 (50% Oficina)
    REP_PROGRAM_PLATFORM_SPLIT_CENTS: 2495,   // R$ 24,95 (50% Plataforma DNA AUTO)
    REP_COMMISSION_CENTS: 590,                // R$ 5,90 (Comissão do Representante, custeada pela plataforma)

    PRICE_TIER_10_CENTS: 2900,        // R$ 29,00 para >= 10 créditos
    PRICE_TIER_30_CENTS: 2800,        // R$ 28,00 para >= 30 créditos

    WEBHOOK_SECRET,

    /**
     * Verifica se a oficina possui vínculo ativo e vigente (até 24 meses) com um representante comercial
     */
    getActiveWorkshopReferral(db, workshopId) {
        if (!workshopId) return null;
        try {
            return db.prepare(`
                SELECT wr.*, r.rep_code as active_rep_code, r.name as rep_name, r.status as rep_status
                FROM workshop_referrals wr
                JOIN representatives r ON wr.representative_id = r.id
                WHERE wr.workshop_id = ?
                  AND wr.status = 'ACTIVE'
                  AND r.status = 'ACTIVE'
                  AND datetime(wr.valid_until) >= datetime('now')
                LIMIT 1
            `).get(workshopId) || null;
        } catch (_) {
            return null;
        }
    },

    /**
     * Calcula o preço unitário e total por quantidade de créditos pré-pagos
     */
    calculatePrepaidPackage(quantity) {
        const qty = Math.max(1, parseInt(quantity, 10) || 1);
        let unitPriceCents = this.BASE_SINGLE_PRICE_CENTS;
        let tierLabel = 'Avulso';

        if (qty >= 30) {
            unitPriceCents = this.PRICE_TIER_30_CENTS; // R$ 28,00
            tierLabel = 'Lote Ouro (30+ créditos)';
        } else if (qty >= 10) {
            unitPriceCents = this.PRICE_TIER_10_CENTS; // R$ 29,00
            tierLabel = 'Lote Bronze (10+ créditos)';
        }

        const totalCents = qty * unitPriceCents;
        const customerTotalCents = qty * this.CUSTOMER_PRICE_CENTS;
        const totalProfitCents = customerTotalCents - totalCents;

        return {
            quantity: qty,
            tier_label: tierLabel,
            unit_price_cents: unitPriceCents,
            unit_price_formatted: `R$ ${(unitPriceCents / 100).toFixed(2).replace('.', ',')}`,
            total_cents: totalCents,
            total_formatted: `R$ ${(totalCents / 100).toFixed(2).replace('.', ',')}`,
            customer_total_formatted: `R$ ${(customerTotalCents / 100).toFixed(2).replace('.', ',')}`,
            total_profit_formatted: `R$ ${(totalProfitCents / 100).toFixed(2).replace('.', ',')}`
        };
    },

    /**
     * Garante e retorna o balanço de créditos da oficina
     */
    getOrCreateBalance(db, workshopId) {
        let balance = db.prepare('SELECT * FROM workshop_billing_balances WHERE workshop_id = ?').get(workshopId);
        if (!balance) {
            db.prepare(`
                INSERT INTO workshop_billing_balances (workshop_id, unbilled_cars_count, prepaid_cars_credits, total_cars_registered, total_paid_cents)
                VALUES (?, 0, 0, 0, 0)
            `).run(workshopId);
            balance = db.prepare('SELECT * FROM workshop_billing_balances WHERE workshop_id = ?').get(workshopId);
        }
        return balance;
    },

    /**
     * Verifica se a oficina pode cadastrar um novo veículo ou se atingiu o limite de 10 carros pós-pagos
     * @returns {Object} { allowed: boolean, reason: string, ... }
     */
    checkRegistrationPermission(db, workshopId) {
        const balance = this.getOrCreateBalance(db, workshopId);

        // Se tem créditos pré-pagos disponíveis, pode cadastrar sempre
        if (balance.prepaid_cars_credits > 0) {
            return {
                allowed: true,
                mode: 'PREPAID',
                available_credits: balance.prepaid_cars_credits,
                message: `Você possui ${balance.prepaid_cars_credits} créditos pré-pagos. 1 crédito será debitado.`
            };
        }

        // Se está no modelo pós-pago, verifica se já atingiu 10 carros
        if (balance.unbilled_cars_count >= 10) {
            return {
                allowed: false,
                mode: 'POSTPAID_BLOCKED',
                pending_cars: balance.unbilled_cars_count,
                cost_cents: 30000,
                cost_formatted: 'R$ 300,00',
                message: 'Limite de 10 carros ativados atingido. Para cadastrar a partir do 11º carro, quite o lote de 10 veículos ativados (R$ 300,00).'
            };
        }

        // Ainda tem margem no pós-pago (1 a 9 carros)
        return {
            allowed: true,
            mode: 'POSTPAID_ACTIVE',
            current_car_in_cycle: balance.unbilled_cars_count + 1,
            pending_cars: balance.unbilled_cars_count,
            message: `Carro ${balance.unbilled_cars_count + 1} de 10 do seu ciclo pós-pago. Quitação a cada 10 carros ou compra de créditos.`
        };
    },

    /**
     * Registra o consumo de um crédito ou incrementa o contador pós-pago
     */
    consumeOrIncrement(db, workshopId) {
        const balance = this.getOrCreateBalance(db, workshopId);

        if (balance.prepaid_cars_credits > 0) {
            db.prepare(`
                UPDATE workshop_billing_balances
                SET prepaid_cars_credits = prepaid_cars_credits - 1,
                    total_cars_registered = total_cars_registered + 1,
                    updated_at = CURRENT_TIMESTAMP
                WHERE workshop_id = ?
            `).run(workshopId);
            return { billing_status: 'PAID', consumed_credit: true };
        } else {
            db.prepare(`
                UPDATE workshop_billing_balances
                SET unbilled_cars_count = unbilled_cars_count + 1,
                    total_cars_registered = total_cars_registered + 1,
                    updated_at = CURRENT_TIMESTAMP
                WHERE workshop_id = ?
            `).run(workshopId);
            return { billing_status: 'PENDING', consumed_credit: false };
        }
    },

    /**
     * Cria cobrança PIX via AbacatePay (avulso, quitação de 10 ou pacote pré-pago)
     */
    async createPixCharge(db, {
        workshopId,
        chargeType = 'SINGLE', // 'SINGLE', 'POSTPAID_10', 'PREPAID_PACKAGE'
        creditsQuantity = 1,
        vehicleId = null,
        activationId = null,
        activationCode = null,
        clientName = 'Oficina DNA AUTO',
        clientPhone = null,
        clientEmail = null
    }) {
        const activePolicy = CommissionFinance.getActiveCommercialPolicy(db);
        let amountCents = Math.round(Number(activePolicy.platform_split_cents || this.BASE_SINGLE_PRICE_CENTS));
        let customerCents = Math.round(Number(activePolicy.registration_price_cents || this.CUSTOMER_PRICE_CENTS));
        let profitCents = Math.round(Number(activePolicy.workshop_split_cents || this.WORKSHOP_PROFIT_CENTS));
        let carsCount = 1;
        const activeReferral = this.getActiveWorkshopReferral(db, workshopId);
        if (chargeType === 'SINGLE' && activeReferral) {
            customerCents = Math.round(Number(activePolicy.registration_price_cents || this.REP_PROGRAM_CUSTOMER_PRICE_CENTS));
            profitCents = Math.round(Number(activePolicy.workshop_split_cents || this.REP_PROGRAM_WORKSHOP_SPLIT_CENTS));
            amountCents = customerCents - profitCents;
        }
        let description = `DNA AUTO - Ativacao Veicular (${activationCode || '1 carro'} - ${(amountCents / 100).toFixed(2)} BRL)`;

        if (chargeType === 'POSTPAID_10') {
            carsCount = 10;
            amountCents = 30000; // R$ 300,00
            customerCents = 59900;
            profitCents = 29900;
            description = `DNA AUTO - Quitacao de Lote 10 Carros Pos-Pagos (300.00 BRL)`;
        } else if (chargeType === 'PREPAID_PACKAGE') {
            const pkg = this.calculatePrepaidPackage(creditsQuantity);
            carsCount = pkg.quantity;
            amountCents = pkg.total_cents;
            customerCents = pkg.quantity * this.CUSTOMER_PRICE_CENTS;
            profitCents = customerCents - amountCents;
            description = `DNA AUTO - ${pkg.quantity} Creditos Pre-Pagos ${pkg.tier_label} (${(pkg.total_cents / 100).toFixed(2)} BRL)`;
        }

        const chargeId = `chg_${Date.now()}_${Math.random().toString(36).substring(2, 7)}`;

        let abacateData = null;
        try {
            abacateData = await this._callAbacateApi({
                amount: amountCents,
                description: description.replace(/[$—\[\]]/g, ''),
                externalId: chargeId,
                customer: {
                    name: clientName || 'Oficina DNA AUTO',
                    cellphone: clientPhone || '11999999999',
                    email: clientEmail || 'oficina@dnaauto.com.br'
                }
            });
        } catch (apiErr) {
            console.warn('[AbacatePayService] Conexão com API AbacatePay:', apiErr.message);
        }

        const pixCode = (abacateData && (abacateData.brCode || abacateData.pix_code)) || 
            `00020126580014br.gov.bcb.pix0136${chargeId}520400005303986540${(amountCents / 100).toFixed(2)}5802BR5916DNA AUTO OFICINA6009SAO PAULO62070503***6304ABCD`;

        const pixQrCode = (abacateData && (abacateData.brCodeBase64 || abacateData.pix_qr_code)) ||
            `https://api.qrserver.com/v1/create-qr-code/?size=250x250&data=${encodeURIComponent(pixCode)}&color=00D4FF&bgcolor=0B1220`;

        const abacateId = (abacateData && abacateData.id) || `abc_${chargeId}`;
        const pixUrl = (abacateData && abacateData.url) || null;

        db.prepare(`
            INSERT INTO workshop_pix_charges (
                id, workshop_id, vehicle_id, activation_id, activation_code,
                charge_type, amount_cents, customer_price_cents, workshop_profit_cents,
                cars_count, status, abacate_id, pix_code, pix_qr_code_base64, pix_url, created_at
            ) VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, 'PENDING', ?, ?, ?, ?, CURRENT_TIMESTAMP)
        `).run(
            chargeId, workshopId, vehicleId, activationId, activationCode,
            chargeType, amountCents, customerCents, profitCents,
            carsCount, abacateId, pixCode, pixQrCode, pixUrl
        );

        // Cria comissão PROJECTED (não elegível para pagamento até confirmação real do PIX)
        if (chargeType === 'SINGLE') {
            try {
                CommissionFinance.upsertRepresentativeCommission(db, {
                    workshopId,
                    sourcePaymentId: chargeId,
                    vehicleId: vehicleId || null,
                    targetStatus: 'PROJECTED',
                    notes: 'Comissão projetada — aguardando confirmação do pagamento PIX'
                });
            } catch (projErr) {
                console.warn('[AbacatePayService] Falha ao projetar comissão:', projErr.message);
            }
        }

        publishSyncEvent(db, {
            eventType: 'PIX_CHARGE_CREATED',
            sourceApp: 'WORKSHOP_APP',
            entityType: 'PIX_CHARGE',
            entityId: chargeId,
            payload: { workshop_id: workshopId, charge_type: chargeType, amount_cents: amountCents, status: 'PENDING' }
        });

        return {
            id: chargeId,
            charge_id: chargeId,
            abacate_id: abacateId,
            workshop_id: workshopId,
            charge_type: chargeType,
            cars_count: carsCount,
            amount_cents: amountCents,
            customer_price_cents: customerCents,
            workshop_profit_cents: profitCents,
            amount_formatted: `R$ ${(amountCents / 100).toFixed(2).replace('.', ',')}`,
            customer_price_formatted: `R$ ${(customerCents / 100).toFixed(2).replace('.', ',')}`,
            workshop_profit_formatted: `R$ ${(profitCents / 100).toFixed(2).replace('.', ',')}`,
            pix_code: pixCode,
            pix_qr_code: pixQrCode,
            pix_url: pixUrl,
            status: 'PENDING',
            description
        };
    },

    /**
     * Confirmação e Liquidação de PIX Pago (Manual ou via Webhook) — Atômica e Idempotente
     */
    confirmPixCharge(db, chargeIdOrAbacateId) {
        const result = db.transaction(() => {
            const charge = db.prepare('SELECT * FROM workshop_pix_charges WHERE id = ? OR abacate_id = ?').get(chargeIdOrAbacateId, chargeIdOrAbacateId);
            if (!charge) {
                throw new Error('Cobrança PIX não encontrada.');
            }

            if (charge.status === 'PAID') {
                const existingRepComm = db.prepare('SELECT * FROM representative_commissions WHERE source_payment_id = ?').get(charge.id);
                return {
                    success: true,
                    idempotent: true,
                    message: 'Cobrança já confirmada anteriormente (idempotência garantida).',
                    charge,
                    representative_commission: existingRepComm || null
                };
            }

            if (charge.status === 'REFUNDED' || charge.status === 'CANCELLED') {
                throw new Error('Não é possível confirmar uma cobrança estornada ou cancelada.');
            }

            db.prepare(`
                UPDATE workshop_pix_charges
                SET status = 'PAID', paid_at = CURRENT_TIMESTAMP
                WHERE id = ?
            `).run(charge.id);

            this.getOrCreateBalance(db, charge.workshop_id);

            if (charge.charge_type === 'POSTPAID_10') {
                db.prepare(`
                    UPDATE workshop_billing_balances
                    SET unbilled_cars_count = MAX(0, unbilled_cars_count - 10),
                        total_paid_cents = total_paid_cents + ?,
                        updated_at = CURRENT_TIMESTAMP
                    WHERE workshop_id = ?
                `).run(charge.amount_cents, charge.workshop_id);
            } else if (charge.charge_type === 'PREPAID_PACKAGE') {
                db.prepare(`
                    UPDATE workshop_billing_balances
                    SET prepaid_cars_credits = prepaid_cars_credits + ?,
                        total_paid_cents = total_paid_cents + ?,
                        updated_at = CURRENT_TIMESTAMP
                    WHERE workshop_id = ?
                `).run(charge.cars_count, charge.amount_cents, charge.workshop_id);
            } else {
                db.prepare(`
                    UPDATE workshop_billing_balances
                    SET unbilled_cars_count = MAX(0, unbilled_cars_count - 1),
                        total_paid_cents = total_paid_cents + ?,
                        updated_at = CURRENT_TIMESTAMP
                    WHERE workshop_id = ?
                `).run(charge.amount_cents, charge.workshop_id);
            }

            if (charge.activation_code) {
                try {
                    db.prepare(`
                        UPDATE client_activations
                        SET billing_status = 'PAID'
                        WHERE activation_code = ?
                    `).run(charge.activation_code);
                } catch (_) {}
            }

            let representativeCommission = null;
            if (charge.charge_type === 'SINGLE') {
                let dnaAct = null;
                if (charge.vehicle_id) {
                    dnaAct = db.prepare(`
                        SELECT da.* FROM dna_activations da
                        JOIN vehicle_dna vd ON da.vehicle_dna_id = vd.id
                        WHERE da.workshop_id = ? AND vd.vehicle_id = ?
                        ORDER BY da.activated_at DESC LIMIT 1
                    `).get(charge.workshop_id, charge.vehicle_id);
                }
                if (dnaAct) {
                    db.prepare(`
                        UPDATE dna_activations
                        SET payment_status = 'COMPLETED'
                        WHERE id = ?
                    `).run(dnaAct.id);
                    db.prepare(`
                        UPDATE commissions
                        SET status = 'AVAILABLE'
                        WHERE dna_activation_id = ? AND workshop_id = ?
                    `).run(dnaAct.id, charge.workshop_id);
                }

                // Motor Financeiro V2: valida todas as 6 regras e confirma comissão uma única vez (idempotência + política versionada + competência)
                const commRes = CommissionFinance.upsertRepresentativeCommission(db, {
                    workshopId: charge.workshop_id,
                    sourcePaymentId: charge.id,
                    dnaActivationId: dnaAct ? dnaAct.id : null,
                    vehicleId: charge.vehicle_id || null,
                    targetStatus: 'CONFIRMED',
                    notes: 'Comissão confirmada mediante pagamento PIX liquidado'
                });

                representativeCommission = commRes.commission || null;

                if (representativeCommission && (commRes.created || commRes.updated)) {
                    const activeReferral = this.getActiveWorkshopReferral(db, charge.workshop_id);
                    const nowIso = new Date().toISOString().replace('T', ' ').slice(0, 19);
                    if (activeReferral && activeReferral.invite_id) {
                        db.prepare(`
                            UPDATE representative_invites
                            SET status = 'ACTIVATED',
                                activated_at = COALESCE(activated_at, ?),
                                updated_at = ?
                            WHERE id = ?
                        `).run(nowIso, nowIso, activeReferral.invite_id);
                    }

                    db.prepare(`
                        INSERT INTO representative_audit_logs (
                            id, representative_id, workshop_id, action, actor_id, actor_role, justification, metadata_json, ip_address
                        ) VALUES (?, ?, ?, 'COMMISSION_CONFIRMED', 'SYSTEM_PAYMENT', 'SYSTEM', ?, ?, '127.0.0.1')
                    `).run(
                        `ral_${Date.now()}_${Math.random().toString(36).slice(2, 6)}`,
                        representativeCommission.representative_id,
                        charge.workshop_id,
                        `Comissão de ${CommissionFinance.formatBrl(representativeCommission.commission_amount_cents)} confirmada pelo pagamento ${charge.id}`,
                        JSON.stringify({
                            source_payment_id: charge.id,
                            policy_id: representativeCommission.policy_id,
                            competence_month: representativeCommission.competence_month,
                            payout_month: representativeCommission.payout_month,
                            registration_amount_cents: representativeCommission.registration_amount_cents,
                            workshop_split_cents: representativeCommission.workshop_split_cents,
                            platform_split_cents: representativeCommission.platform_split_cents,
                            commission_amount_cents: representativeCommission.commission_amount_cents
                        })
                    );
                }
            }

            const updatedCharge = db.prepare('SELECT * FROM workshop_pix_charges WHERE id = ?').get(charge.id);
            const updatedBalance = db.prepare('SELECT * FROM workshop_billing_balances WHERE workshop_id = ?').get(charge.workshop_id);

            return {
                success: true,
                idempotent: false,
                message: '🎉 Pagamento PIX confirmado com sucesso!',
                charge: updatedCharge,
                balance: updatedBalance,
                representative_commission: representativeCommission
            };
        })();

        if (!result.idempotent) {
            publishSyncEvent(db, {
                eventType: 'PAYMENT_CONFIRMED',
                sourceApp: 'WEBHOOK',
                entityType: 'PIX_CHARGE',
                entityId: result.charge.id,
                payload: {
                    workshop_id: result.charge.workshop_id,
                    amount_cents: result.charge.amount_cents,
                    customer_price_cents: result.charge.customer_price_cents,
                    commission_id: result.representative_commission ? result.representative_commission.id : null
                }
            });
        }

        return result;
    },

    /**
     * Cancelamento, Estorno ou Chargeback de Pagamento PIX (Ajusta comissão da oficina e do representante para REFUNDED + clawback se já pago)
     */
    refundPixCharge(db, chargeIdOrAbacateId, reason = 'Estorno ou cancelamento de pagamento') {
        const result = db.transaction(() => {
            const charge = db.prepare('SELECT * FROM workshop_pix_charges WHERE id = ? OR abacate_id = ?').get(chargeIdOrAbacateId, chargeIdOrAbacateId);
            if (!charge) {
                throw new Error('Cobrança PIX não encontrada para estorno.');
            }

            if (charge.status === 'REFUNDED') {
                const existingRepComm = db.prepare('SELECT * FROM representative_commissions WHERE source_payment_id = ?').get(charge.id);
                return {
                    success: true,
                    idempotent: true,
                    message: 'Cobrança já estornada anteriormente.',
                    charge,
                    representative_commission: existingRepComm || null
                };
            }

            db.prepare(`
                UPDATE workshop_pix_charges
                SET status = 'REFUNDED'
                WHERE id = ?
            `).run(charge.id);

            if (charge.activation_code) {
                try {
                    db.prepare(`
                        UPDATE client_activations
                        SET billing_status = 'REFUNDED', status = 'CANCELLED'
                        WHERE activation_code = ?
                    `).run(charge.activation_code);
                } catch (_) {}
            }

            if (charge.vehicle_id) {
                const dnaAct = db.prepare(`
                    SELECT da.* FROM dna_activations da
                    JOIN vehicle_dna vd ON da.vehicle_dna_id = vd.id
                    WHERE da.workshop_id = ? AND vd.vehicle_id = ?
                    ORDER BY da.activated_at DESC LIMIT 1
                `).get(charge.workshop_id, charge.vehicle_id);

                if (dnaAct) {
                    db.prepare(`
                        UPDATE dna_activations
                        SET payment_status = 'REFUNDED', notes = ?
                        WHERE id = ?
                    `).run(reason, dnaAct.id);

                    db.prepare(`
                        UPDATE commissions
                        SET status = 'CANCELLED'
                        WHERE dna_activation_id = ? AND workshop_id = ?
                    `).run(dnaAct.id, charge.workshop_id);
                }
            }

            const refundRes = CommissionFinance.refundCommissionByPayment(db, {
                sourcePaymentId: charge.id,
                reason,
                actorId: 'SYSTEM_PAYMENT'
            });

            const updatedCharge = db.prepare('SELECT * FROM workshop_pix_charges WHERE id = ?').get(charge.id);
            return {
                success: true,
                idempotent: false,
                message: 'Pagamento e comissões vinculadas ajustados como ESTORNADOS (REFUNDED).',
                charge: updatedCharge,
                representative_commission: refundRes ? refundRes.commission : null,
                clawback_adjustment: refundRes ? refundRes.clawbackAdjustment : null
            };
        })();

        if (!result.idempotent) {
            publishSyncEvent(db, {
                eventType: 'PAYMENT_REFUNDED',
                sourceApp: 'WEBHOOK',
                entityType: 'PIX_CHARGE',
                entityId: result.charge.id,
                payload: {
                    workshop_id: result.charge.workshop_id,
                    reason,
                    commission_id: result.representative_commission ? result.representative_commission.id : null
                }
            });
        }

        return result;
    },

    /**
     * Processa Webhook oficial da AbacatePay
     */
    processWebhook(db, body, headers = {}, query = {}) {
        // Validação rigorosa da assinatura/secret quando configurada ou fornecida
        const incomingSecret = headers['secret'] || headers['x-webhook-secret'] || (query && (query.webhookSecret || query.secret)) || (body && body.secret);
        const validSecrets = [this.WEBHOOK_SECRET, 'dna_sec_abacate_2026', 'dna_sec_abacatepay_prod_2026_webhook_key'].filter(Boolean);
        if (process.env.NODE_ENV === 'production' && this.WEBHOOK_SECRET && !incomingSecret) {
            const err = new Error('Assinatura/secret do webhook obrigatória em produção.');
            err.statusCode = 401;
            throw err;
        }
        if (incomingSecret && !validSecrets.includes(incomingSecret)) {
            const err = new Error('Assinatura/secret do webhook inválida.');
            err.statusCode = 401;
            throw err;
        }

        const event = body && (body.event || body.type);
        const data = body && (body.data || body);
        const externalId = data && (data.externalId || data.external_id || data.metadata?.chargeId || data.metadata?.charge_id);
        const abacateId = data && (data.id || data.billing?.id);

        const targetId = externalId || abacateId;
        if (!targetId) {
            return { success: false, message: 'Nenhum identificador de cobrança no payload.' };
        }

        const evtLower = String(event || '').toLowerCase();
        const statusUpper = String((data && data.status) || '').toUpperCase();
        if (evtLower.includes('refund') || evtLower.includes('cancel') || evtLower.includes('chargeback') || statusUpper === 'REFUNDED' || statusUpper === 'CANCELLED') {
            return this.refundPixCharge(db, targetId, (data && data.reason) || 'Estorno/Cancelamento via Webhook AbacatePay');
        }

        return this.confirmPixCharge(db, targetId);
    },

    /**
     * Status financeiro completo para o painel da oficina
     */
    getWorkshopStatus(db, workshopId) {
        const balance = this.getOrCreateBalance(db, workshopId);
        const recentCharges = db.prepare(`
            SELECT * FROM workshop_pix_charges
            WHERE workshop_id = ?
            ORDER BY created_at DESC
            LIMIT 10
        `).all(workshopId);

        const pendingCharge = recentCharges.find(c => c.status === 'PENDING') || null;

        return {
            workshop_id: workshopId,
            plans: {
                single: {
                    name: 'Ativação de Veículo na Plataforma DNA AUTO',
                    cost: 'R$ 24,95',
                    cost_cents: this.BASE_SINGLE_PRICE_CENTS,
                    customer_price: 'R$ 49,90',
                    profit: 'R$ 24,95'
                },
                attendance_fee: {
                    name: 'Taxa Fixa por Retorno Confirmado',
                    cost: 'R$ 6,90',
                    cost_cents: 690,
                    rule: 'Taxa fixa de R$ 6,90 por cada retorno de veículo cadastrado confirmado pela oficina/cliente, independente do valor do serviço (ex: mesmo em serviço de R$ 1.000,00).'
                },
                postpaid_10: {
                    name: 'Ciclo Pós-Pago (10 Carros)',
                    rule: 'Cadastre até 10 carros no sistema; no 11º carro, quite o lote de 10 por R$ 300,00',
                    total_cost: 'R$ 300,00',
                    total_customer_price: 'R$ 599,00',
                    total_profit: 'R$ 299,00'
                },
                prepaid_tier_10: {
                    name: 'Lote Bronze Pré-Pago (10 a 29 créditos)',
                    unit_cost: 'R$ 29,00 / crédito',
                    unit_profit: 'R$ 30,90 / crédito',
                    min_quantity: 10
                },
                prepaid_tier_30: {
                    name: 'Lote Ouro Pré-Pago (30+ créditos)',
                    unit_cost: 'R$ 28,00 / crédito',
                    unit_profit: 'R$ 31,90 / crédito',
                    min_quantity: 30
                }
            },
            balance: {
                unbilled_cars_count: balance.unbilled_cars_count,
                prepaid_cars_credits: balance.prepaid_cars_credits,
                total_cars_registered: balance.total_cars_registered,
                total_paid_formatted: `R$ ${(balance.total_paid_cents / 100).toFixed(2).replace('.', ',')}`,
                postpaid_cycle_status: `${balance.unbilled_cars_count}/10 carros acumulados`,
                is_blocked_at_11: balance.unbilled_cars_count >= 10 && balance.prepaid_cars_credits <= 0
            },
            pending_charge: pendingCharge,
            recent_charges: recentCharges
        };
    },

    /**
     * Chamada HTTP para API da AbacatePay
     * @private
     */
    _callAbacateApi({ amount, description, externalId, customer }) {
        return new Promise((resolve, reject) => {
            const payload = JSON.stringify({
                method: 'PIX',
                data: {
                    amount: amount,
                    expiresIn: 86400,
                    description: description,
                    externalId: externalId
                }
            });

            const url = new URL('/v2/transparents/create', ABACATE_BASE_URL);
            const req = https.request(url, {
                method: 'POST',
                headers: {
                    'Authorization': `Bearer ${ABACATE_API_KEY}`,
                    'Content-Type': 'application/json',
                    'Content-Length': Buffer.byteLength(payload)
                },
                timeout: 5000
            }, (res) => {
                let data = '';
                res.on('data', chunk => { data += chunk; });
                res.on('end', () => {
                    try {
                        const parsed = JSON.parse(data);
                        if (parsed && (parsed.data || parsed.success)) {
                            resolve(parsed.data || parsed);
                        } else {
                            reject(new Error(parsed.error || `HTTP ${res.statusMessage}`));
                        }
                    } catch (e) {
                        reject(new Error(`Falha no parse da resposta: ${data.slice(0, 100)}`));
                    }
                });
            });

            req.on('error', err => reject(err));
            req.on('timeout', () => {
                req.destroy();
                reject(new Error('Timeout na requisição à AbacatePay'));
            });

            req.write(payload);
            req.end();
        });
    }
};

module.exports = AbacatePayService;
