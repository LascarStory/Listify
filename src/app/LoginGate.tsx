"use client";

import { signIn, signOut } from "next-auth/react";

export default function LoginGate({
  deniedEmail,
}: {
  deniedEmail?: string | null;
}) {
  return (
    <main className="flex-1 flex flex-col items-center justify-center px-4 py-12">
      <div className="w-full max-w-sm text-center">
        <h1 className="text-2xl font-bold mb-1">Listify</h1>
        <p className="text-slate-500 mb-8">
          일정과 체크리스트를 만들고 링크로 공유하세요.
        </p>

        {deniedEmail ? (
          <div className="space-y-3">
            <p className="text-sm text-red-600">
              <strong>{deniedEmail}</strong> 계정은 관리자 권한이 없습니다.
            </p>
            <button
              onClick={() => signOut()}
              className="w-full rounded-md border border-slate-300 py-2.5 font-medium hover:bg-slate-100"
            >
              다른 계정으로 로그인
            </button>
          </div>
        ) : (
          <button
            onClick={() => signIn("google")}
            className="w-full rounded-md bg-slate-900 text-white py-2.5 font-medium hover:bg-slate-800"
          >
            Google로 로그인
          </button>
        )}
      </div>
    </main>
  );
}
