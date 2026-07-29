import { GameEngine } from './core/GameEngine';
import { DominoTile } from './core/DominoTile';

const canvas = document.getElementById('gameCanvas') as HTMLCanvasElement;
const ctx = canvas.getContext('2d')!;
const info = document.getElementById('info')!;

const engine = new GameEngine();

let isDragging = false;
let draggingTile: DominoTile | null = null;
let draggingIndex: number = -1;
let mouseX = 0, mouseY = 0;

const drawBtnX = 650, drawBtnY = 1620, drawBtnW = 180, drawBtnH = 60;

// دالة مساعدة لرسم مستطيل بزوايا دائرية
function roundRect(ctx: CanvasRenderingContext2D, x: number, y: number, w: number, h: number, r: number) {
    ctx.beginPath();
    ctx.moveTo(x + r, y);
    ctx.lineTo(x + w - r, y);
    ctx.quadraticCurveTo(x + w, y, x + w, y + r);
    ctx.lineTo(x + w, y + h - r);
    ctx.quadraticCurveTo(x + w, y + h, x + w - r, y + h);
    ctx.lineTo(x + r, y + h);
    ctx.quadraticCurveTo(x, y + h, x, y + h - r);
    ctx.lineTo(x, y + r);
    ctx.quadraticCurveTo(x, y, x + r, y);
    ctx.closePath();
}

function drawDots(ctx: CanvasRenderingContext2D, value: number, cx: number, cy: number, scale: number = 1) {
    const r = 5 * scale;
    const off = 11 * scale;
    const positions: Record<number, [number, number][]> = {
        0: [], 1: [[0, 0]], 
        2: [[-off, -off], [off, off]], 
        3: [[-off, -off], [0, 0], [off, off]],
        4: [[-off, -off], [off, -off], [-off, off], [off, off]],
        5: [[-off, -off], [off, -off], [0, 0], [-off, off], [off, off]],
        6: [[-off, -off], [off, -off], [-off, 0], [off, 0], [-off, off], [off, off]]
    };
    
    // تدرج للنقطة لتبدو كأنها محفورة
    positions[value].forEach(([dx, dy]) => {
        const grad = ctx.createRadialGradient(cx + dx - r/3, cy + dy - r/3, r/4, cx + dx, cy + dy, r);
        grad.addColorStop(0, "#444");
        grad.addColorStop(1, "#000");
        ctx.fillStyle = grad;
        ctx.beginPath();
        ctx.arc(cx + dx, cy + dy, r, 0, Math.PI * 2);
        ctx.fill();
    });
}

// دالة رسم الحجر الاحترافي (تستخدم للطاولة واليد)
function drawProTile(x: number, y: number, w: number, h: number, isVertLine: boolean, val1: number, val2: number, dot1X: number, dot1Y: number, dot2X: number, dot2Y: number, scale: number) {
    ctx.save();
    
    // 1. الظل
    ctx.shadowColor = "rgba(0,0,0,0.4)";
    ctx.shadowBlur = 8;
    ctx.shadowOffsetY = 4;

    // 2. الجسم بتدرج لوني (عاجي)
    const grad = ctx.createLinearGradient(x, y, x, y + h);
    grad.addColorStop(0, "#ffffff");
    grad.addColorStop(0.5, "#f8f9fa");
    grad.addColorStop(1, "#e9ecef");
    ctx.fillStyle = grad;
    roundRect(ctx, x, y, w, h, 6);
    ctx.fill();
    
    // إلغاء الظل لباقي التفاصيل
    ctx.shadowColor = "transparent";

    // 3. الإطار الخارجي
    ctx.strokeStyle = "#ced4da";
    ctx.lineWidth = 1.5;
    ctx.stroke();

    // 4. الخط الفاصل الغائر
    ctx.beginPath();
    if (isVertLine) {
        ctx.moveTo(x + w / 2, y + 4);
        ctx.lineTo(x + w / 2, y + h - 4);
    } else {
        ctx.moveTo(x + 4, y + h / 2);
        ctx.lineTo(x + w - 4, y + h / 2);
    }
    ctx.strokeStyle = "#adb5bd";
    ctx.lineWidth = 2;
    ctx.stroke();

    // 5. النقاط
    drawDots(ctx, val1, dot1X, dot1Y, scale);
    drawDots(ctx, val2, dot2X, dot2Y, scale);
    
    ctx.restore();
}

