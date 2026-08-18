import { NextRequest, NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";

export async function GET() {
  const products = await prisma.product.findMany({
    orderBy: { createdAt: "desc" },
  });
  return NextResponse.json(products);
}

export async function POST(request: NextRequest) {
  const body = await request.json();
  const { name, unitPrice, unit, memo } = body;

  if (typeof name !== "string" || !name.trim()) {
    return NextResponse.json({ error: "상품 이름을 입력해주세요." }, { status: 400 });
  }
  const parsedPrice = Number(unitPrice);
  if (!Number.isFinite(parsedPrice) || parsedPrice < 0) {
    return NextResponse.json({ error: "단가를 올바르게 입력해주세요." }, { status: 400 });
  }

  const product = await prisma.product.create({
    data: {
      name: name.trim(),
      unitPrice: Math.round(parsedPrice),
      unit: typeof unit === "string" && unit.trim() ? unit.trim() : null,
      memo: typeof memo === "string" && memo.trim() ? memo.trim() : null,
    },
  });

  return NextResponse.json(product, { status: 201 });
}
