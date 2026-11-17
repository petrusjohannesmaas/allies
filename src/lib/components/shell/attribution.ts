import type { Attribution } from './types';

/**
 * Reads the credit out of the anchor tag that Flaticon hands out, such as
 * `<a href="https://www.flaticon.com/free-icons/wallet" title="...">Wallet icons created by Magnific - Flaticon</a>`.
 * Plain text with no anchor is kept as the text, with no URL.
 */
export function parseAttribution(html: string): Attribution {
  const anchor = html.match(/<a\s[^>]*href="([^"]+)"[^>]*>([\s\S]*?)<\/a>/i);
  if (!anchor) return { text: html.trim(), url: '' };
  return { text: anchor[2].replace(/<[^>]+>/g, '').trim(), url: anchor[1] };
}

/** The first letter of the first and last name, or an empty string for no name. */
export function initials(name: string): string {
  const parts = name.trim().split(/\s+/).filter(Boolean);
  if (parts.length === 0) return '';
  if (parts.length === 1) return parts[0].charAt(0).toUpperCase();
  return (parts[0].charAt(0) + parts[parts.length - 1].charAt(0)).toUpperCase();
}
