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
        // إضاءة خضراء ساطعة للأطراف الصالحة
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

// حلقة الرسم المستمرة (Game Loop)
function gameLoop() {
    ctx.clearRect(0, 0, canvas.width, canvas.height);

    // 1. رسم القطع على الطاولة مع إبراز الأطراف الصالحة عند السحب
    engine.placedTiles.forEach((t, index) => {
        let highlight = false;
        if (isDragging && draggingTile) {
            const isFirst = index === 0;
            const isLast = index === engine.placedTiles.length - 1;
            // يضيء الطرف الأيسر إذا كانت القطعة تطابقه
            if (isFirst && engine.leftEnd && draggingTile.hasValue(engine.leftEnd.val)) highlight = true;
            // يضيء الطرف الأيمن إذا كانت القطعة تطابقه
            if (isLast && engine.rightEnd && draggingTile.hasValue(engine.rightEnd.val)) highlight = true;
        }
        drawPlacedTile(t, highlight);
    });

    // 2. رسم الإحصائيات
    ctx.fillStyle = "white";
    ctx.font = "16px sans-serif";
    ctx.textAlign = "left";
    ctx.fillText(`يدك: ${engine.playerHand.length} | يد الخصم: ${engine.aiHand.length} | الكومة: ${engine.boneyard.length}`, 10, 20);

    // 3. رسم يد اللاعب
    const handCount = engine.playerHand.length;
    let handX = (800 - (handCount * 60)) / 2;
    
    engine.playerHand.forEach((tile, index) => {
        if (index === draggingIndex) return; // تخطي القطعة التي يتم سحبها

        tile.x = handX;
        tile.y = 490;
        tile.width = 40;
        tile.height = 80;
        
        drawTileRaw(tile, tile.x, tile.y, tile.width, tile.height, 0.8);
        handX += 60; 
    });

    // 4. رسم القطعة المسحوبة (تتبع الماوس بحجم أكبر مع ظل)
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

    // 5. منطق زر السحب
    let msg = engine.isPlayerTurn ? "اسحب قطعة وأفلتها في الملعب قرب الطرف المضيء بالأخضر" : "الذكاء الاصطناعي يفكر...";
    
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

    requestAnimationFrame(gameLoop); // استمرار حلقة الرسم
}

// --- أحداث الماوس واللمس ---

function handleStart(e: MouseEvent | TouchEvent) {
    if (!engine.isPlayerTurn) return;
    
    const rect = canvas.getBoundingClientRect();
    let clientX = 0, clientY = 0;

    if (e instanceof TouchEvent) {
        clientX = e.touches[0].clientX;
        clientY = e.touches[0].clientY;
    } else {
        clientX = e.clientX;
        clientY = e.clientY;
    }

    mouseX = clientX - rect.left;
    mouseY = clientY - rect.top;

    // فحص زر السحب
    if (mouseX >= drawBtnX && mouseX <= drawBtnX + drawBtnW && mouseY >= drawBtnY && mouseY <= drawBtnY + drawBtnH) {
        if (!engine.canPlayerPlay()) {
            if (engine.playerDraw()) {} else { engine.isPlayerTurn = false; endTurn(); }
        }
        return;
    }

    // فحص مسك قطعة من اليد
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
    e.preventDefault(); // منع تمرير الصفحة على الهاتف
    
    const rect = canvas.getBoundingClientRect();
    if (e instanceof TouchEvent) {
        mouseX = e.touches[0].clientX - rect.left;
        mouseY = e.touches[0].clientY - rect.top;
    } else {
        mouseX = e.clientX - rect.left;
        mouseY = e.clientY - rect.top;
    }
}

function handleEnd(e: MouseEvent | TouchEvent) {
    if (!isDragging || !draggingTile) return;

    let played = false;
    
    // منطق الإفلات الجديد المغفل (Foolproof):
    // طالما أن اللاعب أفلت القطعة في النصف العلوي من الشاشة (في الملعب)
    if (mouseY < 450) {
        const rEnd = engine.rightEnd;
        const lEnd = engine.leftEnd;
        let tryRightFirst = true;

        // نحدد أي طرف هو الأقرب لمكان الإفلات
        if (rEnd && lEnd) {
            const distRight = Math.hypot(mouseX - rEnd.x, mouseY - rEnd.y);
            const distLeft = Math.hypot(mouseX - lEnd.x, mouseY - lEnd.y);
            tryRightFirst = distRight < distLeft;
        }

        // نحاول اللعب في الطرف الأقرب
        if (tryRightFirst) {
            played = engine.playTile(draggingTile, 'right');
            // إذا لم ينجح، نحاول الطرف الآخر فوراً
            if (!played) played = engine.playTile(draggingTile, 'left');
        } else {
            played = engine.playTile(draggingTile, 'left');
            if (!played) played = engine.playTile(draggingTile, 'right');
        }
    }

    // إذا تم اللعب بنجاح، نزيلها من اليد وننهي الدور
    if (played) {
        engine.playerHand.splice(draggingIndex, 1);
        endTurn();
    }

    // إعادة تعيين حالة السحب
    isDragging = false;
    draggingTile = null;
    draggingIndex = -1;
}

// ربط الأحداث للماوس
canvas.addEventListener('mousedown', handleStart);
canvas.addEventListener('mousemove', handleMove);
canvas.addEventListener('mouseup', handleEnd);

// ربط الأحداث للشاشات اللمسية (الهواتف)
canvas.addEventListener('touchstart', handleStart);
canvas.addEventListener('touchmove', handleMove);
canvas.addEventListener('touchend', handleEnd);

function endTurn() {
    if (engine.playerHand.length === 0) { alert("لقد فزت!"); return; }
    engine.isPlayerTurn = false;
    setTimeout(() => {
        if (engine.aiHand.length === 0) { alert("فاز الذكاء الاصطناعي!"); return; }
        engine.aiTurn();
        engine.isPlayerTurn = true;
    }, 1500);
}

// بدء حلقة اللعبة
gameLoop();