
// Game constants
const CANVAS_WIDTH = 800;
const CANVAS_HEIGHT = 500;
const PADDLE_RADIUS = 30; // Stále používáme pro kolize a výpočty velikosti
const PUCK_RADIUS = 15;   // Stále používáme pro kolize a výpočty velikosti
const BONUS_RADIUS = 20;  // Stále používáme pro kolize a výpočty velikosti
const GOAL_WIDTH = 120;
const GOAL_HEIGHT = 10;
const MAX_SCORE = 10;
const PADDLE_SPEED = 8;
const AI_PADDLE_SPEED = 5;
const FRICTION = 0.98;
const BONUS_LIFETIME = 10000; // Bonus lifetime in ms (10 seconds)
const BONUS_BLINK_TIME = 1256; // Start blinking N ms before expiring
const AI_FREEZE_DURATION = 3000; // AI freeze duration in ms

// --- NOVÉ: Cesty k obrázkům ---
const IMAGE_PATHS = {
    playerPaddle: 'images/paddle.png', // Nahraďte skutečnými cestami
    aiPaddle: 'images/paddle.png',       // Nahraďte skutečnými cestami
    puck: 'images/puck.png',             // Nahraďte skutečnými cestami
    bonuses: { // Pro každý typ bonusu jiný obrázek
        enlargePlayerPaddle: 'images/bonus.png',
        shrinkAiPaddle: 'images/bonus.png',
        speedUpPlayerPuck: 'images/bonus_speedup_puck.png',
        slowDownAiPuck: 'images/bonus.png',
        slowDownAi: 'images/bonus_slowdown_ai.png',
        freezeAI: 'images/bonus_freeze.png'
        // Můžete použít i jeden obrázek pro všechny: 'generic': 'images/bonus_generic.png'
    }
};

// --- NOVÉ: Proměnné pro načtené obrázky ---
let images = {
    playerPaddle: null,
    aiPaddle: null,
    puck: null,
    bonuses: {} // Objekt pro uložení obrázků bonusů podle typu
};
let imagesLoaded = false;
let imagesToLoad = 0;
let imagesLoadedCount = 0;

// Game variables
let canvas, ctx;
let playerScore = 0;
let aiScore = 0;
let gameOver = false;
let winner = '';
let goalFlashAlpha = 0;
let goalSide = '';
let aiFrozen = false; // Flag for AI freeze bonus
let collectionEffects = []; // For displaying collection flashes

// Audio context
let audioContext;

// Game objects (radiusy zůstávají pro logiku kolizí a velikost vykreslení)
let playerPaddle = {
    x: 50,
    y: CANVAS_HEIGHT / 2,
    radius: PADDLE_RADIUS,
    speed: PADDLE_SPEED,
    color: '#3498db' // Barva se může hodit pro glow efekt nebo jako fallback
};

let aiPaddle = {
    x: CANVAS_WIDTH - 50,
    y: CANVAS_HEIGHT / 2,
    radius: PADDLE_RADIUS,
    speed: AI_PADDLE_SPEED,
    color: '#e74c3c' // Barva se může hodit pro glow efekt nebo jako fallback
};

let puck = {
    x: CANVAS_WIDTH / 2,
    y: CANVAS_HEIGHT / 2,
    radius: PUCK_RADIUS,
    velocityX: 0,
    velocityY: 0,
    speed: 5,
    color: '#f1c40f' // Barva se může hodit pro glow efekt nebo jako fallback
};

// --- Bonus Setup ---
const bonusTypes = [
    'enlargePlayerPaddle',
    'shrinkAiPaddle',
    'speedUpPlayerPuck',
    'slowDownAiPuck',
    'slowDownAi',
    'freezeAI'
];

const bonusColors = { // Barvy se stále mohou hodit pro glow efekty nebo fallback
    'enlargePlayerPaddle': '#2ecc71',
    'shrinkAiPaddle': '#9b59b6',
    'speedUpPlayerPuck': '#f39c12',
    'slowDownAiPuck': '#1abc9c',
    'slowDownAi': '#34495e',
    'freezeAI': '#aed6f1'
};

let bonuses = [];
let activeEffects = {
    playerPaddleSize: 1,
    aiPaddleSize: 1,
    playerPuckSpeed: 1,
    aiPuckSpeed: 1,
    aiSlowdown: 1
};
const EFFECT_DURATION = 5000;
let effectTimers = {};
let mouseX = 0;
let mouseY = 0;

// --- NOVÉ: Funkce pro načítání obrázků ---
function loadImage(key, path) {
    imagesToLoad++;
    const img = new Image();
    img.onload = () => {
        imagesLoadedCount++;
        console.log(`Image loaded: ${path}`);
        if (imagesLoadedCount === imagesToLoad) {
            imagesLoaded = true;
            console.log("All images loaded successfully.");
            // Až teď můžeme bezpečně spustit hru
            startGameLogic();
        }
    };
    img.onerror = () => {
        console.error(`Failed to load image: ${path}`);
        // Můžete zde přidat fallback nebo zastavit hru
    };
    img.src = path;
    return img;
}

