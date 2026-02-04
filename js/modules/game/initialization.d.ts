export class GameInitializer {
  constructor(game: any);
  initialize(): Promise<void>;
  ensureProjectileAssetsPrecomputed(): void;
  startDocked(): void;
}
