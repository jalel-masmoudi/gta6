// Coral Bay: Underworld - Story Mission Engine & Objectives
import { MISSIONS } from './config.js';

export function createMissionManager(combat, fleet, police) {
  let activeMissionIndex = 0;
  let currentStageIndex = 0;
  let missionState = 'inactive'; // 'inactive' | 'active' | 'passed' | 'failed'
  let stageTimer = 0;
  let activeDialogue = null;
  let dialogueTimer = 0;
  let completedMissions = [];

  function startMission(missionIndex) {
    if (missionIndex < 0 || missionIndex >= MISSIONS.length) return;
    activeMissionIndex = missionIndex;
    currentStageIndex = 0;
    missionState = 'active';
    stageTimer = 0;

    const mission = MISSIONS[activeMissionIndex];
    setDialogue(mission.client, mission.dialogueStart, 6.0);

    // Setup stage 0
    setupStage(mission, 0);
  }

  function setupStage(mission, stageIdx) {
    const stage = mission.stages[stageIdx];
    if (!stage) return;

    if (stage.targetType === 'eliminate') {
      // Spawn mission enemies
      if (mission.id === 'mission_1') {
        combat.spawnEnemy(2820, 680, 'pistol');
        combat.spawnEnemy(2860, 720, 'fists');
      } else if (stageIdx === 1 && mission.id === 'mission_3') {
        combat.spawnEnemy(1820, 3880, 'smg');
        combat.spawnEnemy(1860, 3920, 'pistol');
        combat.spawnEnemy(1790, 3950, 'smg');
        combat.spawnEnemy(1840, 3850, 'rifle');
        combat.spawnEnemy(1880, 3900, 'smg');
      } else if (stageIdx === 1 && mission.id === 'mission_4') {
        for (let i = 0; i < 6; i++) {
          const angle = (i / 6) * Math.PI * 2;
          combat.spawnEnemy(3600 + Math.cos(angle) * 70, 1900 + Math.sin(angle) * 70, i % 2 === 0 ? 'rifle' : 'smg', i === 0);
        }
      }
    } else if (stage.targetType === 'steal_vehicle') {
      // Ensure target car is spawned at location
      const car = fleet.spawn('venom', 1100, 2200, Math.PI / 2, false);
      car.isMissionTarget = true;
    } else if (stage.targetType === 'wanted_escape') {
      police.setWantedLevel(stage.stars || 2);
    }
  }

  function update(dt, player, onSound) {
    if (dialogueTimer > 0) {
      dialogueTimer -= dt;
      if (dialogueTimer <= 0) activeDialogue = null;
    }

    if (missionState !== 'active') return;

    const mission = MISSIONS[activeMissionIndex];
    const stage = mission.stages[currentStageIndex];
    if (!stage) return;

    stageTimer += dt;

    // Check Stage Completion
    let stageCompleted = false;

    if (stage.targetType === 'location') {
      const dx = player.x - stage.x;
      const dy = player.y - stage.y;
      if (dx * dx + dy * dy < stage.radius * stage.radius) {
        stageCompleted = true;
      }
    } else if (stage.targetType === 'eliminate') {
      let aliveCount = 0;
      for (const en of combat.enemies) {
        if (!en.isDead) aliveCount++;
      }
      if (aliveCount === 0) {
        stageCompleted = true;
      }
    } else if (stage.targetType === 'steal_vehicle') {
      if (player.inVehicle && player.vehicle && player.vehicle.type === stage.vehicleId) {
        stageCompleted = true;
      }
    } else if (stage.targetType === 'wanted_escape' || stage.targetType === 'lose_wanted') {
      if (police.wantedStars === 0) {
        stageCompleted = true;
      }
    } else if (stage.targetType === 'pickup_cash') {
      stageCompleted = true; // Auto progress after eliminations
    }

    if (stageCompleted) {
      currentStageIndex++;
      if (onSound) onSound('objective', player.x, player.y);

      if (currentStageIndex >= mission.stages.length) {
        // Mission Passed!
        missionState = 'passed';
        player.addCash(mission.reward);
        player.missionsCompleted++;
        if (!completedMissions.includes(mission.id)) {
          completedMissions.push(mission.id);
        }
        setDialogue(mission.client, mission.dialogueSuccess, 7.0);
        if (onSound) onSound('mission_passed', player.x, player.y);
      } else {
        setupStage(mission, currentStageIndex);
      }
    }
  }

  function setDialogue(speaker, text, duration = 5.0) {
    activeDialogue = { speaker, text };
    dialogueTimer = duration;
  }

  function getWaypoint() {
    if (missionState !== 'active') return null;
    const mission = MISSIONS[activeMissionIndex];
    const stage = mission?.stages[currentStageIndex];
    if (!stage) return null;

    if (stage.targetType === 'location') {
      return { x: stage.x, y: stage.y, text: stage.text };
    } else if (stage.targetType === 'steal_vehicle') {
      return { x: 1100, y: 2200, text: stage.text };
    }
    return null;
  }

  return {
    get activeMissionIndex() { return activeMissionIndex; },
    get currentStageIndex() { return currentStageIndex; },
    get missionState() { return missionState; },
    get activeDialogue() { return activeDialogue; },
    get completedMissions() { return completedMissions; },
    startMission,
    update,
    setDialogue,
    getWaypoint,
    getCurrentObjectiveText() {
      if (missionState !== 'active') return 'Explore Coral Bay / Steal cars & recruit crew';
      const m = MISSIONS[activeMissionIndex];
      return m?.stages[currentStageIndex]?.text || 'Complete the assignment';
    },
    getCurrentMissionTitle() {
      if (missionState !== 'active') return 'FREE ROAM';
      return MISSIONS[activeMissionIndex]?.title || 'MISSION IN PROGRESS';
    },
    loadProgress(completedList) {
      if (Array.isArray(completedList)) {
        completedMissions = [...completedList];
        if (completedMissions.length < MISSIONS.length) {
          activeMissionIndex = completedMissions.length;
        }
      }
    },
  };
}
