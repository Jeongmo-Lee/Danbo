import { NextRequest, NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";

export async function GET() {
  const settings = await prisma.companySettings.upsert({
    where: { id: "default" },
    update: {},
    create: { id: "default" },
  });
  return NextResponse.json(settings);
}

export async function PUT(request: NextRequest) {
  const body = await request.json();
  const { name, businessNumber, ceoName, address, businessType, businessItem, phone } = body;

  const data = {
    name: text(name),
    businessNumber: text(businessNumber),
    ceoName: text(ceoName),
    address: text(address),
    businessType: text(businessType),
    businessItem: text(businessItem),
    phone: text(phone),
  };

  const settings = await prisma.companySettings.upsert({
    where: { id: "default" },
    update: data,
    create: { id: "default", ...data },
  });

  return NextResponse.json(settings);
}

function text(value: unknown): string {
  return typeof value === "string" ? value.trim() : "";
}
