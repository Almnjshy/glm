import { GameEngine } from './core/GameEngine';
import { DominoTile } from './core/DominoTile';
import { PlacedTile } from './core/GameEngine';

const canvas = document.getElementById('gameCanvas') as HTMLCanvasElement;
const ctx = canvas.getContext('2d')!;
const info = document.getElementById('info')!;

const engine = new GameEngine();
let selectedTileIndex: number = -1;

// دالة رسم النقاط (تم تحديثها لتناسب القطع الأفقية والعمودية)
function drawDots(ctx: CanvasRenderingContext2D, value: number, cx: number, cy: number) {
    const r = 3;
    const off = 8;
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

// دالة رسم قطعة واحدة على الطاولة
function drawPlacedTile(t: PlacedTile) {
    const w = t.isVertical ? 40 : 80;
    const h = t.isVertical ? 80 : 40;

    ctx.fillStyle = "#fff";
    ctx.strokeStyle = "#000";
    ctx.lineWidth = 2;
    ctx.fillRect(t.x, t.y, w, h);
    ctx.strokeRect(t.x, t.y, w, h);

    ctx.beginPath();
    if (t.isVertical) {
        ctx.moveTo(t.x, t.y + h / 2);
        ctx.lineTo(t.x + w, t.y + h / 2);
        drawDots(ctx, t.sideA, t.x + w/2, t.y + h/4);
        drawDots(ctx, t.sideB, t.x + w/2, t.y + (h/4)*3);
    } else {
        ctx.moveTo(t.x + w / 2, t.y);
        ctx.lineTo(t.x + w / 2, t.y + h);
        drawDots(ctx, t.sideA, t.x + w/4, t.y + h/2);
        drawDots(ctx, t.sideB, t.x + (w/4)*3, t.y + h/2);
    }
    ctx.stroke();
}

function draw() {
    ctx.clearRect(0, 0, canvas.width, canvas.height);

    // رسم القطع على الطاولة
    engine.placedTiles.forEach(t => drawPlacedTile(t));

    // رسم يد اللاعب (في الأسفل)
    let handX = 50;
    engine.playerHand.forEach((tile, index) => {
        tile.x = handX;
        tile.y = 450;
        tile.width = 40;
        tile.height = 80;
        
        if (index === selectedTileIndex) {
            ctx.fillStyle = 'rgba(255, 255, 0, 0.3)';
            ctx.fillRect(tile.x - 5, tile.y - 5, tile.width + 10, tile.height + 10);
        }
        
        ctx.fillStyle = "#fff";
        ctx.strokeStyle = "#000";
        ctx.fillRect(tile.x, tile.y, tile.width, tile.height);
        ctx.strokeRect(tile.x, tile.y, tile.width, tile.height);
        
        ctx.beginPath();
        ctx.moveTo(tile.x, tile.y + tile.height / 2);
        ctx.lineTo(tile.x + tile.width, tile.y + tile.height / 2);
        ctx.stroke();
        
        drawDots(ctx, tile.sideA, tile.x + tile.width/2, tile.y + tile.height/4);
        drawDots(ctx, tile.sideB, tile.x + tile.width/2, tile.y + (tile.height/4)*3);
        
        handX += 50;
    });

    info.innerText = engine.isPlayerTurn ? "دورك: اختر قطعة ثم انقر يمين أو يسار الشاشة" : "الذكاء الاصطناعي يفكر...";
}

canvas.addEventListener('click', (e) => {
    if (!engine.isPlayerTurn) return;

    const rect = canvas.getBoundingClientRect();
    const x = e.clientX - rect.left;
    const y = e.clientY - rect.top;

    for (let i = 0; i < engine.playerHand.length; i++) {
        const tile = engine.playerHand[i];
        if (x >= tile.x && x <= tile.x + tile.width && y >= tile.y && y <= tile.y + tile.height) {
            selectedTileIndex = i;
            draw();
            return;
        }
    }

    if (selectedTileIndex !== -1 && x > canvas.width / 2) {
        const tile = engine.playerHand[selectedTileIndex];
        if (engine.playTile(tile, 'right')) {
            engine.playerHand.splice(selectedTileIndex, 1);
            selectedTileIndex = -1;
            endTurn();
        }
    } else if (selectedTileIndex !== -1 && x < canvas.width / 2) {
        const tile = engine.playerHand[selectedTileIndex];
        if (engine.playTile(tile, 'left')) {
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