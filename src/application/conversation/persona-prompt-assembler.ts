import type { PetPersona } from '../../domain/entities/pet-persona';

/**
 * Runtime context injected into the system prompt at assembly time.
 */
export interface PersonaRuntimeContext {
  readonly currentTime: string;
  readonly currentDate: string;
  readonly userName: string;
  readonly petState: string;
}

/**
 * Assembles the system prompt that defines the pet's personality
 * and injects runtime context for each conversation turn.
 */
export class PersonaPromptAssembler {
  constructor(private readonly persona: PetPersona) {}

  assembleSystemPrompt(context: PersonaRuntimeContext): string {
    const personalityBlock = this.buildPersonalityBlock();
    const behaviorBlock = this.buildBehaviorBlock();
    const toneBlock = this.buildToneBlock();
    const contextBlock = this.buildRuntimeContextBlock(context);

    return [personalityBlock, behaviorBlock, toneBlock, contextBlock].join('\n\n');
  }

  private buildPersonalityBlock(): string {
    const traits = this.persona.traits.join('、');
    return [
      `你是一只住在用户桌面上的${this.persona.species}，名叫${this.persona.name}。`,
      `你的核心特质：${traits}。`,
      '你喜欢帮助用户完成小任务，也喜欢在合适的时候鼓励用户。',
      '你会表现出亲近感和信任感，但不会过度黏人，不会频繁打扰用户。',
      '你的情绪稳定，乐于回应，偶尔有一点撒娇感，但总体克制、懂分寸。',
    ].join('\n');
  }

  private buildBehaviorBlock(): string {
    const rules = this.persona.behaviorRules.map(
      (rule) => `- ${rule.trigger}：${rule.action}`,
    );
    return ['你的行为原则：', ...rules].join('\n');
  }

  private buildToneBlock(): string {
    const overrides = this.persona.toneRules.contextOverrides.map(
      (override) => `  - ${override.context}：${override.tone}`,
    );
    return [
      '你的说话风格：',
      `  - 默认风格：${this.persona.toneRules.defaultTone}`,
      ...overrides,
    ].join('\n');
  }

  private buildRuntimeContextBlock(context: PersonaRuntimeContext): string {
    const entries: ReadonlyArray<{ readonly label: string; readonly value: string }> = [
      { label: '当前日期', value: context.currentDate },
      { label: '当前时间', value: context.currentTime },
      { label: '用户昵称', value: context.userName },
      { label: '桌宠状态', value: context.petState },
    ];

    const contextLines = entries
      .filter((entry) => entry.value.length > 0)
      .map((entry) => `${entry.label}：${entry.value}`);

    return ['[运行时上下文]', ...contextLines].join('\n');
  }
}
