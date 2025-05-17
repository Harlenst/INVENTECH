const express = require('express');
const router = express.Router();
const Joi = require('joi');
const winston = require('winston');
const { connectToDatabase, getDb } = require('../db');
const { authenticateToken } = require('./auth');
const { Parser } = require('json2csv'); // Para exportar a CSV

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

// Esquema de validación para registrar una compra
const purchaseSchema = Joi.object({
  usuario_id: Joi.number().integer().required().messages({
    'number.base': 'El ID del usuario debe ser un número',
    'any.required': 'El ID del usuario es obligatorio',
  }),
  nombre_empleado: Joi.string().min(3).max(50).required().messages({
    'string.min': 'El nombre del empleado debe tener al menos 3 caracteres',
    'string.max': 'El nombre del empleado no puede exceder los 50 caracteres',
    'any.required': 'El nombre del empleado es obligatorio',
  }),
  cliente_id: Joi.number().integer().required().messages({
    'number.base': 'El ID del cliente debe ser un número',
    'any.required': 'El ID del cliente es obligatorio',
  }),
  nombre_cliente: Joi.string().min(3).max(50).required().messages({
    'string.min': 'El nombre del cliente debe tener al menos 3 caracteres',
    'string.max': 'El nombre del cliente no puede exceder los 50 caracteres',
    'any.required': 'El nombre del cliente es obligatorio',
  }),
  productos: Joi.array().items(
    Joi.object({
      id: Joi.number().integer().required(),
      nombre: Joi.string().required(),
      cantidad: Joi.number().integer().min(1).required(),
      precio: Joi.number().min(0).required(),
    })
  ).min(1).required().messages({
    'array.min': 'Debe incluir al menos un producto',
    'any.required': 'Los productos son obligatorios',
  }),
  total: Joi.number().min(0).required().messages({
    'number.min': 'El total debe ser mayor o igual a 0',
    'any.required': 'El total es obligatorio',
  }),
});

// Esquema de validación para registrar una devolución
const returnSchema = Joi.object({
  compra_id: Joi.number().integer().required().messages({
    'number.base': 'El ID de la compra debe ser un número',
    'any.required': 'El ID de la compra es obligatorio',
  }),
  producto_id: Joi.number().integer().required().messages({
    'number.base': 'El ID del producto debe ser un número',
    'any.required': 'El ID del producto es obligatorio',
  }),
  cantidad: Joi.number().integer().min(1).required().messages({
    'number.min': 'La cantidad debe ser mayor o igual a 1',
    'any.required': 'La cantidad es obligatoria',
  }),
  motivo: Joi.string().min(5).max(255).required().messages({
    'string.min': 'El motivo debe tener al menos 5 caracteres',
    'string.max': 'El motivo no puede exceder los 255 caracteres',
    'any.required': 'El motivo es obligatorio',
  }),
});

// Ruta para buscar producto por código de barras
router.get('/products/barcode/:barcode', authenticateToken, async (req, res) => {
  try {
    const db = getDb() || (await connectToDatabase());
    const [rows] = await db.execute('SELECT * FROM productos WHERE codigo_barras = ?', [req.params.barcode]);
    if (rows.length === 0) {
      logger.warn(`Producto no encontrado para código de barras: ${req.params.barcode}`);
      return res.status(404).json({ message: 'Producto no encontrado' });
    }
    logger.info(`Producto encontrado para código de barras: ${req.params.barcode}`);
    res.json(rows[0]);
  } catch (error) {
    logger.error('Error al buscar producto:', error.message);
    res.status(500).json({ message: 'Error al buscar producto', error: error.message });
  }
});

