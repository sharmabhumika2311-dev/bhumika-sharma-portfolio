(() => {
  const reduce = matchMedia('(prefers-reduced-motion: reduce)').matches;
  document.getElementById('yr').textContent = new Date().getFullYear();

  /* Scroll reveal + count-up */
  const countUp = el => {
    const end = +el.dataset.count, t0 = performance.now();
    const step = t => {
      const p = Math.min((t - t0) / 1200, 1);
      el.textContent = Math.round(end * (1 - Math.pow(1 - p, 3)));
      if (p < 1) requestAnimationFrame(step);
    };
    reduce ? (el.textContent = end) : requestAnimationFrame(step);
  };
  const io = new IntersectionObserver(entries => {
    entries.forEach(e => {
      if (!e.isIntersecting) return;
      e.target.classList.add('in');
      e.target.querySelectorAll('[data-count]').forEach(countUp);
      io.unobserve(e.target);
    });
  }, { threshold: 0.15 });
  document.querySelectorAll('[data-reveal]').forEach((el, i) => {
    el.style.setProperty('--d', (i % 4) * 90 + 'ms');
    io.observe(el);
  });

  /* Scroll progress bar */
  const bar = document.getElementById('bar');
  const onScroll = () => {
    const h = document.documentElement;
    bar.style.transform = `scaleX(${h.scrollTop / (h.scrollHeight - h.clientHeight || 1)})`;
  };
  addEventListener('scroll', onScroll, { passive: true });
  onScroll();

  /* Three.js particle hero */
  const canvas = document.getElementById('hero-canvas');
  if (!window.THREE || !canvas) return;

  const renderer = new THREE.WebGLRenderer({ canvas, alpha: true, antialias: true });
  renderer.setPixelRatio(Math.min(devicePixelRatio, 2));
  const scene = new THREE.Scene();
  const camera = new THREE.PerspectiveCamera(60, 1, 0.1, 100);
  camera.position.z = 6;

  const N = innerWidth < 700 ? 1500 : 3000;
  const base = new Float32Array(N * 3), pos = new Float32Array(N * 3), col = new Float32Array(N * 3);
  const palette = [0x7C5CFF, 0x22D3EE, 0xF472B6].map(h => new THREE.Color(h));
  const tmp = new THREE.Color();
  for (let i = 0; i < N; i++) {
    const y = 1 - 2 * (i + 0.5) / N, r = Math.sqrt(1 - y * y), th = i * 2.399963;
    const R = 2.3 + Math.random() * 0.9;
    base.set([Math.cos(th) * r * R, y * R, Math.sin(th) * r * R], i * 3);
    const t = (y + 1) * 1;               // 0..2 across the sphere
    const k = Math.min(Math.floor(t), 1);
    tmp.copy(palette[k]).lerp(palette[k + 1], t - k);
    col.set([tmp.r, tmp.g, tmp.b], i * 3);
  }
  pos.set(base);
  const geo = new THREE.BufferGeometry();
  geo.setAttribute('position', new THREE.BufferAttribute(pos, 3));
  geo.setAttribute('color', new THREE.BufferAttribute(col, 3));
  const mat = new THREE.PointsMaterial({ size: 0.045, vertexColors: true, transparent: true, opacity: 0.9, depthWrite: false, blending: THREE.AdditiveBlending });
  const points = new THREE.Points(geo, mat);
  scene.add(points);

  const resize = () => {
    const w = canvas.clientWidth, h = canvas.clientHeight;
    renderer.setSize(w, h, false);
    camera.aspect = w / h;
    camera.position.z = w < 700 ? 8 : 6;
    camera.updateProjectionMatrix();
  };
  addEventListener('resize', resize);
  resize();

  const mouse = { x: 0, y: 0 };
  addEventListener('pointermove', e => {
    mouse.x = (e.clientX / innerWidth - 0.5) * 2;
    mouse.y = (e.clientY / innerHeight - 0.5) * 2;
  });

  let visible = true;
  new IntersectionObserver(([e]) => { visible = e.isIntersecting; }).observe(canvas);

  const clock = new THREE.Clock();
  const frame = () => {
    requestAnimationFrame(frame);
    if (!visible) return;
    const t = clock.getElapsedTime();
    for (let i = 0; i < N; i++) {
      const b = i * 3;
      const k = 1 + 0.07 * Math.sin(base[b + 1] * 1.6 + t * 0.9 + base[b] * 1.2);
      pos[b] = base[b] * k; pos[b + 1] = base[b + 1] * k; pos[b + 2] = base[b + 2] * k;
    }
    geo.attributes.position.needsUpdate = true;
    points.rotation.y = t * 0.08 + mouse.x * 0.45;
    points.rotation.x = mouse.y * 0.25;
    renderer.render(scene, camera);
  };

  if (reduce) {
    renderer.render(scene, camera);   // single static frame
  } else {
    frame();
  }
})();
