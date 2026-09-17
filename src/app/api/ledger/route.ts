import { NextRequest, NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import { createLedgerEntry, LedgerEntryInputError } from "@/lib/ledger-entry";

function parseDateParam(value: string | null): Date | null {
  if (!value) return null;
  const date = new Date(`${value}T00:00:00`);
  return Number.isNaN(date.getTime()) ? null : date;
}

export async function GET(request: NextRequest) {
  const { searchParams } = new URL(request.url);
  const dateParam = searchParams.get("date");
  const fromParam = searchParams.get("from");
  const toParam = searchParams.get("to");

  const where: Record<string, unknown> = {};

  const singleDate = parseDateParam(dateParam);
  if (singleDate) {
    const next = new Date(singleDate);
    next.setDate(next.getDate() + 1);
    where.date = { gte: singleDate, lt: next };
  } else {
    const from = parseDateParam(fromParam);
    const to = parseDateParam(toParam);
    if (from || to) {
      const range: Record<string, Date> = {};
      if (from) range.gte = from;
      if (to) {
        const toEnd = new Date(to);
        toEnd.setDate(toEnd.getDate() + 1);
        range.lt = toEnd;
      }
      where.date = range;
    }
  }

  const entries = await prisma.ledgerEntry.findMany({
    where,
    orderBy: [{ date: "desc" }, { createdAt: "desc" }],
    include: { product: true, partner: true },
  });

  return NextResponse.json(entries);
}

export async function POST(request: NextRequest) {
  const body = await request.json();
  try {
    const entry = await createLedgerEntry(body);
    return NextResponse.json(entry, { status: 201 });
  } catch (err) {
    if (err instanceof LedgerEntryInputError) {
      return NextResponse.json({ error: err.message }, { status: 400 });
    }
    throw err;
  }
}
