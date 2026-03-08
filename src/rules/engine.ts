import type { StreetConfig } from "../models/street";
import type { ValidationResultItem } from "./types";
import { runRastRules } from "./de_rast_v01_rules";

export function runValidation(
  street: StreetConfig,
  _lang: string
): ValidationResultItem[] {
  return runRastRules(street);
}