// Ruta para registrar una compra
router.post('/purchases', authenticateToken, async (req, res) => {
  const { error: validationError, value } = purchaseSchema.validate(req.body, { abortEarly: false });
  if (validationError) {
    const errors = validationError.details.map((detail) => detail.message);
    logger.warn('Error de validación en POST /purchases:', errors);
    return res.status(400).json({ message: 'Errores de validación', errors });
  }

  const { usuario_id, nombre_empleado, cliente_id, nombre_cliente, productos, total } = value;

  let db;
  try {
    db = getDb() || (await connectToDatabase());
    await db.beginTransaction();

    for (const producto of productos) {
      const [productRows] = await db.execute('SELECT stock FROM productos WHERE id = ?', [producto.id]);
      if (productRows.length === 0) {
        throw new Error(`Producto con ID ${producto.id} no encontrado`);
      }
      if (productRows[0].stock < producto.cantidad) {
        throw new Error(`Stock insuficiente para el producto ${producto.nombre}`);
      }
    }

    const [result] = await db.execute(
      'INSERT INTO compras (usuario_id, nombre_empleado, cliente_id, nombre_cliente, total, estado) VALUES (?, ?, ?, ?, ?, ?)',
      [usuario_id, nombre_empleado, cliente_id, nombre_cliente, total, 'pendiente']
    );

    const compra_id = result.insertId;

    for (const producto of productos) {
      await db.execute(
        'INSERT INTO compra_detalles (compra_id, producto_id, nombre_producto, cantidad, precio_unitario) VALUES (?, ?, ?, ?, ?)',
        [compra_id, producto.id, producto.nombre, producto.cantidad, producto.precio]
      );
      await db.execute('UPDATE productos SET stock = stock - ? WHERE id = ?', [producto.cantidad, producto.id]);
    }

    await db.commit();

    logger.info(`Compra registrada exitosamente: ${compra_id}`);
    res.json({ message: 'Compra registrada exitosamente', compra_id });
  } catch (error) {
    if (db) await db.rollback();
    logger.error('Error al registrar compra:', error.message);
    res.status(500).json({ message: 'Error al registrar compra', error: error.message });
  }
});

// Ruta para obtener todas las compras
router.get('/purchases', authenticateToken, async (req, res) => {
  try {
    const db = getDb() || (await connectToDatabase());
    const usuario_id = req.query.usuario_id;
    let query = `
      SELECT 
        c.id, 
        c.cliente_id, 
        cl.nombre AS nombre_cliente, 
        c.nombre_empleado, 
        c.fecha, 
        c.estado,
        c.aprobado_por,
        JSON_ARRAYAGG(
          JSON_OBJECT(
            'id', cd.producto_id,
            'nombre', cd.nombre_producto,
            'cantidad', cd.cantidad,
            'precio', cd.precio_unitario
          )
        ) AS productos,
        c.total
      FROM compras c
      JOIN clientes cl ON c.cliente_id = cl.id
      JOIN compra_detalles cd ON c.id = cd.compra_id
      GROUP BY c.id
    `;
    let params = [];
    if (usuario_id) {
      query = `
        SELECT 
          c.id, 
          c.cliente_id, 
          cl.nombre AS nombre_cliente, 
          c.nombre_empleado, 
          c.fecha, 
          c.estado,
          c.aprobado_por,
          JSON_ARRAYAGG(
            JSON_OBJECT(
              'id', cd.producto_id,
              'nombre', cd.nombre_producto,
              'cantidad', cd.cantidad,
              'precio', cd.precio_unitario
            )
          ) AS productos,
          c.total
        FROM compras c
        JOIN clientes cl ON c.cliente_id = cl.id
        JOIN compra_detalles cd ON c.id = cd.compra_id
        WHERE c.usuario_id = ?
        GROUP BY c.id
      `;
      params = [usuario_id];
    }
    const [rows] = await db.execute(query, params);
    const sanitizedRows = rows.map(row => ({
      ...row,
      productos: Array.isArray(row.productos) ? row.productos : JSON.parse(row.productos || '[]'),
    }));
    logger.info(`Compras obtenidas exitosamente para usuario ${usuario_id || 'todos'}`);
    res.json(sanitizedRows);
  } catch (error) {
    logger.error('Error al obtener compras:', error.message);
    res.status(500).json({ message: 'Error al obtener compras', error: error.message });
  }
});

