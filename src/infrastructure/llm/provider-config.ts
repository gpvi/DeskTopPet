/**
 * Supported LLM provider identifiers.
 * Each provider uses the OpenAI-compatible chat completion API,
 * differing only in base URL and default model.
 */
export type LLMProviderIdentifier =
  | 'openai'
  | 'anthropic'
  | 'deepseek'
  | 'moonshot'
  | 'qwen'
  | 'zhipu';

/**
 * Configuration required to initialise an LLM provider adapter.
 */
export interface LLMProviderConfig {
  readonly provider: LLMProviderIdentifier;
  readonly baseUrl: string;
  readonly apiKey: string;
  readonly defaultModel: string;
}
