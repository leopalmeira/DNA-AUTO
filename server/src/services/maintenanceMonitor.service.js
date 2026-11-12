/**
 * DNA AUTO — Monitor Automático de Manutenção Preventiva e Agenda Diária em PDF
 *
 * Fluxo autônomo:
 * - 10h00 (America/Sao_Paulo): varre veículos com manutenção preventiva vencida/próxima
 *   (ex: Troca de Óleo, Correia Dentada) e envia convite via WhatsApp com 3 datas úteis
 *   (Segunda a Sexta 08h-18h, Sábado até 11h).
 * - 17h00 (America/Sao_Paulo): compila os agendamentos confirmados para o próximo dia útil
 *   em PDF e envia para o WhatsApp oficial da oficina (controle idempotente por data).
 */

const crypto = require('crypto');
const db = require('../database/db');
const PredictiveMaintenanceService = require('./predictiveMaintenance.service');
const { generateDailyAgendaPdf, formatDateBr } = require('./agendaPdf.service');
const {
    getSaoPauloNow,
    getNextWorkingDates,
    buildOutreachMessage,
    normalizePhoneDigits
} = require('./whatsappBotAgent.service');

let schedulerTimer = null;
let lastMorningRunDate = null;
let lastEveningRunDate = null;

function getBaileysService() {
    // Carregamento sob demanda para evitar dependência circular com baileys.service.js
    return require('../modules/workshops/baileys.service');
}

function getWorkshopVehiclesDueForMaintenance(workshopId) {
    const vehicles = db.prepare(`
        SELECT DISTINCT
            v.id,
            v.license_plate,
            v.brand,
            v.model,
            v.model_year,
            COALESCE(o.name, u.name, 'Cliente') AS owner_name,
            COALESCE(o.phone, u.phone, '') AS owner_phone,
            COALESCE(
                (SELECT MAX(mileage) FROM mileage_records WHERE vehicle_id = v.id),
                (SELECT MAX(mileage) FROM service_records WHERE vehicle_id = v.id),
                0
            ) AS current_mileage
        FROM vehicles v
        LEFT JOIN vehicle_dna vd ON vd.vehicle_id = v.id
        LEFT JOIN ownership_transfers ot ON ot.vehicle_id = v.id AND ot.status = 'COMPLETED'
        LEFT JOIN owners o ON o.id = ot.new_owner_id
        LEFT JOIN users u ON u.id = o.user_id
        LEFT JOIN service_records sr ON sr.vehicle_id = v.id
        LEFT JOIN workshop_appointments wa ON wa.vehicle_id = v.id
        WHERE sr.workshop_id = ?
           OR vd.activated_by_workshop_id = ?
           OR wa.workshop_id = ?
    `).all(workshopId, workshopId, workshopId);

    const candidates = [];

    for (const veh of vehicles) {
        const cleanPhone = normalizePhoneDigits(veh.owner_phone);
        if (!cleanPhone || cleanPhone.length < 10) continue;

        const currentKm = Number(veh.current_mileage || 0);
        if (currentKm <= 0) continue;

        const queryPrediction = () => db.prepare(`
            SELECT item_code, item_name, alert_status AS status, remaining_km_min AS remaining_km, next_due_km
            FROM vehicle_maintenance_predictions
            WHERE vehicle_id = ?
              AND alert_status IN ('VENCIDA', 'RECOMENDADA', 'APROXIMANDO')
            ORDER BY
              CASE alert_status
                WHEN 'VENCIDA' THEN 1
                WHEN 'RECOMENDADA' THEN 2
                ELSE 3
              END ASC,
              COALESCE(remaining_km_min, 999999) ASC
            LIMIT 1
        `).get(veh.id);

        let predictions = queryPrediction();

        if (!predictions) {
            try {
                PredictiveMaintenanceService.recalculatePredictions(db, veh.id);
                predictions = queryPrediction();
            } catch (_) {}
        }

        // Fallback direto para Óleo (10k) e Correia Dentada (60k) caso maintenance_rules não tenha regras cadastradas
        if (!predictions) {
            const lastBelt = db.prepare(`
                SELECT mileage FROM service_records
                WHERE vehicle_id = ? AND (LOWER(service_title) LIKE '%correia%' OR LOWER(category) LIKE '%correia%')
                ORDER BY mileage DESC LIMIT 1
            `).get(veh.id);
            const nextBeltKm = (lastBelt ? Number(lastBelt.mileage) : 0) + 60000;
            const remainingBelt = nextBeltKm - currentKm;

            if (remainingBelt <= 4000) {
                predictions = {
                    item_code: 'CORREIA_DENTADA',
                    item_name: 'Kit Correia Dentada & Tensores',
                    status: remainingBelt <= 0 ? 'VENCIDA' : 'RECOMENDADA',
                    remaining_km: remainingBelt,
                    next_due_km: nextBeltKm
                };
            } else {
                const lastOil = db.prepare(`
                    SELECT mileage FROM service_records
                    WHERE vehicle_id = ? AND (LOWER(service_title) LIKE '%óleo%' OR LOWER(service_title) LIKE '%oleo%' OR LOWER(category) LIKE '%óleo%')
                    ORDER BY mileage DESC LIMIT 1
                `).get(veh.id);
                const nextOilKm = (lastOil ? Number(lastOil.mileage) : Math.floor(currentKm / 10000) * 10000) + 10000;
                const remainingOil = nextOilKm - currentKm;

                if (remainingOil <= 1500) {
                    predictions = {
                        item_code: 'TROCA_OLEO',
                        item_name: 'Troca de Óleo do Motor e Filtros',
                        status: remainingOil <= 0 ? 'VENCIDA' : 'APROXIMANDO',
                        remaining_km: remainingOil,
                        next_due_km: nextOilKm
                    };
                }
            }
        }

        if (predictions) {
            candidates.push({
                ...veh,
                owner_phone: cleanPhone,
                current_km: currentKm,
                item_code: predictions.item_code,
                item_name: predictions.item_name,
                prediction_status: predictions.status,
                remaining_km: predictions.remaining_km
            });
        }
    }

    return candidates;
}

