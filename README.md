# Listify

일정과 체크리스트를 링크로 공유하는 서비스입니다.

- 관리자가 제목/설명/체크리스트 항목을 만들고, **관리자 링크**와 **공유 링크**를 받습니다.
- 관리자 링크로는 항목을 추가/수정/삭제/순서 변경할 수 있습니다.
- 공유 링크로 들어온 참여자는 닉네임을 입력하고 항목을 체크하며, 각 항목마다 누가 체크했는지 표시됩니다.
- 계정/로그인 시스템은 없습니다. 관리자 권한은 URL에 포함된 비밀 토큰으로 구분되므로, 관리자 링크는 절대 공유하지 마세요.

## Getting Started

1. PostgreSQL 데이터베이스를 준비하고 `.env`에 `DATABASE_URL`(런타임/앱)과 `DIRECT_URL`(마이그레이션)을 설정합니다 (`.env.example` 참고). 로컬 Postgres라면 둘을 같은 값으로 두면 됩니다.
2. 개발 서버를 실행합니다 (마이그레이션은 `build` 스크립트에 포함되어 있어 자동 적용되지만, 개발 중엔 직접 실행해도 됩니다).

   ```bash
   npm install
   npx prisma migrate deploy
   npm run dev
   ```

3. [http://localhost:3000](http://localhost:3000) 에서 확인합니다.

## Deploy (Vercel + Supabase)

Vercel 등 서버리스 환경에 배포할 경우 SQLite가 아닌 PostgreSQL이 필요합니다. [Supabase](https://supabase.com) 프로젝트 대시보드 상단의 **Connect** 버튼 → **ORMs** 탭 → **Prisma**에서 두 개의 연결 문자열을 얻습니다.

- `DATABASE_URL`: Transaction pooler (포트 6543, `pgbouncer=true`) — 앱이 런타임에 사용합니다. 서버리스 환경에서 direct 연결(5432)은 커넥션이 고갈되므로 반드시 pooler를 씁니다.
- `DIRECT_URL`: Session/Direct 연결 (포트 5432) — `prisma migrate deploy`가 사용합니다. pgbouncer 트랜잭션 모드는 Migrate가 필요로 하는 advisory lock을 지원하지 않기 때문입니다.

두 값을 Vercel 프로젝트의 Environment Variables에 등록하세요. 비밀번호에 `@`, `%`, `/` 등 특수문자가 있으면 URL에 넣기 전에 퍼센트 인코딩이 필요합니다.

`npm run build`가 `prisma generate && prisma migrate deploy && next build` 순으로 실행되므로, Vercel에 배포할 때마다 마이그레이션이 자동으로 적용됩니다. 별도로 마이그레이션 명령을 따로 실행할 필요는 없습니다.
