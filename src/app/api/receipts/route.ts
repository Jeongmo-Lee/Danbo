import { NextRequest, NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";

type ReceiptItemInput = {
  productId?: string | null;
  name?: string;
  quantity?: number | string;
  unitPrice?: number | string;
};

export async function GET() {
  const receipts = await prisma.receipt.findMany({
    orderBy: [{ issueDate: "desc" }, { createdAt: "desc" }],
    include: { items: true, partner: true },
  });
  return NextResponse.json(receipts);
}

export async function POST(request: NextRequest) {
  const body = await request.json();
  const {
    issueDate,
    supplierName,
    supplierBusinessNumber,
    supplierCeoName,
    supplierAddress,
    supplierBusinessType,
    supplierBusinessItem,
    partnerId,
    receiverName,
    memo,
    items,
  } = body;

  const parsedDate = typeof issueDate === "string" ? new Date(issueDate) : null;
  if (!parsedDate || Number.isNaN(parsedDate.getTime())) {
    return NextResponse.json({ error: "작성일자를 올바르게 입력해주세요." }, { status: 400 });
  }

  if (typeof supplierName !== "string" || !supplierName.trim()) {
    return NextResponse.json({ error: "공급자 상호를 입력해주세요." }, { status: 400 });
  }

  if (typeof receiverName !== "string" || !receiverName.trim()) {
    return NextResponse.json({ error: "공급받는자를 입력해주세요." }, { status: 400 });
  }

  if (!Array.isArray(items) || items.length === 0) {
    return NextResponse.json({ error: "품목을 한 개 이상 입력해주세요." }, { status: 400 });
  }

  const parsedItems: { productId: string | null; name: string; quantity: number; unitPrice: number; amount: number }[] = [];

  for (const raw of items as ReceiptItemInput[]) {
    const name = typeof raw.name === "string" ? raw.name.trim() : "";
    if (!name) {
      return NextResponse.json({ error: "품목명을 모두 입력해주세요." }, { status: 400 });
    }
    const quantity = Number(raw.quantity ?? 1);
    const unitPrice = Number(raw.unitPrice ?? 0);
    if (!Number.isFinite(quantity) || quantity <= 0) {
      return NextResponse.json({ error: "수량을 올바르게 입력해주세요." }, { status: 400 });
    }
    if (!Number.isFinite(unitPrice) || unitPrice < 0) {
      return NextResponse.json({ error: "단가를 올바르게 입력해주세요." }, { status: 400 });
    }

    let linkedProductId: string | null = null;
    if (typeof raw.productId === "string" && raw.productId.trim()) {
      const product = await prisma.product.findUnique({ where: { id: raw.productId } });
      if (product) linkedProductId = product.id;
    }

    parsedItems.push({
      productId: linkedProductId,
      name,
      quantity: Math.round(quantity),
      unitPrice: Math.round(unitPrice),
      amount: Math.round(quantity * unitPrice),
    });
  }

  let linkedPartnerId: string | null = null;
  if (typeof partnerId === "string" && partnerId.trim()) {
    const partner = await prisma.partner.findUnique({ where: { id: partnerId } });
    if (partner) linkedPartnerId = partner.id;
  }

  const totalAmount = parsedItems.reduce((sum, item) => sum + item.amount, 0);

  const receipt = await prisma.receipt.create({
    data: {
      issueDate: parsedDate,
      supplierName: supplierName.trim(),
      supplierBusinessNumber: optionalText(supplierBusinessNumber),
      supplierCeoName: optionalText(supplierCeoName),
      supplierAddress: optionalText(supplierAddress),
      supplierBusinessType: optionalText(supplierBusinessType),
      supplierBusinessItem: optionalText(supplierBusinessItem),
      partnerId: linkedPartnerId,
      receiverName: receiverName.trim(),
      totalAmount,
      memo: optionalText(memo),
      items: { create: parsedItems },
    },
    include: { items: true, partner: true },
  });

  return NextResponse.json(receipt, { status: 201 });
}

function optionalText(value: unknown): string | null {
  return typeof value === "string" && value.trim() ? value.trim() : null;
}
