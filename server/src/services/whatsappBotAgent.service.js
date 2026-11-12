/**
 * DNA AUTO — Agente Conversacional WhatsApp de Manutenção e Agendamento
 * Usa Google Gemini API (quando GEMINI_API_KEY configurada) com fallback determinístico em PT-BR
 * e validação rígida das regras de negócio (Seg-Sex 08h-18h, Sábado até 11h, Domingo fechado).
 */

const db = require('../database/db');

const WEEKDAY_NAMES_PT = ['Domingo', 'Segunda-feira', 'Terça-feira', 'Quarta-feira', 'Quinta-feira', 'Sexta-feira', 'Sábado'];

/**
 * Retorna data/hora atual no fuso oficial de Brasília (America/Sao_Paulo).
 */
function getSaoPauloNow(referenceDate = new Date()) {
    const parts = new Intl.DateTimeFormat('en-CA', {
        timeZone: 'America/Sao_Paulo',
        year: 'numeric',
        month: '2-digit',
        day: '2-digit',
        hour: '2-digit',
        minute: '2-digit',
        second: '2-digit',
        hour12: false
    }).formatToParts(referenceDate);

    const map = {};
    parts.forEach(p => { map[p.type] = p.value; });
    const isoDate = `${map.year}-${map.month}-${map.day}`;
    const hour = Number(map.hour === '24' ? '0' : map.hour);
    const minute = Number(map.minute);

    return {
        isoDate,
        hour,
        minute,
        timeStr: `${String(hour).padStart(2, '0')}:${String(minute).padStart(2, '0')}`
    };
}

/**
 * Soma N dias a uma data YYYY-MM-DD em UTC seguro.
 */
function addDaysIso(isoDate, days) {
    const [y, m, d] = isoDate.split('-').map(Number);
    const dt = new Date(Date.UTC(y, m - 1, d + days, 12, 0, 0));
    return dt.toISOString().split('T')[0];
}

function getDayOfWeekIso(isoDate) {
    const [y, m, d] = isoDate.split('-').map(Number);
    return new Date(Date.UTC(y, m - 1, d, 12, 0, 0)).getUTCDay();
}

function formatShortBr(isoDate) {
    const [, m, d] = isoDate.split('-');
    return `${d}/${m}`;
}

/**
 * Gera as próximas `count` datas úteis a partir de D+1:
 * Segunda a Sexta (08:00-18:00) e Sábado até 11:00 (Domingo é pulado).
 */
function getNextWorkingDates(baseIsoDate, count = 3) {
    const base = baseIsoDate || getSaoPauloNow().isoDate;
    const dates = [];
    let offset = 1;

    while (dates.length < count && offset < 21) {
        const candidate = addDaysIso(base, offset);
        const dow = getDayOfWeekIso(candidate);
        if (dow !== 0) {
            const isSaturday = dow === 6;
            const weekday = WEEKDAY_NAMES_PT[dow];
            const dateBr = formatShortBr(candidate);
            const label = isSaturday
                ? `${weekday} (${dateBr}) • até 11h00`
                : `${weekday} (${dateBr}) • 08h às 18h`;
            dates.push({
                index: dates.length + 1,
                date: candidate,
                dateBr,
                weekday,
                dayOfWeek: dow,
                isSaturday,
                openHour: '08:00',
                closeHour: isSaturday ? '11:00' : '18:00',
                defaultTime: '09:00',
                label
            });
        }
        offset++;
    }

    return dates;
}

function normalizePhoneDigits(phone) {
    const digits = String(phone || '').replace(/\D/g, '');
    if (!digits) return '';
    return digits.length >= 10 && !digits.startsWith('55') ? `55${digits}` : digits;
}

function buildPhoneMatchSuffix(phone) {
    const digits = String(phone || '').replace(/\D/g, '');
    return digits.length > 8 ? digits.slice(-8) : digits;
}

/**
 * Normaliza e extrai horário (HH:MM) de texto em PT-BR.
 */
