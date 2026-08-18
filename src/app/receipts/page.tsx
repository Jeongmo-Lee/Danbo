"use client";

import Link from "next/link";
import { useEffect, useState } from "react";
import { formatCurrency } from "@/lib/format";

type Receipt = {
  id: string;
  issueDate: string;
  receiverName: string;
  totalAmount: number;
};

export default function ReceiptsPage() {
  const [receipts, setReceipts] = useState<Receipt[]>([]);
  const [loading, setLoading] = useState(true);

  async function loadReceipts() {
    setLoading(true);
    const res = await fetch("/api/receipts");
    const data = await res.json();
    setReceipts(data);
    setLoading(false);
  }

  useEffect(() => {
    loadReceipts();
  }, []);

  async function handleDelete(id: string) {
    if (!confirm("이 영수증을 삭제하시겠습니까?")) return;
    await fetch(`/api/receipts/${id}`, { method: "DELETE" });
    await loadReceipts();
  }

  return (
    <div className="flex flex-col gap-6">
      <div className="flex flex-wrap items-center justify-between gap-3">
        <div>
          <h1 className="text-xl font-bold text-slate-800">영수증</h1>
          <p className="mt-1 text-sm text-slate-500">발행한 영수증을 기록하고 다시 확인·인쇄할 수 있습니다.</p>
        </div>
        <Link href="/receipts/new" className="btn-primary">
          새 영수증 작성
        </Link>
      </div>

      <div className="card overflow-x-auto">
        {loading ? (
          <p className="text-sm text-slate-500">불러오는 중...</p>
        ) : receipts.length === 0 ? (
          <p className="text-sm text-slate-500">작성된 영수증이 없습니다.</p>
        ) : (
          <table className="table-base">
            <thead>
              <tr>
                <th>작성일자</th>
                <th>공급받는자</th>
                <th>합계금액</th>
                <th className="w-40">관리</th>
              </tr>
            </thead>
            <tbody>
              {receipts.map((receipt) => (
                <tr key={receipt.id}>
                  <td>{new Date(receipt.issueDate).toLocaleDateString("ko-KR")}</td>
                  <td className="font-medium text-slate-800">{receipt.receiverName}</td>
                  <td>{formatCurrency(receipt.totalAmount)}</td>
                  <td>
                    <div className="flex gap-1">
                      <Link href={`/receipts/${receipt.id}`} className="btn-secondary px-2 py-1 text-xs">
                        보기/인쇄
                      </Link>
                      <button className="btn-danger px-2 py-1 text-xs" onClick={() => handleDelete(receipt.id)}>
                        삭제
                      </button>
                    </div>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        )}
      </div>
    </div>
  );
}
