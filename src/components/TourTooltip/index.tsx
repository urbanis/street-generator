import { useEffect, useRef, useState } from "react";
import { X } from "lucide-react";
import type { Lang } from "../../i18n";

export interface TourStep {
  target: string;
  emoji:  string;
  tab?:   "design" | "explore" | "evaluate";
  title:  { de: string; en: string };
  body:   { de: string; en: string };
}

export const TOUR_STEPS: TourStep[] = [
  { target: "design-tab",      emoji: "🏗️", tab: "design",  title: { de: "Fang hier an",            en: "Start here"           }, body: { de: "Füge Elemente wie Gehwege, Spuren und Parkstreifen hinzu.",       en: "Add street elements like sidewalks, lanes, and parking."        } },
  { target: "element-palette", emoji: "➕", tab: "design",  title: { de: "Wähle ein Element",        en: "Pick an element"      }, body: { de: "Klicke auf ein Element – es erscheint sofort im Querschnitt.",   en: "Click any element and it appears in your cross-section instantly." } },
  { target: "element-card",    emoji: "↔️", tab: "design",  title: { de: "Breite anpassen",          en: "Adjust the width"     }, body: { de: "Schalte Figuren ein, um Personen, Autos und Bäume zu sehen.",   en: "Toggle figures to see people, cars, and trees."                 } },
  { target: "cross-section",   emoji: "👁️",                title: { de: "Deine Straße",             en: "This is your street"  }, body: { de: "Sie aktualisiert sich live bei jeder Änderung.",                en: "It updates live as you make changes."                           } },
  { target: "explore-tab",     emoji: "🗺️", tab: "explore",   title: { de: "Eine echte Straße laden",  en: "Load a real street"     }, body: { de: "Nutze die Karte, um OSM-Daten einer Berliner Straße zu laden.", en: "Use the map to load OSM data for any Berlin street."              } },
  { target: "evaluate-tab",   emoji: "✅", tab: "evaluate",  title: { de: "Entwurf bewerten",         en: "Evaluate your design"   }, body: { de: "Prüfe deinen Entwurf anhand der Berliner Planungsrichtlinien.", en: "Check your design against Berlin planning guidelines."            } },
  { target: "export-btn",     emoji: "📥", tab: "design",   title: { de: "Design exportieren",       en: "Export your design"     }, body: { de: "Lade deinen Querschnitt als PNG herunter, wenn du fertig bist.", en: "Download your cross-section as a PNG when you're done."          } },
];

interface TourTooltipProps {
  step:   number;
  total:  number;
  lang:   Lang;
  onNext: () => void;
  onBack: () => void;
  onExit: () => void;
}

interface TooltipLayout {
  top:        number;
  left:       number;
  placement:  "below" | "above";
  targetRect: { x: number; y: number; w: number; h: number } | null;
  arrowLeft:  number;
}

export function TourTooltip({ step, total, lang, onNext, onBack, onExit }: TourTooltipProps) {
  const current = TOUR_STEPS[step];
  const [layout, setLayout] = useState<TooltipLayout | null>(null);
  const tooltipRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    let rafId: number;
    function position() {
      const target = document.querySelector(`[data-tour="${current.target}"]`);
      if (!target || !tooltipRef.current) {
        setLayout({
          top:        window.innerHeight / 2 - 80,
          left:       window.innerWidth  / 2 - 128,
          placement:  "below",
          targetRect: null,
          arrowLeft:  112,
        });
        return;
      }
      const rect   = target.getBoundingClientRect();
      const tipH   = tooltipRef.current.offsetHeight;
      const tipW   = tooltipRef.current.offsetWidth;
      const margin = 12;

      // For large targets (>50% viewport), center the tooltip on screen — no arrow
      const isLargeTarget = rect.width > window.innerWidth * 0.5 || rect.height > window.innerHeight * 0.5;
      if (isLargeTarget) {
        setLayout({
          top:        window.innerHeight / 2 - tipH / 2,
          left:       window.innerWidth  / 2 - tipW / 2,
          placement:  "below",
          targetRect: { x: rect.left, y: rect.top, w: rect.width, h: rect.height },
          arrowLeft:  -999, // hide arrow
        });
        return;
      }

      const spaceBelow  = window.innerHeight - rect.bottom;
      const placement   = spaceBelow > tipH + margin ? "below" : "above";
      const top = Math.max(
        8,
        placement === "below" ? rect.bottom + margin : rect.top - tipH - margin
      );
      const left = Math.min(
        Math.max(rect.left + rect.width / 2 - tipW / 2, 8),
        window.innerWidth - tipW - 8
      );
      // Arrow: center of target relative to tooltip left, clamped
      const arrowLeft = Math.min(
        Math.max(rect.left + rect.width / 2 - left - 8, 8),
        tipW - 24
      );
      setLayout({
        top,
        left,
        placement,
        targetRect: { x: rect.left, y: rect.top, w: rect.width, h: rect.height },
        arrowLeft,
      });
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
      {/* Spotlight backdrop */}
      <svg
        className="fixed inset-0 z-[2900] pointer-events-none"
        style={{ width: "100vw", height: "100vh" }}
      >
        <path
          fillRule="evenodd"
          fill="rgba(0,0,0,0.5)"
          d={layout?.targetRect
            ? [
                `M 0 0 H ${window.innerWidth} V ${window.innerHeight} H 0 Z`,
                `M ${layout.targetRect.x - 4} ${layout.targetRect.y - 4}`,
                `H ${layout.targetRect.x + layout.targetRect.w + 4}`,
                `V ${layout.targetRect.y + layout.targetRect.h + 4}`,
                `H ${layout.targetRect.x - 4} Z`,
              ].join(" ")
            : `M 0 0 H ${window.innerWidth} V ${window.innerHeight} H 0 Z`
          }
        />
      </svg>

      {/* Tooltip */}
      {/* No overflow-hidden: arrow span uses top:-8 / bottom:-8 and must not be clipped */}
      <div
        ref={tooltipRef}
        style={layout ? { top: layout.top, left: layout.left } : { opacity: 0 }}
        className="fixed z-[3000] w-64 bg-[#B22222] text-white rounded-lg p-4 shadow-xl"
      >
        {/* Arrow pointer */}
        {layout?.targetRect && layout.arrowLeft >= 0 && (
          <span
            aria-hidden="true"
            style={{
              position:    "absolute",
              left:        layout.arrowLeft,
              width:       0,
              height:      0,
              borderLeft:  "8px solid transparent",
              borderRight: "8px solid transparent",
              ...(layout.placement === "below"
                ? { top: -8,    borderBottom: "8px solid #B22222" }
                : { bottom: -8, borderTop:    "8px solid #B22222" }
              ),
            }}
          />
        )}

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
          <div className="flex items-center gap-2">
            {step > 0 && (
              <button
                onClick={onBack}
                aria-label={`Back to step ${step} of ${total}`}
                className="text-xs text-white/70 hover:text-white transition-colors"
              >
                ← {lang === "de" ? "Zurück" : "Back"}
              </button>
            )}
            <span className="text-xs text-white/60">{step + 1}/{total}</span>
          </div>
          <button
            onClick={onNext}
            aria-label={isLast ? "Finish tour" : `Next, step ${step + 2} of ${total}`}
            className="text-xs font-semibold bg-white text-[#B22222] px-3 py-1 rounded hover:bg-white/90 transition-colors"
          >
            {isLast ? "Done ✓" : "Next →"}
          </button>
        </div>
      </div>
    </>
  );
}
