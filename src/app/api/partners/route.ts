import { NextRequest, NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";

export async function GET() {
  const partners = await prisma.partner.findMany({
    orderBy: { createdAt: "desc" },
  });
  return NextResponse.json(partners);
}

export async function POST(request: NextRequest) {
  const body = await request.json();
  const { name, businessNumber, ceoName, address, businessType, businessItem, phone, email, memo } = body;

  if (typeof name !== "string" || !name.trim()) {
    return NextResponse.json({ error: "거래처 상호를 입력해주세요." }, { status: 400 });
  }

  const partner = await prisma.partner.create({
    data: {
      name: name.trim(),
      businessNumber: optionalText(businessNumber),
      ceoName: optionalText(ceoName),
      address: optionalText(address),
      businessType: optionalText(businessType),
      businessItem: optionalText(businessItem),
      phone: optionalText(phone),
      email: optionalText(email),
      memo: optionalText(memo),
    },
  });

  return NextResponse.json(partner, { status: 201 });
}

function optionalText(value: unknown): string | null {
  return typeof value === "string" && value.trim() ? value.trim() : null;
}
