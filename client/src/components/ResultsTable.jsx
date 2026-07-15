import { formatCLP, formatNumber } from "../utils/format";

export default function ResultsTable({ data }) {
  if (!data) return null;

  const { proyecto, items, notas_generales, resumen } = data;

  const grupos = items.reduce((acc, item) => {
    const cat = item.categoria || "Otros";
    if (!acc[cat]) acc[cat] = [];
    acc[cat].push(item);
    return acc;
  }, {});

  return (
    <div className="mt-10 animate-fade-in-up">
      <div className="flex items-center justify-between mb-1">
        <h2
          className="text-xl text-paper"
          style={{ fontFamily: "var(--font-display)", fontWeight: 600 }}
        >
          {proyecto}
        </h2>
        <span className="text-[11px] uppercase tracking-widest text-white/40">
          Estimación preliminar
        </span>
      </div>
      <div className="h-px w-full bg-gradient-to-r from-gold/60 via-gold/10 to-transparent mb-6" />

      <div className="rounded-2xl border border-white/10 overflow-hidden">
        <table className="w-full text-sm">
          <thead>
            <tr className="bg-charcoal-light text-white/50 text-left uppercase text-[11px] tracking-wider">
              <th className="px-4 py-3 font-medium">Material / Partida</th>
              <th className="px-4 py-3 font-medium text-right">Cantidad</th>
              <th className="px-4 py-3 font-medium text-right">P. Unitario</th>
              <th className="px-4 py-3 font-medium text-right">Subtotal</th>
            </tr>
          </thead>
          <tbody>
            {Object.entries(grupos).map(([categoria, rows]) => (
              <RenderGrupo key={categoria} categoria={categoria} rows={rows} />
            ))}
          </tbody>
        </table>
      </div>

      {/* Resumen */}
      <div className="mt-6 ml-auto w-full sm:w-80 rounded-2xl border border-gold/20 bg-charcoal p-5">
        <SummaryRow label="Subtotal neto" value={formatCLP(resumen.subtotal_clp)} />
        <SummaryRow
          label={`IVA (${Math.round(resumen.iva_rate * 100)}%)`}
          value={formatCLP(resumen.iva_clp)}
        />
        <div className="h-px bg-white/10 my-3" />
        <SummaryRow
          label="Total estimado"
          value={formatCLP(resumen.total_clp)}
          highlight
        />
      </div>

      {notas_generales && (
        <div className="mt-6 rounded-xl border border-white/10 bg-charcoal/60 px-4 py-3 text-xs text-white/50 leading-relaxed">
          <span className="text-gold font-medium">Notas: </span>
          {notas_generales}
        </div>
      )}

      <p className="mt-4 text-[11px] text-white/30 leading-relaxed">
        Esta estimación es referencial, generada con IA a partir de precios de mercado
        aproximados. No reemplaza una cotización formal ni un presupuesto detallado por
        Evoluzion Arquitectura y Diseño.
      </p>
    </div>
  );
}

function RenderGrupo({ categoria, rows }) {
  return (
    <>
      <tr className="bg-ink/40">
        <td colSpan={4} className="px-4 py-2 text-gold text-xs font-semibold tracking-wide uppercase">
          {categoria}
        </td>
      </tr>
      {rows.map((item, i) => (
        <tr key={i} className="border-t border-white/5 hover:bg-white/[0.02] transition-colors">
          <td className="px-4 py-3 text-white/80">
            {item.material}
            {item.notas && (
              <span className="block text-[11px] text-white/35 mt-0.5">{item.notas}</span>
            )}
          </td>
          <td className="px-4 py-3 text-right text-white/70 whitespace-nowrap">
            {formatNumber(item.cantidad)} {item.unidad}
          </td>
          <td className="px-4 py-3 text-right text-white/70 whitespace-nowrap">
            {formatCLP(item.precio_unitario_clp)}
          </td>
          <td className="px-4 py-3 text-right text-paper font-medium whitespace-nowrap">
            {formatCLP(item.subtotal_clp)}
          </td>
        </tr>
      ))}
    </>
  );
}

function SummaryRow({ label, value, highlight = false }) {
  return (
    <div className="flex items-center justify-between py-1">
      <span className={highlight ? "text-paper font-semibold" : "text-white/60 text-sm"}>
        {label}
      </span>
      <span
        className={
          highlight
            ? "text-gold text-lg font-bold"
            : "text-white/80 text-sm"
        }
      >
        {value}
      </span>
    </div>
  );
}
