Feature: Contact profile details

  A contact's page holds a significant other, children, addresses, how they
  met, work information and food preferences.

  Scenario: Mark an address as home
    Given the app has just started
    And a contact named "Ada Lovelace" exists
    When I open the contact "Ada Lovelace"
    And I add the address "12 Kei Road" in "Cape Town"
    And I add the address "3 Main Road" in "Joburg"
    Then no address is the home address
    When I make "3 Main Road" the home address
    Then "3 Main Road" is the home address
    And "12 Kei Road" is not the home address
    When I close and reopen the app
    And I open the contact "Ada Lovelace"
    Then "3 Main Road" is the home address

  Scenario: Add a child from the contacts
    Given the app has just started
    And a contact named "Ada Lovelace" exists
    And a contact named "Grace Hopper" exists
    When I open the contact "Ada Lovelace"
    And I add "Grace Hopper" as a child
    Then the child "Grace Hopper" is listed
    When I close and reopen the app
    And I open the contact "Ada Lovelace"
    Then the child "Grace Hopper" is listed

  Scenario: Record a significant other
    Given the app has just started
    And a contact named "Ada Lovelace" exists
    And a contact named "Alan Turing" exists
    When I open the contact "Ada Lovelace"
    And I choose "Alan Turing" as the significant other
    Then the significant other is "Alan Turing"
    When I close and reopen the app
    And I open the contact "Ada Lovelace"
    Then the significant other is "Alan Turing"

  Scenario: Record how they met, work and food preferences
    Given the app has just started
    And a contact named "Ada Lovelace" exists
    When I open the contact "Ada Lovelace"
    And I record how they met "At a conference in London"
    And I record their work "Mathematician"
    And I record their food preferences "No shellfish"
    Then how they met reads "At a conference in London"
    And their work reads "Mathematician"
    And their food preferences read "No shellfish"
    When I close and reopen the app
    And I open the contact "Ada Lovelace"
    Then how they met reads "At a conference in London"
    And their work reads "Mathematician"
    And their food preferences read "No shellfish"