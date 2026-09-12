-- ==============================================================================
-- DNA AUTO — ESQUEMA RELACIONAL DO BANCO DE DADOS
-- Compatibilidade: SQLite 3 / PostgreSQL
-- ==============================================================================

PRAGMA foreign_keys = ON;

-- 1. Permissões do Sistema
CREATE TABLE IF NOT EXISTS permissions (
    id TEXT PRIMARY KEY,
    name TEXT NOT NULL UNIQUE,
    category TEXT NOT NULL,
    description TEXT,
    created_at DATETIME DEFAULT CURRENT_TIMESTAMP
);

-- 2. Perfis de Acesso (Roles)
CREATE TABLE IF NOT EXISTS roles (
    id TEXT PRIMARY KEY,
    code TEXT NOT NULL UNIQUE,
    name TEXT NOT NULL,
    description TEXT,
    created_at DATETIME DEFAULT CURRENT_TIMESTAMP
);

-- 3. Associação Role - Permission
CREATE TABLE IF NOT EXISTS role_permissions (
    role_id TEXT NOT NULL REFERENCES roles(id) ON DELETE CASCADE,
    permission_id TEXT NOT NULL REFERENCES permissions(id) ON DELETE CASCADE,
    PRIMARY KEY (role_id, permission_id)
);

-- 4. Usuários
CREATE TABLE IF NOT EXISTS users (
    id TEXT PRIMARY KEY,
    name TEXT NOT NULL,
    email TEXT NOT NULL UNIQUE,
    password_hash TEXT NOT NULL,
    phone TEXT,
    role_id TEXT NOT NULL REFERENCES roles(id),
    status TEXT NOT NULL DEFAULT 'ACTIVE', -- 'ACTIVE', 'INACTIVE', 'PENDING'
    is_demo INTEGER NOT NULL DEFAULT 0,
    created_at DATETIME DEFAULT CURRENT_TIMESTAMP,
    updated_at DATETIME DEFAULT CURRENT_TIMESTAMP
);

-- 5. Oficinas Credenciadas
CREATE TABLE IF NOT EXISTS workshops (
    id TEXT PRIMARY KEY,
    company_name TEXT NOT NULL,
    trade_name TEXT NOT NULL,
    cnpj TEXT NOT NULL UNIQUE,
    phone TEXT NOT NULL,
    email TEXT NOT NULL,
    address_street TEXT NOT NULL,
    address_number TEXT NOT NULL,
    address_complement TEXT,
    address_neighborhood TEXT NOT NULL,
    city TEXT NOT NULL,
    state TEXT NOT NULL,
    zip_code TEXT NOT NULL,
    status TEXT NOT NULL DEFAULT 'PENDING', -- 'PENDING', 'APPROVED', 'BLOCKED'
    verified_badge INTEGER NOT NULL DEFAULT 0,
    notes TEXT,
    created_at DATETIME DEFAULT CURRENT_TIMESTAMP,
    updated_at DATETIME DEFAULT CURRENT_TIMESTAMP
);

-- 6. Usuários e Equipe das Oficinas (Mecânico, Gerente, Atendente, etc.)
CREATE TABLE IF NOT EXISTS workshop_users (
    id TEXT PRIMARY KEY,
    workshop_id TEXT NOT NULL REFERENCES workshops(id) ON DELETE CASCADE,
    user_id TEXT NOT NULL REFERENCES users(id) ON DELETE CASCADE,
    position_title TEXT NOT NULL, -- 'Proprietário', 'Gerente', 'Mecânico Chefe', 'Atendente'
    can_activate_dna INTEGER NOT NULL DEFAULT 1,
    can_prove_services INTEGER NOT NULL DEFAULT 1,
    created_at DATETIME DEFAULT CURRENT_TIMESTAMP,
    UNIQUE(workshop_id, user_id)
);

