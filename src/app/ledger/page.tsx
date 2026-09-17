"use client";

import { useEffect, useMemo, useState } from "react";
import { formatCurrency, todayDateInputValue, LEDGER_TYPE_LABEL } from "@/lib/format";
import { LEDGER_TYPES, type LedgerTypeValue } from "@/lib/ledger-types";
import { useSuggestions } from "@/lib/use-suggestions";
import { PAYMENT_METHOD_LABEL, type PaymentMethod as PaymentMethodValue } from "@/lib/accounting";

// 일일 장부 입력 화면에서는 세액(계좌·카드, 세금계산서 거래)과 현금 두 가지만 선택하게 한다.
const SELECTABLE_PAYMENT_METHODS: PaymentMethodValue[] = ["BANK", "CASH"];
const SHIPPING_FEE = 6000;
const VAT_RATE = 0.1;

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
  paymentMethod: PaymentMethodValue;
  isSample: boolean;
  memo: string | null;
};

type ItemRow = {
  productId: string;
  productName: string;
  quantity: string;
  unitPrice: string;
};

function emptyItem(): ItemRow {
  return { productId: "", productName: "", quantity: "1", unitPrice: "" };
}

export default function LedgerPage() {
  const [date, setDate] = useState(todayDateInputValue());
  const [entries, setEntries] = useState<LedgerEntry[]>([]);
  const [products, setProducts] = useState<Product[]>([]);
  const [partners, setPartners] = useState<Partner[]>([]);
  const [loading, setLoading] = useState(true);

  // 이번 기입 배치(같은 거래처/결제수단으로 여러 품목을 한 번에 기입)
  const [type, setType] = useState<LedgerTypeValue>("SALE");
  const [partnerId, setPartnerId] = useState("");
  const [partnerName, setPartnerName] = useState("");
  const [paymentMethod, setPaymentMethod] = useState<PaymentMethodValue>("CASH");
  const [memo, setMemo] = useState("");
  const [items, setItems] = useState<ItemRow[]>([emptyItem()]);
  const [isSample, setIsSample] = useState(false);
  const [includeVat, setIncludeVat] = useState(false);
  const [includeShipping, setIncludeShipping] = useState(false);

  const [submitting, setSubmitting] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const productNameSuggestions = useSuggestions("ledgerProductName");
  const memoSuggestions = useSuggestions("ledgerMemo");

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
  }, [date]);

  function resetBatch() {
    setItems([emptyItem()]);
    setMemo("");
    setIsSample(false);
    setIncludeVat(false);
    setIncludeShipping(false);
    // 거래처/결제수단/구분은 연달아 같은 조건으로 기입하는 경우가 많아 그대로 유지
  }

  function updateItem(index: number, patch: Partial<ItemRow>) {
    setItems((rows) => rows.map((row, i) => (i === index ? { ...row, ...patch } : row)));
  }

  function handleItemProductSelect(index: number, productId: string) {
    const product = products.find((p) => p.id === productId);
    updateItem(index, {
      productId,
      productName: product ? product.name : items[index].productName,
      unitPrice: product ? String(product.unitPrice) : items[index].unitPrice,
    });
  }

  function handleItemNameInput(index: number, value: string) {
    const match = products.find((p) => p.name === value);
    updateItem(index, {
      productName: value,
      productId: match ? match.id : "",
      unitPrice: match ? String(match.unitPrice) : items[index].unitPrice,
    });
  }

  function handlePartnerNameInput(value: string) {
    const match = partners.find((p) => p.name === value);
    setPartnerName(value);
    setPartnerId(match ? match.id : "");
  }

  function addItemRow() {
    setItems((rows) => [...rows, emptyItem()]);
  }

  function removeItemRow(index: number) {
    setItems((rows) => (rows.length > 1 ? rows.filter((_, i) => i !== index) : rows));
  }

  const productNameOptions = useMemo(() => {
    const set = new Set<string>();
    for (const p of products) set.add(p.name);
    for (const n of productNameSuggestions) set.add(n);
    return Array.from(set);
  }, [products, productNameSuggestions]);

  const itemsSubtotal = items.reduce((sum, row) => {
    const qty = Number(row.quantity) || 0;
    const price = Number(row.unitPrice) || 0;
    return sum + Math.round(qty * price);
  }, 0);
  const vatAmount = includeVat ? Math.round(itemsSubtotal * VAT_RATE) : 0;
  const shippingAmount = includeShipping ? SHIPPING_FEE : 0;
  const batchTotal = itemsSubtotal + vatAmount + shippingAmount;

  async function handleCreate(e: React.FormEvent) {
    e.preventDefault();
    setError(null);
    setSubmitting(true);
    try {
      const batchItems = items.map((row) => ({
        productId: row.productId || undefined,
        productName: row.productName,
        quantity: Number(row.quantity) || 1,
        unitPrice: Number(row.unitPrice) || 0,
      }));

      // 부가세는 품목 소계 기준으로 계산해 별도 한 줄로 추가한다.
      if (includeVat && vatAmount > 0) {
        batchItems.push({ productId: undefined, productName: "부가세(VAT 10%)", quantity: 1, unitPrice: vatAmount });
      }

      // 택배비는 모든 품목/부가세 계산이 끝난 뒤 정액으로 별도 추가한다.
      if (includeShipping) {
        batchItems.push({ productId: undefined, productName: "택배비", quantity: 1, unitPrice: SHIPPING_FEE });
      }

      const res = await fetch("/api/ledger/batch", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          date,
          type,
          partnerId: partnerId || undefined,
          partnerName,
          paymentMethod,
          memo,
          isSample,
          items: batchItems,
        }),
      });
      if (!res.ok) {
        const data = await res.json().catch(() => ({}));
        setError(data.error ?? "등록에 실패했습니다.");
        return;
      }

      resetBatch();
      await loadEntries(date);
    } catch (err) {
      setError(err instanceof Error ? err.message : "등록에 실패했습니다.");
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

      <form onSubmit={handleCreate} className="card flex flex-col gap-4">
        <div className="grid grid-cols-1 gap-4 sm:grid-cols-4">
          <div>
            <label className="label">구분 *</label>
            <select className="input" value={type} onChange={(e) => setType(e.target.value as LedgerTypeValue)}>
              {LEDGER_TYPES.map((t) => (
                <option key={t} value={t}>
                  {LEDGER_TYPE_LABEL[t]}
                </option>
              ))}
            </select>
          </div>
          <div>
            <label className="label">거래처</label>
            <input
              className="input"
              list="partnerNameOptions"
              value={partnerName}
              onChange={(e) => handlePartnerNameInput(e.target.value)}
              placeholder="거래처명 입력 (DB에 있으면 자동 연결)"
            />
            <datalist id="partnerNameOptions">
              {partners.map((partner) => (
                <option key={partner.id} value={partner.name} />
              ))}
            </datalist>
          </div>
          <div>
            <label className="label">결제수단</label>
            <select
              className="input"
              value={paymentMethod}
              onChange={(e) => setPaymentMethod(e.target.value as PaymentMethodValue)}
            >
              {SELECTABLE_PAYMENT_METHODS.map((pm) => (
                <option key={pm} value={pm}>
                  {PAYMENT_METHOD_LABEL[pm]}
                </option>
              ))}
            </select>
          </div>
          <div>
            <label className="label">메모 (전체 공통)</label>
            <input
              className="input"
              list="ledgerMemoSuggestions"
              value={memo}
              onChange={(e) => setMemo(e.target.value)}
              placeholder="선택 입력"
            />
            <datalist id="ledgerMemoSuggestions">
              {memoSuggestions.map((m) => (
                <option key={m} value={m} />
              ))}
            </datalist>
          </div>
        </div>

        <div className="flex flex-col gap-3">
          <div className="flex items-center justify-between">
            <p className="text-xs font-medium text-slate-500">
              품목 (같은 거래처에서 여러 개 주문 시 아래에 추가하세요)
            </p>
            <button type="button" className="btn-secondary px-3 py-1 text-xs" onClick={addItemRow}>
              + 품목 추가
            </button>
          </div>

          {items.map((row, index) => (
            <div key={index} className="grid grid-cols-1 gap-3 rounded-lg border border-slate-100 p-3 sm:grid-cols-12 sm:items-end">
              <div className="sm:col-span-2">
                <label className="label">상품 DB</label>
                <select className="input" value={row.productId} onChange={(e) => handleItemProductSelect(index, e.target.value)}>
                  <option value="">직접 입력</option>
                  {products.map((product) => (
                    <option key={product.id} value={product.id}>
                      {product.name}
                    </option>
                  ))}
                </select>
              </div>
              <div className="sm:col-span-4">
                <label className="label">항목 이름 *</label>
                <input
                  className="input"
                  required
                  list="productNameSuggestions"
                  value={row.productName}
                  onChange={(e) => handleItemNameInput(index, e.target.value)}
                  placeholder="예: 사무용 A4 용지 / 사무실 임대료"
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
                  placeholder="0"
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
                  disabled={items.length <= 1}
                >
                  삭제
                </button>
              </div>
            </div>
          ))}

          <datalist id="productNameSuggestions">
            {productNameOptions.map((name) => (
              <option key={name} value={name} />
            ))}
          </datalist>
        </div>

        <div className="flex flex-wrap items-center gap-5 border-t border-slate-100 pt-4 text-sm text-slate-600">
          <label className="flex items-center gap-2">
            <input
              type="checkbox"
              className="h-4 w-4 rounded border-slate-300 text-brand-600 focus:ring-brand-500"
              checked={isSample}
              onChange={(e) => setIsSample(e.target.checked)}
            />
            샘플 주문으로 표시 (매출은 정상 반영, 전환 추적용)
          </label>
          <label className="flex items-center gap-2">
            <input
              type="checkbox"
              className="h-4 w-4 rounded border-slate-300 text-brand-600 focus:ring-brand-500"
              checked={includeVat}
              onChange={(e) => setIncludeVat(e.target.checked)}
            />
            부가세(VAT) 10% 추가
          </label>
          <label className="flex items-center gap-2">
            <input
              type="checkbox"
              className="h-4 w-4 rounded border-slate-300 text-brand-600 focus:ring-brand-500"
              checked={includeShipping}
              onChange={(e) => setIncludeShipping(e.target.checked)}
            />
            택배비 추가 (+{formatCurrency(SHIPPING_FEE)})
          </label>
        </div>

        <div className="flex flex-wrap items-end justify-between gap-3 border-t border-slate-100 pt-4">
          <div className="text-sm text-slate-600">
            <p>
              품목 소계: <span className="font-medium text-slate-800">{formatCurrency(itemsSubtotal)}</span>
              {includeVat && (
                <span className="ml-3">
                  부가세: <span className="font-medium text-slate-800">{formatCurrency(vatAmount)}</span>
                </span>
              )}
              {includeShipping && (
                <span className="ml-3">
                  택배비: <span className="font-medium text-slate-800">{formatCurrency(shippingAmount)}</span>
                </span>
              )}
            </p>
            <p className="mt-1">
              이번 기입 합계: <span className="font-bold text-slate-800">{formatCurrency(batchTotal)}</span>
              <span className="ml-1 text-xs text-slate-400">({items.length}개 품목)</span>
            </p>
          </div>
          <button type="submit" className="btn-primary" disabled={submitting}>
            {submitting ? "등록 중..." : "장부에 기입"}
          </button>
        </div>
        {error && <p className="text-sm text-red-600">{error}</p>}
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
                <th>결제</th>
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
                  <td className="font-medium text-slate-800">
                    {entry.productName}
                    {entry.isSample && (
                      <span className="ml-2 rounded-full bg-amber-50 px-2 py-0.5 text-xs font-medium text-amber-700">
                        샘플
                      </span>
                    )}
                  </td>
                  <td className="text-slate-500">{entry.partnerName ?? "-"}</td>
                  <td>{entry.quantity}</td>
                  <td>{formatCurrency(entry.unitPrice)}</td>
                  <td className="font-medium">{formatCurrency(entry.amount)}</td>
                  <td className="text-slate-500">{PAYMENT_METHOD_LABEL[entry.paymentMethod] ?? entry.paymentMethod}</td>
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