function loadAllImages() {
    console.log("Loading images...");
    images.playerPaddle = loadImage('playerPaddle', IMAGE_PATHS.playerPaddle);
    images.aiPaddle = loadImage('aiPaddle', IMAGE_PATHS.aiPaddle);
    images.puck = loadImage('puck', IMAGE_PATHS.puck);

    for (const type in IMAGE_PATHS.bonuses) {
        images.bonuses[type] = loadImage(`bonus_${type}`, IMAGE_PATHS.bonuses[type]);
    }
    // Pokud byste měli generický obrázek:
    // if (IMAGE_PATHS.bonuses.generic) {
    //    images.bonuses['generic'] = loadImage('bonus_generic', IMAGE_PATHS.bonuses.generic);
    // }
}

// Initialize the game - nyní spouští načítání obrázků
function init() {
    canvas = document.getElementById('gameCanvas');
    canvas.width = CANVAS_WIDTH;
    canvas.height = CANVAS_HEIGHT;
    ctx = canvas.getContext('2d');

    try {
        audioContext = new (window.AudioContext || window.webkitAudioContext)();
        initSounds();
    } catch (e) {
        console.warn('Web Audio API not supported in this browser');
    }

    // Nastavení listenerů atd.
    canvas.addEventListener('mousemove', trackMouse);
    document.getElementById('restart-button').addEventListener('click', restartGame);

    // Spustí načítání obrázků
    loadAllImages();

    // Zobrazí zprávu o načítání
    ctx.fillStyle = '#fff';
    ctx.font = '20px Arial';
    ctx.textAlign = 'center';
    ctx.fillText('Loading assets...', CANVAS_WIDTH / 2, CANVAS_HEIGHT / 2);
}

// --- NOVÉ: Funkce, která se zavolá po načtení obrázků ---
function startGameLogic() {
    console.log("Starting game logic...");
    resetPuck();
    spawnBonus(); // Initial bonus spawn
    gameLoop(); // Až teď spustíme hlavní smyčku
}


// Zvuky (beze změny)
const sounds = {};
function initSounds() {
    createSound('paddle', [0.0, 0.1, 0.2, 0.3, 0.4], 0.1, 220, 0, 0.05, 0.1);
    createSound('wall', [0.0, 0.1, 0.2, 0.3, 0.4], 0.1, 180, 0, 0.05, 0.1);
    createSound('goal', [0.0, 0.2, 0.4, 0.2, 0.0], 0.3, 320, 0.1, 0.1, 0.5);
    createSound('ownGoal', [0.0, 0.2, 0.4, 0.2, 0.0], 0.3, 180, 0.1, 0.1, 0.5);
    createSound('bonus', [0.0, 0.2, 0.4, 0.6, 0.4, 0.2, 0.0], 0.2, 440, 0.05, 0.05, 0.3);
}
function createSound(name, envelope, duration, frequency, detune, delay, volume) {
    sounds[name] = { envelope, duration, frequency, detune, delay, volume };
}

// Sledování myši (beze změny)
function trackMouse(e) {
    const rect = canvas.getBoundingClientRect();
    mouseX = e.clientX - rect.left;
    mouseY = e.clientY - rect.top;
}

// Herní smyčka (beze změny, ale spustí se až po načtení obrázků)
function gameLoop() {
    if (!gameOver) {
        update();
        render();
        requestAnimationFrame(gameLoop);
    }
}

// Update game state (beze změny v logice, pouze radiusy se používají pro výpočty)
function update() {
    if (!imagesLoaded) return; // Pokud obrázky ještě nejsou načteny, nedělej nic

    const now = Date.now();

    playerPaddle.x = mouseX;
    playerPaddle.y = mouseY;
    if (playerPaddle.y - playerPaddle.radius < 0) playerPaddle.y = playerPaddle.radius;
    else if (playerPaddle.y + playerPaddle.radius > CANVAS_HEIGHT) playerPaddle.y = CANVAS_HEIGHT - playerPaddle.radius;
    if (playerPaddle.x - playerPaddle.radius < 0) playerPaddle.x = playerPaddle.radius;
    else if (playerPaddle.x + playerPaddle.radius > CANVAS_WIDTH / 2) playerPaddle.x = CANVAS_WIDTH / 2 - playerPaddle.radius;

    moveAI();

    puck.x += puck.velocityX;
    puck.y += puck.velocityY;
    puck.velocityX *= FRICTION;
    puck.velocityY *= FRICTION;

    checkCollisions();
    checkGoals();
    checkBonusCollection();

    for (let i = bonuses.length - 1; i >= 0; i--) {
        if (now - bonuses[i].spawnTime > BONUS_LIFETIME) {
            bonuses.splice(i, 1);
        }
    }

    for (let i = collectionEffects.length - 1; i >= 0; i--) {
        collectionEffects[i].alpha -= 0.05;
        collectionEffects[i].radius += 1;
        if (collectionEffects[i].alpha <= 0) {
            collectionEffects.splice(i, 1);
        }
    }

    if (playerScore >= MAX_SCORE || aiScore >= MAX_SCORE) {
        gameOver = true;
        winner = playerScore >= MAX_SCORE ? 'Player' : 'AI';
        document.getElementById('winner-message').textContent = winner + ' wins!';
        document.getElementById('game-over').classList.remove('hidden');
    }
}

