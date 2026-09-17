import { NextRequest, NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import { logAudit } from "@/lib/audit";
import { formatCurrency } from "@/lib/format";

export async function GET(_request: NextRequest, { params }: { params: Promise<{ id: string }> }) {
  const { id } = await params;
  const receipt = await prisma.receipt.findUnique({
    where: { id },
    include: { items: true, partner: true },
  });
  if (!receipt) {
    return NextResponse.json({ error: "영수증을 찾을 수 없습니다." }, { status: 404 });
  }
  return NextResponse.json(receipt);
}

export async function DELETE(_request: NextRequest, { params }: { params: Promise<{ id: string }> }) {
  const { id } = await params;
  try {
    const deleted = await prisma.receipt.delete({ where: { id } });
    await logAudit(
      "Receipt",
      deleted.id,
      "DELETE",
      `영수증 삭제: ${deleted.receiverName} ${formatCurrency(deleted.totalAmount)}`
    );
    return NextResponse.json({ ok: true });
  } catch {
    return NextResponse.json({ error: "영수증을 찾을 수 없습니다." }, { status: 404 });
  }
}
