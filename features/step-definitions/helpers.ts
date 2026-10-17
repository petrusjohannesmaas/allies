export const CONTACTS_SCREEN = '[data-testid="screen-contacts"]';

// Native date inputs take a value the driver cannot type into, so the field is
// set from the page and sent the change event the screen listens for.
export async function setFieldValue(selector: string, value: string) {
  const field = await $(selector);
  await field.waitForDisplayed({ timeout: 5_000 });
  await browser.execute(
    (element, next) => {
      const input = element as unknown as HTMLInputElement;
      input.value = next;
      input.dispatchEvent(new Event('input', { bubbles: true }));
      input.dispatchEvent(new Event('change', { bubbles: true }));
    },
    field,
    value,
  );
}

export async function typeInto(selector: string, value: string) {
  const field = await $(selector);
  await field.waitForDisplayed({ timeout: 5_000 });
  await field.click();
  await field.setValue(value);
}

// The driver's own option click does not always send the change event the
// screen listens for, so the value is set and the event sent.
export async function chooseOption(selector: string, text: string) {
  const field = await $(selector);
  await field.waitForDisplayed({ timeout: 5_000 });
  const found = await browser.execute(
    (element, wanted) => {
      const select = element as unknown as HTMLSelectElement;
      const option = [...select.options].find((candidate) => candidate.textContent?.trim() === wanted);
      if (!option) return false;
      select.value = option.value;
      select.dispatchEvent(new Event('change', { bubbles: true }));
      return true;
    },
    field,
    text,
  );
  if (!found) throw new Error(`No option "${text}" in the dropdown`);
}

export async function textOf(selector: string): Promise<string> {
  const element = await $(selector);
  await element.waitForExist({ timeout: 5_000 });
  return (await element.getText()).trim();
}

/** The rows of the contacts list, each with its data-contact-name. */
export async function contactRows(): Promise<string[]> {
  return browser.execute(() =>
    [...document.querySelectorAll('[data-testid="contact-row"]')].map((row) => row.getAttribute('data-contact-name') ?? ''),
  );
}

/**
 * "today", "yesterday", "tomorrow", "3 days ago" or "in 10 days" as a
 * YYYY-MM-DD string, so a scenario can say how long ago or how long ahead
 * something happens without fixing the day it runs on.
 */
export function dayFromNow(phrase: string): string {
  const when = new Date();
  const ago = /^(\d+) days? ago$/.exec(phrase);
  const ahead = /^in (\d+) days?$/.exec(phrase);
  if (ago) when.setDate(when.getDate() - Number(ago[1]));
  else if (ahead) when.setDate(when.getDate() + Number(ahead[1]));
  else if (phrase === 'yesterday') when.setDate(when.getDate() - 1);
  else if (phrase === 'tomorrow') when.setDate(when.getDate() + 1);
  else if (phrase !== 'today') throw new Error(`No step reads the date "${phrase}"`);
  return when.toLocaleDateString('en-CA');
}