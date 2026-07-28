import { DominoTile } from './DominoTile';
import { BoardLayout } from './BoardLayout';
import { AIController } from './AIController';

export class GameEngine {
    public boneyard: DominoTile[] = [];
    public playerHand: DominoTile[] = [];
    public aiHand: DominoTile[] = [];
    public layout: BoardLayout;
    public ai: AIController;
    public isPlayerTurn: boolean = true;

    constructor() {
        this.layout = new BoardLayout();
        this.ai = new AIController();
        this.init();
    }

    public init() {
        this.boneyard = [];
        this.playerHand = [];
        this.aiHand = [];
        this.layout = new BoardLayout(); // إعادة تهيئة الطاولة
        this.isPlayerTurn = true;

        for (let i = 0; i <= 6; i++) {
            for (let j = i; j <= 6; j++) {
                this.boneyard.push(new DominoTile(i, j));
            }
        }
        this.shuffle(this.boneyard);

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

    public canPlayerPlay(): boolean {
        if (this.layout.renderTiles.length === 0) return true;
        for (const tile of this.playerHand) {
            if ((this.layout.leftEnd && tile.hasValue(this.layout.leftEnd.val)) || 
                (this.layout.rightEnd && tile.hasValue(this.layout.rightEnd.val))) return true;
        }
        return false;
    }

    public playerDraw(): boolean {
        if (this.boneyard.length > 0) {
            this.playerHand.push(this.boneyard.pop()!);
            return true;
        }
        return false;
    }

    public playTile(tile: DominoTile, side: 'left' | 'right'): boolean {
        return this.layout.addTile(tile, side);
    }

    public aiTurn(): boolean {
        // 1. ابحث عن قطعة
        let move = this.ai.getMove(this.layout.leftEnd, this.layout.rightEnd, this.aiHand);
        
        // 2. إذا لم تجد، اسحب من الكومة
        while (!move && this.boneyard.length > 0) {
            this.aiHand.push(this.boneyard.pop()!);
            move = this.ai.getMove(this.layout.leftEnd, this.layout.rightEnd, this.aiHand);
        }

        // 3. إذا وجدت قطعة، العبها
        if (move) {
            if (this.playTile(move.tile, move.side)) {
                const index = this.aiHand.indexOf(move.tile);
                this.aiHand.splice(index, 1);
                return true;
            }
        }
        return false; // تمرير الدور
    }
}