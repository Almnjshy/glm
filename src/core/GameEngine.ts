import { DominoTile } from './DominoTile';

export class GameEngine {
  public boneyard: DominoTile[] = [];
  public playerHand: DominoTile[] = [];
  public aiHand: DominoTile[] = [];
  public board: DominoTile[] = [];
  public leftEnd: number = -1;
  public rightEnd: number = -1;
  public isPlayerTurn: boolean = true;

  constructor() {
    this.init();
  }

  public init() {
    this.boneyard = [];
    this.playerHand = [];
    this.aiHand = [];
    this.board = [];
    this.leftEnd = -1;
    this.rightEnd = -1;

    for (let i = 0; i <= 6; i++) {
      for (let j = i; j <= 6; j++) {
        this.boneyard.push(new DominoTile(i, j));
      }
    }
    this.shuffle(this.boneyard);

    // توزيع 7 قطع لكل لاعب
    for (let i = 0; i < 7; i++) {
      this.playerHand.push(this.boneyard.pop()!);
      this.aiHand.push(this.boneyard.pop()!);
    }
  }

  private shuffle(array: DominoTile[]) {
    for (let i = array.length - 1; i > 0; i--) {
      const j = Math.floor(Math.random() * (i + 1));
      [array[i], array[j]] = [array[j], array[i]];
    }
  }

  // لعب اللاعب لقطعة
  public playTile(tile: DominoTile, side: 'left' | 'right'): boolean {
    if (this.board.length === 0) {
      this.board.push(tile);
      this.leftEnd = tile.sideA;
      this.rightEnd = tile.sideB;
      return true;
    }

    if (side === 'right' && tile.hasValue(this.rightEnd)) {
      if (tile.sideA === this.rightEnd) this.rightEnd = tile.sideB;
      else this.rightEnd = tile.sideA;
      this.board.push(tile);
      return true;
    }

    if (side === 'left' && tile.hasValue(this.leftEnd)) {
      if (tile.sideA === this.leftEnd) this.leftEnd = tile.sideB;
      else this.leftEnd = tile.sideA;
      this.board.unshift(tile);
      return true;
    }

    return false;
  }

  // دور الذكاء الاصطناعي
  public aiTurn(): boolean {
    // يبحث عن قطعة تناسب اليمين أو اليسار
    for (let i = 0; i < this.aiHand.length; i++) {
      const tile = this.aiHand[i];
      if (tile.hasValue(this.rightEnd)) {
        this.playTile(tile, 'right');
        this.aiHand.splice(i, 1);
        return true;
      }
      if (tile.hasValue(this.leftEnd)) {
        this.playTile(tile, 'left');
        this.aiHand.splice(i, 1);
        return true;
      }
    }
    
    // إذا لم يجد، اسحب من الكومة
    if (this.boneyard.length > 0) {
      this.aiHand.push(this.boneyard.pop()!);
      return this.aiTurn(); // حاول مرة أخرى
    }

    return false; // تمرير الدور
  }
}