import { NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";

export async function GET() {
  const sampleEntries = await prisma.ledgerEntry.findMany({
    where: { isSample: true, type: "SALE", partnerId: { not: null } },
    orderBy: { date: "asc" },
    select: { partnerId: true, partnerName: true, date: true },
  });

  const firstSampleByPartner = new Map<string, { partnerName: string | null; date: Date }>();
  for (const e of sampleEntries) {
    if (!e.partnerId) continue;
    const existing = firstSampleByPartner.get(e.partnerId);
    if (!existing || e.date < existing.date) {
      firstSampleByPartner.set(e.partnerId, { partnerName: e.partnerName, date: e.date });
    }
  }

  const partnerIds = Array.from(firstSampleByPartner.keys());

  const partners = await Promise.all(
    partnerIds.map(async (partnerId) => {
      const first = firstSampleByPartner.get(partnerId)!;
      const converted = await prisma.ledgerEntry.findFirst({
        where: {
          partnerId,
          type: "SALE",
          isSample: false,
          date: { gte: first.date },
        },
        orderBy: { date: "asc" },
      });
      return {
        partnerId,
        partnerName: first.partnerName,
        firstSampleDate: first.date,
        converted: Boolean(converted),
        firstOrderDate: converted ? converted.date : null,
        firstOrderAmount: converted ? converted.amount : null,
      };
    })
  );

  partners.sort((a, b) => new Date(b.firstSampleDate).getTime() - new Date(a.firstSampleDate).getTime());

  const convertedCount = partners.filter((p) => p.converted).length;

  return NextResponse.json({
    totalSampleCustomers: partners.length,
    convertedCount,
    conversionRate: partners.length > 0 ? convertedCount / partners.length : 0,
    partners,
  });
}
