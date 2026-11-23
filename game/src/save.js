// Coral Bay: Underworld - Persistence & Save State Management
import { SAVE_KEY } from './config.js';

export function createSaveSystem() {
  function save(player, missions) {
    try {
      const data = {
        version: 1,
        savedAt: Date.now(),
        player: {
          cash: player.cash,
          armor: player.armor,
          weapons: player.weapons,
          ammo: player.ammo,
          kills: player.kills,
          carsStolen: player.carsStolen,
          x: player.x,
          y: player.y,
        },
        missions: {
          activeMissionIndex: missions.activeMissionIndex,
          completedMissions: missions.completedMissions,
        },
      };
      localStorage.setItem(SAVE_KEY, JSON.stringify(data));
      return true;
    } catch {
      return false;
    }
  }

  function load() {
    try {
      const raw = localStorage.getItem(SAVE_KEY);
      if (!raw) return null;
      const data = JSON.parse(raw);
      if (data && data.version === 1) return data;
      return null;
    } catch {
      return null;
    }
  }

  function hasSave() {
    try {
      return Boolean(localStorage.getItem(SAVE_KEY));
    } catch {
      return false;
    }
  }

  function clearSave() {
    try {
      localStorage.removeItem(SAVE_KEY);
    } catch {}
  }

  return {
    save,
    load,
    hasSave,
    clearSave,
  };
}
