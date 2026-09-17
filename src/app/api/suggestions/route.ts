import { NextRequest, NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";

const SOURCES: Record<string, () => Promise<string[]>> = {
  ledgerProductName: async () => {
    const rows = await prisma.ledgerEntry.findMany({
      distinct: ["productName"],
      select: { productName: true },
      orderBy: { createdAt: "desc" },
      take: 50,
    });
    return rows.map((r) => r.productName);
  },
  ledgerMemo: async () => {
    const rows = await prisma.ledgerEntry.findMany({
      where: { memo: { not: null } },
      distinct: ["memo"],
      select: { memo: true },
      orderBy: { createdAt: "desc" },
      take: 50,
    });
    return rows.map((r) => r.memo).filter((m): m is string => Boolean(m));
  },
  marketingTitle: async () => {
    const rows = await prisma.marketingRecord.findMany({
      distinct: ["title"],
      select: { title: true },
      orderBy: { createdAt: "desc" },
      take: 50,
    });
    return rows.map((r) => r.title);
  },
  customerTags: async () => {
    const rows = await prisma.customer.findMany({
      where: { tags: { not: null } },
      select: { tags: true },
      orderBy: { createdAt: "desc" },
      take: 100,
    });
    const set = new Set<string>();
    for (const r of rows) {
      if (!r.tags) continue;
      for (const t of r.tags.split(",")) {
        const trimmed = t.trim();
        if (trimmed) set.add(trimmed);
      }
    }
    return Array.from(set).slice(0, 50);
  },
  customerGrade: async () => {
    const rows = await prisma.customer.findMany({
      where: { grade: { not: null } },
      distinct: ["grade"],
      select: { grade: true },
      take: 20,
    });
    return rows.map((r) => r.grade).filter((g): g is string => Boolean(g));
  },
};

export async function GET(request: NextRequest) {
  const key = request.nextUrl.searchParams.get("key");
  if (!key || !(key in SOURCES)) {
    return NextResponse.json({ error: "알 수 없는 항목입니다." }, { status: 400 });
  }
  const values = await SOURCES[key]();
  return NextResponse.json({ values });
}
