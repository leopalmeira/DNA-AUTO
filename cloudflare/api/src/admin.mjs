import { ApiError } from './security.mjs';
import { dbFirst, dbAll, requireRole, ensureVehicleAccess, getVehicle, respond } from './dbutils.mjs';

const count = async (db, table) => {
  // Nomes fixos, nunca derivados de entrada do usuario.
  const allowed = new Set(['users', 'vehicles', 'vehicle_dna', 'workshops', 'owners', 'service_records', 'invoices', 'vehicle_photos']);
  if (!allowed.has(table)) return 0;
  return (await dbFirst(db, 'SELECT COUNT(*) AS c FROM ' + table))?.c || 0;
};
async function networkStats(db) {
  const [totalVehicles, vehiclesWithDna, totalWorkshops, totalOwners,
    totalServices, totalInvoices, totalPhotos, totalUsers] = await Promise.all([
      count(db, 'vehicles'), count(db, 'vehicle_dna'), count(db, 'workshops'),
      count(db, 'owners'), count(db, 'service_records'), count(db, 'invoices'),
      count(db, 'vehicle_photos'), count(db, 'users')
    ]);
  const activeWorkshops = (await dbFirst(db,
    "SELECT COUNT(*) AS c FROM workshops WHERE status IN ('APPROVED','ACTIVE')"))?.c || 0;
  return {
    success: true, totalVehicles, vehiclesWithDna, totalWorkshops, activeWorkshops,
    totalOwners, totalServices, totalInvoices, totalPhotos, totalUsers
  };
}
export async function handleAdmin(request, env, path, body, loadUser) {
  const db = env.DB;
  const user = await loadUser();
  requireRole(user, 'ADMIN');
  if (request.method === 'GET' && (path === '/admin/network-stats' || path === '/admin/dashboard/overview'))
    return respond(await networkStats(db));
  if (request.method === 'GET' && (path === '/admin/clients-all' || path === '/admin/clients/unique')) {
    const clients = await dbAll(db, [
      'SELECT u.id, u.name, u.email, u.phone, u.status, o.id AS owner_id FROM users u',
      "JOIN owners o ON o.user_id = u.id WHERE u.role_id='role_owner'",
      'ORDER BY u.created_at DESC LIMIT 200'
    ].join(' '));
    return respond({ success: true, clients, total: clients.length });
  }
  if (request.method === 'GET' && path === '/admin/users') {
    const users = await dbAll(db, [
      'SELECT u.id, u.name, u.email, u.phone, u.status, r.code AS role_code FROM users u',
      'JOIN roles r ON r.id=u.role_id ORDER BY u.created_at DESC LIMIT 200'
    ].join(' '));
    return respond({ success: true, users, total: users.length });
  }
  if (request.method === 'GET' && (path === '/admin/workshops/summary' || path === '/admin/fleet')) {
    const workshops = await dbAll(db, 'SELECT id, trade_name, city, state, status FROM workshops ORDER BY created_at DESC LIMIT 200');
    return respond({ success: true, workshops, total: workshops.length });
  }
  if (request.method === 'GET' && (path === '/admin/maintenance-history' || path === '/admin/service-orders')) {
    const services = await dbAll(db, [
      'SELECT s.*, v.license_plate, w.trade_name AS workshop_name',
      'FROM service_records s JOIN vehicles v ON v.id = s.vehicle_id',
      'LEFT JOIN workshops w ON w.id = s.workshop_id',
      'ORDER BY s.created_at DESC LIMIT 200'
    ].join(' '));
    return respond({ success: true, services, total: services.length });
  }
  return null;
}
export async function handleDossier(request, env, path, loadUser) {
  const user = await loadUser();
  const identifier = decodeURIComponent(path.slice('/dossier/'.length).split('/')[0]);
  const vehicle = await getVehicle(env.DB, identifier);
  await ensureVehicleAccess(env.DB, user, vehicle);
  const services = await dbAll(env.DB, [
    'SELECT s.*, w.trade_name AS workshop_name FROM service_records s',
    'LEFT JOIN workshops w ON w.id = s.workshop_id WHERE s.vehicle_id = ?',
    'ORDER BY s.service_date DESC LIMIT 200'
  ].join(' '), vehicle.id);
  const documents = await dbAll(env.DB,
    'SELECT id, invoice_number, issuer_name, issue_date, total_amount_cents FROM invoices WHERE vehicle_id = ? LIMIT 100',
    vehicle.id);
  return respond({ success: true, vehicle, services, service_records: services,
    history: services, invoices: documents, dossier: { vehicle, services, invoices: documents } });
}
