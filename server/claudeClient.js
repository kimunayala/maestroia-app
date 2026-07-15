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
async function generarEstimacion(descripcion) {
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
  "notas_generales": "string: supuestos y recomendaciones breves"
}

Reglas:
- Usa precios de referencia realistas para el mercado chileno actual (CLP), sabiendo que son estimaciones preliminares, no cotizaciones formales.
- Incluye entre 6 y 14 ítems relevantes según el tipo de proyecto.
- Los números deben ser números JSON válidos (sin puntos de miles, sin texto).
- No incluyas IVA en precio_unitario_clp (el cálculo de IVA se hace aparte).
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
      max_tokens: 4000,
      system: systemPrompt,
      messages: [{ role: "user", content: descripcion }],
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
