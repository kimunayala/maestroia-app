import VerticeLogo from "./VerticeLogo";

export default function Header() {
  return (
    <header className="border-b border-white/10 bg-ink/80 backdrop-blur sticky top-0 z-20">
      <div className="max-w-5xl mx-auto px-6 py-4 flex items-center justify-between">
        <div className="flex items-center gap-3">
          <VerticeLogo size={38} />
          <div className="leading-tight">
            <p
              className="text-lg tracking-wide text-paper"
              style={{ fontFamily: "var(--font-display)", fontWeight: 700 }}
            >
              MAESTRO<span className="text-gold">IA</span>
            </p>
            <p className="text-[11px] text-white/40 tracking-widest uppercase">
              Evoluzion &middot; Estimador de materiales
            </p>
          </div>
        </div>
        <a
          href="https://github.com/kimunayala/aikon-app1-web"
          target="_blank"
          rel="noreferrer"
          className="hidden sm:inline-block text-xs text-white/40 hover:text-gold transition-colors"
        >
          Un producto AIKON
        </a>
      </div>
    </header>
  );
}
