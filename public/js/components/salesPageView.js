// ==============================================================================
// DNA AUTO — PÁGINA OFICIAL DE VENDA & PLANOS COMERCIAIS
// ==============================================================================

const SalesPageView = {
    render() {
        const container = document.getElementById('view-content');
        container.innerHTML = `
            <div style="max-width:1100px; margin:0 auto; padding:20px 0 60px;">
                
                <!-- Hero Section de Vendas -->
                <div class="panel-box" style="background:linear-gradient(135deg, rgba(0, 136, 255, 0.12), rgba(0, 212, 255, 0.05), rgba(11, 15, 25, 0.95)); border-color:var(--brand-cyan); text-align:center; padding:48px 32px; margin-bottom:32px;">
                    <div class="badge-proof badge-proven" style="font-size:11px; margin-bottom:16px; display:inline-flex; align-items:center; gap:6px;">
                        <svg viewBox="0 0 24 24" width="14" height="14" fill="none" stroke="currentColor" stroke-width="2"><path d="M12 22s8-4 8-10V5l-8-3-8 3v7c0 6 8 10 8 10z"/></svg>
                        PASSAPORTE DIGITAL PERMANENTE E AUDITADO
                    </div>
                    <h1 style="font-size:38px; font-weight:800; color:#fff; line-height:1.2; margin-bottom:16px;">
                        O Histórico Completo que Valoriza seu Carro em até <span style="color:var(--brand-cyan);">+15%</span> na Venda
                    </h1>
                    <p style="font-size:16px; color:var(--text-muted); max-width:760px; margin:0 auto 28px; line-height:1.6;">
                        O <strong>DNA AUTO</strong> é o passaporte digital vitalício do veículo. O DNA pertence ao <strong>CARRO</strong>, não ao dono. Todas as manutenções, peças originais, fotos e notas fiscais acompanham o veículo para sempre.
                    </p>
                    <div style="display:flex; justify-content:center; gap:14px; flex-wrap:wrap;">
                        <button class="btn btn-cyan btn-lg" style="padding:14px 28px; font-weight:700; font-size:15px;" onclick="LoginView.quickLogin('OWNER')">
                            ACESSAR MINHA GARAGEM DIGITAL
                        </button>
                        <button class="btn btn-secondary btn-lg" style="padding:14px 28px; font-weight:700; font-size:15px;" onclick="DossierView.render('DNA-BR-8F72-29A4-X91')">
                            VER DOSSIÊ 360° DE EXEMPLO
                        </button>
                    </div>
                </div>

                <!-- 3 Pilares de Benefícios -->
                <div style="display:grid; grid-template-columns:repeat(auto-fit, minmax(300px, 1fr)); gap:20px; margin-bottom:36px;">
                    <div class="panel-box" style="border-top:3px solid var(--brand-cyan);">
                        <div style="width:40px; height:40px; border-radius:8px; background:rgba(0,212,255,0.1); display:flex; align-items:center; justify-content:center; margin-bottom:14px;">
                            <svg viewBox="0 0 24 24" width="22" height="22" fill="none" stroke="var(--brand-cyan)" stroke-width="2"><path d="M14 2H6a2 2 0 0 0-2 2v16a2 2 0 0 0 2 2h12a2 2 0 0 0 2-2V8z"/><polyline points="14 2 14 8 20 8"/><line x1="16" y1="13" x2="8" y2="13"/><line x1="16" y1="17" x2="8" y2="17"/></svg>
                        </div>
                        <h3 style="font-size:18px; color:#fff; font-weight:700; margin-bottom:8px;">Para quem Vende o Carro</h3>
                        <p style="font-size:13px; color:var(--text-muted); line-height:1.6;">
                            Elimine a desconfiança de compradores. Com o Relatório Oficial com 40+ itens e QR Code de autenticidade, você vende mais rápido e sem desvalorização de tabela.
                        </p>
                    </div>

                    <div class="panel-box" style="border-top:3px solid var(--proof-level-4);">
                        <div style="width:40px; height:40px; border-radius:8px; background:rgba(16,185,129,0.1); display:flex; align-items:center; justify-content:center; margin-bottom:14px;">
                            <svg viewBox="0 0 24 24" width="22" height="22" fill="none" stroke="var(--proof-level-4)" stroke-width="2"><path d="M12 22s8-4 8-10V5l-8-3-8 3v7c0 6 8 10 8 10z"/></svg>
                        </div>
                        <h3 style="font-size:18px; color:#fff; font-weight:700; margin-bottom:8px;">Para quem Compra</h3>
                        <p style="font-size:13px; color:var(--text-muted); line-height:1.6;">
                            Segurança absoluta. Verifique se a quilometragem é real, se as peças aplicadas são de qualidade e se todas as notas fiscais foram emitidas por oficinas credenciadas.
                        </p>
                    </div>

                    <div class="panel-box" style="border-top:3px solid var(--brand-primary);">
                        <div style="width:40px; height:40px; border-radius:8px; background:rgba(0,136,255,0.1); display:flex; align-items:center; justify-content:center; margin-bottom:14px;">
                            <svg viewBox="0 0 24 24" width="22" height="22" fill="none" stroke="var(--brand-primary)" stroke-width="2"><path d="M14.7 6.3a1 1 0 0 0 0 1.4l1.6 1.6a1 1 0 0 0 1.4 0l3.77-3.77a6 6 0 0 1-7.94 7.94l-6.91 6.91a2.12 2.12 0 0 1-3-3l6.91-6.91a6 6 0 0 1 7.94-7.94l-3.76 3.76z"/></svg>
                        </div>
                        <h3 style="font-size:18px; color:#fff; font-weight:700; margin-bottom:8px;">Para Oficinas e Centros Automotivos</h3>
                        <p style="font-size:13px; color:var(--text-muted); line-height:1.6;">
                            Fidelização extrema de clientes. A oficina comprova serviços com carimbo técnico, ativa novos DNAs, gera cartazes com QR Code para balcão e recebe comissões automáticas.
                        </p>
                    </div>
                </div>

                <!-- Tabela Comparativa de Planos de Ativação -->
                <div class="panel-box" style="margin-bottom:36px;">
                    <div class="panel-title" style="text-align:center; display:block; margin-bottom:24px;">
                        <h3 style="font-size:24px; color:#fff; font-weight:800;">Planos de Ativação do DNA Permanente</h3>
                        <p style="font-size:13px; color:var(--text-muted); margin-top:4px;">Taxa única de emissão vitalícia. Sem mensalidades para o carro.</p>
                    </div>

                    <div style="display:grid; grid-template-columns:repeat(auto-fit, minmax(280px, 1fr)); gap:20px;">
                        <!-- Plano 1 -->
                        <div style="background:var(--bg-surface-elevated); border:1px solid var(--border-subtle); border-radius:10px; padding:24px; text-align:center;">
                            <div style="font-size:12px; text-transform:uppercase; color:var(--text-dim); font-weight:700;">Ativação Avulsa</div>
                            <div style="font-size:32px; font-weight:800; color:#fff; margin:12px 0 4px; font-family:var(--font-mono);">R$ 149,00</div>
                            <div style="font-size:11px; color:var(--text-dim); margin-bottom:20px;">Pagamento único por veículo</div>
                            <ul style="list-style:none; padding:0; margin:0 0 24px; font-size:13px; color:var(--text-muted); line-height:2; text-align:left;">
                                <li>✓ Código DNA permanente vitalício</li>
                                <li>✓ Passaporte digital 360° do carro</li>
                                <li>✓ Acesso à Garagem do Proprietário</li>
                                <li>✓ Emissão de Relatório para Venda</li>
                            </ul>
                            <button class="btn btn-secondary btn-block" style="width:100%; justify-content:center;" onclick="LoginView.quickLogin('OWNER')">
                                ATIVAR MEU CARRO
                            </button>
                        </div>

                        <!-- Plano 2 (Destaque Promo Oficina) -->
                        <div style="background:linear-gradient(135deg, rgba(0,212,255,0.08), var(--bg-surface-elevated)); border:2px solid var(--brand-cyan); border-radius:10px; padding:24px; text-align:center; position:relative;">
                            <div style="position:absolute; top:-12px; left:50%; transform:translateX(-50%); background:var(--brand-cyan); color:#000; font-size:10px; font-weight:800; padding:2px 10px; border-radius:10px; letter-spacing:0.5px;">
                                MAIS POPULAR NAS OFICINAS
                            </div>
                            <div style="font-size:12px; text-transform:uppercase; color:var(--brand-cyan); font-weight:700;">Campanha Oficina Parceira</div>
                            <div style="font-size:32px; font-weight:800; color:var(--brand-cyan); margin:12px 0 4px; font-family:var(--font-mono);">R$ 79,00</div>
                            <div style="font-size:11px; color:var(--proof-level-4); font-weight:600; margin-bottom:20px;">47% de Desconto com Revisão</div>
                            <ul style="list-style:none; padding:0; margin:0 0 24px; font-size:13px; color:var(--text-muted); line-height:2; text-align:left;">
                                <li>✓ Ativação imediata no box da oficina</li>
                                <li>✓ Primeiro serviço Nível 4 já comprovado</li>
                                <li>✓ Peças e nota fiscal anexadas pela oficina</li>
                                <li>✓ Cartaz QR code impresso na entrega</li>
                            </ul>
                            <button class="btn btn-cyan btn-block" style="width:100%; justify-content:center; font-weight:700;" onclick="LoginView.quickLogin('WORKSHOP')">
                                ATIVAR PELA OFICINA
                            </button>
                        </div>

                        <!-- Plano 3 (Cortesia) -->
                        <div style="background:var(--bg-surface-elevated); border:1px solid var(--border-subtle); border-radius:10px; padding:24px; text-align:center;">
                            <div style="font-size:12px; text-transform:uppercase; color:var(--text-dim); font-weight:700;">Cortesia Fidelidade</div>
                            <div style="font-size:32px; font-weight:800; color:var(--proof-level-4); margin:12px 0 4px; font-family:var(--font-mono);">GRÁTIS</div>
                            <div style="font-size:11px; color:var(--text-dim); margin-bottom:20px;">Oferecido por oficinas credenciadas</div>
                            <ul style="list-style:none; padding:0; margin:0 0 24px; font-size:13px; color:var(--text-muted); line-height:2; text-align:left;">
                                <li>✓ Bônus de fidelidade para clientes VIP</li>
                                <li>✓ 100% subsidiado pela oficina</li>
                                <li>✓ Manutenção preventiva cadastrada</li>
                                <li>✓ Passaporte completo incluso</li>
                            </ul>
                            <button class="btn btn-secondary btn-block" style="width:100%; justify-content:center;" onclick="DossierView.render('DNA-BR-1A90-55E8-K12')">
                                VER EXEMPLO CORTESIA (GOL)
                            </button>
                        </div>
                    </div>
                </div>

                <!-- Rodapé de Ação -->
                <div style="text-align:center; padding:20px;">
                    <a href="javascript:void(0)" onclick="LoginView.render()" style="color:var(--text-muted); font-size:13px; text-decoration:none;">
                        ← Voltar para a Tela de Login Corporativa
                    </a>
                </div>
            </div>
        `;
    }
};
