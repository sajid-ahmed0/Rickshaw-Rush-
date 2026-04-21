import * as THREE from 'three';
import { Player } from './Player';
import { World, PowerUpType } from './World';
import { INITIAL_SPEED, SPEED_INCREMENT, MAX_SPEED, POWERUP_DURATION, SKINS, Skin } from './constants';
import { audioManager } from './AudioManager';

export type GameState = 'START' | 'PLAYING' | 'GAMEOVER';

export class GameManager {
  private scene: THREE.Scene;
  private camera: THREE.PerspectiveCamera;
  private renderer: THREE.WebGLRenderer;
  
  private player: Player;
  private world: World;
  
  public gameState: GameState = 'START';
  public score: number = 0;
  public coins: number = 0;
  public speed: number = INITIAL_SPEED;
  
  private lastTime: number = performance.now();
  private invulnerableTimer: number = 0;
  private onStateChange: (state: GameState, score: number, coins: number) => void;

  // Power-up timers
  private powerUpTimers: Record<string, number> = {};

  constructor(container: HTMLElement, onStateChange: (state: GameState, score: number, coins: number) => void) {
    this.onStateChange = onStateChange;

    this.scene = new THREE.Scene();
    const skyColor = 0x87ceeb; // Sky blue
    this.scene.background = new THREE.Color(skyColor);
    this.scene.fog = new THREE.FogExp2(skyColor, 0.005); // Lighter fog for daylight

    this.camera = new THREE.PerspectiveCamera(75, window.innerWidth / window.innerHeight, 0.1, 1000);
    this.camera.position.set(0, 8, -12); // Slightly higher/further camera

    this.renderer = new THREE.WebGLRenderer({ antialias: true });
    // ...
    this.renderer.setPixelRatio(window.devicePixelRatio);
    this.renderer.setSize(window.innerWidth, window.innerHeight);
    this.renderer.shadowMap.enabled = true;
    this.renderer.shadowMap.type = THREE.PCFSoftShadowMap;
    container.appendChild(this.renderer.domElement);

    const ambientLight = new THREE.AmbientLight(0xffffff, 0.8); // Brighter ambient
    this.scene.add(ambientLight);

    const sunLight = new THREE.DirectionalLight(0xffffff, 1.5); // Stronger sun
    sunLight.position.set(30, 50, 20);
    sunLight.castShadow = true;
    this.scene.add(sunLight);

    this.player = new Player();
    this.scene.add(this.player.mesh);
    this.world = new World(this.scene);

    window.addEventListener('resize', this.onResize.bind(this));
    this.setupInput();
    
    // Start loop
    requestAnimationFrame(this.loop.bind(this));
  }

  public setPlayerSkin(skinId: string) {
    const skin = SKINS.find(s => s.id === skinId);
    if (skin) this.player.setSkin(skin);
  }

  private setupInput() {
    window.addEventListener('keydown', (e) => {
      if (this.gameState !== 'PLAYING') return;
      if (e.key === 'ArrowLeft') this.player.moveLeft();
      if (e.key === 'ArrowRight') this.player.moveRight();
      if (e.key === 'ArrowUp' || e.key === ' ') this.player.jump();
      if (e.key === 'ArrowDown') this.player.slide();
    });

    let touchStartX = 0;
    let touchStartY = 0;
    window.addEventListener('touchstart', (e) => { touchStartX = e.touches[0].clientX; touchStartY = e.touches[0].clientY; });
    window.addEventListener('touchend', (e) => {
        if (this.gameState !== 'PLAYING') return;
        const dx = e.changedTouches[0].clientX - touchStartX;
        const dy = e.changedTouches[0].clientY - touchStartY;
        if (Math.abs(dx) > Math.abs(dy)) {
            if (dx > 30) this.player.moveRight(); else if (dx < -30) this.player.moveLeft();
        } else {
            if (dy > 30) this.player.slide(); else if (dy < -30) this.player.jump();
        }
    });
  }

  private onResize() {
    this.camera.aspect = window.innerWidth / window.innerHeight;
    this.camera.updateProjectionMatrix();
    this.renderer.setSize(window.innerWidth, window.innerHeight);
  }

  public start() {
    this.gameState = 'PLAYING';
    this.score = 0;
    this.coins = 0;
    this.speed = INITIAL_SPEED;
    this.world.reset();
    this.player.mesh.position.set(0, 0, 0);
    this.player.laneIndex = 1;
    this.powerUpTimers = {};
    this.deactivateAllPowerUps();
    audioManager.startBGM();
    this.invulnerableTimer = 1000; // 1 second of invulnerability on start
    this.lastTime = performance.now();
    this.onStateChange(this.gameState, this.score, this.coins);
  }

  private deactivateAllPowerUps() {
    this.player.magnetActive = false;
    this.player.doubleScoreActive = false;
    this.player.speedBoostActive = false;
  }

