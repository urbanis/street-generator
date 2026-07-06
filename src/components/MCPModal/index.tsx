import { X } from "lucide-react";
import type { Lang } from "../../i18n";

const REPO_URL = "https://github.com/urbanis/street-generator-mcp";

interface MCPModalProps {
  lang: Lang;
  onClose: () => void;
}

export function MCPModal({ lang, onClose }: MCPModalProps) {
  const de = lang === "de";

  return (
    <>
      {/* Backdrop */}
      <div className="fixed inset-0 z-[3000] bg-black/40" onClick={onClose} />

      {/* Centered card */}
      <div
        role="dialog"
        aria-modal="true"
        aria-labelledby="mcp-modal-title"
        className="fixed left-1/2 top-1/2 z-[3001] w-[calc(100%-2rem)] max-w-md -translate-x-1/2 -translate-y-1/2 rounded-lg border border-border bg-background p-6 shadow-xl"
      >
        <button
          onClick={onClose}
          aria-label={de ? "Schließen" : "Close"}
          className="absolute right-3 top-3 text-muted-foreground hover:text-foreground"
        >
          <X size={16} />
        </button>

        <div className="flex flex-col gap-3">
          <span className="text-3xl">🧩</span>
          <h2 id="mcp-modal-title" className="text-lg font-bold text-foreground">
            {de ? "Neu: Street Generator MCP" : "New: Street Generator MCP"}
          </h2>
          <p className="text-sm text-muted-foreground">
            {de
              ? "Entwirf und importiere Straßen mit Claude über den neuen Street Generator MCP-Server. Beschreibe eine Straße oder eine Adresse und erhalte einen Querschnitt."
              : "Design and import streets with Claude using the new Street Generator MCP server. Describe a street or an address and get a cross-section back."}
          </p>

          <div className="mt-2 flex items-center justify-end gap-3">
            <button
              onClick={onClose}
              className="px-3 py-2 text-sm text-muted-foreground hover:text-foreground transition-colors"
            >
              {de ? "Schließen" : "Got it"}
            </button>
            <a
              href={REPO_URL}
              target="_blank"
              rel="noopener noreferrer"
              onClick={onClose}
              className="rounded bg-primary px-4 py-2 text-sm font-medium text-primary-foreground hover:bg-primary/90 transition-colors"
            >
              {de ? "Auf GitHub ansehen ↗" : "View on GitHub ↗"}
            </a>
          </div>
        </div>
      </div>
    </>
  );
}
