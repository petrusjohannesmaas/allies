import { Then, When } from '@wdio/cucumber-framework';
import { formatMonth, monthOf } from '../../src/lib/dates';
import { dayFromNow, setFieldValue } from './helpers';

const JOURNAL = '[data-testid="screen-journal"]';

const FACES = { sad: 'Sad', neutral: 'Neutral', happy: 'Happy' } as const;
type Face = keyof typeof FACES;

/** Every row the journal shows, with its kind, body and the contact it was with. */
async function listedRows(): Promise<{ kind: string; body: string; contact: string }[]> {
  return browser.execute(
    (selector) =>
      [...document.querySelectorAll(`${selector} [data-testid="journal-row"]`)].map((row) => ({
        kind: row.getAttribute('data-kind') ?? '',
        body: row.querySelector('[data-testid="journal-row-body"]')?.textContent?.trim() ?? '',
        contact: row.querySelector('[data-testid="journal-row-contact"]')?.textContent?.trim() ?? '',
      })),
    JOURNAL,
  );
}

/** The months the journal heads each run of rows with, in the order they appear. */
async function listedMonths(): Promise<string[]> {
  return browser.execute(
    (selector) =>
      [...document.querySelectorAll(`${selector} [data-testid="journal-month"]`)].map(
        (heading) => heading.textContent?.trim() ?? '',
      ),
    JOURNAL,
  );
}

async function waitForRow(predicate: () => boolean | Promise<boolean>, message: string) {
  await browser.waitUntil(predicate, { timeout: 5_000, timeoutMsg: message });
}

When(/^I add a journal entry dated "([^"]+)" with the text "([^"]+)"$/, async (day: string, body: string) => {
  await setFieldValue(`${JOURNAL} [data-testid="entry-date"]`, dayFromNow(day));
  await browser.execute(
    (selector, text) => {
      const field = document.querySelector(selector) as HTMLTextAreaElement;
      field.value = text;
      field.dispatchEvent(new Event('input', { bubbles: true }));
    },
    `${JOURNAL} [data-testid="entry-body"]`,
    body,
  );
  await $(`${JOURNAL} [data-testid="save-entry"]`).click();
  await waitForRow(
    async () => (await listedRows()).some((row) => row.kind === 'entry' && row.body === body),
    'The journal entry never showed up',
  );
});

When(/^I delete the journal entry "([^"]+)"$/, async (body: string) => {
  const clicked = await browser.execute(
    (selector, wanted) => {
      const rows = [...document.querySelectorAll(`${selector} [data-testid="journal-row"]`)];
      const row = rows.find(
        (candidate) =>
          candidate.getAttribute('data-kind') === 'entry' &&
          candidate.querySelector('[data-testid="journal-row-body"]')?.textContent?.trim() === wanted,
      );
      if (!row) return false;
      (row.querySelector('[data-testid="delete-entry"]') as HTMLButtonElement).click();
      return true;
    },
    JOURNAL,
    body,
  );
  if (!clicked) throw new Error(`No journal entry reading "${body}" to delete`);

  await waitForRow(
    async () => !(await listedRows()).some((row) => row.kind === 'entry' && row.body === body),
    `The journal entry reading "${body}" stayed on the page`,
  );
});

When(/^I rate the day "([^"]+)"$/, async (face: string) => {
  await $(`${JOURNAL} [data-testid="rate-${face}"]`).click();
  // The click either rates the day or is refused, and the scenario waits for
  // one of the two before it picks another face.
  await waitForRow(
    async () =>
      (await $(`${JOURNAL} [data-testid="day-rating"]`).getAttribute('data-rated')) !== null ||
      (await $(`${JOURNAL} [data-testid="rating-refused"]`).isExisting()),
    'Picking a face neither rated the day nor was refused',
  );
});

Then('today is not rated', async () => {
  expect(await $(`${JOURNAL} [data-testid="day-rating"]`).getAttribute('data-rated')).toBeNull();
  expect(await $(`${JOURNAL} [data-testid="today-rating"]`).isExisting()).toBe(false);
});

Then(/^today's rating reads "([^"]+)"$/, async (face: string) => {
  const shown = await $(`${JOURNAL} [data-testid="today-rating"]`);
  await waitForRow(async () => shown.isExisting(), 'The journal showed no rating for today');
  expect(await shown.getText()).toBe(`You rated your day: ${FACES[face as Face]}`);
});

