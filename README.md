# GPTutor Game SDK

SDK for integrating interactive games with GPTutor platform.

## Installation

```bash
# Using npm
npm install @gptutor/game-sdk

# Using yarn
yarn add @gptutor/game-sdk

# Using pnpm
pnpm add @gptutor/game-sdk
```

### For Local Development

1. Clone the repository:

```bash
git clone https://github.com/polyu-vlab/gptutor-game-sdk.git
cd gptutor-game-sdk
```

2. Install dependencies:

```bash
pnpm install
```

3. Link the package for local development:

```bash
# In the SDK directory
make link

# In your project directory
pnpm link --global @gptutor/game-sdk
```

## Development

### Available Commands

```bash
# Start development server
make dev

# Run tests
make test

# Build the package
make build

# Clean build artifacts
make clean
```

### Version Management

```bash
# Bump patch version (1.0.0 -> 1.0.1)
make version-patch

# Bump minor version (1.0.0 -> 1.1.0)
make version-minor

# Bump major version (1.0.0 -> 2.0.0)
make version-major
```

## Publishing

Update the version (if needed) and publish the package:

```bash
# Update version
make version-patch  # or version-minor/version-major

# Publish to npm
make publish
```

## Usage

```typescript
import { GameSDK } from "@gptutor/game-sdk";

class MyGame extends GameSDK {
  protected onQuestionsReceived() {
    // Handle questions received from parent
    const questions = this.getQuestions();
    // ... your game logic
  }

  protected onQuestionsUpdated() {
    // Handle questions update from parent
    const questions = this.getQuestions();
    // ... your game logic
  }
}

const game = new MyGame();
```

## Development Workflow

1. **Local Development**:

   - Use `make link` to link the package globally
   - Make changes to the SDK
   - Changes will be reflected immediately in projects using the linked package

2. **Testing Changes**:

   - Run `make build` to build the package
   - Test in your project

3. **Publishing**:

   - Update version if needed
   - Run `make publish`

4. **Cleanup**:

   - When done with local development:

     ```bash
     # In your project
     pnpm unlink --global @gptutor/game-sdk

     # In the SDK directory
     make unlink
     ```

## Contributing

1. Fork the repository
2. Create your feature branch (`git checkout -b feature/amazing-feature`)
3. Commit your changes (`git commit -m 'Add some amazing feature'`)
4. Push to the branch (`git push origin feature/amazing-feature`)
5. Open a Pull Request

## License

This project is licensed under the MIT License - see the [LICENSE](LICENSE) file for details.

## API Documentation

### Core Classes

#### `GameSDK`

The main class for game implementations. Extend this class to create your game.

```typescript
import { GameSDK } from "@gptutor/game-sdk";

class MyGame extends GameSDK {
  // Override methods here
}
```

##### Protected Methods

- `onQuestionsReceived()`: Called when questions are first received from the parent
- `onQuestionsUpdated()`: Called when questions are updated
- `notifyReady()`: Notifies the parent that the game is ready
- `sendAnswer(questionId: string, answerId: string, correct: boolean)`: Sends an answer to a question
- `completeGame()`: Marks the game as completed
- `sendError(message: string)`: Sends an error message to the parent
- `sendEvent(eventType: string, data?: unknown)`: Sends a custom event to the parent

##### Public Methods

- `getQuestions()`: Returns the current questions array
- `destroy()`: Cleans up event listeners

#### `GameParentSDK`

Class for the parent application to communicate with the game.

```typescript
import { GameParentSDK } from "@gptutor/game-sdk";

const gameSDK = new GameParentSDK(
  gameUrl: string,
  config: GameConfig,
  callbacks: GameCallbacks
);
```

##### Methods

- `initialize(iframe: HTMLIFrameElement)`: Initializes the SDK with an iframe
- `updateQuestions(questions: Question[])`: Updates the questions in the game
- `destroy()`: Cleans up resources

### Types

```typescript
interface Question {
  id: string;
  text: string;
  options: {
    id: string;
    text: string;
  }[];
  correctAnswerId: string;
}

interface GameResult {
  questionId: string;
  answerId: string;
  correct: boolean;
}

type GameErrorType =
  | "CONNECTION_ERROR"
  | "SECURITY_ERROR"
  | "TIMEOUT_ERROR"
  | "GAME_ERROR";

interface GameConfig {
  questions: Question[];
  connectionTimeout?: number;
}

interface GameCallbacks {
  onAnswer?: (questionId: string, answerId: string, correct: boolean) => void;
  onComplete?: (results: GameResult[]) => void;
  onError?: (errorType: GameErrorType, message: string) => void;
  onEvent?: (eventType: string, data: unknown) => void;
}
```

### Usage Examples

#### Basic Game Implementation

```typescript
import { GameSDK } from "@gptutor/game-sdk";

class QuizGame extends GameSDK {
  protected onQuestionsReceived() {
    const questions = this.getQuestions();
    // Initialize your game with questions
    this.renderQuestions(questions);
  }

  private renderQuestions(questions: Question[]) {
    questions.forEach((question) => {
      // Render question and options
      this.setupQuestionHandlers(question);
    });
  }

  private setupQuestionHandlers(question: Question) {
    question.options.forEach((option) => {
      // Add click handler
      this.handleAnswer(question.id, option.id);
    });
  }

  private handleAnswer(questionId: string, answerId: string) {
    const question = this.getQuestions().find((q) => q.id === questionId);
    const correct = question?.correctAnswerId === answerId;
    this.sendAnswer(questionId, answerId, correct);
  }
}

const game = new QuizGame();
```

#### Parent Application Implementation

```typescript
import { GameParentSDK } from "@gptutor/game-sdk";

const gameConfig: GameConfig = {
  questions: [
    {
      id: "1",
      text: "What is 2+2?",
      options: [
        { id: "a", text: "3" },
        { id: "b", text: "4" },
        { id: "c", text: "5" },
      ],
      correctAnswerId: "b",
    },
  ],
};

const callbacks: GameCallbacks = {
  onAnswer: (questionId, answerId, correct) => {
    console.log(`Question ${questionId} answered with ${answerId}: ${correct}`);
  },
  onComplete: (results) => {
    console.log("Game completed!", results);
  },
  onError: (errorType, message) => {
    console.error(`Game error (${errorType}): ${message}`);
  },
};

const gameSDK = new GameParentSDK(
  "https://your-game-url.com",
  gameConfig,
  callbacks
);

// Initialize with iframe
const iframe = document.getElementById("game-iframe") as HTMLIFrameElement;
gameSDK.initialize(iframe);
```

### Communication Flow

1. Parent initializes game with questions
2. Game receives questions and renders them
3. User interacts with the game
4. Game sends answers back to parent
5. Parent tracks progress and results
6. Game signals completion when done

### Error Handling

The SDK provides built-in error handling through the `sendError` method and `GameErrorType`:

```typescript
try {
  // Game logic
} catch (error) {
  this.sendError("Failed to process question");
}
```
