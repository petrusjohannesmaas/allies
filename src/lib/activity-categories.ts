/**
 * The activity categories the picker offers: the four Monica shows, plus the
 * one that catches everything else.
 */
export const ACTIVITY_CATEGORIES = [
  'ate at a restaurant',
  'did sport together',
  'went to the theater',
  'just talked at home',
  'did something else',
] as const;

export type ActivityCategory = (typeof ACTIVITY_CATEGORIES)[number];

export function isActivityCategory(value: string): value is ActivityCategory {
  return (ACTIVITY_CATEGORIES as readonly string[]).includes(value);
}
