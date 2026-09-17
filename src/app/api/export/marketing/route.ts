import { NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import { toCsv, csvResponseHeaders } from "@/lib/csv";

export async function GET() {
  const records = await prisma.marketingRecord.findMany({ orderBy: { date: "asc" } });

  const rows = records.map((r) => [
    new Date(r.date).toLocaleDateString("ko-KR"),
    r.channel,
    r.title,
    r.metrics ?? "",
    r.memo ?? "",
  ]);

  const csv = toCsv(["날짜", "채널", "제목", "성과", "메모"], rows);
  return new NextResponse(csv, { headers: csvResponseHeaders("danbo-marketing.csv") });
}
