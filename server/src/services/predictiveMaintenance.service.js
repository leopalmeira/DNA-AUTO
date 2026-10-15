/**
 * DNA AUTO — Motor de Previsão de Manutenção Preventiva & Estimativa Inteligente de Quilometragem
 * Conecta hodômetro oficial, histórico de serviços de oficinas e estimativas de deslocamento.
 */

const db = require('../database/db');

// Catálogo de Regras Preventivas Oficiais dos Fabricantes
const DEFAULT_MAINTENANCE_RULES = [
    // ── HONDA (Ex: Civic, HR-V, Fit, City) ──
    {
        brand: 'HONDA', model_pattern: '%', fuel_type: 'ALL', engine_pattern: '%',
        item_code: 'ENG_OIL_FILTER', item_name: 'Óleo do Motor e Filtro', category: 'Óleo e Filtros',
        interval_km: 10000, interval_months: 12, has_timing_belt: 1, is_wear_item: 0,
        notes: 'Troca a cada 10.000 km ou 12 meses (o que ocorrer primeiro) com óleo especificação Honda HTO-06 / API SP e filtro novo.'
    },
    {
        brand: 'HONDA', model_pattern: '%', fuel_type: 'ALL', engine_pattern: '%',
        item_code: 'ENGINE_OIL', item_name: 'Óleo do Motor (0W20 / 5W30 Sintético)', category: 'Óleo e Filtros',
        interval_km: 10000, interval_months: 12, has_timing_belt: 1, is_wear_item: 0,
        notes: 'Troca a cada 10.000 km ou 12 meses (o que ocorrer primeiro) com óleo especificação Honda HTO-06 / API SP.'
    },
    {
        brand: 'HONDA', model_pattern: '%', fuel_type: 'ALL', engine_pattern: '%',
        item_code: 'OIL_FILTER', item_name: 'Filtro de Óleo do Motor', category: 'Óleo e Filtros',
        interval_km: 10000, interval_months: 12, has_timing_belt: 1, is_wear_item: 0,
        notes: 'Substituição simultânea à troca de óleo do motor.'
    },
    {
        brand: 'HONDA', model_pattern: '%', fuel_type: 'ALL', engine_pattern: '%',
        item_code: 'AIR_FILTER', item_name: 'Filtro de Ar do Motor', category: 'Filtros',
        interval_km: 20000, interval_months: 24, has_timing_belt: 1, is_wear_item: 0,
        notes: 'Elemento filtrante de ar. Em condições severas, inspecionar a cada 10.000 km.'
    },
    {
        brand: 'HONDA', model_pattern: '%', fuel_type: 'ALL', engine_pattern: '%',
        item_code: 'FUEL_FILTER', item_name: 'Filtro de Combustível', category: 'Filtros',
        interval_km: 20000, interval_months: 24, has_timing_belt: 1, is_wear_item: 0,
        notes: 'Substituição recomendada para proteção do sistema de injeção direta/indireta.'
    },
    {
        brand: 'HONDA', model_pattern: '%', fuel_type: 'ALL', engine_pattern: '%',
        item_code: 'CABIN_FILTER', item_name: 'Filtro do Ar-Condicionado (Cabine)', category: 'Filtros',
        interval_km: 10000, interval_months: 12, has_timing_belt: 1, is_wear_item: 0,
        notes: 'Garante eficiência do fluxo de climatização e pureza do ar da cabine.'
    },
    {
        brand: 'HONDA', model_pattern: '%', fuel_type: 'ALL', engine_pattern: '%',
        item_code: 'BRAKE_PADS', item_name: 'Pastilhas de Freio Dianteiras/Traseiras', category: 'Freios',
        interval_km: 10000, interval_months: 12, has_timing_belt: 1, is_wear_item: 1,
        notes: 'Inspeção técnica presencial obrigatória. Desgaste variável conforme condução.'
    },
    {
        brand: 'HONDA', model_pattern: '%', fuel_type: 'ALL', engine_pattern: '%',
        item_code: 'BRAKE_DISCS', item_name: 'Discos de Freio', category: 'Freios',
        interval_km: 20000, interval_months: 24, has_timing_belt: 1, is_wear_item: 1,
        notes: 'Medição da espessura mínima gravada na borda do disco em oficina credenciada.'
    },
    {
        brand: 'HONDA', model_pattern: '%', fuel_type: 'ALL', engine_pattern: '%',
        item_code: 'BRAKE_FLUID', item_name: 'Fluido de Freio DOT 4', category: 'Freios',
        interval_km: 40000, interval_months: 36, has_timing_belt: 1, is_wear_item: 0,
        notes: 'Troca por tempo recomendada a cada 36 meses devido à higroscopia (absorção de umidade).'
    },
    {
        brand: 'HONDA', model_pattern: '%CIVIC%', fuel_type: 'ALL', engine_pattern: '%',
        item_code: 'TIMING_BELT', item_name: 'Corrente de Comando (Distribuição)', category: 'Motor',
        interval_km: 250000, interval_months: 120, has_timing_belt: 0, is_wear_item: 0,
        notes: 'Motor Honda i-VTEC utiliza corrente metálica de sincronismo de longa vida útil. Não requer correia dentada de borracha.'
    },
    {
        brand: 'HONDA', model_pattern: '%', fuel_type: 'ALL', engine_pattern: '%',
        item_code: 'AUXILIARY_BELT', item_name: 'Correia de Acessórios (Auxiliar / Alternador)', category: 'Motor',
        interval_km: 60000, interval_months: 48, has_timing_belt: 1, is_wear_item: 0,
        notes: 'Aciona alternador, bomba d’água e compressor do ar-condicionado. Checar microfissuras.'
    },
    {
        brand: 'HONDA', model_pattern: '%', fuel_type: 'ALL', engine_pattern: '%',
        item_code: 'SPARK_PLUGS', item_name: 'Velas de Ignição (Iridium)', category: 'Ignição',
        interval_km: 60000, interval_months: 48, has_timing_belt: 1, is_wear_item: 0,
        notes: 'Velas de Iridium com eletrodo de alta durabilidade e faísca precisa.'
    },
    {
        brand: 'HONDA', model_pattern: '%', fuel_type: 'ALL', engine_pattern: '%',
        item_code: 'COOLANT', item_name: 'Líquido de Arrefecimento (Honda All Season Type 2)', category: 'Arrefecimento',
        interval_km: 100000, interval_months: 60, has_timing_belt: 1, is_wear_item: 0,
        notes: 'Fluido orgânico de longa duração pronto para uso com água desmineralizada.'
    },
    {
        brand: 'HONDA', model_pattern: '%', fuel_type: 'ALL', engine_pattern: '%',
        item_code: 'TRANSMISSION_FLUID', item_name: 'Fluido de Transmissão Automática (CVT / ATF)', category: 'Transmissão',
        interval_km: 40000, interval_months: 36, has_timing_belt: 1, is_wear_item: 0,
        notes: 'Substituição com fluido original Honda HCF-2 para câmbios CVT ou DW-1 para automáticos.'
    },

    // ── VOLKSWAGEN (Ex: Gol, Polo, CrossFox, Virtus, T-Cross) ──
    {
        brand: 'VOLKSWAGEN', model_pattern: '%', fuel_type: 'ALL', engine_pattern: '%',
        item_code: 'ENG_OIL_FILTER', item_name: 'Óleo do Motor e Filtro', category: 'Óleo e Filtros',
        interval_km: 10000, interval_months: 12, has_timing_belt: 1, is_wear_item: 0,
        notes: 'Troca a cada 10.000 km ou 12 meses conforme norma VW.'
    },
    {
        brand: 'VOLKSWAGEN', model_pattern: '%', fuel_type: 'ALL', engine_pattern: '%',
        item_code: 'ENGINE_OIL', item_name: 'Óleo do Motor (VW 502 00 / 508 88 5W40 Sintético)', category: 'Óleo e Filtros',
        interval_km: 10000, interval_months: 12, has_timing_belt: 1, is_wear_item: 0,
        notes: 'Troca a cada 10.000 km ou 12 meses conforme norma VW.'
    },
    {
        brand: 'VOLKSWAGEN', model_pattern: '%', fuel_type: 'ALL', engine_pattern: '%',
        item_code: 'OIL_FILTER', item_name: 'Filtro de Óleo', category: 'Óleo e Filtros',
        interval_km: 10000, interval_months: 12, has_timing_belt: 1, is_wear_item: 0,
        notes: 'Substituição a cada troca de óleo.'
    },
    {
        brand: 'VOLKSWAGEN', model_pattern: '%', fuel_type: 'ALL', engine_pattern: '%',
        item_code: 'AIR_FILTER', item_name: 'Filtro de Ar do Motor', category: 'Filtros',
        interval_km: 20000, interval_months: 24, has_timing_belt: 1, is_wear_item: 0,
        notes: 'Elemento filtrante de ar.'
    },
    {
        brand: 'VOLKSWAGEN', model_pattern: '%', fuel_type: 'ALL', engine_pattern: '%',
        item_code: 'FUEL_FILTER', item_name: 'Filtro de Combustível', category: 'Filtros',
        interval_km: 10000, interval_months: 12, has_timing_belt: 1, is_wear_item: 0,
        notes: 'Proteção dos bicos injetores contra impurezas do etanol e gasolina.'
    },
    {
        brand: 'VOLKSWAGEN', model_pattern: '%', fuel_type: 'ALL', engine_pattern: '%',
        item_code: 'CABIN_FILTER', item_name: 'Filtro de Cabine (Pólen / AC)', category: 'Filtros',
        interval_km: 10000, interval_months: 12, has_timing_belt: 1, is_wear_item: 0,
        notes: 'Substituição anual recomendada.'
    },
    {
        brand: 'VOLKSWAGEN', model_pattern: '%', fuel_type: 'ALL', engine_pattern: '%',
        item_code: 'BRAKE_PADS', item_name: 'Pastilhas de Freio', category: 'Freios',
        interval_km: 10000, interval_months: 12, has_timing_belt: 1, is_wear_item: 1,
        notes: 'Inspeção física a cada revisão. Substituir quando espessura for inferior a 3 mm.'
    },
    {
        brand: 'VOLKSWAGEN', model_pattern: '%', fuel_type: 'ALL', engine_pattern: '%',
        item_code: 'BRAKE_DISCS', item_name: 'Discos de Freio', category: 'Freios',
        interval_km: 20000, interval_months: 24, has_timing_belt: 1, is_wear_item: 1,
        notes: 'Inspeção de espessura e empenamento.'
    },
    {
        brand: 'VOLKSWAGEN', model_pattern: '%', fuel_type: 'ALL', engine_pattern: '%',
        item_code: 'BRAKE_FLUID', item_name: 'Fluido de Freio DOT 4', category: 'Freios',
        interval_km: 40000, interval_months: 24, has_timing_belt: 1, is_wear_item: 0,
        notes: 'Troca periódica a cada 24 meses.'
    },
    {
        brand: 'VOLKSWAGEN', model_pattern: '%', fuel_type: 'ALL', engine_pattern: '%',
        item_code: 'TIMING_BELT', item_name: 'Correia Dentada e Tensor de Sincronismo', category: 'Motor',
        interval_km: 50000, interval_months: 48, has_timing_belt: 1, is_wear_item: 0,
        notes: 'Troca preventiva crítica para evitar colisão entre válvulas e pistões (motores EA111 / EA211).'
    },
    {
        brand: 'VOLKSWAGEN', model_pattern: '%', fuel_type: 'ALL', engine_pattern: '%',
        item_code: 'AUXILIARY_BELT', item_name: 'Correia Poli-V Auxiliar do Alternador', category: 'Motor',
        interval_km: 40000, interval_months: 36, has_timing_belt: 1, is_wear_item: 0,
        notes: 'Inspeção de tensão e desgaste de canaletas.'
    },
    {
        brand: 'VOLKSWAGEN', model_pattern: '%', fuel_type: 'ALL', engine_pattern: '%',
        item_code: 'SPARK_PLUGS', item_name: 'Velas de Ignição', category: 'Ignição',
        interval_km: 30000, interval_months: 36, has_timing_belt: 1, is_wear_item: 0,
        notes: 'Jogo de velas de ignição com folga de eletrodos calibrada.'
    },
    {
        brand: 'VOLKSWAGEN', model_pattern: '%', fuel_type: 'ALL', engine_pattern: '%',
        item_code: 'COOLANT', item_name: 'Líquido de Arrefecimento G12+ / G13', category: 'Arrefecimento',
        interval_km: 60000, interval_months: 48, has_timing_belt: 1, is_wear_item: 0,
        notes: 'Proporção 50% aditivo de etilenoglicol original e 50% água desmineralizada.'
    },

    // ── UNIVERSAL / PADRÃO GERAL ──
    {
        brand: 'UNIVERSAL', model_pattern: '%', fuel_type: 'ALL', engine_pattern: '%',
        item_code: 'ENG_OIL_FILTER', item_name: 'Óleo do Motor e Filtro', category: 'Óleo e Filtros',
        interval_km: 10000, interval_months: 12, has_timing_belt: 1, is_wear_item: 0,
        notes: 'Substituição simultânea de óleo lubrificante e elemento filtrante.'
    },
    {
        brand: 'UNIVERSAL', model_pattern: '%', fuel_type: 'ALL', engine_pattern: '%',
        item_code: 'ENGINE_OIL', item_name: 'Troca de Óleo do Motor', category: 'Óleo e Filtros',
        interval_km: 10000, interval_months: 12, has_timing_belt: 1, is_wear_item: 0,
        notes: 'Recomendação técnica geral: 10.000 km ou 12 meses.'
    },
    {
        brand: 'UNIVERSAL', model_pattern: '%', fuel_type: 'ALL', engine_pattern: '%',
        item_code: 'OIL_FILTER', item_name: 'Filtro de Óleo', category: 'Óleo e Filtros',
        interval_km: 10000, interval_months: 12, has_timing_belt: 1, is_wear_item: 0,
        notes: 'Substituição simultânea à troca de óleo.'
    },
    {
        brand: 'UNIVERSAL', model_pattern: '%', fuel_type: 'ALL', engine_pattern: '%',
        item_code: 'AIR_FILTER', item_name: 'Filtro de Ar', category: 'Filtros',
        interval_km: 20000, interval_months: 24, has_timing_belt: 1, is_wear_item: 0,
        notes: 'Substituição a cada 20.000 km ou 24 meses.'
    },
    {
        brand: 'UNIVERSAL', model_pattern: '%', fuel_type: 'ALL', engine_pattern: '%',
        item_code: 'CABIN_FILTER', item_name: 'Filtro do Ar-Condicionado', category: 'Filtros',
        interval_km: 10000, interval_months: 12, has_timing_belt: 1, is_wear_item: 0,
        notes: 'Substituição preventiva anual.'
    },
    {
        brand: 'UNIVERSAL', model_pattern: '%', fuel_type: 'ALL', engine_pattern: '%',
        item_code: 'BRAKE_PADS', item_name: 'Pastilhas de Freio', category: 'Freios',
        interval_km: 10000, interval_months: 12, has_timing_belt: 1, is_wear_item: 1,
        notes: 'Inspeção em oficina credenciada. Desgaste varia por condução.'
    },
    {
        brand: 'UNIVERSAL', model_pattern: '%', fuel_type: 'ALL', engine_pattern: '%',
        item_code: 'BRAKE_FLUID', item_name: 'Fluido de Freio', category: 'Freios',
        interval_km: 40000, interval_months: 24, has_timing_belt: 1, is_wear_item: 0,
        notes: 'Substituição a cada 24 meses.'
    },
    {
        brand: 'UNIVERSAL', model_pattern: '%', fuel_type: 'ALL', engine_pattern: '%',
        item_code: 'TIMING_BELT', item_name: 'Correia Dentada / Sincronismo', category: 'Motor',
        interval_km: 60000, interval_months: 48, has_timing_belt: 1, is_wear_item: 0,
        notes: 'Verificar no manual do proprietário se o motor utiliza correia ou corrente.'
    }
];

