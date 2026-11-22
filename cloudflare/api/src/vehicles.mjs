import { ApiError, makeId, normalizePlate } from './security.mjs';
import { dbFirst, dbAll, transact, getVehicle, ensureVehicleAccess, ensureWorkshopMember,
  workshopForUser, requireRole, getString, badRequest, respond } from './dbutils.mjs';

export async function vehicleWrites(data, ownerId = null, workshopId = null) {
  const plate = normalizePlate(getString(data, 'license_plate', 'plate'));
  badRequest(plate.length !== 7, 'Informe placa válida com 7 caracteres.');
  const brand = getString(data, 'brand', 'vehicle_brand') || 'NÃO INFORMADA';
  const model = getString(data, 'model', 'vehicle_model') || 'NÃO INFORMADO';
  const yr = Number(data.manufacture_year || data.year || data.vehicle_year) || new Date().getUTCFullYear();
  badRequest(!Number.isInteger(yr) || yr < 1900 || yr > 2100, 'Ano do veículo inválido.');
  const modelYear = Number(data.model_year) || yr;
  const id = makeId('veh');
  const dnaCode = [
    'DNA-BR',
    crypto.randomUUID().slice(0, 4).toUpperCase(),
    crypto.randomUUID().slice(0, 4).toUpperCase(),
    crypto.randomUUID().slice(0, 3).toUpperCase()
  ].join('-');
  const certBytes = await crypto.subtle.digest('SHA-256', new TextEncoder().encode(id + ':' + dnaCode));
  const certHash = Array.from(new Uint8Array(certBytes), byte => byte.toString(16).padStart(2, '0')).join('');
  // Se chassi nao informado, guardar PENDENTE em vez de inventar VIN legal.
  const vin = getString(data, 'chassis_vin') || 'PENDENTE_' + crypto.randomUUID().replace(/-/g, '');
  const writes = [
    [
      'INSERT INTO vehicles (id, license_plate, chassis_vin, brand, model, manufacture_year, model_year, fuel_type, color, photo_url, current_owner_id, workshop_id) VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)',
      id, plate, vin, brand, model, yr, modelYear,
      getString(data, 'fuel_type') || 'Não informado', getString(data, 'color') || 'Não informada',
      getString(data, 'photo_url') || '/img/splash-car-hero.png', ownerId, workshopId
    ],
    [
      'INSERT INTO vehicle_dna (id, vehicle_id, dna_code, status, activation_fee_cents, certificate_hash, activated_by_workshop_id) VALUES (?, ?, ?, ?, ?, ?, ?)',
      makeId('dna'), id, dnaCode, 'ACTIVE', 0, certHash, workshopId
    ]
  ];
  return { id, dnaCode, plate, brand, model, writes };
}
async function currentRoleVehicle(db, user) {
  const ws = await workshopForUser(db, user.id);
  const owner = await dbFirst(db, 'SELECT id FROM owners WHERE user_id = ? LIMIT 1', user.id);
  return { wsId: ws?.workshop_id || null, ownerId: owner?.id || null };
}
async function listVehicles(db, user, search = '') {
  const { wsId, ownerId } = await currentRoleVehicle(db, user);
  const cond = [], params = [];
  if (user.role_code === 'OWNER') {
    cond.push('v.current_owner_id = ?'); params.push(ownerId || 'NOT_FOUND');
  } else if (user.role_code !== 'ADMIN') {
    requireRole(user, 'WORKSHOP_OWNER', 'WORKSHOP_STAFF', 'WORKSHOP_MECHANIC');
    cond.push('(v.workshop_id = ? OR v.id IN (SELECT vehicle_id FROM service_records WHERE workshop_id = ?))');
    params.push(wsId || 'NOT_FOUND', wsId || 'NOT_FOUND');
  }
  if (search) {
    cond.push('(v.license_plate LIKE ? OR v.brand LIKE ? OR v.model LIKE ? OR vd.dna_code LIKE ?)');
    const q = '%' + search.replace(/[%_]/g, '') + '%';
    params.push(q, q, q, q);
  }
  const vehicles = await dbAll(db, [
    'SELECT v.*, vd.dna_code, vd.status AS dna_status,',
    '(SELECT MAX(mileage) FROM service_records WHERE vehicle_id = v.id) AS current_mileage,',
    '(SELECT COUNT(*) FROM service_records WHERE vehicle_id = v.id) AS services_count,',
    'o.name AS owner_name FROM vehicles v LEFT JOIN vehicle_dna vd ON vd.vehicle_id = v.id',
    'LEFT JOIN owners o ON o.id = v.current_owner_id',
    cond.length ? 'WHERE ' + cond.join(' AND ') : '',
    'ORDER BY v.created_at DESC LIMIT 100'
  ].join(' '), ...params);
  return respond({ success: true, count: vehicles.length, vehicles });
}
async function registerVehicle(db, user, body) {
  const ownerLink = await currentRoleVehicle(db, user);
  const wsId = user.role_code === 'ADMIN' ? (getString(body, 'workshop_id') || null) : ownerLink.wsId;
  const ownerId = user.role_code === 'OWNER' ? ownerLink.ownerId : null;
  if (user.role_code !== 'ADMIN' && user.role_code !== 'OWNER') requireRole(user, 'WORKSHOP_OWNER', 'WORKSHOP_STAFF', 'WORKSHOP_MECHANIC');
  const payload = body.customData || body;
  const data = { ...payload, license_plate: body.plate || body.license_plate || payload.license_plate };
  const plate = normalizePlate(getString(data, 'license_plate'));
  const already = await dbFirst(db, 'SELECT id FROM vehicles WHERE license_plate = ?', plate);
  if (already) throw new ApiError(409, 'Veículo com esta placa já cadastrado.');
  const vehicle = await vehicleWrites(data, ownerId, wsId);
  await transact(db, vehicle.writes);
  return respond({ success: true, vehicle_id: vehicle.id, dna_code: vehicle.dnaCode, vehicle: { id: vehicle.id, license_plate: vehicle.plate, brand: vehicle.brand, model: vehicle.model, dna_code: vehicle.dnaCode } }, 201);
}
async function bookingWorkshops(db, user, vehicle) {
  await ensureVehicleAccess(db, user, vehicle);
  const linked = await dbFirst(db, [
    'SELECT workshop_id FROM client_activations WHERE vehicle_id = ?',
    'ORDER BY created_at ASC LIMIT 1'
  ].join(' '), vehicle.id);
  const origin = linked?.workshop_id || vehicle.activated_by_workshop_id || vehicle.workshop_id || null;
  const workshops = await dbAll(db, [
    "SELECT id, trade_name AS name, address_street, address_number, address_neighborhood,",
    "city, state, phone, verified_badge FROM workshops WHERE status IN ('APPROVED','ACTIVE')",
    'ORDER BY CASE WHEN id = ? THEN 0 ELSE 1 END, trade_name ASC'
  ].join(' '), origin);
  const result = workshops.map(w => ({
    id: w.id, name: w.name, phone: w.phone, whatsapp: w.phone,
    city: w.city, state: w.state, verified: Boolean(w.verified_badge),
    is_origin: Boolean(origin && w.id === origin),
    address: [w.address_street, w.address_number, w.address_neighborhood, w.city, w.state].filter(Boolean).join(', ')
  }));
  const preferred = result.find(w => w.is_origin) || null;
  return respond({
    success: true, vehicle_id: vehicle.id, license_plate: vehicle.license_plate,
    origin_workshop_id: preferred?.id || null,
    origin_workshop_name: preferred?.name || null, workshops: result
  });
}
async function completedMaintenance(db, user, vehicle) {
  await ensureVehicleAccess(db, user, vehicle);
  const services = await dbAll(db, [
    'SELECT sr.id, sr.service_title AS title, sr.description, sr.category,',
    'sr.service_date AS date, sr.mileage, w.trade_name AS workshop_name, sr.proof_level',
    'FROM service_records sr LEFT JOIN workshops w ON w.id = sr.workshop_id',
    "WHERE sr.vehicle_id = ? AND sr.proof_level >= 3 AND sr.workshop_confirmation_status = 'CONFIRMED'",
    'ORDER BY sr.service_date DESC LIMIT 100'
  ].join(' '), vehicle.id);
  return respond({
    success: true, vehicle: { id: vehicle.id, license_plate: vehicle.license_plate },
    pending: [], completed: services,
    prediction_status: 'PENDING_PORT' // Motor preditivo precisa de adaptacao especifica D1.
  });
}
async function history(db, user, vehicle) {
  await ensureVehicleAccess(db, user, vehicle);
  const services = await dbAll(db, [
    'SELECT s.*, w.trade_name AS workshop_name FROM service_records s',
    'LEFT JOIN workshops w ON w.id = s.workshop_id',
    'WHERE s.vehicle_id = ? ORDER BY s.service_date DESC, s.created_at DESC LIMIT 150'
  ].join(' '), vehicle.id);
  return respond({ success: true, vehicle, services, history: services });
}
export async function handleVehicles(request, env, path, body, loadUser) {
  const db = env.DB;
  const user = await loadUser(); // Sem enumeracao de placas ou dados entre usuarios.
  if (request.method === 'GET' && (path === '/vehicles' || path === '/vehicles/my-vehicles'))
    return listVehicles(db, user);
  if (request.method === 'GET' && path === '/vehicles/search')
    return listVehicles(db, user, new URL(request.url).searchParams.get('q') || '');
  if (request.method === 'POST' && (path === '/vehicles/register' || path === '/vehicles/register-from-api'))
    return registerVehicle(db, user, body);
  const m = /^\/vehicles\/([^/]+)(?:\/(.+))?$/.exec(path);
  if (!m) return null;
  const identifier = decodeURIComponent(m[1]);
  const action = m[2] || '';
  const vehicle = await getVehicle(db, identifier);
  if (!vehicle) throw new ApiError(404, 'Veículo não encontrado.');
  if (request.method === 'GET' && action === 'booking-workshops') return bookingWorkshops(db, user, vehicle);
  if (request.method === 'GET' && action === 'maintenance-overview') return completedMaintenance(db, user, vehicle);
  if (request.method === 'GET' && action === 'history') return history(db, user, vehicle);
  if (request.method === 'GET' && !action) return history(db, user, vehicle);
  if (request.method === 'GET' && action === 'odometer') {
    await ensureVehicleAccess(db, user, vehicle);
    const readings = await dbAll(db,
      'SELECT * FROM odometer_readings WHERE vehicle_id = ? ORDER BY reading_date DESC LIMIT 100',
      vehicle.id);
    return respond({ success: true, readings, odometer_readings: readings });
  }
  return null;
}
