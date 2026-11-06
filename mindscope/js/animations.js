/* GSAP animations, exposed as window.Anim for the other scripts. */
window.Anim = (function () {
  const ok = window.gsap && window.ScrollTrigger;
  if (ok) gsap.registerPlugin(ScrollTrigger);
  const reduce = matchMedia('(prefers-reduced-motion: reduce)').matches;

  function init() {
    if (!ok || reduce) return;
    // One orchestrated hero entrance
    gsap.from('.hero-copy h1, .hero-copy p, .hero-copy .btn', { y: 50, opacity: 0, duration: 1.3, ease: 'power3.out', stagger: .18, delay: .2 });
    // Cinematic hero -> intro transition: copy recedes, scene softens
    gsap.to('.hero-copy', { yPercent: -18, opacity: 0, scale: .96, ease: 'none', scrollTrigger: { trigger: '.hero', start: 'top top', end: 'bottom 30%', scrub: true } });
    gsap.to('#scene', { opacity: .15, ease: 'none', scrollTrigger: { trigger: '.hero', start: 'center top', end: 'bottom top', scrub: true } });
    gsap.to('.bg-glow', { backgroundPosition: '60% 60%', ease: 'none', scrollTrigger: { scrub: true, start: 0, end: 'max' } });
    // Progressive section reveals
    ScrollTrigger.batch('.reveal', { start: 'top 88%', once: true,
      onEnter: els => gsap.fromTo(els, { y: 40, opacity: 0 }, { y: 0, opacity: 1, duration: 1, ease: 'power3.out', stagger: .12 }) });
    gsap.set('.reveal', { opacity: 0 });
  }

  // Animate between form steps
  function stepIn(el) { if (ok && !reduce) gsap.fromTo(el, { x: 40, opacity: 0 }, { x: 0, opacity: 1, duration: .6, ease: 'power3.out' }); }

  // Count the number up to its target
  function countUp(el, target, decimals = 2) {
    if (!ok || reduce) { el.textContent = target.toFixed(decimals); return; }
    const o = { v: 0 };
    gsap.to(o, { v: target, duration: 2.2, ease: 'power2.out', onUpdate: () => el.textContent = o.v.toFixed(decimals) });
  }

  function revealResult(sec) {
    if (ok && !reduce) gsap.from(sec.querySelectorAll('.orb, .explain, .sub, .chips, .btn, .lead'), { y: 40, opacity: 0, duration: 1, stagger: .12, ease: 'power3.out' });
  }
  return { init, stepIn, countUp, revealResult };
})();
