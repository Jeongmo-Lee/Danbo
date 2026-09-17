import { prisma } from "@/lib/prisma";

export type AccountCategory = "ASSET" | "LIABILITY" | "EQUITY" | "REVENUE" | "EXPENSE";

export const ACCOUNT_CATEGORY_LABEL: Record<AccountCategory, string> = {
  ASSET: "자산",
  LIABILITY: "부채",
  EQUITY: "자본",
  REVENUE: "수익",
  EXPENSE: "비용",
};

// 원단 소매업 개인사업자 기준 기본 계정과목 (필요 시 이 목록만 조정하면 됨)
export const DEFAULT_ACCOUNTS: { code: string; name: string; category: AccountCategory }[] = [
  { code: "101", name: "현금", category: "ASSET" },
  { code: "102", name: "보통예금(카드매출 포함)", category: "ASSET" },
  { code: "108", name: "외상매출금", category: "ASSET" },
  { code: "146", name: "상품(재고자산)", category: "ASSET" },
  { code: "251", name: "외상매입금", category: "LIABILITY" },
  { code: "331", name: "자본금", category: "EQUITY" },
  { code: "401", name: "매출액", category: "REVENUE" },
  { code: "411", name: "잡이익", category: "REVENUE" },
  { code: "451", name: "매입", category: "EXPENSE" },
  { code: "811", name: "판매비와관리비", category: "EXPENSE" },
  { code: "831", name: "잡손실", category: "EXPENSE" },
];

const PAYMENT_METHODS = ["CASH", "BANK", "CREDIT"] as const;
export type PaymentMethod = (typeof PAYMENT_METHODS)[number];

export function isPaymentMethod(value: unknown): value is PaymentMethod {
  return typeof value === "string" && (PAYMENT_METHODS as readonly string[]).includes(value);
}

export const PAYMENT_METHOD_LABEL: Record<PaymentMethod, string> = {
  CASH: "현금",
  BANK: "카드/계좌이체",
  CREDIT: "외상",
};

export async function ensureAccount(code: string) {
  const def = DEFAULT_ACCOUNTS.find((a) => a.code === code);
  if (!def) throw new Error(`알 수 없는 계정과목 코드: ${code}`);
  return prisma.account.upsert({
    where: { code },
    create: def,
    update: {},
  });
}

export async function ensureAllDefaultAccounts() {
  return Promise.all(DEFAULT_ACCOUNTS.map((a) => ensureAccount(a.code)));
}

function resolveAccountCodes(type: string, paymentMethod: PaymentMethod): { debitCode: string; creditCode: string } {
  const cashOrBank = paymentMethod === "BANK" ? "102" : "101";

  switch (type) {
    case "SALE":
      return { debitCode: paymentMethod === "CREDIT" ? "108" : cashOrBank, creditCode: "401" };
    case "PURCHASE":
      return { debitCode: "451", creditCode: paymentMethod === "CREDIT" ? "251" : cashOrBank };
    case "INCOME":
      return { debitCode: cashOrBank, creditCode: "411" };
    case "EXPENSE":
      return { debitCode: "811", creditCode: cashOrBank };
    default:
      throw new Error(`알 수 없는 장부 유형: ${type}`);
  }
}

type LedgerEntryForJournal = {
  id: string;
  date: Date;
  type: string;
  amount: number;
  paymentMethod: string;
  memo?: string | null;
};

/** LedgerEntry 하나에 대응하는 분개(차변/대변 1쌍)를 생성한다. */
export async function createJournalEntryForLedger(entry: LedgerEntryForJournal) {
  const paymentMethod: PaymentMethod = isPaymentMethod(entry.paymentMethod) ? entry.paymentMethod : "CASH";
  const { debitCode, creditCode } = resolveAccountCodes(entry.type, paymentMethod);

  const [debitAccount, creditAccount] = await Promise.all([ensureAccount(debitCode), ensureAccount(creditCode)]);

  return prisma.journalEntry.create({
    data: {
      date: entry.date,
      memo: entry.memo ?? null,
      ledgerEntryId: entry.id,
      lines: {
        create: [
          { accountId: debitAccount.id, side: "DEBIT", amount: entry.amount },
          { accountId: creditAccount.id, side: "CREDIT", amount: entry.amount },
        ],
      },
    },
  });
}

/** LedgerEntry 수정 시 기존 분개를 지우고 새로 생성한다 (금액/유형/결제수단이 바뀔 수 있으므로). */
export async function replaceJournalEntryForLedger(entry: LedgerEntryForJournal) {
  await prisma.journalEntry.deleteMany({ where: { ledgerEntryId: entry.id } });
  return createJournalEntryForLedger(entry);
}
