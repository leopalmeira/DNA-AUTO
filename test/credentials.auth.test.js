const assert = require('assert');
const http = require('http');
const express = require('express');
const db = require('../server/src/database/db');
const authRoutes = require('../server/src/modules/auth/auth.routes');
const workshopsRoutes = require('../server/src/modules/workshops/workshops.routes');

const app = express();
app.use(express.json());
app.use('/api/v1/auth', authRoutes);
app.use('/api/v1/workshops', workshopsRoutes);

const testRunId = Date.now();
const testClientEmail = `cliente.auto.${testRunId}@teste.com.br`;
const testClientCpf = `987.${String(testRunId).slice(-3)}.${String(testRunId).slice(-6, -3)}-99`;
const testClientCpfClean = testClientCpf.replace(/\D/g, '');
const testClientPhone = `(11) 9${String(testRunId).slice(-4)}-${String(testRunId).slice(-4)}`;
const testClientPlate = `AUT${String(testRunId).slice(-4).toUpperCase()}`;

const testStaffEmail = `staff.oficina.${testRunId}@teste.com.br`;

async function run() {
    console.log('🧪 Iniciando Teste de Homologação de Credenciais de Clientes e Funcionários...');

    const server = app.listen(0);
    const port = server.address().port;
    const baseUrl = `http://127.0.0.1:${port}`;

    async function postJson(path, payload, token) {
        const headers = { 'Content-Type': 'application/json' };
        if (token) headers['Authorization'] = `Bearer ${token}`;
        const res = await fetch(`${baseUrl}${path}`, {
            method: 'POST',
            headers,
            body: JSON.stringify(payload)
        });
        const data = await res.json().catch(() => ({}));
        return { status: res.status, data };
    }

    try {
        // ─── 1. Oficina cadastra novo cliente e veículo com senha padrão 123456 ───
        console.log('\n[Cenário 1] Oficina cadastra veículo e cliente...');
        const regClientRes = await postJson('/api/v1/auth/register-client', {
            name: 'Cliente Homologação Auth',
            email: testClientEmail,
            phone: testClientPhone,
            cpf: testClientCpf,
            license_plate: testClientPlate,
            brand: 'Toyota',
            model: 'Corolla Altis',
            year: 2023,
            registered_by_workshop: true,
            must_change_password: true
        });
        assert.strictEqual(regClientRes.status, 201, 'Cadastro do cliente pela oficina deve retornar 201');
        assert.ok(regClientRes.data.user, 'Deve retornar dados do usuário criado');
        console.log('✅ Cliente cadastrado com sucesso:', testClientEmail, '| Placa:', testClientPlate);

        // ─── 2. Cliente faz login com E-MAIL e senha 123456 ───
        console.log('\n[Cenário 2] Cliente faz login com E-MAIL e senha 123456...');
        const loginEmailRes = await postJson('/api/v1/auth/login', {
            email: testClientEmail,
            password: '123456'
        });
        assert.strictEqual(loginEmailRes.status, 200, 'Login por e-mail deve retornar 200');
        assert.ok(loginEmailRes.data.token, 'Deve retornar token JWT');
        assert.strictEqual(loginEmailRes.data.must_change_password, true, 'Deve solicitar troca de senha inicial');
        const clientToken = loginEmailRes.data.token;
        console.log('✅ Login por e-mail validado com sucesso.');

        // ─── 3. Cliente faz login com CPF (formatado e dígitos) ───
        console.log('\n[Cenário 3] Cliente faz login com CPF...');
        const loginCpfRes = await postJson('/api/v1/auth/login', {
            email: testClientCpf,
            password: '123456'
        });
        assert.strictEqual(loginCpfRes.status, 200, 'Login por CPF formatado deve retornar 200');
        assert.strictEqual(loginCpfRes.data.user.email, testClientEmail);

        const loginCpfCleanRes = await postJson('/api/v1/auth/login', {
            email: testClientCpfClean,
            password: '123456'
        });
        assert.strictEqual(loginCpfCleanRes.status, 200, 'Login por CPF limpo (dígitos) deve retornar 200');
        console.log('✅ Login por CPF validado com sucesso.');

        // ─── 4. Cliente faz login com WHATSAPP/TELEFONE ───
        console.log('\n[Cenário 4] Cliente faz login com WhatsApp/Telefone...');
        const loginPhoneRes = await postJson('/api/v1/auth/login', {
            email: testClientPhone,
            password: '123456'
        });
        assert.strictEqual(loginPhoneRes.status, 200, 'Login por telefone deve retornar 200');
        assert.strictEqual(loginPhoneRes.data.user.email, testClientEmail);
        console.log('✅ Login por WhatsApp/Telefone validado com sucesso.');

        // ─── 5. Cliente faz login com a PLACA DO VEÍCULO ───
        console.log('\n[Cenário 5] Cliente faz login com a Placa do Carro...');
        const loginPlateRes = await postJson('/api/v1/auth/login', {
            email: testClientPlate,
            password: '123456'
        });
        assert.strictEqual(loginPlateRes.status, 200, 'Login por placa do carro deve retornar 200');
        assert.strictEqual(loginPlateRes.data.user.email, testClientEmail);
        console.log('✅ Login por Placa do Veículo validado com sucesso.');

        // ─── 6. Cliente faz a troca de senha no primeiro acesso ───
        console.log('\n[Cenário 6] Cliente troca senha inicial no primeiro acesso...');
        const changePassRes = await postJson('/api/v1/auth/change-initial-password', {
            email: testClientEmail,
            current_password: '123456',
            new_password: 'NovaSenhaSegura@2026',
            confirm_password: 'NovaSenhaSegura@2026'
        }, clientToken);
        assert.strictEqual(changePassRes.status, 200, 'Troca de senha inicial deve retornar 200');
        assert.strictEqual(changePassRes.data.success, true);
        console.log('✅ Nova senha gravada com sucesso.');

        // ─── 7. Cliente faz login com a nova senha ───
        console.log('\n[Cenário 7] Cliente faz login com a nova senha pessoal...');
        const loginNewPassRes = await postJson('/api/v1/auth/login', {
            email: testClientEmail,
            password: 'NovaSenhaSegura@2026'
        });
        assert.strictEqual(loginNewPassRes.status, 200, 'Login com nova senha deve retornar 200');
        assert.strictEqual(loginNewPassRes.data.must_change_password, false, 'must_change_password deve ser falso');
        console.log('✅ Login com nova senha pessoal validado com sucesso.');

        // ─── Cadastro REAL pela Oficina → login → troca de senha → segundo veículo ───
        const officeEmail = `cliente.oficina.${testRunId}@teste.com.br`;
        const officePlate = `OFI${String(testRunId).slice(-4)}`;
        const activation = await postJson('/api/v1/workshops/ws_veloce/clients/register-activation', {
            license_plate: officePlate, client_name: 'Cliente da Oficina',
            client_phone: testClientPhone, email: officeEmail, password: '123456',
            brand: 'Toyota', model: 'Corolla'
        });
        assert.strictEqual(activation.status, 201, 'Cadastro/ativação pela oficina deve retornar 201');
        assert.strictEqual(activation.data.login_ready, true);
        assert.strictEqual(activation.data.client.account_existing, false);
        assert.ok(activation.data.client.vehicle_id, 'Veículo deve ser vinculado');
        const officeLogin = await postJson('/api/v1/auth/login', { email: officeEmail, password: '123456' });
        assert.strictEqual(officeLogin.status, 200, 'Login com senha inicial da oficina deve funcionar');
        assert.ok(officeLogin.data.token, 'JWT deve ser gerado');
        assert.strictEqual(officeLogin.data.must_change_password, true);
        assert.strictEqual(officeLogin.data.primaryVehicle.license_plate, officePlate);
        const badLogin = await postJson('/api/v1/auth/login', { email: officeEmail, password: 'errada' });
        assert.strictEqual(badLogin.status, 401, 'Senha incorreta não pode entrar');
        const passChanged = await postJson('/api/v1/auth/change-initial-password', {
            email: officeEmail, current_password: '123456',
            new_password: 'SenhaPessoal#2026', confirm_password: 'SenhaPessoal#2026'
        }, officeLogin.data.token);
        assert.strictEqual(passChanged.status, 200, 'Cliente deve poder trocar senha');
        const secondActivation = await postJson('/api/v1/workshops/ws_veloce/clients/register-activation', {
            license_plate: `OFJ${String(testRunId).slice(-4)}`,
            client_name: 'Cliente da Oficina', client_phone: testClientPhone,
            email: officeEmail, password: '123456', brand: 'Honda', model: 'Civic'
        });
        assert.strictEqual(secondActivation.status, 201, 'Segundo veículo deve ser vinculado');
        assert.strictEqual(secondActivation.data.client.account_existing, true);
        const loginPersonal = await postJson('/api/v1/auth/login', {
            email: officeEmail, password: 'SenhaPessoal#2026'
        });
        assert.strictEqual(loginPersonal.status, 200, 'Senha pessoal deve continuar funcionando');
        assert.strictEqual(loginPersonal.data.must_change_password, false);
        const oldPassword = await postJson('/api/v1/auth/login', { email: officeEmail, password: '123456' });
        assert.strictEqual(oldPassword.status, 401, 'Senha inicial antiga não pode ser reutilizada');
        const takeover = await postJson('/api/v1/auth/register-client', {
            name: 'Cadastro Indevido', email: officeEmail, password: '123456'
        });
        assert.strictEqual(takeover.status, 409, 'Cadastro público não pode redefinir senha existente');
        console.log('✅ Cadastro pela oficina, login, troca de senha, vínculo de veículos e proteção aprovados.');

        // ─── 8. Oficina cadastra novo Registrador / Funcionário ───
        console.log('\n[Cenário 8] Oficina cadastra Registrador técnico com senha gerada...');
        const regStaffRes = await postJson('/api/v1/workshops/ws_veloce/registrars', {
            name: 'Carlos Registrador Mecânico',
            email: testStaffEmail,
            password: 'REG98K'
        });
        assert.strictEqual(regStaffRes.status, 201, 'Cadastro de registrador deve retornar 201');
        assert.ok(regStaffRes.data.registrar, 'Deve retornar dados do registrador');
        assert.strictEqual(regStaffRes.data.registrar.generated_password, 'REG98K');
        console.log('✅ Registrador cadastrado com senha gerada:', 'REG98K');

        // ─── 9. Funcionário faz login com senha gerada (Maiúscula) ───
        console.log('\n[Cenário 9] Funcionário faz login com senha gerada (REG98K)...');
        const loginStaffUpper = await postJson('/api/v1/auth/login', {
            email: testStaffEmail,
            password: 'REG98K'
        });
        assert.strictEqual(loginStaffUpper.status, 200, 'Login do funcionário deve retornar 200');
        assert.strictEqual(loginStaffUpper.data.user.role_code, 'WORKSHOP_STAFF');
        assert.strictEqual(loginStaffUpper.data.user.is_registrar, true);
        assert.strictEqual(loginStaffUpper.data.user.can_access_billing, false, 'Faturamento deve estar bloqueado para registrador');
        assert.ok(loginStaffUpper.data.user.workshop, 'Deve retornar objeto workshop');
        assert.ok(loginStaffUpper.data.user.workshop.workshop_id, 'Deve conter workshop_id');
        console.log('✅ Login do funcionário com senha gerada aprovado com faturamento bloqueado.');

        // ─── 10. Funcionário faz login com senha em minúsculas (reg98k) ───
        console.log('\n[Cenário 10] Funcionário faz login com senha em minúsculas (reg98k)...');
        const loginStaffLower = await postJson('/api/v1/auth/login', {
            email: testStaffEmail,
            password: 'reg98k'
        });
        assert.strictEqual(loginStaffLower.status, 200, 'Login do funcionário com minúsculas deve retornar 200');
        console.log('✅ Suporte a minúsculas e variações mobile validado.');

        // ─── 11. Funcionário faz login com senha inicial padrão 123456 ───
        console.log('\n[Cenário 11] Funcionário faz login com senha inicial padrão 123456...');
        const loginStaffDefault = await postJson('/api/v1/auth/login', {
            email: testStaffEmail,
            password: '123456'
        });
        assert.strictEqual(loginStaffDefault.status, 200, 'Login do funcionário com 123456 deve retornar 200');
        console.log('✅ Suporte a senha 123456 para funcionários validado.');

        // ─── 12. Cadastrar funcionário com e-mail já existente (sem erro 409) ───
        console.log('\n[Cenário 12] Atualizar/recadastrar registrador sem erro 409...');
        const regStaffUpdate = await postJson('/api/v1/workshops/ws_veloce/registrars', {
            name: 'Carlos Registrador Atualizado',
            email: testStaffEmail,
            password: 'NEWPASS99'
        });
        assert.strictEqual(regStaffUpdate.status, 201, 'Deve aceitar atualização sem 409');
        const loginStaffUpdated = await postJson('/api/v1/auth/login', {
            email: testStaffEmail,
            password: 'NEWPASS99'
        });
        assert.strictEqual(loginStaffUpdated.status, 200, 'Deve logar com a nova senha');
        console.log('✅ Atualização resiliente de funcionário sem 409 validada.');

        console.log('\n🎉 TODOS OS 12 CENÁRIOS DE AUTENTICAÇÃO E CREDENCIAIS FORAM APROVADOS COM 100% DE ÊXITO!\n');
    } finally {
        server.close();
    }
}

run().catch(err => {
    console.error('❌ Falha nos testes de credenciais:', err);
    process.exit(1);
});

