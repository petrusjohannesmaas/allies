import { Given, Then, When } from '@wdio/cucumber-framework';
import { formatDate, today } from '../../src/lib/dates';
import { clickRow, contactRows, resizeWindow, textOf } from './helpers';
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


const LIST = '[data-testid="contacts-list"]';
const PAGER = '[data-testid="pager"]';
let remembered: string[] = [];
let rememberedSize = 0;
let rememberedPages = 0;

async function pager(): Promise<{ page: number; pages: number }> {
  const text = await browser.execute((selector) => document.querySelector(selector)?.textContent?.trim() ?? '', PAGER);
  const [page, pages] = text.split('/').map((part) => Number(part.trim()));
  return { page, pages };
}

async function waitForPage(wanted: (page: number, pages: number) => boolean, message: string) {
  await browser.waitUntil(
    async () => {
      const { page, pages } = await pager();
      return wanted(page, pages);
    },
    { timeout: 5_000, timeoutMsg: `${message}, the pager reads ${JSON.stringify(await pager())}` },
  );
}

When(/^the window (?:is|grows to) (\d+) by (\d+)$/, async (width: string, height: string) => {
  await resizeWindow(Number(width), Number(height));
});

When('I click Add contact', async () => {
  await $('[data-testid="add-contact"]').click();
  await $('[data-testid="contact-form"]').waitForExist({ timeout: 5_000 });
});

When('I cancel the contact form', async () => {
  await $('[data-testid="cancel-contact"]').click();
  await $(PAGER).waitForExist({ timeout: 5_000 });
});

When('I click Next page', async () => {
  await $('button[aria-label="Next page"]').click();
});

// Home opens on the page of a random contact, so a scenario that needs the first one goes there.
When('I go to the first page', async () => {
  for (let { page } = await pager(); page > 1; page--) {
    await $('button[aria-label="Previous page"]').click();
    await waitForPage((now) => now === page - 1, `The pager never reached page ${page - 1}`);
  }
});

When('I go to the last page', async () => {
  const { page: first, pages } = await pager();
  for (let step = first; step < pages; step++) {
    await $('button[aria-label="Next page"]').click();
    await waitForPage((page) => page === step + 1, `The pager never reached page ${step + 1}`);
  }
});

When('I remember the rows', async () => {
  remembered = await contactRows();
});

When('I remember the page size', async () => {
  rememberedSize = (await contactRows()).length;
  rememberedPages = (await pager()).pages;
});

When('I click the first row on the page', async () => {
  await clickRow((await contactRows())[0]);
});

Then(/^the pager reads page (\d+) of more than one$/, async (wanted: string) => {
  await waitForPage((page, pages) => page === Number(wanted) && pages > 1, `The pager never read page ${wanted} of more than one`);
});

Then(/^the pager reads page (\d+)$/, async (wanted: string) => {
  await waitForPage((page) => page === Number(wanted), `The pager never read page ${wanted}`);
});

Then('the pager reads the last page', async () => {
  await waitForPage((page, pages) => pages > 1 && page === pages, 'The pager never reached the last page');
});

Then(/^the row "([^"]+)" is highlighted$/, async (name: string) => {
  await $(`[data-testid="contact-row"][data-contact-name="${name}"][aria-current="true"]`).waitForExist({
    timeout: 5_000,
    timeoutMsg: `The row "${name}" is not highlighted`,
  });
});

Then(/^the (Previous|Next) page button is disabled$/, async (which: string) => {
  const button = $(`button[aria-label="${which} page"]`);
  await browser.waitUntil(async () => !(await button.isEnabled()), { timeout: 5_000, timeoutMsg: `${which} page is enabled` });
});

Then('the rows are different', async () => {
  const rows = await contactRows();
  expect(rows.length).toBeGreaterThan(0);
  expect(rows.some((name) => remembered.includes(name))).toBe(false);
});

Then('the first row on the page is highlighted', async () => {
  await browser.waitUntil(async () => (await $(`${LIST} [data-testid="contact-row"]`).getAttribute('aria-current')) === 'true', {
    timeout: 5_000,
    timeoutMsg: 'The first row on the page is not highlighted',
  });
});

