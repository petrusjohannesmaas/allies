import { readFileSync } from 'node:fs';
import { basename, resolve } from 'node:path';
import { Then, When } from '@wdio/cucumber-framework';
import { contactValue, pictureFiles } from './data';

const FIELD = '[data-testid="contact-form"] [data-testid="contact-picture"]';
const PORTRAIT = resolve(process.cwd(), 'features/fixtures/portrait.png');

When('I choose the portrait fixture as the picture', async () => {
  const field = await $(FIELD);
  await field.waitForDisplayed({ timeout: 5_000 });

  // The embedded WebDriver server has no way to send a file from disk, so the
  // step reads features/fixtures/portrait.png itself and puts those exact
  // bytes on the input. The form reads the file the same way it would after
  // the webview's own file chooser.
  await browser.execute(
    (selector, name, base64) => {
      const binary = atob(base64);
      const bytes = new Uint8Array(binary.length);
      for (let index = 0; index < binary.length; index++) bytes[index] = binary.charCodeAt(index);

      const input = document.querySelector(selector) as HTMLInputElement;
      const transfer = new DataTransfer();
      transfer.items.add(new File([bytes], name, { type: 'image/png' }));
      input.files = transfer.files;
      input.dispatchEvent(new Event('change', { bubbles: true }));
    },
    FIELD,
    basename(PORTRAIT),
    readFileSync(PORTRAIT).toString('base64'),
  );

  await $('[data-testid="picture-preview"]').waitForExist({ timeout: 5_000 });
});

Then(/^the pictures folder holds (\d+) files?$/, async (count: string) => {
  const files = pictureFiles();
  if (files.length !== Number(count)) {
    throw new Error(`The pictures folder holds ${files.length} file(s): ${files.join(', ') || 'none'}`);
  }
});

Then(/^the contact "([^"]+)" has a picture$/, async (name: string) => {
  if (!contactValue(name, 'picture')) throw new Error(`${name} has no picture in the database`);
});

Then(/^the contact "([^"]+)" has no picture$/, async (name: string) => {
  if (contactValue(name, 'picture')) throw new Error(`${name} still has a picture in the database`);
});

Then(/^the contact "([^"]+)" shows the picture$/, async (name: string) => {
  await $(`[data-testid="contact-row"][data-contact-name="${name}"] [data-testid="avatar-picture"]`).waitForExist({
    timeout: 5_000,
  });
});