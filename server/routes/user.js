const express = require('express');
const multer = require('multer');
const router = express.Router();
const { connectToDatabase, getDb } = require('../db');
const path = require('path');
const winston = require('winston');
const { authenticateToken } = require('./auth');

// Configuración de multer para manejar la subida de imágenes
const storage = multer.diskStorage({
  destination: (req, file, cb) => {
    cb(null, path.join(__dirname, '..', '..', 'uploads'));
  },
  filename: (req, file, cb) => {
    cb(null, Date.now() + '-' + file.originalname);
  }
});
const upload = multer({ storage });

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

// Middleware para verificar si el usuario es Admin
const isAdmin = async (req, res, next) => {
  try {
    const db = getDb() || (await connectToDatabase());
    const [rows] = await db.execute(
      'SELECT rol FROM usuarios WHERE id = ?',
      [req.user.id]
    );
    console.log('Verificando rol de Admin para usuario:', req.user.id, 'Rol:', rows[0]?.rol);
    if (rows.length === 0 || rows[0].rol.toLowerCase() !== 'admin') {
      logger.warn(`Acceso denegado: El usuario no es administrador (ID: ${req.user.id})`);
      return res.status(403).json({ message: 'Acceso denegado: Se requiere rol de Admin' });
    }
    next();
  } catch (error) {
    logger.error('Error al verificar rol de Admin:', error.message);
    res.status(500).json({ message: 'Error en el servidor', error: error.message });
  }
};

// Ruta para registrar un horario
router.post('/schedules', authenticateToken, async (req, res) => {
  const { fecha, turno, usuario_id, nombre_empleado } = req.body;
  try {
    if (!fecha || !turno || !usuario_id || !nombre_empleado) {
      return res.status(400).json({ message: 'Faltan datos requeridos', received: { fecha, turno, usuario_id, nombre_empleado } });
    }

    const db = getDb() || (await connectToDatabase());
    const [existing] = await db.execute(
      'SELECT * FROM horarios WHERE usuario_id = ? AND fecha = ?',
      [usuario_id, fecha]
    );
    if (existing.length > 0) {
      return res.status(400).json({ message: 'Ya has seleccionado un horario para este día' });
    }

    await db.execute(
      'INSERT INTO horarios (usuario_id, nombre_empleado, fecha, turno) VALUES (?, ?, ?, ?)',
      [usuario_id, nombre_empleado, fecha, turno]
    );
    logger.info(`Horario registrado exitosamente para usuario ${usuario_id} en fecha ${fecha}`);
    res.json({ message: 'Horario registrado exitosamente' });
  } catch (error) {
    logger.error('Error al registrar horario:', error.message);
    res.status(500).json({ message: 'Error al registrar horario', error: error.message });
  }
});

// Ruta para obtener los horarios
router.get('/schedules', authenticateToken, async (req, res) => {
  try {
    const usuario_id = req.query.usuario_id || req.user.id;
    const db = getDb() || (await connectToDatabase());
    let query = 'SELECT * FROM horarios';
    let params = [];

    if (usuario_id) {
      query += ' WHERE usuario_id = ?';
      params.push(usuario_id);
    }

    const [rows] = await db.execute(query, params);
    logger.info(`Horarios obtenidos para usuario ${usuario_id}`);
    res.json(rows);
  } catch (error) {
    logger.error('Error al obtener horarios:', error.message);
    res.status(500).json({ message: 'Error al obtener horarios', error: error.message });
  }
});

