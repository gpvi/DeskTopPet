import type {
  ChatCompletionRequest,
  ChatCompletionResponse,
  IntentClassificationRequest,
  IntentClassificationResponse,
} from '../../interfaces/dto';

/**
 * Port: abstract gateway for all LLM interactions.
 */
export interface LLMGateway {
  completeChat(request: ChatCompletionRequest): Promise<ChatCompletionResponse>;
  classifyIntent(request: IntentClassificationRequest): Promise<IntentClassificationResponse>;
}
