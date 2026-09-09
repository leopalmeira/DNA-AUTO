/**
 * Serviço de Resolução de Fotos Oficiais de Veículos por Modelo e Montadora
 * DNA AUTO — Plataforma de Identidade Veicular
 * 
 * Atribui automaticamente uma foto de alta resolução correspondente ao modelo
 * exato do veículo no momento do cadastro, até que o proprietário envie sua própria foto.
 */

// Catálogo de Fotos Oficiais por Modelo e Montadora (Ângulos 3/4 de Estúdio Automotivo)
const MODEL_PHOTOS = {
    // ── VOLKSWAGEN ──
    'VW_GOL': '/img/vw-gol-app.jpg',
    'VW_POLO': 'https://images.unsplash.com/photo-1541899481282-d53bffe3c35d?w=800&auto=format&fit=crop&q=80',
    'VW_GOLF': 'https://images.unsplash.com/photo-1503376780353-7e6692767b70?w=800&auto=format&fit=crop&q=80',
    'VW_FOX': 'https://images.unsplash.com/photo-1552519507-da3b142c6e3d?w=800&auto=format&fit=crop&q=80',
    'VW_CROSSFOX': 'https://images.unsplash.com/photo-1552519507-da3b142c6e3d?w=800&auto=format&fit=crop&q=80',
    'VW_VIRTUS': 'https://images.unsplash.com/photo-1590362891991-f776e747a588?w=800&auto=format&fit=crop&q=80',
    'VW_VOYAGE': 'https://images.unsplash.com/photo-1590362891991-f776e747a588?w=800&auto=format&fit=crop&q=80',
    'VW_TCROSS': 'https://images.unsplash.com/photo-1549399542-7e3f8b79c341?w=800&auto=format&fit=crop&q=80',
    'VW_NIVUS': 'https://images.unsplash.com/photo-1549399542-7e3f8b79c341?w=800&auto=format&fit=crop&q=80',
    'VW_TAOS': 'https://images.unsplash.com/photo-1519641471654-76ce0107ad1b?w=800&auto=format&fit=crop&q=80',
    'VW_SAVEIRO': 'https://images.unsplash.com/photo-1559416523-140ddc3d238c?w=800&auto=format&fit=crop&q=80',
    'VW_AMAROK': 'https://images.unsplash.com/photo-1559416523-140ddc3d238c?w=800&auto=format&fit=crop&q=80',
    'VW_JETTA': 'https://images.unsplash.com/photo-1590362891991-f776e747a588?w=800&auto=format&fit=crop&q=80',

    // ── HONDA ──
    'HONDA_CIVIC': 'https://images.unsplash.com/photo-1606664515524-ed2f786a0bd6?w=800&auto=format&fit=crop&q=80',
    'HONDA_CITY': 'https://images.unsplash.com/photo-1606664515524-ed2f786a0bd6?w=800&auto=format&fit=crop&q=80',
    'HONDA_FIT': 'https://images.unsplash.com/photo-1541899481282-d53bffe3c35d?w=800&auto=format&fit=crop&q=80',
    'HONDA_HRV': 'https://images.unsplash.com/photo-1549399542-7e3f8b79c341?w=800&auto=format&fit=crop&q=80',
    'HONDA_CRV': 'https://images.unsplash.com/photo-1519641471654-76ce0107ad1b?w=800&auto=format&fit=crop&q=80',

    // ── TOYOTA ──
    'TOYOTA_COROLLA': 'https://images.unsplash.com/photo-1621007947382-bb3c3994e3fb?w=800&auto=format&fit=crop&q=80',
    'TOYOTA_YARIS': 'https://images.unsplash.com/photo-1541899481282-d53bffe3c35d?w=800&auto=format&fit=crop&q=80',
    'TOYOTA_ETIOS': 'https://images.unsplash.com/photo-1541899481282-d53bffe3c35d?w=800&auto=format&fit=crop&q=80',
    'TOYOTA_HILUX': 'https://images.unsplash.com/photo-1559416523-140ddc3d238c?w=800&auto=format&fit=crop&q=80',
    'TOYOTA_SW4': 'https://images.unsplash.com/photo-1519641471654-76ce0107ad1b?w=800&auto=format&fit=crop&q=80',
    'TOYOTA_COROLLA_CROSS': 'https://images.unsplash.com/photo-1549399542-7e3f8b79c341?w=800&auto=format&fit=crop&q=80',

    // ── CHEVROLET ──
    'CHEVROLET_ONIX': 'https://images.unsplash.com/photo-1552519507-da3b142c6e3d?w=800&auto=format&fit=crop&q=80',
    'CHEVROLET_PRISMA': 'https://images.unsplash.com/photo-1590362891991-f776e747a588?w=800&auto=format&fit=crop&q=80',
    'CHEVROLET_TRACKER': 'https://images.unsplash.com/photo-1549399542-7e3f8b79c341?w=800&auto=format&fit=crop&q=80',
    'CHEVROLET_CRUZE': 'https://images.unsplash.com/photo-1590362891991-f776e747a588?w=800&auto=format&fit=crop&q=80',
    'CHEVROLET_S10': 'https://images.unsplash.com/photo-1559416523-140ddc3d238c?w=800&auto=format&fit=crop&q=80',
    'CHEVROLET_CELTA': 'https://images.unsplash.com/photo-1541899481282-d53bffe3c35d?w=800&auto=format&fit=crop&q=80',
    'CHEVROLET_SPIN': 'https://images.unsplash.com/photo-1549399542-7e3f8b79c341?w=800&auto=format&fit=crop&q=80',

    // ── HYUNDAI ──
    'HYUNDAI_HB20': 'https://images.unsplash.com/photo-1552519507-da3b142c6e3d?w=800&auto=format&fit=crop&q=80',
    'HYUNDAI_CRETA': 'https://images.unsplash.com/photo-1549399542-7e3f8b79c341?w=800&auto=format&fit=crop&q=80',
    'HYUNDAI_TUCSON': 'https://images.unsplash.com/photo-1519641471654-76ce0107ad1b?w=800&auto=format&fit=crop&q=80',

    // ── FIAT ──
    'FIAT_STRADA': 'https://images.unsplash.com/photo-1559416523-140ddc3d238c?w=800&auto=format&fit=crop&q=80',
    'FIAT_TORO': 'https://images.unsplash.com/photo-1559416523-140ddc3d238c?w=800&auto=format&fit=crop&q=80',
    'FIAT_ARGO': 'https://images.unsplash.com/photo-1552519507-da3b142c6e3d?w=800&auto=format&fit=crop&q=80',
    'FIAT_CRONOS': 'https://images.unsplash.com/photo-1590362891991-f776e747a588?w=800&auto=format&fit=crop&q=80',
    'FIAT_MOBI': 'https://images.unsplash.com/photo-1541899481282-d53bffe3c35d?w=800&auto=format&fit=crop&q=80',
    'FIAT_UNO': 'https://images.unsplash.com/photo-1541899481282-d53bffe3c35d?w=800&auto=format&fit=crop&q=80',
    'FIAT_PULSE': 'https://images.unsplash.com/photo-1549399542-7e3f8b79c341?w=800&auto=format&fit=crop&q=80',
    'FIAT_FASTBACK': 'https://images.unsplash.com/photo-1549399542-7e3f8b79c341?w=800&auto=format&fit=crop&q=80',

    // ── JEEP ──
    'JEEP_RENEGADE': 'https://images.unsplash.com/photo-1533473359331-0135ef1b58bf?w=800&auto=format&fit=crop&q=80',
    'JEEP_COMPASS': 'https://images.unsplash.com/photo-1519641471654-76ce0107ad1b?w=800&auto=format&fit=crop&q=80',
    'JEEP_COMMANDER': 'https://images.unsplash.com/photo-1519641471654-76ce0107ad1b?w=800&auto=format&fit=crop&q=80',

    // ── RENAULT ──
    'RENAULT_KWID': 'https://images.unsplash.com/photo-1541899481282-d53bffe3c35d?w=800&auto=format&fit=crop&q=80',
    'RENAULT_SANDERO': 'https://images.unsplash.com/photo-1552519507-da3b142c6e3d?w=800&auto=format&fit=crop&q=80',
    'RENAULT_DUSTER': 'https://images.unsplash.com/photo-1549399542-7e3f8b79c341?w=800&auto=format&fit=crop&q=80',

    // ── NISSAN ──
    'NISSAN_KICKS': 'https://images.unsplash.com/photo-1549399542-7e3f8b79c341?w=800&auto=format&fit=crop&q=80',
    'NISSAN_VERSA': 'https://images.unsplash.com/photo-1590362891991-f776e747a588?w=800&auto=format&fit=crop&q=80',
    'NISSAN_FRONTIER': 'https://images.unsplash.com/photo-1559416523-140ddc3d238c?w=800&auto=format&fit=crop&q=80',

    // ── FORD ──
    'FORD_KA': 'https://images.unsplash.com/photo-1541899481282-d53bffe3c35d?w=800&auto=format&fit=crop&q=80',
    'FORD_ECOSPORT': 'https://images.unsplash.com/photo-1549399542-7e3f8b79c341?w=800&auto=format&fit=crop&q=80',
    'FORD_RANGER': 'https://images.unsplash.com/photo-1559416523-140ddc3d238c?w=800&auto=format&fit=crop&q=80'
};

