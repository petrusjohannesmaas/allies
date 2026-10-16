import { Given, Then, When } from '@wdio/cucumber-framework';
import { formatMonth } from '../../src/lib/dates';
import { dayFromNow } from './helpers';
import { insertContact } from './data';

const DASHBOARD = '[data-testid="screen-dashboard"]';

/** The upcoming dates the dashboard lists, each with its day, kind, contact and what it says. */
async function listedDates(): Promise<{ day: string; kind: string; contact: string; says: string }[]> {
  return browser.execute(
    (selector) =>
      [...document.querySelectorAll(`${selector} [data-testid="upcoming-date"]`)].map((row) => ({
        day: row.getAttribute('data-day') ?? '',
        kind: row.getAttribute('data-kind') ?? '',
        contact: row.getAttribute('data-contact-name') ?? '',
        says: row.querySelector('[data-testid="upcoming-date-description"]')?.textContent ?? '',
      })),
    DASHBOARD,
  );
}

/** The names on the recently viewed row, in the order the dashboard shows them. */
async function recentContacts(): Promise<string[]> {
  return browser.execute(
    (selector) =>
      [...document.querySelectorAll(`${selector} [data-testid="recent-contact"]`)].map(
        (row) => row.getAttribute('data-contact-name') ?? '',
      ),
    DASHBOARD,
  );
}

async function sectionText(testId: string): Promise<string> {
  const element = await $(`${DASHBOARD} [data-testid="${testId}"]`);
  await element.waitForExist({ timeout: 5_000 });
  return element.getText();
}

async function waitForListed(predicate: () => boolean | Promise<boolean>, message: string) {
  await browser.waitUntil(predicate, { timeout: 5_000, timeoutMsg: message });
}

Given(/^a contact named "([^"]+)" has the birthday "([^"]+)"$/, async (name: string, when: string) => {
  const [firstName, lastName = ''] = name.split(' ');
  insertContact({ firstName, lastName: lastName || undefined, birthday: dayFromNow(when) });
});

Then(/^the dashboard shows (\d+) contacts?$/, async (count: string) => {
  await waitForListed(
    async () => (await sectionText('count-contacts')).includes(`${count} Contacts`),
    'The contact count never read the expected number',
  );
});

Then(/^the dashboard shows (\d+) calls and activities$/, async (count: string) => {
  await waitForListed(
    async () => (await sectionText('count-interactions')).includes(`${count} Calls and activities`),
    'The call and activity count never read the expected number',
  );
});

Then('no upcoming dates are listed', async () => {
  await $(`${DASHBOARD} [data-testid="upcoming-empty"]`).waitForExist({ timeout: 5_000 });
});

Then('no recently viewed contacts are listed', async () => {
  await $(`${DASHBOARD} [data-testid="recent-empty"]`).waitForExist({ timeout: 5_000 });
});

// Each positive step waits for the list to arrive, so the steps after it read a
// dashboard that has finished loading rather than the one still filling in.
Then(/^the birthday for "([^"]+)" is listed on "([^"]+)"$/, async (name: string, when: string) => {
  const wanted = dayFromNow(when);
  await waitForListed(
    async () =>
      (await listedDates()).some((date) => date.kind === 'birthday' && date.contact === name && date.day === wanted),
    `The birthday for "${name}" never showed up on ${wanted}`,
  );
});

Then(/^no birthday is listed for "([^"]+)"$/, async (name: string) => {
  expect((await listedDates()).filter((date) => date.kind === 'birthday' && date.contact === name)).toEqual([]);
});

Then(/^the reminder "([^"]+)" for "([^"]+)" is listed on "([^"]+)"$/, async (
  description: string,
  name: string,
  when: string,
) => {
  const wanted = dayFromNow(when);
  await waitForListed(
    async () =>
      (await listedDates()).some(
        (date) => date.kind === 'reminder' && date.contact === name && date.says === description && date.day === wanted,
      ),
    `The reminder "${description}" never showed up on ${wanted}`,
  );
});

Then('the upcoming dates are listed in date order under their own months', async () => {
  const rows = await browser.execute(
    (selector) =>
      [...document.querySelectorAll(`${selector} [data-testid="upcoming-month"], ${selector} [data-testid="upcoming-date"]`)].map(
        (element) => ({
          month: element.getAttribute('data-testid') === 'upcoming-month' ? element.textContent?.trim() ?? '' : null,
          day: element.getAttribute('data-day') ?? '',
        }),
      ),
    DASHBOARD,
  );

  let heading = '';
  let previous = '';
  const days: string[] = [];
  for (const row of rows) {
    if (row.month !== null) {
      heading = row.month;
      continue;
    }
    // The heading above a date has to be the month that date falls in, and the
    // dates have to come in order.
    expect(formatMonth(row.day.slice(0, 7))).toBe(heading);
    expect(row.day >= previous).toBe(true);
    previous = row.day;
    days.push(row.day);
  }

  expect(days).toEqual((await listedDates()).map((date) => date.day));
  expect(days.length).toBeGreaterThan(0);
});

Then(/^the recently viewed contacts are "([^"]+)", "([^"]+)" and "([^"]+)"$/, async (
  first: string,
  second: string,
  third: string,
) => {
  await waitForListed(
    async () => (await recentContacts()).length === 3,
    'The recently viewed row never showed three contacts',
  );
  expect(await recentContacts()).toEqual([first, second, third]);
});

Then(/^the recently viewed list does not show "([^"]+)"$/, async (name: string) => {
  expect(await recentContacts()).not.toContain(name);
});

When(/^I select the recently viewed contact "([^"]+)"$/, async (name: string) => {
  const clicked = await browser.execute(
    (selector, wanted) => {
      const row = [...document.querySelectorAll(`${selector} [data-testid="recent-contact"]`)].find(
        (candidate) => candidate.getAttribute('data-contact-name') === wanted,
      );
      if (!row) return false;
      (row.querySelector('[data-testid="open-recent-contact"]') as HTMLButtonElement).click();
      return true;
    },
    DASHBOARD,
    name,
  );
  if (!clicked) throw new Error(`No recently viewed contact named "${name}"`);

  await $('[data-testid="screen-contact"]').waitForExist({ timeout: 5_000 });
});
