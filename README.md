Stuff Happens - Web Applications I 2024/25 Assignment
A single-player web application for the "Stuff Happens" game with a university life theme. Players rank unfortunate situations based on their bad luck index to collect cards.
Server-Side
HTTP APIs

POST /api/login: Authenticates a user with username and password, returns user info.
POST /api/logout: Logs out the user.
GET /api/user: Returns current user info or null if not logged in.
GET /api/cards/initial: Returns 3 random cards for a new game (authenticated).
GET /api/cards/new: Returns a new random card, excluding used cards (authenticated).
POST /api/game/guess: Submits a guess for card placement, returns result (authenticated).
POST /api/game/start: Starts a new game, returns game ID (authenticated).
POST /api/game/end: Ends the current game with a status (won/lost) (authenticated).
GET /api/history: Returns the user's game history (authenticated).

Database Tables

users: Stores user ID, username, and hashed password.
cards: Stores card ID, name, image, and bad luck index (university theme).
games: Stores game ID, user ID, and status (active/won/lost).
game_cards: Stores card-game associations with user ID, game ID, card ID, round, and win status.

Client-Side
Routes

/: Displays game instructions (accessible to all).
/login: Login page for user authentication.
/game: Main game interface for playing rounds (authenticated).
/profile: User profile with game history (authenticated).

Main React Components

App: Root component with routing and authentication Context.
Navbar: Navigation bar with links and logout button.
Login: User login form.
Game: Manages game logic, card display, and timer.
Profile: Displays user game history.
Instructions: Displays game rules.

General
Screenshots

Registered Users

Username: student1, Password: password1
Username: student2, Password: password2

