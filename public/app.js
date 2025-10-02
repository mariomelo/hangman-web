// Game state
let currentGameState = null;
let featureFlags = {};
let timerInterval = null;

// DOM elements
const wordDisplay = document.getElementById('word-display');
const livesDisplay = document.getElementById('lives');
const messageDisplay = document.getElementById('message');
const guessedLettersDisplay = document.getElementById('guessed-letters');
const letterInput = document.getElementById('letter-input');
const guessButton = document.getElementById('guess-button');
const newGameButton = document.getElementById('new-game-button');
const inputSection = document.getElementById('input-section');
const virtualKeyboard = document.getElementById('virtual-keyboard');
const difficultyControls = document.getElementById('difficulty-controls');
const timerDisplay = document.getElementById('timer-display');
const timerValue = document.getElementById('timer-value');
const versionDisplay = document.getElementById('version');
const reloadNotification = document.getElementById('reload-notification');

// Initialize SSE for hot-reload and config updates
const eventSource = new EventSource('/api/events');

eventSource.onmessage = (event) => {
    const data = JSON.parse(event.data);
    if (data.type === 'reload') {
        reloadNotification.classList.add('show');
        setTimeout(() => {
            window.location.reload();
        }, 1500);
    } else if (data.type === 'config-update') {
        featureFlags = data.config.featureFlags;
        updateInputMode();
        updateTimerDisplay();
        updateTimer();
        updateDifficultyControls();
    }
};

// Load feature flags
async function loadFeatureFlags() {
    try {
        const response = await fetch('/api/features');
        featureFlags = await response.json();
        updateInputMode();
        updateTimerDisplay();
        updateTimer();
        updateDifficultyControls();
    } catch (error) {
        console.error('Error loading feature flags:', error);
    }
}

// Timer functionality
function startTimer() {
    if (timerInterval) {
        clearInterval(timerInterval);
    }

    if (featureFlags.timer && currentGameState && currentGameState.status === 'RUNNING') {
        timerInterval = setInterval(async () => {
            if (!currentGameState || currentGameState.status !== 'RUNNING') {
                stopTimer();
                return;
            }

            // Send tick event to game engine
            try {
                const newGameState = await handleGameEvent('tick');
                if (newGameState) {
                    currentGameState = newGameState;
                    updateUI();

                    // Stop timer if game ended
                    if (currentGameState.status !== 'RUNNING') {
                        stopTimer();
                        disableInput();
                    }
                }
            } catch (error) {
                console.error('Error processing tick event:', error);
            }
        }, 1000);
    }
}

function stopTimer() {
    if (timerInterval) {
        clearInterval(timerInterval);
        timerInterval = null;
    }
}

function updateTimer() {
    if (featureFlags.timer && currentGameState && currentGameState.status === 'RUNNING') {
        startTimer();
    } else {
        stopTimer();
    }
}

// Update timer display visibility and value
function updateTimerDisplay() {
    if (featureFlags.timer) {
        timerDisplay.style.display = 'block';
        if (currentGameState && currentGameState.timer !== undefined) {
            timerValue.textContent = currentGameState.timer;
        } else {
            timerValue.textContent = '0';
        }
    } else {
        timerDisplay.style.display = 'none';
    }
}

// Handle game event (for timer)
async function handleGameEvent(event, data) {
    try {
        const response = await fetch('/api/event', {
            method: 'POST',
            headers: {
                'Content-Type': 'application/json'
            },
            body: JSON.stringify({
                gameState: currentGameState,
                event: event,
                data: data
            })
        });

        if (response.ok) {
            return await response.json();
        }
    } catch (error) {
        console.error('Error handling event:', error);
    }
    return null;
}

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

// Create virtual keyboard
function createVirtualKeyboard() {
    virtualKeyboard.innerHTML = '';
    const letters = 'ABCDEFGHIJKLMNOPQRSTUVWXYZ'.split('');

    letters.forEach(letter => {
        const button = document.createElement('button');
        button.textContent = letter;
        button.dataset.letter = letter;
        button.disabled = true;
        button.addEventListener('click', () => handleVirtualKeyPress(letter));
        virtualKeyboard.appendChild(button);
    });
}

// Handle virtual keyboard press
function handleVirtualKeyPress(letter) {
    if (!currentGameState || currentGameState.status !== 'RUNNING') return;

    // Make the guess (button state will be updated by updateUI)
    makeGuessWithLetter(letter);
}

