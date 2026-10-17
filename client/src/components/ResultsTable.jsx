import { useRef, useState, useEffect } from "react";
import html2canvas from "html2canvas";
import { jsPDF } from "jspdf";
import { formatCLP, formatNumber } from "../utils/format";

/* ── Persistencia de datos empresa/cliente en localStorage ── */
function useDatosDoc() {
  const [datos, setDatos] = useState(() => {
    try { return JSON.parse(localStorage.getItem("maestroia_datos_doc") || "{}"); }
    catch { return {}; }
  });
  function guardar(nuevos) {
    const merged = { ...datos, ...nuevos };
    setDatos(merged);
    try { localStorage.setItem("maestroia_datos_doc", JSON.stringify(merged)); } catch {}
  }
  return [datos, guardar];
}

/* ── Panel colapsable de datos empresa + cliente ── */
function PanelDatos({ datos, onGuardar }) {
  const [abierto, setAbierto] = useState(false);
  const [form, setForm] = useState(datos);
  const logoRef = useRef(null);

  useEffect(() => { setForm(datos); }, [datos]);

  function set(k, v) { setForm(f => ({ ...f, [k]: v })); }

  function handleLogo(e) {
    const file = e.target.files?.[0];
    if (!file) return;
    const reader = new FileReader();
    reader.onload = ev => set("logo", ev.target.result);
    reader.readAsDataURL(file);
  }

  function handleGuardar() {
    onGuardar(form);
    setAbierto(false);
  }

  const tieneEmitente = datos.empresa || datos.ciudad || datos.email;
  const tieneCliente  = datos.cliente_nombre;

  return (
    <div className="mb-3">
      <button
        onClick={() => setAbierto(o => !o)}
        className="flex items-center gap-1.5 px-3 py-1.5 rounded-lg border border-white/15 bg-white/5 hover:bg-white/10 text-white/50 hover:text-white/80 text-xs font-medium transition-all"
      >
        ✏ {tieneEmitente ? "Editar datos cotización" : "Agregar datos empresa / cliente"}
        {(tieneEmitente || tieneCliente) && (
          <span className="ml-1 w-1.5 h-1.5 rounded-full bg-gold inline-block" />
        )}
      </button>

      {abierto && (
        <div className="mt-3 rounded-xl border border-white/10 bg-charcoal p-4 grid grid-cols-1 sm:grid-cols-2 gap-4 text-xs">

          {/* Columna empresa */}
          <div className="space-y-2">
            <p className="text-gold font-semibold uppercase tracking-wider text-[10px] mb-1">Tu empresa</p>

            {/* Logo */}
            <div className="flex items-center gap-3">
              {form.logo
                ? <img src={form.logo} alt="logo" className="h-10 object-contain rounded border border-white/10 bg-white/5 px-2" />
                : <div className="h-10 w-20 rounded border border-dashed border-white/20 flex items-center justify-center text-white/30 text-[10px]">logo</div>
              }
              <button
                type="button"
                onClick={() => logoRef.current?.click()}
                className="px-2 py-1 rounded border border-white/15 text-white/50 hover:text-white/80 transition-colors"
              >
                {form.logo ? "Cambiar" : "Subir logo"}
              </button>
              {form.logo && (
                <button type="button" onClick={() => set("logo", "")} className="text-white/30 hover:text-red-400 transition-colors">✕</button>
              )}
              <input ref={logoRef} type="file" accept="image/*" className="hidden" onChange={handleLogo} />
            </div>

            <Field label="Nombre empresa" value={form.empresa || ""} onChange={v => set("empresa", v)} placeholder="Ej: Constructora Los Lagos" />
            <Field label="Ciudad" value={form.ciudad || ""} onChange={v => set("ciudad", v)} placeholder="Ej: Santiago" />
            <Field label="Teléfono" value={form.telefono || ""} onChange={v => set("telefono", v)} placeholder="+56 9 1234 5678" />
            <Field label="Correo" value={form.email || ""} onChange={v => set("email", v)} placeholder="contacto@empresa.cl" />
          </div>

          {/* Columna cliente */}
          <div className="space-y-2">
            <p className="text-gold font-semibold uppercase tracking-wider text-[10px] mb-1">Cliente</p>
            <Field label="Nombre cliente" value={form.cliente_nombre || ""} onChange={v => set("cliente_nombre", v)} placeholder="Ej: Don Roberto" />
            <Field label="Empresa cliente" value={form.cliente_empresa || ""} onChange={v => set("cliente_empresa", v)} placeholder="Opcional" />
            <Field label="Correo cliente" value={form.cliente_email || ""} onChange={v => set("cliente_email", v)} placeholder="cliente@correo.cl" />
          </div>

          <div className="sm:col-span-2 flex justify-end gap-2 pt-1">
            <button onClick={() => setAbierto(false)} className="px-3 py-1.5 rounded-lg border border-white/10 text-white/40 hover:text-white/70 transition-colors">
              Cancelar
            </button>
            <button onClick={handleGuardar} className="px-4 py-1.5 rounded-lg bg-gold/20 border border-gold/40 text-gold font-semibold hover:bg-gold/30 transition-colors">
              Guardar
            </button>
          </div>
        </div>
      )}
    </div>
  );
}

