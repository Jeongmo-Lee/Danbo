import { NextRequest, NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";

const MOVEMENT_TYPES = ["IN", "OUT", "ADJUST"] as const;
type MovementType = (typeof MOVEMENT_TYPES)[number];

function isMovementType(value: unknown): value is MovementType {
  return typeof value === "string" && (MOVEMENT_TYPES as readonly string[]).includes(value);
}

export async function GET() {
  // 아직 재고 항목이 없는 상품은 자동으로 0개 재고 항목을 만들어 목록에 노출시킨다.
  const products = await prisma.product.findMany({
    select: { id: true },
    where: { inventoryItem: null },
  });
  if (products.length > 0) {
    await prisma.inventoryItem.createMany({
      data: products.map((p) => ({ productId: p.id })),
      skipDuplicates: true,
    });
  }

  const [items, recentMovements] = await Promise.all([
    prisma.inventoryItem.findMany({
      include: { product: true },
      orderBy: { product: { name: "asc" } },
    }),
    prisma.stockMovement.findMany({
      orderBy: { createdAt: "desc" },
      take: 15,
      include: { inventoryItem: { include: { product: true } } },
    }),
  ]);

  return NextResponse.json({ items, recentMovements });
}

export async function POST(request: NextRequest) {
  const body = await request.json();
  const { productId, type, quantity, reason } = body;

  if (typeof productId !== "string" || !productId.trim()) {
    return NextResponse.json({ error: "상품을 선택해주세요." }, { status: 400 });
  }
  if (!isMovementType(type)) {
    return NextResponse.json({ error: "입출고 유형이 올바르지 않습니다." }, { status: 400 });
  }
  const parsedQuantity = Number(quantity);
  if (!Number.isFinite(parsedQuantity) || parsedQuantity === 0) {
    return NextResponse.json({ error: "수량을 올바르게 입력해주세요." }, { status: 400 });
  }
  if (type !== "ADJUST" && parsedQuantity < 0) {
    return NextResponse.json({ error: "입고/출고 수량은 0보다 커야 합니다." }, { status: 400 });
  }

  const product = await prisma.product.findUnique({ where: { id: productId } });
  if (!product) {
    return NextResponse.json({ error: "상품을 찾을 수 없습니다." }, { status: 404 });
  }

  const delta = type === "IN" ? Math.abs(parsedQuantity) : type === "OUT" ? -Math.abs(parsedQuantity) : Math.round(parsedQuantity);

  const inventoryItem = await prisma.inventoryItem.upsert({
    where: { productId },
    create: { productId, currentStock: Math.max(0, delta) },
    update: { currentStock: { increment: delta } },
  });

  await prisma.stockMovement.create({
    data: {
      inventoryItemId: inventoryItem.id,
      type,
      quantity: Math.round(parsedQuantity),
      reason: typeof reason === "string" && reason.trim() ? reason.trim() : null,
    },
  });

  const updated = await prisma.inventoryItem.findUnique({
    where: { id: inventoryItem.id },
    include: { product: true },
  });

  return NextResponse.json(updated, { status: 201 });
}
