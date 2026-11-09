// Limpia de Azure SQL la ropa y los accesorios (la tienda ahora es solo de suplementos).
// Uso:
//   node --env-file=.env.local scripts/quitar-ropa.mjs            -> solo muestra lo que se borraría
//   node --env-file=.env.local scripts/quitar-ropa.mjs --borrar   -> lo borra (en una transacción)
// Uso corto: npm run db:quitar-ropa  (vista previa)  /  npm run db:quitar-ropa -- --borrar
// Lo que se borra: productos de categoría TOPS, BOTTOMS y ACCESORIOS con sus SKUs, fotos,
// movimientos, historial de precios, eventos de demanda, y sus apariciones en carritos,
// favoritos, avisos y notificaciones de clientes. Al final, las marcas que se quedan sin productos.
// Los suplementos no se tocan.
import { conectarDB } from './db.mjs';

const BORRAR = process.argv.includes('--borrar');
const ROPA = `SELECT s.id FROM SKUs s JOIN Productos p ON p.id = s.producto_id WHERE p.categoria IN ('TOPS','BOTTOMS','ACCESORIOS')`;

// [tabla, condición]; las que no existan se saltan.
const PASOS = [
  ['Clientes_Listas', `sku_id IN (${ROPA})`],
  ['Alertas_Restock', `sku_id IN (${ROPA})`],
  ['Notificaciones', `sku_id IN (${ROPA})`],
  ['Eventos_Demanda', `sku_id IN (${ROPA})`],
  ['Movimientos_Inventario', `sku_id IN (${ROPA})`],
  ['HistorialPrecios', `sku_id IN (${ROPA})`],
  ['Imagenes_SKU', `sku_id IN (${ROPA})`],
  ['SKUs', `id IN (${ROPA})`],
  ['Productos', `categoria IN ('TOPS','BOTTOMS','ACCESORIOS')`],
  // Solo marcas que eran de ropa y ya no tienen ningún producto (una marca de suplementos nueva sin productos no se toca).
  ['Marcas', `id IN (__MARCAS__) AND id NOT IN (SELECT DISTINCT marca_id FROM Productos WHERE marca_id IS NOT NULL)`],
];

const pool = await conectarDB();
const existe = async (t) => (await pool.request().query(`SELECT OBJECT_ID('dbo.${t}', 'U') AS id`)).recordset[0].id !== null;

try {
  console.log(BORRAR ? '\n🧹 Borrando ropa y accesorios…\n' : '\n🔎 Vista previa (no se borra nada). Usa --borrar para aplicar.\n');
  const tx = pool.transaction();
  await tx.begin();
  try {
    // Marcas que tenían ropa (se calcula antes de borrar los productos).
    const marcas = (await tx.request().query(`SELECT DISTINCT marca_id AS id FROM Productos
                              WHERE categoria IN ('TOPS','BOTTOMS','ACCESORIOS') AND marca_id IS NOT NULL`)).recordset
      .map((r) => Number(r.id)).filter(Number.isInteger);
    const marcasRopa = marcas.length ? marcas.join(',') : 'NULL';
    for (const [tabla, plantilla] of PASOS) {
      const where = plantilla.replace('__MARCAS__', marcasRopa);
      if (!(await existe(tabla))) {
        console.log(`  · ${tabla}: no existe, se omite`);
        continue;
      }
      // En la vista previa las marcas se cuentan como quedarían después de borrar los productos.
      const cuenta = tabla === 'Marcas' && !BORRAR
        ? `SELECT COUNT(*) AS n FROM Marcas WHERE id IN (${marcasRopa})
             AND id NOT IN (SELECT DISTINCT marca_id FROM Productos WHERE marca_id IS NOT NULL AND (categoria IS NULL OR categoria NOT IN ('TOPS','BOTTOMS','ACCESORIOS')))`
        : `SELECT COUNT(*) AS n FROM ${tabla} WHERE ${where}`;
      const n = (await tx.request().query(cuenta)).recordset[0].n;
      if (BORRAR && n > 0) await tx.request().query(`DELETE FROM ${tabla} WHERE ${where}`);
      console.log(`  ${BORRAR ? '✅' : '·'} ${tabla}: ${n} fila(s)`);
    }
    if (BORRAR) await tx.commit();
    else await tx.rollback();
  } catch (error) {
    await tx.rollback().catch(() => {});
    throw error;
  }
  console.log(BORRAR ? '\nListo. Los suplementos quedaron intactos.' : '\nNada se borró.');
  process.exit(0);
} catch (error) {
  console.error('❌ Falló:', error.message);
  process.exit(1);
}
