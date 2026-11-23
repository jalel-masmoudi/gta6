// Coral Bay: Underworld - Camera System

export function createCamera() {
  return {
    x: 1200,
    y: 800,
    targetX: 1200,
    targetY: 800,
    zoom: 1.0,
    targetZoom: 1.0,
    shake: 0,
    shakeX: 0,
    shakeY: 0,

    update(dt, targetX, targetY, speed = 0) {
      // Dynamic zoom based on speed (zoom out at high speeds for car chases)
      const baseZoom = 1.0;
      const speedFactor = Math.min(speed / 18, 1);
      this.targetZoom = baseZoom - speedFactor * 0.28;
      this.zoom += (this.targetZoom - this.zoom) * Math.min(1, dt * 4.0);

      // Smooth camera follow with lead offset
      const followSpeed = 6.0;
      this.targetX = targetX;
      this.targetY = targetY;
      this.x += (this.targetX - this.x) * Math.min(1, dt * followSpeed);
      this.y += (this.targetY - this.y) * Math.min(1, dt * followSpeed);

      // Screen shake decay
      if (this.shake > 0) {
        this.shakeX = (Math.random() - 0.5) * this.shake * 2;
        this.shakeY = (Math.random() - 0.5) * this.shake * 2;
        this.shake = Math.max(0, this.shake - dt * 30);
      } else {
        this.shakeX = 0;
        this.shakeY = 0;
      }
    },

    addShake(amount) {
      this.shake = Math.min(25, this.shake + amount);
    },

    toScreen(worldX, worldY, viewWidth, viewHeight) {
      const cx = viewWidth / 2;
      const cy = viewHeight / 2;
      return {
        x: cx + (worldX - (this.x + this.shakeX)) * this.zoom,
        y: cy + (worldY - (this.y + this.shakeY)) * this.zoom,
      };
    },

    toWorld(screenX, screenY, viewWidth, viewHeight) {
      const cx = viewWidth / 2;
      const cy = viewHeight / 2;
      return {
        x: this.x + this.shakeX + (screenX - cx) / this.zoom,
        y: this.y + this.shakeY + (screenY - cy) / this.zoom,
      };
    },

    isInView(worldX, worldY, radius, viewWidth, viewHeight) {
      const margin = (radius + 200) / this.zoom;
      const halfW = (viewWidth / 2) / this.zoom;
      const halfH = (viewHeight / 2) / this.zoom;
      return (
        worldX >= this.x - halfW - margin &&
        worldX <= this.x + halfW + margin &&
        worldY >= this.y - halfH - margin &&
        worldY <= this.y + halfH + margin
      );
    },
  };
}
