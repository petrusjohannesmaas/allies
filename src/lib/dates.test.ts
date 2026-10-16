import { describe, expect, it } from 'vitest';
import { formatDate, today } from './dates';

describe('today', () => {
  it('is the local date, written the way the app stores it', () => {
    expect(today()).toMatch(/^\d{4}-\d{2}-\d{2}$/);
    expect(today()).toBe(new Date().toLocaleDateString('en-CA'));
  });
});

describe('formatDate', () => {
  it('writes the day as a person reads it', () => {
    expect(formatDate('2026-10-13')).toBe('13 October 2026');
    expect(formatDate('2026-01-05')).toBe('5 January 2026');
    expect(formatDate('2026-12-31')).toBe('31 December 2026');
  });

  it('keeps a leap day', () => {
    expect(formatDate('2028-02-29')).toBe('29 February 2028');
  });
});
