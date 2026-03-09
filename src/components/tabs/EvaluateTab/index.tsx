import { BookOpen } from "lucide-react";
import { useLang } from "../../../i18n";
import type { ValidationResultItem } from "../../../rules/types";
import {
  EVALUATE_TAB, RULE_ITEM, RULE_PASS, RULE_WARN, RULE_FAIL,
  STATUS_BADGE_PASS, STATUS_BADGE_WARN, STATUS_BADGE_FAIL,
} from "./styles";

interface EvaluateTabProps {
  results:    ValidationResultItem[];
  onOpenDocs: () => void;
}

const ITEM_CLASS = { PASS: RULE_PASS, WARN: RULE_WARN, FAIL: RULE_FAIL };
const BADGE_CLASS = { PASS: STATUS_BADGE_PASS, WARN: STATUS_BADGE_WARN, FAIL: STATUS_BADGE_FAIL };

export function EvaluateTab({ results, onOpenDocs }: EvaluateTabProps) {
  const lang = useLang();

  const docsButton = (
    <button
      className="flex items-center gap-1 text-xs text-muted-foreground hover:text-foreground w-full border border-border rounded px-2 py-1.5 mb-1"
      onClick={onOpenDocs}
    >
      <BookOpen size={12} />
      {lang === "de" ? "Dokumentation" : "Documentation"}
    </button>
  );

  if (results.length === 0) {
    return (
      <div className={EVALUATE_TAB}>
        {docsButton}
        <p className="text-xs text-muted-foreground">No elements to validate.</p>
      </div>
    );
  }

  return (
    <div className={EVALUATE_TAB}>
      {docsButton}
      {results.map((r, i) => (
        <div key={i} className={`${RULE_ITEM} ${ITEM_CLASS[r.status]}`}>
          <span className={BADGE_CLASS[r.status]}>{r.rule_id}</span>
          <span className="flex-1">
            {lang === "de" ? r.message_de : r.message_en}
          </span>
        </div>
      ))}
    </div>
  );
}
