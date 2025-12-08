# Game System Documentation Index

**Your guide to all game-related documentation**

---

## Quick Navigation

| I want to... | Read this document |
|-------------|-------------------|
| **Understand the overall system** | [INTEGRATION_COMPLETE.md](#integration_completemd) |
| **Test or demo the game** | [TESTING_GUIDE.md](#testing_guidemd) |
| **Start/stop services** | [STARTUP_SHUTDOWN_GUIDE.md](#startup_shutdown_guidemd) |
| **Learn how to develop features** | [DEVELOPER_GUIDE.md](#developer_guidemd) |
| **Quickly look up how to do X** | [QUICK_REFERENCE.md](#quick_referencemd) |
| **Understand architecture deeply** | [ARCHITECTURE_REFERENCE.md](#architecture_referencemd) |

---

## Document Details

### INTEGRATION_COMPLETE.md

**Type:** Summary / Integration Report
**Last Updated:** December 2025
**Length:** ~340 lines

**Best for:**
- Understanding what was implemented
- Getting overview of the integration

**Key Sections:**
- Summary of implementation
- User flow walkthrough
- Architecture diagram
- Testing instructions
- Troubleshooting common issues
- File reference

**When to use:**
- Onboarding new team members
- Preparing presentations
- Quick reference for "what does this system do?"

---

### TESTING_GUIDE.md

**Type:** Testing & QA Guide
**Last Updated:** December 2025
**Length:** ~360 lines

**Best for:**
- Running manual tests
- Verifying functionality
- QA checklist

**Key Sections:**
- Quick start testing steps
- Multiplayer testing procedures
- Database verification
- Service URL reference
- Expected behavior descriptions

**When to use:**
- After making changes (regression testing)
- Verifying bug fixes
- Training new QA team members

---

### STARTUP_SHUTDOWN_GUIDE.md

**Type:** Operations Guide
**Last Updated:** December 2025
**Length:** ~420 lines

**Best for:**
- Daily development workflow
- Service management
- Environment setup
- Troubleshooting startup issues

**Key Sections:**
- `docker compose watch` vs `docker compose up`
- Service restart commands
- Log viewing
- Handling code changes
- Environment variables
- Database migrations

**When to use:**
- First time setting up development environment
- Daily workflow (starting/stopping services)
- When services won't start
- After changing dependencies

---

### DEVELOPER_GUIDE.md

**Type:** Comprehensive Developer Documentation
**Last Updated:** December 2025
**Length:** ~850 lines

**Best for:**
- Learning how to develop new features
- Understanding code organization
- API reference
- Common modification patterns

**Key Sections:**
1. Architecture Overview
2. Directory Structure
3. Data Flow & Communication
4. Quick Start for Developers
5. Common Modification Patterns
   - Add questions
   - Modify scoring
   - Add game modes
   - Customize UI
   - Add player profiles
6. API Reference (REST + Socket.io)
7. Database Schema
8. NCBC Event Integration
9. Extensibility Patterns
10. Testing & Debugging

**When to use:**
- Starting development on a new feature
- Learning the codebase (after initial setup)
- Need to understand API endpoints
- Planning NCBC event integration
- Designing extensible features

---

### QUICK_REFERENCE.md

**Type:** Quick Lookup / Cheat Sheet
**Last Updated:** December 2025
**Length:** ~470 lines

**Best for:**
- Quick "how do I..." answers
- File location lookups
- Common code snippets
- Daily development tasks

**Key Sections:**
- File Locations Cheat Sheet
- Common Tasks (10 examples)
  1. Add a question
  2. Change question count
  3. Adjust timer
  4. Modify scoring
  5. Change UI colors
  6. Add new scene
  7. Link to event
  8. Create migration
  9. Add API endpoint
  10. Add Socket.io event
- Environment variables
- Debugging commands
- Socket.io event flow
- Pixi.js cheat sheet
- Git workflow

**When to use:**
- During active coding (keep it open)
- "I know what I want to do, just need syntax"
- Quick color/style changes
- Can't remember a command

---

### ARCHITECTURE_REFERENCE.md

**Type:** Deep Architecture Documentation
**Last Updated:** December 2025
**Length:** ~650 lines

**Best for:**
- Understanding system design
- Planning major refactors
- Debugging complex issues
- Architectural decisions

**Key Sections:**
- System Architecture Diagram (detailed)
- Component Breakdown
  - Frontend (Game Client)
  - Game Server (Socket.io)
  - Backend (FastAPI)
- Data Flow Sequences (3 detailed diagrams)
  1. User joins game
  2. Question flow
  3. Game end & save
- State Management (client, server, database)
- Authentication Flow
- Design Patterns Used
- File Dependencies
- Configuration Files
- Ports Reference

**When to use:**
- Planning major features
- Debugging cross-service issues
- Understanding data flow
- Making architectural decisions
- Code reviews

---

## Reading Order

### For New Developers

**Day 1: Setup & Overview**
1. Read: [STARTUP_SHUTDOWN_GUIDE.md](#startup_shutdown_guidemd) (sections 1-3)
   - Get services running
2. Read: [INTEGRATION_COMPLETE.md](#integration_completemd) (entire doc)
   - Understand what exists
3. Do: [TESTING_GUIDE.md](#testing_guidemd) (Quick Start section)
   - Play the game yourself

**Day 2-3: Deep Dive**
4. Read: [DEVELOPER_GUIDE.md](#developer_guidemd) (sections 1-5)
   - Learn development basics
5. Read: [ARCHITECTURE_REFERENCE.md](#architecture_referencemd) (sections 1-4)
   - Understand system design
6. Bookmark: [QUICK_REFERENCE.md](#quick_referencemd)
   - For daily use

**Week 2+: Active Development**
7. Use: [QUICK_REFERENCE.md](#quick_referencemd) daily
8. Reference: [DEVELOPER_GUIDE.md](#developer_guidemd) as needed
9. Refer back: [ARCHITECTURE_REFERENCE.md](#architecture_referencemd) for complex changes

### For Existing Team Members

**If you haven't worked on the game before:**
1. [INTEGRATION_COMPLETE.md](#integration_completemd) - Get up to speed
2. [DEVELOPER_GUIDE.md](#developer_guidemd) (skim) - Find relevant sections
3. [QUICK_REFERENCE.md](#quick_referencemd) - Daily reference

**If you're already familiar:**
- Keep [QUICK_REFERENCE.md](#quick_referencemd) open while coding
- Use [DEVELOPER_GUIDE.md](#developer_guidemd) for complex features
- Consult [ARCHITECTURE_REFERENCE.md](#architecture_referencemd) for design decisions

---

## Other Relevant Documentation

### Root-Level Documentation

| File | Purpose |
|------|---------|
| `README.md` | Project overview |
| `development.md` | General development setup (not game-specific) |
| `deployment.md` | Production deployment |

### Service-Specific Documentation

| File | Purpose |
|------|---------|
| `backend/README.md` | Backend FastAPI specifics |
| `frontend/README.md` | Frontend React specifics |

---

## Document Maintenance

### When to Update Documentation

**Update immediately when:**
- Adding new API endpoints
- Changing database schema
- Adding new Socket.io events
- Modifying game rules/scoring
- Changing file structure

**Update weekly/monthly:**
- Troubleshooting sections (as issues arise)
- Common modification patterns (as you discover them)
- Performance tips
- Best practices

**Which document to update:**

| Change | Update This Doc | Update This Section |
|--------|----------------|---------------------|
| New API endpoint | Developer Guide | API Reference |
| New Socket.io event | Developer Guide + Quick Ref | API Reference + Event Flow |
| New game mode | Developer Guide | Common Modifications |
| UI color change | Quick Reference | Pixi.js / Colors |
| Database field | Developer Guide + Architecture | Database Schema + Diagrams |
| New file/directory | All 3 main guides | Directory Structure |
| New feature | Integration Complete | What Was Implemented |
| Bug fix | Testing Guide | Troubleshooting |

---

## Documentation Style Guide

### For Consistency

**Code Blocks:**
```javascript
// Use syntax highlighting
const example = "like this";
```

**File Paths:**
- Use absolute-style notation: `backend/app/models.py`
- Include line numbers when referencing specific code: `server.js:145`

**Commands:**
```bash
# Prefix with # for comments
docker compose restart backend
```

**Tables:**
Always use for structured data (ports, endpoints, file locations)

---

## Getting Help

**If you can't find what you need:**

1. **Check the index** (this document)
2. **Search across all docs** (grep/find in files)
3. **Check code comments** in the actual files
4. **Ask team members**
5. **Update docs** with what you learned!

**Search Tips:**
```bash
# Find all mentions of "scoring" in game docs
grep -r "scoring" *.md

# Find where a specific function is documented
grep -r "calculateScores" .

# Search for a specific endpoint
grep -r "POST /game/sessions" .
```

---

## Quick Links

### External Resources

- [Pixi.js Docs](https://pixijs.com/8.x/guides/getting-started/intro) - Game rendering library
- [Socket.io Docs](https://socket.io/docs/v4/) - Real-time WebSocket library
- [FastAPI Docs](https://fastapi.tiangolo.com/) - Backend framework
- [SQLModel Docs](https://sqlmodel.tiangolo.com/) - Database ORM
- [Docker Compose Docs](https://docs.docker.com/compose/) - Container orchestration

### Internal Links

- **API Docs (Live)**: http://localhost:8000/docs (when services running)
- **Database UI**: http://localhost:8080 (Adminer)
- **Game Server**: http://localhost:3001
- **Frontend**: http://localhost:5173

---

## Document Changelog

### December 2025 - Initial Documentation Suite
- Created DEVELOPER_GUIDE.md
- Created QUICK_REFERENCE.md
- Created ARCHITECTURE_REFERENCE.md
- Created DOCUMENTATION_INDEX.md (this file)
- Existing: INTEGRATION_COMPLETE.md
- Existing: TESTING_GUIDE.md
- Existing: STARTUP_SHUTDOWN_GUIDE.md

---

*This index is your map to the documentation. Update it as the documentation evolves!*
