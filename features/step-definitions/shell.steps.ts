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

// The sidebar's buttons are icons, named by their aria-label.
// The sidebar's buttons are icons, named by their aria-label.
When(/^I open the "([^"]+)" screen$/, async (label: string) => {
  await $(`${SIDEBAR} button[aria-label="${label}"]`).click();
  await browser.waitUntil(
    async () => (await $(`${SIDEBAR} button[aria-label="${label}"]`).getAttribute('aria-current')) === 'page',
    { timeout: 5_000, timeoutMsg: `The "${label}" screen did not open` },
  );
});

// Interactions shows the journal until its own screen is built.
const SCREENS: Record<string, string> = {
  Home: 'screen-home',
  Missions: 'screen-missions',
  Interactions: 'screen-journal',
  Calendar: 'screen-calendar',
  Settings: 'settings-page',
};

Then(/^the "([^"]+)" screen is open$/, async (label: string) => {
  const testId = SCREENS[label];
  if (!testId) throw new Error(`No screen is known as "${label}"`);
  await $(`[data-testid="${testId}"]`).waitForExist({ timeout: 5_000 });
});

Then('the search box is in the Home header', async () => {
  const box = await $('[data-testid="home-header"] input[data-testid="search-box"]');
  await box.waitForExist({ timeout: 5_000 });
  expect(await box.getAttribute('aria-label')).toBe('Search contacts');
});

Then('the Log out button is disabled', async () => {
  const button = await $(`${SIDEBAR} [data-testid="sidebar-logout"]`);
  expect(await button.getAttribute('aria-disabled')).toBe('true');
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