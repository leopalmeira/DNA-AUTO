/**
 * DNA AUTO — Gerador de PDF Diário da Agenda da Oficina
 * Consolida os veículos agendados para o dia seguinte (D+1) para envio às 17h no WhatsApp da oficina.
 */

const fs = require('fs');
const path = require('path');
const PDFDocument = require('pdfkit');

const PDF_OUTPUT_DIR = path.resolve(__dirname, '../../uploads/whatsapp');

function ensureOutputDir() {
    if (!fs.existsSync(PDF_OUTPUT_DIR)) {
        fs.mkdirSync(PDF_OUTPUT_DIR, { recursive: true });
    }
}

function formatDateBr(isoDate) {
    if (!isoDate || !isoDate.includes('-')) return isoDate || '';
    const [y, m, d] = isoDate.split('-');
    return `${d}/${m}/${y}`;
}

function getWeekdayLabelPt(isoDate) {
    if (!isoDate) return '';
    const [y, m, d] = isoDate.split('-').map(Number);
    const dt = new Date(Date.UTC(y, m - 1, d, 12, 0, 0));
    const names = ['Domingo', 'Segunda-feira', 'Terça-feira', 'Quarta-feira', 'Quinta-feira', 'Sexta-feira', 'Sábado'];
    return names[dt.getUTCDay()] || '';
}

/**
 * Gera o PDF com a pauta de veículos agendados para `targetDate` (YYYY-MM-DD).
 * @param {object} params
 * @param {object} params.workshop Registro da oficina
 * @param {string} params.targetDate Data alvo (YYYY-MM-DD)
 * @param {Array<object>} params.appointments Lista de agendamentos confirmados/agendados
 * @returns {Promise<{filePath: string, relativeUrl: string, fileName: string, buffer: Buffer, count: number}>}
 */
