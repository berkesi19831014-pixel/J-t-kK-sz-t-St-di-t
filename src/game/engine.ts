import {
  LevelData,
  PlayerState,
  EnemyEntity,
  MovingPlatformEntity,
  CollectibleEntity,
  TileType,
} from './types';
import { sounds } from './audio';

export interface Particle {
  x: number;
  y: number;
  vx: number;
  vy: number;
  color: string;
  size: number;
  alpha: number;
  life: number;
  maxLife: number;
}

export interface EngineStats {
  score: number;
  coins: number;
  lives: number;
  maxLives: number;
  status: 'playing' | 'won' | 'gameover';
  timeElapsed: number;
  hasJumpPowerup: boolean;
  hasSpeedPowerup: boolean;
}

export class GameEngine {
  private canvas: HTMLCanvasElement;
  private ctx: CanvasRenderingContext2D;
  private level: LevelData;
  private animationId: number | null = null;
  private lastTime: number = 0;

  // Entities & State
  public player: PlayerState;
  public enemies: EnemyEntity[] = [];
  public movingPlatforms: MovingPlatformEntity[] = [];
  public collectibles: CollectibleEntity[] = [];
  public particles: Particle[] = [];

  // Keys
  private keys: Record<string, boolean> = {};

  // Stats
  public score = 0;
  public coins = 0;
  public lives = 3;
  public status: 'playing' | 'won' | 'gameover' = 'playing';
  public timeElapsed = 0;

  // Custom player sprite pixels (16x16 color array) if customized
  public customPlayerSprite: string[] | null = null;

  // Callback on stat change
  public onStatsChange?: (stats: EngineStats) => void;

  constructor(canvas: HTMLCanvasElement, level: LevelData, customPlayerSprite: string[] | null = null) {
    this.canvas = canvas;
    const context = canvas.getContext('2d');
    if (!context) throw new Error('Could not get 2d context');
    this.ctx = context;
    this.level = level;
    this.customPlayerSprite = customPlayerSprite;

    this.player = this.createDefaultPlayer();
    this.setupLevelEntities();
    this.bindEvents();
  }

  private createDefaultPlayer(): PlayerState {
    return {
      x: 32,
      y: 32,
      vx: 0,
      vy: 0,
      width: 24,
      height: 28,
      isGrounded: false,
      canDoubleJump: true,
      facing: 'right',
      invulnerableTimer: 0,
      hasJumpPowerup: false,
      hasSpeedPowerup: false,
      speedPowerupTimer: 0,
    };
  }

  private bindEvents = () => {
    window.addEventListener('keydown', this.handleKeyDown);
    window.addEventListener('keyup', this.handleKeyUp);
  };

  public unbindEvents = () => {
    window.removeEventListener('keydown', this.handleKeyDown);
    window.removeEventListener('keyup', this.handleKeyUp);
    this.stop();
  };

  private handleKeyDown = (e: KeyboardEvent) => {
    if (['ArrowUp', 'ArrowDown', 'ArrowLeft', 'ArrowRight', 'Space'].includes(e.code)) {
      e.preventDefault();
    }
    this.keys[e.code] = true;

    // Jump handling on initial press
    if ((e.code === 'ArrowUp' || e.code === 'KeyW' || e.code === 'Space') && this.status === 'playing') {
      this.attemptJump();
    }
  };

  private handleKeyUp = (e: KeyboardEvent) => {
    this.keys[e.code] = false;
  };

  // Virtual touch controls for mobile
  public pressVirtualKey(key: 'left' | 'right' | 'jump', pressed: boolean) {
    if (key === 'left') this.keys['ArrowLeft'] = pressed;
    if (key === 'right') this.keys['ArrowRight'] = pressed;
    if (key === 'jump') {
      if (pressed && !this.keys['ArrowUp']) {
        this.attemptJump();
      }
      this.keys['ArrowUp'] = pressed;
    }
  }

