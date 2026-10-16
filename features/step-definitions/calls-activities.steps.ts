import { Then, When } from '@wdio/cucumber-framework';
import { formatDate } from '../../src/lib/dates';
import { dayFromNow, setFieldValue, typeInto } from './helpers';

const PAGE = '[data-testid="screen-contact"]';
const CALLS = `${PAGE} [data-testid="calls"]`;
const ACTIVITIES = `${PAGE} [data-testid="activities"]`;

/** The calls the page lists, each with its description and the date it reads. */
async function listedCalls(): Promise<{ description: string; reads: string }[]> {
  return browser.execute(
    (selector) =>
      [...document.querySelectorAll(`${selector} [data-testid="call"]`)].map((row) => ({
        description: row.querySelector('[data-testid="call-description-value"]')?.textContent ?? '',
        reads: row.querySelector('[data-testid="call-date-value"]')?.textContent ?? '',
      })),
    CALLS,
  );
}

/** The activities the page lists, each with its description, its category and the date it reads. */
async function listedActivities(): Promise<{ description: string; category: string; reads: string }[]> {
  return browser.execute(
    (selector) =>
      [...document.querySelectorAll(`${selector} [data-testid="activity"]`)].map((row) => ({
        description: row.querySelector('[data-testid="activity-description-value"]')?.textContent ?? '',
        category: row.querySelector('[data-testid="activity-category-value"]')?.textContent ?? '',
        reads: row.querySelector('[data-testid="activity-date-value"]')?.textContent ?? '',
      })),
    ACTIVITIES,
  );
}

async function lineReads(selector: string): Promise<string> {
  const element = await $(selector);
  await element.waitForExist({ timeout: 5_000 });
  return element.getText();
}

/** Clicks the delete button on the row that reads `description`. */
async function deleteRow(
  section: string,
  row: string,
  value: string,
  button: string,
  description: string,
): Promise<void> {
  const hasRow = (wanted: string) =>
    browser.execute(
      (selector, item, field, text) =>
        [...document.querySelectorAll(`${selector} [data-testid="${item}"]`)].some(
          (candidate) => candidate.querySelector(`[data-testid="${field}"]`)?.textContent === text,
        ),
      section,
      row,
      value,
      wanted,
    );

  const clicked = await browser.execute(
    (selector, item, field, text, remove) => {
      const rows = [...document.querySelectorAll(`${selector} [data-testid="${item}"]`)];
      const found = rows.find((candidate) => candidate.querySelector(`[data-testid="${field}"]`)?.textContent === text);
      if (!found) return false;
      (found.querySelector(`[data-testid="${remove}"]`) as HTMLButtonElement).click();
      return true;
    },
    section,
    row,
    value,
    description,
    button,
  );
  if (!clicked) throw new Error(`No row reading "${description}" on the page`);

  await browser.waitUntil(async () => !(await hasRow(description)), {
    timeout: 5_000,
    timeoutMsg: `The row reading "${description}" stayed on the page`,
  });
}

When(/^I log a call dated "([^"]+)" with the description "([^"]+)"$/, async (day: string, description: string) => {
  await setFieldValue(`${CALLS} [data-testid="call-date"]`, dayFromNow(day));
  await typeInto(`${CALLS} [data-testid="call-description"]`, description);
  await $(`${CALLS} [data-testid="save-call"]`).click();
  await browser.waitUntil(async () => (await listedCalls()).some((call) => call.description === description), {
    timeout: 5_000,
    timeoutMsg: 'The call never showed up on the page',
  });
});

When(
  /^I log an activity dated "([^"]+)" in the category "([^"]+)" with the description "([^"]+)"$/,
  async (day: string, category: string, description: string) => {
    await setFieldValue(`${ACTIVITIES} [data-testid="activity-date"]`, dayFromNow(day));
    await browser.execute(
      (selector, wanted) => {
        const select = document.querySelector(selector) as HTMLSelectElement;
        select.value = wanted;
        select.dispatchEvent(new Event('change', { bubbles: true }));
      },
      `${ACTIVITIES} [data-testid="activity-category"]`,
      category,
    );
    await typeInto(`${ACTIVITIES} [data-testid="activity-description"]`, description);
    await $(`${ACTIVITIES} [data-testid="save-activity"]`).click();
    await browser.waitUntil(async () => (await listedActivities()).some((row) => row.description === description), {
      timeout: 5_000,
      timeoutMsg: 'The activity never showed up on the page',
    });
  },
);

When(/^I delete the call "([^"]+)"$/, async (description: string) => {
  await deleteRow(CALLS, 'call', 'call-description-value', 'delete-call', description);
});

When(/^I delete the activity "([^"]+)"$/, async (description: string) => {
  await deleteRow(ACTIVITIES, 'activity', 'activity-description-value', 'delete-activity', description);
});

Then(/^the call "([^"]+)" is listed$/, async (description: string) => {
  expect((await listedCalls()).map((call) => call.description)).toContain(description);
});

Then(/^the call "([^"]+)" is not listed$/, async (description: string) => {
  expect((await listedCalls()).map((call) => call.description)).not.toContain(description);
});

Then(/^the call "([^"]+)" reads the date "([^"]+)"$/, async (description: string, day: string) => {
  const row = (await listedCalls()).find((call) => call.description === description);
  if (!row) throw new Error(`The page lists no call reading "${description}"`);
  expect(row.reads).toBe(formatDate(dayFromNow(day)));
});

Then(/^the activity "([^"]+)" is listed as "([^"]+)"$/, async (description: string, category: string) => {
  expect((await listedActivities()).map((row) => `${row.category}|${row.description}`)).toContain(
    `${category}|${description}`,
  );
});

Then(/^the activity "([^"]+)" is not listed$/, async (description: string) => {
  expect((await listedActivities()).map((row) => row.description)).not.toContain(description);
});

Then(/^the activity "([^"]+)" reads the date "([^"]+)"$/, async (description: string, day: string) => {
  const row = (await listedActivities()).find((candidate) => candidate.description === description);
  if (!row) throw new Error(`The page lists no activity reading "${description}"`);
  expect(row.reads).toBe(formatDate(dayFromNow(day)));
});

Then('both calls are listed', async () => {
  expect(await listedCalls()).toHaveLength(2);
});

Then('both activities are listed', async () => {
  expect(await listedActivities()).toHaveLength(2);
});

Then('no calls are listed', async () => {
  await $(`${CALLS} [data-testid="calls-empty"]`).waitForExist({ timeout: 5_000 });
});

Then('no activities are listed', async () => {
  await $(`${ACTIVITIES} [data-testid="activities-empty"]`).waitForExist({ timeout: 5_000 });
});

Then('last called reads "never"', async () => {
  expect(await lineReads(`${CALLS} [data-testid="last-called"]`)).toBe('Last called: never');
});

Then(/^last called reads the date "([^"]+)"$/, async (day: string) => {
  expect(await lineReads(`${CALLS} [data-testid="last-called"]`)).toBe(`Last called: ${formatDate(dayFromNow(day))}`);
});

Then('last activity together reads "never"', async () => {
  expect(await lineReads(`${ACTIVITIES} [data-testid="last-activity"]`)).toBe('Last activity together: never');
});

Then(/^last activity together reads the date "([^"]+)"$/, async (day: string) => {
  expect(await lineReads(`${ACTIVITIES} [data-testid="last-activity"]`)).toBe(
    `Last activity together: ${formatDate(dayFromNow(day))}`,
  );
});
