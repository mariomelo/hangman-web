const express = require('express');
const path = require('path');
const chokidar = require('chokidar');
const fs = require('fs');

const app = express();
const PORT = process.env.PORT || 3000;

// Store connected clients for SSE
let clients = [];

// Hot-reload game engine
let gameEngine;

// Load configuration
let config;
const configPath = path.join(__dirname, 'config.json');
const leaderboardPath = path.join(__dirname, 'leaderboard.json');

function loadConfig() {
  try {
    const configData = fs.readFileSync(configPath, 'utf8');
    config = JSON.parse(configData);
    console.log('Configuration loaded:', config);
  } catch (error) {
    console.error('Error loading config:', error);
    config = { featureFlags: { virtualKeyboard: false } };
  }
}

function saveConfig() {
  try {
    fs.writeFileSync(configPath, JSON.stringify(config, null, 2));
    console.log('Configuration saved:', config);
  } catch (error) {
    console.error('Error saving config:', error);
  }
}

// Leaderboard functions
function loadLeaderboard() {
  try {
    const data = fs.readFileSync(leaderboardPath, 'utf8');
    return JSON.parse(data);
  } catch (error) {
    console.error('Error loading leaderboard:', error);
    return [];
  }
}

function saveLeaderboard(leaderboard) {
  try {
    fs.writeFileSync(leaderboardPath, JSON.stringify(leaderboard, null, 2));
  } catch (error) {
    console.error('Error saving leaderboard:', error);
  }
}

// Initial config load
loadConfig();

function loadGameEngine() {
  // Clear the require cache to reload the module
  const enginePath = path.join(__dirname, 'lib', 'engine', 'index.js');
  delete require.cache[require.resolve(enginePath)];
  gameEngine = require(enginePath);
  console.log(`Game engine loaded. Version: ${gameEngine.version()}`);
}

// Initial load
loadGameEngine();

// Watch for changes in lib/engine
const watcher = chokidar.watch('lib/engine/**/*.js', {
  persistent: true,
  ignoreInitial: true
});

watcher.on('change', (filePath) => {
  console.log(`File changed: ${filePath}`);
  loadGameEngine();

  // Notify all connected clients to reload
  clients.forEach(client => {
    client.write(`data: ${JSON.stringify({ type: 'reload', version: gameEngine.version() })}\n\n`);
  });
});

// Middleware
app.use(express.json());
app.use(express.static('public'));

// API endpoints
app.post('/api/start', (req, res) => {
  try {
    const { difficulty } = req.body;
    // Pass difficulty if provided (when difficulty flag is enabled)
    // Students will modify startGame() in /lib/engine to accept and use this parameter
    const gameState = difficulty ? gameEngine.startGame(difficulty) : gameEngine.startGame();
    res.json(gameState);
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
});

app.post('/api/guess', (req, res) => {
  try {
    const { gameState, letter } = req.body;
    const newGameState = gameEngine.guessLetter(gameState, letter);
    res.json(newGameState);
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
});

app.get('/api/version', (req, res) => {
  try {
    res.json({ version: gameEngine.version() });
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
});

app.post('/api/event', (req, res) => {
  try {
    const { gameState, event, data } = req.body;
    const newGameState = gameEngine.handleEvent(event, data, gameState);
    res.json(newGameState);
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
});

// Server-Sent Events endpoint for hot-reload notifications
app.get('/api/events', (req, res) => {
  res.setHeader('Content-Type', 'text/event-stream');
  res.setHeader('Cache-Control', 'no-cache');
  res.setHeader('Connection', 'keep-alive');

  // Add this client to the list
  clients.push(res);

  // Remove client when connection closes
  req.on('close', () => {
    clients = clients.filter(client => client !== res);
  });
});

// Feature flags endpoints
app.get('/api/config', (req, res) => {
  res.json(config);
});

app.get('/api/features', (req, res) => {
  res.json(config.featureFlags);
});

app.post('/api/features', (req, res) => {
  try {
    const { featureFlags } = req.body;
    config.featureFlags = { ...config.featureFlags, ...featureFlags };
    saveConfig();

    // Notify all connected clients about config change
    clients.forEach(client => {
      client.write(`data: ${JSON.stringify({ type: 'config-update', config })}\n\n`);
    });

    res.json({ success: true, featureFlags: config.featureFlags });
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
});

// Leaderboard endpoints
app.get('/api/leaderboard', (req, res) => {
  try {
    const leaderboard = loadLeaderboard();
    // Sort by score descending and return top 10
    const sorted = leaderboard.sort((a, b) => b.score - a.score).slice(0, 10);
    res.json(sorted);
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
});

app.post('/api/leaderboard', (req, res) => {
  try {
    const { playerName, score } = req.body;

    if (!playerName || score === undefined) {
      return res.status(400).json({ error: 'playerName and score are required' });
    }

    const leaderboard = loadLeaderboard();
    leaderboard.push({
      playerName,
      score,
      timestamp: new Date().toISOString()
    });

    saveLeaderboard(leaderboard);
    res.json({ success: true });
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
});

// Admin page
app.get('/adm', (req, res) => {
  res.sendFile(path.join(__dirname, 'public', 'admin.html'));
});

// Documentation page
app.get('/docs', (req, res) => {
  res.sendFile(path.join(__dirname, 'public', 'docs.html'));
});

app.listen(PORT, () => {
  console.log(`Hangman server running on http://localhost:${PORT}`);
  console.log(`Admin panel available at http://localhost:${PORT}/adm`);
  console.log(`Documentation available at http://localhost:${PORT}/docs`);
  console.log(`Game engine version: ${gameEngine.version()}`);
  console.log('Watching lib/engine for changes...');
});
