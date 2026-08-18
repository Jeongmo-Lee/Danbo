"use client";

import { useRouter } from "next/navigation";
import { useEffect, useState } from "react";
import { formatCurrency, todayDateInputValue } from "@/lib/format";

type Product = {
  id: string;
  name: string;
  unitPrice: number;
};

type Partner = {
  id: string;
  name: string;
};

type ItemRow = {
  productId: string;
  name: string;
  quantity: string;
  unitPrice: string;
};

function emptyItem(): ItemRow {
  return { productId: "", name: "", quantity: "1", unitPrice: "" };
}

export default function NewReceiptPage() {
  const router = useRouter();
  const [products, setProducts] = useState<Product[]>([]);
  const [partners, setPartners] = useState<Partner[]>([]);
  const [issueDate, setIssueDate] = useState(todayDateInputValue());
  const [partnerId, setPartnerId] = useState("");
  const [receiverName, setReceiverName] = useState("");
  const [supplier, setSupplier] = useState({
    supplierName: "",
    supplierBusinessNumber: "",
    supplierCeoName: "",
    supplierAddress: "",
    supplierBusinessType: "",
    supplierBusinessItem: "",
  });
  const [memo, setMemo] = useState("");
  const [items, setItems] = useState<ItemRow[]>([emptyItem()]);
  const [submitting, setSubmitting] = useState(false);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    (async () => {
      const [productsRes, partnersRes, companyRes] = await Promise.all([
        fetch("/api/products"),
        fetch("/api/partners"),
        fetch("/api/settings/company"),
      ]);
      setProducts(await productsRes.json());
      setPartners(await partnersRes.json());
      const company = await companyRes.json();
      setSupplier({
        supplierName: company.name ?? "",
        supplierBusinessNumber: company.businessNumber ?? "",
        supplierCeoName: company.ceoName ?? "",
        supplierAddress: company.address ?? "",
        supplierBusinessType: company.businessType ?? "",
        supplierBusinessItem: company.businessItem ?? "",
      });
    })();
  }, []);

  function handlePartnerSelect(id: string) {
    setPartnerId(id);
    const partner = partners.find((p) => p.id === id);
    if (partner) setReceiverName(partner.name);
  }

  function updateItem(index: number, patch: Partial<ItemRow>) {
    setItems((rows) => rows.map((row, i) => (i === index ? { ...row, ...patch } : row)));
  }

  function handleItemProductSelect(index: number, productId: string) {
    const product = products.find((p) => p.id === productId);
    updateItem(index, {
      productId,
      name: product ? product.name : items[index].name,
      unitPrice: product ? String(product.unitPrice) : items[index].unitPrice,
    });
  }

  function addItemRow() {
    setItems((rows) => [...rows, emptyItem()]);
  }

  function removeItemRow(index: number) {
    setItems((rows) => (rows.length > 1 ? rows.filter((_, i) => i !== index) : rows));
  }

  const totalAmount = items.reduce((sum, row) => {
    const qty = Number(row.quantity) || 0;
    const price = Number(row.unitPrice) || 0;
    return sum + Math.round(qty * price);
  }, 0);

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    setError(null);
    setSubmitting(true);
    try {
      const res = await fetch("/api/receipts", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          issueDate,
          partnerId,
          receiverName,
          memo,
          ...supplier,
          items: items.map((row) => ({
            productId: row.productId || undefined,
            name: row.name,
            quantity: row.quantity,
            unitPrice: row.unitPrice,
          })),
        }),
      });
      const data = await res.json();
      if (!res.ok) {
        setError(data.error ?? "영수증 작성에 실패했습니다.");
        return;
      }
      router.push(`/receipts/${data.id}`);
    } finally {
      setSubmitting(false);
    }
  }

  return (
    <div className="flex flex-col gap-6">
      <div>
        <h1 className="text-xl font-bold text-slate-800">새 영수증 작성</h1>
        <p className="mt-1 text-sm text-slate-500">기록용 영수증을 작성합니다. 작성 후 보기 화면에서 인쇄할 수 있습니다.</p>
      </div>

      <form onSubmit={handleSubmit} className="flex flex-col gap-6">
        <div className="card flex flex-col gap-4">
          <h2 className="text-sm font-semibold text-slate-600">공급자 (나)</h2>
          <div className="grid grid-cols-1 gap-4 sm:grid-cols-3">
            <div>
              <label className="label">상호(법인명)</label>
              <input
                className="input"
                value={supplier.supplierName}
                onChange={(e) => setSupplier((s) => ({ ...s, supplierName: e.target.value }))}
                required
              />
            </div>
            <div>
              <label className="label">사업자등록번호</label>
              <input
                className="input"
                value={supplier.supplierBusinessNumber}
                onChange={(e) => setSupplier((s) => ({ ...s, supplierBusinessNumber: e.target.value }))}
              />
            </div>
            <div>
              <label className="label">대표자</label>
              <input
                className="input"
                value={supplier.supplierCeoName}
                onChange={(e) => setSupplier((s) => ({ ...s, supplierCeoName: e.target.value }))}
              />
            </div>
            <div className="sm:col-span-2">
              <label className="label">사업장주소</label>
              <input
                className="input"
                value={supplier.supplierAddress}
                onChange={(e) => setSupplier((s) => ({ ...s, supplierAddress: e.target.value }))}
              />
            </div>
            <div>
              <label className="label">업태</label>
              <input
                className="input"
                value={supplier.supplierBusinessType}
                onChange={(e) => setSupplier((s) => ({ ...s, supplierBusinessType: e.target.value }))}
              />
            </div>
            <div className="sm:col-span-3">
              <label className="label">종목</label>
              <input
                className="input"
                value={supplier.supplierBusinessItem}
                onChange={(e) => setSupplier((s) => ({ ...s, supplierBusinessItem: e.target.value }))}
              />
            </div>
          </div>
        </div>

        <div className="card grid grid-cols-1 gap-4 sm:grid-cols-4">
          <h2 className="text-sm font-semibold text-slate-600 sm:col-span-4">공급받는자</h2>
          <div className="sm:col-span-2">
            <label className="label">거래처 DB에서 불러오기</label>
            <select className="input" value={partnerId} onChange={(e) => handlePartnerSelect(e.target.value)}>
              <option value="">직접 입력</option>
              {partners.map((partner) => (
                <option key={partner.id} value={partner.id}>
                  {partner.name}
                </option>
              ))}
            </select>
          </div>
          <div className="sm:col-span-2">
            <label className="label">공급받는자 상호 *</label>
            <input
              className="input"
              required
              value={receiverName}
              onChange={(e) => {
                setPartnerId("");
                setReceiverName(e.target.value);
              }}
              placeholder="예: 홍길동"
            />
          </div>
          <div>
            <label className="label">작성일자 *</label>
            <input
              className="input"
              type="date"
              required
              value={issueDate}
              onChange={(e) => setIssueDate(e.target.value)}
            />
          </div>
          <div className="sm:col-span-3">
            <label className="label">비고</label>
            <input className="input" value={memo} onChange={(e) => setMemo(e.target.value)} placeholder="선택 입력" />
          </div>
        </div>

        <div className="card flex flex-col gap-4">
          <div className="flex items-center justify-between">
            <h2 className="text-sm font-semibold text-slate-600">품목</h2>
            <button type="button" className="btn-secondary px-3 py-1 text-xs" onClick={addItemRow}>
              품목 추가
            </button>
          </div>
          <div className="flex flex-col gap-3">
            {items.map((row, index) => (
              <div key={index} className="grid grid-cols-1 gap-3 sm:grid-cols-12 sm:items-end">
                <div className="sm:col-span-3">
                  <label className="label">상품 DB</label>
                  <select
                    className="input"
                    value={row.productId}
                    onChange={(e) => handleItemProductSelect(index, e.target.value)}
                  >
                    <option value="">직접 입력</option>
                    {products.map((product) => (
                      <option key={product.id} value={product.id}>
                        {product.name}
                      </option>
                    ))}
                  </select>
                </div>
                <div className="sm:col-span-3">
                  <label className="label">품목명 *</label>
                  <input
                    className="input"
                    required
                    value={row.name}
                    onChange={(e) => updateItem(index, { productId: "", name: e.target.value })}
                  />
                </div>
                <div className="sm:col-span-2">
                  <label className="label">수량</label>
                  <input
                    className="input"
                    type="number"
                    min={1}
                    value={row.quantity}
                    onChange={(e) => updateItem(index, { quantity: e.target.value })}
                  />
                </div>
                <div className="sm:col-span-2">
                  <label className="label">단가 *</label>
                  <input
                    className="input"
                    required
                    type="number"
                    min={0}
                    value={row.unitPrice}
                    onChange={(e) => updateItem(index, { productId: "", unitPrice: e.target.value })}
                  />
                </div>
                <div className="sm:col-span-1">
                  <label className="label">금액</label>
                  <div className="input flex items-center bg-slate-50 text-slate-600">
                    {formatCurrency(Math.round((Number(row.quantity) || 0) * (Number(row.unitPrice) || 0)))}
                  </div>
                </div>
                <div className="sm:col-span-1">
                  <button
                    type="button"
                    className="btn-danger w-full px-2 py-2 text-xs"
                    onClick={() => removeItemRow(index)}
                    disabled={items.length === 1}
                  >
                    삭제
                  </button>
                </div>
              </div>
            ))}
          </div>
          <div className="flex justify-end border-t border-slate-200 pt-4">
            <div className="text-right">
              <p className="text-xs font-medium text-slate-500">합계금액</p>
              <p className="text-lg font-bold text-brand-700">{formatCurrency(totalAmount)}</p>
            </div>
          </div>
        </div>

        {error && <p className="text-sm text-red-600">{error}</p>}

        <div className="flex justify-end">
          <button type="submit" className="btn-primary" disabled={submitting}>
            {submitting ? "저장 중..." : "영수증 작성 완료"}
          </button>
        </div>
      </form>
    </div>
  );
}
