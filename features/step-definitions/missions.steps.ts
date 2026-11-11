import { Then, When } from '@wdio/cucumber-framework';
import { withDatabase } from './data';
import { openCardEditor, setFieldValue, typeInto } from './helpers';

const BOX = '[data-testid="missions"]';
const SCREEN = '[data-testid="screen-mission"]';
const TASKS = `${SCREEN} [data-testid="mission-tasks"]`;
const DETAILS = `${SCREEN} [data-testid="mission-details"]`;

/** The missions the header box lists, in the order it shows them. */
async function listedMissions(): Promise<{ description: string; due: string; progress: string }[]> {
  return browser.execute((selector) => {
    return [...document.querySelectorAll(`${selector} [data-testid="mission"]`)].map((mission) => ({
      description: mission.querySelector('[data-testid="mission-text"]')?.textContent?.trim() ?? '',
      due: mission.querySelector('[data-testid="mission-due"]')?.textContent?.trim() ?? '',
      progress: mission.querySelector('[data-testid="mission-progress"]')?.textContent?.trim() ?? '',
    }));
  }, BOX);
}

/** The tasks the mission screen lists, in the order it shows them. */
async function listedTasks(): Promise<{ text: string; done: boolean }[]> {
  return browser.execute((selector) => {
    return [...document.querySelectorAll(`${selector} [data-testid="task"]`)].map((task) => ({
      text: task.getAttribute('data-task-text') ?? '',
      done: (task.querySelector('[data-testid="task-done"]') as HTMLInputElement | null)?.checked ?? false,
    }));
  }, TASKS);
}

When(/^I add the mission "([^"]+)"$/, async (description: string) => {
  await typeInto(`${BOX} [data-testid="mission-description"]`, description);
  await $(`${BOX} [data-testid="add-mission"]`).click();
  await browser.waitUntil(async () => (await listedMissions()).some((mission) => mission.description === description), {
    timeout: 5_000,
    timeoutMsg: 'The mission never showed up in the Missions box',
  });
});

When(/^I open the mission "([^"]+)"$/, async (description: string) => {
  const clicked = await browser.execute(
    (selector, wanted) => {
      const missions = [...document.querySelectorAll(`${selector} [data-testid="mission"]`)];
      const mission = missions.find((candidate) => candidate.querySelector('[data-testid="mission-text"]')?.textContent?.trim() === wanted);
      if (!mission) return false;
      (mission.querySelector('[data-testid="open-mission"]') as HTMLButtonElement).click();
      return true;
    },
    BOX,
    description,
  );
  if (!clicked) throw new Error(`No mission reading "${description}" in the Missions box`);
  await $(SCREEN).waitForExist({ timeout: 5_000 });
});

When('I go back to the contact', async () => {
  await $(`${SCREEN} [data-testid="back-to-contact"]`).click();
  await $('[data-testid="screen-contact"]').waitForExist({ timeout: 5_000 });
});

When(/^I add the task "([^"]+)"$/, async (text: string) => {
  await openCardEditor('mission-tasks');
  await typeInto(`${TASKS} [data-testid="task-description"]`, text);
  await $(`${TASKS} [data-testid="add-task"]`).click();
  await browser.waitUntil(async () => (await listedTasks()).some((task) => task.text === text), {
    timeout: 5_000,
    timeoutMsg: 'The task never showed up on the mission screen',
  });
});

When(/^I move the task "([^"]+)" up$/, async (text: string) => {
  await openCardEditor('mission-tasks');
  const before = (await listedTasks()).map((task) => task.text);
  await $(`${TASKS} [data-testid="task"][data-task-text="${text}"] [data-testid="move-task-up"]`).click();
  await browser.waitUntil(async () => (await listedTasks()).map((task) => task.text).join('|') !== before.join('|'), {
    timeout: 5_000,
    timeoutMsg: 'The task never moved',
  });
});

When(/^I tick the task "([^"]+)"$/, async (text: string) => {
  await $(`${TASKS} [data-testid="task"][data-task-text="${text}"] [data-testid="task-done"]`).click();
  // The box flips as soon as it is clicked, so wait until the database has the tick too.
  await browser.waitUntil(
    async () =>
      withDatabase((db) => (db.prepare('SELECT is_done FROM tasks WHERE description = $text').get({ $text: text }) as { is_done: number } | undefined)?.is_done === 1),
    { timeout: 5_000, timeoutMsg: 'The tick never reached the database' },
  );
});

