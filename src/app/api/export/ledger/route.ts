import { NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import { toCsv, csvResponseHeaders } from "@/lib/csv";
import { LEDGER_TYPE_LABEL } from "@/lib/format";
import { PAYMENT_METHOD_LABEL } from "@/lib/accounting";

export async function GET() {
  const entries = await prisma.ledgerEntry.findMany({ orderBy: [{ date: "asc" }] });

  const rows = entries.map((e) => [
    new Date(e.date).toLocaleDateString("ko-KR"),
    LEDGER_TYPE_LABEL[e.type] ?? e.type,
    e.productName,
    e.partnerName ?? "",
    e.quantity,
    e.unitPrice,
    e.amount,
    PAYMENT_METHOD_LABEL[e.paymentMethod as keyof typeof PAYMENT_METHOD_LABEL] ?? e.paymentMethod,
    e.memo ?? "",
  ]);

  const csv = toCsv(["날짜", "구분", "항목", "거래처", "수량", "단가", "금액", "결제수단", "메모"], rows);
  return new NextResponse(csv, { headers: csvResponseHeaders("danbo-ledger.csv") });
}
