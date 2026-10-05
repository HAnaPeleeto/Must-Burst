// --- 1. データと設定 ---
const ballsData = [
  { id: 'boro', name: 'たまごボーロ', speed: 1.5, weight: 0.3, atkMulti: 1.0, color: '#f5deb3', type: 'normal', rarity: 'normal' },
  { id: 'pingpong', name: 'ピンポン玉', speed: 1.2, weight: 0.1, atkMulti: 0.8, color: '#ffa500', type: 'normal', rarity: 'normal' },
  { id: 'baseball', name: '野球ボール', speed: 1.0, weight: 1.0, atkMulti: 1.5, color: '#ffffff', type: 'normal', rarity: 'normal' },
  { id: 'tennis', name: '硬式テニス玉', speed: 1.1, weight: 0.8, atkMulti: 1.2, color: '#ccff00', type: 'bounce', rarity: 'normal' },
  { id: 'bowling', name: 'ボウリングの玉', speed: 0.6, weight: 3.0, atkMulti: 3.0, color: '#444444', type: 'normal', rarity: 'normal' },
  { id: 'globe', name: '地球儀', speed: 0.8, weight: 1.5, atkMulti: 2.0, color: '#1e90ff', type: 'normal', rarity: 'hyper' },
  { id: 'meteor', name: '隕石', speed: 0.5, weight: 5.0, atkMulti: 5.0, color: '#ff4757', type: 'normal', rarity: 'hyper' },
  { id: 'secret1', name: '睾丸 (シークレット)', speed: 1.4, weight: 0.9, atkMulti: 2.5, color: '#ffb6c1', type: 'normal', rarity: 'secret' },
  { id: 'dodgeball', name: 'ドッヂボール', speed: 2.0, weight: 0.9, atkMulti: 1.3, color: '#ff9f43', type: 'normal', rarity: 'normal' },
  { id: 'frisbee', name: 'フリスビー', speed: 1.3, weight: 0.4, atkMulti: 0.4, color: '#0abde3', type: 'pierce', rarity: 'normal' },
  { id: 'booger', name: '鼻くそ', speed: 1.0, weight: 0.1, atkMulti: 0.5, color: '#10ac84', type: 'split', rarity: 'normal' },
  { id: 'softball', name: 'ソフトボール', speed: 1.6, weight: 0.8, atkMulti: 1.1, color: '#feca57', type: 'normal', rarity: 'normal' },
  { id: 'diamond', name: 'ダイアモンド (シークレット)', speed: 0.2, weight: 4.0, atkMulti: 8.0, color: '#00d2d3', type: 'normal', rarity: 'secret' }
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

// --- 2. サウンドシステム（キラキラ効果音＆ファンファーレ追加） ---
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
  } else if (type === 'sparkle') {
    // キラキラん！！！！！音
    const notes = [523.25, 659.25, 783.99, 1046.50, 1318.51, 1567.98];
    notes.forEach((freq, idx) => {
      const o = audioCtx.createOscillator();
      const g = audioCtx.createGain();
      o.type = 'sine';
      o.frequency.value = freq;
      o.connect(g); g.connect(audioCtx.destination);
      g.gain.setValueAtTime(getVolume(0.08), audioCtx.currentTime + idx * 0.06);
      g.gain.exponentialRampToValueAtTime(0.001, audioCtx.currentTime + idx * 0.06 + 0.2);
      o.start(audioCtx.currentTime + idx * 0.06);
      o.stop(audioCtx.currentTime + idx * 0.06 + 0.25);
    });
  } else if (type === 'clear') {
    // クリアファンファーレ
    const cNotes = [523.25, 659.25, 783.99, 1046.50];
    cNotes.forEach((freq, idx) => {
      const o = audioCtx.createOscillator();
      const g = audioCtx.createGain();
      o.type = 'triangle';
      o.frequency.value = freq;
      o.connect(g); g.connect(audioCtx.destination);
      g.gain.setValueAtTime(getVolume(0.15), audioCtx.currentTime + idx * 0.15);
      g.gain.exponentialRampToValueAtTime(0.001, audioCtx.currentTime + idx * 0.15 + 0.4);
      o.start(audioCtx.currentTime + idx * 0.15);
      o.stop(audioCtx.currentTime + idx * 0.15 + 0.45);
    });
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

// マリオカート風の10段階インジケーター生成関数
function createStatBar(val, maxVal) {
  const ratio = Math.min(1, Math.max(0, val / maxVal));
  const filledCount = Math.round(ratio * 10);
  let barStr = '';
  for (let i = 0; i < 10; i++) {
    barStr += i < filledCount ? '■' : '□';
  }
  return barStr;
}

function updateUI() {
  document.getElementById('menu-coins').textContent = userData.coins;
  document.getElementById('game-coins').textContent = userData.coins;
  document.getElementById('gacha-coins').textContent = userData.coins;
  
  // ガチャ画面の所持数表示 (〇 / □)
  const gachaCountEl = document.getElementById('gacha-collection-count');
  if (gachaCountEl) {
    gachaCountEl.textContent = `${userData.collection.length} / ${ballsData.length}`;
  }

  document.getElementById('power-lv').textContent = userData.powerLv;
  document.getElementById('power-bonus').textContent = (userData.powerLv - 1) * 5;
  document.getElementById('cost-power').textContent = getUpgradeCost(userData.powerLv);
  
  document.getElementById('speed-lv').textContent = userData.speedLv;
  document.getElementById('speed-bonus').textContent = (userData.speedLv - 1) * 5;
  document.getElementById('cost-speed').textContent = getUpgradeCost(userData.speedLv);

  document.getElementById('player-name').value = userData.playerName || '名無し';
  document.getElementById('bgm-volume').value = userData.bgmVol;

  // キャラ選択画面（マリオカート風ステータス ＆ 所持数 ＆ 確認ダイアログつき）
  const collectionList = document.getElementById('collection-list');
  collectionList.innerHTML = '';
  
  // ヘッダーに所持数を表示
  const headerInfo = document.createElement('div');
  headerInfo.style.marginBottom = '10px';
  headerInfo.style.fontWeight = 'bold';
  headerInfo.style.color = '#ffeb3b';
  headerInfo.textContent = `キャラ所持数: ${userData.collection.length} / ${ballsData.length} 体`;
  collectionList.appendChild(headerInfo);

  ballsData.forEach(ball => {
    const hasBall = userData.collection.includes(ball.id);
    const card = document.createElement('div');
    card.style.background = 'rgba(255,255,255,0.1)';
    card.style.padding = '10px';
    card.style.margin = '8px 0';
    card.style.borderRadius = '8px';
    card.style.textAlign = 'left';
    card.style.border = userData.equipped === ball.id ? '2px solid #ff4757' : '1px solid rgba(255,255,255,0.2)';

    if (!hasBall) {
      card.innerHTML = `<span style="color:#aaa;">🔒 ??? (未所持)</span>`;
    } else {
      // マリオカート風指標 (スピード max:2.5, アタック max:8.0, ウェイト max:5.0 を10段階に換算)
      const speedBar = createStatBar(ball.speed, 2.5);
      const atkBar = createStatBar(ball.atkMulti, 8.0);
      const weightBar = createStatBar(ball.weight, 5.0);

      let isEquipped = userData.equipped === ball.id;
      card.innerHTML = `
        <div style="display:flex; justify-content:space-between; align-items:center;">
          <strong style="color:${isEquipped ? '#ff4757' : '#fff'};">${isEquipped ? '★ ' : ''}${ball.name}</strong>
          <button class="select-ball-btn" data-id="${ball.id}" style="padding:4px 10px; font-size:0.8rem; background:${isEquipped ? '#ff4757' : '#2ed573'}; color:#fff; border:none; border-radius:4px; cursor:pointer;">
            ${isEquipped ? '装備中' : '変更する'}
          </button>
        </div>
        <div style="font-size:0.8rem; margin-top:6px; color:#ddd; font-family:monospace;">
          スピード: ${speedBar} (${ball.speed})<br>
          攻撃力 : ${atkBar} (${ball.atkMulti}倍)<br>
          重さ  : ${weightBar} (${ball.weight})
        </div>
      `;
    }
    collectionList.appendChild(card);
  });

  // キャラ選択ボタンのイベント設定（確認ダイアログ付き）
  document.querySelectorAll('.select-ball-btn').forEach(btn => {
    btn.addEventListener('click', (e) => {
      const ballId = e.target.getAttribute('data-id');
      const ballObj = ballsData.find(b => b.id === ballId);
      if (confirm(`「${ballObj.name}」に設定しますか？`)) {
        userData.equipped = ballId;
        saveData();
        updateUI();
        alert(`${ballObj.name} を装備しました！`);
      }
    });
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

// --- ガチャ処理（確率カスタム＆キラキラ＆確認ダイアログ＆確率表） ---
document.getElementById('gacha-btn').addEventListener('click', () => {
  if (userData.coins < 1000) { alert('Gが足りません！'); return; }
  
  if (!confirm('ガチャを引くには1000G使用しますがよろしいですか？')) {
    return;
  }

  const btn = document.getElementById('gacha-btn');
  const capsule = document.getElementById('gacha-capsule');
  const resultEl = document.getElementById('gacha-result');
  userData.coins -= 1000; updateUI(); btn.disabled = true;
  resultEl.innerHTML = 'カプセル開封中...';
  capsule.classList.remove('capsule-pop');
  void capsule.offsetWidth; 
  capsule.classList.add('capsule-pop');

  setTimeout(() => {
    playSE('sparkle'); // キラキラん！！！！音

    // 確率抽選ロジック
    // シークレット各1% (計2%)、ハイパーレア各10% (計20%)、残りをノーマルで均等割り
    const rand = Math.random() * 100;
    let pool = [];
    if (rand < 1) {
      pool = ballsData.filter(b => b.rarity === 'secret');
    } else if (rand < 2) {
      pool = ballsData.filter(b => b.rarity === 'secret'); // 2個目のシークレット用
    } else if (rand < 12) {
      pool = ballsData.filter(b => b.id === 'globe');
    } else if (rand < 22) {
      pool = ballsData.filter(b => b.id === 'meteor');
    } else {
      pool = ballsData.filter(b => b.rarity === 'normal');
    }
    if (!pool || pool.length === 0) pool = ballsData.filter(b => b.rarity === 'normal');

    const randomBall = pool[Math.floor(Math.random() * pool.length)];

    if (userData.collection.includes(randomBall.id)) {
      userData.coins += 100;
      resultEl.innerHTML = `✨ ${randomBall.name} が出た！ ✨<br><span style="font-size:1rem; color:#ffeb3b;">(重複還元: +100G)</span>`;
    } else {
      userData.collection.push(randomBall.id);
      resultEl.innerHTML = `🌟🎊 新規獲得！🎊🌟<br><span style="font-size:1.2rem; color:#00ffcc;">『${randomBall.name}』</span>をゲット！`;
    }
    saveData(); updateUI(); btn.disabled = false;
  }, 1000);
});

// 確率表モーダル表示ボタン
const gachaScreen = document.getElementById('screen-gacha');
const probBtn = document.createElement('button');
probBtn.textContent = "📊 ガチャ確率表を見る";
probBtn.style.marginTop = "10px";
probBtn.style.padding = "8px 15px";
probBtn.style.backgroundColor = "#3742fa";
probBtn.style.color = "#fff";
probBtn.style.border = "none";
probBtn.style.borderRadius = "5px";
probBtn.style.cursor = "pointer";
probBtn.onclick = () => {
  alert(
    "【 ガチャ確率表 】\n\n" +
    "💎 シークレット枠 (各1%)\n" +
    "・ダイアモンド (1%)\n" +
    "・睾丸 (1%)\n\n" +
    "🪐 ハイパーレア枠 (各10%)\n" +
    "・地球儀 (10%)\n" +
    "・隕石 (10%)\n\n" +
    "⚪ ノーマル枠 (残りの確率をそれぞれの体数で割る)\n" +
    "・たまごボーロ / ピンポン玉 / 野球ボール / テニス玉 / ボウリングの玉 / ドッヂボール / フリスビー / 鼻くそ / ソフトボール"
  );
};
// ガチャボタンのすぐ下付近に挿入
const gachaBox = document.querySelector('#screen-gacha > div');
if (gachaBox) gachaBox.appendChild(probBtn);


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

// --- 5. ゲームロジック（新敵「ビル」＆クリア演出追加） ---
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
let lastActionTime = 0;

const enemyTypes = [
  { id: 'slime', name: 'スライム', hpMult: 1.0, w: 30, h: 40, color: '#2ecc71', hpCost: 1 },
  { id: 'brick', name: 'レンガ', hpMult: 2.5, w: 40, h: 40, color: '#e67e22', hpCost: 2 },
  { id: 'building', name: 'ビル', hpMult: 4.0, w: 45, h: 80, color: '#95a5a6', hpCost: 2 }, // ステージ7から登場する背の高いビル
  { id: 'earth', name: '地球', hpMult: 10.0, w: 100, h: 100, color: '#1e90ff', hpCost: 3 }
];

function generateDungeon() {
  targets = [];
  const baseHp = 50 * Math.pow(1.5, currentStage - 1) * (1 + (currentSubStage - 1) * 0.2);
  const isBossStage = (currentStage % 5 === 0 && currentSubStage === 3); 
  const numEnemies = isBossStage ? 1 : Math.min(4, 1 + Math.floor(currentStage / 2)); 
  
  let totalRequiredShots = 0;

  for (let i = 0; i < numEnemies; i++) {
    let type = enemyTypes[0]; // スライム
    if (isBossStage) {
      type = enemyTypes[3]; // 地球（ボス）
    } else if (currentStage >= 7 && Math.random() > 0.4) {
      type = enemyTypes[2]; // ビル (ステージ7以降)
    } else if (currentStage > 2 && Math.random() > 0.5) {
      type = enemyTypes[1]; // レンガ
    } 
    
    targets.push({
      id: i,
      name: type.name,
      x: 220 + (i * 65),
      y: 230 - type.h,
      w: type.w, h: type.h, color: type.color,
      maxHp: baseHp * type.hpMult, hp: baseHp * type.hpMult,
      reward: (isBossStage ? 1000 : 100) * currentStage,
      active: true
    });

    totalRequiredShots += type.hpCost;
  }

  // 「スライムは1体に対し玉1発、レンガとビルは2発」の計算に基づいた必要弾数 ＋ 余裕分
  shotsLeft = totalRequiredShots + 2;
  document.getElementById('shots-left').textContent = shotsLeft;
  document.getElementById('stage-display').textContent = `${currentStage}-${currentSubStage}`;
}

function resetGame(isSubStage = false) {
  gameState = 'IDLE';
  angle = 45; 
  power = 0;       
  angleDir = 1; 
  powerDir = 1;    
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
    if (power >= 100 || powerDir && power <= 0) {
      if (power >= 100) { power = 100; powerDir = -1; }
      if (power <= 0) { power = 0; powerDir = 1; }
    }
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
        playSE('clear'); // クリアファン fanfare
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
        angle = 45; 
        power = 0;       
        powerDir = 1;    
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
    ctx.fillStyle = `hsl(${Math.max(0, power) * 1.2}, 100%, 50%)`;
    ctx.fillRect(10, 10, Math.max(0, power) * 1.5, 10);
  }

  // ステージ完全クリア時の中央黄色文字演出 (CONGRATULATIONS!!)
  if (gameState === 'FINISH' && targets.every(t => !t.active)) {
    ctx.save();
    ctx.font = 'bold 32px Arial';
    ctx.fillStyle = '#ffeb3b';
    ctx.strokeStyle = '#000';
    ctx.lineWidth = 4;
    ctx.textAlign = 'center';
    ctx.shadowColor = 'rgba(0, 0, 0, 0.8)';
    ctx.shadowBlur = 10;
    ctx.strokeText("CONGRATULATIONS!!", canvas.width / 2, canvas.height / 2 - 10);
    ctx.fillText("CONGRATULATIONS!!", canvas.width / 2, canvas.height / 2 - 10);
    ctx.restore();
  }

  requestAnimationFrame(draw);
}

setInterval(updatePhysics, 16);

// --- アクション処理 ---
function handleAction(e) {
  if (e) e.preventDefault();
  
  const now = Date.now();
  if (now - lastActionTime < 300) return;
  lastActionTime = now;

  if (gameState === 'IDLE') {
    power = 0;
    powerDir = 1;
    gameState = 'ANGLE';
    instructionEl.textContent = "タイミングよく押して「角度」を決定！";
    actionBtn.textContent = "角度ストップ！";
  } else if (gameState === 'ANGLE') {
    power = 5;       
    powerDir = 1;    
    gameState = 'POWER';
    instructionEl.textContent = "タイミングよく押して「パワー」を決定！";
    actionBtn.textContent = "デコピン発射！！！";
  } else if (gameState === 'POWER') {
    if (power <= 3) {
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

actionBtn.addEventListener('touchend', (e) => {
  handleAction(e);
}, { passive: false });

actionBtn.addEventListener('click', (e) => {
  if ('ontouchstart' in window) return;
  handleAction(e);
});

changeScreen('screen-menu');
draw();