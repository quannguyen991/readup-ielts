import type { CommunityCategory, CommunityPostKind } from './types';

export const COMMUNITY_CATEGORIES: readonly CommunityCategory[] = ['vocabulary', 'grammar', 'speaking', 'writing', 'reading', 'general'];

/** Removes control characters while preserving line breaks and Vietnamese text. */
export function cleanCommunityText(value: unknown, maxLength: number): string {
  if (typeof value !== 'string') return '';
  return value
    .replace(/[\u0000-\u0008\u000B\u000C\u000E-\u001F\u007F]/g, '')
    .trim()
    .slice(0, maxLength)
    .trim();
}

export function validPostInput(input: Record<string, unknown>) {
  const kind = input.kind === 'question' || input.kind === 'share' ? input.kind as CommunityPostKind : null;
  const category = COMMUNITY_CATEGORIES.includes(input.category as CommunityCategory) ? input.category as CommunityCategory : null;
  const title = cleanCommunityText(input.title, 160);
  const body = cleanCommunityText(input.body, 3000);
  if (!kind || !category || title.length < 3 || body.length < 3) return null;
  return { kind, category, title, body };
}

export function validMessageBody(value: unknown): string | null {
  const body = cleanCommunityText(value, 1500);
  return body.length >= 1 ? body : null;
}

export function canonicalFriendPair(a: string, b: string): { low: string; high: string } | null {
  const uuid = /^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/i;
  if (!uuid.test(a) || !uuid.test(b) || a.toLowerCase() === b.toLowerCase()) return null;
  const lowerA = a.toLowerCase();
  const lowerB = b.toLowerCase();
  const [low, high] = lowerA < lowerB ? [lowerA, lowerB] : [lowerB, lowerA];
  return { low, high };
}