-- 7. Veículos
CREATE TABLE IF NOT EXISTS vehicles (
    id TEXT PRIMARY KEY,
    license_plate TEXT NOT NULL UNIQUE,
    chassis_vin TEXT NOT NULL UNIQUE,
    renavam TEXT,
    brand TEXT NOT NULL,
    model TEXT NOT NULL,
    version_label TEXT,
    manufacture_year INTEGER NOT NULL,
    model_year INTEGER NOT NULL,
    fuel_type TEXT NOT NULL, -- 'Flex', 'Gasolina', 'Etanol', 'Diesel', 'Híbrido', 'Elétrico'
    transmission_type TEXT, -- 'Automático', 'Manual', 'CVT'
    color TEXT NOT NULL,
    photo_url TEXT,
    is_demo INTEGER NOT NULL DEFAULT 0,
    created_at DATETIME DEFAULT CURRENT_TIMESTAMP,
    updated_at DATETIME DEFAULT CURRENT_TIMESTAMP
);

-- 8. DNA do Veículo (Identificador Único Permanente)
CREATE TABLE IF NOT EXISTS vehicle_dna (
    id TEXT PRIMARY KEY,
    vehicle_id TEXT NOT NULL UNIQUE REFERENCES vehicles(id) ON DELETE CASCADE,
    dna_code TEXT NOT NULL UNIQUE, -- Formato: DNA-BR-XXXX-XXXX-XXX
    status TEXT NOT NULL DEFAULT 'ACTIVE', -- 'ACTIVE', 'REVOKED'
    activated_at DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
    activated_by_workshop_id TEXT REFERENCES workshops(id),
    activation_modality TEXT NOT NULL DEFAULT 'NORMAL', -- 'NORMAL', 'DISCOUNT_50', 'COURTESY', 'CAMPAIGN', 'BATCH_PLAN'
    activation_fee_cents INTEGER NOT NULL DEFAULT 14900,
    certificate_hash TEXT NOT NULL,
    created_at DATETIME DEFAULT CURRENT_TIMESTAMP
);

-- 9. Proprietários de Veículos (Histórico e Atual)
CREATE TABLE IF NOT EXISTS owners (
    id TEXT PRIMARY KEY,
    user_id TEXT REFERENCES users(id),
    name TEXT NOT NULL,
    document_cpf TEXT NOT NULL,
    email TEXT,
    phone TEXT,
    created_at DATETIME DEFAULT CURRENT_TIMESTAMP
);

-- 10. Histórico e Transferências de Propriedade
CREATE TABLE IF NOT EXISTS ownership_transfers (
    id TEXT PRIMARY KEY,
    vehicle_id TEXT NOT NULL REFERENCES vehicles(id) ON DELETE CASCADE,
    previous_owner_id TEXT REFERENCES owners(id),
    new_owner_id TEXT REFERENCES owners(id),
    transfer_code TEXT, -- Token seguro temporário de 6 dígitos
    transfer_code_expires_at DATETIME,
    status TEXT NOT NULL DEFAULT 'PENDING', -- 'PENDING', 'COMPLETED', 'CANCELLED', 'EXPIRED'
    requested_at DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
    completed_at DATETIME,
    transfer_mileage INTEGER,
    notes TEXT,
    created_at DATETIME DEFAULT CURRENT_TIMESTAMP
);

-- 11. Planos de Manutenção Preventiva (Itens e Intervalos Recomendados)
CREATE TABLE IF NOT EXISTS maintenance_records (
    id TEXT PRIMARY KEY,
    vehicle_id TEXT NOT NULL REFERENCES vehicles(id) ON DELETE CASCADE,
    title TEXT NOT NULL,
    category TEXT NOT NULL, -- 'Óleo e Filtros', 'Correias', 'Freios', 'Suspensão', 'Transmissão', 'Arrefecimento', 'Revisão Geral'
    recommended_km INTEGER,
    recommended_date DATE,
    status TEXT NOT NULL DEFAULT 'PLANNED', -- 'PLANNED', 'COMPLETED', 'OVERDUE'
    created_at DATETIME DEFAULT CURRENT_TIMESTAMP
);

