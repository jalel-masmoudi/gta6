// Coral Bay: Underworld - Main Game Loop, Boot & State Machine
import { GAME_TITLE, STEP, MAX_FRAME } from './config.js';
import { createCamera } from './camera.js';
import { createCity } from './city.js';
import { createFleet } from './vehicles.js';
import { createPlayer } from './player.js';
import { createTraffic } from './traffic.js';
import { createPedestrians } from './pedestrians.js';
import { createPolice } from './police.js';
import { createCombat } from './combat.js';
import { createMissionManager } from './missions.js';
import { createAudio } from './audio.js';
import { createHUD } from './hud.js';
import { createSaveSystem } from './save.js';
import { createInput } from './input.js';
import { createRenderer } from './renderer.js';
import { stageShot } from './shots.js';

const SCREEN_TITLE = 'title';
const SCREEN_PLAY = 'play';
const SCREEN_PAUSED = 'paused';
const GAME_VERSION = '1.0.0';

const canvas = document.getElementById('game');
const statusElem = document.getElementById('status');

// Setup Canvas Size
function resizeCanvas() {
  canvas.width = window.innerWidth || 1280;
  canvas.height = window.innerHeight || 720;
}
window.addEventListener('resize', resizeCanvas);
resizeCanvas();

// Instantiate Engine Subsystems
const camera = createCamera();
const city = createCity();
const fleet = createFleet();
const player = createPlayer(620, 850);
const traffic = createTraffic(fleet, city);
const pedestrians = createPedestrians(city);
const police = createPolice(fleet, city);
const combat = createCombat();
const missions = createMissionManager(combat, fleet, police);
const audio = createAudio();
const hud = createHUD();
const saveSystem = createSaveSystem();
const input = createInput(canvas, camera);
const renderer = createRenderer(canvas);

// Check Query Parameters for Deterministic Screenshots (?shot=...)
const params = new URLSearchParams(window.location.search);
const shotName = params.get('shot');

const gameState = {
  player,
  city,
  fleet,
  combat,
  pedestrians,
  police,
  missions,
  audio,
  camera,
};

function runScreenshotMode(name) {
  stageShot(name, gameState);

  let frameCount = 0;
  function paintShot() {
    renderer.render(gameState, camera, canvas.width, canvas.height);
    hud.render(canvas.getContext('2d'), canvas.width, canvas.height, gameState);
    frameCount++;
    if (frameCount < 3) {
      requestAnimationFrame(paintShot);
    } else {
      window.__shotReady = true;
    }
  }
  requestAnimationFrame(paintShot);
}

