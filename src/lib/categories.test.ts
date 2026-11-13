import { describe, expect, it } from 'vitest';
import { labelFor } from './categories';

describe('labelFor', () => {
  it('labelFor gives each stored category a capital first letter', () => {
    expect(labelFor('colleague')).toBe('Colleague');
    expect(labelFor('ate at a restaurant')).toBe('Ate at a restaurant');
  });
});
