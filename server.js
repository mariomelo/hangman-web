const express = require('express');
const path = require('path');
const chokidar = require('chokidar');

const app = express();
const PORT = process.env.PORT || 3000;

// Store connected clients for SSE
let clients = [];

// Hot-reload game engine
let gameEngine;

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
    const gameState = gameEngine.startGame();
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

app.listen(PORT, () => {
  console.log(`Hangman server running on http://localhost:${PORT}`);
  console.log(`Game engine version: ${gameEngine.version()}`);
  console.log('Watching lib/engine for changes...');
});
