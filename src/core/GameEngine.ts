import { DominoTile } from './DominoTile';

export type Dir = 'RIGHT' | 'LEFT' | 'DOWN' | 'UP';

export interface PlacedTile {
    inVal: number; outVal: number;
    x: number; y: number; w: number; h: number;
    inX: number; inY: number; outX: number; outY: number;
    isVerticalLine: boolean;
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

    public playTile(tile: DominoTile, side: 'left' | 'right'): boolean {
        const LONG = 60, SHORT = 30;
        
        // أول قطعة توضع في المنتصف
        if (this.placedTiles.length === 0) {
            const isDouble = tile.sideA === tile.sideB;
            const w = isDouble ? SHORT : LONG;
            const h = isDouble ? LONG : SHORT;
            const x = 400 - w / 2;
            const y = 250 - h / 2;
            
            let inX = 0, inY = 0, outX = 0, outY = 0, isVert = false;
            if (w > h) {
                isVert = true;
                inX = x + w/4; inY = y + h/2; outX = x + 3*w/4; outY = y + h/2;
            } else {
                isVert = false;
                inX = x + w/2; inY = y + h/4; outX = x + w/2; outY = y + 3*h/4;
            }

            this.placedTiles.push({ inVal: tile.sideA, outVal: tile.sideB, x, y, w, h, inX, inY, outX, outY, isVerticalLine: isVert });
            
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
        let w = 0, h = 0, x = 0, y = 0, newDir = end.dir;

        // حساب الحدود وإحداثيات القطعة الجديدة مع خوارزمية الالتفاف الصارمة
        if (end.dir === 'RIGHT') {
            w = isDouble ? SHORT : LONG; h = isDouble ? LONG : SHORT;
            x = end.x; y = end.y - h / 2;
            if (x + w > 750) { // انعطاف للأسفل
                w = isDouble ? LONG : SHORT; h = isDouble ? SHORT : LONG;
                newDir = 'DOWN';
                x = end.x - w / 2; y = end.y;
            }
        } else if (end.dir === 'LEFT') {
            w = isDouble ? SHORT : LONG; h = isDouble ? LONG : SHORT;
            x = end.x - w; y = end.y - h / 2;
            if (x < 50) { // انعطاف للأعلى
                w = isDouble ? LONG : SHORT; h = isDouble ? SHORT : LONG;
                newDir = 'UP';
                x = end.x - w / 2; y = end.y - h;
            }
        } else if (end.dir === 'DOWN') {
            w = isDouble ? LONG : SHORT; h = isDouble ? SHORT : LONG;
            x = end.x - w / 2; y = end.y;
            if (y + h > 450) { // انعطاف لليسار
                w = isDouble ? SHORT : LONG; h = isDouble ? LONG : SHORT;
                newDir = 'LEFT';
                x = end.x - w; y = end.y - h / 2;
            }
        } else if (end.dir === 'UP') {
            w = isDouble ? LONG : SHORT; h = isDouble ? SHORT : LONG;
            x = end.x - w / 2; y = end.y - h;
            if (y < 50) { // انعطاف لليمين
                w = isDouble ? SHORT : LONG; h = isDouble ? LONG : SHORT;
                newDir = 'RIGHT';
                x = end.x; y = end.y - h / 2;
            }
        }

        // حساب مراكز النقاط بدقة رياضية لمنع التداخل
        let inX = 0, inY = 0, outX = 0, outY = 0, isVerticalLine = false;

        if (newDir === 'RIGHT' || newDir === 'LEFT') {
            if (w > h) { // قطعة أفقية تتحرك أفقياً
                isVerticalLine = true;
                inX = x + w/4; inY = y + h/2; outX = x + 3*w/4; outY = y + h/2;
            } else { // قطعة مزدوجة عمودية تتحرك أفقياً
                isVerticalLine = false;
                inX = x + w/2; inY = y + h/4; outX = x + w/2; outY = y + 3*h/4;
            }
        } else { // UP أو DOWN
            if (h > w) { // قطعة عمودية تتحرك عمودياً
                isVerticalLine = false;
                inX = x + w/2; inY = y + h/4; outX = x + w/2; outY = y + 3*h/4;
            } else { // قطعة مزدوجة أفقية تتحرك عمودياً
                isVerticalLine = true;
                inX = x + w/4; inY = y + h/2; outX = x + 3*w/4; outY = y + h/2;
            }
        }

        // تبديل النقاط إذا كان الاتجاه معاكساً (يسار أو أعلى)
        if (newDir === 'LEFT' || newDir === 'UP') {
            let tmpX = inX, tmpY = inY; inX = outX; inY = outY; outX = tmpX; outY = tmpY;
        }

        this.placedTiles.push({ inVal, outVal, x, y, w, h, inX, inY, outX, outY, isVerticalLine });

        // تحديث الطرف الجديد للطاولة
        let newEndX = 0, newEndY = 0;
        if (newDir === 'RIGHT') { newEndX = x + w; newEndY = y + h / 2; }
        else if (newDir === 'LEFT') { newEndX = x; newEndY = y + h / 2; }
        else if (newDir === 'DOWN') { newEndX = x + w / 2; newEndY = y + h; }
        else if (newDir === 'UP') { newEndX = x + w / 2; newEndY = y; }

        const newEnd = { val: outVal, x: newEndX, y: newEndY, dir: newDir };
        if (side === 'left') this.leftEnd = newEnd; else this.rightEnd = newEnd;
        
        return true;
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