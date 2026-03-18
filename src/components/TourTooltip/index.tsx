import { useEffect, useRef, useState } from "react";
import { X } from "lucide-react";
import type { Lang } from "../../i18n";

export interface TourStep {
  target: string;
  emoji:  string;
  tab?:   "design" | "explore";
  title:  { de: string; en: string };
  body:   { de: string; en: string };
}

export const TOUR_STEPS: TourStep[] = [
  { target: "design-tab",      emoji: "🏗️", tab: "design",  title: { de: "Fang hier an",            en: "Start here"           }, body: { de: "Füge Elemente wie Gehwege, Spuren und Parkstreifen hinzu.",       en: "Add street elements like sidewalks, lanes, and parking."        } },
  { target: "element-palette", emoji: "➕", tab: "design",  title: { de: "Wähle ein Element",        en: "Pick an element"      }, body: { de: "Klicke auf ein Element – es erscheint sofort im Querschnitt.",   en: "Click any element and it appears in your cross-section instantly." } },
  { target: "element-card",    emoji: "↔️", tab: "design",  title: { de: "Breite anpassen",          en: "Adjust the width"     }, body: { de: "Schalte Figuren ein, um Personen, Autos und Bäume zu sehen.",   en: "Toggle figures to see people, cars, and trees."                 } },
  { target: "cross-section",   emoji: "👁️",                title: { de: "Deine Straße",             en: "This is your street"  }, body: { de: "Sie aktualisiert sich live bei jeder Änderung.",                en: "It updates live as you make changes."                           } },
  { target: "explore-tab",     emoji: "🗺️", tab: "explore", title: { de: "Eine echte Straße laden",  en: "Load a real street"   }, body: { de: "Nutze die Karte, um OSM-Daten einer Berliner Straße zu laden.", en: "Use the map to load OSM data for any Berlin street."            } },
  { target: "export-btn",      emoji: "📥", tab: "design",  title: { de: "Design exportieren",       en: "Export your design"   }, body: { de: "Lade deinen Querschnitt als SVG herunter, wenn du fertig bist.", en: "Download your cross-section as an SVG when you're done."        } },
];

interface TourTooltipProps {
  step:   number;
  total:  number;
  lang:   Lang;
  onNext: () => void;
  onExit: () => void;
}

export function TourTooltip({ step, total, lang, onNext, onExit }: TourTooltipProps) {
  const current = TOUR_STEPS[step];
  const [pos, setPos] = useState<{ top: number; left: number } | null>(null);
  const tooltipRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    let rafId: number;
    function position() {
      const target = document.querySelector(`[data-tour="${current.target}"]`);
      if (!target || !tooltipRef.current) {
        setPos({
          top:  window.innerHeight / 2 - 80,
          left: window.innerWidth  / 2 - 128,
        });
        return;
      }
      const rect   = target.getBoundingClientRect();
      const tipH   = tooltipRef.current.offsetHeight;
      const tipW   = tooltipRef.current.offsetWidth;
      const margin = 12;
      const spaceBelow = window.innerHeight - rect.bottom;
      const top = spaceBelow > tipH + margin
        ? rect.bottom + margin
        : rect.top - tipH - margin;
      const left = Math.min(
        Math.max(rect.left + rect.width / 2 - tipW / 2, 8),
        window.innerWidth - tipW - 8
      );
      setPos({ top, left });
    }
    rafId = requestAnimationFrame(position);
    window.addEventListener("resize", position);
    return () => {
      cancelAnimationFrame(rafId);
      window.removeEventListener("resize", position);
    };
  }, [step, current.target]);

  const isLast = step === total - 1;

  return (
    <>
      {/* Backdrop */}
      <div className="fixed inset-0 z-[2900] bg-black/30 pointer-events-none" />

      {/* Tooltip */}
      <div
        ref={tooltipRef}
        style={pos ? { top: pos.top, left: pos.left } : { opacity: 0 }}
        className="fixed z-[3000] w-64 bg-[#CC0000] text-white rounded-lg p-4 shadow-xl"
      >
        <button
          onClick={onExit}
          className="absolute top-2 right-2 text-white/60 hover:text-white"
          aria-label="Close tour"
        >
          <X size={14} />
        </button>

        <div className="flex items-start gap-2 mb-3">
          <span className="text-xl leading-none mt-0.5">{current.emoji}</span>
          <div>
            <p className="font-semibold text-sm">{current.title[lang]}</p>
            <p className="text-xs text-white/80 mt-0.5">{current.body[lang]}</p>
          </div>
        </div>

        <div className="flex items-center justify-between">
          <span className="text-xs text-white/60">{step + 1}/{total}</span>
          <button
            onClick={onNext}
            aria-label={isLast ? "Finish tour" : `Next, step ${step + 2} of ${total}`}
            className="text-xs font-semibold bg-white text-[#CC0000] px-3 py-1 rounded hover:bg-white/90 transition-colors"
          >
            {isLast ? "Done ✓" : "Next →"}
          </button>
        </div>
      </div>
    </>
  );
}
