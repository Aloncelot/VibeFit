'use client';

import { useEffect, useRef, useState, useTransition } from 'react';
import Link from 'next/link';
import { ArrowDown, ArrowUp, ImagePlus, Loader2, Plus, Save, Trash2, X } from 'lucide-react';
import { OBJETIVOS, kcalDeMacros, slugify, type RecetaAdmin } from '@/content/recetas';
import MacroBar from '@/components/recetas/macro-bar';
import { guardarReceta } from './actions';
import recetaStyles from '@/components/recetas/recetas.module.css';
import styles from './recetas-admin.module.css';

type FilaIngrediente = { key: number; cantidad: string; ingrediente: string };
type FilaPaso = { key: number; texto: string };

const FOTO_LADO_MAX = 1600;

let siguienteKey = 1;
const nuevaKey = () => siguienteKey++;

/** Reduce la foto en el navegador antes de subirla: sube más rápido y no rebasa el límite del servidor. */
async function reducirFoto(archivo: File): Promise<File> {
  try {
    const bitmap = await createImageBitmap(archivo);
    const escala = Math.min(1, FOTO_LADO_MAX / Math.max(bitmap.width, bitmap.height));
    const canvas = document.createElement('canvas');
    canvas.width = Math.round(bitmap.width * escala);
    canvas.height = Math.round(bitmap.height * escala);
    canvas.getContext('2d')?.drawImage(bitmap, 0, 0, canvas.width, canvas.height);
    bitmap.close();
    const blob = await new Promise<Blob | null>((resolve) => canvas.toBlob(resolve, 'image/webp', 0.85));
    if (!blob || blob.size >= archivo.size) return archivo;
    return new File([blob], 'receta.webp', { type: 'image/webp' });
  } catch {
    return archivo; // el servidor valida y avisa si no sirve
  }
}

function hoy(): string {
  const d = new Date();
  return `${d.getFullYear()}-${String(d.getMonth() + 1).padStart(2, '0')}-${String(d.getDate()).padStart(2, '0')}`;
}

