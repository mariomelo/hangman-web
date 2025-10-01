# CLAUDE.md

This file provides guidance to Claude Code (claude.ai/code) when working with code in this repository.

## Project Overview

Web application for a hangman game built for a Certified Scrum Developer (CSD) course. The application consumes game logic from `/lib/engine` and must support hot-reload when the engine is updated.

## Architecture Requirements

### GameEngine Integration

The `/lib/engine` directory contains a **placeholder** game engine that students will continuously update during the course. The initial placeholder should:
- Export the required GameEngine interface methods
- Return a basic GameState structure
- Not implement actual game logic (students will add this)

**GameState Structure:**
```javascript
{
  status: "RUNNING",
  word: word,
  lives: 6,
  display_word: this.getInitialDisplayWord(word),
  guesses: [],
  message: "Adivinhe uma letra",
}
```

**Required Methods:**
- `startGame(): GameState`
- `guessLetter(currentGameState: GameState, letter: string): GameState`
- `version(): string`
- `handleEvent(event: string, data?: any): GameState`

### Hot-Reload Mechanism

The application must detect changes to `/lib/engine` and reload the game engine without restarting the server. This allows students to see their changes immediately as they develop the game logic.

### State Management

Game state is maintained in the browser only - no server-side persistence required currently. Future persistence may use services like Supabase if needed.

### Feature Flags

Feature flags are managed via `config.json` and can be toggled in real-time through the admin panel at `/adm`. No server restart is required - changes are pushed to all connected clients via SSE.

**Available Feature Flags:**

1. **virtualKeyboard** (default: false)
   - Replaces text input with 26 letter buttons (A-Z)
   - Buttons are automatically disabled based on `gameState.guesses` array
   - Students implement the guessing logic that populates this array

2. **timer** (default: false)
   - Sends a "tick" event to the game engine every second
   - Only active while `gameState.status` is "RUNNING"
   - Stops when game ends (WON or LOST)
   - Students can use this to implement time-based features

## Technology Stack

Must use Node.js-based stack that:
- Is easy to configure
- Supports hot-reload of the game engine
- Optionally supports browser push updates for better interactivity
- Can be server-rendered or SPA (state lives in browser)

## Common Commands

### Development
```bash
# Install dependencies
npm install

# Run in development mode (with nodemon for server auto-restart)
npm run dev

# Run in production mode
npm start
```

### Testing the Hot-Reload
1. Start the server: `npm run dev`
2. Open browser to `http://localhost:3000`
3. Edit `/lib/engine/index.js` and save
4. The browser will automatically reload with the new engine version

### Deployment

Install as systemd service:
```bash
# Copy service file to systemd directory
sudo cp hangman-web.service /etc/systemd/system/

# Edit the service file to set correct path
sudo nano /etc/systemd/system/hangman-web.service
# Update WorkingDirectory to actual path

# Enable and start service
sudo systemctl enable hangman-web
sudo systemctl start hangman-web

# Check status
sudo systemctl status hangman-web
```

## Implementation Details

### Stack
- **Backend**: Express.js server with chokidar for file watching
- **Frontend**: Vanilla JavaScript with Server-Sent Events (SSE) for real-time updates
- **Hot-reload**: File watcher monitors `/lib/engine/**/*.js` and notifies connected clients via SSE

### API Endpoints

**Game Endpoints:**
- `POST /api/start` - Start new game
- `POST /api/guess` - Submit a letter guess (body: `{gameState, letter}`)
- `GET /api/version` - Get current engine version
- `GET /api/events` - SSE endpoint for hot-reload and config update notifications

**Admin Endpoints:**
- `GET /adm` - Admin panel UI
- `GET /api/config` - Get full configuration
- `GET /api/features` - Get feature flags
- `POST /api/features` - Update feature flags (body: `{featureFlags: {...}}`)

**Feature Flag Management:**
1. Access admin panel: `http://localhost:5173/adm`
2. Toggle feature flags on/off
3. Changes are saved to `config.json` and pushed to all clients in real-time
4. No server restart required