  public setupLevelEntities() {
    this.score = 0;
    this.coins = 0;
    this.lives = this.level.settings.maxLives;
    this.status = 'playing';
    this.timeElapsed = 0;
    this.particles = [];
    this.enemies = [];
    this.movingPlatforms = [];
    this.collectibles = [];

    const tileSize = this.level.tileSize;
    let spawnFound = false;

    let enemyId = 0;
    let platId = 0;
    let collId = 0;

    for (let y = 0; y < this.level.height; y++) {
      for (let x = 0; x < this.level.width; x++) {
        const t = this.level.tiles[y]?.[x] || 'empty';
        const px = x * tileSize;
        const py = y * tileSize;

        if (t === 'player_spawn') {
          this.player.x = px + 4;
          this.player.y = py + 2;
          this.player.vx = 0;
          this.player.vy = 0;
          this.player.facing = 'right';
          spawnFound = true;
        } else if (t === 'enemy_slime') {
          this.enemies.push({
            id: ++enemyId,
            type: 'slime',
            x: px + 2,
            y: py + 8,
            width: 28,
            height: 24,
            vx: this.level.settings.enemySpeed,
            vy: 0,
            startX: px,
            patrolDistance: tileSize * 3,
            direction: 1,
            alive: true,
          });
        } else if (t === 'enemy_bat') {
          this.enemies.push({
            id: ++enemyId,
            type: 'bat',
            x: px + 4,
            y: py + 4,
            width: 24,
            height: 20,
            vx: this.level.settings.enemySpeed * 1.2,
            vy: 0,
            startX: px,
            patrolDistance: tileSize * 4,
            direction: 1,
            alive: true,
          });
        } else if (t === 'moving_platform_h') {
          this.movingPlatforms.push({
            id: ++platId,
            type: 'horizontal',
            x: px,
            y: py + 4,
            width: tileSize * 2,
            height: 14,
            startX: px,
            startY: py + 4,
            range: tileSize * 3,
            progress: 0,
            speed: 0.02,
            prevX: px,
            prevY: py + 4,
          });
        } else if (t === 'moving_platform_v') {
          this.movingPlatforms.push({
            id: ++platId,
            type: 'vertical',
            x: px,
            y: py + 4,
            width: tileSize * 2,
            height: 14,
            startX: px,
            startY: py + 4,
            range: tileSize * 3,
            progress: 0,
            speed: 0.02,
            prevX: px,
            prevY: py + 4,
          });
        } else if (t === 'coin' || t === 'gem' || t === 'star' || t === 'powerup_jump' || t === 'powerup_speed') {
          this.collectibles.push({
            id: ++collId,
            type: t,
            x: px,
            y: py,
            collected: false,
          });
        }
      }
    }

    if (!spawnFound) {
      this.player.x = 32;
      this.player.y = 32;
    }

    this.notifyStats();
  }

  public notifyStats() {
    if (this.onStatsChange) {
      this.onStatsChange({
        score: this.score,
        coins: this.coins,
        lives: this.lives,
        maxLives: this.level.settings.maxLives,
        status: this.status,
        timeElapsed: Math.floor(this.timeElapsed),
        hasJumpPowerup: this.player.hasJumpPowerup,
        hasSpeedPowerup: this.player.hasSpeedPowerup,
      });
    }
  }

  public start() {
    this.lastTime = performance.now();
    const loop = (now: number) => {
      const dt = Math.min((now - this.lastTime) / 1000, 0.05); // cap delta
      this.lastTime = now;
      this.update(dt);
      this.render();
      if (this.status === 'playing' || this.particles.length > 0) {
        this.animationId = requestAnimationFrame(loop);
      }
    };
    this.animationId = requestAnimationFrame(loop);
  }

  public stop() {
    if (this.animationId !== null) {
      cancelAnimationFrame(this.animationId);
      this.animationId = null;
    }
  }

  public restart() {
    this.setupLevelEntities();
    this.stop();
    this.start();
  }

  private attemptJump() {
    const jumpPower = this.player.hasJumpPowerup 
      ? this.level.settings.jumpForce * 1.3 
      : this.level.settings.jumpForce;

    if (this.player.isGrounded) {
      this.player.vy = jumpPower;
      this.player.isGrounded = false;
      this.player.canDoubleJump = this.level.settings.allowDoubleJump;
      sounds.playJump();
      this.spawnDust(this.player.x + this.player.width / 2, this.player.y + this.player.height, '#ffffff');
    } else if (this.player.canDoubleJump) {
      this.player.vy = jumpPower * 0.9;
      this.player.canDoubleJump = false;
      sounds.playDoubleJump();
      this.spawnDust(this.player.x + this.player.width / 2, this.player.y + this.player.height, '#38bdf8');
    }
  }

  private spawnDust(x: number, y: number, color: string) {
    for (let i = 0; i < 6; i++) {
      this.particles.push({
        x,
        y,
        vx: (Math.random() - 0.5) * 3,
        vy: -Math.random() * 2,
        color,
        size: Math.random() * 4 + 2,
        alpha: 1,
        life: 0,
        maxLife: 0.35,
      });
    }
  }

  private spawnSparkles(x: number, y: number, color: string, count = 10) {
    for (let i = 0; i < count; i++) {
      const angle = Math.random() * Math.PI * 2;
      const speed = Math.random() * 4 + 1;
      this.particles.push({
        x,
        y,
        vx: Math.cos(angle) * speed,
        vy: Math.sin(angle) * speed,
        color,
        size: Math.random() * 3 + 2,
        alpha: 1,
        life: 0,
        maxLife: 0.5,
      });
    }
  }

  private isTileSolid(tx: number, ty: number): boolean {
    if (tx < 0 || tx >= this.level.width || ty < 0 || ty >= this.level.height) {
      return false;
    }
    const t = this.level.tiles[ty][tx];
    return t === 'solid_ground' || t === 'solid_brick' || t === 'solid_wood';
  }

