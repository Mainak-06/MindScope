/* Cursor, nav, hero tilt, CTA scrolling. */
(function () {
  const fine = matchMedia('(pointer:fine)').matches;
  if (fine) { // custom cursor: dot follows instantly, ring eases
    document.body.classList.add('has-cursor');
    const dot = document.querySelector('.cur-dot'), ring = document.querySelector('.cur-ring');
    let x = 0, y = 0, rx = 0, ry = 0;
    addEventListener('pointermove', e => { x = e.clientX; y = e.clientY; dot.style.transform = `translate(${x}px,${y}px)`; }, { passive: true });
    (function f() { rx += (x - rx) * .16; ry += (y - ry) * .16; ring.style.transform = `translate(${rx}px,${ry}px)`; requestAnimationFrame(f); })();
    document.addEventListener('pointerover', e => ring.classList.toggle('big', !!e.target.closest('a,button,input,li')));
  }
  // Subtle 3D tilt on hero copy
  const copy = document.getElementById('heroCopy');
  if (fine && !matchMedia('(prefers-reduced-motion: reduce)').matches) {
    copy.style.perspective = '900px';
    document.getElementById('hero').addEventListener('pointermove', e => {
      const nx = e.clientX / innerWidth - .5, ny = e.clientY / innerHeight - .5;
      copy.firstElementChild && (copy.style.transform = `rotateY(${nx * 4}deg) rotateX(${-ny * 3}deg)`);
    });
  }
  // Nav
  const nav = document.getElementById('nav'), menu = document.getElementById('menu'), burger = document.getElementById('burger');
  addEventListener('scroll', () => nav.classList.toggle('solid', scrollY > 40), { passive: true });
  burger.onclick = () => { const o = menu.classList.toggle('open'); burger.setAttribute('aria-expanded', o); };
  menu.querySelectorAll('a').forEach(a => a.addEventListener('click', () => { menu.classList.remove('open'); burger.setAttribute('aria-expanded', false); }));
  // CTAs
  document.getElementById('ctaExplore').onclick = () => document.getElementById('about').scrollIntoView({ behavior: 'smooth' });
  document.getElementById('ctaStart').onclick = () => document.getElementById('assess').scrollIntoView({ behavior: 'smooth' });
  Anim.init();
})();
