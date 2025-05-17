
const checkAdmin = (req, res, next) => {
    if (!req.user || !req.user.rol || req.user.rol.toLowerCase() !== 'admin') {
        return res.status(403).json({ message: 'Acceso denegado: Solo los administradores pueden realizar esta acción' });
    }
    next();
};

module.exports = checkAdmin;