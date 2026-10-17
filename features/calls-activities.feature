Feature: Calls and activities

  A contact's page records the calls the user made and what they did
  together, and says when each happened last.

  Scenario: Log a call
    Given the app has just started
    And a contact named "Ada Lovelace" exists
    When I open the contact "Ada Lovelace"
    And I log a call dated "3 days ago" with the description "Caught up about the conference"
    Then the call "Caught up about the conference" is listed
    And the call "Caught up about the conference" reads the date "3 days ago"
    When I close and reopen the app
    And I open the contact "Ada Lovelace"
    Then the call "Caught up about the conference" is listed
    And the call "Caught up about the conference" reads the date "3 days ago"

  Scenario: Log an activity
    Given the app has just started
    And a contact named "Ada Lovelace" exists
    When I open the contact "Ada Lovelace"
    And I log an activity dated "2 days ago" in the category "did sport together" with the description "We went skiing"
    Then the activity "We went skiing" is listed as "did sport together"
    And the activity "We went skiing" reads the date "2 days ago"
    When I close and reopen the app
    And I open the contact "Ada Lovelace"
    Then the activity "We went skiing" is listed as "did sport together"

  Scenario: Delete a call
    Given the app has just started
    And a contact named "Ada Lovelace" exists
    When I open the contact "Ada Lovelace"
    And I log a call dated "3 days ago" with the description "Caught up about the conference"
    And I log a call dated "1 day ago" with the description "Called about the book"
    Then both calls are listed
    When I delete the call "Caught up about the conference"
    Then the call "Caught up about the conference" is not listed
    And the call "Called about the book" is listed
    And last called reads the date "1 day ago"

  Scenario: Delete an activity
    Given the app has just started
    And a contact named "Ada Lovelace" exists
    When I open the contact "Ada Lovelace"
    And I log an activity dated "2 days ago" in the category "did sport together" with the description "We went skiing"
    And I log an activity dated "today" in the category "ate at a restaurant" with the description "Lunch at the diner"
    Then both activities are listed
    When I delete the activity "We went skiing"
    Then the activity "We went skiing" is not listed
    And the activity "Lunch at the diner" is listed as "ate at a restaurant"
    And last activity together reads the date "today"

  Scenario: Last called shows the latest call
    Given the app has just started
    And a contact named "Ada Lovelace" exists
    When I open the contact "Ada Lovelace"
    And I log a call dated "5 days ago" with the description "First call"
    And I log a call dated "2 days ago" with the description "Second call"
    Then last called reads the date "2 days ago"

  Scenario: A new contact shows never
    Given the app has just started
    And a contact named "Ada Lovelace" exists
    When I open the contact "Ada Lovelace"
    Then last called reads "never"
    And last activity together reads "never"
    And no calls are listed
    And no activities are listed