function runInteractiveGame() {
  let screen = SCREEN_TITLE;
  let accumulator = 0;
  let lastTime = performance.now();
  let titlePanTimer = 0;

  // Try loading save data
  const savedData = saveSystem.load();
  if (savedData) {
    missions.loadProgress(savedData.missions?.completedMissions);
  }

  function startNewGame() {
    audio.init();
    screen = SCREEN_PLAY;
    missions.startMission(0);
    announce('Welcome to Coral Bay. Move with WASD, attack with Click/Space, enter cars with E.');
  }

  function announce(msg) {
    if (statusElem) statusElem.textContent = msg;
  }

  function updateGame(dt, currentInput) {
    // If Busted or Wasted, handle timers
    if (police.isBusted) {
      if (currentInput.attack || currentInput.enterVehicle) {
        police.clearBusted();
        player.respawn(640, 850);
        police.setWantedLevel(0);
      }
      return;
    }

    if (player.isDead) {
      if (currentInput.attack || currentInput.enterVehicle) {
        player.respawn(640, 850);
        police.setWantedLevel(0);
      }
      return;
    }

    // Toggle radio
    if (currentInput.radio && player.inVehicle) {
      const station = audio.cycleRadio();
      missions.setDialogue('RADIO', `Tuned to ${station.name} (${station.genre})`, 3.0);
    }

    // Player Update
    player.update(
      dt,
      currentInput,
      city,
      fleet,
      (bullet) => {
        combat.spawnBullet(bullet);
        if (bullet.owner === 'player' && Math.random() < 0.25) {
          police.addCrime(25); // Discharging firearms alerts police
        }
      },
      (p) => combat.handleMelee(p, pedestrians, combat.enemies, fleet, audio.playSound),
      audio.playSound
    );

    // Fleet Vehicles Update
    for (let i = fleet.vehicles.length - 1; i >= 0; i--) {
      const veh = fleet.vehicles[i];
      if (veh.isPlayerVehicle) {
        veh.update(dt, currentInput, city, fleet.vehicles, combat.spawnParticle, audio.playSound);
      }
    }

    // Traffic Simulation Update
    traffic.update(dt, player, combat.spawnParticle, audio.playSound);

    // Pedestrians Update
    pedestrians.update(dt, player, fleet, audio.playSound, combat.spawnParticle);

    // Police & Wanted System Update
    police.update(dt, player, combat.spawnBullet, combat.spawnParticle, audio.playSound);

    // Combat & Projectiles Update
    combat.update(dt, player, city, fleet, pedestrians, police, audio.playSound, camera);

    // Story Missions Update
    missions.update(dt, player, audio.playSound);

    // Camera follow target (player on foot or vehicle)
    const targetX = player.inVehicle && player.vehicle ? player.vehicle.x : player.x;
    const targetY = player.inVehicle && player.vehicle ? player.vehicle.y : player.y;
    const speed = player.inVehicle && player.vehicle ? Math.abs(player.vehicle.speed) : player.speed;
    camera.update(dt, targetX, targetY, speed);

    // Audio Continuous Synths
    if (player.inVehicle && player.vehicle) {
      audio.updateEngine(player.vehicle.speed, player.vehicle.spec.maxSpeed, true);
      audio.updateRadio(dt, true);
    } else {
      audio.updateEngine(0, 10, false);
    }
    audio.updateSirens(police.policeVehicles.length);
  }

  function renderTitleScreen(ctx, width, height) {
    titlePanTimer += 0.008;
    camera.x = 1800 + Math.sin(titlePanTimer) * 600;
    camera.y = 1200 + Math.cos(titlePanTimer) * 400;
    camera.zoom = 0.85;

    renderer.render(gameState, camera, width, height);

    // Dark gradient overlay
    ctx.fillStyle = 'rgba(10, 14, 22, 0.72)';
    ctx.fillRect(0, 0, width, height);

    // Stylized Logo
    ctx.save();
    ctx.textAlign = 'center';
    ctx.font = '900 68px sans-serif';
    ctx.fillStyle = '#ff7b54';
    ctx.shadowColor = '#ea0599';
    ctx.shadowBlur = 25;
    ctx.fillText('CORAL BAY', width / 2, height / 2 - 80);

    ctx.font = 'bold 36px sans-serif';
    ctx.fillStyle = '#00f5d4';
    ctx.shadowColor = '#00f5d4';
    ctx.shadowBlur = 15;
    ctx.fillText('UNDERWORLD', width / 2, height / 2 - 25);
    ctx.restore();

    // Start Button Prompt
    const pulse = 0.75 + Math.sin(Date.now() * 0.006) * 0.25;
    ctx.save();
    ctx.textAlign = 'center';
    ctx.font = 'bold 22px sans-serif';
    ctx.fillStyle = `rgba(255, 255, 255, ${pulse})`;
    ctx.fillText('PRESS SPACE OR CLICK TO PLAY', width / 2, height / 2 + 55);

    // Controls summary
    ctx.font = '14px sans-serif';
    ctx.fillStyle = '#94a3b8';
    ctx.fillText('WASD: Walk / Drive  |  Shift: Sprint / Nitro  |  E/F: Steal Car  |  Click: Shoot/Punch  |  1-4: Weapons', width / 2, height / 2 + 105);
    ctx.fillText('City of Coral Bay • Open World • Missions • Police Pursuits • 100% Offline', width / 2, height / 2 + 130);
    ctx.restore();
  }

  function frame(now) {
    requestAnimationFrame(frame);
    accumulator += Math.min((now - lastTime) / 1000, MAX_FRAME);
    lastTime = now;

    const currentInput = input.poll(player, canvas.width, canvas.height);

    if (screen === SCREEN_TITLE) {
      if (currentInput.attack || currentInput.enterVehicle || currentInput.throttle) {
        startNewGame();
      }
      renderTitleScreen(canvas.getContext('2d'), canvas.width, canvas.height);
      return;
    }

    if (currentInput.pause) {
      screen = screen === SCREEN_PLAY ? SCREEN_PAUSED : SCREEN_PLAY;
    }

    if (screen === SCREEN_PLAY) {
      while (accumulator >= STEP) {
        updateGame(STEP, currentInput);
        accumulator -= STEP;
      }
    } else {
      accumulator = 0;
    }

    // Render 3D World & HUD
    renderer.render(gameState, camera, canvas.width, canvas.height);
    hud.render(canvas.getContext('2d'), canvas.width, canvas.height, gameState);

    if (screen === SCREEN_PAUSED) {
      const ctx = canvas.getContext('2d');
      ctx.fillStyle = 'rgba(0, 0, 0, 0.65)';
      ctx.fillRect(0, 0, canvas.width, canvas.height);
      ctx.font = 'bold 48px sans-serif';
      ctx.textAlign = 'center';
      ctx.fillStyle = '#ffffff';
      ctx.fillText('GAME PAUSED', canvas.width / 2, canvas.height / 2 - 20);
      ctx.font = '18px sans-serif';
      ctx.fillStyle = '#94a3b8';
      ctx.fillText('Press ESC or TAB to Resume', canvas.width / 2, canvas.height / 2 + 25);
    }
  }

  requestAnimationFrame(frame);
}

if (shotName) {
  runScreenshotMode(shotName);
} else {
  runInteractiveGame();
}
