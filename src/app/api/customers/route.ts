import { NextRequest, NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import { logAudit } from "@/lib/audit";

const CUSTOMER_TYPES = ["DOMESTIC", "FOREIGN"] as const;

export async function GET() {
  const customers = await prisma.customer.findMany({
    include: {
      partner: true,
      activities: { orderBy: { date: "desc" }, take: 3 },
      _count: { select: { activities: true } },
    },
    orderBy: { createdAt: "desc" },
  });
  return NextResponse.json(customers);
}

export async function POST(request: NextRequest) {
  const body = await request.json();
  const { name, type, grade, tags, phone, memo, partnerId } = body;

  if (typeof name !== "string" || !name.trim()) {
    return NextResponse.json({ error: "고객 이름을 입력해주세요." }, { status: 400 });
  }
  const customerType = CUSTOMER_TYPES.includes(type) ? type : "DOMESTIC";

  let linkedPartnerId: string | null = null;
  if (typeof partnerId === "string" && partnerId.trim()) {
    const partner = await prisma.partner.findUnique({ where: { id: partnerId } });
    if (partner) linkedPartnerId = partner.id;
  }

  const customer = await prisma.customer.create({
    data: {
      name: name.trim(),
      type: customerType,
      grade: typeof grade === "string" && grade.trim() ? grade.trim() : null,
      tags: typeof tags === "string" && tags.trim() ? tags.trim() : null,
      phone: typeof phone === "string" && phone.trim() ? phone.trim() : null,
      memo: typeof memo === "string" && memo.trim() ? memo.trim() : null,
      partnerId: linkedPartnerId,
    },
    include: { partner: true },
  });

  await logAudit("Customer", customer.id, "CREATE", `고객 "${customer.name}" 등록`);

  return NextResponse.json(customer, { status: 201 });
}
