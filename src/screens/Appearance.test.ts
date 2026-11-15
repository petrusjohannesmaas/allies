import { fireEvent, render, screen } from '@testing-library/svelte';
import { beforeEach, describe, expect, it } from 'vitest';
import { settings } from '../lib/settings.svelte';
import { fakeStore } from '../test/fake-store';
import Appearance from './Appearance.svelte';

const root = document.documentElement;

beforeEach(async () => {
  fakeStore();
  await settings.load();
});

describe('the Appearance screen', () => {
  it('applies Dark when it is chosen', async () => {
    await settings.setTheme('light');
    render(Appearance);

    await fireEvent.click(screen.getByRole('radio', { name: 'Dark' }));

    expect(root.dataset.theme).toBe('dark');
    expect((screen.getByRole('radio', { name: 'Dark' }) as HTMLInputElement).checked).toBe(true);
  });

  it('applies Purple when its swatch is pressed', async () => {
    await settings.setAccent('blue');
    render(Appearance);

    await fireEvent.click(screen.getByRole('button', { name: 'Purple' }));

    expect(root.style.getPropertyValue('--accent-bg')).toBe('#9141ac');
    expect(screen.getByRole('button', { name: 'Purple' }).getAttribute('aria-pressed')).toBe('true');
    expect(screen.getByRole('button', { name: 'Blue' }).getAttribute('aria-pressed')).toBe('false');
  });

  it('shows a message when the save fails', async () => {
    const store = fakeStore();
    store.failing.save = true;
    render(Appearance);

    await fireEvent.click(screen.getByRole('button', { name: 'Purple' }));

    expect(await screen.findByText(/Could not save your settings/)).toBeTruthy();
  });
});
