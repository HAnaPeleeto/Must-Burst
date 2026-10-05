// --- 1. データと設定 ---
const ballsData = [
  { id: 'boro', name: 'たまごボーロ', speed: 1.5, weight: 0.3, atkMulti: 1.0, color: '#f5deb3', type: 'normal' },
  { id: 'pingpong', name: 'ピンポン玉', speed: 1.2, weight: 0.1, atkMulti: 0.8, color: '#ffa500', type: 'normal' },
  { id: 'baseball', name: '野球ボール', speed: 1.0, weight: 1.0, atkMulti: 1.5, color: '#ffffff', type: 'normal' },
  { id: 'tennis', name: '硬式テニス玉', speed: 1.1, weight: 0.8, atkMulti: 1.2, color: '#ccff00', type: 'bounce' },
  { id: 'bowling', name: 'ボウリングの玉', speed: 0.6, weight: 3.0, atkMulti: 3.0, color: '#444444', type: 'normal' },
  { id: 'globe', name: '地球儀', speed: 0.8, weight: 1.5, atkMulti: 2.0, color: '#1e90ff', type: 'normal' },
  { id: 'meteor', name: '隕石', speed: 0.5, weight: 5.0, atkMulti: 5.0, color: '#ff4757', type: 'normal' },
  { id: 'secret1', name: '睾丸 (シークレット)', speed: 1.4, weight: 0.9, atkMulti: 2.5, color: '#ffb6c1', type: 'normal' },
  { id: 'dodgeball', name: 'ドッヂボール', speed: 2.0, weight: 0.9, atkMulti: 1.3, color: '#ff9f43', type: 'normal' },
  { id: 'frisbee', name: 'フリスビー', speed: 1.3, weight: 0.4, atkMulti: 0.4, color: '#0abde3', type: 'pierce' },
  { id: 'booger', name: '鼻くそ', speed: 1.0, weight: 0.1, atkMulti: 0.5, color: '#10ac84', type: 'split' },
  { id: 'softball', name: 'ソフトボール', speed: 1.6, weight: 0.8, atkMulti: 1.1, color: '#feca57', type: 'normal' },
  { id: 'diamond', name: 'ダイアモンド (シークレット)', speed: 0.2, weight: 4.0, atkMulti: 8.0, color: '#00d2d3', type: 'normal' }
];

const defaultData = {
  coins: 1000,
  collection: ['boro'],
  equipped: 'boro',
  playerName: '名無し',
  bgmVol: 50,
  powerLv: 1,
  speedLv: 1,
  maxStage: 1
};

let savedData = JSON.parse(localStorage.getItem('mustBurstData')) || {};
let userData = { ...defaultData, ...savedData };
if (!userData.collection || userData.collection.length === 0) userData.collection = ['boro'];
if (!userData.maxStage) userData.maxStage = 1;

function saveData() { localStorage.setItem('mustBurstData', JSON.stringify(userData)); }

// --- 2. サウンドシステム ---
let audioCtx = null;
let bgmInterval = null;

function initAudio() {
  if (!audioCtx) audioCtx = new (window.AudioContext || window.webkitAudioContext)();
  if (audioCtx.state === 'suspended') audioCtx.resume();
}

function getVolume(baseLevel) { return (userData.bgmVol / 100) * baseLevel; }

function playSE(type) {
  if (userData.bgmVol <= 0) return;
  initAudio();
  const osc = audioCtx.createOscillator();
  const gain = audioCtx.createGain();
  osc.connect(gain); gain.connect(audioCtx.destination);
  
  if (type === 'hit') {
    osc.type = 'square';
    osc.frequency.setValueAtTime(800, audioCtx.currentTime);
    osc.frequency.exponentialRampToValueAtTime(300, audioCtx.currentTime + 0.1);
    gain.gain.setValueAtTime(getVolume(0.1), audioCtx.currentTime);
    gain.gain.exponentialRampToValueAtTime(0.01, audioCtx.currentTime + 0.1);
    osc.start(); osc.stop(audioCtx.currentTime + 0.1);
  } else if (type === 'shoot') {
    osc.type = 'triangle';
    osc.frequency.setValueAtTime(400, audioCtx.currentTime);
    osc.frequency.linearRampToValueAtTime(600, audioCtx.currentTime + 0.1);
    gain.gain.setValueAtTime(getVolume(0.1), audioCtx.currentTime);
    gain.gain.linearRampToValueAtTime(0.01, audioCtx.currentTime + 0.15);
    osc.start(); osc.stop(audioCtx.currentTime + 0.15);
  } else if (type === 'next') {
    osc.type = 'sine';
    osc.frequency.setValueAtTime(600, audioCtx.currentTime);
    osc.frequency.linearRampToValueAtTime(800, audioCtx.currentTime + 0.2);
    gain.gain.setValueAtTime(getVolume(0.1), audioCtx.currentTime);
    gain.gain.linearRampToValueAtTime(0.01, audioCtx.currentTime + 0.2);
    osc.start(); osc.stop(audioCtx.currentTime + 0.2);
  }
}

