Feature: The contact page

  A contact's page holds everything the user knows about one person: their
  picture, notes and missions.

  Scenario: Open a contact
    Given the app has just started
    And a contact named "Ada Lovelace" exists with the category "colleague"
    When I open the "Contacts" screen
    And I select the contact "Ada Lovelace"
    Then the contact page shows "Ada Lovelace"
    And the contact page shows the category "colleague"
    And the contact "Ada Lovelace" counts as recently viewed

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

  Scenario: Add a mission
    Given the app has just started
    And a contact named "Ada Lovelace" exists
    When I open the contact "Ada Lovelace"
    And I add the mission "Send the photos" due 2026-11-01
    Then the mission "Send the photos" is listed
    And the mission "Send the photos" is due 2026-11-01
    When I close and reopen the app
    And I open the contact "Ada Lovelace"
    Then the mission "Send the photos" is listed

  Scenario: Delete a mission
    Given the app has just started
    And a contact named "Ada Lovelace" exists
    When I open the contact "Ada Lovelace"
    And I add the mission "Send the photos" due 2026-11-01
    Then the mission "Send the photos" is listed
    When I delete the mission "Send the photos"
    Then no missions are listed