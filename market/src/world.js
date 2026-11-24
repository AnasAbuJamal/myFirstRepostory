import * as THREE from 'three';
import { GLTFLoader } from 'three/addons/loaders/GLTFLoader.js';
import { GRAPHICS_PRESETS } from './state.js';

export class LumenValeWorld {
  constructor(canvas, state, audio, onProgress) {
    this.canvas = canvas;
    this.state = state;
    this.audio = audio;
    this.onProgress = onProgress || (() => {});
    this.loader = new GLTFLoader();
    this.manifest = null;
    this.cars = [];
    this.pedestrians = [];
    this.colliderBoxes = [];
    this.phoneMesh = null;
    this.keys = new Set();
    this.yaw = 0;
    this.pitch = 0;
    this.pointerLocked = false;
    this.paused = false;
    this.playerPos = new THREE.Vector3(0, 1.68, 4.0);
    this.stats = { meshes: 0, triangles: 0, fps: 60 };
    this._fpsFrames = 0;
    this._fpsTime = performance.now();

    this.initRenderer();
    this.initScene();
    this.initCCTV();
    this.bindInputs();
  }

  initRenderer() {
    const preset = GRAPHICS_PRESETS[this.state.settings.graphics] || GRAPHICS_PRESETS.high;
    this.renderer = new THREE.WebGLRenderer({ canvas: this.canvas, antialias: this.state.settings.graphics !== 'low', powerPreference: 'high-performance' });
    this.renderer.setSize(window.innerWidth, window.innerHeight);
    this.renderer.setPixelRatio(Math.min(window.devicePixelRatio || 1, preset.pixelRatio));
    this.renderer.outputColorSpace = THREE.SRGBColorSpace;
    this.renderer.toneMapping = THREE.ACESFilmicToneMapping;
    this.renderer.toneMappingExposure = 1.05;
    this.renderer.shadowMap.enabled = preset.shadows;
    this.renderer.shadowMap.type = THREE.PCFSoftShadowMap;
  }

  initScene() {
    const preset = GRAPHICS_PRESETS[this.state.settings.graphics] || GRAPHICS_PRESETS.high;
    this.scene = new THREE.Scene();
    this.scene.background = new THREE.Color('#c8dff2');
    this.scene.fog = new THREE.Fog('#cde0f0', 55, preset.fogFar);

    this.camera = new THREE.PerspectiveCamera(this.state.settings.fov || 70, window.innerWidth / window.innerHeight, 0.08, preset.fogFar + 80);
    this.camera.position.copy(this.playerPos);
    this.camera.rotation.order = 'YXZ';
    this.scene.add(this.camera);

    this.hemi = new THREE.HemisphereLight(0xeef6ff, 0x7a6c5a, 0.92);
    this.scene.add(this.hemi);

    this.sun = new THREE.DirectionalLight(0xfff0d4, 2.35);
    this.sun.position.set(65, 82, 55);
    this.sun.castShadow = preset.shadows;
    this.sun.shadow.mapSize.set(preset.shadowSize, preset.shadowSize);
    Object.assign(this.sun.shadow.camera, { left: -95, right: 95, top: 95, bottom: -95, near: 10, far: 260 });
    this.sun.shadow.bias = -0.0004;
    this.sun.shadow.normalBias = 0.04;
    this.scene.add(this.sun);

    const moLight = new THREE.PointLight(0xfff0d6, 14, 28, 1.5);
    moLight.position.set(19, 3.6, -83);
    this.scene.add(moLight);
    const schLight = new THREE.PointLight(0xfff3de, 16, 36, 1.5);
    schLight.position.set(-34, 3.6, -92);
    this.scene.add(schLight);
    const libLight = new THREE.PointLight(0xffe9c7, 14, 26, 1.5);
    libLight.position.set(-18, 3.5, -88);
    this.scene.add(libLight);
  }

  initCCTV() {
    this.cctvCams = {
      street: this.makeCam([-5, 6.5, 4], [0, 1.5, -30]),
      school: this.makeCam([-22, 6.2, -62], [-36, 2.5, -88]),
      office: this.makeCam([11.8, 3.4, -91.2], [18.5, 1.2, -84.0]),
    };
  }

  makeCam(pos, target) {
    const c = new THREE.PerspectiveCamera(62, 16 / 9, 0.1, 200);
    c.position.set(...pos);
    c.lookAt(...target);
    return c;
  }

