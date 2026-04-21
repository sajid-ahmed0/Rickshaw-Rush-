import * as THREE from 'three';
import { LANES, PLAYER_Y, GRAVITY, JUMP_FORCE, SLIDE_DURATION, Skin } from './constants';
import { audioManager } from './AudioManager';

export class Player {
  public mesh: THREE.Group;
  public body: THREE.Mesh;
  public laneIndex: number = 1; // Start in center lane
  private targetLaneX: number = LANES[1];
  
  public isJumping: boolean = false;
  public isSliding: boolean = false;
  private velocityY: number = 0;
  private slideTimer: number = 0;

  // Power-up states
  public magnetActive: boolean = false;
  public doubleScoreActive: boolean = false;
  public speedBoostActive: boolean = false;

  public leftArm!: THREE.Mesh;
  public rightArm!: THREE.Mesh;
  public leftLeg!: THREE.Mesh;
  public rightLeg!: THREE.Mesh;
  private head!: THREE.Group;
  private cap!: THREE.Mesh;
  
  private animationTime: number = 0;

  constructor() {
    this.mesh = new THREE.Group();

    // BODY / HOODIE (Slightly tapered)
    const bodyGeo = new THREE.BoxGeometry(0.8, 1.1, 0.5);
    const bodyMat = new THREE.MeshStandardMaterial({ color: 0x3366ff });
    this.body = new THREE.Mesh(bodyGeo, bodyMat);
    this.body.position.y = 1.4;
    this.body.castShadow = true;
    this.mesh.add(this.body);

    // Hoodie Pocket
    const pocketGeo = new THREE.BoxGeometry(0.65, 0.3, 0.1);
    const pocketMat = new THREE.MeshStandardMaterial({ color: 0x2255ee });
    const pocket = new THREE.Mesh(pocketGeo, pocketMat);
    pocket.position.set(0, -0.2, 0.26);
    this.body.add(pocket);

    // Hoodie Strings
    const stringGeo = new THREE.CylinderGeometry(0.02, 0.02, 0.4, 6);
    const whiteMat = new THREE.MeshStandardMaterial({ color: 0xffffff });
    const stringL = new THREE.Mesh(stringGeo, whiteMat);
    stringL.position.set(0.15, 0.3, 0.27);
    stringL.rotation.z = 0.1;
    this.body.add(stringL);
    const stringR = stringL.clone();
    stringR.position.x = -0.15;
    stringR.rotation.z = -0.1;
    this.body.add(stringR);

    // Backpack
    const backpackGeo = new THREE.BoxGeometry(0.6, 0.8, 0.35);
    const backpackMat = new THREE.MeshStandardMaterial({ color: 0x222222 });
    const backpack = new THREE.Mesh(backpackGeo, backpackMat);
    backpack.position.set(0, 0, -0.4);
    this.body.add(backpack);

    // HEAD GROUP
    this.head = new THREE.Group();
    this.head.position.y = 2.15;
    this.mesh.add(this.head);

    // Face/Skin
    const faceGeo = new THREE.BoxGeometry(0.7, 0.7, 0.7);
    const skinMat = new THREE.MeshStandardMaterial({ color: 0xffcc99 });
    const face = new THREE.Mesh(faceGeo, skinMat);
    this.head.add(face);

    // Hair
    const hairGeo = new THREE.BoxGeometry(0.76, 0.3, 0.76);
    const hairMat = new THREE.MeshStandardMaterial({ color: 0x4b3621 });
    const hair = new THREE.Mesh(hairGeo, hairMat);
    hair.position.y = 0.25;
    this.head.add(hair);

    // Sideburns
    const sideGeo = new THREE.BoxGeometry(0.1, 0.3, 0.2);
    const lSide = new THREE.Mesh(sideGeo, hairMat);
    lSide.position.set(0.35, 0.05, 0);
    this.head.add(lSide);
    const rSide = lSide.clone();
    rSide.position.x = -0.35;
    this.head.add(rSide);

    // Eyes (Larger, more expressive)
    const eyeWhiteGeo = new THREE.BoxGeometry(0.2, 0.2, 0.05);
    const eyeWhite = new THREE.Mesh(eyeWhiteGeo, whiteMat);
    eyeWhite.position.set(0.18, 0.1, 0.36);
    this.head.add(eyeWhite);
    const reWhite = eyeWhite.clone();
    reWhite.position.x = -0.18;
    this.head.add(reWhite);

    const pupilGeo = new THREE.BoxGeometry(0.1, 0.1, 0.06);
    const pupilMat = new THREE.MeshStandardMaterial({ color: 0x000000 });
    const pupilL = new THREE.Mesh(pupilGeo, pupilMat);
    pupilL.position.set(0.18, 0.1, 0.37);
    this.head.add(pupilL);
    const pupilR = pupilL.clone();
    pupilR.position.x = -0.18;
    this.head.add(pupilR);

    // Cap
    const capGeo = new THREE.BoxGeometry(0.78, 0.2, 0.78);
    const capMat = new THREE.MeshStandardMaterial({ color: 0xff3300 });
    this.cap = new THREE.Mesh(capGeo, capMat);
    this.cap.position.y = 0.45;
    this.head.add(this.cap);

    const brimGeo = new THREE.BoxGeometry(0.78, 0.05, 0.6);
    const brim = new THREE.Mesh(brimGeo, capMat);
    brim.position.set(0, 0.35, 0.5);
    this.head.add(brim);

    // ARMS (With shoulders)
    const upperArmGeo = new THREE.BoxGeometry(0.25, 0.45, 0.25);
    const lowerArmGeo = new THREE.BoxGeometry(0.22, 0.45, 0.22);
    const sleeveMat = new THREE.MeshStandardMaterial({ color: 0xeeeeee });

    // Left Arm
    this.leftArm = new THREE.Group() as any;
    const lUpper = new THREE.Mesh(upperArmGeo, bodyMat);
    lUpper.position.y = -0.2;
    this.leftArm.add(lUpper);
    const lLower = new THREE.Mesh(lowerArmGeo, skinMat);
    lLower.position.y = -0.6;
    this.leftArm.add(lLower);
    this.leftArm.position.set(0.55, 1.8, 0); // Rotate at shoulder
    this.mesh.add(this.leftArm);

    // Right Arm
    this.rightArm = new THREE.Group() as any;
    const rUpper = new THREE.Mesh(upperArmGeo, bodyMat);
    rUpper.position.y = -0.2;
    this.rightArm.add(rUpper);
    const rLower = new THREE.Mesh(lowerArmGeo, skinMat);
    rLower.position.y = -0.6;
    this.rightArm.add(rLower);
    this.rightArm.position.set(-0.55, 1.8, 0);
    this.mesh.add(this.rightArm);

    // LEGS
    const legMat = new THREE.MeshStandardMaterial({ color: 0x1a237e });
    const upperLegGeo = new THREE.BoxGeometry(0.3, 0.5, 0.3);
    const lowerLegGeo = new THREE.BoxGeometry(0.28, 0.5, 0.28);

    // Left Leg
    this.leftLeg = new THREE.Group() as any;
    const luLeg = new THREE.Mesh(upperLegGeo, legMat);
    luLeg.position.y = -0.25;
    this.leftLeg.add(luLeg);
    const llLeg = new THREE.Mesh(lowerLegGeo, legMat);
    llLeg.position.y = -0.7;
    this.leftLeg.add(llLeg);
    this.leftLeg.position.set(0.22, 0.9, 0);
    this.mesh.add(this.leftLeg);

    // Right Leg
    this.rightLeg = new THREE.Group() as any;
    const ruLeg = new THREE.Mesh(upperLegGeo, legMat);
    ruLeg.position.y = -0.25;
    this.rightLeg.add(ruLeg);
    const rlLeg = new THREE.Mesh(lowerLegGeo, legMat);
    rlLeg.position.y = -0.7;
    this.rightLeg.add(rlLeg);
    this.rightLeg.position.set(-0.22, 0.9, 0);
    this.mesh.add(this.rightLeg);

    // SNEAKERS
    const shoeGeo = new THREE.BoxGeometry(0.38, 0.25, 0.6);
    const shoeMat = new THREE.MeshStandardMaterial({ color: 0xff3300 });
    
    // Left Shoe
    const lShoe = new THREE.Mesh(shoeGeo, shoeMat);
    lShoe.position.set(0, -0.9, 0.1);
    this.leftLeg.add(lShoe);
    const lSole = new THREE.Mesh(new THREE.BoxGeometry(0.4, 0.06, 0.62), whiteMat);
    lSole.position.y = -0.12;
    lShoe.add(lSole);

    // Right Shoe
    const rShoe = new THREE.Mesh(shoeGeo, shoeMat);
    rShoe.position.set(0, -0.9, 0.1);
    this.rightLeg.add(rShoe);
    const rSole = new THREE.Mesh(new THREE.BoxGeometry(0.4, 0.06, 0.62), whiteMat);
    rSole.position.y = -0.12;
    rShoe.add(rSole);

    this.mesh.position.y = 0;
  }