// Update input mode based on feature flags
function updateInputMode() {
    if (featureFlags.virtualKeyboard) {
        inputSection.style.display = 'none';
        virtualKeyboard.style.display = 'grid';
        if (virtualKeyboard.children.length === 0) {
            createVirtualKeyboard();
        }
    } else {
        inputSection.style.display = 'flex';
        virtualKeyboard.style.display = 'none';
    }
}

// Update difficulty controls visibility
function updateDifficultyControls() {
    const normalControls = document.querySelector('.controls');

    if (featureFlags.difficulty) {
        normalControls.style.display = 'none';
        difficultyControls.style.display = 'flex';
    } else {
        normalControls.style.display = 'block';
        difficultyControls.style.display = 'none';
    }
}

// Start a new game
async function startNewGame(difficulty) {
    try {
        const response = await fetch('/api/start', {
            method: 'POST',
            headers: {
                'Content-Type': 'application/json'
            },
            body: JSON.stringify({ difficulty })
        });

        currentGameState = await response.json();
        updateUI();
        enableInput();

        if (!featureFlags.virtualKeyboard) {
            letterInput.focus();
        }

        // Start timer if feature is enabled
        if (featureFlags.timer) {
            startTimer();
        }
    } catch (error) {
        console.error('Error starting game:', error);
        messageDisplay.textContent = 'Error starting game';
    }
}

// Make a guess (for text input)
async function makeGuess() {
    const letter = letterInput.value.trim().toUpperCase();

    if (!letter || !currentGameState) {
        return;
    }

    await makeGuessWithLetter(letter);
    letterInput.value = '';
    letterInput.focus();
}

// Make a guess with a specific letter
async function makeGuessWithLetter(letter) {
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
    } catch (error) {
        console.error('Error making guess:', error);
        messageDisplay.textContent = 'Error processing guess';
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
        guessedLettersDisplay.textContent = 'None';
    } else {
        guessedLettersDisplay.textContent = currentGameState.guesses.join(', ');
    }

    // Update timer display
    if (featureFlags.timer) {
        updateTimerDisplay();
    }

    // Update virtual keyboard button states based on guessed letters
    if (featureFlags.virtualKeyboard) {
        updateVirtualKeyboardState();
    }
}

// Update virtual keyboard button states
function updateVirtualKeyboardState() {
    if (!currentGameState) return;

    virtualKeyboard.querySelectorAll('button').forEach(btn => {
        const letter = btn.dataset.letter;
        // Disable button if letter has been guessed
        if (currentGameState.guesses.includes(letter)) {
            btn.disabled = true;
        } else {
            btn.disabled = false;
        }
    });

    // If game is over, disable all buttons
    if (currentGameState.status !== 'RUNNING') {
        virtualKeyboard.querySelectorAll('button').forEach(btn => {
            btn.disabled = true;
        });
    }
}

// Enable input controls
function enableInput() {
    if (featureFlags.virtualKeyboard) {
        // Enable all virtual keyboard buttons
        virtualKeyboard.querySelectorAll('button').forEach(btn => {
            btn.disabled = false;
        });
        virtualKeyboard.classList.remove('disabled');
    } else {
        letterInput.disabled = false;
        guessButton.disabled = false;
        inputSection.classList.remove('disabled');
    }
}

// Disable input controls
function disableInput() {
    if (featureFlags.virtualKeyboard) {
        virtualKeyboard.querySelectorAll('button').forEach(btn => {
            btn.disabled = true;
        });
        virtualKeyboard.classList.add('disabled');
    } else {
        letterInput.disabled = true;
        guessButton.disabled = true;
        inputSection.classList.add('disabled');
    }
}

// Event listeners
guessButton.addEventListener('click', makeGuess);

letterInput.addEventListener('keypress', (e) => {
    if (e.key === 'Enter') {
        makeGuess();
    }
});

newGameButton.addEventListener('click', () => startNewGame());

// Difficulty button event listeners
difficultyControls.addEventListener('click', (e) => {
    if (e.target.classList.contains('difficulty-button')) {
        const difficulty = e.target.dataset.difficulty;
        startNewGame(difficulty);
    }
});

// Initialize
loadFeatureFlags();
loadVersion();
disableInput();
