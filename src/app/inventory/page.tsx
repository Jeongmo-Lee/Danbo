"use client";

import { useEffect, useState } from "react";

type InventoryItem = {
  id: string;
  currentStock: number;
  safetyStock: number;
  location: string | null;
  product: { id: string; name: string; unit: string | null };
};

type StockMovement = {
  id: string;
  type: string;
  quantity: number;
  reason: string | null;
  createdAt: string;
  inventoryItem: { product: { name: string; unit: string | null } };
};

const MOVEMENT_LABEL: Record<string, string> = { IN: "입고", OUT: "출고", ADJUST: "조정" };

export default function InventoryPage() {
  const [items, setItems] = useState<InventoryItem[]>([]);
  const [movements, setMovements] = useState<StockMovement[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  const [moveProductId, setMoveProductId] = useState<string | null>(null);
  const [moveType, setMoveType] = useState<"IN" | "OUT" | "ADJUST">("IN");
  const [moveQuantity, setMoveQuantity] = useState("");
  const [moveReason, setMoveReason] = useState("");
  const [submitting, setSubmitting] = useState(false);

  const [editingSettingsId, setEditingSettingsId] = useState<string | null>(null);
  const [safetyStockDraft, setSafetyStockDraft] = useState("");
  const [locationDraft, setLocationDraft] = useState("");

  async function load() {
    setLoading(true);
    const res = await fetch("/api/inventory");
    const data = await res.json();
    setItems(data.items);
    setMovements(data.recentMovements);
    setLoading(false);
  }

  useEffect(() => {
    load();
  }, []);

  function openMoveForm(productId: string) {
    setMoveProductId(productId);
    setMoveType("IN");
    setMoveQuantity("");
    setMoveReason("");
  }

  async function submitMove(e: React.FormEvent) {
    e.preventDefault();
    if (!moveProductId) return;
    setError(null);
    setSubmitting(true);
    try {
      const res = await fetch("/api/inventory", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          productId: moveProductId,
          type: moveType,
          quantity: moveQuantity,
          reason: moveReason,
        }),
      });
      const data = await res.json();
      if (!res.ok) {
        setError(data.error ?? "재고 반영에 실패했습니다.");
        return;
      }
      setMoveProductId(null);
      await load();
    } finally {
      setSubmitting(false);
    }
  }

  function openSettings(item: InventoryItem) {
    setEditingSettingsId(item.id);
    setSafetyStockDraft(String(item.safetyStock));
    setLocationDraft(item.location ?? "");
  }

  async function saveSettings(id: string) {
    await fetch(`/api/inventory/${id}`, {
      method: "PATCH",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ safetyStock: safetyStockDraft, location: locationDraft }),
    });
    setEditingSettingsId(null);
    await load();
  }

  const lowStockCount = items.filter((i) => i.currentStock <= i.safetyStock && i.safetyStock > 0).length;

  return (
    <div className="flex flex-col gap-6">
      <div>
        <h1 className="text-xl font-bold text-slate-800">재고 관리</h1>
        <p className="mt-1 text-sm text-slate-500">
          상품별 현재 재고와 입출고 내역을 관리합니다. 매출/매입 장부에 상품을 연결해 입력하면 재고가 자동으로 반영됩니다.
          {lowStockCount > 0 && (
            <span className="ml-2 font-medium text-red-600">안전재고 이하 상품 {lowStockCount}건</span>
          )}
        </p>
      </div>

      {error && <p className="text-sm text-red-600">{error}</p>}

      <div className="card overflow-x-auto">
        {loading ? (
          <p className="text-sm text-slate-500">불러오는 중...</p>
        ) : items.length === 0 ? (
          <p className="text-sm text-slate-500">등록된 상품이 없습니다. 상품 관리에서 먼저 상품을 등록해주세요.</p>
        ) : (
          <table className="table-base">
            <thead>
              <tr>
                <th>상품</th>
                <th>현재고</th>
                <th>안전재고</th>
                <th>위치</th>
                <th>상태</th>
                <th className="w-52">관리</th>
              </tr>
            </thead>
            <tbody>
              {items.map((item) => {
                const low = item.safetyStock > 0 && item.currentStock <= item.safetyStock;
                return (
                  <tr key={item.id}>
                    <td className="font-medium text-slate-800">
                      {item.product.name}
                      {item.product.unit ? <span className="ml-1 text-xs text-slate-400">({item.product.unit})</span> : null}
                    </td>
                    <td className={low ? "font-semibold text-red-600" : ""}>{item.currentStock}</td>
                    {editingSettingsId === item.id ? (
                      <>
                        <td>
                          <input
                            className="input"
                            type="number"
                            min={0}
                            value={safetyStockDraft}
                            onChange={(e) => setSafetyStockDraft(e.target.value)}
                          />
                        </td>
                        <td>
                          <input className="input" value={locationDraft} onChange={(e) => setLocationDraft(e.target.value)} />
                        </td>
                        <td>-</td>
                        <td>
                          <div className="flex gap-1">
                            <button className="btn-primary px-2 py-1 text-xs" onClick={() => saveSettings(item.id)}>
                              저장
                            </button>
                            <button className="btn-secondary px-2 py-1 text-xs" onClick={() => setEditingSettingsId(null)}>
                              취소
                            </button>
                          </div>
                        </td>
                      </>
                    ) : (
                      <>
                        <td>{item.safetyStock}</td>
                        <td className="text-slate-500">{item.location ?? "-"}</td>
                        <td>
                          {low ? (
                            <span className="rounded-full bg-red-50 px-2 py-0.5 text-xs font-medium text-red-700">부족</span>
                          ) : (
                            <span className="rounded-full bg-emerald-50 px-2 py-0.5 text-xs font-medium text-emerald-700">정상</span>
                          )}
                        </td>
                        <td>
                          <div className="flex gap-1">
                            <button className="btn-secondary px-2 py-1 text-xs" onClick={() => openMoveForm(item.product.id)}>
                              입출고
                            </button>
                            <button className="btn-secondary px-2 py-1 text-xs" onClick={() => openSettings(item)}>
                              설정
                            </button>
                          </div>
                        </td>
                      </>
                    )}
                  </tr>
                );
              })}
            </tbody>
          </table>
        )}
      </div>

      {moveProductId && (
        <form onSubmit={submitMove} className="card grid grid-cols-1 gap-4 sm:grid-cols-4">
          <div>
            <label className="label">유형</label>
            <select
              className="input"
              value={moveType}
              onChange={(e) => setMoveType(e.target.value as "IN" | "OUT" | "ADJUST")}
            >
              <option value="IN">입고</option>
              <option value="OUT">출고</option>
              <option value="ADJUST">조정 (실사 보정, +/-)</option>
            </select>
          </div>
          <div>
            <label className="label">수량 {moveType === "ADJUST" ? "(증감, 음수 가능)" : ""}</label>
            <input
              className="input"
              type="number"
              required
              value={moveQuantity}
              onChange={(e) => setMoveQuantity(e.target.value)}
            />
          </div>
          <div>
            <label className="label">사유</label>
            <input className="input" value={moveReason} onChange={(e) => setMoveReason(e.target.value)} placeholder="선택 입력" />
          </div>
          <div className="flex items-end gap-2">
            <button type="submit" className="btn-primary w-full" disabled={submitting}>
              {submitting ? "반영 중..." : "반영"}
            </button>
            <button type="button" className="btn-secondary" onClick={() => setMoveProductId(null)}>
              취소
            </button>
          </div>
        </form>
      )}

      <section>
        <h2 className="mb-3 text-sm font-semibold text-slate-600">최근 입출고 내역</h2>
        <div className="card overflow-x-auto">
          {movements.length === 0 ? (
            <p className="text-sm text-slate-500">입출고 내역이 없습니다.</p>
          ) : (
            <table className="table-base">
              <thead>
                <tr>
                  <th>일시</th>
                  <th>상품</th>
                  <th>구분</th>
                  <th>수량</th>
                  <th>사유</th>
                </tr>
              </thead>
              <tbody>
                {movements.map((m) => (
                  <tr key={m.id}>
                    <td>{new Date(m.createdAt).toLocaleString("ko-KR")}</td>
                    <td className="font-medium text-slate-800">{m.inventoryItem.product.name}</td>
                    <td>{MOVEMENT_LABEL[m.type] ?? m.type}</td>
                    <td>{m.quantity}</td>
                    <td className="text-slate-500">{m.reason ?? "-"}</td>
                  </tr>
                ))}
              </tbody>
            </table>
          )}
        </div>
      </section>
    </div>
  );
}
