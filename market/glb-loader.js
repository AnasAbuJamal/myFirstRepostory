// Native zero-dependency GLB 2.0 loader & Blender City integration for LumenVale (PineboundThree r180).

const LV_GRAPHICS_PRESETS = {
  low: { label: 'Low (Laptop / Integrated)', pixelRatio: 0.85, shadows: false, shadowMapSize: 512, anisotropy: 2, fogFar: 130, fovDefault: 70 },
  medium: { label: 'Medium (Desktop)', pixelRatio: 1.15, shadows: true, shadowMapSize: 1024, anisotropy: 4, fogFar: 185, fovDefault: 70 },
  high: { label: 'High (Gaming)', pixelRatio: 1.4, shadows: true, shadowMapSize: 2048, anisotropy: 8, fogFar: 245, fovDefault: 72 },
  ultra: { label: 'Ultra (Max Quality)', pixelRatio: 1.85, shadows: true, shadowMapSize: 2048, anisotropy: 16, fogFar: 320, fovDefault: 75 },
};

function lvResolveGraphicsPreset(name) {
  if (name === 'balanced') return 'low';
  if (name === 'detailed') return 'high';
  return LV_GRAPHICS_PRESETS[name] ? name : 'medium';
}

const GLTF_COMP_TYPES = {
  5120: Int8Array,
  5121: Uint8Array,
  5122: Int16Array,
  5123: Uint16Array,
  5125: Uint32Array,
  5126: Float32Array,
};
const GLTF_TYPE_COUNTS = { SCALAR: 1, VEC2: 2, VEC3: 3, VEC4: 4, MAT4: 16 };

function lvReadAccessor(gltf, bin, index) {
  const acc = gltf.accessors[index];
  if (!acc || acc.bufferView == null) return null;
  const bv = gltf.bufferViews[acc.bufferView];
  const Ctor = GLTF_COMP_TYPES[acc.componentType];
  const itemSize = GLTF_TYPE_COUNTS[acc.type] || 1;
  const byteOffset = (bv.byteOffset || 0) + (acc.byteOffset || 0);
  const byteStride = bv.byteStride || 0;
  if (!byteStride || byteStride === itemSize * Ctor.BYTES_PER_ELEMENT) {
    const slice = bin.buffer.slice(bin.byteOffset + byteOffset, bin.byteOffset + byteOffset + acc.count * itemSize * Ctor.BYTES_PER_ELEMENT);
    return { array: new Ctor(slice), itemSize, normalized: !!acc.normalized };
  }
  const out = new Ctor(acc.count * itemSize);
  const dv = new DataView(bin.buffer, bin.byteOffset + byteOffset);
  for (let i = 0; i < acc.count; i++) {
    const base = i * byteStride;
    for (let k = 0; k < itemSize; k++) {
      const off = base + k * Ctor.BYTES_PER_ELEMENT;
      out[i * itemSize + k] = acc.componentType === 5126 ? dv.getFloat32(off, true)
        : acc.componentType === 5123 ? dv.getUint16(off, true)
        : acc.componentType === 5125 ? dv.getUint32(off, true)
        : dv.getUint8(off);
    }
  }
  return { array: out, itemSize, normalized: !!acc.normalized };
}

async function lvDecodeImage(bytes, mimeType) {
  const blob = new Blob([bytes], { type: mimeType || 'image/jpeg' });
  if (typeof createImageBitmap === 'function') {
    try { return await createImageBitmap(blob); } catch {}
  }
  return new Promise((resolve, reject) => {
    const url = URL.createObjectURL(blob);
    const img = new Image();
    img.onload = () => { URL.revokeObjectURL(url); resolve(img); };
    img.onerror = (err) => { URL.revokeObjectURL(url); reject(err); };
    img.src = url;
  });
}

