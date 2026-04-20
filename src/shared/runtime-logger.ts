/* eslint-disable no-console */

export const runtimeLogger = {
  info(message: string): void {
    console.info(message);
  },
  warn(message: string): void {
    console.warn(message);
  },
  error(message: string): void {
    console.error(message);
  },
};

