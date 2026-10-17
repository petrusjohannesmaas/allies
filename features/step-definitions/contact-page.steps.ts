import { Given, Then, When } from '@wdio/cucumber-framework';
import { contactValue } from './data';
import { setFieldValue, typeInto } from './helpers';

const CONTACT_PAGE = '[data-testid="screen-contact"]';
const NOTES = '[data-testid="notes"]';
const MISSIONS = '[data-testid="missions"]';

/** The notes the page lists, in the order it shows them. */
async function listedNotes(): Promise<{ body: string; favourite: boolean }[]> {
  return browser.execute((selector) => {
    return [...document.querySelectorAll(`${selector} [data-testid="note"]`)].map((note) => ({
      body: note.querySelector('[data-testid="note-text"]')?.textContent ?? '',
      favourite: note.getAttribute('data-favourite') === 'true',
    }));
  }, NOTES);
}

/** The missions the page lists, in the order it shows them. */
async function listedMissions(): Promise<{ description: string; due: string }[]> {
  return browser.execute((selector) => {
    return [...document.querySelectorAll(`${selector} [data-testid="mission"]`)].map((mission) => ({
      description: mission.querySelector('[data-testid="mission-text"]')?.textContent ?? '',
      due: mission.querySelector('[data-testid="mission-due"]')?.textContent ?? '',
    }));
  }, MISSIONS);
}

/** Clicks a button inside the note that reads `body`. */
async function clickNoteButton(body: string, testId: string) {
  const clicked = await browser.execute(
    (selector, wanted, button) => {
      const notes = [...document.querySelectorAll(`${selector} [data-testid="note"]`)];
      const note = notes.find((candidate) => candidate.querySelector('[data-testid="note-text"]')?.textContent === wanted);
      if (!note) return false;
      (note.querySelector(`[data-testid="${button}"]`) as HTMLButtonElement).click();
      return true;
    },
    NOTES,
    body,
    testId,
  );
  if (!clicked) throw new Error(`No note reading "${body}" on the page`);
}

async function selectContact(name: string) {
  const row = $(`[data-testid="contact-row"][data-contact-name="${name}"] [data-testid="open-contact"]`);
  await row.waitForExist({ timeout: 5_000 });
  await row.click();
  await $(`${CONTACT_PAGE} [data-testid="contact-header"]`).waitForExist({ timeout: 5_000 });
}

When(/^I select the contact "([^"]+)"$/, async (name: string) => {
  await selectContact(name);
});

Given(/^I open the contact "([^"]+)"$/, async (name: string) => {
  await $('[data-testid="top-bar"] nav[aria-label="Screens"] button:nth-child(2)').click();
  await selectContact(name);
});

When(/^I write the note "([^"]+)"$/, async (body: string) => {
  await typeInto(`${NOTES} [data-testid="note-body"]`, body);
  await $(`${NOTES} [data-testid="save-note"]`).click();
  await browser.waitUntil(async () => (await listedNotes()).some((note) => note.body === body), {
    timeout: 5_000,
    timeoutMsg: 'The note never showed up on the page',
  });
});

When(/^I mark the note "([^"]+)" as a favourite$/, async (body: string) => {
  await clickNoteButton(body, 'favourite-note');
  await browser.waitUntil(async () => (await listedNotes()).some((note) => note.body === body && note.favourite), {
    timeout: 5_000,
    timeoutMsg: 'The note never became a favourite',
  });
});

When(/^I edit the note "([^"]+)" to "([^"]+)"$/, async (from: string, to: string) => {
  await clickNoteButton(from, 'edit-note');
  await typeInto(`${NOTES} [data-testid="edit-note-body"]`, to);
  await $(`${NOTES} [data-testid="save-edited-note"]`).click();
  await browser.waitUntil(async () => (await listedNotes()).some((note) => note.body === to), {
    timeout: 5_000,
    timeoutMsg: `The note never became "${to}"`,
  });
});

When(/^I delete the note "([^"]+)"$/, async (body: string) => {
  await clickNoteButton(body, 'delete-note');
  await browser.waitUntil(async () => !(await listedNotes()).some((note) => note.body === body), {
    timeout: 5_000,
    timeoutMsg: 'The note stayed on the page',
  });
});

