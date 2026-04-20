/**
 * A piece of information the companion remembers about the user.
 */
export interface UserMemory {
  readonly memoryId: string;
  readonly userId: string;
  readonly category: string;
  readonly content: string;
  readonly source: string;
  readonly confidence: number;
  readonly createdAt: Date;
  readonly isDeleted: boolean;
}
