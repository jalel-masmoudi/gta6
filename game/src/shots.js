// Coral Bay: Underworld - Deterministic Screenshot Scenes & Autopilot Staging
import { MISSIONS } from './config.js';

export function stageShot(name, state) {
  const { player, city, fleet, combat, pedestrians, police, missions, camera } = state;

  if (name === '1-city-cruise' || name === 'start' || name === '1') {
    // Shot 1: High-speed cruise in Venom GT on Ocean Promenade
    player.x = 600;
    player.y = 1400;
    player.angle = Math.PI / 2; // Facing South
    player.cash = 32500;
    player.health = 100;
    player.armor = 100;

    // Spawn Venom GT and place player in it
    const car = fleet.spawn('venom', 600, 1400, Math.PI / 2, false);
    car.speed = 15.5;
    car.nitro = 75;
    player.enterCar(car);

    // Camera follow
    camera.x = 600;
    camera.y = 1400;
    camera.zoom = 0.92;

    // Ambient traffic on other lane (Northbound)
    const traffic1 = fleet.spawn('stallion', 640, 1650, -Math.PI / 2, false);
    traffic1.speed = 8.0;
    const traffic2 = fleet.spawn('vindicator', 560, 1150, Math.PI / 2, false);
    traffic2.speed = 12.0;

    // Pedestrians on sidewalks
    pedestrians.pedestrians.push(
      { id: 'p1', x: 505, y: 1350, angle: Math.PI / 2, spec: { shirt: '#ff6b6b', skin: '#f8d7da', speed: 2 }, animStep: 2 },
      { id: 'p2', x: 505, y: 1420, angle: Math.PI / 2, spec: { shirt: '#48dbfb', skin: '#ffeaa7', speed: 2 }, animStep: 5 },
      { id: 'p3', x: 690, y: 1380, angle: -Math.PI / 2, spec: { shirt: '#f368e0', skin: '#fab1a0', speed: 2 }, animStep: 1 }
    );

    // Particles: tire drift smoke & nitro
    combat.spawnParticle('skid', 600, 1370, 4);
    combat.spawnParticle('nitro', 600, 1350, 6);

    // Mission setup
    missions.startMission(1); // High-Octane Repo
    missions.setDialogue('Rico Cruz', 'Floor it Jax, the highway is clear ahead! Deliver the Venom to the Marina!', 10);
  } else if (name === '2-foot-combat' || name === 'play' || name === '2') {
    // Shot 2: Tactical on-foot shootout in Neon Palms
    player.x = 2800;
    player.y = 750;
    player.angle = -0.3;
    player.cash = 45200;
    player.health = 85;
    player.armor = 65;
    player.selectedWeaponIndex = 3; // Titan Assault Rifle
    player.isAttacking = true;
    player.attackTimer = 0.15;

    camera.x = 2800;
    camera.y = 750;
    camera.zoom = 1.05;

    // Spawn armed enemies
    combat.spawnEnemy(2980, 710, 'rifle');
    combat.spawnEnemy(2950, 820, 'smg');
    combat.spawnEnemy(3040, 770, 'pistol');

    // Bullets & tracers in flight
    combat.spawnBullet({ x: 2835, y: 740, angle: -0.3, speed: 38, damage: 48, range: 400, owner: 'player', color: '#ff453a' });
    combat.spawnBullet({ x: 2950, y: 720, angle: Math.PI - 0.25, speed: 26, damage: 18, range: 350, owner: 'enemy', color: '#ffd60a' });

    // Sparks & blood particles
    combat.spawnParticle('spark', 2920, 725, 8);
    combat.spawnParticle('blood', 2980, 710, 6);

    // Parked getaway car nearby
    fleet.spawn('vindicator', 2730, 790, 0, false);

    // Mission setup
    missions.startMission(2); // Warehouse Strike
    missions.setDialogue('Selena Vance', 'Keep your head down Jax! Take out those syndicate enforcers!', 10);
  } else if (name === '3-police-chase' || name === 'end' || name === '3') {
    // Shot 3: Intense 3-Star Police Pursuit
    player.x = 2200;
    player.y = 2200;
    player.angle = Math.PI / 2;
    player.cash = 68400;
    player.health = 90;
    player.armor = 80;

    // Player Muscle Car drifting
    const muscle = fleet.spawn('vindicator', 2200, 2200, Math.PI / 2 + 0.18, false);
    muscle.speed = 13.8;
    muscle.isDrifting = true;
    player.enterCar(muscle);

    camera.x = 2200;
    camera.y = 2200;
    camera.zoom = 0.90;

    // Police Cruisers flanking with sirens
    const cop1 = fleet.spawn('interceptor', 2160, 2040, Math.PI / 2 + 0.05, true);
    cop1.speed = 14.5;
    cop1.sirenOn = true;

    const cop2 = fleet.spawn('interceptor', 2245, 1980, Math.PI / 2 - 0.08, true);
    cop2.speed = 15.0;
    cop2.sirenOn = true;

    // Wanted Level 3 Stars
    police.setWantedLevel(3);

    // Particles: Skid marks & tire smoke
    combat.spawnParticle('skid', 2200, 2160, 6);
    combat.spawnParticle('smoke', 2200, 2150, 4);

    missions.setDialogue('CBPD Dispatch', 'All units on Central Way, suspect is in a black muscle car! Box him in!', 10);
  } else if (name === '4-mission-heist' || name === '4') {
    // Shot 4: The Grand Marina Heist Escapade
    player.x = 3600;
    player.y = 2000;
    player.angle = 0; // Eastbound toward safehouse
    player.cash = 108500;
    player.health = 95;
    player.armor = 90;

    // Heavy Titan Cargo transport van
    const cargo = fleet.spawn('cargo', 3600, 2000, 0, false);
    cargo.speed = 10.5;
    cargo.nitro = 85;
    player.enterCar(cargo);

    camera.x = 3600;
    camera.y = 2000;
    camera.zoom = 0.88;

    // Police barricade & cruisers ahead
    const copAhead = fleet.spawn('interceptor', 3880, 1960, Math.PI - 0.2, true);
    copAhead.speed = 0;
    copAhead.sirenOn = true;

    // 4 Wanted Stars
    police.setWantedLevel(4);

    // Cash pickups flying
    pedestrians.cashPickups.push(
      { x: 3580, y: 2000, amount: 5000, timer: 0 },
      { x: 3550, y: 2010, amount: 5000, timer: 0 }
    );

    // Particles
    combat.spawnParticle('nitro', 3540, 2000, 6);
    combat.spawnParticle('spark', 3820, 1970, 5);

    missions.startMission(3); // The Grand Marina Heist
    missions.setDialogue('Rico & Selena', 'You got the bearer bonds! CBPD has the bridge blocked, push through!', 10);
  }
}