// Ruta para registrar una asistencia (solo para Admins)
router.post('/attendance', authenticateToken, isAdmin, async (req, res) => {
  const { usuario_id, nombre_empleado, fecha, estado } = req.body;
  try {
    if (!usuario_id || !nombre_empleado || !fecha || !estado) {
      return res.status(400).json({ message: 'Faltan datos requeridos', received: { usuario_id, nombre_empleado, fecha, estado } });
    }

    const validStates = ['presente', 'ausente', 'tarde'];
    if (!validStates.includes(estado)) {
      return res.status(400).json({ message: 'Estado inválido. Los estados válidos son: presente, ausente, tarde' });
    }

    const db = getDb() || (await connectToDatabase());
    const [existing] = await db.execute(
      'SELECT * FROM attendances WHERE usuario_id = ? AND fecha = ?',
      [usuario_id, fecha]
    );
    if (existing.length > 0) {
      return res.status(400).json({ message: 'Ya se ha registrado una asistencia para este empleado en esta fecha' });
    }

    await db.execute(
      'INSERT INTO attendances (usuario_id, nombre_empleado, fecha, estado) VALUES (?, ?, ?, ?)',
      [usuario_id, nombre_empleado, fecha, estado]
    );

    logger.info(`Asistencia registrada para usuario ${usuario_id} en fecha ${fecha}: ${estado}`);
    res.json({ message: 'Asistencia registrada exitosamente', estado });
  } catch (error) {
    logger.error('Error al registrar asistencia:', error.message);
    res.status(500).json({ message: 'Error al registrar asistencia', error: error.message });
  }
});

// Ruta para obtener las asistencias (para el calendario y el historial)
router.get('/attendances', authenticateToken, async (req, res) => {
  try {
    const usuario_id = req.query.usuario_id || req.user.id;
    const db = getDb() || (await connectToDatabase());
    let query = 'SELECT * FROM attendances';
    let params = [];

    if (usuario_id) {
      query += ' WHERE usuario_id = ?';
      params.push(usuario_id);
    }

    const [rows] = await db.execute(query, params);
    logger.info(`Asistencias obtenidas para usuario ${usuario_id}`);
    res.json(rows);
  } catch (error) {
    logger.error('Error al obtener asistencias:', error.message);
    res.status(500).json({ message: 'Error al obtener asistencias', error: error.message });
  }
});

// Ruta para que el administrador confirme/rechace una asistencia
router.put('/attendance/:id/confirm', authenticateToken, isAdmin, async (req, res) => {
  const attendanceId = req.params.id;
  const { confirmado } = req.body;

  try {
    const db = getDb() || (await connectToDatabase());
    const [rows] = await db.execute(
      'SELECT * FROM attendances WHERE id = ?',
      [attendanceId]
    );
    if (rows.length === 0) {
      return res.status(404).json({ message: 'Asistencia no encontrada' });
    }

    await db.execute(
      'UPDATE attendances SET confirmado = ?, confirmed_by = ? WHERE id = ?',
      [confirmado, req.user.id, attendanceId]
    );

    logger.info(`Asistencia ${attendanceId} ${confirmado ? 'confirmada' : 'rechazada'} por administrador ${req.user.id}`);
    res.json({ message: confirmado ? 'Asistencia confirmada' : 'Asistencia rechazada' });
  } catch (error) {
    logger.error('Error al confirmar/rechazar asistencia:', error.message);
    res.status(500).json({ message: 'Error al confirmar/rechazar asistencia', error: error.message });
  }
});

// Ruta para obtener los datos del usuario autenticado
router.get('/user', authenticateToken, async (req, res) => {
  try {
    const db = getDb() || (await connectToDatabase());
    const [rows] = await db.execute(
      'SELECT id, nombre, apellido, telefono, email, usuario, rol, imagen FROM usuarios WHERE id = ?',
      [req.user.id]
    );
    console.log('Datos devueltos por /api/user para usuario:', req.user.id, 'Datos:', rows[0]);
    if (rows.length === 0) {
      logger.warn(`Usuario no encontrado: ID ${req.user.id}`);
      return res.status(404).json({ message: 'Usuario no encontrado' });
    }
    res.json(rows[0]);
  } catch (error) {
    logger.error('Error al obtener datos del usuario:', error.message);
    res.status(500).json({ message: 'Error en el servidor', error: error.message });
  }
});

