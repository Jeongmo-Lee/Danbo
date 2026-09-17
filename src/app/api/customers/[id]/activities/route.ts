import { NextRequest, NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import { logAudit } from "@/lib/audit";

export async function POST(request: NextRequest, { params }: { params: Promise<{ id: string }> }) {
  const { id } = await params;
  const body = await request.json();
  const { date, type, content } = body;

  const customer = await prisma.customer.findUnique({ where: { id } });
  if (!customer) {
    return NextResponse.json({ error: "고객을 찾을 수 없습니다." }, { status: 404 });
  }

  const parsedDate = typeof date === "string" && date ? new Date(date) : new Date();
  if (Number.isNaN(parsedDate.getTime())) {
    return NextResponse.json({ error: "날짜를 올바르게 입력해주세요." }, { status: 400 });
  }
  if (typeof content !== "string" || !content.trim()) {
    return NextResponse.json({ error: "내용을 입력해주세요." }, { status: 400 });
  }

  const activity = await prisma.customerActivity.create({
    data: {
      customerId: id,
      date: parsedDate,
      type: typeof type === "string" && type.trim() ? type.trim() : "기타",
      content: content.trim(),
    },
  });

  await logAudit(
    "CustomerActivity",
    activity.id,
    "CREATE",
    `고객 "${customer.name}" 활동 기록 [${activity.type}] 추가`
  );

  return NextResponse.json(activity, { status: 201 });
}