function gameLoop() {
    // 1. رسم الخلفيات
    ctx.fillStyle = "#0f1f15"; // غامق جداً للخارج
    ctx.fillRect(0, 0, 850, 1700);
    
    // ملعب خشبي فاخر
    const boardGrad = ctx.createLinearGradient(0, 200, 0, 1450);
    boardGrad.addColorStop(0, "#2d6a4f");
    boardGrad.addColorStop(1, "#1b4332");
    ctx.fillStyle = boardGrad;
    roundRect(ctx, 50, 200, 750, 1250, 20);
    ctx.fill();
    ctx.strokeStyle = "#081c15";
    ctx.lineWidth = 8;
    ctx.stroke();

    // 2. رسم قطع الخصم (ظهر احترافي أحمر)
    const aiCount = engine.aiHand.length;
    const aW = 60, aH = 120, aS = 70;
    let aiX = (850 - (aiCount * aS)) / 2;
    for (let i = 0; i < aiCount; i++) {
        ctx.save();
        ctx.shadowColor = "rgba(0,0,0,0.5)";
        ctx.shadowBlur = 10;
        ctx.shadowOffsetY = 5;
        
        const grad = ctx.createLinearGradient(aiX + i * aS, 50, aiX + i * aS, 50 + aH);
        grad.addColorStop(0, "#e63946");
        grad.addColorStop(1, "#9d0208");
        ctx.fillStyle = grad;
        roundRect(ctx, aiX + i * aS, 50, aW, aH, 8);
        ctx.fill();
        
        ctx.shadowColor = "transparent";
        ctx.strokeStyle = "#6a040f";
        ctx.lineWidth = 2;
        ctx.stroke();
        
        // زخرفة الظهر
        ctx.strokeStyle = "rgba(255,255,255,0.3)";
        ctx.lineWidth = 1;
        roundRect(ctx, aiX + i * aS + 6, 56, aW - 12, aH - 12, 4);
        ctx.stroke();
        ctx.restore();
    }

    // 3. رسم القطع على الطاولة
    engine.layout.renderTiles.forEach((t, index) => {
        let highlight = false;
        if (isDragging && draggingTile) {
            const isFirst = index === 0;
            const isLast = index === engine.layout.renderTiles.length - 1;
            if (isFirst && engine.layout.leftEnd && draggingTile.hasValue(engine.layout.leftEnd.val)) highlight = true;
            if (isLast && engine.layout.rightEnd && draggingTile.hasValue(engine.layout.rightEnd.val)) highlight = true;
        }
        
        if (highlight) {
            ctx.save();
            ctx.shadowColor = "rgba(0, 255, 100, 0.8)";
            ctx.shadowBlur = 20;
            ctx.fillStyle = "rgba(0, 255, 100, 0.2)";
            roundRect(ctx, t.x - 8, t.y - 8, t.w + 16, t.h + 16, 10);
            ctx.fill();
            ctx.restore();
        }
        
        drawProTile(t.x, t.y, t.w, t.h, t.isVerticalLine, t.inVal, t.outVal, t.dot1X, t.dot1Y, t.dot2X, t.dot2Y, 1.2);
    });

    // 4. رسم إحصائيات أعلى الملعب
    ctx.fillStyle = "#e0e0e0";
    ctx.font = "bold 20px sans-serif";
    ctx.textAlign = "left";
    ctx.fillText(`الخصم: ${engine.aiHand.length}  |  أنت: ${engine.playerHand.length}  |  الكومة: ${engine.boneyard.length}`, 70, 180);

    // 5. رسم قطع اللاعب (في الأسفل)
    const pCount = engine.playerHand.length;
    const pW = 65, pH = 130, pS = 75;
    let pX = (850 - (pCount * pS)) / 2;
    
    engine.playerHand.forEach((tile, index) => {
        if (index === draggingIndex) return;

        const x = pX + index * pS;
        const y = 1480;
        
        // رسم القطعة (عمودية)
        ctx.save();
        ctx.shadowColor = "rgba(0,0,0,0.5)";
        ctx.shadowBlur = 12;
        ctx.shadowOffsetY = 6;
        const grad = ctx.createLinearGradient(x, y, x, y + pH);
        grad.addColorStop(0, "#ffffff");
        grad.addColorStop(1, "#e9ecef");
        ctx.fillStyle = grad;
        roundRect(ctx, x, y, pW, pH, 8);
        ctx.fill();
        ctx.shadowColor = "transparent";
        ctx.strokeStyle = "#ced4da";
        ctx.lineWidth = 1.5;
        ctx.stroke();
        
        ctx.beginPath();
        ctx.moveTo(x + 4, y + pH / 2);
        ctx.lineTo(x + pW - 4, y + pH / 2);
        ctx.strokeStyle = "#adb5bd";
        ctx.lineWidth = 2;
        ctx.stroke();
        ctx.restore();
        
        drawDots(ctx, tile.sideA, x + pW/2, y + pH/4, 1.4);
        drawDots(ctx, tile.sideB, x + pW/2, y + (pH/4)*3, 1.4);
        
        (tile as any).bounds = { x, y, w: pW, h: pH };
    });

    // 6. رسم القطعة المسحوبة
    if (isDragging && draggingTile) {
        const w = 75, h = 150;
        ctx.save();
        ctx.shadowColor = "rgba(0,0,0,0.6)";
        ctx.shadowBlur = 25;
        ctx.shadowOffsetY = 10;
        
        const grad = ctx.createLinearGradient(mouseX - w/2, mouseY - h/2, mouseX - w/2, mouseY + h/2);
        grad.addColorStop(0, "#ffffff");
        grad.addColorStop(1, "#dee2e6");
        ctx.fillStyle = grad;
        roundRect(ctx, mouseX - w/2, mouseY - h/2, w, h, 10);
        ctx.fill();
        
        ctx.shadowColor = "transparent";
        ctx.strokeStyle = "#ced4da";
        ctx.lineWidth = 2;
        ctx.stroke();
        
        ctx.beginPath();
        ctx.moveTo(mouseX - w/2 + 5, mouseY);
        ctx.lineTo(mouseX + w/2 - 5, mouseY);
        ctx.strokeStyle = "#adb5bd";
        ctx.lineWidth = 2.5;
        ctx.stroke();
        ctx.restore();
        
        drawDots(ctx, draggingTile.sideA, mouseX, mouseY - h/4, 1.6);
        drawDots(ctx, draggingTile.sideB, mouseX, mouseY + h/4, 1.6);
    }

    // 7. منطق زر السحب
    let msg = engine.isPlayerTurn ? "اسحب قطعة وأفلتها قرب الطرف المضيء" : "الذكاء الاصطناعي يفكر...";
    
    const needsToDrawOrPass = engine.isPlayerTurn && !engine.canPlayerPlay();
    if (needsToDrawOrPass) {
        if (engine.boneyard.length > 0) msg = "لا يوجد لديك قطعة صالحة! اضغط على زر (سحب قطعة).";
        else msg = "الكومة فارغة! اضغط على زر (تمرير الدور).";
        
        ctx.save();
        ctx.shadowColor = "rgba(0,0,0,0.5)";
        ctx.shadowBlur = 10;
        ctx.fillStyle = "#d9534f";
        roundRect(ctx, drawBtnX, drawBtnY, drawBtnW, drawBtnH, 15);
        ctx.fill();
        ctx.shadowColor = "transparent";
        ctx.strokeStyle = "#fff";
        ctx.lineWidth = 2;
        ctx.stroke();
        ctx.fillStyle = "white";
        ctx.font = "bold 24px sans-serif";
        ctx.textAlign = "center";
        ctx.fillText(engine.boneyard.length > 0 ? "سحب قطعة" : "تمرير الدور", drawBtnX + drawBtnW / 2, drawBtnY + 38);
        ctx.restore();
    }
    info.innerText = msg;

    requestAnimationFrame(gameLoop);
}