// Ruta para obtener estadísticas de compras (solo admins)
router.get('/purchases/stats', authenticateToken, isAdmin, async (req, res) => {
  try {
    const db = getDb() || (await connectToDatabase());
    const [stats] = await db.execute(`
      SELECT 
        u.id AS usuario_id,
        u.nombre AS nombre_empleado,
        COUNT(c.id) AS total_compras,
        SUM(c.total) AS total_ventas,
        JSON_ARRAYAGG(
          JSON_OBJECT(
            'producto_id', cd.producto_id,
            'nombre_producto', cd.nombre_producto,
            'cantidad', cd.cantidad,
            'precio_unitario', cd.precio_unitario
          )
        ) AS productos_vendidos
      FROM usuarios u
      LEFT JOIN compras c ON u.id = c.usuario_id
      LEFT JOIN compra_detalles cd ON c.id = cd.compra_id
      WHERE u.rol = 'employee'
      GROUP BY u.id, u.nombre
    `);
    const sanitizedStats = stats.map(stat => ({
      ...stat,
      productos_vendidos: Array.isArray(stat.productos_vendidos) ? stat.productos_vendidos : JSON.parse(stat.productos_vendidos || '[]'),
    }));
    logger.info('Estadísticas de compras obtenidas por admin');
    res.json(sanitizedStats);
  } catch (error) {
    logger.error('Error al obtener estadísticas de compras:', error.message);
    res.status(500).json({ message: 'Error al obtener estadísticas', error: error.message });
  }
});

// Ruta para obtener compras pendientes (solo para Admins) - PendingPurchases
router.get('/purchases/pending', authenticateToken, isAdmin, async (req, res) => {
  try {
    const db = getDb() || (await connectToDatabase());
    const [rows] = await db.execute(
      'SELECT * FROM compras WHERE estado = ?',
      ['pendiente']
    );
    logger.info(`Compras pendientes obtenidas por admin ${req.user.id}`);
    res.json(rows);
  } catch (error) {
    logger.error('Error al obtener compras pendientes:', error.message);
    res.status(500).json({ message: 'Error al obtener compras pendientes', error: error.message });
  }
});

// Ruta para aprobar o rechazar una compra pendiente (solo para Admins)
router.put('/purchases/:id/approve', authenticateToken, isAdmin, async (req, res) => {
  const compraId = req.params.id;
  const { aprobado } = req.body;

  try {
    const db = getDb() || (await connectToDatabase());
    const [rows] = await db.execute('SELECT * FROM compras WHERE id = ?', [compraId]);
    if (rows.length === 0) {
      return res.status(404).json({ message: 'Compra no encontrada' });
    }

    if (rows[0].estado !== 'pendiente') {
      return res.status(400).json({ message: 'La compra no está pendiente' });
    }

    const newEstado = aprobado ? 'aprobada' : 'rechazada';
    await db.execute(
      'UPDATE compras SET estado = ?, aprobado_por = ? WHERE id = ?',
      [newEstado, req.user.id, compraId]
    );

    logger.info(`Compra ${compraId} ${aprobado ? 'aprobada' : 'rechazada'} por admin ${req.user.id}`);
    res.json({ message: `Compra ${aprobado ? 'aprobada' : 'rechazada'} correctamente` });
  } catch (error) {
    logger.error('Error al aprobar/rechazar compra:', error.message);
    res.status(500).json({ message: 'Error al aprobar/rechazar compra', error: error.message });
  }
});

