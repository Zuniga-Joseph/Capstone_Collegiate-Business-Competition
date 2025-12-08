# Game System - Architecture Reference

**Deep dive into system architecture, code organization, and design patterns**

---

## System Architecture Diagram

```
┌─────────────────────────────────────────────────────────────────────────────┐
│                            USER'S BROWSER                                   │
│  ┌───────────────────────────────────────────────────────────────────────┐  │
│  │  React Application (Port 5173)                                        │  │
│  │  ┌─────────────────┐  ┌──────────────────┐  ┌──────────────────┐      │  │
│  │  │  Dashboard      │  │  Game Page       │  │  Leaderboard     │      │  │
│  │  │                 │  │  /game           │  │  /leaderboard    │      │  │
│  │  │  - User stats   │  │                  │  │                  │      │  │
│  │  │  - Quick play   │  │  ┌────────────┐  │  │  - Rankings      │      │  │
│  │  │                 │  │  │ GameClient │  │  │  - Filters       │      │  │ 
│  │  └─────────────────┘  │  │  (Pixi.js) │  │  └──────────────────┘      │  │ 
│  │                       │  └────────────┘  │                            │  │
│  │                       └──────────────────┘                            │  │
│  └───────────────────────────────────────────────────────────────────────┘  │
│         │                       │                       │                   │
│         │ REST API              │ WebSocket             │ REST API          │
│         │ (JWT)                 │ (JWT)                 │ (JWT)             │
└─────────┼───────────────────────┼───────────────────────┼───────────────────┘
          │                       │                       │
          ▼                       ▼                       │
┌─────────────────┐     ┌────────────────────┐            │
│  FastAPI        │     │  Game Server       │            │
│  Backend        │     │  (Socket.io)       │            │
│  (Port 8000)    │     │  (Port 3001)       │            │
│                 │     │                    │            │
│  ┌───────────┐  │     │  ┌──────────────┐  │            │
│  │ Auth API  │  │     │  │ Game Logic   │  │            │
│  │ /login    │  │     │  │              │  │            │
│  └───────────┘  │     │  │ - State Mgmt │  │            │
│                 │     │  │ - Scoring    │  │            │
│  ┌───────────┐  │◄────┤  │ - Timer      │  │            │
│  │ Game API  │  │ REST│  │              │  │            │
│  │ /game/*   │  │     │  └──────────────┘  │            │
│  └───────────┘  │     │                    │            │
│                 │     │  ┌──────────────┐  │            │
│  ┌───────────┐  │     │  │  Services    │  │            │
│  │ User API  │  │     │  │              │  │            │
│  │ /users/*  │  │     │  │ - database.js├──┼────────────┘
│  └───────────┘  │     │  │ - auth.js    │  │
│                 │     │  └──────────────┘  │
└────────┬────────┘     └────────────────────┘
         │
         │ SQLAlchemy/SQLModel
         ▼
┌─────────────────────────────────────────────┐
│         PostgreSQL Database                 │
│         (Port 5432)                         │
│                                             │
│  ┌──────────┐ ┌───────────────┐ ┌────────┐  │
│  │  user    │ │  gamesession  │ │ event  │  │
│  └──────────┘ └───────────────┘ └────────┘  │
│                       │                     │
│              ┌────────┴────────┐            │
│              │                 │            │
│      ┌───────────────┐  ┌──────────────┐    │
│      │gameparticipant│  │  gameresult  │    │ 
│      └───────────────┘  └──────────────┘    │
│                                             │
└─────────────────────────────────────────────┘
```

---

## Component Breakdown

### Frontend: Game Client Architecture

```
frontend/src/game-client/
│
├── game.js (Main Controller)
│   │
│   ├── Responsibilities:
│   │   - Socket.io connection management
│   │   - Scene lifecycle (create, switch, destroy)
│   │   - Event handling (server → client)
│   │   - Global game state (score, playerId)
│   │
│   └── Key Methods:
│       - start() → Initialize socket, show waiting scene
│       - showWaitingScreen() → Display pre-game lobby
│       - showQuizScene() → Display active question
│       - showResultScene() → Display end-game results
│       - submitAnswer() → Send answer to server
│
├── scenes/ (Full-Screen Game States)
│   │
│   ├── waiting-scene.js
│   │   └── Shows: "Waiting for game to start..."
│   │       - Displayed when: < 2 players or between rounds
│   │       - Components: Simple text message
│   │
│   ├── quiz-scene.js (Most Complex)
│   │   └── Shows: Active question + answer choices
│   │       - Displayed when: New question starts
│   │       - Components:
│   │           * Question component (top)
│   │           * 4x ChoiceButton components
│   │           * StickFigure components (show who answered)
│   │           * Timer display
│   │       - Event handlers:
│   │           * onAnswerSubmit → Emit to server
│   │           * onPlayerAnswered → Show other players' answers
│   │           * showResults → Display correct answer + scores
│   │
│   └── result-scene.js
│       └── Shows: Final scoreboard + rankings
│           - Displayed when: Game ends (all questions done)
│           - Auto-redirects to dashboard after 10 seconds
│
└── components/ (Reusable UI Elements)
    │
    ├── choice-button.js
    │   └── Clickable answer button
    │       - States: normal, hovered, selected, revealed (correct/wrong)
    │       - Events: pointerdown, pointerover, pointerout
    │
    ├── question.js (currently unused)
    │
    └── stick-figure.js
        └── Player avatar on answer choice
            - Shows which player selected which answer
            - Displays player ID/name
```

