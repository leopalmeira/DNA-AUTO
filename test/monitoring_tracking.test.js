'use strict';
const assert = require('node:assert/strict');
const fs = require('node:fs');
const path = require('node:path');
const vm = require('node:vm');
const Database = require('better-sqlite3');
const Predictive = require('../server/src/services/predictiveMaintenance.service');
const root = path.resolve(__dirname, '..');
const read = p => fs.readFileSync(path.join(root, p), 'utf8');

// 80 e 50 são distância RESTANTE para a revisão, não km rodados após cadastro.
const pred = [{ next_due_km: 10000, alert_status: 'APROXIMANDO' }];
for (const [officialKm, estimatedKm, source, stage] of [
  [0, 0, 'NONE', 'INITIAL'],
  [9000, 919.9, 'WORKSHOP_ENTRY', 'OK'],
  [9000, 920, 'WORKSHOP_ENTRY', 'PRENOTICE'],
  [9000, 949.9, 'WORKSHOP_ENTRY', 'PRENOTICE'],
  [9000, 950, 'WORKSHOP_ENTRY', 'REQUIRED'],
  [9950, 0, 'OWNER_DASHBOARD', 'OK'],
  [9000, 1000, 'WORKSHOP_ENTRY', 'REQUIRED']
]) {
  const status = Predictive.getOdometerConfirmationStatus(officialKm, estimatedKm, pred, source);
  assert.equal(status.stage, stage, `official=${officialKm} distance=${estimatedKm}`);
  assert.equal(status.pre_notice_when_remaining_km, 80);
  assert.equal(status.confirmation_when_remaining_km, 50);
}
assert.equal(Predictive.getOdometerConfirmationStatus(9000, 950, pred).remaining_to_maintenance_km, 50);
assert.equal(Predictive.getOdometerConfirmationStatus(9000, 100, []).stage, 'OK');

// Leituras no mesmo dia só contabilizam viagens posteriores à hora real de confirmação.
// Veículos diferentes, transportes alternativos e feedback falso não somam km.
const db = new Database(':memory:');
db.exec(`CREATE TABLE vehicle_trips (id TEXT PRIMARY KEY, vehicle_id TEXT, classification TEXT,
  is_validated_by_user INTEGER, end_time TEXT, distance_km REAL)`);
const ins = db.prepare('INSERT INTO vehicle_trips VALUES (?, ?, ?, ?, ?, ?)');
ins.run('old', 'veh1', 'IN_VEHICLE', null, '2026-11-21T09:00:00Z', 10);
ins.run('accepted', 'veh1', 'IN_VEHICLE', null, '2026-11-21T11:00:00Z', 7.5);
ins.run('denied', 'veh1', 'IN_VEHICLE', 0, '2026-11-21T12:00:00Z', 30);
ins.run('bus', 'veh1', 'OTHER_TRANSPORT', null, '2026-11-21T12:30:00Z', 22);
ins.run('different', 'veh2', 'IN_VEHICLE', null, '2026-11-21T13:00:00Z', 88);
const tally = Predictive.getEstimatedDistanceSinceOfficial(db, 'veh1', '2026-11-21T10:00:00Z');
assert.equal(tally.estimated_km, 7.5);
assert.equal(tally.trips_count, 1);
db.close();

const gpsTrip = { duration_seconds: 720, distance_km: 6.1, avg_speed_kmh: 31,
  max_speed_kmh: 60, bluetooth_connected: false, accelerometer_profile: 'UNKNOWN',
  samples_count: 45, samples_high_accuracy: 39 };
assert.equal(Predictive.classifyTrip(gpsTrip).classification, 'IN_VEHICLE');
assert.equal(Predictive.classifyTrip({...gpsTrip, avg_speed_kmh:5, max_speed_kmh:8,
  accelerometer_profile:'WALKING_STEPS'}).classification, 'WALKING');

const engine = read('cliente.app/js/components/clientTrackingEngine.js');
const owner = read('cliente.app/js/components/ownerView.js');
new vm.Script(engine);
new vm.Script(owner);
assert.equal(engine, read('public/js/components/clientTrackingEngine.js'));
assert.equal(owner, read('public/js/components/ownerView.js'));
assert.match(engine, /registerPlugin\('DnaMileage'\)/);
assert.match(engine, /Authorization: 'Bearer '/);
assert.match(engine, /showUrgentMaintenance/);
assert.match(engine, /nextMaintenance\?\.item_name/);
assert.match(engine, /state\.moving/);
assert.match(engine, /dna-critical-pulse/);
assert.match(owner, /renderOdometerReminder/);
assert.match(owner, /saveVehicleMonitoringPreferences/);
for (const p of ['cliente.app/index.html', 'public/cliente.html']) {
  const h = read(p);
  assert.ok(h.includes('clientTrackingEngine.js'));
  assert.ok(h.indexOf('clientTrackingEngine.js') < h.indexOf('ownerView.js'));
}
assert.equal(read('cliente.app/index.html'), read('public/cliente.html'));

const native = read('scripts/dna-mileage-android.js');
new vm.Script(native);
assert.match(native, /START_STICKY/);
assert.match(native, /startForeground/);
assert.match(native, /pendingTrips/);
assert.match(native, /speedKmh >= 20/);
assert.match(native, /remaining <= 40f/);
assert.match(native, /targetName/);
assert.match(native, /alert40/);
assert.match(native, /NotificationCompat\.CATEGORY_REMINDER/);
assert.doesNotMatch(native, /setFullScreenIntent/);
assert.doesNotMatch(native, /edit\.putString\("pendingTrips", "\[\]"\)/);
const api = read('server/src/modules/vehicles/vehicles.routes.js');
assert.match(api, /authenticateToken, authorizeTrackingVehicleOwner/);
assert.match(api, /odometer_confirmation/);
console.log('OK: avisos 80/50/40 km, peça específica, tela de retorno segura e GPS nativo.');
