export type ValidationStatus = "PASS" | "WARN" | "FAIL";

export interface ValidationResultItem {
  rule_id: string;
  status: ValidationStatus;
  message_de: string;
  message_en: string;
  affected_element_ids?: string[];
}
