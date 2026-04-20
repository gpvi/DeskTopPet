import { DomainError } from './domain-error';

/**
 * Raised when a data persistence operation fails.
 */
export class RepositoryError extends DomainError {
  public readonly operation: string;

  constructor(message: string, operation: string) {
    super(message, 'REPOSITORY_ERROR');
    this.operation = operation;
  }
}
