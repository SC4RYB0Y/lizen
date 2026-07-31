/* ============================================================
   CONFIG — shared defaults for the site. These values are used by
   the particle engine, countdown, music player, and intro gate.
============================================================ */
'use strict';

(function(){
  const today = new Date();
  const defaultBirthday = new Date(today.getFullYear() + 1, 6, 1);

  window.CONFIG = {
    colors: {
      rose: '#e88fa3',
      roseSoft: '#f3b8c9',
      roseBright: '#ff9fc0',
      gold: '#d9ab72',
      ivory: '#fff7f2',
      ivoryDim: '#f2deda'
    },
    petals: {
      spriteSize: 48,
      species: [
        { ch: '🌸', w: 1.1 },
        { ch: '🌼', w: 1.0 },
        { ch: '🌷', w: 0.9 },
        { ch: '🌺', w: 0.8 }
      ]
    },
    tiers: {
      minimal: { dpr: 1, bg: 0.25, mid: 0.2, fg: 0.15 },
      low: { dpr: 1, bg: 0.4, mid: 0.3, fg: 0.25 },
      medium: { dpr: 1.5, bg: 0.65, mid: 0.55, fg: 0.45 },
      high: { dpr: 2, bg: 0.95, mid: 0.85, fg: 0.75 }
    },
    tierOrder: ['minimal', 'low', 'medium', 'high'],
    countdown: {
      exactDate: new Date(2027, 6, 27)
    },
    audio: {
      storeKey: 'marlize-garden-audio-state',
      fadeMs: 1000,
      targetVolume: 0.85,
      saveIntervalMs: 4000,
      autoStart: true,
      src: './assets/audio/MJ.mp3'
    },
    pin: {
      code: '2108',
      hint: 'Enter the secret code from the page.'
    }
  };

  window.CONFIG.countdown.exactDate = window.CONFIG.countdown.exactDate || defaultBirthday;
})();

const CONFIG = window.CONFIG;
