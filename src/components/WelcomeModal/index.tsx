import { useEffect, useState } from "react";
import type { Lang } from "../../i18n";

interface WelcomeModalProps {
  lang:         Lang;
  onLangChange: (lang: Lang) => void;
  onStart:      () => void;
  onSkip:       () => void;
}

export function WelcomeModal({ lang, onLangChange, onStart, onSkip }: WelcomeModalProps) {
  const [visible, setVisible] = useState(false);

  // Fade-in on mount
  useEffect(() => { setVisible(true); }, []);

  // Prevent background scroll while modal is open
  useEffect(() => {
    document.body.style.overflow = "hidden";
    return () => { document.body.style.overflow = ""; };
  }, []);

  return (
    <div
      role="dialog"
      aria-modal="true"
      aria-labelledby="welcome-modal-title"
      className={`fixed inset-0 z-[3100] flex items-center justify-center bg-[#B22222] transition-opacity duration-300 ${visible ? "opacity-100" : "opacity-0"}`}
    >
      <div className="flex flex-col items-center gap-6 text-white text-center px-8 max-w-sm">
        <span className="text-5xl">🗺️</span>
        <div className="flex flex-col gap-2">
          <h1 id="welcome-modal-title" className="text-2xl font-bold tracking-tight">Berlin Street Designer</h1>
          <p className="text-sm text-white/80">
            {lang === "de"
              ? <>Gestalte Querschnitte von Berliner Straßen.<br />Skizziere, bewerte und exportiere in Sekunden.</>
              : <>Design cross-sections of Berlin streets.<br />Sketch, evaluate, and export in seconds.</>
            }
          </p>
        </div>
        <div className="flex items-center gap-1 self-center">
          <button
            onClick={() => onLangChange("de")}
            className={`px-3 py-1 rounded text-sm font-semibold transition-colors ${lang === "de" ? "bg-white text-[#B22222]" : "text-white/60 hover:text-white"}`}
          >DE</button>
          <button
            onClick={() => onLangChange("en")}
            className={`px-3 py-1 rounded text-sm font-semibold transition-colors ${lang === "en" ? "bg-white text-[#B22222]" : "text-white/60 hover:text-white"}`}
          >EN</button>
        </div>
        <div className="flex flex-col gap-2 w-full">
          <button
            onClick={onStart}
            className="w-full py-2 px-4 bg-white text-[#B22222] font-semibold rounded text-sm hover:bg-white/90 transition-colors"
          >
            {lang === "de" ? "Starten →" : "Start →"}
          </button>
          <button
            onClick={onSkip}
            className="w-full py-2 px-4 text-white/70 text-sm hover:text-white transition-colors"
          >
            {lang === "de" ? "Tour überspringen" : "Skip tour"}
          </button>
        </div>
      </div>
    </div>
  );
}
