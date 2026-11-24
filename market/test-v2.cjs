const test = require('node:test');
const assert = require('node:assert/strict');
const fs = require('node:fs');
const path = require('node:path');

const HERE = __dirname;
const BLENDER_DIR = path.join(HERE, 'assets', 'blender');

test('all old legacy city modules are removed from market/', () => {
  const legacy = ['city.js','city-world.js','walk.js','view.js','district-world.js','campus-world.js','school-world.js','systems-world.js','phone.js','app.js','story.js','rules.js'];
  for (const f of legacy) assert.equal(fs.existsSync(path.join(HERE, f)), false, `Legacy file ${f} must be removed`);
  for (const f of ['index.html','build.py','src/main.js','src/world.js','src/ui.js','src/state.js','src/audio.js','src/styles.css']) {
    assert.equal(fs.existsSync(path.join(HERE, f)), true, `New module ${f} must exist`);
  }
});

test('state initializes with zero hardcoded courses and validates Teacher JSON schemas', async () => {
  const mod = await import('file://' + path.join(HERE, 'src', 'state.js').replace(/\\/g, '/'));
  const st = mod.createDefaultState();
  assert.equal(st.courses.length, 0, 'No pre-installed academic courses');
  assert.deepEqual(Object.keys(mod.GRAPHICS_PRESETS), ['low','medium','high','ultra']);
  assert.equal(mod.importTeacherJSON(st, 'not json').ok, false);
  assert.equal(mod.importTeacherJSON(st, JSON.stringify({ schema: 'bad', title: 'X' })).ok, false);
  const ok = mod.importTeacherJSON(st, JSON.stringify({ schema: 'lumenvale.lms-course', title: 'Modern Architecture', chapters: [{ id: 'c1', title: 'Ch 1' }] }));
  assert.equal(ok.ok, true);
  assert.equal(st.courses.length, 1);
  assert.equal(mod.saveVocabWord(st, { word: 'ashlar', def: 'Cut stone' }, 'Library'), true);
  assert.equal(mod.saveVocabWord(st, { word: 'ashlar', def: 'Cut stone' }, 'Library'), false, 'No duplicate vocab');
});

test('baked Blender manifest and GLB assets are valid with zero parked cars', () => {
  const manifest = JSON.parse(fs.readFileSync(path.join(BLENDER_DIR, 'LumenVale_Manifest.json'), 'utf8'));
  const glbPath = path.join(BLENDER_DIR, manifest.assets.city_visual);
  if (!fs.existsSync(glbPath)) return;
  const buf = fs.readFileSync(glbPath);
  assert.equal(buf.readUInt32LE(0), 0x46546C67, 'Valid GLB magic');
  const jsonLen = buf.readUInt32LE(12);
  const gltf = JSON.parse(buf.subarray(20, 20 + jsonLen).toString('utf8'));
  assert.ok(gltf.images.length >= 14, 'Embedded baked PBR textures');
  const parked = (gltf.nodes || []).filter(n => n.name && /Car_.*Parked/i.test(n.name));
  assert.equal(parked.length, 0, 'Zero parked cars');
});
