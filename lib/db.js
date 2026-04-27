import sql from 'mssql';

const config = {
    user: process.env.AZURE_SQL_USER,
    password: process.env.AZURE_SQL_PASSWORD,
    server: process.env.AZURE_SQL_SERVER,
    database: process.env.AZURE_SQL_DATABASE,
    options: {
        encrypt: true, // Vital para Azure
        trustServerCertificate: false,
        connectTimeout: 30000
    }
};

let poolPromise;

export async function conectarDB() {
    // 1. Si ya existe una conexión abierta, la reutilizamos (Ahorra recursos)
    if (poolPromise) {
        return poolPromise;
    }

    // 2. Si no existe, la creamos por primera vez
    try {
        poolPromise = sql.connect(config);
        const pool = await poolPromise;
        console.log('✅ Conectado a la bóveda de Azure SQL (Conexión Reutilizable)');
        return pool;
    } catch (err) {
        poolPromise = null; // Si falla, borramos la memoria para que intente de nuevo
        console.error('❌ Error de conexión a Azure SQL:', err);
        throw err;
    }
}