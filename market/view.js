// The player and security cameras render the same office and grounds.
function createOfficeView() {
  const viewport = document.getElementById('view');
  let canvas = document.getElementById('landscape');
  const T = globalThis.PineboundThree;
  let renderer;
  try {
    if (!T?.PerspectiveCamera) throw new Error('3D engine not loaded');
    renderer = new T.WebGLRenderer({ canvas, antialias: true, powerPreference: 'high-performance' });
    renderer.setPixelRatio(Math.min(window.devicePixelRatio || 1, 1.4));
    renderer.outputColorSpace = T.SRGBColorSpace;
  } catch {
    const replacement = canvas.cloneNode();
    canvas.replaceWith(replacement);
    canvas = replacement;
    renderer = createSoftwareRenderer(T,canvas);
    renderer.setPixelRatio(window.devicePixelRatio || 1);
    viewport.dataset.renderer = 'software';
  }

  const scene = new T.Scene();
  scene.background = new T.Color('#c2dad5');
  const skyLight = new T.HemisphereLight('#e3ebff', '#9f9980', 1.55);
  scene.add(skyLight);
  const sun = new T.DirectionalLight('#ffe3ae', 2.05);
  sun.position.set(-18, 19, 12);
  scene.add(sun);
  const camera = new T.PerspectiveCamera(70, 1, .07, 145);
  const office = new T.Group();
  const exterior = new T.Group();
  scene.add(office, exterior);
  const shared = {
    cube: new T.BoxGeometry(1, 1, 1),
    rock: new T.IcosahedronGeometry(1, renderer.isSoftware ? 0 : 1),
    pot: new T.CylinderGeometry(.53, .41, 1, 10),
    cone: new T.ConeGeometry(.65, 1, 7),
    trunk: new T.CylinderGeometry(.38, .50, 1, 8),
  };
  const paint = new Map();
  function material(color) {
    if (!paint.has(color)) paint.set(color, new T.MeshLambertMaterial({ color, flatShading: true }));
    return paint.get(color);
  }
  function piece(group, form, x, y, z, w, h, d, tint) {
    const part = new T.Mesh(shared[form], material(tint));
    part.position.set(x, y, z);
    part.scale.set(w, h, d);
    group.add(part);
    return part;
  }
  const box = (group, ...shape) => piece(group, 'cube', ...shape);

  box(exterior, 0, -.52, 20, 183, 1, 145, '#8b9c70');
  box(exterior, 0, .007, -10, 48, .031, 2.5, '#c6b28a');
  box(exterior, 2.62, .006, -6.7, 2.12, .035, 6.3, '#c8b794');
  box(exterior, -4.32, .006, -11.74, 1.6, .034, 3.4, '#c1af89');
  box(exterior, -5.3, .007, -13.4, 8.7, .039, 4.2, '#9dac76');
  for (const [i, x] of [-42, -24, -5, 16, 33, 53].entries()) {
    piece(exterior, 'rock', x, -2.75, -31 - (i % 3) * 3, 16, 8 + i % 4, 13, ['#9bab8c', '#8fab89', '#a5b498'][i % 3]);
  }
  const riverPositions = [], riverFaces = [];
  for (let i = 0; i <= 34; i++) {
    const x = -57 + i * 3.4;
    const z = -20.3 + Math.sin(i * .37) * 1.6;
    riverPositions.push(x, .025, z - 1.55, x, .025, z + 1.55);
    if (i) riverFaces.push(i * 2 - 2, i * 2 - 1, i * 2, i * 2 - 1, i * 2 + 1, i * 2);
  }
  const river = new T.BufferGeometry();
  river.setAttribute('position', new T.Float32BufferAttribute(riverPositions, 3));
  river.setIndex(riverFaces);
  river.computeVertexNormals();
  exterior.add(new T.Mesh(river, new T.MeshLambertMaterial({ color: '#76aca5', side: T.DoubleSide })));

  const trees = [
    [-9, -8, 2.5], [8, -9, 2.9], [11, -13, 2.1], [-14, -12, 2.8],
    [-22, -16, 2.8], [-15, -25, 3.15], [1, -24, 2.1], [17, -22, 3.4],
  ];
  let seed = 371;
  function random() {
    seed = (Math.imul(seed, 1664525) + 1013904223) >>> 0;
    return seed / 4294967296;
  }
  for (let i = 0; i < 54; i++) {
    const x = (random() - .5) * 92, z = -22 - random() * 19;
    trees.push([x, z, 1.7 + random() * 2.4]);
  }
  const dummy = new T.Object3D();
  const colors = new T.Color();
  function instances(form, count, position) {
    const mesh = new T.InstancedMesh(shared[form], new T.MeshLambertMaterial({ flatShading: true }), count);
    for (let i = 0; i < count; i++) {
      const [x, y, z, w, h, d, tint] = position(i);
      dummy.position.set(x, y, z);
      dummy.rotation.set(0, (i * 2.41) % (Math.PI * 2), 0);
      dummy.scale.set(w, h, d);
      dummy.updateMatrix();
      mesh.setMatrixAt(i, dummy.matrix);
      mesh.setColorAt(i, colors.set(tint));
    }
    mesh.computeBoundingSphere();
    exterior.add(mesh);
  }
  instances('trunk', trees.length, i => {
    const [x, z, h] = trees[i];
    return [x, h * .63, z, h * .2, h * 1.22, h * .2, '#80694e'];
  });
  instances('rock', trees.length * 4, i => {
    const [x, z, h] = trees[Math.floor(i / 4)];
    const angle = i * 2.35;
    return [x + Math.cos(angle) * .46 * h, h * (.98 + i % 2 * .28), z + Math.sin(angle) * .46 * h,
      h * .77, h * .68, h * .73, ['#4c805a', '#588b60', '#75a06c', '#609364'][i % 4]];
  });
  instances('cone', 105, i => {
    const x = (random() - .5) * 54, z = i % 2 ? -11.6 - random() * 3 : -17 - random();
    const h = .11 + random() * .45;
    return [x, h * .45, z, h * 1.41, h, h * 1.2, i % 3 ? '#82a36a' : '#b0b975'];
  });
  for (const [x, z] of [[-9, -14], [-.5, -12.3], [-7., -16.2], [5, -13.5]]) {
    piece(exterior, 'rock', x, .14, z, .47, .33, .44, '#a2a395');
  }

  box(office, 0, -.145, .15, 8.6, .27, 8.2, '#a98456');
  for (let p = -8; p <= 8; p++) {
    const x = p * .49;
    box(office, x, -.003, .15, .014, .012, 8.16, '#927550');
    if (p % 2 === 0) box(office, x + .245, -.003, p * .38, .49, .012, .015, '#927550');
  }
  box(office, -4.18, 1.45, .1, .14, 2.9, 7.8, '#c2b48a');
  box(office, 4.18, 1.45, .1, .14, 2.9, 7.8, '#c2b48a');
  box(office, 0, 1.45, 4.10, 8.47, 2.9, .15, '#c9b68c');
  box(office, 0, 2.935, .1, 8.5, .14, 8, '#b4a47f');
  box(office, 0, 3.09, .1, 8.98, .18, 8.64, '#567765');
  for (const x of [-4.15,4.15]) for (let z=-3.45; z<3.7; z+=.74) {
    box(office,x,1.56,z,.032,2.72,.016,'#a99572');
  }
  for (const z of [-1.10,1.84]) {
    box(office,0,2.82,z,1.74,.08,.62,'#d6c8a0');
    box(office,0,2.774,z,1.57,.019,.48,'#f0e2b8');
  }
  const carpet = box(office,.02,.015,1.33,2.39,.024,1.72,'#768469');
  carpet.rotation.y=.01;
  box(office, -1.34, .44, -3.73, 5.9, .88, .17, '#c6ad79');
  box(office, -1.34, 2.79, -3.73, 5.9, .29, .17, '#c9b584');
  box(office, -3.97, 1.76, -3.73, .54, 1.82, .18, '#c9b584');
  box(office, 1.58, 1.74, -3.73, .76, 1.88, .18, '#c3b081');
  box(office, 3.78, 1.45, -3.73, .85, 2.92, .18, '#c9b584');
  box(office, 2.7, 2.72, -3.73, 1.6, .42, .18, '#c9b584');
  for (const x of [-3.7, -1.76, .07, 1.25]) box(office, x, 1.74, -3.61, .092, 1.74, .13, '#47735d');
  for (const y of [.93, 1.81, 2.60]) box(office, -1.24, y, -3.59, 5.08, .076, .16, '#51725b');
  box(office, -1.23, .87, -3.55, 5.22, .09, .45, '#6a7c5a');
  for (const x of [1.95, 3.36]) box(office, x, 1.22, -3.59, .11, 2.45, .24, '#62583b');
  box(office, 2.65, 2.46, -3.59, 1.43, .11, .24, '#62583b');
  const door = new T.Group();
  door.position.set(3.30, 0, -3.57);
  box(door, -.65, 1.20, 0, 1.31, 2.38, .10, '#94704c');
  box(door, -.65, 1.70, .064, 1.02, .76, .027, '#c4a375');
  box(door, -.65, .70, .064, 1.02, .80, .027, '#ae8b61');
  piece(door, 'rock', -1.14, 1.14, .12, .066, .06, .057, '#d6aa61');
  office.add(door);

  function table(x, z, width, depth) {
    box(office, x, .77, z, width, .12, depth, '#926f48');
    box(office, x, .84, z, width + .025, .035, depth + .02, '#ac8959');
    for (const a of [-1, 1]) for (const b of [-1, 1]) {
      box(office, x + a * width * .42, .36, z + b * depth * .38, .13, .72, .13, '#71513a');
    }
  }
  table(.20, .14, 2.85, 1.04);
  table(-2.58, -2.70, 1.65, .61);
  box(office, -.26, 1.314, -.205, 1.05, .75, .10, '#354d43');
  box(office, -.26, 1.315, -.15, .936, .625, .026, '#abc4a6');
  box(office, -.26, .934, -.17, .18, .22, .16, '#454b37');
  box(office, -.26, .872, .10, .72, .036, .33, '#5b6656');
  box(office, -.26, 1.551, -.13, .89, .111, .006, '#55775b');
  const desktop = document.createElement('canvas');
  desktop.width = 448;
  desktop.height = 292;
  const d = desktop.getContext('2d');
  if (renderer.isSoftware) {
    box(office,-.26,1.49,-.131,.76,.108,.004,'#42664e');
    for(let i=0;i<3;i++)box(office,-.23-i*.04,1.34-i*.10,-.128,.61-i*.09,.027,.004,'#e8e4c5');
  } else if (d) {
    d.fillStyle='#273f32'; d.fillRect(0,0,448,292);
    d.fillStyle='#ecd088'; d.fillRect(42,70,44,30); d.strokeStyle='#293e31';
    d.lineWidth=2; d.beginPath(); d.moveTo(42,72); d.lineTo(64,88); d.lineTo(86,72); d.stroke();
    d.fillStyle='#fffae5'; d.font='bold 35px Georgia'; d.fillText('Market Office',42,151);
    d.fillStyle='#b8cabb'; d.font='21px sans-serif'; d.fillText('Sit down to use the computer',42,197);
    const image = new T.CanvasTexture(desktop);
    image.colorSpace=T.SRGBColorSpace;
    const display = new T.Mesh(new T.PlaneGeometry(.92,.61),new T.MeshBasicMaterial({map:image}));
    display.position.set(-.26,1.313,-.12);
    office.add(display);
  }
  box(office, .56, .874, .33, .35, .022, .28, '#fbf1cf').rotation.y = .17;
  box(office, .67, .9, .22, .18, .024, .025, '#b17d58').rotation.y = .37;
  piece(office, 'pot', 1.15, .976, -.21, .34, .29, .33, '#a96f4d');
  for (let i = 0; i < 8; i++) {
    const a = i * 2.24;
    const leaf = piece(office, 'cone', 1.15 + Math.cos(a) * .15, 1.25 + (i % 3) * .056,
      -.21 + Math.sin(a) * .13, .15, .42, .11, i % 2 ? '#5b8250' : '#76985c');
    leaf.rotation.x = Math.cos(a) * .49;
    leaf.rotation.z = Math.sin(a) * .51;
  }
  const kits = [];
  for (let i = 0; i < 9; i++) {
    const bin = new T.Group();
    bin.position.set(-3.17 + i % 4 * .36, .85 + Math.floor(i / 4) * .192, -2.72);
    box(bin, 0, .094, 0, .32, .18, .30, '#cbb88c');
    box(bin, 0, .095, .153, .16, .09, .012, '#f4e5bb');
    box(bin, 0, .184, 0, .085, .012, .28, '#839661');
    office.add(bin);
    kits.push(bin);
  }

  const stand = new T.Group();
  stand.position.set(-4.3, 0, -12.45);
  function buildStand() {
    box(stand, 0, .11, 0, 2.96, .22, 2.1, '#a18962');
    box(stand, 0, .55, -.2, 2.61, .94, 1.34, '#986e4b');
    box(stand, 0, 1.05, -.11, 2.79, .14, 1.45, '#cc9e68');
    for (const x of [-1.32, 1.32]) {
      for (const z of [-.83, .76]) box(stand, x, 1.2, z, .14, 2.38, .14, '#826847');
    }
    box(stand, 0, 2.31, .22, 3.06, .13, 2.21, '#50816a').rotation.x = .13;
    box(stand, 0, 2.12, .96, 2.95, .28, .095, '#72a78a');
    box(stand, -.39, 1.23, .05, .41, .27, .34, '#d4b78a');
    box(stand, .16, 1.25, .05, .40, .31, .35, '#d2ba8d');
  }
  buildStand();
  stand.visible = false;
  exterior.add(stand);
  const cityRenderer=createCityWorld({T,exterior,box,piece,renderer});
  const lumenRenderer=createLumenWorld({T,exterior,box,piece,renderer});
  const campusRenderer=createCampusWorld({T,exterior,box,piece,renderer});
  const districtRenderer=createDistrictWorld({T,scene,exterior,renderer});
  const haze={isFog:true,name:'LumenVale air',color:new T.Color('#bfcdc4'),near:38,far:124};
  const duskColor=new T.Color('#6a7790'), dayColor=new T.Color('#c2d8d0');
  const eveningLight=new T.Color('#e6aa70'), daylight=new T.Color('#ffedc8');

  const coatColors = { rose: '#af6760', amber: '#bc8752', blue: '#4d7982' };
  function makeVisitor(tint) {
    const group = new T.Group();
    for (const x of [-.14, .14]) {
      box(group, x, .45, 0, .205, .76, .21, '#454e44');
      box(group, x, .085, .046, .23, .16, .33, '#453732');
    }
    box(group, 0, 1.01, 0, .50, .50, .29, tint);
    for (const x of [-.32, .32]) box(group, x, .98, .02, .135, .46, .128, tint).rotation.z = x * .31;
    piece(group, 'rock', 0, 1.55, .025, .232, .255, .21, '#c88e60');
    piece(group, 'rock', 0, 1.66, -.014, .235, .155, .22, '#5b4035');
    return group;
  }
  const guests = Object.fromEntries(Object.entries(coatColors).map(([key,tint]) => [key, makeVisitor(tint)]));
  for (const guest of Object.values(guests)) {
    guest.visible = false;
    office.add(guest);
  }

  let frameId = 0, wake = 0, current = null, animation = null, lastCamera = -100;
  let width = 0, height = 0;
  const feeds = new Map(Object.entries(SECURITY_CAMERAS).map(([id,settings]) => {
    const view = new T.PerspectiveCamera(settings.horizontal,16/9,.08,125);
    view.position.set(...settings.position);
    view.lookAt(...settings.target);
    return [id,view];
  }));
  const reduceMotion = window.matchMedia('(prefers-reduced-motion: reduce)');
  function updateCameraFeed(now) {
    if (!current.camera || now-lastCamera<80) return;
    const feed = document.getElementById('security-feed');
    const view = feeds.get(current.camera);
    if (!feed || !view) return;
    const context = feed.getContext('2d');
    if (!context) return;
    const feedWidth = Math.min(width,Math.floor(height*16/9));
    const feedHeight = Math.floor(feedWidth*9/16);
    if (feedWidth < 2 || feedHeight < 2) return;
    if (feed.width!==640 || feed.height!==360) { feed.width=640;feed.height=360; }
    const ratio = renderer.getPixelRatio();
    renderer.setViewport(0,0,feedWidth,feedHeight);
    renderer.setScissor(0,0,feedWidth,feedHeight);
    renderer.setScissorTest(true);
    renderer.render(scene,view);
    context.drawImage(canvas,0,canvas.height-Math.floor(feedHeight*ratio),
      Math.floor(feedWidth*ratio),Math.floor(feedHeight*ratio),0,0,640,360);
    renderer.setScissorTest(false);
    renderer.setViewport(0,0,width,height);
    lastCamera=now;
  }
  function render(now) {
    frameId=0;
    if (!current) return;
    const { player, built, visitor, waiting, stock, doorOpen } = current;
    const w=viewport.clientWidth, h=viewport.clientHeight;
    if (!w || !h) return;
    if(w!==width || h!==height){
      width=w;height=h;
      renderer.setSize(width,height,false);
      camera.aspect=width/height;
      camera.updateProjectionMatrix();
    }
    const elapsed=!animation || reduceMotion.matches ? 1 : Math.min(1,(now-animation.start)/900);
    const smooth=elapsed*elapsed*(3-2*elapsed);
    const phase=animation?.name;
    stand.visible=built;
    stand.scale.y=built && phase==='build' ? .03+smooth*.97 : 1;
    for(const [key,guest] of Object.entries(guests)){
      guest.visible=(visitor||waiting)===key;
      if(!guest.visible)continue;
      const moved=visitor ? phase==='guest'?smooth:1 : 0;
      guest.position.set(2.60-moved*.84,0,-5.11+moved*2.67);
    }
    const doorAmount=doorOpen||visitor ? 1 : 0;
    const travel=phase==='door' ? doorAmount?smooth:1-smooth : phase==='guest' && !doorOpen ? smooth : doorAmount;
    door.rotation.y=-travel*1.46;
    kits.forEach((kit,i)=>{kit.visible=i<stock;});
    cityRenderer.update(current.city,now);
    lumenRenderer.update(now,current);
    campusRenderer.update(now);
    districtRenderer.update(now);
    const indoors=Boolean(districtVisit);
    exterior.visible=!indoors;
    office.visible=!indoors;
    // Long blue-hour shadows and warm interiors have separate lighting.
    const dayPhase=(Math.cos(now/144000)+1)*.5;
    scene.fog=indoors?null:haze;
    if(indoors){
      skyLight.color.set('#fbe8c9');
      skyLight.groundColor.set('#a9b1a0');
      skyLight.intensity=1.89;
      sun.color.set('#ffddb1');
      sun.intensity=.91;
      scene.background.set('#7a847e');
    }else{
      skyLight.color.set('#d9e2f3');
      skyLight.groundColor.set('#9e987b');
      skyLight.intensity=1.08+dayPhase*.42;
      sun.color.copy(eveningLight).lerp(daylight,dayPhase);
      sun.intensity=.36+dayPhase*1.68;
      scene.background.copy(duskColor).lerp(dayColor,.24+dayPhase*.76);
      haze.color.copy(scene.background);
    }
    scene.userData.townLight=indoors?1.04:.73+dayPhase*.27;
    // Subtle first-person locomotion feedback; disabled for reduced-motion preferences.
    const moving=current.moving && player!==SEAT_POSITION;
    const sway=moving && !reduceMotion.matches ? Math.sin(now*(current.sprinting?.016:.011))*(current.sprinting?.048:.025) : 0;
    camera.position.set(player.x,player===SEAT_POSITION?1.46:current.driving?2.15+sway:1.7+sway,player.z);
    camera.rotation.set(player.pitch,player.yaw,0,'YXZ');
    updateCameraFeed(now);
    renderer.render(scene,camera);
    if (elapsed===1) animation=null;
    if (animation) schedule();
    else if (current.city && (current.moving || document.pointerLockElement===canvas) && !reduceMotion.matches && !renderer.isSoftware) schedule();
    else if (current.camera || current.city) wake=setTimeout(schedule,current.camera?88:renderer.isSoftware?85:50);
  }
  function schedule() {
    clearTimeout(wake);
    if(!frameId)frameId=requestAnimationFrame(render);
  }
  function update(next) {
    if(next.animate)animation={ name:next.animate,start:performance.now() };
    if(next.camera!==current?.camera)lastCamera=-100;
    current=next;
    schedule();
  }
  new ResizeObserver(schedule).observe(viewport);
  return update;
}