function playBGM(scene) {
  clearInterval(bgmInterval);
  if (userData.bgmVol <= 0) return;
  initAudio();
  
  let notes = [];
  let speed = 250;
  if (scene === 'menu') { notes = [440, 554, 659]; } 
  else if (scene === 'select') { notes = [330, 440, 554, 440]; speed = 300; }
  else if (scene === 'game') { notes = [220, 220, 261, 329]; speed = 200; } 
  
  let i = 0;
  bgmInterval = setInterval(() => {
    const osc = audioCtx.createOscillator();
    const gain = audioCtx.createGain();
    osc.type = scene === 'game' ? 'sawtooth' : 'sine';
    osc.frequency.value = notes[i % notes.length];
    osc.connect(gain); gain.connect(audioCtx.destination);
    
    gain.gain.setValueAtTime(getVolume(0.02), audioCtx.currentTime);
    gain.gain.exponentialRampToValueAtTime(0.001, audioCtx.currentTime + (speed / 1000) * 0.8);
    osc.start(); osc.stop(audioCtx.currentTime + (speed / 1000));
    i++;
  }, speed);
}

// --- 3. UI・画面切り替え ---
document.querySelectorAll('button').forEach(btn => {
  btn.addEventListener('click', initAudio);
  btn.addEventListener('touchstart', initAudio, { passive: true });
});

function changeScreen(screenId) {
  document.querySelectorAll('.screen').forEach(s => s.classList.remove('active'));
  document.getElementById(screenId).classList.add('active');
  updateUI();

  if (screenId === 'screen-menu') playBGM('menu');
  else if (screenId === 'screen-stage-select') {
    generateStageButtons();
    playBGM('select');
  }
  else if (screenId === 'screen-game') playBGM('game');
}

function updateUI() {
  document.getElementById('menu-coins').textContent = userData.coins;
  document.getElementById('game-coins').textContent = userData.coins;
  document.getElementById('gacha-coins').textContent = userData.coins;
  
  document.getElementById('power-lv').textContent = userData.powerLv;
  document.getElementById('power-bonus').textContent = (userData.powerLv - 1) * 5;
  document.getElementById('cost-power').textContent = getUpgradeCost(userData.powerLv);
  
  document.getElementById('speed-lv').textContent = userData.speedLv;
  document.getElementById('speed-bonus').textContent = (userData.speedLv - 1) * 5;
  document.getElementById('cost-speed').textContent = getUpgradeCost(userData.speedLv);

  document.getElementById('player-name').value = userData.playerName || '名無し';
  document.getElementById('bgm-volume').value = userData.bgmVol;

  const collectionList = document.getElementById('collection-list');
  collectionList.innerHTML = '';
  userData.collection.forEach(ballId => {
    const ball = ballsData.find(b => b.id === ballId);
    if (!ball) return;
    const btn = document.createElement('button');
    btn.textContent = `${ball.name} を装備`;
    if (userData.equipped === ball.id) {
      btn.style.backgroundColor = '#ff4757';
      btn.textContent = `★ ${ball.name} (装備中)`;
    }
    btn.onclick = () => { userData.equipped = ball.id; saveData(); updateUI(); };
    collectionList.appendChild(btn);
  });
}

document.getElementById('save-settings-btn').addEventListener('click', () => {
  userData.playerName = document.getElementById('player-name').value;
  userData.bgmVol = parseInt(document.getElementById('bgm-volume').value, 10);
  saveData();
  alert('設定を保存しました！');
  if (userData.bgmVol <= 0) clearInterval(bgmInterval);
});

function getUpgradeCost(lv) { return Math.floor(100 * Math.pow(1.3, lv - 1)); }

