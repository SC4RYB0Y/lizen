/* ============================================================
   PIN INTRO — lightweight fallback gate for the site.
   It unlocks the page when the correct code is entered.
============================================================ */
'use strict';

(function(){
  const gate = document.getElementById('pinGate');
  const form = document.getElementById('pinForm');
  const revealBtn = document.getElementById('pinRevealBtn');
  const pinIntroCta = document.getElementById('pinIntroCta');
  const inputPanel = document.getElementById('pinInputPanel');
  const input = document.getElementById('pinInput');
  const error = document.getElementById('pinError');
  const pinCard = document.getElementById('pinCard');
  if (!gate || !form || !revealBtn || !pinIntroCta || !inputPanel || !input || !error || !pinCard) return;

  window.__pinIntroStarted = true;

  const showInputPanel = () => {
    pinIntroCta.hidden = true;
    inputPanel.classList.add('visible');
    inputPanel.setAttribute('aria-hidden', 'false');
    input.focus();
  };

  revealBtn.addEventListener('click', () => {
    if (typeof window.__unlockAudio === 'function') window.__unlockAudio();
    showInputPanel();
  });

  form.addEventListener('submit', (e) => {
    e.preventDefault();
    const codeValue = input.value.trim();

    if (codeValue === String(CONFIG.pin.code)) {
      pinCard.classList.remove('is-error');
      pinCard.classList.add('is-success');
      error.classList.remove('is-visible');
      document.documentElement.classList.remove('pin-locked');
      document.body.classList.remove('pin-locked');
      gate.classList.add('leaving');
      window.setTimeout(() => {
        gate.remove();
      }, 700);
      const veil = document.getElementById('bloomVeil');
      if (veil) veil.remove();
      if (typeof window.__rescuePinPage === 'function') window.__rescuePinPage();
      if (typeof initScrollFX === 'function') initScrollFX();
      if (typeof window.lenis !== 'undefined' && typeof window.lenis.start === 'function') window.lenis.start();
      if (typeof window.__startBackgroundMusic === 'function') window.__startBackgroundMusic();
    } else {
      const errorText = error.querySelector('.pin-error-text');
      if (errorText) {
        errorText.textContent = 'o code é a nossa data';
      }
      error.classList.add('is-visible');
      pinCard.classList.add('is-error');
      window.setTimeout(() => pinCard.classList.remove('is-error'), 600);
      input.value = '';
      input.focus();
    }
  });
})();
