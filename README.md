# Listify

일정과 체크리스트를 링크로 공유하는 서비스입니다.

- 관리자는 **Google 로그인**으로 접속합니다. `ADMIN_EMAIL` 환경변수에 지정된 계정 단 하나만 관리자로 인정되고, 다른 Google 계정으로 로그인하면 접근이 거부됩니다.
- 로그인하면 지금까지 만든 모든 일정 목록이 보이고, 제목/설명/체크리스트 항목을 만들 수 있습니다. 각 일정마다 **공유 링크**가 생성됩니다.
- 관리 화면에서 항목을 추가/수정/삭제/순서 변경할 수 있습니다.
- 항목을 하나씩 입력하기 번거로우면 마크다운을 붙여넣어 한 번에 여러 개를 추가할 수 있습니다. `##`로 시작하는 줄은 날짜/그룹 제목, `-`로 시작하는 줄은 항목으로 인식됩니다. 이 가져오기는 항상 새 항목만 추가하며 기존 항목은 건드리지 않습니다 (그래서 이미 쌓인 체크 기록도 안전합니다).
- 공유 링크로 들어온 참여자는 로그인 없이 닉네임만 입력하고 항목을 체크하며, 각 항목마다 누가 체크했는지 표시됩니다. 날짜/그룹이 있는 항목은 그룹별로 묶여서 보입니다.

## Getting Started

1. PostgreSQL 데이터베이스를 준비하고 `.env`에 `DATABASE_URL`(런타임/앱)과 `DIRECT_URL`(마이그레이션)을 설정합니다 (`.env.example` 참고). 로컬 Postgres라면 둘을 같은 값으로 두면 됩니다.
2. Google OAuth 클라이언트를 만들고 `ADMIN_EMAIL`, `AUTH_SECRET`, `AUTH_GOOGLE_ID`, `AUTH_GOOGLE_SECRET`을 설정합니다 (`.env.example` 참고, 아래 "Google 로그인 설정" 참고).
3. 개발 서버를 실행합니다 (마이그레이션은 `build` 스크립트에 포함되어 있어 자동 적용되지만, 개발 중엔 직접 실행해도 됩니다).

   ```bash
   npm install
   npx prisma migrate deploy
   npm run dev
   ```

4. [http://localhost:3000](http://localhost:3000) 에서 확인합니다.

## Google 로그인 설정

1. [Google Cloud Console → Credentials](https://console.cloud.google.com/apis/credentials)에서 **OAuth client ID**를 만듭니다 (애플리케이션 유형: Web application).
2. **Authorized redirect URIs**에 아래 두 개를 등록합니다.
   - `http://localhost:3000/api/auth/callback/google` (로컬 개발용)
   - `https://<배포 도메인>/api/auth/callback/google` (프로덕션용)
3. 생성된 Client ID/Secret을 `AUTH_GOOGLE_ID`/`AUTH_GOOGLE_SECRET`에 넣습니다.
4. `ADMIN_EMAIL`에 관리자로 쓸 본인의 Google 계정 이메일을 정확히 넣습니다. 이 이메일로 로그인해야만 일정을 만들고 관리할 수 있습니다.
5. `AUTH_SECRET`은 `openssl rand -base64 33`으로 생성한 임의의 문자열을 넣습니다.

## Deploy (Vercel + Supabase)

Vercel 등 서버리스 환경에 배포할 경우 SQLite가 아닌 PostgreSQL이 필요합니다. [Supabase](https://supabase.com) 프로젝트 대시보드 상단의 **Connect** 버튼 → **ORMs** 탭 → **Prisma**에서 두 개의 연결 문자열을 얻습니다.

- `DATABASE_URL`: Transaction pooler (포트 6543, `pgbouncer=true`) — 앱이 런타임에 사용합니다. 서버리스 환경에서 direct 연결(5432)은 커넥션이 고갈되므로 반드시 pooler를 씁니다.
- `DIRECT_URL`: Session/Direct 연결 (포트 5432) — `prisma migrate deploy`가 사용합니다. pgbouncer 트랜잭션 모드는 Migrate가 필요로 하는 advisory lock을 지원하지 않기 때문입니다.

두 값을 Vercel 프로젝트의 Environment Variables에 등록하세요. 비밀번호에 `@`, `%`, `/` 등 특수문자가 있으면 URL에 넣기 전에 퍼센트 인코딩이 필요합니다.

`npm run build`가 `prisma generate && prisma migrate deploy && next build` 순으로 실행되므로, Vercel에 배포할 때마다 마이그레이션이 자동으로 적용됩니다. 별도로 마이그레이션 명령을 따로 실행할 필요는 없습니다.

`ADMIN_EMAIL`, `AUTH_SECRET`, `AUTH_GOOGLE_ID`, `AUTH_GOOGLE_SECRET`도 함께 Vercel Environment Variables에 등록해야 로그인이 동작합니다. Google Cloud Console의 OAuth client에는 배포된 Vercel 도메인의 `/api/auth/callback/google` 콜백 URL도 Authorized redirect URIs에 추가해야 합니다.
