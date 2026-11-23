// Coral Bay: Underworld - Input Controller & Keyboard/Mouse Mapper

export function createInput(canvas, camera) {
  const keys = {};
  let mouseScreenX = 0;
  let mouseScreenY = 0;
  let mouseDown = false;
  let rightMouseDown = false;
  let enterVehiclePressed = false;
  let nextWeaponPressed = false;
  let radioPressed = false;
  let pausePressed = false;
  let selectedWeaponIndex = undefined;

  window.addEventListener('keydown', (e) => {
    keys[e.code] = true;

    if (e.code === 'KeyE' || e.code === 'KeyF' || e.code === 'Enter') {
      enterVehiclePressed = true;
    }
    if (e.code === 'KeyQ') {
      nextWeaponPressed = true;
    }
    if (e.code === 'KeyR') {
      radioPressed = true;
    }
    if (e.code === 'Escape' || e.code === 'Tab') {
      pausePressed = true;
      e.preventDefault();
    }
    if (e.code === 'Digit1') selectedWeaponIndex = 0;
    if (e.code === 'Digit2') selectedWeaponIndex = 1;
    if (e.code === 'Digit3') selectedWeaponIndex = 2;
    if (e.code === 'Digit4') selectedWeaponIndex = 3;
  });

  window.addEventListener('keyup', (e) => {
    keys[e.code] = false;
  });

  canvas.addEventListener('mousemove', (e) => {
    const rect = canvas.getBoundingClientRect();
    mouseScreenX = e.clientX - rect.left;
    mouseScreenY = e.clientY - rect.top;
  });

  canvas.addEventListener('mousedown', (e) => {
    if (e.button === 0) mouseDown = true;
    if (e.button === 2) rightMouseDown = true;
  });

  window.addEventListener('mouseup', (e) => {
    if (e.button === 0) mouseDown = false;
    if (e.button === 2) rightMouseDown = false;
  });

  canvas.addEventListener('contextmenu', (e) => e.preventDefault());

  function poll(player, viewW, viewH) {
    // Determine aiming angle from screen center or player
    const screenAimX = mouseScreenX;
    const screenAimY = mouseScreenY;
    const playerScreen = camera.toScreen(player.x, player.y, viewW, viewH);
    const aimAngle = Math.atan2(screenAimY - playerScreen.y, screenAimX - playerScreen.x);

    // On-foot movement vector
    let moveX = 0;
    let moveY = 0;
    if (keys['KeyW'] || keys['ArrowUp']) moveY -= 1;
    if (keys['KeyS'] || keys['ArrowDown']) moveY += 1;
    if (keys['KeyA'] || keys['ArrowLeft']) moveX -= 1;
    if (keys['KeyD'] || keys['ArrowRight']) moveX += 1;

    // Normalize diagonal
    if (moveX !== 0 && moveY !== 0) {
      const len = Math.sqrt(moveX * moveX + moveY * moveY);
      moveX /= len;
      moveY /= len;
    }

    // Vehicle Driving Controls
    let throttle = 0;
    let steer = 0;
    let handbrake = false;

    if (keys['KeyW'] || keys['ArrowUp']) throttle += 1;
    if (keys['KeyS'] || keys['ArrowDown']) throttle -= 1;
    if (keys['KeyA'] || keys['ArrowLeft']) steer -= 1;
    if (keys['KeyD'] || keys['ArrowRight']) steer += 1;
    if (keys['Space']) handbrake = true;

    const sprint = keys['ShiftLeft'] || keys['ShiftRight'] || false;
    const nitro = sprint; // In vehicle, Shift activates nitro!
    const attack = mouseDown || (keys['Space'] && !player.inVehicle);
    const aiming = rightMouseDown;

    const result = {
      moveX,
      moveY,
      aimAngle,
      aiming,
      sprint,
      attack,
      throttle,
      steer,
      handbrake,
      nitro,
      enterVehicle: enterVehiclePressed,
      nextWeapon: nextWeaponPressed,
      weaponIndex: selectedWeaponIndex,
      radio: radioPressed,
      pause: pausePressed,
    };

    // Reset single-frame triggers
    enterVehiclePressed = false;
    nextWeaponPressed = false;
    radioPressed = false;
    pausePressed = false;
    selectedWeaponIndex = undefined;

    return result;
  }

  return {
    poll,
  };
}
