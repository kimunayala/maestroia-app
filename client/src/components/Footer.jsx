export default function Footer() {
  return (
    <footer className="border-t border-white/10 mt-20">
      <div className="max-w-5xl mx-auto px-6 py-8 flex flex-col sm:flex-row items-center justify-between gap-3 text-[11px] text-white/30">
        <p>© {new Date().getFullYear()} Evoluzion Arquitectura y Diseño — Región de Los Lagos, Chile</p>
        <p className="tracking-widest uppercase">MaestroIA · desarrollado por AIKON</p>
      </div>
    </footer>
  );
}
