export function formatCurrency(amount: number): string {
  return new Intl.NumberFormat("ko-KR").format(amount) + "원";
}

export function toDateInputValue(date: Date): string {
  const tzOffset = date.getTimezoneOffset() * 60000;
  return new Date(date.getTime() - tzOffset).toISOString().slice(0, 10);
}

export function todayDateInputValue(): string {
  return toDateInputValue(new Date());
}

export const LEDGER_TYPE_LABEL: Record<string, string> = {
  SALE: "매출",
  PURCHASE: "매입",
  INCOME: "기타수입",
  EXPENSE: "기타지출",
};
