import { useT } from "../../i18n";
import type { Lang } from "../../i18n";
import type { StreetConfig } from "../../models/street";
import { Button } from "@/components/ui/button";
import { Share2, FileUp, Check, X } from "lucide-react";
import {
  TOP_BAR, BRAND_SECTION, BRAND_ICON, BRAND_TITLE, BRAND_VERSION,
  TOOLBAR_SECTION, LANG_ACTIVE, LANG_INACTIVE,
} from "./styles";

interface TopBarProps {
  lang: Lang;
  onLangChange: (lang: Lang) => void;
  street: StreetConfig;
  onStreetImport: (street: StreetConfig) => void;
  onShare: () => void;
  shareCopied: boolean;
  docsOpen: boolean;
  onDocsClose: () => void;
  onReplayTour: () => void;
}

export function TopBar({ lang, onLangChange, onStreetImport, onShare, shareCopied, docsOpen, onDocsClose, onReplayTour }: TopBarProps) {
  const t = useT();

  function handleImport() {
    const input = document.createElement("input");
    input.type = "file";
    input.accept = ".json";
    input.onchange = () => {
      const file = input.files?.[0];
      if (!file) return;
      const reader = new FileReader();
      reader.onload = () => {
        try {
          const street = JSON.parse(reader.result as string) as StreetConfig;
          onStreetImport(street);
        } catch {
          alert("Invalid JSON file");
        }
      };
      reader.readAsText(file);
    };
    input.click();
  }

  return (
    <>
      <div className={TOP_BAR}>
        <div className={BRAND_SECTION}>
          <span className={BRAND_ICON}>&#x25A3;</span>
          <span className={BRAND_TITLE}>{t("appTitle")}</span>
          <span className={BRAND_VERSION}>{t("version")}</span>
        </div>

        <div className={TOOLBAR_SECTION}>
          <Button variant="ghost" size="sm" className="h-7 px-2 text-xs gap-1" onClick={handleImport}>
            <FileUp size={12} />
            {t("importJson")}
          </Button>

          <Button variant="ghost" size="sm" className="h-7 px-2 text-xs gap-1" onClick={onShare}>
            {shareCopied ? <Check size={12} className="text-green-600" /> : <Share2 size={12} />}
            {shareCopied ? (lang === "de" ? "Kopiert!" : "Copied!") : t("share")}
          </Button>

          <div className="flex items-center gap-0.5 ml-1">
            <button className={lang === "de" ? LANG_ACTIVE : LANG_INACTIVE} onClick={() => onLangChange("de")}>DE</button>
            <button className={lang === "en" ? LANG_ACTIVE : LANG_INACTIVE} onClick={() => onLangChange("en")}>EN</button>
          </div>
          <button
            onClick={onReplayTour}
            className={LANG_INACTIVE}
            title={lang === "de" ? "Tour neu starten" : "Replay tour"}
            aria-label={lang === "de" ? "Tour neu starten" : "Replay tour"}
          >
            ?
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
