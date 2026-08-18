import { PrismaClient } from "@prisma/client";

const prisma = new PrismaClient();

async function main() {
  const productCount = await prisma.product.count();
  if (productCount > 0) {
    console.log("이미 상품 데이터가 있어 시드를 건너뜁니다.");
    return;
  }

  const products = await prisma.product.createMany({
    data: [
      { name: "사무용 A4 용지", unitPrice: 25000, unit: "박스" },
      { name: "무선 마우스", unitPrice: 18000, unit: "개" },
      { name: "생수 500ml", unitPrice: 800, unit: "병" },
      { name: "커피 원두 1kg", unitPrice: 32000, unit: "봉" },
      { name: "노트북 파우치", unitPrice: 15000, unit: "개" },
    ],
  });

  console.log(`상품 ${products.count}건 생성 완료`);
}

main()
  .catch((error) => {
    console.error(error);
    process.exit(1);
  })
  .finally(async () => {
    await prisma.$disconnect();
  });
