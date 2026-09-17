import { NextRequest, NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";

const CUSTOMER_TYPES = ["DOMESTIC", "FOREIGN"] as const;

export async function PATCH(request: NextRequest, { params }: { params: Promise<{ id: string }> }) {
  const { id } = await params;
  const body = await request.json();
  const { name, type, grade, tags, phone, memo } = body;

  const data: Record<string, unknown> = {};

  if (name !== undefined) {
    if (typeof name !== "string" || !name.trim()) {
      return NextResponse.json({ error: "고객 이름을 입력해주세요." }, { status: 400 });
    }
    data.name = name.trim();
  }
  if (type !== undefined) {
    data.type = CUSTOMER_TYPES.includes(type) ? type : "DOMESTIC";
  }
  if (grade !== undefined) {
    data.grade = typeof grade === "string" && grade.trim() ? grade.trim() : null;
  }
  if (tags !== undefined) {
    data.tags = typeof tags === "string" && tags.trim() ? tags.trim() : null;
  }
  if (phone !== undefined) {
    data.phone = typeof phone === "string" && phone.trim() ? phone.trim() : null;
  }
  if (memo !== undefined) {
    data.memo = typeof memo === "string" && memo.trim() ? memo.trim() : null;
  }

  try {
    const updated = await prisma.customer.update({ where: { id }, data, include: { partner: true } });
    return NextResponse.json(updated);
  } catch {
    return NextResponse.json({ error: "고객을 찾을 수 없습니다." }, { status: 404 });
  }
}

export async function DELETE(_request: NextRequest, { params }: { params: Promise<{ id: string }> }) {
  const { id } = await params;
  try {
    await prisma.customer.delete({ where: { id } });
    return NextResponse.json({ ok: true });
  } catch {
    return NextResponse.json({ error: "고객을 찾을 수 없습니다." }, { status: 404 });
  }
}
