Feature: The app shell

  The window has a collapsed sidebar that reaches every screen, and Home has a
  header with the search box, the bell, the theme toggle and the profile menu.

  Scenario: The user moves between the screens
    Given the app has just started
    Then the "Home" screen is open
    When I open the "Missions" screen
    Then the "Missions" screen is open
    When I open the "Interactions" screen
    Then the "Interactions" screen is open
    When I open the "Calendar" screen
    Then the "Calendar" screen is open
    When I open the "Settings" screen
    Then the "Settings" screen is open
    When I open the "Home" screen
    Then the "Home" screen is open

  Scenario: The search box is in the Home header
    Given the app has just started
    Then the search box is in the Home header

  Scenario: Log out is disabled
    Given the app has just started
    Then the Log out button is disabled

  Scenario: The app reopens on the folder the run gave it
    Given the app has just started
    Then the app is pointed at a temporary config folder
    When I close and reopen the app
    Then the search box is in the Home header
