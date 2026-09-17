import { NextRequest, NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import { logAudit } from "@/lib/audit";

export async function GET() {
  const records = await prisma.marketingRecord.findMany({
    orderBy: { date: "desc" },
  });
  return NextResponse.json(records);
}

export async function POST(request: NextRequest) {
  const body = await request.json();
  const { date, channel, title, metrics, memo } = body;

  const parsedDate = typeof date === "string" ? new Date(date) : null;
  if (!parsedDate || Number.isNaN(parsedDate.getTime())) {
    return NextResponse.json({ error: "날짜를 올바르게 입력해주세요." }, { status: 400 });
  }
  if (typeof channel !== "string" || !channel.trim()) {
    return NextResponse.json({ error: "채널을 선택해주세요." }, { status: 400 });
  }
  if (typeof title !== "string" || !title.trim()) {
    return NextResponse.json({ error: "제목을 입력해주세요." }, { status: 400 });
  }

  const record = await prisma.marketingRecord.create({
    data: {
      date: parsedDate,
      channel: channel.trim(),
      title: title.trim(),
      metrics: typeof metrics === "string" && metrics.trim() ? metrics.trim() : null,
      memo: typeof memo === "string" && memo.trim() ? memo.trim() : null,
    },
  });

  await logAudit("MarketingRecord", record.id, "CREATE", `마케팅 기록 "${record.title}" (${record.channel}) 등록`);

  return NextResponse.json(record, { status: 201 });
}
