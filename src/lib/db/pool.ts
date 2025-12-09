import mysql from 'mysql2/promise';

// Singleton connection pool
let pool: mysql.Pool | null = null;

/**
 * Get or create MySQL connection pool
 *
 * Uses singleton pattern to ensure only one pool exists
 * Configuration from environment variables:
 * - DB_HOST: MySQL host (default: localhost)
 * - DB_PORT: MySQL port (default: 3306)
 * - DB_USER: MySQL username (required)
 * - DB_PASSWORD: MySQL password (required)
 * - DB_NAME: Database name (required)
 */
export function getPool(): mysql.Pool {
  if (!pool) {
    // Validate required environment variables
    if (!process.env.DB_USER || !process.env.DB_PASSWORD || !process.env.DB_NAME) {
      throw new Error(
        'Missing required database configuration. ' +
        'Please ensure DB_USER, DB_PASSWORD, and DB_NAME are set in .env.local'
      );
    }

    pool = mysql.createPool({
      host: process.env.DB_HOST || 'localhost',
      port: parseInt(process.env.DB_PORT || '3306', 10),
      user: process.env.DB_USER,
      password: process.env.DB_PASSWORD,
      database: process.env.DB_NAME,
      waitForConnections: true,
      connectionLimit: 10, // Sufficient for university-scale application
      queueLimit: 0, // Unlimited queue
      enableKeepAlive: true, // Prevent connection timeouts
      keepAliveInitialDelay: 0,
    });

    console.log(`[DB] MySQL connection pool created for database: ${process.env.DB_NAME}`);
  }

  return pool;
}

/**
 * Close the connection pool
 * Should be called during graceful shutdown
 */
export async function closePool(): Promise<void> {
  if (pool) {
    await pool.end();
    pool = null;
    console.log('[DB] MySQL connection pool closed');
  }
}

/**
 * Test database connection
 * Useful for health checks and startup validation
 */
export async function testConnection(): Promise<boolean> {
  try {
    const connection = await getPool().getConnection();
    await connection.ping();
    connection.release();
    console.log('[DB] Database connection test successful');
    return true;
  } catch (error) {
    console.error('[DB] Database connection test failed:', error);
    return false;
  }
}
