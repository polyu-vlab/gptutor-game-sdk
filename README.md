# GPTutor Game SDK

SDK for integrating interactive games with GPTutor platform.

## Installation

### For Production Use

1. Create a `.npmrc` file in your project:

```bash
# For a single organization/scope
echo "@polyu-vlab:registry=https://npm.pkg.github.com" > .npmrc
echo "//npm.pkg.github.com/:_authToken=${GITHUB_TOKEN}" >> .npmrc

# For multiple organizations/scopes
echo "@polyu-vlab:registry=https://npm.pkg.github.com" >> .npmrc
echo "@other-org:registry=https://npm.pkg.github.com" >> .npmrc
echo "//npm.pkg.github.com/:_authToken=${GITHUB_TOKEN}" >> .npmrc
```

2. Set your GitHub token (required for private package access):

```bash
# For personal access token
export GITHUB_TOKEN=your_github_token

# For GitHub Actions workflow
# The GITHUB_TOKEN is automatically available
```

3. Install the package:

```bash
# Using pnpm
pnpm add @polyu-vlab/gptutor-game-sdk

# Using npm
npm install @polyu-vlab/gptutor-game-sdk

# Using yarn
yarn add @polyu-vlab/gptutor-game-sdk
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
pnpm link --global @polyu-vlab/gptutor-game-sdk
```

### Troubleshooting

If you encounter authentication issues:

1. Verify your GitHub token has the correct permissions:

   - `read:packages` (required for installation)
   - `write:packages` (required for publishing)
   - `delete:packages` (required for package deletion)
   - `repo` (required for private repositories)

2. Check your `.npmrc` file:

   - Ensure the registry URL is correct
   - Verify the auth token is properly set
   - Make sure there are no conflicting registry settings

3. For GitHub Actions workflows:
   - Ensure the workflow has the correct permissions
   - Verify the `GITHUB_TOKEN` has access to the package
   - Check if the package's access control is properly configured

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

### Prerequisites

1. Generate a GitHub Personal Access Token:

   - Go to GitHub.com → Settings → Developer Settings → Personal Access Tokens → Tokens (classic)
   - Generate a new token with these permissions:
     - `read:packages`
     - `write:packages`
     - `delete:packages`
     - `repo` (for private repositories)

2. Set your GitHub token:

```bash
export GITHUB_TOKEN=your_github_token
```

3. Configure package access:

   - Go to your GitHub repository
   - Navigate to Settings → Packages
   - Ensure the package visibility is set to "Private"
   - Configure access for your organization members

### Publishing Process

1. Update the version (if needed):

```bash
make version-patch  # or version-minor/version-major
```

2. Publish the package:

```bash
make publish
```

The publish script will:

- Build the package
- Configure npm with your GitHub token
- Publish to GitHub Packages as a private package

### Access Control

To allow other team members to access the private package:

1. They need to:

   - Be a member of the @polyu-vlab organization
   - Have the appropriate repository permissions
   - Set up their own GitHub token in their `.npmrc`

2. Their `.npmrc` should contain:

```bash
@polyu-vlab:registry=https://npm.pkg.github.com
//npm.pkg.github.com/:_authToken=${GITHUB_TOKEN}
```

## Usage

```typescript
import { GameSDK } from "@polyu-vlab/gptutor-game-sdk";

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
   - The package will be published to GitHub Packages as a private package

4. **Cleanup**:

   - When done with local development:

     ```bash
     # In your project
     pnpm unlink --global @polyu-vlab/gptutor-game-sdk

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
import { GameSDK } from "@polyu-vlab/gptutor-game-sdk";

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
import { GameParentSDK } from "@polyu-vlab/gptutor-game-sdk";

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
import { GameSDK } from "@polyu-vlab/gptutor-game-sdk";

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
import { GameParentSDK } from "@polyu-vlab/gptutor-game-sdk";

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
