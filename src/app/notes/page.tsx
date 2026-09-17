"use client";

import { useEffect, useState } from "react";
import { todayDateInputValue } from "@/lib/format";

type DailyNote = {
  id: string;
  date: string;
  tag: string | null;
  content: string;
};

const TAGS = ["재고", "고객", "매출", "기타"];

export default function NotesPage() {
  const [notes, setNotes] = useState<DailyNote[]>([]);
  const [loading, setLoading] = useState(true);
  const [date, setDate] = useState(todayDateInputValue());
  const [tag, setTag] = useState("기타");
  const [content, setContent] = useState("");
  const [submitting, setSubmitting] = useState(false);
  const [error, setError] = useState<string | null>(null);

  async function load() {
    setLoading(true);
    const res = await fetch("/api/notes");
    setNotes(await res.json());
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
      const res = await fetch("/api/notes", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ date, tag, content }),
      });
      const data = await res.json();
      if (!res.ok) {
        setError(data.error ?? "메모 등록에 실패했습니다.");
        return;
      }
      setContent("");
      await load();
    } finally {
      setSubmitting(false);
    }
  }

  async function handleDelete(id: string) {
    await fetch(`/api/notes/${id}`, { method: "DELETE" });
    await load();
  }

  return (
    <div className="flex flex-col gap-6">
      <div>
        <h1 className="text-xl font-bold text-slate-800">일일 메모 / 특이사항</h1>
        <p className="mt-1 text-sm text-slate-500">회계장부에는 담기 어려운 그날그날의 특이사항을 자유롭게 기록하세요.</p>
      </div>

      <form onSubmit={handleCreate} className="card grid grid-cols-1 gap-4 sm:grid-cols-6">
        <div>
          <label className="label">날짜</label>
          <input className="input" type="date" value={date} onChange={(e) => setDate(e.target.value)} />
        </div>
        <div>
          <label className="label">태그</label>
          <select className="input" value={tag} onChange={(e) => setTag(e.target.value)}>
            {TAGS.map((t) => (
              <option key={t} value={t}>
                {t}
              </option>
            ))}
          </select>
        </div>
        <div className="sm:col-span-3">
          <label className="label">내용 *</label>
          <input className="input" required value={content} onChange={(e) => setContent(e.target.value)} />
        </div>
        <div className="flex items-end">
          <button type="submit" className="btn-primary w-full" disabled={submitting}>
            {submitting ? "등록 중..." : "메모 추가"}
          </button>
        </div>
        {error && <p className="text-sm text-red-600 sm:col-span-6">{error}</p>}
      </form>

      <div className="card overflow-x-auto">
        {loading ? (
          <p className="text-sm text-slate-500">불러오는 중...</p>
        ) : notes.length === 0 ? (
          <p className="text-sm text-slate-500">등록된 메모가 없습니다.</p>
        ) : (
          <table className="table-base">
            <thead>
              <tr>
                <th>날짜</th>
                <th>태그</th>
                <th>내용</th>
                <th className="w-20">관리</th>
              </tr>
            </thead>
            <tbody>
              {notes.map((n) => (
                <tr key={n.id}>
                  <td>{new Date(n.date).toLocaleDateString("ko-KR")}</td>
                  <td>
                    {n.tag && (
                      <span className="rounded-full bg-slate-100 px-2 py-0.5 text-xs font-medium text-slate-600">{n.tag}</span>
                    )}
                  </td>
                  <td className="text-slate-700">{n.content}</td>
                  <td>
                    <button className="btn-danger px-2 py-1 text-xs" onClick={() => handleDelete(n.id)}>
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