function Field({ label, value, onChange, placeholder }) {
  return (
    <div>
      <label className="block text-white/40 mb-0.5">{label}</label>
      <input
        type="text"
        value={value}
        onChange={e => onChange(e.target.value)}
        placeholder={placeholder}
        className="w-full rounded-lg bg-charcoal-light border border-white/10 px-2.5 py-1.5 text-white/80 placeholder:text-white/20 outline-none focus:border-gold/40 transition-colors text-xs"
      />
    </div>
  );
}

/* ── Mailto con datos de empresa ── */
function generarMailto(data, datos) {
  const { proyecto, items_materiales = [], items_mo = [], notas_generales, resumen } = data;
  const emisor = datos.empresa || "MaestroIA";
  let cuerpo = `COTIZACIÓN PRELIMINAR – ${emisor}\nProyecto: ${proyecto}\n\n`;

  if (items_materiales.length > 0) {
    const grupos = items_materiales.reduce((acc, item) => {
      const cat = item.categoria || "Materiales";
      if (!acc[cat]) acc[cat] = [];
      acc[cat].push(item);
      return acc;
    }, {});
    cuerpo += `══ CUBICACIÓN DE MATERIALES ══\n`;
    Object.entries(grupos).forEach(([cat, rows]) => {
      cuerpo += `── ${cat.toUpperCase()} ──\n`;
      rows.forEach(i => {
        cuerpo += `• ${i.material}: ${i.cantidad} ${i.unidad} × $${i.precio_unitario_clp.toLocaleString("es-CL")} = $${i.subtotal_clp.toLocaleString("es-CL")}\n`;
      });
    });
    if (resumen.subtotal_materiales_clp) {
      cuerpo += `Subtotal materiales: $${resumen.subtotal_materiales_clp.toLocaleString("es-CL")}\n`;
    }
    cuerpo += "\n";
  }

  if (items_mo.length > 0) {
    cuerpo += `══ MANO DE OBRA ══\n`;
    items_mo.forEach(i => {
      cuerpo += `• ${i.partida}: ${i.cantidad} ${i.unidad} × $${i.precio_unitario_clp.toLocaleString("es-CL")} = $${i.subtotal_clp.toLocaleString("es-CL")}\n`;
    });
    if (resumen.subtotal_mo_clp) {
      cuerpo += `Subtotal mano de obra: $${resumen.subtotal_mo_clp.toLocaleString("es-CL")}\n`;
    }
    cuerpo += "\n";
  }

  cuerpo += `Subtotal neto: $${resumen.subtotal_clp.toLocaleString("es-CL")}\n`;
  cuerpo += `IVA (19%): $${resumen.iva_clp.toLocaleString("es-CL")}\n`;
  cuerpo += `TOTAL ESTIMADO: $${resumen.total_clp.toLocaleString("es-CL")}\n`;
  if (notas_generales) cuerpo += `\nNotas: ${notas_generales}\n`;
  cuerpo += `\n---\nGenerado con MaestroIA · Un producto AIKON`;

  const dest = datos.cliente_email || "";
  const asunto = encodeURIComponent(`Cotización – ${proyecto}`);
  const body   = encodeURIComponent(cuerpo);
  return `mailto:${dest}?subject=${asunto}&body=${body}`;
}

