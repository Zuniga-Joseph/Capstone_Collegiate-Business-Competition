# Developer Guide

**Last Updated:** December 2025
**Version:** 2.0 (Post Server-Merge Integration)

## Table of Contents

1. [Architecture Overview](#architecture-overview)
2. [Directory Structure](#directory-structure)
3. [Data Flow & Communication](#data-flow--communication)
4. [Quick Start for Developers](#quick-start-for-developers)
5. [Common Modification Patterns](#common-modification-patterns)
6. [API Reference](#api-reference)
7. [Database Schema](#database-schema)
8. [NCBC Event Integration](#ncbc-event-integration)
9. [Extensibility Patterns](#extensibility-patterns)
10. [Testing & Debugging](#testing--debugging)

---

## Architecture Overview

### System Components

The game system consists of four main components:

```
┌─────────────────────────────────────────────────────────────────┐
│                         ARCHITECTURE                            │
├─────────────────────────────────────────────────────────────────┤
│                                                                 │
│  ┌────────────────┐           ┌──────────────────┐              │
│  │  Game Client   │           │   Game Server    │              │
│  │  (Frontend)    │◄────────► │   (Socket.io)    │              │
│  │                │  WebSocket│                  │              │
│  │  - Pixi.js UI  │           │  - Game Logic    │              │
│  │  - Scenes      │           │  - State Machine │              │
│  │  - Components  │           │  - Player Mgmt   │              │
│  └────────────────┘           └──────────────────┘              │
│         │                             │                         │
│         │ JWT Token                   │ REST API                │
│         │                             ▼                         │
│         │                    ┌──────────────────┐               │
│         │                    │  FastAPI Backend │               │
│         └───────────────────►│                  │               │
│           (Login)            │  - Auth          │               │
│                              │  - Game API      │               │
│                              │  - DB Operations │               │
│                              └──────────────────┘               │
│                                       │                         │
│                                       ▼                         │
│                              ┌──────────────────┐               │
│                              │   PostgreSQL     │               │
│                              │   Database       │               │
│                              └──────────────────┘               │
└─────────────────────────────────────────────────────────────────┘
```

### Component Responsibilities

| Component | Technology | Responsibility | Location |
|-----------|-----------|----------------|----------|
| **Game Client** | Pixi.js + Socket.io-client | Rendering, UI, user input | `frontend/src/game-client/` |
| **Game Server** | Node.js + Socket.io | Real-time game logic, state management | `game-server/src/` |
| **Backend API** | FastAPI + SQLModel | Authentication, data persistence, REST endpoints | `backend/app/` |
| **Database** | PostgreSQL | Game sessions, participants, scores | Docker container |

### Key Architectural Decisions

1. **Client-Server Separation**: Game rendering (Pixi.js) runs entirely in the browser. Server only manages game state and logic.
2. **JWT Authentication**: Single token used for both REST API and WebSocket connections.
3. **Stateful Game Server**: Game state lives in memory on the game server for performance. Final results persisted to DB.
4. **Event-Driven**: Socket.io events drive the game flow (questions, answers, results).

---

## Directory Structure

### Frontend Game Client (`frontend/src/game-client/`)

```
frontend/src/game-client/
├── game.js                    # Main Game class - Socket.io connection & scene management
├── components/                # Reusable Pixi.js UI components
│   ├── choice-button.js       # Answer choice buttons
│   ├── question.js            # Question text display (currently unused)
│   └── stick-figure.js        # Player avatar on answers
├── scenes/                    # Game scenes (full-screen states)
│   ├── waiting-scene.js       # Pre-game lobby
│   ├── quiz-scene.js          # Active question/answer phase
│   └── result-scene.js        # End-game scoreboard
├── handlers/                  # Event handlers (future use, may be redundant)
│   └── dashboard/
│       ├── leaderboard.js     # Leaderboard display logic
│       └── sessions.js        # Session list logic
└── data/                      # Static game data (unused, may remove)
    └── questions.js           # Sample questions (client-side reference)
```

### Game Server (`game-server/src/`)

```
game-server/src/
├── server.js                  # Main Socket.io server with game loop
└── services/                  # Service modules
    ├── database.js            # Database operations (REST API calls)
    └── auth.js                # JWT authentication middleware
```

### Backend API (`backend/app/`)

```
backend/app/
├── api/routes/
│   └── game.py                # Game-related REST endpoints
└── models.py                  # Database models (GameSession, GameParticipant, etc.)
```

### React Integration

```
frontend/src/
├── components/Game/
│   └── GameClient.tsx         # React wrapper component for Pixi.js game
└── routes/_layout/
    └── game.tsx               # Protected game route (/game)
```

---

## Data Flow & Communication

### User Journey

```
1. User Login (Frontend → Backend)
   POST /api/v1/login/access-token
                ↓
   JWT token stored in localStorage

2. Navigate to Game (/game route)
   Frontend loads GameClient.tsx
                ↓
   Retrieves token from localStorage

3. WebSocket Connection (Frontend → Game Server)
   Socket.io connects with auth: { token }
                ↓
   Server validates JWT, extracts user ID

4. Game Start (2+ players join)
   Server → All clients: 'gameStart' event
                ↓
   Clients transition to waiting screen

5. Question Flow
   Server → Clients: 'newQuestion' { question, choices, ... }
                ↓
   Client displays question
                ↓
   Server → Clients: 'answerPeriodStart' (after choice reveal)
                ↓
   Client → Server: 'submitAnswer' { choiceIndex }
                ↓
   Server → All: 'playerAnswered' { playerId, choice }
                ↓
   Server → All: 'roundResults' { scores, correctAnswer }

6. Game End
   Server → Clients: 'gameEnd' { finalScores }
                ↓
   Client displays results for 10 seconds
                ↓
   Server → Backend: POST /api/v1/game/sessions (save to DB)
                ↓
   Client redirects to dashboard

7. View Results (Backend → Frontend)
   GET /api/v1/game/leaderboard/global
```

### Socket.io Events Reference

#### Client → Server Events

| Event | Payload | Description |
|-------|---------|-------------|
| `connection` | `{ auth: { token } }` | Initial WebSocket connection with JWT |
| `submitAnswer` | `{ choiceIndex: number }` | Player submits answer choice |
| `disconnect` | - | Player disconnects |

#### Server → Client Events

| Event | Payload | When Fired |
|-------|---------|------------|
| `gameStart` | `{ players: [...] }` | 2+ players connected |
| `newQuestion` | `{ question, choices, questionNumber, totalQuestions }` | New question begins |
| `answerPeriodStart` | - | All choices revealed, timer starts |
| `playerAnswered` | `{ playerId, choiceIndex }` | Another player submitted answer |
| `roundResults` | `{ correctAnswer, scores, allCorrect }` | Round ends, show results |
| `gameEnd` | `{ scores: { playerId: score } }` | All questions completed |

### Backend REST API Flow

```javascript
// Game Server calls Backend REST API to persist data

// 1. Create session when game starts
POST /api/v1/game/sessions
Body: {
  event_id: uuid (optional),
  status: "in_progress"
}
Response: { id: uuid, ... }

// 2. Add participants as they join
POST /api/v1/game/sessions/{session_id}/participants/{user_id}

// 3. Update session status
PUT /api/v1/game/sessions/{session_id}
Body: { status: "completed" }

// 4. Save individual results
POST /api/v1/game/sessions/{session_id}/participants/{user_id}/results
Body: { score: number, rank: number }
```

---

## Quick Start for Developers

### Setting Up Development Environment

```bash
# 1. Start all services
docker compose watch

# 2. Access the application
# Frontend: http://localhost:5173
# Backend API: http://localhost:8000/docs
# Game Server: http://localhost:3001
```

### Making Your First Change

**Example: Add a new question *(WIP, WILL CHANGE)***

1. **Add question to game server** (`game-server/src/server.js`):

```javascript
const questions = [
  {
    question: "What is the capital of France?",
    choices: ["London", "Berlin", "Paris", "Madrid"],
    correctAnswer: 2
  },
  // Add your new question here
  {
    question: "What does CPU stand for?",
    choices: ["Central Processing Unit", "Computer Personal Unit", "Central Processor Utility", "Central Program Utility"],
    correctAnswer: 0
  }
];
```

2. **Test immediately**: Changes auto-reload with `docker compose watch`.

3. **Play a game**: Open http://localhost:5173/game in 2 browser windows.

---

## Common Modification Patterns

### 1. Add New Questions

**File**: `game-server/src/server.js`

```javascript
// Current: Hardcoded array
const questions = [ /* ... */ ];

// Load from database
// Future enhancement: Create Question model and fetch via API
async function loadQuestions(eventId = null) {
  const response = await fetch(`${process.env.BACKEND_URL}/api/v1/questions?event_id=${eventId}`);
  return response.json();
}
```

**Steps to implement database-backed questions**:
1. Create Question model in `backend/app/models.py`
2. Add CRUD endpoints in `backend/app/api/routes/questions.py`
3. Modify `game-server/src/server.js` to fetch questions on game start
4. Link questions to events via `event_id` foreign key

### 2. Modify Scoring Logic

**File**: `game-server/src/server.js`

**Current logic** (lines ~145-180):

```javascript
function calculateScores() {
  const correctAnswer = questions[gameState.currentQuestion].correctAnswer;
  const results = { scores: {}, correctAnswer, allCorrect: true };
  let allCorrect = true;
  let firstCorrectPlayerId = null;

  // Find first correct answer
  for (const playerId in gameState.answers) {
    const playerChoice = gameState.answers[playerId].choice;
    if (playerChoice === correctAnswer && !firstCorrectPlayerId) {
      firstCorrectPlayerId = playerId;
    }
  }

  // Calculate scores
  for (const playerId in gameState.players) {
    const playerChoice = gameState.answers[playerId]?.choice;
    let points = 0;

    if (playerChoice === correctAnswer) {
      points = 10; // Base points for correct answer

      // Bonus for first correct
      if (playerId === firstCorrectPlayerId) {
        points += 5;
      }
    } else {
      allCorrect = false;
    }

    gameState.scores[playerId] = (gameState.scores[playerId] || 0) + points;
  }

  // Bonus if everyone got it right
  if (allCorrect) {
    for (const playerId in gameState.players) {
      gameState.scores[playerId] += 5;
    }
  }

  results.scores = gameState.scores;
  results.allCorrect = allCorrect;
  return results;
}
```

**Modification examples**:

```javascript
// Example 1: Speed-based scoring (faster = more points)
if (playerChoice === correctAnswer) {
  const timeBonus = Math.max(0, 30 - (answerTime - roundStartTime) / 1000);
  points = 10 + Math.floor(timeBonus);
}

// Example 2: Difficulty-based scoring
const difficulty = questions[gameState.currentQuestion].difficulty; // easy/medium/hard
const basePoints = { easy: 5, medium: 10, hard: 15 }[difficulty];
points = basePoints;

// Example 3: Streak bonuses
if (playerStreak[playerId] >= 3) {
  points += 10; // Bonus for 3 correct in a row
}
```

### 3. Add New Game Modes

**Pattern**: Create new scene classes and game state machines.

**Example: Team-based mode**

1. **Create new scene** (`frontend/src/game-client/scenes/team-quiz-scene.js`):

```javascript
export class TeamQuizScene extends QuizScene {
  constructor(app, questionData, onSubmitAnswer, teamId, teamMembers) {
    super(app, questionData, onSubmitAnswer);
    this.teamId = teamId;
    this.teamMembers = teamMembers;
    this.showTeamIndicators();
  }

  showTeamIndicators() {
    // Add team color, member avatars, etc.
  }
}
```

2. **Modify server logic** (`game-server/src/server.js`):

```javascript
const gameState = {
  // ... existing fields
  gameMode: 'solo', // or 'team', 'tournament', etc.
  teams: {}, // { teamId: [playerId1, playerId2] }
};

function calculateTeamScores() {
  // Aggregate individual scores by team
  const teamScores = {};
  for (const teamId in gameState.teams) {
    teamScores[teamId] = gameState.teams[teamId].reduce(
      (sum, playerId) => sum + (gameState.scores[playerId] || 0),
      0
    );
  }
  return teamScores;
}
```

3. **Add mode selection UI** (frontend React component):

```typescript
// In GameClient.tsx or new GameLobby.tsx
<select onChange={(e) => setGameMode(e.target.value)}>
  <option value="solo">Solo</option>
  <option value="team">Team</option>
  <option value="tournament">Tournament</option>
</select>
```

### 4. Customize UI/Styling

**Files**: `frontend/src/game-client/components/*.js` and `scenes/*.js`

**Example: Change button colors**

```javascript
// frontend/src/game-client/components/choice-button.js
export class ChoiceButton {
  constructor(text, x, y, width, height, onClick) {
    this.container = new Graphics();

    // Current: Blue button
    this.container.rect(0, 0, width, height);
    this.container.fill(0x3498db);

    // Change to green
    this.container.fill(0x27ae60);

    // Or dynamic based on choice index
    const colors = [0xe74c3c, 0x3498db, 0x2ecc71, 0xf39c12]; // Red, Blue, Green, Orange
    this.container.fill(colors[choiceIndex]);
  }
}
```

**Example: Add custom fonts**

```javascript
// In game.js or scene files
import { TextStyle } from 'pixi.js';

const customStyle = new TextStyle({
  fontFamily: 'Arial, sans-serif',
  fontSize: 32,
  fill: 0xffffff,
  fontWeight: 'bold',
  dropShadow: {
    color: 0x000000,
    blur: 4,
    angle: Math.PI / 6,
    distance: 6,
  }
});

const text = new Text({ text: 'Question 1', style: customStyle });
```

### 5. Prevent Duplicate Users (Same User ID Joining Twice)

**Current behavior**: Same user can join from multiple browser windows (tracked by socket ID).

**To prevent duplicate users:**

```javascript
// game-server/src/server.js
io.on('connection', async (socket) => {
  const userId = socket.userId;
  console.log(`Player connected: ${socket.id} (User: ${userId})`);

  // Check if this userId is already in the game
  const existingPlayer = Object.values(gameState.players).find(
    player => player.userId === userId
  );

  if (existingPlayer) {
    console.log(`User ${userId} attempted to join twice. Rejecting.`);
    socket.emit('error', {
      message: 'You are already in this game session.'
    });
    socket.disconnect(true);
    return;
  }

  // Continue with normal connection logic
  gameState.players[socket.id] = {
    id: socket.id,
    userId: userId,
    score: 0
  };
  // ... rest of code
});
```

**Client-side handling:**

```javascript
// frontend/src/game-client/game.js
this.socket.on('error', (data) => {
  console.error('Server error:', data.message);
  alert(data.message);
  window.location.href = '/'; // Redirect to home
});
```

**Alternative: Allow but mark as duplicate in DB**
If you want to allow for testing but track in database:

```javascript
gameState.players[socket.id] = {
  id: socket.id,
  userId: userId,
  score: 0,
  isDuplicate: !!existingPlayer
};
```

### 6. Add Player Avatars/Profiles

**Recommended approach**: Fetch user data from backend when players join.

```javascript
// game-server/src/server.js
io.on('connection', async (socket) => {
  const userId = socket.userId;

  // Fetch user profile from backend
  const userProfile = await fetchUserProfile(userId);

  gameState.players[socket.id] = {
    id: socket.id,
    userId: userId,
    username: userProfile.full_name,
    avatarUrl: userProfile.avatar_url, // If you add this field
    score: 0
  };

  // Broadcast updated player list
  io.emit('playersUpdated', Object.values(gameState.players));
});

async function fetchUserProfile(userId) {
  const response = await fetch(`${process.env.BACKEND_URL}/api/v1/users/${userId}`);
  return response.json();
}
```

```javascript
// frontend/src/game-client/scenes/waiting-scene.js
export class WaitingScene {
  showPlayerList(players) {
    players.forEach((player, index) => {
      // Show avatar image
      const avatar = Sprite.from(player.avatarUrl);
      avatar.x = 100;
      avatar.y = 100 + (index * 80);

      // Show username
      const nameText = new Text({ text: player.username });
      nameText.x = 180;
      nameText.y = 100 + (index * 80);

      this.container.addChild(avatar, nameText);
    });
  }
}
```

---

## API Reference

### REST API Endpoints

Base URL: `http://localhost:8000/api/v1`

#### Game Sessions

##### `POST /game/sessions`
Create a new game session.

**Request Body:**
```json
{
  "event_id": "uuid (optional)",
  "status": "in_progress"
}
```

**Response:** `GameSessionPublic`
```json
{
  "id": "uuid",
  "event_id": "uuid or null",
  "status": "in_progress",
  "start_time": "2025-12-08T10:00:00Z",
  "end_time": null
}
```

##### `GET /game/sessions`
List all game sessions (paginated).

**Query Parameters:**
- `skip` (int, default: 0)
- `limit` (int, default: 100)
- `event_id` (uuid, optional): Filter by event

**Response:** `GameSessionsPublic`
```json
{
  "data": [ /* array of GameSessionPublic */ ],
  "count": 42
}
```

##### `GET /game/sessions/{session_id}`
Get specific session details.

**Response:** `GameSessionPublic`

##### `PUT /game/sessions/{session_id}`
Update session (e.g., mark as completed).

**Request Body:**
```json
{
  "status": "completed",
  "end_time": "2025-12-08T10:15:00Z"
}
```

#### Participants

##### `POST /game/sessions/{session_id}/participants/{user_id}`
Add participant to session.

**Response:** `Message`
```json
{
  "message": "Participant added successfully"
}
```

##### `POST /game/sessions/{session_id}/participants/{user_id}/results`
Save participant results.

**Request Body:**
```json
{
  "score": 45,
  "rank": 2
}
```

#### Leaderboards

##### `GET /game/leaderboard/session/{session_id}`
Get leaderboard for specific session.

**Response:** `GameSessionLeaderboard`
```json
{
  "session_id": "uuid",
  "entries": [
    {
      "user_id": "uuid",
      "username": "John Doe",
      "score": 45,
      "rank": 1
    }
  ]
}
```

##### `GET /game/leaderboard/global`
Get global leaderboard (aggregated across all sessions).

**Query Parameters:**
- `skip`, `limit`: Pagination
- `event_id` (optional): Filter by event

**Response:**
```json
{
  "data": [
    {
      "user_id": "uuid",
      "username": "Jane Smith",
      "total_score": 450,
      "games_played": 10,
      "average_score": 45.0,
      "best_rank": 1
    }
  ],
  "count": 100
}
```

### Socket.io Events

See [Data Flow & Communication](#data-flow--communication) section for complete event reference.

---

## Database Schema

### GameSession

**Table:** `gamesession`

| Column | Type | Description |
|--------|------|-------------|
| `id` | UUID | Primary key |
| `event_id` | UUID (FK) | Link to Event table (optional) |
| `status` | Enum | `in_progress`, `completed`, `cancelled` |
| `start_time` | DateTime | When game started |
| `end_time` | DateTime | When game ended (nullable) |

**Relationships:**
- `event_id` → `event.id` (many-to-one)
- `participants` → `GameParticipant` (one-to-many)

### GameParticipant

**Table:** `gameparticipant`

| Column | Type | Description |
|--------|------|-------------|
| `id` | UUID | Primary key |
| `session_id` | UUID (FK) | Link to GameSession |
| `user_id` | UUID (FK) | Link to User |
| `score` | Integer | Final score |
| `rank` | Integer | Final rank in session |
| `joined_at` | DateTime | When player joined |

**Relationships:**
- `session_id` → `gamesession.id` (many-to-one)
- `user_id` → `user.id` (many-to-one)

### Event

**Table:** `event` (existing)

| Column | Type | Description |
|--------|------|-------------|
| `id` | UUID | Primary key |
| `title` | String | Event name |
| `description` | Text | Event details |
| `start_date` | DateTime | Event start |
| `end_date` | DateTime | Event end |

**Related to NCBC**: Events can be linked to specific NCBC competitions (e.g., "Nashville Sales Challenge 2025").

### User

**Table:** `user` (existing)

| Column | Type | Description |
|--------|------|-------------|
| `id` | UUID | Primary key |
| `email` | String | Login email |
| `full_name` | String | Display name |
| `university` | String | Student's university |

---

## NCBC Event Integration (*example*)

### Overview

The NCBC (National Collegiate Business Championships) uses this game system to test student competencies across multiple categories and subfactors.

### Linking Games to Events

**Current State**: Games can be optionally linked to events via `event_id`.

**Implementation Steps:**

1. **Create Event** (via API or Admin UI):
```bash
POST /api/v1/events
{
  "title": "Nashville Sales Challenge 2025",
  "description": "Tests Core Competence and Social Intelligence",
  "start_date": "2025-03-01T09:00:00Z",
  "end_date": "2025-03-01T17:00:00Z"
}
```

2. **Configure Event Game Settings** (future enhancement):

```python
# backend/app/models.py
class EventGameConfig(SQLModel, table=True):
    event_id: uuid.UUID = Field(foreign_key="event.id")
    game_mode: str  # "quiz", "simulation", "case_study"
    question_set_id: uuid.UUID  # Link to pre-configured questions
    time_limit: int  # seconds per question
    ncbc_category: str  # "Core Competence", etc.
    ncbc_subfactor: str  # "Cognitive Ability", "Social Intelligence", etc.
```

3. **Start Game for Event**:

```javascript
// game-server/src/server.js
async function startGameForEvent(eventId) {
  // Fetch event config
  const config = await fetchEventGameConfig(eventId);

  // Load event-specific questions
  const questions = await loadQuestions(config.question_set_id);

  // Create session linked to event
  const sessionId = await createGameSession({ event_id: eventId });

  // Start game with event rules
  startGame(questions, config);
}
```

### Event Leaderboards

**Display rankings specific to an event:**

```bash
GET /api/v1/game/leaderboard/event/{event_id}
```

```python
# backend/app/api/routes/game.py
@router.get("/leaderboard/event/{event_id}")
def get_event_leaderboard(event_id: uuid.UUID, session: SessionDep):
    # Get all sessions for this event
    sessions = session.exec(
        select(GameSession).where(GameSession.event_id == event_id)
    ).all()

    # Aggregate participant scores across all sessions
    # ... (implementation similar to global leaderboard)
```

---

## Extensibility Patterns

### 1. Plugin Architecture for Game Modes

**Goal**: Allow new game modes without modifying core code.

```javascript
// game-server/src/game-modes/base-game-mode.js
export class BaseGameMode {
  constructor(io, gameState) {
    this.io = io;
    this.gameState = gameState;
  }

  onPlayerJoin(socket) { throw new Error('Not implemented'); }
  onGameStart() { throw new Error('Not implemented'); }
  onAnswerSubmit(playerId, answer) { throw new Error('Not implemented'); }
  calculateScores() { throw new Error('Not implemented'); }
}

// game-server/src/game-modes/quiz-mode.js
export class QuizMode extends BaseGameMode {
  onPlayerJoin(socket) {
    // Current quiz logic
  }

  calculateScores() {
    // Current scoring logic
  }
}

// game-server/src/game-modes/simulation-mode.js
export class SimulationMode extends BaseGameMode {
  onGameStart() {
    // Load simulation scenario
    this.io.emit('simulationStart', { scenario: this.scenario });
  }

  calculateScores() {
    // Score based on decisions, not answers
  }
}

// game-server/src/server.js
import { QuizMode } from './game-modes/quiz-mode.js';
import { SimulationMode } from './game-modes/simulation-mode.js';

const gameModes = {
  quiz: QuizMode,
  simulation: SimulationMode,
};

const gameMode = new gameModes[config.mode](io, gameState);
```

### 2. Question Type System

**Goal**: Support multiple question formats (MCQ, true/false, open-ended, etc.).

```javascript
// game-server/src/question-types/base-question.js
export class BaseQuestion {
  validate(answer) { throw new Error('Not implemented'); }
  calculatePoints(answer, timeElapsed) { throw new Error('Not implemented'); }
}

// game-server/src/question-types/multiple-choice.js
export class MultipleChoiceQuestion extends BaseQuestion {
  constructor(data) {
    super();
    this.question = data.question;
    this.choices = data.choices;
    this.correctAnswer = data.correctAnswer;
  }

  validate(answer) {
    return answer === this.correctAnswer;
  }

  calculatePoints(answer, timeElapsed) {
    if (!this.validate(answer)) return 0;
    const speedBonus = Math.max(0, 30 - timeElapsed);
    return 10 + speedBonus;
  }
}

// game-server/src/question-types/open-ended.js
export class OpenEndedQuestion extends BaseQuestion {
  constructor(data) {
    super();
    this.question = data.question;
    this.keywords = data.keywords; // Expected keywords in answer
  }

  validate(answer) {
    // Simple keyword matching (could use NLP in future)
    const lowerAnswer = answer.toLowerCase();
    return this.keywords.some(kw => lowerAnswer.includes(kw.toLowerCase()));
  }

  calculatePoints(answer, timeElapsed) {
    const matchedKeywords = this.keywords.filter(kw =>
      answer.toLowerCase().includes(kw.toLowerCase())
    );
    return matchedKeywords.length * 5; // 5 points per keyword
  }
}
```

### 3. Event Hooks for Analytics

**Goal**: Track detailed analytics without bloating core code.

```javascript
// game-server/src/hooks/analytics-hook.js
export class AnalyticsHook {
  onPlayerJoin(player) {
    // Track player join time, device, etc.
    this.logEvent('player_join', { userId: player.userId, timestamp: Date.now() });
  }

  onAnswerSubmit(playerId, questionId, answer, timeElapsed) {
    this.logEvent('answer_submit', {
      playerId,
      questionId,
      answer,
      timeElapsed,
      timestamp: Date.now()
    });
  }

  onGameEnd(sessionId, finalScores) {
    this.logEvent('game_end', { sessionId, finalScores, timestamp: Date.now() });
  }

  async logEvent(eventType, data) {
    // Send to analytics service (e.g., PostHog, Mixpanel)
    await fetch('https://analytics.example.com/events', {
      method: 'POST',
      body: JSON.stringify({ event: eventType, data })
    });
  }
}

// game-server/src/server.js
import { AnalyticsHook } from './hooks/analytics-hook.js';
const analytics = new AnalyticsHook();

io.on('connection', (socket) => {
  analytics.onPlayerJoin(gameState.players[socket.id]);
  // ... rest of connection logic
});
```

### 4. Frontend Component Library

**Goal**: Reusable UI components for consistency.

```javascript
// frontend/src/game-client/ui-library/button.js
export class GameButton extends Graphics {
  constructor({ text, x, y, width, height, color, onClick }) {
    super();
    this.rect(0, 0, width, height);
    this.fill(color);
    this.position.set(x, y);
    this.eventMode = 'static';
    this.cursor = 'pointer';
    this.on('pointerdown', onClick);

    const label = new Text({ text, style: { fontSize: 24, fill: 0xffffff } });
    label.anchor.set(0.5);
    label.position.set(width / 2, height / 2);
    this.addChild(label);
  }
}

// Usage in scenes
import { GameButton } from '../ui-library/button.js';

const startButton = new GameButton({
  text: 'Start Game',
  x: 400,
  y: 500,
  width: 200,
  height: 60,
  color: 0x27ae60,
  onClick: () => this.onStartGame()
});
```

---

## Testing & Debugging

### Running Tests

```bash
# Backend tests
docker compose exec backend pytest app/tests/api/routes/test_game.py -v

# Expected output: 18+ passing tests

# Frontend tests (if implemented)
cd frontend
npm run test
```

### Debugging Tips

#### 1. Game Server Logs

```bash
# Watch game server logs in real-time
docker compose logs -f game-server

# Look for:
# - "Player connected: [socket-id] (User: [user-id])" ✅
# - "Socket authenticated for user: [user-id]" ✅
# - "Game starting with X players" ✅
# - Any error messages ❌
```

#### 2. Socket.io Debugging (Client-side)

```javascript
// frontend/src/game-client/game.js
// Add debug logging
this.socket.onAny((eventName, ...args) => {
  console.log(`[Socket Event] ${eventName}:`, args);
});

// Or enable Socket.io debug mode
import { io } from 'socket.io-client';
localStorage.debug = 'socket.io-client:socket';
```

#### 3. Network Inspection

```
Open Browser DevTools → Network tab → WS (WebSocket) filter
- Check for "101 Switching Protocols" status ✅
- View real-time Socket.io frames
```

#### 4. Database Queries

```bash
# Access Adminer (Database UI)
# Visit: http://localhost:8080
# Login: postgres / [password from .env]
```

#### 5. Common Issues

| Issue | Cause | Solution |
|-------|-------|----------|
| "Loading Game..." stuck | No JWT token | Log out and log back in |
| Socket connection refused | Game server not running | `docker compose restart game-server` |
| Authentication failed | Token expired or invalid | Check `.env` has correct `SECRET_KEY`, restart services |
| Scores not saving to DB | Backend API error | Check `docker compose logs backend` |
| Same user joins twice | By design (socket-based) | Current: allowed for testing. See note below |

**Note on Duplicate Users:** The game currently allows the same `userId` to connect multiple times (different browser windows) because players are tracked by `socket.id`, not `userId`. This is convenient for testing but may not be desired in production. To prevent duplicates, add validation in the connection handler (see Common Modification Patterns section).

### Performance Monitoring

```javascript
// game-server/src/server.js
// Add performance metrics
let gameStartTime;

function startGame() {
  gameStartTime = Date.now();
  // ... existing start logic
}

function endGame() {
  const gameDuration = Date.now() - gameStartTime;
  console.log(`Game completed in ${gameDuration}ms`);
  console.log(`Active players: ${Object.keys(gameState.players).length}`);
  console.log(`Messages exchanged: ${messageCount}`);
}
```

---

## Additional Resources

- **Project Documentation**: See root-level README files
  - `development.md` - Development workflow
  - `deployment.md` - Production deployment
  - `backend/README.md` - Backend specifics
  - `frontend/README.md` - Frontend specifics

- **Existing Guides**:
  - `INTEGRATION_COMPLETE.md` - Integration summary
  - `TESTING_GUIDE.md` - Testing & demo guide
  - `STARTUP_SHUTDOWN_GUIDE.md` - Service management

- **External Documentation**:
  - [Pixi.js Documentation](https://pixijs.com/8.x/guides/getting-started/intro)
  - [Socket.io Documentation](https://socket.io/docs/v4/)
  - [FastAPI Documentation](https://fastapi.tiangolo.com/)
  - [SQLModel Documentation](https://sqlmodel.tiangolo.com/)

---

## Contributing

When adding new features or making changes:

1. **Follow existing patterns** in the codebase
2. **Update this documentation** if you change architecture
3. **Write tests** for new API endpoints
4. **Test multiplayer** with 2+ browser windows
5. **Verify database persistence** after changes

---

**Questions or Issues?**

- Check existing documentation first
- Review code comments in key files
- Test in development environment before production
- Ask team members for clarification on NCBC-specific requirements

---

*This guide is a living document. Please update it as the system evolves!*
