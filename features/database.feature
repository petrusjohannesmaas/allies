Feature: The database

  The app keeps everything in one SQLite file inside its own config folder.

  Scenario: The database is created on first launch
    Given the app has just started
    Then the database file is in the temporary config folder
    And the database has a table for contacts
    And the database has a table for notes
    And the database has a table for missions
    And the database has a table for calls
    And the database has a table for activities
    And the database has a table for reminders
    And the database has a table for journal_entries
    And the database has a table for day_ratings
    And the database has a journal view
    And every table is empty

  Scenario: The database starts with nothing in it
    Given the app has just started
    Then the contacts table holds no rows