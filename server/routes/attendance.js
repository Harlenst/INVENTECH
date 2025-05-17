const express = require('express');
const router = express.Router();
const Joi = require('joi');
const winston = require('winston');
const { connectToDatabase, getDb } = require('../db');
const { authenticateToken } = require('./auth');

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

const isAdmin = async (req, res, next) => {
  if (req.user.rol.toLowerCase() !== 'admin') {
    logger.warn(`Acceso denegado: Se requiere rol de Admin para usuario ${req.user.id}`);
    return res.status(403).json({ message: 'Acceso denegado: Se requiere rol de Admin' });
  }
  next();
};

// Esquema de validación para registrar asistencia
const attendanceSchema = Joi.object({
  usuario_id: Joi.number().integer().required().messages({
    'number.base': 'El ID del usuario debe ser un número',
    'any.required': 'El ID del usuario es obligatorio',
  }),
  nombre_empleado: Joi.string().min(3).max(50).required().messages({
    'string.min': 'El nombre del empleado debe tener al menos 3 caracteres',
    'string.max': 'El nombre del empleado no puede exceder los 50 caracteres',
    'any.required': 'El nombre del empleado es obligatorio',
  }),
  fecha: Joi.date().iso().required().messages({
    'date.base': 'La fecha debe ser una fecha válida en formato ISO',
    'any.required': 'La fecha es obligatoria',
  }),
  estado: Joi.string().valid('presente', 'ausente', 'tarde').required().messages({
    'any.only': 'El estado debe ser presente, ausente o tarde',
    'any.required': 'El estado es obligatorio',
  }),
  hora_entrada: Joi.string().pattern(/^([0-1]?[0-9]|2[0-3]):[0-5][0-9]:[0-5][0-9]$/).optional().messages({
    'string.pattern.base': 'La hora de entrada debe estar en formato HH:MM:SS',
  }),
  hora_salida: Joi.string().pattern(/^([0-1]?[0-9]|2[0-3]):[0-5][0-9]:[0-5][0-9]$/).optional().messages({
    'string.pattern.base': 'La hora de salida debe estar en formato HH:MM:SS',
  }),
});

// Esquema para registrar asistencia del usuario autenticado
const userAttendanceSchema = Joi.object({
  estado: Joi.string().valid('presente', 'ausente', 'tarde').required().messages({
    'any.only': 'El estado debe ser presente, ausente o tarde',
    'any.required': 'El estado es obligatorio',
  }),
  fecha: Joi.date().iso().required().messages({
    'date.base': 'La fecha debe ser una fecha válida en formato ISO',
    'any.required': 'La fecha es obligatoria',
  }),
  hora_entrada: Joi.string().pattern(/^([0-1]?[0-9]|2[0-3]):[0-5][0-9]:[0-5][0-9]$/).optional().messages({
    'string.pattern.base': 'La hora de entrada debe estar en formato HH:MM:SS',
  }),
  hora_salida: Joi.string().pattern(/^([0-1]?[0-9]|2[0-3]):[0-5][0-9]:[0-5][0-9]$/).optional().messages({
    'string.pattern.base': 'La hora de salida debe estar en formato HH:MM:SS',
  }),
});

// Ruta para registrar la entrada automática del usuario autenticado
router.post('/attendance/entry', authenticateToken, async (req, res) => {
  const fecha = new Date().toISOString().split('T')[0]; // Fecha actual (YYYY-MM-DD)
  const hora_entrada = new Date().toTimeString().split(' ')[0]; // Hora actual (HH:MM:SS)

  try {
    const db = getDb() || (await connectToDatabase());
    const [existing] = await db.execute(
      'SELECT * FROM asistencia WHERE usuario_id = ? AND fecha = ?',
      [req.user.id, fecha]
    );

    if (existing.length > 0) {
      logger.warn(`Entrada ya registrada para usuario ${req.user.id} en fecha ${fecha}`);
      return res.status(400).json({ message: 'Entrada ya registrada para hoy' });
    }

    await db.execute(
      'INSERT INTO asistencia (usuario_id, nombre_empleado, fecha, estado, hora_entrada) VALUES (?, ?, ?, ?, ?)',
      [req.user.id, req.user.nombre, fecha, 'presente', hora_entrada]
    );

    logger.info(`Entrada registrada para usuario ${req.user.id} a las ${hora_entrada}`);
    res.json({ message: 'Entrada registrada exitosamente', hora_entrada });
  } catch (error) {
    logger.error('Error al registrar entrada:', error.message);
    res.status(500).json({ message: 'Error al registrar entrada', error: error.message });
  }
});

