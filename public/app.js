// Game state
let currentGameState = null;

// DOM elements
const wordDisplay = document.getElementById('word-display');
const livesDisplay = document.getElementById('lives');
const messageDisplay = document.getElementById('message');
const guessedLettersDisplay = document.getElementById('guessed-letters');
const letterInput = document.getElementById('letter-input');
const guessButton = document.getElementById('guess-button');
const newGameButton = document.getElementById('new-game-button');
const inputSection = document.getElementById('input-section');
const versionDisplay = document.getElementById('version');
const reloadNotification = document.getElementById('reload-notification');

// Initialize SSE for hot-reload
const eventSource = new EventSource('/api/events');

eventSource.onmessage = (event) => {
    const data = JSON.parse(event.data);
    if (data.type === 'reload') {
        reloadNotification.classList.add('show');
        setTimeout(() => {
            window.location.reload();
        }, 1500);
    }
};

// Fetch and display engine version
async function loadVersion() {
    try {
        const response = await fetch('/api/version');
        const data = await response.json();
        versionDisplay.textContent = data.version;
    } catch (error) {
        console.error('Error loading version:', error);
        versionDisplay.textContent = 'Error';
    }
}

// Start a new game
async function startNewGame() {
    try {
        const response = await fetch('/api/start', {
            method: 'POST',
            headers: {
                'Content-Type': 'application/json'
            }
        });

        currentGameState = await response.json();
        updateUI();
        enableInput();
        letterInput.focus();
    } catch (error) {
        console.error('Error starting game:', error);
        messageDisplay.textContent = 'Erro ao iniciar o jogo';
    }
}

// Make a guess
async function makeGuess() {
    const letter = letterInput.value.trim().toUpperCase();

    if (!letter || !currentGameState) {
        return;
    }

    try {
        const response = await fetch('/api/guess', {
            method: 'POST',
            headers: {
                'Content-Type': 'application/json'
            },
            body: JSON.stringify({
                gameState: currentGameState,
                letter: letter
            })
        });

        currentGameState = await response.json();
        updateUI();

        // Check if game is over
        if (currentGameState.status !== 'RUNNING') {
            disableInput();
        }

        letterInput.value = '';
        letterInput.focus();
    } catch (error) {
        console.error('Error making guess:', error);
        messageDisplay.textContent = 'Erro ao processar palpite';
    }
}

// Update UI with current game state
function updateUI() {
    if (!currentGameState) return;

    wordDisplay.textContent = currentGameState.display_word.split('').join(' ');
    livesDisplay.textContent = currentGameState.lives;
    messageDisplay.textContent = currentGameState.message;

    // Update message styling based on status
    messageDisplay.className = 'message';
    if (currentGameState.status === 'WON') {
        messageDisplay.classList.add('win');
    } else if (currentGameState.status === 'LOST') {
        messageDisplay.classList.add('lose');
    }

    // Update guessed letters
    if (currentGameState.guesses.length === 0) {
        guessedLettersDisplay.textContent = 'Nenhuma';
    } else {
        guessedLettersDisplay.textContent = currentGameState.guesses.join(', ');
    }
}

// Enable input controls
function enableInput() {
    letterInput.disabled = false;
    guessButton.disabled = false;
    inputSection.classList.remove('disabled');
}

// Disable input controls
function disableInput() {
    letterInput.disabled = true;
    guessButton.disabled = true;
    inputSection.classList.add('disabled');
}

// Event listeners
guessButton.addEventListener('click', makeGuess);

letterInput.addEventListener('keypress', (e) => {
    if (e.key === 'Enter') {
        makeGuess();
    }
});

newGameButton.addEventListener('click', startNewGame);

// Initialize
loadVersion();
disableInput();
