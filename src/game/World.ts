import * as THREE from 'three';
import { LANES, CHUNK_LENGTH, CHUNKS_AHEAD } from './constants';

export type PowerUpType = 'MAGNET' | 'DOUBLE' | 'BOOST';

export class World {
  public scene: THREE.Scene;
  private chunks: THREE.Group[] = [];
  private lastChunkZ: number = -CHUNK_LENGTH;
  
  public obstacles: THREE.Object3D[] = [];
  public coins: THREE.Object3D[] = [];
  public powerups: THREE.Object3D[] = [];
  
  private particles: THREE.Points[] = [];

  constructor(scene: THREE.Scene) {
    this.scene = scene;
    
    for (let i = 0; i < CHUNKS_AHEAD; i++) {
        this.generateChunk();
    }
  }

  public update(playerZ: number, deltaTime: number) {
    if (this.chunks.length > 0 && playerZ > this.chunks[0].position.z + CHUNK_LENGTH) {
        const removed = this.chunks.shift();
        if (removed) {
            this.scene.remove(removed);
            this.cleanupChunk(removed);
        }
        this.generateChunk();
    }

    // Update particles
    for (let i = this.particles.length - 1; i >= 0; i--) {
        const p = this.particles[i];
        p.position.y += 0.05;
        (p.material as THREE.PointsMaterial).opacity -= 0.02;
        if ((p.material as THREE.PointsMaterial).opacity <= 0) {
            this.scene.remove(p);
            this.particles.splice(i, 1);
        }
    }
  }

  private generateChunk() {
    const chunk = new THREE.Group();
    chunk.position.z = this.lastChunkZ + CHUNK_LENGTH;
    this.lastChunkZ = chunk.position.z;

    const trackWidth = 20;
    const groundGeo = new THREE.PlaneGeometry(trackWidth, CHUNK_LENGTH);
    const groundMat = new THREE.MeshStandardMaterial({ color: 0x9b7653 }); // Sandy/Gravel ground
    const ground = new THREE.Mesh(groundGeo, groundMat);
    ground.rotation.x = -Math.PI / 2;
    ground.position.z = CHUNK_LENGTH / 2;
    ground.receiveShadow = true;
    chunk.add(ground);

    // Railroad Tracks
    const railColor = 0x7a7a7a;
    const sleeperColor = 0x5a4a3a;
    const sleeperGeo = new THREE.BoxGeometry( 5.5, 0.15, 0.5); // Sized to fit a single track
    const sleeperMat = new THREE.MeshStandardMaterial({ color: sleeperColor });
    
    const railGeo = new THREE.BoxGeometry( 0.2, 0.3, CHUNK_LENGTH);
    const railMat = new THREE.MeshStandardMaterial({ color: railColor });

    // 3 pairs of rails for 3 lanes
    for (let i = 0; i < 3; i++) {
        const laneCenterX = LANES[i];
        
        // Sleepers
        for (let s = 0; s < CHUNK_LENGTH; s += 2) {
            const sleeper = new THREE.Mesh(sleeperGeo, sleeperMat);
            sleeper.position.set(laneCenterX, 0.05, s);
            chunk.add(sleeper);
        }

        // Rails
        const railL = new THREE.Mesh(railGeo, railMat);
        railL.position.set(laneCenterX - 0.9, 0.15, CHUNK_LENGTH / 2);
        chunk.add(railL);

        const railR = new THREE.Mesh(railGeo, railMat);
        railR.position.set(laneCenterX + 0.9, 0.15, CHUNK_LENGTH / 2);
        chunk.add(railR);
    }

    // Overhead structures (poles/wires)
    const poleGeo = new THREE.BoxGeometry(0.5, 12, 0.5);
    const poleMat = new THREE.MeshStandardMaterial({ color: 0x333333 });
    const crossbarGeo = new THREE.BoxGeometry(trackWidth + 4, 0.3, 0.3);
    
    if (Math.random() > 0.5) {
        const poleL = new THREE.Mesh(poleGeo, poleMat);
        poleL.position.set(-11, 6, CHUNK_LENGTH / 2);
        chunk.add(poleL);
        
        const poleR = new THREE.Mesh(poleGeo, poleMat);
        poleR.position.set(11, 6, CHUNK_LENGTH / 2);
        chunk.add(poleR);
        
        const crossbar = new THREE.Mesh(crossbarGeo, poleMat);
        crossbar.position.set(0, 11, CHUNK_LENGTH / 2);
        chunk.add(crossbar);
    }

    for (let side = -1; side <= 1; side += 2) {
        // High walls
        const wallGeo = new THREE.BoxGeometry(2, 20, CHUNK_LENGTH);
        const wallMat = new THREE.MeshStandardMaterial({ color: 0x8b4513 }); // Reddish brick/clay
        const wall = new THREE.Mesh(wallGeo, wallMat);
        wall.position.set(side * (trackWidth/2 + 2), 10, CHUNK_LENGTH / 2);
        chunk.add(wall);

        // Greenery on top
        const bushGeo = new THREE.SphereGeometry(3);
        const bushMat = new THREE.MeshStandardMaterial({ color: 0x2d5a27 });
        for (let j = 0; j < 5; j++) {
            const bush = new THREE.Mesh(bushGeo, bushMat);
            bush.position.set(side * (trackWidth/2 + 3), 18, j * CHUNK_LENGTH/5);
            chunk.add(bush);
        }
    }

    if (chunk.position.z > CHUNK_LENGTH * 2) {
        this.spawnObjects(chunk);
    }

    this.chunks.push(chunk);
    this.scene.add(chunk);
  }

