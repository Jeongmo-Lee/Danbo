import { NextRequest, NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";

export async function PATCH(request: NextRequest, { params }: { params: Promise<{ id: string }> }) {
  const { id } = await params;
  const body = await request.json();
  const { name, unitPrice, unit, memo } = body;

  const data: { name?: string; unitPrice?: number; unit?: string | null; memo?: string | null } = {};

  if (name !== undefined) {
    if (typeof name !== "string" || !name.trim()) {
      return NextResponse.json({ error: "상품 이름을 입력해주세요." }, { status: 400 });
    }
    data.name = name.trim();
  }

  if (unitPrice !== undefined) {
    const parsedPrice = Number(unitPrice);
    if (!Number.isFinite(parsedPrice) || parsedPrice < 0) {
      return NextResponse.json({ error: "단가를 올바르게 입력해주세요." }, { status: 400 });
    }
    data.unitPrice = Math.round(parsedPrice);
  }

  if (unit !== undefined) {
    data.unit = typeof unit === "string" && unit.trim() ? unit.trim() : null;
  }

  if (memo !== undefined) {
    data.memo = typeof memo === "string" && memo.trim() ? memo.trim() : null;
  }

  try {
    const product = await prisma.product.update({
      where: { id },
      data,
    });
    return NextResponse.json(product);
  } catch {
    return NextResponse.json({ error: "상품을 찾을 수 없습니다." }, { status: 404 });
  }
}

export async function DELETE(_request: NextRequest, { params }: { params: Promise<{ id: string }> }) {
  const { id } = await params;
  try {
    await prisma.product.delete({ where: { id } });
    return NextResponse.json({ ok: true });
  } catch {
    return NextResponse.json({ error: "상품을 찾을 수 없습니다." }, { status: 404 });
  }
}
