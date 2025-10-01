Este é um aplicativo web para jogar um jogo da forca para um curso de Certified Scrum Developer (CSD).

Essa aplicação deve consultar a pasta /lib/engine para obter a lógica do jogo da forca. O conteúdo dessa pasta será atualizado durante o curso e é preciso que o aplicativo faça hot-reload quando isso acontecer.
O hot-reload pode ser feito via algum script, sem problemas.

## Requisitos

O aplicativo deve ter um campo de texto para o jogador digitar uma letra e um botão para enviar a letra.
Nenhuma validação de entrada é necessária.
O jogo deve ter um placar que mostre o número de tentativas restantes.
O jogo deve mostrar a palavra com letras corretas reveladas e letras ainda não adivinhadas como underscores.
O jogo deve exibir o conjunto de letras já tentadas.
O jogo deve mostrar uma mensagem de vitória quando o jogador adivinhar a palavra corretamente.
O jogo deve mostrar uma mensagem de derrota quando o jogador ficar sem tentativas, e revelear a palavra correta.
O jogo deve ter um botão para reiniciar o jogo após uma vitória ou derrota.
O jogo deve respeitar a interface do GameEngine fornecida na pasta /lib/engine.
## Interface do GameEngine
A interface do GameEngine é a seguinte:

Estrutura:
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

Métodos:
```javascript
startGame(): GameState
guessLetter(currentGameState: GameState, letter: string): GameState
version(): string
handleEvent(event: string, data?: any): GameState
```

## Stack sugerido
Qualquer coisa que rode em Node.js, seja fácil de configurar e que permita hot-reload. Ter atualizações via push no navegador é um diferencial, pois assim o jogo da forca fica mais interativo.

Futuramente pretendo adicionar "feature flags", mas isso pode ser feito através de um arquivo de configuração simples e eu não me importo de reiniciar o serviço para que as alterações sejam validadas.

Pode ser server-rendered ou SPA, tanto faz, porque o estado será mantido no browser (É só o estado do jogo da forca).

Se futuramente precisarmos persistir dados, podemos usar algo como um supabase, mas por enquanto não é necessário.

Você será responsável por criar o .gitignore de acordo com a stack que escolher, e também por criar um arquivo de serviço Linux que permita que o sistema rode automaticamente quando o server for iniciado e que o hot-reload funcione.
