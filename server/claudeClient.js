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
async function generarEstimacion(descripcion, imagenes = [], tipoCotizacion = "completo", unidadPrincipal = "") {
  const apiKey = process.env.ANTHROPIC_API_KEY;
  if (!apiKey) {
    throw new Error(
      "Falta ANTHROPIC_API_KEY en las variables de entorno del servidor."
    );
  }

  const instruccionesTipo = {
    solo_materiales: "Llena SOLO items_materiales (6–14 ítems). items_mo debe ser [] vacío. No incluyas referencias_mo.",
    solo_mo:         "Llena SOLO items_mo (4–10 partidas de mano de obra). items_materiales debe ser [] vacío. Incluye referencias_mo.",
    materiales_mo:   "Llena AMBOS arrays por separado: items_materiales con los materiales necesarios (6–14 ítems), items_mo con las partidas de mano de obra (4–10 partidas). Incluye referencias_mo.",
    completo:        "Llena AMBOS arrays: items_materiales con todos los materiales (6–14 ítems), items_mo con todas las partidas de trabajo (4–10 partidas). Incluye referencias_mo.",
  };

  const unidadInstruccion = unidadPrincipal
    ? `La unidad principal del trabajo es "${unidadPrincipal}" — úsala en los ítems relevantes de materiales y mano de obra.`
    : "Detecta la unidad apropiada (m2, ml, m3, global) según el tipo de trabajo.";

  const systemPrompt = `Eres MaestroIA, un asistente experto en construcción y arquitectura en Chile, especializado en presupuestar materiales y mano de obra para proyectos de construcción, mantención y remodelación.

Tipo de cotización solicitado: "${tipoCotizacion}"
${unidadInstruccion}

Responde ÚNICAMENTE con un objeto JSON válido (sin texto adicional, sin markdown, sin \`\`\`) con esta forma exacta:

{
  "proyecto": "string: nombre corto del proyecto",
  "items_materiales": [
    {
      "categoria": "string: ej. Estructura, Revestimiento, Fundaciones, Instalaciones, Pintura",
      "material": "string: nombre del material",
      "unidad": "string: m2, m3, kg, un, ml, lt, etc.",
      "cantidad": number,
      "precio_unitario_clp": number,
      "notas": "string breve o vacío"
    }
  ],
  "items_mo": [
    {
      "partida": "string: nombre de la partida de trabajo, ej. Pintura anticorrosiva reja, Instalación cubierta zinc",
      "unidad": "string: ml, m2, m3, hora, global",
      "cantidad": number,
      "precio_unitario_clp": number,
      "notas": "string breve o vacío"
    }
  ],
  "referencias_mo": {
    "tipo_trabajo": "string: descripción breve del tipo de trabajo detectado",
    "unidad_mo": "string: unidad más apropiada para cobrar la MO, ej. ml, m2, global",
    "precio_mo_mercado_bajo": number,
    "precio_mo_mercado_alto": number,
    "nota": "string breve: contexto sobre cómo se cobra este trabajo en Chile"
  },
  "notas_generales": "string: supuestos y recomendaciones breves"
}

Reglas generales:
- Usa precios de referencia realistas para el mercado chileno actual (CLP). Son estimaciones preliminares, no cotizaciones formales.
- Los números deben ser números JSON válidos (sin puntos de miles, sin texto).
- No incluyas IVA en los precios unitarios (el cálculo de IVA se hace aparte).
- Para items_mo, precio_unitario_clp es el valor de mano de obra por unidad (sin materiales).
- Para referencias_mo: precio_mo_mercado_bajo y precio_mo_mercado_alto son precios netos CLP por unidad_mo (ej. pintura reja ml: 22000–35000, pintura muro m2: 4000–8000, techado zinc m2: 8000–15000).

Instrucción específica para tipo "${tipoCotizacion}": ${instruccionesTipo[tipoCotizacion] || instruccionesTipo.completo}

Responde solo el JSON, nada más.`;

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