  private createRickshaw(lane: number, z: number): THREE.Group {
    const rickshaw = new THREE.Group();
    rickshaw.position.set(LANES[lane], 0, z);

    // Randomize Color Palette (Authentic Mix)
    const palettes = [
        { body: 0x00796b, hood: [0xd32f2f, 0xfbc02d, 0x1976d2, 0x388e3c], art: 0xffeb3b }, // Teal/Green base
        { body: 0xbf360c, hood: [0x4a148c, 0x00e5ff, 0xffeb3b, 0x76ff03], art: 0x00c853 }, // Orange/Red base
        { body: 0x1a237e, hood: [0xff1744, 0xffea00, 0x00b0ff, 0xffffff], art: 0xff4081 }, // Deep Blue base
    ];
    const choice = palettes[Math.floor(Math.random() * palettes.length)];

    // Materials
    const tiresMat = new THREE.MeshStandardMaterial({ color: 0x0a0a0a });
    const chromeMat = new THREE.MeshStandardMaterial({ color: 0xffffff, metalness: 0.95, roughness: 0.05 });
    const frameMat = new THREE.MeshStandardMaterial({ color: 0x111111 });
    const seatMat = new THREE.MeshStandardMaterial({ color: 0x3e2723, roughness: 0.8 });
    const woodMat = new THREE.MeshStandardMaterial({ color: 0x3e2723 });
    const bodyBaseMat = new THREE.MeshStandardMaterial({ color: choice.body });

    // Wheel Generator (High Detail)
    const makeWheel = (x: number, y: number, zRel: number, hasMudguard: boolean) => {
        const wheelGroup = new THREE.Group();
        wheelGroup.position.set(x, y, zRel);

        // Tire with subtle treads
        const tire = new THREE.Mesh(new THREE.TorusGeometry(0.72, 0.08, 12, 40), tiresMat);
        tire.rotation.y = Math.PI / 2;
        wheelGroup.add(tire);
        
        const rim = new THREE.Mesh(new THREE.TorusGeometry(0.68, 0.04, 8, 40), chromeMat);
        rim.rotation.y = Math.PI / 2;
        wheelGroup.add(rim);

        // Dense Spokes
        for(let i=0; i<20; i++) {
            const spoke = new THREE.Mesh(new THREE.CylinderGeometry(0.006, 0.006, 1.36, 6), chromeMat);
            spoke.rotation.x = (i * Math.PI) / 10;
            wheelGroup.add(spoke);
        }

        const hub = new THREE.Mesh(new THREE.CylinderGeometry(0.1, 0.1, 0.28, 8), chromeMat);
        hub.rotation.z = Math.PI / 2;
        wheelGroup.add(hub);

        if (hasMudguard) {
            const fMat = new THREE.MeshStandardMaterial({ color: choice.body, metalness: 0.6, roughness: 0.3 });
            const mg = new THREE.Mesh(new THREE.CylinderGeometry(0.85, 0.85, 0.32, 16, 1, true, 0.1, Math.PI - 0.2), fMat);
            mg.rotation.y = Math.PI / 2;
            mg.rotation.z = Math.PI / 2;
            mg.position.y = 0.12;
            wheelGroup.add(mg);
            
            const edge = new THREE.Mesh(new THREE.TorusGeometry(0.85, 0.02, 8, 16, Math.PI - 0.2), chromeMat);
            edge.rotation.y = Math.PI / 2;
            edge.rotation.z = Math.PI / 2 + 0.1;
            edge.position.y = 0.12;
            wheelGroup.add(edge);
        }
        rickshaw.add(wheelGroup);
    };

    makeWheel(0, 0.72, 3.0, true);    // Front
    makeWheel(0.9, 0.72, 0, true);   // Back L
    makeWheel(-0.9, 0.72, 0, true);  // Back R

    // FRAME & MECHANICALS
    const rodGeo = new THREE.CylinderGeometry(0.06, 0.06, 1, 8);
    
    // Front Fork with Shocks
    const forkL = new THREE.Mesh(rodGeo, chromeMat);
    forkL.scale.y = 1.6;
    forkL.rotation.x = -0.15;
    forkL.position.set(0.1, 1.4, 3.0);
    rickshaw.add(forkL);
    const forkR = forkL.clone();
    forkR.position.x = -0.1;
    rickshaw.add(forkR);

    // Headlight
    const light = new THREE.Mesh(new THREE.CylinderGeometry(0.15, 0.1, 0.25, 16), chromeMat);
    light.rotation.x = Math.PI / 2;
    light.position.set(0, 2.1, 3.2);
    rickshaw.add(light);
    const lens = new THREE.Mesh(new THREE.CircleGeometry(0.13, 16), new THREE.MeshStandardMaterial({ color: 0xffffff, emissive: 0xffffaa, emissiveIntensity: 0.8 }));
    lens.position.set(0, 2.1, 3.33);
    rickshaw.add(lens);

    // Triple Main Tubes
    const barMat = new THREE.MeshStandardMaterial({ color: 0x111111 });
    for(let i=0; i<3; i++) {
        const bar = new THREE.Mesh(rodGeo, barMat);
        bar.scale.y = 2.2;
        bar.rotation.x = Math.PI / 2;
        bar.position.set(0, 1.9 - (i*0.12), 1.9);
        rickshaw.add(bar);
    }

    const downBar = new THREE.Mesh(rodGeo, barMat);
    downBar.scale.y = 2.0;
    downBar.rotation.x = -0.85;
    downBar.position.set(0, 1.25, 2.15);
    rickshaw.add(downBar);

    // Drivetrain & Pedals
    const sprocket = new THREE.Mesh(new THREE.CircleGeometry(0.25, 32), chromeMat);
    sprocket.rotation.y = Math.PI / 2;
    sprocket.position.set(0.1, 0.75, 1.1);
    rickshaw.add(sprocket);

    const crankL = new THREE.Mesh(new THREE.BoxGeometry(0.05, 0.4, 0.05), chromeMat);
    crankL.position.set(0.15, 0.75, 1.1);
    rickshaw.add(crankL);
    const pedL = new THREE.Mesh(new THREE.BoxGeometry(0.2, 0.06, 0.15), tiresMat);
    pedL.position.set(0.15, 0.95, 1.1);
    rickshaw.add(pedL);

    const crankR = crankL.clone();
    crankR.position.x = -0.05;
    crankR.rotation.x = Math.PI;
    rickshaw.add(crankR);
    const pedR = pedL.clone();
    pedR.position.set(-0.05, 0.55, 1.1);
    rickshaw.add(pedR);

    // Handlebars & Bell
    const hbars = new THREE.Group();
    hbars.position.set(0, 2.6, 2.9);
    const bar = new THREE.Mesh(new THREE.CylinderGeometry(0.05, 0.05, 1.4, 8), chromeMat);
    bar.rotation.z = Math.PI / 2;
    hbars.add(bar);
    // Horn
    const horn = new THREE.Mesh(new THREE.SphereGeometry(0.14, 16, 16), new THREE.MeshStandardMaterial({ color: 0xd32f2f }));
    horn.position.set(0.45, 0.1, 0);
    hbars.add(horn);
    const hornEnd = new THREE.Mesh(new THREE.CylinderGeometry(0.02, 0.1, 0.3, 12), tiresMat);
    hornEnd.rotation.x = -Math.PI / 2;
    hornEnd.position.set(0.45, 0.05, 0.2);
    hbars.add(hornEnd);
    rickshaw.add(hbars);

    const saddle = new THREE.Mesh(new THREE.BoxGeometry(0.4, 0.15, 0.6), tiresMat);
    saddle.position.set(0, 2.15, 1.1);
    rickshaw.add(saddle);

    // CARRIAGE (Heavy suspension)
    const carriage = new THREE.Group();
    carriage.position.set(0, 0.75, 0);

    // Leaf Springs (Suspension)
    const springGeo = new THREE.CylinderGeometry(0.4, 0.4, 0.2, 16, 1, true, 0, Math.PI);
    const springL = new THREE.Mesh(springGeo, frameMat);
    springL.rotation.y = Math.PI / 2;
    springL.position.set(0.5, 0.2, -0.4);
    carriage.add(springL);
    const springR = springL.clone();
    springR.position.x = -0.5;
    carriage.add(springR);

    // Main Box with traditional step-cut shape
    const sideShape = new THREE.Shape();
    sideShape.moveTo(0, 0);
    sideShape.lineTo(2.2, 0);
    sideShape.lineTo(2.2, 1.4);
    sideShape.lineTo(1.5, 1.4);
    sideShape.bezierCurveTo(1.2, 1.4, 0.8, 1.0, 0.5, 0.6);
    sideShape.lineTo(0, 0.3);
    sideShape.lineTo(0, 0);
    const lp = new THREE.Mesh(new THREE.ShapeGeometry(sideShape), bodyBaseMat);
    lp.position.set(0.85, 0.3, -1.6);
    lp.rotation.y = Math.PI / 2;
    carriage.add(lp);
    const rp = lp.clone();
    rp.position.x = -0.85;
    carriage.add(rp);

    // ART PANELS
    const backPainting = new THREE.Mesh(new THREE.BoxGeometry(1.6, 0.6, 0.05), new THREE.MeshStandardMaterial({ color: 0xffffff }));
    backPainting.position.set(0, 0.6, -1.6);
    carriage.add(backPainting);
    const artCol = new THREE.MeshStandardMaterial({ color: choice.art });
    for(let i=0; i<3; i++) {
        const p = new THREE.Mesh(new THREE.PlaneGeometry(0.45, 0.45), artCol);
        p.position.set(-0.5 + (i*0.5), 0.6, -1.63);
        p.rotation.y = Math.PI;
        carriage.add(p);
    }

    const footrest = new THREE.Mesh(new THREE.BoxGeometry(1.6, 0.1, 1.0), woodMat);
    footrest.position.set(0, 0.3, 0.3);
    carriage.add(footrest);

    const seat = new THREE.Mesh(new THREE.BoxGeometry(1.55, 0.5, 1.0), seatMat);
    seat.position.set(0, 0.8, -0.6);
    carriage.add(seat);
    const back = new THREE.Mesh(new THREE.BoxGeometry(1.55, 1.4, 0.3), seatMat);
    back.position.set(0, 1.4, -1.2);
    carriage.add(back);

    rickshaw.add(carriage);

    // HOOD (Multi-colored Ribbed)
    const hood = new THREE.Group();
    hood.position.set(0, 2.7, -0.6);
    const hCols = choice.hood;
    const ribs = 10;
    for(let i=0; i<ribs; i++) {
        const t = i / (ribs - 1);
        const angle = t * Math.PI * 0.9 - Math.PI * 0.4;
        const shell = new THREE.Mesh(
            new THREE.CylinderGeometry(1.3, 1.3, 1.95, 20, 1, true, -Math.PI/2, Math.PI),
            new THREE.MeshStandardMaterial({ color: hCols[i % hCols.length], side: THREE.DoubleSide })
        );
        shell.rotation.z = Math.PI/2;
        shell.rotation.y = angle;
        shell.scale.x = 1.0 - (t * 0.3);
        hood.add(shell);

        const r = new THREE.Mesh(new THREE.CylinderGeometry(0.04, 0.04, 2.0, 8), chromeMat);
        r.rotation.z = Math.PI / 2;
        r.rotation.y = angle;
        hood.add(r);
    }
    rickshaw.add(hood);

    return rickshaw;
  }

