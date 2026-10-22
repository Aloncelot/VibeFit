import 'server-only';
import { v2 as cloudinary } from 'cloudinary';
import { UserFacingError } from '@/lib/validation';

const TIPOS = new Set(['image/jpeg', 'image/png', 'image/webp']);
export const FOTO_MAX_BYTES = 3 * 1024 * 1024;

function configurado(): boolean {
  return Boolean(process.env.CLOUDINARY_CLOUD_NAME && process.env.CLOUDINARY_API_KEY && process.env.CLOUDINARY_API_SECRET);
}

/**
 * Sube una foto a Cloudinary y devuelve su URL https.
 * Valida tipo y tamaño en el servidor: lo que diga el navegador no es confiable.
 */
export async function subirFoto(archivo: File, carpeta: string): Promise<string> {
  if (!configurado()) {
    throw new UserFacingError('Falta configurar Cloudinary (CLOUDINARY_* en .env.local) para subir fotos.');
  }
  if (!TIPOS.has(archivo.type)) throw new UserFacingError('La foto debe ser JPG, PNG o WebP.');
  if (archivo.size > FOTO_MAX_BYTES) throw new UserFacingError('La foto pesa más de 3 MB. Usa una más ligera.');

  const bytes = Buffer.from(await archivo.arrayBuffer());
  // Revisa la firma del archivo, no solo el tipo declarado.
  const esJpg = bytes[0] === 0xff && bytes[1] === 0xd8;
  const esPng = bytes.subarray(0, 4).toString('hex') === '89504e47';
  const esWebp = bytes.subarray(0, 4).toString('ascii') === 'RIFF' && bytes.subarray(8, 12).toString('ascii') === 'WEBP';
  if (!esJpg && !esPng && !esWebp) throw new UserFacingError('El archivo no es una imagen válida.');

  cloudinary.config({
    cloud_name: process.env.CLOUDINARY_CLOUD_NAME,
    api_key: process.env.CLOUDINARY_API_KEY,
    api_secret: process.env.CLOUDINARY_API_SECRET,
    secure: true,
  });

  const resultado = await cloudinary.uploader.upload(`data:${archivo.type};base64,${bytes.toString('base64')}`, {
    folder: carpeta,
    resource_type: 'image',
    // Limita el tamaño guardado; Next/Image genera las variantes para cada pantalla.
    transformation: [{ width: 1600, height: 1600, crop: 'limit' }],
  });
  return resultado.secure_url;
}
