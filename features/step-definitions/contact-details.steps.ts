import { Then, When } from '@wdio/cucumber-framework';
import { chooseOption, setFieldValue, typeInto } from './helpers';

const PAGE = '[data-testid="screen-contact"]';

/** Every row of one list on the contact page, as its reading text. */
async function rowsOf(section: string, item: string, field: string): Promise<string[]> {
  return browser.execute(
    (root, group, testId, valueField) =>
      [...document.querySelectorAll(`${root} [data-testid="${group}"] [data-testid="${testId}"]`)].map(
        (row) => row.querySelector(`[data-testid="${valueField}"]`)?.textContent ?? '',
      ),
    PAGE,
    section,
    item,
    field,
  );
}

async function sectionText(section: string, testId: string): Promise<string> {
  return browser.execute(
    (root, group, wanted) => document.querySelector(`${root} [data-testid="${group}"] [data-testid="${wanted}"]`)?.textContent?.trim() ?? '',
    PAGE,
    section,
    testId,
  );
}

When(/^I add the phone number "([^"]+)" "([^"]*)"$/, async (label: string, number: string) => {
  await typeInto(`${PAGE} [data-testid="phones"] [data-testid="phone-label"]`, label);
  await typeInto(`${PAGE} [data-testid="phones"] [data-testid="phone-number"]`, number);
  await $(`${PAGE} [data-testid="phones"] [data-testid="save-phone"]`).click();
  await browser.waitUntil(async () => (await rowsOf('phones', 'phone', 'phone-number-value')).includes(number), {
    timeout: 5_000,
    timeoutMsg: 'The phone number never showed up on the page',
  });
});

Then(/^the phone "([^"]+)" is listed as "([^"]+)"$/, async (number: string, label: string) => {
  const listed = await browser.execute(
    (root) =>
      [...document.querySelectorAll(`${root} [data-testid="phone"]`)].map(
        (row) =>
          `${row.querySelector('[data-testid="phone-label-value"]')?.textContent ?? ''}|${row.querySelector('[data-testid="phone-number-value"]')?.textContent ?? ''}`,
      ),
    PAGE,
  );
  if (!listed.includes(`${label}|${number}`)) throw new Error(`The page lists: ${listed.join(', ')}`);
});

When(/^I add the address "([^"]+)" in "([^"]+)"$/, async (street: string, city: string) => {
  await typeInto(`${PAGE} [data-testid="addresses"] [data-testid="address-street"]`, street);
  await typeInto(`${PAGE} [data-testid="addresses"] [data-testid="address-city"]`, city);
  await $(`${PAGE} [data-testid="addresses"] [data-testid="save-address"]`).click();
  await browser.waitUntil(async () =>
    (await rowsOf('addresses', 'address', 'address-text')).some((row) => row.startsWith(`${street}, ${city}`)),
  { timeout: 5_000, timeoutMsg: 'The address never showed up on the page' });
});

When(/^I make "([^"]+)" the home address$/, async (street: string) => {
  const clicked = await browser.execute(
    (root, wanted) => {
      const row = [...document.querySelectorAll(`${root} [data-testid="address"]`)].find(
        (candidate) => candidate.getAttribute('data-street') === wanted,
      );
      if (!row) return false;
      (row.querySelector('[data-testid="home-address"]') as HTMLButtonElement).click();
      return true;
    },
    PAGE,
    street,
  );
  if (!clicked) throw new Error(`No address on "${street}" on the page`);

  await browser.waitUntil(async () => (await homeStreets()).includes(street), {
    timeout: 5_000,
    timeoutMsg: 'The home mark never moved',
  });
});

Then(/^"([^"]+)" is the home address$/, async (street: string) => {
  expect(await homeStreets()).toContain(street);
});

Then(/^"([^"]+)" is not the home address$/, async (street: string) => {
  expect(await homeStreets()).not.toContain(street);
});

Then('no address is the home address', async () => {
  expect(await homeStreets()).toEqual([]);
});