// Ruta para actualizar los datos del usuario
router.put('/user/update', authenticateToken, upload.single('imagen'), async (req, res) => {
  try {
    const { nombre, apellido, telefono, email } = req.body;
    const imagen = req.file ? `/uploads/${req.file.filename}` : null;

    const db = getDb() || (await connectToDatabase());
    const [rows] = await db.execute('SELECT * FROM usuarios WHERE id = ?', [req.user.id]);
    if (rows.length === 0) return res.status(404).json({ message: 'Usuario no encontrado' });

    const user = rows[0];
    const updateData = {
      nombre: nombre || user.nombre,
      apellido: apellido || user.apellido,
      telefono: telefono || user.telefono,
      email: email || user.email,
      imagen: imagen || user.imagen
    };

    await db.execute(
      'UPDATE usuarios SET nombre = ?, apellido = ?, telefono = ?, email = ?, imagen = ? WHERE id = ?',
      [updateData.nombre, updateData.apellido, updateData.telefono, updateData.email, updateData.imagen, req.user.id]
    );

    logger.info(`Datos actualizados para usuario ${req.user.id}`);
    res.json({ message: 'Datos actualizados correctamente', imagen: updateData.imagen });
  } catch (error) {
    logger.error('Error al actualizar los datos del usuario:', error.message);
    res.status(500).json({ message: 'Error al actualizar los datos del usuario', error: error.message });
  }
});

// Ruta para obtener la lista de usuarios (solo para Admins)
router.get('/users', authenticateToken, isAdmin, async (req, res) => {
  try {
    const db = getDb() || (await connectToDatabase());
    const [rows] = await db.execute(
      'SELECT id, nombre, apellido, email, usuario, rol FROM usuarios'
    );
    logger.info('Lista de usuarios obtenida exitosamente');
    res.json(rows);
  } catch (error) {
    logger.error('Error al obtener la lista de usuarios:', error.message);
    res.status(500).json({ message: 'Error al obtener la lista de usuarios', error: error.message });
  }
});

// Ruta para asignar un rol a un usuario (solo para Admins)
router.put('/user/role/:id', authenticateToken, isAdmin, async (req, res) => {
  const userId = req.params.id;
  const { rol } = req.body;

  const validRoles = ['admin', 'employee'];
  if (!validRoles.includes(rol.toLowerCase())) {
    return res.status(400).json({ message: 'Rol inválido. Los roles válidos son: Admin, Employee' });
  }

  try {
    const db = getDb() || (await connectToDatabase());
    const [rows] = await db.execute('SELECT * FROM usuarios WHERE id = ?', [userId]);
    if (rows.length === 0) {
      return res.status(404).json({ message: 'Usuario no encontrado' });
    }

    const formattedRole = rol.charAt(0).toUpperCase() + rol.slice(1).toLowerCase();
    await db.execute(
      'UPDATE usuarios SET rol = ? WHERE id = ?',
      [formattedRole, userId]
    );

    logger.info(`Rol asignado a usuario ${userId}: ${formattedRole}`);
    res.json({ message: 'Rol asignado correctamente' });
  } catch (error) {
    logger.error('Error al asignar rol:', error.message);
    res.status(500).json({ message: 'Error al asignar rol', error: error.message });
  }
});

// Ruta para obtener el historial de compras
router.get('/purchases', authenticateToken, async (req, res) => {
  try {
    const usuario_id = req.query.usuario_id || req.user.id;
    const isAdmin = req.user.rol.toLowerCase() === 'admin';
    const db = getDb() || (await connectToDatabase());
    let query = `
      SELECT c.id AS compra_id, c.usuario_id, c.cliente_id, c.nombre_cliente, c.nombre_empleado, c.fecha, c.total,
             cd.id AS detalle_id, cd.producto_id, cd.nombre_producto, cd.cantidad, cd.precio_unitario
      FROM compras c
      LEFT JOIN compra_detalles cd ON c.id = cd.compra_id
    `;
    let params = [];

    if (!isAdmin) {
      query += ' WHERE c.usuario_id = ?';
      params.push(usuario_id);
    }

    const [rows] = await db.execute(query, params);

    // Agrupar los detalles por compra
    const purchasesMap = new Map();
    rows.forEach(row => {
      if (!purchasesMap.has(row.compra_id)) {
        purchasesMap.set(row.compra_id, {
          id: row.compra_id,
          usuario_id: row.usuario_id,
          cliente_id: row.cliente_id,
          nombre_cliente: row.nombre_cliente,
          nombre_empleado: row.nombre_empleado,
          fecha: row.fecha,
          total: row.total,
          detalles: []
        });
      }
      if (row.detalle_id) {
        purchasesMap.get(row.compra_id).detalles.push({
          id: row.detalle_id,
          producto_id: row.producto_id,
          nombre: row.nombre_producto,
          cantidad: row.cantidad,
          precio: row.precio_unitario
        });
      }
    });

    const purchases = Array.from(purchasesMap.values());
    logger.info(`Historial de compras obtenido para usuario ${usuario_id}`);
    res.json(purchases);
  } catch (error) {
    logger.error('Error al obtener historial de compras:', error.message);
    res.status(500).json({ message: 'Error al obtener historial de compras', error: error.message });
  }
});

