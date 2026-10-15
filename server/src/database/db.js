const Database = require('better-sqlite3');
const path = require('path');
const fs = require('fs');

const DB_PATH = process.env.DB_PATH || path.join(__dirname, '..', '..', 'dna_auto.db');
const SCHEMA_PATH = path.join(__dirname, 'schema.sql');

// Inicialização do Banco SQLite
const db = new Database(DB_PATH, {
    verbose: process.env.NODE_ENV === 'development' ? null : null
});

// Configurações de Concorrência e Integridade
db.pragma('journal_mode = WAL');
db.pragma('foreign_keys = ON');
db.pragma('synchronous = NORMAL');

// Função SQL customizada para busca textual insensível a acentos
db.function('unaccent', (text) => {
    if (!text) return '';
    return text.toString().normalize('NFD').replace(/[\u0300-\u036f]/g, '').toLowerCase();
});

// Executa schema se banco acabou de ser criado ou tabelas faltam
function initializeDatabase() {
    try {
        const schema = fs.readFileSync(SCHEMA_PATH, 'utf8');
        db.exec(schema);
        console.log('✅ Banco de dados DNA AUTO inicializado com sucesso.');
    } catch (error) {
        console.error('❌ Erro ao inicializar o banco de dados:', error);
        throw error;
    }
}

// Inicializa o banco imediatamente
initializeDatabase();
// Exporta o banco imediatamente para que módulos dependentes (como seed) acessem a instância
module.exports = db;

// Executa seed base (apenas permissões, roles e admin) caso o administrador não exista
try {
    const adminUser = db.prepare("SELECT id FROM users WHERE id = 'usr_admin' OR email = 'admin@dnaauto.com.br'").get();
    if (!adminUser) {
        console.log('🌱 Inicializando estrutura base limpa com Administrador Geral...');
        const { seedBase } = require('./seed');
        seedBase(db);
    }
} catch (e) {
    console.warn('Verificação de inicialização base ignorada:', e.message);
}

// Garantir presença do conector oficial da API Placas
try {
    const hasPlacas = db.prepare(`SELECT id FROM integrations WHERE service_code = 'API_PLACAS'`).get();
    if (!hasPlacas) {
        db.prepare(`
            INSERT INTO integrations (id, service_code, service_name, is_enabled, is_connected, endpoint_url, api_key_masked, status_message)
            VALUES ('int_placas', 'API_PLACAS', 'API Placas Nacional (WDAPI2)', 1, 1, 'https://wdapi2.com.br', 'be1425****22dd', 'Conexão ativa com 1.000 consultas contratadas e FIPE oficial por score')
        `).run();
    }
} catch (_) {}

// Garantir presença da tabela client_activations
try {
    db.exec(`
        CREATE TABLE IF NOT EXISTS client_activations (
            id TEXT PRIMARY KEY,
            workshop_id TEXT NOT NULL REFERENCES workshops(id) ON DELETE CASCADE,
            client_name TEXT NOT NULL,
            whatsapp TEXT NOT NULL,
            license_plate TEXT NOT NULL,
            activation_code TEXT NOT NULL UNIQUE,
            vehicle_id TEXT REFERENCES vehicles(id),
            owner_id TEXT REFERENCES owners(id),
            status TEXT NOT NULL DEFAULT 'PENDING',
            created_at DATETIME DEFAULT CURRENT_TIMESTAMP,
            activated_at DATETIME
        );
        CREATE INDEX IF NOT EXISTS idx_client_activations_code ON client_activations(activation_code);
        CREATE INDEX IF NOT EXISTS idx_client_activations_plate ON client_activations(license_plate);
        CREATE INDEX IF NOT EXISTS idx_client_activations_ws ON client_activations(workshop_id);
    `);
} catch (e) {
    console.warn('Erro ao criar client_activations:', e.message);
}

// Garantir colunas completas para suporte a 100% dos dados da API Placas (WDAPI2)
const vehicleColumns = [
    { name: 'submodel', type: 'TEXT' },
    { name: 'engine_displacement', type: 'TEXT' },
    { name: 'transmission', type: 'TEXT' },
    { name: 'vehicle_type', type: 'TEXT' },
    { name: 'segment', type: 'TEXT' },
    { name: 'sub_segment', type: 'TEXT' },
    { name: 'bodywork', type: 'TEXT' },
    { name: 'passenger_capacity', type: 'INTEGER' },
    { name: 'gross_weight', type: 'TEXT' },
    { name: 'max_traction', type: 'TEXT' },
    { name: 'axes_count', type: 'TEXT' },
    { name: 'state', type: 'TEXT' },
    { name: 'city', type: 'TEXT' },
    { name: 'plate_old_format', type: 'TEXT' },
    { name: 'plate_mercosul_format', type: 'TEXT' },
    { name: 'chassis_status', type: 'TEXT' },
    { name: 'vehicle_status', type: 'TEXT' },
    { name: 'legal_status_desc', type: 'TEXT' },
    { name: 'brand_logo_url', type: 'TEXT' },
    { name: 'fipe_score', type: 'INTEGER' },
    { name: 'raw_json', type: 'TEXT' },
    { name: 'extra_json', type: 'TEXT' },
    { name: 'fipe_json', type: 'TEXT' },
    { name: 'current_owner_id', type: 'TEXT' },
    { name: 'workshop_id', type: 'TEXT' }
];