/* ── Captura html2canvas con fondo oscuro garantizado ── */
async function capturarCanvas(el) {
  const prevBg = el.style.backgroundColor;
  el.style.backgroundColor = "#0f0f10";
  const canvas = await html2canvas(el, {
    backgroundColor: "#0f0f10",
    scale: 2,
    useCORS: true,
    logging: false,
  });
  el.style.backgroundColor = prevBg;
  return canvas;
}

/* ── Exportar JPG ── */
async function exportarImagen(ref, tipo) {
  if (!ref.current) return;
  const canvas = await capturarCanvas(ref.current);
  const url = canvas.toDataURL(tipo === "jpg" ? "image/jpeg" : "image/png", 0.95);
  const a = document.createElement("a");
  a.href = url;
  a.download = `maestroia-estimacion.${tipo}`;
  a.click();
}

/* ── Exportar PDF real (descarga directa o Share API en móvil) ── */
async function exportarPDF(ref, nombreProyecto) {
  if (!ref.current) return;
  const canvas = await capturarCanvas(ref.current);
  const imgData = canvas.toDataURL("image/jpeg", 0.92);

  const pdf = new jsPDF({ orientation: "p", unit: "mm", format: "a4" });
  const pageW = pdf.internal.pageSize.getWidth();   // 210 mm
  const pageH = pdf.internal.pageSize.getHeight();  // 297 mm
  const imgW  = pageW;
  const imgH  = (canvas.height * pageW) / canvas.width;

  // Divide en páginas si el contenido es más largo que una hoja
  let posY = 0;
  while (posY < imgH) {
    if (posY > 0) pdf.addPage();
    pdf.addImage(imgData, "JPEG", 0, -posY, imgW, imgH);
    posY += pageH;
  }

  const nombre = `maestroia-${(nombreProyecto || "cotizacion").toLowerCase().replace(/\s+/g, "-")}.pdf`;

  // En móvil: intentar Web Share API para adjuntar el PDF al correo o compartir
  if (navigator.share && navigator.canShare) {
    const blob = pdf.output("blob");
    const file = new File([blob], nombre, { type: "application/pdf" });
    if (navigator.canShare({ files: [file] })) {
      try {
        await navigator.share({ files: [file], title: "Cotización MaestroIA" });
        return;
      } catch (e) {
        // Si el usuario canceló el share, igual guardamos
        if (e.name !== "AbortError") pdf.save(nombre);
        return;
      }
    }
  }

  // Fallback: descarga directa
  pdf.save(nombre);
}

