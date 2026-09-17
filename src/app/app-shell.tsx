"use client";

import { usePathname } from "next/navigation";
import type { ReactNode } from "react";
import { NavLink, LogoutButton } from "./nav-link";

export function AppShell({ children }: { children: ReactNode }) {
  const pathname = usePathname();

  if (pathname === "/login") {
    return <>{children}</>;
  }

  return (
    <div className="min-h-screen">
      <header className="border-b border-slate-200 bg-white print:hidden">
        <div className="mx-auto flex max-w-6xl flex-wrap items-center justify-between gap-2 px-4 py-3">
          <div className="flex items-center gap-2">
            <span className="text-lg font-bold text-brand-700">단보 통합 관리</span>
          </div>
          <nav className="flex flex-wrap gap-1">
            <NavLink href="/">대시보드</NavLink>
            <NavLink href="/ledger">일일 장부</NavLink>
            <NavLink href="/inventory">재고</NavLink>
            <NavLink href="/crm">고객(CRM)</NavLink>
            <NavLink href="/marketing">마케팅</NavLink>
            <NavLink href="/notes">메모</NavLink>
            <NavLink href="/products">상품</NavLink>
            <NavLink href="/partners">거래처</NavLink>
            <NavLink href="/receipts">영수증</NavLink>
            <NavLink href="/accounts">계정과목</NavLink>
            <NavLink href="/accounting/journal">분개장</NavLink>
            <NavLink href="/export">내보내기</NavLink>
            <NavLink href="/audit">변경이력</NavLink>
            <NavLink href="/settings">설정</NavLink>
            <LogoutButton />
          </nav>
        </div>
      </header>
      <main className="mx-auto max-w-6xl px-4 py-6 print:max-w-none print:p-0">{children}</main>
    </div>
  );
}