// Fallbacks de Alto Padrão por Categoria / Montadora
const BRAND_FALLBACKS = {
    'VOLKSWAGEN': '/img/vw-gol-app.jpg',
    'HONDA': 'https://images.unsplash.com/photo-1606664515524-ed2f786a0bd6?w=800&auto=format&fit=crop&q=80',
    'TOYOTA': 'https://images.unsplash.com/photo-1621007947382-bb3c3994e3fb?w=800&auto=format&fit=crop&q=80',
    'CHEVROLET': 'https://images.unsplash.com/photo-1552519507-da3b142c6e3d?w=800&auto=format&fit=crop&q=80',
    'FIAT': 'https://images.unsplash.com/photo-1559416523-140ddc3d238c?w=800&auto=format&fit=crop&q=80',
    'HYUNDAI': 'https://images.unsplash.com/photo-1549399542-7e3f8b79c341?w=800&auto=format&fit=crop&q=80',
    'JEEP': 'https://images.unsplash.com/photo-1533473359331-0135ef1b58bf?w=800&auto=format&fit=crop&q=80',
    'RENAULT': 'https://images.unsplash.com/photo-1552519507-da3b142c6e3d?w=800&auto=format&fit=crop&q=80',
    'NISSAN': 'https://images.unsplash.com/photo-1549399542-7e3f8b79c341?w=800&auto=format&fit=crop&q=80',
    'FORD': 'https://images.unsplash.com/photo-1541899481282-d53bffe3c35d?w=800&auto=format&fit=crop&q=80',
    'BMW': 'https://images.unsplash.com/photo-1555215695-3004980ad54e?w=800&auto=format&fit=crop&q=80',
    'MERCEDES': 'https://images.unsplash.com/photo-1617814076367-b759c7d7e738?w=800&auto=format&fit=crop&q=80',
    'AUDI': 'https://images.unsplash.com/photo-1603584173870-7f23fdae1b7a?w=800&auto=format&fit=crop&q=80'
};

