import { Then, When } from '@wdio/cucumber-framework';
import { formatDate } from '../../src/lib/dates';
import { dayFromNow, setFieldValue, typeInto } from './helpers';

const REMINDERS = '[data-testid="screen-contact"] [data-testid="reminders"]';

/** The reminders the page lists, each with its description, the date it reads and the repeat. */
async function listedReminders(): Promise<{ description: string; reads: string; repeats: string }[]> {
  return browser.execute(
    (selector) =>
      [...document.querySelectorAll(`${selector} [data-testid="reminder"]`)].map((row) => ({
        description: row.querySelector('[data-testid="reminder-description-value"]')?.textContent ?? '',
        reads: row.querySelector('[data-testid="reminder-date-value"]')?.textContent ?? '',
        repeats: row.querySelector('[data-testid="reminder-repeats-value"]')?.textContent ?? '',
      })),
    REMINDERS,
  );
}

const REPEAT_WORDS = { yes: 'Every year', no: 'Once' } as const;

When(
  /^I add a reminder dated "([^"]+)" with the description "([^"]+)" and (no|a) yearly repeat$/,
  async (day: string, description: string, repeat: string) => {
    await setFieldValue(`${REMINDERS} [data-testid="reminder-date"]`, dayFromNow(day));
    await typeInto(`${REMINDERS} [data-testid="reminder-description"]`, description);
    await browser.execute(
      (selector, wanted) => {
        const box = document.querySelector(selector) as HTMLInputElement;
        if (box.checked !== wanted) box.click();
      },
      `${REMINDERS} [data-testid="reminder-repeats"]`,
      repeat === 'a',
    );
    await $(`${REMINDERS} [data-testid="save-reminder"]`).click();
    await browser.waitUntil(async () => (await listedReminders()).some((row) => row.description === description), {
      timeout: 5_000,
      timeoutMsg: 'The reminder never showed up on the page',
    });
  },
);

When(/^I delete the reminder "([^"]+)"$/, async (description: string) => {
  const clicked = await browser.execute(
    (selector, wanted) => {
      const rows = [...document.querySelectorAll(`${selector} [data-testid="reminder"]`)];
      const row = rows.find((candidate) => candidate.querySelector('[data-testid="reminder-description-value"]')?.textContent === wanted);
      if (!row) return false;
      (row.querySelector('[data-testid="delete-reminder"]') as HTMLButtonElement).click();
      return true;
    },
    REMINDERS,
    description,
  );
  if (!clicked) throw new Error(`No reminder reading "${description}" on the page`);

  await browser.waitUntil(async () => !(await listedReminders()).some((row) => row.description === description), {
    timeout: 5_000,
    timeoutMsg: `The reminder reading "${description}" stayed on the page`,
  });
});

Then(/^the reminder "([^"]+)" is listed$/, async (description: string) => {
  expect((await listedReminders()).map((row) => row.description)).toContain(description);
});

Then(/^the reminder "([^"]+)" is not listed$/, async (description: string) => {
  expect((await listedReminders()).map((row) => row.description)).not.toContain(description);
});

Then(/^the reminder "([^"]+)" reads the date "([^"]+)"$/, async (description: string, day: string) => {
  const row = (await listedReminders()).find((reminder) => reminder.description === description);
  if (!row) throw new Error(`The page lists no reminder reading "${description}"`);
  expect(row.reads).toBe(formatDate(dayFromNow(day)));
});

Then(/^the reminder "([^"]+)" repeats "(yes|no)"$/, async (description: string, repeat: string) => {
  const row = (await listedReminders()).find((reminder) => reminder.description === description);
  if (!row) throw new Error(`The page lists no reminder reading "${description}"`);
  expect(row.repeats).toBe(REPEAT_WORDS[repeat as keyof typeof REPEAT_WORDS]);
});

Then('both reminders are listed', async () => {
  expect(await listedReminders()).toHaveLength(2);
});

Then('no reminders are listed', async () => {
  await $(`${REMINDERS} [data-testid="reminders-empty"]`).waitForExist({ timeout: 5_000 });
});
