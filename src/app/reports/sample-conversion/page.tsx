"use client";

import { useEffect, useState } from "react";
import { formatCurrency } from "@/lib/format";

type PartnerConversion = {
  partnerId: string;
  partnerName: string | null;
  firstSampleDate: string;
  converted: boolean;
  firstOrderDate: string | null;
  firstOrderAmount: number | null;
};

type ReportData = {
  totalSampleCustomers: number;
  convertedCount: number;
  conversionRate: number;
  partners: PartnerConversion[];
};

export default function SampleConversionPage() {
  const [data, setData] = useState<ReportData | null>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    fetch("/api/reports/sample-conversion")
      .then((res) => res.json())
      .then(setData)
      .finally(() => setLoading(false));
  }, []);

  return (
    <div className="flex flex-col gap-6">
      <div>
        <h1 className="text-xl font-bold text-slate-800">샘플 → 본오더 전환 현황</h1>
        <p className="mt-1 text-sm text-slate-500">
          장부에서 &quot;샘플 주문으로 표시&quot;한 거래처 중 이후 정식 주문(본오더)으로 이어진 비율을 보여줍니다.
        </p>
      </div>

      {loading ? (
        <p className="text-sm text-slate-500">불러오는 중...</p>
      ) : !data || data.totalSampleCustomers === 0 ? (
        <p className="text-sm text-slate-500">
          아직 샘플로 표시된 거래가 없습니다. 일일 장부에서 매출 입력 시 &quot;샘플 주문으로 표시&quot;를 체크해보세요.
        </p>
      ) : (
        <>
          <div className="grid grid-cols-1 gap-4 sm:grid-cols-3">
            <div className="card">
              <p className="text-xs font-medium text-slate-500">샘플 제공 거래처 수</p>
              <p className="mt-1 text-2xl font-bold text-slate-800">{data.totalSampleCustomers}</p>
            </div>
            <div className="card">
              <p className="text-xs font-medium text-slate-500">본오더 전환</p>
              <p className="mt-1 text-2xl font-bold text-emerald-600">{data.convertedCount}</p>
            </div>
            <div className="card">
              <p className="text-xs font-medium text-slate-500">전환율</p>
              <p className="mt-1 text-2xl font-bold text-brand-700">{Math.round(data.conversionRate * 100)}%</p>
            </div>
          </div>

          <div className="card overflow-x-auto">
            <table className="table-base">
              <thead>
                <tr>
                  <th>거래처</th>
                  <th>첫 샘플 제공일</th>
                  <th>전환 여부</th>
                  <th>첫 본오더일</th>
                  <th>첫 본오더 금액</th>
                </tr>
              </thead>
              <tbody>
                {data.partners.map((p) => (
                  <tr key={p.partnerId}>
                    <td className="font-medium text-slate-800">{p.partnerName ?? "-"}</td>
                    <td>{new Date(p.firstSampleDate).toLocaleDateString("ko-KR")}</td>
                    <td>
                      {p.converted ? (
                        <span className="rounded-full bg-emerald-50 px-2 py-0.5 text-xs font-medium text-emerald-700">
                          전환됨
                        </span>
                      ) : (
                        <span className="rounded-full bg-slate-100 px-2 py-0.5 text-xs font-medium text-slate-500">
                          미전환
                        </span>
                      )}
                    </td>
                    <td className="text-slate-500">
                      {p.firstOrderDate ? new Date(p.firstOrderDate).toLocaleDateString("ko-KR") : "-"}
                    </td>
                    <td className="text-slate-500">
                      {p.firstOrderAmount !== null ? formatCurrency(p.firstOrderAmount) : "-"}
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </>
      )}
    </div>
  );
}
