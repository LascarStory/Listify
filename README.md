# Listify

일정과 체크리스트를 링크로 공유하는 서비스입니다.

- 관리자가 제목/설명/체크리스트 항목을 만들고, **관리자 링크**와 **공유 링크**를 받습니다.
- 관리자 링크로는 항목을 추가/수정/삭제/순서 변경할 수 있습니다.
- 공유 링크로 들어온 참여자는 닉네임을 입력하고 항목을 체크하며, 각 항목마다 누가 체크했는지 표시됩니다.
- 계정/로그인 시스템은 없습니다. 관리자 권한은 URL에 포함된 비밀 토큰으로 구분되므로, 관리자 링크는 절대 공유하지 마세요.

## Getting Started

1. PostgreSQL 데이터베이스를 준비하고 `.env`에 `DATABASE_URL`을 설정합니다 (`.env.example` 참고).
2. 마이그레이션을 적용합니다.

   ```bash
   npx prisma migrate deploy
   ```

3. 개발 서버를 실행합니다.

   ```bash
   npm install
   npm run dev
   ```

4. [http://localhost:3000](http://localhost:3000) 에서 확인합니다.

## Deploy

Vercel 등 서버리스 환경에 배포할 경우 SQLite가 아닌 PostgreSQL이 필요합니다. [Supabase](https://supabase.com)를 사용한다면 Project Settings → Database → Connection string에서 **Transaction pooler**(포트 6543) 연결 문자열을 `DATABASE_URL` 환경변수로 등록하세요. 일반 direct 연결(5432)은 서버리스 환경에서 커넥션이 고갈될 수 있습니다.

빌드 시 `prisma generate`가 자동으로 실행됩니다(`postinstall`, `build` 스크립트). 스키마 변경 시 배포 전에 `npx prisma migrate deploy`로 프로덕션 DB에 마이그레이션을 적용해야 합니다.
