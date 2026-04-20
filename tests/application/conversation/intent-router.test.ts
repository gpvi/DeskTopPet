import { describe, expect, it } from 'vitest';
import { IntentRouter } from '../../../src/application/conversation/intent-router';

describe('IntentRouter', () => {
  it('routes chat intent to continue_chat', () => {
    const router = new IntentRouter();

    const result = router.route({
      intent: 'chat',
      confidence: 0.99,
    });

    expect(result).toEqual({ routingType: 'continue_chat' });
  });

  it('routes open_url intent to execute_task with display name and parameters', () => {
    const router = new IntentRouter();

    const result = router.route({
      intent: 'open_url',
      confidence: 0.95,
      extractedParameters: { url: 'https://example.com' },
    });

    expect(result).toEqual({
      routingType: 'execute_task',
      taskIntent: 'open_url',
      taskName: '打开网页',
      parameters: { url: 'https://example.com' },
    });
  });
});