const DEFAULT_UNIVERSAL_PHOTO = '/img/vw-gol-app.jpg';

/**
 * Normaliza termos para correspondência sem acentos e sem caracteres especiais
 */
function cleanTerm(str) {
    if (!str || typeof str !== 'string') return '';
    return str
        .normalize('NFD')
        .replace(/[\u0300-\u036f]/g, '')
        .toUpperCase()
        .replace(/[^A-Z0-9]/g, '');
}

/**
 * Retorna a foto oficial correspondente ao modelo e marca do carro.
 * @param {string} brand - Marca do veículo (ex: Volkswagen, Honda, Fiat)
 * @param {string} model - Modelo do veículo (ex: Gol, Civic, Strada)
 * @returns {string} URL da foto oficial correspondente
 */
function getDefaultPhotoForVehicle(brand, model) {
    const cleanB = cleanTerm(brand);
    const cleanM = cleanTerm(model);

    // 1. Verificação direta por Chaves de Modelos
    for (const [key, photo] of Object.entries(MODEL_PHOTOS)) {
        const [kBrand, kModel] = key.split('_');
        const matchBrand = cleanB.includes(kBrand) || kBrand.includes(cleanB) || (cleanB === 'VW' && kBrand === 'VW') || (cleanB === 'VOLKSWAGEN' && kBrand === 'VW');
        const matchModel = cleanM.includes(kModel) || kModel.includes(cleanM);

        if (matchBrand && matchModel) {
            return photo;
        }
    }

    // 2. Verificação apenas por Modelo (caso a marca venha abreviada ou diferente)
    for (const [key, photo] of Object.entries(MODEL_PHOTOS)) {
        const [, kModel] = key.split('_');
        if (cleanM.includes(kModel) && kModel.length >= 3) {
            return photo;
        }
    }

    // 3. Verificação por Montadora / Marca
    for (const [bKey, photo] of Object.entries(BRAND_FALLBACKS)) {
        if (cleanB.includes(bKey) || bKey.includes(cleanB)) {
            return photo;
        }
    }

    // 4. Fallback Universal Elegante
    return DEFAULT_UNIVERSAL_PHOTO;
}

/**
 * Informa se uma determinada foto é uma foto oficial do catálogo de modelos
 * ou se é uma foto personalizada enviada pelo proprietário do veículo.
 * @param {string} photoUrl 
 * @param {string} brand 
 * @param {string} model 
 * @returns {boolean} true se for foto do próprio dono (upload)
 */
function isCustomOwnerPhoto(photoUrl, brand, model) {
    if (!photoUrl) return false;
    if (photoUrl.startsWith('data:image/')) return true; // Base64 de upload
    if (photoUrl.includes('owner_upload') || photoUrl.includes('custom_')) return true;

    const defaultForThis = getDefaultPhotoForVehicle(brand, model);
    if (photoUrl === defaultForThis) return false;

    // Se a foto estiver na lista de catálogo padrão, não é customizada
    const isCatalog = Object.values(MODEL_PHOTOS).includes(photoUrl) || Object.values(BRAND_FALLBACKS).includes(photoUrl);
    return !isCatalog;
}

module.exports = {
    getDefaultPhotoForVehicle,
    isCustomOwnerPhoto,
    MODEL_PHOTOS,
    BRAND_FALLBACKS,
    DEFAULT_UNIVERSAL_PHOTO
};
