import { prisma } from "@/lib/prisma";
import { formatCurrency } from "@/lib/format";

export const dynamic = "force-dynamic";

export default async function JournalPage() {
  const entries = await prisma.journalEntry.findMany({
    orderBy: [{ date: "desc" }, { createdAt: "desc" }],
    take: 200,
    include: { lines: { include: { account: true } } },
  });

  return (
    <div className="flex flex-col gap-6">
      <div>
        <h1 className="text-xl font-bold text-slate-800">분개장</h1>
        <p className="mt-1 text-sm text-slate-500">
          일일 장부 기입 시 자동 생성된 분개(차변/대변) 내역입니다 (최근 200건).
        </p>
      </div>

      <div className="card overflow-x-auto">
        {entries.length === 0 ? (
          <p className="text-sm text-slate-500">분개 내역이 없습니다.</p>
        ) : (
          <table className="table-base">
            <thead>
              <tr>
                <th>날짜</th>
                <th>차변</th>
                <th>대변</th>
                <th>금액</th>
                <th>메모</th>
              </tr>
            </thead>
            <tbody>
              {entries.map((entry) => {
                const debit = entry.lines.find((l) => l.side === "DEBIT");
                const credit = entry.lines.find((l) => l.side === "CREDIT");
                return (
                  <tr key={entry.id}>
                    <td className="whitespace-nowrap">{new Date(entry.date).toLocaleDateString("ko-KR")}</td>
                    <td className="font-medium text-slate-800">{debit?.account.name ?? "-"}</td>
                    <td className="font-medium text-slate-800">{credit?.account.name ?? "-"}</td>
                    <td>{formatCurrency(debit?.amount ?? credit?.amount ?? 0)}</td>
                    <td className="text-slate-500">{entry.memo ?? "-"}</td>
                  </tr>
                );
              })}
            </tbody>
          </table>
        )}
      </div>
    </div>
  );
}
