"use client";

import { useEffect, useState } from "react";
import { useSuggestions } from "@/lib/use-suggestions";

type Partner = { id: string; name: string };

type Activity = { id: string; date: string; type: string; content: string };

type Customer = {
  id: string;
  name: string;
  type: string;
  grade: string | null;
  tags: string | null;
  phone: string | null;
  memo: string | null;
  partner: Partner | null;
  activities: Activity[];
  _count: { activities: number };
};

const emptyForm = { name: "", type: "DOMESTIC", grade: "", tags: "", phone: "", memo: "", partnerId: "" };

export default function CrmPage() {
  const [customers, setCustomers] = useState<Customer[]>([]);
  const [partners, setPartners] = useState<Partner[]>([]);
  const [loading, setLoading] = useState(true);
  const [form, setForm] = useState(emptyForm);
  const [submitting, setSubmitting] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const [activityCustomerId, setActivityCustomerId] = useState<string | null>(null);
  const [activityType, setActivityType] = useState("상담");
  const [activityContent, setActivityContent] = useState("");
  const gradeSuggestions = useSuggestions("customerGrade");
  const tagSuggestions = useSuggestions("customerTags");

  async function load() {
    setLoading(true);
    const [customersRes, partnersRes] = await Promise.all([fetch("/api/customers"), fetch("/api/partners")]);
    setCustomers(await customersRes.json());
    setPartners(await partnersRes.json());
    setLoading(false);
  }

  useEffect(() => {
    load();
  }, []);

  async function handleCreate(e: React.FormEvent) {
    e.preventDefault();
    setError(null);
    setSubmitting(true);
    try {
      const res = await fetch("/api/customers", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(form),
      });
      const data = await res.json();
      if (!res.ok) {
        setError(data.error ?? "고객 등록에 실패했습니다.");
        return;
      }
      setForm(emptyForm);
      await load();
    } finally {
      setSubmitting(false);
    }
  }

  async function handleDelete(id: string) {
    if (!confirm("이 고객을 삭제하시겠습니까? 활동 기록도 함께 삭제됩니다.")) return;
    await fetch(`/api/customers/${id}`, { method: "DELETE" });
    await load();
  }

  async function submitActivity(customerId: string) {
    if (!activityContent.trim()) return;
    await fetch(`/api/customers/${customerId}/activities`, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ type: activityType, content: activityContent }),
    });
    setActivityCustomerId(null);
    setActivityContent("");
    await load();
  }

  return (
    <div className="flex flex-col gap-6">
      <div>
        <h1 className="text-xl font-bold text-slate-800">고객 관리 (CRM)</h1>
        <p className="mt-1 text-sm text-slate-500">국내/해외 고객 정보와 상담·주문·클레임 활동을 기록합니다.</p>
      </div>

      <form onSubmit={handleCreate} className="card grid grid-cols-1 gap-4 sm:grid-cols-4">
        <div>
          <label className="label">고객 이름 *</label>
          <input
            className="input"
            required
            value={form.name}
            onChange={(e) => setForm((f) => ({ ...f, name: e.target.value }))}
          />
        </div>
        <div>
          <label className="label">구분</label>
          <select className="input" value={form.type} onChange={(e) => setForm((f) => ({ ...f, type: e.target.value }))}>
            <option value="DOMESTIC">국내</option>
            <option value="FOREIGN">해외</option>
          </select>
        </div>
        <div>
          <label className="label">등급</label>
          <input
            className="input"
            list="customerGradeSuggestions"
            value={form.grade}
            onChange={(e) => setForm((f) => ({ ...f, grade: e.target.value }))}
            placeholder="VIP, 일반 등"
          />
          <datalist id="customerGradeSuggestions">
            {gradeSuggestions.map((grade) => (
              <option key={grade} value={grade} />
            ))}
          </datalist>
        </div>
        <div>
          <label className="label">연동 거래처</label>
          <select
            className="input"
            value={form.partnerId}
            onChange={(e) => setForm((f) => ({ ...f, partnerId: e.target.value }))}
          >
            <option value="">선택 안 함</option>
            {partners.map((p) => (
              <option key={p.id} value={p.id}>
                {p.name}
              </option>
            ))}
          </select>
        </div>
        <div>
          <label className="label">연락처</label>
          <input className="input" value={form.phone} onChange={(e) => setForm((f) => ({ ...f, phone: e.target.value }))} />
        </div>
        <div className="sm:col-span-2">
          <label className="label">태그</label>
          <input
            className="input"
            list="customerTagSuggestions"
            value={form.tags}
            onChange={(e) => setForm((f) => ({ ...f, tags: e.target.value }))}
            placeholder="콤마로 구분 (예: 도매,단골)"
          />
          <datalist id="customerTagSuggestions">
            {tagSuggestions.map((tag) => (
              <option key={tag} value={tag} />
            ))}
          </datalist>
        </div>
        <div className="flex items-end">
          <button type="submit" className="btn-primary w-full" disabled={submitting}>
            {submitting ? "등록 중..." : "고객 등록"}
          </button>
        </div>
        {error && <p className="text-sm text-red-600 sm:col-span-4">{error}</p>}
      </form>

      <div className="flex flex-col gap-3">
        {loading ? (
          <p className="text-sm text-slate-500">불러오는 중...</p>
        ) : customers.length === 0 ? (
          <p className="text-sm text-slate-500">등록된 고객이 없습니다.</p>
        ) : (
          customers.map((c) => (
            <div key={c.id} className="card">
              <div className="flex flex-wrap items-start justify-between gap-2">
                <div>
                  <p className="text-sm font-semibold text-slate-800">
                    {c.name}
                    <span className="ml-2 rounded-full bg-slate-100 px-2 py-0.5 text-xs font-medium text-slate-600">
                      {c.type === "FOREIGN" ? "해외" : "국내"}
                    </span>
                    {c.grade && (
                      <span className="ml-1 rounded-full bg-brand-50 px-2 py-0.5 text-xs font-medium text-brand-700">
                        {c.grade}
                      </span>
                    )}
                  </p>
                  <p className="mt-1 text-xs text-slate-500">
                    {c.phone ?? "연락처 없음"}
                    {c.partner ? ` · 거래처: ${c.partner.name}` : ""}
                    {c.tags ? ` · 태그: ${c.tags}` : ""}
                  </p>
                </div>
                <div className="flex gap-1">
                  <button className="btn-secondary px-2 py-1 text-xs" onClick={() => setActivityCustomerId(c.id)}>
                    활동 기록
                  </button>
                  <button className="btn-danger px-2 py-1 text-xs" onClick={() => handleDelete(c.id)}>
                    삭제
                  </button>
                </div>
              </div>

              {activityCustomerId === c.id && (
                <div className="mt-3 flex flex-wrap items-end gap-2 border-t border-slate-100 pt-3">
                  <div>
                    <label className="label">유형</label>
                    <select className="input" value={activityType} onChange={(e) => setActivityType(e.target.value)}>
                      <option value="상담">상담</option>
                      <option value="주문">주문</option>
                      <option value="클레임">클레임</option>
                      <option value="기타">기타</option>
                    </select>
                  </div>
                  <div className="flex-1">
                    <label className="label">내용</label>
                    <input
                      className="input"
                      value={activityContent}
                      onChange={(e) => setActivityContent(e.target.value)}
                      placeholder="상담/주문/클레임 내용을 입력하세요"
                    />
                  </div>
                  <button className="btn-primary px-3 py-2 text-xs" onClick={() => submitActivity(c.id)}>
                    저장
                  </button>
                  <button className="btn-secondary px-3 py-2 text-xs" onClick={() => setActivityCustomerId(null)}>
                    취소
                  </button>
                </div>
              )}

              {c.activities.length > 0 && (
                <ul className="mt-3 flex flex-col gap-1 border-t border-slate-100 pt-3 text-xs text-slate-500">
                  {c.activities.map((a) => (
                    <li key={a.id}>
                      <span className="font-medium text-slate-600">[{a.type}]</span> {a.content}
                      <span className="ml-2 text-slate-400">{new Date(a.date).toLocaleDateString("ko-KR")}</span>
                    </li>
                  ))}
                  {c._count.activities > c.activities.length && (
                    <li className="text-slate-400">외 {c._count.activities - c.activities.length}건</li>
                  )}
                </ul>
              )}
            </div>
          ))
        )}
      </div>
    </div>
  );
}
