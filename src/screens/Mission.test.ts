import { fireEvent, render, screen, waitFor, within } from '@testing-library/svelte';
import { beforeEach, describe, expect, it } from 'vitest';
import Mission from './Mission.svelte';
import { db } from '$lib/db';
import { openMission } from '$lib/navigation.svelte';
import { addContact, blankInput } from '$lib/repo/contacts';
import { addMission, addTask, listTasks } from '$lib/repo/missions';

let missionId = 0;

async function renderMission(tasks: string[]) {
  const connection = await db();
  await connection.execute('DELETE FROM contacts');
  const contact = await addContact(connection, { ...blankInput(), firstName: 'Ada' });
  const mission = await addMission(connection, contact, 'Send the photos', '');
  for (const task of tasks) await addTask(connection, mission, task);
  missionId = mission;
  openMission(contact, mission);
  render(Mission);
  await waitFor(() => expect(screen.queryAllByTestId('task')).toHaveLength(tasks.length));
}

beforeEach(() => {
  document.body.innerHTML = '';
});

describe('the task list controls', () => {
  it('the end arrows are disabled', async () => {
    await renderMission(['A', 'B', 'C']);
    await fireEvent.click(within(screen.getByTestId('mission-tasks')).getByTestId('edit-card'));

    const disabled = (id: string) => screen.getAllByTestId(id).map((button) => (button as HTMLButtonElement).disabled);
    expect(disabled('move-task-up')).toEqual([true, false, false]);
    expect(disabled('move-task-down')).toEqual([false, false, true]);
  });
});

describe('deleting a mission', () => {
  it('deleting a mission names its task count', async () => {
    await renderMission(['A', 'B', 'C']);

    await fireEvent.click(screen.getByTestId('delete-mission'));

    expect(screen.getByTestId('delete-mission-warning').textContent).toContain('This also deletes 3 tasks');
  });
});

describe('ticking a task', () => {
  it('ticking works without edit mode and saves', async () => {
    await renderMission(['A', 'B']);

    await fireEvent.click(screen.getAllByTestId('task-done')[1]);

    await waitFor(async () => expect((await listTasks(await db(), missionId)).map((task) => task.is_done)).toEqual([0, 1]));
  });
});

describe('the mission details', () => {
  it('the details show Save only after a change', async () => {
    await renderMission([]);
    await screen.findByTestId('mission-details');
    await fireEvent.click(within(screen.getByTestId('mission-details')).getByTestId('edit-card'));

    expect(screen.queryByTestId('save-mission-details')).toBeNull();

    await fireEvent.input(screen.getByTestId('mission-details-due'), { target: { value: '2026-12-01' } });

    expect(screen.getByTestId('save-mission-details')).toBeTruthy();
  });
});

describe('the mission page controls', () => {
  it('every button on a mission page has a name and every icon-only button a tooltip', async () => {
    await renderMission(['A', 'B']);
    for (const pencil of screen.getAllByTestId('edit-card')) await fireEvent.click(pencil);

    const buttons = screen.getAllByRole('button');
    expect(buttons.length).toBeGreaterThan(6);
    for (const button of buttons) {
      const text = (button.textContent ?? '').trim();
      const name = button.getAttribute('aria-label') ?? text;
      expect(name, button.outerHTML).not.toBe('');
      if (text === '') {
        const hasTooltip = button.hasAttribute('title') || button.getAttribute('data-slot') === 'tooltip-trigger';
        expect(hasTooltip, `no tooltip on ${button.outerHTML}`).toBe(true);
      }
    }
  });
});
