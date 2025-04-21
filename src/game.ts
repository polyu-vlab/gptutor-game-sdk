import { GameConfig, GameMessage, GameResult } from "./types";

interface GameSDKOptions {
  allowedOrigins?: string[];
}

export class GameSDK {
  private parentOrigin: string;
  private config: GameConfig | null = null;
  private results: GameResult[] = [];
  private allowedOrigins: string[] = [];

  constructor(options?: GameSDKOptions) {
    this.parentOrigin = window.location.ancestorOrigins[0] || "*";
    this.allowedOrigins = options?.allowedOrigins || [];
    this.setupMessageListener();
    this.notifyReady();
  }

  private setupMessageListener() {
    window.addEventListener("message", this.handleMessage);
  }

  private handleMessage = (event: MessageEvent) => {
    // Check if the origin is allowed
    const isAllowedOrigin = this.allowedOrigins.includes(event.origin);

    if (
      this.parentOrigin !== "*" &&
      event.origin !== this.parentOrigin &&
      !isAllowedOrigin
    ) {
      console.warn(
        `Rejected message from unauthorized origin: ${event.origin}. ` +
          `Allowed origins: ${[this.parentOrigin, ...this.allowedOrigins].join(
            ", "
          )}`
      );
      return;
    }

    try {
      const message: GameMessage = event.data;

      switch (message.type) {
        case "INIT_QUESTIONS":
          const initPayload = message.payload as {
            questions: GameConfig["questions"];
            connectionTimeout?: number;
          };
          this.config = {
            questions: initPayload.questions || [],
            connectionTimeout: initPayload.connectionTimeout,
          };
          this.onQuestionsReceived();
          break;
        case "UPDATE_QUESTIONS":
          const updatePayload = message.payload as {
            questions: GameConfig["questions"];
          };
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
    // Override this in your game implementation
  }

  protected onQuestionsUpdated() {
    // Override this in your game implementation
  }

  protected notifyReady() {
    this.sendMessage("GAME_READY");
  }

  protected sendAnswer(questionId: string, answerId: string, correct: boolean) {
    this.results.push({ questionId, answerId, correct });
    this.sendMessage("QUESTION_ANSWERED", { questionId, answerId, correct });
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
    window.parent.postMessage({ type, payload }, this.parentOrigin);
  }

  public getQuestions() {
    return this.config?.questions || [];
  }

  public destroy() {
    window.removeEventListener("message", this.handleMessage);
  }
}
