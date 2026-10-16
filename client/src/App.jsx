import { useState, useEffect } from "react";
import Header from "./components/Header";
import Footer from "./components/Footer";
import EstimatorForm from "./components/EstimatorForm";
import ResultsTable from "./components/ResultsTable";
import LoadingSkeleton from "./components/LoadingSkeleton";
import PasscodeGate from "./components/PasscodeGate";

function App() {
  const [resultado, setResultado] = useState(null);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState(null);

  const [checkingAccess, setCheckingAccess] = useState(true);
  const [passcodeRequired, setPasscodeRequired] = useState(false);
  const [unlocked, setUnlocked] = useState(false);
  const [passcode, setPasscode] = useState(
    sessionStorage.getItem("maestroia_passcode") || ""
  );

  useEffect(() => {
    fetch("/api/config")
      .then((res) => res.json())
      .then((data) => {
        setPasscodeRequired(Boolean(data.passcodeRequired));
        // Si no requiere passcode, o ya hay uno guardado, dejamos pasar directo
        // (la validación real ocurre en el backend en cada /api/estimar).
        if (!data.passcodeRequired || sessionStorage.getItem("maestroia_passcode")) {
          setUnlocked(true);
        }
      })
      .catch(() => setUnlocked(true)) // si falla la config, no bloqueamos el acceso
      .finally(() => setCheckingAccess(false));
  }, []);

  function handleUnlock(code) {
    setPasscode(code);
    setUnlocked(true);
  }

  async function handleEstimate(descripcion, imagenes = []) {
    setLoading(true);
    setError(null);
    setResultado(null);

    try {
      const res = await fetch("/api/estimar", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
          ...(passcode ? { "x-app-passcode": passcode } : {}),
        },
        body: JSON.stringify({ descripcion, imagenes }),
      });

      const data = await res.json();

      if (!res.ok) {
        throw new Error(data.error || "Error al generar la estimación.");
      }

      setResultado(data);
    } catch (err) {
      setError(err.message);
    } finally {
      setLoading(false);
    }
  }

  if (checkingAccess) {
    return <div className="min-h-screen bg-ink" />;
  }

  if (passcodeRequired && !unlocked) {
    return <PasscodeGate onUnlock={handleUnlock} />;
  }

  return (
    <div className="min-h-screen bg-ink text-paper flex flex-col">
      <div
        className="fixed inset-0 pointer-events-none opacity-[0.04]"
        style={{
          backgroundImage:
            "linear-gradient(to right, #C4A020 1px, transparent 1px), linear-gradient(to bottom, #C4A020 1px, transparent 1px)",
          backgroundSize: "48px 48px",
        }}
      />

      <Header />

      <main className="flex-1 max-w-5xl w-full mx-auto px-6 py-14 relative">
        <section className="mb-10">
          <h1
            className="text-3xl sm:text-4xl text-paper mb-3"
            style={{ fontFamily: "var(--font-display)", fontWeight: 700 }}
          >
            Estimador de materiales <span className="text-gold">con IA</span>
          </h1>
          <p className="text-white/50 max-w-2xl leading-relaxed">
            Describe tu proyecto de construcción — domo geodésico, casa modular,
            galpón o estructura de acuicultura — y MaestroIA genera una estimación
            preliminar de materiales con precios en pesos chilenos e IVA incluido.
          </p>
        </section>

        <EstimatorForm onSubmit={handleEstimate} loading={loading} />

        {loading && <LoadingSkeleton />}

        {error && (
          <div className="mt-8 rounded-xl border border-red-500/30 bg-red-500/10 px-4 py-3 text-sm text-red-300 animate-fade-in-up">
            {error}
          </div>
        )}

        {resultado && !loading && <ResultsTable data={resultado} />}
      </main>

      <Footer />
    </div>
  );
}

export default App;
