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

// Executa seed automático caso o banco ou a tabela de veículos esteja vazia
try {
    const userCount = db.prepare('SELECT COUNT(*) as count FROM users').get();
    const vehCount = db.prepare('SELECT COUNT(*) as count FROM vehicles').get();
    if (!userCount || userCount.count === 0 || !vehCount || vehCount.count === 0) {
        console.log('🌱 Banco ou veículos vazios detectados. Executando seed inicial automatizado...');
        const runSeed = require('./seed');
        runSeed(db, true);
    }
} catch (e) {
    console.warn('Verificação de seed ignorada:', e.message);
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

