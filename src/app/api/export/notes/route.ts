import { NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import { toCsv, csvResponseHeaders } from "@/lib/csv";

export async function GET() {
  const notes = await prisma.dailyNote.findMany({ orderBy: { date: "asc" } });

  const rows = notes.map((n) => [new Date(n.date).toLocaleDateString("ko-KR"), n.tag ?? "", n.content]);

  const csv = toCsv(["날짜", "태그", "내용"], rows);
  return new NextResponse(csv, { headers: csvResponseHeaders("danbo-notes.csv") });
}
