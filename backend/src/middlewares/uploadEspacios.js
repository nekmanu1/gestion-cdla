const multer = require('multer');
const path = require('path');

const storage = multer.diskStorage({
    destination(req, file, cb) {

        if (file.fieldname === 'imagen') {
            cb(null, 'uploads/espacios/imagenes');
        } else {
            cb(null, 'uploads/espacios/planos');
        }
    },

    filename(req, file, cb) {
        const nombre =
            Date.now() +
            '-' +
            Math.round(Math.random() * 1e9);

        cb(
            null,
            nombre + path.extname(file.originalname)
        );
    }
});

module.exports = multer({
    storage
});