// Ruta para obtener la lista de clientes
router.get('/clients', authenticateToken, async (req, res) => {
  try {
    const usuario_id = req.user.id;
    const isAdmin = req.user.rol.toLowerCase() === 'admin';
    const db = getDb() || (await connectToDatabase());

    if (isAdmin) {
      // Admins ven todos los clientes
      const [rows] = await db.execute('SELECT * FROM clientes');
      logger.info('Lista de clientes obtenida exitosamente para admin');
      res.json(rows);
    } else {
      // Employees ven solo los clientes asociados a sus compras
      const [rows] = await db.execute(
        `
        SELECT DISTINCT c.*
        FROM clientes c
        JOIN compras cmp ON c.id = cmp.cliente_id
        WHERE cmp.usuario_id = ?
        `,
        [usuario_id]
      );
      logger.info(`Lista de clientes obtenido para empleado ${usuario_id}`);
      res.json(rows);
    }
  } catch (error) {
    logger.error('Error al obtener la lista de clientes:', error.message);
    res.status(500).json({ message: 'Error al obtener la lista de clientes', error: error.message });
  }
});

// Ruta para obtener datos de un usuario específico (solo para Admins) - UserEdit
router.get('/user/:id', authenticateToken, isAdmin, async (req, res) => {
  const userId = req.params.id;
  try {
    const db = getDb() || (await connectToDatabase());
    const [rows] = await db.execute('SELECT * FROM usuarios WHERE id = ?', [userId]);
    console.log(`Solicitud a /api/user/${userId} - Resultado de la consulta:`, rows); // Log para depuración
    if (rows.length === 0) {
      logger.warn(`Usuario no encontrado: ID ${userId}`);
      return res.status(404).json({ message: 'Usuario no encontrado' });
    }
    res.json(rows[0]);
  } catch (error) {
    logger.error('Error al obtener datos del usuario:', error.message);
    res.status(500).json({ message: 'Error en el servidor', error: error.message });
  }
});

// Ruta para editar datos de un usuario específico (solo para Admins) - UserEdit
router.put('/user/:id', authenticateToken, isAdmin, async (req, res) => {
  const userId = req.params.id;
  const { nombre, apellido, telefono, email } = req.body;

  try {
    const db = getDb() || (await connectToDatabase());
    const [rows] = await db.execute('SELECT * FROM usuarios WHERE id = ?', [userId]);
    if (rows.length === 0) {
      return res.status(404).json({ message: 'Usuario no encontrado' });
    }

    const user = rows[0];
    const updateData = {
      nombre: nombre || user.nombre,
      apellido: apellido || user.apellido,
      telefono: telefono || user.telefono,
      email: email || user.email,
    };

    await db.execute(
      'UPDATE usuarios SET nombre = ?, apellido = ?, telefono = ?, email = ? WHERE id = ?',
      [updateData.nombre, updateData.apellido, updateData.telefono, updateData.email, userId]
    );

    logger.info(`Usuario ${userId} actualizado por admin ${req.user.id}`);
    res.json({ message: 'Usuario actualizado correctamente' });
  } catch (error) {
    logger.error('Error al editar usuario:', error.message);
    res.status(500).json({ message: 'Error al editar usuario', error: error.message });
  }
});

