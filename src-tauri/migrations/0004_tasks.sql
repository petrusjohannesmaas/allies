-- The ordered tasks of a mission. `position` has no unique index, because
-- swapping two tasks in one statement would collide with it for a moment.
CREATE TABLE tasks (
  id INTEGER PRIMARY KEY,
  mission_id INTEGER NOT NULL REFERENCES missions (id) ON DELETE CASCADE,
  description TEXT NOT NULL,
  is_done INTEGER NOT NULL DEFAULT 0 CHECK (is_done IN (0, 1)),
  position INTEGER NOT NULL
);

CREATE INDEX tasks_by_mission ON tasks (mission_id, position);
