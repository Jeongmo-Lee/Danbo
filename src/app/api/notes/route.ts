import { NextRequest, NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import { logAudit } from "@/lib/audit";

export async function GET(request: NextRequest) {
  const { searchParams } = new URL(request.url);
  const dateParam = searchParams.get("date");

  const where: Record<string, unknown> = {};
  if (dateParam) {
    const date = new Date(`${dateParam}T00:00:00`);
    if (!Number.isNaN(date.getTime())) {
      const next = new Date(date);
      next.setDate(next.getDate() + 1);
      where.date = { gte: date, lt: next };
    }
  }

  const notes = await prisma.dailyNote.findMany({
    where,
    orderBy: [{ date: "desc" }, { createdAt: "desc" }],
    take: 100,
  });
  return NextResponse.json(notes);
}

export async function POST(request: NextRequest) {
  const body = await request.json();
  const { date, tag, content } = body;

  const parsedDate = typeof date === "string" && date ? new Date(`${date}T00:00:00`) : new Date();
  if (Number.isNaN(parsedDate.getTime())) {
    return NextResponse.json({ error: "날짜를 올바르게 입력해주세요." }, { status: 400 });
  }
  if (typeof content !== "string" || !content.trim()) {
    return NextResponse.json({ error: "내용을 입력해주세요." }, { status: 400 });
  }

  const note = await prisma.dailyNote.create({
    data: {
      date: parsedDate,
      tag: typeof tag === "string" && tag.trim() ? tag.trim() : null,
      content: content.trim(),
    },
  });

  await logAudit("DailyNote", note.id, "CREATE", `메모 등록: ${note.content.slice(0, 40)}`);

  return NextResponse.json(note, { status: 201 });
}
