// Ejecuta archivos .sql contra Azure SQL, separando los lotes por líneas "GO".
// Uso: npm run db:migrar   (aplica todos los scripts de abajo, en orden)
//      node --env-file=.env.local scripts/migrar-db.mjs <archivo.sql>   (solo uno)
// Todos los scripts se pueden ejecutar varias veces sin duplicar nada.
import fs from 'node:fs';
import { conectarDB } from './db.mjs';

const POR_DEFECTO = ['sql-clientes-y-demanda.sql', 'sql-recetas.sql'].map((f) => new URL(`./${f}`, import.meta.url));
const archivos = process.argv[2] ? [process.argv[2]] : POR_DEFECTO;

try {
  const pool = await conectarDB();
  for (const archivo of archivos) {
    const nombre = String(archivo).split('/').pop();
    const lotes = fs
      .readFileSync(archivo, 'utf-8')
      .split(/^\s*GO\s*$/gim)
      .map((lote) => lote.trim())
      .filter(Boolean);
    console.log(`\n📄 ${nombre}`);
    for (const [i, lote] of lotes.entries()) {
      await pool.request().batch(lote);
      console.log(`  ✅ Lote ${i + 1}/${lotes.length} aplicado`);
    }
  }
  console.log('\nMigración completa.');
  process.exit(0);
} catch (error) {
  console.error('❌ La migración falló:', error.message);
  process.exit(1);
}