  private isTileHazard(tx: number, ty: number): boolean {
    if (tx < 0 || tx >= this.level.width || ty < 0 || ty >= this.level.height) {
      return false;
    }
    const t = this.level.tiles[ty][tx];
    return t === 'hazard_spikes' || t === 'hazard_lava';
  }

  private isTileGoal(tx: number, ty: number): boolean {
    if (tx < 0 || tx >= this.level.width || ty < 0 || ty >= this.level.height) {
      return false;
    }
    return this.level.tiles[ty][tx] === 'goal';
  }

  private update(dt: number) {
    if (this.status === 'playing') {
      this.timeElapsed += dt;
    }

    // Update particles
    for (let i = this.particles.length - 1; i >= 0; i--) {
      const p = this.particles[i];
      p.x += p.vx;
      p.y += p.vy;
      p.life += dt;
      p.alpha = Math.max(0, 1 - p.life / p.maxLife);
      if (p.life >= p.maxLife) {
        this.particles.splice(i, 1);
      }
    }

    if (this.status !== 'playing') {
      return;
    }

    // Timers
    if (this.player.invulnerableTimer > 0) {
      this.player.invulnerableTimer -= dt;
    }
    if (this.player.hasSpeedPowerup) {
      this.player.speedPowerupTimer -= dt;
      if (this.player.speedPowerupTimer <= 0) {
        this.player.hasSpeedPowerup = false;
        this.notifyStats();
      }
    }

    // Moving platforms
    for (const plat of this.movingPlatforms) {
      plat.prevX = plat.x;
      plat.prevY = plat.y;
      plat.progress += plat.speed;
      const offset = Math.sin(plat.progress) * plat.range;
      if (plat.type === 'horizontal') {
        plat.x = plat.startX + offset;
      } else {
        plat.y = plat.startY + offset;
      }

      // Check if player stands on platform
      const px = this.player.x;
      const py = this.player.y;
      const pw = this.player.width;
      const ph = this.player.height;

      if (
        px + pw > plat.x &&
        px < plat.x + plat.width &&
        Math.abs(py + ph - plat.y) < 5 &&
        this.player.vy >= 0
      ) {
        this.player.y = plat.y - ph;
        this.player.vy = 0;
        this.player.isGrounded = true;
        this.player.canDoubleJump = this.level.settings.allowDoubleJump;
        // Carry player with platform
        this.player.x += plat.x - plat.prevX;
      }
    }

    // Horizontal player movement
    let moveDir = 0;
    if (this.keys['ArrowLeft'] || this.keys['KeyA']) moveDir -= 1;
    if (this.keys['ArrowRight'] || this.keys['KeyD']) moveDir += 1;

    let targetSpeed = moveDir * this.level.settings.moveSpeed;
    if (this.player.hasSpeedPowerup) {
      targetSpeed *= 1.45;
    }
    this.player.vx = targetSpeed;
    if (moveDir > 0) this.player.facing = 'right';
    if (moveDir < 0) this.player.facing = 'left';

    // Gravity
    this.player.vy += this.level.settings.gravity;
    if (this.player.vy > 14) this.player.vy = 14;

    // Move Player X & Resolve Collisions
    this.player.x += this.player.vx;
    this.resolveCollisionX();

    // Move Player Y & Resolve Collisions
    this.player.isGrounded = false;
    this.player.y += this.player.vy;
    this.resolveCollisionY();

    // Out of bounds check (fell in abyss)
    if (this.player.y > this.level.height * this.level.tileSize + 64) {
      this.damagePlayer('instant_death');
    }

    // Collectibles collision
    const pBounds = {
      x: this.player.x,
      y: this.player.y,
      w: this.player.width,
      h: this.player.height,
    };

    for (const c of this.collectibles) {
      if (c.collected) continue;
      const cx = c.x + 4;
      const cy = c.y + 4;
      const cw = this.level.tileSize - 8;
      const ch = this.level.tileSize - 8;

      if (
        pBounds.x < cx + cw &&
        pBounds.x + pBounds.w > cx &&
        pBounds.y < cy + ch &&
        pBounds.y + pBounds.h > cy
      ) {
        c.collected = true;
        if (c.type === 'coin') {
          this.coins += 1;
          this.score += 100;
          sounds.playCoin();
          this.spawnSparkles(c.x + 16, c.y + 16, '#facc15', 8);
        } else if (c.type === 'gem') {
          this.score += 500;
          sounds.playCoin();
          this.spawnSparkles(c.x + 16, c.y + 16, '#10b981', 12);
        } else if (c.type === 'star') {
          this.score += 1000;
          if (this.lives < this.level.settings.maxLives + 2) {
            this.lives += 1;
          }
          sounds.playPowerup();
          this.spawnSparkles(c.x + 16, c.y + 16, '#f59e0b', 16);
        } else if (c.type === 'powerup_jump') {
          this.player.hasJumpPowerup = true;
          this.score += 250;
          sounds.playPowerup();
          this.spawnSparkles(c.x + 16, c.y + 16, '#38bdf8', 12);
        } else if (c.type === 'powerup_speed') {
          this.player.hasSpeedPowerup = true;
          this.player.speedPowerupTimer = 12; // 12 seconds boost
          this.score += 250;
          sounds.playPowerup();
          this.spawnSparkles(c.x + 16, c.y + 16, '#a855f7', 12);
        }
        this.notifyStats();
      }
    }

    // Hazard checks (spikes / lava tiles)
    const startTx = Math.floor(this.player.x / this.level.tileSize);
    const endTx = Math.floor((this.player.x + this.player.width) / this.level.tileSize);
    const startTy = Math.floor(this.player.y / this.level.tileSize);
    const endTy = Math.floor((this.player.y + this.player.height) / this.level.tileSize);

    for (let ty = startTy; ty <= endTy; ty++) {
      for (let tx = startTx; tx <= endTx; tx++) {
        if (this.isTileHazard(tx, ty)) {
          this.damagePlayer('hazard');
        }
        if (this.isTileGoal(tx, ty)) {
          this.triggerVictory();
        }
      }
    }

    // Enemies update & collision
    for (const enemy of this.enemies) {
      if (!enemy.alive) continue;

      // Enemy AI patrol
      if (enemy.type === 'slime') {
        enemy.x += enemy.vx * enemy.direction;
        if (Math.abs(enemy.x - enemy.startX) > enemy.patrolDistance) {
          enemy.direction *= -1;
        }
      } else if (enemy.type === 'bat') {
        enemy.x += enemy.vx * enemy.direction;
        enemy.y = enemy.y + Math.sin(this.timeElapsed * 4 + enemy.id) * 1.5;
        if (Math.abs(enemy.x - enemy.startX) > enemy.patrolDistance) {
          enemy.direction *= -1;
        }
      }

      // Check collision with player
      const ex = enemy.x;
      const ey = enemy.y;
      const ew = enemy.width;
      const eh = enemy.height;

      if (
        pBounds.x < ex + ew &&
        pBounds.x + pBounds.w > ex &&
        pBounds.y < ey + eh &&
        pBounds.y + pBounds.h > ey
      ) {
        // Player stomping enemy from above?
        const isStomp = this.player.vy > 0 && this.player.y + this.player.height - enemy.y < 16;
        if (isStomp) {
          enemy.alive = false;
          this.player.vy = this.level.settings.jumpForce * 0.85; // bounce
          this.score += 200;
          sounds.playEnemyStomp();
          this.spawnSparkles(enemy.x + ew / 2, enemy.y + eh / 2, enemy.type === 'slime' ? '#84cc16' : '#818cf8', 14);
          this.notifyStats();
        } else if (this.player.invulnerableTimer <= 0) {
          this.damagePlayer('enemy');
        }
      }
    }
  }

