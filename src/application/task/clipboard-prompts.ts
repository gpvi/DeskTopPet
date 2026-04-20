export type ClipboardAction = 'summarize' | 'rewrite' | 'translate';

export interface ClipboardPromptPair {
  readonly systemPrompt: string;
  readonly userPrompt: string;
}

export function buildClipboardPrompt(
  action: ClipboardAction,
  clipboardText: string,
  targetLanguage?: string,
): ClipboardPromptPair {
  const builders: Record<ClipboardAction, (text: string) => ClipboardPromptPair> = {
    summarize: buildSummarizePrompt,
    rewrite: buildRewritePrompt,
    translate: (text) => buildTranslatePrompt(text, targetLanguage),
  };
  return builders[action](clipboardText);
}

function buildSummarizePrompt(text: string): ClipboardPromptPair {
  return {
    systemPrompt: '你是桌面宠物助手的剪贴板总结功能。用简洁的中文总结用户剪贴板中的内容，保留关键信息，不超过3句话。',
    userPrompt: `请总结以下内容：\n\n${text}`,
  };
}

function buildRewritePrompt(text: string): ClipboardPromptPair {
  return {
    systemPrompt: '你是桌面宠物助手的剪贴板改写功能。用更清晰、更专业的中文改写用户剪贴板中的内容，保持原意不变。',
    userPrompt: `请改写以下内容：\n\n${text}`,
  };
}

function buildTranslatePrompt(text: string, targetLanguage?: string): ClipboardPromptPair {
  const language = targetLanguage ?? '英文';
  return {
    systemPrompt: `你是桌面宠物助手的翻译功能。将用户剪贴板中的内容翻译成${language}，保持原文的语气和格式。`,
    userPrompt: `请翻译以下内容为${language}：\n\n${text}`,
  };
}
