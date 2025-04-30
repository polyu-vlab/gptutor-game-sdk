import { GameConfig, GameMessage, GameResult, Question } from "./types";

interface GameSDKOptions {
  allowedOrigins?: string[];
}

export class GameSDK {
  private parentOrigin: string | null = null;
  private config: GameConfig | null = null;
  private results: GameResult[] = [];
  private allowedOrigins: string[] = [];

  constructor(options?: GameSDKOptions) {
    this.allowedOrigins = options?.allowedOrigins || [];
    this.setupMessageListener();
    this.notifyReady();
  }

  private setupMessageListener() {
    window.addEventListener("message", this.handleMessage);
  }

  private handleMessage = (event: MessageEvent) => {
    try {
      const message: GameMessage = event.data;

      // Accept INIT_QUESTIONS from any origin to set parentOrigin, then enforce it
      if (this.parentOrigin === null) {
        if (message.type === "INIT_QUESTIONS") {
          this.parentOrigin = event.origin;
          const initPayload = message.payload as { config: GameConfig };
          this.config = initPayload.config;
          this.onQuestionsReceived();
        }
        return;
      }

      // Validate subsequent messages against parentOrigin or allowedOrigins
      if (
        event.origin !== this.parentOrigin &&
        !this.allowedOrigins.includes(event.origin)
      ) {
        console.warn(
          `Rejected message from unauthorized origin: ${event.origin}`
        );
        return;
      }

      switch (message.type) {
        case "UPDATE_QUESTIONS":
          const updatePayload = message.payload as { questions: Question[] };
          if (this.config) {
            this.config.questions = updatePayload.questions || [];
            this.onQuestionsUpdated();
          }
          break;
      }
    } catch (error) {
      this.sendError("Failed to process message from parent");
    }
  };

  protected onQuestionsReceived() {
    // Override in game implementation
  }

  protected onQuestionsUpdated() {
    // Override in game implementation
  }

  protected notifyReady() {
    this.sendMessage("GAME_READY");
  }

  protected sendAnswer(questionId: string, answerId: string, correct: boolean) {
    const result: GameResult = { questionId, answerId, correct };
    this.results.push(result);
    this.sendMessage("QUESTION_ANSWERED", result);
  }

  protected completeGame() {
    this.sendMessage("GAME_COMPLETED", { results: this.results });
  }

  protected sendError(message: string) {
    this.sendMessage("GAME_ERROR", { message });
  }

  protected sendEvent(eventType: string, data?: unknown) {
    this.sendMessage(eventType, data);
  }

  private sendMessage(type: string, payload?: unknown) {
    window.parent.postMessage({ type, payload }, this.parentOrigin || "*");
  }

  public getConfig(): GameConfig | null {
    return this.config;
  }

  public destroy() {
    window.removeEventListener("message", this.handleMessage);
  }
}