  private resolveCollisionX() {
    const ts = this.level.tileSize;
    const px = this.player.x;
    const py = this.player.y;
    const pw = this.player.width;
    const ph = this.player.height;

    const startTy = Math.floor(py / ts);
    const endTy = Math.floor((py + ph - 1) / ts);

    if (this.player.vx > 0) {
      const tx = Math.floor((px + pw) / ts);
      for (let ty = startTy; ty <= endTy; ty++) {
        if (this.isTileSolid(tx, ty)) {
          this.player.x = tx * ts - pw;
          this.player.vx = 0;
          break;
        }
      }
    } else if (this.player.vx < 0) {
      const tx = Math.floor(px / ts);
      for (let ty = startTy; ty <= endTy; ty++) {
        if (this.isTileSolid(tx, ty)) {
          this.player.x = (tx + 1) * ts;
          this.player.vx = 0;
          break;
        }
      }
    }
  }

  private resolveCollisionY() {
    const ts = this.level.tileSize;
    const px = this.player.x;
    const py = this.player.y;
    const pw = this.player.width;
    const ph = this.player.height;

    const startTx = Math.floor(px / ts);
    const endTx = Math.floor((px + pw - 1) / ts);

    if (this.player.vy > 0) {
      const ty = Math.floor((py + ph) / ts);
      for (let tx = startTx; tx <= endTx; tx++) {
        if (this.isTileSolid(tx, ty)) {
          this.player.y = ty * ts - ph;
          this.player.vy = 0;
          this.player.isGrounded = true;
          this.player.canDoubleJump = this.level.settings.allowDoubleJump;
          break;
        }
      }
    } else if (this.player.vy < 0) {
      const ty = Math.floor(py / ts);
      for (let tx = startTx; tx <= endTx; tx++) {
        if (this.isTileSolid(tx, ty)) {
          this.player.y = (ty + 1) * ts;
          this.player.vy = 0;
          break;
        }
      }
    }
  }

