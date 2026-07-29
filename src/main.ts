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

// زر السحب في الزاوية اليمنى السفلية
const drawBtnX = 620, drawBtnY = 730, drawBtnW = 160, drawBtnH = 50;

function drawDots(ctx: CanvasRenderingContext2D, value: number, cx: number, cy: number, scale: number = 1) {
    const r = 4 * scale;  // تكبير النقاط
    const off = 10 * scale;
    const positions: Record<number, [number, number][]> = {
        0: [], 1: [[0, 0]], 
        2: [[-off, -off], [off, off]], 
        3: [[-off, -off], [0, 0], [off, off]],
        4: [[-off, -off], [off, -off], [-off, off], [off, off]],
        5: [[-off, -off], [off, -off], [0, 0], [-off, off], [off, off]],
        6: [[-off, -off], [off, -off], [-off, 0], [off, 0], [-off, off], [off, off]]
    };
    ctx.fillStyle = "#000";
    positions[value].forEach(([dx, dy]) => {
        ctx.beginPath();
        ctx.arc(cx + dx, cy + dy, r, 0, Math.PI * 2);
        ctx.fill();
    });
}

function gameLoop() {
    // 1. رسم الخلفيات (غامق للخارج، فاتح للملعب - المربع الأحمر)
    ctx.fillStyle = "#1a472a"; // غامق
    ctx.fillRect(0, 0, 800, 800);
    
    ctx.fillStyle = "#2d6a4f"; // فاتح (الملعب)
    ctx.fillRect(120, 120, 560, 560); 

    // 2. رسم قطع الخصم (في الأعلى، المستطيل الأبيض العلوي)
    const aiCount = engine.aiHand.length;
    const aW = 50, aH = 100, aS = 60;
    let aiX = (800 - (aiCount * aS)) / 2;
    for (let i = 0; i < aiCount; i++) {
        ctx.fillStyle = "#34495e"; 
        ctx.strokeStyle = "#2c3e50";
        ctx.lineWidth = 2;
        ctx.fillRect(aiX + i * aS, 20, aW, aH);
        ctx.strokeRect(aiX + i * aS, 20, aW, aH);
        
        ctx.fillStyle = "#7f8c8d";
        ctx.beginPath();
        ctx.arc(aiX + i * aS + aW/2, 20 + aH/2, 8, 0, Math.PI * 2);
        ctx.fill();
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
            ctx.fillStyle = "rgba(0, 255, 0, 0.5)";
            ctx.fillRect(t.x - 6, t.y - 6, t.w + 12, t.h + 12);
        }
        
        ctx.fillStyle = "#fff";
        ctx.strokeStyle = "#000";
        ctx.lineWidth = 2;
        ctx.fillRect(t.x, t.y, t.w, t.h);
        ctx.strokeRect(t.x, t.y, t.w, t.h);

        ctx.beginPath();
        if (t.isVerticalLine) {
            ctx.moveTo(t.x + t.w / 2, t.y);
            ctx.lineTo(t.x + t.w / 2, t.y + t.h);
        } else {
            ctx.moveTo(t.x, t.y + t.h / 2);
            ctx.lineTo(t.x + t.w, t.y + t.h / 2);
        }
        ctx.stroke();

        drawDots(ctx, t.inVal, t.dot1X, t.dot1Y, 1);
        drawDots(ctx, t.outVal, t.dot2X, t.dot2Y, 1);
    });

    // 4. رسم إحصائيات أعلى الملعب
    ctx.fillStyle = "white";
    ctx.font = "16px sans-serif";
    ctx.textAlign = "left";
    ctx.fillText(`قطع الخصم: ${engine.aiHand.length} | قطعك: ${engine.playerHand.length} | الكومة: ${engine.boneyard.length}`, 130, 110);

    // 5. رسم قطع اللاعب (في الأسفل، المستطيل الأبيض السفلي)
    const pCount = engine.playerHand.length;
    const pW = 50, pH = 100, pS = 60;
    let pX = (800 - (pCount * pS)) / 2;
    
    engine.playerHand.forEach((tile, index) => {
        if (index === draggingIndex) return;

        const x = pX + index * pS;
        const y = 670; // وضع القطع في الأسفل
        
        ctx.fillStyle = "#fff";
        ctx.strokeStyle = "#000";
        ctx.lineWidth = 2;
        ctx.fillRect(x, y, pW, pH);
        ctx.strokeRect(x, y, pW, pH);
        
        ctx.beginPath();
        ctx.moveTo(x, y + pH / 2);
        ctx.lineTo(x + pW, y + pH / 2);
        ctx.stroke();
        
        drawDots(ctx, tile.sideA, x + pW/2, y + pH/4, 1);
        drawDots(ctx, tile.sideB, x + pW/2, y + (pH/4)*3, 1);
        
        (tile as any).bounds = { x, y, w: pW, h: pH };
    });

    // 6. رسم القطعة المسحوبة
    if (isDragging && draggingTile) {
        ctx.shadowColor = "rgba(0,0,0,0.6)";
        ctx.shadowBlur = 15;
        ctx.shadowOffsetY = 5;
        
        const w = 60, h = 120; // تكبير القطعة المسحوبة قليلاً
        ctx.fillStyle = "#fff";
        ctx.strokeStyle = "#000";
        ctx.lineWidth = 2;
        ctx.fillRect(mouseX - w/2, mouseY - h/2, w, h);
        ctx.strokeRect(mouseX - w/2, mouseY - h/2, w, h);
        
        ctx.beginPath();
        ctx.moveTo(mouseX - w/2, mouseY);
        ctx.lineTo(mouseX + w/2, mouseY);
        ctx.stroke();
        
        drawDots(ctx, draggingTile.sideA, mouseX, mouseY - h/4, 1.2);
        drawDots(ctx, draggingTile.sideB, mouseX, mouseY + h/4, 1.2);
        
        ctx.shadowColor = "transparent";
        ctx.shadowBlur = 0;
        ctx.shadowOffsetY = 0;
    }

    // 7. منطق زر السحب
    let msg = engine.isPlayerTurn ? "اسحب قطعة وأفلتها قرب الطرف المضيء بالأخضر" : "الذكاء الاصطناعي يفكر...";
    
    const needsToDrawOrPass = engine.isPlayerTurn && !engine.canPlayerPlay();
    if (needsToDrawOrPass) {
        if (engine.boneyard.length > 0) {
            msg = "لا يوجد لديك قطعة صالحة! اضغط على زر (سحب قطعة).";
        } else {
            msg = "الكومة فارغة! اضغط على زر (تمرير الدور).";
        }
        ctx.fillStyle = "#d9534f";
        ctx.fillRect(drawBtnX, drawBtnY, drawBtnW, drawBtnH);
        ctx.strokeStyle = "#fff";
        ctx.lineWidth = 2;
        ctx.strokeRect(drawBtnX, drawBtnY, drawBtnW, drawBtnH);
        ctx.fillStyle = "white";
        ctx.font = "20px sans-serif";
        ctx.textAlign = "center";
        ctx.fillText(engine.boneyard.length > 0 ? "سحب قطعة" : "تمرير الدور", drawBtnX + drawBtnW / 2, drawBtnY + 32);
    }
    info.innerText = msg;

    requestAnimationFrame(gameLoop);
}

// --- أحداث الماوس واللمس ---

function getCoords(e: MouseEvent | TouchEvent): {x: number, y: number} {
    const rect = canvas.getBoundingClientRect();
    if (e instanceof TouchEvent) {
        return { x: e.touches[0].clientX - rect.left, y: e.touches[0].clientY - rect.top };
    } else {
        return { x: e.clientX - rect.left, y: e.clientY - rect.top };
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