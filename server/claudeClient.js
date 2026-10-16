// server/claudeClient.js
// Cliente ligero para la API de Anthropic (Claude), sin SDK externo,
// para mantener el proyecto liviano y fácil de desplegar en Railway.

const ANTHROPIC_API_URL = "https://api.anthropic.com/v1/messages";
const MODEL = process.env.CLAUDE_MODEL || "claude-sonnet-5";

/**
 * Llama a Claude para generar una estimación estructurada de materiales
 * a partir de una descripción de proyecto en lenguaje natural.
 * @param {string} descripcion - Descripción del proyecto (ej: "galpón de 200m2 en acero")
 * @returns {Promise<object>} objeto con { items: [...], notas: string }
 */
async function generarEstimacion(descripcion, imagenes = []) {
  const apiKey = process.env.ANTHROPIC_API_KEY;
  if (!apiKey) {
    throw new Error(
      "Falta ANTHROPIC_API_KEY en las variables de entorno del servidor."
    );
  }

  const systemPrompt = `Eres MaestroIA, un asistente experto en construcción y arquitectura en Chile, especializado en presupuestar materiales para proyectos como domos geodésicos, casas modulares, galpones, oficinas y estructuras de acuicultura en la Región de Los Lagos.

Dada una descripción de proyecto, responde ÚNICAMENTE con un objeto JSON válido (sin texto adicional, sin markdown, sin \`\`\`) con esta forma exacta:

{
  "proyecto": "string: nombre corto del proyecto",
  "items": [
    {
      "categoria": "string: ej. Estructura, Revestimiento, Fundaciones, Instalaciones",
      "material": "string: nombre del material o partida",
      "unidad": "string: ej. m2, m3, kg, un, ml",
      "cantidad": number,
      "precio_unitario_clp": number,
      "notas": "string breve o vacío"
    }
  ],
  "referencias_mo": {
    "tipo_trabajo": "string: descripción breve del tipo de trabajo detectado, ej. Pintura anticorrosiva rejas metálicas, Techado plancha zinc galvanizado, Albañilería bloques hormigón",
    "unidad_mo": "string: unidad más apropiada para cobrar la MO según el trabajo, ej. ml, m2, m3, global, un",
    "precio_mo_mercado_bajo": number,
    "precio_mo_mercado_alto": number,
    "nota": "string breve: contexto sobre cómo se cobra este trabajo en Chile (ej. en rejas se cobra por metro lineal, en pintura de muros por m2, etc.)"
  },
  "notas_generales": "string: supuestos y recomendaciones breves"
}

Reglas:
- Usa precios de referencia realistas para el mercado chileno actual (CLP), sabiendo que son estimaciones preliminares, no cotizaciones formales.
- Incluye entre 6 y 14 ítems relevantes según el tipo de proyecto.
- Los números deben ser números JSON válidos (sin puntos de miles, sin texto).
- No incluyas IVA en precio_unitario_clp (el cálculo de IVA se hace aparte).
- Incluye SIEMPRE el campo "referencias_mo". Analiza el tipo de trabajo para determinar la unidad correcta (metro lineal para rejas y cercos, m2 para pinturas de muros y techos, m3 para excavaciones, global para trabajos difíciles de medir) y entrega rangos de precio de mano de obra de mercado chileno vigente.
- Para precio_mo_mercado_bajo y precio_mo_mercado_alto: usa precios netos CLP por unidad_mo, sin IVA, realistas para el mercado actual (ej. pintura reja ml: 22000–35000, pintura muro m2: 4000–8000, techado zinc m2: 8000–15000).
- Responde solo el JSON, nada más.`;

  const response = await fetch(ANTHROPIC_API_URL, {
    method: "POST",
    headers: {
      "Content-Type": "application/json",
      "x-api-key": apiKey,
      "anthropic-version": "2023-06-01",
    },
    body: JSON.stringify({
      model: MODEL,
      max_tokens: 8000,
      system: systemPrompt,
      messages: [{
        role: "user",
        content: imagenes.length > 0
          ? [
              ...imagenes.map((b64) => ({
                type: "image",
                source: { type: "base64", media_type: "image/jpeg", data: b64 },
              })),
              { type: "text", text: descripcion },
            ]
          : descripcion,
      }],
    }),
  });

  if (!response.ok) {
    const errText = await response.text();
    throw new Error(`Error de la API de Anthropic (${response.status}): ${errText}`);
  }

  const data = await response.json();
  const textBlock = data.content?.find((b) => b.type === "text");
  if (!textBlock) {
    throw new Error("La respuesta de Claude no contiene texto.");
  }

  const cleaned = textBlock.text.replace(/```json|```/g, "").trim();

  let parsed;
  try {
    parsed = JSON.parse(cleaned);
  } catch (e) {
    throw new Error("No se pudo interpretar la respuesta de Claude como JSON: " + e.message);
  }

  return parsed;
}

module.exports = { generarEstimacion };
