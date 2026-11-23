// Coral Bay: Underworld - City Generation, Road Graph & Collision Map
import { MAP_WIDTH, MAP_HEIGHT, DISTRICTS } from './config.js';

export function createCity() {
  const roads = [];
  const intersections = [];
  const buildings = [];
  const palmTrees = [];
  const streetLights = [];
  const waterTiles = [];

  // Road grid definitions (x or y centers, width 140px)
  const ROAD_WIDTH = 140;
  const HALF_ROAD = ROAD_WIDTH / 2;

  const nsRoadsX = [600, 1400, 2200, 3000, 3800, 4400];
  const ewRoadsY = [500, 1200, 1900, 2600, 3300, 4100];

  // North-South Roads
  for (const rx of nsRoadsX) {
    roads.push({
      dir: 'ns',
      x: rx,
      y1: 300,
      y2: 4500,
      width: ROAD_WIDTH,
      bounds: { x: rx - HALF_ROAD, y: 300, w: ROAD_WIDTH, h: 4200 },
    });
  }

  // East-West Roads
  for (const ry of ewRoadsY) {
    roads.push({
      dir: 'ew',
      y: ry,
      x1: 500,
      x2: 4500,
      width: ROAD_WIDTH,
      bounds: { x: 500, y: ry - HALF_ROAD, w: 4000, h: ROAD_WIDTH },
    });
  }

  // Intersections
  for (const rx of nsRoadsX) {
    for (const ry of ewRoadsY) {
      intersections.push({
        x: rx,
        y: ry,
        radius: HALF_ROAD,
        bounds: { x: rx - HALF_ROAD, y: ry - HALF_ROAD, w: ROAD_WIDTH, h: ROAD_WIDTH },
      });
    }
  }

  // Building Names per district
  const buildingNames = [
    'VANCE LUXURY TOWER', 'CORAL BAY BANK', 'NEON NIGHTS CLUB', 'OCEAN BREEZE HOTEL',
    'CBPD HEADQUARTERS', 'MARINA YACHT CLUB', 'SUNSET CASINO', 'SOLARIA CONDOS',
    'DOCK STORAGE 4', 'HARBOR FREIGHT CO', 'PALM APEX TOWER', 'CYBER LOUNGE',
    'METRO APARTMENTS', 'VIPER SPEED SHOP', 'GOLDEN COAST RESORT', 'BAYVIEW SUITES',
    'SOUTH POINT PIER', 'PACIFIC MERCHANTS', 'NEON HORIZON SPA', 'CORAL SAFEHOUSE',
  ];
  let nameIndex = 0;

  // Generate city blocks between road lines
  for (let i = 0; i < nsRoadsX.length - 1; i++) {
    const xLeft = nsRoadsX[i] + HALF_ROAD + 35; // margin from road curb
    const xRight = nsRoadsX[i + 1] - HALF_ROAD - 35;
    const blockW = xRight - xLeft;

    for (let j = 0; j < ewRoadsY.length - 1; j++) {
      const yTop = ewRoadsY[j] + HALF_ROAD + 35;
      const yBottom = ewRoadsY[j + 1] - HALF_ROAD - 35;
      const blockH = yBottom - yTop;

      if (blockW > 150 && blockH > 150) {
        // District determines architectural styling
        const midX = (xLeft + xRight) / 2;
        const midY = (yTop + yBottom) / 2;
        const district = getDistrictAt(midX, midY);

        let subDivisions = 1;
        if (blockW > 400 && blockH > 350) subDivisions = 2;

        if (subDivisions === 1) {
          const bldgH = 50 + (i * 23 + j * 37) % 110;
          const colors = getBuildingColors(district.id, i + j);
          buildings.push({
            x: xLeft,
            y: yTop,
            w: blockW,
            h: blockH,
            height3D: bldgH,
            roofColor: colors.roof,
            wallColor: colors.wall,
            trimColor: colors.trim,
            name: buildingNames[nameIndex % buildingNames.length],
            district: district.name,
            roofDetails: generateRoofDetails(xLeft, yTop, blockW, blockH, bldgH),
          });
          nameIndex++;
        } else {
          // 2 buildings in this block
          const halfH = Math.floor(blockH / 2) - 15;
          const bldgH1 = 60 + (i * 17 + j * 29) % 95;
          const bldgH2 = 50 + (i * 31 + j * 13) % 115;

          const colors1 = getBuildingColors(district.id, i + j);
          const colors2 = getBuildingColors(district.id, i + j + 3);

          buildings.push({
            x: xLeft,
            y: yTop,
            w: blockW,
            h: halfH,
            height3D: bldgH1,
            roofColor: colors1.roof,
            wallColor: colors1.wall,
            trimColor: colors1.trim,
            name: buildingNames[nameIndex % buildingNames.length],
            district: district.name,
            roofDetails: generateRoofDetails(xLeft, yTop, blockW, halfH, bldgH1),
          });
          nameIndex++;

          buildings.push({
            x: xLeft,
            y: yTop + halfH + 30,
            w: blockW,
            h: halfH,
            height3D: bldgH2,
            roofColor: colors2.roof,
            wallColor: colors2.wall,
            trimColor: colors2.trim,
            name: buildingNames[nameIndex % buildingNames.length],
            district: district.name,
            roofDetails: generateRoofDetails(xLeft, yTop + halfH + 30, blockW, halfH, bldgH2),
          });
          nameIndex++;
        }
      }
    }
  }

  // Coastal Waterfront & Beach (West edge)
  waterTiles.push({
    x: 0,
    y: 0,
    w: 420,
    h: MAP_HEIGHT,
  });

  // Palm Trees placement along Ocean Drive and Parks
  for (let y = 300; y <= 4500; y += 140) {
    // West beach promenade palm row
    palmTrees.push({ x: 500, y: y, size: 28 + (y % 15), swayOffset: (y * 0.05) % Math.PI });
    // East boulevard palm row
    palmTrees.push({ x: 700, y: y + 40, size: 26 + (y % 12), swayOffset: (y * 0.07) % Math.PI });
    // Neon Palms avenue palms
    palmTrees.push({ x: 2900, y: y + 70, size: 27, swayOffset: (y * 0.04) % Math.PI });
  }

  // Streetlights along roads and intersections
  for (const rx of nsRoadsX) {
    for (let y = 350; y <= 4450; y += 220) {
      streetLights.push({ x: rx - HALF_ROAD - 10, y: y, color: '#ffea79' });
      streetLights.push({ x: rx + HALF_ROAD + 10, y: y, color: '#ffea79' });
    }
  }

  function getBuildingColors(districtId, seed) {
    if (districtId === 'downtown') {
      const palette = [
        { roof: '#1e2430', wall: '#151922', trim: '#00d2ff' },
        { roof: '#283040', wall: '#1b2230', trim: '#38ef7d' },
        { roof: '#1a1f2b', wall: '#10141c', trim: '#00b4d8' },
      ];
      return palette[seed % palette.length];
    } else if (districtId === 'neon_palms') {
      const palette = [
        { roof: '#2c1930', wall: '#1a0e1c', trim: '#ff007f' },
        { roof: '#381628', wall: '#200b16', trim: '#ff7700' },
        { roof: '#201835', wall: '#130d22', trim: '#7928ca' },
      ];
      return palette[seed % palette.length];
    } else if (districtId === 'marina') {
      const palette = [
        { roof: '#1c353b', wall: '#102226', trim: '#06d6a0' },
        { roof: '#244147', wall: '#14272c', trim: '#48cae4' },
      ];
      return palette[seed % palette.length];
    } else if (districtId === 'docks') {
      const palette = [
        { roof: '#352e25', wall: '#211c15', trim: '#ffb703' },
        { roof: '#3a342e', wall: '#231f1a', trim: '#e07a5f' },
      ];
      return palette[seed % palette.length];
    }
    // Ocean Promenade
    const palette = [
      { roof: '#3d2b27', wall: '#261b18', trim: '#ff7b54' },
      { roof: '#383226', wall: '#242017', trim: '#f4a261' },
    ];
    return palette[seed % palette.length];
  }

  function generateRoofDetails(bx, by, bw, bh, bH) {
    const details = [];
    // Air conditioning units
    const numAC = Math.floor(bw / 120) + 1;
    for (let k = 0; k < numAC; k++) {
      details.push({
        type: 'ac',
        x: bx + 25 + k * 80,
        y: by + 25 + (k * 43) % Math.max(20, bh - 60),
        w: 24,
        h: 20,
      });
    }
    // Helipad for tall towers
    if (bH > 110 && bw > 220 && bh > 220) {
      details.push({
        type: 'helipad',
        x: bx + bw / 2,
        y: by + bh / 2,
        radius: 38,
      });
    }
    // Neon signage location
    details.push({
      type: 'neon',
      x: bx + 20,
      y: by + 12,
      w: Math.min(bw - 40, 180),
    });
    return details;
  }

  function getDistrictAt(x, y) {
    for (const d of DISTRICTS) {
      if (x >= d.bounds.x && x < d.bounds.x + d.bounds.w && y >= d.bounds.y && y < d.bounds.y + d.bounds.h) {
        return d;
      }
    }
    return DISTRICTS[0];
  }

  function checkCollision(x, y, radius) {
    // World bounds
    if (x - radius < 440 || x + radius > MAP_WIDTH - 150 || y - radius < 200 || y + radius > MAP_HEIGHT - 200) {
      return true;
    }
    // Building collisions
    for (let k = 0; k < buildings.length; k++) {
      const b = buildings[k];
      if (
        x + radius > b.x &&
        x - radius < b.x + b.w &&
        y + radius > b.y &&
        y - radius < b.y + b.h
      ) {
        return true;
      }
    }
    return false;
  }

  function resolveCircleBoxCollision(circleX, circleY, radius, boxX, boxY, boxW, boxH) {
    const closestX = Math.max(boxX, Math.min(circleX, boxX + boxW));
    const closestY = Math.max(boxY, Math.min(circleY, boxY + boxH));
    const dx = circleX - closestX;
    const dy = circleY - closestY;
    const distSq = dx * dx + dy * dy;

    if (distSq < radius * radius && distSq > 0.0001) {
      const dist = Math.sqrt(distSq);
      const overlap = radius - dist;
      return {
        collided: true,
        normalX: dx / dist,
        normalY: dy / dist,
        pushX: (dx / dist) * overlap,
        pushY: (dy / dist) * overlap,
      };
    }
    return { collided: false };
  }

  function getClosestRoadNode(x, y) {
    // Finds nearest road lane point for AI traffic and police routing
    let closestDist = Infinity;
    let target = { x: x, y: y, dir: 'ns' };

    for (const rx of nsRoadsX) {
      const dist = Math.abs(x - rx);
      if (dist < closestDist) {
        closestDist = dist;
        target = { x: rx, y: y, dir: 'ns' };
      }
    }
    for (const ry of ewRoadsY) {
      const dist = Math.abs(y - ry);
      if (dist < closestDist) {
        closestDist = dist;
        target = { x: x, y: ry, dir: 'ew' };
      }
    }
    return target;
  }

  return {
    roads,
    intersections,
    buildings,
    palmTrees,
    streetLights,
    waterTiles,
    nsRoadsX,
    ewRoadsY,
    ROAD_WIDTH,
    HALF_ROAD,
    getDistrictAt,
    checkCollision,
    resolveCircleBoxCollision,
    getClosestRoadNode,
  };
}