-- 12. Registros de Serviços (O Coração da Linha do Tempo)
CREATE TABLE IF NOT EXISTS service_records (
    id TEXT PRIMARY KEY,
    vehicle_id TEXT NOT NULL REFERENCES vehicles(id) ON DELETE CASCADE,
    workshop_id TEXT REFERENCES workshops(id),
    declared_by_owner_id TEXT REFERENCES owners(id),
    responsible_technician_name TEXT,
    service_date DATE NOT NULL,
    mileage INTEGER NOT NULL,
    category TEXT NOT NULL,
    service_title TEXT NOT NULL,
    description TEXT NOT NULL,
    parts_cost_cents INTEGER NOT NULL DEFAULT 0,
    labor_cost_cents INTEGER NOT NULL DEFAULT 0,
    total_cost_cents INTEGER NOT NULL DEFAULT 0,
    warranty_months INTEGER DEFAULT 3,
    
    -- Níveis de Comprovação:
    -- 1: 'DECLARED' (⚠️ Declarado pelo Proprietário)
    -- 2: 'DOCUMENTED' (📄 Documentado com NF/Comprovante)
    -- 3: 'WORKSHOP_CONFIRMED' (✅ Confirmado pela Oficina)
    -- 4: 'WORKSHOP_PROVEN' (✅ Comprovado diretamente pela Oficina)
    proof_level INTEGER NOT NULL DEFAULT 1,
    proof_status TEXT NOT NULL DEFAULT 'DECLARED',
    
    workshop_confirmation_status TEXT DEFAULT NULL, -- 'PENDING', 'CONFIRMED', 'REJECTED', 'REQUESTED_INFO'
    workshop_confirmation_date DATETIME,
    workshop_confirmation_notes TEXT,
    
    created_at DATETIME DEFAULT CURRENT_TIMESTAMP,
    updated_at DATETIME DEFAULT CURRENT_TIMESTAMP
);

-- 13. Peças e Componentes
CREATE TABLE IF NOT EXISTS parts (
    id TEXT PRIMARY KEY,
    name TEXT NOT NULL,
    manufacturer TEXT NOT NULL,
    part_number TEXT,
    category TEXT NOT NULL,
    created_at DATETIME DEFAULT CURRENT_TIMESTAMP
);

-- 14. Instalação de Peças vinculadas ao Serviço
CREATE TABLE IF NOT EXISTS part_installations (
    id TEXT PRIMARY KEY,
    service_record_id TEXT NOT NULL REFERENCES service_records(id) ON DELETE CASCADE,
    part_id TEXT NOT NULL REFERENCES parts(id),
    quantity INTEGER NOT NULL DEFAULT 1,
    unit_price_cents INTEGER NOT NULL DEFAULT 0,
    part_condition TEXT NOT NULL DEFAULT 'NEW', -- 'NEW', 'REMANUFACTURED'
    warranty_months INTEGER DEFAULT 6,
    notes TEXT,
    created_at DATETIME DEFAULT CURRENT_TIMESTAMP
);

-- 15. Notas Fiscais
CREATE TABLE IF NOT EXISTS invoices (
    id TEXT PRIMARY KEY,
    vehicle_id TEXT NOT NULL REFERENCES vehicles(id) ON DELETE CASCADE,
    service_record_id TEXT REFERENCES service_records(id) ON DELETE SET NULL,
    invoice_number TEXT NOT NULL,
    access_key TEXT,
    issuer_name TEXT NOT NULL,
    issuer_cnpj TEXT,
    issue_date DATE NOT NULL,
    total_amount_cents INTEGER NOT NULL,
    file_path TEXT,
    verified INTEGER NOT NULL DEFAULT 1,
    created_at DATETIME DEFAULT CURRENT_TIMESTAMP
);

-- 16. Registro Fotográfico dos Veículos e Peças
CREATE TABLE IF NOT EXISTS vehicle_photos (
    id TEXT PRIMARY KEY,
    vehicle_id TEXT NOT NULL REFERENCES vehicles(id) ON DELETE CASCADE,
    service_record_id TEXT REFERENCES service_records(id) ON DELETE SET NULL,
    workshop_id TEXT REFERENCES workshops(id),
    photo_category TEXT NOT NULL, -- 'VEHICLE_MAIN', 'OLD_PART', 'NEW_PART', 'INSTALLED_PART', 'ODOMETER', 'ENGINE', 'SERVICE_DONE'
    title TEXT NOT NULL,
    file_path TEXT NOT NULL,
    taken_at DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
    registered_by_user_id TEXT REFERENCES users(id),
    created_at DATETIME DEFAULT CURRENT_TIMESTAMP
);

