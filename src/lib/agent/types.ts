import { z } from "zod";

export interface TokenUsage {
  inputTokens: number;
  outputTokens: number;
  totalTokens: number;
}

export type AgentErrorCode =
  | "QUOTA_EXCEEDED"
  | "RATE_LIMITED"
  | "INPUT_TOO_LARGE"
  | "TIMEOUT"
  | "API_ERROR"
  | "VALIDATION_FAILED"
  | "GLOBAL_BUDGET_EXCEEDED"
  | "SERVICE_UNAVAILABLE";

export interface AgentError {
  code: AgentErrorCode;
  message: string;
  retryable: boolean;
}

export type AgentResult<T> =
  | { success: true; data: T; usage: TokenUsage }
  | { success: false; error: AgentError };

export interface AgentGenerateOptions<T> {
  systemInstruction: string;
  userPrompt: string;
  schema: z.ZodType<T>;
  jsonSchema?: Record<string, unknown>;
  maxOutputTokens?: number;
  temperature?: number;
}

export interface AgentClient {
  generate<T>(options: AgentGenerateOptions<T>): Promise<AgentResult<T>>;
}
