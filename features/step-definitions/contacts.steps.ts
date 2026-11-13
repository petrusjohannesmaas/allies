import { Given, Then, When } from '@wdio/cucumber-framework';
import { CATEGORIES, labelFor } from '../../src/lib/categories';
import { chooseOption, contactRows, openCardEditor, selectContact, setFieldValue, textOf, typeInto } from './helpers';
import { contactValue, countRows, insertContact } from './data';

const FORM = '[data-testid="contact-form"]';
const LIST = `${'[data-testid="screen-contacts"]'} [data-testid="contacts-list"]`;

async function openTheForm() {
  await $('[data-testid="add-contact"]').click();
  await $(FORM).waitForExist({ timeout: 5_000 });
}

Given('a contact named {string} exists', async (name: string) => {
  const [firstName, lastName = ''] = name.split(' ');
  insertContact({ firstName, lastName: lastName || undefined });
});

Given(
  /^a contact named "([^"]+)" exists with the category "([^"]+)" and the birthday (\d{4}-\d{2}-\d{2})$/,
  async (name: string, category: string, birthday: string) => {
    const [firstName, lastName = ''] = name.split(' ');
    insertContact({ category, birthday, firstName, lastName: lastName || undefined });
  },
);

Given(/^a contact named "([^"]+)" exists with the category "([^"]+)"$/, async (name: string, category: string) => {
  const [firstName, lastName = ''] = name.split(' ');
  insertContact({ category, firstName, lastName: lastName || undefined });
});

When('I add a contact', async () => {
  await openTheForm();
});

When(/^I fill in the first name "([^"]+)"$/, async (value: string) => {
  await typeInto(`${FORM} [data-testid="contact-first-name"]`, value);
});

When(/^I fill in the last name "([^"]+)"$/, async (value: string) => {
  await typeInto(`${FORM} [data-testid="contact-last-name"]`, value);
});

When(/^I fill in "([^"]*)" as the email$/, async (value: string) => {
  await typeInto(`${FORM} [data-testid="contact-email"]`, value);
});

When(/^I choose "([^"]+)" as the category$/, async (value: string) => {
  await chooseOption(`${FORM} [data-testid="contact-category"]`, labelFor(value));
});

When(/^I set the birthday to (\d{4}-\d{2}-\d{2})$/, async (value: string) => {
  await setFieldValue(`${FORM} [data-testid="contact-birthday"]`, value);
});

When('I save the contact', saveTheContact);

async function saveTheContact() {
  await $(`${FORM} [data-testid="save-contact"]`).click();
  // Saving either closes the form or leaves it open with a message under the
  // field that stopped it, so the wait covers both.
  await browser.waitUntil(
    async () => (await $(FORM).isExisting()) === false || (await $('[data-testid^="error-"]').isExisting()) === true,
    { timeout: 5_000, timeoutMsg: 'Saving neither closed the form nor showed a message' },
  );
}

When(/^I edit the contact "([^"]+)"$/, async (name: string) => {
  // The pencil on the contact page is the only way to edit, so a step that
  // starts on the Contacts list first opens the contact.
  if (!(await $('[data-testid="screen-contact"]').isExisting())) await selectContact(name);
  await openCardEditor('contact-header');
});

When(/^I fill in "([^"]*)" as the phone$/, async (value: string) => {
  await typeInto(`${FORM} [data-testid="contact-phone"]`, value);
});

When(/^I fill in the tags "([^"]*)"$/, async (value: string) => {
  await typeInto(`${FORM} [data-testid="contact-tags"]`, value);
});

When(/^I add the phone number "([^"]+)"$/, async (number: string) => {
  await openCardEditor('contact-header');
  await typeInto(`${FORM} [data-testid="contact-phone"]`, number);
  await saveTheContact();
});

When(/^I add the tag "([^"]+)"$/, async (tag: string) => {
  await openCardEditor('contact-header');
  const field = `${FORM} [data-testid="contact-tags"]`;
  const current = (await $(field).getValue()).trim();
  await typeInto(field, current === '' ? tag : `${current}, ${tag}`);
  await saveTheContact();
});

When(/^I delete the contact "([^"]+)"$/, async (name: string) => {
  await browser.execute((wanted) => {
    const rows = [...document.querySelectorAll('[data-testid="contact-row"]')];
    const row = rows.find((candidate) => candidate.getAttribute('data-contact-name') === wanted);
    if (!row) throw new Error(`No contact named "${wanted}"`);
    (row.querySelector('[data-testid="delete-contact"]') as HTMLButtonElement).click();
  }, name);
  await $('[data-testid="confirm-delete"]').waitForExist({ timeout: 5_000 });
});

When('I confirm the deletion', async () => {
  await $('[data-testid="confirm-delete"]').click();
  await $('[data-testid="confirm-delete"]').waitForExist({ reverse: true, timeout: 5_000 });
});

When('I cancel the deletion', async () => {
  await $('[data-testid="cancel-delete"]').click();
  await $('[data-testid="cancel-delete"]').waitForExist({ reverse: true, timeout: 5_000 });
});

Then('the contacts list has no Edit button', async () => {
  expect(await $('[data-testid="edit-contact"]').isExisting()).toBe(false);
  expect(await $('[data-testid="screen-contacts"] [data-testid="contact-row"] [data-testid="delete-contact"]').isExisting()).toBe(true);
});

Then('the contacts list is empty', async () => {
  await $('[data-testid="contacts-empty"]').waitForExist({ timeout: 5_000 });
  expect(await $(LIST).isExisting()).toBe(false);
});

Then(/^the contacts list shows "([^"]+)"$/, async (name: string) => {
  await browser.waitUntil(async () => (await contactRows()).includes(name), {
    timeout: 5_000,
    timeoutMsg: `The contacts list holds: ${(await contactRows()).join(', ')}`,
  });
});

Then(/^the contacts list does not show "([^"]+)"$/, async (name: string) => {
  expect(await contactRows()).not.toContain(name);
});

Then(/^the contact "([^"]+)" has the category "([^"]+)"$/, async (name: string, category: string) => {
  const row = `[data-testid="contact-row"][data-contact-name="${name}"]`;
  await $(row).waitForExist({ timeout: 5_000 });

  expect(await textOf(row)).toContain(labelFor(category));
  expect(contactValue(name, 'category')).toBe(category);
});

Then(/^the contact "([^"]+)" has the email "([^"]+)"$/, async (name: string, email: string) => {
  expect(contactValue(name, 'email')).toBe(email);
});

Then(/^the contact "([^"]+)" has the birthday (\d{4}-\d{2}-\d{2})$/, async (name: string, birthday: string) => {
  expect(contactValue(name, 'birthday')).toBe(birthday);
});

Then('the form says the first name is required', async () => {
  await $('[data-testid="error-first-name"]').waitForExist({ timeout: 5_000 });
});

Then('the form says the email is not valid', async () => {
  await $('[data-testid="error-email"]').waitForExist({ timeout: 5_000 });
});

Then(
  'the category picker offers family, friend, colleague, acquaintance, mentor, community, stranger and online',
  async () => {
    const offered = await browser.execute((selector) => {
      const select = document.querySelector(selector) as HTMLSelectElement;
      return [...select.options].map((option) => option.textContent?.trim() ?? '');
    }, `${FORM} [data-testid="contact-category"]`);

    expect(offered).toEqual(CATEGORIES.map(labelFor));
  },
);

Then('the contacts list has one row', async () => {
  expect((await contactRows()).length).toBe(1);
});

Then(/^the database holds (\d+) contacts?$/, async (count: string) => {
  expect(countRows('contacts')).toBe(Number(count));
});