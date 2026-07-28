export class DominoTile {
    public readonly sideA: number;
    public readonly sideB: number;

    constructor(a: number, b: number) {
        this.sideA = a;
        this.sideB = b;
    }

    public isDouble(): boolean { return this.sideA === this.sideB; }
    
    public hasValue(val: number): boolean {
        return this.sideA === val || this.sideB === val;
    }
    
    public getOtherSide(val: number): number | null {
        if (this.sideA === val) return this.sideB;
        if (this.sideB === val) return this.sideA;
        return null;
    }
}