class PredictiveMaintenanceService {
    /**
     * Inicializa a tabela de regras de manutenção preventiva se vazia
     */
    static seedRulesIfEmpty(dbInstance) {
        const database = dbInstance || db;
        try {
            const count = database.prepare('SELECT COUNT(*) as total FROM maintenance_rules').get();
            if (count && count.total > 0) return;

            const insertStmt = database.prepare(`
                INSERT INTO maintenance_rules (
                    id, brand, model_pattern, fuel_type, engine_pattern,
                    item_code, item_name, category, interval_km, interval_months,
                    has_timing_belt, is_wear_item, notes, source
                ) VALUES (
                    @id, @brand, @model_pattern, @fuel_type, @engine_pattern,
                    @item_code, @item_name, @category, @interval_km, @interval_months,
                    @has_timing_belt, @is_wear_item, @notes, @source
                )
            `);

            database.transaction(() => {
                DEFAULT_MAINTENANCE_RULES.forEach((r, idx) => {
                    insertStmt.run({
                        id: `mrule_${r.brand}_${r.item_code}_${idx}`,
                        brand: r.brand,
                        model_pattern: r.model_pattern,
                        fuel_type: r.fuel_type,
                        engine_pattern: r.engine_pattern,
                        item_code: r.item_code,
                        item_name: r.item_name,
                        category: r.category,
                        interval_km: r.interval_km,
                        interval_months: r.interval_months,
                        has_timing_belt: r.has_timing_belt,
                        is_wear_item: r.is_wear_item,
                        notes: r.notes,
                        source: 'Manual do Fabricante / DNA AUTO Engineering'
                    });
                });
            })();
            console.log(`✅ ${DEFAULT_MAINTENANCE_RULES.length} regras de manutenção preditiva inicializadas.`);
        } catch (e) {
            console.warn('Aviso ao inicializar maintenance_rules:', e.message);
        }
    }

