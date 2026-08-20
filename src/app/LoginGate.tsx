"use client";

import { signIn, signOut } from "next-auth/react";

export default function LoginGate({
  deniedEmail,
}: {
  deniedEmail?: string | null;
}) {
  return (
    <main className="flex-1 flex flex-col items-center justify-center px-4 py-12">
      <div className="w-full max-w-sm rounded-xl border border-slate-200 bg-white p-8 shadow-sm text-center">
        <h1 className="text-2xl font-bold tracking-tight text-slate-900 mb-1.5">
          Listify
        </h1>
        <p className="text-slate-500 leading-relaxed mb-8">
          일정과 체크리스트를 만들고 링크로 공유하세요.
        </p>

        {deniedEmail ? (
          <div className="space-y-4">
            <p className="text-sm text-red-600 leading-relaxed">
              <strong>{deniedEmail}</strong> 계정은 관리자 권한이 없습니다.
            </p>
            <button
              onClick={() => signOut()}
              className="w-full rounded-lg border border-slate-300 py-3 font-medium text-slate-700 hover:bg-slate-50 transition-colors"
            >
              다른 계정으로 로그인
            </button>
          </div>
        ) : (
          <button
            onClick={() => signIn("google")}
            className="w-full rounded-lg bg-indigo-600 text-white py-3 font-medium hover:bg-indigo-700 transition-colors"
          >
            Google로 로그인
          </button>
        )}
      </div>
    </main>
  );
}
