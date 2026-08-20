"use client";

import Link from "next/link";
import { useRouter } from "next/navigation";
import { signOut } from "next-auth/react";
import { useCallback, useEffect, useState } from "react";
import { LIMITS } from "@/lib/validation";
import type { ScheduleSummary } from "@/lib/types";

export default function Dashboard({ userEmail }: { userEmail: string }) {
  const router = useRouter();
  const [title, setTitle] = useState("");
  const [description, setDescription] = useState("");
  const [items, setItems] = useState<string[]>(["", "", ""]);
  const [submitting, setSubmitting] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [schedules, setSchedules] = useState<ScheduleSummary[] | null>(null);

  const loadSchedules = useCallback(async () => {
    const res = await fetch("/api/schedules", { cache: "no-store" });
    if (!res.ok) return;
    setSchedules(await res.json());
  }, []);

  useEffect(() => {
    // eslint-disable-next-line react-hooks/set-state-in-effect
    loadSchedules();
  }, [loadSchedules]);

  function updateItem(index: number, value: string) {
    setItems((prev) => prev.map((v, i) => (i === index ? value : v)));
  }

  function addItemField() {
    setItems((prev) => [...prev, ""]);
  }

  function removeItemField(index: number) {
    setItems((prev) => prev.filter((_, i) => i !== index));
  }

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    setError(null);

    if (!title.trim()) {
      setError("제목을 입력해주세요.");
      return;
    }

    setSubmitting(true);
    try {
      const res = await fetch("/api/schedules", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          title,
          description,
          items: items.filter((item) => item.trim().length > 0),
        }),
      });
      const data = await res.json();
      if (!res.ok) {
        setError(data.error ?? "일정을 만들지 못했습니다.");
        return;
      }

      router.push(`/manage/${data.id}`);
    } catch {
      setError("네트워크 오류가 발생했습니다.");
    } finally {
      setSubmitting(false);
    }
  }

  return (
    <main className="flex-1 flex flex-col items-center px-4 py-10 sm:py-14">
      <div className="w-full max-w-xl">
        <div className="flex items-center justify-between mb-1.5">
          <h1 className="flex items-center gap-2 text-2xl font-bold tracking-tight text-slate-900">
            <span aria-hidden>📋</span>
            Listify
          </h1>
          <div className="flex items-center gap-3 text-sm text-slate-500">
            <span className="hidden sm:inline">{userEmail}</span>
            <button
              onClick={() => signOut()}
              className="rounded-md px-2 py-1 hover:bg-slate-200/60 hover:text-slate-900 transition-colors"
            >
              로그아웃
            </button>
          </div>
        </div>
        <p className="text-slate-500 leading-relaxed mb-8">
          일정과 체크리스트를 만들고 링크로 공유하세요. 참여자는 닉네임을
          입력하고 체크하면, 누가 체크했는지 함께 표시됩니다.
        </p>

        <form
          onSubmit={handleSubmit}
          className="rounded-xl border border-slate-200 bg-white p-5 shadow-sm space-y-4"
        >
          <div>
            <label className="block text-sm font-medium text-slate-700 mb-1.5">
              제목
            </label>
            <input
              value={title}
              onChange={(e) => setTitle(e.target.value)}
              maxLength={LIMITS.title}
              placeholder="예: 워크샵 준비물 체크리스트"
              className="w-full rounded-lg border border-slate-300 px-3 py-2.5 focus:outline-none focus:ring-2 focus:ring-indigo-400 transition-shadow"
            />
          </div>

          <div>
            <label className="block text-sm font-medium text-slate-700 mb-1.5">
              설명 (선택)
            </label>
            <textarea
              value={description}
              onChange={(e) => setDescription(e.target.value)}
              maxLength={LIMITS.description}
              rows={3}
              placeholder="참여자에게 보여줄 안내 문구를 입력하세요."
              className="w-full rounded-lg border border-slate-300 px-3 py-2.5 focus:outline-none focus:ring-2 focus:ring-indigo-400 transition-shadow"
            />
          </div>

          <div>
            <label className="block text-sm font-medium text-slate-700 mb-1.5">
              체크리스트 항목
            </label>
            <div className="space-y-2">
              {items.map((item, index) => (
                <div key={index} className="flex gap-2">
                  <input
                    value={item}
                    onChange={(e) => updateItem(index, e.target.value)}
                    maxLength={LIMITS.itemText}
                    placeholder={`항목 ${index + 1}`}
                    className="flex-1 rounded-lg border border-slate-300 px-3 py-2.5 focus:outline-none focus:ring-2 focus:ring-indigo-400 transition-shadow"
                  />
                  <button
                    type="button"
                    onClick={() => removeItemField(index)}
                    className="w-10 rounded-lg border border-slate-300 text-slate-400 hover:bg-slate-100 hover:text-slate-600 transition-colors"
                    aria-label="항목 삭제"
                  >
                    ✕
                  </button>
                </div>
              ))}
            </div>
            <button
              type="button"
              onClick={addItemField}
              className="mt-2.5 text-sm font-medium text-slate-500 hover:text-slate-900 transition-colors"
            >
              + 항목 추가
            </button>
          </div>

          {error && <p className="text-sm text-red-600">{error}</p>}

          <button
            type="submit"
            disabled={submitting}
            className="w-full rounded-lg bg-indigo-600 text-white py-3 font-medium hover:bg-indigo-700 disabled:opacity-50 transition-colors"
          >
            {submitting ? "만드는 중..." : "일정 만들기"}
          </button>
        </form>

        {schedules && schedules.length > 0 && (
          <div className="mt-10">
            <h2 className="text-sm font-semibold text-slate-600 mb-3">
              내 일정 <span className="text-slate-400">({schedules.length})</span>
            </h2>
            <ul className="space-y-2">
              {schedules.map((schedule) => (
                <li key={schedule.id}>
                  <Link
                    href={`/manage/${schedule.id}`}
                    className="flex items-center justify-between gap-3 rounded-xl border border-slate-200 bg-white px-4 py-3 shadow-sm hover:border-slate-300 hover:shadow transition"
                  >
                    <div className="truncate">
                      <span className="font-medium text-slate-900">
                        {schedule.title}
                      </span>
                      <span className="text-sm text-slate-400 ml-2">
                        {schedule.checkedCount}/{schedule.itemCount}개 체크됨
                      </span>
                    </div>
                    <span className="text-sm text-slate-400 shrink-0">→</span>
                  </Link>
                </li>
              ))}
            </ul>
          </div>
        )}
      </div>
    </main>
  );
}