  private spawnObjects(chunk: THREE.Group) {
    // Generate objects in rows to ensure fairness
    const rows = 2; // Reduced density for fairer gameplay
    const spacing = CHUNK_LENGTH / rows;

    for (let r = 0; r < rows; r++) {
        const zPos = (r * spacing) + 10; // Start offset
        
        // Decide what to put in each lane for this row
        const rowPattern = this.generateFairRowPattern();
        
        for (let lane = 0; lane < 3; lane++) {
            const type = rowPattern[lane];
            if (type === 'NONE') continue;

            let mesh: THREE.Mesh | undefined;
            if (type === 'LOW') {
                // Caution barrier
                const geo = new THREE.BoxGeometry(3, 1.2, 1);
                const mat = new THREE.MeshStandardMaterial({ color: 0xff3300 });
                mesh = new THREE.Mesh(geo, mat);
                mesh.position.set(LANES[lane], 0.6, zPos);
                
                // Add stripes
                const stripeGeo = new THREE.PlaneGeometry(3.1, 0.2);
                const stripeMat = new THREE.MeshStandardMaterial({ color: 0xffffff });
                const stripe = new THREE.Mesh(stripeGeo, stripeMat);
                stripe.position.set(0, 0.4, 0.51);
                mesh.add(stripe);
            } else if (type === 'HIGH') {
                // Maintenance Bridge (Slideable)
                const geo = new THREE.BoxGeometry(4, 1, 0.5);
                const mat = new THREE.MeshStandardMaterial({ color: 0x333333 });
                mesh = new THREE.Mesh(geo, mat);
                mesh.position.set(LANES[lane], 3.0, zPos); // Height 3.0 means bottom is at 2.5
                
                // Caution stripes
                const stripeGeo = new THREE.PlaneGeometry(4, 0.2);
                const stripeMat = new THREE.MeshStandardMaterial({ color: 0xffff00 });
                const stripe = new THREE.Mesh(stripeGeo, stripeMat);
                stripe.position.set(0, -0.3, 0.26);
                mesh.add(stripe);
            } else {
                // RICKSHAW (Local Vehicle)
                const rickshaw = this.createRickshaw(lane, zPos);
                rickshaw.traverse((child) => {
                    if ((child as THREE.Mesh).isMesh) {
                        child.castShadow = true;
                        child.receiveShadow = true;
                    }
                });
                chunk.add(rickshaw);
                this.obstacles.push(rickshaw);
                continue; // Skip the common mesh logic
            }

            mesh!.castShadow = true;
            chunk.add(mesh!);
            this.obstacles.push(mesh!);
        }

        // Spawn coins in a lane that isn't a WALL
        const safeLanes = rowPattern.map((t, i) => t !== 'WALL' ? i : -1).filter(i => i !== -1);
        if (safeLanes.length > 0) {
            const coinLane = safeLanes[Math.floor(Math.random() * safeLanes.length)];
            this.spawnCoins(chunk, zPos + 5, coinLane);
        }
    }

    // Spawn Power-up sparingly
    if (Math.random() > 0.9) {
        const lane = Math.floor(Math.random() * 3);
        const zPos = Math.random() * CHUNK_LENGTH;
        this.spawnPowerUp(chunk, zPos, lane);
    }
  }

