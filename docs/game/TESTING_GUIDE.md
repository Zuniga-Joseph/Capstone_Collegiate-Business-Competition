# Game Integration - Testing Guide

## Quick Start - Test the Game Now!

### Step 1: Open the Application
Open your browser and go to: **http://localhost:5173**

### Step 2: Login
Use the default admin credentials:
- **Email**: `admin@example.com`
- **Password**: `changethis`

### Step 3: Navigate to Game
After login, you should see the dashboard. Look at the **left sidebar** and click on:
- **"Play Game"** (with a game controller icon 🎮)

### Step 4: Test Single Player
- You should see a dark canvas with "Waiting for game to start..."
- Open your browser's **Developer Console** (F12) to see connection logs
- You should see: "Connected to server"

### Step 5: Test Multiplayer (2+ Players)

To test the full multiplayer experience, open **2 or more browser windows**:

**Option A: Incognito Windows (Quick Testing)**
1. Keep current window open at `/game`
2. Open a **new incognito/private window**: `http://localhost:5173`
3. Login again with same credentials
4. Navigate to "Play Game"

**Option B: Different Browsers (Quick Testing)**
1. Keep current window open in Chrome at `/game`
2. Open Firefox/Safari and go to: `http://localhost:5173`
3. Login and navigate to "Play Game"

**Option C: Different User Accounts (Production-Like)**
1. Create a second user account via API or signup
2. Open second browser window/tab
3. Login with second account
4. Navigate to "Play Game"

**⚠️ Note on Same User Testing:**
The game currently allows the same user account to join multiple times (via different browser windows) because it tracks players by **WebSocket connection**, not user ID. This is convenient for testing but may cause database issues if your `gameparticipant` table has unique constraints. For production testing, use Option C with different user accounts.

### Expected Multiplayer Behavior:

✅ **When 2nd player joins:**
- Game automatically starts
- Shows "Game starting with players..." in console
- Waiting screen disappears

✅ **During Game:**
- Questions appear one at a time
- 4 choices reveal sequentially (with animation)
- After all 4 choices shown → 30-second answer timer starts
- Players can click a choice to submit answer
- When a player answers → their stick figure appears above their choice
- All players can see who answered what

✅ **Scoring System:**
- Correct answer = 10 points
- First correct answer (when multiple correct) = +5 bonus
- Everyone correct = +5 bonus for all
- Scores update after each question

✅ **End Game:**
- After 3 questions → Game ends
- Shows final scores for all players
- "Returning to dashboard in 10 seconds..."
- Auto-redirects to dashboard

---

## Verify Database Persistence

After playing a game, verify scores were saved:

### Option 1: Check via API Docs
1. Go to: **http://localhost:8000/docs**
2. Click "Authorize" button (top right)
3. Login with: `admin@example.com` / `changethis`
4. Find **`GET /api/v1/game/sessions`** endpoint
5. Click "Try it out" → "Execute"
6. Should see your game session(s)

### Option 2: Check Leaderboard
1. Go to API docs: **http://localhost:8000/docs**
2. Authorize (if not already)
3. Find **`GET /api/v1/game/leaderboard/global`**
4. Click "Try it out" → "Execute"
5. Should see aggregated scores across all games

---

## Troubleshooting

### Issue: "Loading Game..." stuck

**Cause**: JWT token issue

**Check**:
1. Open browser console (F12)
2. Type: `localStorage.getItem('access_token')`
3. Should return a long string

**Fix**:
- Log out and log back in
- Clear localStorage: `localStorage.clear()`
- Refresh page and login again

### Issue: Can't see "Play Game" in sidebar

**Cause**: Frontend not rebuilt or browser cache

**Fix**:
```bash
# Hard refresh browser
# Windows/Linux: Ctrl + Shift + R
# Mac: Cmd + Shift + R

# Or rebuild frontend
docker compose build frontend
docker compose restart frontend
```

### Issue: Game server connection refused

**Check**:
```bash
docker compose logs game-server
```

**Look for**:
- "Game server running on port 3001"
- Any error messages

**Fix**:
```bash
docker compose restart game-server
```

### Issue: Authentication failed in game server

**Check game server logs**:
```bash
docker compose logs game-server | grep -i auth
```

**Should see**:
- "Socket authenticated for user: [user-id]"

**If you see**:
- "Invalid token"
- "Authentication required"

**Fix**:
1. Check `.env` file has `SECRET_KEY` set
2. Restart both services:
```bash
docker compose restart backend game-server
```

### Issue: Game doesn't start with 2 players

**Possible Causes**:
1. Both windows using same Socket.io connection (rare - usually only if same tab)
2. JavaScript error preventing connection
3. Game already started with other players

**Fix**:
- Use incognito window for 2nd player (ensures fresh socket connection)
- Or use different browser
- Check browser console for errors in both windows
- Ensure both players are on `/game` page simultaneously
- Refresh both pages if needed

---

## Service URLs Reference

| Service | URL | Purpose |
|---------|-----|---------|
| Frontend | http://localhost:5173 | Main React app |
| Game Page | http://localhost:5173/game | Game canvas (after login) |
| Backend API | http://localhost:8000 | FastAPI backend |
| API Docs | http://localhost:8000/docs | Swagger UI |
| Game Server | http://localhost:3001 | Socket.io WebSocket |
| Database | localhost:5432 | PostgreSQL |
| Adminer | http://localhost:8080 | Database UI |