const EXPORTS = [
  { href: "/api/export/ledger", label: "회계장부 (매출/매입/수입/지출)" },
  { href: "/api/export/inventory", label: "재고 현황" },
  { href: "/api/export/customers", label: "고객 관리(CRM)" },
  { href: "/api/export/marketing", label: "마케팅 / DP 기록" },
  { href: "/api/export/notes", label: "일일 메모" },
];

export default function ExportPage() {
  return (
    <div className="flex flex-col gap-6">
      <div>
        <h1 className="text-xl font-bold text-slate-800">데이터 내보내기</h1>
        <p className="mt-1 text-sm text-slate-500">
          각 항목을 엑셀에서 열리는 CSV 파일로 내려받아 백업하거나 세무사에게 전달할 수 있습니다.
        </p>
      </div>
      <div className="grid grid-cols-1 gap-4 sm:grid-cols-2">
        {EXPORTS.map((item) => (
          <a key={item.href} href={item.href} className="card block transition-shadow hover:shadow-md">
            <p className="text-sm font-semibold text-slate-800">{item.label}</p>
            <p className="mt-1 text-xs text-slate-500">클릭하면 CSV 파일이 다운로드됩니다.</p>
          </a>
        ))}
      </div>
    </div>
  );
}
