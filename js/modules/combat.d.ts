export class Combat {
  playerEntity?: any;
  constructor(scene: any, spaceship: any);
  update(deltaTime: number): void;
  updatePlayerReference?(): void;
  createPlayerReferenceEntity?(): Promise<any> | any;
}
