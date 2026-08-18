import Link from "next/link";
import { prisma } from "@/lib/prisma";
import { formatCurrency, LEDGER_TYPE_LABEL } from "@/lib/format";
import type { LedgerTypeValue } from "@/lib/ledger-types";

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

export default async function DashboardPage() {
  const now = new Date();
  const todayStart = startOfDay(now);
  const tomorrowStart = new Date(todayStart);
  tomorrowStart.setDate(tomorrowStart.getDate() + 1);
  const monthStart = startOfMonth(now);

  const [todayEntries, monthEntries, productCount, partnerCount, recentEntries] = await Promise.all([
    prisma.ledgerEntry.findMany({ where: { date: { gte: todayStart, lt: tomorrowStart } } }),
    prisma.ledgerEntry.findMany({ where: { date: { gte: monthStart } } }),
    prisma.product.count(),
    prisma.partner.count(),
    prisma.ledgerEntry.findMany({ orderBy: [{ date: "desc" }, { createdAt: "desc" }], take: 8 }),
  ]);

  const todayTotals = sumByType(todayEntries);
  const monthTotals = sumByType(monthEntries);

  const todayNet = todayTotals.SALE + todayTotals.INCOME - todayTotals.PURCHASE - todayTotals.EXPENSE;
  const monthNet = monthTotals.SALE + monthTotals.INCOME - monthTotals.PURCHASE - monthTotals.EXPENSE;

  return (
    <div className="flex flex-col gap-8">
      <div>
        <h1 className="text-xl font-bold text-slate-800">대시보드</h1>
        <p className="mt-1 text-sm text-slate-500">
          오늘 {now.toLocaleDateString("ko-KR")} 기준 회사/개인 회계 현황입니다.
        </p>
      </div>

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
        <div className="card">
          <p className="text-sm font-semibold text-slate-800">이번 달 순이익</p>
          <p className={`mt-1 text-lg font-bold ${monthNet >= 0 ? "text-brand-700" : "text-red-600"}`}>
            {formatCurrency(monthNet)}
          </p>
        </div>
      </section>

      <section>
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