  private damagePlayer(source: 'hazard' | 'enemy' | 'instant_death') {
    if (this.player.invulnerableTimer > 0 && source !== 'instant_death') {
      return;
    }

    this.lives -= 1;
    sounds.playHurt();
    this.spawnSparkles(this.player.x + 12, this.player.y + 14, '#ef4444', 16);

    if (this.lives <= 0) {
      this.status = 'gameover';
      sounds.playGameOver();
      this.notifyStats();
      return;
    }

    if (source === 'instant_death' || source === 'hazard') {
      // Respawn at level spawn or offset
      this.respawnAtStart();
    } else {
      // Knockback & invulnerability
      this.player.invulnerableTimer = 1.6;
      this.player.vy = -6;
      this.player.vx = this.player.facing === 'right' ? -4 : 4;
    }

    this.notifyStats();
  }

  private respawnAtStart() {
    const ts = this.level.tileSize;
    let found = false;
    for (let y = 0; y < this.level.height; y++) {
      for (let x = 0; x < this.level.width; x++) {
        if (this.level.tiles[y][x] === 'player_spawn') {
          this.player.x = x * ts + 4;
          this.player.y = y * ts + 2;
          found = true;
          break;
        }
      }
      if (found) break;
    }
    if (!found) {
      this.player.x = 32;
      this.player.y = 32;
    }
    this.player.vx = 0;
    this.player.vy = 0;
    this.player.invulnerableTimer = 2.0;
  }

  private triggerVictory() {
    if (this.status === 'won') return;
    this.status = 'won';
    this.score += 2000;
    sounds.playWin();
    this.spawnSparkles(this.player.x + 12, this.player.y + 12, '#ec4899', 35);
    this.spawnSparkles(this.player.x + 12, this.player.y + 12, '#facc15', 35);
    this.notifyStats();
  }

  // RENDERING
  public render() {
    const ctx = this.ctx;
    const width = this.canvas.width;
    const height = this.canvas.height;
    const ts = this.level.tileSize;

    // Background gradient
    this.drawBackground(ctx, width, height);

    // Draw Static Tiles
    for (let y = 0; y < this.level.height; y++) {
      for (let x = 0; x < this.level.width; x++) {
        const tile = this.level.tiles[y][x];
        const px = x * ts;
        const py = y * ts;

        if (tile === 'solid_ground') {
          this.drawGroundTile(ctx, px, py, ts);
        } else if (tile === 'solid_brick') {
          this.drawBrickTile(ctx, px, py, ts);
        } else if (tile === 'solid_wood') {
          this.drawWoodTile(ctx, px, py, ts);
        } else if (tile === 'hazard_spikes') {
          this.drawSpikesTile(ctx, px, py, ts);
        } else if (tile === 'hazard_lava') {
          this.drawLavaTile(ctx, px, py, ts);
        } else if (tile === 'goal') {
          this.drawGoalPortal(ctx, px, py, ts);
        }
      }
    }

    // Draw Moving Platforms
    for (const plat of this.movingPlatforms) {
      this.drawMovingPlatform(ctx, plat);
    }

    // Draw Collectibles
    for (const c of this.collectibles) {
      if (!c.collected) {
        this.drawCollectible(ctx, c, ts);
      }
    }

    // Draw Enemies
    for (const enemy of this.enemies) {
      if (enemy.alive) {
        this.drawEnemy(ctx, enemy);
      }
    }

    // Draw Player
    this.drawPlayer(ctx);

    // Draw Particles
    for (const p of this.particles) {
      ctx.save();
      ctx.globalAlpha = p.alpha;
      ctx.fillStyle = p.color;
      ctx.beginPath();
      ctx.arc(p.x, p.y, p.size, 0, Math.PI * 2);
      ctx.fill();
      ctx.restore();
    }
  }

  private drawBackground(ctx: CanvasRenderingContext2D, w: number, h: number) {
    const theme = this.level.settings.theme;
    const grad = ctx.createLinearGradient(0, 0, 0, h);

    if (theme === 'forest') {
      grad.addColorStop(0, '#0f172a');
      grad.addColorStop(0.6, '#1e293b');
      grad.addColorStop(1, '#064e3b');
    } else if (theme === 'cyber') {
      grad.addColorStop(0, '#0f051d');
      grad.addColorStop(0.5, '#2e1065');
      grad.addColorStop(1, '#1e1b4b');
    } else if (theme === 'dungeon') {
      grad.addColorStop(0, '#1c1917');
      grad.addColorStop(0.6, '#292524');
      grad.addColorStop(1, '#451a03');
    } else {
      // sunset
      grad.addColorStop(0, '#311042');
      grad.addColorStop(0.5, '#701a75');
      grad.addColorStop(1, '#9a3412');
    }

    ctx.fillStyle = grad;
    ctx.fillRect(0, 0, w, h);

    // Parallax stars/dots
    ctx.fillStyle = 'rgba(255, 255, 255, 0.2)';
    for (let i = 0; i < 40; i++) {
      const sx = ((i * 73 + 17) % w);
      const sy = ((i * 41 + 29) % (h * 0.7));
      ctx.fillRect(sx, sy, 1.5, 1.5);
    }
  }

