import { NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import { toCsv, csvResponseHeaders } from "@/lib/csv";

export async function GET() {
  const customers = await prisma.customer.findMany({
    include: { partner: true },
    orderBy: { createdAt: "asc" },
  });

  const rows = customers.map((c) => [
    c.name,
    c.type === "FOREIGN" ? "해외" : "국내",
    c.grade ?? "",
    c.phone ?? "",
    c.tags ?? "",
    c.partner?.name ?? "",
    c.memo ?? "",
  ]);

  const csv = toCsv(["이름", "구분", "등급", "연락처", "태그", "연동 거래처", "메모"], rows);
  return new NextResponse(csv, { headers: csvResponseHeaders("danbo-customers.csv") });
}
