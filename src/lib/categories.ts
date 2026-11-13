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

/** The text shown for a stored category: the same words with a capital first letter. */
export function labelFor(value: string): string {
  return value.charAt(0).toUpperCase() + value.slice(1);
}

export type Category = (typeof CATEGORIES)[number];

export function isCategory(value: string): value is Category {
  return (CATEGORIES as readonly string[]).includes(value);
}