/* ============================================================
   ATMOSPHERE — lightweight enhancement layer that keeps the page
   feeling alive even when some optional effects are unavailable.
============================================================ */
'use strict';

(function(){
  const dustField = document.getElementById('dustField');
  if (!dustField) return;

  const particles = Array.from({ length: 36 }, () => {
    const el = document.createElement('span');
    el.className = 'dust-particle';
    Object.assign(el.style, {
      left: `${Math.random() * 100}%`,
      top: `${Math.random() * 100}%`,
      opacity: `${0.12 + Math.random() * 0.28}`,
      transform: `scale(${0.4 + Math.random() * 1.1})`
    });
    dustField.appendChild(el);
    return el;
  });

  let phase = 0;
  function frame(){
    phase += 0.008;
    particles.forEach((el, i) => {
      const drift = Math.sin(phase + i * 0.7) * 6;
      el.style.transform = `translate3d(${drift}px, 0, 0) scale(${0.4 + Math.random() * 1.1})`;
    });
    requestAnimationFrame(frame);
  }

  frame();
})();
