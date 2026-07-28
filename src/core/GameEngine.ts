import { DominoTile } from './DominoTile';

export type Direction = 'RIGHT' | 'LEFT' | 'DOWN' | 'UP';

export interface BoardEnd {
    value: number;
    x: number;
    y: number;
    dir: Direction;
}

export interface PlacedTile {
    sideA: number;
    sideB: number;
    x: number;
    y: number;
    isVertical: boolean;
}

export class GameEngine {
    public boneyard: DominoTile[] = [];
    public playerHand: DominoTile[] = [];
    public aiHand: DominoTile[] = [];
    public placedTiles: PlacedTile[] = [];
    public leftEnd: BoardEnd | null = null;
    public rightEnd: BoardEnd | null = null;
    public isPlayerTurn: boolean = true;

    constructor() {
        this.init();
    }

    public init() {
        this.boneyard = [];
        this.playerHand = [];
        this.aiHand = [];
        this.placedTiles = [];
        this.leftEnd = null;
        this.rightEnd = null;
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

    public playTile(tile: DominoTile, side: 'left' | 'right'): boolean {
        // أول قطعة توضع في المنتصف
        if (this.placedTiles.length === 0) {
            const startX = 360, startY = 280; 
            this.placedTiles.push({ sideA: tile.sideA, sideB: tile.sideB, x: startX, y: startY, isVertical: false });
            this.leftEnd = { value: tile.sideA, x: startX, y: 300, dir: 'LEFT' };
            this.rightEnd = { value: tile.sideB, x: startX + 80, y: 300, dir: 'RIGHT' };
            return true;
        }

        const end = side === 'left' ? this.leftEnd : this.rightEnd;
        if (!end) return false;

        // منطق القلب (أي رقم سيكون للداخل وأي رقم للخارج)
        let inVal: number = -1;
        let outVal: number = -1;
        
        if (tile.sideA === end.value) { inVal = tile.sideA; outVal = tile.sideB; }
        else if (tile.sideB === end.value) { inVal = tile.sideB; outVal = tile.sideA; }
        else return false;

        const W = 80, H = 40; // أبعاد القطعة الأفقية
        let px: number = 0;
        let py: number = 0;
        let isVertical = false;
        let newDir = end.dir;

        // خوارزمية الالتفاف (Snaking)
        if (end.dir === 'RIGHT') {
            px = end.x; py = end.y - H / 2;
            if (px + W > 760) { isVertical = true; px = end.x - H / 2; py = end.y; newDir = 'DOWN'; } // انعطاف للأسفل
        } else if (end.dir === 'LEFT') {
            px = end.x - W; py = end.y - H / 2;
            if (px < 40) { isVertical = true; px = end.x - H / 2; py = end.y - W; newDir = 'UP'; } // انعطاف للأعلى
        } else if (end.dir === 'DOWN') {
            isVertical = true; px = end.x - H / 2; py = end.y;
            if (py + W > 560) { isVertical = false; px = end.x - W; py = end.y - H / 2; newDir = 'LEFT'; } // انعطاف لليسار
        } else if (end.dir === 'UP') {
            isVertical = true; px = end.x - H / 2; py = end.y - W;
            if (py < 40) { isVertical = false; px = end.x; py = end.y - H / 2; newDir = 'RIGHT'; } // انعطاف لليمين
        }

        this.placedTiles.push({ sideA: inVal, sideB: outVal, x: px, y: py, isVertical });

        // تحديث الإحداثيات للقطعة القادمة
        let newEnd: BoardEnd;
        if (newDir === 'RIGHT') newEnd = { value: outVal, x: px + (isVertical ? H : W), y: py + H/2, dir: 'RIGHT' };
        else if (newDir === 'LEFT') newEnd = { value: outVal, x: px, y: py + H/2, dir: 'LEFT' };
        else if (newDir === 'DOWN') newEnd = { value: outVal, x: px + H/2, y: py + (isVertical ? W : H), dir: 'DOWN' };
        else newEnd = { value: outVal, x: px + H/2, y: py, dir: 'UP' };

        if (side === 'left') this.leftEnd = newEnd; else this.rightEnd = newEnd;
        return true;
    }

    public aiTurn(): boolean {
        for (let i = 0; i < this.aiHand.length; i++) {
            const tile = this.aiHand[i];
            if (this.rightEnd && tile.hasValue(this.rightEnd.value)) {
                if (this.playTile(tile, 'right')) { this.aiHand.splice(i, 1); return true; }
            }
            if (this.leftEnd && tile.hasValue(this.leftEnd.value)) {
                if (this.playTile(tile, 'left')) { this.aiHand.splice(i, 1); return true; }
            }
        }
        if (this.boneyard.length > 0) {
            this.aiHand.push(this.boneyard.pop()!);
            return this.aiTurn();
        }
        return false;
    }
    // دالة للتحقق إذا كان اللاعب يملك قطعة صالحة للعب
    public canPlayerPlay(): boolean {
        if (this.placedTiles.length === 0) return true;
        for (const tile of this.playerHand) {
            if ((this.leftEnd && tile.hasValue(this.leftEnd.value)) || 
                (this.rightEnd && tile.hasValue(this.rightEnd.value))) {
                return true;
            }
        }
        return false;
    }

    // دالة لسحب قطعة من الكومة للاعب
    public playerDraw(): boolean {
        if (this.boneyard.length > 0) {
            this.playerHand.push(this.boneyard.pop()!);
            return true;
        }
        return false;
    }
}