When(/^I add the mission "([^"]+)" due (\d{4}-\d{2}-\d{2})$/, async (description: string, due: string) => {
  await typeInto(`${MISSIONS} [data-testid="mission-description"]`, description);
  await setFieldValue(`${MISSIONS} [data-testid="mission-due-date"]`, due);
  await $(`${MISSIONS} [data-testid="save-mission"]`).click();
  await browser.waitUntil(async () => (await listedMissions()).some((mission) => mission.description === description), {
    timeout: 5_000,
    timeoutMsg: 'The mission never showed up on the page',
  });
});

When(/^I delete the mission "([^"]+)"$/, async (description: string) => {
  const clicked = await browser.execute(
    (selector, wanted) => {
      const missions = [...document.querySelectorAll(`${selector} [data-testid="mission"]`)];
      const mission = missions.find((candidate) => candidate.querySelector('[data-testid="mission-text"]')?.textContent === wanted);
      if (!mission) return false;
      (mission.querySelector('[data-testid="delete-mission"]') as HTMLButtonElement).click();
      return true;
    },
    MISSIONS,
    description,
  );
  if (!clicked) throw new Error(`No mission reading "${description}" on the page`);

  await browser.waitUntil(async () => !(await listedMissions()).some((mission) => mission.description === description), {
    timeout: 5_000,
    timeoutMsg: 'The mission stayed on the page',
  });
});

Then(/^the contact page shows "([^"]+)"$/, async (name: string) => {
  const shown = await browser.execute(() => document.querySelector('[data-testid="contact-name"]')?.textContent?.trim());
  expect(shown).toBe(name);
});

Then(/^the contact page shows the category "([^"]+)"$/, async (category: string) => {
  const shown = await browser.execute(() => document.querySelector('[data-testid="contact-category"]')?.textContent?.trim());
  expect(shown).toBe(category);
});

Then(/^the contact "([^"]+)" counts as recently viewed$/, async (name: string) => {
  await browser.waitUntil(async () => Boolean(contactValue(name, 'last_viewed_at')), {
    timeout: 5_000,
    timeoutMsg: `${name} never got a last viewed time`,
  });
});

Then(/^the note "([^"]+)" is listed$/, async (body: string) => {
  expect((await listedNotes()).map((note) => note.body)).toContain(body);
});

Then(/^the note "([^"]+)" is not listed$/, async (body: string) => {
  expect((await listedNotes()).map((note) => note.body)).not.toContain(body);
});

Then(/^the note "([^"]+)" is a favourite$/, async (body: string) => {
  const note = (await listedNotes()).find((candidate) => candidate.body === body);
  if (!note) throw new Error(`No note reading "${body}"`);
  expect(note.favourite).toBe(true);
});

Then(/^the note "([^"]+)" is not a favourite$/, async (body: string) => {
  const note = (await listedNotes()).find((candidate) => candidate.body === body);
  if (!note) throw new Error(`No note reading "${body}"`);
  expect(note.favourite).toBe(false);
});

Then('no notes are listed', async () => {
  await $(`${NOTES} [data-testid="notes-empty"]`).waitForExist({ timeout: 5_000 });
});

Then(/^the mission "([^"]+)" is listed$/, async (description: string) => {
  expect((await listedMissions()).map((mission) => mission.description)).toContain(description);
});

Then(/^the mission "([^"]+)" is due (\d{4}-\d{2}-\d{2})$/, async (description: string, due: string) => {
  const mission = (await listedMissions()).find((candidate) => candidate.description === description);
  if (!mission) throw new Error(`No mission reading "${description}"`);
  expect(mission.due).toBe(`Due ${due}`);
});

Then('no missions are listed', async () => {
  await $(`${MISSIONS} [data-testid="missions-empty"]`).waitForExist({ timeout: 5_000 });
});