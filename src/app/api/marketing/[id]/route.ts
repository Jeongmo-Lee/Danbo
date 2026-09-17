import { NextRequest, NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import { logAudit } from "@/lib/audit";

export async function DELETE(_request: NextRequest, { params }: { params: Promise<{ id: string }> }) {
  const { id } = await params;
  try {
    const deleted = await prisma.marketingRecord.delete({ where: { id } });
    await logAudit("MarketingRecord", deleted.id, "DELETE", `마케팅 기록 "${deleted.title}" 삭제`);
    return NextResponse.json({ ok: true });
  } catch {
    return NextResponse.json({ error: "기록을 찾을 수 없습니다." }, { status: 404 });
  }
}
