import { v2 as cloudinary } from 'cloudinary';
import sql from 'mssql';
import { conectarDB } from './lib/db.js'; // Ajusta si tu ruta es distinta

// 1. Configuramos Cloudinary usando las variables de entorno
cloudinary.config({ 
  cloud_name: process.env.CLOUDINARY_CLOUD_NAME, 
  api_key: process.env.CLOUDINARY_API_KEY, 
  api_secret: process.env.CLOUDINARY_API_SECRET 
});

async function migrarImagenes() {
  const pool = await conectarDB();
  
  try {
    // 2. Buscamos productos que NO tengan link de Cloudinary aún
    const result = await pool.request().query(`
      SELECT id, imagen_variante_url 
      FROM SKUs 
      WHERE imagen_variante_url IS NOT NULL 
      AND imagen_variante_url NOT LIKE '%cloudinary%'
    `);

    const skus = result.recordset;
    console.log(`🚀 Se encontraron ${skus.length} imágenes externas para migrar...`);

    let exitosas = 0;
    let fallidas = 0;

    // 3. Iteramos una por una (el for...of con await evita saturar el servidor)
    for (const item of skus) {
      console.log(`⏳ Procesando SKU ID: ${item.id} - ${item.imagen_variante_url.substring(0, 40)}...`);
      
      try {
        // Le pedimos a Cloudinary que descargue la imagen de la URL
        const uploadResult = await cloudinary.uploader.upload(item.imagen_variante_url, {
          folder: "vibefit-store/suplementos" // Todo súper ordenado en una carpeta
        });

        // Actualizamos nuestra base de datos con el link seguro de Cloudinary
        await pool.request()
          .input('nuevaUrl', sql.NVarChar, uploadResult.secure_url)
          .input('id', sql.Int, item.id)
          .query(`UPDATE SKUs SET imagen_variante_url = @nuevaUrl WHERE id = @id`);
          
        exitosas++;
        console.log(`✅ ¡Éxito! -> Nueva URL guardada en SKU ${item.id}`);
        
      } catch (error) {
        fallidas++;
        console.error(`❌ Error con SKU ${item.id}. Posible imagen caída en el origen.`);
        // No detenemos el script, simplemente pasamos a la siguiente
      }
    }
    
    console.log("-----------------------------------------");
    console.log("🔥 MIGRAción COMPLETADA, FERRARI 🔥");
    console.log(`✔️ Imágenes migradas: ${exitosas}`);
    console.log(`⚠️ Errores (Links rotos de origen): ${fallidas}`);
    
    process.exit(0);

  } catch (error) {
    console.error("❌ Error catastrófico en la base de datos:", error);
    process.exit(1);
  }
}

migrarImagenes();
