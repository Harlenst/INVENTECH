const express = require('express');
const router = express.Router();
const { connectToDatabase, getDb } = require('../db');
const multer = require('multer');
const path = require('path');
const fs = require('fs');
const winston = require('winston'); // Importar winston
const { authenticateToken } = require('./auth'); // Importar authenticateToken desde auth.js

// Configuración del logger
const logger = winston.createLogger({
  level: 'info',
  format: winston.format.combine(
    winston.format.timestamp(),
    winston.format.json()
  ),
  transports: [
    new winston.transports.File({ filename: 'error.log', level: 'error' }),
    new winston.transports.File({ filename: 'combined.log' }),
  ],
});

if (process.env.NODE_ENV !== 'production') {
  logger.add(new winston.transports.Console({
    format: winston.format.simple(),
  }));
}

const uploadDir = path.join(__dirname, '..', '..', 'Uploads');
if (!fs.existsSync(uploadDir)) {
  fs.mkdirSync(uploadDir, { recursive: true });
}

const storage = multer.diskStorage({
  destination: (req, file, cb) => cb(null, uploadDir),
  filename: (req, file, cb) => cb(null, Date.now() + path.extname(file.originalname))
});
const upload = multer({ storage });

const isAdmin = async (req, res, next) => {
  try {
    const db = getDb() || (await connectToDatabase());
    const [rows] = await db.execute(
      'SELECT rol FROM usuarios WHERE id = ?',
      [req.user.id]
    );
    if (rows.length === 0 || rows[0].rol.toLowerCase() !== 'admin') {
      return res.status(403).json({ message: 'Acceso denegado: Se requiere rol de Admin' });
    }
    next();
  } catch (error) {
    console.error('Error al verificar rol de Admin:', error);
    res.status(500).json({ message: 'Error en el servidor', error: error.message });
  }
};

// Ruta para buscar producto por código de barras (accesible para todos los autenticados)
router.get('/products/barcode/:barcode', authenticateToken, async (req, res) => {
  try {
    const db = getDb() || (await connectToDatabase());
    const [rows] = await db.execute('SELECT * FROM productos WHERE codigo_barras = ?', [req.params.barcode]);
    if (rows.length === 0) {
      return res.status(404).json({ message: 'Producto no encontrado' });
    }
    res.json(rows[0]);
  } catch (error) {
    console.error('Error al buscar producto:', error);
    res.status(500).json({ message: 'Error al buscar producto', error: error.message });
  }
});

// Ruta para registrar un producto (solo para Admins)
router.post('/products', authenticateToken, isAdmin, upload.single('imagen'), async (req, res) => {
  const { nombre, precio, categoria, talla, stock, codigo_barras, codigo_general } = req.body;
  const imagen = req.file ? `/uploads/${req.file.filename}` : null;

  if (!nombre || !precio || !categoria || !talla || !stock || !codigo_barras || !codigo_general) {
    return res.status(400).json({ message: 'Faltan datos requeridos' });
  }

  if (isNaN(precio) || precio <= 0) {
    return res.status(400).json({ message: 'El precio debe ser un número mayor a 0' });
  }
  if (isNaN(stock) || stock < 0) {
    return res.status(400).json({ message: 'El stock debe ser un número mayor o igual a 0' });
  }

  try {
    const db = getDb() || (await connectToDatabase());
    const [existing] = await db.execute(
      'SELECT * FROM productos WHERE codigo_barras = ? OR codigo_general = ?',
      [codigo_barras, codigo_general]
    );
    if (existing.length > 0) {
      return res.status(400).json({ message: 'El código de barras o código general ya está registrado' });
    }

    await db.execute(
      'INSERT INTO productos (nombre, precio, imagen, stock, categoria, talla, codigo_barras, codigo_general) VALUES (?, ?, ?, ?, ?, ?, ?, ?)',
      [nombre, precio, imagen, stock, categoria, talla, codigo_barras, codigo_general]
    );
    res.status(201).json({ message: 'Producto registrado con éxito' });
  } catch (error) {
    console.error('Error al registrar producto:', error);
    res.status(500).json({ message: 'Error al registrar producto', error: error.message });
  }
});

// Ruta para obtener todos los productos (accesible para todos los autenticados)
router.get('/products', authenticateToken, async (req, res) => {
  try {
    const db = getDb() || (await connectToDatabase());
    const [products] = await db.execute('SELECT * FROM productos');
    res.json(products);
  } catch (error) {
    console.error('Error al obtener productos:', error);
    res.status(500).json({ message: 'Error al obtener productos', error: error.message });
  }
});

// Ruta para obtener alertas de inventario (solo para Admins) - InventoryAlerts
router.get('/inventory/alerts', authenticateToken, isAdmin, async (req, res) => {
  try {
    const db = getDb() || (await connectToDatabase());
    const [rows] = await db.execute(
      'SELECT * FROM productos WHERE stock < 10' // Ejemplo: alerta si stock < 10
    );
    logger.info(`Alertas de inventario obtenidas por admin ${req.user.id}`);
    res.json(rows);
  } catch (error) {
    logger.error('Error al obtener alertas de inventario:', error.message);
    res.status(500).json({ message: 'Error al obtener alertas de inventario', error: error.message });
  }
});

// Ruta para obtener historial de alertas (solo para Admins) - AlertHistory
router.get('/inventory/alert-history', authenticateToken, isAdmin, async (req, res) => {
  try {
    const db = getDb() || (await connectToDatabase());
    const [rows] = await db.execute(
      'SELECT * FROM alertas_inventario' // Asume una tabla alertas_inventario
    );
    logger.info(`Historial de alertas obtenido por admin ${req.user.id}`);
    res.json(rows);
  } catch (error) {
    logger.error('Error al obtener historial de alertas:', error.message);
    res.status(500).json({ message: 'Error al obtener historial de alertas', error: error.message });
  }
});

module.exports = router;