  private lastPassableLane: number = 1;

  private generateFairRowPattern(): string[] {
      const types = ['NONE', 'LOW', 'HIGH', 'WALL'];
      const pattern: string[] = ['WALL', 'WALL', 'WALL'];
      
      // Ensure the previous passable lane stays passable or shifts by at most 1 lane
      let targetLane = this.lastPassableLane;
      if (Math.random() > 0.4) {
          const shift = Math.random() > 0.5 ? 1 : -1;
          targetLane = Math.max(0, Math.min(2, targetLane + shift));
      }
      this.lastPassableLane = targetLane;

      // The target lane must be TRULY passable (NONE, LOW, or HIGH)
      const passableTypes = ['NONE', 'LOW', 'HIGH'];
      pattern[targetLane] = passableTypes[Math.floor(Math.random() * passableTypes.length)];

      // Fill other lanes randomly but avoid creating a total wall if possible
      for (let i = 0; i < 3; i++) {
          if (i === targetLane) continue;
          
          // 40% chance for another obstacle
          if (Math.random() > 0.6) {
              pattern[i] = types[Math.floor(Math.random() * types.length)];
          } else {
              pattern[i] = 'NONE';
          }
      }

      return pattern;
  }

  private spawnCoins(chunk: THREE.Group, zPos: number, lane: number) {
    const coinGeo = new THREE.CylinderGeometry(0.5, 0.5, 0.1, 12);
    const coinMat = new THREE.MeshStandardMaterial({ color: 0xffdd00, emissive: 0xffaa00, emissiveIntensity: 0.5 });
    
    for (let i = 0; i < 3; i++) {
        const coin = new THREE.Mesh(coinGeo, coinMat);
        coin.rotation.x = Math.PI / 2;
        coin.position.set(LANES[lane], 1.5, zPos + (i * 2));
        chunk.add(coin);
        this.coins.push(coin);
    }
  }