    /**
     * Obtém as regras aplicáveis ao veículo com prioridade de especificidade
     */
    static getApplicableRules(database, vehicle) {
        const brand = (vehicle.brand || '').trim().toUpperCase();
        const model = (vehicle.model || '').trim().toUpperCase();

        // 1. Tentar regras da marca específica
        let rules = database.prepare(`
            SELECT * FROM maintenance_rules
            WHERE UPPER(brand) = ?
            ORDER BY interval_km ASC
        `).all(brand);

        // Se encontrou regras específicas da montadora, aplicar filtro de modelo (ex: correia vs corrente no Civic)
        if (rules && rules.length > 0) {
            const isCivic = model.includes('CIVIC');
            rules = rules.filter(r => {
                if (r.model_pattern === '%CIVIC%' && !isCivic) return false;
                if (r.model_pattern === '%' && isCivic && r.item_code === 'TIMING_BELT' && r.has_timing_belt === 1) return false;
                return true;
            });
            return rules;
        }

        // 2. Fallback para regras universais
        return database.prepare(`
            SELECT * FROM maintenance_rules
            WHERE brand = 'UNIVERSAL'
            ORDER BY interval_km ASC
        `).all();
    }

    /**
     * Busca a última leitura oficial confirmada do hodômetro
     */
    static getLatestOfficialOdometer(database, vehicleId) {
        // Prioridade 1: Tabela dedicada de leituras oficiais
        const reading = database.prepare(`
            SELECT * FROM odometer_readings
            WHERE vehicle_id = ?
            ORDER BY reading_date DESC, reading_km DESC, created_at DESC
            LIMIT 1
        `).get(vehicleId);

        if (reading && reading.reading_km > 0) {
            return {
                km: reading.reading_km,
                date: reading.reading_date,
                source: reading.source,
                details: reading.source_details || 'Registro Oficial'
            };
        }

        // Prioridade 2: Maior quilometragem confirmada em ordens de serviço de oficinas
        const service = database.prepare(`
            SELECT mileage, service_date, proof_status, responsible_technician_name
            FROM service_records
            WHERE vehicle_id = ? AND proof_level >= 3
            ORDER BY service_date DESC, mileage DESC
            LIMIT 1
        `).get(vehicleId);

        if (service && service.mileage > 0) {
            return {
                km: service.mileage,
                date: service.service_date,
                source: 'WORKSHOP_SERVICE',
                details: 'Ordem de Serviço Chancelada por Oficina Credenciada'
            };
        }

        // Prioridade 3: Histórico geral de quilometragem
        const genericMileage = database.prepare(`
            SELECT mileage, recorded_at, source
            FROM mileage_records
            WHERE vehicle_id = ?
            ORDER BY recorded_at DESC, mileage DESC
            LIMIT 1
        `).get(vehicleId);

        if (genericMileage && genericMileage.mileage > 0) {
            return {
                km: genericMileage.mileage,
                date: genericMileage.recorded_at,
                source: genericMileage.source || 'REGISTRATION',
                details: 'Quilometragem Inicial de Cadastro'
            };
        }

        return {
            km: 0,
            date: new Date().toISOString().split('T')[0],
            source: 'NONE',
            details: 'Nenhuma leitura oficial cadastrada'
        };
    }

