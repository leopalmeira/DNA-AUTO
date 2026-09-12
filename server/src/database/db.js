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