Then(/^the face "([^"]+)" is marked as chosen$/, async (face: string) => {
  const button = await $(`${JOURNAL} [data-testid="rate-${face}"]`);
  await waitForRow(async () => button.isExisting(), 'The journal showed no face to pick');
  expect(await button.getAttribute('aria-pressed')).toBe('true');
});

Then(/^the day is already rated as "([^"]+)"$/, async (face: string) => {
  const refusal = await $(`${JOURNAL} [data-testid="rating-refused"]`);
  await refusal.waitForExist({ timeout: 5_000 });
  expect(await refusal.getText()).toBe('Today is already rated.');
  expect(await $(`${JOURNAL} [data-testid="today-rating"]`).getText()).toBe(`You rated your day: ${FACES[face as Face]}`);
});

Then(/^the journal entry "([^"]+)" is listed$/, async (body: string) => {
  await waitForRow(
    async () => (await listedRows()).some((row) => row.kind === 'entry' && row.body === body),
    `The journal entry reading "${body}" never showed up`,
  );
});

Then(/^the journal entry "([^"]+)" is not listed$/, async (body: string) => {
  expect((await listedRows()).filter((row) => row.kind === 'entry' && row.body === body)).toEqual([]);
});

Then('both journal entries are listed', async () => {
  await waitForRow(async () => (await listedRows()).filter((row) => row.kind === 'entry').length === 2, 'The journal showed fewer than two entries');
});

Then(/^the journal has a row reading "([^"]+)"$/, async (body: string) => {
  await waitForRow(
    async () => (await listedRows()).some((row) => row.body === body),
    `The journal showed no row reading "${body}"`,
  );
});

Then(/^the journal has no row reading "([^"]+)"$/, async (body: string) => {
  expect((await listedRows()).filter((row) => row.body === body)).toEqual([]);
});

Then(/^the automatic entry "([^"]+)" is listed$/, async (body: string) => {
  await waitForRow(
    async () => (await listedRows()).some((row) => row.body === body && row.contact.startsWith('with ')),
    `The journal showed no automatic entry reading "${body}"`,
  );
});

Then(/^the automatic entry "([^"]+)" for "([^"]+)" is listed$/, async (body: string, name: string) => {
  await waitForRow(
    async () => (await listedRows()).some((row) => row.body === body && row.contact === `with ${name}`),
    `The journal showed no automatic entry reading "${body}"`,
  );
});

Then(/^the automatic entry "([^"]+)" is not listed$/, async (body: string) => {
  expect((await listedRows()).filter((row) => row.body === body)).toEqual([]);
});

Then(/^the automatic entry "([^"]+)" is marked "([^"]+)"$/, async (body: string, marking: string) => {
  const marked = await browser.execute(
    (selector, wanted, text) =>
      [...document.querySelectorAll(`${selector} [data-testid="journal-row"]`)]
        .filter((row) => row.querySelector('[data-testid="journal-row-body"]')?.textContent?.trim() === wanted)
        .every((row) => row.querySelector('[data-testid="journal-row-automatic"]')?.textContent?.trim() === text),
    JOURNAL,
    body,
    marking,
  );
  expect(marked).toBe(true);
});

Then(/^the automatic entry "([^"]+)" (?:still )?has no delete button$/, async (body: string) => {
  const removable = await browser.execute(
    (selector, wanted) =>
      [...document.querySelectorAll(`${selector} [data-testid="journal-row"]`)]
        .filter((row) => row.querySelector('[data-testid="journal-row-body"]')?.textContent?.trim() === wanted)
        .some((row) => row.querySelector('[data-testid="delete-entry"]') !== null),
    JOURNAL,
    body,
  );
  expect(removable).toBe(false);
});

Then(/^the journal entry "([^"]+)" has a delete button$/, async (body: string) => {
  const removable = await browser.execute(
    (selector, wanted) =>
      [...document.querySelectorAll(`${selector} [data-testid="journal-row"]`)]
        .filter((row) => row.querySelector('[data-testid="journal-row-body"]')?.textContent?.trim() === wanted)
        .some((row) => row.querySelector('[data-testid="delete-entry"]') !== null),
    JOURNAL,
    body,
  );
  expect(removable).toBe(true);
});

Then(/^the journal shows the month for "([^"]+)"$/, async (day: string) => {
  await waitForRow(async () => (await listedMonths()).length > 0, 'The journal showed no month heading');
  expect(await listedMonths()).toContain(formatMonth(monthOf(dayFromNow(day))));
});
