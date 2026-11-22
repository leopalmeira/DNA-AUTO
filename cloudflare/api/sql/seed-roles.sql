-- DNA AUTO: banco novo, apenas perfis, sem contas demo nem dados antigos.
INSERT OR IGNORE INTO roles (id, code, name, description) VALUES
 ('role_admin', 'ADMIN', 'Administrador DNA AUTO', 'Gestão da plataforma'),
 ('role_owner', 'OWNER', 'Proprietário de veículo', 'Consulta do histórico'),
 ('role_workshop_owner', 'WORKSHOP_OWNER', 'Gestor da oficina', 'Operações da oficina'),
 ('role_workshop_staff', 'WORKSHOP_STAFF', 'Registrador da oficina', 'Registro técnico'),
 ('role_workshop_mechanic', 'WORKSHOP_MECHANIC', 'Mecânico responsável', 'Serviços e peças'),
 ('role_representative', 'REPRESENTATIVE', 'Representante comercial', 'Indicações');
