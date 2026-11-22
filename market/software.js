// Draw the same Three.js meshes and cameras with Canvas when WebGL is unavailable.
function createSoftwareRenderer(T, canvas) {
  const ctx = canvas.getContext('2d', { alpha:false });
  if (!ctx) throw new Error('This browser could not start a graphics renderer.');
  const view = new T.Object3D().matrix;
  const modelView = view.clone();
  const instance = view.clone();
  const color = new T.Color();
  const sun = new T.Vector3(-.46,.79,-.39);
  const light = new T.Vector3();
  const geometry = new WeakMap();
  let width=1,height=1,ratio=1,pixelRatio=1,rect=[0,0,1,1];

  function setSize(w,h) {
    width=w;height=h;
    ratio=Math.min(pixelRatio,1,960/w,650/h);
    canvas.width=Math.max(1,Math.floor(w*ratio));
    canvas.height=Math.max(1,Math.floor(h*ratio));
    rect=[0,0,w,h];
  }
  function getGeometry(source) {
    if (!geometry.has(source)) {
      const pos=source.getAttribute('position');
      geometry.set(source,{positions:pos.array,index:source.getIndex()?.array,points:pos.count});
    }
    return geometry.get(source);
  }
  function clipAtNear(vertices,near) {
    const clipped=[];
    for (let i=0;i<vertices.length;i++) {
      const a=vertices[i], b=vertices[(i+1)%vertices.length];
      const inside=a[2]>=near, nextInside=b[2]>=near;
      if (inside) clipped.push(a);
      if (inside!==nextInside) {
        const t=(near-a[2])/(b[2]-a[2]);
        clipped.push([a[0]+(b[0]-a[0])*t,a[1]+(b[1]-a[1])*t,near]);
      }
    }
    return clipped;
  }
  function tone(value) {
    return Math.round(255*Math.pow(Math.min(1,Math.max(0,value)),.4545));
  }
  const buffers = new Map();
  function render(scene,camera) {
    const [left,bottom,logicalWidth,logicalHeight]=rect;
    const w=Math.floor(logicalWidth*ratio), h=Math.floor(logicalHeight*ratio);
    if(w<1||h<1)return;
    const halfX=w/2, halfY=h/2;
    const key=w+'x'+h;
    if(!buffers.has(key)){
      if(buffers.size>3)buffers.clear();
      const image=ctx.createImageData(w,h);
      buffers.set(key,{image,pixels:new Uint32Array(image.data.buffer),depth:new Float32Array(w*h)});
    }
    const {image,pixels,depth}=buffers.get(key);
    pixels.fill(0xffd5dac2);
    depth.fill(0);
    function triangleFill(a,b,c,ink) {
      const minX=Math.max(0,Math.ceil(Math.min(a[0],b[0],c[0])-.5));
      const minY=Math.max(0,Math.ceil(Math.min(a[1],b[1],c[1])-.5));
      const maxX=Math.min(w-1,Math.floor(Math.max(a[0],b[0],c[0])-.5));
      const maxY=Math.min(h-1,Math.floor(Math.max(a[1],b[1],c[1])-.5));
      if (minX>maxX||minY>maxY) return;
      const ax=b[0]-a[0],ay=b[1]-a[1], bx=c[0]-a[0],by=c[1]-a[1];
      const area=ax*by-ay*bx;
      if(Math.abs(area)<.001)return;
      const dbx=by/area,dcx=-ay/area, dby=-bx/area,dcy=ax/area;
      const startX=minX+.5-a[0],startY=minY+.5-a[1];
      const startB=dbx*startX+dby*startY,startC=dcx*startX+dcy*startY;
      const nearB=b[2]-a[2],nearC=c[2]-a[2];
      for(let y=minY;y<=maxY;y++){
        let weightB=startB+dby*(y-minY),weightC=startC+dcy*(y-minY);
        let pixel=y*w+minX;
        for(let x=minX;x<=maxX;x++,pixel++,weightB+=dbx,weightC+=dcx){
          if(weightB<-.0001||weightC<-.0001||weightB+weightC>1.0001)continue;
          const z=a[2]+weightB*nearB+weightC*nearC;
          if(z<=depth[pixel])continue;
          depth[pixel]=z;
          pixels[pixel]=ink;
        }
      }
    }
    const scale=halfY/Math.tan(camera.fov*Math.PI/360), near=Math.max(.065,camera.near);
    scene.updateMatrixWorld(true);
    camera.updateMatrixWorld(true);
    const matrix=camera.matrixWorldInverse;
    light.copy(sun).transformDirection(matrix);
    scene.traverseVisible(object => {
      if (!object.isMesh || !object.geometry || !object.material?.color) return;
      const {positions,index,points}=getGeometry(object.geometry);
      const material=object.material;
      view.multiplyMatrices(matrix,object.matrixWorld);
      const models=object.isInstancedMesh?object.count:1;
      for (let model=0;model<models;model++) {
        if (object.isInstancedMesh) {
          object.getMatrixAt(model,instance);
          modelView.multiplyMatrices(view,instance);
          object.getColorAt(model,color);
        } else {
          modelView.copy(view);
          color.copy(material.color);
        }
        const m=modelView.elements;
        if (object.isInstancedMesh) {
          const depth=-m[14];
          if (depth< -6 || depth>62 || Math.abs(m[12])>Math.max(0,depth)*w/h*.98+8) continue;
        }
        const transformed=new Array(points);
        for (let i=0;i<points;i++) {
          const x=positions[i*3],y=positions[i*3+1],z=positions[i*3+2];
          transformed[i]=[
            m[0]*x+m[4]*y+m[8]*z+m[12],
            m[1]*x+m[5]*y+m[9]*z+m[13],
            -(m[2]*x+m[6]*y+m[10]*z+m[14]),
          ];
        }
        const count=index?index.length:points;
        for (let i=0;i<count;i+=3) {
          const a=transformed[index?index[i]:i];
          const b=transformed[index?index[i+1]:i+1];
          const c=transformed[index?index[i+2]:i+2];
          if (a[2]<near && b[2]<near && c[2]<near) continue;
          const triangle=[a,b,c];
          const clipped=a[2]>=near && b[2]>=near && c[2]>=near ? triangle : clipAtNear(triangle,near);
          const projected=clipped.map(([x,y,z])=>[halfX+x*scale/z,halfY-y*scale/z,1/z]);
          if (projected.every(p=>p[0]<0) || projected.every(p=>p[1]<0) ||
              projected.every(p=>p[0]>w) || projected.every(p=>p[1]>h)) continue;
          const [p,q,r]=projected;
          const side=(q[0]-p[0])*(r[1]-p[1])-(q[1]-p[1])*(r[0]-p[0]);
          if (side>=0 && material.side!==T.DoubleSide) continue;
          const ux=b[0]-a[0], uy=b[1]-a[1], uz=a[2]-b[2];
          const vx=c[0]-a[0], vy=c[1]-a[1], vz=a[2]-c[2];
          const nx=uy*vz-uz*vy, ny=uz*vx-ux*vz, nz=ux*vy-uy*vx;
          const length=Math.hypot(nx,ny,nz)||1;
          const incidence=Math.max(0,(nx*light.x+ny*light.y+nz*light.z)/length);
          const shade=material.isMeshBasicMaterial?1:.65+.40*incidence+.14*Math.max(0,ny/length);
          const distance=(a[2]+b[2]+c[2])/3;
          const fog=Math.min(.48,Math.max(0,(distance-20)*.009));
          const r8=tone(color.r*shade*(1-fog)+.54*fog);
          const g8=tone(color.g*shade*(1-fog)+.67*fog);
          const b8=tone(color.b*shade*(1-fog)+.60*fog);
          const ink=(255<<24)|(b8<<16)|(g8<<8)|r8;
          for(let i=1;i<projected.length-1;i++)triangleFill(projected[0],projected[i],projected[i+1],ink);
        }
      }
    });
    ctx.putImageData(image,Math.floor(left*ratio),canvas.height-Math.floor(bottom*ratio)-h);
  }
  return {
    isSoftware:true, setSize, render,
    setPixelRatio(value){pixelRatio=value;},getPixelRatio(){return ratio;},
    setViewport(...next){rect=next;},
    // Canvas clips each render to its own viewport.
    setScissor(){},setScissorTest(){},
  };
}