    /**
     * Calcula o total de quilômetros estimados a partir de viagens em veículo
     * realizadas APÓS a data da última leitura oficial do hodômetro.
     */
    static getEstimatedDistanceSinceOfficial(database, vehicleId, officialDate) {
        const row = database.prepare(`
            SELECT COALESCE(SUM(distance_km), 0) as total_estimated_km,
                   COUNT(id) as trips_count
            FROM vehicle_trips
            WHERE vehicle_id = ?
              AND classification = 'IN_VEHICLE'
              AND (DATE(end_time) >= DATE(?) OR ? IS NULL)
        `).get(vehicleId, officialDate, officialDate);

        return {
            estimated_km: row ? Number(row.total_estimated_km.toFixed(1)) : 0,
            trips_count: row ? row.trips_count : 0
        };
    }

    /**
     * Encontra a última manutenção confirmada para um item específico
     */
    static findLastMaintenanceForItem(database, vehicleId, itemCode, category) {
        // Mapeamento de termos de busca textual para encontrar em títulos/descrições/peças
        const termMap = {
            'ENG_OIL_FILTER': ['óleo', 'oleo', 'lubrificante', 'filtro de óleo', 'filtro de oleo', '5w30', '5w40', '0w20'],
            'ENGINE_OIL': ['óleo', 'oleo', 'lubrificante', '5w30', '5w40', '0w20'],
            'OIL_FILTER': ['filtro de óleo', 'filtro de oleo', 'filtro oleo'],
            'AIR_FILTER': ['filtro de ar', 'filtro ar motor', 'elemento ar'],
            'FUEL_FILTER': ['filtro de combustível', 'filtro combustivel', 'filtro de gasolina'],
            'CABIN_FILTER': ['ar-condicionado', 'ar condicionado', 'filtro de cabine', 'filtro polen', 'higienização'],
            'BRAKE_PADS': ['pastilha', 'pastilhas', 'freio dianteiro', 'freio traseiro'],
            'BRAKE_DISCS': ['disco de freio', 'discos de freio', 'disco'],
            'BRAKE_FLUID': ['fluido de freio', 'oleo de freio', 'dot 4', 'dot 5'],
            'TIMING_BELT': ['correia dentada', 'correia de sincronismo', 'tensor da correia'],
            'AUXILIARY_BELT': ['correia do alternador', 'correia de acessórios', 'correia poli-v', 'correia poly-v'],
            'SPARK_PLUGS': ['velas', 'vela de ignição', 'velas de ignicao', 'iridium'],
            'COOLANT': ['arrefecimento', 'aditivo de radiador', 'liquido de arrefecimento'],
            'TRANSMISSION_FLUID': ['transmissão', 'cambio', 'óleo de câmbio', 'cvt', 'atf']
        };

        const terms = termMap[itemCode] || [category.toLowerCase()];

        // Buscar serviços onde o título, descrição ou peças correspondam aos termos
        const services = database.prepare(`
            SELECT sr.id, sr.service_date, sr.mileage, sr.service_title, sr.description,
                   sr.proof_level, sr.proof_status, w.trade_name as workshop_name
            FROM service_records sr
            LEFT JOIN workshops w ON sr.workshop_id = w.id
            WHERE sr.vehicle_id = ?
            ORDER BY sr.service_date DESC, sr.mileage DESC
        `).all(vehicleId);

        for (const s of services) {
            const textToSearch = `${s.service_title} ${s.description}`.toLowerCase();
            const matches = terms.some(t => textToSearch.includes(t));
            if (matches) {
                return {
                    service_id: s.id,
                    date: s.service_date,
                    mileage: s.mileage,
                    title: s.service_title,
                    workshop: s.workshop_name || 'Oficina Mecânica',
                    proof_level: s.proof_level
                };
            }

            // Checar se há peça vinculada
            const part = database.prepare(`
                SELECT p.name FROM part_installations pi
                JOIN parts p ON pi.part_id = p.id
                WHERE pi.service_record_id = ?
            `).all(s.id);

            const partMatch = part.some(p => terms.some(t => p.name.toLowerCase().includes(t)));
            if (partMatch) {
                return {
                    service_id: s.id,
                    date: s.service_date,
                    mileage: s.mileage,
                    title: s.service_title,
                    workshop: s.workshop_name || 'Oficina Mecânica',
                    proof_level: s.proof_level
                };
            }
        }

        return null;
    }

