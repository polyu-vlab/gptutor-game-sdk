import { GameConfig, GameMessage, GameResult, Question } from "./types";

interface GameSDKOptions {
  allowedOrigins?: string[];
}

export class GameSDK {
  private parentOrigin: string | null = null;
  private config: GameConfig | null = null;
  private results: GameResult[] = [];
  private allowedOrigins: string[] = [];
  private isReadyNotified: boolean = false; // Track if GAME_READY was sent

  constructor(options?: GameSDKOptions) {
    // Initialize allowedOrigins, ensure localhost:3000 is present for development
    this.allowedOrigins = options?.allowedOrigins || [];
    if (!this.allowedOrigins.includes("http://localhost:3000")) {
      this.allowedOrigins.push("http://localhost:3000");
    }
    this.setupMessageListener();
    // Do not notify ready immediately
    // this.notifyReady();
  }

  private setupMessageListener() {
    window.addEventListener("message", this.handleMessage);
  }

  private handleMessage = (event: MessageEvent) => {
    try {
      // Check if the origin is allowed
      const isOriginAllowed =
        this.parentOrigin === event.origin ||
        (this.parentOrigin === null &&
          this.allowedOrigins.includes(event.origin));

      if (!isOriginAllowed) {
        console.warn(
          `Rejected message from origin: ${event.origin}. Current parent: ${
            this.parentOrigin
          }, Allowed: ${this.allowedOrigins.join(", ")}`
        );
        return;
      }

      const message: GameMessage = event.data;

      // If parentOrigin is not set, only accept INIT_QUESTIONS to establish it.
      if (this.parentOrigin === null) {
        if (message.type === "INIT_QUESTIONS") {
          this.parentOrigin = event.origin; // Establish parent origin
          console.log(`Parent origin established: ${this.parentOrigin}`);

          // Process payload which might contain config and/or questions
          const initPayload = message.payload as {
            config?: GameConfig;
            questions?: Question[];
          };

          if (initPayload.config) {
            this.config = initPayload.config;
            // If questions are nested inside config, assign them
            if (initPayload.config.questions) {
              this.config.questions = initPayload.config.questions;
            }
          } else {
            // If no config object, create a default one
            this.config = { questions: [] };
          }

          // If questions are directly in payload, assign them (potentially overwriting those in config)
          if (initPayload.questions) {
            this.config.questions = initPayload.questions;
          }

          console.log("Initial config/questions received:", this.config);
          this.onQuestionsReceived(); // Trigger game logic and notify ready
        } else {
          console.warn(
            `Ignoring message type ${message.type} from ${event.origin} before parent origin is established.`
          );
        }
        return; // Stop processing this message further here
      }

      // If parentOrigin is set, handle other messages (origin already validated)
      switch (message.type) {
        // Allow re-initialization/update via INIT_QUESTIONS if needed
        case "INIT_QUESTIONS": {
          const initPayload = message.payload as {
            config?: GameConfig;
            questions?: Question[];
          };
          let questionsToUpdate: Question[] = [];

          if (initPayload.config?.questions) {
            questionsToUpdate = initPayload.config.questions;
          } else if (initPayload.questions) {
            questionsToUpdate = initPayload.questions;
          }

          if (this.config) {
            this.config.questions = questionsToUpdate;
            console.log(
              "Questions re-initialized/updated via INIT_QUESTIONS:",
              this.config.questions
            );
            this.onQuestionsReceived(); // Notify game about new questions
          } else {
            console.error(
              "Received INIT_QUESTIONS but config is null after parentOrigin was set."
            );
            // Optionally recreate config
            this.config = { questions: questionsToUpdate };
            this.onQuestionsReceived();
          }
          break;
        }
        case "UPDATE_QUESTIONS": {
          const updatePayload = message.payload as { questions: Question[] };
          if (this.config) {
            this.config.questions = updatePayload.questions || [];
            console.log(
              "Questions updated via UPDATE_QUESTIONS:",
              this.config.questions
            );
            this.onQuestionsUpdated();
          } else {
            console.error("Received UPDATE_QUESTIONS but config is null.");
          }
          break;
        }
        // Handle other game-specific messages if necessary
      }
    } catch (error) {
      console.error("Error handling message:", error);
      this.sendError(
        `Failed to process message from parent: ${
          error instanceof Error ? error.message : String(error)
        }`
      );
    }
  };

  protected onQuestionsReceived() {
    // Override in game implementation
    // Now that we have received questions (implying parentOrigin is set), notify ready if not already done.
    if (!this.isReadyNotified) {
      this.notifyReady();
    }
  }

  protected onQuestionsUpdated() {
    // Override in game implementation
  }

  protected notifyReady() {
    if (this.parentOrigin) {
      console.log("GameSDK sending GAME_READY");
      this.sendMessage("GAME_READY");
      this.isReadyNotified = true; // Mark as notified
    } else {
      console.warn("Cannot send GAME_READY, parentOrigin not yet established.");
      // It will be sent later from onQuestionsReceived when the first INIT_QUESTIONS arrives.
    }
  }

  // ... (sendAnswer, completeGame, sendError, sendEvent remain mostly the same)

  protected sendAnswer(questionId: string, answerId: string, correct: boolean) {
    const result: GameResult = { questionId, answerId, correct };
    this.results.push(result);
    this.sendMessage("QUESTION_ANSWERED", result);
  }

  protected completeGame() {
    this.sendMessage("GAME_COMPLETED", { results: this.results });
  }

  protected sendError(message: string) {
    // Ensure error messages can be sent even if parentOrigin was just set
    if (this.parentOrigin) {
      this.sendMessage("GAME_ERROR", { message });
    } else {
      // If parentOrigin isn't set, we can't send the error via postMessage. Log it.
      console.error(`Game Error (cannot send to parent): ${message}`);
    }
  }

  protected sendEvent(eventType: string, data?: unknown) {
    this.sendMessage(eventType, data);
  }

  private sendMessage(type: string, payload?: unknown) {
    // Only send if parentOrigin is established.
    if (this.parentOrigin) {
      window.parent.postMessage({ type, payload }, this.parentOrigin);
    } else {
      console.warn(
        `Cannot send message ${type}, parentOrigin not yet established.`
      );
    }
  }

  public getConfig(): GameConfig | null {
    return this.config;
  }

  public destroy() {
    window.removeEventListener("message", this.handleMessage);
    // Reset state
    this.parentOrigin = null;
    this.config = null;
    this.results = [];
    this.isReadyNotified = false;
    console.log("GameSDK destroyed");
  }
}
