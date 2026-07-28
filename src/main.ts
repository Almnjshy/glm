import { GameEngine } from './core/GameEngine';
import { DominoTile } from './core/DominoTile';

const canvas = document.getElementById('gameCanvas') as HTMLCanvasElement;
const ctx = canvas.getContext('2d')!;
const info = document.getElementById('info')!;

const engine = new GameEngine();
let selectedTileIndex: number = -1;

function draw() {
  ctx.clearRect(0, 0, canvas.width, canvas.height);

  // رسم القطع الموجودة على الطاولة (في الأعلى)
  let boardX = 400 - (engine.board.length * 35);
  engine.board.forEach(tile => {
    tile.x = boardX;
    tile.y = 50;
    tile.width = 60;
    tile.height = 120;
    tile.draw(ctx);
    boardX += 70;
  });

  // رسم يد اللاعب (في الأسفل)
  let handX = 50;
  engine.playerHand.forEach((tile, index) => {
    tile.x = handX;
    tile.y = 450;
    tile.width = 60;
    tile.height = 120;
    
    // إبراز القطعة المختارة
    if (index === selectedTileIndex) {
      ctx.fillStyle = 'rgba(255, 255, 0, 0.3)';
      ctx.fillRect(tile.x - 5, tile.y - 5, tile.width + 10, tile.height + 10);
    }
    
    tile.draw(ctx);
    handX += 70;
  });

  info.innerText = engine.isPlayerTurn ? "دورك: اختر قطعة ثم انقر يمين أو يسار الشاشة" : "الذكاء الاصطناعي يفكر...";
}

// التعامل مع نقرات الماوس
canvas.addEventListener('click', (e) => {
  if (!engine.isPlayerTurn) return;

  const rect = canvas.getBoundingClientRect();
  const x = e.clientX - rect.left;
  const y = e.clientY - rect.top;

  // التحقق إذا نقر على قطعة في يده
  for (let i = 0; i < engine.playerHand.length; i++) {
    const tile = engine.playerHand[i];
    if (x >= tile.x && x <= tile.x + tile.width && y >= tile.y && y <= tile.y + tile.height) {
      selectedTileIndex = i;
      draw();
      return;
    }
  }

  // إذا كان قد اختار قطعة، ونقر في النصف الأيمن من الشاشة (للعب يمين)
  if (selectedTileIndex !== -1 && x > canvas.width / 2) {
    const tile = engine.playerHand[selectedTileIndex];
    if (engine.playTile(tile, 'right')) {
      engine.playerHand.splice(selectedTileIndex, 1);
      selectedTileIndex = -1;
      endTurn();
    }
  }
  // إذا نقر في النصف الأيسر (للعب يسار)
  else if (selectedTileIndex !== -1 && x < canvas.width / 2) {
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
  
  // فحص الفوز
  if (engine.playerHand.length === 0) {
    alert("لقد فزت!");
    return;
  }

  engine.isPlayerTurn = false;
  draw();

  // دور الذكاء الاصطناعي
  setTimeout(() => {
    if (engine.aiHand.length === 0) {
      alert("فاز الذكاء الاصطناعي!");
      return;
    }
    engine.aiTurn();
    engine.isPlayerTurn = true;
    draw();
  }, 1500);
}

draw();