// After a resize the list measures again and re-pages, so the check waits for that.
Then('the list does not scroll', async () => {
  const measure = () =>
    browser.execute((selector) => {
      const list = document.querySelector(selector) as HTMLElement;
      return { scroll: list.scrollHeight, client: list.clientHeight };
    }, LIST);
  await browser.waitUntil(async () => {
    const sizes = await measure();
    return sizes.scroll <= sizes.client;
  }, { timeout: 5_000, timeoutMsg: `The list scrolls: ${JSON.stringify(await measure())}` });
});

Then('the page holds more rows', async () => {
  await browser.waitUntil(async () => (await contactRows()).length > rememberedSize, {
    timeout: 5_000,
    timeoutMsg: `The page holds ${(await contactRows()).length} rows, it held ${rememberedSize}`,
  });
});

Then('the page count is the same or lower', async () => {
  const { pages } = await pager();
  expect(rememberedPages).toBeGreaterThan(1);
  expect(pages).toBeLessThanOrEqual(rememberedPages);
});

Then(/^the row "([^"]+)" is on screen$/, async (name: string) => {
  const row = await $(`[data-testid="contact-row"][data-contact-name="${name}"]`);
  await row.waitForExist({ timeout: 5_000 });
  const inside = await browser.execute((element) => {
    const box = (element as unknown as HTMLElement).getBoundingClientRect();
    return box.top >= 0 && box.bottom <= window.innerHeight;
  }, row);
  expect(inside).toBe(true);
});

Then('the page has no horizontal scroll', async () => {
  const sizes = await browser.execute(() => {
    const panel = document.querySelector('[data-testid="content-panel"]') as HTMLElement;
    return { scroll: panel.scrollWidth, client: panel.clientWidth };
  });
  expect(sizes.scroll).toBeLessThanOrEqual(sizes.client);
});

async function panelBox() {
  return browser.execute(() => {
    const panel = document.querySelector('[data-testid="contact-panel"]') as HTMLElement | null;
    const area = panel;
    return {
      found: panel !== null,
      bottom: area?.getBoundingClientRect().bottom ?? 0,
      height: window.innerHeight,
      width: window.innerWidth,
      areaScroll: area?.scrollHeight ?? 0,
      areaClient: area?.clientHeight ?? 0,
    };
  });
}

Then('the panel fits inside the window', async () => {
  await browser.waitUntil(async () => {
    const box = await panelBox();
    return box.found && box.bottom <= box.height;
  }, { timeout: 5_000, timeoutMsg: `The bottom of the panel is outside the window: ${JSON.stringify(await panelBox())}` });
});

Then('the panel scrolls inside itself', async () => {
  await browser.waitUntil(
    async () =>
      browser.execute(() => {
        const area = document.querySelector('[data-testid="contact-panel"]') as HTMLElement | null;
        return area !== null && area.scrollHeight > area.clientHeight;
      }),
    { timeout: 5_000, timeoutMsg: 'The panel does not scroll inside itself' },
  );
});

Then('the page does not scroll', async () => {
  const sizes = await browser.execute(() => {
    const panel = document.querySelector('[data-testid="content-panel"]') as HTMLElement;
    return { scroll: panel.scrollHeight, client: panel.clientHeight };
  });
  expect(sizes.scroll).toBeLessThanOrEqual(sizes.client);
});

Then('the whole panel shows', async () => {
  await browser.waitUntil(
    async () =>
      browser.execute(() => {
        const area = document.querySelector('[data-testid="contact-panel"]') as HTMLElement | null;
        return area !== null && area.scrollHeight <= area.clientHeight;
      }),
    { timeout: 5_000, timeoutMsg: `The panel scrolls inside itself: ${JSON.stringify(await panelBox())}` },
  );
});

Then('the panel shows the name of the highlighted row', async () => {
  const name = await browser.execute(
    (selector) => document.querySelector(`${selector} [data-testid="contact-row"][aria-current="true"]`)?.getAttribute('data-contact-name') ?? '',
    LIST,
  );
  expect(name).not.toBe('');
  expect(await panelName()).toBe(name);
});
