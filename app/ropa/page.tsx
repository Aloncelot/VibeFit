import { conectarDB } from '@/lib/db';
import RopaClient from './RopaClient';

// Definimos los tipos para el servidor
interface RopaRaw {
    producto_id: number;
    producto_nombre: string;
    marca: string;
    genero: string;
    categoria: string;
    precio: number;
    color: string;
    talla: string;
    stock: number;
    sku_id: number;
    imagen_url: string;
}

async function getGymWearData() {
    const pool = await conectarDB();

    // 1. Traemos solo las marcas que tienen productos de ropa y mapeamos sus logos locales
    const marcasResult = await pool.request().query(`
    SELECT DISTINCT m.id, m.nombre, 
    CASE 
        WHEN m.nombre = 'GYMSHARK' THEN '/Gymshark.webp'
        WHEN m.nombre = 'YOUNGLA' THEN '/youngla_logo.webp'
        WHEN m.nombre = 'DARC SPORT' THEN '/darcsport.jpg'
        ELSE '/Vibefit-logo.png' 
    END as logo_url
    FROM Marcas m<
    JOIN Productos p ON m.id = p.marca_id
    WHERE p.categoria IN ('TOPS', 'BOTTOMS', 'ACCESORIOS')
  `);

    // 2. Traemos toda la data de la ropa "plana"
    const productosResult = await pool.request().query(`
    SELECT 
      p.id as producto_id, 
      p.nombre as producto_nombre, 
      m.nombre as marca, 
      p.genero, 
      p.categoria, 
      s.precio_venta as precio,
      s.color, 
      s.tamano as talla, 
      s.stock, 
      s.id as sku_id,
      img.imagen_url
    FROM Productos p
    JOIN Marcas m ON p.marca_id = m.id
    JOIN SKUs s ON p.id = s.producto_id
    LEFT JOIN Imagenes_SKU img ON s.id = img.sku_id
    WHERE p.categoria IN ('TOPS', 'BOTTOMS', 'ACCESORIOS')
    ORDER BY p.id, s.color, img.orden
  `);

    const rawData: RopaRaw[] = productosResult.recordset;

    // 3. Agrupamos los datos planos en la estructura anidada que espera tu RopaClient
    const productosMap = new Map<number, any>();

    rawData.forEach(row => {
        if (!productosMap.has(row.producto_id)) {
            productosMap.set(row.producto_id, {
                id: row.producto_id,
                nombre: row.producto_nombre,
                marca: row.marca,
                genero: row.genero,
                categoria: row.categoria,
                precio: row.precio,
                coloresMap: new Map<string, any>() // Mapa temporal para agrupar por color
            });
        }

        const producto = productosMap.get(row.producto_id);

        if (!producto.coloresMap.has(row.color)) {
            producto.coloresMap.set(row.color, {
                nombre: row.color,
                tallas: [],
                imagenesSet: new Set<string>() // Set para evitar imágenes duplicadas en el join
            });
        }

        const colorObj = producto.coloresMap.get(row.color);

        // Agregar talla si no existe
        if (!colorObj.tallas.some((t: any) => t.talla === row.talla)) {
            colorObj.tallas.push({ talla: row.talla, stock: row.stock, sku_id: row.sku_id });
        }

        // Agregar imagen al Set
        if (row.imagen_url) {
            colorObj.imagenesSet.add(row.imagen_url);
        }
    });

    // Convertimos los Mapas a Arrays limpios
    const productosFormateados = Array.from(productosMap.values()).map(p => ({
        ...p,
        colores: Array.from(p.coloresMap.values()).map((c: any) => ({
            nombre: c.nombre,
            tallas: c.tallas,
            imagenes: Array.from(c.imagenesSet)
        }))
    }));

    // Eliminamos coloresMap del resultado final
    productosFormateados.forEach(p => delete p.coloresMap);

    return {
        marcas: marcasResult.recordset,
        productos: productosFormateados
    };
}

export const metadata = {
    title: 'Gym Wear | VIBEFIT',
    description: 'Premium Gym Apparel: Gymshark, YoungLA, Darc Sport.',
};

export default async function RopaPage() {
    const { marcas, productos } = await getGymWearData();

    return (
        <main style={{ minHeight: '100vh', background: '#050505' }}>
            {/* Pasamos los datos reales al cliente */}
            <RopaClient initialMarcas={marcas} initialProducts={productos} />
        </main>
    );
}