    /**
     * Recalcula todas as previsões e alertas de manutenção do veículo
     */
    static recalculatePredictions(database, vehicleId) {
        this.seedRulesIfEmpty(database);

        const vehicle = database.prepare('SELECT * FROM vehicles WHERE id = ?').get(vehicleId);
        if (!vehicle) return null;

        const official = this.getLatestOfficialOdometer(database, vehicleId);
        const { estimated_km: estimatedDistance, trips_count } = this.getEstimatedDistanceSinceOfficial(database, vehicleId, official.date);

        const officialKm = Number(official.km) || 0;
        const currentEstimatedKm = officialKm + Math.round(estimatedDistance);
        const uncertaintyKm = Math.ceil(estimatedDistance * 0.05); // ±5% de incerteza da estimativa por GPS/sensores

        const rules = this.getApplicableRules(database, vehicle);
        const predictions = [];

        const upsertPredictionStmt = database.prepare(`
            INSERT INTO vehicle_maintenance_predictions (
                id, vehicle_id, item_code, item_name, category,
                last_service_km, last_service_date,
                recommended_interval_km, recommended_interval_months,
                next_due_km, next_due_date,
                current_odometer_official_km, estimated_distance_since_official_km,
                current_estimated_km, remaining_km_min, remaining_km_max, remaining_days,
                alert_status, confidence_level, rationale, updated_at
            ) VALUES (
                @id, @vehicle_id, @item_code, @item_name, @category,
                @last_service_km, @last_service_date,
                @recommended_interval_km, @recommended_interval_months,
                @next_due_km, @next_due_date,
                @current_odometer_official_km, @estimated_distance_since_official_km,
                @current_estimated_km, @remaining_km_min, @remaining_km_max, @remaining_days,
                @alert_status, @confidence_level, @rationale, CURRENT_TIMESTAMP
            )
            ON CONFLICT(vehicle_id, item_code) DO UPDATE SET
                last_service_km = excluded.last_service_km,
                last_service_date = excluded.last_service_date,
                recommended_interval_km = excluded.recommended_interval_km,
                recommended_interval_months = excluded.recommended_interval_months,
                next_due_km = excluded.next_due_km,
                next_due_date = excluded.next_due_date,
                current_odometer_official_km = excluded.current_odometer_official_km,
                estimated_distance_since_official_km = excluded.estimated_distance_since_official_km,
                current_estimated_km = excluded.current_estimated_km,
                remaining_km_min = excluded.remaining_km_min,
                remaining_km_max = excluded.remaining_km_max,
                remaining_days = excluded.remaining_days,
                alert_status = excluded.alert_status,
                confidence_level = excluded.confidence_level,
                rationale = excluded.rationale,
                updated_at = CURRENT_TIMESTAMP
        `);

        const now = new Date();

        database.transaction(() => {
            for (const rule of rules) {
                const lastService = this.findLastMaintenanceForItem(database, vehicleId, rule.item_code, rule.category);

                let nextDueKm = 0;
                let nextDueDate = null;
                let remainingKm = 0;
                let remainingDays = null;
                let alertStatus = 'EM_DIA';
                let confidenceLevel = 'ALTA';
                let rationale = '';

                // Tratamento especial: Motores com Corrente de Comando
                if (rule.has_timing_belt === 0) {
                    alertStatus = 'EM_DIA';
                    confidenceLevel = 'ALTA';
                    nextDueKm = 250000;
                    remainingKm = 250000 - currentEstimatedKm;
                    rationale = 'Veículo utiliza corrente de comando metálica original. Não requer substituição periódica de correia dentada de borracha.';
                } else if (lastService) {
                    // Há registro comprovado de serviço anterior
                    nextDueKm = Number(lastService.mileage) + Number(rule.interval_km);
                    const lastDate = new Date(lastService.date);
                    const dueDate = new Date(lastDate);
                    dueDate.setMonth(dueDate.getMonth() + Number(rule.interval_months));
                    nextDueDate = dueDate.toISOString().split('T')[0];

                    remainingKm = nextDueKm - currentEstimatedKm;
                    remainingDays = Math.ceil((dueDate - now) / (1000 * 60 * 60 * 24));
                    confidenceLevel = estimatedDistance > 0 ? 'ESTIMADA' : 'ALTA';

                    if (rule.is_wear_item === 1) {
                        alertStatus = 'ACOMPANHAR';
                        rationale = `Última revisão aos ${Number(lastService.mileage).toLocaleString('pt-BR')} km em ${lastService.date}. Desgaste de pastilhas/discos varia com a condução. Inspecionar aos ${nextDueKm.toLocaleString('pt-BR')} km.`;
                    } else if (remainingKm <= 0 || (remainingDays !== null && remainingDays <= 0)) {
                        alertStatus = 'VENCIDA';
                        rationale = `Manutenção vencida! Executada pela última vez aos ${Number(lastService.mileage).toLocaleString('pt-BR')} km. Limite excedido em ${Math.abs(remainingKm)} km.`;
                    } else if (remainingKm <= 500 || (remainingDays !== null && remainingDays <= 15)) {
                        alertStatus = 'RECOMENDADA';
                        rationale = `Manutenção imediata recomendada! Restam ~${remainingKm} km ou ~${remainingDays} dias para o intervalo do fabricante.`;
                    } else if (remainingKm <= 1500 || (remainingDays !== null && remainingDays <= 30)) {
                        alertStatus = 'APROXIMANDO';
                        rationale = `Manutenção se aproximando. Restam ~${remainingKm} km para atingir ${nextDueKm.toLocaleString('pt-BR')} km.`;
                    } else if (remainingKm <= 3000 || (remainingDays !== null && remainingDays <= 60)) {
                        alertStatus = 'ACOMPANHAR';
                        rationale = `Intervalo sob acompanhamento preventivo. Próxima intervenção em ~${remainingKm} km.`;
                    } else {
                        alertStatus = 'EM_DIA';
                        rationale = `Em conformidade. Próxima troca em ~${remainingKm} km ou ${dueDate.toLocaleDateString('pt-BR')}.`;
                    }
                } else {
                    // Sem histórico anterior registrado no DNA AUTO
                    if (officialKm === 0) {
                        alertStatus = 'DADOS_INSUFICIENTES';
                        confidenceLevel = 'BAIXA';
                        nextDueKm = rule.interval_km;
                        remainingKm = rule.interval_km;
                        rationale = 'Quilometragem oficial não cadastrada. Confirme a leitura do painel para ativar as previsões automáticas.';
                    } else {
                        // Estimar próximo múltiplo de revisão do fabricante a partir do hodômetro oficial
                        const cycle = Math.ceil(currentEstimatedKm / rule.interval_km);
                        nextDueKm = (cycle === 0 ? 1 : cycle) * rule.interval_km;
                        if (nextDueKm <= currentEstimatedKm) {
                            nextDueKm += rule.interval_km;
                        }
                        remainingKm = nextDueKm - currentEstimatedKm;

                        // Estimar data considerando uso médio brasileiro de 1.000 km/mês
                        const monthsToDue = Math.max(1, Math.round(remainingKm / 1000));
                        const estDueDate = new Date();
                        estDueDate.setMonth(estDueDate.getMonth() + monthsToDue);
                        nextDueDate = estDueDate.toISOString().split('T')[0];
                        remainingDays = Math.ceil((estDueDate - now) / (1000 * 60 * 60 * 24));
                        confidenceLevel = 'MEDIA';

                        if (rule.is_wear_item === 1) {
                            alertStatus = 'CONFIRMACAO_OFICINA';
                            rationale = 'Componente sujeito a atrito e desgaste físico. Necessita de inspeção visual da espessura em oficina credenciada.';
                        } else if (remainingKm <= 500) {
                            alertStatus = 'RECOMENDADA';
                            rationale = `Próxima revisão estimada aos ${nextDueKm.toLocaleString('pt-BR')} km. Restam ~${remainingKm} km. Confirme com a oficina se o item já foi substituído.`;
                        } else if (remainingKm <= 1500) {
                            alertStatus = 'APROXIMANDO';
                            rationale = `Ciclo preventivo de ${rule.interval_km.toLocaleString('pt-BR')} km se aproximando (~${remainingKm} km restantes).`;
                        } else {
                            alertStatus = 'ACOMPANHAR';
                            rationale = `Previsão baseada no intervalo recomendado de ${rule.interval_km.toLocaleString('pt-BR')} km. Próxima aos ${nextDueKm.toLocaleString('pt-BR')} km.`;
                        }
                    }
                }

                const remainingMin = Math.max(0, remainingKm - uncertaintyKm);
                const remainingMax = remainingKm + uncertaintyKm;

                const predObj = {
                    id: `pred_${vehicleId}_${rule.item_code}`,
                    vehicle_id: vehicleId,
                    item_code: rule.item_code,
                    item_name: rule.item_name,
                    category: rule.category,
                    last_service_km: lastService ? lastService.mileage : null,
                    last_service_date: lastService ? lastService.date : null,
                    recommended_interval_km: rule.interval_km,
                    recommended_interval_months: rule.interval_months,
                    next_due_km: nextDueKm,
                    next_due_date: nextDueDate,
                    current_odometer_official_km: officialKm,
                    estimated_distance_since_official_km: estimatedDistance,
                    current_estimated_km: currentEstimatedKm,
                    remaining_km_min: remainingMin,
                    remaining_km_max: remainingMax,
                    remaining_days: remainingDays,
                    alert_status: alertStatus,
                    confidence_level: confidenceLevel,
                    rationale
                };

                upsertPredictionStmt.run(predObj);
                predictions.push(predObj);
            }
        })();

        // Identificar o item mais prioritário para destaque no card do cliente
        const severityOrder = { 'VENCIDA': 5, 'RECOMENDADA': 4, 'APROXIMANDO': 3, 'CONFIRMACAO_OFICINA': 2, 'ACOMPANHAR': 1, 'EM_DIA': 0, 'DADOS_INSUFICIENTES': 0 };
        const sorted = [...predictions].sort((a, b) => {
            const sevA = severityOrder[a.alert_status] || 0;
            const sevB = severityOrder[b.alert_status] || 0;
            if (sevB !== sevA) return sevB - sevA;
            return (a.remaining_km_min || 0) - (b.remaining_km_min || 0);
        });

        const mostUrgent = sorted.length > 0 ? sorted[0] : null;

        return {
            vehicle_id: vehicleId,
            official_odometer_km: officialKm,
            official_odometer_date: official.date,
            official_odometer_source: official.details,
            estimated_distance_since_official_km: estimatedDistance,
            current_estimated_km: currentEstimatedKm,
            uncertainty_km: uncertaintyKm,
            trips_count,
            most_urgent_item: mostUrgent,
            all_predictions: predictions,
            last_recalculated_at: new Date().toISOString()
        };
    }

