import { ApiError, hashPassword, makeId, normalizeEmail, normalizePlate } from './security.mjs';
import { dbFirst, dbAll, transact, ensureWorkshopMember,
  getString, badRequest, respond, requireRole } from './dbutils.mjs';
import { vehicleWrites } from './vehicles.mjs';

async function listNetwork(db, url) {
  const state = (url.searchParams.get('uf') || url.searchParams.get('state') || '').toUpperCase();
  const search = (url.searchParams.get('q') || '').toLowerCase();
  let workshops = await dbAll(db, [
    "SELECT id, trade_name AS name, cnpj, phone, email, address_street, address_number,",
    "address_neighborhood, city, state, zip_code, verified_badge, status",
    "FROM workshops WHERE status IN ('APPROVED','ACTIVE') ORDER BY verified_badge DESC, trade_name ASC"
  ].join(' '));
  workshops = workshops.filter(w => (!state || w.state === state) &&
    (!search || (w.name + ' ' + w.city + ' ' + w.address_neighborhood).toLowerCase().includes(search)))
    .map(w => ({
      ...w, whatsapp: (w.phone || '').replace(/\D/g, ''), verified: Boolean(w.verified_badge),
      address: [w.address_street, w.address_number, w.address_neighborhood, w.city, w.state].filter(Boolean).join(', ')
    }));
  return respond({ success: true, total: workshops.length, workshops, sp_capital_count: 0 });
}
async function registerClientByWorkshop(db, env, user, workshopId, body) {
  await ensureWorkshopMember(db, user, workshopId);
  const workshop = await dbFirst(db, 'SELECT id, trade_name FROM workshops WHERE id = ?', workshopId);
  if (!workshop) throw new ApiError(404, 'Oficina não encontrada.');
  const name = getString(body, 'client_name', 'owner_name', 'name', 'full_name');
  const email = normalizeEmail(getString(body, 'email', 'client_email', 'owner_email'));
  const phone = getString(body, 'whatsapp', 'phone', 'client_phone', 'owner_phone');
  const plate = normalizePlate(getString(body, 'license_plate', 'plate'));
  badRequest(name.length < 2 || plate.length !== 7 || !/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email),
    'Informe nome, e-mail válido e placa com 7 caracteres.');
  badRequest(phone.replace(/\D/g, '').length < 10, 'Informe WhatsApp válido.');
  const existing = await dbFirst(db, 'SELECT id, role_id, status FROM users WHERE email = ?', email);
  if (existing && existing.role_id !== 'role_owner')
    throw new ApiError(409, 'E-mail já pertence a outro perfil.', 'EMAIL_IN_USE_BY_ANOTHER_ROLE');
  if (existing && existing.status !== 'ACTIVE')
    throw new ApiError(409, 'Conta do cliente inativa.');
  const uid = existing?.id || makeId('usr');
  const linkedOwner = existing ? await dbFirst(db, 'SELECT id FROM owners WHERE user_id = ?', uid) : null;
  const oid = linkedOwner?.id || makeId('own');
  const vehicleFound = await dbFirst(db, 'SELECT id, current_owner_id FROM vehicles WHERE license_plate = ?', plate);
  if (vehicleFound?.current_owner_id && vehicleFound.current_owner_id !== oid)
    throw new ApiError(409, 'Veículo pertence a outro proprietário. Não é possível alterar a titularidade sem transferência.');
  const oldActivation = await dbFirst(db,
    'SELECT id FROM client_activations WHERE workshop_id = ? AND license_plate = ? LIMIT 1',
    workshopId, plate);
  if (oldActivation) throw new ApiError(409, 'Este veículo já foi cadastrado nesta oficina.');
  // Cada cadastro novo recebe senha única e forte. Nunca usar senha global padrao.
  const rawPassword = String(body.password || body.client_password || body.owner_password || '');
  const firstPassword = existing ? null :
    (rawPassword.length >= 8 ? rawPassword : 'DNA-' + crypto.randomUUID().replace(/-/g, '').slice(0, 16));
  const writes = [];
  if (!existing) {
    const hash = await hashPassword(firstPassword);
    writes.push([
      'INSERT OR IGNORE INTO roles (id, code, name) VALUES (?, ?, ?)',
      'role_owner', 'OWNER', 'Proprietário de Veículo'
    ]);
    writes.push([
      'INSERT INTO users (id, name, email, password_hash, phone, role_id, status, must_change_password) VALUES (?, ?, ?, ?, ?, ?, ?, ?)',
      uid, name, email, hash, phone, 'role_owner', 'ACTIVE', 1
    ]);
  }
  if (!linkedOwner) writes.push([
    'INSERT INTO owners (id, user_id, name, document_cpf, email, phone) VALUES (?, ?, ?, ?, ?, ?)',
    oid, uid, name, getString(body, 'cpf') || 'NAO_INFORMADO', email, phone
  ]);
  let v;
  if (!vehicleFound) {
    v = await vehicleWrites(body, oid, workshopId);
    writes.push(...v.writes);
  } else {
    v = { id: vehicleFound.id, plate, dnaCode: null };
    if (!vehicleFound.current_owner_id) writes.push([
      'UPDATE vehicles SET current_owner_id = ? WHERE id = ? AND current_owner_id IS NULL', oid, v.id
    ]);
  }
  const activationCode = crypto.randomUUID().replace(/-/g, '').slice(0, 16).toUpperCase();
  writes.push([
    'INSERT INTO client_activations (id, workshop_id, client_name, whatsapp, email, license_plate, activation_code, vehicle_id, owner_id, status) VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?)',
    makeId('act'), workshopId, name, phone, email, plate, activationCode, v.id, oid, 'PENDING'
  ]);
  await transact(db, writes);
  const dna = await dbFirst(db, 'SELECT dna_code FROM vehicle_dna WHERE vehicle_id = ?', v.id);
  const clientBase = String(env.CLIENT_BASE_URL || '').replace(/\/+$/, '');
  const clientUrl = clientBase ? clientBase + '/?code=' + encodeURIComponent(activationCode) : null;
  const result = {
    success: true, login_ready: true, activation_code: activationCode, dna_code: dna?.dna_code || null,
    message: 'Cliente cadastrado. O acesso individual está disponível.',
    client_app_url: clientUrl,
    client: { name, whatsapp: phone, email, plate, vehicle_id: v.id,
      account_existing: Boolean(existing), must_change_password: !existing },
    vehicle: { id: v.id, license_plate: plate, dna_code: dna?.dna_code || null },
    initial_password: firstPassword,
    whatsapp_share_text: [
      'Olá ' + name + '! Seu veículo ' + plate + ' está cadastrado na oficina ' + workshop.trade_name + '.',
      'Seu código DNA AUTO: ' + activationCode,
      clientUrl ? 'Acesse: ' + clientUrl : 'Baixe o aplicativo DNA AUTO Cliente.',
      firstPassword ? 'Senha temporária individual: ' + firstPassword + ' (troque no primeiro acesso).' : ''
    ].filter(Boolean).join('\n')
  };
  return respond(result, 201);
}
async function clientActivation(db, code, change) {
  const activation = await dbFirst(db,
    'SELECT id, vehicle_id, workshop_id, status, client_name, license_plate FROM client_activations WHERE activation_code = ?',
    String(code || '').trim().toUpperCase());
  if (!activation) throw new ApiError(404, 'Código de ativação inválido.');
  if (change) {
    await db.prepare("UPDATE client_activations SET status='ACTIVATED', activated_at=CURRENT_TIMESTAMP WHERE id=?")
      .bind(activation.id).run();
    activation.status = 'ACTIVATED';
  }
  return respond({ success: true, activation, vehicle_id: activation.vehicle_id });
}
export async function handleWorkshops(request, env, path, body, loadUser) {
  const db = env.DB;
  const url = new URL(request.url);
  if (request.method === 'GET' && (path === '/workshops' || path === '/workshops/network'))
    return listNetwork(db, url);
  const activationCheck = /^\/clients\/activation-code\/([^/]+)$/.exec(path);
  if (request.method === 'GET' && activationCheck)
    return clientActivation(db, decodeURIComponent(activationCheck[1]), false);
  if (path === '/clients/activate' && request.method === 'POST') {
    const user = await loadUser();
    requireRole(user, 'OWNER');
    const code = getString(body, 'code', 'activation_code');
    const linked = await dbFirst(db, [
      'SELECT a.id FROM client_activations a JOIN owners o ON o.id = a.owner_id',
      'WHERE a.activation_code = ? AND o.user_id = ?'
    ].join(' '), code.toUpperCase(), user.id);
    if (!linked) throw new ApiError(403, 'Código não pertence à sua conta.');
    return clientActivation(db, code, true);
  }
  const match = /^\/workshops\/([^/]+)(?:\/(.+))?$/.exec(path);
  if (!match) return null;
  const workshopId = decodeURIComponent(match[1]);
  const action = match[2] || '';
  if (request.method === 'POST' && action === 'clients/register-activation') {
    const user = await loadUser();
    return registerClientByWorkshop(db, env, user, workshopId, body);
  }
  if (request.method === 'GET' && action === 'clients/activations') {
    const user = await loadUser();
    await ensureWorkshopMember(db, user, workshopId);
    const activations = await dbAll(db,
      'SELECT * FROM client_activations WHERE workshop_id = ? ORDER BY created_at DESC LIMIT 100', workshopId);
    return respond({ success: true, activations });
  }
  if (request.method === 'GET' && action === 'dashboard') {
    const user = await loadUser();
    await ensureWorkshopMember(db, user, workshopId);
    const counts = await dbFirst(db, [
      'SELECT (SELECT COUNT(*) FROM service_records WHERE workshop_id = ?) AS total_services,',
      '(SELECT COUNT(*) FROM client_activations WHERE workshop_id = ?) AS total_clients,',
      '(SELECT COUNT(*) FROM vehicles WHERE workshop_id = ?) AS total_vehicles'
    ].join(' '), workshopId, workshopId, workshopId);
    return respond({ success: true, dashboard: counts, ...counts });
  }
  if (request.method === 'GET' && action === 'financial-summary') {
    const user = await loadUser();
    requireRole(user, 'WORKSHOP_OWNER', 'ADMIN');
    await ensureWorkshopMember(db, user, workshopId);
    const workshop = await dbFirst(db, 'SELECT id, trade_name, cnpj, city, state FROM workshops WHERE id = ?', workshopId);
    if (!workshop) throw new ApiError(404, 'Oficina não encontrada.');
    const total = await dbFirst(db, [
      'SELECT COUNT(*) AS total, COALESCE(SUM(total_cost_cents), 0) AS value',
      'FROM service_records WHERE workshop_id = ?'
    ].join(' '), workshopId);
    const vehicles = await dbAll(db, [
      'SELECT v.id, v.license_plate, v.brand, v.model FROM vehicles v',
      'WHERE v.workshop_id = ? ORDER BY v.created_at DESC LIMIT 50'
    ].join(' '), workshopId);
    const pending = await dbFirst(db, [
      'SELECT COALESCE(SUM(amount_cents), 0) AS amount FROM workshop_attendance_fees',
      "WHERE workshop_id = ? AND status IN ('CONFIRMED','PENDING')"
    ].join(' '), workshopId);
    const registered = await dbFirst(db, [
      'SELECT COUNT(*) AS amount FROM client_activations WHERE workshop_id = ?'
    ].join(' '), workshopId);
    // Nao transformar cadastros em receita sem conciliacao financeira real.
    return respond({
      success: true, workshop: { ...workshop, name: workshop.trade_name },
      summary: {
        registered_vehicles_count: registered?.amount || 0,
        passports_activated_count: 0,
        commission_generated_cents: 0,
        platform_share_cents: 0,
        mechanical_total_revenue_cents: total?.value || 0,
        pending_obligation_to_dna_cents: pending?.amount || 0,
        commissions_received_cents: 0
      },
      registered_vehicles: vehicles,
      challenge: { current: 0, target: 100 },
      days_remaining: null,
      settlement_status: 'NOT_CONFIGURED',
      billing_warning: 'Valores de ativacao zerados ate a integracao de pagamentos e conciliacao.'
    });
  }
  if (request.method === 'GET' && action === 'maintenance-alerts') {
    const user = await loadUser();
    await ensureWorkshopMember(db, user, workshopId);
    return respond({ success: true, alerts: [] });
  }
  return null;
}
