# Allies design

Allies is a desktop app for one person on one machine. It keeps contacts, what the user did with them, dates to remember and a journal. Monica 1.6.0 is the reference for structure.

## Stack

- Tauri 2 with a plain Vite and Svelte 5 frontend (runes only, no SvelteKit), Tailwind 4, `@lucide/svelte` and Geist bundled through `@fontsource-variable/geist`. Target is Debian 13.
- SQLite through `tauri-plugin-sql` (sqlx). Profile pictures go through `tauri-plugin-fs`. The app has no settings, so it does not use `tauri-plugin-store`.
- The app makes no network request. `tauri.conf.json` sets a content security policy that allows only the app's own origin, `blob:` images and Tauri's IPC. It also allows inline styles, because the avatar sets its size in a `style` attribute.
- Package and binary name `allies`, product name Allies, identifier `privatelink.allies`. The identifier never changes, because the data folder follows it.

## Layout

```
src/
  main.ts                 mounts App
  App.svelte              top bar with the search box, and the open screen
  app.css                 Tailwind, colour variables, focus ring
  lib/platform.ts         the only file that imports @tauri-apps/*
  lib/db.ts               the Db interface (select, execute) and the plugin-backed Db
  lib/dates.ts            date strings, adding months, the upcoming-dates function
  lib/navigation.svelte.ts  the open screen and the open contact
  lib/categories.ts       the eight contact categories
  lib/activity-categories.ts  the activity categories
  lib/contact-validation.ts  the contact form rules
  lib/repo/               one module per table group: contacts, notes, calls and so on
  screens/                Dashboard, Contacts, Contact, Mission, Journal
  components/             shared pieces
  test/                   Vitest setup, the node:sqlite Db used by data tests
features/                 Gherkin files, with step definitions in features/step-definitions/
scripts/install-desktop.sh  npm run desktop:install
vite.config.ts            Vite, the Tailwind and Svelte plugins, and the Vitest settings
svelte.config.js          Svelte compiler settings
wdio.conf.ts              the WebdriverIO configuration
src-tauri/
  migrations/*.sql        the schema, one file per version
  src/lib.rs              plugins and the migration list
  capabilities/           default.json, and wdio.json for end-to-end builds only
  tauri.conf.json
  tauri.wdio.json         merged into end-to-end builds only
```

## Screens

The window has a top bar with a search box and five screens: dashboard, contacts, contact, mission and journal. The top bar has buttons for dashboard, contacts and journal. A contact opens from the contacts list, search or the dashboard, and a mission opens from its contact's page. `navigation.svelte.ts` holds the open screen, the open contact id and the open mission id. There is no router and no settings screen.

The contact page follows the sketch in `preview.webp`. A header holds the picture, name, category, email, phone, birthday and tags, with the Missions box on its right. Below it a grid of cards, two columns from 768 px wide and one below, holds About, Notes, Phone calls, Activities, Address and Reminders in that order. About holds significant other, children, how they met, work and food preferences.

Every block on the contact and mission screens uses `EditableCard.svelte`. It is read-only until its pencil is clicked. A field block (the header, About, the mission details) shows Save only once a value differs, and the pencil again, Cancel, Escape or leaving the page discards the draft without asking. A list card in edit mode shows its add form and row controls, and each of those saves at once. The tick box on a task works without edit mode.

Contact and activity categories are stored in lower case and shown through `labelFor()` in `lib/categories.ts`, which capitalises the first letter.

## Data

Foreign keys are on. Every table has an integer `id` primary key unless stated.

| Table | Columns and rules |
|---|---|
| `contacts` | `category` (one of family, friend, colleague, acquaintance, mentor, community, stranger, online), `first_name` (required), `last_name`, `email`, `phone`, `birthday`, `picture` (file name), `significant_other_id` (contact, set to null when that contact is deleted), `how_met`, `work`, `food_preferences`, `last_viewed_at`, `created_at` |
| `notes` | `contact_id`, `body`, `is_favourite`, `created_at`, `updated_at` |
| `addresses` | `contact_id`, `street`, `city`, `postal_code`, `country`, `is_home`. A partial unique index allows one home address per contact. |
| `contact_children` | `parent_id` and `child_id`, both contacts, primary key on the pair, and a check that they differ |
| `contact_tags` | `contact_id` and `tag`, primary key on the pair |
| `missions` | `contact_id`, `description`, `due_date` |
| `tasks` | `mission_id`, `description`, `is_done`, `position`. Deleted with their mission. No unique index on `position`, for the reason in the home-address decision below. |
| `calls` | `contact_id`, `called_on`, `description` |
| `activities` | `contact_id`, `category`, `happened_on`, `description` |
| `reminders` | `contact_id`, `remind_on`, `description`, `repeats_yearly` |
| `journal_entries` | `entry_date`, `body`, `created_at` |
| `day_ratings` | `day` as the primary key, `face` from 1 (sad) to 3 (happy) |

