import { Before } from '@wdio/cucumber-framework';
import { emptyDatabase } from './data';
import { resizeWindow } from './helpers';

// Every scenario starts from an empty database, the way a first run on a machine
// where the app has never run does. A scenario that needs data sets it up
// itself, so it never depends on what the one before it left behind.
Before(async () => {
  emptyDatabase();
});

// A scenario may resize the window, so every scenario starts at the default size.
Before(async () => {
  await resizeWindow(1280, 800);
});
