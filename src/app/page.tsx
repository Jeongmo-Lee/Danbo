import Link from "next/link";
import { prisma } from "@/lib/prisma";
import { formatCurrency, LEDGER_TYPE_LABEL } from "@/lib/format";
import type { LedgerTypeValue } from "@/lib/ledger-types";
import { TrendChart } from "./trend-chart";

export const dynamic = "force-dynamic";

function startOfDay(date: Date) {
  const d = new Date(date);
  d.setHours(0, 0, 0, 0);
  return d;
}

function startOfMonth(date: Date) {
  return new Date(date.getFullYear(), date.getMonth(), 1);
}

function sumByType(entries: { type: string; amount: number }[]) {
  const totals: Record<LedgerTypeValue, number> = { SALE: 0, PURCHASE: 0, INCOME: 0, EXPENSE: 0 };
  for (const entry of entries) {
    totals[entry.type as LedgerTypeValue] += entry.amount;
  }
  return totals;
}

function monthKey(date: Date) {
  return `${date.getFullYear()}-${String(date.getMonth() + 1).padStart(2, "0")}`;
}

export default async function DashboardPage() {
  const now = new Date();
  const todayStart = startOfDay(now);
  const tomorrowStart = new Date(todayStart);
  tomorrowStart.setDate(tomorrowStart.getDate() + 1);
  const monthStart = startOfMonth(now);

  const [
    todayEntries,
    monthEntries,
    productCount,
    partnerCount,
    recentEntries,
    lowStockItems,
    todayNotes,
    recentActivities,
  ] = await Promise.all([
    prisma.ledgerEntry.findMany({ where: { date: { gte: todayStart, lt: tomorrowStart } } }),
    prisma.ledgerEntry.findMany({ where: { date: { gte: monthStart } } }),
    prisma.product.count(),
    prisma.partner.count(),
    prisma.ledgerEntry.findMany({ orderBy: [{ date: "desc" }, { createdAt: "desc" }], take: 8 }),
    prisma.inventoryItem.findMany({
      where: { safetyStock: { gt: 0 } },
      include: { product: true },
    }),
    prisma.dailyNote.findMany({ where: { date: { gte: todayStart, lt: tomorrowStart } }, orderBy: { createdAt: "desc" } }),
    prisma.customerActivity.findMany({
      orderBy: { date: "desc" },
      take: 5,
      include: { customer: true },
    }),
  ]);

  const lowStock = lowStockItems.filter((item) => item.currentStock <= item.safetyStock);

  const todayTotals = sumByType(todayEntries);
  const monthTotals = sumByType(monthEntries);

  const todayNet = todayTotals.SALE + todayTotals.INCOME - todayTotals.PURCHASE - todayTotals.EXPENSE;
  const monthNet = monthTotals.SALE + monthTotals.INCOME - monthTotals.PURCHASE - monthTotals.EXPENSE;

  // 최근 6개월 손익 추이
  const sixMonthsAgoStart = new Date(monthStart);
  sixMonthsAgoStart.setMonth(sixMonthsAgoStart.getMonth() - 5);
  const trendEntries = await prisma.ledgerEntry.findMany({
    where: { date: { gte: sixMonthsAgoStart } },
    select: { date: true, type: true, amount: true },
  });
  const monthBuckets = new Map<string, { sale: number; purchase: number; income: number; expense: number }>();
  for (let i = 0; i < 6; i++) {
    const d = new Date(sixMonthsAgoStart);
    d.setMonth(d.getMonth() + i);
    monthBuckets.set(monthKey(d), { sale: 0, purchase: 0, income: 0, expense: 0 });
  }
  for (const entry of trendEntries) {
    const key = monthKey(new Date(entry.date));
    const bucket = monthBuckets.get(key);
    if (!bucket) continue;
    if (entry.type === "SALE") bucket.sale += entry.amount;
    else if (entry.type === "PURCHASE") bucket.purchase += entry.amount;
    else if (entry.type === "INCOME") bucket.income += entry.amount;
    else if (entry.type === "EXPENSE") bucket.expense += entry.amount;
  }
  const trendPoints = Array.from(monthBuckets.entries()).map(([key, b]) => ({
    label: `${Number(key.split("-")[1])}월`,
    value: b.sale + b.income - b.purchase - b.expense,
  }));

  return (
    <div className="flex flex-col gap-8">
      <div>
        <h1 className="text-xl font-bold text-slate-800">오늘의 매장 현황</h1>
        <p className="mt-1 text-sm text-slate-500">
          오늘 {now.toLocaleDateString("ko-KR")} 기준 회계·재고·고객·메모를 한 화면에 모았습니다.
        </p>
      </div>

      {lowStock.length > 0 && (
        <section className="card border-red-200 bg-red-50">
          <h2 className="mb-2 text-sm font-semibold text-red-700">안전재고 이하 상품 {lowStock.length}건</h2>
          <ul className="flex flex-wrap gap-2 text-xs text-red-700">
            {lowStock.map((item) => (
              <li key={item.id} className="rounded-full bg-white px-2 py-1 shadow-sm">
                {item.product.name} ({item.currentStock}/{item.safetyStock})
              </li>
            ))}
          </ul>
          <Link href="/inventory" className="mt-2 inline-block text-xs font-medium text-red-700 underline">
            재고 관리에서 확인하기
          </Link>
        </section>
      )}

      <section>
        <h2 className="mb-3 text-sm font-semibold text-slate-600">오늘 현황</h2>
        <div className="grid grid-cols-2 gap-3 sm:grid-cols-5">
          <StatCard label="매출" value={todayTotals.SALE} tone="text-emerald-600" />
          <StatCard label="매입" value={todayTotals.PURCHASE} tone="text-red-600" />
          <StatCard label="기타수입" value={todayTotals.INCOME} tone="text-emerald-600" />
          <StatCard label="기타지출" value={todayTotals.EXPENSE} tone="text-red-600" />
          <StatCard label="당일 손익" value={todayNet} tone={todayNet >= 0 ? "text-brand-700" : "text-red-600"} />
        </div>
      </section>

      <section>
        <h2 className="mb-3 text-sm font-semibold text-slate-600">이번 달 누계</h2>
        <div className="grid grid-cols-2 gap-3 sm:grid-cols-5">
          <StatCard label="매출" value={monthTotals.SALE} tone="text-emerald-600" />
          <StatCard label="매입" value={monthTotals.PURCHASE} tone="text-red-600" />
          <StatCard label="기타수입" value={monthTotals.INCOME} tone="text-emerald-600" />
          <StatCard label="기타지출" value={monthTotals.EXPENSE} tone="text-red-600" />
          <StatCard label="누계 손익" value={monthNet} tone={monthNet >= 0 ? "text-brand-700" : "text-red-600"} />
        </div>
      </section>

      <section>
        <h2 className="mb-3 text-sm font-semibold text-slate-600">최근 6개월 손익 추이</h2>
        <div className="card">
          <TrendChart points={trendPoints} />
        </div>
      </section>

      <section className="grid grid-cols-1 gap-4 sm:grid-cols-3">
        <Link href="/ledger" className="card block transition-shadow hover:shadow-md">
          <p className="text-sm font-semibold text-slate-800">일일 회계장부 기입</p>
          <p className="mt-1 text-xs text-slate-500">오늘의 매출/매입/수입/지출을 기록하세요.</p>
        </Link>
        <Link href="/products" className="card block transition-shadow hover:shadow-md">
          <p className="text-sm font-semibold text-slate-800">상품 관리</p>
          <p className="mt-1 text-xs text-slate-500">현재 등록된 상품 {productCount}건</p>
        </Link>
        <Link href="/partners" className="card block transition-shadow hover:shadow-md">
          <p className="text-sm font-semibold text-slate-800">거래처 관리</p>
          <p className="mt-1 text-xs text-slate-500">현재 등록된 거래처 {partnerCount}건</p>
        </Link>
        <Link href="/receipts/new" className="card block transition-shadow hover:shadow-md">
          <p className="text-sm font-semibold text-slate-800">영수증 작성</p>
          <p className="mt-1 text-xs text-slate-500">기록용 영수증을 새로 작성하세요.</p>
        </Link>
        <Link href="/inventory" className="card block transition-shadow hover:shadow-md">
          <p className="text-sm font-semibold text-slate-800">재고 관리</p>
          <p className="mt-1 text-xs text-slate-500">
            {lowStock.length > 0 ? `안전재고 이하 ${lowStock.length}건` : "재고 현황 확인"}
          </p>
        </Link>
        <Link href="/crm" className="card block transition-shadow hover:shadow-md">
          <p className="text-sm font-semibold text-slate-800">고객 관리(CRM)</p>
          <p className="mt-1 text-xs text-slate-500">상담/주문/클레임 기록하기</p>
        </Link>
        <Link href="/marketing" className="card block transition-shadow hover:shadow-md">
          <p className="text-sm font-semibold text-slate-800">마케팅 / DP</p>
          <p className="mt-1 text-xs text-slate-500">DP 변경·SNS 성과 기록하기</p>
        </Link>
        <Link href="/notes" className="card block transition-shadow hover:shadow-md">
          <p className="text-sm font-semibold text-slate-800">일일 메모</p>
          <p className="mt-1 text-xs text-slate-500">
            {todayNotes.length > 0 ? `오늘 메모 ${todayNotes.length}건` : "오늘 특이사항 기록하기"}
          </p>
        </Link>
        <Link href="/audit" className="card block transition-shadow hover:shadow-md">
          <p className="text-sm font-semibold text-slate-800">변경 이력</p>
          <p className="mt-1 text-xs text-slate-500">등록/수정/삭제 기록 확인하기</p>
        </Link>
        <div className="card">
          <p className="text-sm font-semibold text-slate-800">이번 달 순이익</p>
          <p className={`mt-1 text-lg font-bold ${monthNet >= 0 ? "text-brand-700" : "text-red-600"}`}>
            {formatCurrency(monthNet)}
          </p>
        </div>
      </section>

      <section className="grid grid-cols-1 gap-4 lg:grid-cols-2">
        <div>
          <h2 className="mb-3 text-sm font-semibold text-slate-600">최근 거래 내역</h2>
          <div className="card overflow-x-auto">
            {recentEntries.length === 0 ? (
              <p className="text-sm text-slate-500">아직 등록된 거래 내역이 없습니다.</p>
            ) : (
              <table className="table-base">
                <thead>
                  <tr>
                    <th>날짜</th>
                    <th>구분</th>
                    <th>항목</th>
                    <th>금액</th>
                  </tr>
                </thead>
                <tbody>
                  {recentEntries.map((entry) => (
                    <tr key={entry.id}>
                      <td>{new Date(entry.date).toLocaleDateString("ko-KR")}</td>
                      <td>
                        <span
                          className={`rounded-full px-2 py-0.5 text-xs font-medium ${
                            entry.type === "SALE" || entry.type === "INCOME"
                              ? "bg-emerald-50 text-emerald-700"
                              : "bg-red-50 text-red-700"
                          }`}
                        >
                          {LEDGER_TYPE_LABEL[entry.type]}
                        </span>
                      </td>
                      <td className="font-medium text-slate-800">{entry.productName}</td>
                      <td>{formatCurrency(entry.amount)}</td>
                    </tr>
                  ))}
                </tbody>
              </table>
            )}
          </div>
        </div>

        <div className="flex flex-col gap-4">
          <div>
            <h2 className="mb-3 text-sm font-semibold text-slate-600">오늘의 메모</h2>
            <div className="card">
              {todayNotes.length === 0 ? (
                <p className="text-sm text-slate-500">오늘 등록된 메모가 없습니다.</p>
              ) : (
                <ul className="flex flex-col gap-2 text-sm">
                  {todayNotes.map((note) => (
                    <li key={note.id} className="flex items-start gap-2">
                      {note.tag && (
                        <span className="mt-0.5 shrink-0 rounded-full bg-slate-100 px-2 py-0.5 text-xs font-medium text-slate-600">
                          {note.tag}
                        </span>
                      )}
                      <span className="text-slate-700">{note.content}</span>
                    </li>
                  ))}
                </ul>
              )}
            </div>
          </div>

          <div>
            <h2 className="mb-3 text-sm font-semibold text-slate-600">최근 고객 활동</h2>
            <div className="card">
              {recentActivities.length === 0 ? (
                <p className="text-sm text-slate-500">등록된 고객 활동이 없습니다.</p>
              ) : (
                <ul className="flex flex-col gap-2 text-sm">
                  {recentActivities.map((a) => (
                    <li key={a.id} className="text-slate-700">
                      <span className="font-medium text-slate-800">{a.customer.name}</span>
                      <span className="ml-1 text-xs text-slate-500">[{a.type}]</span> {a.content}
                    </li>
                  ))}
                </ul>
              )}
            </div>
          </div>
        </div>
      </section>
    </div>
  );
}

function StatCard({ label, value, tone }: { label: string; value: number; tone: string }) {
  return (
    <div className="card py-3">
      <p className="text-xs font-medium text-slate-500">{label}</p>
      <p className={`mt-1 text-base font-bold ${tone}`}>{formatCurrency(value)}</p>
    </div>
  );
}