// Pohyb AI (beze změny)
function moveAI() {
    if (aiFrozen) { return; }
    const effectiveSpeed = aiPaddle.speed * activeEffects.aiSlowdown;
    const dx = puck.x - aiPaddle.x;
    const dy = puck.y - aiPaddle.y;
    const distanceToPuck = Math.sqrt(dx * dx + dy * dy);
    const goalX = 0;
    const goalY = CANVAS_HEIGHT / 2;
    const goalAngle = Math.atan2(goalY - puck.y, goalX - puck.x);
    const randomOffset = Math.random() * 30 - 15;
    const puckOnAISide = puck.x > CANVAS_WIDTH / 2;
    const puckBehindAI = puck.x > aiPaddle.x;
    let targetX, targetY;
    let speedMultiplier = 1;
    let isEscapingCorner = false;
    const cornerDetectMarginX = aiPaddle.radius + puck.radius + 20;
    const cornerDetectMarginY = aiPaddle.radius + puck.radius + 20;
    const escapeTargetX = CANVAS_WIDTH - (aiPaddle.radius + puck.radius) * 2.5;
    const escapeTargetYOffset = (aiPaddle.radius + puck.radius) * 2.5;
    if (puckOnAISide && puck.x > CANVAS_WIDTH - cornerDetectMarginX && puck.y < cornerDetectMarginY) {
        if (aiPaddle.x > CANVAS_WIDTH - cornerDetectMarginX * 1.2 && aiPaddle.y < cornerDetectMarginY * 1.2) {
            if (distanceToPuck < aiPaddle.radius + puck.radius + 15 || (Math.abs(puck.velocityX) < 0.5 && Math.abs(puck.velocityY) < 0.5)) {
                isEscapingCorner = true; targetX = escapeTargetX; targetY = escapeTargetYOffset; speedMultiplier = 2.2;
            } }
    } else if (puckOnAISide && puck.x > CANVAS_WIDTH - cornerDetectMarginX && puck.y > CANVAS_HEIGHT - cornerDetectMarginY) {
        if (aiPaddle.x > CANVAS_WIDTH - cornerDetectMarginX * 1.2 && aiPaddle.y > CANVAS_HEIGHT - cornerDetectMarginY * 1.2) {
            if (distanceToPuck < aiPaddle.radius + puck.radius + 15 || (Math.abs(puck.velocityX) < 0.5 && Math.abs(puck.velocityY) < 0.5)) {
                isEscapingCorner = true; targetX = escapeTargetX; targetY = CANVAS_HEIGHT - escapeTargetYOffset; speedMultiplier = 2.2;
            } }
    }
    if (!isEscapingCorner) {
        if (puckBehindAI && puckOnAISide) {
            targetX = CANVAS_WIDTH - aiPaddle.radius - 5; targetY = puck.y; speedMultiplier = 2.5;
            targetY = Math.max(aiPaddle.radius, Math.min(CANVAS_HEIGHT - aiPaddle.radius, targetY));
        }
        else if (puckOnAISide) {
            let isDefending = false;
            if (puck.x > CANVAS_WIDTH - 180 && (puck.velocityX > 0.05 || puck.x > CANVAS_WIDTH - 100)) {
                isDefending = true; targetX = Math.max(puck.x + puck.radius, CANVAS_WIDTH - 100);
                targetX = Math.min(CANVAS_WIDTH - aiPaddle.radius, targetX); const timeToGoal = (puck.velocityX > 0.1) ? (CANVAS_WIDTH - puck.x) / puck.velocityX : 1000;
                let interceptY = puck.y + puck.velocityY * Math.min(timeToGoal, 1.0); interceptY = (interceptY + CANVAS_HEIGHT/2) / 2; targetY = interceptY;
                targetY = Math.max(aiPaddle.radius, Math.min(CANVAS_HEIGHT - aiPaddle.radius, targetY)); speedMultiplier = 1.9;
            }
            if (!isDefending) {
                const desiredOffsetX = Math.cos(goalAngle) * aiPaddle.radius * 1.2; const desiredOffsetY = Math.sin(goalAngle) * aiPaddle.radius * 1.2;
                const alignedBehind = (aiPaddle.x > puck.x - 10); const aggressionThreshold = aiPaddle.radius + puck.radius + 35;
                targetX = puck.x - desiredOffsetX; targetY = puck.y - desiredOffsetY + randomOffset; speedMultiplier = 1.2;
                if (distanceToPuck < aggressionThreshold) {
                    if (alignedBehind) {
                        targetX = puck.x + desiredOffsetX * 1.8; targetY = puck.y + desiredOffsetY * 1.8;
                        targetX = Math.max(CANVAS_WIDTH / 2 + aiPaddle.radius, Math.min(CANVAS_WIDTH - aiPaddle.radius, targetX));
                        targetY = Math.max(aiPaddle.radius, Math.min(CANVAS_HEIGHT - aiPaddle.radius, targetY)); speedMultiplier = 2.1;
                    } else { speedMultiplier = 1.7; } }
            }
        }
        else {
            targetX = CANVAS_WIDTH * 0.70; const isPuckMovingTowardsAI = puck.velocityX > 0.1; const isPuckGenerallyMoving = Math.abs(puck.velocityX) > 0.05 || Math.abs(puck.velocityY) > 0.05;
            if (isPuckMovingTowardsAI) {
                const timeToCenter = Math.max(0, (CANVAS_WIDTH / 2 - puck.x) / (puck.velocityX + 0.01)); const maxPredictTime = 1.5 * CANVAS_HEIGHT / (Math.abs(puck.velocityY) + 1);
                const effectiveTimeToCenter = Math.min(timeToCenter, maxPredictTime); let crossY = puck.y + puck.velocityY * effectiveTimeToCenter;
                let interceptX = CANVAS_WIDTH / 2 + aiPaddle.radius * 1.5; const puckFutureY = puck.y + puck.velocityY * effectiveTimeToCenter;
                if ( (puckFutureY < puck.radius && puck.velocityY < 0) || (puckFutureY > CANVAS_HEIGHT - puck.radius && puck.velocityY > 0) ) {
                    const timeToWall = (puck.velocityY < 0 ? (puck.y - puck.radius) : (CANVAS_HEIGHT - puck.radius - puck.y)) / Math.abs(puck.velocityY + 0.01);
                    if (timeToWall >= 0 && timeToWall < effectiveTimeToCenter) {
                        const xAtWall = puck.x + puck.velocityX * timeToWall; const remainingTime = effectiveTimeToCenter - timeToWall;
                        crossY = (puck.velocityY < 0 ? puck.radius : CANVAS_HEIGHT - puck.radius); crossY -= puck.velocityY * remainingTime;
                        interceptX = xAtWall + puck.velocityX * remainingTime; interceptX = Math.max(CANVAS_WIDTH / 2 + aiPaddle.radius, interceptX);
                    } }
                targetX = interceptX; targetY = crossY; speedMultiplier = 1.7;
            } else if (isPuckGenerallyMoving) { targetY = CANVAS_HEIGHT / 2 + randomOffset / 3; speedMultiplier = 1.0; }
            else { targetY = CANVAS_HEIGHT / 2; speedMultiplier = 0.8; }
        }
    }
    targetY = Math.max(aiPaddle.radius, Math.min(CANVAS_HEIGHT - aiPaddle.radius, targetY));
    targetX = Math.max(CANVAS_WIDTH / 2 + aiPaddle.radius, Math.min(CANVAS_WIDTH - aiPaddle.radius, targetX));
    const moveDx = targetX - aiPaddle.x; const moveDy = targetY - aiPaddle.y; const distanceToTarget = Math.sqrt(moveDx * moveDx + moveDy * moveDy);
    const movementThreshold = 2;
    if (distanceToTarget > movementThreshold) {
        let moveSpeed = effectiveSpeed * speedMultiplier;
        if (distanceToTarget < aiPaddle.radius * 0.5) { moveSpeed *= 0.6; }
        const normDx = moveDx / distanceToTarget; const normDy = moveDy / distanceToTarget;
        const step = Math.min(moveSpeed, distanceToTarget);
        aiPaddle.x += normDx * step; aiPaddle.y += normDy * step;
    }
    aiPaddle.y = Math.max(aiPaddle.radius, Math.min(CANVAS_HEIGHT - aiPaddle.radius, aiPaddle.y));
    aiPaddle.x = Math.max(CANVAS_WIDTH / 2 + aiPaddle.radius, Math.min(CANVAS_WIDTH - aiPaddle.radius, aiPaddle.x));
}