// Ruta para registrar una devolución (solo para Admins)
router.post('/returns', authenticateToken, isAdmin, async (req, res) => {
  const { error: validationError, value } = returnSchema.validate(req.body, { abortEarly: false });
  if (validationError) {
    const errors = validationError.details.map((detail) => detail.message);
    logger.warn('Error de validación en POST /returns:', errors);
    return res.status(400).json({ message: 'Errores de validación', errors });
  }

  const { compra_id, producto_id, cantidad, motivo } = value;

  let db;
  try {
    db = getDb() || (await connectToDatabase());
    await db.beginTransaction();

    // Verificar si la compra existe y contiene el producto
    const [compraRows] = await db.execute('SELECT * FROM compras WHERE id = ?', [compra_id]);
    if (compraRows.length === 0) {
      throw new Error('Compra no encontrada');
    }

    const [detalleRows] = await db.execute(
      'SELECT * FROM compra_detalles WHERE compra_id = ? AND producto_id = ?',
      [compra_id, producto_id]
    );
    if (detalleRows.length === 0) {
      throw new Error('Producto no encontrado en la compra');
    }
    if (detalleRows[0].cantidad < cantidad) {
      throw new Error('Cantidad a devolver excede la cantidad comprada');
    }

    // Registrar la devolución
    const [result] = await db.execute(
      'INSERT INTO devoluciones (compra_id, producto_id, cantidad, motivo) VALUES (?, ?, ?, ?)',
      [compra_id, producto_id, cantidad, motivo]
    );

    // Actualizar el stock del producto
    await db.execute('UPDATE productos SET stock = stock + ? WHERE id = ?', [cantidad, producto_id]);

    await db.commit();

    logger.info(`Devolución registrada exitosamente: ${result.insertId}`);
    res.json({ message: 'Devolución registrada exitosamente', devolucion_id: result.insertId });
  } catch (error) {
    if (db) await db.rollback();
    logger.error('Error al registrar devolución:', error.message);
    res.status(500).json({ message: 'Error al registrar devolución', error: error.message });
  }
});

// Ruta para obtener historial de devoluciones (solo para Admins) - ReturnsHistory
router.get('/returns', authenticateToken, isAdmin, async (req, res) => {
  try {
    const db = getDb() || (await connectToDatabase());
    const [rows] = await db.execute(
      'SELECT d.*, c.nombre_cliente, p.nombre AS nombre_producto ' +
      'FROM devoluciones d ' +
      'JOIN compras c ON d.compra_id = c.id ' +
      'JOIN productos p ON d.producto_id = p.id'
    );
    logger.info(`Historial de devoluciones obtenido por admin ${req.user.id}`);
    res.json(rows);
  } catch (error) {
    logger.error('Error al obtener historial de devoluciones:', error.message);
    res.status(500).json({ message: 'Error al obtener historial de devoluciones', error: error.message });
  }
});

// Ruta para obtener reportes financieros (solo para Admins) - FinancialReports
router.get('/financial-reports', authenticateToken, isAdmin, async (req, res) => {
  try {
    const db = getDb() || (await connectToDatabase());
    const [rows] = await db.execute(
      'SELECT rf.id, rf.fecha, rf.ingresos, rf.gastos, rf.utilidad, rf.descripcion, rf.creado_at, u.nombre AS creado_por ' +
      'FROM reportes_financieros rf ' +
      'JOIN usuarios u ON rf.creado_por = u.id'
    );
    logger.info(`Reportes financieros obtenidos por admin ${req.user.id}`);
    res.json(rows);
  } catch (error) {
    logger.error('Error al obtener reportes financieros:', error.message);
    res.status(500).json({ message: 'Error al obtener reportes financieros', error: error.message });
  }
});

// Ruta para exportar reportes financieros a CSV (solo para Admins) - ExportReports
router.get('/export-reports', authenticateToken, isAdmin, async (req, res) => {
  try {
    const db = getDb() || (await connectToDatabase());
    const [rows] = await db.execute(
      'SELECT rf.id, rf.fecha, rf.ingresos, rf.gastos, rf.utilidad, rf.descripcion, rf.creado_at, u.nombre AS creado_por ' +
      'FROM reportes_financieros rf ' +
      'JOIN usuarios u ON rf.creado_por = u.id'
    );

    const fields = ['id', 'fecha', 'ingresos', 'gastos', 'utilidad', 'descripcion', 'creado_at', 'creado_por'];
    const json2csvParser = new Parser({ fields });
    const csv = json2csvParser.parse(rows);

    res.header('Content-Type', 'text/csv');
    res.attachment('reportes_financieros.csv');
    res.send(csv);

    logger.info(`Reportes financieros exportados a CSV por admin ${req.user.id}`);
  } catch (error) {
    logger.error('Error al exportar reportes financieros:', error.message);
    res.status(500).json({ message: 'Error al exportar reportes financieros', error: error.message });
  }
});

module.exports = router;