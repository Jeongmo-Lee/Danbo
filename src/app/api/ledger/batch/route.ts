import { NextRequest, NextResponse } from "next/server";
import { createLedgerEntry, LedgerEntryInputError, type LedgerEntryInput } from "@/lib/ledger-entry";

type BatchItem = {
  productId?: unknown;
  productName: unknown;
  quantity?: unknown;
  unitPrice: unknown;
};

export async function POST(request: NextRequest) {
  const body = await request.json();
  const { date, type, partnerId, partnerName, paymentMethod, memo, isSample, items } = body;

  if (!Array.isArray(items) || items.length === 0) {
    return NextResponse.json({ error: "등록할 품목이 없습니다." }, { status: 400 });
  }

  const created = [];
  try {
    for (const item of items as BatchItem[]) {
      const input: LedgerEntryInput = {
        date,
        type,
        productId: item.productId,
        productName: item.productName,
        partnerId,
        partnerName,
        quantity: item.quantity,
        unitPrice: item.unitPrice,
        memo,
        paymentMethod,
        isSample,
      };
      const entry = await createLedgerEntry(input);
      created.push(entry);
    }
  } catch (err) {
    if (err instanceof LedgerEntryInputError) {
      return NextResponse.json({ error: err.message, created }, { status: 400 });
    }
    throw err;
  }

  return NextResponse.json({ entries: created }, { status: 201 });
}
