const express = require('express');
   const bcrypt = require('bcrypt');
   const jwt = require('jsonwebtoken');
   const router = express.Router();
   const { connectToDatabase, getDb } = require('../db');

   require('dotenv').config();
   const SECRET_KEY = process.env.JWT_SECRET || 'tu_clave_secreta_aqui';

   // Middleware para autenticar el token
   const authenticateToken = (req, res, next) => {
       const authHeader = req.headers['authorization'];
       const token = authHeader && authHeader.split(' ')[1]; // Bearer TOKEN

       if (!token) {
           return res.status(401).json({ message: 'Token no proporcionado' });
       }

       try {
           const decoded = jwt.verify(token, SECRET_KEY);
           // Asignar id y rol a req.user
           req.user = {
               id: decoded.id,
               usuario: decoded.usuario,
               rol: decoded.rol
           };
           console.log('req.user después de authenticateToken:', req.user); // Depuración
           next();
       } catch (error) {
           console.error('Error al verificar el token:', error);
           res.status(403).json({ message: 'Token inválido' });
       }
   };

   // Ruta para login
   router.post('/login', async (req, res) => {
       const { usuario, contrasena } = req.body;
       try {
           const db = getDb() || (await connectToDatabase());
           const [rows] = await db.execute('SELECT * FROM usuarios WHERE usuario = ?', [usuario]);
           if (rows.length === 0) return res.status(401).json({ message: 'Usuario no encontrado' });

           const user = rows[0];
           const match = await bcrypt.compare(contrasena, user.contrasena);
           if (!match) return res.status(401).json({ message: 'Contraseña incorrecta' });

           const token = jwt.sign({ id: user.id, usuario: user.usuario, rol: user.rol }, SECRET_KEY, { expiresIn: '1h' });
           res.json({
               token,
               user: {
                   id: user.id,
                   usuario: user.usuario,
                   rol: user.rol
               }
           });
       } catch (error) {
           console.error('Error en login:', error);
           res.status(500).json({ message: 'Error en el servidor' });
       }
   });

   // Ruta para registro
   router.post('/register', async (req, res) => {
       const { nombre, apellido, telefono, email, usuario, contrasena, rol } = req.body;
       try {
           const db = getDb() || (await connectToDatabase());
           const hashedPassword = await bcrypt.hash(contrasena, 10);
           await db.execute(
               'INSERT INTO usuarios (nombre, apellido, telefono, email, usuario, contrasena, rol) VALUES (?, ?, ?, ?, ?, ?, ?)',
               [nombre, apellido, telefono, email, usuario, hashedPassword, rol]
           );
           res.json({ message: 'Usuario registrado exitosamente' });
       } catch (error) {
           console.error('Error al registrar usuario:', error);
           res.status(500).json({ message: 'Error al registrar usuario' });
       }
   });

   module.exports = { router, authenticateToken };