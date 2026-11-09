const assert = require('assert');
const path = require('path');
const http = require('http');
const express = require('express');
const bodyParser = require('body-parser');
const db = require('../server/src/database/db');
const authRoutes = require('../server/src/modules/auth/auth.routes');
const workshopsRoutes = require('../server/src/modules/workshops/workshops.routes');
const servicesRoutes = require('../server/src/modules/services/services.routes');
const fs = require('fs');

console.log('🧪 Iniciando Testes Unitários e de Integração: Anti-Overflow, Login do Registrador e Desbloqueio Financeiro...');

const app = express();
app.use(bodyParser.json());
app.use(bodyParser.urlencoded({ extended: true }));
app.use('/api/v1/auth', authRoutes);
app.use('/api/v1/workshops', workshopsRoutes);
app.use('/api/v1/services', servicesRoutes);

const server = http.createServer(app);

server.listen(0, async () => {
    const port = server.address().port;
    const baseUrl = `http://127.0.0.1:${port}`;
    console.log(`📡 Servidor de teste ouvindo na porta ${port}`);

    try {
        // ─────────────────────────────────────────────────────────────
        // TESTE 1: Anti-overflow e Grid dos Boxes de Inserção de Dados
        // ─────────────────────────────────────────────────────────────
        console.log('\n[Teste 1] Verificação de Anti-Overflow e Estilos Dark dos Boxes de Dados...');
        global.window = {
            location: { search: '', hash: '#dashboard' },
            scrollTo: () => {},
            localStorage: {
                _s: {},
                getItem: function(k) { return this._s[k] || null; },
                setItem: function(k, v) { this._s[k] = String(v); },
                removeItem: function(k) { delete this._s[k]; }
            },
            sessionStorage: {
                _s: {},
                getItem: function(k) { return this._s[k] || null; },
                setItem: function(k, v) { this._s[k] = String(v); },
                removeItem: function(k) { delete this._s[k]; }
            }
        };
        global.localStorage = global.window.localStorage;
        global.sessionStorage = global.window.sessionStorage;
        function createMockElement(tag, id = '', className = '') {
            return {
                tagName: tag.toUpperCase(),
                id,
                className,
                style: {},
                attributes: {},
                children: [],
                innerHTML: '',
                value: '',
                classList: {
                    add() {},
                    remove() {},
                    contains() { return false; }
                },
                setAttribute(k, v) { this[k] = v; },
                getAttribute(k) { return this[k] || null; },
                querySelector() { return null; },
                querySelectorAll() { return []; },
                appendChild(c) { this.children.push(c); return c; },
                addEventListener() {},
                removeEventListener() {}
            };
        }

        global.document = {
            body: createMockElement('body'),
            elements: new Map(),
            getElementById(id) {
                if (!this.elements.has(id)) {
                    this.elements.set(id, createMockElement('div', id));
                }
                return this.elements.get(id);
            },
            querySelector() { return null; },
            querySelectorAll() { return []; },
            createElement(tag) { return createMockElement(tag); }
        };

        const wvCode = fs.readFileSync(path.resolve('oficina.app/js/components/workshopView.js'), 'utf8')
            .replace('const WorkshopView =', 'global.WorkshopView =');
        const wmvCode = fs.readFileSync(path.resolve('oficina.app/js/components/workshopMobileView.js'), 'utf8');

        eval(wvCode);
        eval(wmvCode);

        const html = WorkshopView.renderMobileServiceDetailView();
        assert(html.includes('grid-template-columns: minmax(0, 1fr) minmax(0, 1fr)'), 'A grid deve usar minmax(0, 1fr) para evitar estouro de tela');
        assert(html.includes('id="mobile-srv-last-km"'), 'Campo de KM realizado deve existir');
        assert(html.includes('id="mobile-srv-next-km"'), 'Campo de KM previsto deve existir');
        assert(html.includes('rgba(11,22,44,0.95)'), 'Inputs devem possuir fundo escuro integrado');
        assert(html.includes('box-sizing:border-box'), 'Campos devem possuir box-sizing border-box rigoroso');
        console.log('✅ [Teste 1] Aprovado: HTML e CSS dos boxes de dados contidos nos cards sem transbordamento.');

        // ─────────────────────────────────────────────────────────────
        // TESTE 2: Cadastro de Registrador e Login Resiliente
        // ─────────────────────────────────────────────────────────────
        console.log('\n[Teste 2] Cadastro de Registrador e Autenticação com Tolerância de Digitação Mobile...');
        
        // Garante oficina para o teste
        const testWsId = 'ws_test_audit_' + Date.now();
        db.prepare(`
            INSERT OR IGNORE INTO workshops (id, company_name, trade_name, cnpj, email, phone, status)
            VALUES (?, 'Oficina Teste Auditoria', 'Auto Center Teste', '99.888.777/0001-66', 'teste@autocenter.com.br', '11999998888', 'ACTIVE')
        `).run(testWsId);

        const regEmail = `b1_teste_${Date.now()}@email.com`;
        const regRes = await fetch(`${baseUrl}/api/v1/workshops/${testWsId}/registrars`, {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({
                name: 'Bruno Registrador',
                email: regEmail
            })
        });
        const regData = await regRes.json();
        assert.strictEqual(regRes.status, 201, 'Registrador deve ser cadastrado com status 201');
        assert(regData.registrar.generated_password, 'Senha gerada deve estar presente');
        const genPassword = regData.registrar.generated_password;
        console.log(`   Registrador criado: ${regEmail} | Senha gerada: ${genPassword}`);

        // Login 2.1: Com a senha exata e espaços acidentais no email
        const loginRes1 = await fetch(`${baseUrl}/api/v1/auth/login`, {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({
                email: `  ${regEmail}  `,
                password: genPassword
            })
        });
        const loginData1 = await loginRes1.json();
        assert.strictEqual(loginRes1.status, 200, 'Login deve suceder com email com espaços');
        assert(loginData1.token, 'Token JWT deve ser emitido');
        console.log('   ✅ Login 2.1 aprovado: Email com espaços sanitizado e autenticado.');

        // Login 2.2: Com a senha em minúsculas (tolerância de digitação no teclado mobile)
        const loginRes2 = await fetch(`${baseUrl}/api/v1/auth/login`, {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({
                email: regEmail,
                password: genPassword.toLowerCase()
            })
        });
        const loginData2 = await loginRes2.json();
        assert.strictEqual(loginRes2.status, 200, 'Login deve suceder mesmo com a senha em minúsculas');
        console.log('   ✅ Login 2.2 aprovado: Senha case-insensitive aceita com sucesso.');

        // Login 2.3: Com senha padrão 123456
        const loginRes3 = await fetch(`${baseUrl}/api/v1/auth/login`, {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({
                email: regEmail,
                password: '123456'
            })
        });
        const loginData3 = await loginRes3.json();
        assert.strictEqual(loginRes3.status, 200, 'Login deve suceder com senha inicial 123456 para staff');
        console.log('   ✅ Login 2.3 aprovado: Senha inicial 123456 aceita.');

        // ─────────────────────────────────────────────────────────────
        // TESTE 3: Desbloqueio do Card Financeiro com Senha do Gestor
        // ─────────────────────────────────────────────────────────────
        console.log('\n[Teste 3] Validação de Desbloqueio Financeiro com Senha do Gestor...');
        
        // Tentativa 3.1: Senha errada deve retornar 401
        const wrongPassRes = await fetch(`${baseUrl}/api/v1/workshops/${testWsId}/verify-manager-password`, {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({ password: 'senha_errada_999' })
        });
        assert.strictEqual(wrongPassRes.status, 401, 'Senha incorreta deve retornar HTTP 401');
        console.log('   ✅ Tentativa com senha incorreta bloqueada com HTTP 401.');

        // Tentativa 3.2: Senha padrão 123456 deve autorizar
        const rightPassRes = await fetch(`${baseUrl}/api/v1/workshops/${testWsId}/verify-manager-password`, {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({ password: '123456' })
        });
        const rightPassData = await rightPassRes.json();
        assert.strictEqual(rightPassRes.status, 200, 'Senha padrão deve autorizar com status 200');
        assert.strictEqual(rightPassData.authorized, true, 'Propriedade authorized deve ser true');
        console.log('   ✅ Senha do gestor validada e acesso financeiro autorizado.');

        // ─────────────────────────────────────────────────────────────
        // TESTE 4: Lançamento de Serviço no Backend e Taxa de R$ 6,90
        // ─────────────────────────────────────────────────────────────
        console.log('\n[Teste 4] Lançamento de Serviço e Faturamento de R$ 6,90 com Foto...');
        const testPlate = 'TST' + Math.floor(1000 + Math.random() * 9000);
        const srvRes = await fetch(`${baseUrl}/api/v1/services/workshop-register`, {
            method: 'POST',
            headers: {
                'Content-Type': 'application/json',
                'Authorization': `Bearer ${loginData1.token}`
            },
            body: JSON.stringify({
                license_plate: testPlate,
                workshop_id: testWsId,
                service_title: 'Troca de Pastilhas de Freio e Discos',
                category: 'Freios',
                mileage: 52000,
                description: 'Substituição das pastilhas e retífica de discos com foto registrada.',
                service_date: new Date().toISOString().split('T')[0],
                labor_cost_cents: 18000,
                total_cost_cents: 35000,
                part_photo_url: 'https://dnaauto.com.br/uploads/photos/sample_part.jpg',
                parts_json: JSON.stringify([{ name: 'Pastilha Dianteira', quantity: 1, unit_price_cents: 17000 }])
            })
        });

        const srvData = await srvRes.json();
        assert.strictEqual(srvRes.status, 201, `Serviço deve ser criado com status 201 (recebido: ${srvRes.status} - ${JSON.stringify(srvData)})`);
        assert(srvData.serviceId, 'Deve retornar o ID do serviço');
        assert.strictEqual(srvData.attendance_fee.amount_cents, 690, 'Deve faturar a taxa de R$ 6,90');
        console.log(`   ✅ Serviço registrado sem erro HTTP 500 (ID: ${srvData.serviceId}) e taxa de R$ 6,90 faturada.`);

        console.log('\n🎉 TODOS OS TESTES PASSARAM COM 100% DE SUCESSO!\n');
    } catch (err) {
        console.error('❌ Falha nos testes:', err);
        process.exitCode = 1;
    } finally {
        server.close();
    }
});
