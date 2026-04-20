import type { LLMGateway } from '../../../domain/ports/llm-gateway.port';
import type { LLMProviderConfig } from '../provider-config';
import { LLMGatewayImpl } from './llm-gateway-impl';

/**
 * Factory that creates an LLMGateway instance from a provider configuration.
 *
 * All currently supported providers use the OpenAI-compatible adapter under
 * the hood, so the factory simply delegates to LLMGatewayImpl. When a
 * provider requiring a bespoke adapter is added, switch on config.provider
 * to select the correct implementation.
 */
export function createLLMGateway(config: LLMProviderConfig): LLMGateway {
  return new LLMGatewayImpl(config);
}
