"use client";

import { useCallback, useEffect, useState } from "react";
import { LIMITS } from "@/lib/validation";
import type { ScheduleData } from "@/lib/types";
import Settlement from "@/app/Settlement";

const POLL_INTERVAL_MS = 4000;

function nicknameKey(shareToken: string) {
  return `listify:nickname:${shareToken}`;
}

export default function ShareView({ shareToken }: { shareToken: string }) {
  const [nickname, setNickname] = useState<string | null>(null);
  const [nicknameInput, setNicknameInput] = useState("");
  const [data, setData] = useState<ScheduleData | null>(null);
  const [notFound, setNotFound] = useState(false);

  useEffect(() => {
    const stored = localStorage.getItem(nicknameKey(shareToken));
    // Reading localStorage must happen post-mount to avoid SSR/hydration mismatch.
    // eslint-disable-next-line react-hooks/set-state-in-effect
    if (stored) setNickname(stored);
  }, [shareToken]);

  const load = useCallback(async () => {
    const res = await fetch(`/api/share/${shareToken}`, { cache: "no-store" });
    if (res.status === 404) {
      setNotFound(true);
      return;
    }
    setData(await res.json());
  }, [shareToken]);

  useEffect(() => {
    // Initial fetch + polling to sync with server-side check state.
    // eslint-disable-next-line react-hooks/set-state-in-effect
    load();
    const timer = setInterval(load, POLL_INTERVAL_MS);
    return () => clearInterval(timer);
  }, [load]);

  function submitNickname(e: React.FormEvent) {
    e.preventDefault();
    const trimmed = nicknameInput.trim();
    if (!trimmed) return;
    localStorage.setItem(nicknameKey(shareToken), trimmed);
    setNickname(trimmed);
  }

  function changeNickname() {
    setNicknameInput(nickname ?? "");
    setNickname(null);
  }

  function toggleItem(itemId: string, checked: boolean) {
    if (!nickname || !data) return;

    // Update the UI immediately; the request happens in the background and
    // isn't awaited, so a slow network never makes the checkbox feel stuck.
    // The next poll (every POLL_INTERVAL_MS) reconciles with the server,
    // which also covers the rare case where the request fails.
    setData({
      ...data,
      items: data.items.map((item) =>
        item.id === itemId
          ? {
              ...item,
              checkedBy: checked
                ? [...item.checkedBy, { nickname, checkedAt: new Date().toISOString() }]
                : item.checkedBy.filter((c) => c.nickname !== nickname),
            }
          : item
      ),
    });

    fetch(`/api/share/${shareToken}/items/${itemId}/check`, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ nickname, checked }),
    }).catch(() => {
      // Ignored — the next poll resyncs from the server either way.
    });
  }

  function toggleExpense(expenseId: string, joined: boolean) {
    if (!nickname || !data) return;

    setData({
      ...data,
      expenses: data.expenses.map((expense) =>
        expense.id === expenseId
          ? {
              ...expense,
              participants: joined
                ? [...expense.participants, { nickname, joinedAt: new Date().toISOString() }]
                : expense.participants.filter((p) => p.nickname !== nickname),
            }
          : expense
      ),
    });

    fetch(`/api/share/${shareToken}/expenses/${expenseId}/join`, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ nickname, joined }),
    }).catch(() => {
      // Ignored — the next poll resyncs from the server either way.
    });
  }

  if (notFound) {
    return (
      <main className="flex-1 flex items-center justify-center px-4">
        <p className="text-slate-500">일정을 찾을 수 없습니다.</p>
      </main>
    );
  }

  if (!nickname) {
    return (
      <main className="flex-1 flex items-center justify-center px-4">
        <form
          onSubmit={submitNickname}
          className="w-full max-w-sm rounded-xl border border-slate-200 bg-white p-6 shadow-sm"
        >
          <h1 className="text-lg font-bold text-slate-900 mb-1">
            {data?.title ?? "닉네임을 입력하세요"}
          </h1>
          <p className="text-sm text-slate-500 leading-relaxed mb-4">
            체크할 때 표시할 닉네임을 입력해주세요.
          </p>
          <input
            autoFocus
            value={nicknameInput}
            onChange={(e) => setNicknameInput(e.target.value)}
            maxLength={LIMITS.nickname}
            placeholder="예: 홍길동"
            className="w-full rounded-lg border border-slate-300 px-3 py-2.5 mb-3 focus:outline-none focus:ring-2 focus:ring-indigo-400 transition-shadow"
          />
          <button
            type="submit"
            className="w-full rounded-lg bg-indigo-600 text-white py-2.5 font-medium hover:bg-indigo-700 transition-colors"
          >
            입장하기
          </button>
        </form>
      </main>
    );
  }

  if (!data) {
    return (
      <main className="flex-1 flex items-center justify-center px-4">
        <p className="text-slate-400">불러오는 중...</p>
      </main>
    );
  }

  return (
    <main className="flex-1 flex flex-col items-center px-4 py-10 sm:py-14">
      <div className="w-full max-w-xl">
        <div className="flex items-center justify-between mb-1">
          <span className="text-sm text-slate-500">
            <strong className="text-slate-900">{nickname}</strong>님으로
            입장했습니다
          </span>
          <button
            onClick={changeNickname}
            className="text-sm font-medium text-slate-400 hover:text-slate-900 transition-colors"
          >
            닉네임 변경
          </button>
        </div>

        <h1 className="text-2xl font-bold tracking-tight text-slate-900 mt-3 mb-1">
          {data.title}
        </h1>
        {data.description && (
          <p className="text-slate-500 leading-relaxed mb-6 whitespace-pre-wrap">
            {data.description}
          </p>
        )}

        {data.items.length === 0 ? (
          <p className="text-slate-400">등록된 항목이 없습니다.</p>
        ) : (
          <ul className="space-y-2">
            {data.items.map((item, index) => {
              const checked = item.checkedBy.some(
                (c) => c.nickname === nickname
              );
              const showGroupHeader =
                item.groupLabel &&
                (index === 0 || data.items[index - 1].groupLabel !== item.groupLabel);
              return (
                <li key={item.id}>
                  {showGroupHeader && (
                    <h3 className="inline-flex items-center gap-1.5 text-sm font-bold text-indigo-700 bg-indigo-50 px-3 py-1 rounded-full mt-5 mb-2 first:mt-0">
                      <span aria-hidden>📅</span>
                      {item.groupLabel}
                    </h3>
                  )}
                  <div className="rounded-xl border border-slate-200 bg-white p-3.5 shadow-sm">
                    <label className="flex items-start gap-3 cursor-pointer py-0.5">
                      <input
                        type="checkbox"
                        checked={checked}
                        onChange={(e) => toggleItem(item.id, e.target.checked)}
                        className="mt-0.5 h-5 w-5 shrink-0 accent-indigo-600"
                      />
                      <span
                        className={
                          checked
                            ? "line-through text-slate-400 flex-1 text-[15px]"
                            : "flex-1 text-[15px] text-slate-900"
                        }
                      >
                        {item.text}
                      </span>
                    </label>
                    <div className="mt-2.5 ml-8 flex flex-wrap gap-1">
                      {item.checkedBy.map((c) => (
                        <span
                          key={c.nickname}
                          className={
                            c.nickname === nickname
                              ? "text-xs font-medium rounded-full bg-indigo-600 text-white px-2.5 py-1"
                              : "text-xs font-medium rounded-full bg-emerald-50 text-emerald-700 px-2.5 py-1"
                          }
                        >
                          ✓ {c.nickname}
                        </span>
                      ))}
                    </div>
                  </div>
                </li>
              );
            })}
          </ul>
        )}

        {data.expenses.length > 0 && (
          <>
            <h2 className="text-sm font-semibold text-slate-600 mt-8 mb-3">
              비용 — 나눠 낼 사람 체크
            </h2>
            <ul className="space-y-2 mb-6">
              {data.expenses.map((expense) => {
                const joined = expense.participants.some(
                  (p) => p.nickname === nickname
                );
                return (
                  <li
                    key={expense.id}
                    className="rounded-xl border border-slate-200 bg-white p-3.5 shadow-sm"
                  >
                    <label className="flex items-start gap-3 cursor-pointer py-0.5">
                      <input
                        type="checkbox"
                        checked={joined}
                        onChange={(e) => toggleExpense(expense.id, e.target.checked)}
                        className="mt-0.5 h-5 w-5 shrink-0 accent-indigo-600"
                      />
                      <span className="flex-1 text-[15px] text-slate-900">
                        {expense.label}
                        <span className="block text-xs text-slate-500 mt-0.5">
                          💰 {expense.amount.toLocaleString("ko-KR")}원 ·{" "}
                          {expense.payerNickname} 냄
                        </span>
                      </span>
                    </label>
                    <div className="mt-2.5 ml-8 flex flex-wrap gap-1">
                      {expense.participants.length === 0 ? (
                        <span className="text-xs text-slate-400">
                          아직 나눠 낼 사람이 없습니다.
                        </span>
                      ) : (
                        expense.participants.map((p) => (
                          <span
                            key={p.nickname}
                            className={
                              p.nickname === nickname
                                ? "text-xs font-medium rounded-full bg-indigo-600 text-white px-2.5 py-1"
                                : "text-xs font-medium rounded-full bg-emerald-50 text-emerald-700 px-2.5 py-1"
                            }
                          >
                            ✓ {p.nickname}
                          </span>
                        ))
                      )}
                    </div>
                  </li>
                );
              })}
            </ul>
          </>
        )}

        <div className="mt-6">
          <Settlement expenses={data.expenses} highlightNickname={nickname} />
        </div>
      </div>
    </main>
  );
}
