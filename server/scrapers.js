// server/scrapers.js — Búsqueda de precios en Sodimac CL y Easy CL
const axios = require("axios");

const TIMEOUT = 9000;
const HEADERS = {
  "User-Agent":
    "Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/124.0.0.0 Safari/537.36",
  Accept: "application/json, text/html, */*",
  "Accept-Language": "es-CL,es;q=0.9",
  "Cache-Control": "no-cache",
};

// --- Easy CL (VTEX) ---
async function buscarEasy(query) {
  try {
    const url = `https://www.easy.cl/api/catalog_system/pub/products/search?ft=${encodeURIComponent(
      query
    )}&_from=0&_to=4`;
    const { data } = await axios.get(url, { headers: HEADERS, timeout: TIMEOUT });
    if (!Array.isArray(data)) return [];

    return data
      .map((p) => {
        const item = p.items?.[0];
        const oferta = item?.sellers?.[0]?.commertialOffer;
        const precio = oferta?.Price;
        if (!precio) return null;
        return {
          tienda: "Easy",
          nombre: p.productName,
          precio: Math.round(precio),
          unidad: item?.unitMultiplier > 1 ? `x${item.unitMultiplier}` : "",
          url: `https://www.easy.cl/${p.linkText}/p`,
        };
      })
      .filter(Boolean)
      .slice(0, 3);
  } catch (e) {
    console.warn("[Easy scraper]", e.message);
    return [];
  }
}

// --- Sodimac CL ---
// Sodimac usa Oracle Commerce. Intentamos extraer JSON embebido en la página
// (estado inicial del store React/Next que viene en el HTML del SSR).
async function buscarSodimac(query) {
  try {
    const url = `https://www.sodimac.cl/sodimac-cl/search?Ntt=${encodeURIComponent(query)}`;
    const { data: html } = await axios.get(url, {
      headers: { ...HEADERS, Accept: "text/html" },
      timeout: TIMEOUT,
    });

    // Buscar JSON embebido en script __NEXT_DATA__ o window.__INITIAL_STATE__
    let productos = [];

    // Intento 1: __NEXT_DATA__
    const nextMatch = html.match(/<script id="__NEXT_DATA__" type="application\/json">([^<]+)<\/script>/);
    if (nextMatch) {
      try {
        const nextData = JSON.parse(nextMatch[1]);
        // La estructura varía pero los productos suelen estar en props.pageProps.results
        const results =
          nextData?.props?.pageProps?.results ||
          nextData?.props?.pageProps?.initialData?.results ||
          [];
        productos = results
          .slice(0, 3)
          .map((p) => {
            const precio = p.price || p.listPrice || p.offerPrice;
            if (!precio) return null;
            return {
              tienda: "Sodimac",
              nombre: p.displayName || p.name || p.title,
              precio: Math.round(Number(precio)),
              unidad: "",
              url: p.pdpUrl
                ? `https://www.sodimac.cl${p.pdpUrl}`
                : `https://www.sodimac.cl/sodimac-cl/search?Ntt=${encodeURIComponent(query)}`,
            };
          })
          .filter(Boolean);
      } catch (_) {}
    }

    // Intento 2: JSON inline con precio_lista o listPrice en el HTML
    if (!productos.length) {
      const precioMatches = [...html.matchAll(/"listPrice"\s*:\s*(\d+)/g)];
      const nombreMatches = [...html.matchAll(/"displayName"\s*:\s*"([^"]+)"/g)];
      if (precioMatches.length && nombreMatches.length) {
        for (let i = 0; i < Math.min(3, precioMatches.length); i++) {
          productos.push({
            tienda: "Sodimac",
            nombre: nombreMatches[i]?.[1] || query,
            precio: Math.round(Number(precioMatches[i][1])),
            unidad: "",
            url: `https://www.sodimac.cl/sodimac-cl/search?Ntt=${encodeURIComponent(query)}`,
          });
        }
      }
    }

    return productos;
  } catch (e) {
    console.warn("[Sodimac scraper]", e.message);
    return [];
  }
}

// Cache simple en memoria (5 minutos) para no martillar los sitios
const cache = new Map();
const CACHE_TTL = 5 * 60 * 1000;

async function buscarPrecios(query) {
  const key = query.toLowerCase().trim();
  const cached = cache.get(key);
  if (cached && Date.now() - cached.ts < CACHE_TTL) return cached.data;

  const [easy, sodimac] = await Promise.all([buscarEasy(key), buscarSodimac(key)]);
  const resultado = { easy, sodimac, query: key, timestamp: new Date().toISOString() };
  cache.set(key, { ts: Date.now(), data: resultado });
  return resultado;
}

module.exports = { buscarPrecios };
