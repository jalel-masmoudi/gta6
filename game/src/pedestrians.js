// Coral Bay: Underworld - Pedestrian AI & Population
export function createPedestrians(city) {
  const pedestrians = [];
  const cashPickups = [];
  let spawnTimer = 0;
  const MAX_PEDESTRIANS = 35;

  const PED_TYPES = [
    { type: 'tourist', shirt: '#ff6b6b', skin: '#f8d7da', speed: 2.1 },
    { type: 'beachgoer', shirt: '#48dbfb', skin: '#ffeaa7', speed: 2.3 },
    { type: 'business', shirt: '#222f3e', skin: '#f5cd79', speed: 2.0 },
    { type: 'clubber', shirt: '#f368e0', skin: '#fab1a0', speed: 2.4 },
    { type: 'enforcer', shirt: '#10ac84', skin: '#f7d794', speed: 2.5, isHostile: false },
  ];

  function update(dt, player, fleet, onSound, onParticle) {
    spawnTimer -= dt;

    // Update pedestrians
    for (let i = pedestrians.length - 1; i >= 0; i--) {
      const ped = pedestrians[i];

      // Despawn if far from player
      const dx = ped.x - player.x;
      const dy = ped.y - player.y;
      const distSq = dx * dx + dy * dy;

      if (distSq > 2000 * 2000) {
        pedestrians.splice(i, 1);
        continue;
      }

      if (ped.isDead) {
        ped.deadTimer = (ped.deadTimer || 0) + dt;
        if (ped.deadTimer > 15) {
          pedestrians.splice(i, 1);
        }
        continue;
      }

      // Check distance to player gunshots or player vehicle
      if (player.isAttacking && distSq < 450 * 450) {
        ped.isPanicked = true;
        ped.panicTimer = 6.0;
        ped.panicAngle = Math.atan2(ped.y - player.y, ped.x - player.x);
      }

      // Panic decay
      if (ped.isPanicked) {
        ped.panicTimer -= dt;
        if (ped.panicTimer <= 0) ped.isPanicked = false;
      }

      // Movement behavior
      let moveSpeed = ped.spec.speed;
      let targetAngle = ped.angle;

      if (ped.isPanicked) {
        moveSpeed = ped.spec.speed * 2.3;
        targetAngle = ped.panicAngle;
      } else {
        // Normal wander / sidewalk navigation
        ped.wanderTimer = (ped.wanderTimer || 0) - dt;
        if (ped.wanderTimer <= 0) {
          ped.wanderTimer = 3.0 + Math.random() * 4.0;
          ped.wanderAngle = Math.random() * Math.PI * 2;
        }
        targetAngle = ped.wanderAngle;
      }

      ped.angle += normalizeAngle(targetAngle - ped.angle) * Math.min(1, dt * 5.0);

      const vx = Math.cos(ped.angle) * moveSpeed;
      const vy = Math.sin(ped.angle) * moveSpeed;
      const nextX = ped.x + vx;
      const nextY = ped.y + vy;

      // Building collisions
      if (!city.checkCollision(nextX, nextY, 14)) {
        ped.x = nextX;
        ped.y = nextY;
      } else {
        ped.wanderAngle += Math.PI * 0.75;
      }

      ped.animStep += dt * moveSpeed * 3.5;

      // Check Vehicle hit collisions
      for (const veh of fleet.vehicles) {
        if (veh.exploded) continue;
        const vdx = ped.x - veh.x;
        const vdy = ped.y - veh.y;
        const vdistSq = vdx * vdx + vdy * vdy;
        const hitRadius = (veh.spec.width + veh.spec.length) * 0.25;

        if (vdistSq < hitRadius * hitRadius) {
          const vehSpeed = Math.abs(veh.speed);
          if (vehSpeed > 2.0) {
            // Hit by vehicle!
            ped.health -= vehSpeed * 25;
            ped.isPanicked = true;
            ped.panicTimer = 8;
            if (onParticle) onParticle('blood', ped.x, ped.y, 8);
            if (onSound) onSound('hit', ped.x, ped.y);

            // Push ragdoll
            ped.x += Math.cos(veh.angle) * (vehSpeed * 4);
            ped.y += Math.sin(veh.angle) * (vehSpeed * 4);

            if (ped.health <= 0) {
              killPedestrian(ped, player, onParticle, onSound);
            }
          }
        }
      }
    }

    // Update Cash Pickups
    for (let i = cashPickups.length - 1; i >= 0; i--) {
      const cp = cashPickups[i];
      cp.timer += dt;
      const dx = player.x - cp.x;
      const dy = player.y - cp.y;
      if (dx * dx + dy * dy < 38 * 38) {
        // Collect cash
        player.addCash(cp.amount);
        if (onSound) onSound('cash', cp.x, cp.y);
        if (onParticle) onParticle('cash_spark', cp.x, cp.y, 6);
        cashPickups.splice(i, 1);
      } else if (cp.timer > 45) {
        cashPickups.splice(i, 1);
      }
    }

    // Spawn new pedestrians
    if (spawnTimer <= 0 && pedestrians.length < MAX_PEDESTRIANS) {
      spawnTimer = 0.8;
      trySpawnPedestrian(player, city);
    }
  }

  function trySpawnPedestrian(player, city) {
    const angle = Math.random() * Math.PI * 2;
    const dist = 550 + Math.random() * 450;
    const sx = player.x + Math.cos(angle) * dist;
    const sy = player.y + Math.sin(angle) * dist;

    if (city.checkCollision(sx, sy, 14)) return;

    const spec = PED_TYPES[Math.floor(Math.random() * PED_TYPES.length)];
    pedestrians.push({
      id: 'ped_' + Math.floor(Math.random() * 1000000),
      x: sx,
      y: sy,
      angle: Math.random() * Math.PI * 2,
      spec,
      health: 45,
      isDead: false,
      isPanicked: false,
      panicTimer: 0,
      panicAngle: 0,
      wanderTimer: 2,
      wanderAngle: Math.random() * Math.PI * 2,
      animStep: Math.random() * 10,
    });
  }

  function killPedestrian(ped, player, onParticle, onSound) {
    ped.isDead = true;
    ped.health = 0;
    // Drop cash pickup
    const cashVal = 30 + Math.floor(Math.random() * 120);
    cashPickups.push({
      x: ped.x,
      y: ped.y,
      amount: cashVal,
      timer: 0,
    });
  }

  function normalizeAngle(a) {
    while (a > Math.PI) a -= Math.PI * 2;
    while (a < -Math.PI) a += Math.PI * 2;
    return a;
  }

  return {
    pedestrians,
    cashPickups,
    update,
    killPedestrian,
  };
}
