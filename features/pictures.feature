Feature: Profile pictures

  A contact's picture is an image file inside the app's own config folder, and
  the contact row keeps only its file name.

  Scenario: A picture is stored in the app folder
    Given the app has just started
    And a contact named "Ada Lovelace" exists
    When I open the "Contacts" screen
    And I edit the contact "Ada Lovelace"
    And I choose the portrait fixture as the picture
    And I save the contact
    Then the pictures folder holds 1 file
    And the contact "Ada Lovelace" has a picture
    And the contact "Ada Lovelace" shows the picture

  Scenario: A replaced picture is removed
    Given the app has just started
    And a contact named "Ada Lovelace" exists
    When I open the "Contacts" screen
    And I edit the contact "Ada Lovelace"
    And I choose the portrait fixture as the picture
    And I save the contact
    Then the pictures folder holds 1 file
    When I edit the contact "Ada Lovelace"
    And I choose the portrait fixture as the picture
    And I save the contact
    Then the pictures folder holds 1 file

  Scenario: Deleting a contact deletes its picture
    Given the app has just started
    And a contact named "Ada Lovelace" exists
    And a contact named "Grace Hopper" exists
    When I open the "Contacts" screen
    And I edit the contact "Ada Lovelace"
    And I choose the portrait fixture as the picture
    And I save the contact
    Then the pictures folder holds 1 file
    When I delete the contact "Ada Lovelace"
    And I confirm the deletion
    Then the pictures folder holds 0 files

  Scenario: A contact with no picture needs no file
    Given the app has just started
    And a contact named "Ada Lovelace" exists
    When I open the "Contacts" screen
    Then the pictures folder holds 0 files
    And the contact "Ada Lovelace" has no picture