function drawIllustratedView(canvas, viewport) {
  viewport.dataset.renderer='illustrated';
  const ctx = canvas.getContext('2d');
  let current = null;
  if (!ctx) return () => {};
  function render() {
    if (!current) return;
    const { player, built, visitor, waiting, stock } = current;
    const map = !inOffice(player.x,player.z);
    const w = viewport.clientWidth, h = viewport.clientHeight;
    if (!w || !h) return;
    const pixelRatio = Math.min(window.devicePixelRatio || 1, 1.5);
    canvas.width = Math.round(w * pixelRatio);
    canvas.height = Math.round(h * pixelRatio);
    ctx.setTransform(canvas.width / 430, 0, 0, canvas.height / 450, 0, 0);
    const sky = ctx.createLinearGradient(0,0,0,360);
    sky.addColorStop(0, '#b8d3cd');sky.addColorStop(.66, '#d9dcc0');sky.addColorStop(1, '#879d67');
    ctx.fillStyle = sky;ctx.fillRect(0,0,430,450);
    function poly(points,color) {
      ctx.beginPath();points.forEach(([x,y],i)=>i?ctx.lineTo(x,y):ctx.moveTo(x,y));
      ctx.closePath();ctx.fillStyle=color;ctx.fill();
    }
    function rect(x,y,w,h,color) { ctx.fillStyle=color;ctx.fillRect(x,y,w,h); }
    for (let ridge = 0; ridge < 3; ridge++) {
      const points = Array.from({length:30},(_,i) => [
        i * 16, 130 + ridge * 33 + Math.sin(i * .56 + ridge) * 22 + Math.cos(i * .47 + ridge) * 15,
      ]);
      poly([...points,[464,450],[0,450]], ['#a3b49b','#859c76','#718c61'][ridge]);
    }
    poly([[0,252],[111,190],[212,198],[302,219],[430,188],[430,213],[309,252],[223,221],[126,228],[0,297]],'#83aaa0');
    poly([[0,351],[81,276],[186,250],[293,250],[430,266],[430,305],[282,267],[197,270],[98,299],[0,406]], '#c0ac7e');
    for (let i = 0; i < 23; i++) {
      const x = (i * 63.43) % 434, y = 170 + Math.sin(i * 2.5) * 21;
      const s = i % 2 ? 17 : 25;
      rect(x-2,y+9,4,s,'#79684c');
      for (let a = 0; a < 3; a++) poly([[x+(a-1)*s*.55,y-s*.60],[x-s*.89+a*s*.51,y+s*.69],[x+s*.87+a*s*.26,y+s*.78]], a % 2 ? '#54865b' : '#669466');
    }
    if (built) {
      poly([[75,290],[161,267],[230,291],[144,320]], '#8c6548');
      poly([[81,252],[151,228],[202,252],[134,276]], '#7eab79');
      poly([[134,276],[202,252],[200,269],[135,291]], '#527b58');
      for (const [x,y] of [[82,254],[135,276],[200,254]]) rect(x,y,5,42,'#82674a');
      poly([[85,293],[135,308],[199,282],[152,273]],'#b38962');
    }
    if (map) {
      poly([[254,313],[309,293],[342,308],[285,333]], '#ae865e');
      poly([[250,313],[284,279],[333,267],[346,307],[284,325]], '#5d7b5c');
      const x=215+player.x*3.9, y=342+player.z*3.4;
      poly([[x+Math.sin(-player.yaw)*7,y-Math.cos(player.yaw)*7],[x-5,y+6],[x+5,y+6]],'#213e31');
      return;
    }
    ctx.translate((player.x-.32)*-12+Math.sin(player.yaw)*13,(player.z-2.2)*-6);
    rect(0,0,430,25,'#ab936d');
    rect(0,0,16,450,'#b7a37c');
    rect(17,243,413,207,'#ae9165');
    rect(16,244,414,8,'#7a6d4f');
    rect(102,24,9,231,'#6b8261');
    rect(215,24,9,231,'#6b8261');
    rect(328,24,102,250,'#b19c71');
    rect(327,24,7,220,'#6b8261');
    rect(16,123,311,7,'#6b8261');
    rect(344,55,72,210,'#8e6e4d');
    rect(354,69,52,83,'#b39568');
    rect(354,166,52,81,'#a48356');
    if (visitor||waiting) {
      rect(367,184,26,63,{rose:'#b1766e',amber:'#b68b57',blue:'#59838b'}[visitor||waiting]);
      ctx.beginPath();ctx.ellipse(380,170,12,14,0,0,Math.PI*2);ctx.fillStyle='#c88f65';ctx.fill();
    }
    poly([[37,313],[330,290],[417,333],[105,362]], '#a78560');
    poly([[105,362],[417,333],[415,345],[105,375]], '#866644');
    rect(172,231,99,69,'#3d574d');rect(180,237,83,54,'#a4bd9c');
    rect(185,243,72,9,'#537957');rect(189,259,60,3,'#e4e5bd');rect(189,269,51,3,'#e4e5bd');
    rect(213,299,15,20,'#526556');
    rect(199,317,45,4,'#475d4c');
    for (let i = 0; i < Math.min(stock,8); i++) {
      const x = 29 + (i % 4) * 20, y = 273 - Math.floor(i / 4) * 13;
      rect(x,y,16,13,'#d3b888');rect(x+4,y+4,8,4,'#f9e6b6');
    }
  }
  new ResizeObserver(render).observe(viewport);
  return state => {
    current=state;
    render();
    const target = state.camera ? document.getElementById('security-feed') : null;
    if (!target) return;
    if(target.width!==640||target.height!==360){target.width=640;target.height=360;}
    const panel=target.getContext('2d');
    if(!panel)return;
    panel.fillStyle='#233f31';panel.fillRect(0,0,640,360);
    panel.font='bold 23px system-ui';panel.fillStyle='#fff2d3';
    panel.fillText(SECURITY_CAMERAS[state.camera].name+' · Site map',27,43);
    panel.fillStyle='#829d6a';panel.fillRect(22,68,596,267);
    panel.fillStyle='#c7b58b';panel.fillRect(22,178,596,27);panel.fillRect(352,187,36,97);
    panel.fillStyle='#48644b';panel.fillRect(290,247,160,70);
    panel.fillStyle='#fff2d3';panel.font='19px system-ui';panel.fillText('Office',337,294);
    panel.fillText('Road',490,198);
    panel.fillStyle=state.built?'#517f68':'#a9b47a';
    panel.fillRect(136,108,106,58);
    panel.fillStyle=state.built?'#fff5d8':'#253a2a';
    panel.fillText(state.built?'Pickup stand':'Empty lot',128,101);
    if(state.waiting){panel.fillStyle='#e4aa63';panel.beginPath();panel.arc(373,235,9,0,Math.PI*2);panel.fill();}
  };
}

