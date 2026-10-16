export default function Header() {
  return (
    <header className="border-b border-white/10 bg-ink/80 backdrop-blur sticky top-0 z-20">
      <div className="max-w-5xl mx-auto px-6 py-4 flex items-center justify-between">
        {/* Wordmark opción C */}
        <div className="flex flex-col items-start gap-0.5">
          <p
            className="text-xl tracking-widest text-paper leading-none"
            style={{ fontFamily: "var(--font-display)", fontWeight: 700, letterSpacing: "0.09em" }}
          >
            MAESTRO<span className="text-gold">IA</span>
          </p>
          <div
            className="w-full h-px"
            style={{ background: "linear-gradient(to right, transparent, #C4A020 25%, #C4A020 75%, transparent)" }}
          />
          <p className="text-[9px] text-white/35 tracking-[0.28em] uppercase mt-0.5">
            Un producto AIKON
          </p>
        </div>

        <span className="hidden sm:inline-block text-xs text-white/30 tracking-wider uppercase">
          Estimador de materiales
        </span>
      </div>
    </header>
  );
}