// Ruta para registrar la salida automática del usuario autenticado
router.post('/attendance/exit', authenticateToken, async (req, res) => {
  const fecha = new Date().toISOString().split('T')[0]; // Fecha actual (YYYY-MM-DD)
  const hora_salida = new Date().toTimeString().split(' ')[0]; // Hora actual (HH:MM:SS)

  try {
    const db = getDb() || (await connectToDatabase());
    const [existing] = await db.execute(
      'SELECT * FROM asistencia WHERE usuario_id = ? AND fecha = ?',
      [req.user.id, fecha]
    );

    if (existing.length === 0) {
      logger.warn(`No se encontró entrada para usuario ${req.user.id} en fecha ${fecha}`);
      return res.status(404).json({ message: 'No se encontró entrada para hoy' });
    }

    if (existing[0].hora_salida) {
      logger.warn(`Salida ya registrada para usuario ${req.user.id} en fecha ${fecha}`);
      return res.status(400).json({ message: 'Salida ya registrada para hoy' });
    }

    await db.execute(
      'UPDATE asistencia SET hora_salida = ? WHERE usuario_id = ? AND fecha = ?',
      [hora_salida, req.user.id, fecha]
    );

    // Calcular horas trabajadas y registrar horas extras si aplica
    const horaEntrada = new Date(`1970-01-01T${existing[0].hora_entrada}Z`);
    const horaSalida = new Date(`1970-01-01T${hora_salida}Z`);
    const horasTrabajadas = (horaSalida - horaEntrada) / (1000 * 60 * 60); // Diferencia en horas

    const jornadaNormal = 8; // Jornada laboral estándar en horas
    if (horasTrabajadas > jornadaNormal) {
      const horasExtras = horasTrabajadas - jornadaNormal;
      await db.execute(
        'INSERT INTO horas_extras (usuario_id, fecha, horas, descripcion) VALUES (?, ?, ?, ?) ON DUPLICATE KEY UPDATE horas = ?, descripcion = ?',
        [req.user.id, fecha, horasExtras, 'Horas extras automáticas', horasExtras, 'Horas extras automáticas']
      );
      logger.info(`Horas extras registradas para usuario ${req.user.id}: ${horasExtras} horas`);
    }

    logger.info(`Salida registrada para usuario ${req.user.id} a las ${hora_salida}`);
    res.json({ message: 'Salida registrada exitosamente', hora_salida, horasTrabajadas });
  } catch (error) {
    logger.error('Error al registrar salida:', error.message);
    res.status(500).json({ message: 'Error al registrar salida', error: error.message });
  }
});