/**
 * Executa o disparo matinal (10h00) oferecendo 3 datas úteis (Seg-Sex e Sábado até 11h).
 */
async function runMorningOutreach({ workshopId = null, force = false, baseDate = null } = {}) {
    const now = getSaoPauloNow();
    const referenceDate = baseDate || now.isoDate;
    const offeredDates = getNextWorkingDates(referenceDate, 3);

    const workshops = workshopId
        ? db.prepare(`SELECT id, trade_name, phone, whatsapp_official, status FROM workshops WHERE id = ?`).all(workshopId)
        : db.prepare(`SELECT id, trade_name, phone, whatsapp_official, status FROM workshops WHERE status = 'ACTIVE'`).all();

    const baileys = getBaileysService();
    const createdCampaigns = [];
    let skippedCount = 0;

    for (const ws of workshops) {
        const dueVehicles = getWorkshopVehiclesDueForMaintenance(ws.id);

        for (const veh of dueVehicles) {
            // Verifica se já existe agendamento futuro confirmado/agendado para esta placa
            const existingAppointment = db.prepare(`
                SELECT id FROM workshop_appointments
                WHERE workshop_id = ?
                  AND license_plate = ?
                  AND appointment_date >= ?
                  AND status IN ('CONFIRMED', 'SCHEDULED')
                LIMIT 1
            `).get(ws.id, veh.license_plate, referenceDate);

            if (existingAppointment && !force) {
                skippedCount++;
                continue;
            }

            // Cooldown: não reenvia se houver campanha ativa nos últimos 14 dias
            const activeCampaign = db.prepare(`
                SELECT id FROM maintenance_bot_campaigns
                WHERE workshop_id = ?
                  AND vehicle_id = ?
                  AND item_code = ?
                  AND status IN ('SENT', 'IN_CONVERSATION')
                  AND datetime(sent_at) >= datetime('now', '-14 days')
                LIMIT 1
            `).get(ws.id, veh.id, veh.item_code);

            if (activeCampaign) {
                skippedCount++;
                continue;
            }

            const message = await buildOutreachMessage({
                workshopName: ws.trade_name || 'Oficina Credenciada DNA AUTO',
                ownerName: veh.owner_name,
                vehicleModel: `${veh.brand} ${veh.model}`,
                licensePlate: veh.license_plate,
                itemName: veh.item_name,
                currentKm: veh.current_km,
                statusLabel: veh.prediction_status,
                offeredDates
            });

            const campaignId = `botcamp_${crypto.randomBytes(6).toString('hex')}`;

            db.prepare(`
                INSERT INTO maintenance_bot_campaigns (
                    id, workshop_id, vehicle_id, license_plate, vehicle_model,
                    owner_name, owner_phone, item_code, item_name, current_km,
                    offered_dates_json, status, last_message, ai_notes
                ) VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, 'SENT', ?, ?)
            `).run(
                campaignId,
                ws.id,
                veh.id,
                veh.license_plate,
                `${veh.brand} ${veh.model}`.trim(),
                veh.owner_name,
                veh.owner_phone,
                veh.item_code,
                veh.item_name,
                veh.current_km,
                JSON.stringify(offeredDates),
                message,
                `Disparo preventivo (${veh.prediction_status})`
            );

            await baileys.enqueueMessage({
                workshopId: ws.id,
                recipientPhone: veh.owner_phone,
                recipientName: veh.owner_name,
                message,
                vehicleId: veh.id,
                serviceType: veh.item_name,
                licensePlate: veh.license_plate,
                mediaType: 'TEXT'
            });

            createdCampaigns.push({
                id: campaignId,
                workshopId: ws.id,
                licensePlate: veh.license_plate,
                ownerName: veh.owner_name,
                ownerPhone: veh.owner_phone,
                itemName: veh.item_name,
                offeredDates
            });
        }
    }

    return {
        referenceDate,
        offeredDates,
        processedWorkshops: workshops.length,
        sentCount: createdCampaigns.length,
        skippedCount,
        campaigns: createdCampaigns
    };
}

