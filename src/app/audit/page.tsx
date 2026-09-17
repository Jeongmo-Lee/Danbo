import { prisma } from "@/lib/prisma";

export const dynamic = "force-dynamic";

const ACTION_LABEL: Record<string, string> = { CREATE: "등록", UPDATE: "수정", DELETE: "삭제" };
const ACTION_TONE: Record<string, string> = {
  CREATE: "bg-emerald-50 text-emerald-700",
  UPDATE: "bg-amber-50 text-amber-700",
  DELETE: "bg-red-50 text-red-700",
};

export default async function AuditPage() {
  const logs = await prisma.auditLog.findMany({
    orderBy: { createdAt: "desc" },
    take: 200,
  });

  return (
    <div className="flex flex-col gap-6">
      <div>
        <h1 className="text-xl font-bold text-slate-800">변경 이력</h1>
        <p className="mt-1 text-sm text-slate-500">
          장부·상품·거래처·고객·재고 등 데이터가 등록/수정/삭제된 기록입니다 (최근 200건).
        </p>
      </div>

      <div className="card overflow-x-auto">
        {logs.length === 0 ? (
          <p className="text-sm text-slate-500">아직 기록된 변경 이력이 없습니다.</p>
        ) : (
          <table className="table-base">
            <thead>
              <tr>
                <th>일시</th>
                <th>구분</th>
                <th>영역</th>
                <th>내용</th>
              </tr>
            </thead>
            <tbody>
              {logs.map((log) => (
                <tr key={log.id}>
                  <td className="whitespace-nowrap">{new Date(log.createdAt).toLocaleString("ko-KR")}</td>
                  <td>
                    <span className={`rounded-full px-2 py-0.5 text-xs font-medium ${ACTION_TONE[log.action] ?? "bg-slate-100 text-slate-600"}`}>
                      {ACTION_LABEL[log.action] ?? log.action}
                    </span>
                  </td>
                  <td className="text-slate-500">{log.entity}</td>
                  <td className="text-slate-800">{log.summary}</td>
                </tr>
              ))}
            </tbody>
          </table>
        )}
      </div>
    </div>
  );
}
