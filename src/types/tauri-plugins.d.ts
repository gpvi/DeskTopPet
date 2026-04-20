declare module '@tauri-apps/plugin-shell' {
  export function open(target: string): Promise<void>;
  export class Command {
    static create(command: string): Command;
    execute(): Promise<unknown>;
  }
}

declare module '@tauri-apps/plugin-clipboard-manager' {
  export function readText(): Promise<string>;
}

declare module '@tauri-apps/plugin-global-shortcut' {
  export function register(
    shortcut: string,
    handler: () => void,
  ): Promise<void>;
  export function unregister(shortcut: string): Promise<void>;
}

declare module '@tauri-apps/plugin-autostart' {
  export function enable(): Promise<void>;
  export function disable(): Promise<void>;
}

declare module '@tauri-apps/plugin-notification' {
  export function isPermissionGranted(): Promise<boolean>;
  export function requestPermission(): Promise<'granted' | 'denied' | 'default'>;
}