export default function RecetaForm({ receta }: { receta?: RecetaAdmin }) {
  const [isPending, startTransition] = useTransition();
  const [error, setError] = useState<string | null>(null);
  const errorRef = useRef<HTMLParagraphElement>(null);

  const [titulo, setTitulo] = useState(receta?.titulo ?? '');
  const [slug, setSlug] = useState(receta?.slug ?? '');
  const [slugEditado, setSlugEditado] = useState(Boolean(receta));
  const [resumen, setResumen] = useState(receta?.resumen ?? '');

  const [macros, setMacros] = useState({
    kcal: receta ? String(receta.macros.kcal) : '',
    proteina: receta ? String(receta.macros.proteina) : '',
    carbohidratos: receta ? String(receta.macros.carbohidratos) : '',
    grasa: receta ? String(receta.macros.grasa) : '',
  });

  const [ingredientes, setIngredientes] = useState<FilaIngrediente[]>(() =>
    receta?.ingredientes.length
      ? receta.ingredientes.map((i) => ({ key: nuevaKey(), ...i }))
      : [1, 2, 3].map(() => ({ key: nuevaKey(), cantidad: '', ingrediente: '' })),
  );
  const [pasos, setPasos] = useState<FilaPaso[]>(() =>
    receta?.pasos.length
      ? receta.pasos.map((texto) => ({ key: nuevaKey(), texto }))
      : [1, 2].map(() => ({ key: nuevaKey(), texto: '' })),
  );
  const [enfocar, setEnfocar] = useState<number | null>(null);

  const [fotoActual, setFotoActual] = useState<string | null>(receta?.imagen ?? null);
  const [fotoNueva, setFotoNueva] = useState<{ archivo: File; url: string } | null>(null);
  const fotoInput = useRef<HTMLInputElement>(null);

  // Libera la vista previa de la foto al cambiarla o al salir.
  useEffect(() => () => {
    if (fotoNueva) URL.revokeObjectURL(fotoNueva.url);
  }, [fotoNueva]);

  useEffect(() => {
    if (error) errorRef.current?.focus();
  }, [error]);

  const slugFinal = slugEditado ? slug : slugify(titulo);
  const n = (v: string) => (v.trim() === '' ? 0 : Number(v) || 0);
  const estimado = kcalDeMacros({ proteina: n(macros.proteina), carbohidratos: n(macros.carbohidratos), grasa: n(macros.grasa) });
  const kcal = n(macros.kcal);
  const diferencia = kcal > 0 && estimado > 0 ? Math.abs(kcal - estimado) / estimado : 0;
  const hayMacros = estimado > 0;

  const setMacro = (campo: keyof typeof macros) => (e: React.ChangeEvent<HTMLInputElement>) =>
    setMacros((m) => ({ ...m, [campo]: e.target.value }));

  const agregarIngrediente = () => {
    const key = nuevaKey();
    setIngredientes((l) => [...l, { key, cantidad: '', ingrediente: '' }]);
    setEnfocar(key);
  };
  const agregarPaso = () => {
    const key = nuevaKey();
    setPasos((l) => [...l, { key, texto: '' }]);
    setEnfocar(key);
  };
  const mover = <T,>(lista: T[], i: number, delta: number): T[] => {
    const copia = [...lista];
    const [item] = copia.splice(i, 1);
    copia.splice(i + delta, 0, item);
    return copia;
  };

  const elegirFoto = (e: React.ChangeEvent<HTMLInputElement>) => {
    const archivo = e.target.files?.[0];
    if (!archivo) return;
    setFotoNueva({ archivo, url: URL.createObjectURL(archivo) });
  };
  const quitarFoto = () => {
    setFotoNueva(null);
    setFotoActual(null);
    if (fotoInput.current) fotoInput.current.value = '';
  };

  const onSubmit = (e: React.FormEvent<HTMLFormElement>) => {
    e.preventDefault();
    const fd = new FormData(e.currentTarget);
    setError(null);
    startTransition(async () => {
      fd.delete('foto');
      if (fotoNueva) fd.set('foto', await reducirFoto(fotoNueva.archivo));
      if (receta?.imagen && !fotoActual && !fotoNueva) fd.set('quitarFoto', 'on');
      fd.set('slug', slugFinal);
      // Si la acción guarda bien, redirige a la lista; solo regresa cuando hay error.
      const res = await guardarReceta(fd);
      if (res && !res.success) setError(res.error);
    });
  };

  const preview = fotoNueva?.url ?? fotoActual;

  return (
    <form className={styles.form} onSubmit={onSubmit}>
      {receta && <input type="hidden" name="id" value={receta.id} />}

      <div className={styles.main}>
        {/* ---------- Datos generales ---------- */}
        <fieldset className={styles.section}>
          <legend>Datos generales</legend>

          <label className={styles.field}>
            <span>Título</span>
            <input name="titulo" required maxLength={120} value={titulo} onChange={(e) => setTitulo(e.target.value)} placeholder="Ej. Tacos de pescado al pastor" />
          </label>

          <label className={styles.field}>
            <span>
              Dirección <small>se genera sola desde el título</small>
            </span>
            <div className={styles.slug}>
              <span aria-hidden>/recetas/</span>
              <input
                value={slugFinal}
                maxLength={90}
                onChange={(e) => {
                  setSlugEditado(true);
                  setSlug(e.target.value);
                }}
                onBlur={() => setSlug(slugify(slugFinal))}
                aria-describedby="slug-ayuda"
                placeholder="tacos-de-pescado-al-pastor"
              />
            </div>
            <small id="slug-ayuda">Solo minúsculas, números y guiones. Si la cambias, los enlaces viejos a esta receta dejan de funcionar.</small>
          </label>

          <div className={styles.field}>
            <span id="objetivo-label">Objetivo</span>
            <div className={styles.segmented} role="radiogroup" aria-labelledby="objetivo-label">
              {(Object.keys(OBJETIVOS) as (keyof typeof OBJETIVOS)[]).map((o) => (
                <label key={o}>
                  <input type="radio" name="objetivo" value={o} defaultChecked={(receta?.objetivo ?? 'definicion') === o} required />
                  <span>
                    <strong>{OBJETIVOS[o].label}</strong>
                    <small>{OBJETIVOS[o].descripcion}</small>
                  </span>
                </label>
              ))}
            </div>
          </div>

          <label className={styles.field}>
            <span>
              Resumen <small className={resumen.length > 280 ? styles.warn : undefined}>{resumen.length}/300</small>
            </span>
            <textarea
              name="resumen"
              required
              maxLength={300}
              rows={2}
              value={resumen}
              onChange={(e) => setResumen(e.target.value)}
              placeholder="Una línea que diga por qué vale la pena: proteína, calorías, tiempo."
            />
          </label>

          <div className={styles.grid3}>
            <label className={styles.field}>
              <span>Fecha de publicación</span>
              <input type="date" name="publicada" required defaultValue={receta?.publicada ?? hoy()} />
            </label>
            <label className={styles.field}>
              <span>Tiempo (min)</span>
              <input type="number" name="tiempoMin" required min={1} max={600} inputMode="numeric" defaultValue={receta?.tiempoMin ?? ''} />
            </label>
            <label className={styles.field}>
              <span>Porciones</span>
              <input type="number" name="porciones" required min={1} max={50} inputMode="numeric" defaultValue={receta?.porciones ?? 1} />
            </label>
          </div>
        </fieldset>

        {/* ---------- Macros ---------- */}
        <fieldset className={styles.section}>
          <legend>Macros por porción</legend>
          <div className={styles.grid4}>
            <label className={styles.field}>
              <span>Proteína (g)</span>
              <input type="number" name="proteina" required min={0} max={500} inputMode="numeric" value={macros.proteina} onChange={setMacro('proteina')} />
            </label>
            <label className={styles.field}>
              <span>Carbohidratos (g)</span>
              <input type="number" name="carbohidratos" required min={0} max={800} inputMode="numeric" value={macros.carbohidratos} onChange={setMacro('carbohidratos')} />
            </label>
            <label className={styles.field}>
              <span>Grasa (g)</span>
              <input type="number" name="grasa" required min={0} max={400} inputMode="numeric" value={macros.grasa} onChange={setMacro('grasa')} />
            </label>
            <label className={styles.field}>
              <span>Calorías</span>
              <input type="number" name="kcal" required min={0} max={5000} inputMode="numeric" value={macros.kcal} onChange={setMacro('kcal')} />
            </label>
          </div>
          {hayMacros && (
            <p className={diferencia > 0.1 ? `${styles.hint} ${styles.warn}` : styles.hint}>
              Con esos macros salen unas <strong className="num">{estimado} kcal</strong>.
              {diferencia > 0.1 && ' Las calorías capturadas no cuadran por más de 10 %.'}{' '}
              {kcal !== estimado && (
                <button type="button" className={styles.inlineBtn} onClick={() => setMacros((m) => ({ ...m, kcal: String(estimado) }))}>
                  Usar {estimado}
                </button>
              )}
            </p>
          )}
        </fieldset>

        {/* ---------- Ingredientes ---------- */}
        <fieldset className={styles.section}>
          <legend>Ingredientes</legend>
          <p className={styles.hint}>Enter en el último ingrediente agrega otra fila. Las filas vacías no se guardan.</p>
          <ol className={styles.rows}>
            {ingredientes.map((fila, i) => (
              <li key={fila.key} className={styles.ingRow}>
                <input
                  name="ing_cantidad"
                  aria-label={`Cantidad del ingrediente ${i + 1}`}
                  placeholder="60 g"
                  maxLength={60}
                  value={fila.cantidad}
                  autoFocus={enfocar === fila.key}
                  onChange={(e) => setIngredientes((l) => l.map((x) => (x.key === fila.key ? { ...x, cantidad: e.target.value } : x)))}
                />
                <input
                  name="ing_nombre"
                  aria-label={`Ingrediente ${i + 1}`}
                  placeholder="avena en hojuelas"
                  maxLength={120}
                  value={fila.ingrediente}
                  onChange={(e) => setIngredientes((l) => l.map((x) => (x.key === fila.key ? { ...x, ingrediente: e.target.value } : x)))}
                  onKeyDown={(e) => {
                    if (e.key === 'Enter') {
                      e.preventDefault();
                      if (i === ingredientes.length - 1) agregarIngrediente();
                    }
                  }}
                />
                <button
                  type="button"
                  className={styles.iconBtn}
                  aria-label={`Quitar ingrediente ${i + 1}`}
                  disabled={ingredientes.length === 1}
                  onClick={() => setIngredientes((l) => l.filter((x) => x.key !== fila.key))}
                >
                  <X size={18} aria-hidden />
                </button>
              </li>
            ))}
          </ol>
          <button type="button" className={`btn btn-outline ${styles.add}`} onClick={agregarIngrediente} disabled={ingredientes.length >= 40}>
            <Plus size={18} aria-hidden /> Agregar ingrediente
          </button>
        </fieldset>

        {/* ---------- Pasos ---------- */}
        <fieldset className={styles.section}>
          <legend>Preparación</legend>
          <ol className={styles.rows}>
            {pasos.map((fila, i) => (
              <li key={fila.key} className={styles.stepRow}>
                <span className={styles.stepNum} aria-hidden>
                  {i + 1}
                </span>
                <textarea
                  name="paso"
                  aria-label={`Paso ${i + 1}`}
                  rows={2}
                  maxLength={600}
                  value={fila.texto}
                  autoFocus={enfocar === fila.key}
                  placeholder={i === 0 ? 'Licúa la avena con la leche…' : 'Siguiente paso'}
                  onChange={(e) => setPasos((l) => l.map((x) => (x.key === fila.key ? { ...x, texto: e.target.value } : x)))}
                />
                <div className={styles.stepTools}>
                  <button type="button" className={styles.iconBtn} aria-label={`Subir paso ${i + 1}`} disabled={i === 0} onClick={() => setPasos((l) => mover(l, i, -1))}>
                    <ArrowUp size={16} aria-hidden />
                  </button>
                  <button
                    type="button"
                    className={styles.iconBtn}
                    aria-label={`Bajar paso ${i + 1}`}
                    disabled={i === pasos.length - 1}
                    onClick={() => setPasos((l) => mover(l, i, 1))}
                  >
                    <ArrowDown size={16} aria-hidden />
                  </button>
                  <button
                    type="button"
                    className={styles.iconBtn}
                    aria-label={`Quitar paso ${i + 1}`}
                    disabled={pasos.length === 1}
                    onClick={() => setPasos((l) => l.filter((x) => x.key !== fila.key))}
                  >
                    <Trash2 size={16} aria-hidden />
                  </button>
                </div>
              </li>
            ))}
          </ol>
          <button type="button" className={`btn btn-outline ${styles.add}`} onClick={agregarPaso} disabled={pasos.length >= 30}>
            <Plus size={18} aria-hidden /> Agregar paso
          </button>

          <label className={styles.field}>
            <span>
              Consejo <small>opcional</small>
            </span>
            <textarea name="consejo" rows={2} maxLength={400} defaultValue={receta?.consejo ?? ''} placeholder="Un tip que evite el error más común." />
          </label>
        </fieldset>
      </div>

      {/* ---------- Columna lateral: foto, publicación y guardar ---------- */}
      <aside className={styles.side}>
        <fieldset className={styles.section}>
          <legend>Foto</legend>
          <div className={styles.photo}>
            {preview ? (
              // eslint-disable-next-line @next/next/no-img-element -- vista previa local (blob:) o URL ya guardada
              <img src={preview} alt="Vista previa de la foto de la receta" />
            ) : (
              <span className={styles.photoEmpty}>
                <ImagePlus size={32} aria-hidden />
                Sin foto
              </span>
            )}
          </div>
          <input ref={fotoInput} id="foto" type="file" name="foto" accept="image/jpeg,image/png,image/webp" className="visually-hidden" onChange={elegirFoto} />
          <div className={styles.photoActions}>
            <label htmlFor="foto" className="btn btn-outline">
              {preview ? 'Cambiar foto' : 'Elegir foto'}
            </label>
            {preview && (
              <button type="button" className={styles.textDanger} onClick={quitarFoto}>
                Quitar
              </button>
            )}
          </div>
          <small className={styles.hint}>JPG, PNG o WebP. Se guarda en Cloudinary. Horizontal se ve mejor.</small>
        </fieldset>

        <fieldset className={styles.section}>
          <legend>Vista rápida</legend>
          <p className={styles.previewTitle}>{titulo || 'Título de la receta'}</p>
          {hayMacros ? (
            <div className={`${recetaStyles.panel} ${styles.previewMacros}`}>
              <MacroBar macros={{ kcal: kcal || estimado, proteina: n(macros.proteina), carbohidratos: n(macros.carbohidratos), grasa: n(macros.grasa) }} />
            </div>
          ) : (
            <p className={styles.hint}>Captura los macros para ver la barra.</p>
          )}
          <label className={styles.check}>
            <input type="checkbox" name="visible" defaultChecked={receta?.visible ?? true} />
            <span>Publicada en la tienda</span>
          </label>
        </fieldset>

        <div className={styles.submit}>
          {error && (
            <p ref={errorRef} tabIndex={-1} role="alert" className={styles.error}>
              {error}
            </p>
          )}
          <button type="submit" className="btn btn-primary" disabled={isPending}>
            {isPending ? <Loader2 size={18} className="spin" aria-hidden /> : <Save size={18} aria-hidden />}
            {isPending ? 'Guardando…' : receta ? 'Guardar cambios' : 'Publicar receta'}
          </button>
          <Link href="/admin/recetas" className={styles.cancel}>
            Cancelar
          </Link>
        </div>
      </aside>
    </form>
  );
}