  private spawnPowerUp(chunk: THREE.Group, zPos: number, lane: number) {
    const types: PowerUpType[] = ['MAGNET', 'DOUBLE', 'BOOST'];
    const type = types[Math.floor(Math.random() * types.length)];
    
    const geo = new THREE.SphereGeometry(0.8);
    const colors = { MAGNET: 0xff00ff, DOUBLE: 0x00ff00, BOOST: 0x0000ff };
    const mat = new THREE.MeshStandardMaterial({ color: colors[type], emissive: colors[type], emissiveIntensity: 0.5 });
    
    const p = new THREE.Mesh(geo, mat);
    p.position.set(LANES[lane], 1.5, zPos);
    (p as any).powerUpType = type;
    
    chunk.add(p);
    this.powerups.push(p);
  }

  public createCollectionEffect(pos: THREE.Vector3, color: number) {
    const geo = new THREE.BufferGeometry();
    const count = 20;
    const vertices = new Float32Array(count * 3);
    for (let i = 0; i < count; i++) {
        vertices[i * 3] = (Math.random() - 0.5) * 1;
        vertices[i * 3 + 1] = (Math.random() - 0.5) * 1;
        vertices[i * 3 + 2] = (Math.random() - 0.5) * 1;
    }
    geo.setAttribute('position', new THREE.BufferAttribute(vertices, 3));
    
    const mat = new THREE.PointsMaterial({ color, size: 0.15, transparent: true });
    const points = new THREE.Points(geo, mat);
    points.position.copy(pos);
    this.scene.add(points);
    this.particles.push(points);
  }

  private cleanupChunk(chunk: THREE.Group) {
      this.obstacles = this.obstacles.filter(obj => obj.parent !== null);
      this.coins = this.coins.filter(obj => obj.parent !== null);
      this.powerups = this.powerups.filter(obj => obj.parent !== null);
  }

  public reset() {
      this.chunks.forEach(c => this.scene.remove(c));
      this.chunks = [];
      this.obstacles = [];
      this.coins = [];
      this.powerups = [];
      this.lastChunkZ = -CHUNK_LENGTH;
      this.lastPassableLane = 1;
      for (let i = 0; i < CHUNKS_AHEAD; i++) {
          this.generateChunk();
      }
  }
}