    /**
     * Registra nova leitura oficial do hodômetro com validação de monotonicidade e consistência
     */
    static recordOfficialOdometer(database, vehicleId, readingKm, source, sourceDetails, userId) {
        const km = Number(readingKm);
        if (isNaN(km) || km < 0) {
            return { success: false, error: 'Quilometragem inválida. Informe um número inteiro positivo.' };
        }

        const latestReading = database.prepare(`
            SELECT * FROM odometer_readings
            WHERE vehicle_id = ?
            ORDER BY reading_date DESC, reading_km DESC, created_at DESC
            LIMIT 1
        `).get(vehicleId);
        const previousKm = latestReading ? Number(latestReading.reading_km) : 0;
        const previousDate = latestReading ? latestReading.reading_date : null;

        // Validação de consistência: Hodômetro não pode retroceder sem justificativa formal
        if (previousKm > 0 && km < previousKm) {
            return {
                success: false,
                requires_validation: true,
                inconsistent: true,
                previous_km: previousKm,
                previous_date: previousDate,
                error: `Inconsistência detectada: a leitura informada (${km.toLocaleString('pt-BR')} km) é menor que a leitura anterior registrada (${previousKm.toLocaleString('pt-BR')} km em ${previousDate}). Verifique o painel do veículo ou erro de digitação.`
            };
        }

        const today = new Date().toISOString().split('T')[0];
        const readingId = `odo_${vehicleId}_${Date.now()}`;

        database.transaction(() => {
            // 1. Inserir em odometer_readings
            database.prepare(`
                INSERT INTO odometer_readings (
                    id, vehicle_id, reading_km, reading_date, source, source_details, recorded_by_user_id, verified
                ) VALUES (?, ?, ?, ?, ?, ?, ?, 1)
            `).run(readingId, vehicleId, km, today, source || 'OWNER_CONFIRMATION', sourceDetails || 'Confirmado pelo proprietário no painel', userId || null);

            // 2. Sincronizar em mileage_records para histórico unificado
            database.prepare(`
                INSERT INTO mileage_records (id, vehicle_id, mileage, recorded_at, source, verified)
                VALUES (?, ?, ?, ?, ?, 1)
            `).run(`mil_odo_${Date.now()}`, vehicleId, km, today, source || 'OWNER_CONFIRMATION');
        })();

        // 3. Recalcular previsões preditivas automaticamente com a nova leitura como base
        const updatedPredictions = this.recalculatePredictions(database, vehicleId);

        return {
            success: true,
            message: 'Hodômetro oficial confirmado e previsões de manutenção recalibradas com sucesso.',
            reading_id: readingId,
            official_km: km,
            official_odometer_km: km,
            previous_km: previousKm,
            odometer: {
                official_odometer_km: km,
                official_km: km
            },
            predictions: updatedPredictions
        };
    }

