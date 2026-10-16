import { useState, useRef } from "react";

const MAX_FOTOS = 4;
const MAX_PX = 1024;
const QUALITY = 0.75;

async function comprimirImagen(file) {
  return new Promise((resolve) => {
    const img = new Image();
    const url = URL.createObjectURL(file);
    img.onload = () => {
      URL.revokeObjectURL(url);
      const scale = Math.min(1, MAX_PX / Math.max(img.width, img.height));
      const w = Math.round(img.width * scale);
      const h = Math.round(img.height * scale);
      const canvas = document.createElement("canvas");
      canvas.width = w;
      canvas.height = h;
      canvas.getContext("2d").drawImage(img, 0, 0, w, h);
      const data = canvas.toDataURL("image/jpeg", QUALITY);
      resolve(data.split(",")[1]); // solo el base64
    };
    img.src = url;
  });
}

const TIPOS_COTIZACION = [
  { value: "solo_materiales", label: "Solo materiales" },
  { value: "solo_mo",         label: "Solo MO" },
  { value: "materiales_mo",   label: "Materiales + MO" },
  { value: "completo",        label: "Todo incluido" },
];

const UNIDADES = [
  { value: "",         label: "Auto-detectar unidad" },
  { value: "m2",       label: "m² (metros cuadrados)" },
  { value: "ml",       label: "Metro lineal" },
  { value: "m3",       label: "m³ (metros cúbicos)" },
  { value: "global",   label: "Por trabajo completo" },
];

export default function EstimatorForm({ onSubmit, loading }) {
  const [descripcion, setDescripcion] = useState("");
  const [fotos, setFotos] = useState([]); // [{preview, base64}]
  const [tipoCotizacion, setTipoCotizacion] = useState("completo");
  const [unidadPrincipal, setUnidadPrincipal] = useState("");
  const inputRef = useRef(null);

  async function handleFotos(e) {
    const archivos = Array.from(e.target.files).slice(0, MAX_FOTOS - fotos.length);
    const nuevas = await Promise.all(
      archivos.map(async (f) => ({
        preview: URL.createObjectURL(f),
        base64: await comprimirImagen(f),
      }))
    );
    setFotos((prev) => [...prev, ...nuevas].slice(0, MAX_FOTOS));
    e.target.value = "";
  }

  function quitarFoto(i) {
    setFotos((prev) => {
      URL.revokeObjectURL(prev[i].preview);
      return prev.filter((_, idx) => idx !== i);
    });
  }

  function handleSubmit(e) {
    e.preventDefault();
    if (descripcion.trim().length < 5) return;
    onSubmit(descripcion.trim(), fotos.map((f) => f.base64), tipoCotizacion, unidadPrincipal);
  }

  return (
    <form onSubmit={handleSubmit} className="animate-fade-in-up">

      {/* Tipo de cotización */}
      <div className="mb-4">
        <label className="block text-xs text-white/40 mb-2 uppercase tracking-widest">
          Tipo de cotización
          <span className="ml-2 text-white/25 normal-case tracking-normal">MO = Mano de obra</span>
        </label>
        <div className="flex flex-wrap gap-2">
          {TIPOS_COTIZACION.map(({ value, label }) => (
            <button
              key={value}
              type="button"
              onClick={() => setTipoCotizacion(value)}
              className={`px-3 py-1.5 rounded-lg border text-xs font-medium transition-all ${
                tipoCotizacion === value
                  ? "border-gold/60 bg-gold/15 text-gold"
                  : "border-white/15 bg-white/5 text-white/50 hover:border-white/30 hover:text-white/80"
              }`}
            >
              {label}
            </button>
          ))}
        </div>
      </div>

      {/* Unidad principal */}
      <div className="mb-4">
        <label className="block text-xs text-white/40 mb-2 uppercase tracking-widest">Unidad de medida</label>
        <div className="flex flex-wrap gap-2">
          {UNIDADES.map(({ value, label }) => (
            <button
              key={value}
              type="button"
              onClick={() => setUnidadPrincipal(value)}
              className={`px-3 py-1.5 rounded-lg border text-xs font-medium transition-all ${
                unidadPrincipal === value
                  ? "border-gold/60 bg-gold/15 text-gold"
                  : "border-white/15 bg-white/5 text-white/50 hover:border-white/30 hover:text-white/80"
              }`}
            >
              {label}
            </button>
          ))}
        </div>
      </div>

      <label className="block text-sm text-white/60 mb-2">
        Describe el proyecto que quieres estimar
      </label>
      <textarea
        value={descripcion}
        onChange={(e) => setDescripcion(e.target.value)}
        rows={4}
        placeholder="Ej: Domo geodésico de 10m de diámetro para cabaña turística, estructura en madera laminada con cubierta de policarbonato..."
        className="w-full rounded-xl bg-charcoal border border-white/10 focus:border-gold/60 outline-none px-4 py-3 text-paper placeholder:text-white/30 resize-none transition-colors"
      />

      {/* Zona de fotos */}
      <div className="mt-3">
        <div className="flex items-center gap-3 flex-wrap">
          {fotos.map((f, i) => (
            <div key={i} className="relative w-16 h-16 rounded-lg overflow-hidden border border-white/20">
              <img src={f.preview} alt="" className="w-full h-full object-cover" />
              <button
                type="button"
                onClick={() => quitarFoto(i)}
                className="absolute top-0.5 right-0.5 w-5 h-5 rounded-full bg-black/70 text-white text-xs flex items-center justify-center hover:bg-red-600 transition-colors"
              >
                ×
              </button>
            </div>
          ))}

          {fotos.length < MAX_FOTOS && (
            <button
              type="button"
              onClick={() => inputRef.current?.click()}
              className="px-3 py-2 rounded-lg border border-dashed border-white/20 hover:border-gold/50 flex items-center gap-1.5 text-white/40 hover:text-gold transition-colors text-xs"
            >
              <span>+ Subir imagen</span>
              <span className="opacity-60">({fotos.length}/{MAX_FOTOS})</span>
            </button>
          )}

          {fotos.length > 0 && (
            <span className="text-[11px] text-white/30">
              {fotos.length} foto{fotos.length > 1 ? "s" : ""} · optimizadas automáticamente
            </span>
          )}
        </div>

        <input
          ref={inputRef}
          type="file"
          accept="image/*"
          multiple
          className="hidden"
          onChange={handleFotos}
        />
      </div>

      <button
        type="submit"
        disabled={loading || descripcion.trim().length < 5}
        className="mt-5 w-full sm:w-auto px-8 py-3 rounded-xl font-semibold tracking-wide text-ink bg-gradient-to-r from-gold-light via-gold to-gold-dark hover:brightness-110 disabled:opacity-40 disabled:cursor-not-allowed transition-all"
      >
        {loading ? "Generando estimación…" : "Generar estimación"}
      </button>
    </form>
  );
}