function extractRequestedTime(text) {
    const lower = String(text || '').toLowerCase();

    const hmMatch = lower.match(/(?:\b(?:as|às|para|pra)?\s*)([01]?\d|2[0-3])\s*(?:h|:|horas?)\s*([0-5]\d)?\b/);
    if (hmMatch) {
        const hh = Number(hmMatch[1]);
        const mm = hmMatch[2] ? Number(hmMatch[2]) : 0;
        if (hh >= 7 && hh <= 19) {
            return {
                time: `${String(hh).padStart(2, '0')}:${String(mm).padStart(2, '0')}`,
                isAfternoon: hh >= 12
            };
        }
    }

    if (/\b(de\s+tarde|à\s+tarde|a\s+tarde|tarde)\b/.test(lower)) {
        return { time: '14:00', isAfternoon: true };
    }
    if (/\b(de\s+manh[ãa]|pela\s+manh[ãa]|manh[ãa]|cedo|primeiro\s+hor[áa]rio)\b/.test(lower)) {
        return { time: '09:00', isAfternoon: false };
    }

    return { time: null, isAfternoon: false };
}

/**
 * Parser determinístico para identificar escolha entre as 3 datas oferecidas ou intenção de recusa.
 */
function parseClientReplyDeterministic(messageText, offeredDates = []) {
    const raw = String(messageText || '').trim();
    const lower = raw.toLowerCase().normalize('NFD').replace(/[\u0300-\u036f]/g, '');

    if (!lower) return { intent: 'CLARIFY', chosenOption: null, timeInfo: { time: null, isAfternoon: false } };

    // 1. Detectar recusa / opt-out
    if (/\b(nao quero|não quero|parar|cancelar|desistir|outro mes|sem interesse|agora nao|agora não)\b/.test(lower)) {
        return { intent: 'DECLINE', chosenOption: null, timeInfo: { time: null, isAfternoon: false } };
    }

    const timeInfo = extractRequestedTime(raw);
    let chosenOption = null;

    // 2. Correspondência direta por data DD/MM
    const dateMatch = lower.match(/\b(\d{1,2})\/(\d{1,2})\b/);
    if (dateMatch) {
        const dStr = String(Number(dateMatch[1])).padStart(2, '0');
        const mStr = String(Number(dateMatch[2])).padStart(2, '0');
        const brTarget = `${dStr}/${mStr}`;
        chosenOption = offeredDates.find(o => o.dateBr === brTarget) || null;
    }

    // 3. Correspondência por número de opção (1, 2, 3) — evitando confundir com hora ("10h")
    if (!chosenOption) {
        const cleanedForOpt = lower.replace(/\b\d{1,2}\s*(h|:|horas)\s*\d{0,2}\b/g, ' ');
        if (/\b(1|opcao 1|primeira|primeiro)\b/.test(cleanedForOpt)) {
            chosenOption = offeredDates[0] || null;
        } else if (/\b(2|opcao 2|segunda opcao|segundo dia)\b/.test(cleanedForOpt)) {
            chosenOption = offeredDates[1] || null;
        } else if (/\b(3|opcao 3|terceira|terceiro)\b/.test(cleanedForOpt)) {
            chosenOption = offeredDates[2] || null;
        }
    }

    // 4. Correspondência por "amanha", "depois de amanha" ou dia da semana
    if (!chosenOption) {
        if (/\bdepois de amanha\b/.test(lower) && offeredDates[1]) {
            chosenOption = offeredDates[1];
        } else if (/\bamanha\b/.test(lower) && offeredDates[0]) {
            chosenOption = offeredDates[0];
        } else {
            const weekdayTokens = [
                { dow: 1, rx: /\bsegunda\b/ },
                { dow: 2, rx: /\bterca\b/ },
                { dow: 3, rx: /\bquarta\b/ },
                { dow: 4, rx: /\bquinta\b/ },
                { dow: 5, rx: /\bsexta\b/ },
                { dow: 6, rx: /\bsabado\b/ }
            ];
            for (const wt of weekdayTokens) {
                if (wt.rx.test(lower)) {
                    chosenOption = offeredDates.find(o => o.dayOfWeek === wt.dow) || null;
                    if (chosenOption) break;
                }
            }
        }
    }

    // 5. Se o cliente apenas respondeu "sim" / "pode agendar" sem escolher data, pedir escolha ou confirmar 1ª opção se já estava combinada
    if (!chosenOption && /\b(sim|pode ser|quero|confirmo|ok|beleza|fechado|bora)\b/.test(lower)) {
        return { intent: 'ASK_WHICH_DATE', chosenOption: null, timeInfo };
    }

    if (chosenOption) {
        return { intent: 'CONFIRM_DATE', chosenOption, timeInfo };
    }

    return { intent: 'CLARIFY', chosenOption: null, timeInfo };
}

