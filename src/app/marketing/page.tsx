"use client";

import { useEffect, useState } from "react";
import { todayDateInputValue } from "@/lib/format";

type MarketingRecord = {
  id: string;
  date: string;
  channel: string;
  title: string;
  metrics: string | null;
  memo: string | null;
};

const emptyForm = { date: todayDateInputValue(), channel: "매장 DP", title: "", metrics: "", memo: "" };

export default function MarketingPage() {
  const [records, setRecords] = useState<MarketingRecord[]>([]);
  const [loading, setLoading] = useState(true);
  const [form, setForm] = useState(emptyForm);
  const [submitting, setSubmitting] = useState(false);
  const [error, setError] = useState<string | null>(null);

  async function load() {
    setLoading(true);
    const res = await fetch("/api/marketing");
    setRecords(await res.json());
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
      const res = await fetch("/api/marketing", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(form),
      });
      const data = await res.json();
      if (!res.ok) {
        setError(data.error ?? "등록에 실패했습니다.");
        return;
      }
      setForm({ ...emptyForm, date: form.date });
      await load();
    } finally {
      setSubmitting(false);
    }
  }

  async function handleDelete(id: string) {
    if (!confirm("이 기록을 삭제하시겠습니까?")) return;
    await fetch(`/api/marketing/${id}`, { method: "DELETE" });
    await load();
  }

  return (
    <div className="flex flex-col gap-6">
      <div>
        <h1 className="text-xl font-bold text-slate-800">마케팅 / DP 기록</h1>
        <p className="mt-1 text-sm text-slate-500">매장 DP 변경 이력과 SNS 게시물 성과를 기록해두면 다음 DP 구성에 참고할 수 있습니다.</p>
      </div>

      <form onSubmit={handleCreate} className="card grid grid-cols-1 gap-4 sm:grid-cols-4">
        <div>
          <label className="label">날짜 *</label>
          <input
            className="input"
            type="date"
            required
            value={form.date}
            onChange={(e) => setForm((f) => ({ ...f, date: e.target.value }))}
          />
        </div>
        <div>
          <label className="label">채널 *</label>
          <select className="input" value={form.channel} onChange={(e) => setForm((f) => ({ ...f, channel: e.target.value }))}>
            <option value="매장 DP">매장 DP</option>
            <option value="인스타그램">인스타그램</option>
            <option value="기타">기타</option>
          </select>
        </div>
        <div className="sm:col-span-2">
          <label className="label">제목 *</label>
          <input
            className="input"
            required
            value={form.title}
            onChange={(e) => setForm((f) => ({ ...f, title: e.target.value }))}
            placeholder="예: 가을 신상 원단 DP 교체"
          />
        </div>
        <div className="sm:col-span-2">
          <label className="label">성과 지표</label>
          <input
            className="input"
            value={form.metrics}
            onChange={(e) => setForm((f) => ({ ...f, metrics: e.target.value }))}
            placeholder="예: 좋아요 320, 문의 5건, 방문 증가 체감"
          />
        </div>
        <div className="sm:col-span-2">
          <label className="label">메모</label>
          <input className="input" value={form.memo} onChange={(e) => setForm((f) => ({ ...f, memo: e.target.value }))} />
        </div>
        <div className="sm:col-span-4">
          <button type="submit" className="btn-primary" disabled={submitting}>
            {submitting ? "등록 중..." : "기록 추가"}
          </button>
        </div>
        {error && <p className="text-sm text-red-600 sm:col-span-4">{error}</p>}
      </form>

      <div className="card overflow-x-auto">
        {loading ? (
          <p className="text-sm text-slate-500">불러오는 중...</p>
        ) : records.length === 0 ? (
          <p className="text-sm text-slate-500">등록된 기록이 없습니다.</p>
        ) : (
          <table className="table-base">
            <thead>
              <tr>
                <th>날짜</th>
                <th>채널</th>
                <th>제목</th>
                <th>성과</th>
                <th>메모</th>
                <th className="w-20">관리</th>
              </tr>
            </thead>
            <tbody>
              {records.map((r) => (
                <tr key={r.id}>
                  <td>{new Date(r.date).toLocaleDateString("ko-KR")}</td>
                  <td>
                    <span className="rounded-full bg-slate-100 px-2 py-0.5 text-xs font-medium text-slate-600">{r.channel}</span>
                  </td>
                  <td className="font-medium text-slate-800">{r.title}</td>
                  <td className="text-slate-500">{r.metrics ?? "-"}</td>
                  <td className="text-slate-500">{r.memo ?? "-"}</td>
                  <td>
                    <button className="btn-danger px-2 py-1 text-xs" onClick={() => handleDelete(r.id)}>
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
