const WALK_LIMITS = { left: -45, right: 45, north: -18, south: 36 };
const START_POSITION = { x: .32, z: 2.2, yaw: .11, pitch: -.08 };
const SEAT_POSITION = { x: .02, z: 1.02, yaw: .19, pitch: -.09 };
const DOOR = { x: 2.63, z: -3.65 };
const STAND = { x: -4.3, z: -12.45 };

const SECURITY_CAMERAS = {
  front: { name: 'Front entrance', position: [6.8, 4.6, -7.5], target: [1.9, .5, -2.85], horizontal: 69 },
  lot: { name: 'Pickup lot', position: [-11.1, 6.6, -6.9], target: [-3.7, .65, -12.85], horizontal: 67 },
  road: { name: 'Road and river', position: [13.2, 10.0, -7.6], target: [.2, .3, -14.8], horizontal: 74 },
};

function inOffice(x,z) {
  return x > -4.2 && x < 4.2 && z > -3.7 && z < 4.1;
}

const OFFICE_COLLIDERS = [
  [-4.26, -4.10, -3.85, 4.15], [4.10, 4.26, -3.85, 4.15],
  [-4.25, 4.25, 4.02, 4.16], [-4.25, 1.99, -3.85, -3.52], [3.29, 4.25, -3.85, -3.52],
  [-1.24, 1.64, -.40, .68], [-3.43, -1.74, -3.02, -2.38],
];
function canWalk(x,z,{doorOpen,stand}) {
  if(typeof cityCanWalk==='function' && !cityCanWalk(x,z))return false;
  if (x < WALK_LIMITS.left || x > WALK_LIMITS.right || z < WALK_LIMITS.north || z > WALK_LIMITS.south) return false;
  const radius = .20;
  const colliders = OFFICE_COLLIDERS.slice();
  if (!doorOpen) colliders.push([1.98, 3.3, -3.78, -3.52]);
  if (stand) colliders.push([STAND.x-1.44, STAND.x+1.44, STAND.z-1.02, STAND.z+1.02]);
  return !colliders.some(([left,right,north,south]) =>
    x > left-radius && x < right+radius && z > north-radius && z < south+radius);
}
function walkStep(player, forward, sideways, seconds, settings) {
  const speed = settings.driving ? 10 : inOffice(player.x,player.z) ? 2.8 : settings.sprint ? 7.3 : 4.15;
  const magnitude = Math.max(1,Math.hypot(forward,sideways));
  const scale = Math.max(0,Math.min(seconds,.045))*speed/magnitude;
  const dx = (Math.cos(player.yaw)*sideways-Math.sin(player.yaw)*forward)*scale;
  const dz = (-Math.sin(player.yaw)*sideways-Math.cos(player.yaw)*forward)*scale;
  const x = canWalk(player.x+dx,player.z,settings) ? player.x+dx : player.x;
  const z = canWalk(x,player.z+dz,settings) ? player.z+dz : player.z;
  return { ...player,x,z };
}
function nearbyInteraction({x,z}, doorOpen, pending, stand) {
  const indoors = inOffice(x,z);
  if (Math.hypot(x-DOOR.x,z-DOOR.z)<1.8) return pending
    ? { id:'door', label:'Meet '+pending.name+' at the door' }
    : { id:'door', label:doorOpen?'Close the office door':'Open the office door' };
  if (indoors && z > .85 && Math.hypot(x-.20,z-1.25)<1.75) return { id:'seat', label:'Sit at the computer' };
  if (!indoors && stand && Math.hypot(x-STAND.x,z-STAND.z)<2.7) return { id:'stand', label:'Inspect pickup stand' };
  return null;
}