### Game Server: Socket.io Server Architecture

```
game-server/src/
│
├── server.js (Main Game Loop)
│   │
│   ├── Global State:
│   │   const gameState = {
│   │     sessionId: null,            // DB session ID
│   │     players: {},                // { socketId: { userId, score } }
│   │     currentQuestion: 0,
│   │     answers: {},                // { playerId: { choice, timestamp } }
│   │     scores: {},                 // { playerId: score }
│   │     gameStarted: false,
│   │     roundTimer: null
│   │   }
│   │
│   ├── Game Flow Functions:
│   │   │
│   │   ├── startGame()
│   │   │   - Creates DB session
│   │   │   - Emits 'gameStart' to all clients
│   │   │   - Calls nextQuestion()
│   │   │
│   │   ├── nextQuestion()
│   │   │   - Clears previous answers
│   │   │   - Emits 'newQuestion' with current question
│   │   │   - Starts choice reveal animation timer
│   │   │   - Emits 'answerPeriodStart' after reveals
│   │   │   - Sets 30-second answer timer
│   │   │
│   │   ├── calculateScores()
│   │   │   - Determines correct answer
│   │   │   - Awards points (base + bonuses)
│   │   │   - Returns updated scores
│   │   │
│   │   ├── nextRound()
│   │   │   - Calls calculateScores()
│   │   │   - Emits 'roundResults'
│   │   │   - Increments currentQuestion
│   │   │   - Either nextQuestion() or endGame()
│   │   │
│   │   └── endGame()
│   │       - Emits 'gameEnd' with final scores
│   │       - Calculates rankings
│   │       - Saves to database via REST API
│   │       - Resets game state
│   │
│   └── Socket Event Handlers:
│       │
│       ├── 'connection' (socket)
│       │   - Validates JWT (via auth middleware)
│       │   - Adds player to gameState
│       │   - Starts game if 2+ players
│       │
│       ├── 'submitAnswer' (data)
│       │   - Stores answer + timestamp
│       │   - Broadcasts 'playerAnswered' to all
│       │
│       └── 'disconnect'
│           - Removes player from gameState
│           - (Future: Handle mid-game disconnects)
│
└── services/
    │
    ├── database.js (Backend API Wrapper)
    │   │
    │   ├── saveGameSession(eventId)
    │   │   POST /api/v1/game/sessions
    │   │
    │   ├── addParticipant(sessionId, userId)
    │   │   POST /api/v1/game/sessions/{id}/participants/{userId}
    │   │
    │   └── saveGameResults(sessionId, results)
    │       POST /api/v1/game/sessions/{id}/participants/{userId}/results
    │
    └── auth.js (JWT Middleware)
        │
        └── socketAuthMiddleware(socket, next)
            - Extracts token from socket.handshake.auth.token
            - Verifies with jwt.verify()
            - Attaches userId to socket.userId
            - Calls next() or next(error)
```

### Backend: FastAPI Application Architecture

```
backend/app/
│
├── models.py (SQLModel Definitions)
│   │
│   ├── User
│   │   - id, email, hashed_password, full_name, university
│   │
│   ├── Event
│   │   - id, title, description, start_date, end_date
│   │
│   ├── GameSession
│   │   - id, event_id (FK), status, start_time, end_time
│   │   - Relationships: participants (one-to-many)
│   │
│   └── GameParticipant
│       - id, session_id (FK), user_id (FK), score, rank, joined_at
│       - Relationships: session (many-to-one), user (many-to-one)
│
├── api/routes/game.py (REST Endpoints)
│   │
│   ├── POST /game/sessions
│   │   - Create new game session
│   │   - Used by: Game server on game start
│   │
│   ├── GET /game/sessions
│   │   - List sessions (with pagination + filtering)
│   │   - Used by: Frontend dashboard, admin panel
│   │
│   ├── GET /game/sessions/{id}
│   │   - Get single session details
│   │   - Used by: Session detail page
│   │
│   ├── PUT /game/sessions/{id}
│   │   - Update session (status, end_time)
│   │   - Used by: Game server on game end
│   │
│   ├── POST /game/sessions/{id}/participants/{user_id}
│   │   - Add participant to session
│   │   - Used by: Game server on player join
│   │
│   ├── POST /game/sessions/{id}/participants/{user_id}/results
│   │   - Save participant results (score, rank)
│   │   - Used by: Game server on game end
│   │
│   ├── GET /game/leaderboard/session/{id}
│   │   - Get session-specific leaderboard
│   │   - Used by: Results page
│   │
│   └── GET /game/leaderboard/global
│       - Get global leaderboard (aggregated)
│       - Used by: Global leaderboard page
│
└── core/db.py
    └── Database connection and session management
```

