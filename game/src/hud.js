// Coral Bay: Underworld - Complete Open-World HUD & Minimap Engine
import { MAP_WIDTH, MAP_HEIGHT } from './config.js';

export function createHUD() {
  let floatingCash = [];
  let prevCash = 0;

  function render(ctx, width, height, state) {
    const { player, city, fleet, combat, police, missions, audio } = state;

    // Detect Cash gains for floating indicators
    if (player.cash > prevCash) {
      floatingCash.push({
        text: `+$${player.cash - prevCash}`,
        x: width - 120,
        y: 130,
        alpha: 1.0,
        vy: -1.2,
      });
    }
    prevCash = player.cash;

    // 1. CIRCULAR MINIMAP (Bottom-Left)
    renderMinimap(ctx, player, city, fleet, combat, police, missions);

    // 2. HEALTH & ARMOR BARS (Above Minimap)
    renderVitals(ctx, player);

    // 3. WANTED STARS (Top-Right)
    renderWantedStars(ctx, width, police);

    // 4. WEAPON & AMMO STATUS (Top-Right below Stars)
    renderWeapon(ctx, width, player);

    // 5. CASH COUNTER & FLOATING CASH (Top-Right)
    renderCash(ctx, width, player);

    // 6. VEHICLE SPEEDOMETER & NITRO (Bottom-Right, when in car)
    if (player.inVehicle && player.vehicle) {
      renderVehicleDash(ctx, width, height, player.vehicle, audio);
    }

    // 7. MISSION OBJECTIVE BANNER (Top-Center)
    renderMissionBanner(ctx, width, missions, player);

    // 8. DIALOGUE & SUBTITLE BOX (Bottom-Center)
    if (missions.activeDialogue) {
      renderDialogueBox(ctx, width, height, missions.activeDialogue);
    }

    // 9. BUSTED / WASTED OVERLAYS
    if (police.isBusted) {
      renderBustedOverlay(ctx, width, height);
    } else if (player.isDead) {
      renderWastedOverlay(ctx, width, height);
    }
  }

  function renderMinimap(ctx, player, city, fleet, combat, police, missions) {
    const mapRadius = 88;
    const mapX = 110;
    const mapY = 110; // Or anchored to bottom
    // Place at bottom-left
    const cx = 115;
    const cy = window.innerHeight ? window.innerHeight - 115 : 605;

    ctx.save();
    // Clip circle
    ctx.beginPath();
    ctx.arc(cx, cy, mapRadius, 0, Math.PI * 2);
    ctx.fillStyle = '#10141c';
    ctx.fill();
    ctx.lineWidth = 4;
    ctx.strokeStyle = '#2c3545';
    ctx.stroke();
    ctx.clip();

    // Minimap scale: 1 world unit = 0.08 map units
    const scale = 0.075;

    // Draw Water
    const waterW = 420 * scale;
    ctx.fillStyle = '#0f4c81';
    ctx.fillRect(cx + (0 - player.x) * scale, cy + (0 - player.y) * scale, waterW, MAP_HEIGHT * scale);

    // Draw Roads on minimap
    ctx.lineWidth = city.ROAD_WIDTH * scale;
    ctx.strokeStyle = '#2b313d';

    for (const r of city.roads) {
      ctx.beginPath();
      if (r.dir === 'ns') {
        ctx.moveTo(cx + (r.x - player.x) * scale, cy + (r.y1 - player.y) * scale);
        ctx.lineTo(cx + (r.x - player.x) * scale, cy + (r.y2 - player.y) * scale);
      } else {
        ctx.moveTo(cx + (r.x1 - player.x) * scale, cy + (r.y - player.y) * scale);
        ctx.lineTo(cx + (r.x2 - player.x) * scale, cy + (r.y - player.y) * scale);
      }
      ctx.stroke();
    }

    // Draw Buildings on minimap
    ctx.fillStyle = '#1c222e';
    for (const b of city.buildings) {
      const bx = cx + (b.x - player.x) * scale;
      const by = cy + (b.y - player.y) * scale;
      const bw = b.w * scale;
      const bh = b.h * scale;
      if (bx + bw > cx - mapRadius && bx < cx + mapRadius && by + bh > cy - mapRadius && by < cy + mapRadius) {
        ctx.fillRect(bx, by, bw, bh);
      }
    }

    // Draw Police evasion radius
    if (police.wantedStars > 0) {
      ctx.strokeStyle = police.isEvading ? 'rgba(0, 180, 255, 0.45)' : 'rgba(255, 50, 50, 0.4)';
      ctx.lineWidth = 2;
      ctx.beginPath();
      ctx.arc(cx, cy, 550 * scale, 0, Math.PI * 2);
      ctx.stroke();
    }

    // Draw Vehicles on minimap
    for (const v of fleet.vehicles) {
      if (v === player.vehicle || v.exploded) continue;
      const vx = cx + (v.x - player.x) * scale;
      const vy = cy + (v.y - player.y) * scale;
      if ((vx - cx) ** 2 + (vy - cy) ** 2 < mapRadius * mapRadius) {
        if (v.isPolice) {
          // Flashing red/blue police blip
          const flash = Math.sin(Date.now() * 0.015) > 0;
          ctx.fillStyle = flash ? '#ff3b30' : '#0a84ff';
          ctx.beginPath();
          ctx.arc(vx, vy, 4.5, 0, Math.PI * 2);
          ctx.fill();
        } else {
          ctx.fillStyle = '#a1a8b8';
          ctx.fillRect(vx - 2, vy - 2, 4, 4);
        }
      }
    }

    // Draw Enemies on minimap
    for (const en of combat.enemies) {
      if (en.isDead) continue;
      const ex = cx + (en.x - player.x) * scale;
      const ey = cy + (en.y - player.y) * scale;
      if ((ex - cx) ** 2 + (ey - cy) ** 2 < mapRadius * mapRadius) {
        ctx.fillStyle = '#ff453a';
        ctx.beginPath();
        ctx.arc(ex, ey, 3.5, 0, Math.PI * 2);
        ctx.fill();
      }
    }

    // Draw Mission Waypoint on minimap
    const wp = missions.getWaypoint();
    if (wp) {
      const wpx = cx + (wp.x - player.x) * scale;
      const wpy = cy + (wp.y - player.y) * scale;
      const distSq = (wpx - cx) ** 2 + (wpy - cy) ** 2;

      let drawX = wpx;
      let drawY = wpy;
      if (distSq > (mapRadius - 12) ** 2) {
        // Clamp to edge of minimap
        const angle = Math.atan2(wpy - cy, wpx - cx);
        drawX = cx + Math.cos(angle) * (mapRadius - 12);
        drawY = cy + Math.sin(angle) * (mapRadius - 12);
      }

      ctx.fillStyle = '#ffd60a';
      ctx.beginPath();
      ctx.arc(drawX, drawY, 6, 0, Math.PI * 2);
      ctx.fill();
      ctx.strokeStyle = '#ffffff';
      ctx.lineWidth = 2;
      ctx.stroke();
    }

    // Player arrow in center of minimap
    ctx.save();
    ctx.translate(cx, cy);
    ctx.rotate(player.angle);
    ctx.fillStyle = '#00f5d4';
    ctx.beginPath();
    ctx.moveTo(9, 0);
    ctx.lineTo(-6, -6);
    ctx.lineTo(-3, 0);
    ctx.lineTo(-6, 6);
    ctx.closePath();
    ctx.fill();
    ctx.strokeStyle = '#ffffff';
    ctx.lineWidth = 1.5;
    ctx.stroke();
    ctx.restore();

    ctx.restore(); // Restore clip

    // Minimap Outer Ring & Border
    ctx.beginPath();
    ctx.arc(cx, cy, mapRadius, 0, Math.PI * 2);
    ctx.lineWidth = 4;
    ctx.strokeStyle = '#1e2430';
    ctx.stroke();

    // Cardinal Directions (N)
    ctx.fillStyle = '#ff3b30';
    ctx.font = 'bold 12px sans-serif';
    ctx.textAlign = 'center';
    ctx.fillText('N', cx, cy - mapRadius + 14);
  }

  function renderVitals(ctx, player) {
    const bx = 30;
    const by = window.innerHeight ? window.innerHeight - 225 : 495;
    const barW = 170;
    const barH = 10;

    // Health Bar
    ctx.fillStyle = 'rgba(0, 0, 0, 0.6)';
    ctx.fillRect(bx, by, barW, barH);
    const healthW = Math.max(0, (player.health / player.maxHealth) * barW);
    ctx.fillStyle = player.health < 30 ? '#ff3b30' : '#2ecc71';
    ctx.fillRect(bx, by, healthW, barH);
    ctx.strokeStyle = 'rgba(255, 255, 255, 0.2)';
    ctx.strokeRect(bx, by, barW, barH);

    // Armor Bar
    ctx.fillStyle = 'rgba(0, 0, 0, 0.6)';
    ctx.fillRect(bx, by + 14, barW, barH);
    const armorW = Math.max(0, (player.armor / player.maxArmor) * barW);
    ctx.fillStyle = '#00b4d8';
    ctx.fillRect(bx, by + 14, armorW, barH);
    ctx.strokeStyle = 'rgba(255, 255, 255, 0.2)';
    ctx.strokeRect(bx, by + 14, barW, barH);
  }

  function renderWantedStars(ctx, width, police) {
    const count = 5;
    const starSize = 22;
    const startX = width - 30 - count * (starSize + 6);
    const startY = 24;

    const stars = police.wantedStars;
    const isFlashing = police.isEvading && Math.sin(Date.now() * 0.012) > 0;

    for (let i = 0; i < count; i++) {
      const sx = startX + i * (starSize + 6);
      ctx.save();
      ctx.translate(sx, startY);

      const isStarActive = i < stars;
      if (isStarActive) {
        if (isFlashing) {
          ctx.fillStyle = 'rgba(255, 214, 10, 0.25)';
        } else {
          ctx.fillStyle = '#ffd60a';
          ctx.shadowColor = '#ffd60a';
          ctx.shadowBlur = 8;
        }
      } else {
        ctx.fillStyle = 'rgba(255, 255, 255, 0.18)';
        ctx.shadowBlur = 0;
      }

      drawStar(ctx, 0, 0, 5, starSize * 0.5, starSize * 0.22);
      ctx.fill();
      ctx.restore();
    }
  }

  function drawStar(ctx, cx, cy, spikes, outerRadius, innerRadius) {
    let rot = (Math.PI / 2) * 3;
    let x = cx;
    let y = cy;
    const step = Math.PI / spikes;

    ctx.beginPath();
    ctx.moveTo(cx, cy - outerRadius);
    for (let i = 0; i < spikes; i++) {
      x = cx + Math.cos(rot) * outerRadius;
      y = cy + Math.sin(rot) * outerRadius;
      ctx.lineTo(x, y);
      rot += step;

      x = cx + Math.cos(rot) * innerRadius;
      y = cy + Math.sin(rot) * innerRadius;
      ctx.lineTo(x, y);
      rot += step;
    }
    ctx.lineTo(cx, cy - outerRadius);
    ctx.closePath();
  }

  function renderWeapon(ctx, width, player) {
    const rx = width - 150;
    const ry = 62;

    const weapon = player.currentWeapon;
    ctx.save();
    ctx.fillStyle = 'rgba(16, 20, 28, 0.75)';
    ctx.roundRect ? ctx.roundRect(rx, ry, 125, 46, 6) : ctx.fillRect(rx, ry, 125, 46);
    ctx.fill();
    ctx.strokeStyle = 'rgba(255, 255, 255, 0.15)';
    ctx.stroke();

    ctx.fillStyle = '#ffffff';
    ctx.font = 'bold 13px sans-serif';
    ctx.textAlign = 'left';
    ctx.fillText(weapon.name.toUpperCase(), rx + 10, ry + 20);

    ctx.font = '12px sans-serif';
    ctx.fillStyle = '#a0aec0';
    if (weapon.id === 'fists') {
      ctx.fillText('MELEE', rx + 10, ry + 38);
    } else {
      const ammo = player.ammo[weapon.id] || 0;
      ctx.fillText(`AMMO: ${ammo}`, rx + 10, ry + 38);
    }
    ctx.restore();
  }

  function renderCash(ctx, width, player) {
    const rx = width - 30;
    const ry = 135;

    ctx.save();
    ctx.font = 'bold 22px "Courier New", monospace';
    ctx.textAlign = 'right';
    ctx.fillStyle = '#2ecc71';
    ctx.shadowColor = '#2ecc71';
    ctx.shadowBlur = 6;
    ctx.fillText(`$${player.cash.toLocaleString()}`, rx, ry);
    ctx.restore();

    // Render floating cash gains
    for (let i = floatingCash.length - 1; i >= 0; i--) {
      const fc = floatingCash[i];
      fc.y += fc.vy;
      fc.alpha -= 0.02;
      ctx.save();
      ctx.font = 'bold 16px sans-serif';
      ctx.textAlign = 'right';
      ctx.fillStyle = `rgba(46, 204, 113, ${Math.max(0, fc.alpha)})`;
      ctx.fillText(fc.text, fc.x, fc.y);
      ctx.restore();
      if (fc.alpha <= 0) floatingCash.splice(i, 1);
    }
  }

  function renderVehicleDash(ctx, width, height, vehicle, audio) {
    const dx = width - 180;
    const dy = height - 90;

    ctx.save();
    ctx.fillStyle = 'rgba(16, 20, 28, 0.75)';
    ctx.roundRect ? ctx.roundRect(dx, dy, 155, 65, 8) : ctx.fillRect(dx, dy, 155, 65);
    ctx.fill();
    ctx.strokeStyle = 'rgba(255, 255, 255, 0.15)';
    ctx.stroke();

    // Speedometer
    const speedMPH = Math.floor(Math.abs(vehicle.speed) * 6.5);
    ctx.fillStyle = '#ffffff';
    ctx.font = 'bold 24px monospace';
    ctx.textAlign = 'left';
    ctx.fillText(`${speedMPH}`, dx + 12, dy + 32);

    ctx.font = '11px sans-serif';
    ctx.fillStyle = '#718096';
    ctx.fillText('MPH', dx + 65, dy + 32);

    // Nitro gauge
    ctx.fillStyle = 'rgba(255, 255, 255, 0.15)';
    ctx.fillRect(dx + 12, dy + 44, 130, 8);
    ctx.fillStyle = '#00d2ff';
    ctx.fillRect(dx + 12, dy + 44, (vehicle.nitro / 100) * 130, 8);

    ctx.restore();
  }

  function renderMissionBanner(ctx, width, missions, player) {
    const bannerW = 480;
    const bannerH = 46;
    const bx = (width - bannerW) / 2;
    const by = 20;

    const title = missions.getCurrentMissionTitle();
    const objective = missions.getCurrentObjectiveText();

    ctx.save();
    ctx.fillStyle = 'rgba(12, 16, 24, 0.85)';
    ctx.roundRect ? ctx.roundRect(bx, by, bannerW, bannerH, 6) : ctx.fillRect(bx, by, bannerW, bannerH);
    ctx.fill();
    ctx.lineWidth = 2;
    ctx.strokeStyle = missions.missionState === 'active' ? '#ffd60a' : '#00b4d8';
    ctx.stroke();

    ctx.textAlign = 'center';
    ctx.font = 'bold 13px sans-serif';
    ctx.fillStyle = missions.missionState === 'active' ? '#ffd60a' : '#00b4d8';
    ctx.fillText(title.toUpperCase(), width / 2, by + 18);

    ctx.font = '13px sans-serif';
    ctx.fillStyle = '#ffffff';

    // Show distance to waypoint if available
    let text = objective;
    const wp = missions.getWaypoint();
    if (wp) {
      const dist = Math.floor(Math.sqrt((player.x - wp.x) ** 2 + (player.y - wp.y) ** 2) / 10);
      text += ` (${dist}m)`;
    }
    ctx.fillText(text, width / 2, by + 36);
    ctx.restore();
  }

  function renderDialogueBox(ctx, width, height, dialogue) {
    const boxW = Math.min(width - 80, 680);
    const boxH = 58;
    const bx = (width - boxW) / 2;
    const by = height - 85;

    ctx.save();
    ctx.fillStyle = 'rgba(10, 14, 20, 0.92)';
    ctx.roundRect ? ctx.roundRect(bx, by, boxW, boxH, 8) : ctx.fillRect(bx, by, boxW, boxH);
    ctx.fill();
    ctx.lineWidth = 2;
    ctx.strokeStyle = '#ea0599';
    ctx.stroke();

    ctx.textAlign = 'left';
    ctx.font = 'bold 14px sans-serif';
    ctx.fillStyle = '#ea0599';
    ctx.fillText(dialogue.speaker.toUpperCase(), bx + 18, by + 22);

    ctx.font = '14px sans-serif';
    ctx.fillStyle = '#f7fafc';
    ctx.fillText(dialogue.text, bx + 18, by + 44);
    ctx.restore();
  }

  function renderBustedOverlay(ctx, width, height) {
    ctx.save();
    ctx.fillStyle = 'rgba(0, 0, 40, 0.65)';
    ctx.fillRect(0, 0, width, height);
    ctx.font = 'bold 72px sans-serif';
    ctx.textAlign = 'center';
    ctx.fillStyle = '#0a84ff';
    ctx.shadowColor = '#00f5d4';
    ctx.shadowBlur = 15;
    ctx.fillText('BUSTED', width / 2, height / 2);
    ctx.font = '20px sans-serif';
    ctx.fillStyle = '#ffffff';
    ctx.fillText('You were arrested by the Coral Bay Police Department.', width / 2, height / 2 + 50);
    ctx.restore();
  }

  function renderWastedOverlay(ctx, width, height) {
    ctx.save();
    ctx.fillStyle = 'rgba(50, 0, 0, 0.7)';
    ctx.fillRect(0, 0, width, height);
    ctx.font = 'bold 72px sans-serif';
    ctx.textAlign = 'center';
    ctx.fillStyle = '#ff3b30';
    ctx.shadowColor = '#ff3b30';
    ctx.shadowBlur = 20;
    ctx.fillText('WASTED', width / 2, height / 2);
    ctx.font = '20px sans-serif';
    ctx.fillStyle = '#ffffff';
    ctx.fillText('Respawning at Coral Bay Memorial Hospital...', width / 2, height / 2 + 50);
    ctx.restore();
  }

  return {
    render,
  };
}
