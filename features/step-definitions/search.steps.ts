import { Then, When } from '@wdio/cucumber-framework';

const SEARCH_BOX = 'aside[data-testid="sidebar"] [data-testid="search-box"]';

async function searchResults(): Promise<string[]> {
  return browser.execute(() =>
    [...document.querySelectorAll('[data-testid="search-result"]')].map(
      (result) => result.getAttribute('data-contact-name') ?? '',
    ),
  );
}

/**
 * The results as they stand once the last keystroke's query has answered. Each
 * keystroke runs a query, so the list is read only after two reads in a row
 * agree.
 */
async function settledResults(): Promise<string[]> {
  let previous: string | null = null;
  await browser.waitUntil(
    async () => {
      const current = JSON.stringify(await searchResults());
      const settled = current === previous;
      previous = current;
      return settled;
    },
    { timeout: 5_000, interval: 100, timeoutMsg: 'The search results never settled' },
  );
  return searchResults();
}

When(/^I type "([^"]*)" in the search box$/, async (text: string) => {
  const field = await $(SEARCH_BOX);
  await field.waitForDisplayed({ timeout: 5_000 });
  // The box ends up holding exactly this text, whether or not it held
  // something before.
  await field.clearValue();
  await field.click();
  for (const character of text) await browser.keys(character);
});

When(/^I choose the search result "([^"]+)"$/, async (name: string) => {
  await settledResults();
  await $(`[data-testid="search-result"][data-contact-name="${name}"]`).click();
  await $('[data-testid="search-results"]').waitForExist({ reverse: true, timeout: 5_000 });
});

Then(/^the search shows "([^"]+)"$/, async (name: string) => {
  const results = await settledResults();
  if (!results.includes(name)) throw new Error(`The search holds: ${results.join(', ') || 'nothing'}`);
});

Then(/^the search does not show "([^"]+)"$/, async (name: string) => {
  expect(await settledResults()).not.toContain(name);
});

Then(/^the search says "([^"]+)"$/, async (message: string) => {
  await settledResults();
  const element = await $('[data-testid="search-empty"]');
  await element.waitForExist({ timeout: 5_000 });
  expect((await element.getText()).trim()).toBe(message);
});