-- 17. Registro Histórico de Quilometragem
CREATE TABLE IF NOT EXISTS mileage_records (
    id TEXT PRIMARY KEY,
    vehicle_id TEXT NOT NULL REFERENCES vehicles(id) ON DELETE CASCADE,
    service_record_id TEXT REFERENCES service_records(id) ON DELETE SET NULL,
    mileage INTEGER NOT NULL,
    recorded_at DATE NOT NULL,
    source TEXT NOT NULL, -- 'WORKSHOP_SERVICE', 'OWNER_UPDATE', 'TRANSFER', 'INSPECTION'
    verified INTEGER NOT NULL DEFAULT 1,
    created_at DATETIME DEFAULT CURRENT_TIMESTAMP
);

-- 18. Documentação Geral do Veículo (CRLV, Seguros, Laudos)
CREATE TABLE IF NOT EXISTS vehicle_documents (
    id TEXT PRIMARY KEY,
    vehicle_id TEXT NOT NULL REFERENCES vehicles(id) ON DELETE CASCADE,
    doc_type TEXT NOT NULL, -- 'CRLV', 'LAUDO_CAUTELAR', 'SEGURO', 'MANUAL', 'OUTRO'
    title TEXT NOT NULL,
    file_path TEXT,
    issue_date DATE,
    expiration_date DATE,
    verification_source TEXT,
    status TEXT NOT NULL DEFAULT 'AVAILABLE',
    created_at DATETIME DEFAULT CURRENT_TIMESTAMP
);

-- 19. IPVA e Taxas
CREATE TABLE IF NOT EXISTS taxes (
    id TEXT PRIMARY KEY,
    vehicle_id TEXT NOT NULL REFERENCES vehicles(id) ON DELETE CASCADE,
    reference_year INTEGER NOT NULL,
    due_date DATE,
    amount_cents INTEGER,
    status TEXT NOT NULL DEFAULT 'PAID', -- 'PAID', 'PENDING', 'OVERDUE', 'UNAVAILABLE'
    source_message TEXT DEFAULT 'Consulta oficial Detran / Sefaz',
    created_at DATETIME DEFAULT CURRENT_TIMESTAMP
);

-- 20. Multas
CREATE TABLE IF NOT EXISTS fines (
    id TEXT PRIMARY KEY,
    vehicle_id TEXT NOT NULL REFERENCES vehicles(id) ON DELETE CASCADE,
    auto_infraction_code TEXT,
    infraction_date DATE,
    description TEXT,
    amount_cents INTEGER,
    points INTEGER DEFAULT 0,
    status TEXT NOT NULL DEFAULT 'NONE', -- 'NONE', 'PAID', 'PENDING', 'APPEAL', 'UNAVAILABLE'
    source_message TEXT DEFAULT 'Base Nacional de Infrações',
    created_at DATETIME DEFAULT CURRENT_TIMESTAMP
);

-- 21. Débitos e Restrições
CREATE TABLE IF NOT EXISTS debts (
    id TEXT PRIMARY KEY,
    vehicle_id TEXT NOT NULL REFERENCES vehicles(id) ON DELETE CASCADE,
    category TEXT NOT NULL, -- 'FINANCIAMENTO', 'GRAVAME', 'JUDICIAL', 'BLOQUEIO', 'ADMINISTRATIVO'
    description TEXT NOT NULL,
    has_restriction INTEGER NOT NULL DEFAULT 0,
    source_message TEXT DEFAULT 'Base Renavam Oficial',
    created_at DATETIME DEFAULT CURRENT_TIMESTAMP
);

-- 22. Histórico de Leilões e Sinistros
CREATE TABLE IF NOT EXISTS auctions (
    id TEXT PRIMARY KEY,
    vehicle_id TEXT NOT NULL REFERENCES vehicles(id) ON DELETE CASCADE,
    has_auction_record INTEGER NOT NULL DEFAULT 0,
    auctioneer_name TEXT,
    auction_date DATE,
    damage_classification TEXT, -- 'PEQUENA_MONTA', 'MEDIA_MONTA', 'GRANDE_MONTA', 'NENHUMA'
    source_message TEXT DEFAULT 'Base Integrada de Leilões',
    created_at DATETIME DEFAULT CURRENT_TIMESTAMP
);

