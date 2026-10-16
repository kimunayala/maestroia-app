// server/index.js
require("dotenv").config();
const express = require("express");
const cors = require("cors");
const path = require("path");
const rateLimit = require("express-rate-limit");
const { generarEstimacion } = require("./claudeClient");

const app = express();
const PORT = process.env.PORT || 3001;
const APP_PASSCODE = process.env.APP_PASSCODE || "";

app.use(cors());
app.use(express.json());
// Confía en el proxy de Railway para obtener la IP real del cliente (necesario para el rate limit)
app.set("trust proxy", 1);

// --- Rate limiting: máximo 8 estimaciones cada 15 minutos por IP ---
const estimateLimiter = rateLimit({
  windowMs: 15 * 60 * 1000,
  max: 8,
  standardHeaders: true,
  legacyHeaders: false,
  message: {
    error:
      "Has alcanzado el límite de estimaciones por ahora (8 cada 15 minutos). Intenta nuevamente más tarde.",
  },
});

// --- Passcode simple: protege /api/estimar si APP_PASSCODE está configurado ---
function checkPasscode(req, res, next) {
  if (!APP_PASSCODE) return next(); // sin passcode configurado = acceso abierto
  const provided = req.headers["x-app-passcode"];
  if (provided && provided === APP_PASSCODE) return next();
  return res.status(401).json({ error: "Passcode incorrecto o faltante." });
}

// Le dice al frontend si debe mostrar la pantalla de passcode
app.get("/api/config", (req, res) => {
  res.json({ passcodeRequired: Boolean(APP_PASSCODE) });
});

app.post("/api/auth", (req, res) => {
  const { passcode } = req.body;
  if (!APP_PASSCODE) return res.json({ ok: true });
  if (passcode === APP_PASSCODE) return res.json({ ok: true });
  return res.status(401).json({ ok: false, error: "Passcode incorrecto." });
});

// --- API ---
app.post("/api/estimar", estimateLimiter, checkPasscode, async (req, res) => {
  const usageLogTime = new Date().toISOString();
  const clientIp = req.ip;
  const { descripcion, imagenes = [] } = req.body;

  if (!descripcion || typeof descripcion !== "string" || descripcion.trim().length < 5) {
    return res.status(400).json({
      error: "Por favor entrega una descripción del proyecto (mínimo 5 caracteres).",
    });
  }

  try {
    const estimacion = await generarEstimacion(descripcion.trim(), Array.isArray(imagenes) ? imagenes.slice(0, 4) : []);

    const IVA_RATE = 0.19;
    const itemsConTotales = (estimacion.items || []).map((item) => {
      const cantidad = Number(item.cantidad) || 0;
      const precioUnitario = Number(item.precio_unitario_clp) || 0;
      const subtotal = Math.round(cantidad * precioUnitario);
      return { ...item, cantidad, precio_unitario_clp: precioUnitario, subtotal_clp: subtotal };
    });

    const subtotalGeneral = itemsConTotales.reduce((acc, i) => acc + i.subtotal_clp, 0);
    const iva = Math.round(subtotalGeneral * IVA_RATE);
    const total = subtotalGeneral + iva;

    // Log de uso básico — visible en los logs de Railway para monitoreo manual.
    // El consumo real de tokens/costo se revisa en console.anthropic.com
    console.log(
      `[MaestroIA] ${usageLogTime} | IP: ${clientIp} | items: ${itemsConTotales.length} | descripción: "${descripcion.slice(0, 80)}"`
    );

    res.json({
      proyecto: estimacion.proyecto || "Proyecto sin nombre",
      items: itemsConTotales,
      notas_generales: estimacion.notas_generales || "",
      resumen: {
        subtotal_clp: subtotalGeneral,
        iva_clp: iva,
        iva_rate: IVA_RATE,
        total_clp: total,
      },
    });
  } catch (err) {
    console.error("Error generando estimación:", err.message);
    // No exponer detalles internos (ni keys ni mensajes de la API) al frontend
    const userMessage =
      err.message?.includes("No se pudo interpretar")
        ? "La IA devolvió una respuesta inesperada. Intenta con otra descripción."
        : err.message?.includes("Error de la API de Anthropic")
        ? "Error al contactar la IA. Intenta nuevamente en unos segundos."
        : "Error interno al generar la estimación. Intenta nuevamente.";
    res.status(500).json({ error: userMessage });
  }
});

app.get("/api/health", (req, res) => {
  res.json({ status: "ok", service: "MaestroIA API" });
});

// --- Servir frontend en producción ---
const clientDist = path.join(__dirname, "..", "client", "dist");
app.use(express.static(clientDist));
app.get("/*splat", (req, res) => {
  res.sendFile(path.join(clientDist, "index.html"));
});

app.listen(PORT, () => {
  console.log(`MaestroIA server corriendo en puerto ${PORT}`);
});
