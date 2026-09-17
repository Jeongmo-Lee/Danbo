import { prisma } from "@/lib/prisma";
import { formatCurrency } from "@/lib/format";
import { ensureAllDefaultAccounts, ACCOUNT_CATEGORY_LABEL, type AccountCategory } from "@/lib/accounting";

export const dynamic = "force-dynamic";

const CATEGORY_ORDER: AccountCategory[] = ["ASSET", "LIABILITY", "EQUITY", "REVENUE", "EXPENSE"];
const DEBIT_NORMAL: AccountCategory[] = ["ASSET", "EXPENSE"];

export default async function AccountsPage() {
  await ensureAllDefaultAccounts();

  const [accounts, sums] = await Promise.all([
    prisma.account.findMany({ orderBy: { code: "asc" } }),
    prisma.journalLine.groupBy({ by: ["accountId", "side"], _sum: { amount: true } }),
  ]);

  const balanceMap = new Map<string, { debit: number; credit: number }>();
  for (const s of sums) {
    const entry = balanceMap.get(s.accountId) ?? { debit: 0, credit: 0 };
    if (s.side === "DEBIT") entry.debit += s._sum.amount ?? 0;
    else entry.credit += s._sum.amount ?? 0;
    balanceMap.set(s.accountId, entry);
  }

  const grouped = CATEGORY_ORDER.map((category) => ({
    category,
    accounts: accounts.filter((a) => a.category === category),
  }));

  return (
    <div className="flex flex-col gap-6">
      <div>
        <h1 className="text-xl font-bold text-slate-800">계정과목</h1>
        <p className="mt-1 text-sm text-slate-500">
          일일 장부에 기입한 내역은 결제수단에 따라 자동으로 계정과목별 분개(차변/대변)로 기록됩니다.
        </p>
      </div>

      {grouped.map(({ category, accounts: list }) =>
        list.length === 0 ? null : (
          <section key={category}>
            <h2 className="mb-3 text-sm font-semibold text-slate-600">{ACCOUNT_CATEGORY_LABEL[category]}</h2>
            <div className="card overflow-x-auto">
              <table className="table-base">
                <thead>
                  <tr>
                    <th>코드</th>
                    <th>계정과목</th>
                    <th>차변 합계</th>
                    <th>대변 합계</th>
                    <th>잔액</th>
                  </tr>
                </thead>
                <tbody>
                  {list.map((account) => {
                    const sum = balanceMap.get(account.id) ?? { debit: 0, credit: 0 };
                    const isDebitNormal = DEBIT_NORMAL.includes(account.category as AccountCategory);
                    const balance = isDebitNormal ? sum.debit - sum.credit : sum.credit - sum.debit;
                    return (
                      <tr key={account.id}>
                        <td className="text-slate-400">{account.code}</td>
                        <td className="font-medium text-slate-800">{account.name}</td>
                        <td>{formatCurrency(sum.debit)}</td>
                        <td>{formatCurrency(sum.credit)}</td>
                        <td className="font-semibold">{formatCurrency(balance)}</td>
                      </tr>
                    );
                  })}
                </tbody>
              </table>
            </div>
          </section>
        )
      )}
    </div>
  );
}