document.getElementById('btn-up-power').addEventListener('click', () => {
  const cost = getUpgradeCost(userData.powerLv);
  if (userData.coins >= cost) { userData.coins -= cost; userData.powerLv++; saveData(); updateUI(); }
});
document.getElementById('btn-up-speed').addEventListener('click', () => {
  const cost = getUpgradeCost(userData.speedLv);
  if (userData.coins >= cost) { userData.coins -= cost; userData.speedLv++; saveData(); updateUI(); }
});

// --- ガチャ処理 ---
document.getElementById('gacha-btn').addEventListener('click', () => {
  if (userData.coins < 1000) { alert('Gが足りません！'); return; }
  const btn = document.getElementById('gacha-btn');
  const capsule = document.getElementById('gacha-capsule');
  const resultEl = document.getElementById('gacha-result');
  userData.coins -= 1000; updateUI(); btn.disabled = true;
  resultEl.innerHTML = 'カプセル開封中...';
  capsule.classList.remove('capsule-pop');
  void capsule.offsetWidth; 
  capsule.classList.add('capsule-pop');
  setTimeout(() => {
    playSE('shoot');
    const randomBall = ballsData[Math.floor(Math.random() * ballsData.length)];
    if (userData.collection.includes(randomBall.id)) {
      userData.coins += 100;
      resultEl.innerHTML = `${randomBall.name} が出た！<br><span style="font-size:1rem;">(重複還元: +100G)</span>`;
    } else {
      userData.collection.push(randomBall.id);
      resultEl.innerHTML = `🎊 新規獲得！🎊<br>『${randomBall.name}』をゲット！`;
    }
    saveData(); updateUI(); btn.disabled = false;
  }, 1000);
});

// --- 4. ステージ選択機能 ---
function generateStageButtons() {
  const grid = document.getElementById('stage-buttons');
  grid.innerHTML = '';
  const totalStages = 15; 
  
  for (let i = 1; i <= totalStages; i++) {
    const btn = document.createElement('button');
    btn.className = 'stage-btn';
    
    if (i > userData.maxStage) {
      btn.disabled = true;
      btn.textContent = `🔒 ${i}`;
    } else {
      btn.textContent = i;
      btn.onclick = () => { 
        currentStage = i; 
        currentSubStage = 1; 
        changeScreen('screen-game'); 
        resetGame(); 
      };
    }
    grid.appendChild(btn);
  }
}

// --- 5. ゲームロジック ---
const canvas = document.getElementById('gameCanvas');
const ctx = canvas.getContext('2d');
const actionBtn = document.getElementById('action-btn');
const instructionEl = document.getElementById('gauge-instruction');

let currentStage = 1;
let currentSubStage = 1;
let gameState = 'IDLE'; 
let angle = 45, power = 0;
let angleDir = 1, powerDir = 1;
let projectiles = [];
let targets = [];
let shotsLeft = 0;
let lastActionTime = 0; // 連打・重複タップ防止用タイマー

const enemyTypes = [
  { id: 'slime', name: 'スライム', hpMult: 1.0, w: 30, h: 40, color: '#2ecc71' },
  { id: 'brick', name: 'レンガ', hpMult: 2.5, w: 40, h: 40, color: '#e67e22' },
  { id: 'earth', name: '地球', hpMult: 10.0, w: 100, h: 100, color: '#1e90ff' }
];

function generateDungeon() {
  targets = [];
  const baseHp = 50 * Math.pow(1.5, currentStage - 1) * (1 + (currentSubStage - 1) * 0.2);
  const isBossStage = (currentStage % 5 === 0 && currentSubStage === 3); 
  const numEnemies = isBossStage ? 1 : Math.min(4, 1 + Math.floor(currentStage / 2)); 
  
  for (let i = 0; i < numEnemies; i++) {
    let type = enemyTypes[0]; 
    if (isBossStage) type = enemyTypes[2]; 
    else if (currentStage > 2 && Math.random() > 0.6) type = enemyTypes[1]; 
    
    targets.push({
      id: i,
      name: type.name,
      x: 220 + (i * 60),
      y: 230 - type.h,
      w: type.w, h: type.h, color: type.color,
      maxHp: baseHp * type.hpMult, hp: baseHp * type.hpMult,
      reward: (isBossStage ? 1000 : 100) * currentStage,
      active: true
    });
  }
  shotsLeft = targets.length + 2;
  document.getElementById('shots-left').textContent = shotsLeft;
  document.getElementById('stage-display').textContent = `${currentStage}-${currentSubStage}`;
}

