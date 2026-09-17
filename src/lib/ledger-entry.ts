import { prisma } from "@/lib/prisma";
import { isLedgerType, type LedgerTypeValue } from "@/lib/ledger-types";
import { logAudit } from "@/lib/audit";
import { LEDGER_TYPE_LABEL, formatCurrency } from "@/lib/format";
import { createJournalEntryForLedger, isPaymentMethod, type PaymentMethod } from "@/lib/accounting";

export class LedgerEntryInputError extends Error {}

export type LedgerEntryInput = {
  date: unknown;
  type: unknown;
  productId?: unknown;
  productName: unknown;
  partnerId?: unknown;
  partnerName?: unknown;
  quantity?: unknown;
  unitPrice: unknown;
  memo?: unknown;
  paymentMethod?: unknown;
  isSample?: unknown;
};

/**
 * 장부 항목 하나를 생성하고, 재고/감사로그/분개까지 한 번에 처리한다.
 * 단일 등록 API와 일괄 등록(batch) API가 이 함수를 공유해서
 * DB 왕복 로직이 중복되지 않게 한다.
 */
export async function createLedgerEntry(input: LedgerEntryInput) {
  const { date, type, productId, productName, partnerId, partnerName, quantity, unitPrice, memo, paymentMethod, isSample } =
    input;

  if (!isLedgerType(type)) {
    throw new LedgerEntryInputError("장부 유형이 올바르지 않습니다.");
  }
  const resolvedType = type as LedgerTypeValue;

  const resolvedPaymentMethod: PaymentMethod = isPaymentMethod(paymentMethod) ? paymentMethod : "CASH";

  const parsedDate = typeof date === "string" ? new Date(date) : null;
  if (!parsedDate || Number.isNaN(parsedDate.getTime())) {
    throw new LedgerEntryInputError("날짜를 올바르게 입력해주세요.");
  }

  if (typeof productName !== "string" || !productName.trim()) {
    throw new LedgerEntryInputError("항목 이름을 입력해주세요.");
  }

  const parsedQuantity = quantity === undefined || quantity === null || quantity === "" ? 1 : Number(quantity);
  const parsedUnitPrice = Number(unitPrice);

  if (!Number.isFinite(parsedQuantity) || parsedQuantity <= 0) {
    throw new LedgerEntryInputError("수량을 올바르게 입력해주세요.");
  }
  if (!Number.isFinite(parsedUnitPrice) || parsedUnitPrice < 0) {
    throw new LedgerEntryInputError("단가/금액을 올바르게 입력해주세요.");
  }

  let linkedProductId: string | null = null;
  if (typeof productId === "string" && productId.trim()) {
    const product = await prisma.product.findUnique({ where: { id: productId } });
    if (product) linkedProductId = product.id;
  }

  let linkedPartnerId: string | null = null;
  let linkedPartnerName: string | null = null;
  if (typeof partnerId === "string" && partnerId.trim()) {
    const partner = await prisma.partner.findUnique({ where: { id: partnerId } });
    if (partner) {
      linkedPartnerId = partner.id;
      linkedPartnerName = partner.name;
    }
  }
  if (!linkedPartnerId && typeof partnerName === "string" && partnerName.trim()) {
    linkedPartnerName = partnerName.trim();
  }

  const amount = Math.round(parsedQuantity * parsedUnitPrice);

  const entry = await prisma.ledgerEntry.create({
    data: {
      date: parsedDate,
      type: resolvedType,
      productId: linkedProductId,
      productName: productName.trim(),
      partnerId: linkedPartnerId,
      partnerName: linkedPartnerName,
      quantity: Math.round(parsedQuantity),
      unitPrice: Math.round(parsedUnitPrice),
      amount,
      paymentMethod: resolvedPaymentMethod,
      isSample: Boolean(isSample),
      memo: typeof memo === "string" && memo.trim() ? memo.trim() : null,
    },
    include: { product: true, partner: true },
  });

  // 상품이 연결된 매출/매입 장부는 재고에도 자동 반영한다.
  if (linkedProductId && (resolvedType === "SALE" || resolvedType === "PURCHASE")) {
    const delta = resolvedType === "SALE" ? -Math.round(parsedQuantity) : Math.round(parsedQuantity);
    const inventoryItem = await prisma.inventoryItem.upsert({
      where: { productId: linkedProductId },
      create: { productId: linkedProductId, currentStock: Math.max(0, delta) },
      update: { currentStock: { increment: delta } },
    });
    await prisma.stockMovement.create({
      data: {
        inventoryItemId: inventoryItem.id,
        type: resolvedType === "SALE" ? "OUT" : "IN",
        quantity: Math.round(parsedQuantity),
        reason: resolvedType === "SALE" ? "매출 출고 (자동)" : "매입 입고 (자동)",
        ledgerEntryId: entry.id,
      },
    });
  }

  await logAudit(
    "LedgerEntry",
    entry.id,
    "CREATE",
    `${LEDGER_TYPE_LABEL[resolvedType]} ${entry.productName} ${formatCurrency(entry.amount)} 등록`
  );

  await createJournalEntryForLedger({
    id: entry.id,
    date: entry.date,
    type: entry.type,
    amount: entry.amount,
    paymentMethod: entry.paymentMethod,
    memo: entry.memo,
  });

  return entry;
}
