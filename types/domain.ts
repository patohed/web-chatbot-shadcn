// Domain Layer - Entidades y tipos
export interface Message {
  role: 'user' | 'assistant' | 'system';
  content: string;
  timestamp?: Date;
}

export interface ChatSession {
  id: string;
  messages: Message[];
  createdAt: Date;
  updatedAt: Date;
}

export interface RateLimitInfo {
  remainingPoints: number;
  msBeforeNext: number;
  isAllowed: boolean;
}

export interface StreamResponse {
  success: boolean;
  error?: string;
  stream?: ReadableStream<Uint8Array>;
}

export interface CaptchaVerification {
  success: boolean;
  error?: string;
}
