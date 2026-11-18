import { Given, Then, When } from '@wdio/cucumber-framework';
import { formatDate, today } from '../../src/lib/dates';
import { clickRow, textOf } from './helpers';
import { insertContact, insertHomeAddress, insertNote, setContactValue } from './data';

const PANEL = '[data-testid="contact-panel"]';

/** "5 minutes ago" and "3 hours ago" as an ISO time, so a scenario never depends on when it runs. */
function timeFromNow(phrase: string): string {
  const match = /^(\d+) (minute|hour|day)s? ago$/.exec(phrase);
  if (!match) throw new Error(`No step reads the time "${phrase}"`);
  const unit = { minute: 60_000, hour: 3_600_000, day: 86_400_000 }[match[2] as 'minute' | 'hour' | 'day'];
  return new Date(Date.now() - Number(match[1]) * unit).toISOString();
}

Given(
  /^a contact named "([^"]+)" was last viewed "([^"]+)"(?: with the email "([^"]+)")?$/,
  async (name: string, when: string, email?: string) => {
    const [firstName, lastName = ''] = name.split(' ');
    insertContact({ firstName, lastName: lastName || undefined, email, lastViewedAt: timeFromNow(when) });
  },
);

Given(/^the contact "([^"]+)" has been given the email "([^"]+)"$/, async (name: string, email: string) => {
  setContactValue(name, 'email', email);
});

Given(/^the contact "([^"]+)" has been given the phone "([^"]+)"$/, async (name: string, phone: string) => {
  setContactValue(name, 'phone', phone);
});

Given(/^the contact "([^"]+)" has been given a home address in "([^"]+)", "([^"]+)"$/, async (name: string, city: string, country: string) => {
  insertHomeAddress(name, city, country);
});

Given(/^the contact "([^"]+)" has been given the favourite note "([^"]+)"$/, async (name: string, body: string) => {
  insertNote(name, body, true);
});

When(/^I click the row "([^"]+)"$/, async (name: string) => {
  await clickRow(name);
});

When('I click View full profile', async () => {
  await $(`${PANEL} [data-testid="view-full-profile"]`).click();
  await $('[data-testid="screen-contact"] [data-testid="contact-header"]').waitForExist({ timeout: 5_000 });
});

When(/^I click "All contacts"$/, async () => {
  await $('[data-testid="back-to-contacts"]').click();
  await $('[data-testid="screen-home"]').waitForExist({ timeout: 5_000 });
});

async function panelName(): Promise<string> {
  return browser.execute(() => document.querySelector('[data-testid="panel-name"]')?.textContent?.trim() ?? '');
}

Then(/^the panel shows one of "([^"]+)" or "([^"]+)"$/, async (first: string, second: string) => {
  await browser.waitUntil(async () => [first, second].includes(await panelName()), {
    timeout: 5_000,
    timeoutMsg: `The panel shows "${await panelName()}"`,
  });
});

Then('the row of the contact in the panel is highlighted', async () => {
  const name = await panelName();
  await $(`[data-testid="contact-row"][data-contact-name="${name}"][aria-current="true"]`).waitForExist({ timeout: 5_000 });
});

Then(/^the panel shows the name "([^"]+)"$/, async (name: string) => {
  await browser.waitUntil(async () => (await panelName()) === name, {
    timeout: 5_000,
    timeoutMsg: `The panel shows "${await panelName()}", not "${name}"`,
  });
});

Then(/^the panel shows the pill "([^"]+)"$/, async (label: string) => {
  expect(await textOf('[data-testid="panel-category"]')).toBe(label);
});

Then(/^the panel shows "Joined" with today's date$/, async () => {
  await browser.waitUntil(async () => (await textOf(PANEL)).includes('Joined') && (await textOf(PANEL)).includes(formatDate(today())), {
    timeout: 5_000,
    timeoutMsg: 'The panel does not show Joined with today',
  });
});

Then(/^the panel shows "([^"]+)"$/, async (text: string) => {
  await browser.waitUntil(async () => (await textOf(PANEL)).includes(text), {
    timeout: 5_000,
    timeoutMsg: `The panel reads: ${await textOf(PANEL)}`,
  });
});

Then(/^the rows read (.+)$/, async (quoted: string) => {
  const expected = [...quoted.matchAll(/"([^"]+)"/g)].map((match) => match[1]);
  await browser.waitUntil(
    async () => {
      const rows = await browser.execute(() =>
        [...document.querySelectorAll('[data-testid="contact-row"]')].map((row) => row.getAttribute('data-contact-name') ?? ''),
      );
      return JSON.stringify(rows) === JSON.stringify(expected);
    },
    { timeout: 5_000, timeoutMsg: `The rows are not ${expected.join(', ')}` },
  );
});

async function rowPart(name: string, part: 'time' | 'email'): Promise<string> {
  return browser.execute(
    (wanted, testid) =>
      document
        .querySelector(`[data-testid="contact-row"][data-contact-name="${wanted}"] [data-testid="${testid}"]`)
        ?.textContent?.trim() ?? '',
    name,
    `contact-row-${part}`,
  );
}

Then(/^the row "([^"]+)" reads "([^"]+)" and "([^"]+)"$/, async (name: string, time: string, email: string) => {
  await browser.waitUntil(async () => (await rowPart(name, 'time')) === time && (await rowPart(name, 'email')) === email, {
    timeout: 5_000,
    timeoutMsg: `The row reads "${await rowPart(name, 'time')}" and "${await rowPart(name, 'email')}"`,
  });
});

Then(/^the row "([^"]+)" reads "([^"]+)"$/, async (name: string, time: string) => {
  await browser.waitUntil(async () => (await rowPart(name, 'time')) === time, {
    timeout: 5_000,
    timeoutMsg: `The row reads "${await rowPart(name, 'time')}"`,
  });
});

Then(/^the row "([^"]+)" shows no time$/, async (name: string) => {
  await $(`[data-testid="contact-row"][data-contact-name="${name}"]`).waitForExist({ timeout: 5_000 });
  expect(await rowPart(name, 'time')).toBe('');
});
