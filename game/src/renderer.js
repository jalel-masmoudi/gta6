// Coral Bay: Underworld - 2.5D Pseudo-3D Visual Renderer & Shading Engine

export function createRenderer(canvas) {
  const ctx = canvas.getContext('2d');

  function render(state, camera, width, height) {
    const { city, player, fleet, combat, pedestrians, police } = state;

    ctx.save();
    ctx.clearRect(0, 0, width, height);

    // Sun-soaked twilight / sunset sky background
    ctx.fillStyle = '#111722';
    ctx.fillRect(0, 0, width, height);

    // Apply Camera transform
    const cx = width / 2;
    const cy = height / 2;
    ctx.translate(cx, cy);
    ctx.scale(camera.zoom, camera.zoom);
    ctx.translate(-camera.x - camera.shakeX, -camera.y - camera.shakeY);

    // 1. WATER & BEACH (West side)
    renderWaterAndBeach(ctx, city);

    // 2. ROADS & INTERSECTIONS
    renderRoads(ctx, city);

    // 3. SKID MARKS & GROUND PARTICLES
    renderGroundDecals(ctx, combat.particles);

    // 4. PALM TREE SHADOWS & AMBIENT PROPS
    renderPalmShadows(ctx, city.palmTrees);

    // 5. VEHICLE HEADLIGHT BEAMS (on asphalt)
    renderHeadlightBeams(ctx, fleet.vehicles, player);

    // 6. PEDESTRIANS & CASH PICKUPS
    renderCashPickups(ctx, pedestrians.cashPickups);
    renderPedestrians(ctx, pedestrians.pedestrians);

    // 7. ENEMIES (Syndicate Enforcers)
    renderEnemies(ctx, combat.enemies);

    // 8. PLAYER (if on foot)
    if (!player.inVehicle) {
      renderPlayer(ctx, player);
    }

    // 9. VEHICLES (Cars, Trucks, Police Cruisers)
    renderVehicles(ctx, fleet.vehicles, camera);

    // 10. 3D EXTRUDED BUILDINGS & ROOFTOPS
    renderBuildings(ctx, city.buildings, camera);

    // 11. PALM TREE FRONDS (above ground)
    renderPalms(ctx, city.palmTrees);

    // 12. STREETLIGHTS & VOLUMETRIC HALOS
    renderStreetlights(ctx, city.streetLights);

    // 13. BULLETS & AIR PARTICLES (Muzzle flashes, sparks, explosions)
    renderAirCombat(ctx, combat.bullets, combat.particles);

    ctx.restore();
  }

  function renderWaterAndBeach(ctx, city) {
    // Ocean Water
    const time = Date.now() * 0.002;
    ctx.fillStyle = '#0d3b66';
    ctx.fillRect(0, 0, 420, 4800);

    // Animated Ocean Waves / Shoreline foam
    ctx.fillStyle = '#0077b6';
    for (let y = 0; y < 4800; y += 40) {
      const waveOffset = Math.sin(time + y * 0.02) * 14;
      ctx.fillRect(360 + waveOffset, y, 60, 40);
    }
    // White foam line
    ctx.strokeStyle = 'rgba(255, 255, 255, 0.45)';
    ctx.lineWidth = 3;
    ctx.beginPath();
    for (let y = 0; y < 4800; y += 60) {
      const waveX = 415 + Math.sin(time + y * 0.02) * 12;
      if (y === 0) ctx.moveTo(waveX, y);
      else ctx.lineTo(waveX, y);
    }
    ctx.stroke();

    // Golden Sand Beach Promenade
    ctx.fillStyle = '#e9c46a';
    ctx.fillRect(420, 0, 110, 4800);
    // Boardwalk curb
    ctx.fillStyle = '#d4a373';
    ctx.fillRect(525, 0, 15, 4800);
  }

  function renderRoads(ctx, city) {
    ctx.fillStyle = '#1f242d';

    // Draw all road segments
    for (const r of city.roads) {
      ctx.fillRect(r.bounds.x, r.bounds.y, r.bounds.w, r.bounds.h);
    }

    // Intersections
    for (const inter of city.intersections) {
      ctx.fillRect(inter.bounds.x, inter.bounds.y, inter.bounds.w, inter.bounds.h);
    }

    // Road Markings (Yellow Medians & White Dashed Lanes)
    ctx.lineWidth = 3;
    for (const r of city.roads) {
      if (r.dir === 'ns') {
        // Yellow center median
        ctx.strokeStyle = '#f4a261';
        ctx.beginPath();
        ctx.moveTo(r.x, r.y1);
        ctx.lineTo(r.x, r.y2);
        ctx.stroke();

        // White dashed lane markers
        ctx.strokeStyle = 'rgba(255, 255, 255, 0.4)';
        ctx.setLineDash([16, 18]);
        ctx.beginPath();
        ctx.moveTo(r.x - 35, r.y1);
        ctx.lineTo(r.x - 35, r.y2);
        ctx.moveTo(r.x + 35, r.y1);
        ctx.lineTo(r.x + 35, r.y2);
        ctx.stroke();
        ctx.setLineDash([]);
      } else {
        // Yellow center median
        ctx.strokeStyle = '#f4a261';
        ctx.beginPath();
        ctx.moveTo(r.x1, r.y);
        ctx.lineTo(r.x2, r.y);
        ctx.stroke();

        // White dashed lane markers
        ctx.strokeStyle = 'rgba(255, 255, 255, 0.4)';
        ctx.setLineDash([16, 18]);
        ctx.beginPath();
        ctx.moveTo(r.x1, r.y - 35);
        ctx.lineTo(r.x2, r.y - 35);
        ctx.moveTo(r.x1, r.y + 35);
        ctx.lineTo(r.x2, r.y + 35);
        ctx.stroke();
        ctx.setLineDash([]);
      }
    }

    // Zebra Crosswalks at intersections
    ctx.fillStyle = 'rgba(255, 255, 255, 0.5)';
    for (const inter of city.intersections) {
      // North & South zebra bars
      for (let k = -50; k <= 50; k += 16) {
        ctx.fillRect(inter.x + k - 4, inter.y - inter.radius - 18, 8, 14);
        ctx.fillRect(inter.x + k - 4, inter.y + inter.radius + 4, 8, 14);
      }
    }
  }

  function renderGroundDecals(ctx, particles) {
    for (const p of particles) {
      if (p.type === 'skid') {
        ctx.fillStyle = p.color;
        ctx.beginPath();
        ctx.arc(p.x, p.y, p.size, 0, Math.PI * 2);
        ctx.fill();
      }
    }
  }

  function renderPalmShadows(ctx, palms) {
    ctx.fillStyle = 'rgba(0, 0, 0, 0.25)';
    for (const p of palms) {
      ctx.beginPath();
      ctx.ellipse(p.x + 12, p.y + 16, p.size * 0.9, p.size * 0.5, 0.4, 0, Math.PI * 2);
      ctx.fill();
    }
  }

  function renderHeadlightBeams(ctx, vehicles, player) {
    for (const v of vehicles) {
      if (v.exploded) continue;

      ctx.save();
      ctx.translate(v.x, v.y);
      ctx.rotate(v.angle);

      // Light beam gradient forward
      const grad = ctx.createRadialGradient(v.spec.length * 0.6, 0, 10, v.spec.length * 0.6 + 180, 0, 160);
      grad.addColorStop(0, 'rgba(255, 250, 220, 0.35)');
      grad.addColorStop(0.6, 'rgba(255, 250, 220, 0.12)');
      grad.addColorStop(1, 'rgba(255, 250, 220, 0)');

      ctx.fillStyle = grad;
      ctx.beginPath();
      ctx.moveTo(v.spec.length * 0.45, -v.spec.width * 0.4);
      ctx.lineTo(v.spec.length * 0.45 + 240, -100);
      ctx.lineTo(v.spec.length * 0.45 + 240, 100);
      ctx.lineTo(v.spec.length * 0.45, v.spec.width * 0.4);
      ctx.closePath();
      ctx.fill();

      // Police alternating flashing siren light cones
      if (v.isPolice && v.sirenOn) {
        const sirenPhase = (Date.now() * 0.008) % (Math.PI * 2);
        const redAlpha = (Math.sin(sirenPhase) + 1) * 0.3;
        const blueAlpha = (Math.cos(sirenPhase) + 1) * 0.3;

        // Red flare
        ctx.fillStyle = `rgba(255, 50, 50, ${redAlpha})`;
        ctx.beginPath();
        ctx.arc(0, -25, 120, 0, Math.PI * 2);
        ctx.fill();

        // Blue flare
        ctx.fillStyle = `rgba(10, 132, 255, ${blueAlpha})`;
        ctx.beginPath();
        ctx.arc(0, 25, 120, 0, Math.PI * 2);
        ctx.fill();
      }

      ctx.restore();
    }
  }

  function renderCashPickups(ctx, pickups) {
    for (const cp of pickups) {
      ctx.save();
      ctx.translate(cp.x, cp.y);
      // Floating pulse
      const pulse = 1.0 + Math.sin(Date.now() * 0.008) * 0.15;
      ctx.scale(pulse, pulse);

      ctx.fillStyle = '#2ecc71';
      ctx.shadowColor = '#2ecc71';
      ctx.shadowBlur = 8;
      ctx.fillRect(-7, -4, 14, 8);
      ctx.fillStyle = '#ffffff';
      ctx.font = 'bold 9px sans-serif';
      ctx.textAlign = 'center';
      ctx.fillText('$', 0, 3);
      ctx.restore();
    }
  }

  function renderPedestrians(ctx, peds) {
    for (const ped of peds) {
      ctx.save();
      ctx.translate(ped.x, ped.y);

      if (ped.isDead) {
        // Lying down
        ctx.fillStyle = 'rgba(0, 0, 0, 0.3)';
        ctx.fillRect(-12, -6, 24, 12);
        ctx.fillStyle = ped.spec.shirt;
        ctx.fillRect(-10, -5, 20, 10);
        ctx.fillStyle = ped.spec.skin;
        ctx.beginPath();
        ctx.arc(10, 0, 5, 0, Math.PI * 2);
        ctx.fill();
        ctx.restore();
        continue;
      }

      ctx.rotate(ped.angle);

      // Pedestrian Body
      ctx.fillStyle = ped.spec.shirt;
      ctx.beginPath();
      ctx.arc(0, 0, 9, 0, Math.PI * 2);
      ctx.fill();

      // Head
      ctx.fillStyle = ped.spec.skin;
      ctx.beginPath();
      ctx.arc(2, 0, 5, 0, Math.PI * 2);
      ctx.fill();

      // Panic exclamation emote
      if (ped.isPanicked) {
        ctx.fillStyle = '#ff3b30';
        ctx.font = 'bold 12px sans-serif';
        ctx.fillText('!', -2, -12);
      }

      ctx.restore();
    }
  }

  function renderEnemies(ctx, enemies) {
    for (const en of enemies) {
      if (en.isDead) continue;
      ctx.save();
      ctx.translate(en.x, en.y);
      ctx.rotate(en.angle);

      // Syndicate Enforcer Body
      ctx.fillStyle = en.isBoss ? '#7928ca' : '#d90429';
      ctx.beginPath();
      ctx.arc(0, 0, en.isBoss ? 12 : 10, 0, Math.PI * 2);
      ctx.fill();

      // Shoulders / Arms with weapon
      ctx.fillStyle = '#111116';
      ctx.fillRect(4, -3, 9, 6);

      // Head
      ctx.fillStyle = '#f8d7da';
      ctx.beginPath();
      ctx.arc(3, 0, 6, 0, Math.PI * 2);
      ctx.fill();

      // Health bar above enemy head
      ctx.rotate(-en.angle);
      ctx.fillStyle = 'rgba(0,0,0,0.5)';
      ctx.fillRect(-15, -20, 30, 4);
      ctx.fillStyle = '#ff3b30';
      ctx.fillRect(-15, -20, (en.health / en.maxHealth) * 30, 4);

      ctx.restore();
    }
  }

  function renderPlayer(ctx, player) {
    ctx.save();
    ctx.translate(player.x, player.y);
    ctx.rotate(player.angle);

    // Torso / Leather Jacket (Jax Vance signature look: dark navy jacket with white tee)
    ctx.fillStyle = '#0f172a';
    ctx.beginPath();
    ctx.ellipse(0, 0, 11, 14, 0, 0, Math.PI * 2);
    ctx.fill();

    // White shirt collar
    ctx.fillStyle = '#f8fafc';
    ctx.beginPath();
    ctx.arc(2, 0, 4, 0, Math.PI * 2);
    ctx.fill();

    // Arms & Hands holding weapon
    ctx.fillStyle = '#0f172a';
    ctx.fillRect(4, -9, 8, 5); // Left arm
    ctx.fillRect(4, 4, 8, 5); // Right arm

    // Weapon
    ctx.fillStyle = '#334155';
    const weapon = player.currentWeapon;
    if (weapon.id === 'fists') {
      ctx.fillStyle = '#f5cd79';
      ctx.beginPath();
      ctx.arc(player.isAttacking ? 15 : 10, 6, 4, 0, Math.PI * 2);
      ctx.fill();
    } else {
      ctx.fillRect(8, 3, weapon.id === 'rifle' ? 18 : 10, 4);
      // Muzzle flash when firing
      if (player.isAttacking && player.attackTimer > 0.05) {
        ctx.fillStyle = '#ffea79';
        ctx.beginPath();
        const flashX = 12 + (weapon.id === 'rifle' ? 16 : 8);
        ctx.arc(flashX, 5, 8, 0, Math.PI * 2);
        ctx.fill();
      }
    }

    // Head & Hair
    ctx.fillStyle = '#1e293b'; // Dark hair
    ctx.beginPath();
    ctx.arc(1, 0, 7, 0, Math.PI * 2);
    ctx.fill();
    ctx.fillStyle = '#f5cd79'; // Face
    ctx.beginPath();
    ctx.arc(3, 0, 5, 0, Math.PI * 2);
    ctx.fill();

    ctx.restore();
  }

  function renderVehicles(ctx, vehicles, camera) {
    for (const v of vehicles) {
      ctx.save();
      ctx.translate(v.x, v.y);
      ctx.rotate(v.angle);

      const hw = v.spec.width / 2;
      const hl = v.spec.length / 2;

      // Drop shadow under vehicle
      ctx.fillStyle = 'rgba(0, 0, 0, 0.4)';
      ctx.fillRect(-hl + 4, -hw + 4, v.spec.length, v.spec.width);

      if (v.exploded) {
        // Charred wreck
        ctx.fillStyle = '#1c1c1e';
        ctx.fillRect(-hl, -hw, v.spec.length, v.spec.width);
        ctx.restore();
        continue;
      }

      // Wheels
      ctx.fillStyle = '#111111';
      const wheelW = 14;
      const wheelH = 6;
      // Front wheels (steerable)
      ctx.save();
      ctx.translate(hl * 0.6, -hw - 1);
      ctx.rotate(v.steerAngle * 1.5);
      ctx.fillRect(-wheelW / 2, -wheelH / 2, wheelW, wheelH);
      ctx.restore();

      ctx.save();
      ctx.translate(hl * 0.6, hw + 1);
      ctx.rotate(v.steerAngle * 1.5);
      ctx.fillRect(-wheelW / 2, -wheelH / 2, wheelW, wheelH);
      ctx.restore();

      // Rear wheels
      ctx.fillRect(-hl * 0.6 - wheelW / 2, -hw - 1 - wheelH / 2, wheelW, wheelH);
      ctx.fillRect(-hl * 0.6 - wheelW / 2, hw + 1 - wheelH / 2, wheelW, wheelH);

      // Car Body
      ctx.fillStyle = v.spec.bodyColor;
      ctx.beginPath();
      ctx.roundRect ? ctx.roundRect(-hl, -hw, v.spec.length, v.spec.width, 7) : ctx.fillRect(-hl, -hw, v.spec.length, v.spec.width);
      ctx.fill();

      // Accent / Stripes
      if (v.spec.accentColor && v.type === 'vindicator') {
        ctx.fillStyle = v.spec.accentColor;
        ctx.fillRect(-hl, -3, v.spec.length, 6);
      }

      // Windshield & Glass Canopy
      ctx.fillStyle = '#1e293b';
      ctx.fillRect(-hl * 0.15, -hw * 0.75, hl * 0.8, v.spec.width * 0.75);

      // Roof
      ctx.fillStyle = v.spec.bodyColor;
      ctx.fillRect(-hl * 0.25, -hw * 0.65, hl * 0.65, v.spec.width * 0.65);

      // Police Roof Lightbar
      if (v.isPolice) {
        ctx.fillStyle = '#ffffff';
        ctx.fillRect(-2, -hw * 0.8, 6, v.spec.width * 0.8);

        // Flashing blue/red strobes
        const strobe = Math.sin(Date.now() * 0.02) > 0;
        ctx.fillStyle = strobe ? '#ff3b30' : '#0a84ff';
        ctx.fillRect(-2, -hw * 0.75, 6, v.spec.width * 0.35);
        ctx.fillStyle = strobe ? '#0a84ff' : '#ff3b30';
        ctx.fillRect(-2, hw * 0.4, 6, v.spec.width * 0.35);
      }

      // Headlights & Taillights
      ctx.fillStyle = '#ffea79';
      ctx.fillRect(hl - 3, -hw + 4, 3, 6);
      ctx.fillRect(hl - 3, hw - 10, 3, 6);

      // Brake lights (red)
      ctx.fillStyle = v.speed < 0 || (v.driver && v.isDrifting) ? '#ff3b30' : '#881111';
      ctx.fillRect(-hl, -hw + 4, 3, 6);
      ctx.fillRect(-hl, hw - 10, 3, 6);

      ctx.restore();
    }
  }

  function renderBuildings(ctx, buildings, camera) {
    for (const b of buildings) {
      // Pseudo-3D Extrusion
      // The rooftop shifts away from camera focal point based on building height!
      const focalX = camera.x;
      const focalY = camera.y;

      const factor = (b.height3D / 550);
      const shiftX = (b.x + b.w / 2 - focalX) * factor * 0.22;
      const shiftY = (b.y + b.h / 2 - focalY) * factor * 0.22;

      const topX = b.x + shiftX;
      const topY = b.y + shiftY;

      // Drop shadow under building
      ctx.fillStyle = 'rgba(0, 0, 0, 0.45)';
      ctx.fillRect(b.x + 14, b.y + 14, b.w, b.h);

      // Side Walls (connecting base to rooftop)
      ctx.fillStyle = b.wallColor;

      // Bottom wall
      ctx.beginPath();
      ctx.moveTo(b.x, b.y + b.h);
      ctx.lineTo(b.x + b.w, b.y + b.h);
      ctx.lineTo(topX + b.w, topY + b.h);
      ctx.lineTo(topX, topY + b.h);
      ctx.closePath();
      ctx.fill();

      // Right wall
      ctx.beginPath();
      ctx.moveTo(b.x + b.w, b.y);
      ctx.lineTo(b.x + b.w, b.y + b.h);
      ctx.lineTo(topX + b.w, topY + b.h);
      ctx.lineTo(topX + b.w, topY);
      ctx.closePath();
      ctx.fill();

      // Rooftop Plate
      ctx.fillStyle = b.roofColor;
      ctx.fillRect(topX, topY, b.w, b.h);

      // Neon Rim Trim
      ctx.strokeStyle = b.trimColor;
      ctx.lineWidth = 2.5;
      ctx.strokeRect(topX, topY, b.w, b.h);

      // Roof Details (AC units, helipads, neon text)
      for (const d of b.roofDetails) {
        if (d.type === 'ac') {
          ctx.fillStyle = '#475569';
          ctx.fillRect(topX + (d.x - b.x), topY + (d.y - b.y), d.w, d.h);
        } else if (d.type === 'helipad') {
          const hpx = topX + (d.x - b.x);
          const hpy = topY + (d.y - b.y);
          ctx.strokeStyle = '#ffd60a';
          ctx.lineWidth = 3;
          ctx.beginPath();
          ctx.arc(hpx, hpy, d.radius, 0, Math.PI * 2);
          ctx.stroke();
          ctx.fillStyle = '#ffd60a';
          ctx.font = 'bold 22px sans-serif';
          ctx.textAlign = 'center';
          ctx.fillText('H', hpx, hpy + 8);
        }
      }

      // Building Name Neon Sign
      ctx.fillStyle = b.trimColor;
      ctx.font = 'bold 11px sans-serif';
      ctx.textAlign = 'center';
      ctx.fillText(b.name, topX + b.w / 2, topY + 18);
    }
  }

  function renderPalms(ctx, palms) {
    const sway = Math.sin(Date.now() * 0.003) * 3;
    for (const p of palms) {
      ctx.save();
      ctx.translate(p.x, p.y);

      // Palm Trunk
      ctx.fillStyle = '#5c4033';
      ctx.beginPath();
      ctx.arc(0, 0, 5, 0, Math.PI * 2);
      ctx.fill();

      // 6 Palm Fronds radiating outward
      ctx.fillStyle = '#2d6a4f';
      for (let k = 0; k < 6; k++) {
        const frondAngle = (k / 6) * Math.PI * 2 + p.swayOffset;
        ctx.beginPath();
        ctx.ellipse(
          Math.cos(frondAngle) * (p.size * 0.5) + sway,
          Math.sin(frondAngle) * (p.size * 0.5),
          p.size * 0.55,
          p.size * 0.2,
          frondAngle,
          0,
          Math.PI * 2
        );
        ctx.fill();
      }
      ctx.restore();
    }
  }

  function renderStreetlights(ctx, lights) {
    ctx.fillStyle = '#475569';
    for (const lt of lights) {
      // Pole
      ctx.fillRect(lt.x - 2, lt.y - 2, 4, 4);

      // Volumetric Warm Light Halo
      const grad = ctx.createRadialGradient(lt.x, lt.y, 4, lt.x, lt.y, 65);
      grad.addColorStop(0, 'rgba(255, 234, 121, 0.28)');
      grad.addColorStop(1, 'rgba(255, 234, 121, 0)');
      ctx.fillStyle = grad;
      ctx.beginPath();
      ctx.arc(lt.x, lt.y, 65, 0, Math.PI * 2);
      ctx.fill();
    }
  }

  function renderAirCombat(ctx, bullets, particles) {
    // Bullets with Glowing Tracers
    for (const b of bullets) {
      ctx.save();
      ctx.strokeStyle = b.color;
      ctx.lineWidth = 2.5;
      ctx.beginPath();
      ctx.moveTo(b.x, b.y);
      ctx.lineTo(b.x - b.vx * 1.5, b.y - b.vy * 1.5);
      ctx.stroke();

      ctx.fillStyle = '#ffffff';
      ctx.beginPath();
      ctx.arc(b.x, b.y, 2, 0, Math.PI * 2);
      ctx.fill();
      ctx.restore();
    }

    // Sparks, Explosions, Fire
    for (const p of particles) {
      if (p.type === 'skid') continue; // Ground decal drawn earlier

      ctx.save();
      ctx.fillStyle = p.color;
      ctx.globalAlpha = Math.max(0, p.life / p.maxLife);

      if (p.type === 'explosion') {
        ctx.shadowColor = '#ff3b30';
        ctx.shadowBlur = 12;
      }

      ctx.beginPath();
      ctx.arc(p.x, p.y, p.size, 0, Math.PI * 2);
      ctx.fill();
      ctx.restore();
    }
  }

  return {
    render,
  };
}