/**
 * The streets of the addresses the page marks as the home address. The row
 * carries the street on its own, so a step asks about one address and not
 * about the whole line it reads as.
 */
async function homeStreets(): Promise<string[]> {
  return browser.execute(
    (root) =>
      [...document.querySelectorAll(`${root} [data-testid="address"][data-home="true"]`)].map(
        (row) => row.getAttribute('data-street') ?? '',
      ),
    PAGE,
  );
}

When(/^I add "([^"]+)" as a child$/, async (name: string) => {
  await chooseOption(`${PAGE} [data-testid="children"] [data-testid="child-picker"]`, name);
  await $(`${PAGE} [data-testid="children"] [data-testid="save-child"]`).click();
  await $(`[data-testid="child"][data-child-name="${name}"]`).waitForExist({ timeout: 5_000 });
});

Then(/^the child "([^"]+)" is listed$/, async (name: string) => {
  await $(`[data-testid="child"][data-child-name="${name}"]`).waitForExist({ timeout: 5_000 });
});

When(/^I choose "([^"]+)" as the significant other$/, async (name: string) => {
  await chooseOption(`${PAGE} [data-testid="significant-other"] [data-testid="partner-picker"]`, name);
  await $('[data-testid="significant-other"] [data-testid="open-partner"]').waitForExist({ timeout: 5_000 });
});

Then(/^the significant other is "([^"]+)"$/, async (name: string) => {
  const shown = await sectionText('significant-other', 'open-partner');
  if (shown !== name) throw new Error(`The significant other reads "${shown}"`);
});

When(/^I add the tag "([^"]+)"$/, async (tag: string) => {
  await typeInto(`${PAGE} [data-testid="tags"] [data-testid="tag-input"]`, tag);
  await $(`${PAGE} [data-testid="tags"] [data-testid="save-tag"]`).click();
  await $(`[data-testid="tag"][data-tag="${tag}"]`).waitForExist({ timeout: 5_000 });
});

When(/^I remove the tag "([^"]+)"$/, async (tag: string) => {
  await $(`[data-testid="tag"][data-tag="${tag}"] [data-testid="remove-tag"]`).click();
  await $(`[data-testid="tag"][data-tag="${tag}"]`).waitForExist({ reverse: true, timeout: 5_000 });
});

Then(/^the tag "([^"]+)" is listed$/, async (tag: string) => {
  await $(`[data-testid="tag"][data-tag="${tag}"]`).waitForExist({ timeout: 5_000 });
});

Then(/^the tag "([^"]+)" is not listed$/, async (tag: string) => {
  expect(await $(`[data-testid="tag"][data-tag="${tag}"]`).isExisting()).toBe(false);
});

const PROFILE_FIELDS = [
  { step: /^I record how they met "([^"]*)"$/, testId: 'how-met', reads: 'how they met reads' },
  { step: /^I record their work "([^"]*)"$/, testId: 'work', reads: 'their work reads' },
  { step: /^I record their food preferences "([^"]*)"$/, testId: 'food-preferences', reads: 'their food preferences read' },
];

for (const field of PROFILE_FIELDS) {
  // The about section saves as a whole, so each field the user fills is saved
  // before the next one is typed.
  When(field.step, async (value: string) => {
    await setFieldValue(`${PAGE} [data-testid="profile"] [data-testid="${field.testId}"]`, value);
    await $(`${PAGE} [data-testid="profile"] [data-testid="save-profile"]`).click();
  });

  Then(new RegExp(`^${field.reads} "([^"]*)"$`), async (value: string) => {
    const shown = await browser.execute(
      (root, wanted) =>
        (document.querySelector(`${root} [data-testid="profile"] [data-testid="${wanted}"]`) as HTMLTextAreaElement | null)
          ?.value ?? '',
      PAGE,
      field.testId,
    );
    if (shown !== value) throw new Error(`The page reads "${shown}"`);
  });
}