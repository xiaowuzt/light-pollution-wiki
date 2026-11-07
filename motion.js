'use strict';
// Progressive enhancement: content stays visible without this controller or its APIs.
(() => {
 const reduced = matchMedia('(prefers-reduced-motion: reduce)');
 const easing = 'cubic-bezier(0.16, 1, 0.3, 1)';
 const active = new Set(), pending = new Set(), byElement = new WeakMap();
 let observer, heroObserver, hero, heroVisible = true, paused = false;
 try { paused = localStorage.getItem('lp-wiki-ambient') === 'paused'; } catch {}

 function enter(element, delay = 0, distance = 20, duration = 480) {
  if (reduced.matches || !element?.animate || element.contains(document.activeElement)) return;
  byElement.get(element)?.cancel();
  const animation = element.animate([
   { opacity: 0, translate: `0 ${distance}px` },
   { opacity: 1, translate: '0 0' }
  ], { duration, delay, easing, fill: 'both' });
  active.add(animation); byElement.set(element, animation);
  const release = () => { active.delete(animation); if (byElement.get(element) === animation) byElement.delete(element); };
  animation.onfinish = () => { release(); animation.cancel(); };
  animation.oncancel = release;
 }

 function observe(elements) {
  if (reduced.matches) return;
  const nodes = [...elements];
  if (!('IntersectionObserver' in window)) {
   nodes.filter(node => node.getBoundingClientRect().top < innerHeight).forEach((node, i) => enter(node, Math.min(i, 3) * 40));
   return;
  }
  if (!observer) observer = new IntersectionObserver(entries => {
   let order = 0;
   for (const entry of entries) {
    if (!entry.isIntersecting) continue;
    observer.unobserve(entry.target); pending.delete(entry.target);
    enter(entry.target, Math.min(order++, 3) * 40);
   }
  }, { threshold: 0.08 });
  for (const node of pending) if (!node.isConnected) { observer.unobserve(node); pending.delete(node); }
  for (const node of nodes) if (!pending.has(node)) { pending.add(node); observer.observe(node); }
 }

 function syncAmbient() {
  if (!hero?.isConnected) return;
  hero.dataset.ambient = !paused && !reduced.matches && heroVisible && !document.hidden ? 'running' : 'paused';
  const button = hero.querySelector('.motion-toggle');
  if (!button) return;
  button.hidden = reduced.matches;
  const zh = document.documentElement.lang.startsWith('zh');
  const label = paused ? (zh ? '播放背景动画' : 'Play background motion') : (zh ? '暂停背景动画' : 'Pause background motion');
  button.setAttribute('aria-label', label);
  button.querySelector('[data-motion-label]').textContent = label;
  button.querySelector('[data-motion-icon]').textContent = paused ? '▷' : 'Ⅱ';
 }

 function syncHeader() {
  document.querySelector('#header')?.classList.toggle('is-scrolled', scrollY > 24 || !hero);
 }

 function reset() {
  observer?.disconnect(); observer = null; pending.clear();
  heroObserver?.disconnect(); heroObserver = null;
  for (const animation of active) animation.cancel();
  active.clear(); hero = null;
 }

 function mount() {
  hero = document.querySelector('.hero');
  syncHeader();
  if (hero) {
   const bounds = hero.getBoundingClientRect();
   heroVisible = bounds.bottom > 0 && bounds.top < innerHeight;
   hero.querySelector('.motion-toggle')?.addEventListener('click', () => {
    paused = !paused;
    try { localStorage.setItem('lp-wiki-ambient', paused ? 'paused' : 'running'); } catch {}
    syncAmbient();
   });
   if ('IntersectionObserver' in window) {
    heroObserver = new IntersectionObserver(entries => { heroVisible = entries[0].isIntersecting; syncAmbient(); });
    heroObserver.observe(hero);
   }
   syncAmbient();
   if (heroVisible) hero.querySelectorAll('.hero-content > *, .hero-bottom').forEach((node, i) => enter(node, i * 55, node.matches('.hero-bottom, .hero-actions') ? 0 : 24));
  } else {
   document.querySelectorAll('.page-top, .error-page').forEach(node => enter(node, 0, 16, 380));
  }
  observe(document.querySelectorAll('.intro-strip > *, .section-head, .feature, .category-tile, .split-section > div:first-child, .guide-link, .download-band, .spell-card, .empty, .equipment-card'));
 }

 // Keyboard focus must never land on a transparent or moving control.
 document.addEventListener('focusin', event => {
  // Pointer focus must not move a target between pointerdown and pointerup.
  if (!event.target.matches(':focus-visible')) return;
  for (const node of pending) if (node === event.target || node.contains(event.target)) { observer?.unobserve(node); pending.delete(node); }
  for (const animation of active) {
   const node = animation.effect?.target;
   if (node && (node === event.target || node.contains(event.target))) animation.cancel();
  }
 });
 reduced.addEventListener('change', () => {
  if (reduced.matches) {
   observer?.disconnect(); observer = null; pending.clear();
   for (const animation of active) animation.cancel();
   active.clear();
  }
  syncAmbient();
 });
 document.addEventListener('visibilitychange', syncAmbient);
 window.addEventListener('scroll', syncHeader, { passive: true });
 window.WikiMotion = {
  reset, mount,
  results() { observe(document.querySelectorAll('#spell-results > *')); },
  feedback(element) { enter(element, 0, 5, 180); }
 };
})();
