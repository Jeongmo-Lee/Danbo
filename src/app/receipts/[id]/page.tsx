import { notFound } from "next/navigation";
import { prisma } from "@/lib/prisma";
import { formatCurrency } from "@/lib/format";
import { PrintButton } from "./print-button";

export const dynamic = "force-dynamic";

export default async function ReceiptDetailPage({ params }: { params: Promise<{ id: string }> }) {
  const { id } = await params;
  const receipt = await prisma.receipt.findUnique({
    where: { id },
    include: { items: true },
  });

  if (!receipt) notFound();

  const issueDate = new Date(receipt.issueDate);
  const docNo = receipt.id.slice(-8).toUpperCase();

  return (
    <div className="flex flex-col gap-4">
      <div className="flex items-center justify-between print:hidden">
        <h1 className="text-xl font-bold text-slate-800">영수증 보기</h1>
        <PrintButton />
      </div>

      <div className="mx-auto w-full max-w-2xl border-2 border-slate-800 bg-white p-8 text-slate-900 print:border-black print:p-6">
        <div className="mb-2 flex items-start justify-between text-xs">
          <span>No. {docNo}</span>
        </div>
        <h2 className="mb-1 text-center text-2xl font-bold tracking-[0.5em]">영 수 증</h2>
        <p className="mb-6 text-center text-xs text-slate-500">(공급받는자 보관용)</p>

        <p className="mb-3 border-b border-slate-800 pb-2 text-base font-medium">
          <span className="font-bold">{receipt.receiverName}</span> 귀하
        </p>

        <table className="mb-4 w-full border-collapse border border-slate-800 text-sm">
          <tbody>
            <tr>
              <th rowSpan={4} className="w-10 border border-slate-800 bg-slate-50 p-2 text-xs font-medium">
                공급자
              </th>
              <th className="w-24 border border-slate-800 bg-slate-50 p-2 text-xs font-medium">등록번호</th>
              <td className="border border-slate-800 p-2" colSpan={3}>
                {receipt.supplierBusinessNumber || "-"}
              </td>
            </tr>
            <tr>
              <th className="border border-slate-800 bg-slate-50 p-2 text-xs font-medium">상호(법인명)</th>
              <td className="border border-slate-800 p-2">{receipt.supplierName}</td>
              <th className="w-20 border border-slate-800 bg-slate-50 p-2 text-xs font-medium">성명(대표)</th>
              <td className="border border-slate-800 p-2">{receipt.supplierCeoName || "-"}</td>
            </tr>
            <tr>
              <th className="border border-slate-800 bg-slate-50 p-2 text-xs font-medium">사업장주소</th>
              <td className="border border-slate-800 p-2" colSpan={3}>
                {receipt.supplierAddress || "-"}
              </td>
            </tr>
            <tr>
              <th className="border border-slate-800 bg-slate-50 p-2 text-xs font-medium">업태</th>
              <td className="border border-slate-800 p-2">{receipt.supplierBusinessType || "-"}</td>
              <th className="border border-slate-800 bg-slate-50 p-2 text-xs font-medium">종목</th>
              <td className="border border-slate-800 p-2">{receipt.supplierBusinessItem || "-"}</td>
            </tr>
          </tbody>
        </table>

        <table className="mb-4 w-full border-collapse border border-slate-800 text-sm">
          <tbody>
            <tr>
              <th className="w-28 border border-slate-800 bg-slate-50 p-2 text-xs font-medium">작성연월일</th>
              <td className="border border-slate-800 p-2">{issueDate.toLocaleDateString("ko-KR")}</td>
              <th className="w-28 border border-slate-800 bg-slate-50 p-2 text-xs font-medium">공급대가총액</th>
              <td className="border border-slate-800 p-2 font-semibold">{formatCurrency(receipt.totalAmount)}</td>
            </tr>
            <tr>
              <th className="border border-slate-800 bg-slate-50 p-2 text-xs font-medium">비고</th>
              <td className="border border-slate-800 p-2" colSpan={3}>
                {receipt.memo || ""}
              </td>
            </tr>
          </tbody>
        </table>

        <table className="mb-4 w-full border-collapse border border-slate-800 text-sm">
          <thead>
            <tr>
              <th className="border border-slate-800 bg-slate-50 p-2 text-xs font-medium">월일</th>
              <th className="border border-slate-800 bg-slate-50 p-2 text-xs font-medium">품목</th>
              <th className="border border-slate-800 bg-slate-50 p-2 text-xs font-medium">수량</th>
              <th className="border border-slate-800 bg-slate-50 p-2 text-xs font-medium">단가</th>
              <th className="border border-slate-800 bg-slate-50 p-2 text-xs font-medium">공급대가(금액)</th>
            </tr>
          </thead>
          <tbody>
            {receipt.items.map((item, index) => (
              <tr key={item.id}>
                <td className="border border-slate-800 p-2 text-center text-xs">
                  {index === 0
                    ? `${issueDate.getMonth() + 1}/${issueDate.getDate()}`
                    : ""}
                </td>
                <td className="border border-slate-800 p-2">{item.name}</td>
                <td className="border border-slate-800 p-2 text-center">{item.quantity}</td>
                <td className="border border-slate-800 p-2 text-right">{formatCurrency(item.unitPrice)}</td>
                <td className="border border-slate-800 p-2 text-right">{formatCurrency(item.amount)}</td>
              </tr>
            ))}
            {Array.from({ length: Math.max(0, 4 - receipt.items.length) }).map((_, i) => (
              <tr key={`blank-${i}`}>
                <td className="border border-slate-800 p-2">&nbsp;</td>
                <td className="border border-slate-800 p-2">&nbsp;</td>
                <td className="border border-slate-800 p-2">&nbsp;</td>
                <td className="border border-slate-800 p-2">&nbsp;</td>
                <td className="border border-slate-800 p-2">&nbsp;</td>
              </tr>
            ))}
            <tr>
              <td colSpan={4} className="border border-slate-800 p-2 text-center font-semibold">
                합&nbsp;&nbsp;&nbsp;&nbsp;계
              </td>
              <td className="border border-slate-800 p-2 text-right font-semibold">
                {formatCurrency(receipt.totalAmount)}
              </td>
            </tr>
          </tbody>
        </table>

        <p className="text-center text-sm">위 금액을 정히 영수(청구)함</p>
      </div>
    </div>
  );
}
