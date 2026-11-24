const test = require('node:test');
const assert = require('node:assert/strict');
const fs = require('node:fs');
const path = require('node:path');
const vm = require('node:vm');

const HERE = __dirname;
const BLENDER_DIR = path.join(HERE, 'assets', 'blender');

function parseGlbJson(filePath) {
  const buf = fs.readFileSync(filePath);
  assert.equal(buf.readUInt32LE(0), 0x46546C67, 'GLB magic header');
  assert.equal(buf.readUInt32LE(4), 2, 'glTF version 2');
  const jsonLen = buf.readUInt32LE(12);
  assert.equal(buf.readUInt32LE(16), 0x4E4F534A, 'JSON chunk type');
  return JSON.parse(buf.subarray(20, 20 + jsonLen).toString('utf8'));
}

test('graphics presets cover low, medium, high, ultra with legacy compatibility', () => {
  const ctx = vm.createContext({ Math, Number, Object, Array });
  vm.runInContext(fs.readFileSync(path.join(HERE, 'glb-loader.js'), 'utf8'), ctx);
  assert.deepEqual(vm.runInContext('Object.keys(LV_GRAPHICS_PRESETS)', ctx), ['low', 'medium', 'high', 'ultra']);
  assert.equal(ctx.lvResolveGraphicsPreset('balanced'), 'low');
  assert.equal(ctx.lvResolveGraphicsPreset('detailed'), 'high');
  assert.equal(ctx.lvResolveGraphicsPreset('ultra'), 'ultra');
  assert.equal(vm.runInContext('LV_GRAPHICS_PRESETS.low.shadows', ctx), false);
  assert.equal(vm.runInContext('LV_GRAPHICS_PRESETS.high.shadows', ctx), true);
});

test('Blender manifest is valid and build.py wires audio.js and glb-loader.js', () => {
  const manifestPath = path.join(BLENDER_DIR, 'LumenVale_Manifest.json');
  assert.equal(fs.existsSync(manifestPath), true, 'Manifest exists');
  const manifest = JSON.parse(fs.readFileSync(manifestPath, 'utf8'));
  assert.ok(manifest.spawn_points && manifest.spawn_points.school_lobby);
  assert.ok(manifest.interactions && manifest.interactions.market_office_computer);
  const buildSrc = fs.readFileSync(path.join(HERE, 'build.py'), 'utf8');
  assert.ok(buildSrc.includes("'audio.js'"));
  assert.ok(buildSrc.includes("'glb-loader.js'"));
  const cityGlb = path.join(BLENDER_DIR, manifest.assets.city_visual);
  if (fs.existsSync(cityGlb)) {
    const gltf = parseGlbJson(cityGlb);
    assert.ok(Array.isArray(gltf.images) && gltf.images.length >= 14, 'Baked city GLB embeds PBR textures');
    const parkedCars = (gltf.nodes || []).filter(n => n.name && /Car_.*Parked/i.test(n.name));
    assert.equal(parkedCars.length, 0, 'No parked cars in city GLB');
  }
});