  private drawGroundTile(ctx: CanvasRenderingContext2D, px: number, py: number, ts: number) {
    // Dirt base
    ctx.fillStyle = '#78350f';
    ctx.fillRect(px, py, ts, ts);

    // Grass top
    ctx.fillStyle = '#10b981';
    ctx.fillRect(px, py, ts, 7);

    // Grass fringe detail
    ctx.fillStyle = '#059669';
    for (let i = 0; i < ts; i += 6) {
      ctx.fillRect(px + i, py + 7, 4, 3);
    }

    // Dirt pebble details
    ctx.fillStyle = '#92400e';
    ctx.fillRect(px + 4, py + 14, 3, 3);
    ctx.fillRect(px + 18, py + 22, 4, 3);
  }

  private drawBrickTile(ctx: CanvasRenderingContext2D, px: number, py: number, ts: number) {
    ctx.fillStyle = '#334155';
    ctx.fillRect(px, py, ts, ts);

    // Brick mortar lines
    ctx.strokeStyle = '#1e293b';
    ctx.lineWidth = 1.5;
    ctx.strokeRect(px, py, ts, ts);

    // Mortar subdivisions
    ctx.beginPath();
    ctx.moveTo(px, py + ts / 2);
    ctx.lineTo(px + ts, py + ts / 2);
    ctx.moveTo(px + ts / 2, py);
    ctx.lineTo(px + ts / 2, py + ts / 2);
    ctx.moveTo(px + ts / 4, py + ts / 2);
    ctx.lineTo(px + ts / 4, py + ts);
    ctx.moveTo(px + (ts * 3) / 4, py + ts / 2);
    ctx.lineTo(px + (ts * 3) / 4, py + ts);
    ctx.stroke();

    // Brick highlight
    ctx.fillStyle = '#475569';
    ctx.fillRect(px + 2, py + 2, ts / 2 - 4, 3);
  }

  private drawWoodTile(ctx: CanvasRenderingContext2D, px: number, py: number, ts: number) {
    ctx.fillStyle = '#b45309';
    ctx.fillRect(px, py, ts, ts);

    // Plank lines
    ctx.fillStyle = '#78350f';
    ctx.fillRect(px, py + ts / 3, ts, 1.5);
    ctx.fillRect(px, py + (ts * 2) / 3, ts, 1.5);

    // Wood grain / nail
    ctx.fillStyle = '#d97706';
    ctx.fillRect(px + 3, py + 3, ts - 6, 2);
    ctx.fillStyle = '#451a03';
    ctx.fillRect(px + 4, py + 6, 2, 2);
    ctx.fillRect(px + ts - 6, py + 6, 2, 2);
  }

  private drawSpikesTile(ctx: CanvasRenderingContext2D, px: number, py: number, ts: number) {
    ctx.fillStyle = '#ef4444';
    const spikeCount = 3;
    const spikeW = ts / spikeCount;

    for (let i = 0; i < spikeCount; i++) {
      ctx.beginPath();
      ctx.moveTo(px + i * spikeW, py + ts);
      ctx.lineTo(px + (i + 0.5) * spikeW, py + 4);
      ctx.lineTo(px + (i + 1) * spikeW, py + ts);
      ctx.closePath();
      ctx.fill();

      // Sharp shine
      ctx.strokeStyle = '#fca5a5';
      ctx.lineWidth = 1;
      ctx.beginPath();
      ctx.moveTo(px + (i + 0.5) * spikeW, py + 5);
      ctx.lineTo(px + (i + 0.8) * spikeW, py + ts - 4);
      ctx.stroke();
    }
  }

  private drawLavaTile(ctx: CanvasRenderingContext2D, px: number, py: number, ts: number) {
    ctx.fillStyle = '#ea580c';
    ctx.fillRect(px, py, ts, ts);

    // Flowing hot surface
    const wave = Math.sin(this.timeElapsed * 5 + px * 0.1) * 2;
    ctx.fillStyle = '#facc15';
    ctx.fillRect(px, py + wave, ts, 4);

    // Bubble
    if ((px + py) % 4 === 0) {
      const bubbleY = py + 8 + (Math.sin(this.timeElapsed * 3 + px) * 4);
      ctx.beginPath();
      ctx.arc(px + 12, bubbleY, 3, 0, Math.PI * 2);
      ctx.fillStyle = '#fdba74';
      ctx.fill();
    }
  }

