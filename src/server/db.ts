import 'server-only';
import sql from 'mssql';

/**
 * Pool único de conexiones a Azure SQL.
 * Se guarda en globalThis para que el hot-reload de desarrollo no abra
 * un pool nuevo en cada cambio de archivo.
 */
const globalForDb = globalThis as typeof globalThis & {
  __vibefitPool?: Promise<sql.ConnectionPool>;
};

function getConfig(): sql.config {
  const { AZURE_SQL_SERVER, AZURE_SQL_DATABASE, AZURE_SQL_USER, AZURE_SQL_PASSWORD, AZURE_SQL_PORT } = process.env;

  if (!AZURE_SQL_SERVER || !AZURE_SQL_DATABASE || !AZURE_SQL_USER || !AZURE_SQL_PASSWORD) {
    throw new Error('Faltan variables AZURE_SQL_* en el entorno.');
  }

  return {
    server: AZURE_SQL_SERVER,
    database: AZURE_SQL_DATABASE,
    user: AZURE_SQL_USER,
    password: AZURE_SQL_PASSWORD,
    port: AZURE_SQL_PORT ? Number(AZURE_SQL_PORT) : 1433,
    pool: { max: 10, min: 0, idleTimeoutMillis: 30_000 },
    options: {
      encrypt: true,
      trustServerCertificate: false,
    },
    connectionTimeout: 30_000,
    requestTimeout: 30_000,
  };
}

export function getPool(): Promise<sql.ConnectionPool> {
  if (!globalForDb.__vibefitPool) {
    globalForDb.__vibefitPool = new sql.ConnectionPool(getConfig())
      .connect()
      .catch((error: unknown) => {
        // Si falla, se limpia para reintentar en la siguiente petición.
        globalForDb.__vibefitPool = undefined;
        throw error;
      });
  }
  return globalForDb.__vibefitPool;
}

/** Ejecuta `fn` dentro de una transacción; hace rollback si algo lanza. */
export async function withTransaction<T>(fn: (tx: sql.Transaction) => Promise<T>): Promise<T> {
  const pool = await getPool();
  const tx = new sql.Transaction(pool);
  await tx.begin();
  try {
    const result = await fn(tx);
    await tx.commit();
    return result;
  } catch (error) {
    try {
      await tx.rollback();
    } catch {
      // La transacción pudo haberse abortado ya del lado del servidor.
    }
    throw error;
  }
}

export { sql };