---

## State Management

### Client-Side State (Game.js)

```javascript
class Game {
  // Instance properties (per-client state)
  this.app            // Pixi.js Application instance
  this.socket         // Socket.io connection
  this.currentScene   // Active scene (WaitingScene, QuizScene, etc.)
  this.score          // This player's score
  this.playerId       // This player's socket ID
  this.players        // Array of all players { id, userId, score }
  this.token          // JWT token for authentication
  this.serverUrl      // Game server WebSocket URL
}
```

**Scope**: Single browser tab, single user.

**Lifecycle**: Created on /game page load, destroyed on page leave.

**Persistence**: None (ephemeral).

### Server-Side State (Game Server)

```javascript
// Global state (shared across all connections)
const gameState = {
  sessionId: null,           // UUID from database
  sessionStartTime: null,    // Timestamp
  players: {                 // { [socketId]: { id, userId, score } }
    'abc123': { id: 'abc123', userId: 'uuid-user-1', score: 20 },
    'def456': { id: 'def456', userId: 'uuid-user-2', score: 10 }
  },
  currentQuestion: 0,        // Question index (0-based)
  answers: {                 // { [socketId]: { choice, timestamp } }
    'abc123': { choice: 2, timestamp: 1638360000000 }
  },
  scores: {                  // { [socketId]: totalScore }
    'abc123': 20,
    'def456': 10
  },
  gameStarted: false,        // Boolean
  roundTimer: null           // setTimeout reference
};
```

**Scope**: Entire game server process (all sessions share this state currently).
**Lifecycle**: Reset on game end, persists between games.
**Persistence**: Final results saved to database, in-progress state lost on server restart.

⚠️ **Limitation**: Current implementation supports ONE game at a time.
**Future Enhancement**: Multi-room support (see Extensibility section in Developer Guide).

### Database State (Persistent)

**Tables storing game data:**

1. **gamesession** - Game metadata
   - When it started/ended
   - Which event it's linked to
   - Status (in_progress, completed)

2. **gameparticipant** - Player participation
   - Who played
   - When they joined
   - Final score & rank

---

## Authentication Flow

```
┌──────────────┐
│   User       │
└──────────────┘
       │
       │ 1. Login
       │    POST /api/v1/login/access-token
       │    { username, password }
       ▼
┌──────────────────┐
│  FastAPI Backend │
└──────────────────┘
       │
       │ 2. Verify credentials
       │    - Check hashed password
       │    - Validate user
       ▼
       │ 3. Generate JWT
       │    jwt.encode({
       │      sub: user.id,
       │      exp: now + 30 days
       │    }, SECRET_KEY)
       │
       │ 4. Return token
       │    { access_token: "eyJ0eXAi..." }
       ▼
┌──────────────┐
│ React App    │
└──────────────┘
       │
       │ 5. Store in localStorage
       │    localStorage.setItem('access_token', token)
       │
       │ 6. Use for REST API calls
       │    headers: { Authorization: `Bearer ${token}` }
       │
       │ 7. Use for WebSocket
       │    socket = io(url, { auth: { token } })
       ▼
┌──────────────────┐
│  Game Server     │
└──────────────────┘
       │
       │ 8. Validate JWT
       │    jwt.verify(token, SECRET_KEY)
       │    → Decode payload → { sub: user.id }
       │
       │ 9. Attach to socket
       │    socket.userId = decoded.sub
       │
       ▼ 10. Authorized to play!
```

**Key Points:**
- Same `SECRET_KEY` used by both Backend and Game Server
- Token contains user_id in `sub` claim
- 30-day expiration (configurable)
- Token sent in two ways:
  - REST: `Authorization: Bearer <token>` header
  - WebSocket: `auth: { token }` parameter

---

## Design Patterns

### 1. Scene Pattern (Frontend)

**Pattern**: Each game state is a separate "scene" class.

**Benefits:**
- Clear separation of concerns
- Easy to add new game states
- Clean transitions between states

**Implementation:**
```javascript
// All scenes implement:
class Scene {
  constructor(app) {
    this.container = new Container();
    // Build UI
  }

  destroy() {
    this.container.destroy({ children: true });
  }
}

// Game.js switches scenes:
showQuizScene() {
  if (this.currentScene) {
    this.currentScene.destroy();
    this.app.stage.removeChild(this.currentScene.container);
  }
  this.currentScene = new QuizScene(...);
  this.app.stage.addChild(this.currentScene.container);
}
```

