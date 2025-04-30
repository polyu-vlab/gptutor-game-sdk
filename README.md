# GPTutor Game SDK

The GPTutor Game SDK enables communication between a parent window and a game embedded in an iframe. It supports sending questions, game title, and description from the parent to the child, and receiving answers and results from the child.

## Features

- **TypeScript Support**: Strongly typed interfaces for better development experience.
- **Secure Communication**: Validates message origins for security.
- **Configurable**: Pass game title, description, and questions from parent to child.
- **Extensible**: Easy to override methods for custom game logic.

## Installation

```bash
pnpm install @gptutor/game-sdk
```

## Usage

### Parent Side (React Example)

1. **Embed the Game in an Iframe**:

   ```tsx
   import React, { useRef, useEffect } from "react";
   import { GameParentSDK } from "@gptutor/game-sdk";

   const GameComponent: React.FC = () => {
     const iframeRef = useRef<HTMLIFrameElement>(null);

     useEffect(() => {
       const config = {
         questions: [
           {
             id: "q1",
             text: "What is 2+2?",
             options: [{ id: "a1", text: "4" }],
             correctAnswerId: "a1",
           },
         ],
         title: "Math Quiz",
         description: "A simple math game",
         connectionTimeout: 10000,
       };
       const callbacks = {
         onAnswer: (questionId, answerId, correct) =>
           console.log(`Answer: ${questionId}, ${answerId}, ${correct}`),
         onComplete: (results) => console.log("Completed:", results),
         onError: (type, message) => console.error(`${type}: ${message}`),
         onEvent: (type, data) => console.log(`Event: ${type}`, data),
       };

       const sdk = new GameParentSDK(
         "https://example.com/game.html",
         config,
         callbacks
       );
       if (iframeRef.current) {
         sdk.initialize(iframeRef.current);
       }

       return () => {
         sdk.destroy();
       };
     }, []);

     return (
       <iframe
         ref={iframeRef}
         src="https://example.com/game.html"
         title="Game"
         style={{ width: "100%", height: "100%" }}
       />
     );
   };

   export default GameComponent;
   ```

2. **Update Questions Later**:
   ```tsx
   sdk.updateQuestions([
     {
       id: "q2",
       text: "What is 3+3?",
       options: [{ id: "a1", text: "6" }],
       correctAnswerId: "a1",
     },
   ]);
   ```

### Child (Game) Side

1. **Extend `GameSDK`**:

   ```typescript
   import { GameSDK } from "@gptutor/game-sdk";

   class MyGame extends GameSDK {
     protected onQuestionsReceived() {
       const config = this.getConfig();
       if (config) {
         console.log(
           `Title: ${config.title}, Description: ${config.description}`
         );
         // Start game with config.questions
       }
     }

     protected onQuestionsUpdated() {
       const config = this.getConfig();
       if (config) {
         // Update game with config.questions
       }
     }

     answerQuestion(questionId: string, answerId: string, correct: boolean) {
       this.sendAnswer(questionId, answerId, correct);
     }

     finishGame() {
       this.completeGame();
     }
   }

   const game = new MyGame();
   ```

## API

### `GameSDK`

- **Methods**:

  - `getConfig(): GameConfig | null` - Returns the current game configuration.
  - `sendAnswer(questionId: string, answerId: string, correct: boolean)` - Sends an answer to the parent.
  - `completeGame()` - Notifies the parent that the game is complete.
  - `destroy()` - Cleans up event listeners.

- **Protected Methods** (to override):
  - `onQuestionsReceived()` - Called when initial questions and config are received.
  - `onQuestionsUpdated()` - Called when questions are updated.

### `GameParentSDK`

- **Methods**:
  - `initialize(iframe: HTMLIFrameElement)` - Sets up the SDK with the iframe.
  - `updateQuestions(questions: Question[])` - Updates the questions sent to the child.
  - `destroy()` - Cleans up resources.

## Security Notes

- The child accepts the first `INIT_QUESTIONS` message to set the parent origin, then enforces it for subsequent messages.
- Messages from child to parent use the parent’s origin after initialization, falling back to `"*"` only for the initial `GAME_READY`.

## Types

- `Question`: `{ id: string, text: string, options: { id: string, text: string }[], correctAnswerId: string }`
- `GameResult`: `{ questionId: string, answerId: string, correct: boolean }`
- `GameConfig`: `{ questions: Question[], title?: string, description?: string, connectionTimeout?: number }`
