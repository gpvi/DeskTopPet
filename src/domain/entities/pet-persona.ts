/**
 * Defines the desktop pet's personality and behavioral rules.
 */
export interface PetPersona {
  readonly personaId: string;
  readonly name: string;
  readonly species: string;
  readonly traits: ReadonlyArray<string>;
  readonly toneRules: {
    readonly defaultTone: string;
    readonly contextOverrides: ReadonlyArray<{
      readonly context: string;
      readonly tone: string;
    }>;
  };
  readonly behaviorRules: ReadonlyArray<{
    readonly trigger: string;
    readonly action: string;
  }>;
}
