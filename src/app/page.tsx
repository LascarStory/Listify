"use client";

import Link from "next/link";
import { useRouter } from "next/navigation";
import { useEffect, useState } from "react";
import { LIMITS } from "@/lib/validation";
import type { RecentSchedule } from "@/lib/types";

const RECENT_KEY = "listify:recent-schedules";

export default function HomePage() {
  const router = useRouter();
  const [title, setTitle] = useState("");
  const [description, setDescription] = useState("");
  const [items, setItems] = useState<string[]>(["", "", ""]);
  const [submitting, setSubmitting] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [recent, setRecent] = useState<RecentSchedule[]>([]);

  useEffect(() => {
    try {
      const raw = localStorage.getItem(RECENT_KEY);
      // Reading localStorage must happen post-mount to avoid SSR/hydration mismatch.
      // eslint-disable-next-line react-hooks/set-state-in-effect
      if (raw) setRecent(JSON.parse(raw));
    } catch {
      // ignore corrupted local storage
    }
  }, []);

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

      const entry: RecentSchedule = {
        title: title.trim(),
        adminToken: data.adminToken,
        shareToken: data.shareToken,
        createdAt: new Date().toISOString(),
      };
      try {
        const raw = localStorage.getItem(RECENT_KEY);
        const list: RecentSchedule[] = raw ? JSON.parse(raw) : [];
        localStorage.setItem(
          RECENT_KEY,
          JSON.stringify([entry, ...list].slice(0, 20))
        );
      } catch {
        // ignore local storage failures
      }

      router.push(`/admin/${data.adminToken}`);
    } catch {
      setError("네트워크 오류가 발생했습니다.");
    } finally {
      setSubmitting(false);
    }
  }

  return (
    <main className="flex-1 flex flex-col items-center px-4 py-12">
      <div className="w-full max-w-xl">
        <h1 className="text-2xl font-bold mb-1">Listify</h1>
        <p className="text-slate-500 mb-8">
          일정과 체크리스트를 만들고 링크로 공유하세요. 참여자는 닉네임을
          입력하고 체크하면, 누가 체크했는지 함께 표시됩니다.
        </p>

        <form onSubmit={handleSubmit} className="space-y-4">
          <div>
            <label className="block text-sm font-medium mb-1">제목</label>
            <input
              value={title}
              onChange={(e) => setTitle(e.target.value)}
              maxLength={LIMITS.title}
              placeholder="예: 워크샵 준비물 체크리스트"
              className="w-full rounded-md border border-slate-300 px-3 py-2 focus:outline-none focus:ring-2 focus:ring-slate-400"
            />
          </div>

          <div>
            <label className="block text-sm font-medium mb-1">설명 (선택)</label>
            <textarea
              value={description}
              onChange={(e) => setDescription(e.target.value)}
              maxLength={LIMITS.description}
              rows={3}
              placeholder="참여자에게 보여줄 안내 문구를 입력하세요."
              className="w-full rounded-md border border-slate-300 px-3 py-2 focus:outline-none focus:ring-2 focus:ring-slate-400"
            />
          </div>

          <div>
            <label className="block text-sm font-medium mb-1">
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
                    className="flex-1 rounded-md border border-slate-300 px-3 py-2 focus:outline-none focus:ring-2 focus:ring-slate-400"
                  />
                  <button
                    type="button"
                    onClick={() => removeItemField(index)}
                    className="px-3 rounded-md border border-slate-300 text-slate-500 hover:bg-slate-100"
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
              className="mt-2 text-sm text-slate-600 hover:text-slate-900"
            >
              + 항목 추가
            </button>
          </div>

          {error && <p className="text-sm text-red-600">{error}</p>}

          <button
            type="submit"
            disabled={submitting}
            className="w-full rounded-md bg-slate-900 text-white py-2.5 font-medium hover:bg-slate-800 disabled:opacity-50"
          >
            {submitting ? "만드는 중..." : "일정 만들기"}
          </button>
        </form>

        {recent.length > 0 && (
          <div className="mt-12">
            <h2 className="text-sm font-semibold text-slate-500 mb-3">
              내가 만든 일정
            </h2>
            <ul className="space-y-2">
              {recent.map((entry) => (
                <li
                  key={entry.adminToken}
                  className="flex items-center justify-between rounded-md border border-slate-200 bg-white px-3 py-2"
                >
                  <span className="truncate">{entry.title}</span>
                  <Link
                    href={`/admin/${entry.adminToken}`}
                    className="text-sm text-slate-600 hover:text-slate-900 shrink-0 ml-3"
                  >
                    관리하기 →
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
