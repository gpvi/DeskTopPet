import { DomainError } from './domain-error';

/**
 * Raised when communication with the LLM provider fails.
 */
export class LLMGatewayError extends DomainError {
  public readonly provider: string;

  constructor(message: string, provider: string) {
    super(message, 'LLM_GATEWAY_ERROR');
    this.provider = provider;
  }
}