  private drawGoalPortal(ctx: CanvasRenderingContext2D, px: number, py: number, ts: number) {
    const time = this.timeElapsed * 3;
    const cx = px + ts / 2;
    const cy = py + ts / 2;

    // Outer glow
    const glow = ctx.createRadialGradient(cx, cy, 2, cx, cy, ts * 0.7);
    glow.addColorStop(0, '#f472b6');
    glow.addColorStop(0.7, '#ec4899');
    glow.addColorStop(1, 'transparent');
    ctx.fillStyle = glow;
    ctx.beginPath();
    ctx.arc(cx, cy, ts * 0.7, 0, Math.PI * 2);
    ctx.fill();

    // Rotating ring
    ctx.save();
    ctx.translate(cx, cy);
    ctx.rotate(time);
    ctx.strokeStyle = '#fdf2f8';
    ctx.lineWidth = 2.5;
    ctx.beginPath();
    ctx.arc(0, 0, ts * 0.38, 0, Math.PI * 1.5);
    ctx.stroke();

    // Trophy / Star center
    ctx.fillStyle = '#ffffff';
    ctx.beginPath();
    ctx.arc(0, 0, 5, 0, Math.PI * 2);
    ctx.fill();
    ctx.restore();
  }

  private drawMovingPlatform(ctx: CanvasRenderingContext2D, plat: MovingPlatformEntity) {
    // Metal bracket
    ctx.fillStyle = '#0284c7';
    ctx.fillRect(plat.x, plat.y, plat.width, plat.height);

    ctx.fillStyle = '#38bdf8';
    ctx.fillRect(plat.x + 2, plat.y + 2, plat.width - 4, 3);

    // Chevron marks
    ctx.fillStyle = '#e0f2fe';
    for (let x = plat.x + 8; x < plat.x + plat.width - 8; x += 12) {
      ctx.fillRect(x, plat.y + 7, 4, 3);
    }
  }

  private drawCollectible(ctx: CanvasRenderingContext2D, c: CollectibleEntity, ts: number) {
    const bob = Math.sin(this.timeElapsed * 4 + c.id) * 3;
    const cx = c.x + ts / 2;
    const cy = c.y + ts / 2 + bob;

    if (c.type === 'coin') {
      const scaleX = Math.abs(Math.cos(this.timeElapsed * 5 + c.id));
      ctx.save();
      ctx.translate(cx, cy);
      ctx.scale(Math.max(scaleX, 0.25), 1);
      ctx.fillStyle = '#eab308';
      ctx.beginPath();
      ctx.arc(0, 0, 9, 0, Math.PI * 2);
      ctx.fill();
      ctx.fillStyle = '#fef08a';
      ctx.beginPath();
      ctx.arc(0, 0, 5, 0, Math.PI * 2);
      ctx.fill();
      ctx.restore();
    } else if (c.type === 'gem') {
      ctx.save();
      ctx.translate(cx, cy);
      ctx.fillStyle = '#10b981';
      ctx.beginPath();
      ctx.moveTo(0, -9);
      ctx.lineTo(8, -2);
      ctx.lineTo(0, 10);
      ctx.lineTo(-8, -2);
      ctx.closePath();
      ctx.fill();
      ctx.fillStyle = '#6ee7b7';
      ctx.fillRect(-2, -5, 4, 4);
      ctx.restore();
    } else if (c.type === 'star') {
      ctx.save();
      ctx.translate(cx, cy);
      ctx.fillStyle = '#facc15';
      ctx.beginPath();
      ctx.arc(0, 0, 9, 0, Math.PI * 2);
      ctx.fill();
      ctx.fillStyle = '#fef08a';
      ctx.fillRect(-2, -6, 4, 12);
      ctx.fillRect(-6, -2, 12, 4);
      ctx.restore();
    } else if (c.type === 'powerup_jump') {
      // Wing / Feather
      ctx.fillStyle = '#38bdf8';
      ctx.beginPath();
      ctx.ellipse(cx, cy, 9, 5, -0.4, 0, Math.PI * 2);
      ctx.fill();
      ctx.fillStyle = '#ffffff';
      ctx.fillRect(cx - 3, cy - 2, 6, 2);
    } else if (c.type === 'powerup_speed') {
      // Boot / Lightning
      ctx.fillStyle = '#a855f7';
      ctx.fillRect(cx - 6, cy - 5, 12, 10);
      ctx.fillStyle = '#fef08a';
      ctx.fillRect(cx - 2, cy - 3, 4, 6);
    }
  }

