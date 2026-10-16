Feature: The app shell

  The window has a top bar with a search box and a way to reach each screen.

  Scenario: The search box is on every screen
    Given the app has just started
    Then the search box is at the top of the window
    When I open the "Contacts" screen
    Then the search box is at the top of the window
    When I open the "Journal" screen
    Then the search box is at the top of the window
    When I open the "Dashboard" screen
    Then the search box is at the top of the window

  Scenario: The user moves between the four screens
    Given the app has just started
    Then the "Dashboard" screen is open
    When I open the "Contacts" screen
    Then the "Contacts" screen is open
    When I open the "Journal" screen
    Then the "Journal" screen is open
    When I open the "Dashboard" screen
    Then the "Dashboard" screen is open

  Scenario: The app reopens on the folder the run gave it
    Given the app has just started
    Then the app is pointed at a temporary config folder
    When I close and reopen the app
    Then the search box is at the top of the window