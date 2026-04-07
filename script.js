// Animation douce lors du scroll vers les sections
document.querySelectorAll('a[href^="#"]').forEach(link => {
  link.addEventListener("click", function(e) {
    e.preventDefault();
    document.querySelector(this.getAttribute("href")).scrollIntoView({
      behavior: "smooth"
    });
  });
});

// --- Theme toggle (dark/light) ---
(function () {
  const body = document.body;
  const toggleTheme = document.getElementById("toggle-theme");
  if (!toggleTheme) return;

  const key = "portfolio-theme";
  const saved = localStorage.getItem(key);
  if (saved === "light") {
    body.classList.add("light-theme");
    toggleTheme.textContent = "Mode sombre";
  }

  toggleTheme.addEventListener("click", function () {
    const isLight = body.classList.toggle("light-theme");
    localStorage.setItem(key, isLight ? "light" : "dark");
    toggleTheme.textContent = isLight ? "Mode sombre" : "Mode clair";
  });
})();

// --- 3D Hero (Three.js) ---
(function(){
  const hero = document.getElementById('hero-3d');
  if (!hero || typeof THREE === 'undefined') return; // no container or Three not loaded

  let scene, camera, renderer, knot, ring, stars, animationId;
  let running = true;

  function init() {
    const width = hero.clientWidth || window.innerWidth;
    const height = hero.clientHeight || 300;

    scene = new THREE.Scene();
    camera = new THREE.PerspectiveCamera(45, width / height, 0.1, 1000);
    camera.position.set(0, 0, 6);

    renderer = new THREE.WebGLRenderer({ antialias: true, alpha: true });
    renderer.setPixelRatio(window.devicePixelRatio ? window.devicePixelRatio : 1);
    renderer.setSize(width, height);
    renderer.domElement.style.display = 'block';
    hero.appendChild(renderer.domElement);

    // layered scene for a subtle "4D" depth impression
    const knotGeo = new THREE.TorusKnotGeometry(1.15, 0.28, 160, 18);
    const knotMat = new THREE.MeshStandardMaterial({
      color: 0x7188a2,
      roughness: 0.35,
      metalness: 0.65
    });
    knot = new THREE.Mesh(knotGeo, knotMat);
    scene.add(knot);

    const ringGeo = new THREE.TorusGeometry(2.3, 0.035, 16, 140);
    const ringMat = new THREE.MeshBasicMaterial({
      color: 0xa1b3c6,
      transparent: true,
      opacity: 0.45
    });
    ring = new THREE.Mesh(ringGeo, ringMat);
    ring.rotation.x = 1.2;
    ring.rotation.y = 0.2;
    scene.add(ring);

    const starGeo = new THREE.BufferGeometry();
    const starCount = 220;
    const positions = new Float32Array(starCount * 3);
    for (let i = 0; i < starCount; i++) {
      positions[i * 3] = (Math.random() - 0.5) * 12;
      positions[i * 3 + 1] = (Math.random() - 0.5) * 8;
      positions[i * 3 + 2] = (Math.random() - 0.5) * 10;
    }
    starGeo.setAttribute('position', new THREE.BufferAttribute(positions, 3));
    const starMat = new THREE.PointsMaterial({
      color: 0x9caec0,
      size: 0.025,
      transparent: true,
      opacity: 0.5
    });
    stars = new THREE.Points(starGeo, starMat);
    scene.add(stars);

    // lights
    const hemi = new THREE.HemisphereLight(0xf5f7fb, 0x1f2730, 0.58);
    hemi.position.set(0, 20, 0);
    scene.add(hemi);

    const dir = new THREE.DirectionalLight(0xe8edf4, 0.92);
    dir.position.set(-3, 10, 5);
    scene.add(dir);

    // subtle ambient
    scene.add(new THREE.AmbientLight(0x1a2028));

    window.addEventListener('resize', onResize);
    animate();
  }

  function onResize(){
    if (!renderer || !camera) return;
    const w = hero.clientWidth || window.innerWidth;
    const h = hero.clientHeight || 300;
    camera.aspect = w / h;
    camera.updateProjectionMatrix();
    renderer.setSize(w, h);
  }

  function animate(){
    if (running) {
      knot.rotation.x += 0.004;
      knot.rotation.y += 0.0065;
      ring.rotation.z += 0.0018;
      stars.rotation.y += 0.0008;
    }
    renderer.render(scene, camera);
    animationId = requestAnimationFrame(animate);
  }

  // toggle control
  const toggle = document.getElementById('toggle-3d');
  if (toggle) {
    toggle.addEventListener('click', function(){
      running = !running;
      toggle.textContent = running ? 'Pause 3D' : 'Reprendre 3D';
    });
  }

  // init if WebGL is available
  try {
    init();
  } catch (e) {
    // if WebGL init fails, remove hero container silently
    console.warn('Three.js init failed:', e);
    if (hero) hero.remove();
  }

  // clean on unload
  window.addEventListener('beforeunload', () => {
    if (animationId) cancelAnimationFrame(animationId);
    if (renderer && renderer.domElement && hero.contains(renderer.domElement)) {
      hero.removeChild(renderer.domElement);
    }
  });
})();

