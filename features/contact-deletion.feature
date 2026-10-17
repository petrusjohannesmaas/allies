Feature: Deleting a contact

  Deleting a contact takes everything it owns with it, and leaves the other
  contacts alone.

  Scenario: Deleting a contact removes everything it owns
    Given the app has just started
    And a contact named "Ada Lovelace" has the birthday "in 5 days"
    And a contact named "Grace Hopper" exists
    When I open the "Contacts" screen
    And I edit the contact "Ada Lovelace"
    And I choose the portrait fixture as the picture
    And I save the contact
    And I open the contact "Ada Lovelace"
    And I add the phone number "mobile" "082 123 4567"
    And I add the address "12 Kei Road" in "Cape Town"
    And I add the tag "chess"
    And I record how they met "At a conference in London"
    And I write the note "Worth remembering"
    And I add the mission "Send the photos" due 2026-12-01
    And I log a call dated "3 days ago" with the description "Caught up about the conference"
    And I log an activity dated "2 days ago" in the category "did sport together" with the description "We went skiing"
    And I add a reminder dated "in 10 days" with the description "Call for her birthday" and a yearly repeat
    And I add "Grace Hopper" as a child
    Then the pictures folder holds 1 file
    When I open the "Journal" screen
    Then the journal has a row reading "Caught up about the conference"
    And the journal has a row reading "We went skiing"
    When I close and reopen the app
    And I open the "Contacts" screen
    And I delete the contact "Ada Lovelace"
    And I confirm the deletion
    Then the pictures folder holds 0 files
    And the notes table holds 0 rows
    And the missions table holds 0 rows
    And the calls table holds 0 rows
    And the activities table holds 0 rows
    And the reminders table holds 0 rows
    And the phone_numbers table holds 0 rows
    And the addresses table holds 0 rows
    And the contact_tags table holds 0 rows
    And the contact_children table holds 0 rows
    And the database holds 1 contacts
    When I open the "Journal" screen
    Then the journal has no row reading "Caught up about the conference"
    And the journal has no row reading "We went skiing"
    When I open the "Dashboard" screen
    Then no birthday is listed for "Ada Lovelace"
    And the recently viewed list does not show "Ada Lovelace"
    And the dashboard shows 1 contacts

  Scenario: Deleting a linked contact keeps the other contact
    Given the app has just started
    And a contact named "Ada Lovelace" exists
    And a contact named "Grace Hopper" exists
    When I open the contact "Ada Lovelace"
    And I add "Grace Hopper" as a child
    And I choose "Grace Hopper" as the significant other
    Then the child "Grace Hopper" is listed
    And the significant other is "Grace Hopper"
    And the contact_children table holds 1 row
    When I open the "Contacts" screen
    And I delete the contact "Grace Hopper"
    And I confirm the deletion
    And I close and reopen the app
    And I open the "Contacts" screen
    Then the contacts list shows "Ada Lovelace"
    And the contacts list does not show "Grace Hopper"
    And the contact_children table holds 0 rows
    When I open the contact "Ada Lovelace"
    Then no children are listed
    And no significant other is listed

  Scenario: A deleted contact leaves the dashboard
    Given the app has just started
    And a contact named "Ada Lovelace" has the birthday "in 5 days"
    And a contact named "Grace Hopper" has the birthday "in 40 days"
    When I open the "Contacts" screen
    And I open the "Dashboard" screen
    Then the birthday for "Ada Lovelace" is listed on "in 5 days"
    And the birthday for "Grace Hopper" is listed on "in 40 days"
    And the dashboard shows 2 contacts
    When I open the "Contacts" screen
    And I delete the contact "Ada Lovelace"
    And I confirm the deletion
    And I open the "Dashboard" screen
    Then no birthday is listed for "Ada Lovelace"
    And the birthday for "Grace Hopper" is listed on "in 40 days"
    And the dashboard shows 1 contacts
