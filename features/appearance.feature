Feature: Appearance

  The sidebar and the Appearance screen set the theme and the accent, and the
  app keeps both across a restart.

  @appearance
  Scenario: The theme and accent survive a restart
    Given the app has just started
    When I open Appearance
    And I choose the Dark theme
    And I pick the Purple accent
    And I close and reopen the app
    Then the app is in Dark
    And the app has the Purple accent

  @appearance
  Scenario: The sidebar button switches the theme
    Given the app has just started
    And the app is in Light
    When I press the theme button
    Then the app is in Dark
