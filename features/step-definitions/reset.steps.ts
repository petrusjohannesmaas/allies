import { Before } from '@wdio/cucumber-framework';
import { emptyDatabase } from './data';

// Every scenario starts from an empty database, the way a first run on a machine
// where the app has never run does. A scenario that needs data sets it up
// itself, so it never depends on what the one before it left behind.
Before(async () => {
  emptyDatabase();
});