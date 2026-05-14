import * as THREE from 'three';

function lamb(color: number, opts?: Partial<THREE.MeshLambertMaterialParameters>) {
  return new THREE.MeshLambertMaterial({
    color,
    flatShading: true,
    ...opts,
  });
}

function createStarShape(points: number, outer: number, inner: number) {
  const shape = new THREE.Shape();
  for (let i = 0; i < points * 2; i++) {
    const r = i % 2 === 0 ? outer : inner;
    const angle = (i * Math.PI) / points - Math.PI / 2;
    if (i === 0) shape.moveTo(Math.cos(angle) * r, Math.sin(angle) * r);
    else shape.lineTo(Math.cos(angle) * r, Math.sin(angle) * r);
  }
  shape.closePath();
  return shape;
}

export function disposeObject3D(obj: THREE.Object3D): void {
  obj.traverse((child) => {
    const m = child as THREE.Mesh;
    if (m.geometry) m.geometry.dispose();
    const mat = m.material;
    if (mat) {
      if (Array.isArray(mat)) mat.forEach((x) => x.dispose());
      else mat.dispose();
    }
  });
}

/** Unsanity — 저폴리 3D (단색 라이팅) */
export function createDragonGroup(): THREE.Group {
  const g = new THREE.Group();
  const bodyC = lamb(0x41916c);
  const belly = lamb(0xd4edd9);
  const gold = lamb(0xe8a020);
  const crestC = lamb(0x2d7852);

  const d = 12;

  const torso = new THREE.Mesh(new THREE.BoxGeometry(28, 22, d), bodyC.clone());
  torso.position.set(-4, -2, 0);
  g.add(torso);

  const head = new THREE.Mesh(new THREE.BoxGeometry(20, 20, d * 1.05), bodyC.clone());
  head.position.set(14, 6, 0);
  g.add(head);

  const snout = new THREE.Mesh(new THREE.BoxGeometry(12, 10, d * 0.85), belly.clone());
  snout.position.set(24, 0, 0);
  g.add(snout);

  const tail = new THREE.Mesh(new THREE.BoxGeometry(14, 8, d * 0.65), bodyC.clone());
  tail.position.set(-24, -2, 0);
  tail.rotation.z = -0.2;
  g.add(tail);

  for (const [x, z] of [[-10, -3], [-10, 3], [-2, -3], [-2, 3]] as const) {
    const leg = new THREE.Mesh(new THREE.BoxGeometry(10, 9, d * 0.5), belly.clone());
    leg.position.set(x, -17, z);
    g.add(leg);
  }

  const eye = new THREE.Mesh(new THREE.BoxGeometry(5, 5, d * 0.08), gold.clone());
  eye.position.set(16, 10, d * 0.53);
  g.add(eye);

  const crest = new THREE.Mesh(new THREE.BoxGeometry(14, 4, d * 0.6), crestC.clone());
  crest.position.set(8, 16, -1);
  g.add(crest);

  g.rotation.order = 'ZXY';
  g.renderOrder = 12;
  return g;
}

export function createObstacleMesh(kind: string, w: number, h: number): THREE.Group {
  const g = new THREE.Group();
  const d = Math.max(12, Math.min(w, h) * 0.34);

  if (kind === 'bird') {
    const fus = lamb(0x6b7a92);

    const body = new THREE.Mesh(new THREE.BoxGeometry(w, h * 0.52, d * 0.7), fus.clone());
    body.position.y = h * 0.26;
    g.add(body);

    const wingLMat = lamb(0x8a93a8);
    const wl = new THREE.Mesh(new THREE.BoxGeometry(w * 0.76, h * 0.18, d * 0.4), wingLMat);
    wl.position.set(-w * 0.18, h * 0.35, -d * 0.08);
    wl.rotation.z = -0.15;
    g.add(wl);

    const wingRMat = lamb(0x9aa4b9);
    const wr = new THREE.Mesh(new THREE.BoxGeometry(w * 0.76, h * 0.18, d * 0.4), wingRMat);
    wr.position.set(-w * 0.04, h * 0.36, d * 0.1);
    wr.rotation.z = -0.08;
    g.add(wr);

    const bk = new THREE.Mesh(new THREE.BoxGeometry(w * 0.26, h * 0.12, d * 0.35), lamb(0xd4ccc0));
    bk.position.set(w * 0.48, h * 0.22, 0);
    g.add(bk);

    return g;
  }

  if (kind === 'rock') {
    const rockMat = lamb(0x2a2a28, { emissive: 0x111111 }); // Dark Ink Rock
    const mesh = new THREE.Mesh(new THREE.IcosahedronGeometry(1, 0), rockMat);
    mesh.scale.set(w * 0.48, h * 0.52, d * 0.48);
    mesh.position.y = h * 0.5;
    mesh.rotation.set(
      Math.random() * Math.PI,
      Math.random() * Math.PI,
      Math.random() * Math.PI,
    );
    g.add(mesh);
    return g;
  }

  /* cactus - stylized as an ink sketch */
  const trunk = new THREE.Mesh(
    new THREE.BoxGeometry(w * 0.4, h, d * 0.6),
    lamb(0x1a291c), // Very dark green/ink
  );
  trunk.position.y = h * 0.5;
  g.add(trunk);

  const armW = w * 0.35;
  const armH = h * 0.42;

  const armL = new THREE.Mesh(new THREE.BoxGeometry(armW, armH, d * 0.45), lamb(0x253828));
  armL.position.set(-w * 0.38, h * 0.4, -d * 0.05);
  g.add(armL);

  const armR = new THREE.Mesh(new THREE.BoxGeometry(armW, armH * 0.8, d * 0.45), lamb(0x253828));
  armR.position.set(w * 0.38, h * 0.55, d * 0.05);
  g.add(armR);

  // Spines as bright highlights
  const spineMat = lamb(0xfaf8f5, { emissive: 0xffffff, emissiveIntensity: 0.2 });
  for (let i = 0; i < 4; i++) {
    const s = new THREE.Mesh(new THREE.BoxGeometry(2, 6, 2), spineMat);
    const t = i / 3;
    s.position.set(0, h * THREE.MathUtils.lerp(0.2, 0.8, t), d * 0.32);
    g.add(s);
  }

  return g;
}

