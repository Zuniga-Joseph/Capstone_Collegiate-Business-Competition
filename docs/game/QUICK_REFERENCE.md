# Game System - Quick Reference

**Quick lookup guide for common development tasks**

---

## File Locations Cheat Sheet

### Where to modify...

| What you want to change                  | File(s) to edit |
|------------------------------------------|----------------|
| **Add/modify questions (TO BE CHANGED)** | `game-server/src/server.js` (lines 48-64) |
| **Change scoring logic**                 | `game-server/src/server.js` (function `calculateScores`) |
| **Modify game UI/colors**                | `frontend/src/game-client/components/*.js` |
| **Add new scenes**                       | `frontend/src/game-client/scenes/` (create new file) |
| **Change game rules**                    | `game-server/src/server.js` (functions `startGame`, `nextQuestion`) |
| **Modify API endpoints**                 | `backend/app/api/routes/game.py` |
| **Update database schema**               | `backend/app/models.py` + create migration |
| **Change authentication**                | `game-server/src/services/auth.js` |
| **Add database operations**              | `game-server/src/services/database.js` |
| **Modify React game page**               | `frontend/src/routes/_layout/game.tsx` |
| **Add sidebar navigation**               | `frontend/src/components/Common/SidebarItems.tsx` |

---

## Common Tasks

### 1. Add a New Question (WIP, WILL CHANGE)

**File:** `game-server/src/server.js`

```javascript
// Find the questions array (around line 48)
const questions = [
  // Existing questions...
  {
    question: "Your question here?",
    choices: ["Choice A", "Choice B", "Choice C", "Choice D"],
    correctAnswer: 2  // 0-indexed (0=A, 1=B, 2=C, 3=D)
  }
];
```

✅ Changes auto-reload with `docker compose watch`

---

### 2. Change Number of Questions per Game

**File:** `game-server/src/server.js`

```javascript
// Find startGame() function
function startGame() {
  // Change this condition:
  if (gameState.currentQuestion < questions.length) {  // Change questions.length to any number
    nextQuestion();
  } else {
    endGame();
  }
}

// Or better: add a constant
const QUESTIONS_PER_GAME = 5;

function startGame() {
  if (gameState.currentQuestion < QUESTIONS_PER_GAME) {
    nextQuestion();
  } else {
    endGame();
  }
}
```

---

### 3. Adjust Answer Timer

**File:** `game-server/src/server.js`

```javascript
// Find the answerPeriodStart event emission
function nextQuestion() {
  // ... existing code ...

  // After all choices revealed:
  setTimeout(() => {
    io.emit('answerPeriodStart');

    // Start 30-second answer timer (change this value)
    gameState.roundTimer = setTimeout(() => {
      nextRound();
    }, 30000);  // ← Change to desired milliseconds (30000 = 30 seconds)
  }, choiceRevealDelay);
}
```

---

### 4. Modify Scoring

**File:** `game-server/src/server.js`

```javascript
// Find calculateScores() function (around line 145)
function calculateScores() {
  const correctAnswer = questions[gameState.currentQuestion].correctAnswer;

  for (const playerId in gameState.players) {
    const playerChoice = gameState.answers[playerId]?.choice;
    let points = 0;

    if (playerChoice === correctAnswer) {
      points = 10;  // ← Change base points here

      // Add bonuses:
      if (playerId === firstCorrectPlayerId) {
        points += 5;  // ← Change first correct bonus
      }
    }

    gameState.scores[playerId] = (gameState.scores[playerId] || 0) + points;
  }

  // Everyone correct bonus:
  if (allCorrect) {
    for (const playerId in gameState.players) {
      gameState.scores[playerId] += 5;  // ← Change bonus amount
    }
  }
}
```

---

### 5. Change Button Colors/Styling

**File:** `frontend/src/game-client/components/choice-button.js`

```javascript
export class ChoiceButton {
  constructor(text, x, y, width, height, onClick) {
    this.container = new Graphics();

    // Change fill color (hex values)
    this.container.rect(0, 0, width, height);
    this.container.fill(0x3498db);  // ← Blue (change to any hex color)

    // Common colors:
    // 0x3498db = Blue
    // 0x2ecc71 = Green
    // 0xe74c3c = Red
    // 0xf39c12 = Orange
    // 0x9b59b6 = Purple
  }
}
```

**File:** `frontend/src/game-client/components/question.js` (for text styling)

