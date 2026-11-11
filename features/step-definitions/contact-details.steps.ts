import { Then, When } from '@wdio/cucumber-framework';
import { chooseOption, openCardEditor, setFieldValue, typeInto } from './helpers';

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

When(/^I add the address "([^"]+)" in "([^"]+)"$/, async (street: string, city: string) => {
  await openCardEditor('addresses');
  await typeInto(`${PAGE} [data-testid="addresses"] [data-testid="address-street"]`, street);
  await typeInto(`${PAGE} [data-testid="addresses"] [data-testid="address-city"]`, city);
  await $(`${PAGE} [data-testid="addresses"] [data-testid="save-address"]`).click();
  await browser.waitUntil(async () =>
    (await rowsOf('addresses', 'address', 'address-text')).some((row) => row.startsWith(`${street}, ${city}`)),
  { timeout: 5_000, timeoutMsg: 'The address never showed up on the page' });
});

When(/^I make "([^"]+)" the home address$/, async (street: string) => {
  await openCardEditor('addresses');
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

const ABOUT = `${PAGE} [data-testid="about"]`;

When(/^I add "([^"]+)" as a child$/, async (name: string) => {
  await openCardEditor('about');
  await chooseOption(`${ABOUT} [data-testid="child-picker"]`, name);
  await $(`${ABOUT} [data-testid="add-child"]`).click();
  await $(`${ABOUT} [data-testid="child"][data-child-name="${name}"]`).waitForExist({ timeout: 5_000 });
});

Then(/^the child "([^"]+)" is listed$/, async (name: string) => {
  await $(`${ABOUT} [data-testid="child"][data-child-name="${name}"]`).waitForExist({ timeout: 5_000 });
});

When(/^I choose "([^"]+)" as the significant other$/, async (name: string) => {
  await openCardEditor('about');
  await chooseOption(`${ABOUT} [data-testid="partner-picker"]`, name);
});

When('I save About', async () => {
  await $(`${ABOUT} [data-testid="save-profile"]`).click();
  // Saving closes the editor, so the form goes and the reading comes back.
  await $(`${ABOUT} [data-testid="profile-form"]`).waitForExist({ timeout: 5_000, reverse: true });
});

Then('no children are listed', async () => {
  await browser.waitUntil(async () => (await sectionText('about', 'children')).includes('Children not set'), { timeout: 5_000 });
});

Then('no significant other is listed', async () => {
  await browser.waitUntil(async () => (await sectionText('about', 'significant-other')).includes('Significant other not set'), {
    timeout: 5_000,
  });
});

Then(/^About reads "([^"]+)"$/, async (text: string) => {
  await browser.waitUntil(async () => ((await $(ABOUT).getText()) ?? '').includes(text), {
    timeout: 5_000,
    timeoutMsg: `About never read "${text}"`,
  });
});

Then(/^the significant other is "([^"]+)"$/, async (name: string) => {
  await $(`${ABOUT} [data-testid="open-partner"]`).waitForExist({ timeout: 5_000 });
  const shown = await sectionText('about', 'open-partner');
  if (shown !== name) throw new Error(`The significant other reads "${shown}"`);
});

const PROFILE_FIELDS = [
  { step: /^I record how they met "([^"]*)"$/, testId: 'how-met', reads: 'how they met reads' },
  { step: /^I record their work "([^"]*)"$/, testId: 'work', reads: 'their work reads' },
  { step: /^I record their food preferences "([^"]*)"$/, testId: 'food-preferences', reads: 'their food preferences read' },
];

for (const field of PROFILE_FIELDS) {
  // The fields fill in About's form. Nothing is saved until "I save About".
  When(field.step, async (value: string) => {
    await openCardEditor('about');
    await setFieldValue(`${ABOUT} [data-testid="${field.testId}-input"]`, value);
  });

  Then(new RegExp(`^${field.reads} "([^"]*)"$`), async (value: string) => {
    const selector = `${ABOUT} [data-testid="${field.testId}"]`;
    await $(selector).waitForExist({ timeout: 5_000 });
    const shown = await sectionText('about', field.testId);
    if (shown !== value) throw new Error(`The page reads "${shown}"`);
  });
}
