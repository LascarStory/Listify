import { LIMITS } from "@/lib/validation";

const HEADING_RE = /^#{1,6}\s+(.*)$/;
const LIST_ITEM_RE = /^[-*+]\s+(?:\[[ xX]\]\s+)?(.*)$/;

export type ParsedChecklistItem = {
  text: string;
  groupLabel: string | null;
};

/**
 * Parses a markdown checklist into a flat list of items. `#`-style headings
 * become the groupLabel for the items that follow; `-`/`*`/`+` list lines
 * (optionally with a `[ ]`/`[x]` checkbox marker) become items. Any other
 * line (plain text, blank lines) is ignored.
 */
export function parseMarkdownChecklist(markdown: string): ParsedChecklistItem[] {
  const items: ParsedChecklistItem[] = [];
  let currentGroup: string | null = null;

  for (const rawLine of markdown.split(/\r?\n/)) {
    const line = rawLine.trim();
    if (!line) continue;

    const heading = line.match(HEADING_RE);
    if (heading) {
      const label = heading[1].trim();
      currentGroup = label.length > 0 ? label.slice(0, LIMITS.groupLabel) : null;
      continue;
    }

    const listItem = line.match(LIST_ITEM_RE);
    if (listItem) {
      const text = listItem[1].trim().slice(0, LIMITS.itemText);
      if (text.length > 0) {
        items.push({ text, groupLabel: currentGroup });
      }
    }
  }

  return items;
}
