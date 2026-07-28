import { GameEngine } from './core/GameEngine';
import { DominoTile } from './core/DominoTile';
import { PlacedTile, EndPoint } from './core/GameEngine';

const canvas = document.getElementById('gameCanvas') as HTMLCanvasElement;
const ctx = canvas.getContext('2d')!;
const info = document.getElementById('info')!;

const engine = new GameEngine();

// متغيرات السحب والإفلات
let isDragging = false;
let draggingTile: DominoTile | null = null;
let draggingIndex: number = -1;
let mouseX = 0, mouseY = 0;

// إحداثيات زر السحب
const drawBtnX = 650, drawBtnY = 500, drawBtnW = 140, drawBtnH = 50;

function drawDots(ctx: CanvasRenderingContext2D, value: number, cx: number, cy: number, scale: number = 1) {
    const r = 3 * scale;
    const off = 8 * scale;
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

function drawPlacedTile(t: PlacedTile, highlight: boolean = false) {
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
}

function drawTileRaw(tile: DominoTile, x: number, y: number, w: number, h: number, scale: number = 1) {
    ctx.fillStyle = "#fff";
    ctx.strokeStyle = "#000";
    ctx.lineWidth = 2;
    ctx.fillRect(x, y, w, h);
    ctx.strokeRect(x, y, w, h);

    ctx.beginPath();
    ctx.moveTo(x, y + h / 2);
    ctx.lineTo(x + w, y + h / 2);
    ctx.stroke();

    drawDots(ctx, tile.sideA, x + w/2, y + h/4, scale);
    drawDots(ctx, tile.sideB, x + w/2, y + (h/4)*3, scale);
}

function gameLoop() {
    ctx.clearRect(0, 0, canvas.width, canvas.height);

    engine.placedTiles.forEach((t, index) => {
        let highlight = false;
        if (isDragging && draggingTile) {
            const isFirst = index === 0;
            const isLast = index === engine.placedTiles.length - 1;
            if (isFirst && engine.leftEnd && draggingTile.hasValue(engine.leftEnd.val)) highlight = true;
            if (isLast && engine.rightEnd && draggingTile.hasValue(engine.rightEnd.val)) highlight = true;
        }
        drawPlacedTile(t, highlight);
    });

    ctx.fillStyle = "white";
    ctx.font = "16px sans-serif";
    ctx.textAlign = "left";
    ctx.fillText(`يدك: ${engine.playerHand.length} | يد الخصم: ${engine.aiHand.length} | الكومة: ${engine.boneyard.length}`, 10, 20);

    const handCount = engine.playerHand.length;
    let handX = (800 - (handCount * 60)) / 2;
    
    engine.playerHand.forEach((tile, index) => {
        if (index === draggingIndex) return;

        tile.x = handX;
        tile.y = 490;
        tile.width = 40;
        tile.height = 80;
        
        drawTileRaw(tile, tile.x, tile.y, tile.width, tile.height, 0.8);
        handX += 60; 
    });

    if (isDragging && draggingTile) {
        ctx.shadowColor = "rgba(0,0,0,0.6)";
        ctx.shadowBlur = 15;
        ctx.shadowOffsetY = 5;
        
        const w = 50, h = 100;
        drawTileRaw(draggingTile, mouseX - w/2, mouseY - h/2, w, h, 1);
        
        ctx.shadowColor = "transparent";
        ctx.shadowBlur = 0;
        ctx.shadowOffsetY = 0;
    }

    let msg = engine.isPlayerTurn ? "اسحب قطعة وأفلتها في أي مكان قرب الطرف المضيء بالأخضر" : "الذكاء الاصطناعي يفكر...";
    
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
        if (mouseX >= tile.x && mouseX <= tile.x + tile.width && mouseY >= tile.y && mouseY <= tile.y + tile.height) {
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
    const rEnd = engine.rightEnd;
    const lEnd = engine.leftEnd;
    let tryRightFirst = true;

    if (rEnd && lEnd) {
        const distRight = Math.hypot(mouseX - rEnd.x, mouseY - rEnd.y);
        const distLeft = Math.hypot(mouseX - lEnd.x, mouseY - lEnd.y);
        tryRightFirst = distRight < distLeft;
    }

    // محاولة اللعب في الطرف الأقرب، وإذا فشل يحاول الطرف الآخر
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

    // إعادة تعيين حالة السحب
    isDragging = false;
    draggingTile = null;
    draggingIndex = -1;
}

// أحداث البدء ترتبط بالـ Canvas فقط
canvas.addEventListener('mousedown', handleStart);
canvas.addEventListener('touchstart', handleStart);

// أحداث الحركة والإفلات ترتبط بـ window لضمان التقاطها حتى لو خرج الماوس من اللعبة
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