async function lvParseGLB(T, arrayBuffer, maxAnisotropy = 4) {
  const dv = new DataView(arrayBuffer);
  if (dv.getUint32(0, true) !== 0x46546C67) throw new Error('Invalid GLB header');
  let offset = 12;
  let gltf = null;
  let bin = null;
  while (offset + 8 <= arrayBuffer.byteLength) {
    const chunkLen = dv.getUint32(offset, true);
    const chunkType = dv.getUint32(offset + 4, true);
    const start = offset + 8;
    if (chunkType === 0x4E4F534A) {
      gltf = JSON.parse(new TextDecoder().decode(new Uint8Array(arrayBuffer, start, chunkLen)));
    } else if (chunkType === 0x004E4942) {
      bin = new Uint8Array(arrayBuffer, start, chunkLen);
    }
    offset = start + chunkLen;
  }
  if (!gltf || !bin) throw new Error('Incomplete GLB chunks');

  const textures = [];
  if (Array.isArray(gltf.images)) {
    for (let i = 0; i < gltf.images.length; i++) {
      const imgDef = gltf.images[i];
      if (imgDef.bufferView == null) { textures.push(null); continue; }
      const bv = gltf.bufferViews[imgDef.bufferView];
      const bytes = bin.subarray(bv.byteOffset || 0, (bv.byteOffset || 0) + bv.byteLength);
      try {
        const bitmap = await lvDecodeImage(bytes, imgDef.mimeType);
        const cvs = document.createElement('canvas');
        cvs.width = bitmap.width || 512;
        cvs.height = bitmap.height || 512;
        const ctx2d = cvs.getContext('2d');
        ctx2d.drawImage(bitmap, 0, 0);
        const tex = new T.CanvasTexture(cvs);
        tex.flipY = false;
        tex.wrapS = 1000;
        tex.wrapT = 1000;
        tex.anisotropy = maxAnisotropy;
        tex.needsUpdate = true;
        textures.push(tex);
      } catch {
        textures.push(null);
      }
    }
  }

  const getTex = (texInfo, isSRGB) => {
    if (!texInfo || !gltf.textures) return null;
    const tDef = gltf.textures[texInfo.index];
    if (!tDef || tDef.source == null) return null;
    const tex = textures[tDef.source];
    if (tex && isSRGB && T.SRGBColorSpace) tex.colorSpace = T.SRGBColorSpace;
    return tex;
  };

  const MatCtor = T.MeshStandardMaterial || T.MeshLambertMaterial;
  const materials = (gltf.materials || []).map((m) => {
    const pbr = m.pbrMetallicRoughness || {};
    const cf = pbr.baseColorFactor || [1, 1, 1, 1];
    const opts = {
      color: new T.Color(cf[0], cf[1], cf[2]),
      side: m.doubleSided ? 2 : 0,
      transparent: m.alphaMode === 'BLEND' || cf[3] < 0.99,
      opacity: cf[3] != null ? cf[3] : 1.0,
    };
    if (T.MeshStandardMaterial) {
      opts.roughness = pbr.roughnessFactor != null ? pbr.roughnessFactor : 0.72;
      opts.metalness = pbr.metallicFactor != null ? pbr.metallicFactor : 0.0;
    }
    const mat = new MatCtor(opts);
    const baseMap = getTex(pbr.baseColorTexture, true);
    if (baseMap) mat.map = baseMap;
    if (T.MeshStandardMaterial) {
      const rghMap = getTex(pbr.metallicRoughnessTexture, false);
      if (rghMap) mat.roughnessMap = rghMap;
      const nrmMap = getTex(m.normalTexture, false);
      if (nrmMap) mat.normalMap = nrmMap;
    }
    if (Array.isArray(m.emissiveFactor) && (m.emissiveFactor[0] || m.emissiveFactor[1] || m.emissiveFactor[2])) {
      mat.emissive = new T.Color(m.emissiveFactor[0], m.emissiveFactor[1], m.emissiveFactor[2]);
      mat.emissiveIntensity = m.extensions?.KHR_materials_emissive_strength?.emissiveStrength || 1.2;
    }
    mat.name = m.name || 'Mat';
    return mat;
  });
  const fallbackMat = new MatCtor({ color: '#c8c4bc' });

  const root = new T.Group();
  root.name = 'LumenVale_Blender_Root';
  let meshCount = 0;
  let triCount = 0;

  const buildNode = (nodeIdx) => {
    const nd = gltf.nodes[nodeIdx];
    const grp = new T.Group();
    grp.name = nd.name || ('Node_' + nodeIdx);
    if (nd.translation) grp.position.set(nd.translation[0], nd.translation[1], nd.translation[2]);
    if (nd.rotation) grp.quaternion.set(nd.rotation[0], nd.rotation[1], nd.rotation[2], nd.rotation[3]);
    if (nd.scale) grp.scale.set(nd.scale[0], nd.scale[1], nd.scale[2]);
    if (nd.mesh != null) {
      const mDef = gltf.meshes[nd.mesh];
      for (const prim of (mDef.primitives || [])) {
        const geom = new T.BufferGeometry();
        const pos = lvReadAccessor(gltf, bin, prim.attributes.POSITION);
        if (!pos) continue;
        const makeAttr = (arr, size) => new T.Float32BufferAttribute(arr instanceof Float32Array ? arr : Float32Array.from(arr), size);
        geom.setAttribute('position', makeAttr(pos.array, pos.itemSize));
        if (prim.attributes.NORMAL != null) {
          const nrm = lvReadAccessor(gltf, bin, prim.attributes.NORMAL);
          if (nrm) geom.setAttribute('normal', makeAttr(nrm.array, nrm.itemSize));
        } else {
          geom.computeVertexNormals();
        }
        if (prim.attributes.TEXCOORD_0 != null) {
          const uv = lvReadAccessor(gltf, bin, prim.attributes.TEXCOORD_0);
          if (uv) geom.setAttribute('uv', makeAttr(uv.array, uv.itemSize));
        }
        if (prim.indices != null) {
          const idx = lvReadAccessor(gltf, bin, prim.indices);
          if (idx) { geom.setIndex(Array.from(idx.array)); triCount += Math.floor(idx.array.length / 3); }
        } else {
          triCount += Math.floor(pos.array.length / 9);
        }
        const mat = prim.material != null && materials[prim.material] ? materials[prim.material] : fallbackMat;
        const mesh = new T.Mesh(geom, mat);
        mesh.name = nd.name || mDef.name || ('Mesh_' + meshCount);
        grp.add(mesh);
        meshCount++;
      }
    }
    if (Array.isArray(nd.children)) {
      for (const childIdx of nd.children) grp.add(buildNode(childIdx));
    }
    return grp;
  };

  const sceneDef = (gltf.scenes && gltf.scenes[gltf.scene || 0]) || { nodes: [] };
  for (const rootIdx of (sceneDef.nodes || [])) root.add(buildNode(rootIdx));
  return { scene: root, meshCount, triCount, materialCount: materials.length, textureCount: textures.filter(Boolean).length };
}