// Ruta para registrar asistencia manual (usuario autenticado)
router.post('/attendance', authenticateToken, async (req, res) => {
  const { error: validationError, value } = userAttendanceSchema.validate(req.body, { abortEarly: false });
  if (validationError) {
    const errors = validationError.details.map((detail) => detail.message);
    logger.warn('Error de validación en POST /attendance:', errors);
    return res.status(400).json({ message: 'Errores de validación', errors });
  }

  const { estado, fecha, hora_entrada, hora_salida } = value;

  try {
    const db = getDb() || (await connectToDatabase());
    const [existing] = await db.execute(
      'SELECT * FROM asistencia WHERE usuario_id = ? AND fecha = ?',
      [req.user.id, fecha]
    );
    if (existing.length > 0) {
      logger.warn(`Intento de registro de asistencia duplicada para usuario ${req.user.id} en fecha ${fecha}`);
      return res.status(400).json({ message: 'Ya se ha registrado una asistencia para esta fecha' });
    }

    await db.execute(
      'INSERT INTO asistencia (usuario_id, estado, fecha, hora_entrada, hora_salida) VALUES (?, ?, ?, ?, ?)',
      [req.user.id, estado, fecha, hora_entrada || null, hora_salida || null]
    );

    logger.info(`Asistencia registrada exitosamente para usuario ${req.user.id}`);
    res.json({ message: 'Asistencia registrada exitosamente' });
  } catch (error) {
    logger.error('Error al registrar asistencia:', error.message);
    res.status(500).json({ message: 'Error al registrar asistencia', error: error.message });
  }
});

// Ruta para registrar asistencia por admin
router.post('/admin/attendance', authenticateToken, isAdmin, async (req, res) => {
  const { error: validationError, value } = attendanceSchema.validate(req.body, { abortEarly: false });
  if (validationError) {
    const errors = validationError.details.map((detail) => detail.message);
    logger.warn('Error de validación en POST /admin/attendance:', errors);
    return res.status(400).json({ message: 'Errores de validación', errors });
  }

  const { usuario_id, nombre_empleado, fecha, estado, hora_entrada, hora_salida } = value;

  try {
    const db = getDb() || (await connectToDatabase());
    const [existing] = await db.execute(
      'SELECT * FROM asistencia WHERE usuario_id = ? AND fecha = ?',
      [usuario_id, fecha]
    );
    if (existing.length > 0) {
      logger.warn(`Intento de registro de asistencia duplicada para usuario ${usuario_id} en fecha ${fecha}`);
      return res.status(400).json({ message: 'Ya se ha registrado una asistencia para este empleado en esta fecha' });
    }

    await db.execute(
      'INSERT INTO asistencia (usuario_id, nombre_empleado, fecha, estado, hora_entrada, hora_salida) VALUES (?, ?, ?, ?, ?, ?)',
      [usuario_id, nombre_empleado, fecha, estado, hora_entrada || null, hora_salida || null]
    );

    // Calcular horas extras si se proporcionan hora_entrada y hora_salida
    if (hora_entrada && hora_salida) {
      const horaEntrada = new Date(`1970-01-01T${hora_entrada}Z`);
      const horaSalida = new Date(`1970-01-01T${hora_salida}Z`);
      const horasTrabajadas = (horaSalida - horaEntrada) / (1000 * 60 * 60);

      const jornadaNormal = 8;
      if (horasTrabajadas > jornadaNormal) {
        const horasExtras = horasTrabajadas - jornadaNormal;
        await db.execute(
          'INSERT INTO horas_extras (usuario_id, fecha, horas, descripcion) VALUES (?, ?, ?, ?) ON DUPLICATE KEY UPDATE horas = ?, descripcion = ?',
          [usuario_id, fecha, horasExtras, 'Horas extras manuales por admin', horasExtras, 'Horas extras manuales por admin']
        );
        logger.info(`Horas extras registradas para usuario ${usuario_id}: ${horasExtras} horas`);
      }
    }

    logger.info(`Asistencia registrada por admin para usuario ${usuario_id}`);
    res.json({ message: 'Asistencia registrada exitosamente', estado });
  } catch (error) {
    logger.error('Error al registrar asistencia por admin:', error.message);
    res.status(500).json({ message: 'Error al registrar asistencia', error: error.message });
  }
});

// Ruta para obtener el historial de asistencia del usuario
router.get('/attendance', authenticateToken, async (req, res) => {
  try {
    const usuario_id = req.user.id;
    const db = getDb() || (await connectToDatabase());
    const [rows] = await db.execute(
      'SELECT a.*, u.nombre FROM asistencia a JOIN usuarios u ON a.usuario_id = u.id WHERE a.usuario_id = ?',
      [usuario_id]
    );
    logger.info(`Historial de asistencia obtenido para usuario ${usuario_id}`);
    res.json(rows);
  } catch (error) {
    logger.error('Error al obtener historial de asistencia:', error.message);
    res.status(500).json({ message: 'Error al obtener historial de asistencia', error: error.message });
  }
});

