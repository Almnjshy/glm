import { GameEngine } from './core/GameEngine';
import { DominoTile } from './core/DominoTile';
import { PlacedTile } from './core/GameEngine';

const canvas = document.getElementById('gameCanvas') as HTMLCanvasElement;
const ctx = canvas.getContext('2d')!;
const info = document.getElementById('info')!;

const engine = new GameEngine();
let selectedTileIndex: number = -1;

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

function drawPlacedTile(t: PlacedTile) {
    ctx.fillStyle = "#fff";
    ctx.strokeStyle = "#000";
    ctx.lineWidth = 2;
    ctx.fillRect(t.x, t.y, t.w, t.h);
    ctx.strokeRect(t.x, t.y, t.w, t.h);

    ctx.beginPath();
    if (t.isLineHorizontal) {
        ctx.moveTo(t.x, t.y + t.h / 2);
        ctx.lineTo(t.x + t.w, t.y + t.h / 2);
    } else {
        ctx.moveTo(t.x + t.w / 2, t.y);
        ctx.lineTo(t.x + t.w / 2, t.y + t.h);
    }
    ctx.stroke();

    // رسم الرقم الداخلي (inVal) والخارجي (outVal) في الأماكن المحسوبة بدقة
    drawDots(ctx, t.inVal, t.inX, t.inY, 1);
    drawDots(ctx, t.outVal, t.outX, t.outY, 1);
}

function draw() {
    ctx.clearRect(0, 0, canvas.width, canvas.height);

    // 1. رسم القطع على الطاولة
    engine.placedTiles.forEach(t => drawPlacedTile(t));

    // 2. رسم إحصائيات أعلى الشاشة
    ctx.fillStyle = "white";
    ctx.font = "16px sans-serif";
    ctx.textAlign = "left";
    ctx.fillText(`يدك: ${engine.playerHand.length} | يد الخصم: ${engine.aiHand.length} | الكومة: ${engine.boneyard.length}`, 10, 20);

    // 3. رسم يد اللاعب (7 قطع في المنتصف بالأسفل)
    const handCount = engine.playerHand.length;
    let handX = (800 - (handCount * 60)) / 2; // توسيط القطع
    
    engine.playerHand.forEach((tile, index) => {
        tile.x = handX;
        tile.y = 490;
        tile.width = 40;
        tile.height = 80;
        
        if (index === selectedTileIndex) {
            ctx.fillStyle = 'rgba(255, 255, 0, 0.3)';
            ctx.fillRect(tile.x - 5, tile.y - 5, tile.width + 10, tile.height + 10);
        }
        
        ctx.fillStyle = "#fff";
        ctx.strokeStyle = "#000";
        ctx.lineWidth = 2;
        ctx.fillRect(tile.x, tile.y, tile.width, tile.height);
        ctx.strokeRect(tile.x, tile.y, tile.width, tile.height);
        
        ctx.beginPath();
        ctx.moveTo(tile.x, tile.y + tile.height / 2);
        ctx.lineTo(tile.x + tile.width, tile.y + tile.height / 2);
        ctx.stroke();
        
        drawDots(ctx, tile.sideA, tile.x + tile.width/2, tile.y + tile.height/4, 0.8);
        drawDots(ctx, tile.sideB, tile.x + tile.width/2, tile.y + (tile.height/4)*3, 0.8);
        
        handX += 60; 
    });

    // 4. منطق زر السحب / التمرير
    let msg = engine.isPlayerTurn ? "دورك: اختر قطعة، ثم انقر يمين الشاشة (لليمين) أو يسار الشاشة (لليسار)" : "الذكاء الاصطناعي يفكر...";
    
    const needsToDrawOrPass = engine.isPlayerTurn && !engine.canPlayerPlay();
    if (needsToDrawOrPass) {
        if (engine.boneyard.length > 0) {
            msg = "لا يوجد لديك قطعة صالحة! اضغط على زر (سحب قطعة).";
        } else {
            msg = "الكومة فارغة ولا تملك قطعة صالحة! اضغط على زر (تمرير الدور).";
        }
        // رسم الزر
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
}

canvas.addEventListener('click', (e) => {
    if (!engine.isPlayerTurn) return;

    const rect = canvas.getBoundingClientRect();
    const x = e.clientX - rect.left;
    const y = e.clientY - rect.top;

    // التحقق من نقر زر السحب
    if (x >= drawBtnX && x <= drawBtnX + drawBtnW && y >= drawBtnY && y <= drawBtnY + drawBtnH) {
        if (!engine.canPlayerPlay()) {
            if (engine.playerDraw()) {
                draw(); // تم السحب، تحديث الشاشة
            } else {
                engine.isPlayerTurn = false;
                endTurn();
            }
        }
        return;
    }

    // التحقق من نقر قطعة في اليد
    for (let i = 0; i < engine.playerHand.length; i++) {
        const tile = engine.playerHand[i];
        if (x >= tile.x && x <= tile.x + tile.width && y >= tile.y && y <= tile.y + tile.height) {
            selectedTileIndex = i;
            draw();
            return;
        }
    }

    // التحقق من محاولة اللعب يميناً أو يساراً
    if (selectedTileIndex !== -1) {
        const tile = engine.playerHand[selectedTileIndex];
        let played = false;
        if (x > canvas.width / 2) {
            played = engine.playTile(tile, 'right');
        } else {
            played = engine.playTile(tile, 'left');
        }
        
        if (played) {
            engine.playerHand.splice(selectedTileIndex, 1);
            selectedTileIndex = -1;
            endTurn();
        }
    }
});

function endTurn() {
    draw();
    if (engine.playerHand.length === 0) { alert("لقد فزت!"); return; }
    engine.isPlayerTurn = false;
    draw();
    setTimeout(() => {
        if (engine.aiHand.length === 0) { alert("فاز الذكاء الاصطناعي!"); return; }
        engine.aiTurn();
        engine.isPlayerTurn = true;
        draw();
    }, 1500);
}

draw();