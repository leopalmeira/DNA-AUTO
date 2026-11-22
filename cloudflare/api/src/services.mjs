import { ApiError, makeId, normalizePlate } from './security.mjs';
import { dbFirst, dbAll, transact, getVehicle, ensureVehicleAccess,
  ensureWorkshopMember, workshopForUser, requireRole, getString, badRequest, respond } from './dbutils.mjs';

function parseParts(value) {
  let result = value || [];
  if (typeof result === 'string') {
    try { result = JSON.parse(result); } catch { throw new ApiError(400, 'Lista de peças inválida.'); }
  }
  if (!Array.isArray(result) || result.length > 100) throw new ApiError(400, 'Lista de peças inválida.');
  return result.map(p => ({
    name: getString(p, 'name', 'part_name') || 'Peça instalada',
    unit: Number(p.unit_price_cents || 0),
    quantity: Number(p.quantity || 1),
    manufacturer: getString(p, 'manufacturer') || 'Não informada'
  }));
}
async function workshopService(request, env, user, body, files) {
  const db = env.DB;
  requireRole(user, 'ADMIN', 'WORKSHOP_OWNER', 'WORKSHOP_STAFF', 'WORKSHOP_MECHANIC');
  const membership = await workshopForUser(db, user.id);
  const workshopId = user.role_code === 'ADMIN' ? getString(body, 'workshop_id') :
    (membership?.workshop_id || '');
  badRequest(!workshopId, 'Oficina não informada.');
  await ensureWorkshopMember(db, user, workshopId);
  const workshop = await dbFirst(db, 'SELECT id, trade_name FROM workshops WHERE id = ?', workshopId);
  if (!workshop) throw new ApiError(404, 'Oficina não encontrada.');
  const plate = normalizePlate(getString(body, 'license_plate', 'plate'));
  const vehicle = await getVehicle(db, getString(body, 'vehicle_id') || plate);
  if (!vehicle) throw new ApiError(404, 'Veículo não localizado. Cadastre o veículo primeiro.');
  const title = getString(body, 'service_title', 'title');
  const category = getString(body, 'category') || 'Serviço';
  const description = getString(body, 'description') || 'Serviço registrado pela oficina.';
  const date = getString(body, 'service_date') || new Date().toISOString().slice(0, 10);
  const mileage = Number(body.mileage);
  badRequest(!title || !/^\d{4}-\d{2}-\d{2}$/.test(date) ||
    !Number.isSafeInteger(mileage) || mileage < 0, 'Informe serviço, data e quilometragem válidos.');
  const parts = parseParts(body.parts_json);
  const labor = Number(body.labor_cost_cents ?? body.cost_cents ?? body.service_value_cents ?? 0);
  badRequest(!Number.isSafeInteger(labor) || labor < 0, 'Valor de mão de obra inválido.');
  let partsCost = 0;
  for (const part of parts) {
    badRequest(!Number.isSafeInteger(part.unit) || part.unit < 0 ||
      !Number.isSafeInteger(part.quantity) || part.quantity < 1, 'Valor ou quantidade de peças inválido.');
    partsCost += part.unit * part.quantity;
  }
  const total = partsCost + labor;
  badRequest(!Number.isSafeInteger(total) || total <= 0, 'O custo total do serviço deve ser maior que zero.');
  // Nunca criar registro de anexo sem persistencia configurada; evita arquivos perdidos.
  const kvMode = Boolean(env.MEDIA_KV && typeof env.MEDIA_KV.put === 'function');
  const r2Mode = Boolean(!kvMode && env.MEDIA && typeof env.MEDIA.put === 'function');
  if (files.length && !kvMode && !r2Mode) {
    throw new ApiError(503, 'Armazenamento Cloudflare de fotos/documentos não configurado.', 'MEDIA_NOT_CONFIGURED');
  }
  if (files.length > 7) throw new ApiError(413, 'Limite de até 6 fotos e 1 nota fiscal.');
  const uploaded = [];
  for (const file of files) {
    if (!['photos', 'photo', 'invoice'].includes(file.field)) throw new ApiError(400, 'Campo de arquivo não autorizado.');
    // Workers KV Free tem 1 GB por conta, max. 25MiB por valor.
    // Limite menor reduz risco de lotar o espaço na fase piloto gratuita.
    const maxBytes = kvMode ? 2 * 1024 * 1024 : 10 * 1024 * 1024;
    if (file.file.size > maxBytes)
      throw new ApiError(413, kvMode ? 'Arquivo acima de 2 MB no plano gratuito.' : 'Arquivo acima de 10 MB.');
    const mime = file.file.type;
    if (!['image/jpeg','image/png','image/webp','application/pdf'].includes(mime)) throw new ApiError(400, 'Tipo de arquivo não permitido.');
    if (file.field !== 'invoice' && mime === 'application/pdf') throw new ApiError(400, 'PDF somente para nota fiscal.');
  }
  const serviceId = makeId('srv');
  const hasProofPhoto = files.some(item => item.field !== 'invoice');
  const proofLevel = hasProofPhoto ? 4 : 3;
  const proofStatus = hasProofPhoto ? 'WORKSHOP_PROVEN' : 'WORKSHOP_CONFIRMED';
  const photoFiles = [];
  const invoiceFiles = [];
  try {
    for (const entry of files) {
      const key = 'dna-auto/' + (entry.field === 'invoice' ? 'invoices/' : 'photos/') + crypto.randomUUID();
      const bytes = await entry.file.arrayBuffer();
      if (kvMode) {
        await env.MEDIA_KV.put(key, bytes, { metadata: { contentType: entry.file.type } });
      } else {
        await env.MEDIA.put(key, bytes, { httpMetadata: { contentType: entry.file.type } });
      }
      const url = new URL(request.url);
      const fileUrl = url.origin + '/api/v1/media/' + key;
      const record = { key, url: fileUrl };
      uploaded.push(record);
      if (entry.field === 'invoice') invoiceFiles.push(record);
      else photoFiles.push(record);
    }
    const writes = [
      [
        'INSERT INTO service_records (id, vehicle_id, workshop_id, service_date, mileage, category, service_title, description, parts_cost_cents, labor_cost_cents, total_cost_cents, warranty_months, proof_level, proof_status, workshop_confirmation_status, workshop_confirmation_date, registered_by_user_id, part_photo_url, responsible_technician_name) VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, CURRENT_TIMESTAMP, ?, ?, ?)',
        serviceId, vehicle.id, workshopId, date, mileage, category, title, description,
        partsCost, labor, total, Number(body.warranty_months || 6), proofLevel, proofStatus,
        'CONFIRMED', user.id, photoFiles[0]?.url || null,
        getString(body, 'responsible_technician_name') || user.name
      ],
      ['INSERT INTO mileage_records (id, vehicle_id, service_record_id, mileage, recorded_at, source, verified) VALUES (?, ?, ?, ?, ?, ?, 1)',
        makeId('mil'), vehicle.id, serviceId, mileage, date, 'WORKSHOP_SERVICE'],
      ['INSERT INTO odometer_readings (id, vehicle_id, reading_km, reading_date, source, recorded_by_user_id, verified) VALUES (?, ?, ?, ?, ?, ?, 1)',
        makeId('odo'), vehicle.id, mileage, date, 'WORKSHOP_SERVICE', user.id]
    ];
    for (const p of parts) {
      const partId = makeId('part');
      writes.push([
        'INSERT INTO parts (id, name, manufacturer, category) VALUES (?, ?, ?, ?)',
        partId, p.name, p.manufacturer, category
      ]);
      writes.push([
        'INSERT INTO part_installations (id, service_record_id, part_id, quantity, unit_price_cents) VALUES (?, ?, ?, ?, ?)',
        makeId('pi'), serviceId, partId, p.quantity, p.unit
      ]);
    }
    for (const [idx, photo] of photoFiles.entries()) writes.push([
      'INSERT INTO vehicle_photos (id, vehicle_id, service_record_id, workshop_id, photo_category, title, file_path, registered_by_user_id) VALUES (?, ?, ?, ?, ?, ?, ?, ?)',
      makeId('pho'), vehicle.id, serviceId, workshopId,
      idx === 0 ? 'INSTALLED_PART' : 'SERVICE_DONE', title, photo.url, user.id
    ]);
    for (const invoice of invoiceFiles) writes.push([
      'INSERT INTO invoices (id, vehicle_id, service_record_id, invoice_number, issuer_name, issue_date, total_amount_cents, file_path, verified) VALUES (?, ?, ?, ?, ?, ?, ?, ?, 1)',
      makeId('inv'), vehicle.id, serviceId, getString(body, 'invoice_number') || 'SEM_NÚMERO',
      workshop.trade_name, date, Number(body.invoice_amount_cents || total), invoice.url
    ]);
    // Fato gerador de taxa de atendimento: comprovação com foto.
    if (photoFiles.length) writes.push([
      'INSERT INTO workshop_attendance_fees (id, workshop_id, service_record_id, vehicle_id, amount_cents, status, idempotency_key, notes) VALUES (?, ?, ?, ?, 690, ?, ?, ?)',
      makeId('fee'), workshopId, serviceId, vehicle.id, 'CONFIRMED',
      'att_srv_' + serviceId + '_690', 'Taxa por serviço comprovado com foto.'
    ]);
    await transact(db, writes);
  } catch (err) {
    const storage = kvMode ? env.MEDIA_KV : env.MEDIA;
    if (storage) for (const uploadedFile of uploaded) {
      try { await storage.delete(uploadedFile.key); } catch {}
    }
    throw err;
  }
  return respond({
    success: true, serviceId, proof_level: proofLevel, proof_status: proofStatus,
    registered_by_user_id: user.id, launched_by_name: user.name,
    responsible_technician_name: user.name, part_photo_url: photoFiles[0]?.url || null,
    total_cost_cents: total, parts_cost_cents: partsCost, labor_cost_cents: labor,
    service_date: date, attendance_fee: photoFiles.length ? { amount_cents: 690, status: 'CONFIRMED' } : null,
    message: 'Serviço registrado com sucesso.'
  }, 201);
}
async function serviceHistory(db, user, identifier) {
  const vehicle = await getVehicle(db, identifier);
  await ensureVehicleAccess(db, user, vehicle);
  const services = await dbAll(db, [
    'SELECT s.*, w.trade_name AS workshop_name FROM service_records s',
    'LEFT JOIN workshops w ON w.id = s.workshop_id',
    'WHERE s.vehicle_id = ? ORDER BY s.service_date DESC LIMIT 200'
  ].join(' '), vehicle.id);
  return respond({ success: true, services, vehicle });
}
async function serveMedia(request, env, user, key) {
  if (!env.MEDIA_KV && !env.MEDIA) throw new ApiError(503, 'Armazenamento Cloudflare não configurado.');
  const pathname = new URL(request.url).origin + '/api/v1/media/' + key;
  const record = await dbFirst(env.DB, [
    'SELECT vehicle_id FROM vehicle_photos WHERE file_path = ?',
    'UNION SELECT vehicle_id FROM invoices WHERE file_path = ? LIMIT 1'
  ].join(' '), pathname, pathname);
  if (!record) throw new ApiError(404, 'Arquivo não localizado.');
  const vehicle = await getVehicle(env.DB, record.vehicle_id);
  await ensureVehicleAccess(env.DB, user, vehicle);
  if (env.MEDIA_KV) {
    const object = await env.MEDIA_KV.getWithMetadata(key, { type: 'arrayBuffer' });
    if (!object || !object.value) throw new ApiError(404, 'Arquivo não localizado.');
    return new Response(object.value, {
      headers: {
        'Content-Type': object.metadata?.contentType || 'application/octet-stream',
        'Cache-Control': 'private, no-store', 'X-Content-Type-Options': 'nosniff'
      }
    });
  }
  const object = await env.MEDIA.get(key);
  if (!object) throw new ApiError(404, 'Arquivo não localizado.');
  return new Response(object.body, {
    headers: {
      'Content-Type': object.httpMetadata?.contentType || 'application/octet-stream',
      'Cache-Control': 'private, no-store', 'X-Content-Type-Options': 'nosniff'
    }
  });
}
export async function handleServices(request, env, path, body, files, loadUser) {
  const db = env.DB;
  if (path === '/services/catalog/parts' && request.method === 'GET') {
    const parts = await dbAll(db, 'SELECT * FROM parts ORDER BY name LIMIT 500');
    return respond({ success: true, parts });
  }
  if (path === '/services/workshop-register' && request.method === 'POST')
    return workshopService(request, env, await loadUser(), body, files);
  if (path === '/services/owner-declare' && request.method === 'POST')
    throw new ApiError(403, 'O histórico comprovado de manutenção só pode ser lançado por oficina credenciada.');
  const h = /^\/services\/history\/([^/]+)$/.exec(path);
  if (h && request.method === 'GET') return serviceHistory(db, await loadUser(), decodeURIComponent(h[1]));
  const media = /^\/media\/(dna-auto\/(?:photos|invoices)\/[a-f0-9-]+)$/.exec(path);
  if (media && request.method === 'GET') return serveMedia(request, env, await loadUser(), media[1]);
  return null;
}
