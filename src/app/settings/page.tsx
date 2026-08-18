"use client";

import { useEffect, useState } from "react";

type CompanyForm = {
  name: string;
  businessNumber: string;
  ceoName: string;
  address: string;
  businessType: string;
  businessItem: string;
  phone: string;
};

const emptyForm: CompanyForm = {
  name: "",
  businessNumber: "",
  ceoName: "",
  address: "",
  businessType: "",
  businessItem: "",
  phone: "",
};

export default function SettingsPage() {
  const [form, setForm] = useState<CompanyForm>(emptyForm);
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [saved, setSaved] = useState(false);

  useEffect(() => {
    (async () => {
      const res = await fetch("/api/settings/company");
      const data = await res.json();
      setForm({
        name: data.name ?? "",
        businessNumber: data.businessNumber ?? "",
        ceoName: data.ceoName ?? "",
        address: data.address ?? "",
        businessType: data.businessType ?? "",
        businessItem: data.businessItem ?? "",
        phone: data.phone ?? "",
      });
      setLoading(false);
    })();
  }, []);

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    setSaving(true);
    setSaved(false);
    try {
      await fetch("/api/settings/company", {
        method: "PUT",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(form),
      });
      setSaved(true);
    } finally {
      setSaving(false);
    }
  }

  if (loading) {
    return <p className="text-sm text-slate-500">불러오는 중...</p>;
  }

  return (
    <div className="flex flex-col gap-6">
      <div>
        <h1 className="text-xl font-bold text-slate-800">내 사업자정보</h1>
        <p className="mt-1 text-sm text-slate-500">
          영수증을 발행할 때 공급자란에 자동으로 채워집니다.
        </p>
      </div>

      <form onSubmit={handleSubmit} className="card grid grid-cols-1 gap-4 sm:grid-cols-2">
        <div>
          <label className="label">상호(법인명)</label>
          <input
            className="input"
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
          <label className="label">대표자(성명)</label>
          <input
            className="input"
            value={form.ceoName}
            onChange={(e) => setForm((f) => ({ ...f, ceoName: e.target.value }))}
          />
        </div>
        <div>
          <label className="label">전화번호</label>
          <input
            className="input"
            value={form.phone}
            onChange={(e) => setForm((f) => ({ ...f, phone: e.target.value }))}
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
        <div className="sm:col-span-2 flex items-center gap-3">
          <button type="submit" className="btn-primary" disabled={saving}>
            {saving ? "저장 중..." : "저장"}
          </button>
          {saved && <span className="text-sm text-emerald-600">저장되었습니다.</span>}
        </div>
      </form>
    </div>
  );
}