```javascript
const questionStyle = new TextStyle({
  fontSize: 36,        // ← Change font size
  fill: 0xffffff,      // ← Change text color
  fontWeight: 'bold',  // ← Change weight
  wordWrap: true,
  wordWrapWidth: 900
});
```

---

### 6. Add a New Game Scene

**Example:** Add a "Game Lobby" scene

**Step 1:** Create new scene file

```javascript
// frontend/src/game-client/scenes/lobby-scene.js
import { Container, Graphics, Text } from 'pixi.js';

export class LobbyScene {
  constructor(app, players, onStartGame) {
    this.app = app;
    this.container = new Container();

    // Add background
    const bg = new Graphics();
    bg.rect(0, 0, app.screen.width, app.screen.height);
    bg.fill(0x34495e);
    this.container.addChild(bg);

    // Add player list
    this.showPlayers(players);

    // Add start button (for host)
    this.addStartButton(onStartGame);
  }

  showPlayers(players) {
    // Implementation here
  }

  addStartButton(onClick) {
    // Implementation here
  }

  destroy() {
    this.container.destroy({ children: true });
  }
}
```

**Step 2:** Use in game.js

```javascript
// frontend/src/game-client/game.js
import { LobbyScene } from './scenes/lobby-scene.js';

export class Game {
  showLobbyScene(players) {
    if (this.currentScene) {
      this.currentScene.destroy();
      this.app.stage.removeChild(this.currentScene.container);
    }

    this.currentScene = new LobbyScene(this.app, players, () => {
      this.socket.emit('startGame');
    });

    this.app.stage.addChild(this.currentScene.container);
  }
}
```

---

### 7. Link Game to an Event

**Step 1:** Pass event_id when creating session

```javascript
// game-server/src/server.js
async function startGame(eventId = null) {
  // Create session with event link
  const sessionData = { status: 'in_progress' };
  if (eventId) {
    sessionData.event_id = eventId;
  }

  const sessionResponse = await fetch(`${process.env.BACKEND_URL}/api/v1/game/sessions`, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify(sessionData)
  });

  const session = await sessionResponse.json();
  gameState.sessionId = session.id;
}
```

**Step 2:** Pass event_id from frontend

```typescript
// frontend/src/routes/_layout/game.tsx
// Modify to accept event_id from URL params
const { eventId } = Route.useParams();

// Pass to game server via socket
socket.emit('joinGame', { eventId });
```

---

### 8. Create Database Migration

```bash
# After modifying backend/app/models.py

# 1. Create migration
docker compose exec backend alembic revision --autogenerate -m "Add new field to GameSession"

# 2. Review the migration file (will be in backend/alembic/versions/)
# 3. Apply migration
docker compose exec backend alembic upgrade head

# 4. Restart backend
docker compose restart backend
```

---

### 9. Add New API Endpoint

**File:** `backend/app/api/routes/game.py`

```python
@router.get("/stats/{user_id}")
def get_user_stats(
    user_id: uuid.UUID,
    session: SessionDep,
    current_user: CurrentUser
) -> Any:
    """Get statistics for a specific user."""

    # Query database
    participants = session.exec(
        select(GameParticipant).where(GameParticipant.user_id == user_id)
    ).all()

    # Calculate stats
    total_games = len(participants)
    total_score = sum(p.score or 0 for p in participants)
    avg_score = total_score / total_games if total_games > 0 else 0

    return {
        "user_id": user_id,
        "total_games": total_games,
        "total_score": total_score,
        "average_score": avg_score
    }
```

**Test it:** Visit http://localhost:8000/docs and find your new endpoint.

---

### 10. Add Socket.io Event

**Server-side** (`game-server/src/server.js`):

```javascript
io.on('connection', (socket) => {
  // Listen for new event from client
  socket.on('sendChatMessage', (data) => {
    console.log(`Chat from ${socket.id}: ${data.message}`);

    // Broadcast to all players
    io.emit('chatMessage', {
      playerId: socket.id,
      message: data.message,
      timestamp: Date.now()
    });
  });
});
```

**Client-side** (`frontend/src/game-client/game.js`):

```javascript
export class Game {
  async start() {
    // ... existing socket setup ...

    // Listen for chat messages
    this.socket.on('chatMessage', (data) => {
      console.log(`Message from ${data.playerId}: ${data.message}`);
      // Display in UI
    });
  }

  sendChatMessage(message) {
    this.socket.emit('sendChatMessage', { message });
  }
}
```

