// Coral Bay: Underworld - Wanted Level System & Police Pursuit AI
import { WANTED_LEVELS } from './config.js';

export function createPolice(fleet, city) {
  let crimePoints = 0;
  let wantedStars = 0;
  let dispatchTimer = 0;
  let escapeTimer = 0;
  let isEvading = false;
  let bustedTimer = 0;
  let isBusted = false;

  const policeVehicles = [];
  const policeOfficers = [];
  const roadblocks = [];

  function addCrime(amount) {
    crimePoints += amount;
    updateWantedLevel();
  }

  function setWantedLevel(stars) {
    wantedStars = Math.max(0, Math.min(5, stars));
    const tier = WANTED_LEVELS[wantedStars];
    crimePoints = tier.threshold;
  }

  function updateWantedLevel() {
    let newStars = 0;
    for (let i = WANTED_LEVELS.length - 1; i >= 0; i--) {
      if (crimePoints >= WANTED_LEVELS[i].threshold) {
        newStars = WANTED_LEVELS[i].level;
        break;
      }
    }
    if (newStars !== wantedStars) {
      wantedStars = newStars;
      if (wantedStars > 0) isEvading = false;
    }
  }

  function update(dt, player, onShoot, onParticle, onSound) {
    if (isBusted) return;

    // Remove destroyed or despawned police units
    for (let i = policeVehicles.length - 1; i >= 0; i--) {
      const pv = policeVehicles[i];
      if (pv.exploded) {
        policeVehicles.splice(i, 1);
        continue;
      }
      const dx = pv.x - player.x;
      const dy = pv.y - player.y;
      if (dx * dx + dy * dy > 2400 * 2400) {
        fleet.remove(pv.id);
        policeVehicles.splice(i, 1);
      }
    }

    if (wantedStars === 0) {
      // Clear remaining units
      for (const pv of policeVehicles) fleet.remove(pv.id);
      policeVehicles.length = 0;
      policeOfficers.length = 0;
      isEvading = false;
      return;
    }

    // Check if player is spotted by any cruiser
    let playerSpotted = false;
    const SPOT_DISTANCE = 550;
    const SPOT_SQ = SPOT_DISTANCE * SPOT_DISTANCE;

    for (const pv of policeVehicles) {
      const dx = player.x - pv.x;
      const dy = player.y - pv.y;
      if (dx * dx + dy * dy < SPOT_SQ) {
        playerSpotted = true;
        break;
      }
    }

    // Evading / cooldown logic
    if (!playerSpotted) {
      isEvading = true;
      escapeTimer += dt;
      if (escapeTimer >= 12.0) {
        escapeTimer = 0;
        crimePoints = Math.max(0, crimePoints - 250);
        updateWantedLevel();
        if (wantedStars > 0 && onSound) onSound('radio_chatter', player.x, player.y);
      }
    } else {
      isEvading = false;
      escapeTimer = 0;
    }

    // Check Busted condition
    if (playerSpotted && !player.isDead) {
      let closePoliceCount = 0;
      for (const pv of policeVehicles) {
        const dx = player.x - pv.x;
        const dy = player.y - pv.y;
        if (dx * dx + dy * dy < 70 * 70 && Math.abs(player.speed || (player.vehicle ? player.vehicle.speed : 0)) < 1.2) {
          closePoliceCount++;
        }
      }
      if (closePoliceCount > 0) {
        bustedTimer += dt;
        if (bustedTimer > 2.5) {
          isBusted = true;
          if (onSound) onSound('busted', player.x, player.y);
        }
      } else {
        bustedTimer = Math.max(0, bustedTimer - dt * 2);
      }
    } else {
      bustedTimer = 0;
    }

    // Dispatch new police cruisers if below wanted tier quota
    const tier = WANTED_LEVELS[wantedStars];
    dispatchTimer -= dt;

    if (dispatchTimer <= 0 && policeVehicles.length < tier.cruisers) {
      dispatchTimer = tier.dispatchDelay;
      spawnPoliceCruiser(player, fleet, city);
    }

    // Update Police Cruisers AI (aggressive pursuit, ramming, sirens)
    for (const pv of policeVehicles) {
      updatePoliceAI(pv, dt, player, fleet.vehicles, city, tier.aggressive, onParticle, onSound);
    }
  }

  function spawnPoliceCruiser(player, fleet, city) {
    // Spawn ahead or behind player on road
    const angle = Math.random() * Math.PI * 2;
    const dist = 700 + Math.random() * 350;
    const sx = player.x + Math.cos(angle) * dist;
    const sy = player.y + Math.sin(angle) * dist;

    if (sx < 550 || sx > 4500 || sy < 400 || sy > 4300) return;

    const roadNode = city.getClosestRoadNode(sx, sy);
    const cruiser = fleet.spawn('interceptor', roadNode.x, roadNode.y, 0, true);
    cruiser.sirenOn = true;
    policeVehicles.push(cruiser);
  }

  function updatePoliceAI(cruiser, dt, player, allVehicles, city, aggressive, onParticle, onSound) {
    if (cruiser.exploded) return;

    // Vector toward player
    const dx = player.x - cruiser.x;
    const dy = player.y - cruiser.y;
    const dist = Math.sqrt(dx * dx + dy * dy);
    const targetAngle = Math.atan2(dy, dx);

    // Turn toward player
    const angleDiff = normalizeAngle(targetAngle - cruiser.angle);
    const steer = Math.max(-1, Math.min(1, angleDiff * 3.5));

    let throttle = 0.85;
    if (dist < 120 && aggressive) {
      // Ram player!
      throttle = 1.0;
    } else if (dist < 60) {
      throttle = 0.2; // Box in
    }

    cruiser.update(dt, { throttle, steer, handbrake: false }, city, allVehicles, onParticle, onSound);
  }

  function normalizeAngle(a) {
    while (a > Math.PI) a -= Math.PI * 2;
    while (a < -Math.PI) a += Math.PI * 2;
    return a;
  }

  return {
    get wantedStars() { return wantedStars; },
    get crimePoints() { return crimePoints; },
    get isEvading() { return isEvading; },
    get isBusted() { return isBusted; },
    get bustedTimer() { return bustedTimer; },
    policeVehicles,
    policeOfficers,
    roadblocks,
    addCrime,
    setWantedLevel,
    update,
    clearBusted() { isBusted = false; bustedTimer = 0; },
  };
}
