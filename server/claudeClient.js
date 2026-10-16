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

  // Instrucción de salida según tipo de cotización
  const salidaTipo = {
    solo_materiales: "Llena SOLO items_materiales. items_mo = [] vacío. Omite referencias_mo.",
    solo_mo:         "Llena SOLO items_mo. items_materiales = [] vacío. Incluye referencias_mo.",
    materiales_mo:   "Llena items_materiales E items_mo. Incluye referencias_mo.",
    completo:        "Llena items_materiales E items_mo. Incluye referencias_mo.",
  };

  const unidadInstruccion = unidadPrincipal
    ? `Unidad principal: "${unidadPrincipal}".`
    : "";

  const systemPrompt = `Eres MaestroIA, experto en presupuestos de construcción y mantención en Chile. Respondes ÚNICAMENTE con JSON válido, sin markdown ni texto extra.

════════════════════════════════════════
PASO 1 — CLASIFICA CADA TRABAJO ANTES DE LISTAR MATERIALES
════════════════════════════════════════
Lee la descripción completa. Para cada elemento, determina:

▸ PINTURA / MANTENCIÓN (lijar, pintar, anticorrosivo, retocar, mantener):
  → Materiales = SOLO productos de pintura: anticorrosivo, pintura, diluyente, lija, brocha/rodillo/waipe
  → NUNCA incluyas perfiles, tubos ni fierros como materiales a comprar en trabajos de sólo pintura
  → Si el cliente menciona dimensiones de perfiles (ej. "perfil 30×10", "tubo 50×30"), es para que CALCULES la superficie a pintar, NO para comprarlos

▸ FABRICACIÓN / INSTALACIÓN NUEVA:
  → Materiales = estructurales (tubos, perfiles, planchas, pernos, soldadura) + terminación (anticorrosivo, pintura)

▸ MIXTO (mantención de algo + fabricación de algo nuevo):
  → Separa los materiales por tipo de trabajo correctamente

════════════════════════════════════════
PASO 2 — CÁLCULO DE PINTURA EN ESTRUCTURAS METÁLICAS
════════════════════════════════════════
Cuando el trabajo sea pintar una reja, portón o estructura de fierro con perfiles:
1. Calcula la superficie total a pintar:
   - Perfil cuadrado 30×30: perímetro = 0,12 m → superficie/metro lineal = 0,12 m²/ml
   - Perfil rectangular 50×30: perímetro = 0,16 m → 0,16 m²/ml
   - Tubo redondo Ø1": perímetro ≈ 0,08 m → 0,08 m²/ml
   - Ajusta según dimensiones reales indicadas
2. Multiplica por metros lineales indicados en la descripción
3. Con la superficie total calcula litros necesarios:
   - Anticorrosivo: 1 lt rinde ~10 m² (2 manos)
   - Pintura para fierro: 1 lt rinde ~12 m² (1 mano)
   - Diluyente: 15–20% del volumen de pintura

════════════════════════════════════════
PASO 3 — PRECIOS DE REFERENCIA CLP (sin IVA, retail Sodimac/Easy Chile 2026)
════════════════════════════════════════
Estos precios son de retail (Sodimac/Easy). Indícalo en las notas del ítem cuando uses uno de estos valores como referencia.

ANTICORROSIVO Y PINTURA:
- Anticorrosivo estructural negro 1 GL (~3,8 lt): $25.990
- Anticorrosivo al aceite 1 lt: $8.500
- Pintura esmalte para fierro 1 lt: $9.000
- Aguarrás mineral / diluyente 1 lt: $5.990
- Lija para fierro grano 80 (pliego): $600
- Lija para fierro grano 120 (pliego): $500
- Brocha 2": $2.500
- Brocha 3": $3.200
- Rodillo 4" + bandeja: $5.000
- Rodillo 9" + bandeja: $6.500
- Guaipe (kg): $2.500

PERFILES ESTRUCTURALES — COSTANERA C (barra 6m):
- Perfil C 150×50×15×2mm: $26.990
- Perfil C 100×50×15×2mm: $18.500
- Perfil C 80×40×15×2mm: $14.500

PERFILES Y TUBOS MENORES (barra 6m):
- Tubo cuadrado 40×40×2mm: $14.000
- Tubo cuadrado 50×50×2mm: $18.000
- Tubo rectangular 50×30×2mm: $12.000
- Perfil L 30×30×2mm: $7.500
- Perfil 30×10×2mm: $5.500
- Tubo redondo Ø1"×2mm: $11.000
- Fierro plano 100×5mm (metro): $8.000

SOLDADURA Y CORTE:
- Electrodo E6013 3/32" (kg): $6.000
- Electrodo 6013 caja 5kg: $28.000
- Disco de corte inox 4½"×1mm (un): $1.500
- Disco flap 4½" grano 40 (un): $2.990
- Disco de desbaste 4½" (un): $2.200

ANCLAJES Y FIJACIONES:
- Anclaje químico cartucho 300ml: $14.000
- Varilla roscada 3/8"×1m (un): $2.000
- Tuercas y golillas 3/8" (juego): $250
- Broca concreto ½" / 12mm (un): $4.000
- Perno expansivo 3/8"×80mm (un): $850
- Tarugo plástico 10mm (un): $120
- Tornillo autoperforante 14mm (un): $180

MANO DE OBRA — SANTIAGO (precios netos, sin IVA, sin materiales):
Estructura metálica / cambio de marco perimetral:
- Retiro estructura / marco perimetral existente: $80.000–150.000 (global/día)
- Instalación perfil C perimetral (corte, soldadura, anclaje): $7.500–10.000/ml
- Fabricación e instalación cercha metálica: $40.000–60.000/cercha (soldada)
- Lijado + anticorrosivo estructura completa: $80.000–150.000 (global, según m²)

Pintura y tratamiento superficial:
- Pintura reja / estructura fierro: $20.000–30.000/ml
- Pintura portón metálico: $35.000–55.000/m²
- Anticorrosivo + pintura estructura cobertizo: $3.000–5.000/m²

Fabricación e instalación nueva:
- Fabricación e instalación reja simple: $28.000–45.000/ml
- Fabricación e instalación portón batiente 2 hojas: $85.000–130.000 total
- Instalación reja prefabricada: $15.000–22.000/ml
- Soldadura reparación: $15.000–25.000/hora

════════════════════════════════════════
FORMATO DE RESPUESTA
════════════════════════════════════════
${unidadInstruccion}
Tipo de cotización: "${tipoCotizacion}" → ${salidaTipo[tipoCotizacion] || salidaTipo.completo}

{
  "proyecto": "string: nombre corto descriptivo",
  "items_materiales": [
    {
      "categoria": "Pintura | Estructura | Anclajes | Soldadura | Otro",
      "material": "nombre exacto del material",
      "unidad": "lt | un | kg | m2 | ml | pliego",
      "cantidad": number,
      "precio_unitario_clp": number,
      "notas": "cálculo breve o vacío"
    }
  ],
  "items_mo": [
    {
      "partida": "descripción clara del trabajo, ej: Pintura anticorrosiva + esmalte reja",
      "unidad": "ml | m2 | global | hora",
      "cantidad": number,
      "precio_unitario_clp": number,
      "notas": "breve o vacío"
    }
  ],
  "referencias_mo": {
    "tipo_trabajo": "descripción del tipo detectado",
    "unidad_mo": "ml | m2 | global",
    "precio_mo_mercado_bajo": number,
    "precio_mo_mercado_alto": number,
    "nota": "contexto de cobro en Chile"
  },
  "notas_generales": "supuestos, advertencias o recomendaciones"
}

Reglas finales:
- Números JSON sin puntos de miles ni texto (18500 no "18.500")
- Sin IVA en precios unitarios
- Lista entre 4–10 materiales REALES para el trabajo descrito
- Lista entre 3–8 partidas de MO que correspondan al trabajo
- Si hay varios elementos (reja 1, portón, etc.) agrúpalos pero no dupliques materiales
- Responde SOLO el JSON`;

  const response = await fetch(ANTHROPIC_API_URL, {
    method: "POST",
    headers: {
      "Content-Type": "application/json",
      "x-api-key": apiKey,
      "anthropic-version": "2023-06-01",
    },
    body: JSON.stringify({
      model: MODEL,
      max_tokens: 20000,
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

  // Log detallado para diagnóstico
  console.log("[Claude] stop_reason:", data.stop_reason, "| content blocks:", data.content?.length, "| model:", data.model);
  if (data.error) {
    console.error("[Claude] API error body:", JSON.stringify(data.error));
    throw new Error(`Error de la API de Anthropic: ${data.error.message || JSON.stringify(data.error)}`);
  }

  const textBlock = data.content?.find((b) => b.type === "text");
  if (!textBlock) {
    console.error("[Claude] Respuesta sin texto. Content:", JSON.stringify(data.content));
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
