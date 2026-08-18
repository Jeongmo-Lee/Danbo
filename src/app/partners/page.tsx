"use client";

import { useEffect, useState } from "react";

type Partner = {
  id: string;
  name: string;
  businessNumber: string | null;
  ceoName: string | null;
  address: string | null;
  businessType: string | null;
  businessItem: string | null;
  phone: string | null;
  email: string | null;
  memo: string | null;
};

type FormState = {
  name: string;
  businessNumber: string;
  ceoName: string;
  address: string;
  businessType: string;
  businessItem: string;
  phone: string;
  email: string;
  memo: string;
};

const emptyForm: FormState = {
  name: "",
  businessNumber: "",
  ceoName: "",
  address: "",
  businessType: "",
  businessItem: "",
  phone: "",
  email: "",
  memo: "",
};

export default function PartnersPage() {
  const [partners, setPartners] = useState<Partner[]>([]);
  const [loading, setLoading] = useState(true);
  const [form, setForm] = useState<FormState>(emptyForm);
  const [submitting, setSubmitting] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [editingId, setEditingId] = useState<string | null>(null);
  const [editForm, setEditForm] = useState<FormState>(emptyForm);

  async function loadPartners() {
    setLoading(true);
    const res = await fetch("/api/partners");
    const data = await res.json();
    setPartners(data);
    setLoading(false);
  }

  useEffect(() => {
    loadPartners();
  }, []);

  async function handleCreate(e: React.FormEvent) {
    e.preventDefault();
    setError(null);
    setSubmitting(true);
    try {
      const res = await fetch("/api/partners", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(form),
      });
      const data = await res.json();
      if (!res.ok) {
        setError(data.error ?? "거래처 등록에 실패했습니다.");
        return;
      }
      setForm(emptyForm);
      await loadPartners();
    } finally {
      setSubmitting(false);
    }
  }

  function startEdit(partner: Partner) {
    setEditingId(partner.id);
    setEditForm({
      name: partner.name,
      businessNumber: partner.businessNumber ?? "",
      ceoName: partner.ceoName ?? "",
      address: partner.address ?? "",
      businessType: partner.businessType ?? "",
      businessItem: partner.businessItem ?? "",
      phone: partner.phone ?? "",
      email: partner.email ?? "",
      memo: partner.memo ?? "",
    });
  }

  async function handleUpdate(id: string) {
    setError(null);
    const res = await fetch(`/api/partners/${id}`, {
      method: "PATCH",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify(editForm),
    });
    const data = await res.json();
    if (!res.ok) {
      setError(data.error ?? "거래처 수정에 실패했습니다.");
      return;
    }
    setEditingId(null);
    await loadPartners();
  }

  async function handleDelete(id: string) {
    if (!confirm("이 거래처를 삭제하시겠습니까? 기존 장부/영수증 내역은 유지됩니다.")) return;
    await fetch(`/api/partners/${id}`, { method: "DELETE" });
    await loadPartners();
  }

  return (
    <div className="flex flex-col gap-6">
      <div>
        <h1 className="text-xl font-bold text-slate-800">거래처 관리</h1>
        <p className="mt-1 text-sm text-slate-500">
          장부 입력과 영수증 발행 시 선택할 거래처 정보를 미리 등록해두세요.
        </p>
      </div>

      <form onSubmit={handleCreate} className="card grid grid-cols-1 gap-4 sm:grid-cols-4">
        <div className="sm:col-span-2">
          <label className="label">상호명 *</label>
          <input
            className="input"
            required
            value={form.name}
            onChange={(e) => setForm((f) => ({ ...f, name: e.target.value }))}
            placeholder="예: 단보상사"
          />
        </div>
        <div>
          <label className="label">사업자등록번호</label>
          <input
            className="input"
            value={form.businessNumber}
            onChange={(e) => setForm((f) => ({ ...f, businessNumber: e.target.value }))}
            placeholder="000-00-00000"
          />
        </div>
        <div>
          <label className="label">대표자</label>
          <input
            className="input"
            value={form.ceoName}
            onChange={(e) => setForm((f) => ({ ...f, ceoName: e.target.value }))}
          />
        </div>
        <div className="sm:col-span-2">
          <label className="label">사업장주소</label>
          <input
            className="input"
            value={form.address}
            onChange={(e) => setForm((f) => ({ ...f, address: e.target.value }))}
          />
        </div>
        <div>
          <label className="label">업태</label>
          <input
            className="input"
            value={form.businessType}
            onChange={(e) => setForm((f) => ({ ...f, businessType: e.target.value }))}
          />
        </div>
        <div>
          <label className="label">종목</label>
          <input
            className="input"
            value={form.businessItem}
            onChange={(e) => setForm((f) => ({ ...f, businessItem: e.target.value }))}
          />
        </div>
        <div>
          <label className="label">연락처</label>
          <input
            className="input"
            value={form.phone}
            onChange={(e) => setForm((f) => ({ ...f, phone: e.target.value }))}
          />
        </div>
        <div>
          <label className="label">이메일</label>
          <input
            className="input"
            value={form.email}
            onChange={(e) => setForm((f) => ({ ...f, email: e.target.value }))}
          />
        </div>
        <div className="flex items-end">
          <button type="submit" className="btn-primary w-full" disabled={submitting}>
            {submitting ? "등록 중..." : "거래처 등록"}
          </button>
        </div>
        <div className="sm:col-span-4">
          <label className="label">메모</label>
          <input
            className="input"
            value={form.memo}
            onChange={(e) => setForm((f) => ({ ...f, memo: e.target.value }))}
            placeholder="선택 입력"
          />
        </div>
        {error && <p className="text-sm text-red-600 sm:col-span-4">{error}</p>}
      </form>

      <div className="card overflow-x-auto">
        {loading ? (
          <p className="text-sm text-slate-500">불러오는 중...</p>
        ) : partners.length === 0 ? (
          <p className="text-sm text-slate-500">등록된 거래처가 없습니다.</p>
        ) : (
          <table className="table-base">
            <thead>
              <tr>
                <th>상호명</th>
                <th>사업자번호</th>
                <th>대표자</th>
                <th>업태/종목</th>
                <th>연락처</th>
                <th className="w-32">관리</th>
              </tr>
            </thead>
            <tbody>
              {partners.map((partner) => (
                <tr key={partner.id}>
                  {editingId === partner.id ? (
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
                          value={editForm.businessNumber}
                          onChange={(e) => setEditForm((f) => ({ ...f, businessNumber: e.target.value }))}
                        />
                      </td>
                      <td>
                        <input
                          className="input"
                          value={editForm.ceoName}
                          onChange={(e) => setEditForm((f) => ({ ...f, ceoName: e.target.value }))}
                        />
                      </td>
                      <td>
                        <div className="flex gap-1">
                          <input
                            className="input"
                            value={editForm.businessType}
                            onChange={(e) => setEditForm((f) => ({ ...f, businessType: e.target.value }))}
                          />
                          <input
                            className="input"
                            value={editForm.businessItem}
                            onChange={(e) => setEditForm((f) => ({ ...f, businessItem: e.target.value }))}
                          />
                        </div>
                      </td>
                      <td>
                        <input
                          className="input"
                          value={editForm.phone}
                          onChange={(e) => setEditForm((f) => ({ ...f, phone: e.target.value }))}
                        />
                      </td>
                      <td>
                        <div className="flex gap-1">
                          <button className="btn-primary px-2 py-1 text-xs" onClick={() => handleUpdate(partner.id)}>
                            저장
                          </button>
                          <button className="btn-secondary px-2 py-1 text-xs" onClick={() => setEditingId(null)}>
                            취소
                          </button>
                        </div>
                      </td>
                    </>
                  ) : (
                    <>
                      <td className="font-medium text-slate-800">{partner.name}</td>
                      <td>{partner.businessNumber ?? "-"}</td>
                      <td>{partner.ceoName ?? "-"}</td>
                      <td className="text-slate-500">
                        {[partner.businessType, partner.businessItem].filter(Boolean).join(" / ") || "-"}
                      </td>
                      <td>{partner.phone ?? "-"}</td>
                      <td>
                        <div className="flex gap-1">
                          <button className="btn-secondary px-2 py-1 text-xs" onClick={() => startEdit(partner)}>
                            수정
                          </button>
                          <button className="btn-danger px-2 py-1 text-xs" onClick={() => handleDelete(partner.id)}>
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
