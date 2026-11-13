# Allies design

Allies is a desktop app for one person on one machine. It keeps contacts, what the user did with them, dates to remember and a journal. Monica 1.6.0 is the reference for structure.

## Stack

- Tauri 2 with a plain Vite and Svelte 5 frontend (runes only, no SvelteKit), Tailwind 4, shadcn-svelte components (bits-ui, tailwind-variants), `@lucide/svelte` and Geist bundled through `@fontsource-variable/geist`. Target is Debian 13.
- SQLite through `tauri-plugin-sql` (sqlx). Profile pictures go through `tauri-plugin-fs`. The theme and accent go through `tauri-plugin-store`.
- The app makes no network request. `tauri.conf.json` sets a content security policy that allows only the app's own origin, `blob:` images and Tauri's IPC. It also allows inline styles, because the avatar sets its size in a `style` attribute.
- Package and binary name `allies`, product name Allies, identifier `privatelink.allies`. The identifier never changes, because the data folder follows it.

## Layout

```
src/
  main.ts                 loads the settings, then mounts App
  App.svelte              the sidebar and the content panel with the open screen
  assets/logo.png         the logo shown in the sidebar, cropped from LOGOS.png
  app.css                 Tailwind, the colour variables mapped to Tailwind, the focus ring
  themes/                 light.css, dark.css and index.ts
  lib/platform.ts         the only file that imports @tauri-apps/*
  lib/db.ts               the Db interface (select, execute) and the plugin-backed Db
  lib/dates.ts            date strings, adding months, the upcoming-dates function
  lib/navigation.svelte.ts  the open screen and the open contact
  lib/settings.svelte.ts  the theme and accent, applied to <html> and saved through platform.ts
  lib/accents.ts          the nine accents and the colours worked out from them
  lib/utils.ts            `cn`, used by the shadcn-svelte components
  lib/components/ui/      the shadcn-svelte components
  lib/categories.ts       the eight contact categories
  lib/activity-categories.ts  the activity categories
  lib/contact-validation.ts  the contact form rules
  lib/repo/               one module per table group: contacts, notes, calls and so on
  screens/                Dashboard, Contacts, Contact, Mission, Journal, Appearance
  components/             shared pieces, including Sidebar
  test/                   Vitest setup, the node:sqlite Db used by data tests
features/                 Gherkin files, with step definitions in features/step-definitions/
scripts/install-desktop.sh  npm run desktop:install
vite.config.ts            Vite, the Tailwind and Svelte plugins, and the Vitest settings
svelte.config.js          Svelte compiler settings
wdio.conf.ts              the WebdriverIO configuration
src-tauri/
  icons/                  generated from assets/logo.png with `tauri icon`
  migrations/*.sql        the schema, one file per version
  src/lib.rs              plugins and the migration list
  capabilities/           default.json, and wdio.json for end-to-end builds only
  tauri.conf.json
  tauri.wdio.json         merged into end-to-end builds only
```

## Screens

The window has a sidebar on the left and a content panel with six screens: dashboard, contacts, contact, mission, journal and appearance. The sidebar is about 240 px wide and filled with the accent. From the top it holds the logo and the name Allies, the search box, the Dashboard, Contacts and Journal items, and at the bottom Appearance and the light/dark button. Search results open under the search box, over the content panel. The content panel has rounded left corners where it meets the sidebar. A contact opens from the contacts list, search or the dashboard, and a mission opens from its contact's page. `navigation.svelte.ts` holds the open screen, the open contact id and the open mission id. There is no router. The window is at least 1024 px wide.

The contact page follows the sketch in `preview.webp`. A header holds the picture, name, category, email, phone, birthday and tags, with the Missions box on its right. Below it a grid of cards, always two to a row, holds About, Notes, Phone calls, Activities, Address and Reminders in that order. About holds significant other, children, how they met, work and food preferences.

Every block on the contact and mission screens uses `EditableCard.svelte`. It is read-only until its pencil is clicked. A field block (the header, About, the mission details) shows Save only once a value differs, and the pencil again, Cancel, Escape or leaving the page discards the draft without asking. A list card in edit mode shows its add form and row controls, and each of those saves at once. The tick box on a task works without edit mode.

Contact and activity categories are stored in lower case and shown through `labelFor()` in `lib/categories.ts`, which capitalises the first letter.

## Theming

