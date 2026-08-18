import { NextRequest, NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";

export async function PATCH(request: NextRequest, { params }: { params: Promise<{ id: string }> }) {
  const { id } = await params;
  const body = await request.json();
  const { name, businessNumber, ceoName, address, businessType, businessItem, phone, email, memo } = body;

  const data: Record<string, string | null> = {};

  if (name !== undefined) {
    if (typeof name !== "string" || !name.trim()) {
      return NextResponse.json({ error: "거래처 상호를 입력해주세요." }, { status: 400 });
    }
    data.name = name.trim();
  }
  if (businessNumber !== undefined) data.businessNumber = optionalText(businessNumber);
  if (ceoName !== undefined) data.ceoName = optionalText(ceoName);
  if (address !== undefined) data.address = optionalText(address);
  if (businessType !== undefined) data.businessType = optionalText(businessType);
  if (businessItem !== undefined) data.businessItem = optionalText(businessItem);
  if (phone !== undefined) data.phone = optionalText(phone);
  if (email !== undefined) data.email = optionalText(email);
  if (memo !== undefined) data.memo = optionalText(memo);

  try {
    const partner = await prisma.partner.update({ where: { id }, data });
    return NextResponse.json(partner);
  } catch {
    return NextResponse.json({ error: "거래처를 찾을 수 없습니다." }, { status: 404 });
  }
}

export async function DELETE(_request: NextRequest, { params }: { params: Promise<{ id: string }> }) {
  const { id } = await params;
  try {
    await prisma.partner.delete({ where: { id } });
    return NextResponse.json({ ok: true });
  } catch {
    return NextResponse.json({ error: "거래처를 찾을 수 없습니다." }, { status: 404 });
  }
}

function optionalText(value: unknown): string | null {
  return typeof value === "string" && value.trim() ? value.trim() : null;
}
