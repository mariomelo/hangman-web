// Internationalization configuration
const translations = {
  pt: {
    title: "Jogo da Forca",
    engineVersion: "Engine Version",
    attemptsRemaining: "Tentativas Restantes",
    clickToStart: "Clique em \"Novo Jogo\" para começar",
    guessLetter: "Adivinhe uma letra",
    lettersGuessed: "Letras tentadas",
    none: "Nenhuma",
    typeALetter: "Digite uma letra",
    submit: "Enviar",
    newGame: "Novo Jogo",
    engineUpdated: "Engine atualizado! A página será recarregada...",
    youWon: "Você venceu!",
    youLost: "Você perdeu!",
    theWordWas: "A palavra era"
  },
  en: {
    title: "Hangman Game",
    engineVersion: "Engine Version",
    attemptsRemaining: "Attempts Remaining",
    clickToStart: "Click \"New Game\" to start",
    guessLetter: "Guess a letter",
    lettersGuessed: "Letters guessed",
    none: "None",
    typeALetter: "Type a letter",
    submit: "Submit",
    newGame: "New Game",
    engineUpdated: "Engine updated! Page will reload...",
    youWon: "You won!",
    youLost: "You lost!",
    theWordWas: "The word was"
  },
  it: {
    title: "Gioco dell'Impiccato",
    engineVersion: "Versione Engine",
    attemptsRemaining: "Tentativi Rimanenti",
    clickToStart: "Clicca \"Nuovo Gioco\" per iniziare",
    guessLetter: "Indovina una lettera",
    lettersGuessed: "Lettere provate",
    none: "Nessuna",
    typeALetter: "Digita una lettera",
    submit: "Invia",
    newGame: "Nuovo Gioco",
    engineUpdated: "Engine aggiornato! La pagina verrà ricaricata...",
    youWon: "Hai vinto!",
    youLost: "Hai perso!",
    theWordWas: "La parola era"
  }
};

// Detect browser language
function detectLanguage() {
  const browserLang = navigator.language || navigator.userLanguage;
  const langCode = browserLang.split('-')[0].toLowerCase();

  // Return language if supported, otherwise default to English
  return translations[langCode] ? langCode : 'en';
}

// Get translation for current language
function t(key) {
  const lang = detectLanguage();
  return translations[lang][key] || translations['en'][key] || key;
}

// Apply translations to the page
function applyTranslations() {
  document.querySelector('h1').textContent = t('title');
  document.querySelector('.version').innerHTML = `${t('engineVersion')}: <span id="version">Loading...</span>`;
  document.querySelector('.lives').innerHTML = `${t('attemptsRemaining')}: <span id="lives">6</span>`;
  document.querySelector('#message').textContent = t('clickToStart');
  document.querySelector('.guesses strong').textContent = t('lettersGuessed') + ':';
  document.querySelector('#guessed-letters').textContent = t('none');
  document.querySelector('#letter-input').placeholder = t('typeALetter');
  document.querySelector('#guess-button').textContent = t('submit');
  document.querySelector('#new-game-button').textContent = t('newGame');
  document.querySelector('#reload-notification').textContent = t('engineUpdated');
}
