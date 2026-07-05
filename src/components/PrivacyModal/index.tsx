import { useState } from "react";
import { X } from "lucide-react";
import type { Lang } from "../../i18n";

interface PrivacyModalProps {
  lang: Lang;
}

export function PrivacyModal({ lang }: PrivacyModalProps) {
  const [open, setOpen] = useState(false);

  return (
    <>
      <button
        className="text-[10px] text-muted-foreground hover:text-foreground underline-offset-2 hover:underline"
        onClick={() => setOpen(true)}
      >
        {lang === "de" ? "Datenschutz" : "Privacy"}
      </button>

      {/* Backdrop */}
      {open && (
        <div
          className="fixed inset-0 z-[2000] bg-black/20"
          onClick={() => setOpen(false)}
        />
      )}

      {/* Side drawer */}
      <div
        className={`fixed top-0 right-0 z-[2001] h-full w-80 bg-background border-l border-border shadow-xl flex flex-col transition-transform duration-200 ${open ? "translate-x-0" : "translate-x-full"}`}
      >
        {/* Header */}
        <div className="flex items-center justify-between px-4 py-3 border-b border-border">
          <span className="text-sm font-semibold text-foreground">
            {lang === "de" ? "Datenschutzerklärung" : "Privacy Policy"}
          </span>
          <button
            className="text-muted-foreground hover:text-foreground"
            onClick={() => setOpen(false)}
            aria-label={lang === "de" ? "Schließen" : "Close"}
          >
            <X size={14} />
          </button>
        </div>

        {/* Content */}
        <div className="flex-1 overflow-y-auto px-4 py-4">
          {lang === "de" ? (
            <div className="text-xs text-muted-foreground space-y-3">
              <p>Street Generator ist ein kostenloses Browser-Tool ohne Konto, ohne Login und ohne Backend-Datenbank. Alle Entwurfsdaten bleiben im Browser.</p>

              <div>
                <p className="font-medium text-foreground mb-1">Anonyme Nutzungsanalyse</p>
                <p>Wir verwenden <strong>PostHog</strong> (EU-Server, DSGVO-konform) für anonyme Nutzungsstatistiken. Es werden keine personenbezogenen Daten, keine Straßeninhalte und keine Standortdaten erfasst. IP-Adressen werden anonymisiert. Es werden keine Cookies gesetzt und keine sitzungsübergreifende Verfolgung durchgeführt — alle Analysedaten existieren nur im Arbeitsspeicher und werden beim Schließen der Seite gelöscht.</p>
              </div>

              <div>
                <p className="font-medium text-foreground mb-1">Was erfasst wird</p>
                <ul className="list-disc pl-4 space-y-0.5">
                  <li>Seitenaufrufe</li>
                  <li>Exportaktionen (Format: PNG / SVG / JSON)</li>
                  <li>KI-Generierung (Erfolg / Fehler)</li>
                  <li>Vorlagenauswahl, Touren, Sprachwechsel, Dunkelmodus</li>
                </ul>
              </div>

              <div>
                <p className="font-medium text-foreground mb-1">Was nicht erfasst wird</p>
                <ul className="list-disc pl-4 space-y-0.5">
                  <li>Straßennamen oder -inhalte</li>
                  <li>Kartenstandorte</li>
                  <li>Eingaben im KI-Generator</li>
                  <li>Persönlich identifizierbare Informationen</li>
                </ul>
              </div>

              <div>
                <p className="font-medium text-foreground mb-1">Drittanbieter</p>
                <p>Die App wird auf <strong>Vercel</strong> gehostet. Die KI-Funktion verwendet <strong>Groq</strong>. Analysen werden von <strong>PostHog</strong> (EU) verarbeitet. Kartendaten stammen von <strong>OpenStreetMap</strong>.</p>
              </div>

              <div>
                <p className="font-medium text-foreground mb-1">Kinder unter 13 Jahren</p>
                <p>Dieses Tool richtet sich nicht an Kinder unter 13 Jahren. Wir erfassen wissentlich keine Daten von Kindern.</p>
              </div>

              <div>
                <p className="font-medium text-foreground mb-1">Kontakt</p>
                <p>Bei Fragen: <a href="mailto:info@streetgenerator.com" className="underline">info@streetgenerator.com</a></p>
              </div>

              <p className="text-[10px] text-muted-foreground/60">Zuletzt aktualisiert: Mai 2026</p>
            </div>
          ) : (
            <div className="text-xs text-muted-foreground space-y-3">
              <p>Street Generator is a free browser tool with no account, no login, and no backend database. All design data stays in your browser.</p>

              <div>
                <p className="font-medium text-foreground mb-1">Anonymous usage analytics</p>
                <p>We use <strong>PostHog</strong> (EU servers, GDPR-compliant) for anonymous usage statistics. No personal data, no street content, and no location data is collected. IP addresses are anonymised. No cookies are set and no cross-session tracking occurs — all analytics data lives only in memory and is discarded when you close the page.</p>
              </div>

              <div>
                <p className="font-medium text-foreground mb-1">What is tracked</p>
                <ul className="list-disc pl-4 space-y-0.5">
                  <li>Page views</li>
                  <li>Export actions (format: PNG / SVG / JSON)</li>
                  <li>AI generation (success / failure)</li>
                  <li>Template selection, tours, language switches, dark mode</li>
                </ul>
              </div>

              <div>
                <p className="font-medium text-foreground mb-1">What is NOT tracked</p>
                <ul className="list-disc pl-4 space-y-0.5">
                  <li>Street names or content you design</li>
                  <li>Map locations you search or click</li>
                  <li>Text you type into the AI generator</li>
                  <li>Any personally identifiable information</li>
                </ul>
              </div>

              <div>
                <p className="font-medium text-foreground mb-1">Third-party services</p>
                <p>This app is hosted on <strong>Vercel</strong>. The AI feature uses <strong>Groq</strong>. Analytics are processed by <strong>PostHog</strong> (EU). Map data comes from <strong>OpenStreetMap</strong>.</p>
              </div>

              <div>
                <p className="font-medium text-foreground mb-1">Children under 13</p>
                <p>This tool is not intended for children under 13. We do not knowingly collect data from children.</p>
              </div>

              <div>
                <p className="font-medium text-foreground mb-1">Contact</p>
                <p>For any privacy questions: <a href="mailto:info@streetgenerator.com" className="underline">info@streetgenerator.com</a></p>
              </div>

              <p className="text-[10px] text-muted-foreground/60">Last updated: May 2026</p>
            </div>
          )}
        </div>
      </div>
    </>
  );
}
