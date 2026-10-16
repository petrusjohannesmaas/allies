/** The categories a contact may carry, in the order the picker shows them. */
export const CATEGORIES = [
  'family',
  'friend',
  'colleague',
  'acquaintance',
  'mentor',
  'community',
  'stranger',
  'online',
] as const;

export type Category = (typeof CATEGORIES)[number];

export function isCategory(value: string): value is Category {
  return (CATEGORIES as readonly string[]).includes(value);
}