// Kolize (beze změny, radiusy se stále používají pro detekci)
let prevPlayerX = 0; let prevPlayerY = 0; let prevAiX = 0; let prevAiY = 0;
let paddleVelocityX = 0; let paddleVelocityY = 0; let aiPaddleVelocityX = 0; let aiPaddleVelocityY = 0;
function checkCollisions() {
    paddleVelocityX = playerPaddle.x - prevPlayerX; paddleVelocityY = playerPaddle.y - prevPlayerY;
    aiPaddleVelocityX = aiPaddle.x - prevAiX; aiPaddleVelocityY = aiPaddle.y - prevAiY;
    prevPlayerX = playerPaddle.x; prevPlayerY = playerPaddle.y;
    prevAiX = aiPaddle.x; prevAiY = aiPaddle.y;

    if (puck.y - puck.radius < 0) { puck.velocityY = Math.abs(puck.velocityY) * 1.05; puck.y = puck.radius + 1; playSound('wall'); }
    else if (puck.y + puck.radius > CANVAS_HEIGHT) { puck.velocityY = -Math.abs(puck.velocityY) * 1.05; puck.y = CANVAS_HEIGHT - puck.radius - 1; playSound('wall'); }
    const goalTopY = (CANVAS_HEIGHT - GOAL_WIDTH) / 2; const goalBottomY = (CANVAS_HEIGHT + GOAL_WIDTH) / 2;
    if ((puck.x - puck.radius < 0 && (puck.y < goalTopY || puck.y > goalBottomY)) || (puck.x + puck.radius > CANVAS_WIDTH && (puck.y < goalTopY || puck.y > goalBottomY))) {
        puck.velocityX = -puck.velocityX * 1.05; if (puck.x - puck.radius < 0) puck.x = puck.radius + 1; else if (puck.x + puck.radius > CANVAS_WIDTH) puck.x = CANVAS_WIDTH - puck.radius - 1; playSound('wall');
    }
    const playerDx = puck.x - playerPaddle.x; const playerDy = puck.y - playerPaddle.y; const playerDistance = Math.sqrt(playerDx * playerDx + playerDy * playerDy);
    if (playerDistance < puck.radius + playerPaddle.radius) {
        const stretchedDx = playerDx * 1.5; const collisionAngle = Math.atan2(playerDy, stretchedDx);
        const effectiveSpeed = puck.speed * activeEffects.playerPuckSpeed; puck.velocityX = Math.cos(collisionAngle) * effectiveSpeed + paddleVelocityX * 0.7;
        puck.velocityY = Math.sin(collisionAngle) * effectiveSpeed + paddleVelocityY * 0.4; const separation = puck.radius + playerPaddle.radius + 1;
        const overlap = (puck.radius + playerPaddle.radius) - playerDistance; puck.x += (playerDx / playerDistance) * (overlap + 1); puck.y += (playerDy / playerDistance) * (overlap + 1); playSound('paddle');
    }
    const aiDx = puck.x - aiPaddle.x; const aiDy = puck.y - aiPaddle.y; const aiDistance = Math.sqrt(aiDx * aiDx + aiDy * aiDy);
    if (aiDistance < puck.radius + aiPaddle.radius) {
        const stretchedDx = aiDx * 1.5; const collisionAngle = Math.atan2(aiDy, stretchedDx);
        const effectiveSpeed = puck.speed * activeEffects.aiPuckSpeed; puck.velocityX = Math.cos(collisionAngle) * effectiveSpeed + aiPaddleVelocityX * 0.7;
        puck.velocityY = Math.sin(collisionAngle) * effectiveSpeed + aiPaddleVelocityY * 0.4; const separation = puck.radius + aiPaddle.radius + 1;
        const overlap = (puck.radius + aiPaddle.radius) - aiDistance; puck.x += (aiDx / aiDistance) * (overlap + 1); puck.y += (aiDy / aiDistance) * (overlap + 1); playSound('paddle');
    }
}