for (const col of vehicleColumns) {
    try {
        db.exec(`ALTER TABLE vehicles ADD COLUMN ${col.name} ${col.type}`);
    } catch (_) {}
}

const fipeColumns = [
    { name: 'score', type: 'INTEGER' },
    { name: 'model_text', type: 'TEXT' },
    { name: 'brand_text', type: 'TEXT' },
    { name: 'fuel_text', type: 'TEXT' },
    { name: 'all_fipe_json', type: 'TEXT' }
];

for (const col of fipeColumns) {
    try {
        db.exec(`ALTER TABLE fipe_values ADD COLUMN ${col.name} ${col.type}`);
    } catch (_) {}
}

// Inicialização segura de tabelas de monitoramento e manutenção preventiva
try {
    db.exec(`
        CREATE TABLE IF NOT EXISTS monitoring_preferences (
            id TEXT PRIMARY KEY,
            vehicle_id TEXT NOT NULL UNIQUE REFERENCES vehicles(id) ON DELETE CASCADE,
            owner_id TEXT REFERENCES owners(id) ON DELETE CASCADE,
            is_monitoring_enabled INTEGER NOT NULL DEFAULT 1,
            consent_given_at DATETIME,
            consent_version TEXT DEFAULT '1.0',
            paired_bluetooth_name TEXT,
            paired_bluetooth_mac TEXT,
            last_sync_at DATETIME,
            created_at DATETIME DEFAULT CURRENT_TIMESTAMP,
            updated_at DATETIME DEFAULT CURRENT_TIMESTAMP
        );

        CREATE TABLE IF NOT EXISTS odometer_readings (
            id TEXT PRIMARY KEY,
            vehicle_id TEXT NOT NULL REFERENCES vehicles(id) ON DELETE CASCADE,
            reading_km INTEGER NOT NULL,
            reading_date DATE NOT NULL,
            source TEXT NOT NULL,
            source_details TEXT,
            recorded_by_user_id TEXT REFERENCES users(id),
            verified INTEGER NOT NULL DEFAULT 1,
            created_at DATETIME DEFAULT CURRENT_TIMESTAMP
        );

        CREATE TABLE IF NOT EXISTS vehicle_trips (
            id TEXT PRIMARY KEY,
            vehicle_id TEXT NOT NULL REFERENCES vehicles(id) ON DELETE CASCADE,
            owner_id TEXT REFERENCES owners(id),
            start_time DATETIME NOT NULL,
            end_time DATETIME NOT NULL,
            duration_seconds INTEGER NOT NULL,
            distance_km REAL NOT NULL,
            avg_speed_kmh REAL,
            max_speed_kmh REAL,
            confidence_score INTEGER NOT NULL,
            classification TEXT NOT NULL,
            signals_used TEXT,
            bluetooth_connected INTEGER DEFAULT 0,
            algorithm_version TEXT DEFAULT 'v1.0-probabilistic',
            is_validated_by_user INTEGER DEFAULT NULL,
            user_feedback TEXT,
            synced_at DATETIME DEFAULT CURRENT_TIMESTAMP
        );

        CREATE TABLE IF NOT EXISTS maintenance_rules (
            id TEXT PRIMARY KEY,
            brand TEXT NOT NULL,
            model_pattern TEXT NOT NULL,
            fuel_type TEXT DEFAULT 'ALL',
            engine_pattern TEXT DEFAULT '%',
            item_code TEXT NOT NULL,
            item_name TEXT NOT NULL,
            category TEXT NOT NULL,
            interval_km INTEGER NOT NULL,
            interval_months INTEGER NOT NULL,
            has_timing_belt INTEGER DEFAULT 1,
            is_wear_item INTEGER DEFAULT 0,
            notes TEXT,
            source TEXT DEFAULT 'Manual do Fabricante'
        );

        CREATE TABLE IF NOT EXISTS vehicle_maintenance_predictions (
            id TEXT PRIMARY KEY,
            vehicle_id TEXT NOT NULL REFERENCES vehicles(id) ON DELETE CASCADE,
            item_code TEXT NOT NULL,
            item_name TEXT NOT NULL,
            category TEXT NOT NULL,
            last_service_km INTEGER,
            last_service_date DATE,
            recommended_interval_km INTEGER NOT NULL,
            recommended_interval_months INTEGER NOT NULL,
            next_due_km INTEGER NOT NULL,
            next_due_date DATE,
            current_odometer_official_km INTEGER NOT NULL,
            estimated_distance_since_official_km REAL NOT NULL DEFAULT 0,
            current_estimated_km INTEGER NOT NULL,
            remaining_km_min INTEGER,
            remaining_km_max INTEGER,
            remaining_days INTEGER,
            alert_status TEXT NOT NULL,
            confidence_level TEXT DEFAULT 'ALTA',
            rationale TEXT,
            updated_at DATETIME DEFAULT CURRENT_TIMESTAMP,
            UNIQUE(vehicle_id, item_code)
        );

        CREATE TABLE IF NOT EXISTS trip_classification_metrics (
            id TEXT PRIMARY KEY,
            vehicle_id TEXT REFERENCES vehicles(id),
            total_trips_analyzed INTEGER DEFAULT 0,
            in_vehicle_count INTEGER DEFAULT 0,
            walking_count INTEGER DEFAULT 0,
            other_transport_count INTEGER DEFAULT 0,
            inconclusive_count INTEGER DEFAULT 0,
            confirmed_true_positives INTEGER DEFAULT 0,
            confirmed_false_positives INTEGER DEFAULT 0,
            confirmed_true_negatives INTEGER DEFAULT 0,
            confirmed_false_negatives INTEGER DEFAULT 0,
            measured_accuracy_percent REAL DEFAULT 0,
            updated_at DATETIME DEFAULT CURRENT_TIMESTAMP
        );

        CREATE INDEX IF NOT EXISTS idx_odometer_readings_veh ON odometer_readings(vehicle_id);
        CREATE INDEX IF NOT EXISTS idx_vehicle_trips_veh ON vehicle_trips(vehicle_id);
        CREATE INDEX IF NOT EXISTS idx_vehicle_trips_class ON vehicle_trips(classification);
        CREATE INDEX IF NOT EXISTS idx_predictions_veh ON vehicle_maintenance_predictions(vehicle_id);
        CREATE INDEX IF NOT EXISTS idx_predictions_status ON vehicle_maintenance_predictions(alert_status);
        CREATE INDEX IF NOT EXISTS idx_monitoring_prefs_veh ON monitoring_preferences(vehicle_id);

        -- Cobrança e PIX da Oficina via AbacatePay (Ciclo 22)
        CREATE TABLE IF NOT EXISTS workshop_pix_charges (
            id TEXT PRIMARY KEY,
            workshop_id TEXT NOT NULL,
            vehicle_id TEXT,
            activation_id TEXT,
            activation_code TEXT,
            charge_type TEXT NOT NULL,
            amount_cents INTEGER NOT NULL,
            customer_price_cents INTEGER NOT NULL,
            workshop_profit_cents INTEGER NOT NULL,
            cars_count INTEGER NOT NULL DEFAULT 1,
            status TEXT NOT NULL DEFAULT 'PENDING',
            abacate_id TEXT,
            pix_code TEXT,
            pix_qr_code_base64 TEXT,
            pix_url TEXT,
            created_at DATETIME DEFAULT CURRENT_TIMESTAMP,
            paid_at DATETIME,
            FOREIGN KEY (workshop_id) REFERENCES workshops(id) ON DELETE CASCADE
        );

        CREATE TABLE IF NOT EXISTS workshop_billing_balances (
            workshop_id TEXT PRIMARY KEY,
            unbilled_cars_count INTEGER NOT NULL DEFAULT 0,
            prepaid_cars_credits INTEGER NOT NULL DEFAULT 0,
            total_cars_registered INTEGER NOT NULL DEFAULT 0,
            total_paid_cents INTEGER NOT NULL DEFAULT 0,
            updated_at DATETIME DEFAULT CURRENT_TIMESTAMP,
            FOREIGN KEY (workshop_id) REFERENCES workshops(id) ON DELETE CASCADE
        );

        CREATE INDEX IF NOT EXISTS idx_workshop_pix_ws ON workshop_pix_charges(workshop_id);
        CREATE INDEX IF NOT EXISTS idx_workshop_pix_status ON workshop_pix_charges(status);
    `);

    // Inicializar regras padrão se ainda não existirem
    const PredictiveMaintenanceService = require('../services/predictiveMaintenance.service');
    PredictiveMaintenanceService.seedRulesIfEmpty(db);
} catch (err) {
    console.warn('Verificação de tabelas preditivas:', err.message);
}


