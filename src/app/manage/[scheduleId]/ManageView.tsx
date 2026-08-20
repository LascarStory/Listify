"use client";

import Link from "next/link";
import { useCallback, useEffect, useState } from "react";
import { LIMITS } from "@/lib/validation";
import type { AdminScheduleData } from "@/lib/types";

const POLL_INTERVAL_MS = 5000;

export default function ManageView({ scheduleId }: { scheduleId: string }) {
  const [data, setData] = useState<AdminScheduleData | null>(null);
  const [notFound, setNotFound] = useState(false);
  const [title, setTitle] = useState("");
  const [description, setDescription] = useState("");
  const [savingMeta, setSavingMeta] = useState(false);
  const [newItemText, setNewItemText] = useState("");
  const [addingItem, setAddingItem] = useState(false);
  const [editingId, setEditingId] = useState<string | null>(null);
  const [editingText, setEditingText] = useState("");
  const [copied, setCopied] = useState(false);
  const [showImport, setShowImport] = useState(false);
  const [importText, setImportText] = useState("");
  const [importing, setImporting] = useState(false);
  const [importMessage, setImportMessage] = useState<string | null>(null);

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
        body: JSON.stringify({ text: newItemText }),
      });
      setNewItemText("");
      await load();
    } finally {
      setAddingItem(false);
    }
  }

  function startEdit(id: string, text: string) {
    setEditingId(id);
    setEditingText(text);
  }

  async function saveEdit() {
    if (!editingId || !editingText.trim()) {
      setEditingId(null);
      return;
    }
    await fetch(`/api/schedules/${scheduleId}/items/${editingId}`, {
      method: "PATCH",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ text: editingText }),
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
    <main className="flex-1 flex flex-col items-center px-4 py-10">
      <div className="w-full max-w-xl">
        <Link
          href="/"
          className="text-sm text-slate-400 hover:text-slate-900 mb-4 inline-block"
        >
          ← 내 일정 목록
        </Link>

        <div className="rounded-md border border-slate-200 bg-white p-4 mb-6">
          <label className="block text-xs text-slate-500 mb-1">공유 링크</label>
          <div className="flex gap-2">
            <input
              readOnly
              value={shareUrl}
              className="flex-1 rounded-md border border-slate-200 bg-slate-50 px-3 py-2 text-sm"
              onFocus={(e) => e.currentTarget.select()}
            />
            <button
              onClick={copyShareUrl}
              className="shrink-0 rounded-md bg-slate-900 text-white px-3 text-sm hover:bg-slate-800"
            >
              {copied ? "복사됨" : "복사"}
            </button>
          </div>
        </div>

        <div className="space-y-3 mb-8">
          <div>
            <label className="block text-sm font-medium mb-1" htmlFor="title">
              제목
            </label>
            <input
              id="title"
              value={title}
              onChange={(e) => setTitle(e.target.value)}
              onBlur={saveMeta}
              maxLength={LIMITS.title}
              className="w-full rounded-md border border-slate-300 px-3 py-2 focus:outline-none focus:ring-2 focus:ring-slate-400"
            />
          </div>
          <div>
            <label
              className="block text-sm font-medium mb-1"
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
              className="w-full rounded-md border border-slate-300 px-3 py-2 focus:outline-none focus:ring-2 focus:ring-slate-400"
            />
          </div>
          {savingMeta && <p className="text-xs text-slate-400">저장 중...</p>}
        </div>

        <h2 className="text-sm font-semibold text-slate-500 mb-3">
          체크리스트 항목 ({data.items.length})
        </h2>
        <ul className="space-y-2 mb-4">
          {data.items.map((item, index) => (
            <li key={item.id}>
              {(index === 0 || data.items[index - 1].groupLabel !== item.groupLabel) &&
                item.groupLabel && (
                  <h3 className="text-xs font-semibold text-slate-400 mt-4 mb-1.5 first:mt-0">
                    {item.groupLabel}
                  </h3>
                )}
              <div className="rounded-md border border-slate-200 bg-white p-3">
              {editingId === item.id ? (
                <div className="flex gap-2">
                  <input
                    autoFocus
                    value={editingText}
                    onChange={(e) => setEditingText(e.target.value)}
                    onKeyDown={(e) => e.key === "Enter" && saveEdit()}
                    maxLength={LIMITS.itemText}
                    className="flex-1 rounded-md border border-slate-300 px-2 py-1 text-sm focus:outline-none focus:ring-2 focus:ring-slate-400"
                  />
                  <button
                    onClick={saveEdit}
                    className="text-sm text-slate-900 font-medium"
                  >
                    저장
                  </button>
                  <button
                    onClick={() => setEditingId(null)}
                    className="text-sm text-slate-400"
                  >
                    취소
                  </button>
                </div>
              ) : (
                <div className="flex items-start justify-between gap-2">
                  <span className="flex-1">{item.text}</span>
                  <div className="flex gap-1 text-sm shrink-0">
                    <button
                      onClick={() => moveItem(index, -1)}
                      disabled={index === 0}
                      className="px-1.5 text-slate-400 hover:text-slate-900 disabled:opacity-30"
                      aria-label="위로"
                    >
                      ↑
                    </button>
                    <button
                      onClick={() => moveItem(index, 1)}
                      disabled={index === data.items.length - 1}
                      className="px-1.5 text-slate-400 hover:text-slate-900 disabled:opacity-30"
                      aria-label="아래로"
                    >
                      ↓
                    </button>
                    <button
                      onClick={() => startEdit(item.id, item.text)}
                      className="px-1.5 text-slate-400 hover:text-slate-900"
                    >
                      수정
                    </button>
                    <button
                      onClick={() => deleteItem(item.id)}
                      className="px-1.5 text-red-400 hover:text-red-600"
                    >
                      삭제
                    </button>
                  </div>
                </div>
              )}

              <div className="mt-2 flex flex-wrap gap-1">
                {item.checkedBy.length === 0 ? (
                  <span className="text-xs text-slate-400">
                    아직 체크한 사람이 없습니다.
                  </span>
                ) : (
                  item.checkedBy.map((c) => (
                    <span
                      key={c.nickname}
                      className="text-xs rounded-full bg-emerald-50 text-emerald-700 px-2 py-0.5"
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

        <form onSubmit={addItem} className="flex gap-2 mb-6">
          <input
            value={newItemText}
            onChange={(e) => setNewItemText(e.target.value)}
            maxLength={LIMITS.itemText}
            placeholder="새 항목 추가"
            className="flex-1 rounded-md border border-slate-300 px-3 py-2 focus:outline-none focus:ring-2 focus:ring-slate-400"
          />
          <button
            type="submit"
            disabled={addingItem}
            className="rounded-md bg-slate-900 text-white px-4 text-sm font-medium hover:bg-slate-800 disabled:opacity-50"
          >
            추가
          </button>
        </form>

        {showImport ? (
          <form
            onSubmit={importMarkdown}
            className="rounded-md border border-slate-200 bg-white p-4 space-y-2"
          >
            <label className="block text-xs text-slate-500">
              마크다운으로 여러 항목 한 번에 추가 — {"`"}##{"`"} 줄은 날짜/그룹
              제목, {"`"}-{"`"} 줄은 항목으로 인식됩니다. 기존 항목은 지우거나
              바꾸지 않고 새 항목만 추가됩니다.
            </label>
            <textarea
              value={importText}
              onChange={(e) => setImportText(e.target.value)}
              rows={6}
              placeholder={"## 8/20 (목)\n- 물 준비\n- 명단 확인"}
              className="w-full rounded-md border border-slate-300 px-3 py-2 text-sm font-mono focus:outline-none focus:ring-2 focus:ring-slate-400"
            />
            {importMessage && (
              <p className="text-xs text-slate-500">{importMessage}</p>
            )}
            <div className="flex gap-2">
              <button
                type="submit"
                disabled={importing}
                className="rounded-md bg-slate-900 text-white px-4 py-2 text-sm font-medium hover:bg-slate-800 disabled:opacity-50"
              >
                {importing ? "가져오는 중..." : "가져오기"}
              </button>
              <button
                type="button"
                onClick={() => setShowImport(false)}
                className="rounded-md border border-slate-300 px-4 py-2 text-sm hover:bg-slate-100"
              >
                닫기
              </button>
            </div>
          </form>
        ) : (
          <button
            type="button"
            onClick={() => setShowImport(true)}
            className="text-sm text-slate-500 hover:text-slate-900"
          >
            + 마크다운으로 여러 항목 가져오기
          </button>
        )}
      </div>
    </main>
  );
}