// Góly (beze změny)
function checkGoals() {
    const goalTopY = (CANVAS_HEIGHT - GOAL_WIDTH) / 2; const goalBottomY = (CANVAS_HEIGHT + GOAL_WIDTH) / 2;
    if (puck.x + puck.radius > CANVAS_WIDTH) {
        if (puck.y > goalTopY && puck.y < goalBottomY) { playerScore++; updateScoreboard(); playSound('goal'); goalFlashAlpha = 1.0; goalSide = 'right'; resetPuck(); }
        else { puck.velocityX = -Math.abs(puck.velocityX) * 1.1; puck.x = CANVAS_WIDTH - puck.radius - 1; playSound('wall'); }
    }
    if (puck.x - puck.radius < 0) {
        if (puck.y > goalTopY && puck.y < goalBottomY) { aiScore++; updateScoreboard(); playSound('goal'); goalFlashAlpha = 1.0; goalSide = 'left'; resetPuck(); }
        else { puck.velocityX = Math.abs(puck.velocityX) * 1.1; puck.x = puck.radius + 1; playSound('wall'); }
    }
}

// Sebrání bonusu (beze změny)
function checkBonusCollection() {
    for (let i = bonuses.length - 1; i >= 0; i--) {
        const bonus = bonuses[i]; const dx = puck.x - bonus.x; const dy = puck.y - bonus.y; const distance = Math.sqrt(dx * dx + dy * dy);
        if (distance < puck.radius + bonus.radius) {
            applyBonusEffect(bonus.type); playSound('bonus');
            collectionEffects.push({ x: bonus.x, y: bonus.y, radius: bonus.radius, color: bonus.color, alpha: 0.8 });
            bonuses.splice(i, 1); setTimeout(spawnBonus, 3000);
        }
    }
}

// Aplikace efektu bonusu (změna logiky velikosti pálky je stále platná)
function applyBonusEffect(type) {
    if (effectTimers[type]) { clearTimeout(effectTimers[type]); }
    // Reset před aplikací, důležité hlavně pro velikost
    playerPaddle.radius = PADDLE_RADIUS * activeEffects.playerPaddleSize;
    aiPaddle.radius = PADDLE_RADIUS * activeEffects.aiPaddleSize;
    switch (type) {
        case 'enlargePlayerPaddle':
            activeEffects.playerPaddleSize = 1.5; playerPaddle.radius = PADDLE_RADIUS * activeEffects.playerPaddleSize;
            effectTimers[type] = setTimeout(() => { activeEffects.playerPaddleSize = 1; playerPaddle.radius = PADDLE_RADIUS; }, EFFECT_DURATION);
            break;
        case 'shrinkAiPaddle':
            activeEffects.aiPaddleSize = 0.5; aiPaddle.radius = PADDLE_RADIUS * activeEffects.aiPaddleSize;
            effectTimers[type] = setTimeout(() => { activeEffects.aiPaddleSize = 1; aiPaddle.radius = PADDLE_RADIUS; }, EFFECT_DURATION);
            break;
        case 'speedUpPlayerPuck': activeEffects.playerPuckSpeed = 1.5; effectTimers[type] = setTimeout(() => { activeEffects.playerPuckSpeed = 1; }, EFFECT_DURATION); break;
        case 'slowDownAiPuck': activeEffects.aiPuckSpeed = 0.7; effectTimers[type] = setTimeout(() => { activeEffects.aiPuckSpeed = 1; }, EFFECT_DURATION); break;
        case 'slowDownAi': activeEffects.aiSlowdown = 0.5; effectTimers[type] = setTimeout(() => { activeEffects.aiSlowdown = 1; }, EFFECT_DURATION); break;
        case 'freezeAI': aiFrozen = true; effectTimers[type] = setTimeout(() => { aiFrozen = false; }, AI_FREEZE_DURATION); break;
    }
}

