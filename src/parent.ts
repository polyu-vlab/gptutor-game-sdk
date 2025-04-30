import {
  GameCallbacks,
  GameConfig,
  GameErrorType,
  GameMessage,
  GameResult,
  Question,
} from "./types";

export class GameParentSDK {
  private iframe: HTMLIFrameElement | null = null;
  private gameUrl: string;
  private config: GameConfig;
  private callbacks: GameCallbacks;
  private isConnected = false;
  private connectionTimeout: NodeJS.Timeout | null = null;

  constructor(gameUrl: string, config: GameConfig, callbacks: GameCallbacks) {
    this.gameUrl = gameUrl;
    this.config = config;
    this.callbacks = callbacks;
  }

  public initialize(iframe: HTMLIFrameElement) {
    this.iframe = iframe;
    this.setupMessageListener();
    this.startConnectionTimeout();
  }

  private setupMessageListener() {
    window.addEventListener("message", this.handleMessage);
  }

  private handleMessage = (event: MessageEvent) => {
    const gameUrlOrigin = new URL(this.gameUrl).origin;

    if (event.origin !== gameUrlOrigin) {
      this.handleError(
        "SECURITY_ERROR",
        `Received message from unauthorized origin: ${event.origin}`
      );
      return;
    }

    try {
      const message: GameMessage = event.data;

      switch (message.type) {
        case "GAME_READY":
          this.handleGameReady();
          break;
        case "QUESTION_ANSWERED":
          if (this.callbacks.onAnswer && message.payload) {
            const { questionId, answerId, correct } =
              message.payload as GameResult;
            this.callbacks.onAnswer(questionId, answerId, correct);
          }
          break;
        case "GAME_COMPLETED":
          if (this.callbacks.onComplete && message.payload) {
            const { results } = message.payload as { results: GameResult[] };
            this.callbacks.onComplete(results);
          }
          break;
        case "GAME_ERROR":
          const errorMessage =
            (message.payload as { message: string })?.message ||
            "Unknown game error";
          this.handleError("GAME_ERROR", errorMessage);
          break;
        default:
          if (this.callbacks.onEvent) {
            this.callbacks.onEvent(message.type, message.payload);
          }
      }
    } catch (error) {
      this.handleError(
        "CONNECTION_ERROR",
        error instanceof Error ? error.message : "Unknown error"
      );
    }
  };

  private handleGameReady() {
    if (this.connectionTimeout) {
      clearTimeout(this.connectionTimeout);
      this.connectionTimeout = null;
    }
    this.isConnected = true;
    this.sendMessage("INIT_QUESTIONS", { config: this.config });
  }

  private startConnectionTimeout() {
    const timeout = this.config.connectionTimeout || 10000;
    this.connectionTimeout = setTimeout(() => {
      if (!this.isConnected) {
        this.handleError(
          "TIMEOUT_ERROR",
          `Game connection timeout after ${timeout}ms`
        );
      }
    }, timeout);
  }

  private handleError(type: GameErrorType, message: string) {
    this.callbacks.onError?.(type, message);
  }

  public sendMessage(type: string, payload?: unknown) {
    if (!this.iframe?.contentWindow) return;

    try {
      this.iframe.contentWindow.postMessage(
        { type, payload },
        new URL(this.gameUrl).origin
      );
    } catch (error) {
      this.handleError(
        "CONNECTION_ERROR",
        error instanceof Error ? error.message : "Unknown error"
      );
    }
  }

  public updateQuestions(questions: Question[]) {
    this.config.questions = questions;
    if (this.isConnected) {
      this.sendMessage("UPDATE_QUESTIONS", { questions });
    }
  }

  public destroy() {
    window.removeEventListener("message", this.handleMessage);
    if (this.connectionTimeout) {
      clearTimeout(this.connectionTimeout);
    }
    this.iframe = null;
  }
}