-- 23. Valores Históricos de Mercado
CREATE TABLE IF NOT EXISTS market_values (
    id TEXT PRIMARY KEY,
    vehicle_id TEXT NOT NULL REFERENCES vehicles(id) ON DELETE CASCADE,
    reference_date DATE NOT NULL,
    estimated_price_cents INTEGER NOT NULL,
    market_source TEXT NOT NULL DEFAULT 'DNA AUTO Market Index',
    created_at DATETIME DEFAULT CURRENT_TIMESTAMP
);

-- 24. Valores FIPE
CREATE TABLE IF NOT EXISTS fipe_values (
    id TEXT PRIMARY KEY,
    vehicle_id TEXT NOT NULL REFERENCES vehicles(id) ON DELETE CASCADE,
    fipe_code TEXT,
    reference_month_year TEXT NOT NULL,
    fipe_price_cents INTEGER NOT NULL,
    consulted_at DATETIME DEFAULT CURRENT_TIMESTAMP
);

-- 25. Índices de Saúde do Histórico do Veículo
CREATE TABLE IF NOT EXISTS health_scores (
    id TEXT PRIMARY KEY,
    vehicle_id TEXT NOT NULL UNIQUE REFERENCES vehicles(id) ON DELETE CASCADE,
    overall_score INTEGER NOT NULL, -- 0 a 100
    documented_percentage INTEGER NOT NULL, -- 0% a 100%
    proven_services_count INTEGER NOT NULL DEFAULT 0,
    invoices_count INTEGER NOT NULL DEFAULT 0,
    verified_workshops_count INTEGER NOT NULL DEFAULT 0,
    mileage_records_count INTEGER NOT NULL DEFAULT 0,
    continuity_status TEXT NOT NULL DEFAULT 'EXCELLENT', -- 'EXCELLENT', 'GOOD', 'REGULAR', 'POOR'
    score_rationale TEXT NOT NULL,
    updated_at DATETIME DEFAULT CURRENT_TIMESTAMP
);

-- 26. Notificações do Sistema
CREATE TABLE IF NOT EXISTS notifications (
    id TEXT PRIMARY KEY,
    user_id TEXT NOT NULL REFERENCES users(id) ON DELETE CASCADE,
    title TEXT NOT NULL,
    message TEXT NOT NULL,
    category TEXT NOT NULL, -- 'SERVICE_CONFIRMATION', 'TRANSFER_REQUEST', 'MAINTENANCE_DUE', 'DNA_ACTIVATION', 'SYSTEM'
    reference_id TEXT,
    is_read INTEGER NOT NULL DEFAULT 0,
    created_at DATETIME DEFAULT CURRENT_TIMESTAMP
);

-- 27. Emissão e Histórico de Relatórios (Dossiê para Venda)
CREATE TABLE IF NOT EXISTS reports (
    id TEXT PRIMARY KEY,
    vehicle_id TEXT NOT NULL REFERENCES vehicles(id) ON DELETE CASCADE,
    generated_by_user_id TEXT REFERENCES users(id),
    report_type TEXT NOT NULL DEFAULT 'SALE_DOSSIER', -- 'SALE_DOSSIER', 'AUDIT_REPORT', 'WORKSHOP_CERTIFICATE'
    validation_code TEXT NOT NULL UNIQUE,
    expires_at DATETIME,
    summary_data TEXT, -- JSON com snapshot do relatório
    created_at DATETIME DEFAULT CURRENT_TIMESTAMP
);

-- 28. Logs de Auditoria Rigorosa
CREATE TABLE IF NOT EXISTS audit_logs (
    id TEXT PRIMARY KEY,
    user_id TEXT REFERENCES users(id),
    user_role TEXT,
    user_name TEXT,
    action TEXT NOT NULL, -- 'LOGIN', 'ACTIVATE_DNA', 'REGISTER_SERVICE', 'CONFIRM_SERVICE', 'TRANSFER_VEHICLE', etc.
    entity_type TEXT NOT NULL, -- 'VEHICLE', 'SERVICE', 'TRANSFER', 'WORKSHOP', 'PRICE'
    entity_id TEXT,
    vehicle_dna_code TEXT,
    ip_address TEXT DEFAULT '127.0.0.1',
    user_agent TEXT,
    data_before TEXT, -- JSON
    data_after TEXT,  -- JSON
    created_at DATETIME DEFAULT CURRENT_TIMESTAMP
);

