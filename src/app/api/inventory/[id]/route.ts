import { NextRequest, NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";

export async function PATCH(request: NextRequest, { params }: { params: Promise<{ id: string }> }) {
  const { id } = await params;
  const body = await request.json();
  const { safetyStock, location } = body;

  const data: { safetyStock?: number; location?: string | null } = {};

  if (safetyStock !== undefined) {
    const parsed = Number(safetyStock);
    if (!Number.isFinite(parsed) || parsed < 0) {
      return NextResponse.json({ error: "안전재고 수량을 올바르게 입력해주세요." }, { status: 400 });
    }
    data.safetyStock = Math.round(parsed);
  }

  if (location !== undefined) {
    data.location = typeof location === "string" && location.trim() ? location.trim() : null;
  }

  try {
    const updated = await prisma.inventoryItem.update({
      where: { id },
      data,
      include: { product: true },
    });
    return NextResponse.json(updated);
  } catch {
    return NextResponse.json({ error: "재고 항목을 찾을 수 없습니다." }, { status: 404 });
  }
}