/**
 * Consulta Google Gemini API (gemini-2.5-flash) para gerar resposta natural e estruturar intenção.
 * Ativada apenas quando process.env.GEMINI_API_KEY estiver configurada e fora de testes unitários offline.
 */
async function analyzeReplyWithGemini({ workshopName, campaign, offeredDates, clientMessage }) {
    const apiKey = (process.env.GEMINI_API_KEY || '').trim();
    if (!apiKey || process.env.NODE_ENV === 'test') {
        return null;
    }

    try {
        const prompt = `Você é o assistente virtual oficial da oficina "${workshopName}" no sistema DNA AUTO.
Responda em português do Brasil, de forma educada, curta e natural (estilo WhatsApp).

Dados do atendimento:
- Cliente: ${campaign.owner_name || 'Cliente'}
- Veículo: ${campaign.vehicle_model || 'Veículo'} (Placa: ${campaign.license_plate})
- Serviço Preventivo: ${campaign.item_name}
- Regras da oficina: Segunda a Sexta das 08:00 às 18:00. Sábado somente até 11:00. Domingo fechado.
- 3 datas disponíveis oferecidas:
${offeredDates.map(d => `  Opção ${d.index}: ${d.date} (${d.weekday}, ${d.dateBr}) - ${d.isSaturday ? 'até 11:00' : '08:00 às 18:00'}`).join('\n')}

Mensagem recebida do cliente: "${clientMessage}"

Retorne APENAS um JSON válido com:
{
  "intent": "CONFIRM_DATE" | "ASK_WHICH_DATE" | "DECLINE" | "CLARIFY",
  "optionIndex": 1 | 2 | 3 | null,
  "requestedTime": "HH:MM" | null,
  "naturalReply": "texto curto e natural para enviar ao cliente no WhatsApp"
}`;

        const endpoint = `https://generativelanguage.googleapis.com/v1beta/models/gemini-2.5-flash:generateContent?key=${encodeURIComponent(apiKey)}`;
        const response = await fetch(endpoint, {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({
                contents: [{ role: 'user', parts: [{ text: prompt }] }],
                generationConfig: {
                    temperature: 0.2,
                    responseMimeType: 'application/json'
                }
            })
        });

        if (!response.ok) return null;
        const payload = await response.json();
        const text = payload?.candidates?.[0]?.content?.parts?.[0]?.text;
        if (!text) return null;

        const parsed = JSON.parse(text);
        return parsed;
    } catch (err) {
        console.warn('⚠️ [WhatsAppBotAgent] Fallback para parser determinístico:', err.message);
        return null;
    }
}

/**
 * Monta mensagem inicial de aviso preventivo (10h da manhã) com 3 opções de data.
 */
