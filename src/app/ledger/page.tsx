"use client";

import { useEffect, useMemo, useState } from "react";
import { formatCurrency, todayDateInputValue, LEDGER_TYPE_LABEL } from "@/lib/format";
import { LEDGER_TYPES, type LedgerTypeValue } from "@/lib/ledger-types";

type Product = {
  id: string;
  name: string;
  unitPrice: number;
  unit: string | null;
};

type Partner = {
  id: string;
  name: string;
};

type LedgerEntry = {
  id: string;
  date: string;
  type: LedgerTypeValue;
  productId: string | null;
  productName: string;
  partnerId: string | null;
  partnerName: string | null;
  quantity: number;
  unitPrice: number;
  amount: number;
  memo: string | null;
};

type FormState = {
  date: string;
  type: LedgerTypeValue;
  productId: string;
  productName: string;
  partnerId: string;
  quantity: string;
  unitPrice: string;
  memo: string;
};

function emptyForm(date: string): FormState {
  return {
    date,
    type: "SALE",
    productId: "",
    productName: "",
    partnerId: "",
    quantity: "1",
    unitPrice: "",
    memo: "",
  };
}

export default function LedgerPage() {
  const [date, setDate] = useState(todayDateInputValue());
  const [entries, setEntries] = useState<LedgerEntry[]>([]);
  const [products, setProducts] = useState<Product[]>([]);
  const [partners, setPartners] = useState<Partner[]>([]);
  const [loading, setLoading] = useState(true);
  const [form, setForm] = useState<FormState>(() => emptyForm(todayDateInputValue()));
  const [submitting, setSubmitting] = useState(false);
  const [error, setError] = useState<string | null>(null);

  async function loadEntries(targetDate: string) {
    setLoading(true);
    const res = await fetch(`/api/ledger?date=${targetDate}`);
    const data = await res.json();
    setEntries(data);
    setLoading(false);
  }

  async function loadProducts() {
    const res = await fetch("/api/products");
    const data = await res.json();
    setProducts(data);
  }

  async function loadPartners() {
    const res = await fetch("/api/partners");
    const data = await res.json();
    setPartners(data);
  }

  useEffect(() => {
    loadProducts();
    loadPartners();
  }, []);

  useEffect(() => {
    loadEntries(date);
    setForm((f) => ({ ...f, date }));
  }, [date]);

  function handleProductSelect(productId: string) {
    const product = products.find((p) => p.id === productId);
    setForm((f) => ({
      ...f,
      productId,
      productName: product ? product.name : f.productName,
      unitPrice: product ? String(product.unitPrice) : f.unitPrice,
    }));
  }

  async function handleCreate(e: React.FormEvent) {
    e.preventDefault();
    setError(null);
    setSubmitting(true);
    try {
      const res = await fetch("/api/ledger", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(form),
      });
      const data = await res.json();
      if (!res.ok) {
        setError(data.error ?? "등록에 실패했습니다.");
        return;
      }
      setForm((f) => ({ ...emptyForm(date), type: f.type }));
      await loadEntries(date);
    } finally {
      setSubmitting(false);
    }
  }

  async function handleDelete(id: string) {
    if (!confirm("이 항목을 삭제하시겠습니까?")) return;
    await fetch(`/api/ledger/${id}`, { method: "DELETE" });
    await loadEntries(date);
  }

  const summary = useMemo(() => {
    const totals: Record<LedgerTypeValue, number> = { SALE: 0, PURCHASE: 0, INCOME: 0, EXPENSE: 0 };
    for (const entry of entries) totals[entry.type] += entry.amount;
    const netProfit = totals.SALE + totals.INCOME - totals.PURCHASE - totals.EXPENSE;
    return { ...totals, netProfit };
  }, [entries]);

  const previewAmount =
    form.quantity && form.unitPrice
      ? Math.round(Number(form.quantity) * Number(form.unitPrice)) || 0
      : 0;

  return (
    <div className="flex flex-col gap-6">
      <div className="flex flex-wrap items-center justify-between gap-3">
        <div>
          <h1 className="text-xl font-bold text-slate-800">일일 회계장부</h1>
          <p className="mt-1 text-sm text-slate-500">날짜별 매출/매입/기타 내역을 기록하고 확인하세요.</p>
        </div>
        <input
          type="date"
          className="input w-auto"
          value={date}
          onChange={(e) => setDate(e.target.value)}
        />
      </div>

      <div className="grid grid-cols-2 gap-3 sm:grid-cols-5">
        <SummaryCard label="매출" value={summary.SALE} tone="text-emerald-600" />
        <SummaryCard label="매입" value={summary.PURCHASE} tone="text-red-600" />
        <SummaryCard label="기타수입" value={summary.INCOME} tone="text-emerald-600" />
        <SummaryCard label="기타지출" value={summary.EXPENSE} tone="text-red-600" />
        <SummaryCard label="당일 손익" value={summary.netProfit} tone={summary.netProfit >= 0 ? "text-brand-700" : "text-red-600"} />
      </div>

      <form onSubmit={handleCreate} className="card grid grid-cols-1 gap-4 sm:grid-cols-6">
        <div>
          <label className="label">구분 *</label>
          <select
            className="input"
            value={form.type}
            onChange={(e) => setForm((f) => ({ ...f, type: e.target.value as LedgerTypeValue }))}
          >
            {LEDGER_TYPES.map((type) => (
              <option key={type} value={type}>
                {LEDGER_TYPE_LABEL[type]}
              </option>
            ))}
          </select>
        </div>
        <div className="sm:col-span-2">
          <label className="label">상품 DB에서 불러오기</label>
          <select
            className="input"
            value={form.productId}
            onChange={(e) => handleProductSelect(e.target.value)}
          >
            <option value="">직접 입력</option>
            {products.map((product) => (
              <option key={product.id} value={product.id}>
                {product.name} ({formatCurrency(product.unitPrice)})
              </option>
            ))}
          </select>
        </div>
        <div className="sm:col-span-2">
          <label className="label">항목 이름 *</label>
          <input
            className="input"
            required
            value={form.productName}
            onChange={(e) => setForm((f) => ({ ...f, productId: "", productName: e.target.value }))}
            placeholder="예: 사무용 A4 용지 / 사무실 임대료"
          />
        </div>
        <div className="sm:col-span-2">
          <label className="label">거래처</label>
          <select
            className="input"
            value={form.partnerId}
            onChange={(e) => setForm((f) => ({ ...f, partnerId: e.target.value }))}
          >
            <option value="">선택 안 함</option>
            {partners.map((partner) => (
              <option key={partner.id} value={partner.id}>
                {partner.name}
              </option>
            ))}
          </select>
        </div>
        <div>
          <label className="label">수량</label>
          <input
            className="input"
            type="number"
            min={1}
            value={form.quantity}
            onChange={(e) => setForm((f) => ({ ...f, quantity: e.target.value }))}
          />
        </div>
        <div>
          <label className="label">단가 *</label>
          <input
            className="input"
            required
            type="number"
            min={0}
            value={form.unitPrice}
            onChange={(e) => setForm((f) => ({ ...f, productId: "", unitPrice: e.target.value }))}
            placeholder="0"
          />
        </div>
        <div>
          <label className="label">합계 금액</label>
          <div className="input flex items-center bg-slate-50 text-slate-600">
            {formatCurrency(previewAmount)}
          </div>
        </div>
        <div className="sm:col-span-3">
          <label className="label">메모</label>
          <input
            className="input"
            value={form.memo}
            onChange={(e) => setForm((f) => ({ ...f, memo: e.target.value }))}
            placeholder="선택 입력"
          />
        </div>
        <div className="flex items-end sm:col-span-2">
          <button type="submit" className="btn-primary w-full" disabled={submitting}>
            {submitting ? "등록 중..." : "장부에 기입"}
          </button>
        </div>
        {error && <p className="text-sm text-red-600 sm:col-span-6">{error}</p>}
      </form>

      <div className="card overflow-x-auto">
        {loading ? (
          <p className="text-sm text-slate-500">불러오는 중...</p>
        ) : entries.length === 0 ? (
          <p className="text-sm text-slate-500">{date} 기록된 내역이 없습니다.</p>
        ) : (
          <table className="table-base">
            <thead>
              <tr>
                <th>구분</th>
                <th>항목</th>
                <th>거래처</th>
                <th>수량</th>
                <th>단가</th>
                <th>금액</th>
                <th>메모</th>
                <th className="w-20">관리</th>
              </tr>
            </thead>
            <tbody>
              {entries.map((entry) => (
                <tr key={entry.id}>
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
                  <td className="text-slate-500">{entry.partnerName ?? "-"}</td>
                  <td>{entry.quantity}</td>
                  <td>{formatCurrency(entry.unitPrice)}</td>
                  <td className="font-medium">{formatCurrency(entry.amount)}</td>
                  <td className="text-slate-500">{entry.memo ?? "-"}</td>
                  <td>
                    <button className="btn-danger px-2 py-1 text-xs" onClick={() => handleDelete(entry.id)}>
                      삭제
                    </button>
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

function SummaryCard({ label, value, tone }: { label: string; value: number; tone: string }) {
  return (
    <div className="card py-3">
      <p className="text-xs font-medium text-slate-500">{label}</p>
      <p className={`mt-1 text-base font-bold ${tone}`}>{formatCurrency(value)}</p>
    </div>
  );
}
