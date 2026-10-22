import type { NextConfig } from 'next';

// Encabezados de seguridad para todas las rutas.
const securityHeaders = [
  { key: 'X-Content-Type-Options', value: 'nosniff' },
  { key: 'Referrer-Policy', value: 'strict-origin-when-cross-origin' },
  { key: 'X-Frame-Options', value: 'DENY' },
  { key: 'Content-Security-Policy', value: "frame-ancestors 'none'; base-uri 'self'; form-action 'self'" },
  // La cámara solo se usa en el escáner del panel admin.
  { key: 'Permissions-Policy', value: 'camera=(self), microphone=(), geolocation=(), payment=()' },
  { key: 'Strict-Transport-Security', value: 'max-age=63072000; includeSubDomains' },
];

const nextConfig: NextConfig = {
  poweredByHeader: false,
  // mssql no se empaqueta: se carga una sola vez desde node_modules.
  // Si se empaqueta, páginas y Server Actions reciben copias distintas y
  // `sql.Int` deja de reconocerse ("type.validate is not a function").
  serverExternalPackages: ['mssql', 'cloudinary'],
  experimental: {
    serverActions: {
      // Fotos de recetas: el navegador las reduce antes de subir; 4 MB deja margen.
      bodySizeLimit: '4mb',
    },
  },
  // Permite probar en el celular dentro de la red local (solo desarrollo).
  allowedDevOrigins: ['192.168.0.5'],

  images: {
    formats: ['image/avif', 'image/webp'],
    // Hosts que pasan por el optimizador de imágenes.
    // Mantener sincronizado con OPTIMIZED_IMAGE_HOSTS en src/lib/images.ts.
    remotePatterns: [
      { protocol: 'https', hostname: 'res.cloudinary.com' },
      { protocol: 'https', hostname: 'cdn.shopify.com' },
    ],
  },

  async headers() {
    return [{ source: '/:path*', headers: securityHeaders }];
  },
};

export default nextConfig;
