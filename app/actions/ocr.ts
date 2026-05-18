// app/actions/ocr.ts
'use server';

import createImageAnalysisClient, { isUnexpected } from '@azure-rest/ai-vision-image-analysis';

// Inicializamos las credenciales desde las variables de entorno seguras del servidor
const endpoint = process.env.AZURE_VISION_ENDPOINT || '';
const key = process.env.AZURE_VISION_KEY || '';

export async function analizarEtiquetaOCR(base64Image: string): Promise<{ success: boolean; texto?: string; error?: string }> {
    try {
        if (!endpoint || !key) {
            throw new Error("Faltan las credenciales de Azure Vision en el servidor.");
        }

        const cleanBase64 = base64Image.replace(/^data:image\/\w+;base64,/, "");
        const imageBuffer = Buffer.from(cleanBase64, 'base64');

        // SOLUCIÓN: Pasamos el objeto con la estructura de la interfaz directamente
        const client = createImageAnalysisClient(endpoint, { key: key });

        // 4. Disparar la petición analítica pidiendo explícitamente la característica 'Read' (OCR)
        const result = await client.path('/imageanalysis:analyze').post({
            body: imageBuffer,
            queryParameters: {
                features: ['Read'] // Activamos únicamente el reconocimiento de texto de alta precisión
            },
            contentType: 'application/octet-stream' // Le indicamos que le mandamos un archivo binario crudo
        });

        // 5. Validar la respuesta del servidor de Azure
        if (isUnexpected(result)) {
            throw new Error(`Azure respondió con error: ${result.body.error?.message || result.status}`);
        }

        // 6. Extraer y formatear el texto detectado
        const readResult = result.body.readResult;
        if (!readResult || !readResult.blocks || readResult.blocks.length === 0) {
            return { success: true, texto: "" }; // No se detectó texto en la foto
        }

        // Unimos todas las líneas de texto leídas en un solo string separado por saltos de línea
        const lineasDetectadas: string[] = [];
        for (const block of readResult.blocks) {
            for (const line of block.lines) {
                lineasDetectadas.push(line.text);
            }
        }

        const textoCompleto = lineasDetectadas.join('\n');

        return {
            success: true,
            texto: textoCompleto
        };

    } catch (error: unknown) {
        console.error("Error duro en Server Action OCR:", error);
        return {
            success: false,
            error: error instanceof Error ? error.message : "Error desconocido procesando OCR."
        };
    }
}