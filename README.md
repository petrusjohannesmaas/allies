# Allies

Allies is a desktop app for one person on one machine. It keeps the people who
matter to you: what you know about each of them, what you did together, the
dates worth remembering, and a journal of your days.

Everything stays on your computer. The app makes no network request, needs no
server and has no login.

## What it does

Five screens sit under one top bar, with a search box that reaches every one of
them.

**Dashboard.** Every birthday and reminder from today to the same date three
months on, soonest first and grouped by month. A birthday needs no reminder
added by hand, and one that has passed this year comes round on its next date.
The eight contacts you opened most recently are there, and a count of your
contacts and of every call and activity you logged.

**Contacts.** Add and delete a contact with a picture, a category, names, an
email, a phone number, a birthday and tags. You edit a contact on their own
page. Type part of a name in the search box to find one.

**A contact.** Everything about one person on one page. A header holds the
picture, name, category, email, phone number, birthday and tags, with the
missions on the right. Cards below it hold:

- a significant other and children, both picked from your contacts
- how you met, their work and their food preferences
- notes, some of them marked as favourites
- addresses and the one you call home
- reminders, each with a date and an optional yearly repeat, shown inside the
  app and nowhere else
- phone calls and activities you logged, with the date each happened and when
  you last spoke or did something together

Each block is read-only until you click its pencil. A Save button appears once
you change something, and leaving the block discards unsaved changes.

Deleting a contact takes everything it owns with it, its picture file included.

**A mission.** Opens from the Missions box on a contact's page. A mission has a
description, an optional due date and an ordered list of tasks. Tick a task to
cross it out, and move tasks up and down to reorder them. The Missions box
lists missions soonest due first, with progress such as "2 of 5".

**Journal.** What you wrote, newest first, with the month and year above each
run of rows. Rate a day once with one of three faces. Every call and activity
you log appears here as well, marked as created automatically and naming the
contact it was with, and goes away with the call or activity itself. There is
no way to delete one of those rows from the journal.

## Install it

You need Node.js, Rust and the Tauri build dependencies. On Debian or Ubuntu
that means `build-essential`, `curl`, `file`, `libwebkit2gtk-4.1-dev`,
`libxdo-dev`, `libssl-dev`, `librsvg2-dev` and `patchelf`.

```
npm install
npm run desktop:install
```

The script builds a release binary, backs up your data folder, and puts the app
in your launcher. It needs no sudo. Close the app before you run it again.

## Where your data lives

Everything is in one folder:

```
~/.config/privatelink.allies/
  allies.db     the SQLite database
  pictures/     one image file per contact picture
```

The app starts with no data, so a new database comes up empty.

## Back it up

Copy that folder. To restore, close the app, move your current folder aside and
copy the backup back in its place.

`npm run desktop:install` backs the folder up on every run and keeps the five
newest copies next to it as `privatelink.allies.backup-<timestamp>`.

## Tests

```
npm test                  frontend and data tests, on an in-memory database
npm run check             type checks
npm run test:e2e          the scenarios in features/, against a debug build
cargo test --manifest-path src-tauri/Cargo.toml
```

The end-to-end run opens real windows under `xvfb-run`, and needs `xvfb`
installed.

`DESIGN.md` describes the architecture, the schema and the decisions behind
them.

## Licence

See `LICENSE`.
