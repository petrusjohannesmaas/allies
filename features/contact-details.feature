Feature: Contact profile details

  A contact's page holds addresses and an About block with a significant other,
  children, how they met, work information and food preferences.

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

  Scenario: Edit About and reopen the app
    Given the app has just started
    And a contact named "Ada Lovelace" exists
    And a contact named "Alan Turing" exists
    And a contact named "Grace Hopper" exists
    When I open the contact "Ada Lovelace"
    Then About reads "Significant other not set"
    And About reads "Children not set"
    When I choose "Alan Turing" as the significant other
    And I add "Grace Hopper" as a child
    And I record how they met "At a conference in London"
    And I record their work "Mathematician"
    And I record their food preferences "No shellfish"
    And I save About
    Then the significant other is "Alan Turing"
    And the child "Grace Hopper" is listed
    And how they met reads "At a conference in London"
    And their work reads "Mathematician"
    And their food preferences read "No shellfish"
    When I close and reopen the app
    And I open the contact "Ada Lovelace"
    Then the significant other is "Alan Turing"
    And the child "Grace Hopper" is listed
    And how they met reads "At a conference in London"
    And their work reads "Mathematician"
    And their food preferences read "No shellfish"
