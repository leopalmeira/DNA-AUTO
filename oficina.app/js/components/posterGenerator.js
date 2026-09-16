// ==============================================================================
// DNA AUTO — GERADOR DE CARTAZ / QR CODE PARA OFICINAS (ITEM 18)
// ==============================================================================

const PosterGenerator = {
    async open(workshopId = 'ws_veloce') {
        const modal = document.getElementById('poster-modal');
        const contentBox = document.getElementById('poster-modal-content');

        try {
            const data = await API.getWorkshopDashboard(workshopId);
            const w = data.workshop;
            const qrCodeUrl = window.location.origin + `?ref=workshop&ws=${w.id}`;
            const qrCodeSvg = QRCodeGenerator.generateSVG(qrCodeUrl, 200);

            contentBox.innerHTML = `
                <div class="workshop-poster-a4" style="background:#ffffff; color:#0b0f19; padding:40px 30px; border-radius:12px; font-family:Arial, sans-serif; text-align:center; box-shadow:0 10px 30px rgba(0,0,0,0.2);">
                    <!-- Topo Cartaz -->
                    <div style="display:inline-block; background:#0088ff; color:#ffffff; padding:6px 18px; border-radius:20px; font-weight:800; font-size:14px; letter-spacing:1px; text-transform:uppercase; margin-bottom:16px;">
                        OFICINA CREDENCIADA DNA AUTO
                    </div>

                    <h1 style="font-size:36px; font-weight:900; line-height:1.1; color:#0b0f19; margin-bottom:10px; letter-spacing:-1px;">
                        SEU CARRO TEM DNA?
                    </h1>

                    <h2 style="font-size:18px; font-weight:600; color:#4b5563; margin-bottom:28px;">
                        Crie agora o histórico digital permanente do seu veículo nesta oficina.
                    </h2>

                    <!-- Lista de Vantagens -->
                    <div style="background:#f3f4f6; border-radius:12px; padding:20px 24px; text-align:left; max-width:440px; margin:0 auto 28px; font-size:14px; line-height:1.8; color:#1f2937;">
                        <div style="font-weight:700; color:#0088ff; margin-bottom:6px;">Histórico Oficial Registrado:</div>
                        <div>✓ <strong>Serviços realizados</strong> comprovados</div>
                        <div>✓ <strong>Peças trocadas</strong> com garantia e código OEM</div>
                        <div>✓ <strong>Notas fiscais</strong> anexadas</div>
                        <div>✓ <strong>Fotos</strong> das peças novas e instaladas</div>
                        <div>✓ <strong>Quilometragem</strong> auditada</div>
                        <div>✓ <strong>Manutenções</strong> preventivas em dia</div>
                        <div>✓ <strong>Histórico de oficinas</strong> credenciadas</div>
                        <div>✓ <strong>Documentação</strong> e certidões</div>
                    </div>

                    <!-- QR Code Central -->
                    <div style="margin:20px 0;">
                        ${qrCodeSvg}
                        <div style="font-size:12px; font-weight:700; color:#6b7280; margin-top:10px; text-transform:uppercase;">
                            Aponte a câmera do celular para ativar o seu DNA
                        </div>
                    </div>

                    <!-- Frase de Impacto -->
                    <div style="margin-top:24px; padding-top:20px; border-top:2px solid #e5e7eb;">
                        <h3 style="font-size:18px; font-weight:800; color:#0088ff; text-transform:uppercase; letter-spacing:0.5px;">
                            NA HORA DE VENDER, MOSTRE A HISTÓRIA DO CARRO.
                        </h3>
                        <p style="font-size:12px; color:#6b7280; margin-top:6px;">
                            ${w.trade_name} • ${w.city}/${w.state} • Ponto de Ativação Credenciado DNA AUTO
                        </p>
                    </div>
                </div>
            `;

            modal.classList.add('active');
        } catch (err) {
            alert('Erro ao gerar cartaz da oficina: ' + err.message);
        }
    },

    printPoster() {
        document.body.classList.add('printing-poster');
        const cleanup = () => {
            document.body.classList.remove('printing-poster');
            window.removeEventListener('afterprint', cleanup);
        };
        window.addEventListener('afterprint', cleanup);
        window.print();
        setTimeout(cleanup, 2000);
    }
};