function createBlenderCityBridge({ T, scene, camera, renderer }) {
  const state = {
    loaded: false,
    loading: false,
    error: null,
    manifest: null,
    cityGroup: null,
    phoneGroup: null,
    cars: [],
    pedestrians: [],
    stats: { meshes: 0, triangles: 0, materials: 0, textures: 0 },
  };

  async function load(basePath = './assets/blender/') {
    if (state.loading || state.loaded || renderer.isSoftware) return state;
    if (typeof window === 'undefined' || window.location.protocol === 'file:') return state;
    state.loading = true;
    try {
      const mRes = await fetch(basePath + 'LumenVale_Manifest.json');
      if (!mRes.ok) throw new Error('Manifest unavailable');
      state.manifest = await mRes.json();
      const presetKey = lvResolveGraphicsPreset(typeof cityMouseSettings !== 'undefined' ? cityMouseSettings.graphics : 'medium');
      const preset = LV_GRAPHICS_PRESETS[presetKey];

      const glbRes = await fetch(basePath + (state.manifest.assets?.city_visual || 'LumenVale_FrankfurtCity_Baked.glb'));
      if (!glbRes.ok) throw new Error('City GLB unavailable');
      const parsed = await lvParseGLB(T, await glbRes.arrayBuffer(), preset.anisotropy);
      state.cityGroup = parsed.scene;
      state.cityGroup.position.set(-17.5, -0.22, 84.3);
      state.cityGroup.traverse((obj) => {
        if (obj.isMesh) {
          obj.castShadow = preset.shadows;
          obj.receiveShadow = true;
        }
        if (!obj.isMesh && obj.name && obj.name.startsWith('Car_')) state.cars.push(obj);
        if (!obj.isMesh && obj.name && (obj.name.startsWith('Person_Street_') || obj.name.startsWith('Person_Park_'))) {
          state.pedestrians.push({ obj, dir: obj.position.x >= 0 ? 1 : -1, speed: 1.15 });
        }
      });
      scene.add(state.cityGroup);
      state.stats = { meshes: parsed.meshCount, triangles: parsed.triCount, materials: parsed.materialCount, textures: parsed.textureCount };

      try {
        const pRes = await fetch(basePath + (state.manifest.assets?.city_phone || 'LumenVale_CityPhone.glb'));
        if (pRes.ok) {
          const pParsed = await lvParseGLB(T, await pRes.arrayBuffer(), 4);
          state.phoneGroup = pParsed.scene;
          state.phoneGroup.position.set(0.22, -0.18, -0.42);
          state.phoneGroup.rotation.set(0.18, -0.25, 0.05);
          state.phoneGroup.visible = false;
          camera.add(state.phoneGroup);
          if (!camera.parent) scene.add(camera);
        }
      } catch {}

      state.loaded = true;
    } catch (err) {
      state.error = String(err && err.message || err);
    } finally {
      state.loading = false;
    }
    return state;
  }

  function update(dt) {
    if (!state.loaded || !dt) return;
    const step = Math.min(dt, 0.05);
    for (const car of state.cars) {
      if (car.name.includes('_NB')) {
        car.position.z -= 7.2 * step;
        if (car.position.z < -125) car.position.z = 80;
      } else if (car.name.includes('_SB')) {
        car.position.z += 6.8 * step;
        if (car.position.z > 80) car.position.z = -125;
      } else if (car.name.includes('_EB')) {
        car.position.x += 6.5 * step;
        if (car.position.x > 70) car.position.x = -70;
      } else if (car.name.includes('_WB')) {
        car.position.x -= 6.5 * step;
        if (car.position.x < -70) car.position.x = 70;
      }
    }
    for (const ped of state.pedestrians) {
      ped.obj.position.z += ped.dir * ped.speed * step;
      if (ped.obj.position.z > 8 || ped.obj.position.z < -52) {
        ped.dir *= -1;
        ped.obj.rotation.y += Math.PI;
      }
    }
  }

  function togglePhone(visible) {
    if (state.phoneGroup) state.phoneGroup.visible = Boolean(visible);
  }

  return { state, load, update, togglePhone };
}