When(/^I change the mission to "([^"]+)" due (\d{4}-\d{2}-\d{2})$/, async (description: string, due: string) => {
  await openCardEditor('mission-details');
  await typeInto(`${DETAILS} [data-testid="mission-details-description"]`, description);
  await setFieldValue(`${DETAILS} [data-testid="mission-details-due"]`, due);
  await $(`${DETAILS} [data-testid="save-mission-details"]`).click();
  await $(`${DETAILS} [data-testid="mission-title"]`).waitForExist({ timeout: 5_000 });
});

When(/^I delete the mission and confirm that it also deletes (\d+) tasks?$/, async (count: string) => {
  await $(`${SCREEN} [data-testid="delete-mission"]`).click();
  const warning = $(`${SCREEN} [data-testid="delete-mission-warning"]`);
  await warning.waitForExist({ timeout: 5_000 });
  expect((await warning.getText()).trim()).toContain(`This also deletes ${count} task`);
  await $(`${SCREEN} [data-testid="confirm-delete-mission"]`).click();
  await $('[data-testid="screen-contact"]').waitForExist({ timeout: 5_000 });
});

Then(/^the mission screen is for "([^"]+)"$/, async (name: string) => {
  const link = $(`${SCREEN} [data-testid="back-to-contact"]`);
  await link.waitForExist({ timeout: 5_000 });
  expect((await link.getText()).trim()).toContain(name);
});

Then(/^the mission screen shows "([^"]+)" due (\d{4}-\d{2}-\d{2})$/, async (description: string, due: string) => {
  const title = $(`${DETAILS} [data-testid="mission-title"]`);
  await title.waitForExist({ timeout: 5_000 });
  expect((await title.getText()).trim()).toBe(description);
  expect((await $(`${DETAILS} [data-testid="mission-due"]`).getText()).trim()).toBe(`Due ${due}`);
});

Then(/^the tasks read "([^"]+)"$/, async (expected: string) => {
  await browser.waitUntil(async () => (await listedTasks()).map((task) => task.text).join(', ') === expected, {
    timeout: 5_000,
    timeoutMsg: `The tasks did not read "${expected}"`,
  });
});

Then(/^the task "([^"]+)" is ticked$/, async (text: string) => {
  expect((await listedTasks()).find((task) => task.text === text)?.done).toBe(true);
});

Then('the top task cannot move up and the bottom task cannot move down', async () => {
  await openCardEditor('mission-tasks');
  const disabled = await browser.execute((selector) => {
    const tasks = [...document.querySelectorAll(`${selector} [data-testid="task"]`)];
    const up = tasks[0]?.querySelector('[data-testid="move-task-up"]') as HTMLButtonElement | null;
    const down = tasks[tasks.length - 1]?.querySelector('[data-testid="move-task-down"]') as HTMLButtonElement | null;
    return { topUp: up?.disabled, bottomDown: down?.disabled };
  }, TASKS);
  expect(disabled).toEqual({ topUp: true, bottomDown: true });
});

Then(/^the mission "([^"]+)" is listed$/, async (description: string) => {
  expect((await listedMissions()).map((mission) => mission.description)).toContain(description);
});

Then(/^the mission "([^"]+)" shows "([^"]+)"$/, async (description: string, progress: string) => {
  const mission = (await listedMissions()).find((candidate) => candidate.description === description);
  if (!mission) throw new Error(`No mission reading "${description}"`);
  expect(mission.progress).toBe(progress);
});

Then(/^the mission "([^"]+)" is due (\d{4}-\d{2}-\d{2})$/, async (description: string, due: string) => {
  const mission = (await listedMissions()).find((candidate) => candidate.description === description);
  if (!mission) throw new Error(`No mission reading "${description}"`);
  expect(mission.due).toBe(`Due ${due}`);
});

Then('no missions are listed', async () => {
  await $(`${BOX} [data-testid="missions-empty"]`).waitForExist({ timeout: 5_000 });
});
