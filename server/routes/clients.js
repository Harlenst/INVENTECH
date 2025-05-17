const express = require('express');
const router = express.Router();
const jwt = require('jsonwebtoken');
const Joi = require('joi');
const { connectToDatabase, getDb } = require('../db');
const winston = require('winston');

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

// Middleware para verificar el token JWT
const authenticateToken = (req, res, next) => {
  const authHeader = req.headers['authorization'];
  const token = authHeader && authHeader.split(' ')[1];

  if (!token) {
    logger.warn('Acceso denegado: No se proporcionó token');
    return res.status(401).json({ message: 'Acceso denegado: No se proporcionó token' });
  }

  try {
    const decoded = jwt.verify(token, process.env.JWT_SECRET);
    req.user = decoded;
    next();
  } catch (error) {
    logger.error('Token inválido:', error.message);
    return res.status(403).json({ message: 'Sesión expirada o no autorizada. Por favor, inicia sesión nuevamente.' });
  }
};

// Middleware para verificar que el usuario es administrador
const isAdmin = (req, res, next) => {
  if (!req.user || !req.user.rol || req.user.rol.toLowerCase() !== 'admin') {
    logger.warn(`Acceso denegado: El usuario no es administrador (${req.user?.email})`);
    return res.status(403).json({ message: 'Acceso denegado: Se requiere rol de administrador' });
  }
  next();
};

// Esquema de validación con Joi
const clientSchema = Joi.object({
  nombre: Joi.string().min(3).max(50).required().messages({
    'string.base': 'El nombre debe ser un texto',
    'string.min': 'El nombre debe tener al menos 3 caracteres',
    'string.max': 'El nombre no puede exceder los 50 caracteres',
    'any.required': 'El nombre es obligatorio',
  }),
  email: Joi.string().email().required().messages({
    'string.email': 'Por favor, ingresa un correo electrónico válido',
    'any.required': 'El correo electrónico es obligatorio',
  }),
  numero: Joi.string().pattern(/^\d+$/).min(10).max(15).required().messages({
    'string.pattern.base': 'El número de teléfono debe contener solo dígitos',
    'string.min': 'El número de teléfono debe tener al menos 10 dígitos',
    'string.max': 'El número de teléfono no puede exceder los 15 dígitos',
    'any.required': 'El número de teléfono es obligatorio',
  }),
  genero: Joi.string().valid('Masculino', 'Femenino', 'Otro').required().messages({
    'any.only': 'El género debe ser Masculino, Femenino u Otro',
    'any.required': 'El género es obligatorio',
  }),
});

// Ruta para registrar un cliente (solo administradores)
router.post('/clients', authenticateToken, isAdmin, async (req, res) => {
  const { error: validationError, value } = clientSchema.validate(req.body, { abortEarly: false });
  if (validationError) {
    const errors = validationError.details.map((detail) => detail.message);
    logger.warn('Error de validación en POST /clients:', errors);
    return res.status(400).json({ message: 'Errores de validación', errors });
  }

  const { nombre, email, numero, genero } = value;

  try {
    const db = getDb() || (await connectToDatabase());

    const [existingClient] = await db.execute('SELECT * FROM clientes WHERE email = ?', [email]);
    if (existingClient.length > 0) {
      logger.warn(`Intento de registro con email duplicado: ${email}`);
      return res.status(400).json({ message: 'El correo electrónico ya está registrado' });
    }

    await db.execute(
      'INSERT INTO clientes (nombre, email, numero, genero) VALUES (?, ?, ?, ?)',
      [nombre, email, numero, genero]
    );

    logger.info(`Cliente registrado exitosamente: ${email}`);
    res.status(201).json({ message: 'Cliente registrado exitosamente' });
  } catch (error) {
    logger.error('Error al registrar cliente:', error.message);
    res.status(500).json({ message: 'Error al registrar cliente', error: error.message });
  }
});

// Ruta para obtener la lista de clientes (solo administradores)
router.get('/clients', authenticateToken, isAdmin, async (req, res) => {
  try {
    const db = getDb() || (await connectToDatabase());
    const [rows] = await db.execute('SELECT * FROM clientes');
    logger.info('Lista de clientes obtenida exitosamente');
    res.json(rows);
  } catch (error) {
    logger.error('Error al obtener clientes:', error.message);
    res.status(500).json({ message: 'Error al obtener clientes', error: error.message });
  }
});

module.exports = router;