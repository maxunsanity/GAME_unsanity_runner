import * as THREE from 'three';

function lamb(color: number, opts?: Partial<THREE.MeshLambertMaterialParameters>) {
  return new THREE.MeshLambertMaterial({
    color,
    flatShading: true,
    ...opts,
  });
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
    const rockMat = lamb(0xa69f92);
    const mesh = new THREE.Mesh(new THREE.IcosahedronGeometry(1, 0), rockMat);
    mesh.scale.set(w * 0.45, h * 0.5, d * 0.45);
    mesh.position.y = h * 0.5;
    mesh.rotation.set(
      Math.random() * Math.PI,
      Math.random() * Math.PI,
      Math.random() * Math.PI,
    );
    g.add(mesh);
    return g;
  }

  /* cactus */
  const bloomMat = lamb(0x6bc47d);
  const spineBase = lamb(0x1a291c, { opacity: 0.4, transparent: true });

  const trunk = new THREE.Mesh(
    new THREE.BoxGeometry(w * 0.52, h, d * 0.66),
    lamb(0x418e5f),
  );
  trunk.position.y = h * 0.5;
  g.add(trunk);

  const armW = Math.max(w * 0.35, h * 0.18);
  const armH = h * 0.48;

  const armL = new THREE.Mesh(new THREE.BoxGeometry(armW, armH, d * 0.45), bloomMat.clone());
  armL.position.set(-w * 0.42, h * 0.42, -d * 0.06);
  g.add(armL);

  const armR = new THREE.Mesh(new THREE.BoxGeometry(armW, armH * 0.85, d * 0.45), bloomMat.clone());
  armR.position.set(w * 0.42, h * 0.52, d * 0.06);
  g.add(armR);

  for (let i = 0; i < 5; i++) {
    const s = new THREE.Mesh(
      new THREE.BoxGeometry(3.2, Math.max(h * 0.08, 5), d * 0.12),
      spineBase.clone(),
    );
    const t = i / 4;
    s.position.set(
      THREE.MathUtils.lerp(-w * 0.2, w * 0.22, t),
      h * THREE.MathUtils.lerp(0.26, 0.88, t),
      d * 0.38,
    );
    g.add(s);
  }

  return g;
}

export function createCoinMesh(width: number, height: number): THREE.Group {
  const g = new THREE.Group();
  const r = Math.min(width, height) * 0.42;
  const thick = Math.max(4.5, Math.min(width, height) * 0.2);

  const disc = new THREE.Mesh(
    new THREE.CylinderGeometry(r, r, thick, 24),
    lamb(0xf0c038),
  );
  /** 라운드 면이 XY(정면 근처)로 보이도록 */
  disc.rotation.x = Math.PI / 2;
  disc.position.z = thick * 0.02;

  /** 변 테두리 */
  const rim = new THREE.Mesh(
    new THREE.TorusGeometry(r * 0.9, thick * 0.16, 8, 20),
    lamb(0xc98a22),
  );
  rim.rotation.y = Math.PI / 2;
  rim.position.z = thick * 0.5;

  const slash = new THREE.Mesh(
    new THREE.BoxGeometry(r * 1.06, thick * 0.45, thick * 0.32),
    lamb(0xf7e096),
  );
  slash.rotation.x = Math.PI / 2;

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
  const s = Math.min(width, height) * 0.38;
  const core = new THREE.Mesh(
    new THREE.OctahedronGeometry(s, 0),
    lamb(0xffd53d, { emissive: 0x885500, emissiveIntensity: 0.35 }),
  );
  core.rotation.z = Math.PI / 4;
  g.add(core);

  const glow = new THREE.Mesh(
    new THREE.OctahedronGeometry(s * 1.22, 0),
    lamb(0xffee88, { opacity: 0.45, transparent: true }),
  );
  glow.rotation.z = Math.PI / 4;
  g.add(glow);

  g.renderOrder = 7;
  void width;
  void height;
  return g;
}

/** 구름 블록 (배경) */
export function createCloudGroup(size: number): THREE.Group {
  const g = new THREE.Group();
  const rnd = (a: number, b: number) => a + Math.random() * (b - a);

  for (let i = 0; i < 4; i++) {
    const rr = size * THREE.MathUtils.lerp(0.18, 0.36, i / 3) * rnd(0.9, 1.15);
    const mat = lamb(0xf5f9ff, { opacity: 0.62, transparent: true });
    const sp = new THREE.Mesh(new THREE.SphereGeometry(rr, 10, 10), mat);
    sp.position.set(
      THREE.MathUtils.lerp(-size * 0.32, size * 0.36, i / 3),
      THREE.MathUtils.lerp(-size * 0.05, size * 0.1, rnd(0.1, 0.95)),
      rnd(-size * 0.06, size * 0.1),
    );
    g.add(sp);
  }

  return g;
}
