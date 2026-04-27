import { v2 as cloudinary } from 'cloudinary';
import sql from 'mssql';
import fs from 'fs';
import { conectarDB } from './lib/db.js';

// 1. Configuración de Cloudinary
cloudinary.config({ 
  cloud_name: process.env.CLOUDINARY_CLOUD_NAME, 
  api_key: process.env.CLOUDINARY_API_KEY, 
  api_secret: process.env.CLOUDINARY_API_SECRET 
});

async function migrarIherbRobusto() {
  try {
    const pool = await conectarDB();
    
    // Leemos el archivo results (1).csv como texto plano
    const nombreArchivo = 'results (1).csv';
    if (!fs.existsSync(nombreArchivo)) {
      console.error(`❌ No encontré el archivo: ${nombreArchivo}`);
      return;
    }

    const contenido = fs.readFileSync(nombreArchivo, 'utf-8');
    const lineas = contenido.split('\n').filter(l => l.trim() !== '');
    
    // Saltamos la cabecera
    const datos = lineas.slice(1);

    console.log(`🚀 Iniciando rescate de ${datos.length} imágenes de iHerb (Versión Robusta)...`);

    for (const linea of datos) {
      // Buscamos la primera coma (después del ID)
      const indicePrimeraComa = linea.indexOf(',');
      if (indicePrimeraComa === -1) continue;

      const id = linea.substring(0, indicePrimeraComa).trim();
      // El resto de la línea es la URL (le quitamos las comillas " que puso el CSV)
      const urlOriginal = linea.substring(indicePrimeraComa + 1).replace(/"/g, '').trim();

      if (!id || id === 'id') continue;

      console.log(`📦 Procesando SKU ID: ${id}...`);

      try {
        // Subimos a TU Cloudinary
        const uploadResult = await cloudinary.uploader.upload(urlOriginal, {
          folder: "vibefit-store/iherb_migrados"
        });

        // Actualizamos Azure
        await pool.request()
          .input('nuevaUrl', sql.NVarChar, uploadResult.secure_url)
          .input('id', sql.Int, id)
          .query(`UPDATE SKUs SET imagen_variante_url = @nuevaUrl WHERE id = @id`);

        console.log(`✅ ID ${id} migrado con éxito.`);

      } catch (err) {
        console.error(`❌ Error en ID ${id}: ${err.message}`);
      }
    }

    console.log("-----------------------------------------");
    console.log("🔥 ¡RESCATE DE IHERB COMPLETADO AL 100%! 🔥");
    process.exit(0);

  } catch (error) {
    console.error("❌ Error general:", error);
    process.exit(1);
  }
}

migrarIherbRobusto();