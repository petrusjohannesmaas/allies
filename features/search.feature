Feature: Contact search

  The search box sits at the top of every screen, so a contact is one
  keystroke away from wherever the user is.

  Scenario: Search by part of a first name
    Given the app has just started
    And a contact named "Ada Lovelace" exists
    And a contact named "Grace Hopper" exists
    When I type "Ada" in the search box
    Then the search shows "Ada Lovelace"
    And the search does not show "Grace Hopper"

  Scenario: Search by part of a last name
    Given the app has just started
    And a contact named "Ada Lovelace" exists
    And a contact named "Grace Hopper" exists
    When I type "Hopp" in the search box
    Then the search shows "Grace Hopper"
    And the search does not show "Ada Lovelace"

  Scenario: Open a search result
    Given the app has just started
    And a contact named "Ada Lovelace" exists
    When I type "Ada" in the search box
    And I choose the search result "Ada Lovelace"
    Then the contact page shows "Ada Lovelace"

  Scenario: A search with no match
    Given the app has just started
    And a contact named "Ada Lovelace" exists
    When I type "zzz" in the search box
    Then the search says "No contacts found"

  Scenario: The search follows what the user types
    Given the app has just started
    And a contact named "Ada Lovelace" exists
    And a contact named "Grace Hopper" exists
    When I type "a" in the search box
    Then the search shows "Ada Lovelace"
    And the search shows "Grace Hopper"
    When I type "grace" in the search box
    Then the search shows "Grace Hopper"
    And the search does not show "Ada Lovelace"