  public setSkin(skin: Skin) {
    (this.body.material as THREE.MeshStandardMaterial).color.setHex(skin.color);
    (this.cap.material as THREE.MeshStandardMaterial).color.setHex(skin.color === 0x3366ff ? 0xff3300 : skin.color);
  }

  public update(deltaTime: number, speed: number) {
    this.animationTime += deltaTime * speed * 0.05;
    
    // Smoother, frame-rate independent lane switching
    const speedFactor = this.speedBoostActive ? 15 : 10;
    const lerpFactor = 1 - Math.exp(-speedFactor * (deltaTime / 1000));
    this.mesh.position.x = THREE.MathUtils.lerp(this.mesh.position.x, this.targetLaneX, lerpFactor);
    
    // Procedural Leaning
    const targetTilt = (this.mesh.position.x - this.targetLaneX) * 0.05;
    this.mesh.rotation.z = THREE.MathUtils.lerp(this.mesh.rotation.z, targetTilt, 0.1);
    this.mesh.rotation.y = THREE.MathUtils.lerp(this.mesh.rotation.y, -targetTilt * 0.5, 0.1);

    // Run Animation (Procedural swing)
    if (!this.isJumping && !this.isSliding) {
      const swing = Math.sin(this.animationTime);
      this.leftLeg.rotation.x = swing * 0.6;
      this.rightLeg.rotation.x = -swing * 0.6;
      this.leftArm.rotation.x = -swing * 0.8;
      this.rightArm.rotation.x = swing * 0.8;
      
      // Reset rotations from other states
      this.body.rotation.x = 0;
      this.head.rotation.x = 0;

      // Bouncy head
      this.head.position.y = 2.1 + Math.abs(Math.cos(this.animationTime * 2)) * 0.1;
    }

    // Jump physics
    if (this.isJumping) {
      this.velocityY += GRAVITY;
      this.mesh.position.y += this.velocityY;

      // Leg tuck during jump
      this.leftLeg.rotation.x = -0.8;
      this.rightLeg.rotation.x = -0.2;
      this.leftArm.rotation.x = 0.5;
      this.rightArm.rotation.x = 0.5;

      if (this.mesh.position.y <= 0) {
        this.mesh.position.y = 0;
        this.isJumping = false;
        this.velocityY = 0;
      }
    }

    // Slide Animation
    if (this.isSliding) {
        this.body.rotation.x = 0.5; // Lean forward
        this.head.rotation.x = -0.3; // Look up while sliding
        this.leftLeg.rotation.x = -1.2;
        this.rightLeg.rotation.x = -1.2;
        this.leftArm.rotation.x = 1.0;
        this.rightArm.rotation.x = 1.0;
    }

    // Slide logic
    if (this.isSliding) {
      this.slideTimer -= deltaTime;
      if (this.slideTimer <= 0) {
        this.stopSlide();
      }
    }
  }

  public moveLeft() {
    if (this.laneIndex > 0) {
      this.laneIndex--;
      this.targetLaneX = LANES[this.laneIndex];
    }
  }

  public moveRight() {
    if (this.laneIndex < LANES.length - 1) {
      this.laneIndex++;
      this.targetLaneX = LANES[this.laneIndex];
    }
  }

  public jump() {
    if (!this.isJumping && !this.isSliding) {
      this.isJumping = true;
      this.velocityY = JUMP_FORCE;
      audioManager.playSound('jump');
    }
  }

  public slide() {
    if (!this.isSliding) {
      this.isSliding = true;
      this.slideTimer = SLIDE_DURATION;
      this.mesh.scale.y = 0.5;
      this.mesh.position.y = 0.1;
      
      if (this.isJumping) {
         this.velocityY = -JUMP_FORCE;
      }
    }
  }

  private stopSlide() {
    this.isSliding = false;
    this.mesh.scale.y = 1.0;
    this.mesh.position.y = 0;
  }
}
