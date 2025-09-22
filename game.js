const canvas = document.getElementById("gameCanvas");
const ctx = canvas.getContext("2d");
canvas.width = window.innerWidth;
canvas.height = window.innerHeight;

let lanes = 5;
let rows = 5;
let laneWidth = canvas.width / lanes;
let rowHeight = canvas.height / rows;

let playerLane = 2;
let playerRow = rows - 1;
let playerColor = "red";
let playerWidth = laneWidth * 0.6;
let playerHeight = rowHeight * 0.6;

let enemies = [];
let score = 0;
let money = 0;
let gameOver = false;
let lives = 1;

const playAgainBtn = document.getElementById("playAgainBtn");
const shopDiv = document.getElementById("shop");
const moneySpan = document.getElementById("money");
const colorGrid = document.getElementById("colorGrid");

let availableColors = ["red", "green", "yellow", "purple"];
let unlocked = [false, false, false, false];

// touch
let touchStartX = null;
let touchStartY = null;
window.addEventListener("touchstart", e => {
  touchStartX = e.touches[0].clientX;
  touchStartY = e.touches[0].clientY;
});
window.addEventListener("touchend", e => {
  let touchEndX = e.changedTouches[0].clientX;
  let touchEndY = e.changedTouches[0].clientY;
  let dx = touchEndX - touchStartX;
  let dy = touchEndY - touchStartY;

  if (Math.abs(dx) > Math.abs(dy)) {
    if (dx < -50 && playerLane > 0) playerLane--;
    else if (dx > 50 && playerLane < lanes - 1) playerLane++;
  } else {
    if (dy < -50 && playerRow > 0) playerRow--;
    else if (dy > 50 && playerRow < rows - 1) playerRow++;
  }
});

// enemies
function spawnEnemies() {
  let count = Math.floor(Math.random() * 3) + 1;
  let used = [];
  for (let i = 0; i < count; i++) {
    let lane;
    do {
      lane = Math.floor(Math.random() * lanes);
    } while (used.includes(lane));
    used.push(lane);

    enemies.push({
      lane: lane,
      row: -1,
      width: playerWidth,
      height: playerHeight
    });
  }
}
setInterval(spawnEnemies, 1500);

// ציור מכונית עם גלגלים
function drawCar(x, y, w, h, color) {
  ctx.fillStyle = color;
  ctx.fillRect(x, y, w, h);

  ctx.fillStyle = "black";
  let r = w * 0.15;
  ctx.beginPath(); ctx.arc(x + r, y + r, r, 0, Math.PI*2); ctx.fill();
  ctx.beginPath(); ctx.arc(x + w - r, y + r, r, 0, Math.PI*2); ctx.fill();
  ctx.beginPath(); ctx.arc(x + r, y + h - r, r, 0, Math.PI*2); ctx.fill();
  ctx.beginPath(); ctx.arc(x + w - r, y + h - r, r, 0, Math.PI*2); ctx.fill();
}

// ניקוד כל 2 שניות
setInterval(() => {
  if (!gameOver) score++;
}, 2000);

// game loop
function update() {
  if (gameOver) return;

  for (let enemy of enemies) {
    enemy.row += 0.03;
  }
  enemies = enemies.filter(e => e.row < rows);

  let playerX = playerLane * laneWidth + (laneWidth - playerWidth) / 2;
  let playerY = playerRow * rowHeight + (rowHeight - playerHeight) / 2;

  for (let enemy of enemies) {
    let enemyX = enemy.lane * laneWidth + (laneWidth - enemy.width) / 2;
    let enemyY = enemy.row * rowHeight + (rowHeight - enemy.height) / 2;
    if (
      playerX < enemyX + enemy.width &&
      playerX + playerWidth > enemyX &&
      playerY < enemyY + enemy.height &&
      playerY + playerHeight > enemyY
    ) {
      if (lives > 1) {
        lives--;
        enemies = enemies.filter(e => e !== enemy);
      } else {
        gameOver = true;
        money += score;
        moneySpan.textContent = money;
        playAgainBtn.style.display = "block";
        shopDiv.style.display = "block";
        renderColors();
      }
    }
  }

  draw();
  requestAnimationFrame(update);
}

function draw() {
  ctx.clearRect(0, 0, canvas.width, canvas.height);

  ctx.fillStyle = "#444";
  ctx.fillRect(0, 0, canvas.width, canvas.height);

  ctx.strokeStyle = "#fff";
  ctx.setLineDash([20, 20]);
  for (let i = 1; i < lanes; i++) {
    ctx.beginPath();
    ctx.moveTo(i * laneWidth, 0);
    ctx.lineTo(i * laneWidth, canvas.height);
    ctx.stroke();
  }
  ctx.setLineDash([]);

  let playerX = playerLane * laneWidth + (laneWidth - playerWidth) / 2;
  let playerY = playerRow * rowHeight + (rowHeight - playerHeight) / 2;
  drawCar(playerX, playerY, playerWidth, playerHeight, playerColor);

  for (let enemy of enemies) {
    let enemyX = enemy.lane * laneWidth + (laneWidth - enemy.width) / 2;
    let enemyY = enemy.row * rowHeight + (rowHeight - enemy.height) / 2;
    drawCar(enemyX, enemyY, enemy.width, enemy.height, "blue");
  }

  ctx.fillStyle = "white";
  ctx.font = "24px Arial";
  ctx.fillText("ניקוד: " + score, 20, 40);
  ctx.fillText("חיים: " + lives, 20, 70);
  ctx.fillText("כסף: " + money, 20, 100);
}

// buttons
playAgainBtn.onclick = () => {
  gameOver = false;
  enemies = [];
  score = 0;
  lives = 1;
  playAgainBtn.style.display = "none";
  shopDiv.style.display = "none";
  update();
};

function closeShop() {
  shopDiv.style.display = "none";
}

// קנייה
function buyLife() {
  if (money >= 15) {
    money -= 15;
    lives++;
    moneySpan.textContent = money;
  }
}

function buyColor() {
  if (money >= 5) {
    money -= 5;
    moneySpan.textContent = money;

    let lockedIndex = unlocked.indexOf(false);
    if (lockedIndex !== -1) {
      unlocked[lockedIndex] = true;
    } else {
      availableColors = randomColors();
      unlocked = [false, false, false, false];
    }
    renderColors();
  }
}

// ריבועי צבע
function renderColors() {
  colorGrid.innerHTML = "";
  availableColors.forEach((color, i) => {
    let box = document.createElement("div");
    box.className = "colorBox";
    box.style.background = color;
    if (!unlocked[i]) {
      box.classList.add("locked");
      box.textContent = "🔒";
    } else {
      box.onclick = () => {
        playerColor = color;
      };
    }
    colorGrid.appendChild(box);
  });
}

function randomColors() {
  let colors = ["red","green","yellow","purple","pink","orange","cyan","lime","white","gold"];
  let shuffled = colors.sort(() => Math.random() - 0.5);
  return shuffled.slice(0, 4);
}

update();
// חוסם דאבל טאפ זום
document.addEventListener("dblclick", function(e) {
  e.preventDefault();
}, { passive: false });

// חוסם פינץ' זום
document.addEventListener("gesturestart", function(e) {
  e.preventDefault();
});