export class DominoTile {
  public sideA: number;
  public sideB: number;
  public x: number = 0;
  public y: number = 0;
  public width: number = 60;
  public height: number = 120;
  public isVertical: boolean = true;

  constructor(a: number, b: number) {
    this.sideA = a;
    this.sideB = b;
  }

  public hasValue(value: number): boolean {
    return this.sideA === value || this.sideB === value;
  }

  // رسم القطعة على Canvas
  public draw(ctx: CanvasRenderingContext2D, isHidden: boolean = false) {
    ctx.fillStyle = isHidden ? "#333" : "#fff";
    ctx.strokeStyle = "#000";
    ctx.lineWidth = 2;
    ctx.fillRect(this.x, this.y, this.width, this.height);
    ctx.strokeRect(this.x, this.y, this.width, this.height);

    if (!isHidden) {
      ctx.fillStyle = "#000";
      // رسم الخط الفاصل
      if (this.isVertical) {
        ctx.beginPath();
        ctx.moveTo(this.x, this.y + this.height / 2);
        ctx.lineTo(this.x + this.width, this.y + this.height / 2);
        ctx.stroke();
        this.drawDots(ctx, this.sideA, this.x + this.width / 2, this.y + this.height / 4);
        this.drawDots(ctx, this.sideB, this.x + this.width / 2, this.y + (this.height / 4) * 3);
      } else {
        // يمكن إضافة منطق القطع الأفقية لاحقاً
      }
    }
  }

  // دالة مساعدة لرسم النقاط
  private drawDots(ctx: CanvasRenderingContext2D, value: number, cx: number, cy: number) {
    const r = 4;
    const offset = 10;
    const positions: Record<number, [number, number][]> = {
      0: [], 1: [[0, 0]], 
      2: [[-offset, -offset], [offset, offset]], 
      3: [[-offset, -offset], [0, 0], [offset, offset]],
      4: [[-offset, -offset], [offset, -offset], [-offset, offset], [offset, offset]],
      5: [[-offset, -offset], [offset, -offset], [0, 0], [-offset, offset], [offset, offset]],
      6: [[-offset, -offset], [offset, -offset], [-offset, 0], [offset, 0], [-offset, offset], [offset, offset]]
    };
    
    positions[value].forEach(([dx, dy]) => {
      ctx.beginPath();
      ctx.arc(cx + dx, cy + dy, r, 0, Math.PI * 2);
      ctx.fill();
    });
  }
}