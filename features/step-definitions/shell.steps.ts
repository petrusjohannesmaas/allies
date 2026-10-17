import { Given, Then, When } from '@wdio/cucumber-framework';
import { configDir, restartApp } from './app';

const TOP_BAR = 'header[data-testid="top-bar"]';

// The reload gives the app a clean start without the cost of relaunching it,
// which the WebDriver server inside the app makes impossible. The marker tells
// the old page from the new one.
Given('the app has just started', async () => {
  await browser.execute(() => {
    (window as unknown as { __alliesOldPage?: boolean }).__alliesOldPage = true;
    setTimeout(() => location.reload(), 0);
  });
  await browser.waitUntil(
    async () => {
      try {
        return await browser.execute(
          () =>
            !(window as unknown as { __alliesOldPage?: boolean }).__alliesOldPage &&
            document.querySelector('header[data-testid="top-bar"]') !== null,
        );
      } catch {
        return false; // The page is between documents.
      }
    },
    { timeout: 20_000, interval: 100, timeoutMsg: 'The top bar did not come back after reloading' },
  );
});

When(/^I open the "([^"]+)" screen$/, async (label: string) => {
  await browser.execute((topBar, name) => {
    const buttons = [...document.querySelectorAll(`${topBar} nav[aria-label="Screens"] button`)];
    const match = buttons.find((b) => b.textContent?.trim() === name);
    if (!match) throw new Error(`No button named "${name}" in the top bar`);
    (match as HTMLButtonElement).click();
  }, TOP_BAR, label);
  await browser.waitUntil(
    async () => (await browser.execute((topBar) => document.querySelectorAll(`${topBar} button[aria-current="page"]`).length, TOP_BAR)) === 1,
    { timeout: 5_000, timeoutMsg: `The "${label}" screen did not open` },
  );
});

Then('the search box is at the top of the window', async () => {
  const box = await $('input[data-testid="search-box"]');
  await box.waitForExist({ timeout: 5_000 });

  const placement = await browser.execute((topBar, selector) => {
    const field = document.querySelector(selector);
    const bar = document.querySelector(topBar);
    if (!field || !bar) return null;
    const fieldBox = field.getBoundingClientRect();
    const barBox = bar.getBoundingClientRect();
    return {
      insideBar: fieldBox.top >= barBox.top && fieldBox.bottom <= barBox.bottom,
      atTop: fieldBox.top < window.innerHeight / 2,
      label: field.getAttribute('aria-label'),
    };
  }, TOP_BAR, 'input[data-testid="search-box"]');

  expect(placement).not.toBeNull();
  expect(placement?.insideBar).toBe(true);
  expect(placement?.atTop).toBe(true);
  expect(placement?.label).toBe('Search contacts');
});

Then(/^the "([^"]+)" screen is open$/, async (label: string) => {
  const testId = `screen-${label.toLowerCase()}`;
  await $(`[data-testid="${testId}"]`).waitForExist({ timeout: 5_000 });
});

// The runner points XDG_CONFIG_HOME at a folder it made, so a run writes its
// database and pictures there instead of in the user's real config folder.
Then('the app is pointed at a temporary config folder', async () => {
  const folder = configDir();
  expect(folder).toContain('allies-e2e-');
  expect(folder).not.toContain(`${process.env.HOME}/.config`);
});

When('I close and reopen the app', async () => {
  await restartApp();
});