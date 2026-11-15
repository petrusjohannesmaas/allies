import { Given, Then, When } from '@wdio/cucumber-framework';
import { appIsClosed, configDir, launchApp, restartApp } from './app';

const SIDEBAR = 'aside[data-testid="sidebar"]';

// The reload gives the app a clean start without the cost of relaunching it,
// which the WebDriver server inside the app makes impossible. The marker tells
// the old page from the new one.
// The step recovers when an earlier scenario left no working session: it
// relaunches an app that is gone and reloads the session of one that is up.
Given('the app has just started', { timeout: 180_000 }, async () => {
  if (await appIsClosed()) {
    await launchApp();
  }
  const markOldPage = () =>
    browser.execute(() => {
      (window as unknown as { __alliesOldPage?: boolean }).__alliesOldPage = true;
      setTimeout(() => location.reload(), 0);
    });
  try {
    await markOldPage();
  } catch (error) {
    if (!String(error).includes('invalid session id')) throw error;
    await browser.reloadSession();
    await markOldPage();
  }
  await browser.waitUntil(
    async () => {
      try {
        return await browser.execute(
          () =>
            !(window as unknown as { __alliesOldPage?: boolean }).__alliesOldPage &&
            document.querySelector('aside[data-testid="sidebar"]') !== null,
        );
      } catch {
        return false; // The page is between documents.
      }
    },
    { timeout: 20_000, interval: 100, timeoutMsg: 'The sidebar did not come back after reloading' },
  );
});

When(/^I open the "([^"]+)" screen$/, async (label: string) => {
  await browser.execute((sidebar, name) => {
    const buttons = [...document.querySelectorAll(`${sidebar} nav[aria-label="Screens"] button`)];
    const match = buttons.find((b) => b.textContent?.trim() === name);
    if (!match) throw new Error(`No button named "${name}" in the sidebar`);
    (match as HTMLButtonElement).click();
  }, SIDEBAR, label);
  await browser.waitUntil(
    async () => (await browser.execute((sidebar) => document.querySelectorAll(`${sidebar} button[aria-current="page"]`).length, SIDEBAR)) === 1,
    { timeout: 5_000, timeoutMsg: `The "${label}" screen did not open` },
  );
});

Then('the search box is at the top of the sidebar', async () => {
  const box = await $('input[data-testid="search-box"]');
  await box.waitForExist({ timeout: 5_000 });

  const placement = await browser.execute((sidebar, selector) => {
    const field = document.querySelector(selector);
    const bar = document.querySelector(sidebar);
    if (!field || !bar) return null;
    const fieldBox = field.getBoundingClientRect();
    const barBox = bar.getBoundingClientRect();
    return {
      insideSidebar: fieldBox.top >= barBox.top && fieldBox.bottom <= barBox.bottom,
      atTop: fieldBox.top < window.innerHeight / 2,
      label: field.getAttribute('aria-label'),
    };
  }, SIDEBAR, 'input[data-testid="search-box"]');

  expect(placement).not.toBeNull();
  expect(placement?.insideSidebar).toBe(true);
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

When('I close and reopen the app', { timeout: 120_000 }, async () => {
  await restartApp();
});