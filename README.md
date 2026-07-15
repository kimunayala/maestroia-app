# MaestroIA

Estimador de materiales de construcción impulsado por Claude (Anthropic), con precios
en pesos chilenos (CLP) y desglose de IVA. Desarrollado por **AIKON** usando **Evoluzion
Arquitectura y Diseño** como caso de estudio.

Describe un proyecto en lenguaje natural — un domo geodésico, una casa modular, un
galpón industrial o una estructura de acuicultura — y MaestroIA devuelve una
estimación preliminar de materiales, organizada por categoría, con cantidades,
precios unitarios, subtotal, IVA y total.

## Stack

- **Frontend:** React 19 + Vite + Tailwind CSS v4
- **Backend:** Node.js + Express 5
- **IA:** API de Anthropic (Claude), llamada directa vía `fetch` (sin SDK, para
  mantener el proyecto liviano)
- **Despliegue:** Railway

## Estructura

```
maestroia-app/
├── client/          # Frontend React (Vite)
│   └── src/
│       ├── components/
│       ├── utils/
│       └── App.jsx
├── server/          # Backend Express
│   ├── index.js
│   └── claudeClient.js
├── package.json     # Orquesta build + start de ambos
└── railway.json     # Configuración de despliegue
```

## Desarrollo local

1. Clona el repo e instala dependencias:

   ```bash
   npm run install:all
   ```

2. Configura tu API key:

   ```bash
   cp server/.env.example server/.env
   # Edita server/.env y agrega tu ANTHROPIC_API_KEY
   ```

3. Corre backend y frontend en paralelo (dos terminales):

   ```bash
   npm run dev:server   # http://localhost:3001
   npm run dev:client   # http://localhost:5173 (con proxy a /api)
   ```

## Build de producción

```bash
npm run build   # instala deps y compila el frontend a client/dist
npm start       # sirve frontend + API desde un solo proceso Express
```

## Despliegue en Railway

1. Conecta el repo en Railway.
2. Define la variable de entorno `ANTHROPIC_API_KEY` en el proyecto de Railway.
3. Railway detecta `railway.json` y ejecuta automáticamente:
   - Build: `npm run build`
   - Start: `npm start`
4. Railway asigna `PORT` automáticamente; el servidor ya lo respeta (`process.env.PORT`).

## Notas

- Las estimaciones son referenciales, no reemplazan una cotización formal.
- El cálculo de IVA (19%) se hace en el backend sobre el subtotal devuelto por el modelo,
  no lo genera la IA directamente — así se evita que la IA calcule mal los totales.

---

© Evoluzion Arquitectura y Diseño — Región de Los Lagos, Chile. Un producto AIKON.
