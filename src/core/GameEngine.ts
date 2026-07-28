import { DominoTile } from './DominoTile';

export type Dir = 'RIGHT' | 'LEFT' | 'DOWN' | 'UP';

export interface PlacedTile {
    x: number; y: number; w: number; h: number;
    isVerticalLine: boolean;
    inVal: number; outVal: number;
    dot1X: number; dot1Y: number; dot2X: number; dot2Y: number;
}

export interface EndPoint {
    val: number; x: number; y: number; dir: Dir;
}

export class GameEngine {
    public boneyard: DominoTile[] = [];
    public playerHand: DominoTile[] = [];
    public aiHand: DominoTile[] = [];
    public placedTiles: PlacedTile[] = [];
    public leftEnd: EndPoint | null = null;
    public rightEnd: EndPoint | null = null;
    public isPlayerTurn: boolean = true;

    constructor() { this.init(); }

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

    public canPlayerPlay(): boolean {
        if (this.placedTiles.length === 0) return true;
        for (const tile of this.playerHand) {
            if ((this.leftEnd && tile.hasValue(this.leftEnd.val)) || 
                (this.rightEnd && tile.hasValue(this.rightEnd.val))) return true;
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

    private getDims(d: Dir, isDouble: boolean): { w: number, h: number } {
        const L = 60, W = 30;
        if (d === 'RIGHT' || d === 'LEFT') {
            return { w: isDouble ? W : L, h: isDouble ? L : W };
        } else {
            return { w: isDouble ? L : W, h: isDouble ? W : L };
        }
    }

    public playTile(tile: DominoTile, side: 'left' | 'right'): boolean {
        const MAX_X = 720, MIN_X = 80, MAX_Y = 420, MIN_Y = 80;
        const L = 60, W = 30;

        // أول قطعة
        if (this.placedTiles.length === 0) {
            const isDouble = tile.sideA === tile.sideB;
            const dims = this.getDims('RIGHT', isDouble);
            const w = dims.w, h = dims.h;
            const x = 400 - w / 2;
            const y = 240 - h / 2;
            
            const pt = this.createPlacedTile(x, y, w, h, 'RIGHT', tile.sideA, tile.sideB);
            this.placedTiles.push(pt);
            this.leftEnd = { val: tile.sideA, x: x, y: y + h / 2, dir: 'LEFT' };
            this.rightEnd = { val: tile.sideB, x: x + w, y: y + h / 2, dir: 'RIGHT' };
            return true;
        }

        const end = side === 'left' ? this.leftEnd! : this.rightEnd!;
        let inVal, outVal;
        if (tile.sideA === end.val) { inVal = tile.sideA; outVal = tile.sideB; }
        else if (tile.sideB === end.val) { inVal = tile.sideB; outVal = tile.sideA; }
        else return false;

        const isDouble = (inVal === outVal);
        let dir = end.dir;
        let dims = this.getDims(dir, isDouble);
        let w = dims.w, h = dims.h;
        let x = 0, y = 0;

        // الموضع الافتراضي (استقامة الخط)
        if (dir === 'RIGHT') { x = end.x; y = end.y - h / 2; }
        else if (dir === 'LEFT') { x = end.x - w; y = end.y - h / 2; }
        else if (dir === 'DOWN') { x = end.x - w / 2; y = end.y; }
        else if (dir === 'UP') { x = end.x - w / 2; y = end.y - h; }

        // خوارزمية الانعطاف الديناميكية (Dynamic Corner Alignment)
        // نحصل على القطعة السابقة لمعرفة أبعادها الحقيقية (عادية أو مزدوجة)
        const prevTile = side === 'left' ? this.placedTiles[0] : this.placedTiles[this.placedTiles.length - 1];

        if (dir === 'RIGHT' && x + w > MAX_X) {
            dir = 'DOWN';
            dims = this.getDims(dir, isDouble); w = dims.w; h = dims.h;
            x = end.x - w; 
            y = end.y + prevTile.h / 2; // الإزاحة بناءً على ارتفاع القطعة السابقة
        } else if (dir === 'LEFT' && x < MIN_X) {
            dir = 'UP';
            dims = this.getDims(dir, isDouble); w = dims.w; h = dims.h;
            x = end.x; 
            y = end.y - h - prevTile.h / 2; 
        } else if (dir === 'DOWN' && y + h > MAX_Y) {
            dir = 'LEFT';
            dims = this.getDims(dir, isDouble); w = dims.w; h = dims.h;
            x = end.x - w - prevTile.w / 2; // الإزاحة بناءً على عرض القطعة السابقة
            y = end.y - h;
        } else if (dir === 'UP' && y < MIN_Y) {
            dir = 'RIGHT';
            dims = this.getDims(dir, isDouble); w = dims.w; h = dims.h;
            x = end.x + prevTile.w / 2; 
            y = end.y;
        }

        const pt = this.createPlacedTile(x, y, w, h, dir, inVal, outVal);
        this.placedTiles.push(pt);

        // تحديث الطرف الجديد للطاولة
        let newEndX = 0, newEndY = 0;
        if (dir === 'RIGHT') { newEndX = x + w; newEndY = y + h / 2; }
        else if (dir === 'LEFT') { newEndX = x; newEndY = y + h / 2; }
        else if (dir === 'DOWN') { newEndX = x + w / 2; newEndY = y + h; }
        else if (dir === 'UP') { newEndX = x + w / 2; newEndY = y; }

        const newEnd = { val: outVal, x: newEndX, y: newEndY, dir };
        if (side === 'left') this.leftEnd = newEnd; else this.rightEnd = newEnd;
        
        return true;
    }

    private createPlacedTile(x: number, y: number, w: number, h: number, dir: Dir, inVal: number, outVal: number): PlacedTile {
        let dot1X = 0, dot1Y = 0, dot2X = 0, dot2Y = 0;
        let isVerticalLine = false;

        if (w > h) { // قطعة أفقية
            isVerticalLine = true;
            dot1X = x + w/4; dot1Y = y + h/2;
            dot2X = x + 3*w/4; dot2Y = y + h/2;
        } else { // قطعة عمودية
            isVerticalLine = false;
            dot1X = x + w/2; dot1Y = y + h/4;
            dot2X = x + w/2; dot2Y = y + 3*h/4;
        }

        if (dir === 'LEFT' || dir === 'UP') {
            let tmpX = dot1X, tmpY = dot1Y;
            dot1X = dot2X; dot1Y = dot2Y;
            dot2X = tmpX; dot2Y = tmpY;
        }

        return { x, y, w, h, isVerticalLine, inVal, outVal, dot1X, dot1Y, dot2X, dot2Y };
    }

    public aiTurn(): boolean {
        for (let i = 0; i < this.aiHand.length; i++) {
            const tile = this.aiHand[i];
            if (this.rightEnd && tile.hasValue(this.rightEnd.val)) {
                if (this.playTile(tile, 'right')) { this.aiHand.splice(i, 1); return true; }
            }
            if (this.leftEnd && tile.hasValue(this.leftEnd.val)) {
                if (this.playTile(tile, 'left')) { this.aiHand.splice(i, 1); return true; }
            }
        }
        if (this.boneyard.length > 0) {
            this.aiHand.push(this.boneyard.pop()!);
            return this.aiTurn();
        }
        return false;
    }
}