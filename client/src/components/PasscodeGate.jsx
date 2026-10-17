import { useState } from "react";
import VerticeLogo from "./VerticeLogo";

export default function PasscodeGate({ onUnlock }) {
  const [loading, setLoading] = useState(false);

  function handleEntrar() {
    setLoading(true);
    onUnlock("");
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
        </div>
        <button
          onClick={handleEntrar}
          disabled={loading}
          className="w-full py-3 rounded-xl font-semibold tracking-wide text-ink bg-gradient-to-r from-gold-light via-gold to-gold-dark hover:brightness-110 disabled:opacity-40 transition-all"
        >
          {loading ? "Entrando…" : "Entrar"}
        </button>
      </div>
    </div>
  );
}