// --- 3D tilt for project cards ---
(function(){
  const cards = document.querySelectorAll('.project-card');
  if (!cards.length) return;

  cards.forEach(card => {
    const rect = () => card.getBoundingClientRect();
    function onMove(e){
      const r = rect();
      const px = (e.clientX - r.left) / r.width;
      const py = (e.clientY - r.top) / r.height;
      const rotY = (px - 0.5) * 14; // -7 to 7deg
      const rotX = (0.5 - py) * 10; // -5 to 5deg
      card.style.transform = `translateY(-6px) rotateX(${rotX}deg) rotateY(${rotY}deg)`;
      card.classList.add('tilt');
    }
    function onLeave(){
      card.style.transform = '';
      card.classList.remove('tilt');
    }
    card.addEventListener('mousemove', onMove);
    card.addEventListener('mouseleave', onLeave);
    card.addEventListener('touchmove', function(e){
      const touch = e.touches[0];
      if (touch) onMove(touch);
    }, {passive:true});
    card.addEventListener('touchend', onLeave);
  });
})();

// --- Parallax sections on scroll ---
(function () {
  const sections = document.querySelectorAll(".section[data-parallax-speed]");
  if (!sections.length) return;

  function updateParallax() {
    const vh = window.innerHeight || 1;
    sections.forEach((section) => {
      const speed = Number(section.dataset.parallaxSpeed || 0);
      const rect = section.getBoundingClientRect();
      const centerOffset = rect.top + rect.height / 2 - vh / 2;
      const shift = -centerOffset * speed * 0.2;
      section.style.transform = `perspective(1000px) translate3d(0, ${shift.toFixed(2)}px, 0)`;
    });
  }

  window.addEventListener("scroll", updateParallax, { passive: true });
  window.addEventListener("resize", updateParallax);
  updateParallax();
})();

// --- Reveal micro-animations ---
(function () {
  const targets = document.querySelectorAll(
    "h1, h2, .tagline, .about-content p, .project-card, .links .btn, #contact p"
  );

  if (!targets.length) return;

  targets.forEach((el, index) => {
    el.classList.add("reveal");
    el.style.transitionDelay = `${Math.min(index * 40, 240)}ms`;
  });

  const io = new IntersectionObserver(
    (entries) => {
      entries.forEach((entry) => {
        if (entry.isIntersecting) {
          entry.target.classList.add("visible");
          io.unobserve(entry.target);
        }
      });
    },
    { threshold: 0.2 }
  );

  targets.forEach((el) => io.observe(el));

  const title = document.querySelector("header h1");
  if (title) {
    title.classList.add("float-soft");
  }
})();