function resetGame(isSubStage = false) {
  gameState = 'IDLE';
  angle = 45; power = 0; angleDir = 1; powerDir = 1;
  projectiles = [];
  if (!isSubStage) currentSubStage = 1; 
  generateDungeon();
  instructionEl.textContent = "ボタンで「角度」を決定！";
  actionBtn.textContent = "デコピン準備！";
  actionBtn.disabled = false;
  updateUI();
}

function fireProjectiles(v, rad) {
  const ball = ballsData.find(b => b.id === userData.equipped) || ballsData[0];
  playSE('shoot');
  shotsLeft--;
  document.getElementById('shots-left').textContent = shotsLeft;

  if (ball.type === 'split') {
    for(let i = -1; i <= 1; i++) {
      let offsetRad = rad + (i * 0.15);
      projectiles.push({ x: 50, y: 220, vx: v * Math.cos(offsetRad), vy: -v * Math.sin(offsetRad), ball: ball, hitIds: [], bounced: false });
    }
  } else {
    projectiles.push({ x: 50, y: 220, vx: v * Math.cos(rad), vy: -v * Math.sin(rad), ball: ball, hitIds: [], bounced: false });
  }
}

function updatePhysics() {
  if (gameState === 'ANGLE') {
    angle += 1.2 * angleDir;
    if (angle >= 85 || angle <= 5) angleDir *= -1;
  } else if (gameState === 'POWER') {
    power += 1.8 * powerDir;
    if (power >= 100 || power <= 0) powerDir *= -1;
  } else if (gameState === 'FLY') {
    let allDead = true;
    
    projectiles.forEach(p => {
      p.vy += 0.3 * p.ball.weight;
      p.x += p.vx; p.y += p.vy;

      if (p.ball.type === 'bounce' && !p.bounced && p.y >= 230) {
        p.y = 230; p.vy *= -0.7; p.bounced = true;
      }

      targets.forEach(t => {
        if (t.active && !p.hitIds.includes(t.id) && p.x > t.x && p.x < t.x + t.w && p.y > t.y && p.y < t.y + t.h) {
          playSE('hit');
          const damage = Math.floor(power * (1 + (userData.powerLv - 1) * 0.05) * p.ball.atkMulti);
          t.hp -= damage;
          p.hitIds.push(t.id);
          if (p.ball.type !== 'pierce') p.y = 999; 

          if (t.hp <= 0) {
            t.active = false;
            userData.coins += t.reward;
            saveData(); updateUI();
          }
        }
      });
      if (p.y < 230 && p.x < canvas.width) allDead = false;
    });

    let clear = targets.every(t => !t.active);
    
    if (clear) {
      if (currentSubStage < 3) {
        gameState = 'NEXT_SUB';
        instructionEl.textContent = "全滅させた！さらに奥へ進むぞ！";
        actionBtn.textContent = "次へ進む";
        actionBtn.disabled = false;
      } else {
        gameState = 'FINISH';
        if (currentStage === userData.maxStage) {
          userData.maxStage++;
          saveData();
        }
        instructionEl.textContent = "ステージ完全クリア！！";
        actionBtn.textContent = "ステージ選択へ戻る";
        actionBtn.disabled = false;
      }
    } else if (allDead) {
      projectiles = [];
      if (shotsLeft > 0) {
        gameState = 'IDLE'; 
        instructionEl.textContent = `残り ${shotsLeft} 発！ボタンで角度を決めろ！`;
        actionBtn.textContent = "デコピン準備！";
        actionBtn.disabled = false;
        angle = 45; power = 0;
      } else {
        gameState = 'FINISH';
        instructionEl.textContent = "弾切れ...失敗！";
        actionBtn.textContent = "最初からリトライ";
        actionBtn.disabled = false;
      }
    }
  }
}

function drawFinger(x, y, angle, powerVal) {
  ctx.save();
  ctx.translate(x, y);
  ctx.rotate(-angle * Math.PI / 180); 
  const pullDist = (powerVal / 100) * 20; 
  ctx.translate(-pullDist, 0);
  ctx.fillStyle = '#f1c27d';
  ctx.beginPath(); ctx.arc(-20, 0, 15, 0, Math.PI * 2); ctx.fill();
  ctx.fillStyle = '#e0a96d';
  ctx.beginPath(); ctx.roundRect(0, -5, 30, 10, 5); ctx.fill();
  ctx.restore();
}

