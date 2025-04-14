export interface Question {
  id: string;
  text: string;
  options: {
    id: string;
    text: string;
  }[];
  correctAnswerId: string;
}

export interface GameResult {
  questionId: string;
  answerId: string;
  correct: boolean;
}

export type GameErrorType =
  | "CONNECTION_ERROR"
  | "SECURITY_ERROR"
  | "TIMEOUT_ERROR"
  | "GAME_ERROR";

export interface GameMessage {
  type: string;
  payload?: unknown;
}

export interface GameConfig {
  questions: Question[];
  connectionTimeout?: number;
}

export interface GameCallbacks {
  onAnswer?: (questionId: string, answerId: string, correct: boolean) => void;
  onComplete?: (results: GameResult[]) => void;
  onError?: (errorType: GameErrorType, message: string) => void;
  onEvent?: (eventType: string, data: unknown) => void;
}
