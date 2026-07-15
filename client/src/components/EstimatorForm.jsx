import { useState } from "react";

const EJEMPLOS = [
  "Domo geodésico de 8m de diámetro para uso turístico, estructura en madera con cubierta translúcida",
  "Casa modular ampliable de 40m2, estructura en acero galvanizado con paneles SIP",
  "Galpón industrial de 300m2 en la Región de Los Lagos, estructura metálica",
  "Estructura flotante para centro de cultivo de mitílidos, 20x20m",
];

export default function EstimatorForm({ onSubmit, loading }) {
  const [descripcion, setDescripcion] = useState("");

  function handleSubmit(e) {
    e.preventDefault();
    if (descripcion.trim().length < 5) return;
    onSubmit(descripcion.trim());
  }

  return (
    <form onSubmit={handleSubmit} className="animate-fade-in-up">
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

      <div className="mt-3 flex flex-wrap gap-2">
        {EJEMPLOS.map((ej, i) => (
          <button
            type="button"
            key={i}
            onClick={() => setDescripcion(ej)}
            className="text-xs px-3 py-1.5 rounded-full border border-white/10 text-white/50 hover:border-gold/50 hover:text-gold transition-colors"
          >
            {ej.slice(0, 42)}…
          </button>
        ))}
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
