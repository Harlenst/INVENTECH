const express = require('express');
const router = express.Router();
const { connectToDatabase, getDb } = require('../db');

// Ruta para registrar un horario
router.post('/schedules', async (req, res) => {
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
        res.json({ message: 'Horario registrado exitosamente' });
    } catch (error) {
        console.error('Error al registrar horario:', error);
        res.status(500).json({ message: 'Error al registrar horario', error: error.message });
    }
});

// Ruta para obtener los horarios
router.get('/schedules', async (req, res) => {
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
        res.json(rows);
    } catch (error) {
        console.error('Error al obtener horarios:', error);
        res.status(500).json({ message: 'Error al obtener horarios', error: error.message });
    }
});

module.exports = router;