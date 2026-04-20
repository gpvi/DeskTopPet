export { DomainError } from './domain-error';
export { LLMGatewayError } from './llm-gateway-error';
export { ToolExecutionError } from './tool-execution-error';
export { RepositoryError } from './repository-error';
import { LLMGatewayError } from './llm-gateway-error';
import { RepositoryError } from './repository-error';
import { ToolExecutionError } from './tool-execution-error';

export type ErrorCategory =
  | 'llm_gateway'
  | 'repository'
  | 'tool_execution'
  | 'unknown';

export interface UserReadableError {
  category: ErrorCategory;
  userMessage: string;
}

export function toUserReadableError(error: unknown): UserReadableError {
  if (error instanceof LLMGatewayError) {
    return {
      category: 'llm_gateway',
      userMessage: '模型服务暂时不可用，请稍后重试。',
    };
  }

  if (error instanceof RepositoryError) {
    return {
      category: 'repository',
      userMessage: '数据暂时无法保存或读取，请稍后重试。',
    };
  }

  if (error instanceof ToolExecutionError) {
    return {
      category: 'tool_execution',
      userMessage: '工具执行失败，请检查配置后重试。',
    };
  }

  return {
    category: 'unknown',
    userMessage: '系统开了个小差，请稍后再试。',
  };
}