- `src/themes/light.css` and `dark.css` set shadcn-svelte's colour variables (`--background`, `--foreground`, `--card`, `--primary`, `--muted-foreground`, `--border` and the rest) on `:root[data-theme="<id>"]`. These are the app's only colour variables, and `app.css` maps them to Tailwind colours, so screens use `bg-background`, `text-muted-foreground` and so on. Dark's background is `#1e1e1e`. Light is Zaimu's neutral light palette.
- `app.css` declares `@custom-variant dark (&:is([data-theme='dark'] *))`, so `dark:` classes follow `data-theme`.
- The theme setting is `system`, `light` or `dark`, default `system`. For `system`, the app follows `prefers-color-scheme` and switches when the system does. `data-theme` on `<html>` always holds the theme in use, `light` or `dark`.
- The accent is one of the nine libadwaita colours Zaimu uses (blue, teal, green, yellow, orange, red, pink, purple, slate), default blue. The settings code sets `--accent-bg` on `<html>` to the accent's fill, and `--primary` and `--ring` take it, so the sidebar, primary buttons, focus rings and the Appearance swatches use it. The fill (`accentFillHex` in `lib/accents.ts`) is the accent with its OKLab lightness lowered in steps of 0.005 until white text reaches 4.5:1, or the accent itself when white already does. `--primary-foreground` is always white. `--accent-text` is the accent made darker in Light and lighter in Dark, for accent-coloured text and icons. shadcn's own `--accent` is a hover background, not the user's accent.
- A change applies at once and is then saved. Saves run one after another. A failed save keeps the change for the session and shows a message on the Appearance screen. A failed load at start-up uses the defaults and shows a message above the content.
- `main.ts` loads the settings before it mounts the app, so the first frame has the right theme and accent.

## Controls

- Buttons, text fields, text areas, labels, cards, tooltips and separators are shadcn-svelte components in `src/lib/components/ui/`. Native `<select>` elements take the Input classes.
- Buttons come in two sizes and an icon-only size. Every clickable element shows a pointer cursor and changes colour on hover. Disabled controls do not.
- Primary actions show an icon and their text. Row controls (delete, move up, move down) show only an icon, with an `aria-label` and a tooltip.
- Card titles are normal-case headings with a Lucide icon. Field labels are small and muted, with a Lucide icon in front. A placeholder for an empty field is muted and italic.

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

The plugin resolves a SQLite path against the app's config folder, not the data folder. Everything therefore lives in `~/.config/privatelink.allies/`: `allies.db`, the `pictures/` folder and `settings.json`. The store plugin resolves a path against the data folder, so `platform.ts` passes it the absolute path of `settings.json` in the config folder, which replaces the data folder in Tauri's path join. `scripts/install-desktop.sh` backs up that folder. End-to-end builds set `XDG_CONFIG_HOME` to a temporary folder, so a test run never touches the real data.

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
- 18 October 2026. The logo is imported with `?no-inline`, so the build emits it as a file. The content security policy has no `data:` in `img-src`, and Vite would otherwise inline a small image as a `data:` URL. The desktop icons are regenerated from `src/assets/logo.png` with `tauri icon`. Only the desktop icons are kept, since the app targets Debian.
- 10 November 2026. The sketch in `preview.webp` is the reference for the contact page and the mission screen, ahead of Monica.
- 10 November 2026. A contact has one phone number with no label. Migration 0002 kept each contact's first number and dropped `phone_numbers`.
- 10 November 2026. A save that writes more than one table goes through a view with an `INSTEAD OF UPDATE` trigger, so it stays one statement under the pooled-connection rule.
- 10 November 2026. Tasks move with up and down buttons, not drag and drop. `moveTask` swaps positions with the neighbour in one `UPDATE`.
- 11 November 2026. Creating a contact with tags is two statements: the `INSERT` into `contacts`, then the save through `contact_header`, the same way a new contact's picture is already saved after its row. The tags need the new contact's id, and SQLite's `last_insert_rowid()` reverts to its old value once an `INSTEAD OF INSERT` trigger on a view ends, so a single insert through the view cannot hand that id back. If the second statement fails, the contact is saved without its tags and the user can add them from the header.
- 13 November 2026. The theme and accent are saved in `settings.json` through `tauri-plugin-store`, as in Zaimu, but in the config folder through an absolute path. The install script's backup then covers it, and end-to-end runs, which set `XDG_CONFIG_HOME` to a temporary folder, never touch the real file.
- 13 November 2026. Allies uses shadcn-svelte and shadcn's colour variable names, as Zaimu and Taskflow do, so the three apps' controls and themes match.
- 13 November 2026. Text on the accent is always white, and the accent fill is darkened just enough for 4.5:1. No single text colour reaches 4.5:1 on all nine of Zaimu's accents: `#1e1e1e` fails on six of them and black fails on purple. Zaimu's accent hex values stay unchanged.
- 13 November 2026. The contact page's cards are always two to a row. The 1024 px minimum window width leaves the content panel at about 784 px or more, so the one-column layout from #19 could no longer be reached.
