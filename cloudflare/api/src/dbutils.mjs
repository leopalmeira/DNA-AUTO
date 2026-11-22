import { ApiError, verifyJwt, normalizePlate, sanitizeString } from './security.mjs';
export const dbFirst = (db, sql, ...params) => db.prepare(sql).bind(...params).first();
export async function dbAll(db, sql, ...params) {
  const result = await db.prepare(sql).bind(...params).all();
  return result.results || [];
}
export const dbRun = (db, sql, ...params) => db.prepare(sql).bind(...params).run();
export const statement = (db, sql, ...params) => db.prepare(sql).bind(...params);
export async function transact(db, statements) {
  if (!db || typeof db.batch !== 'function') throw new ApiError(503, 'Banco D1 não está configurado.');
  return db.batch(statements.map(([sql, ...params]) => statement(db, sql, ...params)));
}
export const respond = (data, status = 200) => ({ status, data });
export function badRequest(condition, message) {
  if (condition) throw new ApiError(400, message);
}
export function requireRole(user, ...roles) {
  if (!user || !roles.includes(user.role_code)) throw new ApiError(403, 'Acesso negado para este perfil.');
}
export async function principal(request, env) {
  const authorization = request.headers.get('Authorization') || '';
  const match = /^Bearer ([^\s]+)$/i.exec(authorization);
  if (!match) throw new ApiError(401, 'Faça login para continuar.', 'AUTH_TOKEN_MISSING');
  const jwt = await verifyJwt(env, match[1]);
  const user = await dbFirst(env.DB, [
    'SELECT u.id, u.name, u.email, u.phone, u.status, u.role_id,',
    'COALESCE(u.must_change_password, 0) AS must_change_password,',
    'r.code AS role_code, r.name AS role_name',
    'FROM users u JOIN roles r ON r.id = u.role_id WHERE u.id = ?'
  ].join(' '), jwt.sub);
  if (!user || user.status !== 'ACTIVE' || user.role_code !== jwt.role) {
    throw new ApiError(401, 'Sessão inválida ou conta inativa.');
  }
  return user;
}
export async function workshopForUser(db, userId) {
  return dbFirst(db, [
    'SELECT wu.workshop_id, wu.position_title, wu.can_activate_dna,',
    'wu.can_prove_services, w.trade_name AS workshop_name, w.cnpj AS workshop_cnpj,',
    'w.status AS workshop_status FROM workshop_users wu',
    'JOIN workshops w ON w.id = wu.workshop_id WHERE wu.user_id = ? LIMIT 1'
  ].join(' '), userId);
}
export async function ensureWorkshopMember(db, user, workshopId) {
  if (user.role_code === 'ADMIN') return true;
  requireRole(user, 'WORKSHOP_OWNER', 'WORKSHOP_MECHANIC', 'WORKSHOP_STAFF');
  const membership = await dbFirst(db, 'SELECT workshop_id FROM workshop_users WHERE user_id = ? AND workshop_id = ?', user.id, workshopId);
  if (!membership) throw new ApiError(403, 'Esta conta não pertence à oficina informada.');
  return true;
}
export async function getVehicle(db, identifier) {
  const value = String(identifier || '').trim();
  const plate = normalizePlate(value);
  return dbFirst(db, [
    'SELECT v.*, vd.dna_code, vd.status AS dna_status,',
    'vd.activated_by_workshop_id FROM vehicles v',
    'LEFT JOIN vehicle_dna vd ON vd.vehicle_id = v.id',
    'WHERE v.id = ? OR v.license_plate = ? OR vd.dna_code = ? LIMIT 1'
  ].join(' '), value, plate, value);
}
export async function ensureVehicleAccess(db, user, vehicle) {
  if (!vehicle) throw new ApiError(404, 'Veículo não encontrado.');
  if (user.role_code === 'ADMIN') return;
  if (user.role_code === 'OWNER') {
    const owner = await dbFirst(db, 'SELECT id FROM owners WHERE user_id = ? AND id = ?', user.id, vehicle.current_owner_id);
    if (owner) return;
  } else if (['WORKSHOP_OWNER', 'WORKSHOP_MECHANIC', 'WORKSHOP_STAFF'].includes(user.role_code)) {
    const match = await dbFirst(db, [
      'SELECT 1 AS ok FROM workshop_users wu WHERE wu.user_id = ?',
      'AND (wu.workshop_id = ? OR wu.workshop_id IN (',
      'SELECT workshop_id FROM service_records WHERE vehicle_id = ?)) LIMIT 1'
    ].join(' '), user.id, vehicle.workshop_id, vehicle.id);
    if (match) return;
  }
  throw new ApiError(403, 'Você não tem permissão para consultar este veículo.');
}
export const getString = (data, ...fields) => {
  for (const name of fields) {
    const value = data?.[name];
    if (value !== undefined && value !== null && String(value).trim()) return sanitizeString(value, 250);
  }
  return '';
};