    /**
     * Algoritmo de Classificação Probabilística de Viagens (Meta 70%)
     * Combina velocidade, aceleração, Bluetooth veicular e coerência temporal.
     */
    static classifyTrip(tripData) {
        const {
            duration_seconds = 0,
            distance_km = 0,
            avg_speed_kmh = 0,
            max_speed_kmh = 0,
            bluetooth_connected = false,
            accelerometer_profile = 'UNKNOWN', // 'VEHICLE_VIBRATION', 'WALKING_STEPS', 'STATIONARY'
            samples_count = 0,
            samples_high_accuracy = 0 // precisão < 30m
        } = tripData;

        let score = 0;
        const signalsUsed = {
            speed: false,
            trajectory: false,
            accelerometer: false,
            bluetooth: false,
            accuracy: false
        };

        // 1. Análise de Amostragem e Coerência Básica
        if (samples_count < 3 || duration_seconds < 45 || distance_km < 0.1) {
            return {
                classification: 'INSUFFICIENT_DATA',
                confidence_score: 15,
                rationale: 'Amostras insuficientes ou trajeto muito curto (< 45s ou < 100m).',
                signals_used: signalsUsed
            };
        }

        // Filtro de Saltos e Anomalias Físicas (> 180 km/h)
        if (max_speed_kmh > 180 || avg_speed_kmh > 150) {
            return {
                classification: 'INSUFFICIENT_DATA',
                confidence_score: 10,
                rationale: 'Trajeto descartado por conter velocidades fisicamente anômalas para uso rodoviário comum (> 180 km/h).',
                signals_used: signalsUsed
            };
        }

        // 2. Detecção de Caminhada (Walking)
        if (avg_speed_kmh < 7.5 && max_speed_kmh < 13 && accelerometer_profile === 'WALKING_STEPS') {
            return {
                classification: 'WALKING',
                confidence_score: 90,
                rationale: 'Velocidade e cadência compatíveis com deslocamento a pé.',
                signals_used: { speed: true, accelerometer: true }
            };
        }

        // 3. Pontuação de Velocidade e Perfil Veicular (0 a 35 pontos)
        if (avg_speed_kmh >= 15 && avg_speed_kmh <= 130) {
            score += 25;
            signalsUsed.speed = true;
            if (max_speed_kmh >= 35 && max_speed_kmh <= 140) {
                score += 10;
            }
        } else if (avg_speed_kmh >= 10 && avg_speed_kmh < 15) {
            score += 12; // trânsito pesado urbano
            signalsUsed.speed = true;
        }

        // 4. Pontuação do Acelerômetro / Vibração Veicular (0 a 20 pontos)
        if (accelerometer_profile === 'VEHICLE_VIBRATION') {
            score += 20;
            signalsUsed.accelerometer = true;
        } else if (accelerometer_profile === 'WALKING_STEPS') {
            score = Math.max(0, score - 25); // penaliza se houver passo humano rítmico
        } else {
            // Sem leitura clara de acelerômetro
            score += 8;
        }

        // 5. Presença de Bluetooth Veicular Pareado (+25 pontos bônus direto)
        if (bluetooth_connected === true) {
            score += 25;
            signalsUsed.bluetooth = true;
        }

        // 6. Continuidade Temporal e Distância (> 180s e > 500m) (0 a 20 pontos)
        if (duration_seconds >= 180 && distance_km >= 0.5) {
            score += 15;
            signalsUsed.trajectory = true;
        }
        if (samples_high_accuracy >= 5) {
            score += 5;
            signalsUsed.accuracy = true;
        }

        // Limitação da pontuação entre 0 e 100
        score = Math.min(100, Math.max(0, score));

        // Decisão Classificatória:
        // Score >= 70: Meta de 70% de precisão probabilística atingida para classificar como viagem no veículo associado
        if (score >= 70) {
            return {
                classification: 'IN_VEHICLE',
                confidence_score: score,
                rationale: `Viagem veicular identificada com ${score}% de confiança (Sinais combinados: velocidade, sensores e coerência temporal).`,
                signals_used: signalsUsed
            };
        }

        if (score >= 40 && score < 70) {
            // Caso intermediário: outro transporte (ônibus, trem) ou sem Bluetooth com trânsito atípico
            return {
                classification: 'OTHER_TRANSPORT',
                confidence_score: score,
                rationale: `Deslocamento detectado (${score}% de pontuação), porém inconclusivo para o veículo associado. Não contabilizado na quilometragem do carro por precaução.`,
                signals_used: signalsUsed
            };
        }

        return {
            classification: 'INSUFFICIENT_DATA',
            confidence_score: score,
            rationale: 'Sinais insuficientes para confirmar transporte no veículo cadastrado.',
            signals_used: signalsUsed
        };
    }

