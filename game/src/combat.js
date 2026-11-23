// Coral Bay: Underworld - Projectiles, Enemies, Combat & Particle Engine

export function createCombat() {
  const bullets = [];
  const enemies = [];
  const particles = [];

  function spawnBullet(bullet) {
    bullets.push({
      x: bullet.x,
      y: bullet.y,
      vx: Math.cos(bullet.angle) * bullet.speed,
      vy: Math.sin(bullet.angle) * bullet.speed,
      damage: bullet.damage,
      rangeLeft: bullet.range,
      owner: bullet.owner,
      color: bullet.color || '#ffd60a',
    });
  }

  function spawnEnemy(x, y, weaponType = 'pistol', isBoss = false) {
    enemies.push({
      id: 'en_' + Math.floor(Math.random() * 1000000),
      x,
      y,
      angle: 0,
      weaponType,
      health: isBoss ? 200 : 70,
      maxHealth: isBoss ? 200 : 70,
      isBoss,
      attackCooldown: 1.0,
      shootTimer: 0,
      isDead: false,
      deadTimer: 0,
      sightRange: 520,
      targetX: x,
      targetY: y,
    });
  }

  function spawnParticle(type, x, y, count = 1) {
    for (let i = 0; i < count; i++) {
      let vx = (Math.random() - 0.5) * 4;
      let vy = (Math.random() - 0.5) * 4;
      let life = 0.4 + Math.random() * 0.4;
      let size = 3 + Math.random() * 4;
      let color = '#ffcc00';

      if (type === 'blood') {
        color = '#cc1111';
        life = 0.5 + Math.random() * 0.5;
        size = 3 + Math.random() * 3;
      } else if (type === 'spark') {
        color = '#ffee88';
        vx *= 1.8;
        vy *= 1.8;
        life = 0.2 + Math.random() * 0.2;
        size = 2;
      } else if (type === 'smoke') {
        color = 'rgba(160, 160, 170, 0.6)';
        vy -= 1.0;
        size = 8 + Math.random() * 10;
        life = 0.6 + Math.random() * 0.6;
      } else if (type === 'fire') {
        color = Math.random() < 0.5 ? '#ff3b30' : '#ff9500';
        vy -= 1.5;
        size = 6 + Math.random() * 8;
        life = 0.3 + Math.random() * 0.3;
      } else if (type === 'explosion') {
        color = Math.random() < 0.3 ? '#ffffff' : Math.random() < 0.6 ? '#ffcc00' : '#ff3b30';
        vx = (Math.random() - 0.5) * 12;
        vy = (Math.random() - 0.5) * 12;
        size = 14 + Math.random() * 20;
        life = 0.6 + Math.random() * 0.4;
      } else if (type === 'nitro') {
        color = Math.random() < 0.5 ? '#00d2ff' : '#7928ca';
        size = 4 + Math.random() * 5;
        life = 0.25;
      } else if (type === 'skid') {
        color = 'rgba(20, 20, 25, 0.4)';
        vx = 0;
        vy = 0;
        size = 12;
        life = 1.2;
      } else if (type === 'cash_spark') {
        color = '#38ef7d';
        vx = (Math.random() - 0.5) * 5;
        vy = -2 - Math.random() * 4;
        size = 3;
        life = 0.5;
      }

      particles.push({ x, y, vx, vy, size, life, maxLife: life, color, type });
    }
  }

  function update(dt, player, city, fleet, pedestrians, police, onSound, camera) {
    // Update Particles
    for (let i = particles.length - 1; i >= 0; i--) {
      const p = particles[i];
      p.x += p.vx;
      p.y += p.vy;
      p.life -= dt;
      if (p.type === 'smoke' || p.type === 'explosion') {
        p.size += dt * 10;
      }
      if (p.life <= 0) particles.splice(i, 1);
    }

    // Update Bullets
    for (let i = bullets.length - 1; i >= 0; i--) {
      const b = bullets[i];
      b.x += b.vx;
      b.y += b.vy;
      const stepDist = Math.sqrt(b.vx * b.vx + b.vy * b.vy);
      b.rangeLeft -= stepDist;

      let hit = false;

      // Building hit
      if (city.checkCollision(b.x, b.y, 4)) {
        spawnParticle('spark', b.x, b.y, 5);
        bullets.splice(i, 1);
        continue;
      }

      // Hit Vehicles
      for (const veh of fleet.vehicles) {
        if (veh.exploded) continue;
        const vdx = b.x - veh.x;
        const vdy = b.y - veh.y;
        if (vdx * vdx + vdy * vdy < 36 * 36) {
          veh.takeDamage(b.damage, spawnParticle, onSound);
          spawnParticle('spark', b.x, b.y, 6);
          hit = true;
          // If police cruiser hit by player, raise wanted level!
          if (b.owner === 'player' && veh.isPolice) {
            police.addCrime(150);
          }
          break;
        }
      }
      if (hit) {
        bullets.splice(i, 1);
        continue;
      }

      // Hit Enemies
      if (b.owner === 'player') {
        for (const en of enemies) {
          if (en.isDead) continue;
          const edx = b.x - en.x;
          const edy = b.y - en.y;
          if (edx * edx + edy * edy < 24 * 24) {
            en.health -= b.damage;
            spawnParticle('blood', b.x, b.y, 6);
            if (onSound) onSound('hit', en.x, en.y);
            if (en.health <= 0) {
              en.isDead = true;
              player.kills++;
              player.addCash(150);
              spawnParticle('cash_spark', en.x, en.y, 8);
            }
            hit = true;
            break;
          }
        }
        if (hit) {
          bullets.splice(i, 1);
          continue;
        }

        // Hit Pedestrians
        for (const ped of pedestrians.pedestrians) {
          if (ped.isDead) continue;
          const pdx = b.x - ped.x;
          const pdy = b.y - ped.y;
          if (pdx * pdx + pdy * pdy < 20 * 20) {
            ped.health -= b.damage;
            spawnParticle('blood', b.x, b.y, 8);
            ped.isPanicked = true;
            ped.panicTimer = 8;
            if (ped.health <= 0) {
              pedestrians.killPedestrian(ped, player, spawnParticle, onSound);
              police.addCrime(120); // Murder raises wanted level!
            }
            hit = true;
            break;
          }
        }
        if (hit) {
          bullets.splice(i, 1);
          continue;
        }
      }

      // Hit Player
      if (b.owner !== 'player' && !player.isDead) {
        const pdx = b.x - player.x;
        const pdy = b.y - player.y;
        if (pdx * pdx + pdy * pdy < player.radius * player.radius) {
          player.takeDamage(b.damage);
          spawnParticle('blood', b.x, b.y, 7);
          if (camera) camera.addShake(4);
          if (onSound) onSound('hit', player.x, player.y);
          bullets.splice(i, 1);
          continue;
        }
      }

      // Range expired
      if (b.rangeLeft <= 0) {
        bullets.splice(i, 1);
      }
    }

    // Update Enemies AI
    for (let i = enemies.length - 1; i >= 0; i--) {
      const en = enemies[i];
      if (en.isDead) {
        en.deadTimer += dt;
        if (en.deadTimer > 20) enemies.splice(i, 1);
        continue;
      }

      const dx = player.x - en.x;
      const dy = player.y - en.y;
      const dist = Math.sqrt(dx * dx + dy * dy);

      if (dist < en.sightRange && !player.isDead) {
        en.angle = Math.atan2(dy, dx);

        // Move toward player if far, keep combat distance
        if (dist > 180) {
          const moveX = en.x + Math.cos(en.angle) * dt * 85;
          const moveY = en.y + Math.sin(en.angle) * dt * 85;
          if (!city.checkCollision(moveX, moveY, 16)) {
            en.x = moveX;
            en.y = moveY;
          }
        }

        // Shoot at player
        en.shootTimer += dt;
        if (en.shootTimer >= en.attackCooldown) {
          en.shootTimer = 0;
          en.attackCooldown = 0.4 + Math.random() * 0.6;

          const shootAngle = en.angle + (Math.random() - 0.5) * 0.15;
          spawnBullet({
            x: en.x + Math.cos(en.angle) * 22,
            y: en.y + Math.sin(en.angle) * 22,
            angle: shootAngle,
            speed: 26,
            damage: 18,
            range: 480,
            owner: 'enemy',
            color: '#ff3b30',
          });
          if (onSound) onSound('pistol', en.x, en.y);
        }
      }
    }
  }

  function handleMelee(player, pedestrians, enemies, fleet, onSound) {
    const range = 55;
    const punchAngle = player.angle;

    // Check hit pedestrians
    for (const ped of pedestrians.pedestrians) {
      if (ped.isDead) continue;
      const dx = ped.x - player.x;
      const dy = ped.y - player.y;
      const dist = Math.sqrt(dx * dx + dy * dy);
      if (dist < range) {
        ped.health -= 25;
        ped.x += Math.cos(punchAngle) * 18;
        ped.y += Math.sin(punchAngle) * 18;
        ped.isPanicked = true;
        ped.panicTimer = 6;
        spawnParticle('blood', ped.x, ped.y, 4);
        if (ped.health <= 0) {
          pedestrians.killPedestrian(ped, player, spawnParticle, onSound);
        }
        return;
      }
    }

    // Check hit enemies
    for (const en of enemies) {
      if (en.isDead) continue;
      const dx = en.x - player.x;
      const dy = en.y - player.y;
      const dist = Math.sqrt(dx * dx + dy * dy);
      if (dist < range) {
        en.health -= 35;
        en.x += Math.cos(punchAngle) * 22;
        en.y += Math.sin(punchAngle) * 22;
        spawnParticle('blood', en.x, en.y, 6);
        if (en.health <= 0) {
          en.isDead = true;
          player.kills++;
          player.addCash(150);
          spawnParticle('cash_spark', en.x, en.y, 8);
        }
        return;
      }
    }
  }

  return {
    bullets,
    enemies,
    particles,
    spawnBullet,
    spawnEnemy,
    spawnParticle,
    update,
    handleMelee,
  };
}