  private drawEnemy(ctx: CanvasRenderingContext2D, enemy: EnemyEntity) {
    if (enemy.type === 'slime') {
      const squish = Math.sin(this.timeElapsed * 6 + enemy.id) * 2;
      const x = enemy.x;
      const y = enemy.y + squish;
      const w = enemy.width;
      const h = enemy.height - squish;

      ctx.fillStyle = '#84cc16';
      ctx.beginPath();
      ctx.roundRect(x, y, w, h, [12, 12, 4, 4]);
      ctx.fill();

      // Slime eye
      ctx.fillStyle = '#ffffff';
      const eyeOffset = enemy.direction === 1 ? 16 : 8;
      ctx.beginPath();
      ctx.arc(x + eyeOffset, y + 8, 4, 0, Math.PI * 2);
      ctx.fill();
      ctx.fillStyle = '#1e293b';
      ctx.beginPath();
      ctx.arc(x + eyeOffset + enemy.direction * 1.5, y + 8, 2, 0, Math.PI * 2);
      ctx.fill();
    } else if (enemy.type === 'bat') {
      const flap = Math.sin(this.timeElapsed * 12 + enemy.id) * 5;
      const cx = enemy.x + enemy.width / 2;
      const cy = enemy.y + enemy.height / 2;

      // Bat body
      ctx.fillStyle = '#4338ca';
      ctx.beginPath();
      ctx.arc(cx, cy, 7, 0, Math.PI * 2);
      ctx.fill();

      // Wings
      ctx.fillStyle = '#6366f1';
      ctx.beginPath();
      ctx.moveTo(cx - 5, cy);
      ctx.lineTo(cx - 14, cy - 6 + flap);
      ctx.lineTo(cx - 5, cy + 4);
      ctx.closePath();
      ctx.fill();

      ctx.beginPath();
      ctx.moveTo(cx + 5, cy);
      ctx.lineTo(cx + 14, cy - 6 + flap);
      ctx.lineTo(cx + 5, cy + 4);
      ctx.closePath();
      ctx.fill();

      // Red glowing eyes
      ctx.fillStyle = '#ef4444';
      ctx.fillRect(cx - 3, cy - 2, 2, 2);
      ctx.fillRect(cx + 1, cy - 2, 2, 2);
    }
  }

  private drawPlayer(ctx: CanvasRenderingContext2D) {
    const p = this.player;

    // Invulnerability blink
    if (p.invulnerableTimer > 0 && Math.floor(p.invulnerableTimer * 10) % 2 === 0) {
      return;
    }

    ctx.save();
    ctx.translate(p.x + p.width / 2, p.y + p.height / 2);

    if (p.facing === 'left') {
      ctx.scale(-1, 1);
    }

    const halfW = p.width / 2;
    const halfH = p.height / 2;

    // If custom sprite exists (16x16)
    if (this.customPlayerSprite && this.customPlayerSprite.length === 256) {
      const pPixelSize = p.width / 16;
      for (let py = 0; py < 16; py++) {
        for (let px = 0; px < 16; px++) {
          const color = this.customPlayerSprite[py * 16 + px];
          if (color && color !== 'transparent') {
            ctx.fillStyle = color;
            ctx.fillRect(-halfW + px * pPixelSize, -halfH + py * pPixelSize, pPixelSize + 0.2, pPixelSize + 0.2);
          }
        }
      }
    } else {
      // Default cute hero robot / adventurer
      // Speed trail effect if powered up
      if (p.hasSpeedPowerup) {
        ctx.fillStyle = 'rgba(168, 85, 247, 0.4)';
        ctx.fillRect(-halfW - 5, -halfH + 2, p.width, p.height - 4);
      }

      // Torso / Suit
      ctx.fillStyle = p.hasJumpPowerup ? '#0284c7' : '#3b82f6';
      ctx.beginPath();
      ctx.roundRect(-halfW + 2, -halfH + 8, p.width - 4, p.height - 12, 4);
      ctx.fill();

      // Head
      ctx.fillStyle = '#f8fafc';
      ctx.beginPath();
      ctx.roundRect(-halfW + 3, -halfH, p.width - 6, 12, 3);
      ctx.fill();

      // Visor / Eyes
      ctx.fillStyle = '#0f172a';
      ctx.fillRect(-halfW + 7, -halfH + 3, 10, 4);
      ctx.fillStyle = '#38bdf8';
      ctx.fillRect(-halfW + 11, -halfH + 4, 3, 2);

      // Antenna / Headband
      ctx.fillStyle = p.hasJumpPowerup ? '#38bdf8' : '#eab308';
      ctx.fillRect(-halfW + 8, -halfH - 4, 3, 4);
      ctx.beginPath();
      ctx.arc(-halfW + 9.5, -halfH - 5, 2.5, 0, Math.PI * 2);
      ctx.fill();

      // Running legs animation
      const legOffset = Math.sin(this.timeElapsed * 16) * 3;
      ctx.fillStyle = '#1e3a8a';
      if (!p.isGrounded) {
        // Tucked legs when jumping
        ctx.fillRect(-halfW + 4, halfH - 4, 4, 4);
        ctx.fillRect(halfW - 8, halfH - 4, 4, 4);
      } else if (Math.abs(p.vx) > 0.5) {
        ctx.fillRect(-halfW + 4, halfH - 4 + legOffset, 4, 5);
        ctx.fillRect(halfW - 8, halfH - 4 - legOffset, 4, 5);
      } else {
        ctx.fillRect(-halfW + 4, halfH - 4, 4, 5);
        ctx.fillRect(halfW - 8, halfH - 4, 4, 5);
      }
    }

    ctx.restore();
  }
}