// Spawn bonusu (beze změny)
function spawnBonus() {
    if (!imagesLoaded) { // Pokud obrázky nejsou načteny, zkuste to znovu později
        setTimeout(spawnBonus, 500);
        return;
    }
    if (bonuses.length < 3 && !gameOver) {
        const randomType = bonusTypes[Math.floor(Math.random() * bonusTypes.length)];
        const margin = BONUS_RADIUS * 3;
        const x = Math.random() * (CANVAS_WIDTH - margin * 2 - CANVAS_WIDTH * 0.2) + margin + CANVAS_WIDTH * 0.1;
        const y = Math.random() * (CANVAS_HEIGHT - margin * 2) + margin;
        bonuses.push({ x: x, y: y, radius: BONUS_RADIUS, type: randomType, color: bonusColors[randomType], spawnTime: Date.now() });
        setTimeout(spawnBonus, Math.random() * 8000 + 4000);
    } else if (!gameOver) {
        setTimeout(spawnBonus, 5000);
    }
}

// Reset puku (beze změny)
function resetPuck() {
    puck.x = CANVAS_WIDTH / 2; puck.y = CANVAS_HEIGHT / 2; const angle = (Math.random() * 90 - 45) * Math.PI / 180;
    const direction = Math.random() < 0.5 ? 1 : -1; puck.velocityX = Math.cos(angle) * puck.speed * direction; puck.velocityY = Math.sin(angle) * puck.speed;
}

// Update scoreboard (beze změny)
function updateScoreboard() {
    document.getElementById('player-score').textContent = playerScore;
    document.getElementById('ai-score').textContent = aiScore;
}

// Restart hry (beze změny, jen se spouští až po načtení obrázků)
function restartGame() {
    if (!imagesLoaded) return; // Nelze restartovat, pokud obrázky nejsou načteny

    playerScore = 0; aiScore = 0; gameOver = false; aiFrozen = false; bonuses = []; collectionEffects = [];
    for (const timerKey in effectTimers) { clearTimeout(effectTimers[timerKey]); }
    effectTimers = {};
    activeEffects = { playerPaddleSize: 1, aiPaddleSize: 1, playerPuckSpeed: 1, aiPuckSpeed: 1, aiSlowdown: 1 };
    playerPaddle.radius = PADDLE_RADIUS; aiPaddle.radius = PADDLE_RADIUS;
    resetPuck(); spawnBonus(); updateScoreboard(); document.getElementById('game-over').classList.add('hidden');
    // Není třeba znovu volat gameLoop, pokud už běží a jen se resetuje stav
    if (!requestAnimationFrame(gameLoop)) { // Pojistka, pokud by smyčka neběžela
        gameLoop();
    }
}

// Glow efekt (beze změny, lze použít i s obrázky)
function drawGlow(x, y, radius, baseColor, overrideColor = null) {
    //return;
    const glowColor = overrideColor || baseColor; ctx.save();
    ctx.globalAlpha = 0.25 + Math.abs(Math.sin(Date.now() / 300)) * 0.25; ctx.beginPath();
    ctx.arc(x, y, radius * 1.5, 0, Math.PI * 2); ctx.fillStyle = glowColor; ctx.shadowColor = glowColor; ctx.shadowBlur = 20; ctx.fill();
    ctx.shadowBlur = 0; ctx.restore();
}