### 2. Event-Driven Architecture

**Pattern**: Socket.io events drive all game state changes.

**Benefits:**
- Real-time synchronization
- Loose coupling between client and server
- Easy to add new events

**Implementation:**
```javascript
// Server emits events
io.emit('newQuestion', questionData);

// Clients listen and react
socket.on('newQuestion', (data) => {
  this.showQuizScene(data);
});
```

### 3. Service Layer (Game Server)

**Pattern**: Separate services for database and auth operations.

**Benefits:**
- Single Responsibility Principle
- Easier testing
- Swappable implementations

**Files:**
- `services/database.js` - All backend API calls
- `services/auth.js` - JWT verification

### 4. Repository Pattern (Backend)

**Pattern**: SQLModel handles database operations.

**Benefits:**
- Type safety
- Auto-generated migrations
- Clean query API

**Example:**
```python
# No raw SQL needed
session.exec(
  select(GameSession)
  .where(GameSession.event_id == event_id)
).all()
```

---

## File Dependencies

### Frontend Dependencies

```
GameClient.tsx
  ├── Imports: Pixi.js Application
  ├── Imports: game-client/game.js
  └── Renders: Pixi canvas + game instance

game-client/game.js
  ├── Imports: socket.io-client
  ├── Imports: scenes/*.js
  └── Manages: Socket connection + scene lifecycle

scenes/quiz-scene.js
  ├── Imports: components/choice-button.js
  ├── Imports: components/question.js
  ├── Imports: components/stick-figure.js
  └── Builds: Quiz UI

components/choice-button.js
  └── Imports: Pixi.js Graphics, Text
```

### Game Server Dependencies

```
server.js
  ├── Imports: express
  ├── Imports: socket.io
  ├── Imports: services/database.js
  ├── Imports: services/auth.js
  └── Runs: Game loop

services/database.js
  └── Makes: Fetch calls to Backend API

services/auth.js
  ├── Imports: jsonwebtoken
  └── Uses: process.env.SECRET_KEY
```

### Backend Dependencies

```
api/routes/game.py
  ├── Imports: FastAPI
  ├── Imports: SQLModel
  ├── Imports: models.py
  └── Defines: REST endpoints

models.py
  ├── Imports: SQLModel
  └── Defines: Database tables
```

---

## Configuration Files

### Docker Compose

**File:** `docker-compose.yml`

```yaml
services:
  frontend:
    ports: ["5173:5173"]
    env_file: [.env, frontend/.env]

  backend:
    ports: ["8000:8000"]
    env_file: [.env]

  game-server:
    ports: ["3001:3001"]
    env_file: [.env]
    environment:
      BACKEND_URL: http://backend:8000  # Internal Docker network

  db:
    image: postgres:16
    volumes: [app-db-data:/var/lib/postgresql/data]
```

### Environment Variables

**Root `.env`** (shared by all services):
```bash
SECRET_KEY=your-secret-key-here  # CRITICAL: Must be same everywhere
POSTGRES_SERVER=db
POSTGRES_USER=postgres
POSTGRES_PASSWORD=changethis
POSTGRES_DB=app
```

**Frontend `.env`** (frontend/.env):
```bash
VITE_API_URL=http://localhost:8000         # User's browser → Backend
VITE_GAME_SERVER_URL=http://localhost:3001 # User's browser → Game Server
```

**Game Server environment** (from docker-compose.yml):
```bash
BACKEND_URL=http://backend:8000  # Game Server → Backend (internal network)
SECRET_KEY=${SECRET_KEY}         # From root .env
```

---

## Ports Reference

| Service | Port | External URL | Internal URL (Docker) | Purpose |
|---------|------|--------------|----------------------|---------|
| Frontend | 5173 | http://localhost:5173 | http://frontend:5173 | React dev server |
| Backend | 8000 | http://localhost:8000 | http://backend:8000 | FastAPI REST API |
| Game Server | 3001 | http://localhost:3001 | http://game-server:3001 | Socket.io WebSocket |
| Database | 5432 | localhost:5432 | postgres://db:5432 | PostgreSQL |
| Adminer | 8080 | http://localhost:8080 | http://adminer:8080 | DB admin UI |

**Note:** User browsers connect to **external URLs**. Services connect to each other via **internal URLs**.

---

## Next Steps

For implementation details and code examples, see:
- **DEVELOPER_GUIDE.md** - Comprehensive development guide
- **QUICK_REFERENCE.md** - Quick task lookup
- **TESTING_GUIDE.md** - Testing procedures

---

*This architecture reference provides a deep understanding of system design. Use it when planning new features or debugging complex issues.*
