import { NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import { toCsv, csvResponseHeaders } from "@/lib/csv";

export async function GET() {
  const items = await prisma.inventoryItem.findMany({
    include: { product: true },
    orderBy: { product: { name: "asc" } },
  });

  const rows = items.map((i) => [i.product.name, i.product.unit ?? "", i.currentStock, i.safetyStock, i.location ?? ""]);

  const csv = toCsv(["상품", "단위", "현재고", "안전재고", "위치"], rows);
  return new NextResponse(csv, { headers: csvResponseHeaders("danbo-inventory.csv") });
}