    /**
     * Registra e persiste um lote de viagens enviadas pelo app
     */
    static processTripSync(database, vehicleId, ownerId, tripsList) {
        if (!Array.isArray(tripsList) || tripsList.length === 0) {
            return { success: true, processed: 0, synced_count: 0, accepted_km: 0, results: [] };
        }

        let acceptedKm = 0;
        let processedCount = 0;
        const syncedResults = [];

        database.transaction(() => {
            for (const t of tripsList) {
                const tripId = t.trip_id || t.id || `trip_${vehicleId}_${Date.now()}_${processedCount}`;

                // Idempotência: Se viagem já existir pelo ID local gerado no app, ignorar duplicação
                const existing = database.prepare('SELECT id FROM vehicle_trips WHERE id = ?').get(tripId);
                if (existing) continue;

                // Executar classificação probabilística no backend
                const classificationResult = this.classifyTrip(t);
                const isVehicleTrip = classificationResult.classification === 'IN_VEHICLE';
                const distanceKm = Number(Number(t.distance_km || 0).toFixed(2));

                database.prepare(`
                    INSERT INTO vehicle_trips (
                        id, vehicle_id, owner_id, start_time, end_time, duration_seconds,
                        distance_km, avg_speed_kmh, max_speed_kmh, confidence_score,
                        classification, signals_used, bluetooth_connected,
                        algorithm_version, is_validated_by_user, user_feedback, synced_at
                    ) VALUES (
                        ?, ?, ?, ?, ?, ?,
                        ?, ?, ?, ?,
                        ?, ?, ?,
                        'v1.0-probabilistic', NULL, NULL, CURRENT_TIMESTAMP
                    )
                `).run(
                    tripId, vehicleId, ownerId || null,
                    t.start_time || new Date(Date.now() - (t.duration_seconds || 600) * 1000).toISOString(),
                    t.end_time || new Date().toISOString(),
                    Number(t.duration_seconds) || 0,
                    distanceKm,
                    Number(t.avg_speed_kmh) || 0,
                    Number(t.max_speed_kmh) || 0,
                    classificationResult.confidence_score,
                    classificationResult.classification,
                    JSON.stringify(classificationResult.signals_used),
                    t.bluetooth_connected ? 1 : 0
                );

                if (isVehicleTrip) {
                    acceptedKm += distanceKm;
                }

                syncedResults.push({
                    trip_id: tripId,
                    classification: classificationResult.classification,
                    confidence_score: classificationResult.confidence_score,
                    distance_km: distanceKm,
                    is_vehicle_trip: isVehicleTrip
                });

                processedCount++;
            }
        })();

        // Atualizar métricas empíricas e previsões
        this.updateEmpiricalMetrics(database, vehicleId);
        this.recalculatePredictions(database, vehicleId);

        return {
            success: true,
            processed: processedCount,
            synced_count: processedCount,
            accepted_km: Number(acceptedKm.toFixed(2)),
            results: syncedResults
        };
    }

    /**
     * Atualiza as métricas de validação da meta de 70% de precisão
     */
    static updateEmpiricalMetrics(database, vehicleId) {
        const stats = database.prepare(`
            SELECT
                COUNT(id) as total,
                SUM(CASE WHEN classification = 'IN_VEHICLE' THEN 1 ELSE 0 END) as in_vehicle,
                SUM(CASE WHEN classification = 'WALKING' THEN 1 ELSE 0 END) as walking,
                SUM(CASE WHEN classification = 'OTHER_TRANSPORT' THEN 1 ELSE 0 END) as other_transport,
                SUM(CASE WHEN classification = 'INSUFFICIENT_DATA' THEN 1 ELSE 0 END) as inconclusive,
                SUM(CASE WHEN is_validated_by_user = 1 AND classification = 'IN_VEHICLE' THEN 1 ELSE 0 END) as tp,
                SUM(CASE WHEN is_validated_by_user = 0 AND classification = 'IN_VEHICLE' THEN 1 ELSE 0 END) as fp,
                SUM(CASE WHEN is_validated_by_user = 0 AND classification != 'IN_VEHICLE' THEN 1 ELSE 0 END) as tn,
                SUM(CASE WHEN is_validated_by_user = 1 AND classification != 'IN_VEHICLE' THEN 1 ELSE 0 END) as fn
            FROM vehicle_trips
            WHERE vehicle_id = ?
        `).get(vehicleId);

        if (!stats) return;

        const evaluatedTotal = (stats.tp || 0) + (stats.fp || 0);
        const accuracy = evaluatedTotal > 0 ? ((stats.tp / evaluatedTotal) * 100).toFixed(1) : 0;

        database.prepare(`
            INSERT INTO trip_classification_metrics (
                id, vehicle_id, total_trips_analyzed, in_vehicle_count, walking_count,
                other_transport_count, inconclusive_count,
                confirmed_true_positives, confirmed_false_positives,
                confirmed_true_negatives, confirmed_false_negatives,
                measured_accuracy_percent, updated_at
            ) VALUES (
                ?, ?, ?, ?, ?,
                ?, ?,
                ?, ?,
                ?, ?,
                ?, CURRENT_TIMESTAMP
            )
            ON CONFLICT(id) DO UPDATE SET
                total_trips_analyzed = excluded.total_trips_analyzed,
                in_vehicle_count = excluded.in_vehicle_count,
                walking_count = excluded.walking_count,
                other_transport_count = excluded.other_transport_count,
                inconclusive_count = excluded.inconclusive_count,
                confirmed_true_positives = excluded.confirmed_true_positives,
                confirmed_false_positives = excluded.confirmed_false_positives,
                confirmed_true_negatives = excluded.confirmed_true_negatives,
                confirmed_false_negatives = excluded.confirmed_false_negatives,
                measured_accuracy_percent = excluded.measured_accuracy_percent,
                updated_at = CURRENT_TIMESTAMP
        `).run(
            `metric_${vehicleId}`, vehicleId,
            stats.total || 0, stats.in_vehicle || 0, stats.walking || 0,
            stats.other_transport || 0, stats.inconclusive || 0,
            stats.tp || 0, stats.fp || 0,
            stats.tn || 0, stats.fn || 0,
            Number(accuracy)
        );
    }
}

module.exports = PredictiveMaintenanceService;
