import { v2 as cloudinary } from 'cloudinary';
import sql from 'mssql';
import { conectarDB } from './lib/db.js';

cloudinary.config({ 
  cloud_name: process.env.CLOUDINARY_CLOUD_NAME, 
  api_key: process.env.CLOUDINARY_API_KEY, 
  api_secret: process.env.CLOUDINARY_API_SECRET 
});

async function migrarLogos() {
  try {
    const pool = await conectarDB();
    const result = await pool.request().query('SELECT id, nombre, logo_url FROM Marcas WHERE logo_url IS NOT NULL');
    const marcas = result.recordset;

    console.log(`🚀 Migrando ${marcas.length} logos de marcas...`);

    for (const marca of marcas) {
      console.log(`📦 Procesando logo de: ${marca.nombre}...`);
      try {
        const uploadResult = await cloudinary.uploader.upload(marca.logo_url, {
          folder: "vibefit-store/logos"
        });

        await pool.request()
          .input('nuevaUrl', sql.NVarChar, uploadResult.secure_url)
          .input('id', sql.Int, marca.id)
          .query('UPDATE Marcas SET logo_url = @nuevaUrl WHERE id = @id');

        console.log(`✅ Logo de ${marca.nombre} asegurado.`);
      } catch (err) {
        console.error(`❌ Error en ${marca.nombre}:`, err.message);
      }
    }
    console.log("🔥 ¡Todos los logos están ahora en tu Cloudinary!");
    process.exit(0);
  } catch (error) {
    console.error(error);
    process.exit(1);
  }
}

migrarLogos();