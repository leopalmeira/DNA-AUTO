const multer = require('multer');
const path = require('path');
const fs = require('fs');

const UPLOADS_DIR = path.join(__dirname, '..', '..', 'uploads');
const PHOTOS_DIR = path.join(UPLOADS_DIR, 'photos');
const INVOICES_DIR = path.join(UPLOADS_DIR, 'invoices');
const DOCS_DIR = path.join(UPLOADS_DIR, 'documents');

[UPLOADS_DIR, PHOTOS_DIR, INVOICES_DIR, DOCS_DIR].forEach(dir => {
    if (!fs.existsSync(dir)) {
        fs.mkdirSync(dir, { recursive: true });
    }
});

const storage = multer.diskStorage({
    destination: function (req, file, cb) {
        if (file.fieldname === 'photo' || file.fieldname === 'photos') {
            cb(null, PHOTOS_DIR);
        } else if (file.fieldname === 'invoice') {
            cb(null, INVOICES_DIR);
        } else {
            cb(null, DOCS_DIR);
        }
    },
    filename: function (req, file, cb) {
        const uniqueSuffix = Date.now() + '-' + Math.round(Math.random() * 1E9);
        const ext = path.extname(file.originalname);
        cb(null, file.fieldname + '-' + uniqueSuffix + ext);
    }
});

const fileFilter = (req, file, cb) => {
    const allowedMimes = ['image/jpeg', 'image/png', 'image/webp', 'application/pdf'];
    if (allowedMimes.includes(file.mimetype)) {
        cb(null, true);
    } else {
        cb(new Error('Tipo de arquivo não permitido. Apenas JPEG, PNG, WEBP e PDF são aceitos.'), false);
    }
};

const upload = multer({
    storage: storage,
    limits: { fileSize: 15 * 1024 * 1024 }, // 15MB
    fileFilter: fileFilter
});

module.exports = upload;
