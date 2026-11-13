import { After, Given, Then, When } from '@wdio/cucumber-framework';

const SIDEBAR = 'aside[data-testid="sidebar"]';

// The accent fills the Appearance screen reads back are the ones the page sets
// on <html>, so the steps read them there.
const ACCENT_FILLS: Record<string, string> = { Blue: '#2576d5', Purple: '#9141ac' };

async function dataTheme(): Promise<string | undefined> {
  return browser.execute(() => document.documentElement.dataset.theme);
}

// A save is pending while <html> says so. The wait keeps a restart from
// cutting the write off.
async function waitForSave() {
  await browser.waitUntil(
    async () => (await browser.execute(() => document.documentElement.dataset.settingsSaving)) !== 'true',
    { timeout: 5_000, timeoutMsg: 'The settings were still saving' },
  );
}

async function openAppearance() {
  await $(`${SIDEBAR} [data-testid="sidebar-footer"] button=Appearance`).click();
  await $('[data-testid="screen-appearance"]').waitForExist({ timeout: 5_000 });
}

async function chooseTheme(name: string) {
  await browser.execute((label) => {
    const radios = [...document.querySelectorAll<HTMLInputElement>('[data-testid="screen-appearance"] input[type="radio"]')];
    const match = radios.find((radio) => radio.closest('label')?.textContent?.trim() === label);
    if (!match) throw new Error(`No theme option named "${label}"`);
    match.click();
  }, name);
}

async function pickAccent(name: string) {
  await $(`[data-testid="screen-appearance"] button[aria-label="${name}"]`).click();
}

Given('the app is in Light', async () => {
  await openAppearance();
  await chooseTheme('Light');
  await browser.waitUntil(async () => (await dataTheme()) === 'light', {
    timeout: 5_000,
    timeoutMsg: 'The app did not switch to Light',
  });
  await waitForSave();
});

When('I open Appearance', async () => {
  await openAppearance();
});

When(/^I choose the (Light|Dark|System) theme$/, async (name: string) => {
  await chooseTheme(name);
});

When(/^I pick the (\w+) accent$/, async (name: string) => {
  await pickAccent(name);
  await waitForSave();
});

When('I press the theme button', async () => {
  await $(`${SIDEBAR} [data-testid="sidebar-theme"]`).click();
  await waitForSave();
});

Then('the app is in Dark', async () => {
  await browser.waitUntil(async () => (await dataTheme()) === 'dark', {
    timeout: 10_000,
    timeoutMsg: 'The app is not in Dark',
  });
});

Then(/^the app has the (\w+) accent$/, async (name: string) => {
  const fill = ACCENT_FILLS[name];
  if (!fill) throw new Error(`No fill is known for ${name}`);
  await browser.waitUntil(
    async () => (await browser.execute(() => document.documentElement.style.getPropertyValue('--accent-bg'))) === fill,
    { timeout: 10_000, timeoutMsg: `The accent is not ${name}` },
  );
});

// The saved settings outlive a scenario, so a scenario that changed them puts
// the defaults back for the ones after it.
After({ tags: '@appearance' }, async () => {
  try {
    await openAppearance();
    await chooseTheme('System');
    await pickAccent('Blue');
    await waitForSave();
  } catch {
    // The app may be closed, and the next scenario starts it again.
  }
});
