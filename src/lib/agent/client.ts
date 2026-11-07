import { AgentClient, AgentGenerateOptions, AgentResult } from "./types";

const GEMINI_API_BASE = "https://generativelanguage.googleapis.com/v1beta/models";
const DEFAULT_MODEL = process.env.GEMINI_MODEL || "gemini-3.5-flash";
const REQUEST_TIMEOUT_MS = 10000;

export class GeminiAgentClient implements AgentClient {
  private apiKey: string;
  private model: string;

  constructor(apiKey?: string, model?: string) {
    this.apiKey = apiKey || process.env.GEMINI_API_KEY || "";
    this.model = model || DEFAULT_MODEL;
  }

  async generate<T>(options: AgentGenerateOptions<T>): Promise<AgentResult<T>> {
    if (!this.apiKey || this.apiKey === "mock_gemini_api_key") {
      // In development/test with mock key, we can provide fallback handling
      return {
        success: false,
        error: {
          code: "SERVICE_UNAVAILABLE",
          message: "Gemini API key is not configured. Please set GEMINI_API_KEY in .env.local",
          retryable: false,
        },
      };
    }

    let attempts = 0;
    const maxAttempts = 2;

    while (attempts < maxAttempts) {
      attempts++;
      try {
        const url = `${GEMINI_API_BASE}/${this.model}:generateContent?key=${this.apiKey}`;

        const payload: Record<string, unknown> = {
          contents: [
            {
              role: "user",
              parts: [{ text: options.userPrompt }],
            },
          ],
          systemInstruction: {
            parts: [{ text: options.systemInstruction }],
          },
          generationConfig: {
            temperature: options.temperature ?? 0.1,
            maxOutputTokens: options.maxOutputTokens ?? 1024,
            responseMimeType: "application/json",
            ...(options.jsonSchema ? { responseSchema: options.jsonSchema } : {}),
          },
        };

        const res = await fetch(url, {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify(payload),
          signal: AbortSignal.timeout(REQUEST_TIMEOUT_MS),
        });

        if (!res.ok) {
          const errBody = await res.text();
          if (res.status === 404 && this.model !== "gemini-3.5-flash") {
            this.model = "gemini-3.5-flash";
            continue; // Fallback to active model
          }
          if (res.status === 429) {
            return {
              success: false,
              error: {
                code: "RATE_LIMITED",
                message: "Gemini API rate limit reached. Please wait a moment before trying again.",
                retryable: true,
              },
            };
          }
          if (res.status >= 500 && attempts < maxAttempts) {
            continue; // Transient retry
          }
          return {
            success: false,
            error: {
              code: "API_ERROR",
              message: `Gemini API returned error HTTP ${res.status}: ${errBody.slice(0, 200)}`,
              retryable: false,
            },
          };
        }

        const data = await res.json();
        const candidate = data.candidates?.[0];
        const rawText = candidate?.content?.parts?.[0]?.text;

        if (!rawText) {
          if (attempts < maxAttempts) continue;
          return {
            success: false,
            error: {
              code: "VALIDATION_FAILED",
              message: "Gemini returned an empty response candidate.",
              retryable: true,
            },
          };
        }

        // Parse JSON
        let parsedJson: unknown;
        try {
          parsedJson = JSON.parse(rawText);
        } catch (jsonErr) {
          if (attempts < maxAttempts) continue;
          return {
            success: false,
            error: {
              code: "VALIDATION_FAILED",
              message: "Failed to parse structured JSON from model output.",
              retryable: false,
            },
          };
        }

        // Validate against Zod schema
        const validated = options.schema.safeParse(parsedJson);
        if (!validated.success) {
          if (attempts < maxAttempts) continue;
          return {
            success: false,
            error: {
              code: "VALIDATION_FAILED",
              message: `Model output did not match expected schema: ${JSON.stringify(
                validated.error.flatten().fieldErrors
              )}`,
              retryable: false,
            },
          };
        }

        const usageMetadata = data.usageMetadata || {};
        const inputTokens = usageMetadata.promptTokenCount || 0;
        const outputTokens = usageMetadata.candidatesTokenCount || 0;

        return {
          success: true,
          data: validated.data,
          usage: {
            inputTokens,
            outputTokens,
            totalTokens: inputTokens + outputTokens,
          },
        };
      } catch (err: any) {
        if (err.name === "TimeoutError" || err.message?.includes("timeout")) {
          return {
            success: false,
            error: {
              code: "TIMEOUT",
              message: "The AI agent request timed out after 10 seconds. Please try again.",
              retryable: true,
            },
          };
        }

        if (attempts >= maxAttempts) {
          return {
            success: false,
            error: {
              code: "API_ERROR",
              message: err.message || "Network error contacting Gemini API",
              retryable: true,
            },
          };
        }
      }
    }

    return {
      success: false,
      error: {
        code: "API_ERROR",
        message: "Maximum retries exceeded without successful response.",
        retryable: false,
      },
    };
  }
}

export const agentClient = new GeminiAgentClient();
