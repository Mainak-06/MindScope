/* Hero 3D: a neural sphere of glowing nodes + links, orbit rings, drifting dust,
   cursor/touch parallax and a fading particle trail. */
(function () {
  const canvas = document.getElementById('scene');
  if (!canvas || !window.THREE) return;
  const mobile = matchMedia('(max-width:768px)').matches;
  const renderer = new THREE.WebGLRenderer({ canvas, antialias: !mobile, alpha: true });
  renderer.setPixelRatio(Math.min(devicePixelRatio, mobile ? 1.5 : 2));
  const scene = new THREE.Scene();
  const cam = new THREE.PerspectiveCamera(50, 1, 0.1, 100);
  cam.position.z = 7;
  const group = new THREE.Group();
  scene.add(group);

  // Soft round sprite so points look like glows
  const c = document.createElement('canvas'); c.width = c.height = 64;
  const g = c.getContext('2d'), grd = g.createRadialGradient(32, 32, 0, 32, 32, 32);
  grd.addColorStop(0, '#fff'); grd.addColorStop(.3, 'rgba(255,255,255,.5)'); grd.addColorStop(1, 'rgba(255,255,255,0)');
  g.fillStyle = grd; g.fillRect(0, 0, 64, 64);
  const sprite = new THREE.CanvasTexture(c);

  // Nodes on a bumpy fibonacci sphere
  const N = mobile ? 220 : 520, nodes = [];
  for (let i = 0; i < N; i++) {
    const y = 1 - 2 * (i + .5) / N, r = Math.sqrt(1 - y * y), t = i * 2.399963, k = 2.2 * (1 + .1 * Math.sin(i * 1.7));
    nodes.push(new THREE.Vector3(Math.cos(t) * r * k, y * k, Math.sin(t) * r * k));
  }
  const pGeo = new THREE.BufferGeometry().setFromPoints(nodes);
  group.add(new THREE.Points(pGeo, new THREE.PointsMaterial({ size: .11, map: sprite, color: 0x62f0d8, transparent: true, depthWrite: false, blending: THREE.AdditiveBlending })));

  // Synapse links between close nodes
  const seg = [], maxD = mobile ? .75 : .62;
  for (let i = 0; i < N; i++) for (let j = i + 1; j < N; j++) if (nodes[i].distanceTo(nodes[j]) < maxD) seg.push(nodes[i], nodes[j]);
  group.add(new THREE.LineSegments(new THREE.BufferGeometry().setFromPoints(seg), new THREE.LineBasicMaterial({ color: 0x8f7bff, transparent: true, opacity: .22, blending: THREE.AdditiveBlending, depthWrite: false })));

  // Brain-wave rings
  const rings = [];
  [2.9, 3.3, 3.7].forEach((r, i) => {
    const m = new THREE.Mesh(new THREE.TorusGeometry(r, .006, 8, 160), new THREE.MeshBasicMaterial({ color: i % 2 ? 0xff7aa8 : 0x8f7bff, transparent: true, opacity: .35 }));
    m.rotation.set(1.2 + i * .5, i * .8, 0); group.add(m); rings.push(m);
  });

  // Ambient dust (deeper layer for depth parallax)
  const D = mobile ? 150 : 400, dp = new Float32Array(D * 3);
  for (let i = 0; i < D * 3; i++) dp[i] = (Math.random() - .5) * (i % 3 === 2 ? 14 : 22);
  const dustGeo = new THREE.BufferGeometry(); dustGeo.setAttribute('position', new THREE.BufferAttribute(dp, 3));
  const dust = new THREE.Points(dustGeo, new THREE.PointsMaterial({ size: .05, map: sprite, color: 0xb9b1ff, transparent: true, opacity: .6, depthWrite: false, blending: THREE.AdditiveBlending }));
  scene.add(dust);

  // Cursor trail: ring buffer; colours fade to black (= invisible under additive blending)
  const T = mobile ? 30 : 60, tp = new Float32Array(T * 3), tc = new Float32Array(T * 3), tAge = new Float32Array(T).fill(1);
  const tGeo = new THREE.BufferGeometry();
  tGeo.setAttribute('position', new THREE.BufferAttribute(tp, 3)); tGeo.setAttribute('color', new THREE.BufferAttribute(tc, 3));
  scene.add(new THREE.Points(tGeo, new THREE.PointsMaterial({ size: .16, map: sprite, vertexColors: true, transparent: true, depthWrite: false, blending: THREE.AdditiveBlending })));
  let tHead = 0, lastEmit = 0;

  const mouse = { x: 0, y: 0, tx: 0, ty: 0 };
  addEventListener('pointermove', e => {
    mouse.tx = e.clientX / innerWidth * 2 - 1; mouse.ty = -(e.clientY / innerHeight * 2 - 1);
    const now = performance.now();
    if (now - lastEmit > 18) { // emit a trail particle at the pointer, projected onto z=1
      lastEmit = now;
      const h = Math.tan(cam.fov * Math.PI / 360) * (cam.position.z - 1);
      tp.set([mouse.tx * h * cam.aspect, mouse.ty * h, 1], tHead * 3); tAge[tHead] = 0; tHead = (tHead + 1) % T;
    }
  }, { passive: true });

  function resize() {
    const w = canvas.clientWidth, h = canvas.clientHeight;
    renderer.setSize(w, h, false); cam.aspect = w / h;
    group.position.x = w > 900 ? 2.2 : 0; // sphere sits right of the headline on wide screens
    group.position.y = w > 900 ? 0 : -1.2; group.scale.setScalar(w > 900 ? 1 : .8);
    cam.updateProjectionMatrix();
  }
  addEventListener('resize', resize); resize();

  let visible = true;
  new IntersectionObserver(([e]) => visible = e.isIntersecting).observe(canvas);
  const clock = new THREE.Clock();
  (function loop() {
    requestAnimationFrame(loop);
    if (!visible) return;
    const t = clock.getElapsedTime();
    mouse.x += (mouse.tx - mouse.x) * .06; mouse.y += (mouse.ty - mouse.y) * .06; // eased follow
    group.rotation.y = t * .08 + mouse.x * .7; group.rotation.x = -mouse.y * .45;
    group.scale.setScalar((innerWidth > 900 ? 1 : .8) * (1 + Math.sin(t * .9) * .015));
    rings.forEach((r, i) => { r.rotation.z += .0015 * (i + 1); r.rotation.x += .0008; });
    cam.position.x = mouse.x * .5; cam.position.y = mouse.y * .35; cam.lookAt(0, 0, 0); // depth tilt
    dust.rotation.y = t * .01 - mouse.x * .12; dust.position.x = -mouse.x * .6;
    for (let i = 0; i < T; i++) { tAge[i] = Math.min(1, tAge[i] + .025); const f = (1 - tAge[i]) ** 2; tc.set([.38 * f, .94 * f, .85 * f], i * 3); }
    tGeo.attributes.color.needsUpdate = true; tGeo.attributes.position.needsUpdate = true;
    renderer.render(scene, cam);
  })();
})();
