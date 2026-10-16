-- The whole schema for Allies. A migration that has run on the user's machine
-- is never edited: sqlx refuses a database whose applied migration has changed.
-- A change is a new, higher-numbered file in this folder.

CREATE TABLE contacts (
  id INTEGER PRIMARY KEY,
  category TEXT NOT NULL CHECK (
    category IN ('family', 'friend', 'colleague', 'acquaintance', 'mentor', 'community', 'stranger', 'online')
  ),
  first_name TEXT NOT NULL,
  last_name TEXT,
  email TEXT,
  birthday TEXT,
  picture TEXT,
  significant_other_id INTEGER REFERENCES contacts (id) ON DELETE SET NULL,
  how_met TEXT,
  work TEXT,
  food_preferences TEXT,
  last_viewed_at TEXT,
  created_at TEXT NOT NULL DEFAULT (strftime('%Y-%m-%dT%H:%M:%fZ', 'now'))
);

CREATE TABLE notes (
  id INTEGER PRIMARY KEY,
  contact_id INTEGER NOT NULL REFERENCES contacts (id) ON DELETE CASCADE,
  body TEXT NOT NULL,
  is_favourite INTEGER NOT NULL DEFAULT 0 CHECK (is_favourite IN (0, 1)),
  created_at TEXT NOT NULL DEFAULT (strftime('%Y-%m-%dT%H:%M:%fZ', 'now')),
  updated_at TEXT NOT NULL DEFAULT (strftime('%Y-%m-%dT%H:%M:%fZ', 'now'))
);

CREATE TABLE phone_numbers (
  id INTEGER PRIMARY KEY,
  contact_id INTEGER NOT NULL REFERENCES contacts (id) ON DELETE CASCADE,
  label TEXT NOT NULL,
  number TEXT NOT NULL
);

CREATE TABLE addresses (
  id INTEGER PRIMARY KEY,
  contact_id INTEGER NOT NULL REFERENCES contacts (id) ON DELETE CASCADE,
  street TEXT,
  city TEXT,
  postal_code TEXT,
  country TEXT,
  is_home INTEGER NOT NULL DEFAULT 0 CHECK (is_home IN (0, 1))
);

-- A contact has one home address at most, and may have none.
CREATE UNIQUE INDEX addresses_one_home_per_contact ON addresses (contact_id) WHERE is_home = 1;

CREATE TABLE contact_children (
  parent_id INTEGER NOT NULL REFERENCES contacts (id) ON DELETE CASCADE,
  child_id INTEGER NOT NULL REFERENCES contacts (id) ON DELETE CASCADE,
  PRIMARY KEY (parent_id, child_id),
  CHECK (parent_id <> child_id)
);

CREATE TABLE contact_tags (
  contact_id INTEGER NOT NULL REFERENCES contacts (id) ON DELETE CASCADE,
  tag TEXT NOT NULL,
  PRIMARY KEY (contact_id, tag)
);

CREATE TABLE missions (
  id INTEGER PRIMARY KEY,
  contact_id INTEGER NOT NULL REFERENCES contacts (id) ON DELETE CASCADE,
  description TEXT NOT NULL,
  due_date TEXT
);

CREATE TABLE calls (
  id INTEGER PRIMARY KEY,
  contact_id INTEGER NOT NULL REFERENCES contacts (id) ON DELETE CASCADE,
  called_on TEXT NOT NULL,
  description TEXT NOT NULL
);

CREATE TABLE activities (
  id INTEGER PRIMARY KEY,
  contact_id INTEGER NOT NULL REFERENCES contacts (id) ON DELETE CASCADE,
  category TEXT NOT NULL,
  happened_on TEXT NOT NULL,
  description TEXT NOT NULL
);

CREATE TABLE reminders (
  id INTEGER PRIMARY KEY,
  contact_id INTEGER NOT NULL REFERENCES contacts (id) ON DELETE CASCADE,
  remind_on TEXT NOT NULL,
  description TEXT NOT NULL,
  repeats_yearly INTEGER NOT NULL DEFAULT 0 CHECK (repeats_yearly IN (0, 1))
);

CREATE TABLE journal_entries (
  id INTEGER PRIMARY KEY,
  entry_date TEXT NOT NULL,
  body TEXT NOT NULL,
  created_at TEXT NOT NULL DEFAULT (strftime('%Y-%m-%dT%H:%M:%fZ', 'now'))
);

-- One rating a day. The primary key is what refuses the second one.
CREATE TABLE day_ratings (
  day TEXT PRIMARY KEY,
  face INTEGER NOT NULL CHECK (face IN (1, 2, 3))
);

CREATE INDEX contacts_birthday ON contacts (birthday);
CREATE INDEX notes_by_contact ON notes (contact_id);
CREATE INDEX calls_by_contact ON calls (contact_id);
CREATE INDEX activities_by_contact ON activities (contact_id);
CREATE INDEX reminders_by_contact ON reminders (remind_on);
CREATE INDEX journal_entries_by_date ON journal_entries (entry_date);

-- The journal as one set of rows. Calls and activities appear here without a
-- stored copy, so deleting one removes its journal row and deleting a contact
-- removes theirs.
CREATE VIEW journal AS
  SELECT 'entry' AS kind,
         journal_entries.id AS source_id,
         journal_entries.entry_date AS day,
         journal_entries.body AS body,
         NULL AS face,
         NULL AS contact_id
    FROM journal_entries
  UNION ALL
  SELECT 'rating', NULL, day_ratings.day, NULL, day_ratings.face, NULL
    FROM day_ratings
  UNION ALL
  SELECT 'activity', activities.id, activities.happened_on, activities.description, NULL, activities.contact_id
    FROM activities
  UNION ALL
  SELECT 'call', calls.id, calls.called_on, calls.description, NULL, calls.contact_id
    FROM calls;