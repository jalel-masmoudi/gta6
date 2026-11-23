// Coral Bay: Underworld - Procedural Audio Engine & Radio Synthesizer

export function createAudio() {
  let ctx = null;
  let isMuted = false;
  let masterGain = null;
  let engineOsc = null;
  let engineGain = null;
  let sirenOsc = null;
  let sirenGain = null;
  let radioStationIndex = 0;
  let radioTimer = 0;
  let radioStep = 0;

  const RADIO_STATIONS = [
    { name: 'Coral Bay Wave', genre: 'Synthwave / Retrowave', bpm: 120 },
    { name: 'Sunspire FM', genre: 'Sunset Beach Funk', bpm: 114 },
    { name: 'Sub City Radio', genre: 'Underground Electro', bpm: 128 },
    { name: 'RADIO OFF', genre: 'Muted', bpm: 0 },
  ];

  function init() {
    if (ctx) return;
    try {
      const AudioContextClass = window.AudioContext || window.webkitAudioContext;
      if (!AudioContextClass) return;
      ctx = new AudioContextClass();
      masterGain = ctx.createGain();
      masterGain.gain.setValueAtTime(0.35, ctx.currentTime);
      masterGain.connect(ctx.destination);

      // Continuous engine sound
      engineOsc = ctx.createOscillator();
      engineOsc.type = 'sawtooth';
      engineGain = ctx.createGain();
      engineGain.gain.setValueAtTime(0, ctx.currentTime);
      engineOsc.connect(engineGain);
      engineGain.connect(masterGain);
      engineOsc.start();

      // Continuous police siren sound
      sirenOsc = ctx.createOscillator();
      sirenOsc.type = 'triangle';
      sirenGain = ctx.createGain();
      sirenGain.gain.setValueAtTime(0, ctx.currentTime);
      sirenOsc.connect(sirenGain);
      sirenGain.connect(masterGain);
      sirenOsc.start();
    } catch {
      // AudioContext unavailable
    }
  }

  function playSound(type, x = 0, y = 0) {
    if (isMuted || !ctx) return;
    if (ctx.state === 'suspended') {
      ctx.resume().catch(() => {});
    }

    const t = ctx.currentTime;

    if (type === 'pistol') {
      createNoiseShot(t, 0.14, 850, 120);
    } else if (type === 'smg') {
      createNoiseShot(t, 0.08, 1100, 160);
    } else if (type === 'rifle') {
      createNoiseShot(t, 0.18, 650, 90);
    } else if (type === 'punch' || type === 'hit') {
      const osc = ctx.createOscillator();
      const gain = ctx.createGain();
      osc.type = 'triangle';
      osc.frequency.setValueAtTime(140, t);
      osc.frequency.exponentialRampToValueAtTime(40, t + 0.12);
      gain.gain.setValueAtTime(0.4, t);
      gain.gain.exponentialRampToValueAtTime(0.01, t + 0.12);
      osc.connect(gain);
      gain.connect(masterGain);
      osc.start(t);
      osc.stop(t + 0.13);
    } else if (type === 'cash') {
      playTone(1320, 0.08, 'sine', t);
      playTone(1760, 0.12, 'sine', t + 0.08);
    } else if (type === 'objective') {
      playTone(880, 0.1, 'sine', t);
      playTone(1174, 0.2, 'sine', t + 0.1);
    } else if (type === 'mission_passed') {
      playTone(587, 0.14, 'triangle', t);
      playTone(740, 0.14, 'triangle', t + 0.14);
      playTone(880, 0.16, 'triangle', t + 0.28);
      playTone(1174, 0.45, 'triangle', t + 0.44);
    } else if (type === 'crash') {
      createNoiseShot(t, 0.35, 450, 60, true);
    } else if (type === 'explosion') {
      createNoiseShot(t, 0.7, 280, 35, true);
      const sub = ctx.createOscillator();
      const subGain = ctx.createGain();
      sub.type = 'sine';
      sub.frequency.setValueAtTime(110, t);
      sub.frequency.exponentialRampToValueAtTime(25, t + 0.6);
      subGain.gain.setValueAtTime(0.6, t);
      subGain.gain.exponentialRampToValueAtTime(0.01, t + 0.6);
      sub.connect(subGain);
      subGain.connect(masterGain);
      sub.start(t);
      sub.stop(t + 0.65);
    } else if (type === 'screech') {
      createFilterNoise(t, 0.18, 1400);
    }
  }

  function playTone(freq, duration, waveType = 'sine', startTime = ctx.currentTime) {
    if (!ctx) return;
    const osc = ctx.createOscillator();
    const gain = ctx.createGain();
    osc.type = waveType;
    osc.frequency.setValueAtTime(freq, startTime);
    gain.gain.setValueAtTime(0.3, startTime);
    gain.gain.exponentialRampToValueAtTime(0.001, startTime + duration);
    osc.connect(gain);
    gain.connect(masterGain);
    osc.start(startTime);
    osc.stop(startTime + duration + 0.02);
  }

  function createNoiseShot(t, duration, startFreq, endFreq, heavy = false) {
    if (!ctx) return;
    const bufferSize = ctx.sampleRate * duration;
    const buffer = ctx.createBuffer(1, bufferSize, ctx.sampleRate);
    const data = buffer.getChannelData(0);
    for (let i = 0; i < bufferSize; i++) {
      data[i] = Math.random() * 2 - 1;
    }
    const noise = ctx.createBufferSource();
    noise.buffer = buffer;

    const filter = ctx.createBiquadFilter();
    filter.type = 'lowpass';
    filter.frequency.setValueAtTime(startFreq, t);
    filter.frequency.exponentialRampToValueAtTime(endFreq, t + duration);

    const gain = ctx.createGain();
    gain.gain.setValueAtTime(heavy ? 0.65 : 0.45, t);
    gain.gain.exponentialRampToValueAtTime(0.01, t + duration);

    noise.connect(filter);
    filter.connect(gain);
    gain.connect(masterGain);
    noise.start(t);
    noise.stop(t + duration);
  }

  function createFilterNoise(t, duration, centerFreq) {
    if (!ctx) return;
    const bufferSize = ctx.sampleRate * duration;
    const buffer = ctx.createBuffer(1, bufferSize, ctx.sampleRate);
    const data = buffer.getChannelData(0);
    for (let i = 0; i < bufferSize; i++) {
      data[i] = Math.random() * 2 - 1;
    }
    const noise = ctx.createBufferSource();
    noise.buffer = buffer;

    const filter = ctx.createBiquadFilter();
    filter.type = 'bandpass';
    filter.frequency.setValueAtTime(centerFreq, t);
    filter.Q.setValueAtTime(3.0, t);

    const gain = ctx.createGain();
    gain.gain.setValueAtTime(0.22, t);
    gain.gain.exponentialRampToValueAtTime(0.01, t + duration);

    noise.connect(filter);
    filter.connect(gain);
    gain.connect(masterGain);
    noise.start(t);
    noise.stop(t + duration);
  }

  function updateEngine(speed, maxSpeed, inVehicle) {
    if (!ctx || !engineGain || !engineOsc) return;
    const t = ctx.currentTime;
    if (inVehicle && !isMuted) {
      const speedNorm = Math.min(1.0, Math.abs(speed) / (maxSpeed || 15));
      const targetFreq = 45 + speedNorm * 110;
      engineOsc.frequency.setTargetAtTime(targetFreq, t, 0.08);
      engineGain.gain.setTargetAtTime(0.12 + speedNorm * 0.15, t, 0.08);
    } else {
      engineGain.gain.setTargetAtTime(0, t, 0.1);
    }
  }

  function updateSirens(activeSirensCount) {
    if (!ctx || !sirenGain || !sirenOsc) return;
    const t = ctx.currentTime;
    if (activeSirensCount > 0 && !isMuted) {
      const cycle = (t * 2.2) % 1.0;
      const freq = cycle < 0.5 ? 780 : 960;
      sirenOsc.frequency.setValueAtTime(freq, t);
      sirenGain.gain.setTargetAtTime(0.14, t, 0.05);
    } else {
      sirenGain.gain.setTargetAtTime(0, t, 0.08);
    }
  }

  function updateRadio(dt, inVehicle) {
    if (!ctx || !inVehicle || radioStationIndex === 3 || isMuted) return;
    const station = RADIO_STATIONS[radioStationIndex];
    radioTimer += dt;
    const stepDuration = 60 / (station.bpm * 2);

    if (radioTimer >= stepDuration) {
      radioTimer -= stepDuration;
      radioStep = (radioStep + 1) % 16;
      playRadioNote(station, radioStep);
    }
  }

  function playRadioNote(station, step) {
    if (!ctx) return;
    const t = ctx.currentTime;

    // Synthwave / Beach Funk / Electro notes
    if (station.name === 'Coral Bay Wave') {
      // Retrowave bassline arpeggio (C2, D#2, F2, G2)
      const bassNotes = [65.4, 65.4, 77.8, 77.8, 87.3, 87.3, 98.0, 87.3];
      const freq = bassNotes[step % bassNotes.length];
      playTone(freq, 0.12, 'sawtooth', t);

      // 4-on-the-floor kick on beats 0, 4, 8, 12
      if (step % 4 === 0) {
        playTone(60, 0.08, 'sine', t);
      }
      // Lead melodic chime on high steps
      if (step === 3 || step === 7 || step === 11 || step === 14) {
        const leadNotes = [523.2, 587.3, 659.2, 783.9];
        playTone(leadNotes[Math.floor(step / 4)], 0.2, 'sine', t);
      }
    } else if (station.name === 'Sunspire FM') {
      // Funk bassline
      const funkBass = [82.4, 0, 82.4, 98.0, 110.0, 0, 98.0, 123.4];
      const freq = funkBass[step % funkBass.length];
      if (freq > 0) playTone(freq, 0.1, 'triangle', t);
    } else if (station.name === 'Sub City Radio') {
      // Gritty bass
      if (step % 2 === 0) {
        playTone(55, 0.14, 'square', t);
      }
    }
  }

  function cycleRadio() {
    radioStationIndex = (radioStationIndex + 1) % RADIO_STATIONS.length;
    return RADIO_STATIONS[radioStationIndex];
  }

  return {
    init,
    playSound,
    updateEngine,
    updateSirens,
    updateRadio,
    cycleRadio,
    getCurrentStation() { return RADIO_STATIONS[radioStationIndex]; },
  };
}