// --- Render game objects (VELKÉ ZMĚNY) ---
function render() {
    const now = Date.now();

    // Vyčištění plátna (beze změny)
    ctx.fillStyle = '#444'; //'#D1D1D1';
    ctx.fillRect(0, 0, CANVAS_WIDTH, CANVAS_HEIGHT);

    // Středová čára a branky (beze změny)
    ctx.beginPath(); ctx.setLineDash([10, 15]); ctx.moveTo(CANVAS_WIDTH / 2, 0); ctx.lineTo(CANVAS_WIDTH / 2, CANVAS_HEIGHT); ctx.strokeStyle = '#555'; ctx.lineWidth = 2; ctx.stroke(); ctx.setLineDash([]);
    ctx.fillStyle = '#e74c3c'; ctx.fillRect(0, (CANVAS_HEIGHT - GOAL_WIDTH) / 2, GOAL_HEIGHT, GOAL_WIDTH);
    ctx.fillStyle = '#3498db'; ctx.fillRect(CANVAS_WIDTH - GOAL_HEIGHT, (CANVAS_HEIGHT - GOAL_WIDTH) / 2, GOAL_HEIGHT, GOAL_WIDTH);

    // Blesk při gólu (beze změny)
    if (goalFlashAlpha > 0) {
        ctx.fillStyle = `rgba(${goalSide === 'left' ? '231, 76, 60' : '52, 152, 219'}, ${goalFlashAlpha})`;
        ctx.fillRect(goalSide === 'left' ? 0 : CANVAS_WIDTH / 2, 0, CANVAS_WIDTH / 2, CANVAS_HEIGHT);
        goalFlashAlpha -= 0.02;
    }

    // --- Zkontrolujte, zda jsou obrázky načteny ---
    if (!imagesLoaded) {
        // Zobrazit zprávu o načítání, pokud ještě nebyla spuštěna logika hry
        ctx.fillStyle = '#fff'; ctx.font = '20px Arial'; ctx.textAlign = 'center';
        ctx.fillText('Loading assets...', CANVAS_WIDTH / 2, CANVAS_HEIGHT / 2);
        return; // Ukončit vykreslování, dokud nejsou obrázky připraveny
    }

    // --- Vykreslení bonusů pomocí obrázků ---
    bonuses.forEach(bonus => {
        const remainingTime = BONUS_LIFETIME - (now - bonus.spawnTime);
        let drawBonus = true;
        let alpha = 1.0;
        if (remainingTime < BONUS_BLINK_TIME) {
            const blinkRate = 150 + (remainingTime / BONUS_BLINK_TIME) * 200;
            if (Math.floor(now / blinkRate) % 2 === 0) { drawBonus = false; }
            alpha = 0.6 + (remainingTime / BONUS_BLINK_TIME) * 0.4;
        }

        if (drawBonus) {
            // Najděte správný obrázek pro tento typ bonusu
            const bonusImage = images.bonuses[bonus.type] || images.bonuses['generic']; // Fallback na generický

            if (bonusImage) {
                // Výpočet rozměrů a pozice pro drawImage (střed obrázku na bonus.x, bonus.y)
                const drawWidth = bonus.radius * 2; // Šířka obrázku
                const drawHeight = bonus.radius * 2; // Výška obrázku
                const drawX = bonus.x - bonus.radius; // Levý horní roh X
                const drawY = bonus.y - bonus.radius; // Levý horní roh Y

                ctx.save();
                ctx.globalAlpha = alpha;
                // Vykreslení obrázku místo kruhu a hvězdy
                ctx.drawImage(bonusImage, drawX, drawY, drawWidth, drawHeight);
                ctx.restore();
            } else {
                // Fallback: Pokud obrázek není načten, vykresli původní tvar
                ctx.save();
                ctx.globalAlpha = alpha;
                ctx.beginPath(); ctx.arc(bonus.x, bonus.y, bonus.radius, 0, Math.PI * 2); ctx.fillStyle = bonus.color; ctx.fill();
                const spikes = 5; const outerRadius = bonus.radius * 0.8; const innerRadius = bonus.radius * 0.4;
                ctx.beginPath();
                for (let i = 0; i < spikes * 2; i++) { const radius = i % 2 === 0 ? outerRadius : innerRadius; const angle = (i * Math.PI) / spikes - Math.PI / 2; const bx = bonus.x + Math.cos(angle) * radius; const by = bonus.y + Math.sin(angle) * radius; if (i === 0) ctx.moveTo(bx, by); else ctx.lineTo(bx, by); }
                ctx.closePath(); ctx.fillStyle = '#fff'; ctx.fill();
                ctx.restore();
            }
        }
    });

    // Vykreslení efektů sebrání bonusu (beze změny)
    collectionEffects.forEach(effect => {
        ctx.save(); ctx.globalAlpha = effect.alpha; ctx.beginPath(); ctx.arc(effect.x, effect.y, effect.radius, 0, Math.PI * 2);
        ctx.strokeStyle = effect.color; ctx.lineWidth = 3; ctx.shadowColor = effect.color; ctx.shadowBlur = 10; ctx.stroke(); ctx.restore();
    });

    // --- Vykreslení pálek pomocí obrázků ---
    // Hráčova pálka
    if (images.playerPaddle) {
        const currentRadius = playerPaddle.radius; // Aktuální radius (může být změněn bonusem)
        const drawWidth = currentRadius * 2;
        const drawHeight = currentRadius * 2;
        const drawX = playerPaddle.x - currentRadius;
        const drawY = playerPaddle.y - currentRadius;

        // Volitelně vykreslit glow efekt za obrázkem
        if (activeEffects.playerPaddleSize !== 1) {
            drawGlow(playerPaddle.x, playerPaddle.y, PADDLE_RADIUS, playerPaddle.color); // Glow s původním radiusem
        }
        ctx.drawImage(images.playerPaddle, drawX, drawY, drawWidth, drawHeight);
    } else { // Fallback
        ctx.beginPath(); ctx.arc(playerPaddle.x, playerPaddle.y, playerPaddle.radius, 0, Math.PI * 2); ctx.fillStyle = playerPaddle.color; ctx.fill();
    }

    // AI pálka
    if (images.aiPaddle) {
        const currentRadius = aiPaddle.radius;
        const drawWidth = currentRadius * 2;
        const drawHeight = currentRadius * 2;
        const drawX = aiPaddle.x - currentRadius;
        const drawY = aiPaddle.y - currentRadius;

        // Volitelně glow
        if (activeEffects.aiPaddleSize !== 1 || aiFrozen) {
            drawGlow(aiPaddle.x, aiPaddle.y, PADDLE_RADIUS, aiPaddle.color, aiFrozen ? bonusColors['freezeAI'] : null);
        }
        ctx.drawImage(images.aiPaddle, drawX, drawY, drawWidth, drawHeight);
    } else { // Fallback
        ctx.beginPath(); ctx.arc(aiPaddle.x, aiPaddle.y, aiPaddle.radius, 0, Math.PI * 2); ctx.fillStyle = aiPaddle.color; ctx.fill();
    }


    // --- Vykreslení puku pomocí obrázku ---
    if (images.puck) {
        const drawWidth = puck.radius * 2;
        const drawHeight = puck.radius * 2;
        const drawX = puck.x - puck.radius;
        const drawY = puck.y - puck.radius;

        // Volitelně glow
        if (activeEffects.playerPuckSpeed !== 1 || activeEffects.aiPuckSpeed !== 1) {
            drawGlow(puck.x, puck.y, puck.radius, puck.color);
        }
        ctx.drawImage(images.puck, drawX, drawY, drawWidth, drawHeight);
    } else { // Fallback
        ctx.beginPath(); ctx.arc(puck.x + 3, puck.y + 3, puck.radius, 0, Math.PI * 2); ctx.fillStyle = 'rgba(0, 0, 0, 0.3)'; ctx.fill();
        ctx.beginPath(); ctx.arc(puck.x, puck.y, puck.radius, 0, Math.PI * 2); ctx.fillStyle = puck.color; ctx.fill();
    }


    // Zobrazení aktivních efektů (beze změny)
    let effectY = 10; const effectHeight = 20;
    if (aiFrozen) { ctx.fillStyle = bonusColors['freezeAI']; ctx.fillRect(10, effectY, 5, effectHeight); ctx.fillStyle = '#fff'; ctx.font = '12px Arial'; ctx.fillText("AI Frozen", 20, effectY + 15); effectY += effectHeight + 5; }
    for (const effect in activeEffects) {
        if (activeEffects[effect] !== 1) {
            // proužek
            ctx.fillStyle = activeEffects[effect] > 1 ? '#2ecc71' : '#e74c3c'; ctx.fillRect(10, effectY, 5, effectHeight);
            //text
            ctx.fillStyle = '#fff';
            ctx.font = '12px Arial';
            ctx.fillText(formatEffectName(effect), 75, effectY + 15);
            effectY += effectHeight + 5;
        }
    }
}