function generateDailyAgendaPdf({ workshop, targetDate, appointments = [] }) {
    ensureOutputDir();

    const wsId = (workshop && workshop.id) || 'ws_default';
    const wsName = (workshop && (workshop.trade_name || workshop.company_name)) || 'Oficina Credenciada DNA AUTO';
    const fileName = `agenda_${wsId}_${targetDate}.pdf`;
    const filePath = path.join(PDF_OUTPUT_DIR, fileName);
    const relativeUrl = `/uploads/whatsapp/${fileName}`;

    return new Promise((resolve, reject) => {
        try {
            const doc = new PDFDocument({ size: 'A4', margin: 40 });
            const chunks = [];

            doc.on('data', chunk => chunks.push(chunk));
            doc.on('error', reject);
            doc.on('end', () => {
                const buffer = Buffer.concat(chunks);
                fs.writeFileSync(filePath, buffer);
                resolve({
                    filePath,
                    relativeUrl,
                    fileName,
                    buffer,
                    count: appointments.length
                });
            });

            const dateBr = formatDateBr(targetDate);
            const weekday = getWeekdayLabelPt(targetDate);
            const isSaturday = weekday.startsWith('Sábado');

            // Cabeçalho institucional
            doc.rect(40, 40, 515, 76).fill('#0B132B');
            doc.fillColor('#00D4FF').fontSize(10).font('Helvetica-Bold')
                .text('DNA AUTO • AGENDA PREVENTIVA AUTOMÁTICA', 56, 52);
            doc.fillColor('#FFFFFF').fontSize(17).font('Helvetica-Bold')
                .text(wsName, 56, 68, { width: 480 });
            doc.fillColor('#CBD5E1').fontSize(10).font('Helvetica')
                .text(`Programação para: ${weekday}, ${dateBr}${isSaturday ? ' (Atendimento até 11h00)' : ''}`, 56, 92);

            doc.moveDown(3);
            let y = 134;

            // Resumo quantitativo
            doc.fillColor('#0F172A').fontSize(12).font('Helvetica-Bold')
                .text(`Veículos Agendados para Amanhã (${dateBr}): ${appointments.length}`, 40, y);
            y += 22;

            if (appointments.length === 0) {
                doc.rect(40, y, 515, 54).fillAndStroke('#F8FAFC', '#CBD5E1');
                doc.fillColor('#475569').fontSize(11).font('Helvetica')
                    .text('Nenhum veículo confirmado até o fechamento das 17h00 para esta data.', 54, y + 20);
                y += 70;
            } else {
                // Cabeçalho da tabela
                const cols = [
                    { x: 40, w: 48, label: 'Hora' },
                    { x: 90, w: 62, label: 'Placa' },
                    { x: 154, w: 108, label: 'Veículo' },
                    { x: 264, w: 105, label: 'Cliente / Tel.' },
                    { x: 371, w: 132, label: 'Serviço / Manutenção' },
                    { x: 505, w: 50, label: 'Status' }
                ];

                const drawTableHeader = (topY) => {
                    doc.rect(40, topY, 515, 22).fill('#1E293B');
                    doc.fillColor('#FFFFFF').fontSize(8.5).font('Helvetica-Bold');
                    cols.forEach(col => {
                        doc.text(col.label, col.x + 4, topY + 7, { width: col.w - 6, ellipsis: true });
                    });
                    return topY + 24;
                };

                y = drawTableHeader(y);

                appointments.forEach((app, idx) => {
                    if (y > 745) {
                        doc.addPage();
                        y = drawTableHeader(40);
                    }

                    const bgColor = idx % 2 === 0 ? '#FFFFFF' : '#F8FAFC';
                    doc.rect(40, y, 515, 34).fillAndStroke(bgColor, '#E2E8F0');

                    const vehLabel = [app.brand, app.model].filter(Boolean).join(' ') || app.vehicle_model || 'Veículo';
                    const clientLabel = `${app.owner_name || 'Cliente'}\n${app.owner_phone || ''}`.trim();
                    const statusLabel = app.status === 'CONFIRMED' ? 'CONFIRMADO' : (app.status || 'AGENDADO');

                    doc.fillColor('#0F172A').fontSize(8.5).font('Helvetica-Bold')
                        .text(app.appointment_time || '09:00', cols[0].x + 4, y + 10, { width: cols[0].w - 6 });
                    doc.fillColor('#0052CC').font('Helvetica-Bold')
                        .text((app.license_plate || '').toUpperCase(), cols[1].x + 4, y + 10, { width: cols[1].w - 6 });
                    doc.fillColor('#0F172A').font('Helvetica')
                        .text(vehLabel, cols[2].x + 4, y + 7, { width: cols[2].w - 6, height: 24, ellipsis: true });
                    doc.fillColor('#334155').fontSize(7.8)
                        .text(clientLabel, cols[3].x + 4, y + 6, { width: cols[3].w - 6, height: 24, ellipsis: true });
                    doc.fillColor('#0F172A').fontSize(8.2)
                        .text(app.service_title || 'Manutenção Preventiva', cols[4].x + 4, y + 7, { width: cols[4].w - 6, height: 24, ellipsis: true });
                    doc.fillColor('#047857').fontSize(7.5).font('Helvetica-Bold')
                        .text(statusLabel, cols[5].x + 2, y + 11, { width: cols[5].w - 4, ellipsis: true });

                    y += 34;
                });
            }

            // Rodapé
            const generatedAt = new Date().toLocaleString('pt-BR', { timeZone: 'America/Sao_Paulo' });
            doc.fillColor('#64748B').fontSize(8).font('Helvetica')
                .text(`Documento gerado automaticamente pelo Agente DNA AUTO em ${generatedAt} (Horário de Brasília).`, 40, 780, {
                    align: 'center',
                    width: 515
                });

            doc.end();
        } catch (err) {
            reject(err);
        }
    });
}

module.exports = {
    generateDailyAgendaPdf,
    formatDateBr,
    getWeekdayLabelPt
};
