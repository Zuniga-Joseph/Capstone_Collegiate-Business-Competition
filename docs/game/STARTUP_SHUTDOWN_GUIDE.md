# Startup & Shutdown Guide

> **Note**: This guide follows the official project documentation in `development.md`

## Quick Reference

| Command | What It Does |
|---------|--------------|
| `docker compose watch` | **Recommended**: Start with auto-reload |
| `docker compose up -d` | Start in background (no auto-reload) |
| `docker compose stop` | Stop everything (keeps data) |
| `docker compose down` | Stop and remove containers |
| `docker compose ps` | Show running services |
| `docker compose logs` | View logs |

---

## Development Workflow (Recommended)

### Start Development

```bash
docker compose watch
```

**What this does:**
- Starts all services
- **Auto-reloads** when you change code:
  - Backend: Python files auto-reload
  - Frontend: React files auto-reload
  - Game Server: JavaScript files auto-reload
- Shows logs in real-time in your terminal
- Press `Ctrl+C` to stop

**First time starting?** It may take a minute while:
- Database initializes
- Migrations run
- Services become ready

**Check logs** (in another terminal):
```bash
docker compose logs

# Or for specific service:
docker compose logs backend
docker compose logs game-server
```

### Stop Development

**While `docker compose watch` is running:**
- Press `Ctrl+C` in the terminal

**Or from another terminal:**
```bash
docker compose stop
```

---

## Alternative: Background Mode

If you don't want to see logs in your terminal:

### Start in Background
```bash
docker compose up -d
```

The `-d` flag means "detached mode" (runs in background)

### Stop
```bash
docker compose stop
```

### View Logs Anytime
```bash
# All services
docker compose logs

# Follow in real-time
docker compose logs -f

# Specific service
docker compose logs game-server

# Last 50 lines, then follow
docker compose logs -f --tail=50 backend
```

---

## Local Development (Hybrid Approach)

Per `development.md`, you can run some services in Docker and others locally.

### Example: Frontend Locally, Rest in Docker

**Stop Docker frontend:**
```bash
docker compose stop frontend
```

**Start local frontend:**
```bash
cd frontend
npm run dev
```

Frontend will run on same port (5173), so everything still works!

### Example: Backend Locally, Rest in Docker

**Stop Docker backend:**
```bash
docker compose stop backend
```

**Start local backend:**
```bash
cd backend
fastapi dev app/main.py
```

Backend will run on same port (8000).

**Why do this?**
- Faster iteration
- Better debugging
- IDE integration

---

## Service URLs

As documented in `development.md`:

### Standard Localhost URLs

| Service | URL |
|---------|-----|
| Frontend | http://localhost:5173 |
| Backend | http://localhost:8000 |
| API Docs (Swagger) | http://localhost:8000/docs |
| API Docs (ReDoc) | http://localhost:8000/redoc |
| Game Server | http://localhost:3001 |
| Adminer (Database UI) | http://localhost:8080 |
| Traefik UI | http://localhost:8090 |
| MailCatcher | http://localhost:1080 |

### Game-Specific URLs

| Service | URL |
|---------|-----|
| Play Game (after login) | http://localhost:5173/game |
| Game Server WebSocket | ws://localhost:3001 |

---

## Complete Cleanup

### Stop and Remove Containers
```bash
docker compose down
```
- Stops all services
- Removes containers
- **Keeps database data**

### Nuclear Option (Delete Everything)
```bash
docker compose down -v
```
- Stops all services
- Removes containers
- **DELETES ALL DATA** (database wiped!)

⚠️ **Warning**: Only use `-v` if you want a completely fresh start!

---

## Restart Services

### Restart Everything
```bash
docker compose restart
```

### Restart Specific Service
```bash
docker compose restart backend
docker compose restart game-server
docker compose restart frontend
```

---

## After Code Changes

Thanks to `docker compose watch`, most changes auto-reload:

### Backend Changes (Python)
- **Auto-reloads** automatically
- No action needed!

### Frontend Changes (React/TypeScript)
- **Auto-reloads** automatically
- No action needed!

### Game Server Changes (JavaScript)
- **Auto-reloads** automatically
- No action needed!

### When Auto-Reload Doesn't Work

If you changed `package.json`, `pyproject.toml`, or `Dockerfile`:

**Rebuild and restart:**
```bash
# Frontend
docker compose build frontend
docker compose restart frontend

# Backend
docker compose build backend
docker compose restart backend

# Game Server
docker compose build game-server
docker compose restart game-server

# Or rebuild everything
docker compose build
docker compose restart
```

---

## Environment Variables

From `development.md`:

### The `.env` File

Located at project root, contains:
- Database passwords
- Secret keys
- API URLs
- All configuration

**After changing `.env`:**
```bash
docker compose watch
# Or if already running:
docker compose restart
```

---

## Database Migrations

### Create New Migration
```bash
docker compose exec backend alembic revision --autogenerate -m "description"
```

### Apply Migrations
```bash
docker compose exec backend alembic upgrade head
```

### Restart Backend
```bash
docker compose restart backend
```

---

## Typical Daily Workflow

### Morning - Start Work
```bash
docker compose watch
```
Leave this running in a terminal window.

### During Day - Make Code Changes
- Edit files normally
- Changes auto-reload
- Watch terminal for errors

### Made Dependency Changes?
```bash
# In another terminal:
docker compose build [service]
docker compose restart [service]
```

### End of Day - Shutdown
```bash
# Press Ctrl+C in the docker compose watch terminal
# Or:
docker compose stop
```

---

## Demo Day Preparation

**Morning of Demo:**
```bash
# Start everything
docker compose watch

# In another terminal, verify all healthy:
docker compose ps

# Check for errors:
docker compose logs --tail=20

# Test the app:
open http://localhost:5173
```

**After Demo:**
```bash
# Press Ctrl+C or:
docker compose stop
```

---

## Troubleshooting

### "Port already in use"
```bash
# See what's using the port
lsof -i :5173  # or :8000, :3001, etc.

# Stop conflicting service or use:
docker compose down
docker compose up -d
```

### "Service won't start"
```bash
# Check logs
docker compose logs [service-name]

# Try rebuilding
docker compose build [service-name]
docker compose restart [service-name]
```

### "Changes not reflecting"
```bash
# Hard refresh browser
# Mac: Cmd + Shift + R
# Windows/Linux: Ctrl + Shift + R

# Or rebuild service
docker compose build [service-name]
docker compose restart [service-name]
```

### "Database issues"
```bash
# Check if migrations ran
docker compose logs backend | grep -i alembic

# Run migrations manually
docker compose exec backend alembic upgrade head

# Nuclear option (DELETES DATA):
docker compose down -v
docker compose up -d
```

---

## `docker compose watch`

**Configured in:** `docker-compose.override.yml`

**Watch paths configured for:**
- Backend: `./backend` → `/app`
- Frontend: `./frontend` → `/app`
- Game Server: `./game-server/src` → `/app/src`

---

## Reference Documentation

For more details, see:
- **`development.md`** - Official development guide
- **`deployment.md`** - Production deployment
- **`backend/README.md`** - Backend specifics
- **`frontend/README.md`** - Frontend specifics

---

## Summary

**Most of the time, you only need:**

```bash
# Start
docker compose watch

# Stop
Ctrl+C
```