/**
 * Compila os veículos confirmados/agendados do próximo dia útil em PDF e envia
 * para o WhatsApp oficial da oficina às 17h00. Idempotente por (workshop_id, target_date).
 */
async function runEveningAgendaPdf({ workshopId = null, targetDate = null, force = false } = {}) {
    const now = getSaoPauloNow();
    const resolvedTargetDate = targetDate || getNextWorkingDates(now.isoDate, 1)[0]?.date || now.isoDate;

    const workshops = workshopId
        ? db.prepare(`SELECT id, trade_name, phone, whatsapp_official, city, state, status FROM workshops WHERE id = ?`).all(workshopId)
        : db.prepare(`SELECT id, trade_name, phone, whatsapp_official, city, state, status FROM workshops WHERE status = 'ACTIVE'`).all();

    const baileys = getBaileysService();
    const dispatches = [];

    for (const ws of workshops) {
        const alreadySent = db.prepare(`
            SELECT * FROM daily_agenda_dispatches
            WHERE workshop_id = ? AND target_date = ? AND status = 'SENT'
        `).get(ws.id, resolvedTargetDate);

        if (alreadySent && !force) {
            dispatches.push({
                workshopId: ws.id,
                targetDate: resolvedTargetDate,
                skipped: true,
                reason: 'ALREADY_SENT',
                dispatch: alreadySent
            });
            continue;
        }

        const appointments = db.prepare(`
            SELECT wa.*, v.brand AS vehicle_brand, v.model AS vehicle_model
            FROM workshop_appointments wa
            LEFT JOIN vehicles v ON v.license_plate = wa.license_plate
            WHERE wa.workshop_id = ?
              AND wa.appointment_date = ?
              AND wa.status IN ('CONFIRMED', 'SCHEDULED')
            ORDER BY wa.appointment_time ASC, wa.created_at ASC
        `).all(ws.id, resolvedTargetDate);

        const pdfResult = await generateDailyAgendaPdf({
            workshop: ws,
            targetDate: resolvedTargetDate,
            appointments
        });

        const recipientPhone = normalizePhoneDigits(ws.whatsapp_official || ws.phone);
        const dateBr = formatDateBr(resolvedTargetDate);
        const caption = appointments.length > 0
            ? `📋 *Agenda DNA AUTO — ${dateBr}*\nOlá equipe *${ws.trade_name}*! Segue em anexo o PDF com *${appointments.length} veículo(s) agendado(s)* para o próximo expediente.`
            : `📋 *Agenda DNA AUTO — ${dateBr}*\nOlá equipe *${ws.trade_name}*! Nenhum veículo confirmado até o momento para ${dateBr}. Segue o relatório zerado de controle.`;

        let dispatchStatus = 'SENT';
        let dispatchError = null;

        if (recipientPhone && recipientPhone.length >= 10) {
            await baileys.enqueueMessage({
                workshopId: ws.id,
                recipientPhone,
                recipientName: ws.trade_name,
                message: caption,
                mediaType: 'DOCUMENT',
                mediaUrl: pdfResult.relativeUrl,
                fileName: pdfResult.fileName,
                serviceType: `AGENDA_PDF_${resolvedTargetDate}`
            });
        } else {
            dispatchStatus = 'NO_PHONE';
            dispatchError = 'Oficina sem WhatsApp oficial/telefone cadastrado';
        }

        const dispatchId = `agdisp_${crypto.randomBytes(6).toString('hex')}`;
        db.prepare(`
            INSERT INTO daily_agenda_dispatches (
                id, workshop_id, target_date, appointments_count, pdf_path, recipient_phone, status, error, sent_at
            ) VALUES (?, ?, ?, ?, ?, ?, ?, ?, CURRENT_TIMESTAMP)
            ON CONFLICT(workshop_id, target_date) DO UPDATE SET
                appointments_count = excluded.appointments_count,
                pdf_path = excluded.pdf_path,
                recipient_phone = excluded.recipient_phone,
                status = excluded.status,
                error = excluded.error,
                sent_at = CURRENT_TIMESTAMP
        `).run(
            dispatchId,
            ws.id,
            resolvedTargetDate,
            appointments.length,
            pdfResult.relativeUrl,
            recipientPhone || null,
            dispatchStatus,
            dispatchError
        );

        dispatches.push({
            workshopId: ws.id,
            workshopName: ws.trade_name,
            targetDate: resolvedTargetDate,
            appointmentsCount: appointments.length,
            pdfUrl: pdfResult.relativeUrl,
            fileName: pdfResult.fileName,
            recipientPhone: recipientPhone || null,
            status: dispatchStatus,
            skipped: false
        });
    }

    return {
        targetDate: resolvedTargetDate,
        dispatches
    };
}

