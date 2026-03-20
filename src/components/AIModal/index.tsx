// src/components/AIModal/index.tsx
import { useState } from "react";
import type { StreetConfig, StreetElement, ElementType } from "../../models/street";
import { getElementDef } from "../../elements/registry";
import { getDefaultFigureVariant } from "../../figures/registry";
import { Button } from "@/components/ui/button";
import { X } from "lucide-react";

const AI_USED_KEY = "berlin-street-designer-ai-used";
const HF_TOKEN    = import.meta.env.VITE_HF_TOKEN ?? "";
if (import.meta.env.DEV && !HF_TOKEN) {
  console.warn("[AIModal] VITE_HF_TOKEN is not set — API calls will return 401.");
}
const VALID_TYPES = new Set<ElementType>([
  "SIDEWALK","CYCLE_LANE","CYCLE_LANE_ROAD","BUFFER","PARKING_LANE",
  "TRAFFIC_LANE","BUS_LANE","MEDIAN","PLANTING_STRIP","BUILDING_LEFT","BUILDING_RIGHT",
]);

const SYSTEM_PROMPT = `You are a street cross-section designer. Given a description, output ONLY valid JSON — no explanation, no markdown, no code block.

Available element types and typical widths (in meters):
- BUILDING_LEFT: 6 (left building facade — always include first if present)
- SIDEWALK: 2–5
- PLANTING_STRIP: 1–3 (trees, greenery)
- CYCLE_LANE: 1.5–2.5 (bike lane at sidewalk level)
- BUFFER: 0.5–1 (separation strip)
- CYCLE_LANE_ROAD: 1.5–2 (bike lane at road level)
- PARKING_LANE: 2.4–4.8
- TRAFFIC_LANE: 3–3.5 (one car lane)
- BUS_LANE: 3–3.5
- MEDIAN: 0.5–3 (central island)
- BUILDING_RIGHT: 6 (right building facade — always include last if present)

Output format — a JSON object with "name" (short street name from description) and "elements" array:
{"name":"Example Street","elements":[{"type":"BUILDING_LEFT","width_m":6},{"type":"SIDEWALK","width_m":3},{"type":"TRAFFIC_LANE","width_m":3.25},{"type":"TRAFFIC_LANE","width_m":3.25},{"type":"SIDEWALK","width_m":3},{"type":"BUILDING_RIGHT","width_m":6}]}

Rules:
- Always use symmetric layout unless description says otherwise
- BUILDING_LEFT must be first element if included, BUILDING_RIGHT must be last
- Use only the exact type strings listed above
- width_m must be a number`;

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
      const formattedPrompt =
        `<|im_start|>system\n${SYSTEM_PROMPT}<|im_end|>\n` +
        `<|im_start|>user\n${prompt.trim()}<|im_end|>\n` +
        `<|im_start|>assistant\n`;

      const res = await fetch(
        "https://api-inference.huggingface.co/models/Qwen/Qwen2.5-7B-Instruct",
        {
          method: "POST",
          headers: {
            "Content-Type": "application/json",
            "Authorization": `Bearer ${HF_TOKEN}`,
          },
          body: JSON.stringify({
            inputs: formattedPrompt,
            parameters: { max_new_tokens: 800, temperature: 0.3, return_full_text: false },
          }),
        }
      );
      if (!res.ok) throw new Error(`API error ${res.status}`);
      const data = await res.json();
      const raw  = Array.isArray(data) ? (data[0]?.generated_text ?? "") : "";

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
            width_m:  typeof e.width_m === "number" ? e.width_m : def.defaultWidth_m,
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

      localStorage.setItem(AI_USED_KEY, "1");
      setAlreadyUsed(true);
      onGenerate(street);
    } catch (e) {
      console.error(e);
      setError(lang === "de" ? "Fehler beim Generieren. Bitte versuche es erneut." : "Generation failed. Please try again.");
    } finally {
      setLoading(false);
    }
  }

  return (
    <div className="fixed inset-0 z-[2000] flex items-center justify-center bg-black/40" onClick={onClose}>
      <div className="bg-background rounded-lg shadow-xl w-full max-w-md mx-4 p-5 flex flex-col gap-4" onClick={(e) => e.stopPropagation()}>
        <div className="flex items-center justify-between">
          <h2 className="text-sm font-semibold">
            {lang === "de" ? "Straße aus Beschreibung generieren" : "Generate street from description"}
          </h2>
          <button onClick={onClose} aria-label={lang === "de" ? "Schließen" : "Close"} className="text-muted-foreground hover:text-foreground">
            <X size={14} />
          </button>
        </div>

        {alreadyUsed ? (
          <p className="text-xs text-muted-foreground">
            {lang === "de"
              ? "Du hast deine kostenlose Generierung bereits verwendet."
              : "You've already used your free generation."}
          </p>
        ) : (
          <>
            <textarea
              className="w-full rounded border border-input bg-background px-3 py-2 text-xs resize-none focus:outline-none focus:ring-1 focus:ring-ring"
              rows={4}
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
  );
}
