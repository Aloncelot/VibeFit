// Conexión para los scripts de mantenimiento (se ejecutan con `node --env-file=.env.local`).
import sql from 'mssql';

let poolPromise;

export function conectarDB() {
  if (!poolPromise) {
    poolPromise = new sql.ConnectionPool({
      server: process.env.AZURE_SQL_SERVER,
      database: process.env.AZURE_SQL_DATABASE,
      user: process.env.AZURE_SQL_USER,
      password: process.env.AZURE_SQL_PASSWORD,
      port: Number(process.env.AZURE_SQL_PORT || 1433),
      options: { encrypt: true, trustServerCertificate: false },
    }).connect();
  }
  return poolPromise;
}