Every table that has a `contact_id` deletes its rows with the contact (`ON DELETE CASCADE`). `contact_children` deletes the pair when either contact goes.

The `contact_header` and `contact_about` views each have an `INSTEAD OF UPDATE` trigger. Saving the header writes the contact row and replaces its tags from a JSON array. Saving About writes the profile text and significant other and replaces the children from a JSON array of ids. Each save is one `UPDATE` on the view, so it succeeds or fails as a whole.

The `journal` view lists the journal as one set of rows with `kind` (`entry`, `rating`, `activity` or `call`), `source_id`, `day`, `body`, `face` and `contact_id`. Activities and calls appear in the view without a stored copy, so deleting one removes its journal row and deleting a contact removes theirs.

The plugin pools connections, and a pooled call can use a different connection each time. A transaction across calls is not safe. Each user action must therefore be one SQL statement, which is why cascades and the view do the multi-table work.

A migration that has run on the user's machine is never edited. A change is a new, higher-numbered file in `src-tauri/migrations/`, because sqlx refuses a database whose applied migration has changed.

## Data location

The plugin resolves a SQLite path against the app's config folder, not the data folder. Everything therefore lives in `~/.config/privatelink.allies/`: `allies.db` and the `pictures/` folder. `scripts/install-desktop.sh` backs up that folder. End-to-end builds set `XDG_CONFIG_HOME` to a temporary folder, so a test run never touches the real data.

## Dates

A date is a local-time string `YYYY-MM-DD`, and `lib/dates.ts` is the only code that does date arithmetic. Every function that needs today takes it as an argument, so tests fix the date.

- The upcoming window runs from today to the same day of the month three months later, both days included. When that month is shorter, the last day of that month ends the window.
- A birthday or yearly reminder shows on its next date on or after today. A 29 February date falls on 28 February in a year with no 29 February.
- The dashboard groups upcoming dates by month and sorts them by date.

## Pictures

The contact form reads the chosen file from an `<input type="file">` and writes it to `pictures/<contact id>-<time>.<extension>` through `tauri-plugin-fs`. The capability allows read, write and remove only inside `$APPCONFIG/pictures/**`. The screen reads the file and shows it through a `blob:` URL, so the asset protocol stays off. A replaced or deleted picture's file is removed.

## Testing

| Layer | Tool and command |
|---|---|
| Rust | `cargo test --manifest-path src-tauri/Cargo.toml` |
| Frontend and data | `npm test` (Vitest, jsdom, `mockIPC`). Data tests run the real migration files on an in-memory `node:sqlite` database behind the same `Db` interface. |
| Types | `npm run check` |
| End to end | `npm run test:e2e`. WebdriverIO with `@wdio/tauri-service` and Cucumber against a debug build, headless under `xvfb-run -a`. Restart scenarios relaunch the app themselves through `launchApp()` and wait up to 60 s for it. |

Scenario dates are computed from today in the step definitions, so no scenario needs a fake clock. WebdriverIO packages stay on 9.x.

## Decisions

- 16 October 2026. SQLite through `tauri-plugin-sql`, not the store plugin. A contact owns about a dozen kinds of related rows, and the app needs joins, cascades and date filters.
- 16 October 2026. The identifier is `privatelink.allies`, with no `com.` prefix, so the app claims no domain.
- 16 October 2026. All user data lives in the config folder, because the SQL plugin puts the database there. One folder keeps backup and restore to one step.
- 16 October 2026. The journal is a view over four sources, not a copy kept in step by code.
- 16 October 2026. Marking the home address is two statements, not the single `UPDATE ... SET is_home = (id = $1)` the index seems to allow. SQLite checks the one-home-address index row by row as it updates, so one statement that moves the mark onto an earlier row collides with the row it has not cleared yet. Each statement commits on its own, so a failure on the second leaves the contact with no home address.
- 16 October 2026. Where a detail is not settled elsewhere, the app matches Monica 1.6.0.
- 10 November 2026. The sketch in `preview.webp` is the reference for the contact page and the mission screen, ahead of Monica.
- 10 November 2026. A contact has one phone number with no label. Migration 0002 kept each contact's first number and dropped `phone_numbers`.
- 10 November 2026. A save that writes more than one table goes through a view with an `INSTEAD OF UPDATE` trigger, so it stays one statement under the pooled-connection rule.
- 10 November 2026. Tasks move with up and down buttons, not drag and drop. `moveTask` swaps positions with the neighbour in one `UPDATE`.
- 11 November 2026. Creating a contact with tags is two statements: the `INSERT` into `contacts`, then the save through `contact_header`, the same way a new contact's picture is already saved after its row. The tags need the new contact's id, and SQLite's `last_insert_rowid()` reverts to its old value once an `INSTEAD OF INSERT` trigger on a view ends, so a single insert through the view cannot hand that id back. If the second statement fails, the contact is saved without its tags and the user can add them from the header.
