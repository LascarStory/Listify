export const LIMITS = {
  title: 100,
  description: 1000,
  itemText: 200,
  groupLabel: 50,
  nickname: 20,
  maxItems: 200,
  markdownImport: 20000,
} as const;

export function cleanText(value: unknown, maxLength: number): string | null {
  if (typeof value !== "string") return null;
  const trimmed = value.trim();
  if (trimmed.length === 0 || trimmed.length > maxLength) return null;
  return trimmed;
}
