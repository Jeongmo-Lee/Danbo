"use client";

export function PrintButton() {
  return (
    <button type="button" className="btn-primary" onClick={() => window.print()}>
      인쇄하기
    </button>
  );
}