  private loop(time: number) {
    const deltaTime = time - this.lastTime;
    this.lastTime = time;
    if (this.gameState === 'PLAYING') this.update(deltaTime);
    this.renderer.render(this.scene, this.camera);
    requestAnimationFrame(this.loop.bind(this));
  }

  private playerBox = new THREE.Box3();
  private tempBox = new THREE.Box3();

  private update(deltaTime: number) {
    if (this.invulnerableTimer > 0) this.invulnerableTimer -= deltaTime;
    const speedMultiplier = this.player.speedBoostActive ? 1.5 : 1.0;
    
    // Difficulty curve: Speed increases based on distance run
    const baseSpeedIncrement = SPEED_INCREMENT * (1 + Math.floor(this.score / 500) * 0.5);
    if (this.speed < MAX_SPEED) {
        this.speed += baseSpeedIncrement * speedMultiplier;
    }

    const moveZ = this.speed * speedMultiplier;
    this.player.mesh.position.z += moveZ;
    
    const scoreGain = this.player.doubleScoreActive ? 2 : 1;
    this.score += Math.floor(moveZ / 2) * scoreGain;

    this.player.update(deltaTime, this.speed * speedMultiplier);
    this.world.update(this.player.mesh.position.z, deltaTime);

    // Smooth Camera Follow
    const targetCamZ = this.player.mesh.position.z - 12;
    const targetCamX = this.player.mesh.position.x * 0.5;
    this.camera.position.z = THREE.MathUtils.lerp(this.camera.position.z, targetCamZ, 0.1);
    this.camera.position.x = THREE.MathUtils.lerp(this.camera.position.x, targetCamX, 0.05);
    this.camera.position.y = THREE.MathUtils.lerp(this.camera.position.y, 6, 0.05);
    
    // Ensure camera stays upright
    this.camera.up.set(0, 1, 0);
    this.camera.lookAt(this.player.mesh.position.x, 2, this.player.mesh.position.z + 10);

    // Power-up durations
    Object.keys(this.powerUpTimers).forEach(key => {
        this.powerUpTimers[key] -= deltaTime;
        if (this.powerUpTimers[key] <= 0) {
            delete this.powerUpTimers[key];
            if (key === 'MAGNET') this.player.magnetActive = false;
            if (key === 'DOUBLE') this.player.doubleScoreActive = false;
            if (key === 'BOOST') this.player.speedBoostActive = false;
        }
    });

    this.playerBox.setFromObject(this.player.mesh);

    // Obstacles
    for (const obstacle of this.world.obstacles) {
        this.tempBox.setFromObject(obstacle);
        if (this.playerBox.intersectsBox(this.tempBox)) {
            if (this.invulnerableTimer <= 0) {
                this.gameOver();
                return;
            }
        }
    }

    // Coins
    for (let i = this.world.coins.length - 1; i >= 0; i--) {
        const coin = this.world.coins[i];
        
        if (this.player.magnetActive) {
            const dist = coin.position.clone().add(coin.parent!.position).distanceTo(this.player.mesh.position);
            if (dist < 15) {
                const dir = this.player.mesh.position.clone().sub(coin.position.clone().add(coin.parent!.position)).normalize();
                coin.position.add(dir.multiplyScalar(0.8));
            }
        }

        this.tempBox.setFromObject(coin);
        if (this.playerBox.intersectsBox(this.tempBox)) {
            this.coins += this.player.doubleScoreActive ? 2 : 1;
            this.world.createCollectionEffect(coin.getWorldPosition(new THREE.Vector3()), 0xffdd00);
            coin.parent?.remove(coin);
            this.world.coins.splice(i, 1);
            audioManager.playSound('coin');
            this.onStateChange(this.gameState, this.score, this.coins);
        }
    }

    // Power-ups
    for (let i = this.world.powerups.length - 1; i >= 0; i--) {
        const p = this.world.powerups[i];
        this.tempBox.setFromObject(p);
        if (this.playerBox.intersectsBox(this.tempBox)) {
            const type = (p as any).powerUpType as PowerUpType;
            this.activatePowerUp(type);
            this.world.createCollectionEffect(p.getWorldPosition(new THREE.Vector3()), ((p as THREE.Mesh).material as THREE.MeshStandardMaterial).color.getHex());
            p.parent?.remove(p);
            this.world.powerups.splice(i, 1);
            audioManager.playSound('powerup');
        }
    }
  }

  private activatePowerUp(type: PowerUpType) {
      this.powerUpTimers[type] = POWERUP_DURATION;
      if (type === 'MAGNET') this.player.magnetActive = true;
      if (type === 'DOUBLE') this.player.doubleScoreActive = true;
      if (type === 'BOOST') this.player.speedBoostActive = true;
  }

  private gameOver() {
    this.gameState = 'GAMEOVER';
    audioManager.playSound('crash');
    this.onStateChange(this.gameState, this.score, this.coins);
  }
}