/* ── Componente principal ── */
export default function ResultsTable({ data }) {
  const exportRef = useRef(null);
  const [datos, guardarDatos] = useDatosDoc();
  if (!data) return null;

  const mailtoLink = generarMailto(data, datos);
  const { proyecto, items_materiales = [], items_mo = [], notas_generales, resumen } = data;
  const fecha = new Date().toLocaleDateString("es-CL", { day: "2-digit", month: "long", year: "numeric" });

  const gruposMateriales = items_materiales.reduce((acc, item) => {
    const cat = item.categoria || "Materiales";
    if (!acc[cat]) acc[cat] = [];
    acc[cat].push(item);
    return acc;
  }, {});

  const hayMateriales = items_materiales.length > 0;
  const hayMO = items_mo.length > 0;
  const hayAmbos = hayMateriales && hayMO;

  return (
    <div className="mt-10 animate-fade-in-up">

      {/* Barra de acciones — oculta al imprimir */}
      <div className="no-print">
        <PanelDatos datos={datos} onGuardar={guardarDatos} />
        <div className="flex gap-2 mb-4 justify-end">
          <a href={mailtoLink} className="flex items-center gap-1.5 px-3 py-1.5 rounded-lg border border-gold/30 bg-gold/10 hover:bg-gold/20 text-gold text-xs font-medium transition-all">
            ✉ Enviar por correo
          </a>
          <button onClick={() => exportarPDF(exportRef, proyecto)} className="flex items-center gap-1.5 px-3 py-1.5 rounded-lg border border-white/20 bg-white/5 hover:bg-white/10 text-white/70 hover:text-white text-xs font-medium transition-all">
            ⬇ PDF
          </button>
          <button onClick={() => exportarImagen(exportRef, "jpg")} className="flex items-center gap-1.5 px-3 py-1.5 rounded-lg border border-white/20 bg-white/5 hover:bg-white/10 text-white/70 hover:text-white text-xs font-medium transition-all">
            ⬇ JPG
          </button>
        </div>
      </div>

      <div ref={exportRef} className="export-container p-2">

        {/* ── Encabezado formal para PDF ── */}
        <div className="print-header print-only">
          <div className="print-header-brand">
            {datos.logo
              ? <img src={datos.logo} alt="logo" style={{ height: "48px", objectFit: "contain", marginBottom: "4pt" }} />
              : <div className="brand-name">{datos.empresa || "MaestroIA"}</div>
            }
            {datos.logo && datos.empresa && <div className="brand-name" style={{ fontSize: "13pt" }}>{datos.empresa}</div>}
            <div className="brand-tagline">
              {[datos.ciudad, datos.telefono, datos.email].filter(Boolean).join(" · ") || "Generado con MaestroIA · AIKON"}
            </div>
          </div>
          <div className="print-header-meta">
            <div className="doc-title">Cotización Preliminar</div>
            <div>{fecha}</div>
            {datos.cliente_nombre && (
              <div style={{ marginTop: "6pt" }}>
                <strong>Cliente:</strong> {datos.cliente_nombre}
                {datos.cliente_empresa && <div>{datos.cliente_empresa}</div>}
              </div>
            )}
            <div style={{ marginTop: "6pt", fontSize: "7pt", color: "#aaa" }}>Generado con MaestroIA · AIKON</div>
          </div>
        </div>

        {/* Título proyecto */}
        <div className="flex items-center justify-between mb-1">
          <h2 className="text-xl text-paper" style={{ fontFamily: "var(--font-display)", fontWeight: 600 }}>
            {proyecto}
          </h2>
          <span className="text-[11px] uppercase tracking-widest text-white/40">Estimación preliminar</span>
        </div>
        <div className="h-px w-full bg-gradient-to-r from-gold/60 via-gold/10 to-transparent mb-6" />

        {/* ── Sección Cubicación de Materiales ── */}
        {hayMateriales && (
          <div className={hayAmbos ? "mb-8" : ""}>
            {hayAmbos && (
              <div className="flex items-center gap-3 mb-3">
                <span className="text-xs font-semibold uppercase tracking-widest text-white/50">Cubicación de Materiales</span>
                <div className="flex-1 h-px bg-white/10" />
                {resumen.subtotal_materiales_clp > 0 && (
                  <span className="text-xs text-white/50">{formatCLP(resumen.subtotal_materiales_clp)}</span>
                )}
              </div>
            )}
            <div className="rounded-2xl border border-white/10 overflow-hidden">
              <table className="w-full text-sm">
                <thead>
                  <tr className="bg-charcoal-light text-white/50 text-left uppercase text-[11px] tracking-wider">
                    <th className="px-4 py-3 font-medium">Material</th>
                    <th className="px-4 py-3 font-medium text-right">Cantidad</th>
                    <th className="px-4 py-3 font-medium text-right">P. Unitario</th>
                    <th className="px-4 py-3 font-medium text-right">Subtotal</th>
                  </tr>
                </thead>
                <tbody>
                  {Object.entries(gruposMateriales).map(([categoria, rows]) => (
                    <RenderGrupoMateriales key={categoria} categoria={categoria} rows={rows} />
                  ))}
                </tbody>
              </table>
            </div>
          </div>
        )}

        {/* ── Sección Mano de Obra ── */}
        {hayMO && (
          <div>
            {hayAmbos && (
              <div className="flex items-center gap-3 mb-3">
                <span className="text-xs font-semibold uppercase tracking-widest text-white/50">Mano de Obra</span>
                <div className="flex-1 h-px bg-white/10" />
                {resumen.subtotal_mo_clp > 0 && (
                  <span className="text-xs text-white/50">{formatCLP(resumen.subtotal_mo_clp)}</span>
                )}
              </div>
            )}
            <div className="rounded-2xl border border-white/10 overflow-hidden">
              <table className="w-full text-sm">
                <thead>
                  <tr className="bg-charcoal-light text-white/50 text-left uppercase text-[11px] tracking-wider">
                    <th className="px-4 py-3 font-medium">Mano de obra</th>
                    <th className="px-4 py-3 font-medium text-right">Cantidad</th>
                    <th className="px-4 py-3 font-medium text-right">P. Unitario</th>
                    <th className="px-4 py-3 font-medium text-right">Subtotal</th>
                  </tr>
                </thead>
                <tbody>
                  {items_mo.map((item, i) => (
                    <tr key={i} className="border-t border-white/5 hover:bg-white/[0.02] transition-colors">
                      <td className="px-4 py-3 text-white/80">
                        {item.partida}
                        {item.notas && <span className="block text-[11px] text-white/35 mt-0.5">{item.notas}</span>}
                      </td>
                      <td className="px-4 py-3 text-right text-white/70 whitespace-nowrap">{formatNumber(item.cantidad)} {item.unidad}</td>
                      <td className="px-4 py-3 text-right text-white/70 whitespace-nowrap">{formatCLP(item.precio_unitario_clp)}</td>
                      <td className="px-4 py-3 text-right text-paper font-medium whitespace-nowrap">{formatCLP(item.subtotal_clp)}</td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          </div>
        )}

        {/* Resumen */}
        <div className="mt-6 ml-auto w-full sm:w-80 rounded-2xl border border-gold/20 bg-charcoal p-5">
          {hayAmbos && resumen.subtotal_materiales_clp > 0 && (
            <SummaryRow label="Subtotal materiales" value={formatCLP(resumen.subtotal_materiales_clp)} />
          )}
          {hayAmbos && resumen.subtotal_mo_clp > 0 && (
            <SummaryRow label="Subtotal mano de obra" value={formatCLP(resumen.subtotal_mo_clp)} />
          )}
          {hayAmbos && <div className="h-px bg-white/10 my-2" />}
          <SummaryRow label="Subtotal neto" value={formatCLP(resumen.subtotal_clp)} />
          <SummaryRow label={`IVA (${Math.round(resumen.iva_rate * 100)}%)`} value={formatCLP(resumen.iva_clp)} />
          <div className="h-px bg-white/10 my-3" />
          <SummaryRow label="Total estimado" value={formatCLP(resumen.total_clp)} highlight />
        </div>

        {/* ── Referencia Mano de Obra ── */}
        {data.referencias_mo && (
          <ReferenciasMO ref_mo={data.referencias_mo} />
        )}

        {notas_generales && (
          <div className="mt-6 rounded-xl border border-white/10 bg-charcoal/60 px-4 py-3 text-xs text-white/50 leading-relaxed">
            <span className="text-gold font-medium">Notas: </span>{notas_generales}
          </div>
        )}

        <p className="mt-4 text-[11px] text-white/30 leading-relaxed no-print">
          Esta estimación es referencial, generada con IA a partir de precios de mercado aproximados.
          No reemplaza una cotización formal ni un presupuesto detallado.
        </p>

        {/* Footer del documento — solo al imprimir */}
        <div className="print-footer print-only">
          Estimación preliminar · Valores referenciales, no constituyen cotización formal comprometida · Válida por 15 días
          {datos.empresa && ` · ${datos.empresa}`}
          {datos.ciudad && `, ${datos.ciudad}`}
          {" · "}Generado con MaestroIA · AIKON
        </div>

      </div>
    </div>
  );
}

function RenderGrupoMateriales({ categoria, rows }) {
  return (
    <>
      <tr className="bg-ink/40">
        <td colSpan={4} className="px-4 py-2 text-gold text-xs font-semibold tracking-wide uppercase">{categoria}</td>
      </tr>
      {rows.map((item, i) => (
        <tr key={i} className="border-t border-white/5 hover:bg-white/[0.02] transition-colors">
          <td className="px-4 py-3 text-white/80">
            {item.material}
            {item.notas && <span className="block text-[11px] text-white/35 mt-0.5">{item.notas}</span>}
          </td>
          <td className="px-4 py-3 text-right text-white/70 whitespace-nowrap">{formatNumber(item.cantidad)} {item.unidad}</td>
          <td className="px-4 py-3 text-right text-white/70 whitespace-nowrap">{formatCLP(item.precio_unitario_clp)}</td>
          <td className="px-4 py-3 text-right text-paper font-medium whitespace-nowrap">{formatCLP(item.subtotal_clp)}</td>
        </tr>
      ))}
    </>
  );
}

function SummaryRow({ label, value, highlight = false }) {
  return (
    <div className="flex items-center justify-between py-1">
      <span className={highlight ? "text-paper font-semibold" : "text-white/60 text-sm"}>{label}</span>
      <span className={highlight ? "text-gold text-lg font-bold" : "text-white/80 text-sm"}>{value}</span>
    </div>
  );
}

/* ── Referencia de Mano de Obra ── */
function ReferenciasMO({ ref_mo }) {
  const {
    tipo_trabajo,
    unidad_mo,
    precio_mo_mercado_bajo,
    precio_mo_mercado_alto,
    regla_maestro_clp,
    nota,
  } = ref_mo;

  const rangoBajo = typeof precio_mo_mercado_bajo === "number" ? formatCLP(precio_mo_mercado_bajo) : "–";
  const rangoAlto = typeof precio_mo_mercado_alto === "number" ? formatCLP(precio_mo_mercado_alto) : "–";
  const reglaMaestro = typeof regla_maestro_clp === "number" ? formatCLP(regla_maestro_clp) : null;

  return (
    <div className="mt-6 rounded-2xl border border-gold/25 bg-gold/[0.04] p-5">
      {/* Encabezado */}
      <div className="flex items-center gap-2 mb-4">
        <span className="text-gold text-base leading-none">⚒</span>
        <span className="text-gold font-semibold text-xs uppercase tracking-widest">Referencia Mano de Obra</span>
      </div>

      <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
        {/* Columna izquierda: tipo de trabajo + rango mercado */}
        <div className="space-y-3">
          <div>
            <p className="text-[10px] uppercase tracking-widest text-white/35 mb-0.5">Tipo de trabajo detectado</p>
            <p className="text-white/80 text-sm font-medium">{tipo_trabajo}</p>
          </div>
          <div>
            <p className="text-[10px] uppercase tracking-widest text-white/35 mb-0.5">Precio MO mercado (neto, sin IVA)</p>
            <p className="text-paper text-sm font-semibold">
              {rangoBajo} – {rangoAlto}
              <span className="text-white/40 font-normal ml-1">/ {unidad_mo}</span>
            </p>
            {nota && <p className="text-white/40 text-[11px] mt-1 leading-relaxed">{nota}</p>}
          </div>
        </div>

        {/* Columna derecha: regla del maestro */}
        <div className="rounded-xl border border-gold/20 bg-charcoal/60 px-4 py-3">
          <p className="text-[10px] uppercase tracking-widest text-white/35 mb-1">Regla del maestro</p>
          <p className="text-white/60 text-xs leading-relaxed mb-2">
            En trabajos de construcción, la mano de obra suele equivaler al costo total de materiales.
          </p>
          {reglaMaestro && (
            <div className="flex items-baseline gap-1.5">
              <span className="text-white/40 text-xs">MO estimada ≈</span>
              <span className="text-gold font-bold text-base">{reglaMaestro}</span>
            </div>
          )}
          <p className="text-white/25 text-[10px] mt-1.5 leading-relaxed">
            Referencial. Verificar con maestro según envergadura y dificultad del trabajo.
          </p>
        </div>
      </div>
    </div>
  );
}
