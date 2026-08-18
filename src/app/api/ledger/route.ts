import { NextRequest, NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import { isLedgerType } from "@/lib/ledger-types";

function parseDateParam(value: string | null): Date | null {
  if (!value) return null;
  const date = new Date(`${value}T00:00:00`);
  return Number.isNaN(date.getTime()) ? null : date;
}

export async function GET(request: NextRequest) {
  const { searchParams } = new URL(request.url);
  const dateParam = searchParams.get("date");
  const fromParam = searchParams.get("from");
  const toParam = searchParams.get("to");

  const where: Record<string, unknown> = {};

  const singleDate = parseDateParam(dateParam);
  if (singleDate) {
    const next = new Date(singleDate);
    next.setDate(next.getDate() + 1);
    where.date = { gte: singleDate, lt: next };
  } else {
    const from = parseDateParam(fromParam);
    const to = parseDateParam(toParam);
    if (from || to) {
      const range: Record<string, Date> = {};
      if (from) range.gte = from;
      if (to) {
        const toEnd = new Date(to);
        toEnd.setDate(toEnd.getDate() + 1);
        range.lt = toEnd;
      }
      where.date = range;
    }
  }

  const entries = await prisma.ledgerEntry.findMany({
    where,
    orderBy: [{ date: "desc" }, { createdAt: "desc" }],
    include: { product: true, partner: true },
  });

  return NextResponse.json(entries);
}

export async function POST(request: NextRequest) {
  const body = await request.json();
  const { date, type, productId, productName, partnerId, quantity, unitPrice, memo } = body;

  if (!isLedgerType(type)) {
    return NextResponse.json({ error: "장부 유형이 올바르지 않습니다." }, { status: 400 });
  }

  const parsedDate = typeof date === "string" ? new Date(date) : null;
  if (!parsedDate || Number.isNaN(parsedDate.getTime())) {
    return NextResponse.json({ error: "날짜를 올바르게 입력해주세요." }, { status: 400 });
  }

  if (typeof productName !== "string" || !productName.trim()) {
    return NextResponse.json({ error: "항목 이름을 입력해주세요." }, { status: 400 });
  }

  const parsedQuantity = quantity === undefined || quantity === null || quantity === "" ? 1 : Number(quantity);
  const parsedUnitPrice = Number(unitPrice);

  if (!Number.isFinite(parsedQuantity) || parsedQuantity <= 0) {
    return NextResponse.json({ error: "수량을 올바르게 입력해주세요." }, { status: 400 });
  }
  if (!Number.isFinite(parsedUnitPrice) || parsedUnitPrice < 0) {
    return NextResponse.json({ error: "단가/금액을 올바르게 입력해주세요." }, { status: 400 });
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

  const amount = Math.round(parsedQuantity * parsedUnitPrice);

  const entry = await prisma.ledgerEntry.create({
    data: {
      date: parsedDate,
      type,
      productId: linkedProductId,
      productName: productName.trim(),
      partnerId: linkedPartnerId,
      partnerName: linkedPartnerName,
      quantity: Math.round(parsedQuantity),
      unitPrice: Math.round(parsedUnitPrice),
      amount,
      memo: typeof memo === "string" && memo.trim() ? memo.trim() : null,
    },
    include: { product: true, partner: true },
  });

  return NextResponse.json(entry, { status: 201 });
}
