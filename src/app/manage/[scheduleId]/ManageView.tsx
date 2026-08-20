"use client";

import Link from "next/link";
import { useRouter } from "next/navigation";
import { useCallback, useEffect, useState } from "react";
import { LIMITS } from "@/lib/validation";
import type { AdminScheduleData } from "@/lib/types";

const POLL_INTERVAL_MS = 5000;

const AI_PROMPT_TEMPLATE = `아래 마크다운 체크리스트 형식으로 답해줘.

규칙:
- "## 제목" 줄은 날짜/그룹 제목이야.
- "- 내용" 줄은 체크리스트 항목이야.
- 다른 설명 없이 아래 형식의 마크다운만 출력해줘.

예시:
## 8/20 (목)
- 물 준비
- 명단 확인

## 8/21 (금)
- 장소 예약

---
요청: (여기에 원하는 체크리스트 내용을 적어주세요. 예: "2박 3일 제주도 여행 준비물 체크리스트 만들어줘")`;

export default function ManageView({ scheduleId }: { scheduleId: string }) {
  const router = useRouter();
  const [data, setData] = useState<AdminScheduleData | null>(null);
  const [deleting, setDeleting] = useState(false);
  const [notFound, setNotFound] = useState(false);
  const [title, setTitle] = useState("");
  const [description, setDescription] = useState("");
  const [savingMeta, setSavingMeta] = useState(false);
  const [newItemText, setNewItemText] = useState("");
  const [newItemGroup, setNewItemGroup] = useState("");
  const [addingItem, setAddingItem] = useState(false);
  const [editingId, setEditingId] = useState<string | null>(null);
  const [editingText, setEditingText] = useState("");
  const [editingGroup, setEditingGroup] = useState("");
  const [copied, setCopied] = useState(false);
  const [showImport, setShowImport] = useState(false);
  const [importText, setImportText] = useState("");
  const [importing, setImporting] = useState(false);
  const [importMessage, setImportMessage] = useState<string | null>(null);
  const [promptCopied, setPromptCopied] = useState(false);

  const load = useCallback(async () => {
    const res = await fetch(`/api/schedules/${scheduleId}`, {
      cache: "no-store",
    });
    if (res.status === 404 || res.status === 403) {
      setNotFound(true);
      return;
    }
    const json = await res.json();
    setData(json);
    // Avoid clobbering the title/description fields while the admin is typing.
    setTitle((prev) => (document.activeElement?.id === "title" ? prev : json.title));
    setDescription((prev) =>
      document.activeElement?.id === "description" ? prev : json.description
    );
  }, [scheduleId]);

  useEffect(() => {
    // Initial fetch + polling to sync with server-side check state.
    // eslint-disable-next-line react-hooks/set-state-in-effect
    load();
    const timer = setInterval(load, POLL_INTERVAL_MS);
    return () => clearInterval(timer);
  }, [load]);

  async function saveMeta() {
    setSavingMeta(true);
    try {
      await fetch(`/api/schedules/${scheduleId}`, {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ title, description }),
      });
      await load();
    } finally {
      setSavingMeta(false);
    }
  }

  async function addItem(e: React.FormEvent) {
    e.preventDefault();
    if (!newItemText.trim()) return;
    setAddingItem(true);
    try {
      await fetch(`/api/schedules/${scheduleId}/items`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ text: newItemText, groupLabel: newItemGroup }),
      });
      setNewItemText("");
      // Keep the group filled in so adding several items to the same
      // group in a row doesn't require retyping it each time.
      await load();
    } finally {
      setAddingItem(false);
    }
  }

  function startEdit(id: string, text: string, groupLabel: string | null) {
    setEditingId(id);
    setEditingText(text);
    setEditingGroup(groupLabel ?? "");
  }

  async function saveEdit() {
    if (!editingId || !editingText.trim()) {
      setEditingId(null);
      return;
    }
    await fetch(`/api/schedules/${scheduleId}/items/${editingId}`, {
      method: "PATCH",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ text: editingText, groupLabel: editingGroup }),
    });
    setEditingId(null);
    await load();
  }

  async function deleteItem(id: string) {
    if (!confirm("이 항목을 삭제할까요?")) return;
    await fetch(`/api/schedules/${scheduleId}/items/${id}`, {
      method: "DELETE",
    });
    await load();
  }

  async function moveItem(index: number, direction: -1 | 1) {
    if (!data) return;
    const items = [...data.items];
    const target = index + direction;
    if (target < 0 || target >= items.length) return;
    [items[index], items[target]] = [items[target], items[index]];
    setData({ ...data, items });
    await fetch(`/api/schedules/${scheduleId}/items`, {
      method: "PATCH",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ order: items.map((item) => item.id) }),
    });
    await load();
  }

  async function importMarkdown(e: React.FormEvent) {
    e.preventDefault();
    if (!importText.trim()) return;
    setImporting(true);
    setImportMessage(null);
    try {
      const res = await fetch(`/api/schedules/${scheduleId}/items/import`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ markdown: importText }),
      });
      const json = await res.json();
      if (!res.ok) {
        setImportMessage(json.error ?? "가져오지 못했습니다.");
        return;
      }
      setImportMessage(
        json.skipped > 0
          ? `${json.added}개 추가됨 (항목 개수 제한으로 ${json.skipped}개는 건너뜀)`
          : `${json.added}개 추가됨`
      );
      setImportText("");
      await load();
    } finally {
      setImporting(false);
    }
  }

  const shareUrl =
    typeof window !== "undefined" && data
      ? `${window.location.origin}/s/${data.shareToken}`
      : "";

  async function copyShareUrl() {
    if (!shareUrl) return;
    await navigator.clipboard.writeText(shareUrl);
    setCopied(true);
    setTimeout(() => setCopied(false), 1500);
  }

  async function copyAiPrompt() {
    await navigator.clipboard.writeText(AI_PROMPT_TEMPLATE);
    setPromptCopied(true);
    setTimeout(() => setPromptCopied(false), 1500);
  }

  async function deleteSchedule() {
    if (
      !confirm(
        "이 일정을 삭제할까요? 체크리스트 항목과 체크 기록이 모두 삭제되며 되돌릴 수 없습니다."
      )
    ) {
      return;
    }
    setDeleting(true);
    try {
      await fetch(`/api/schedules/${scheduleId}`, { method: "DELETE" });
      router.push("/");
    } finally {
      setDeleting(false);
    }
  }

  const groupOptions = Array.from(
    new Set(
      (data?.items ?? [])
        .map((item) => item.groupLabel)
        .filter((label): label is string => !!label)
    )
  );

  if (notFound) {
    return (
      <main className="flex-1 flex items-center justify-center px-4">
        <p className="text-slate-500">일정을 찾을 수 없습니다.</p>
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
        <Link
          href="/"
          className="text-sm font-medium text-slate-400 hover:text-slate-900 mb-4 inline-flex items-center gap-1 transition-colors"
        >
          ← 내 일정 목록
        </Link>

        <div className="rounded-xl border border-slate-200 bg-white p-4 shadow-sm mb-6">
          <label className="block text-xs font-medium text-slate-500 mb-1.5">
            공유 링크
          </label>
          <div className="flex gap-2">
            <input
              readOnly
              value={shareUrl}
              className="flex-1 rounded-lg border border-slate-200 bg-slate-50 px-3 py-2 text-sm text-slate-700"
              onFocus={(e) => e.currentTarget.select()}
            />
            <button
              onClick={copyShareUrl}
              className="shrink-0 rounded-lg bg-indigo-600 text-white px-4 text-sm font-medium hover:bg-indigo-700 transition-colors"
            >
              {copied ? "복사됨" : "복사"}
            </button>
          </div>
        </div>

        <div className="rounded-xl border border-slate-200 bg-white p-4 shadow-sm space-y-4 mb-8">
          <div>
            <label className="block text-sm font-medium text-slate-700 mb-1.5" htmlFor="title">
              제목
            </label>
            <input
              id="title"
              value={title}
              onChange={(e) => setTitle(e.target.value)}
              onBlur={saveMeta}
              maxLength={LIMITS.title}
              className="w-full rounded-lg border border-slate-300 px-3 py-2.5 focus:outline-none focus:ring-2 focus:ring-indigo-400 transition-shadow"
            />
          </div>
          <div>
            <label
              className="block text-sm font-medium text-slate-700 mb-1.5"
              htmlFor="description"
            >
              설명
            </label>
            <textarea
              id="description"
              value={description}
              onChange={(e) => setDescription(e.target.value)}
              onBlur={saveMeta}
              maxLength={LIMITS.description}
              rows={3}
              className="w-full rounded-lg border border-slate-300 px-3 py-2.5 focus:outline-none focus:ring-2 focus:ring-indigo-400 transition-shadow"
            />
          </div>
          {savingMeta && <p className="text-xs text-slate-400">저장 중...</p>}
        </div>

        <h2 className="text-sm font-semibold text-slate-600 mb-3">
          체크리스트 항목 <span className="text-slate-400">({data.items.length})</span>
        </h2>
        <ul className="space-y-2 mb-4">
          {data.items.map((item, index) => (
            <li key={item.id}>
              {(index === 0 || data.items[index - 1].groupLabel !== item.groupLabel) &&
                item.groupLabel && (
                  <h3 className="inline-flex items-center gap-1.5 text-sm font-bold text-indigo-700 bg-indigo-50 px-3 py-1 rounded-full mt-5 mb-2 first:mt-0">
                    <span aria-hidden>📅</span>
                    {item.groupLabel}
                  </h3>
                )}
              <div className="rounded-xl border border-slate-200 bg-white p-3.5 shadow-sm">
                {editingId === item.id ? (
                  <div className="space-y-2">
                    <div className="flex gap-2">
                      <input
                        autoFocus
                        value={editingText}
                        onChange={(e) => setEditingText(e.target.value)}
                        onKeyDown={(e) => e.key === "Enter" && saveEdit()}
                        maxLength={LIMITS.itemText}
                        className="flex-1 rounded-lg border border-slate-300 px-2.5 py-1.5 text-sm focus:outline-none focus:ring-2 focus:ring-indigo-400"
                      />
                      <button
                        onClick={saveEdit}
                        className="rounded-lg bg-indigo-600 text-white px-3 text-sm font-medium hover:bg-indigo-700 transition-colors"
                      >
                        저장
                      </button>
                      <button
                        onClick={() => setEditingId(null)}
                        className="rounded-lg border border-slate-300 px-3 text-sm text-slate-500 hover:bg-slate-100 transition-colors"
                      >
                        취소
                      </button>
                    </div>
                    <input
                      value={editingGroup}
                      onChange={(e) => setEditingGroup(e.target.value)}
                      onKeyDown={(e) => e.key === "Enter" && saveEdit()}
                      maxLength={LIMITS.groupLabel}
                      list="group-options"
                      placeholder="그룹(날짜) — 비워두면 그룹 없음"
                      className="w-full rounded-lg border border-slate-200 px-2.5 py-1.5 text-sm text-slate-500 focus:outline-none focus:ring-2 focus:ring-indigo-400"
                    />
                    {groupOptions.length > 0 && (
                      <div className="flex flex-wrap gap-1.5">
                        {groupOptions.map((label) => (
                          <button
                            key={label}
                            type="button"
                            onClick={() => setEditingGroup(label)}
                            className="text-xs rounded-full border border-slate-300 px-2.5 py-1 text-slate-600 hover:border-indigo-300 hover:bg-indigo-50 hover:text-indigo-700 transition-colors"
                          >
                            {label}
                          </button>
                        ))}
                      </div>
                    )}
                  </div>
                ) : (
                  <div className="flex items-start justify-between gap-2">
                    <span className="flex-1 text-[15px] text-slate-900 pt-0.5">
                      {item.text}
                    </span>
                    <div className="flex gap-0.5 text-sm shrink-0">
                      <button
                        onClick={() => moveItem(index, -1)}
                        disabled={index === 0}
                        className="w-8 h-8 rounded-md text-slate-400 hover:bg-slate-100 hover:text-slate-900 disabled:opacity-30 disabled:hover:bg-transparent transition-colors"
                        aria-label="위로"
                      >
                        ↑
                      </button>
                      <button
                        onClick={() => moveItem(index, 1)}
                        disabled={index === data.items.length - 1}
                        className="w-8 h-8 rounded-md text-slate-400 hover:bg-slate-100 hover:text-slate-900 disabled:opacity-30 disabled:hover:bg-transparent transition-colors"
                        aria-label="아래로"
                      >
                        ↓
                      </button>
                      <button
                        onClick={() => startEdit(item.id, item.text, item.groupLabel)}
                        className="px-2 h-8 rounded-md text-slate-500 hover:bg-slate-100 hover:text-slate-900 transition-colors"
                      >
                        수정
                      </button>
                      <button
                        onClick={() => deleteItem(item.id)}
                        className="px-2 h-8 rounded-md text-red-500 hover:bg-red-50 hover:text-red-600 transition-colors"
                      >
                        삭제
                      </button>
                    </div>
                  </div>
                )}

                <div className="mt-2.5 flex flex-wrap gap-1">
                  {item.checkedBy.length === 0 ? (
                    <span className="text-xs text-slate-400">
                      아직 체크한 사람이 없습니다.
                    </span>
                  ) : (
                    item.checkedBy.map((c) => (
                      <span
                        key={c.nickname}
                        className="text-xs font-medium rounded-full bg-emerald-50 text-emerald-700 px-2.5 py-1"
                      >
                        ✓ {c.nickname}
                      </span>
                    ))
                  )}
                </div>
              </div>
            </li>
          ))}
        </ul>

        <datalist id="group-options">
          {groupOptions.map((label) => (
            <option key={label} value={label} />
          ))}
        </datalist>

        <form onSubmit={addItem} className="flex flex-wrap gap-2 mb-2">
          <input
            value={newItemText}
            onChange={(e) => setNewItemText(e.target.value)}
            maxLength={LIMITS.itemText}
            placeholder="새 항목 추가"
            className="flex-1 basis-full sm:basis-0 min-w-0 rounded-lg border border-slate-300 px-3 py-2.5 focus:outline-none focus:ring-2 focus:ring-indigo-400 transition-shadow"
          />
          <input
            value={newItemGroup}
            onChange={(e) => setNewItemGroup(e.target.value)}
            maxLength={LIMITS.groupLabel}
            list="group-options"
            placeholder="그룹(날짜)"
            className="flex-1 sm:flex-none sm:w-32 min-w-0 rounded-lg border border-slate-300 px-3 py-2.5 text-sm focus:outline-none focus:ring-2 focus:ring-indigo-400 transition-shadow"
          />
          <button
            type="submit"
            disabled={addingItem}
            className="shrink-0 whitespace-nowrap rounded-lg bg-indigo-600 text-white px-4 text-sm font-medium hover:bg-indigo-700 disabled:opacity-50 transition-colors"
          >
            추가
          </button>
        </form>
        {groupOptions.length > 0 && (
          <div className="flex flex-wrap gap-1.5 mb-2">
            {groupOptions.map((label) => (
              <button
                key={label}
                type="button"
                onClick={() => setNewItemGroup(label)}
                className="text-xs rounded-full border border-slate-300 px-2.5 py-1 text-slate-600 hover:border-indigo-300 hover:bg-indigo-50 hover:text-indigo-700 transition-colors"
              >
                {label}
              </button>
            ))}
          </div>
        )}
        <p className="text-xs text-slate-400 mb-6">
          그룹(날짜)을 입력하면 같은 그룹 항목끼리 묶여서 표시됩니다. 비워두면
          그룹 없이 추가됩니다.
        </p>

        {showImport ? (
          <form
            onSubmit={importMarkdown}
            className="rounded-xl border border-slate-200 bg-white p-4 shadow-sm space-y-3"
          >
            <div className="flex items-start justify-between gap-2">
              <label className="block text-xs text-slate-500 leading-relaxed">
                마크다운으로 여러 항목 한 번에 추가 — {"`"}##{"`"} 줄은 날짜/그룹
                제목, {"`"}-{"`"} 줄은 항목으로 인식됩니다. 기존 항목은 지우거나
                바꾸지 않고 새 항목만 추가됩니다.
              </label>
              <button
                type="button"
                onClick={copyAiPrompt}
                className="shrink-0 text-xs font-medium text-slate-600 border border-slate-300 rounded-lg px-2.5 py-1.5 hover:bg-slate-100 transition-colors whitespace-nowrap"
              >
                {promptCopied ? "복사됨" : "AI 프롬프트 복사"}
              </button>
            </div>
            <textarea
              value={importText}
              onChange={(e) => setImportText(e.target.value)}
              rows={6}
              placeholder={"## 8/20 (목)\n- 물 준비\n- 명단 확인"}
              className="w-full rounded-lg border border-slate-300 px-3 py-2.5 text-sm font-mono focus:outline-none focus:ring-2 focus:ring-indigo-400 transition-shadow"
            />
            {importMessage && (
              <p className="text-xs text-slate-500">{importMessage}</p>
            )}
            <div className="flex gap-2">
              <button
                type="submit"
                disabled={importing}
                className="rounded-lg bg-indigo-600 text-white px-4 py-2.5 text-sm font-medium hover:bg-indigo-700 disabled:opacity-50 transition-colors"
              >
                {importing ? "가져오는 중..." : "가져오기"}
              </button>
              <button
                type="button"
                onClick={() => setShowImport(false)}
                className="rounded-lg border border-slate-300 px-4 py-2.5 text-sm text-slate-600 hover:bg-slate-100 transition-colors"
              >
                닫기
              </button>
            </div>
          </form>
        ) : (
          <button
            type="button"
            onClick={() => setShowImport(true)}
            className="text-sm font-medium text-slate-500 hover:text-slate-900 transition-colors"
          >
            + 마크다운으로 여러 항목 가져오기
          </button>
        )}

        <div className="mt-10 pt-6 border-t border-slate-200">
          <button
            type="button"
            onClick={deleteSchedule}
            disabled={deleting}
            className="text-sm font-medium text-red-500 hover:text-red-600 disabled:opacity-50 transition-colors"
          >
            {deleting ? "삭제하는 중..." : "이 일정 전체 삭제"}
          </button>
        </div>
      </div>
    </main>
  );
}
