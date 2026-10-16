Feature: Contacts

  The user lists the people they keep track of, and adds, changes and removes
  them.

  Scenario: First run shows no contacts
    Given the app has just started
    When I open the "Contacts" screen
    Then the contacts list is empty

  Scenario: Add a contact
    Given the app has just started
    When I open the "Contacts" screen
    And I add a contact
    And I fill in the first name "Ada"
    And I fill in the last name "Lovelace"
    And I choose "colleague" as the category
    And I fill in "ada@example.com" as the email
    And I set the birthday to 1815-12-10
    And I save the contact
    Then the contacts list shows "Ada Lovelace"
    And the contact "Ada Lovelace" has the category "colleague"
    And the contact "Ada Lovelace" has the email "ada@example.com"
    And the contact "Ada Lovelace" has the birthday 1815-12-10

  Scenario: The first name is required
    Given the app has just started
    When I open the "Contacts" screen
    And I add a contact
    And I save the contact
    Then the form says the first name is required
    And the contacts list is empty

  Scenario: An email has to be an address
    Given the app has just started
    When I open the "Contacts" screen
    And I add a contact
    And I fill in the first name "Ada"
    And I fill in "ada at example" as the email
    And I save the contact
    Then the form says the email is not valid
    And the contacts list is empty

  Scenario: The category picker offers eight categories
    Given the app has just started
    When I open the "Contacts" screen
    And I add a contact
    Then the category picker offers family, friend, colleague, acquaintance, mentor, community, stranger and online

  Scenario: Edit a contact and reopen the app
    Given the app has just started
    And a contact named "Ada Lovelace" exists
    When I open the "Contacts" screen
    And I edit the contact "Ada Lovelace"
    And I fill in the last name "Byron"
    And I choose "mentor" as the category
    And I save the contact
    Then the contacts list shows "Ada Byron"
    When I close and reopen the app
    And I open the "Contacts" screen
    Then the contacts list shows "Ada Byron"
    And the contact "Ada Byron" has the category "mentor"

  Scenario: Delete a contact
    Given the app has just started
    And a contact named "Ada Lovelace" exists
    And a contact named "Grace Hopper" exists
    When I open the "Contacts" screen
    Then the contacts list shows "Ada Lovelace"
    And the contacts list shows "Grace Hopper"
    When I delete the contact "Ada Lovelace"
    And I confirm the deletion
    Then the contacts list does not show "Ada Lovelace"
    And the contacts list shows "Grace Hopper"
    When I close and reopen the app
    And I open the "Contacts" screen
    Then the contacts list does not show "Ada Lovelace"