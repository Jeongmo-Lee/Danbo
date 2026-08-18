export const LEDGER_TYPES = ["SALE", "PURCHASE", "INCOME", "EXPENSE"] as const;
export type LedgerTypeValue = (typeof LEDGER_TYPES)[number];

export function isLedgerType(value: unknown): value is LedgerTypeValue {
  return typeof value === "string" && (LEDGER_TYPES as readonly string[]).includes(value);
}
