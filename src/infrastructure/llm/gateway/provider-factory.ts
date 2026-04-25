import type { LLMGateway } from '../../../domain/ports/llm-gateway.port';
import type { UsageRepository } from '../../../domain/ports/usage-repository.port';
import type { LLMProviderConfig } from '../provider-config';
import { LLMGatewayImpl } from './llm-gateway-impl';
import { UsageTrackingLLMGateway } from './usage-tracking-llm-gateway';

/**
 * Factory that creates an LLMGateway instance from a provider configuration.
 *
 * All currently supported providers use the OpenAI-compatible adapter under
 * the hood, so the factory simply delegates to LLMGatewayImpl. When a
 * provider requiring a bespoke adapter is added, switch on config.provider
 * to select the correct implementation.
 */
export function createLLMGateway(
  config: LLMProviderConfig,
  usageRepository?: UsageRepository,
): LLMGateway {
  const gateway = new LLMGatewayImpl(config);
  if (!usageRepository) {
    return gateway;
  }

  return new UsageTrackingLLMGateway(gateway, usageRepository);
}