export function createCoinMesh(width: number, height: number): THREE.Group {
  const g = new THREE.Group();
  const r = Math.min(width, height) * 0.42;
  const thick = Math.max(4.5, Math.min(width, height) * 0.2);

  const disc = new THREE.Mesh(
    new THREE.CylinderGeometry(r, r, thick, 16),
    lamb(0xffd700, { emissive: 0xb8860b, emissiveIntensity: 0.4 }),
  );
  /** 라운드 면이 XY(정면 근처)로 보이도록 */
  disc.rotation.x = Math.PI / 2;
  disc.position.z = thick * 0.02;

  /** 변 테두리 - Sketch Ink Line feel */
  const rim = new THREE.Mesh(
    new THREE.TorusGeometry(r * 0.9, thick * 0.2, 6, 12),
    lamb(0x1a1a18), // Ink color
  );
  rim.rotation.y = Math.PI / 2;
  rim.position.z = thick * 0.48;

  const slash = new THREE.Mesh(
    new THREE.BoxGeometry(r * 0.9, thick * 0.3, thick * 0.2),
    lamb(0xffffff, { emissive: 0xffffff, emissiveIntensity: 0.8 }),
  );
  slash.rotation.x = Math.PI / 2;
  slash.rotation.z = Math.PI / 4;

  g.add(disc);
  g.add(rim);
  g.add(slash);
  g.renderOrder = 6;

  void height;
  void width;
  return g;
}

/** 무적 픽업(별) — 코인과 동일 히트박스 전제 */
export function createStarPickupMesh(width: number, height: number): THREE.Group {
  const g = new THREE.Group();
  const s = Math.min(width, height) * 0.45;
  const depth = 6;

  // 5-pointed star geometry
  const starShape = createStarShape(5, s, s * 0.45);
  const starGeo = new THREE.ExtrudeGeometry(starShape, {
    depth,
    bevelEnabled: false,
  });

  const starMat = lamb(0xffeb3b, { 
    emissive: 0xffeb3b, 
    emissiveIntensity: 0.8 
  });
  
  const mesh = new THREE.Mesh(starGeo, starMat);
  mesh.position.z = -depth / 2;
  g.add(mesh);

  // Subtle particles (glow dots)
  const partMat = new THREE.MeshBasicMaterial({ color: 0xffffff });
  const partGeo = new THREE.BoxGeometry(2, 2, 2);
  for (let i = 0; i < 6; i++) {
    const p = new THREE.Mesh(partGeo, partMat);
    const ang = Math.random() * Math.PI * 2;
    const rad = s * (1.1 + Math.random() * 0.3);
    p.position.set(Math.cos(ang) * rad, Math.sin(ang) * rad, (Math.random() - 0.5) * 10);
    g.add(p);
  }

  g.renderOrder = 7;
  void width;
  void height;
  return g;
}

/** 구름 블록 (배경) - 최적화된 박스 구름 */
export function createCloudGroup(size: number): THREE.Group {
  const g = new THREE.Group();
  const rnd = (a: number, b: number) => a + Math.random() * (b - a);

  // 구름 하나당 3개의 박스로 단순화 (구체보다 훨씬 가벼움)
  for (let i = 0; i < 3; i++) {
    const ww = size * rnd(0.4, 0.7);
    const hh = size * rnd(0.3, 0.5);
    const dd = size * 0.2;
    
    const mat = lamb(0xf5f9ff, { opacity: 0.5, transparent: true });
    const box = new THREE.Mesh(new THREE.BoxGeometry(ww, hh, dd), mat);
    
    box.position.set(
      THREE.MathUtils.lerp(-size * 0.25, size * 0.25, i / 2),
      rnd(-size * 0.05, size * 0.05),
      rnd(-size * 0.05, 0)
    );
    g.add(box);
  }

  return g;
}
