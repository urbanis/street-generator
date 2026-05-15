// src/components/AIModal/index.tsx
import { useState } from "react";
import type { StreetConfig, StreetElement, ElementType } from "../../models/street";
import { capture } from "../../lib/analytics";
import { getElementDef } from "../../elements/registry";
import { getDefaultFigureVariant } from "../../figures/registry";
import { Button } from "@/components/ui/button";
import { X } from "lucide-react";

const AI_USED_KEY = "berlin-street-designer-ai-used";

function friendlyError(raw: string, lang: "de" | "en"): string {
  const de = lang === "de";
  if (raw.includes("401"))           return de ? "API-Schlüssel ungültig oder abgelaufen." : "AI service key is invalid or expired.";
  if (raw.includes("429"))           return de ? "Zu viele Anfragen. Bitte kurz warten und erneut versuchen." : "Too many requests. Wait a moment and try again.";
  if (raw.includes("Service not configured")) return de ? "KI-Dienst ist noch nicht eingerichtet." : "AI service is not configured yet.";
  if (raw.includes("Upstream error") || raw.includes("503") || raw.includes("502"))
                                     return de ? "KI-Dienst vorübergehend nicht verfügbar. Bitte später erneut versuchen." : "AI service is temporarily unavailable. Try again later.";
  if (raw.includes("404"))           return de ? "API-Endpunkt nicht gefunden." : "AI endpoint not found.";
  if (raw.includes("No JSON"))       return de ? "Die KI hat keinen gültigen Straßenquerschnitt zurückgegeben. Beschreibung ändern und erneut versuchen." : "The AI didn't return a valid street. Try rephrasing your description.";
  if (raw.includes("No valid elements")) return de ? "Die KI konnte aus dieser Beschreibung keine Straße erzeugen. Bitte genauer beschreiben." : "The AI couldn't build a street from that description. Try being more specific.";
  if (raw.includes("parse") || raw.includes("JSON")) return de ? "Unerwartetes Antwortformat. Bitte erneut versuchen." : "Unexpected response format. Please try again.";
  return de ? "Generierung fehlgeschlagen. Bitte erneut versuchen." : "Generation failed. Please try again.";
}

const VALID_TYPES = new Set<ElementType>([
  "SIDEWALK","CYCLE_LANE","CYCLE_LANE_ROAD","BUFFER","PARKING_LANE",
  "TRAFFIC_LANE","BUS_LANE","MEDIAN","PLANTING_STRIP","BUILDING_LEFT","BUILDING_RIGHT",
]);


interface AIModalProps {
  lang:       "de" | "en";
  onGenerate: (street: StreetConfig) => void;
  onClose:    () => void;
}

