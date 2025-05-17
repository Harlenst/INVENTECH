require('dotenv').config();
const express = require('express');
const cors = require('cors');
const path = require('path');
const rateLimit = require('express-rate-limit');
const winston = require('winston');
const app = express();

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

// Middleware para registrar todas las solicitudes
app.use((req, res, next) => {
  logger.info(`Solicitud recibida: ${req.method} ${req.url}`);
  next();
});

// Configuración de Rate Limiting
const limiter = rateLimit({
  windowMs: 15 * 60 * 1000, // 15 minutos
  max: 100, // Máximo 100 solicitudes por IP
  message: 'Demasiadas solicitudes desde esta IP, por favor intenta de nuevo más tarde.',
});
app.use(limiter);

// Seguridad para imágenes base64 y fuentes (CSP ajustado)
app.use((req, res, next) => {
  res.setHeader(
    'Content-Security-Policy',
    "default-src 'self' https://cdn.jsdelivr.net; " +
    "script-src 'self' https://cdn.jsdelivr.net 'unsafe-inline'; " + // Mantenemos 'unsafe-inline' por ahora
    "style-src 'self' https://cdn.jsdelivr.net https://fonts.googleapis.com 'unsafe-inline'; " +
    "img-src 'self' data: https://cdn.jsdelivr.net http://localhost:3000 http://localhost:5173; " +
    "font-src 'self' data: https://cdn.jsdelivr.net https://fonts.gstatic.com; " +
    "connect-src 'self' http://localhost:3000 ws://localhost:3000" // Para conexiones API y WebSockets si los usas
  );
  next();
});

// Configuración de CORS más segura
app.use(cors({
  origin: ['http://localhost:5173', 'http://localhost:3000'], // Orígenes permitidos (ajusta según tu entorno)
  methods: ['GET', 'POST', 'PUT', 'DELETE'],
  allowedHeaders: ['Content-Type', 'Authorization'],
  credentials: true, // Si necesitas enviar cookies o credenciales
}));

// Middlewares
app.use(express.json());
app.use(express.urlencoded({ extended: true }));

// Servir archivos estáticos (frontend y uploads)
const uploadsPath = path.join(__dirname, '..', 'uploads');
logger.info('Serving uploads from:', uploadsPath);
app.use('/uploads', express.static(uploadsPath));

// Serve static files from frontend/dist (built files)
const frontendPath = path.join(__dirname, '..', 'frontend', 'dist');
logger.info('Serving static files from:', frontendPath);
app.use(express.static(frontendPath));

// Importar middleware
const { authenticateToken } = require('./routes/auth');

// Rutas API
const authRoutes = require('./routes/auth');
const userRoutes = require('./routes/user');
const clientsRoutes = require('./routes/clients');
const productsRoutes = require('./routes/products');
const schedulesRoutes = require('./routes/schedules');
const attendanceRoutes = require('./routes/attendance');
const purchasesRoutes = require('./routes/purchases');

// Montar rutas de API
app.use('/api', authRoutes.router);
app.use('/api', authenticateToken, userRoutes);
app.use('/api', authenticateToken, clientsRoutes);
app.use('/api', authenticateToken, productsRoutes);
app.use('/api', authenticateToken, schedulesRoutes);
app.use('/api', authenticateToken, attendanceRoutes);
app.use('/api', authenticateToken, purchasesRoutes);

// Middleware para manejar rutas no encontradas
app.use('/api/*', (req, res) => {
  logger.warn(`Ruta API no encontrada: ${req.method} ${req.url}`);
  res.status(404).json({ message: 'Ruta no encontrada' });
});

// Servir la aplicación React para todas las rutas (SPA)
app.get('*', (req, res) => {
  res.sendFile(path.join(__dirname, '..', 'frontend', 'dist', 'index.html'));
});

// Middleware global de manejo de errores
app.use((err, req, res, next) => {
  logger.error(`Error no manejado: ${err.message}`, { stack: err.stack });
  res.status(500).json({ message: 'Error en el servidor', error: err.message });
});

// Iniciar servidor
const PORT = process.env.PORT || 3000;
app.listen(PORT, () => {
  logger.info(`🚀 Servidor corriendo en http://localhost:${PORT}`);
});