-- 29. Planos e Preços Configuráveis (Modelo Comercial)
CREATE TABLE IF NOT EXISTS pricing_plans (
    id TEXT PRIMARY KEY,
    code TEXT NOT NULL UNIQUE,
    title TEXT NOT NULL,
    description TEXT,
    price_cents INTEGER NOT NULL,
    workshop_price_cents INTEGER NOT NULL,
    discount_percentage INTEGER DEFAULT 0,
    is_courtesy INTEGER DEFAULT 0,
    commission_percentage INTEGER DEFAULT 15,
    is_active INTEGER NOT NULL DEFAULT 1,
    created_at DATETIME DEFAULT CURRENT_TIMESTAMP,
    updated_at DATETIME DEFAULT CURRENT_TIMESTAMP
);

-- 30. Ativações de DNA
CREATE TABLE IF NOT EXISTS dna_activations (
    id TEXT PRIMARY KEY,
    vehicle_dna_id TEXT NOT NULL REFERENCES vehicle_dna(id) ON DELETE CASCADE,
    workshop_id TEXT REFERENCES workshops(id),
    pricing_plan_id TEXT REFERENCES pricing_plans(id),
    payment_status TEXT NOT NULL DEFAULT 'COMPLETED', -- 'COMPLETED', 'PENDING', 'FREE'
    amount_paid_cents INTEGER NOT NULL,
    commission_amount_cents INTEGER NOT NULL DEFAULT 0,
    notes TEXT,
    activated_at DATETIME DEFAULT CURRENT_TIMESTAMP
);

-- 31. Comissões das Oficinas
CREATE TABLE IF NOT EXISTS commissions (
    id TEXT PRIMARY KEY,
    workshop_id TEXT NOT NULL REFERENCES workshops(id) ON DELETE CASCADE,
    dna_activation_id TEXT NOT NULL REFERENCES dna_activations(id) ON DELETE CASCADE,
    amount_cents INTEGER NOT NULL,
    status TEXT NOT NULL DEFAULT 'AVAILABLE', -- 'AVAILABLE', 'PAID', 'CANCELLED'
    created_at DATETIME DEFAULT CURRENT_TIMESTAMP
);

-- 32. Conectores e Integrações Externas
CREATE TABLE IF NOT EXISTS integrations (
    id TEXT PRIMARY KEY,
    service_code TEXT NOT NULL UNIQUE, -- 'FIPE', 'DETRAN', 'IPVA', 'MULTAS', 'LEILOES', 'WHATSAPP'
    service_name TEXT NOT NULL,
    is_enabled INTEGER NOT NULL DEFAULT 1,
    is_connected INTEGER NOT NULL DEFAULT 0,
    endpoint_url TEXT,
    api_key_masked TEXT,
    status_message TEXT NOT NULL DEFAULT 'Informação não disponível nesta fonte',
    last_sync_at DATETIME,
    created_at DATETIME DEFAULT CURRENT_TIMESTAMP
);

-- 33. Sessões do WhatsApp das Oficinas (Baileys Multi-Tenant)
CREATE TABLE IF NOT EXISTS whatsapp_sessions (
    id TEXT PRIMARY KEY,
    workshop_id TEXT NOT NULL UNIQUE REFERENCES workshops(id) ON DELETE CASCADE,
    phone_number TEXT,
    status TEXT NOT NULL DEFAULT 'DISCONNECTED', -- 'DISCONNECTED', 'PAIRING', 'CONNECTED', 'ERROR'
    session_data TEXT,
    last_connected_at DATETIME,
    created_at DATETIME DEFAULT CURRENT_TIMESTAMP,
    updated_at DATETIME DEFAULT CURRENT_TIMESTAMP
);