// Ruta para que los administradores vean todas las asistencias
router.get('/admin/attendance', authenticateToken, isAdmin, async (req, res) => {
  try {
    const db = getDb() || (await connectToDatabase());
    const [rows] = await db.execute(
      'SELECT a.*, u.nombre FROM asistencia a JOIN usuarios u ON a.usuario_id = u.id'
    );
    logger.info('Lista de asistencias obtenida por admin');
    res.json(rows);
  } catch (error) {
    logger.error('Error al obtener historial de asistencia para admin:', error.message);
    res.status(500).json({ message: 'Error al obtener historial de asistencia', error: error.message });
  }
});

// Ruta para obtener las horas extras del usuario
router.get('/attendance/extra-hours', authenticateToken, async (req, res) => {
  try {
    const usuario_id = req.user.id;
    const db = getDb() || (await connectToDatabase());
    const [rows] = await db.execute(
      'SELECT * FROM horas_extras WHERE usuario_id = ?',
      [usuario_id]
    );
    logger.info(`Horas extras obtenidas para usuario ${usuario_id}`);
    res.json(rows);
  } catch (error) {
    logger.error('Error al obtener horas extras:', error.message);
    res.status(500).json({ message: 'Error al obtener horas extras', error: error.message });
  }
});

// Ruta para que los administradores vean todas las horas extras
router.get('/admin/attendance/extra-hours', authenticateToken, isAdmin, async (req, res) => {
  try {
    const db = getDb() || (await connectToDatabase());
    const [rows] = await db.execute(
      'SELECT he.*, u.nombre FROM horas_extras he JOIN usuarios u ON he.usuario_id = u.id'
    );
    logger.info('Lista de horas extras obtenida por admin');
    res.json(rows);
  } catch (error) {
    logger.error('Error al obtener horas extras para admin:', error.message);
    res.status(500).json({ message: 'Error al obtener horas extras', error: error.message });
  }
});

// Ruta para confirmar/rechazar asistencia (admin)
router.put('/attendance/:id/confirm', authenticateToken, isAdmin, async (req, res) => {
  const attendanceId = req.params.id;
  const { confirmado } = req.body;

  const confirmSchema = Joi.object({
    confirmado: Joi.boolean().required().messages({
      'boolean.base': 'Confirmado debe ser un valor booleano',
      'any.required': 'Confirmado es obligatorio',
    }),
  });

  const { error: validationError } = confirmSchema.validate({ confirmado });
  if (validationError) {
    const errors = validationError.details.map((detail) => detail.message);
    logger.warn('Error de validación en PUT /attendance/:id/confirm:', errors);
    return res.status(400).json({ message: 'Errores de validación', errors });
  }

  try {
    const db = getDb() || (await connectToDatabase());
    const [rows] = await db.execute('SELECT * FROM asistencia WHERE id = ?', [attendanceId]);
    if (rows.length === 0) {
      logger.warn(`Asistencia no encontrada: ${attendanceId}`);
      return res.status(404).json({ message: 'Asistencia no encontrada' });
    }

    await db.execute(
      'UPDATE asistencia SET confirmado = ?, confirmed_by = ? WHERE id = ?',
      [confirmado, req.user.id, attendanceId]
    );

    logger.info(`Asistencia ${attendanceId} ${confirmado ? 'confirmada' : 'rechazada'} por admin ${req.user.id}`);
    res.json({ message: confirmado ? 'Asistencia confirmada' : 'Asistencia rechazada' });
  } catch (error) {
    logger.error('Error al confirmar/rechazar asistencia:', error.message);
    res.status(500).json({ message: 'Error al confirmar/rechazar asistencia', error: error.message });
  }
});

module.exports = router;