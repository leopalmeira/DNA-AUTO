import { ApiError, hashPassword, verifyPassword, signJwt,
  verifyBootstrapKey, makeId, normalizeEmail, normalizePlate } from './security.mjs';
import { dbFirst, transact, requireRole, workshopForUser, getString,
  badRequest, respond } from './dbutils.mjs';

const MAIL = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
const TITLE = 'Proprietário / Responsável Técnico';
const roleSql = [
  ['role_admin', 'ADMIN', 'Administrador DNA AUTO'],
  ['role_owner', 'OWNER', 'Proprietário de Veículo'],
  ['role_workshop_owner', 'WORKSHOP_OWNER', 'Gestor da Oficina'],
  ['role_workshop_staff', 'WORKSHOP_STAFF', 'Equipe da Oficina']
];
function validNameAndEmail(name, email) {
  badRequest(!name || name.length < 2 || name.length > 150, 'Informe um nome válido.');
  badRequest(!MAIL.test(email) || email.length > 254, 'Informe um e-mail válido.');
}
async function ownerPrimaryVehicle(db, ownerId) {
  if (!ownerId) return null;
  const v = await dbFirst(db, [
    'SELECT v.*, vd.dna_code FROM vehicles v',
    'LEFT JOIN vehicle_dna vd ON vd.vehicle_id = v.id',
    'WHERE v.current_owner_id = ? ORDER BY v.created_at DESC LIMIT 1'
  ].join(' '), ownerId);
  return v ? {
    id: v.id, license_plate: v.license_plate, brand: v.brand, model: v.model,
    full_title: (v.brand + ' ' + v.model).trim(), model_year: v.model_year,
    manufacture_year: v.manufacture_year, color: v.color,
    fuel_type: v.fuel_type, photo_url: v.photo_url || '/img/splash-car-hero.png',
    dna_code: v.dna_code || null
  } : null;
}
export async function loginProfile(env, user) {
  const workshop = await workshopForUser(env.DB, user.id);
  const own = await dbFirst(env.DB, 'SELECT id FROM owners WHERE user_id = ? LIMIT 1', user.id);
  const vehicle = await ownerPrimaryVehicle(env.DB, own?.id);
  const isRegistrar = user.role_code === 'WORKSHOP_STAFF';
  const safeUser = {
    id: user.id, name: user.name, email: user.email, phone: user.phone,
    role_code: user.role_code, role_name: user.role_name,
    is_registrar: isRegistrar, can_access_billing: !isRegistrar,
    must_change_password: Boolean(user.must_change_password),
    workshop: workshop ? { ...workshop, is_registrar: isRegistrar, can_access_billing: !isRegistrar } : null,
    vehicle
  };
  return {
    token: await signJwt(env, user),
    must_change_password: Boolean(user.must_change_password),
    primaryVehicle: vehicle, user: safeUser
  };
}
async function registerClient(db, env, b) {
  const name = getString(b, 'name', 'client_name');
  const email = normalizeEmail(getString(b, 'email', 'client_email'));
  const password = String(b.password || '');
  validNameAndEmail(name, email);
  badRequest(password.length < 8, 'Defina uma senha de no mínimo 8 caracteres.');
  const existing = await dbFirst(db, 'SELECT id FROM users WHERE email = ?', email);
  if (existing) throw new ApiError(409, 'E-mail já cadastrado.', 'EMAIL_ALREADY_REGISTERED');
  const userId = makeId('usr'), ownerId = makeId('own');
  const hash = await hashPassword(password);
  const phone = getString(b, 'phone', 'whatsapp');
  const cpf = getString(b, 'cpf', 'document_cpf') || 'NAO_INFORMADO';
  await transact(db, [
    ['INSERT OR IGNORE INTO roles (id, code, name) VALUES (?, ?, ?)', 'role_owner', 'OWNER', 'Proprietário de Veículo'],
    ['INSERT INTO users (id, name, email, phone, role_id, password_hash, status, must_change_password) VALUES (?, ?, ?, ?, ?, ?, ?, ?)',
      userId, name, email, phone, 'role_owner', hash, 'ACTIVE', 0],
    ['INSERT INTO owners (id, user_id, name, document_cpf, email, phone) VALUES (?, ?, ?, ?, ?, ?)',
      ownerId, userId, name, cpf, email, phone]
  ]);
  const user = { id: userId, name, email, phone, role_code: 'OWNER', role_name: 'Proprietário de Veículo', must_change_password: 0 };
  return respond(await loginProfile(env, user), 201);
}
async function registerWorkshop(db, env, b) {
  const name = getString(b, 'tradeName', 'trade_name', 'workshop_name', 'name', 'nome');
  const company = getString(b, 'companyName', 'company_name') || name;
  const email = normalizeEmail(getString(b, 'email'));
  const password = String(b.password || b.senha || '');
  validNameAndEmail(name, email);
  badRequest(password.length < 8, 'Defina uma senha de no mínimo 8 caracteres.');
  const exists = await dbFirst(db, 'SELECT id FROM users WHERE email = ?', email);
  if (exists) throw new ApiError(409, 'E-mail já cadastrado. Entre na sua conta para vincular a oficina.');
  const userId = makeId('usr'), wsId = makeId('ws'), hash = await hashPassword(password);
  const cnpj = getString(b, 'cnpj').replace(/\D/g, '') || 'TEMP' + makeId('').slice(1, 17);
  badRequest(cnpj.length > 25, 'CNPJ inválido.');
  const phone = getString(b, 'phone', 'whatsapp', 'telefone') || 'NÃO INFORMADO';
  const street = getString(b, 'addressStreet', 'address_street') || 'NÃO INFORMADO';
  const number = getString(b, 'addressNumber', 'address_number') || 'S/N';
  const neighborhood = getString(b, 'addressNeighborhood', 'address_neighborhood') || 'NÃO INFORMADO';
  const city = getString(b, 'city', 'cidade') || 'NÃO INFORMADO';
  const state = getString(b, 'state', 'uf').toUpperCase() || 'NI';
  const zip = getString(b, 'zipCode', 'cep') || 'NÃO INFORMADO';
  const technician = getString(b, 'technicianName', 'technician_name', 'admin_name') || name;
  await transact(db, [
    ['INSERT OR IGNORE INTO roles (id, code, name) VALUES (?, ?, ?)', 'role_workshop_owner', 'WORKSHOP_OWNER', 'Gestor da Oficina'],
    ['INSERT INTO users (id, name, email, password_hash, phone, role_id, status, must_change_password) VALUES (?, ?, ?, ?, ?, ?, ?, 0)',
      userId, technician, email, hash, phone, 'role_workshop_owner', 'ACTIVE'],
    ['INSERT INTO workshops (id, company_name, trade_name, cnpj, phone, email, address_street, address_number, address_neighborhood, city, state, zip_code, status, verified_badge) VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, 0)',
      wsId, company, name, cnpj, phone, email, street, number, neighborhood, city, state, zip, 'APPROVED'],
    ['INSERT INTO workshop_users (id, workshop_id, user_id, position_title, can_activate_dna, can_prove_services) VALUES (?, ?, ?, ?, 1, 1)',
      makeId('wu'), wsId, userId, TITLE]
  ]);
  const user = { id: userId, name: technician, email, phone,
    role_code: 'WORKSHOP_OWNER', role_name: 'Gestor da Oficina', must_change_password: 0 };
  const data = await loginProfile(env, user);
  return respond({ ...data, workshop_id: wsId, success: true }, 201);
}
async function bootstrapAdmin(request, db, env, b) {
  const token = (request.headers.get('Authorization') || '').replace(/^Bearer\s+/i, '');
  if (!(await verifyBootstrapKey(env, token))) throw new ApiError(403, 'Autorização inicial inválida.');
  const email = normalizeEmail(getString(b, 'email'));
  const name = getString(b, 'name');
  const password = String(b.password || '');
  validNameAndEmail(name, email);
  badRequest(password.length < 12, 'Senha administrativa deve ter pelo menos 12 caracteres.');
  const userId = makeId('usr');
  const hash = await hashPassword(password);
  const commands = roleSql.map(([id, code, label]) => [
    'INSERT OR IGNORE INTO roles (id, code, name) VALUES (?, ?, ?)', id, code, label
  ]);
  // INSERT condicional impede segundo admin mesmo com solicitações simultâneas.
  commands.push([
    'INSERT INTO users (id, name, email, password_hash, role_id, status, must_change_password) ' +
    "SELECT ?, ?, ?, ?, 'role_admin', 'ACTIVE', 0 WHERE NOT EXISTS (SELECT 1 FROM users WHERE role_id = 'role_admin')",
    userId, name, email, hash
  ]);
  const result = await transact(db, commands);
  if (!result.at(-1)?.meta?.changes) throw new ApiError(409, 'Administrador já inicializado.');
  return respond({ success: true, message: 'Administrador criado. Retire o segredo de inicialização da conta.' }, 201);
}
async function login(db, env, b) {
  const rawId = getString(b, 'email');
  const email = normalizeEmail(rawId);
  const password = String(b.password || '');
  badRequest(!rawId || !password, 'Informe login e senha.');
  let user = await dbFirst(db, [
    'SELECT u.*, r.code AS role_code, r.name AS role_name FROM users u',
    'JOIN roles r ON r.id = u.role_id WHERE LOWER(TRIM(u.email)) = ? LIMIT 1'
  ].join(' '), email);
  if (!user && rawId.replace(/\D/g, '').length >= 10) {
    const digits = rawId.replace(/\D/g, '');
    user = await dbFirst(db, [
      'SELECT u.*, r.code AS role_code, r.name AS role_name FROM users u',
      'JOIN roles r ON r.id = u.role_id WHERE',
      "REPLACE(REPLACE(REPLACE(REPLACE(u.phone,'(',''),')',''),'-',''),' ','') = ? LIMIT 1"
    ].join(' '), digits);
  }
  if (!user || user.status !== 'ACTIVE' || !(await verifyPassword(password, user.password_hash))) {
    throw new ApiError(401, 'Credenciais inválidas.');
  }
  if (user.role_code === 'REPRESENTATIVE' &&
      String(b.app_context || '').toUpperCase() !== 'REPRESENTATIVE_PORTAL') {
    throw new ApiError(403, 'O representante deve acessar exclusivamente seu portal.');
  }
  return respond(await loginProfile(env, user));
}
async function changePassword(db, user, b) {
  const oldPass = String(b.current_password || b.currentPassword || b.oldPassword || '');
  const newPass = String(b.new_password || b.newPassword || '');
  const current = await dbFirst(db, 'SELECT password_hash FROM users WHERE id = ?', user.id);
  if (!oldPass || !(await verifyPassword(oldPass, current.password_hash))) {
    throw new ApiError(403, 'Senha atual incorreta.');
  }
  const newHash = await hashPassword(newPass);
  await dbFirst(db, 'SELECT id FROM users WHERE id = ?', user.id);
  await db.prepare('UPDATE users SET password_hash = ?, must_change_password = 0, updated_at = CURRENT_TIMESTAMP WHERE id = ?').bind(newHash, user.id).run();
  return respond({ success: true, message: 'Senha alterada com sucesso.' });
}
export async function handleAuth(request, env, path, body, loadUser) {
  const db = env.DB, method = request.method;
  if (path === '/auth/bootstrap-admin' && method === 'POST') return bootstrapAdmin(request, db, env, body);
  if (path === '/auth/login' && method === 'POST') return login(db, env, body);
  if (path === '/auth/register-client' && method === 'POST') return registerClient(db, env, body);
  if (path === '/auth/register-owner' && method === 'POST') return registerClient(db, env, body);
  if (path === '/auth/register-workshop' && method === 'POST') return registerWorkshop(db, env, body);
  if (path === '/auth/me' && method === 'GET') {
    const u = await loadUser();
    const p = await loginProfile(env, u);
    const { token, ...profile } = p;
    return respond(profile);
  }
  if ((path === '/auth/change-initial-password' || path === '/auth/change-password') && method === 'POST')
    return changePassword(db, await loadUser(), body);
  if (path === '/auth/demo-users' && method === 'GET') return respond({ users: [] });
  return null;
}