function draw() {
  ctx.clearRect(0, 0, canvas.width, canvas.height);
  ctx.fillStyle = '#555'; ctx.fillRect(0, 230, canvas.width, 70);

  targets.forEach(t => {
    if (t.active) {
      ctx.fillStyle = t.color; ctx.fillRect(t.x, t.y, t.w, t.h);
      ctx.fillStyle = '#fff'; ctx.font = '12px Arial'; ctx.textAlign = 'center';
      ctx.fillText(t.name, t.x + t.w/2, t.y - 12);
      const hpPercent = Math.max(0, t.hp / t.maxHp);
      ctx.fillStyle = 'red'; ctx.fillRect(t.x, t.y - 8, t.w, 4);
      ctx.fillStyle = 'lawngreen'; ctx.fillRect(t.x, t.y - 8, t.w * hpPercent, 4);
    }
  });

  projectiles.forEach(p => {
    ctx.fillStyle = p.ball.color;
    ctx.beginPath();
    ctx.arc(p.x, p.y, p.ball.type === 'split' ? 4 : 8, 0, Math.PI * 2);
    ctx.fill();
  });

  if (gameState === 'ANGLE' || gameState === 'POWER' || gameState === 'IDLE' || gameState === 'NEXT_SUB') {
    ctx.strokeStyle = 'rgba(255,255,255,0.3)'; ctx.lineWidth = 1;
    ctx.beginPath(); ctx.moveTo(50, 220);
    let rad = angle * Math.PI / 180;
    ctx.lineTo(50 + 80 * Math.cos(rad), 220 - 80 * Math.sin(rad));
    ctx.stroke();

    if (gameState === 'NEXT_SUB') {
      drawFinger(60, 220, 45, 0);
    } else {
      drawFinger(50, 220, angle, power);
    }

    ctx.strokeStyle = '#fff'; ctx.strokeRect(10, 10, 150, 10);
    ctx.fillStyle = `hsl(${power * 1.2}, 100%, 50%)`;
    ctx.fillRect(10, 10, power * 1.5, 10);
  }

  requestAnimationFrame(draw);
}

setInterval(updatePhysics, 16);

// --- アクション処理（タッチ・クリック重複防止ガード付き） ---
function handleAction(e) {
  if (e) e.preventDefault();
  
  // 連続タップによる誤爆（200ミリ秒以内の連続入力を完全無視）を防ぐガード
  const now = Date.now();
  if (now - lastActionTime < 250) return;
  lastActionTime = now;

  if (gameState === 'IDLE') {
    gameState = 'ANGLE';
    instructionEl.textContent = "タイミングよく押して「角度」を決定！";
    actionBtn.textContent = "角度ストップ！";
  } else if (gameState === 'ANGLE') {
    gameState = 'POWER';
    instructionEl.textContent = "タイミングよく押して「パワー」を決定！";
    actionBtn.textContent = "デコピン発射！！！";
  } else if (gameState === 'POWER') {
    // 万が一パワーが低すぎていたら最低保証値を与える
    if (power <= 2) {
      power = 20;
    }

    gameState = 'FLY';
    instructionEl.textContent = "飛翔中...";
    actionBtn.disabled = true;

    const ball = ballsData.find(b => b.id === userData.equipped) || ballsData[0];
    const v = (power / 100) * 20 * ball.speed * (1 + (userData.speedLv - 1) * 0.05);
    const rad = angle * Math.PI / 180;
    
    fireProjectiles(v, rad);
  } else if (gameState === 'NEXT_SUB') {
    currentSubStage++;
    playSE('next');
    resetGame(true); 
  } else if (gameState === 'FINISH') {
    if (targets.every(t => !t.active)) {
      changeScreen('screen-stage-select'); 
    } else {
      resetGame(false); 
    }
  }
}

// スマホでの重複発火を防ぐため、touchendをメインにし、クリックはPC用として分離
actionBtn.addEventListener('touchend', (e) => {
  handleAction(e);
}, { passive: false });

actionBtn.addEventListener('click', (e) => {
  // タッチデバイスで touchend の後に発生する click イベントを無効化する
  // (スマホの場合は画面タッチだけで動くようにする)
  if ('ontouchstart' in window) return;
  handleAction(e);
});

changeScreen('screen-menu');
draw();