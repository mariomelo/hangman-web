// Game state
let currentGameState = null;
let featureFlags = {};
let timerInterval = null;
let moneyBagPosition = null;
let isProcessing = false;

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
const playerNameSection = document.getElementById('player-name-section');
const playerNameInput = document.getElementById('player-name-input');
const leaderboardSection = document.getElementById('leaderboard-section');
const leaderboardList = document.getElementById('leaderboard-list');
const timerDisplay = document.getElementById('timer-display');
const timerValue = document.getElementById('timer-value');
const versionDisplay = document.getElementById('version');
const reloadNotification = document.getElementById('reload-notification');
const moneyBag = document.getElementById('money-bag');

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
        updateLeaderboardDisplay();
        updateMoneyBagDisplay();
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
        updateLeaderboardDisplay();
        updateMoneyBagDisplay();
    } catch (error) {
        console.error('Error loading feature flags:', error);
    }
}

// Load and display leaderboard
async function loadLeaderboard() {
    try {
        const response = await fetch('/api/leaderboard');
        const leaderboard = await response.json();

        if (leaderboard.length === 0) {
            leaderboardList.innerHTML = '<p style="text-align: center; color: #666;">No scores yet. Be the first!</p>';
            return;
        }

        leaderboardList.innerHTML = leaderboard.map((entry, index) => {
            const topClass = index === 0 ? 'top-1' : index === 1 ? 'top-2' : index === 2 ? 'top-3' : '';
            return `
                <div class="leaderboard-entry ${topClass}">
                    <span class="leaderboard-rank">#${index + 1}</span>
                    <span class="leaderboard-name">${entry.playerName}</span>
                    <span class="leaderboard-score">${entry.score}</span>
                </div>
            `;
        }).join('');
    } catch (error) {
        console.error('Error loading leaderboard:', error);
        leaderboardList.innerHTML = '<p style="text-align: center; color: #dc3545;">Error loading leaderboard</p>';
    }
}

// Save score to leaderboard
async function saveScore(playerName, score) {
    try {
        await fetch('/api/leaderboard', {
            method: 'POST',
            headers: {
                'Content-Type': 'application/json'
            },
            body: JSON.stringify({ playerName, score })
        });
        await loadLeaderboard();
    } catch (error) {
        console.error('Error saving score:', error);
    }
}

// Update leaderboard display based on feature flag
function updateLeaderboardDisplay() {
    if (featureFlags.leaderboard) {
        playerNameSection.style.display = 'block';
        leaderboardSection.style.display = 'block';
        loadLeaderboard();
    } else {
        playerNameSection.style.display = 'none';
        leaderboardSection.style.display = 'none';
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

            if (isProcessing) return;

            isProcessing = true;
            try {
                const newGameState = await handleGameEvent('tick');
                if (newGameState) {
                    currentGameState = newGameState;
                    updateUI();

                    if (currentGameState.status !== 'RUNNING') {
                        stopTimer();
                        disableInput();
                    }
                }
            } catch (error) {
                console.error('Error processing tick event:', error);
            } finally {
                isProcessing = false;
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

// Money Bag functionality
function updateMoneyBagDisplay() {
    if (featureFlags.moneyBag && currentGameState && currentGameState.status === 'RUNNING' && currentGameState.money_bag) {
        moneyBag.style.display = 'block';

        // Only randomize position if it hasn't been set yet
        if (!moneyBagPosition) {
            randomizeMoneyBagPosition();
        } else {
            // Use the saved position
            moneyBag.style.left = moneyBagPosition.x + 'px';
            moneyBag.style.top = moneyBagPosition.y + 'px';
        }
    } else {
        moneyBag.style.display = 'none';
        // Reset position when money bag is hidden
        moneyBagPosition = null;
    }
}

function randomizeMoneyBagPosition() {
    const maxX = window.innerWidth - 100;
    const maxY = window.innerHeight - 100;
    const randomX = Math.random() * maxX;
    const randomY = Math.random() * maxY;

    // Save the position
    moneyBagPosition = { x: randomX, y: randomY };

    moneyBag.style.left = randomX + 'px';
    moneyBag.style.top = randomY + 'px';
}

// Money bag click handler
moneyBag.addEventListener('click', async () => {
    if (!currentGameState || currentGameState.status !== 'RUNNING') return;
    if (isProcessing) return;

    isProcessing = true;
    try {
        const newGameState = await handleGameEvent('money_bag');
        if (newGameState) {
            currentGameState = newGameState;
            updateUI();

            if (!currentGameState.money_bag) {
                moneyBag.style.display = 'none';
                moneyBagPosition = null;
            }

            if (currentGameState.status !== 'RUNNING') {
                stopTimer();
                disableInput();
                handleGameEnd();
            }
        }
    } catch (error) {
        console.error('Error handling money bag click:', error);
    } finally {
        isProcessing = false;
    }
});

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

        // Show money bag if feature is enabled
        updateMoneyBagDisplay();
    } catch (error) {
        console.error('Error starting game:', error);
        messageDisplay.textContent = 'Error starting game';
    }
}

// Make a guess (for text input)
async function makeGuess() {
    const letter = letterInput.value.trim();

    if (!letter || !currentGameState) {
        return;
    }

    await makeGuessWithLetter(letter);
    letterInput.value = '';
    letterInput.focus();
}

// Make a guess with a specific letter
async function makeGuessWithLetter(letter) {
    if (isProcessing) return;

    isProcessing = true;
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

        if (currentGameState.status !== 'RUNNING') {
            disableInput();
            handleGameEnd();
        }
    } catch (error) {
        console.error('Error making guess:', error);
        messageDisplay.textContent = 'Error processing guess';
    } finally {
        isProcessing = false;
    }
}

// Handle game end (save score if leaderboard enabled)
async function handleGameEnd() {
    if (!featureFlags.leaderboard) return;

    const playerName = playerNameInput.value.trim();
    if (!playerName) {
        messageDisplay.textContent += ' - Please enter your name to save your score!';
        return;
    }

    // Students will implement score field in gameState
    const score = currentGameState.score;
    if (score !== undefined) {
        await saveScore(playerName, score);
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

    // Update money bag display
    updateMoneyBagDisplay();

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
