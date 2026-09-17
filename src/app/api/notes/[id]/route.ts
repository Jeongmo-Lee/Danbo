import { NextRequest, NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import { logAudit } from "@/lib/audit";

export async function DELETE(_request: NextRequest, { params }: { params: Promise<{ id: string }> }) {
  const { id } = await params;
  try {
    const deleted = await prisma.dailyNote.delete({ where: { id } });
    await logAudit("DailyNote", deleted.id, "DELETE", `메모 삭제: ${deleted.content.slice(0, 40)}`);
    return NextResponse.json({ ok: true });
  } catch {
    return NextResponse.json({ error: "메모를 찾을 수 없습니다." }, { status: 404 });
  }
}
