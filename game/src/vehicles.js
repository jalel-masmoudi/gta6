// Coral Bay: Underworld - Vehicle Physics, Collision & Fleet Management
import { VEHICLE_TYPES } from './config.js';

export function createVehicle(typeKey, x, y, angle = 0, isPolice = false) {
  const spec = VEHICLE_TYPES[typeKey] || VEHICLE_TYPES.stallion;
  return {
    id: 'veh_' + Math.floor(Math.random() * 1000000),
    type: typeKey,
    spec,
    x,
    y,
    angle,
    speed: 0,
    steerAngle: 0,
    angularVelocity: 0,
    health: spec.health,
    maxHealth: spec.health,
    isBurning: false,
    exploded: false,
    isPolice: isPolice || spec.hasSiren || false,
    sirenOn: isPolice || false,
    sirenTimer: 0,
    driver: null,
    isPlayerVehicle: false,
    nitro: 100,
    nitroActive: false,
    skidTimer: 0,
    isDrifting: false,
    lastHonk: 0,
    headlights: true,
    smokeTimer: 0,

    update(dt, input, city, vehicles, onParticle, onSound) {
      if (this.exploded) return;

      // Handle Fire & Burning state
      if (this.health <= 0 && !this.exploded) {
        this.exploded = true;
        this.speed = 0;
        if (onParticle) {
          onParticle('explosion', this.x, this.y, 40);
        }
        if (onSound) onSound('explosion', this.x, this.y);
        return;
      }

      if (this.health < this.maxHealth * 0.3) {
        this.isBurning = true;
        this.health -= dt * 15; // Burn down
        this.smokeTimer += dt;
        if (this.smokeTimer > 0.08) {
          this.smokeTimer = 0;
          if (onParticle) onParticle('fire', this.x - Math.cos(this.angle) * 20, this.y - Math.sin(this.angle) * 20, 3);
        }
      } else if (this.health < this.maxHealth * 0.6) {
        this.smokeTimer += dt;
        if (this.smokeTimer > 0.12) {
          this.smokeTimer = 0;
          if (onParticle) onParticle('smoke', this.x - Math.cos(this.angle) * 25, this.y - Math.sin(this.angle) * 25, 2);
        }
      }

      // Input handling (throttle, brake, steer, handbrake, nitro)
      let throttle = 0;
      let steer = 0;
      let handbrake = false;
      let nitroTrigger = false;

      if (input) {
        throttle = input.throttle || 0;
        steer = input.steer || 0;
        handbrake = input.handbrake || false;
        nitroTrigger = input.nitro && this.nitro > 5;
      }

      // Nitro boost
      if (nitroTrigger && throttle > 0) {
        this.nitroActive = true;
        this.nitro = Math.max(0, this.nitro - dt * 35);
        throttle *= 1.45;
        if (onParticle) {
          const backX = this.x - Math.cos(this.angle) * (this.spec.length / 2);
          const backY = this.y - Math.sin(this.angle) * (this.spec.length / 2);
          onParticle('nitro', backX, backY, 2);
        }
      } else {
        this.nitroActive = false;
        this.nitro = Math.min(100, this.nitro + dt * 12);
      }

      // Acceleration and Braking
      if (throttle > 0) {
        const top = this.nitroActive ? this.spec.maxSpeed * 1.35 : this.spec.maxSpeed;
        this.speed += this.spec.accel * throttle;
        if (this.speed > top) this.speed = top;
      } else if (throttle < 0) {
        if (this.speed > 0.5) {
          this.speed -= this.spec.accel * 1.5; // Strong foot braking
        } else {
          this.speed -= this.spec.accel * 0.6; // Reverse
          if (this.speed < -this.spec.reverseSpeed) this.speed = -this.spec.reverseSpeed;
        }
      }

      // Handbrake drift & friction
      let currentFriction = this.spec.friction;
      if (handbrake) {
        currentFriction = this.spec.driftFriction;
        this.speed *= 0.985;
        this.isDrifting = Math.abs(this.speed) > 4;
        if (this.isDrifting) {
          this.skidTimer += dt;
          if (this.skidTimer > 0.05) {
            this.skidTimer = 0;
            if (onParticle) onParticle('skid', this.x, this.y, 2);
            if (onSound && Math.random() < 0.25) onSound('screech', this.x, this.y);
          }
        }
      } else {
        this.isDrifting = false;
      }

      // Steering
      if (Math.abs(this.speed) > 0.2) {
        const speedScale = Math.min(1.0, Math.max(0.35, 1.0 - (Math.abs(this.speed) / this.spec.maxSpeed) * 0.45));
        const dir = this.speed >= 0 ? 1 : -1;
        this.steerAngle = steer * this.spec.handling * speedScale * (handbrake ? 1.6 : 1.0);
        this.angle += this.steerAngle * dir;
      } else {
        this.steerAngle = 0;
      }

      // Apply drag friction
      this.speed *= currentFriction;
      if (Math.abs(this.speed) < 0.05) this.speed = 0;

      // Move vehicle
      const vx = Math.cos(this.angle) * this.speed;
      const vy = Math.sin(this.angle) * this.speed;
      const nextX = this.x + vx;
      const nextY = this.y + vy;

      // Building Collisions
      const radius = this.spec.width * 0.5;
      let hitBuilding = false;

      for (let i = 0; i < city.buildings.length; i++) {
        const b = city.buildings[i];
        const res = city.resolveCircleBoxCollision(nextX, nextY, radius + 8, b.x, b.y, b.w, b.h);
        if (res.collided) {
          hitBuilding = true;
          this.x += res.pushX * 1.2;
          this.y += res.pushY * 1.2;

          // Impact damage & speed reduction
          const impact = Math.abs(this.speed);
          if (impact > 3) {
            this.health -= impact * 8;
            if (onSound) onSound('crash', this.x, this.y);
            if (onParticle) onParticle('spark', this.x, this.y, 8);
          }
          this.speed = -this.speed * 0.35;
          break;
        }
      }

      if (!hitBuilding) {
        this.x = nextX;
        this.y = nextY;
      }

      // Keep within map boundaries
      this.x = Math.max(460, Math.min(city.roads[0].bounds.w ? 4700 : 4700, this.x));
      this.y = Math.max(250, Math.min(4600, this.y));

      // Vehicle vs Vehicle Collisions
      for (let i = 0; i < vehicles.length; i++) {
        const other = vehicles[i];
        if (other === this || other.exploded) continue;

        const dx = other.x - this.x;
        const dy = other.y - this.y;
        const distSq = dx * dx + dy * dy;
        const minDist = (this.spec.width + other.spec.width) * 0.55;

        if (distSq < minDist * minDist && distSq > 0.001) {
          const dist = Math.sqrt(distSq);
          const overlap = minDist - dist;
          const nx = dx / dist;
          const ny = dy / dist;

          // Push apart
          this.x -= nx * overlap * 0.55;
          this.y -= ny * overlap * 0.55;
          other.x += nx * overlap * 0.55;
          other.y += ny * overlap * 0.55;

          // Momentum transfer
          const relSpeed = Math.abs(this.speed - other.speed);
          if (relSpeed > 2.5) {
            const dmg = relSpeed * 6;
            this.health -= dmg;
            other.health -= dmg;
            if (onSound) onSound('crash', this.x, this.y);
            if (onParticle) onParticle('spark', (this.x + other.x) / 2, (this.y + other.y) / 2, 6);
          }
          const avgSpeed = (this.speed + other.speed) * 0.5;
          this.speed = avgSpeed * 0.6;
          other.speed = avgSpeed * 0.6;
        }
      }

      // Siren animation timer
      if (this.isPolice && this.sirenOn) {
        this.sirenTimer = (this.sirenTimer + dt * 8) % (Math.PI * 2);
      }
    },

    takeDamage(amount, onParticle, onSound) {
      if (this.exploded) return;
      this.health -= amount;
      if (onParticle) onParticle('spark', this.x, this.y, 4);
      if (this.health <= 0) {
        this.exploded = true;
        this.speed = 0;
        if (onParticle) onParticle('explosion', this.x, this.y, 40);
        if (onSound) onSound('explosion', this.x, this.y);
      }
    },
  };
}

export function createFleet() {
  const vehicles = [];

  function spawn(typeKey, x, y, angle = 0, isPolice = false) {
    const v = createVehicle(typeKey, x, y, angle, isPolice);
    vehicles.push(v);
    return v;
  }

  function remove(id) {
    const index = vehicles.findIndex((v) => v.id === id);
    if (index !== -1) vehicles.splice(index, 1);
  }

  function getNearbyVehicle(x, y, maxDist = 95) {
    let closest = null;
    let closestDistSq = maxDist * maxDist;
    for (let i = 0; i < vehicles.length; i++) {
      const v = vehicles[i];
      if (v.exploded) continue;
      const dx = v.x - x;
      const dy = v.y - y;
      const distSq = dx * dx + dy * dy;
      if (distSq < closestDistSq) {
        closestDistSq = distSq;
        closest = v;
      }
    }
    return closest;
  }

  return {
    vehicles,
    spawn,
    remove,
    getNearbyVehicle,
  };
}
