// Coral Bay: Underworld - Ambient Traffic Simulation
import { createVehicle } from './vehicles.js';

export function createTraffic(fleet, city) {
  const civilianVehicles = [];
  let spawnCooldown = 0;
  const MAX_CIVILIAN_CARS = 20;

  const vehicleTypes = ['stallion', 'vindicator', 'cargo', 'venom', 'stallion'];

  function update(dt, player, onParticle, onSound) {
    spawnCooldown -= dt;

    // Remove civilian cars that were stolen or destroyed
    for (let i = civilianVehicles.length - 1; i >= 0; i--) {
      const cv = civilianVehicles[i];
      if (cv.isPlayerVehicle || cv.exploded) {
        civilianVehicles.splice(i, 1);
        continue;
      }
      // Despawn if too far from player
      const dx = cv.x - player.x;
      const dy = cv.y - player.y;
      if (dx * dx + dy * dy > 2200 * 2200) {
        fleet.remove(cv.id);
        civilianVehicles.splice(i, 1);
        continue;
      }

      // AI Drive logic
      updateCivilianAI(cv, dt, player, fleet.vehicles, city);
    }

    // Spawn new ambient vehicles near player along road lanes
    if (spawnCooldown <= 0 && civilianVehicles.length < MAX_CIVILIAN_CARS) {
      spawnCooldown = 1.0;
      trySpawnTrafficCar(player, fleet, city);
    }
  }

  function trySpawnTrafficCar(player, fleet, city) {
    // Pick a road near the player but off-screen
    const angle = Math.random() * Math.PI * 2;
    const dist = 750 + Math.random() * 450;
    const targetX = player.x + Math.cos(angle) * dist;
    const targetY = player.y + Math.sin(angle) * dist;

    // Clamp to map
    if (targetX < 550 || targetX > 4500 || targetY < 400 || targetY > 4300) return;

    // Find nearest road lane
    const nearest = city.getClosestRoadNode(targetX, targetY);
    let spawnX = nearest.x;
    let spawnY = nearest.y;
    let spawnAngle = 0;

    if (nearest.dir === 'ns') {
      // 2 lanes: Right lane goes South (Math.PI/2), Left lane goes North (-Math.PI/2)
      const goSouth = Math.random() < 0.5;
      spawnX = nearest.x + (goSouth ? 35 : -35);
      spawnY = targetY;
      spawnAngle = goSouth ? Math.PI / 2 : -Math.PI / 2;
    } else {
      // East-West: Right lane goes East (0), Left goes West (Math.PI)
      const goEast = Math.random() < 0.5;
      spawnX = targetX;
      spawnY = nearest.y + (goEast ? 35 : -35);
      spawnAngle = goEast ? 0 : Math.PI;
    }

    // Check if spawn position is clear
    if (city.checkCollision(spawnX, spawnY, 35)) return;
    for (const v of fleet.vehicles) {
      const dsq = (v.x - spawnX) ** 2 + (v.y - spawnY) ** 2;
      if (dsq < 130 * 130) return; // Too close to existing vehicle
    }

    const typeKey = vehicleTypes[Math.floor(Math.random() * vehicleTypes.length)];
    const veh = fleet.spawn(typeKey, spawnX, spawnY, spawnAngle, false);
    veh.speed = veh.spec.maxSpeed * (0.55 + Math.random() * 0.25);
    veh.targetAngle = spawnAngle;
    veh.driver = { isCivilian: true, panic: false };
    civilianVehicles.push(veh);
  }

  function updateCivilianAI(veh, dt, player, allVehicles, city) {
    if (!veh.driver || veh.isPlayerVehicle) return;

    // Check for obstacles ahead (cars, player, intersections)
    const forwardX = Math.cos(veh.angle);
    const forwardY = Math.sin(veh.angle);
    const lookAheadDist = 110 + veh.speed * 8;
    let shouldBrake = false;

    // Distance to player
    const toPlayerX = player.x - veh.x;
    const toPlayerY = player.y - veh.y;
    const distToPlayerSq = toPlayerX * toPlayerX + toPlayerY * toPlayerY;

    // If player is right ahead in vehicle or on foot, slow down!
    if (distToPlayerSq < lookAheadDist * lookAheadDist) {
      const dot = (toPlayerX * forwardX + toPlayerY * forwardY) / Math.sqrt(distToPlayerSq);
      if (dot > 0.65) {
        shouldBrake = true;
      }
    }

    // Check other vehicles ahead in same lane
    for (const other of allVehicles) {
      if (other === veh || other.exploded) continue;
      const dx = other.x - veh.x;
      const dy = other.y - veh.y;
      const dsq = dx * dx + dy * dy;
      if (dsq < lookAheadDist * lookAheadDist) {
        const dot = (dx * forwardX + dy * forwardY) / Math.sqrt(dsq);
        if (dot > 0.7) {
          shouldBrake = true;
          break;
        }
      }
    }

    // Throttle / Brake controls
    const targetCruiseSpeed = veh.spec.maxSpeed * 0.6;
    let throttle = 0;

    if (shouldBrake) {
      throttle = -0.8; // Brake
    } else if (veh.speed < targetCruiseSpeed) {
      throttle = 0.65;
    }

    // Keep car aligned with road lane
    let steer = 0;
    const angleDiff = normalizeAngle(veh.targetAngle - veh.angle);
    steer = Math.max(-1, Math.min(1, angleDiff * 3.0));

    // Turn at intersections with low probability
    for (const inter of city.intersections) {
      const dx = inter.x - veh.x;
      const dy = inter.y - veh.y;
      if (dx * dx + dy * dy < 50 * 50 && Math.random() < 0.015) {
        // Switch direction
        const turns = [0, Math.PI / 2, -Math.PI / 2, Math.PI];
        veh.targetAngle = turns[Math.floor(Math.random() * turns.length)];
      }
    }

    veh.update(dt, { throttle, steer, handbrake: false }, city, allVehicles);
  }

  function normalizeAngle(a) {
    while (a > Math.PI) a -= Math.PI * 2;
    while (a < -Math.PI) a += Math.PI * 2;
    return a;
  }

  return {
    civilianVehicles,
    update,
  };
}