-- 34. Mensagens e Fila do WhatsApp
CREATE TABLE IF NOT EXISTS whatsapp_messages (
    id TEXT PRIMARY KEY,
    workshop_id TEXT NOT NULL REFERENCES workshops(id) ON DELETE CASCADE,
    client_id TEXT REFERENCES owners(id) ON DELETE SET NULL,
    vehicle_id TEXT REFERENCES vehicles(id) ON DELETE SET NULL,
    phone_number TEXT NOT NULL,
    message TEXT NOT NULL,
    status TEXT NOT NULL DEFAULT 'PENDING', -- 'PENDING', 'PROCESSING', 'SENT', 'FAILED'
    error TEXT,
    sent_at DATETIME,
    created_at DATETIME DEFAULT CURRENT_TIMESTAMP
);

-- 35. Templates de Mensagens do WhatsApp
CREATE TABLE IF NOT EXISTS whatsapp_templates (
    id TEXT PRIMARY KEY,
    workshop_id TEXT REFERENCES workshops(id) ON DELETE CASCADE,
    name TEXT NOT NULL,
    category TEXT NOT NULL DEFAULT 'GERAL',
    content TEXT NOT NULL,
    active INTEGER NOT NULL DEFAULT 1,
    created_at DATETIME DEFAULT CURRENT_TIMESTAMP,
    updated_at DATETIME DEFAULT CURRENT_TIMESTAMP
);

-- 36. Ativações de Clientes com Código Gerado pela Oficina
CREATE TABLE IF NOT EXISTS client_activations (
    id TEXT PRIMARY KEY,
    workshop_id TEXT NOT NULL REFERENCES workshops(id) ON DELETE CASCADE,
    client_name TEXT NOT NULL,
    whatsapp TEXT NOT NULL,
    license_plate TEXT NOT NULL,
    activation_code TEXT NOT NULL UNIQUE,
    vehicle_id TEXT REFERENCES vehicles(id),
    owner_id TEXT REFERENCES owners(id),
    status TEXT NOT NULL DEFAULT 'PENDING', -- 'PENDING', 'ACTIVATED', 'EXPIRED'
    created_at DATETIME DEFAULT CURRENT_TIMESTAMP,
    activated_at DATETIME
);

-- Índices Estratégicos de Alta Performance
CREATE INDEX IF NOT EXISTS idx_vehicle_dna_code ON vehicle_dna(dna_code);
CREATE INDEX IF NOT EXISTS idx_vehicles_license_plate ON vehicles(license_plate);
CREATE INDEX IF NOT EXISTS idx_vehicles_chassis ON vehicles(chassis_vin);
CREATE INDEX IF NOT EXISTS idx_services_vehicle_id ON service_records(vehicle_id);
CREATE INDEX IF NOT EXISTS idx_services_workshop_id ON service_records(workshop_id);
CREATE INDEX IF NOT EXISTS idx_services_proof_level ON service_records(proof_level);
CREATE INDEX IF NOT EXISTS idx_photos_vehicle_id ON vehicle_photos(vehicle_id);
CREATE INDEX IF NOT EXISTS idx_invoices_vehicle_id ON invoices(vehicle_id);
CREATE INDEX IF NOT EXISTS idx_audit_vehicle_dna ON audit_logs(vehicle_dna_code);
CREATE INDEX IF NOT EXISTS idx_audit_action ON audit_logs(action);
CREATE INDEX IF NOT EXISTS idx_audit_created_at ON audit_logs(created_at);
CREATE INDEX IF NOT EXISTS idx_transfers_vehicle ON ownership_transfers(vehicle_id);
CREATE INDEX IF NOT EXISTS idx_whatsapp_sessions_ws ON whatsapp_sessions(workshop_id);
CREATE INDEX IF NOT EXISTS idx_whatsapp_messages_ws ON whatsapp_messages(workshop_id);
CREATE INDEX IF NOT EXISTS idx_whatsapp_messages_status ON whatsapp_messages(status);
CREATE INDEX IF NOT EXISTS idx_whatsapp_templates_ws ON whatsapp_templates(workshop_id);
CREATE INDEX IF NOT EXISTS idx_client_activations_code ON client_activations(activation_code);
CREATE INDEX IF NOT EXISTS idx_client_activations_plate ON client_activations(license_plate);
CREATE INDEX IF NOT EXISTS idx_client_activations_ws ON client_activations(workshop_id);
