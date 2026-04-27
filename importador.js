import fs from 'fs';
import csv from 'csv-parser';
import sql from 'mssql';
import { conectarDB } from './lib/db.js';

async function sincronizarCatalogo() {
  const pool = await conectarDB();
  const filas = [];

  console.log("⏳ Leyendo archivo catalogo.csv...");

  // 1. Leemos el CSV
  fs.createReadStream('catalogo.csv')
    .pipe(csv())
    .on('data', (data) => filas.push(data))
    .on('end', async () => {
      console.log(`✅ Se encontraron ${filas.length} productos en el CSV.`);
      console.log("🧹 Limpiando catálogo antiguo (conservando Marcas)...");

      try {
        // 2. Borramos SKUs y Productos viejos para no tener "fantasmas"
        await pool.request().query(`
          DELETE FROM SKUs;
          DELETE FROM Productos;
        `);

        console.log("🚀 Iniciando inyección de datos nuevos...");

        // 3. Insertamos fila por fila con SQL Inteligente
        for (const fila of filas) {
          // Extraemos los datos exactos de tus columnas del CSV
          const marca = fila.Marca_Detectada;
          const producto = fila.Descripcion_Original;
          const tamano = fila.Tamano;
          const sabor = fila.Sabor;
          const precio_proveedor = parseFloat(fila.Precio);
          const url_imagen = fila.URL;

          // Creamos el query maestro que hace todo en un solo viaje a Azure
          const query = `
            -- A. Buscar o crear la Marca
            DECLARE @marca_id INT;
            SELECT @marca_id = id FROM Marcas WHERE nombre = @marca;
            IF @marca_id IS NULL
            BEGIN
                INSERT INTO Marcas (nombre) VALUES (@marca);
                SET @marca_id = SCOPE_IDENTITY();
            END

            -- B. Buscar o crear el Producto
            DECLARE @prod_id INT;
            SELECT @prod_id = id FROM Productos WHERE nombre = @producto AND marca_id = @marca_id;
            IF @prod_id IS NULL
            BEGIN
                INSERT INTO Productos (nombre, marca_id, categoria) VALUES (@producto, @marca_id, 'Suplemento');
                SET @prod_id = SCOPE_IDENTITY();
            END

            -- C. Calcular el precio de venta final (+30% y redondeo a la decena)
            DECLARE @precio_venta DECIMAL(10,2) = CEILING((@precio_proveedor * 1.30) / 10) * 10;

            -- D. Insertar el SKU
            INSERT INTO SKUs (producto_id, sabor, tamano, precio_proveedor, precio_venta, imagen_variante_url)
            VALUES (@prod_id, @sabor, @tamano, @precio_proveedor, @precio_venta, @url_imagen);
          `;

          // Ejecutamos el query pasándole los valores seguros
          await pool.request()
            .input('marca', sql.NVarChar, marca)
            .input('producto', sql.NVarChar, producto)
            .input('tamano', sql.NVarChar, tamano)
            .input('sabor', sql.NVarChar, sabor)
            .input('precio_proveedor', sql.Decimal(10,2), precio_proveedor)
            .input('url_imagen', sql.NVarChar, url_imagen)
            .query(query);
        }

        console.log("🏆 ¡Sincronización completada con éxito!");
        console.log("💰 Todos los precios de venta fueron calculados y redondeados.");
        process.exit(0);

      } catch (error) {
        console.error("❌ Error en la base de datos:", error);
      }
    });
}

sincronizarCatalogo();