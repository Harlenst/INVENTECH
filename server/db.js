const mysql = require('mysql2/promise');
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

// Configuración de la base de datos desde variables de entorno
const dbConfig = {
  host: process.env.DB_HOST || 'localhost',
  user: process.env.DB_USER || 'root',
  password: process.env.DB_PASSWORD || 'Steven21',
  database: process.env.DB_NAME || 'inventech_db',
  waitForConnections: true,
  connectionLimit: 10, // Máximo de conexiones en el pool
  queueLimit: 0, // Sin límite en la cola de conexiones
};

// Crear el pool de conexiones
const pool = mysql.createPool(dbConfig);

// Probar la conexión inicial
pool.getConnection()
  .then(() => {
    logger.info('Conectado a la base de datos MySQL');
  })
  .catch((error) => {
    logger.error('Error al conectar a la base de datos:', error.message);
    throw error;
  });

// Exportar funciones
module.exports = {
  connectToDatabase: async () => {
    try {
      return pool; // Retornar el pool directamente
    } catch (error) {
      logger.error('Error al obtener conexión del pool:', error.message);
      throw error;
    }
  },
  getDb: () => pool, // Retornar el pool directamente
};

// Manejar cierre del pool al apagar el servidor
process.on('SIGINT', async () => {
  try {
    await pool.end();
    logger.info('Pool de conexiones a MySQL cerrado');
    process.exit(0);
  } catch (error) {
    logger.error('Error al cerrar el pool de conexiones:', error.message);
    process.exit(1);
  }
});

process.on('SIGTERM', async () => {
  try {
    await pool.end();
    logger.info('Pool de conexiones a MySQL cerrado');
    process.exit(0);
  } catch (error) {
    logger.error('Error al cerrar el pool de conexiones:', error.message);
    process.exit(1);
  }
});