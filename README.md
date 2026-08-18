# 단보 회계장부

회사/개인용 간단 회계 관리 사이트입니다.

## 주요 기능

- **상품 관리**: 상품 이름과 단가(및 단위, 메모)를 등록/수정/삭제
- **일일 회계장부**: 날짜별로 매출/매입/기타수입/기타지출을 기입하고 당일 합계·손익 확인
- **상품 연동 입력**: 장부 기입 시 상품 DB에서 상품을 선택하면 이름과 단가가 자동으로 채워짐
- **대시보드**: 오늘/이번 달 매출·매입·손익 요약과 최근 거래 내역

## 기술 스택

- Next.js (App Router) + TypeScript
- Tailwind CSS
- Prisma ORM + SQLite

## 시작하기

```bash
npm install
npx prisma migrate dev   # DB 생성 (최초 1회)
npm run db:seed          # 샘플 상품 데이터 시드 (선택)
npm run dev
```

http://localhost:3000 에서 확인할 수 있습니다.

## 스크립트

- `npm run dev`: 개발 서버 실행
- `npm run build` / `npm start`: 프로덕션 빌드/실행
- `npm run prisma:migrate`: 스키마 변경 후 마이그레이션 생성/적용
- `npm run db:seed`: 샘플 상품 데이터 시드
