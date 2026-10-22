'use server';

import { revalidatePath, revalidateTag } from 'next/cache';
import { redirect } from 'next/navigation';
import { getPool, sql } from '@/server/db';
import { isAdmin, UNAUTHORIZED } from '@/server/auth/dal';
import { subirFoto } from '@/server/cloudinary';
import { RECETAS_TAG } from '@/server/queries/recetas';
import { OBJETIVO_VALORES, slugify, type Ingrediente } from '@/content/recetas';
import { cleanText, isId, isInt, oneOf, toActionError, UserFacingError, type ActionResult } from '@/lib/validation';

const SLUG = /^[a-z0-9]+(?:-[a-z0-9]+)*$/;
const FECHA = /^\d{4}-\d{2}-\d{2}$/;

function refrescar() {
  revalidateTag(RECETAS_TAG, { expire: 0 });
  revalidatePath('/recetas');
  revalidatePath('/recetas/[slug]', 'page');
  revalidatePath('/');
  revalidatePath('/admin/recetas');
}

function entero(fd: FormData, campo: string): number {
  const valor = String(fd.get(campo) ?? '').trim();
  return valor === '' ? NaN : Number(valor);
}

/** Lee y valida el formulario. Lanza UserFacingError con el primer problema que encuentre. */
function leerReceta(fd: FormData) {
  const titulo = cleanText(fd.get('titulo'), 120);
  if (!titulo) throw new UserFacingError('Escribe el título (máximo 120 caracteres).');

  const slug = slugify(cleanText(fd.get('slug'), 120) ?? titulo);
  if (slug.length < 3 || !SLUG.test(slug)) throw new UserFacingError('La dirección de la receta debe tener al menos 3 letras o números.');

  const objetivo = fd.get('objetivo');
  if (!oneOf(objetivo, OBJETIVO_VALORES)) throw new UserFacingError('Elige si la receta es para definición o volumen.');

  const resumen = cleanText(fd.get('resumen'), 300);
  if (!resumen) throw new UserFacingError('Escribe el resumen (máximo 300 caracteres).');

  const publicada = String(fd.get('publicada') ?? '');
  if (!FECHA.test(publicada) || Number.isNaN(Date.parse(`${publicada}T00:00:00Z`))) {
    throw new UserFacingError('Revisa la fecha de publicación.');
  }

  const numeros = {
    tiempoMin: [entero(fd, 'tiempoMin'), 1, 600, 'el tiempo (1 a 600 min)'],
    porciones: [entero(fd, 'porciones'), 1, 50, 'las porciones (1 a 50)'],
    kcal: [entero(fd, 'kcal'), 0, 5000, 'las calorías (0 a 5000)'],
    proteina: [entero(fd, 'proteina'), 0, 500, 'la proteína (0 a 500 g)'],
    carbohidratos: [entero(fd, 'carbohidratos'), 0, 800, 'los carbohidratos (0 a 800 g)'],
    grasa: [entero(fd, 'grasa'), 0, 400, 'la grasa (0 a 400 g)'],
  } as const;
  for (const [valor, min, max, nombre] of Object.values(numeros)) {
    if (!isInt(valor, min, max)) throw new UserFacingError(`Revisa ${nombre}: debe ser un número entero.`);
  }

  const cantidades = fd.getAll('ing_cantidad');
  const nombres = fd.getAll('ing_nombre');
  const ingredientes: Ingrediente[] = [];
  for (let i = 0; i < Math.max(cantidades.length, nombres.length); i++) {
    const cantidadCruda = String(cantidades[i] ?? '').trim();
    const nombreCrudo = String(nombres[i] ?? '').trim();
    if (!cantidadCruda && !nombreCrudo) continue; // fila vacía
    const ingrediente = cleanText(nombreCrudo, 120);
    if (!ingrediente) throw new UserFacingError(`El ingrediente ${i + 1} no tiene nombre o es muy largo.`);
    const cantidad = cleanText(cantidadCruda, 60) ?? 'al gusto';
    ingredientes.push({ cantidad, ingrediente });
  }
  if (ingredientes.length === 0) throw new UserFacingError('Agrega al menos un ingrediente.');
  if (ingredientes.length > 40) throw new UserFacingError('Máximo 40 ingredientes.');

  const pasos: string[] = [];
  for (const [i, crudo] of fd.getAll('paso').entries()) {
    if (!String(crudo).trim()) continue;
    const paso = cleanText(crudo, 600);
    if (!paso) throw new UserFacingError(`El paso ${i + 1} es muy largo (máximo 600 caracteres).`);
    pasos.push(paso);
  }
  if (pasos.length === 0) throw new UserFacingError('Agrega al menos un paso.');
  if (pasos.length > 30) throw new UserFacingError('Máximo 30 pasos.');

  const consejoCrudo = String(fd.get('consejo') ?? '').trim();
  const consejo = consejoCrudo ? cleanText(consejoCrudo, 400) : null;
  if (consejoCrudo && !consejo) throw new UserFacingError('El consejo es muy largo (máximo 400 caracteres).');

  return {
    titulo,
    slug,
    objetivo,
    resumen,
    publicada,
    tiempoMin: numeros.tiempoMin[0],
    porciones: numeros.porciones[0],
    kcal: numeros.kcal[0],
    proteina: numeros.proteina[0],
    carbohidratos: numeros.carbohidratos[0],
    grasa: numeros.grasa[0],
    ingredientes,
    pasos,
    consejo,
    visible: fd.get('visible') === 'on',
  };
}

