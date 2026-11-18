Feature: Home

  Home shows the contacts as a list, with one contact's details always in a
  panel beside it.

  Scenario: Home shows a contact at start
    Given the app has just started
    And a contact named "Ada Lovelace" exists
    And a contact named "Grace Hopper" exists
    When I open the "Home" screen
    Then the panel shows one of "Ada Lovelace" or "Grace Hopper"
    And the row of the contact in the panel is highlighted

  Scenario: Rows show the last view, newest first
    Given the app has just started
    And a contact named "Ada Lovelace" was last viewed "5 minutes ago" with the email "ada@example.com"
    And a contact named "Grace Hopper" was last viewed "3 hours ago"
    And a contact named "Alan Turing" exists
    When I open the "Home" screen
    Then the rows read "Ada Lovelace", "Grace Hopper", "Alan Turing"
    And the row "Ada Lovelace" reads "5m ago" and "ada@example.com"
    And the row "Grace Hopper" reads "3h ago"
    And the row "Alan Turing" shows no time

  Scenario: Select a contact to see their details
    Given the app has just started
    And a contact named "Ada Lovelace" exists with the category "colleague"
    And the contact "Ada Lovelace" has been given the email "ada@example.com"
    And the contact "Ada Lovelace" has been given the phone "082 123 4567"
    And the contact "Ada Lovelace" has been given a home address in "Cape Town", "South Africa"
    And the contact "Ada Lovelace" has been given the favourite note "Worth remembering"
    And a contact named "Grace Hopper" exists
    When I open the "Home" screen
    And I click the row "Ada Lovelace"
    Then the panel shows the name "Ada Lovelace"
    And the panel shows "ada@example.com"
    And the panel shows the pill "Colleague"
    And the panel shows "082 123 4567"
    And the panel shows "Cape Town, South Africa"
    And the panel shows "Joined" with today's date
    And the panel shows "Worth remembering"

  Scenario: View the full profile and come back
    Given the app has just started
    And a contact named "Ada Lovelace" exists
    And a contact named "Grace Hopper" exists
    When I open the "Home" screen
    And I click the row "Grace Hopper"
    And I click View full profile
    Then the contact page shows "Grace Hopper"
    When I click "All contacts"
    Then the panel shows the name "Grace Hopper"
    And the row "Grace Hopper" reads "Just now"
