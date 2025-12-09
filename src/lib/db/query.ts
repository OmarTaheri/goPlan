import { getPool } from './pool';
import { RowDataPacket, ResultSetHeader, FieldPacket, PoolConnection } from 'mysql2/promise';

/**
 * Execute a SELECT query with parameterized values
 *
 * @param sql SQL query string with ? placeholders
 * @param params Array of values to bind to placeholders
 * @returns Tuple of [rows, fields]
 *
 * @example
 * const [users] = await query<UserRow>(
 *   'SELECT * FROM users WHERE role = ?',
 *   ['STUDENT']
 * );
 */
export async function query<T = RowDataPacket>(
  sql: string,
  params: unknown[] = []
): Promise<[T[], FieldPacket[]]> {
  const pool = getPool();
  return pool.query<T[] & RowDataPacket[]>(sql, params);
}

/**
 * Execute an INSERT, UPDATE, or DELETE query
 *
 * @param sql SQL query string with ? placeholders
 * @param params Array of values to bind to placeholders
 * @returns ResultSetHeader with affectedRows, insertId, etc.
 *
 * @example
 * const result = await execute(
 *   'UPDATE users SET last_login = NOW() WHERE user_id = ?',
 *   [userId]
 * );
 * console.log(`Updated ${result.affectedRows} rows`);
 */
export async function execute(
  sql: string,
  params: any[] = []
): Promise<ResultSetHeader> {
  const pool = getPool();
  const [result] = await pool.execute<ResultSetHeader>(sql, params);
  return result;
}

/**
 * Execute multiple queries within a transaction
 * Automatically commits on success, rolls back on error
 *
 * @param callback Function that receives a connection and performs queries
 * @returns The result from the callback function
 *
 * @example
 * await transaction(async (conn) => {
 *   await conn.execute('INSERT INTO student_plan ...');
 *   await conn.execute('INSERT INTO semester_approvals ...');
 *   // Both succeed or both rollback
 * });
 */
export async function transaction<T>(
  callback: (connection: PoolConnection) => Promise<T>
): Promise<T> {
  const pool = getPool();
  const connection = await pool.getConnection();

  try {
    await connection.beginTransaction();
    const result = await callback(connection);
    await connection.commit();
    return result;
  } catch (error) {
    await connection.rollback();
    console.error('[DB] Transaction rolled back:', error);
    throw error;
  } finally {
    connection.release();
  }
}

/**
 * Execute a query within a specific connection (for use in transactions)
 *
 * @param connection PoolConnection from transaction callback
 * @param sql SQL query string with ? placeholders
 * @param params Array of values to bind to placeholders
 * @returns Tuple of [rows, fields]
 */
export async function queryWithConnection<T = RowDataPacket>(
  connection: PoolConnection,
  sql: string,
  params: unknown[] = []
): Promise<[T[], FieldPacket[]]> {
  return connection.query<T[] & RowDataPacket[]>(sql, params);
}

/**
 * Execute an INSERT/UPDATE/DELETE within a specific connection (for use in transactions)
 *
 * @param connection PoolConnection from transaction callback
 * @param sql SQL query string with ? placeholders
 * @param params Array of values to bind to placeholders
 * @returns ResultSetHeader with affectedRows, insertId, etc.
 */
export async function executeWithConnection(
  connection: PoolConnection,
  sql: string,
  params: any[] = []
): Promise<ResultSetHeader> {
  const [result] = await connection.execute<ResultSetHeader>(sql, params);
  return result;
}
