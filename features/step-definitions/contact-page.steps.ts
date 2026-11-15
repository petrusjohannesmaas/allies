import { Given, Then, When } from '@wdio/cucumber-framework';
import { contactValue, insertContact } from './data';
import { openCardEditor, selectContact, typeInto } from './helpers';

const NOTES = '[data-testid="notes"]';

/** The notes the page lists, in the order it shows them. */
async function listedNotes(): Promise<{ body: string; favourite: boolean }[]> {
  return browser.execute((selector) => {
    return [...document.querySelectorAll(`${selector} [data-testid="note"]`)].map((note) => ({
      body: note.querySelector('[data-testid="note-text"]')?.textContent ?? '',
      favourite: note.getAttribute('data-favourite') === 'true',
    }));
  }, NOTES);
}

/** Clicks a button inside the note that reads `body`. */
async function clickNoteButton(body: string, testId: string) {
  await openCardEditor('notes');
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

When(/^I select the contact "([^"]+)"$/, async (name: string) => {
  await selectContact(name);
});

Given(/^I open the contact "([^"]+)"$/, async (name: string) => {
  await $('aside[data-testid="sidebar"] nav[aria-label="Screens"] button:nth-child(2)').click();
  await selectContact(name);
});

When(/^I write the note "([^"]+)"$/, async (body: string) => {
  await openCardEditor('notes');
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

Then(/^the contact page shows "((?!Born )[^"]+)"$/, async (name: string) => {
  const shown = await browser.execute(() => document.querySelector('[data-testid="contact-name"]')?.textContent?.trim());
  expect(shown).toBe(name);
});

Then(/^the contact page shows the category "([^"]+)"$/, async (category: string) => {
  const shown = await browser.execute(() => document.querySelector('[data-testid="contact-category"]')?.textContent?.trim());
  expect(shown).toBe(category);
});

Then(/^the contact page shows "(Born [^"]+)"$/, async (text: string) => {
  const shown = await browser.execute(() => document.querySelector('[data-testid="contact-birthday"]')?.textContent?.trim());
  expect(shown).toBe(text);
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

Given(/^a contact named "([^"]+)" exists with the email "([^"]+)"$/, async (name: string, email: string) => {
  const [firstName, lastName = ''] = name.split(' ');
  insertContact({ email, firstName, lastName: lastName || undefined });
});

async function headerText(testId: string): Promise<string> {
  return browser.execute(
    (wanted) => document.querySelector(`[data-testid="contact-header"] [data-testid="${wanted}"]`)?.textContent?.trim() ?? '',
    testId,
  );
}

Then(/^the contact page shows the email "([^"]+)"$/, async (email: string) => {
  expect(await headerText('contact-email')).toBe(email);
});

Then(/^the contact page shows the phone "([^"]+)"$/, async (phone: string) => {
  expect(await headerText('contact-phone')).toBe(phone);
});

Then(/^the contact page shows the tag "([^"]+)"$/, async (tag: string) => {
  await $(`[data-testid="contact-header"] [data-testid="contact-tag"][data-tag="${tag}"]`).waitForExist({ timeout: 5_000 });
});

When(/^the window is (\d+) px wide$/, async (width: string) => {
  await browser.setWindowSize(Number(width), 800);
  // The page's own width is what the layout reads, not the window's frame.
  await browser.waitUntil(async () => (await browser.execute(() => window.innerWidth)) === Number(width), {
    timeout: 5_000,
    timeoutMsg: `The page never became ${width} px wide`,
  });
});

const CARD_IDS: Record<string, string> = {
  About: 'about',
  Notes: 'notes',
  'Phone calls': 'calls',
  Activities: 'activities',
  Address: 'addresses',
  Reminders: 'reminders',
};

Then(
  /^the cards are in the order (.+), two to a row$/,
  async (order: string) => {
    const names = order.split(', ');
    const boxes = await browser.execute(
      (ids) =>
        ids.map((id) => {
          const box = document.querySelector(`[data-testid="screen-contact"] [data-testid="${id}"]`)!.getBoundingClientRect();
          return { x: Math.round(box.left), y: Math.round(box.top) };
        }),
      names.map((name) => CARD_IDS[name]),
    );

    boxes.forEach((box, index) => {
      // Rows of two: both cards of a row share a top edge, the left one is further left, and each row is lower than the last.
      const first = index - (index % 2);
      expect(box.y).toBe(boxes[first].y);
      if (index % 2 === 1) expect(box.x).toBeGreaterThan(boxes[first].x);
      if (index >= 2) expect(box.y).toBeGreaterThan(boxes[index - 2].y);
    });
  },
);

Then('the Missions box is at the right of the header', async () => {
  const gap = await browser.execute(() => {
    const box = document.querySelector('[data-testid="contact-header"] [data-testid="missions"]')!;
    const row = box.parentElement!;
    const inner = row.getBoundingClientRect().right - parseFloat(getComputedStyle(row).paddingRight);
    return inner - box.getBoundingClientRect().right;
  });
  expect(Math.abs(gap)).toBeLessThanOrEqual(2);
});
