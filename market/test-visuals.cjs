/* Run: node --test market/test-visuals.cjs
 * Structural and surface-generation checks, no WebGL, dependencies, or downloads.
 */
const test=require('node:test'),assert=require('node:assert/strict');
const fs=require('node:fs'),path=require('node:path');
const source=fs.readFileSync(path.join(__dirname,'visuals.js'),'utf8');
class Texture{
 constructor(canvas){this.image=canvas;this.repeat={x:1,y:1,set:(x,y)=>{this.repeat.x=x;this.repeat.y=y}};}
 clone(){return new Texture(this.image);}
}
class Material{constructor(opts){this.options=opts;this.color=opts.color;}}
class PlaneGeometry{constructor(w,h){this.width=w;this.height=h;}}
class Mesh{
 constructor(geometry,material){this.geometry=geometry;this.material=material;this.position={set() {}};this.rotation={};}
}
const context={
 createImageData:(w,h)=>({data:new Uint8ClampedArray(w*h*4)}),putImageData(){},
 beginPath(){},moveTo(){},lineTo(){},stroke(){},fillRect(){},bezierCurveTo(){},
 quadraticCurveTo(){},ellipse(){},fill(){},
 createLinearGradient(){return {addColorStop(){}}}
};
const document={createElement:()=>({getContext:()=>context,width:0,height:0})};
const T={CanvasTexture:Texture,MeshStandardMaterial:Material,MeshLambertMaterial:Material,
 PlaneGeometry,Mesh,SRGBColorSpace:'srgb',RepeatWrapping:'repeat'};
const createLumenVisuals=new Function('T','document',source+'\nreturn createLumenVisuals;')(T,document);
const renderer={isSoftware:false,capabilities:{getMaxAnisotropy:()=>8}};
test('all original materials are created with repeatable grain textures',()=>{
 const visuals=createLumenVisuals(T,renderer);
 for(const kind of ['grass','asphalt','concrete','stone','plaster','brick','wood','roof','tile','fabric','water']){
  const t=visuals.texture(kind);
  assert.ok(t,kind);
  assert.equal(t.wrapS,'repeat');
  assert.equal(t.colorSpace,'srgb');
  assert.strictEqual(visuals.texture(kind),t,'pattern cache should be reused');
 }
 const road=visuals.surface('asphalt','#66716b',80,12);
 assert.ok(road.options.map.repeat.x>20,'long roads should tile in world metres');
 assert.ok(road.options.roughness>.9);
});
test('instanced building finish is shared and tiled road overlays receive shadows',()=>{
 const visuals=createLumenVisuals(T,renderer);
 assert.strictEqual(visuals.instanced('plaster'),visuals.instanced('plaster'));
 const group={children:[],add(mesh){this.children.push(mesh)}};
 visuals.panel(group,'concrete',4,.03,10,20,5,'#bdbcb4');
 assert.equal(group.children.length,1);
 assert.equal(group.children[0].receiveShadow,true);
 assert.equal(group.children[0].castShadow,false);
});
test('atmospheric sky cached by lighting step, software mode remains flat',()=>{
 const visuals=createLumenVisuals(T,renderer);
 assert.strictEqual(visuals.sky(.58),visuals.sky(.58));
 assert.equal(visuals.sky(.58).colorSpace,'srgb');
 const fallback=createLumenVisuals(T,{isSoftware:true});
 assert.strictEqual(fallback.sky(.58),null);
 const group={add(){throw Error('should not create software overlay')}};
 assert.strictEqual(fallback.panel(group,'asphalt',0,0,0,2,2,'#666'),null);
 assert.equal(fallback.surface('wood','#76593b',2,2).options.color,'#76593b');
});
test('standalone game compiler includes visuals before its world modules',()=>{
 const build=fs.readFileSync(path.join(__dirname,'build.py'),'utf8');
 assert.match(build,/'vehicles\.js', 'visuals\.js', 'city\.js'/);
});
