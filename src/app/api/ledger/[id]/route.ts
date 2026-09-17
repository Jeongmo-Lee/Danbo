import { NextRequest, NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import { isLedgerType } from "@/lib/ledger-types";
import { logAudit } from "@/lib/audit";
import { LEDGER_TYPE_LABEL, formatCurrency } from "@/lib/format";
import { replaceJournalEntryForLedger, isPaymentMethod } from "@/lib/accounting";

export async function PATCH(request: NextRequest, { params }: { params: Promise<{ id: string }> }) {
  const { id } = await params;
  const body = await request.json();
  const { date, type, productId, productName, partnerId, partnerName, quantity, unitPrice, memo, paymentMethod } =
    body;

  const existing = await prisma.ledgerEntry.findUnique({ where: { id } });
  if (!existing) {
    return NextResponse.json({ error: "장부 항목을 찾을 수 없습니다." }, { status: 404 });
  }

  const data: Record<string, unknown> = {};

  if (type !== undefined) {
    if (!isLedgerType(type)) {
      return NextResponse.json({ error: "장부 유형이 올바르지 않습니다." }, { status: 400 });
    }
    data.type = type;
  }

  if (date !== undefined) {
    const parsedDate = new Date(date);
    if (Number.isNaN(parsedDate.getTime())) {
      return NextResponse.json({ error: "날짜를 올바르게 입력해주세요." }, { status: 400 });
    }
    data.date = parsedDate;
  }

  if (productName !== undefined) {
    if (typeof productName !== "string" || !productName.trim()) {
      return NextResponse.json({ error: "항목 이름을 입력해주세요." }, { status: 400 });
    }
    data.productName = productName.trim();
  }

  if (productId !== undefined) {
    if (typeof productId === "string" && productId.trim()) {
      const product = await prisma.product.findUnique({ where: { id: productId } });
      data.productId = product ? product.id : null;
    } else {
      data.productId = null;
    }
  }

  if (partnerId !== undefined || partnerName !== undefined) {
    const typedName = typeof partnerName === "string" && partnerName.trim() ? partnerName.trim() : null;
    if (typeof partnerId === "string" && partnerId.trim()) {
      const partner = await prisma.partner.findUnique({ where: { id: partnerId } });
      data.partnerId = partner ? partner.id : null;
      data.partnerName = partner ? partner.name : typedName;
    } else {
      data.partnerId = null;
      data.partnerName = typedName;
    }
  }

  const nextQuantity =
    quantity !== undefined ? Number(quantity) : existing.quantity;
  const nextUnitPrice =
    unitPrice !== undefined ? Number(unitPrice) : existing.unitPrice;

  if (quantity !== undefined) {
    if (!Number.isFinite(nextQuantity) || nextQuantity <= 0) {
      return NextResponse.json({ error: "수량을 올바르게 입력해주세요." }, { status: 400 });
    }
    data.quantity = Math.round(nextQuantity);
  }
  if (unitPrice !== undefined) {
    if (!Number.isFinite(nextUnitPrice) || nextUnitPrice < 0) {
      return NextResponse.json({ error: "단가/금액을 올바르게 입력해주세요." }, { status: 400 });
    }
    data.unitPrice = Math.round(nextUnitPrice);
  }
  if (quantity !== undefined || unitPrice !== undefined) {
    data.amount = Math.round(nextQuantity * nextUnitPrice);
  }

  if (memo !== undefined) {
    data.memo = typeof memo === "string" && memo.trim() ? memo.trim() : null;
  }

  if (paymentMethod !== undefined) {
    if (!isPaymentMethod(paymentMethod)) {
      return NextResponse.json({ error: "결제수단이 올바르지 않습니다." }, { status: 400 });
    }
    data.paymentMethod = paymentMethod;
  }

  const updated = await prisma.ledgerEntry.update({
    where: { id },
    data,
    include: { product: true, partner: true },
  });

  await logAudit(
    "LedgerEntry",
    updated.id,
    "UPDATE",
    `${LEDGER_TYPE_LABEL[updated.type]} ${updated.productName} ${formatCurrency(updated.amount)} 수정`
  );

  await replaceJournalEntryForLedger({
    id: updated.id,
    date: updated.date,
    type: updated.type,
    amount: updated.amount,
    paymentMethod: updated.paymentMethod,
    memo: updated.memo,
  });

  return NextResponse.json(updated);
}

export async function DELETE(_request: NextRequest, { params }: { params: Promise<{ id: string }> }) {
  const { id } = await params;
  try {
    const deleted = await prisma.ledgerEntry.delete({ where: { id } });
    await logAudit(
      "LedgerEntry",
      deleted.id,
      "DELETE",
      `${LEDGER_TYPE_LABEL[deleted.type]} ${deleted.productName} ${formatCurrency(deleted.amount)} 삭제`
    );
    return NextResponse.json({ ok: true });
  } catch {
    return NextResponse.json({ error: "장부 항목을 찾을 수 없습니다." }, { status: 404 });
  }
}