---

## Environment Variables

**File:** `.env` (root directory)

```bash
# Backend
SECRET_KEY=your-secret-key-here  # Must match between backend and game-server
POSTGRES_SERVER=db
POSTGRES_USER=postgres
POSTGRES_PASSWORD=changethis
POSTGRES_DB=app

# Frontend (frontend/.env)
VITE_API_URL=http://localhost:8000
VITE_GAME_SERVER_URL=http://localhost:3001

# Game Server
BACKEND_URL=http://backend:8000  # Internal Docker network URL
```

⚠️ **After changing `.env`**: Restart services with `docker compose restart`

---

## Debugging Commands

```bash
# View logs
docker compose logs -f game-server       # Game server logs
docker compose logs -f backend           # Backend logs
docker compose logs -f frontend          # Frontend logs

# Check service status
docker compose ps

# Restart a service
docker compose restart game-server
docker compose restart backend

# Rebuild a service (after dependency changes)
docker compose build game-server
docker compose restart game-server

# Database access
docker compose exec backend python      # Open Python REPL with DB access
docker compose exec db psql -U postgres app  # Direct PostgreSQL access

# Clear all data (DANGER!)
docker compose down -v
```

---

## Socket.io Event Flow (Quick Reference)

```
┌──────────────┐                  ┌──────────────┐
│   Client     │                  │    Server    │
└──────────────┘                  └──────────────┘
       │                                  │
       │  connect (with JWT)              │
       ├─────────────────────────────────►│
       │                                  │
       │  (2+ players joined)             │
       │◄─────────────────────────────────┤
       │  gameStart                       │
       │                                  │
       │◄─────────────────────────────────┤
       │  newQuestion                     │
       │                                  │
       │◄─────────────────────────────────┤
       │  answerPeriodStart               │
       │                                  │
       │  submitAnswer                    │
       ├─────────────────────────────────►│
       │                                  │
       │◄─────────────────────────────────┤
       │  playerAnswered (broadcast)      │
       │                                  │
       │◄─────────────────────────────────┤
       │  roundResults                    │
       │                                  │
       │      (repeat for each question)  │
       │                                  │
       │◄─────────────────────────────────┤
       │  gameEnd                         │
       │                                  │
```

---

## Pixi.js Cheat Sheet

```javascript
import { Application, Container, Graphics, Text, TextStyle, Sprite } from 'pixi.js';

// Create app (done in GameClient.tsx)
const app = new Application();
await app.init({ width: 1200, height: 800 });

// Container (group of elements)
const container = new Container();
app.stage.addChild(container);

// Rectangle
const rect = new Graphics();
rect.rect(x, y, width, height);
rect.fill(0x3498db);  // Blue
container.addChild(rect);

// Circle
const circle = new Graphics();
circle.circle(x, y, radius);
circle.fill(0xe74c3c);  // Red
container.addChild(circle);

// Text
const text = new Text({
  text: 'Hello World',
  style: new TextStyle({
    fontSize: 32,
    fill: 0xffffff,
    fontWeight: 'bold'
  })
});
text.position.set(x, y);
container.addChild(text);

// Sprite (image)
const sprite = Sprite.from('/path/to/image.png');
sprite.position.set(x, y);
sprite.width = 100;
sprite.height = 100;
container.addChild(sprite);

// Click events
rect.eventMode = 'static';
rect.cursor = 'pointer';
rect.on('pointerdown', () => {
  console.log('Clicked!');
});

// Remove/destroy
container.removeChild(rect);
container.destroy({ children: true });  // Destroy container and all children
```

---

## Git Workflow

```bash
# Create a feature branch
git checkout -b feature/add-team-mode

# Make changes, test locally
# ...

# Stage and commit
git add .
git commit -m "Add team-based game mode"

# Push to remote
git push origin feature/add-team-mode

# Create PR (use GitHub CLI or web)
gh pr create --title "Add team-based game mode" --body "..."

# After PR approved and merged
git checkout main
git pull origin main
```

---

## Need More Help?

- **Comprehensive Guide**: See `DEVELOPER_GUIDE.md`
- **Testing Guide**: See `TESTING_GUIDE.md`
- **Architecture Details**: See `INTEGRATION_COMPLETE.md`
- **Startup Guide**: See `STARTUP_SHUTDOWN_GUIDE.md`

---

*Keep this reference handy for quick lookups during development!*
