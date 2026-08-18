import type { Metadata } from "next";
import "./globals.css";
import { NavLink } from "./nav-link";

export const metadata: Metadata = {
  title: "단보 회계장부",
  description: "회사/개인 회계 관리 사이트 - 상품 관리, 일일 매출/매입 장부",
};

export default function RootLayout({ children }: { children: React.ReactNode }) {
  return (
    <html lang="ko">
      <body>
        <div className="min-h-screen">
          <header className="border-b border-slate-200 bg-white print:hidden">
            <div className="mx-auto flex max-w-5xl flex-wrap items-center justify-between gap-2 px-4 py-3">
              <div className="flex items-center gap-2">
                <span className="text-lg font-bold text-brand-700">단보 회계장부</span>
              </div>
              <nav className="flex flex-wrap gap-1">
                <NavLink href="/">대시보드</NavLink>
                <NavLink href="/ledger">일일 장부</NavLink>
                <NavLink href="/products">상품 관리</NavLink>
                <NavLink href="/partners">거래처 관리</NavLink>
                <NavLink href="/receipts">영수증</NavLink>
                <NavLink href="/settings">설정</NavLink>
              </nav>
            </div>
          </header>
          <main className="mx-auto max-w-5xl px-4 py-6 print:max-w-none print:p-0">{children}</main>
        </div>
      </body>
    </html>
  );
}
