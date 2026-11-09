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

// Garantir oficina credenciada base no banco de dados para evitar falhas de Foreign Key
try {
    const hasWorkshop = db.prepare(`SELECT id FROM workshops LIMIT 1`).get();
    if (!hasWorkshop) {
        db.prepare(`
            INSERT OR IGNORE INTO workshops (
                id, company_name, trade_name, cnpj, email, phone,
                address_street, address_number, address_neighborhood, city, state, zip_code, status
            ) VALUES (
                'ws_veloce', 'Veloce Manutenção Automotiva LTDA', 'Veloce Auto Center',
                '12.345.678/0001-99', 'contato@veloceautocenter.com.br', '(11) 98765-4321',
                'Av. das Oficinas', '1000', 'Centro', 'São Paulo', 'SP', '01001-000', 'ACTIVE'
            )
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
    try {
        db.exec(`ALTER TABLE client_activations ADD COLUMN email TEXT;`);
    } catch (_) {}
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

const serviceRecordColumns = [
    { name: 'registered_by_user_id', type: 'TEXT' },
    { name: 'part_photo_url', type: 'TEXT' },
    { name: 'workshop_id', type: 'TEXT' }
];

for (const col of serviceRecordColumns) {
    try {
        db.exec(`ALTER TABLE service_records ADD COLUMN ${col.name} ${col.type}`);
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

        CREATE TABLE IF NOT EXISTS representatives (
            id TEXT PRIMARY KEY,
            user_id TEXT NOT NULL UNIQUE REFERENCES users(id) ON DELETE CASCADE,
            rep_code TEXT NOT NULL UNIQUE,
            name TEXT NOT NULL,
            cpf_cnpj TEXT NOT NULL,
            email TEXT NOT NULL UNIQUE,
            phone TEXT NOT NULL,
            city TEXT NOT NULL,
            state TEXT NOT NULL,
            pix_key TEXT,
            experience TEXT,
            status TEXT NOT NULL DEFAULT 'ACTIVE',
            max_workshops_limit INTEGER NOT NULL DEFAULT 15,
            monthly_goal_workshops INTEGER NOT NULL DEFAULT 5,
            monthly_goal_activations INTEGER NOT NULL DEFAULT 220,
            links_shared_count INTEGER NOT NULL DEFAULT 0,
            training_completed INTEGER NOT NULL DEFAULT 1,
            created_at DATETIME DEFAULT CURRENT_TIMESTAMP,
            updated_at DATETIME DEFAULT CURRENT_TIMESTAMP
        );

        CREATE TABLE IF NOT EXISTS representative_invites (
            id TEXT PRIMARY KEY,
            representative_id TEXT NOT NULL REFERENCES representatives(id) ON DELETE CASCADE,
            rep_code TEXT NOT NULL,
            invite_token TEXT NOT NULL UNIQUE,
            prospect_workshop_name TEXT,
            prospect_cnpj TEXT,
            prospect_email TEXT,
            prospect_phone TEXT,
            clicks_count INTEGER NOT NULL DEFAULT 0,
            status TEXT NOT NULL DEFAULT 'CREATED',
            workshop_id TEXT REFERENCES workshops(id) ON DELETE SET NULL,
            ip_address TEXT,
            user_agent TEXT,
            created_at DATETIME DEFAULT CURRENT_TIMESTAMP,
            updated_at DATETIME DEFAULT CURRENT_TIMESTAMP,
            accessed_at DATETIME,
            started_at DATETIME,
            completed_at DATETIME,
            activated_at DATETIME
        );

        CREATE TABLE IF NOT EXISTS workshop_referrals (
            id TEXT PRIMARY KEY,
            workshop_id TEXT NOT NULL UNIQUE REFERENCES workshops(id) ON DELETE CASCADE,
            representative_id TEXT NOT NULL REFERENCES representatives(id) ON DELETE CASCADE,
            invite_id TEXT REFERENCES representative_invites(id) ON DELETE SET NULL,
            rep_code TEXT NOT NULL,
            origin_channel TEXT NOT NULL DEFAULT 'WHATSAPP_LINK',
            linked_at DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
            valid_until DATETIME NOT NULL,
            status TEXT NOT NULL DEFAULT 'ACTIVE',
            created_by TEXT DEFAULT 'SYSTEM_AUTO',
            justification TEXT,
            created_at DATETIME DEFAULT CURRENT_TIMESTAMP,
            updated_at DATETIME DEFAULT CURRENT_TIMESTAMP
        );

        CREATE TABLE IF NOT EXISTS representative_commissions (
            id TEXT PRIMARY KEY,
            representative_id TEXT NOT NULL REFERENCES representatives(id) ON DELETE CASCADE,
            workshop_id TEXT NOT NULL REFERENCES workshops(id) ON DELETE CASCADE,
            referral_id TEXT REFERENCES workshop_referrals(id) ON DELETE SET NULL,
            dna_activation_id TEXT REFERENCES dna_activations(id) ON DELETE SET NULL,
            source_payment_id TEXT NOT NULL UNIQUE,
            vehicle_id TEXT REFERENCES vehicles(id) ON DELETE SET NULL,
            registration_amount_cents INTEGER NOT NULL DEFAULT 4990,
            workshop_split_cents INTEGER NOT NULL DEFAULT 2495,
            platform_split_cents INTEGER NOT NULL DEFAULT 2495,
            commission_amount_cents INTEGER NOT NULL DEFAULT 590,
            status TEXT NOT NULL DEFAULT 'PROJECTED',
            created_at DATETIME DEFAULT CURRENT_TIMESTAMP,
            confirmed_at DATETIME,
            paid_at DATETIME,
            refunded_at DATETIME,
            notes TEXT
        );

        CREATE TABLE IF NOT EXISTS representative_audit_logs (
            id TEXT PRIMARY KEY,
            representative_id TEXT,
            workshop_id TEXT,
            action TEXT NOT NULL,
            actor_id TEXT,
            actor_role TEXT,
            justification TEXT,
            metadata_json TEXT,
            ip_address TEXT,
            created_at DATETIME DEFAULT CURRENT_TIMESTAMP
        );

        CREATE INDEX IF NOT EXISTS idx_rep_code ON representatives(rep_code);
        CREATE INDEX IF NOT EXISTS idx_rep_invites_rep ON representative_invites(representative_id);
        CREATE INDEX IF NOT EXISTS idx_rep_invites_code ON representative_invites(rep_code);
        CREATE INDEX IF NOT EXISTS idx_rep_invites_cnpj ON representative_invites(prospect_cnpj);
        CREATE INDEX IF NOT EXISTS idx_ws_referrals_rep ON workshop_referrals(representative_id);
        CREATE INDEX IF NOT EXISTS idx_ws_referrals_ws ON workshop_referrals(workshop_id);
        CREATE INDEX IF NOT EXISTS idx_rep_comm_rep ON representative_commissions(representative_id);
        CREATE INDEX IF NOT EXISTS idx_rep_comm_ws ON representative_commissions(workshop_id);
        CREATE INDEX IF NOT EXISTS idx_rep_comm_status ON representative_commissions(status);

        INSERT OR IGNORE INTO roles (id, code, name, description)
        VALUES ('role_representative', 'REPRESENTATIVE', 'Representante Comercial', 'Indicação comercial de oficinas e acompanhamento de comissões (sem acesso operacional)');

        INSERT OR IGNORE INTO roles (id, code, name, description)
        VALUES ('role_workshop_staff', 'WORKSHOP_STAFF', 'Registrador da Oficina', 'Registrador técnico de fotos de peças e serviços executados na oficina');

        CREATE TABLE IF NOT EXISTS workshop_attendance_fees (
            id TEXT PRIMARY KEY,
            workshop_id TEXT NOT NULL,
            appointment_id TEXT,
            service_record_id TEXT,
            vehicle_id TEXT,
            amount_cents INTEGER NOT NULL DEFAULT 690,
            status TEXT NOT NULL DEFAULT 'CONFIRMED',
            idempotency_key TEXT UNIQUE,
            notes TEXT,
            created_at DATETIME DEFAULT CURRENT_TIMESTAMP
        );
        CREATE INDEX IF NOT EXISTS idx_att_fees_ws ON workshop_attendance_fees(workshop_id);
        CREATE INDEX IF NOT EXISTS idx_att_fees_idem ON workshop_attendance_fees(idempotency_key);

        INSERT OR IGNORE INTO pricing_plans (id, code, title, description, price_cents, workshop_price_cents, discount_percentage, is_courtesy, commission_percentage, is_active)
        VALUES ('plan_rep_program', 'PLAN_REP_PROGRAM', 'Passaporte Digital DNA AUTO — Programa Representantes (R$ 49,90)', 'Cadastro R$ 49,90 com 50% Oficina (R$ 24,95), 50% Plataforma (R$ 24,95) e comissão comercial R$ 5,90 custeada pela plataforma', 4990, 2495, 0, 0, 50, 1);
    `);

    const bcrypt = require('bcryptjs');
    const existingDemoRep = db.prepare("SELECT id FROM representatives WHERE rep_code = 'REP000123'").get();
    if (!existingDemoRep) {
        const repHash = bcrypt.hashSync('rep123456', 10);
        db.prepare(`
            INSERT OR IGNORE INTO users (id, name, email, password_hash, phone, role_id, status, is_demo)
            VALUES ('usr_rep_000123', 'Leonardo Palmeira (Representante Comercial)', 'representante@dnaauto.com.br', ?, '(11) 99888-0123', 'role_representative', 'ACTIVE', 0)
        `).run(repHash);
        db.prepare(`
            INSERT OR IGNORE INTO representatives (
                id, user_id, rep_code, name, cpf_cnpj, email, phone, city, state,
                pix_key, experience, status, max_workshops_limit, monthly_goal_workshops,
                monthly_goal_activations, links_shared_count, training_completed
            ) VALUES (
                'rep_000123', 'usr_rep_000123', 'REP000123',
                'Leonardo Palmeira (Representante Comercial)', '123.456.789-00',
                'representante@dnaauto.com.br', '(11) 99888-0123', 'São Paulo', 'SP',
                'representante@dnaauto.com.br', 'Vendas B2B Automotivo e Autopeças',
                'ACTIVE', 15, 5, 220, 3, 1
            )
        `).run();
    }

    // Inicializar regras padrão se ainda não existirem
    const PredictiveMaintenanceService = require('../services/predictiveMaintenance.service');
    PredictiveMaintenanceService.seedRulesIfEmpty(db);
} catch (err) {
    console.warn('Verificação de tabelas preditivas:', err.message);
}


