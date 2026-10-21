# VIBEFIT

Tienda de suplementos, ropa de gym, accesorios y recetas fit, con panel de inventario.
Next.js 16 (App Router), React 19, Azure SQL (`mssql`), Azure AI Vision para OCR.

## Puesta en marcha

```bash
npm install
cp .env.example .env.local   # y llena los valores
npm run dev
```

`SESSION_SECRET` es obligatorio (mínimo 32 caracteres): firma la cookie del panel `/admin`.

## Scripts

| Comando | Qué hace |
| --- | --- |
| `npm run dev` / `build` / `start` | Desarrollo, build de producción y servidor |
| `npm run lint` · `npm run typecheck` | ESLint y TypeScript |
| `npm run db:migrar` | Crea las tablas de clientes, listas, avisos, demanda, solicitudes y reseñas (se puede repetir) |
| `npm run db:importar-catalogo -- --confirmar` | **Borra** SKUs/Productos e importa `scripts/data/catalogo.csv` |
| `npm run db:migrar-imagenes` | Sube a Cloudinary las imágenes de SKUs que aún no están ahí |
| `npm run db:migrar-imagenes-iherb` | Igual, desde `scripts/data/iherb-imagenes.csv` |
| `npm run db:migrar-logos` | Sube a Cloudinary los logos de marcas |

## Estructura

```
src/
  app/
    (tienda)/            # Rutas públicas: portada, suplementos, ropa, accesorios, recetas
      _components/       # Componentes privados de la portada (barra cargada)
    admin/               # Panel protegido (layout valida la sesión)
    login/               # Acceso + Server Actions de sesión
    layout.tsx           # Fuentes (Archivo + Barlow) y estilos globales
    globals.css          # Tokens de diseño (paleta, tipografía, espaciado)
  components/
    store/               # Header, carrito, tarjetas y filtros del catálogo
    recetas/             # Barra de macros y estilos de recetas
    admin/               # Escáner (código de barras + OCR)
  content/recetas.ts     # Recetas publicadas (agrega una nueva aquí)
  context/cart-context.tsx
  lib/                   # Utilidades compartidas (formato, validación, imágenes)
  server/
    db.ts                # Pool de Azure SQL + transacciones
    auth/                # Token firmado (HMAC) y capa de acceso (DAL)
    queries/             # Lecturas: catálogo público (con caché) y admin
    actions/             # Server Actions compartidas (pedido, OCR)
  proxy.ts               # Redirige /admin a /login sin sesión válida
  types/
scripts/                 # Scripts de base de datos y CSVs
```

## Seguridad

- `/admin` está protegido en tres capas: `src/proxy.ts`, el layout del panel y cada consulta/Server Action (`isAdmin()` / `verifyAdmin()`).
- La cookie de sesión está firmada y expira a las 8 horas; el login tiene límite de intentos.
- Todas las Server Actions validan sus datos en el servidor.
- Los pagos en línea están **bloqueados** (`NEXT_PUBLIC_PAGOS_ACTIVOS=false`): el carrito muestra "Próximamente" y el servidor rechaza pedidos. Antes de activarlos hay que conectar una pasarela de pago real.

## Antes de publicar

- Llena los datos del responsable en `src/content/legal.ts` (aparecen en `/privacidad`).
- Opcional: configura `RESEND_API_KEY`, `EMAIL_FROM` y `ADMIN_EMAIL` para recibir por correo las solicitudes y reseñas nuevas.

## Publicar una receta

Agrega un objeto al inicio de `RECETAS` en `src/content/recetas.ts` (título, objetivo `definicion` o `volumen`, macros por porción, ingredientes y pasos). La página se genera sola en `/recetas/<slug>`.
