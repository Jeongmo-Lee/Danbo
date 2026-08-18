# 단보 회계장부

회사/개인용 간단 회계 관리 사이트입니다.

## 주요 기능

- **상품 관리**: 상품 이름과 단가(및 단위, 메모)를 등록/수정/삭제
- **거래처 관리**: 상호/사업자번호/대표자/주소/업태/종목/연락처 등록/수정/삭제
- **일일 회계장부**: 날짜별로 매출/매입/기타수입/기타지출을 기입하고 당일 합계·손익 확인
- **상품·거래처 연동 입력**: 장부 기입 시 상품/거래처 DB에서 선택하면 정보가 자동으로 채워짐
- **영수증**: 거래처·상품 DB와 연동해 기록용 영수증을 작성하고, 한국 표준 간이영수증 양식으로 보기/인쇄
- **대시보드**: 오늘/이번 달 매출·매입·손익 요약과 최근 거래 내역

## 기술 스택

- Next.js (App Router) + TypeScript
- Tailwind CSS
- Prisma ORM + PostgreSQL

## 로컬에서 실행하기

PostgreSQL 데이터베이스가 필요합니다 (로컬 설치 또는 [Neon](https://neon.tech)/[Supabase](https://supabase.com) 등 무료 클라우드 DB).

```bash
npm install
cp .env.example .env   # DATABASE_URL을 실제 Postgres 접속 정보로 수정
npm run db:push        # 스키마를 DB에 반영 (최초 1회 / 스키마 변경 시)
npm run db:seed        # 샘플 상품 데이터 시드 (선택)
npm run dev
```

http://localhost:3000 에서 확인할 수 있습니다.

## 인터넷에 배포하기 (Vercel)

1. **무료 Postgres 준비**: [Neon](https://neon.tech)에서 무료 프로젝트를 만들고 연결 문자열(`postgresql://...`)을 복사합니다.
2. **Vercel 연결**: [vercel.com](https://vercel.com)에서 이 GitHub 저장소(`jeongmo-lee/danbo`)를 Import 합니다. Next.js 프로젝트로 자동 인식됩니다.
3. **환경변수 설정**: Vercel 프로젝트 설정의 Environment Variables에 `DATABASE_URL`을 1번에서 복사한 값으로 추가합니다.
4. **배포**: Deploy를 누르면 빌드 과정에서 `prisma db push`가 자동 실행되어 DB 테이블이 생성되고, 완료 후 `https://<프로젝트명>.vercel.app` 주소로 접속할 수 있습니다.

배포 후 상품/거래처/사업자정보를 새로 입력해야 합니다 (로컬 DB와 별개의 DB입니다).

## 스크립트

- `npm run dev`: 개발 서버 실행
- `npm run build` / `npm start`: 프로덕션 빌드(스키마 반영 포함)/실행
- `npm run db:push`: 스키마 변경 사항을 DB에 반영
- `npm run db:seed`: 샘플 상품 데이터 시드