// Format effect name for display (add freezeAI)
function formatEffectName(effect) {
    switch (effect) {
        case 'playerPaddleSize': return activeEffects[effect] > 1 ? 'Paddle Enlarged' : 'Paddle Shrunk';
        case 'aiPaddleSize': return activeEffects[effect] < 1 ? 'AI Paddle Shrunk' : 'AI Paddle Enlarged';
        case 'playerPuckSpeed': return activeEffects[effect] > 1 ? 'Player Hit Speed Up' : 'Player Hit Speed Down';
        case 'aiPuckSpeed': return activeEffects[effect] < 1 ? 'AI Hit Speed Slowed' : 'AI Hit Speed Sped Up';
        case 'aiSlowdown': return activeEffects[effect] < 1 ? 'AI Movement Slowed' : 'AI Movement Sped Up';
        // freezeAI handled separately in render
        default: return effect;
    }
}

// Play sound effects (with frequency variation)
function playSound(sound) {
    if (!audioContext || !sounds[sound]) {
        console.log('Playing sound:', sound); return;
    }
    const soundDef = sounds[sound];
    const oscillator = audioContext.createOscillator();
    oscillator.type = 'sine'; // Could experiment with 'triangle' or 'square'

    // --- Pitch Variation ---
    // Vary frequency for paddle and wall hits, keep others stable
    if (sound === 'paddle' || sound === 'wall') {
        oscillator.frequency.value = soundDef.frequency + (Math.random() * 30 - 15); // +/- 15 Hz variation
    } else {
        oscillator.frequency.value = soundDef.frequency;
    }
    // Original detune logic (if you prefer that)
    // oscillator.detune.value = Math.random() * soundDef.detune * 2 - soundDef.detune;

    const gainNode = audioContext.createGain(); gainNode.gain.value = 0;
    oscillator.connect(gainNode); gainNode.connect(audioContext.destination);
    const now = audioContext.currentTime + soundDef.delay; const duration = soundDef.duration;
    for (let i = 0; i < soundDef.envelope.length; i++) {
        const time = now + (i / (soundDef.envelope.length - 1)) * duration;
        // Ensure gain doesn't go below a very small positive number for setValueAtTime
        const gainValue = Math.max(0.0001, soundDef.envelope[i] * soundDef.volume);
        // Use linearRampToValueAtTime for smoother transitions between envelope points
        if (i === 0) {
            gainNode.gain.setValueAtTime(gainValue, time);
        } else {
            gainNode.gain.linearRampToValueAtTime(gainValue, time);
        }
    }
    oscillator.start(now);
    oscillator.stop(now + duration + 0.1); // Stop slightly after envelope finishes
}



// Start the game when the page loads
window.addEventListener('load', init); // Init nyní spouští načítání obrázků

    