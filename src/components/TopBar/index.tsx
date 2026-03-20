import { useT } from "../../i18n";
import type { Lang } from "../../i18n";
import { X, HelpCircle } from "lucide-react";
import {
  TOP_BAR, BRAND_SECTION, BRAND_ICON, BRAND_TITLE, BRAND_VERSION,
  TOOLBAR_SECTION, LANG_INACTIVE,
} from "./styles";

interface TopBarProps {
  lang: Lang;
  onLangChange: (lang: Lang) => void;
  docsOpen: boolean;
  onDocsClose: () => void;
  onReplayTour: () => void;
}

export function TopBar({ lang, onLangChange, docsOpen, onDocsClose, onReplayTour }: TopBarProps) {
  const t = useT();

  return (
    <>
      <div className={TOP_BAR}>
        <div className={BRAND_SECTION}>
          <span className={BRAND_ICON}>&#x25A3;</span>
          <span className={BRAND_TITLE}>{t("appTitle")}</span>
          <span className={BRAND_VERSION}>{t("version")}</span>
        </div>

        <div className={TOOLBAR_SECTION}>
          <select
            className="h-7 px-1.5 text-xs text-muted-foreground bg-background border border-border rounded cursor-pointer"
            value={lang}
            onChange={(e) => onLangChange(e.target.value as "de" | "en")}
            aria-label="Language"
          >
            <option value="de">DE</option>
            <option value="en">EN</option>
          </select>
          <button
            onClick={onReplayTour}
            className={LANG_INACTIVE}
            title={lang === "de" ? "Tour neu starten" : "Replay tour"}
            aria-label={lang === "de" ? "Tour neu starten" : "Replay tour"}
          >
            <HelpCircle size={14} />
          </button>
        </div>
      </div>

      {/* Documentation modal */}
      {docsOpen && (
        <div className="fixed inset-0 z-[2000] flex items-center justify-center bg-black/40" onClick={() => onDocsClose()}>
          <div className="relative bg-background rounded-lg border border-border shadow-lg p-6 w-full max-w-md mx-4" onClick={(e) => e.stopPropagation()}>
            <button className="absolute top-3 right-3 text-muted-foreground hover:text-foreground" onClick={() => onDocsClose()}>
              <X size={16} />
            </button>
            <h2 className="text-sm font-semibold mb-3">{t("documentation")}</h2>
            <div className="text-xs text-muted-foreground space-y-2">
              <p><strong className="text-foreground">Erkunden</strong> — Suche nach einer Straße in Berlin und generiere einen Querschnitt aus OSM-Daten.</p>
              <p><strong className="text-foreground">Entwerfen</strong> — Füge Elemente hinzu, ändere Breiten und ordne sie per Drag & Drop neu an.</p>
              <p><strong className="text-foreground">Bewerten</strong> — Prüft den Entwurf anhand der Berliner Planungsrichtlinien (RASt 06).</p>
              <p className="pt-1 border-t border-border">Regeln R01–R10 basieren auf der Richtlinie für die Anlage von Stadtstraßen (RASt 06).</p>
            </div>
          </div>
        </div>
      )}
    </>
  );
}
