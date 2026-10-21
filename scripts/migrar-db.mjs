// Ejecuta un archivo .sql contra Azure SQL, separando los lotes por líneas "GO".
// Uso: npm run db:migrar   (o node --env-file=.env.local scripts/migrar-db.mjs <archivo.sql>)
import fs from 'node:fs';
import { conectarDB } from './db.mjs';

const archivo = process.argv[2] ?? new URL('./sql-clientes-y-demanda.sql', import.meta.url);
const lotes = fs
  .readFileSync(archivo, 'utf-8')
  .split(/^\s*GO\s*$/gim)
  .map((lote) => lote.trim())
  .filter(Boolean);

try {
  const pool = await conectarDB();
  for (const [i, lote] of lotes.entries()) {
    await pool.request().batch(lote);
    console.log(`✅ Lote ${i + 1}/${lotes.length} aplicado`);
  }
  console.log('Migración completa.');
  process.exit(0);
} catch (error) {
  console.error('❌ La migración falló:', error.message);
  process.exit(1);
}
