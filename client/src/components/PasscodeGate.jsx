import { useState } from "react";
import VerticeLogo from "./VerticeLogo";

export default function PasscodeGate({ onUnlock }) {
  const [passcode, setPasscode] = useState("");
  const [error, setError] = useState("");
  const [loading, setLoading] = useState(false);

  async function handleSubmit(e) {
    e.preventDefault();
    setLoading(true);
    setError("");

    try {
      const res = await fetch("/api/auth", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ passcode }),
      });
      const data = await res.json();

      if (res.ok && data.ok) {
        sessionStorage.setItem("maestroia_passcode", passcode);
        onUnlock(passcode);
      } else {
        setError(data.error || "Passcode incorrecto.");
      }
    } catch {
      setError("No se pudo verificar el acceso. Intenta nuevamente.");
    } finally {
      setLoading(false);
    }
  }

  return (
    <div className="min-h-screen bg-ink flex items-center justify-center px-6">
      <div className="w-full max-w-sm animate-fade-in-up">
        <div className="flex flex-col items-center mb-8">
          <VerticeLogo size={56} />
          <p
            className="mt-3 text-xl text-paper"
            style={{ fontFamily: "var(--font-display)", fontWeight: 700 }}
          >
            MAESTRO<span className="text-gold">IA</span>
          </p>
          <p className="text-[11px] text-white/40 tracking-widest uppercase mt-1">
            Acceso restringido
          </p>
        </div>

        <form onSubmit={handleSubmit}>
          <input
            type="password"
            value={passcode}
            onChange={(e) => setPasscode(e.target.value)}
            placeholder="Ingresa el passcode"
            autoFocus
            className="w-full rounded-xl bg-charcoal border border-white/10 focus:border-gold/60 outline-none px-4 py-3 text-paper placeholder:text-white/30 text-center transition-colors"
          />

          {error && (
            <p className="mt-3 text-sm text-red-300 text-center">{error}</p>
          )}

          <button
            type="submit"
            disabled={loading || !passcode}
            className="mt-4 w-full py-3 rounded-xl font-semibold tracking-wide text-ink bg-gradient-to-r from-gold-light via-gold to-gold-dark hover:brightness-110 disabled:opacity-40 disabled:cursor-not-allowed transition-all"
          >
            {loading ? "Verificando…" : "Entrar"}
          </button>
        </form>
      </div>
    </div>
  );
}
