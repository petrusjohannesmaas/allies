Feature: The contact page

  A contact's page holds everything the user knows about one person: their
  picture, notes and missions.

  Scenario: Open a contact
    Given the app has just started
    And a contact named "Ada Lovelace" exists with the category "colleague" and the birthday 1990-05-01
    When I open the "Contacts" screen
    And I select the contact "Ada Lovelace"
    Then the contact page shows "Ada Lovelace"
    And the contact page shows the category "Colleague"
    And the contact page shows "Born 1 May 1990"
    And the contact "Ada Lovelace" counts as recently viewed

  Scenario: The page follows the sketch
    Given the app has just started
    And a contact named "Ada Lovelace" exists
    When I open the contact "Ada Lovelace"
    And the window is 1280 px wide
    Then the cards are in the order About, Notes, Phone calls, Activities, Address, Reminders, two to a row
    When the window is 700 px wide
    Then the cards are in the order About, Notes, Phone calls, Activities, Address, Reminders, one to a row
    When the window is 1280 px wide
    Then the Missions box is at the right of the header

  Scenario: Leaving the page discards unsaved changes
    Given the app has just started
    And a contact named "Ada Lovelace" exists with the email "ada@example.com"
    When I open the contact "Ada Lovelace"
    And I edit the contact "Ada Lovelace"
    And I fill in "new@example.com" as the email
    And I open the "Contacts" screen
    And I select the contact "Ada Lovelace"
    Then the contact page shows the email "ada@example.com"

  Scenario: Write a note
    Given the app has just started
    And a contact named "Ada Lovelace" exists
    When I open the contact "Ada Lovelace"
    And I write the note "Met at a conference in 1843"
    Then the note "Met at a conference in 1843" is listed
    When I close and reopen the app
    And I open the contact "Ada Lovelace"
    Then the note "Met at a conference in 1843" is listed

  Scenario: Mark a note as a favourite
    Given the app has just started
    And a contact named "Ada Lovelace" exists
    When I open the contact "Ada Lovelace"
    And I write the note "Worth remembering"
    Then the note "Worth remembering" is not a favourite
    When I mark the note "Worth remembering" as a favourite
    Then the note "Worth remembering" is a favourite
    When I close and reopen the app
    And I open the contact "Ada Lovelace"
    Then the note "Worth remembering" is a favourite

  Scenario: Edit and delete a note
    Given the app has just started
    And a contact named "Ada Lovelace" exists
    When I open the contact "Ada Lovelace"
    And I write the note "Met at a confernce"
    And I edit the note "Met at a confernce" to "Met at a conference"
    Then the note "Met at a conference" is listed
    And the note "Met at a confernce" is not listed
    When I close and reopen the app
    And I open the contact "Ada Lovelace"
    Then the note "Met at a conference" is listed
    When I delete the note "Met at a conference"
    Then no notes are listed