// Ruta para eliminar un usuario (solo para Admins) - UserDelete
router.delete('/user/:id', authenticateToken, isAdmin, async (req, res) => {
  const userId = req.params.id;

  try {
    const db = getDb() || (await connectToDatabase());
    const [rows] = await db.execute('SELECT * FROM usuarios WHERE id = ?', [userId]);
    if (rows.length === 0) {
      return res.status(404).json({ message: 'Usuario no encontrado' });
    }

    await db.execute('DELETE FROM usuarios WHERE id = ?', [userId]);
    logger.info(`Usuario ${userId} eliminado por admin ${req.user.id}`);
    res.json({ message: 'Usuario eliminado correctamente' });
  } catch (error) {
    logger.error('Error al eliminar usuario:', error.message);
    res.status(500).json({ message: 'Error al eliminar usuario', error: error.message });
  }
});

// Ruta para gestionar permisos (solo para Admins) - Permissions
router.put('/permissions/:id', authenticateToken, isAdmin, async (req, res) => {
  const userId = req.params.id;
  const { permisos } = req.body; // Ejemplo: permisos como un JSON { "verEstadisticas": true, "editarUsuarios": true }

  try {
    const db = getDb() || (await connectToDatabase());
    const [rows] = await db.execute('SELECT * FROM usuarios WHERE id = ?', [userId]);
    if (rows.length === 0) {
      return res.status(404).json({ message: 'Usuario no encontrado' });
    }

    // Aquí asumimos que los permisos se guardan como un campo JSON en la tabla usuarios
    await db.execute('UPDATE usuarios SET permisos = ? WHERE id = ?', [JSON.stringify(permisos), userId]);
    logger.info(`Permisos actualizados para usuario ${userId} por admin ${req.user.id}`);
    res.json({ message: 'Permisos actualizados correctamente' });
  } catch (error) {
    logger.error('Error al actualizar permisos:', error.message);
    res.status(500).json({ message: 'Error al actualizar permisos', error: error.message });
  }
});

// Ruta para obtener configuraciones del sistema (solo para Admins) - SystemSettings
router.get('/settings', authenticateToken, isAdmin, async (req, res) => {
  try {
    const db = getDb() || (await connectToDatabase());
    const [rows] = await db.execute('SELECT * FROM configuraciones LIMIT 1'); // Asume una tabla configuraciones
    if (rows.length === 0) {
      return res.status(404).json({ message: 'No hay configuraciones registradas' });
    }
    logger.info(`Configuraciones obtenidas por admin ${req.user.id}`);
    res.json(rows[0]);
  } catch (error) {
    logger.error('Error al obtener configuraciones:', error.message);
    res.status(500).json({ message: 'Error al obtener configuraciones', error: error.message });
  }
});

router.put('/settings', authenticateToken, isAdmin, async (req, res) => {
  const { limite_inventario, notificaciones, dias_vencimiento } = req.body;

  try {
    const db = getDb() || (await connectToDatabase());
    const [rows] = await db.execute('SELECT * FROM configuraciones LIMIT 1');
    if (rows.length === 0) {
      await db.execute(
        'INSERT INTO configuraciones (limite_inventario, notificaciones, dias_vencimiento) VALUES (?, ?, ?)',
        [limite_inventario, notificaciones, dias_vencimiento]
      );
    } else {
      await db.execute(
        'UPDATE configuraciones SET limite_inventario = ?, notificaciones = ?, dias_vencimiento = ?',
        [limite_inventario, notificaciones, dias_vencimiento]
      );
    }
    logger.info(`Configuraciones actualizadas por admin ${req.user.id}`);
    res.json({ message: 'Configuraciones actualizadas correctamente' });
  } catch (error) {
    logger.error('Error al actualizar configuraciones:', error.message);
    res.status(500).json({ message: 'Error al actualizar configuraciones', error: error.message });
  }
});

module.exports = router;