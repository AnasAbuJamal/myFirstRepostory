/* node --test market/test-vehicles.cjs
 * Headless structural checks for the original LumenVale 3D vehicle kit.
 * No WebGL or browser installation is required.
 */
const test=require('node:test');
const assert=require('node:assert/strict');
const fs=require('node:fs');
const path=require('node:path');
const vehicleSource=fs.readFileSync(path.join(__dirname,'vehicles.js'),'utf8');
const mock=String.raw\`
class Group{
 constructor(){
  this.children=[];
  this.position={x:0,y:0,z:0,set:(x,y,z)=>Object.assign(this.position,{x,y,z})};
  this.rotation={x:0,y:0,z:0};
  this.scale={set:()=>{},setScalar:()=>{}};
  this.userData={};
 }
 add(x){this.children.push(x);}
 remove(x){this.children=this.children.filter(c=>c!==x);}
 traverse(callback){callback(this);this.children.forEach(c=>c.traverse?c.traverse(callback):callback(c));}
}
class Geometry{
 constructor(...args){this.args=args;this.attributes={};}
 setAttribute(id,value){this.attributes[id]=value;}
 computeVertexNormals(){}
 dispose(){}
}
class Color{
 constructor(hex){const n=parseInt(String(hex).replace('#',''),16);
  this.r=(n>>16&255)/255;this.g=(n>>8&255)/255;this.b=(n&255)/255;}
}
class Attribute{constructor(array,size){this.array=array;this.itemSize=size;}}
class Material{constructor(config){this.config=config;}dispose(){}}
class Mesh extends Group{constructor(geometry,material){super();this.geometry=geometry;this.material=material;}}
const T={Group,Color,Mesh,BufferGeometry:Geometry,Float32BufferAttribute:Attribute,
 MeshLambertMaterial:Material,MeshBasicMaterial:Material,CylinderGeometry:Geometry,
 BoxGeometry:Geometry,CanvasTexture:Geometry,PlaneGeometry:Geometry,DoubleSide:'double',SRGBColorSpace:'srgb'};
const document={createElement:()=>({width:0,height:0,getContext:()=>({clearRect(){},fillText(){}})})};
\`;
const api=new Function(mock+'\n'+vehicleSource+
 '\nreturn {T,LV_VEHICLE_TYPES,LV_VEHICLE_PAINTS,createLumenVehicle,animateLumenVehicle};')();

test('all seven vehicle classes have unique proportions and four rotating wheels',()=>{
 assert.equal(Object.keys(api.LV_VEHICLE_TYPES).length,7);
 const lengths=new Set();
 for(const type of Object.keys(api.LV_VEHICLE_TYPES)){
  const car=api.createLumenVehicle(api.T,type,{paint:'jade',low:true});
  lengths.add(car.spec.length);
  assert.equal(car.wheels.length,4,type);
  const body=car.group.children.find(c=>c.name==='solid details');
  assert.ok(body?.geometry.attributes.position.array.length>1200,type);
  assert.ok(car.group.children.find(c=>c.name==='glass details'));
  assert.ok(car.group.children.find(c=>c.name==='lights details'));
  const start=car.wheels[0].rotation.z;
  api.animateLumenVehicle(car,4.6);
  assert.notEqual(car.wheels[0].rotation.z,start,type);
 }
 assert.ok(lengths.size>=6);
});
test('vehicle paint colors, glass and headlights use independent material passes',()=>{
 const car=api.createLumenVehicle(api.T,'sedan',{paint:'coral',low:false});
 const glass=car.group.children.find(c=>c.name==='glass details');
 const lamps=car.group.children.find(c=>c.name==='lights details');
 assert.equal(glass.material.config.transparent,true);
 assert.equal(glass.material.config.depthWrite,false);
 assert.equal(lamps.material.config.vertexColors,true);
 assert.ok(car.wheels[0].children.length>=4,'wheel rims and spokes should be visible');
});
test('bus and delivery van have branded side lettering',()=>{
 for(const type of ['bus','van']){
  const car=api.createLumenVehicle(api.T,type,{paint:'cream',low:false});
  assert.ok(car.group.children.filter(x=>x.material?.config?.map).length>=2,type);
 }
});