/** Crea (sin id) o actualiza (con id) una receta. Al terminar vuelve a la lista del panel. */
export async function guardarReceta(fd: FormData): Promise<ActionResult> {
  if (!(await isAdmin())) return UNAUTHORIZED;

  const idCrudo = String(fd.get('id') ?? '');
  const id = idCrudo ? Number(idCrudo) : null;
  if (id !== null && !isId(id)) return { success: false, error: 'Receta inválida.' };

  try {
    const r = leerReceta(fd);

    // Foto: nueva (se sube a Cloudinary), quitar la actual, o dejar la que ya tiene.
    const foto = fd.get('foto');
    let cambiarFoto = fd.get('quitarFoto') === 'on';
    let imagen: string | null = null;
    if (foto instanceof File && foto.size > 0) {
      imagen = await subirFoto(foto, 'vibefit/recetas');
      cambiarFoto = true;
    }

    const pool = await getPool();
    const req = pool.request()
      .input('slug', sql.VarChar(90), r.slug)
      .input('titulo', sql.NVarChar(120), r.titulo)
      .input('objetivo', sql.VarChar(12), r.objetivo)
      .input('resumen', sql.NVarChar(300), r.resumen)
      .input('publicada', sql.Date, new Date(`${r.publicada}T12:00:00Z`))
      .input('tiempoMin', sql.SmallInt, r.tiempoMin)
      .input('porciones', sql.TinyInt, r.porciones)
      .input('kcal', sql.SmallInt, r.kcal)
      .input('proteina', sql.SmallInt, r.proteina)
      .input('carbohidratos', sql.SmallInt, r.carbohidratos)
      .input('grasa', sql.SmallInt, r.grasa)
      .input('ingredientes', sql.NVarChar(sql.MAX), JSON.stringify(r.ingredientes))
      .input('pasos', sql.NVarChar(sql.MAX), JSON.stringify(r.pasos))
      .input('consejo', sql.NVarChar(400), r.consejo)
      .input('imagen', sql.NVarChar(500), imagen)
      .input('cambiarFoto', sql.Bit, cambiarFoto)
      .input('visible', sql.Bit, r.visible);

    if (id === null) {
      await req.query(`
        INSERT INTO Recetas (slug, titulo, objetivo, resumen, publicada, tiempo_min, porciones, kcal, proteina, carbohidratos,
                             grasa, ingredientes, pasos, consejo, imagen_url, visible)
        VALUES (@slug, @titulo, @objetivo, @resumen, @publicada, @tiempoMin, @porciones, @kcal, @proteina, @carbohidratos,
                @grasa, @ingredientes, @pasos, @consejo, @imagen, @visible)
      `);
    } else {
      const res = await req.input('id', sql.Int, id).query(`
        UPDATE Recetas SET
          slug = @slug, titulo = @titulo, objetivo = @objetivo, resumen = @resumen, publicada = @publicada,
          tiempo_min = @tiempoMin, porciones = @porciones, kcal = @kcal, proteina = @proteina,
          carbohidratos = @carbohidratos, grasa = @grasa, ingredientes = @ingredientes, pasos = @pasos,
          consejo = @consejo, visible = @visible,
          imagen_url = CASE WHEN @cambiarFoto = 1 THEN @imagen ELSE imagen_url END,
          actualizada_en = SYSUTCDATETIME()
        WHERE id = @id
      `);
      if (res.rowsAffected[0] === 0) throw new UserFacingError('Esa receta ya no existe.');
    }
  } catch (error) {
    // 2627 / 2601: el slug ya lo usa otra receta (índice único).
    const numero = (error as { number?: number })?.number;
    if (numero === 2627 || numero === 2601) {
      return { success: false, error: 'Ya hay otra receta con esa dirección. Cambia el título o la dirección.' };
    }
    if ((error as { number?: number })?.number === 208) {
      return { success: false, error: 'Falta crear la tabla de recetas: corre npm run db:migrar.' };
    }
    return toActionError(error, 'No se pudo guardar la receta. Intenta de nuevo.');
  }

  refrescar();
  redirect(`/admin/recetas?guardada=${id === null ? 'nueva' : 'editada'}`);
}

/** Oculta o vuelve a publicar una receta sin borrarla. */
export async function cambiarVisibilidadReceta(id: number, visible: boolean): Promise<ActionResult> {
  if (!(await isAdmin())) return UNAUTHORIZED;
  if (!isId(id) || typeof visible !== 'boolean') return { success: false, error: 'Datos inválidos.' };
  try {
    const pool = await getPool();
    await pool.request().input('id', sql.Int, id).input('visible', sql.Bit, visible)
      .query(`UPDATE Recetas SET visible = @visible, actualizada_en = SYSUTCDATETIME() WHERE id = @id`);
    refrescar();
    return { success: true };
  } catch (error) {
    return toActionError(error, 'No se pudo actualizar la receta.');
  }
}

/** Borra la receta definitivamente. La foto se queda en Cloudinary. */
export async function borrarReceta(id: number): Promise<ActionResult> {
  if (!(await isAdmin())) return UNAUTHORIZED;
  if (!isId(id)) return { success: false, error: 'Receta inválida.' };
  try {
    const pool = await getPool();
    await pool.request().input('id', sql.Int, id).query(`DELETE FROM Recetas WHERE id = @id`);
    refrescar();
    return { success: true };
  } catch (error) {
    return toActionError(error, 'No se pudo borrar la receta.');
  }
}
