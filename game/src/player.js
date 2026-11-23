// Coral Bay: Underworld - Player Controller & Progression
import { WEAPON_TYPES } from './config.js';

export function createPlayer(startX = 640, startY = 850) {
  return {
    name: 'Jax Vance',
    x: startX,
    y: startY,
    angle: 0,
    speed: 0,
    walkSpeed: 3.8,
    sprintSpeed: 6.2,
    radius: 18,
    health: 100,
    maxHealth: 100,
    armor: 100,
    maxArmor: 100,
    cash: 2500,
    respect: 10,

    // Vehicle state
    inVehicle: false,
    vehicle: null,
    enterCooldown: 0,

    // Combat & Inventory
    weapons: ['fists', 'pistol', 'smg', 'rifle'],
    selectedWeaponIndex: 1, // Start with Hawk .45
    ammo: {
      fists: Infinity,
      pistol: 72,
      smg: 150,
      rifle: 90,
    },
    magAmmo: {
      fists: Infinity,
      pistol: 12,
      smg: 30,
      rifle: 30,
    },
    attackCooldown: 0,
    isAttacking: false,
    attackTimer: 0,
    isAiming: false,
    animStep: 0,
    isDead: false,

    // Stats tracking
    kills: 0,
    carsStolen: 0,
    missionsCompleted: 0,

    get currentWeapon() {
      const key = this.weapons[this.selectedWeaponIndex] || 'fists';
      return WEAPON_TYPES[key];
    },

    update(dt, input, city, fleet, onShoot, onMelee, onSound) {
      if (this.isDead) return;

      this.enterCooldown = Math.max(0, this.enterCooldown - dt);
      this.attackCooldown = Math.max(0, this.attackCooldown - dt);
      if (this.attackTimer > 0) {
        this.attackTimer -= dt;
        if (this.attackTimer <= 0) this.isAttacking = false;
      }

      // Enter / Exit Vehicle toggle (E, F, or Enter)
      if (input.enterVehicle && this.enterCooldown <= 0) {
        this.enterCooldown = 0.5;
        if (this.inVehicle) {
          this.exitVehicle(city);
        } else {
          const targetVeh = fleet.getNearbyVehicle(this.x, this.y, 95);
          if (targetVeh && !targetVeh.exploded) {
            this.enterCar(targetVeh);
          }
        }
      }

      // Weapon selection (1, 2, 3, 4 or cycle)
      if (input.weaponIndex !== undefined && input.weaponIndex >= 0 && input.weaponIndex < this.weapons.length) {
        this.selectedWeaponIndex = input.weaponIndex;
      } else if (input.nextWeapon) {
        this.selectedWeaponIndex = (this.selectedWeaponIndex + 1) % this.weapons.length;
      }

      // If in vehicle, follow vehicle
      if (this.inVehicle && this.vehicle) {
        if (this.vehicle.exploded) {
          // Ejected from burning/exploding car
          this.exitVehicle(city);
          this.takeDamage(45);
          return;
        }
        this.x = this.vehicle.x;
        this.y = this.vehicle.y;
        this.angle = this.vehicle.angle;
        return;
      }

      // On foot movement
      const moveX = input.moveX || 0;
      const moveY = input.moveY || 0;
      const isMoving = moveX !== 0 || moveY !== 0;
      const isSprinting = input.sprint && isMoving;

      // Aiming direction (toward mouse or movement)
      if (input.aimAngle !== undefined) {
        this.angle = input.aimAngle;
        this.isAiming = input.aiming || false;
      } else if (isMoving) {
        this.angle = Math.atan2(moveY, moveX);
      }

      if (isMoving) {
        const moveAngle = Math.atan2(moveY, moveX);
        const currentSpeed = isSprinting ? this.sprintSpeed : this.walkSpeed;
        const vx = Math.cos(moveAngle) * currentSpeed;
        const vy = Math.sin(moveAngle) * currentSpeed;

        const nextX = this.x + vx;
        const nextY = this.y + vy;

        // Collision with buildings
        let canMoveX = true;
        let canMoveY = true;

        for (let i = 0; i < city.buildings.length; i++) {
          const b = city.buildings[i];
          if (city.resolveCircleBoxCollision(nextX, this.y, this.radius, b.x, b.y, b.w, b.h).collided) {
            canMoveX = false;
          }
          if (city.resolveCircleBoxCollision(this.x, nextY, this.radius, b.x, b.y, b.w, b.h).collided) {
            canMoveY = false;
          }
        }

        if (canMoveX) this.x = nextX;
        if (canMoveY) this.y = nextY;

        // Keep within map
        this.x = Math.max(460, Math.min(4700, this.x));
        this.y = Math.max(250, Math.min(4600, this.y));

        this.animStep += dt * (isSprinting ? 12 : 7);
      }

      // Combat actions (attack / shoot)
      if (input.attack && this.attackCooldown <= 0) {
        this.performAttack(onShoot, onMelee, onSound);
      }
    },

    performAttack(onShoot, onMelee, onSound) {
      const weapon = this.currentWeapon;
      if (weapon.id === 'fists') {
        this.attackCooldown = weapon.fireRate;
        this.isAttacking = true;
        this.attackTimer = 0.22;
        if (onMelee) onMelee(this);
        if (onSound) onSound('punch', this.x, this.y);
      } else {
        // Firearm
        if (this.ammo[weapon.id] > 0) {
          this.ammo[weapon.id]--;
          this.attackCooldown = weapon.fireRate;
          this.isAttacking = true;
          this.attackTimer = 0.12;

          const spread = (Math.random() - 0.5) * (weapon.spread || 0.05);
          const shootAngle = this.angle + spread;
          const spawnDist = this.radius + 15;
          const bulletX = this.x + Math.cos(this.angle) * spawnDist;
          const bulletY = this.y + Math.sin(this.angle) * spawnDist;

          if (onShoot) {
            onShoot({
              x: bulletX,
              y: bulletY,
              angle: shootAngle,
              speed: weapon.bulletSpeed,
              damage: weapon.damage,
              range: weapon.range,
              owner: 'player',
              color: weapon.color,
            });
          }
          if (onSound) onSound(weapon.id, this.x, this.y);
        } else {
          // Dry fire click
          if (onSound) onSound('click', this.x, this.y);
          this.attackCooldown = 0.3;
        }
      }
    },

    enterCar(vehicle) {
      this.inVehicle = true;
      this.vehicle = vehicle;
      vehicle.driver = this;
      vehicle.isPlayerVehicle = true;
      this.x = vehicle.x;
      this.y = vehicle.y;
      this.carsStolen++;
    },

    exitVehicle(city) {
      if (!this.vehicle) return;
      // Position player next to vehicle driver side
      const exitDist = this.vehicle.spec.width * 0.75 + 25;
      const exitAngle = this.vehicle.angle - Math.PI / 2;
      let exitX = this.vehicle.x + Math.cos(exitAngle) * exitDist;
      let exitY = this.vehicle.y + Math.sin(exitAngle) * exitDist;

      // If blocked by building, try other side
      if (city.checkCollision(exitX, exitY, this.radius)) {
        exitX = this.vehicle.x - Math.cos(exitAngle) * exitDist;
        exitY = this.vehicle.y - Math.sin(exitAngle) * exitDist;
      }

      this.x = exitX;
      this.y = exitY;
      this.vehicle.driver = null;
      this.vehicle.isPlayerVehicle = false;
      this.vehicle = null;
      this.inVehicle = false;
    },

    takeDamage(amount) {
      if (this.isDead) return;

      if (this.armor > 0) {
        const armorAbsorb = amount * 0.7;
        const healthDmg = amount * 0.3;
        if (this.armor >= armorAbsorb) {
          this.armor -= armorAbsorb;
          this.health -= healthDmg;
        } else {
          const remainder = armorAbsorb - this.armor;
          this.armor = 0;
          this.health -= healthDmg + remainder;
        }
      } else {
        this.health -= amount;
      }

      if (this.health <= 0) {
        this.health = 0;
        this.isDead = true;
      }
    },

    addCash(amount) {
      this.cash = Math.max(0, this.cash + amount);
    },

    addAmmo(weaponId, amount) {
      if (this.ammo[weaponId] !== undefined) {
        const max = WEAPON_TYPES[weaponId]?.maxAmmo || 300;
        this.ammo[weaponId] = Math.min(max, this.ammo[weaponId] + amount);
      }
    },

    heal(amount) {
      this.health = Math.min(this.maxHealth, this.health + amount);
      this.armor = Math.min(this.maxArmor, this.armor + amount * 0.5);
    },

    respawn(safeX = 640, safeY = 850) {
      this.isDead = false;
      this.health = this.maxHealth;
      this.armor = 50;
      this.inVehicle = false;
      this.vehicle = null;
      this.x = safeX;
      this.y = safeY;
      this.cash = Math.max(0, Math.floor(this.cash * 0.85)); // 15% hospital bill
    },
  };
}
