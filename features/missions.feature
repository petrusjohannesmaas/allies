Feature: Missions

  A mission is a goal for a contact with an ordered list of tasks and no due
  dates on the tasks. The Missions box in the contact's header lists the
  missions, and each one opens its own screen.

  Scenario: Plan a mission in ordered tasks
    Given the app has just started
    And a contact named "Ada Lovelace" exists
    When I open the contact "Ada Lovelace"
    And I add the mission "Send the photos"
    And I open the mission "Send the photos"
    Then the mission screen is for "Ada Lovelace"
    When I add the task "Pick photos"
    And I add the task "Print them"
    And I add the task "Post them"
    And I move the task "Post them" up
    And I tick the task "Pick photos"
    Then the tasks read "Pick photos, Post them, Print them"
    And the task "Pick photos" is ticked
    When I close and reopen the app
    And I open the contact "Ada Lovelace"
    Then the mission "Send the photos" shows "1 of 3"
    When I open the mission "Send the photos"
    Then the tasks read "Pick photos, Post them, Print them"
    And the task "Pick photos" is ticked
    And the top task cannot move up and the bottom task cannot move down

  Scenario: Edit a mission
    Given the app has just started
    And a contact named "Ada Lovelace" exists
    When I open the contact "Ada Lovelace"
    And I add the mission "Send the photos"
    And I open the mission "Send the photos"
    And I change the mission to "Send the photos by post" due 2026-12-05
    Then the mission screen shows "Send the photos by post" due 2026-12-05
    When I go back to the contact
    Then the mission "Send the photos by post" is listed
    And the mission "Send the photos by post" is due 2026-12-05

  Scenario: Delete a mission with its tasks
    Given the app has just started
    And a contact named "Ada Lovelace" exists
    When I open the contact "Ada Lovelace"
    And I add the mission "Send the photos"
    And I open the mission "Send the photos"
    And I add the task "Pick photos"
    And I add the task "Print them"
    And I delete the mission and confirm that it also deletes 2 tasks
    Then the contact page shows "Ada Lovelace"
    And no missions are listed
    And the tasks table holds 0 rows
