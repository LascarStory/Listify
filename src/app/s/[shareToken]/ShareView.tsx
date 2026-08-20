"use client";

import { useCallback, useEffect, useState } from "react";
import { LIMITS } from "@/lib/validation";
import type { ScheduleData } from "@/lib/types";

const POLL_INTERVAL_MS = 4000;

function nicknameKey(shareToken: string) {
  return `listify:nickname:${shareToken}`;
}

export default function ShareView({ shareToken }: { shareToken: string }) {
  const [nickname, setNickname] = useState<string | null>(null);
  const [nicknameInput, setNicknameInput] = useState("");
  const [data, setData] = useState<ScheduleData | null>(null);
  const [notFound, setNotFound] = useState(false);
  const [pendingIds, setPendingIds] = useState<Set<string>>(new Set());

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

  async function toggleItem(itemId: string, checked: boolean) {
    if (!nickname || !data) return;
    setPendingIds((prev) => new Set(prev).add(itemId));

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

    try {
      await fetch(`/api/share/${shareToken}/items/${itemId}/check`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ nickname, checked }),
      });
      await load();
    } finally {
      setPendingIds((prev) => {
        const next = new Set(prev);
        next.delete(itemId);
        return next;
      });
    }
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
          className="w-full max-w-sm rounded-md border border-slate-200 bg-white p-6"
        >
          <h1 className="text-lg font-semibold mb-1">
            {data?.title ?? "닉네임을 입력하세요"}
          </h1>
          <p className="text-sm text-slate-500 mb-4">
            체크할 때 표시할 닉네임을 입력해주세요.
          </p>
          <input
            autoFocus
            value={nicknameInput}
            onChange={(e) => setNicknameInput(e.target.value)}
            maxLength={LIMITS.nickname}
            placeholder="예: 홍길동"
            className="w-full rounded-md border border-slate-300 px-3 py-2 mb-3 focus:outline-none focus:ring-2 focus:ring-slate-400"
          />
          <button
            type="submit"
            className="w-full rounded-md bg-slate-900 text-white py-2 font-medium hover:bg-slate-800"
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
    <main className="flex-1 flex flex-col items-center px-4 py-10">
      <div className="w-full max-w-xl">
        <div className="flex items-center justify-between mb-1">
          <span className="text-sm text-slate-500">
            <strong className="text-slate-900">{nickname}</strong>님으로
            입장했습니다
          </span>
          <button
            onClick={changeNickname}
            className="text-sm text-slate-400 hover:text-slate-900"
          >
            닉네임 변경
          </button>
        </div>

        <h1 className="text-2xl font-bold mt-3 mb-1">{data.title}</h1>
        {data.description && (
          <p className="text-slate-500 mb-6 whitespace-pre-wrap">
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
              const pending = pendingIds.has(item.id);
              const showGroupHeader =
                item.groupLabel &&
                (index === 0 || data.items[index - 1].groupLabel !== item.groupLabel);
              return (
                <li key={item.id}>
                  {showGroupHeader && (
                    <h3 className="text-xs font-semibold text-slate-400 mt-4 mb-1.5 first:mt-0">
                      {item.groupLabel}
                    </h3>
                  )}
                  <div className="rounded-md border border-slate-200 bg-white p-3">
                  <label className="flex items-start gap-3 cursor-pointer">
                    <input
                      type="checkbox"
                      checked={checked}
                      disabled={pending}
                      onChange={(e) => toggleItem(item.id, e.target.checked)}
                      className="mt-1 h-4 w-4 accent-slate-900"
                    />
                    <span
                      className={
                        checked
                          ? "line-through text-slate-400 flex-1"
                          : "flex-1"
                      }
                    >
                      {item.text}
                    </span>
                  </label>
                  <div className="mt-2 ml-7 flex flex-wrap gap-1">
                    {item.checkedBy.map((c) => (
                      <span
                        key={c.nickname}
                        className={
                          c.nickname === nickname
                            ? "text-xs rounded-full bg-slate-900 text-white px-2 py-0.5"
                            : "text-xs rounded-full bg-emerald-50 text-emerald-700 px-2 py-0.5"
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
      </div>
    </main>
  );
}