  async load() {
    this.onProgress(18, 'Loading city manifest…');
    const res = await fetch('./assets/blender/LumenVale_Manifest.json');
    this.manifest = await res.json();
    const preset = GRAPHICS_PRESETS[this.state.settings.graphics] || GRAPHICS_PRESETS.high;

    this.onProgress(35, 'Loading baked Frankfurt City (PBR textures)…');
    const cityGltf = await this.loader.loadAsync('./assets/blender/' + this.manifest.assets.city_visual);
    this.cityRoot = cityGltf.scene;
    let meshes = 0, tris = 0;
    this.cityRoot.traverse((obj) => {
      if (obj.isMesh) {
        meshes++;
        const g = obj.geometry;
        tris += g.index ? g.index.count / 3 : (g.attributes.position?.count || 0) / 3;
        obj.castShadow = preset.shadows;
        obj.receiveShadow = true;
        const mats = Array.isArray(obj.material) ? obj.material : [obj.material];
        for (const m of mats) {
          if (m && m.map) m.map.anisotropy = preset.anisotropy;
        }
      }
      if (!obj.isMesh && obj.name && obj.name.startsWith('Car_')) this.cars.push(obj);
      if (!obj.isMesh && obj.name && (obj.name.startsWith('Person_Street_') || obj.name.startsWith('Person_Park_'))) {
        this.pedestrians.push({ obj, dir: obj.position.x >= 0 ? 1 : -1, speed: 1.15 });
      }
    });
    this.scene.add(this.cityRoot);
    this.stats.meshes = meshes;
    this.stats.triangles = Math.round(tris);

    this.onProgress(78, 'Loading collisions & 3D City Phone…');
    try {
      const colGltf = await this.loader.loadAsync('./assets/blender/' + this.manifest.assets.collisions);
      colGltf.scene.updateMatrixWorld(true);
      colGltf.scene.traverse((obj) => {
        if (obj.isMesh && !/Ground/i.test(obj.name)) {
          const box = new THREE.Box3().setFromObject(obj);
          this.colliderBoxes.push(box);
        }
      });
    } catch {}

    try {
      const phoneGltf = await this.loader.loadAsync('./assets/blender/' + this.manifest.assets.city_phone);
      this.phoneMesh = phoneGltf.scene;
      this.phoneMesh.position.set(0.20, -0.17, -0.38);
      this.phoneMesh.rotation.set(0.16, -0.24, 0.04);
      this.phoneMesh.visible = false;
      this.camera.add(this.phoneMesh);
    } catch {}

    if (this.manifest.spawn_points?.main_street) {
      this.teleport([0, 1.68, 4.0], 0);
    }
    this.onProgress(100, 'Ready');
  }

  teleport(coords, yaw = 0) {
    this.playerPos.set(coords[0], coords[1], coords[2]);
    this.yaw = yaw;
    this.pitch = 0;
    this.camera.position.copy(this.playerPos);
    this.camera.rotation.set(this.pitch, this.yaw, 0, 'YXZ');
  }

  applySettings() {
    const s = this.state.settings;
    const preset = GRAPHICS_PRESETS[s.graphics] || GRAPHICS_PRESETS.high;
    this.renderer.setPixelRatio(Math.min(window.devicePixelRatio || 1, preset.pixelRatio));
    this.renderer.shadowMap.enabled = preset.shadows;
    this.sun.castShadow = preset.shadows;
    this.camera.fov = s.fov || 70;
    this.camera.far = preset.fogFar + 80;
    this.camera.updateProjectionMatrix();
    if (this.scene.fog) this.scene.fog.far = preset.fogFar;
  }

  bindInputs() {
    window.addEventListener('resize', () => {
      this.camera.aspect = window.innerWidth / window.innerHeight;
      this.camera.updateProjectionMatrix();
      this.renderer.setSize(window.innerWidth, window.innerHeight);
    });
    window.addEventListener('keydown', (e) => { this.keys.add(e.code); });
    window.addEventListener('keyup', (e) => { this.keys.delete(e.code); });
    document.addEventListener('pointerlockchange', () => {
      this.pointerLocked = document.pointerLockElement === this.canvas;
    });
    window.addEventListener('mousemove', (e) => {
      if (!this.pointerLocked || this.paused) return;
      const sens = this.state.settings.sensitivity || 0.0024;
      const inv = this.state.settings.invertY ? -1 : 1;
      this.yaw -= e.movementX * sens;
      this.pitch = Math.max(-1.25, Math.min(1.15, this.pitch - inv * e.movementY * sens));
    });
  }

  requestPointerLock() {
    if (this.canvas.requestPointerLock) { try { this.canvas.requestPointerLock(); } catch {} }
  }

  releasePointerLock() {
    if (document.pointerLockElement && document.exitPointerLock) { try { document.exitPointerLock(); } catch {} }
  }

  setPhone3D(visible) {
    if (this.phoneMesh) this.phoneMesh.visible = Boolean(visible);
  }

  isBlocked(nx, nz) {
    if (nx < -105 || nx > 105 || nz < -135 || nz > 105) return true;
    const r = 0.32;
    for (const b of this.colliderBoxes) {
      if (nx + r > b.min.x && nx - r < b.max.x && nz + r > b.min.z && nz - r < b.max.z && this.playerPos.y < b.max.y) {
        return true;
      }
    }
    return false;
  }

  getCurrentLocationName() {
    const { x, z } = this.playerPos;
    if (x >= 10.5 && x <= 36.5 && z <= -68.5 && z >= -92.5) return 'Market Office';
    if (x >= -24 && x <= -12 && z <= -82 && z >= -98) return 'School Library';
    if (x >= -60 && x <= -12 && z <= -82 && z >= -116) return 'LumenVale School';
    if (x >= -65 && x <= -8 && z >= -52 && z <= 12) return 'Civic Square';
    if (x >= -65 && x <= -8 && z >= 18 && z <= 82) return 'Public Park';
    return 'Main Street';
  }