/**
 * Inicia o agendador nativo do processo Node.js (10h00 e 17h00 America/Sao_Paulo).
 */
function startMaintenanceScheduler() {
    if (process.env.NODE_ENV === 'test') {
        return null;
    }
    if (schedulerTimer) {
        return schedulerTimer;
    }

    const tick = async () => {
        try {
            const now = getSaoPauloNow();
            // 10:00-10:04 -> Disparo preventivo de 3 datas úteis
            if (now.hour === 10 && now.minute < 5 && lastMorningRunDate !== now.isoDate) {
                lastMorningRunDate = now.isoDate;
                const result = await runMorningOutreach({ baseDate: now.isoDate });
                console.log(`🤖 [Scheduler 10h] Campanhas preventivas enviadas: ${result.sentCount}`);
            }

            // 17:00-17:04 -> PDF consolidado dos agendamentos do próximo dia útil para a oficina
            if (now.hour === 17 && now.minute < 5 && lastEveningRunDate !== now.isoDate) {
                lastEveningRunDate = now.isoDate;
                const result = await runEveningAgendaPdf({});
                console.log(`📄 [Scheduler 17h] PDFs de agenda enviados para ${result.dispatches.length} oficina(s)`);
            }
        } catch (err) {
            console.warn('⚠️ [MaintenanceScheduler] Erro no ciclo automático:', err.message);
        }
    };

    schedulerTimer = setInterval(tick, 60 * 1000);
    if (typeof schedulerTimer.unref === 'function') {
        schedulerTimer.unref();
    }
    console.log('⏰ [MaintenanceScheduler] Agendador ativo (10h00 Bot Preventivo / 17h00 PDF Oficina).');
    return schedulerTimer;
}

function stopMaintenanceScheduler() {
    if (schedulerTimer) {
        clearInterval(schedulerTimer);
        schedulerTimer = null;
    }
}

module.exports = {
    getWorkshopVehiclesDueForMaintenance,
    runMorningOutreach,
    runEveningAgendaPdf,
    startMaintenanceScheduler,
    stopMaintenanceScheduler
};