// --- أحداث الماوس واللمس ---

function getCoords(e: MouseEvent | TouchEvent): {x: number, y: number} {
    const rect = canvas.getBoundingClientRect();
    const scaleX = canvas.width / rect.width;
    const scaleY = canvas.height / rect.height;
    if (e instanceof TouchEvent) {
        return { x: (e.touches[0].clientX - rect.left) * scaleX, y: (e.touches[0].clientY - rect.top) * scaleY };
    } else {
        return { x: (e.clientX - rect.left) * scaleX, y: (e.clientY - rect.top) * scaleY };
    }
}

function handleStart(e: MouseEvent | TouchEvent) {
    if (!engine.isPlayerTurn || isDragging) return;
    const {x, y} = getCoords(e);
    mouseX = x; mouseY = y;

    if (mouseX >= drawBtnX && mouseX <= drawBtnX + drawBtnW && mouseY >= drawBtnY && mouseY <= drawBtnY + drawBtnH) {
        if (!engine.canPlayerPlay()) {
            if (engine.playerDraw()) {} else { engine.isPlayerTurn = false; endTurn(); }
        }
        return;
    }

    for (let i = 0; i < engine.playerHand.length; i++) {
        const tile = engine.playerHand[i];
        const bounds = (tile as any).bounds;
        if (bounds && mouseX >= bounds.x && mouseX <= bounds.x + bounds.w && mouseY >= bounds.y && mouseY <= bounds.y + bounds.h) {
            isDragging = true;
            draggingTile = tile;
            draggingIndex = i;
            break;
        }
    }
}

