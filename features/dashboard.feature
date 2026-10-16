Feature: The dashboard

  The dashboard shows what is coming up in the next three months, who the
  user saw lately, and how much the app holds.

  Scenario: First run shows zero counts
    Given the app has just started
    Then the dashboard shows 0 contacts
    And the dashboard shows 0 calls and activities
    And no upcoming dates are listed
    And no recently viewed contacts are listed

  Scenario: Upcoming birthdays are listed by month
    Given the app has just started
    And a contact named "Ada Lovelace" has the birthday "in 5 days"
    And a contact named "Grace Hopper" has the birthday "in 40 days"
    And a contact named "Alan Turing" has the birthday "in 70 days"
    When I open the "Contacts" screen
    And I open the "Dashboard" screen
    Then the dashboard shows 3 contacts
    And the birthday for "Ada Lovelace" is listed on "in 5 days"
    And the birthday for "Grace Hopper" is listed on "in 40 days"
    And the birthday for "Alan Turing" is listed on "in 70 days"
    And the upcoming dates are listed in date order under their own months

  Scenario: A past birthday waits for its next date
    Given the app has just started
    And a contact named "Ada Lovelace" has the birthday "today"
    And a contact named "Grace Hopper" has the birthday "1 day ago"
    When I open the "Contacts" screen
    And I open the "Dashboard" screen
    Then the birthday for "Ada Lovelace" is listed on "today"
    And no birthday is listed for "Grace Hopper"

  Scenario: A yearly reminder is listed
    Given the app has just started
    And a contact named "Ada Lovelace" exists
    When I open the contact "Ada Lovelace"
    And I add a reminder dated "in 10 days" with the description "Send the photos" and a yearly repeat
    And I add a reminder dated "in 50 days" with the description "Call for her birthday" and no yearly repeat
    And I open the "Dashboard" screen
    Then the reminder "Send the photos" for "Ada Lovelace" is listed on "in 10 days"
    And the reminder "Call for her birthday" for "Ada Lovelace" is listed on "in 50 days"

  Scenario: Recently viewed contacts open their page
    Given the app has just started
    And a contact named "Ada Lovelace" exists
    And a contact named "Grace Hopper" exists
    And a contact named "Alan Turing" exists
    When I open the contact "Ada Lovelace"
    And I open the contact "Grace Hopper"
    And I open the contact "Alan Turing"
    And I open the "Dashboard" screen
    Then the recently viewed contacts are "Alan Turing", "Grace Hopper" and "Ada Lovelace"
    When I select the recently viewed contact "Grace Hopper"
    Then the contact page shows "Grace Hopper"

  Scenario: Counts include calls and activities
    Given the app has just started
    And a contact named "Ada Lovelace" exists
    When I open the contact "Ada Lovelace"
    And I log a call dated "3 days ago" with the description "Caught up about the conference"
    And I log an activity dated "2 days ago" in the category "did sport together" with the description "We went skiing"
    And I log an activity dated "today" in the category "ate at a restaurant" with the description "Lunch at the diner"
    And I open the "Dashboard" screen
    Then the dashboard shows 1 contacts
    And the dashboard shows 3 calls and activities

  Scenario: A deleted contact leaves the dashboard
    Given the app has just started
    And a contact named "Ada Lovelace" has the birthday "in 5 days"
    And a contact named "Grace Hopper" exists
    When I open the contact "Ada Lovelace"
    And I open the "Dashboard" screen
    Then the birthday for "Ada Lovelace" is listed on "in 5 days"
    When I open the "Contacts" screen
    And I delete the contact "Ada Lovelace"
    And I confirm the deletion
    And I open the "Dashboard" screen
    Then no birthday is listed for "Ada Lovelace"
    And the dashboard shows 1 contacts