export function AIModal({ lang, onGenerate, onClose }: AIModalProps) {
  const [alreadyUsed, setAlreadyUsed] = useState(() => !!localStorage.getItem(AI_USED_KEY));
  const [prompt, setPrompt]       = useState("");
  const [loading, setLoading]     = useState(false);
  const [error, setError]         = useState<string | null>(null);

  async function handleGenerate() {
    if (!prompt.trim()) return;
    setLoading(true);
    setError(null);
    try {
      const res = await fetch("/api/generate", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ prompt: prompt.trim() }),
      });
      if (!res.ok) {
        let errMsg = `API error ${res.status}`;
        try {
          const errData = await res.json() as { error?: string };
          if (errData.error) errMsg = errData.error;
        } catch { /* ignore parse failure */ }
        throw new Error(errMsg);
      }
      const data = await res.json();
      const raw  = data.choices?.[0]?.message?.content ?? "";

      // Extract JSON from response (strip any accidental markdown)
      const jsonMatch = raw.match(/\{[\s\S]*\}/);
      if (!jsonMatch) throw new Error("No JSON in response");
      const parsed = JSON.parse(jsonMatch[0]) as { name?: string; elements?: { type: string; width_m: number }[] };

      const elements: StreetElement[] = (parsed.elements ?? [])
        .filter((e) => VALID_TYPES.has(e.type as ElementType))
        .map((e) => {
          const type        = e.type as ElementType;
          const def         = getElementDef(type);
          const isBuilding  = type === "BUILDING_LEFT" || type === "BUILDING_RIGHT";
          const defaultVariant = getDefaultFigureVariant(type);
          return {
            id:       crypto.randomUUID(),
            type,
            side:     "LEFT" as const,
            width_m:  typeof e.width_m === "number" ? Math.min(Math.max(e.width_m, 0.1), 30) : def.defaultWidth_m,
            building: isBuilding ? { floors: Array.from({ length: 3 }, () => ({ use: "Wohnen" as const, height_m: 3 as const })) } : undefined,
            figure: defaultVariant ? { show: true, variant: defaultVariant } : undefined,
          };
        });

      if (elements.length === 0) throw new Error("No valid elements generated");

      const street: StreetConfig = {
        id:       crypto.randomUUID(),
        name:     (parsed.name ?? prompt.trim()).slice(0, 40),
        elements,
      };

      capture("ai_generated", { success: true });
      localStorage.setItem(AI_USED_KEY, "1");
      setAlreadyUsed(true);
      onGenerate(street);
    } catch (e) {
      console.error("[AIModal] caught:", e);
      const raw = e instanceof Error ? e.message : String(e);
      capture("ai_generated", { success: false, error: raw });
      setError(friendlyError(raw, lang));
    } finally {
      setLoading(false);
    }
  }

  return (
    <>
      {/* Side panel */}
      <div
        className="h-full bg-background border-l border-border flex flex-col"
        onClick={(e) => e.stopPropagation()}
      >
        {/* Header */}
        <div className="flex items-center justify-between px-4 py-3 border-b border-border">
          <h2 className="text-sm font-semibold">
            {lang === "de" ? "KI-Straßengenerator" : "AI Street Generator"}
          </h2>
          <button onClick={onClose} aria-label={lang === "de" ? "Schließen" : "Close"} className="text-muted-foreground hover:text-foreground">
            <X size={14} />
          </button>
        </div>

        {/* Content */}
        <div className="flex-1 overflow-y-auto px-4 py-4 flex flex-col gap-4">
          {alreadyUsed ? (
            <p className="text-xs text-muted-foreground">
              {lang === "de"
                ? "Du hast deine kostenlose Generierung bereits verwendet."
                : "You've already used your free generation."}
            </p>
          ) : (
            <>
              <p className="text-xs text-muted-foreground">
                {lang === "de"
                  ? "Beschreibe eine Straße und die KI generiert den Querschnitt automatisch."
                  : "Describe a street and the AI will generate the cross-section automatically."}
              </p>
              <textarea
                className="w-full rounded border border-input bg-background px-3 py-2 text-xs resize-none focus:outline-none focus:ring-1 focus:ring-ring"
                rows={5}
                aria-label={lang === "de" ? "Straßenbeschreibung" : "Street description"}
                placeholder={
                  lang === "de"
                    ? "Eine ruhige Wohnstraße mit breiten Gehwegen, Bäumen und einem geschützten Radweg auf jeder Seite…"
                    : "A calm residential street with wide sidewalks, trees, and a protected bike lane on each side…"
                }
                value={prompt}
                onChange={(e) => setPrompt(e.target.value)}
                disabled={loading}
              />
              {error && <p className="text-xs text-destructive">{error}</p>}
              <div className="flex items-center justify-between">
                <span className="text-[10px] text-muted-foreground">
                  {lang === "de" ? "1 kostenlose Generierung pro Browser" : "1 free generation per browser"}
                </span>
                <Button
                  size="sm"
                  className="h-7 text-xs"
                  onClick={handleGenerate}
                  disabled={loading || !prompt.trim()}
                >
                  {loading ? (
                    <span className="flex items-center gap-1.5">
                      <span className="h-3 w-3 rounded-full border-2 border-current border-t-transparent animate-spin" />
                      {lang === "de" ? "Generiere…" : "Generating…"}
                    </span>
                  ) : (
                    lang === "de" ? "Generieren →" : "Generate →"
                  )}
                </Button>
              </div>
            </>
          )}
        </div>
      </div>
    </>
  );
}