function handleMove(e: MouseEvent | TouchEvent) {
    if (!isDragging) return;
    e.preventDefault();
    const {x, y} = getCoords(e);
    mouseX = x; mouseY = y;
}

function handleEnd(e: MouseEvent | TouchEvent) {
    if (!isDragging || !draggingTile) return;

    let played = false;
    const rEnd = engine.layout.rightEnd;
    const lEnd = engine.layout.leftEnd;
    let tryRightFirst = true;

    if (rEnd && lEnd) {
        const distRight = Math.hypot(mouseX - rEnd.x, mouseY - rEnd.y);
        const distLeft = Math.hypot(mouseX - lEnd.x, mouseY - lEnd.y);
        tryRightFirst = distRight < distLeft;
    }

    if (tryRightFirst) {
        played = engine.playTile(draggingTile, 'right');
        if (!played) played = engine.playTile(draggingTile, 'left');
    } else {
        played = engine.playTile(draggingTile, 'left');
        if (!played) played = engine.playTile(draggingTile, 'right');
    }

    if (played) {
        engine.playerHand.splice(draggingIndex, 1);
        endTurn();
    }

    isDragging = false;
    draggingTile = null;
    draggingIndex = -1;
}

canvas.addEventListener('mousedown', handleStart);
canvas.addEventListener('touchstart', handleStart);

window.addEventListener('mousemove', handleMove);
window.addEventListener('mouseup', handleEnd);
window.addEventListener('touchmove', handleMove, { passive: false });
window.addEventListener('touchend', handleEnd);

function endTurn() {
    if (engine.playerHand.length === 0) { alert("لقد فزت!"); return; }
    engine.isPlayerTurn = false;
    setTimeout(() => {
        if (engine.aiHand.length === 0) { alert("فاز الذكاء الاصطناعي!"); return; }
        engine.aiTurn();
        engine.isPlayerTurn = true;
    }, 1500);
}

gameLoop();