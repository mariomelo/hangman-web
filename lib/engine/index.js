// Placeholder Game Engine - Students will implement the actual game logic
// This is a basic implementation that returns a static game state

class GameEngine {
  startGame() {
    return {
      status: "RUNNING",
      word: "PLACEHOLDER",
      lives: 6,
      display_word: "___________",
      guesses: [],
      message: "Adivinhe uma letra",
    };
  }

  guessLetter(currentGameState, letter) {
    // Students will implement the actual guess logic here
    return {...currentGameState,
      lives: currentGameState.lives - 1
    }
  }

  version() {
    return "0.1.0-placeholder";
  }

  handleEvent(event, data, currentGameState) {
    if (!currentGameState) {
      return this.startGame();
    }

    return currentGameState;
  }
}

module.exports = new GameEngine();
