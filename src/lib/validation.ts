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

/** Like cleanText, but an absent/empty value is a valid "no group" (null), not an error. */
export function cleanOptionalText(
  value: unknown,
  maxLength: number
): string | null | undefined {
  if (value === undefined) return undefined;
  if (value === null) return null;
  if (typeof value !== "string") return undefined;
  const trimmed = value.trim();
  if (trimmed.length === 0) return null;
  return trimmed.slice(0, maxLength);
}
