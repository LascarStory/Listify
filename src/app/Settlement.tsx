"use client";

import { computeSettlement } from "@/lib/settlement";
import type { Expense } from "@/lib/types";

function won(amount: number) {
  return `${Math.abs(amount).toLocaleString("ko-KR")}원`;
}

export default function Settlement({
  expenses,
  highlightNickname,
  showEmptyHint,
}: {
  expenses: Expense[];
  highlightNickname?: string | null;
  showEmptyHint?: boolean;
}) {
  const { balances, transfers } = computeSettlement(expenses);
  const people = Object.entries(balances).sort(([, a], [, b]) => b - a);

  if (people.length === 0) {
    if (!showEmptyHint) return null;
    return (
      <div className="rounded-xl border border-slate-200 bg-white p-4 shadow-sm mb-6">
        <h2 className="text-sm font-semibold text-slate-600 mb-1">정산</h2>
        <p className="text-xs text-slate-400">
          비용을 추가하면, 참여자들이 체크해서 나눠 낼 사람을 정하고, 그
          결과가 여기 표시됩니다.
        </p>
      </div>
    );
  }

  return (
    <div className="rounded-xl border border-slate-200 bg-white p-4 shadow-sm mb-6">
      <h2 className="text-sm font-semibold text-slate-600 mb-3">정산</h2>

      <ul className="space-y-1.5 mb-4">
        {people.map(([nickname, amount]) => {
          const isMe = nickname === highlightNickname;
          const settled = Math.abs(amount) < 1;
          return (
            <li
              key={nickname}
              className={
                "flex items-center justify-between text-sm rounded-lg px-2.5 py-1.5" +
                (isMe ? " bg-indigo-50" : "")
              }
            >
              <span
                className={isMe ? "font-semibold text-indigo-700" : "text-slate-700"}
              >
                {nickname}
                {isMe && " (나)"}
              </span>
              {settled ? (
                <span className="text-slate-400">정산됨</span>
              ) : amount > 0 ? (
                <span className="font-medium text-emerald-600">
                  +{won(amount)} 받아야 함
                </span>
              ) : (
                <span className="font-medium text-red-500">
                  -{won(amount)} 내야 함
                </span>
              )}
            </li>
          );
        })}
      </ul>

      {transfers.length > 0 && (
        <div className="border-t border-slate-100 pt-3 space-y-1.5">
          {transfers.map((t, i) => (
            <div
              key={i}
              className="flex items-center gap-1.5 text-sm text-slate-600"
            >
              <span
                className={
                  t.from === highlightNickname
                    ? "font-semibold text-indigo-700"
                    : "font-medium text-slate-900"
                }
              >
                {t.from}
              </span>
              <span className="text-slate-400">→</span>
              <span
                className={
                  t.to === highlightNickname
                    ? "font-semibold text-indigo-700"
                    : "font-medium text-slate-900"
                }
              >
                {t.to}
              </span>
              <span className="ml-auto font-medium text-slate-900">
                {won(t.amount)}
              </span>
            </div>
          ))}
        </div>
      )}
    </div>
  );
}