async function buildOutreachMessage({ workshopName, ownerName, vehicleModel, licensePlate, itemName, currentKm, offeredDates }) {
    const firstName = (ownerName || 'Cliente').split(' ')[0];
    const kmText = currentKm > 0 ? ` (aprox. ${Number(currentKm).toLocaleString('pt-BR')} km)` : '';
    const optionsBlock = offeredDates
        .map(d => `*${d.index}* - ${d.label}`)
        .join('\n');

    const fallbackMsg = `Olá ${firstName}! Aqui é o assistente da oficina *${workshopName}* (DNA AUTO) 🔧.\n\nIdentificamos que o seu *${vehicleModel || 'veículo'}* (Placa *${licensePlate}*)${kmText} está no momento ideal para fazer *${itemName}*.\n\nGostaria de agendar seu atendimento? Escolha uma das 3 datas disponíveis:\n${optionsBlock}\n\nÉ só responder com o número *1*, *2* ou *3* (e o horário de preferência, ex: _1 às 09h_).`;

    const apiKey = (process.env.GEMINI_API_KEY || '').trim();
    if (!apiKey || process.env.NODE_ENV === 'test') {
        return fallbackMsg;
    }

    try {
        const prompt = `Escreva uma mensagem curta e simpática de WhatsApp em português do Brasil pela oficina "${workshopName}" para o cliente "${firstName}" avisando que o veículo "${vehicleModel}" (placa "${licensePlate}"${kmText}) precisa de "${itemName}".
Inclua EXATAMENTE estas 3 opções numeradas para ele escolher:
${optionsBlock}
Peça para responder com 1, 2 ou 3 e o horário desejado (lembrando que sábado é até 11h). Sem texto extra antes ou depois.`;

        const endpoint = `https://generativelanguage.googleapis.com/v1beta/models/gemini-2.5-flash:generateContent?key=${encodeURIComponent(apiKey)}`;
        const res = await fetch(endpoint, {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({
                contents: [{ role: 'user', parts: [{ text: prompt }] }],
                generationConfig: { temperature: 0.4 }
            })
        });
        if (!res.ok) return fallbackMsg;
        const data = await res.json();
        const text = data?.candidates?.[0]?.content?.parts?.[0]?.text?.trim();
        return text || fallbackMsg;
    } catch (_) {
        return fallbackMsg;
    }
}

/**
 * Escolhe um horário disponível válido na data alvo respeitando:
 * Seg-Sex: 08:00..17:00 | Sábado: 08:00..11:00.
 */
function resolveAppointmentSlot(workshopId, chosenOption, requestedTime) {
    const candidateTime = requestedTime || chosenOption.defaultTime || '09:00';
    const [hh, mm] = candidateTime.split(':').map(Number);

    if (chosenOption.isSaturday && (hh > 11 || (hh === 11 && mm > 0))) {
        return {
            valid: false,
            reason: 'SATURDAY_AFTER_11',
            message: `Aos sábados (${chosenOption.dateBr}) nosso atendimento vai até *11h00* ⏰. Qual horário pela manhã prefere (ex: *08h*, *09h* ou *10h*), ou prefere outra das 3 datas?`
        };
    }

    if (!chosenOption.isSaturday && (hh < 8 || hh > 18)) {
        return {
            valid: false,
            reason: 'OUT_OF_HOURS',
            message: `Nosso horário de segunda a sexta é das *08h00 às 18h00*. Qual horário dentro desse período fica melhor para você no dia ${chosenOption.dateBr}?`
        };
    }

    // Verificar se o horário exato já atingiu capacidade máxima de 3 carros no mesmo horário; se sim, sugere próximo slot
    const slots = chosenOption.isSaturday
        ? ['08:00', '09:00', '10:00', '11:00']
        : ['08:00', '09:00', '10:00', '11:00', '14:00', '15:00', '16:00', '17:00'];

    const orderedCandidates = [candidateTime, ...slots.filter(s => s !== candidateTime)];
    for (const slot of orderedCandidates) {
        const countRow = db.prepare(`
            SELECT COUNT(*) as total FROM workshop_appointments
            WHERE workshop_id = ? AND appointment_date = ? AND appointment_time = ? AND status != 'CANCELLED'
        `).get(workshopId, chosenOption.date, slot);
        if (!countRow || countRow.total < 3) {
            return { valid: true, time: slot };
        }
    }

    return {
        valid: false,
        reason: 'DAY_FULL',
        message: `Todos os horários de ${chosenOption.weekday} (${chosenOption.dateBr}) já estão preenchidos. Pode escolher uma das outras datas oferecidas?`
    };
}

