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

  Scenario: Move between pages
    Given the app has just started
    And 30 contacts exist
    And the window is 1366 by 700
    When I open the "Home" screen
    And I go to the first page
    And I click the row "Contact 01"
    Then the pager reads page 1 of more than one
    And the Previous page button is disabled
    When I remember the rows
    And I click Next page
    Then the pager reads page 2
    And the rows are different
    And the panel shows the name "Contact 01"
    When I go to the last page
    Then the Next page button is disabled

  Scenario: A taller window holds more rows
    Given the app has just started
    And 30 contacts exist
    And the window is 1366 by 700
    When I open the "Home" screen
    And I go to the first page
    And I click the row "Contact 01"
    And I click Next page
    Then the list does not scroll
    When I remember the page size
    And the window grows to 1366 by 1000
    Then the page holds more rows
    And the page count is the same or lower
    And the row "Contact 01" is on screen
    And the list does not scroll

  Scenario: The page survives Add contact and Cancel
    Given the app has just started
    And 30 contacts exist
    And the window is 1366 by 700
    When I open the "Home" screen
    And I go to the first page
    And I click Next page
    And I click Add contact
    And I cancel the contact form
    Then the pager reads page 2

  Scenario: Saving shows the new contact's page
    Given the app has just started
    And 30 contacts exist
    And the window is 1366 by 700
    When I open the "Home" screen
    And I go to the first page
    And I click Add contact
    And I fill in the first name "Zara"
    And I fill in the last name "Zulu"
    And I save the contact
    Then the pager reads the last page
    And the row "Zara Zulu" is highlighted
    And the panel shows the name "Zara Zulu"

  Scenario: Home comes back on the selected contact's page
    Given the app has just started
    And 30 contacts exist
    And the window is 1366 by 700
    When I open the "Home" screen
    And I go to the first page
    And I click Next page
    And I click the first row on the page
    And I click View full profile
    And I click "All contacts"
    Then the pager reads page 1
    And the first row on the page is highlighted
    And the panel shows the name of the highlighted row

  Scenario: Home fits the window
    Given the app has just started
    And 30 contacts exist
    When I open the "Home" screen
    And the window is 1366 by 700
    Then the page has no horizontal scroll
    And the page does not scroll
    And the panel fits inside the window
    And the list does not scroll
    When the window is 1024 by 700
    Then the page has no horizontal scroll
    And the page does not scroll
    And the panel fits inside the window
    And the list does not scroll
    When the window is 1366 by 900
    Then the whole panel shows
    When the window is 1024 by 480
    Then the panel scrolls inside itself
    And the list does not scroll
