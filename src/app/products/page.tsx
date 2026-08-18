"use client";

import { useEffect, useState } from "react";
import { formatCurrency } from "@/lib/format";

type Product = {
  id: string;
  name: string;
  unitPrice: number;
  unit: string | null;
  memo: string | null;
  createdAt: string;
};

type FormState = {
  name: string;
  unitPrice: string;
  unit: string;
  memo: string;
};

const emptyForm: FormState = { name: "", unitPrice: "", unit: "", memo: "" };

export default function ProductsPage() {
  const [products, setProducts] = useState<Product[]>([]);
  const [loading, setLoading] = useState(true);
  const [form, setForm] = useState<FormState>(emptyForm);
  const [submitting, setSubmitting] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [editingId, setEditingId] = useState<string | null>(null);
  const [editForm, setEditForm] = useState<FormState>(emptyForm);

  async function loadProducts() {
    setLoading(true);
    const res = await fetch("/api/products");
    const data = await res.json();
    setProducts(data);
    setLoading(false);
  }

  useEffect(() => {
    loadProducts();
  }, []);

  async function handleCreate(e: React.FormEvent) {
    e.preventDefault();
    setError(null);
    setSubmitting(true);
    try {
      const res = await fetch("/api/products", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(form),
      });
      const data = await res.json();
      if (!res.ok) {
        setError(data.error ?? "상품 등록에 실패했습니다.");
        return;
      }
      setForm(emptyForm);
      await loadProducts();
    } finally {
      setSubmitting(false);
    }
  }

  function startEdit(product: Product) {
    setEditingId(product.id);
    setEditForm({
      name: product.name,
      unitPrice: String(product.unitPrice),
      unit: product.unit ?? "",
      memo: product.memo ?? "",
    });
  }

  async function handleUpdate(id: string) {
    setError(null);
    const res = await fetch(`/api/products/${id}`, {
      method: "PATCH",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify(editForm),
    });
    const data = await res.json();
    if (!res.ok) {
      setError(data.error ?? "상품 수정에 실패했습니다.");
      return;
    }
    setEditingId(null);
    await loadProducts();
  }

  async function handleDelete(id: string) {
    if (!confirm("이 상품을 삭제하시겠습니까? 기존 장부 내역은 유지됩니다.")) return;
    await fetch(`/api/products/${id}`, { method: "DELETE" });
    await loadProducts();
  }

  return (
    <div className="flex flex-col gap-6">
      <div>
        <h1 className="text-xl font-bold text-slate-800">상품 관리</h1>
        <p className="mt-1 text-sm text-slate-500">
          매출/매입 입력 시 선택할 상품과 단가를 미리 등록해두세요.
        </p>
      </div>

      <form onSubmit={handleCreate} className="card grid grid-cols-1 gap-4 sm:grid-cols-5">
        <div className="sm:col-span-2">
          <label className="label">상품 이름 *</label>
          <input
            className="input"
            required
            value={form.name}
            onChange={(e) => setForm((f) => ({ ...f, name: e.target.value }))}
            placeholder="예: 사무용 A4 용지"
          />
        </div>
        <div>
          <label className="label">단가 (원) *</label>
          <input
            className="input"
            required
            type="number"
            min={0}
            value={form.unitPrice}
            onChange={(e) => setForm((f) => ({ ...f, unitPrice: e.target.value }))}
            placeholder="0"
          />
        </div>
        <div>
          <label className="label">단위</label>
          <input
            className="input"
            value={form.unit}
            onChange={(e) => setForm((f) => ({ ...f, unit: e.target.value }))}
            placeholder="개, 박스 등"
          />
        </div>
        <div className="flex items-end">
          <button type="submit" className="btn-primary w-full" disabled={submitting}>
            {submitting ? "등록 중..." : "상품 등록"}
          </button>
        </div>
        <div className="sm:col-span-5">
          <label className="label">메모</label>
          <input
            className="input"
            value={form.memo}
            onChange={(e) => setForm((f) => ({ ...f, memo: e.target.value }))}
            placeholder="선택 입력"
          />
        </div>
        {error && <p className="text-sm text-red-600 sm:col-span-5">{error}</p>}
      </form>

      <div className="card overflow-x-auto">
        {loading ? (
          <p className="text-sm text-slate-500">불러오는 중...</p>
        ) : products.length === 0 ? (
          <p className="text-sm text-slate-500">등록된 상품이 없습니다.</p>
        ) : (
          <table className="table-base">
            <thead>
              <tr>
                <th>상품 이름</th>
                <th>단가</th>
                <th>단위</th>
                <th>메모</th>
                <th className="w-32">관리</th>
              </tr>
            </thead>
            <tbody>
              {products.map((product) => (
                <tr key={product.id}>
                  {editingId === product.id ? (
                    <>
                      <td>
                        <input
                          className="input"
                          value={editForm.name}
                          onChange={(e) => setEditForm((f) => ({ ...f, name: e.target.value }))}
                        />
                      </td>
                      <td>
                        <input
                          className="input"
                          type="number"
                          min={0}
                          value={editForm.unitPrice}
                          onChange={(e) => setEditForm((f) => ({ ...f, unitPrice: e.target.value }))}
                        />
                      </td>
                      <td>
                        <input
                          className="input"
                          value={editForm.unit}
                          onChange={(e) => setEditForm((f) => ({ ...f, unit: e.target.value }))}
                        />
                      </td>
                      <td>
                        <input
                          className="input"
                          value={editForm.memo}
                          onChange={(e) => setEditForm((f) => ({ ...f, memo: e.target.value }))}
                        />
                      </td>
                      <td>
                        <div className="flex gap-1">
                          <button className="btn-primary px-2 py-1 text-xs" onClick={() => handleUpdate(product.id)}>
                            저장
                          </button>
                          <button
                            className="btn-secondary px-2 py-1 text-xs"
                            onClick={() => setEditingId(null)}
                          >
                            취소
                          </button>
                        </div>
                      </td>
                    </>
                  ) : (
                    <>
                      <td className="font-medium text-slate-800">{product.name}</td>
                      <td>{formatCurrency(product.unitPrice)}</td>
                      <td>{product.unit ?? "-"}</td>
                      <td className="text-slate-500">{product.memo ?? "-"}</td>
                      <td>
                        <div className="flex gap-1">
                          <button
                            className="btn-secondary px-2 py-1 text-xs"
                            onClick={() => startEdit(product)}
                          >
                            수정
                          </button>
                          <button
                            className="btn-danger px-2 py-1 text-xs"
                            onClick={() => handleDelete(product.id)}
                          >
                            삭제
                          </button>
                        </div>
                      </td>
                    </>
                  )}
                </tr>
              ))}
            </tbody>
          </table>
        )}
      </div>
    </div>
  );
}