/**
 * Processa mensagem recebida do cliente no WhatsApp da oficina.
 */
async function handleIncomingMessage({ workshopId, senderPhone, messageText, enqueueReplyFn, enqueueMessageFn }) {
    const replyHandler = enqueueReplyFn || enqueueMessageFn;
    const suffix = buildPhoneMatchSuffix(senderPhone);
    if (!suffix || !messageText) {
        return { handled: false, reason: 'EMPTY_INPUT' };
    }

    // Buscar campanha ativa mais recente para este telefone nesta oficina
    const campaign = db.prepare(`
        SELECT * FROM maintenance_bot_campaigns
        WHERE workshop_id = ?
          AND REPLACE(REPLACE(REPLACE(owner_phone, '-', ''), ' ', ''), '+', '') LIKE ?
          AND status IN ('SENT', 'IN_CONVERSATION')
        ORDER BY sent_at DESC, updated_at DESC
        LIMIT 1
    `).get(workshopId, `%${suffix}`);

    if (!campaign) {
        return { handled: false, reason: 'NO_ACTIVE_CAMPAIGN' };
    }

    const workshop = db.prepare(`SELECT id, trade_name FROM workshops WHERE id = ?`).get(workshopId) || {
        id: workshopId,
        trade_name: 'Oficina Credenciada DNA AUTO'
    };

    let offeredDates = [];
    try {
        offeredDates = JSON.parse(campaign.offered_dates_json || '[]');
    } catch (_) {
        offeredDates = getNextWorkingDates(null, 3);
    }

    // Análise determinística + Gemini API (quando configurada)
    const detResult = parseClientReplyDeterministic(messageText, offeredDates);
    let aiResult = null;
    if (detResult.intent !== 'DECLINE') {
        aiResult = await analyzeReplyWithGemini({
            workshopName: workshop.trade_name,
            campaign,
            offeredDates,
            clientMessage: messageText
        });
    }

    let finalIntent = detResult.intent;
    let chosenOption = detResult.chosenOption;
    let requestedTime = detResult.timeInfo ? detResult.timeInfo.time : null;

    if (aiResult) {
        if (aiResult.intent) finalIntent = aiResult.intent;
        if (!chosenOption && aiResult.optionIndex && offeredDates[aiResult.optionIndex - 1]) {
            chosenOption = offeredDates[aiResult.optionIndex - 1];
        }
        if (!requestedTime && aiResult.requestedTime) {
            requestedTime = aiResult.requestedTime;
        }
    }

    const sendReply = async (replyText) => {
        if (typeof replyHandler === 'function') {
            await replyHandler({
                workshopId,
                recipientPhone: campaign.owner_phone || normalizePhoneDigits(senderPhone),
                recipientName: campaign.owner_name || 'Cliente',
                message: replyText,
                vehicleId: campaign.vehicle_id,
                licensePlate: campaign.license_plate,
                serviceType: campaign.item_name
            });
        }
    };

    if (finalIntent === 'DECLINE') {
        db.prepare(`
            UPDATE maintenance_bot_campaigns
            SET status = 'DECLINED', last_message = ?, ai_notes = 'Cliente optou por não agendar neste momento', updated_at = CURRENT_TIMESTAMP
            WHERE id = ?
        `).run(messageText, campaign.id);

        const reply = `Sem problemas, ${campaign.owner_name ? campaign.owner_name.split(' ')[0] : 'cliente'}! Quando quiser agendar a manutenção do seu *${campaign.license_plate}*, é só chamar por aqui. 👍`;
        await sendReply(reply);
        return { handled: true, confirmed: false, status: 'DECLINED', campaignId: campaign.id, replyMessage: reply };
    }

    if (finalIntent === 'CONFIRM_DATE' && chosenOption) {
        const slotCheck = resolveAppointmentSlot(workshopId, chosenOption, requestedTime);
        if (!slotCheck.valid) {
            db.prepare(`
                UPDATE maintenance_bot_campaigns
                SET status = 'IN_CONVERSATION', last_message = ?, ai_notes = ?, updated_at = CURRENT_TIMESTAMP
                WHERE id = ?
            `).run(messageText, slotCheck.reason, campaign.id);

            await sendReply(slotCheck.message);
            return { handled: true, confirmed: false, status: 'IN_CONVERSATION', campaignId: campaign.id, replyMessage: slotCheck.message };
        }

        const chosenTime = slotCheck.time;
        const appId = `app_bot_${Date.now()}_${Math.random().toString(36).substring(2, 6)}`;

        db.transaction(() => {
            db.prepare(`
                INSERT INTO workshop_appointments (
                    id, workshop_id, vehicle_id, license_plate, vehicle_model, owner_name, owner_phone,
                    service_title, appointment_date, appointment_time, status, notes
                ) VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, 'CONFIRMED', ?)
            `).run(
                appId,
                workshopId,
                campaign.vehicle_id || null,
                campaign.license_plate,
                campaign.vehicle_model || 'Veículo Cadastrado',
                campaign.owner_name || 'Cliente',
                campaign.owner_phone,
                campaign.item_name,
                chosenOption.date,
                chosenTime,
                `[BOT_AUTO] Agendado automaticamente via WhatsApp (Campanha ${campaign.id})`
            );

            db.prepare(`
                UPDATE maintenance_bot_campaigns
                SET status = 'CONFIRMED',
                    chosen_date = ?,
                    chosen_time = ?,
                    appointment_id = ?,
                    last_message = ?,
                    ai_notes = 'Agendamento confirmado automaticamente pelo bot',
                    confirmed_at = CURRENT_TIMESTAMP,
                    updated_at = CURRENT_TIMESTAMP
                WHERE id = ?
            `).run(chosenOption.date, chosenTime, appId, messageText, campaign.id);
        })();

        const confirmMsg = (aiResult && aiResult.naturalReply && aiResult.naturalReply.includes(chosenOption.dateBr))
            ? aiResult.naturalReply
            : `✅ Agendamento *CONFIRMADO* na oficina *${workshop.trade_name}*!\n\n🚗 Veículo: *${campaign.vehicle_model || ''}* (${campaign.license_plate})\n🔧 Serviço: *${campaign.item_name}*\n📅 Data: *${chosenOption.weekday}, ${chosenOption.dateBr}* às *${chosenTime}*\n\nSua vaga já está garantida em nosso sistema DNA AUTO. Até lá!`;

        await sendReply(confirmMsg);

        return {
            handled: true,
            confirmed: true,
            status: 'CONFIRMED',
            campaignId: campaign.id,
            appointmentId: appId,
            chosenDate: chosenOption.date,
            chosenTime,
            replyMessage: confirmMsg
        };
    }

    // Caso o cliente ainda não tenha escolhido qual das 3 datas
    db.prepare(`
        UPDATE maintenance_bot_campaigns
        SET status = 'IN_CONVERSATION', last_message = ?, updated_at = CURRENT_TIMESTAMP
        WHERE id = ?
    `).run(messageText, campaign.id);

    const optionsList = offeredDates.map(d => `*${d.index}* - ${d.label}`).join('\n');
    const clarifyReply = (aiResult && aiResult.naturalReply)
        ? aiResult.naturalReply
        : `Para confirmar o agendamento do seu *${campaign.license_plate}*, responda com o número da data desejada:\n${optionsList}\n\nSe preferir, informe também o horário (ex: *1 às 09h*).`;

    await sendReply(clarifyReply);
    return { handled: true, confirmed: false, status: 'IN_CONVERSATION', campaignId: campaign.id, replyMessage: clarifyReply };
}

module.exports = {
    getSaoPauloNow,
    addDaysIso,
    getDayOfWeekIso,
    getNextWorkingDates,
    normalizePhoneDigits,
    extractRequestedTime,
    parseClientReplyDeterministic,
    buildOutreachMessage,
    resolveAppointmentSlot,
    handleIncomingMessage
};