  getNearbyInteraction() {
    const interactions = [
      { id: 'market_office_pc', label: 'Use Market Office Computer', pos: [17.5, 1.3, -86.5], radius: 3.4 },
      { id: 'school_lms', label: 'Open School Portal (Teacher LMS)', pos: [-36.0, 1.2, -88.5], radius: 4.0 },
      { id: 'school_library', label: 'Browse School Library & Vocabulary', pos: [-18.0, 1.2, -88.0], radius: 4.5 },
      { id: 'cafe_terrace', label: 'Visit Café LumenVale', pos: [-9.0, 1.2, -10.0], radius: 3.2 },
    ];
    let best = null, bestD = Infinity;
    for (const it of interactions) {
      const d = Math.hypot(this.playerPos.x - it.pos[0], this.playerPos.z - it.pos[2]);
      if (d <= it.radius && d < bestD) { best = it; bestD = d; }
    }
    return best;
  }

  renderCCTV(targetCanvas, camKey = 'street') {
    const cam = this.cctvCams[camKey] || this.cctvCams.street;
    if (!targetCanvas || !cam) return;
    const w = 480, h = 270;
    if (targetCanvas.width !== w || targetCanvas.height !== h) { targetCanvas.width = w; targetCanvas.height = h; }
    const ctx2d = targetCanvas.getContext('2d');
    if (!ctx2d) return;
    const prevPR = this.renderer.getPixelRatio();
    this.renderer.setPixelRatio(1);
    this.renderer.setViewport(0, 0, w, h);
    this.renderer.setScissor(0, 0, w, h);
    this.renderer.setScissorTest(true);
    this.renderer.render(this.scene, cam);
    ctx2d.drawImage(this.canvas, 0, this.canvas.height - h, w, h, 0, 0, w, h);
    this.renderer.setScissorTest(false);
    this.renderer.setPixelRatio(prevPR);
    this.renderer.setViewport(0, 0, window.innerWidth, window.innerHeight);
  }

  update(dt) {
    const step = Math.min(dt, 0.05);
    if (!this.paused) {
      let f = 0, r = 0;
      if (this.keys.has('KeyW') || this.keys.has('ArrowUp')) f += 1;
      if (this.keys.has('KeyS') || this.keys.has('ArrowDown')) f -= 1;
      if (this.keys.has('KeyD') || this.keys.has('ArrowRight')) r += 1;
      if (this.keys.has('KeyA') || this.keys.has('ArrowLeft')) r -= 1;
      const moving = f !== 0 || r !== 0;
      if (moving) {
        const len = Math.hypot(f, r);
        f /= len; r /= len;
        const speed = (this.keys.has('ShiftLeft') || this.keys.has('ShiftRight')) ? 8.8 : 4.8;
        const sin = Math.sin(this.yaw), cos = Math.cos(this.yaw);
        const dx = (-sin * f + cos * r) * speed * step;
        const dz = (-cos * f - sin * r) * speed * step;
        const nx = this.playerPos.x + dx;
        const nz = this.playerPos.z + dz;
        if (!this.isBlocked(nx, this.playerPos.z)) this.playerPos.x = nx;
        if (!this.isBlocked(this.playerPos.x, nz)) this.playerPos.z = nz;
        const loc = this.getCurrentLocationName();
        this.audio.step(loc === 'Market Office' || loc === 'LumenVale School' || loc === 'School Library');
      }
      const bob = moving ? Math.sin(performance.now() * 0.011) * 0.032 : 0;
      this.camera.position.set(this.playerPos.x, this.playerPos.y + bob, this.playerPos.z);
      this.camera.rotation.set(this.pitch, this.yaw, 0, 'YXZ');
    }

    for (const car of this.cars) {
      if (car.name.includes('_NB')) { car.position.z -= 7.5 * step; if (car.position.z < -125) car.position.z = 75; }
      else if (car.name.includes('_SB')) { car.position.z += 7.0 * step; if (car.position.z > 75) car.position.z = -125; }
      else if (car.name.includes('_EB')) { car.position.x += 6.5 * step; if (car.position.x > 68) car.position.x = -68; }
      else if (car.name.includes('_WB')) { car.position.x -= 6.5 * step; if (car.position.x < -68) car.position.x = 68; }
    }
    for (const ped of this.pedestrians) {
      ped.obj.position.z += ped.dir * ped.speed * step;
      if (ped.obj.position.z > 8 || ped.obj.position.z < -52) {
        ped.dir *= -1;
        ped.obj.rotation.y += Math.PI;
      }
    }

    this.renderer.render(this.scene, this.camera);
    this._fpsFrames++;
    const now = performance.now();
    if (now - this._fpsTime >= 1000) {
      this.stats.fps = this._fpsFrames;
      this._fpsFrames = 0;
      this._fpsTime = now;
    }
  }
}
