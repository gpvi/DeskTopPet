import {
  isChatIntent,
  isTaskIntent,
  type IntentClassificationResult,
} from './intent-types';

export type RoutingDecision =
  | { readonly routingType: 'continue_chat' }
  | { readonly routingType: 'execute_task'; readonly taskIntent: string; readonly taskName: string; readonly parameters?: Record<string, string> };

export class IntentRouter {
  route(classification: IntentClassificationResult): RoutingDecision {
    if (isChatIntent(classification.intent)) {
      return { routingType: 'continue_chat' };
    }
    if (isTaskIntent(classification.intent)) {
      return this.routeToTask(classification);
    }
    return { routingType: 'continue_chat' };
  }

  private routeToTask(classification: IntentClassificationResult): RoutingDecision {
    return {
      routingType: 'execute_task',
      taskIntent: classification.intent,
      taskName: this.getTaskDisplayName(classification.intent),
      parameters: classification.extractedParameters,
    };
  }

  private getTaskDisplayName(intent: string): string {
    const displayNames: Record<string, string> = {
      set_reminder: '设置提醒',
      open_url: '打开网页',
      open_application: '打开应用',
      open_folder: '打开文件夹',
      read_clipboard: '读取剪贴板',
      manage_todo: '管理待办',
    };
    return displayNames[intent] ?? '未知任务';
  }
}
