Feature: The journal

  The journal lists what the user wrote, the face they gave each day, and
  every call and activity they logged, newest first.

  Scenario: Add a journal entry
    Given the app has just started
    When I open the "Journal" screen
    And I add a journal entry dated "today" with the text "A quiet day at home"
    Then the journal entry "A quiet day at home" is listed
    And the journal shows the month for "today"
    When I close and reopen the app
    And I open the "Journal" screen
    Then the journal entry "A quiet day at home" is listed

  Scenario: Delete a journal entry
    Given the app has just started
    When I open the "Journal" screen
    And I add a journal entry dated "today" with the text "A quiet day at home"
    And I add a journal entry dated "1 day ago" with the text "Walked in the park"
    Then both journal entries are listed
    When I delete the journal entry "A quiet day at home"
    Then the journal entry "A quiet day at home" is not listed
    And the journal entry "Walked in the park" is listed

  Scenario: Rate the day
    Given the app has just started
    When I open the "Journal" screen
    Then today is not rated
    When I rate the day "happy"
    Then today's rating reads "happy"
    And the face "happy" is marked as chosen
    And the journal lists a rating row for "today" reading "happy"
    When I close and reopen the app
    And I open the "Journal" screen
    Then today's rating reads "happy"

  Scenario: A second rating is refused
    Given the app has just started
    When I open the "Journal" screen
    And I rate the day "sad"
    And I rate the day "happy"
    Then the day is already rated as "sad"
    And the journal lists a rating row for "today" reading "sad"

  Scenario: A logged activity appears in the journal
    Given the app has just started
    And a contact named "Ada Lovelace" exists
    When I open the contact "Ada Lovelace"
    And I log an activity dated "2 days ago" in the category "did sport together" with the description "We went skiing"
    And I open the "Journal" screen
    Then the automatic entry "We went skiing" for "Ada Lovelace" is listed
    And the automatic entry "We went skiing" is marked "Created automatically"

  Scenario: A logged call appears in the journal
    Given the app has just started
    And a contact named "Ada Lovelace" exists
    When I open the contact "Ada Lovelace"
    And I log a call dated "3 days ago" with the description "Caught up about the conference"
    And I open the "Journal" screen
    Then the automatic entry "Caught up about the conference" for "Ada Lovelace" is listed
    And the automatic entry "Caught up about the conference" is marked "Created automatically"

  Scenario: Automatic entries cannot be deleted here
    Given the app has just started
    And a contact named "Ada Lovelace" exists
    When I open the contact "Ada Lovelace"
    And I log an activity dated "today" in the category "ate at a restaurant" with the description "Lunch at the diner"
    And I open the "Journal" screen
    Then the automatic entry "Lunch at the diner" has no delete button
    When I add a journal entry dated "today" with the text "A quiet day at home"
    Then the journal entry "A quiet day at home" has a delete button
    And the automatic entry "Lunch at the diner" still has no delete button

  Scenario: Deleting an activity removes its entry
    Given the app has just started
    And a contact named "Ada Lovelace" exists
    When I open the contact "Ada Lovelace"
    And I log an activity dated "today" in the category "ate at a restaurant" with the description "Lunch at the diner"
    And I log a call dated "today" with the description "Called about the book"
    And I open the "Journal" screen
    Then the automatic entry "Lunch at the diner" is listed
    And the automatic entry "Called about the book" is listed
    When I open the contact "Ada Lovelace"
    And I delete the activity "Lunch at the diner"
    And I open the "Journal" screen
    Then the automatic entry "Lunch at the diner" is not listed
    And the automatic entry "Called about the book" is listed

  Scenario: Deleting a call removes its entry
    Given the app has just started
    And a contact named "Ada Lovelace" exists
    When I open the contact "Ada Lovelace"
    And I log a call dated "today" with the description "Called about the book"
    And I log a call dated "today" with the description "Caught up about the conference"
    And I open the "Journal" screen
    Then the automatic entry "Called about the book" is listed
    And the automatic entry "Caught up about the conference" is listed
    When I open the contact "Ada Lovelace"
    And I delete the call "Called about the book"
    And I open the "Journal" screen
    Then the automatic entry "Called about the book" is not listed
    And the automatic entry "Caught up about the conference" is listed

  Scenario: The journal lists rows newest first
    Given the app has just started
    When I open the "Journal" screen
    And I add a journal entry dated "1 day ago" with the text "Walked in the park"
    And I add a journal entry dated "40 days ago" with the text "Started a new book"
    And I add a journal entry dated "today" with the text "A quiet day at home"
    And I add a journal entry dated "10 days ago" with the text "Visited the market"
    Then the journal lists these entries newest first: "A quiet day at home", "Walked in the park", "Visited the market", "Started a new book"
