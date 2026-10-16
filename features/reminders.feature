Feature: Reminders on a contact

  A reminder keeps a date, a short description and whether it comes back
  every year. Nothing leaves the app.

  Scenario: Add a reminder
    Given the app has just started
    And a contact named "Ada Lovelace" exists
    When I open the contact "Ada Lovelace"
    And I add a reminder dated "in 10 days" with the description "Send the photos" and no yearly repeat
    Then the reminder "Send the photos" is listed
    And the reminder "Send the photos" reads the date "in 10 days"
    And the reminder "Send the photos" repeats "no"
    When I close and reopen the app
    And I open the contact "Ada Lovelace"
    Then the reminder "Send the photos" is listed
    And the reminder "Send the photos" repeats "no"

  Scenario: Add a yearly reminder
    Given the app has just started
    And a contact named "Ada Lovelace" exists
    When I open the contact "Ada Lovelace"
    And I add a reminder dated "in 10 days" with the description "Call for her birthday" and a yearly repeat
    Then the reminder "Call for her birthday" is listed
    And the reminder "Call for her birthday" reads the date "in 10 days"
    And the reminder "Call for her birthday" repeats "yes"
    When I close and reopen the app
    And I open the contact "Ada Lovelace"
    Then the reminder "Call for her birthday" repeats "yes"

  Scenario: Delete a reminder
    Given the app has just started
    And a contact named "Ada Lovelace" exists
    When I open the contact "Ada Lovelace"
    And I add a reminder dated "in 10 days" with the description "Send the photos" and no yearly repeat
    And I add a reminder dated "in 20 days" with the description "Call for her birthday" and a yearly repeat
    Then both reminders are listed
    When I delete the reminder "Send the photos"
    Then the reminder "Send the photos" is not listed
    And the reminder "Call for her birthday" is listed

  Scenario: A contact with no reminders
    Given the app has just started
    And a contact named "Ada Lovelace" exists
    When I open the contact "Ada Lovelace"
    Then no reminders are listed
