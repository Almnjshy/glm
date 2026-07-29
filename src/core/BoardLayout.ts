import { DominoTile } from './DominoTile';

export type Dir = 'RIGHT' | 'LEFT' | 'DOWN' | 'UP';

export interface RenderTile {
    tile: DominoTile;
    x: number; y: number; w: number; h: number;
    isVerticalLine: boolean;
    dot1X: number; dot1Y: number; dot2X: number; dot2Y: number;
    inVal: number; outVal: number;
}

export interface EndPoint {
    val: number; x: number; y: number; dir: Dir;
    parentH: number; parentW: number;
}

export class BoardLayout {
    public renderTiles: RenderTile[] = [];
    public leftEnd: EndPoint | null = null;
    public rightEnd: EndPoint | null = null;

    private getDims(d: Dir, isDouble: boolean): { w: number, h: number } {
        const L = 90, W = 45;
        if (d === 'RIGHT' || d === 'LEFT') {
            return { w: isDouble ? W : L, h: isDouble ? L : W };
        } else {
            return { w: isDouble ? L : W, h: isDouble ? W : L };
        }
    }

    public addTile(tile: DominoTile, side: 'left' | 'right'): boolean {
        // حدود الملعب المستطيل (طولي)
        const MAX_X = 650, MIN_X = 100, MAX_Y = 950, MIN_Y = 200;

        if (this.renderTiles.length === 0) {
            const isDouble = tile.isDouble();
            const dims = this.getDims('RIGHT', isDouble);
            const w = dims.w, h = dims.h;
            const x = 375 - w / 2; // منتصف العرض (750/2)
            const y = 550 - h / 2; // منتصف الارتفاع (1100/2)
            this.pushRenderTile(tile, x, y, w, h, 'RIGHT', tile.sideA, tile.sideB);
            this.leftEnd = { val: tile.sideA, x: x, y: y + h / 2, dir: 'LEFT', parentH: h, parentW: w };
            this.rightEnd = { val: tile.sideB, x: x + w, y: y + h / 2, dir: 'RIGHT', parentH: h, parentW: w };
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

        if (dir === 'RIGHT') { x = end.x; y = end.y - h / 2; }
        else if (dir === 'LEFT') { x = end.x - w; y = end.y - h / 2; }
        else if (dir === 'DOWN') { x = end.x - w / 2; y = end.y; }
        else if (dir === 'UP') { x = end.x - w / 2; y = end.y - h; }

        // خوارزمية الزاوية النظيفة
        if (dir === 'RIGHT' && x + w > MAX_X) {
            dir = 'DOWN';
            dims = this.getDims(dir, isDouble); w = dims.w; h = dims.h;
            x = end.x - w;             
            y = end.y + end.parentH / 2; 
        } else if (dir === 'LEFT' && x < MIN_X) {
            dir = 'UP';
            dims = this.getDims(dir, isDouble); w = dims.w; h = dims.h;
            x = end.x;                  
            y = end.y - end.parentH / 2 - h; 
        } else if (dir === 'DOWN' && y + h > MAX_Y) {
            dir = 'LEFT';
            dims = this.getDims(dir, isDouble); w = dims.w; h = dims.h;
            x = end.x - w - end.parentW / 2; 
            y = end.y - h;                   
        } else if (dir === 'UP' && y < MIN_Y) {
            dir = 'RIGHT';
            dims = this.getDims(dir, isDouble); w = dims.w; h = dims.h;
            x = end.x + end.parentW / 2;     
            y = end.y;                       
        }

        this.pushRenderTile(tile, x, y, w, h, dir, inVal, outVal);

        let newEndX = 0, newEndY = 0;
        if (dir === 'RIGHT') { newEndX = x + w; newEndY = y + h / 2; }
        else if (dir === 'LEFT') { newEndX = x; newEndY = y + h / 2; }
        else if (dir === 'DOWN') { newEndX = x + w / 2; newEndY = y + h; }
        else if (dir === 'UP') { newEndX = x + w / 2; newEndY = y; }

        const newEnd = { val: outVal, x: newEndX, y: newEndY, dir, parentH: h, parentW: w };
        if (side === 'left') this.leftEnd = newEnd; else this.rightEnd = newEnd;
        return true;
    }

    private pushRenderTile(tile: DominoTile, x: number, y: number, w: number, h: number, dir: Dir, inVal: number, outVal: number) {
        let dot1X = 0, dot1Y = 0, dot2X = 0, dot2Y = 0;
        let isVerticalLine = false;

        if (w > h) { 
            isVerticalLine = true;
            dot1X = x + w/4; dot1Y = y + h/2;   
            dot2X = x + 3*w/4; dot2Y = y + h/2; 
        } else { 
            isVerticalLine = false;
            dot1X = x + w/2; dot1Y = y + h/4;   
            dot2X = x + w/2; dot2Y = y + 3*h/4; 
        }

        if (dir === 'LEFT' || dir === 'UP') {
            let tmpX = dot1X, tmpY = dot1Y;
            dot1X = dot2X; dot1Y = dot2Y;
            dot2X = tmpX; dot2Y = tmpY;
        }

        this.renderTiles.push({ tile, x, y, w, h, isVerticalLine, inVal, outVal, dot1X, dot1Y, dot2X, dot2Y });
    }
}