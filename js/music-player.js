/* ============================================================
   MUSIC PLAYER — plays a single soundtrack after the PIN unlocks
   the page, with support for both a local audio file and a
   YouTube source URL.
============================================================ */
'use strict';

(function musicPlayer(){
  const audio     = document.getElementById('audioEl');
  const wrap      = document.getElementById('player');
  const playBtn   = document.getElementById('trackPlayBtn');
  const scrub     = document.getElementById('trackScrub');
  const scrubFill = document.getElementById('trackScrubFill');
  const curEl     = document.getElementById('trackCurrent');
  const durEl     = document.getElementById('trackDuration');
  const ytContainer = document.getElementById('ytPlayerContainer');
  if (!audio) return;

  const cfg = (typeof CONFIG !== 'undefined' && CONFIG.audio) ? CONFIG.audio : {};
  const STORE_KEY = cfg.storeKey || 'marlize-garden-audio-state';
  const FADE_MS = cfg.fadeMs || 1000;
  const TARGET_VOL = cfg.targetVolume != null ? cfg.targetVolume : 0.85;
  const SAVE_MS = cfg.saveIntervalMs || 4000;
  const AUDIO_SRC = cfg.src || './assets/audio/to-summer-from-cole.mp3';
  const AUTO_START = cfg.autoStart !== false && !document.getElementById('pinGate');
  const IS_YOUTUBE = /^https?:\/\/(?:www\.)?(?:youtube\.com\/watch|youtu\.be\/)/i.test(AUDIO_SRC);
  const YOUTUBE_VIDEO_ID = IS_YOUTUBE ? parseYouTubeVideoId(AUDIO_SRC) : null;

  let fadeRAF = null;
  let scrubbing = false;
  let audioUnlocked = false;
  let ytPlayer = null;
  let ytReadyPromise = null;
  let ytTimeTicker = null;

  if (!IS_YOUTUBE) {
    audio.src = AUDIO_SRC;
    audio.loop = true;
  } else {
    audio.removeAttribute('src');
  }

  if (!IS_YOUTUBE){
    audio.addEventListener('error', () => {
      console.warn('Music player failed to load audio source:', AUDIO_SRC);
    });
  }

  function readState(){
    try {
      const raw = localStorage.getItem(STORE_KEY);
      return raw ? JSON.parse(raw) : null;
    } catch (e) {
      return null;
    }
  }
  function writeState(patch){
    try {
      const current = readState() || {};
      localStorage.setItem(STORE_KEY, JSON.stringify(Object.assign(current, patch)));
    } catch (e) {
      // ignore
    }
  }
  const saved = readState();

  function fmt(s){
    if (!isFinite(s)) return '0:00';
    const m = Math.floor(s / 60);
    const sec = Math.floor(s % 60);
    return `${m}:${String(sec).padStart(2, '0')}`;
  }

  function parseYouTubeVideoId(url){
    const match = url.match(/(?:v=|youtu\.be\/)([A-Za-z0-9_-]{11})(?=[&?#]|$)/);
    return match ? match[1] : null;
  }

  function ensureYouTubeAPI(){
    if (ytReadyPromise) return ytReadyPromise;
    if (window.YT && window.YT.Player){
      ytReadyPromise = Promise.resolve();
      return ytReadyPromise;
    }

    ytReadyPromise = new Promise(resolve => {
      const previous = window.onYouTubeIframeAPIReady;
      window.onYouTubeIframeAPIReady = function(){
        if (typeof previous === 'function') previous();
        resolve();
      };
      const script = document.createElement('script');
      script.src = 'https://www.youtube.com/iframe_api';
      script.async = true;
      document.head.appendChild(script);
    });
    return ytReadyPromise;
  }

  function updateTimeDisplay(current, duration){
    curEl && (curEl.textContent = fmt(current));
    if (duration != null && durEl){
      durEl.textContent = fmt(duration);
    }
    if (duration && scrubFill){
      const pct = (current / duration) * 100;
      scrubFill.style.width = `${Math.min(100, Math.max(0, pct))}%`;
      scrub && scrub.setAttribute('aria-valuenow', Math.round(pct));
    }
  }

  function startYouTubeTimeUpdates(){
    if (ytTimeTicker || !ytPlayer || typeof ytPlayer.getCurrentTime !== 'function') return;
    ytTimeTicker = setInterval(() => {
      const current = ytPlayer.getCurrentTime();
      const duration = ytPlayer.getDuration();
      updateTimeDisplay(current, duration);
    }, 250);
  }

  function stopYouTubeTimeUpdates(){
    if (!ytTimeTicker) return;
    clearInterval(ytTimeTicker);
    ytTimeTicker = null;
  }

  function onYouTubeStateChange(event){
    if (!wrap) return;
    if (event.data === YT.PlayerState.PLAYING){
      wrap.classList.add('playing');
      writeState({ enabled: true });
    }
    if (event.data === YT.PlayerState.PAUSED || event.data === YT.PlayerState.ENDED){
      wrap.classList.remove('playing');
      if (event.data === YT.PlayerState.ENDED){
        writeState({ enabled: false });
      }
    }
  }

  function createYouTubePlayer(){
    if (!YOUTUBE_VIDEO_ID) return Promise.reject(new Error('Invalid YouTube source'));
    if (ytPlayer) return Promise.resolve(ytPlayer);
    if (!ytContainer) return Promise.reject(new Error('YouTube container missing'));

    return ensureYouTubeAPI().then(() => new Promise((resolve, reject) => {
      ytPlayer = new YT.Player('ytAudioIframe', {
        height: '0',
        width: '0',
        videoId: YOUTUBE_VIDEO_ID,
        playerVars: {
          autoplay: 0,
          controls: 0,
          modestbranding: 1,
          rel: 0,
          loop: 1,
          playlist: YOUTUBE_VIDEO_ID,
          enablejsapi: 1,
          origin: location.origin
        },
        events: {
          onReady: () => {
            if (typeof ytPlayer.setVolume === 'function'){
              ytPlayer.setVolume(Math.round(TARGET_VOL * 100));
            }
            startYouTubeTimeUpdates();
            resolve(ytPlayer);
          },
          onStateChange: event => {
            if (event.data === YT.PlayerState.ENDED){
              if (typeof ytPlayer.playVideo === 'function'){
                ytPlayer.playVideo();
              }
            }
            onYouTubeStateChange(event);
          }
        }
      });
    }));
  }

  function fadeTo(target, ms, onDone){
    cancelAnimationFrame(fadeRAF);
    if (ms <= 0){
      audio.volume = Math.min(1, Math.max(0, target));
      if (onDone) onDone();
      return;
    }
    const start = audio.volume;
    const delta = target - start;
    const t0 = performance.now();
    (function step(now){
      const p = Math.min(1, Math.max(0, (now - t0) / ms));
      const eased = start + delta * (p * (2 - p));
      audio.volume = Math.min(1, Math.max(0, eased));
      if (p < 1){
        fadeRAF = requestAnimationFrame(step);
      } else if (onDone){
        onDone();
      }
    })(t0);
  }

  function play(onRejected){
    if (IS_YOUTUBE){
      createYouTubePlayer().then(player => {
        if (typeof player.setVolume === 'function'){
          player.setVolume(Math.round(TARGET_VOL * 100));
        }
        if (typeof player.playVideo === 'function'){
          player.playVideo();
        }
      }).catch(() => {
        if (typeof onRejected === 'function') onRejected();
      });
      return;
    }

    audio.volume = 0;
    const attempt = audio.play();
    if (attempt && attempt.then){
      attempt.then(() => {
        wrap && wrap.classList.add('playing');
        fadeTo(TARGET_VOL, FADE_MS);
        writeState({ enabled: true });
      }).catch(() => {
        wrap && wrap.classList.remove('playing');
        if (typeof onRejected === 'function') onRejected();
      });
    } else {
      wrap && wrap.classList.add('playing');
      fadeTo(TARGET_VOL, FADE_MS);
      writeState({ enabled: true });
    }
  }

  function pause(explicit){
    if (IS_YOUTUBE){
      if (ytPlayer && typeof ytPlayer.pauseVideo === 'function'){
        ytPlayer.pauseVideo();
      }
      wrap && wrap.classList.remove('playing');
      if (explicit) writeState({ enabled: false });
      return;
    }

    fadeTo(0, FADE_MS, () => audio.pause());
    wrap && wrap.classList.remove('playing');
    if (explicit) writeState({ enabled: false });
  }

  function startFromBeginning(onRejected){
    if (IS_YOUTUBE){
      createYouTubePlayer().then(player => {
        if (typeof player.seekTo === 'function'){
          player.seekTo(0, true);
        }
        play(onRejected);
      }).catch(() => {
        if (typeof onRejected === 'function') onRejected();
      });
      return;
    }

    function resetAndPlay(){
      audio.currentTime = 0;
      play(onRejected);
    }
    if (audio.readyState >= 1){
      resetAndPlay();
    } else {
      audio.addEventListener('loadedmetadata', resetAndPlay, { once: true });
    }
  }

  function unlockAudio(){
    if (audioUnlocked) return;
    audioUnlocked = true;
    if (IS_YOUTUBE){
      createYouTubePlayer().then(player => {
        if (typeof player.playVideo === 'function'){
          player.playVideo();
        }
        setTimeout(() => {
          if (player && typeof player.pauseVideo === 'function'){
            player.pauseVideo();
          }
        }, 200);
      }).catch(() => {
        audioUnlocked = false;
      });
      return;
    }

    const restoreVol = audio.volume;
    audio.volume = 0;
    const attempt = audio.play();
    const rewind = () => { audio.pause(); audio.currentTime = 0; audio.volume = restoreVol; };
    if (attempt && attempt.then){
      attempt.then(rewind).catch(() => { audioUnlocked = false; });
    } else {
      rewind();
    }
  }

  window.__unlockAudio = unlockAudio;

  function isYouTubePlaying(){
    return !!(ytPlayer && typeof ytPlayer.getPlayerState === 'function' && ytPlayer.getPlayerState() === YT.PlayerState.PLAYING);
  }

  function armMusicRetry(){
    if (saved && saved.enabled === false) return;
    const RETRY_EVENTS = ['pointerdown', 'mousedown', 'touchstart', 'keydown'];
    function onRetryGesture(e){
      const targetIsPlayButton = playBtn && e.target && e.target.closest && e.target.closest('#trackPlayBtn');
      if (targetIsPlayButton) return;
      if (IS_YOUTUBE && isYouTubePlaying()) return;
      if (!IS_YOUTUBE && !audio.paused) return;
      RETRY_EVENTS.forEach(ev => document.removeEventListener(ev, onRetryGesture, true));
      startFromBeginning(armMusicRetry);
    }
    RETRY_EVENTS.forEach(ev => document.addEventListener(ev, onRetryGesture, { capture:true, passive:true }));
  }

  window.__startBackgroundMusic = function(){
    if (IS_YOUTUBE){
      startFromBeginning(armMusicRetry);
      return;
    }
    if (audio.paused) startFromBeginning(armMusicRetry);
  };

  if (!IS_YOUTUBE){
    audio.addEventListener('loadedmetadata', () => {
      durEl && (durEl.textContent = fmt(audio.duration));
    });
    audio.addEventListener('timeupdate', () => {
      if (scrubbing) return;
      updateTimeDisplay(audio.currentTime, audio.duration);
    });
    audio.addEventListener('ended', () => {
      wrap && wrap.classList.remove('playing');
      writeState({ enabled: false });
    });
  }

  window.addEventListener('beforeunload', () => {
    writeState({ enabled: IS_YOUTUBE ? isYouTubePlaying() : !audio.paused });
  });
  document.addEventListener('visibilitychange', () => {
    if (document.hidden) writeState({ enabled: IS_YOUTUBE ? isYouTubePlaying() : !audio.paused });
  });

  function seekFromEvent(e){
    if (!scrub) return;
    const r = scrub.getBoundingClientRect();
    const clientX = e.touches ? e.touches[0].clientX : e.clientX;
    const pct = Math.min(1, Math.max(0, (clientX - r.left) / r.width));
    if (!IS_YOUTUBE && audio.duration){
      audio.currentTime = pct * audio.duration;
    }
    scrubFill && (scrubFill.style.width = `${pct * 100}%`);
  }

  if (scrub){
    scrub.addEventListener('pointerdown', e => { scrubbing = true; seekFromEvent(e); });
    window.addEventListener('pointermove', e => { if (scrubbing) seekFromEvent(e); });
    window.addEventListener('pointerup', () => { scrubbing = false; });
    scrub.addEventListener('keydown', e => {
      if (!audio.duration) return;
      if (e.key === 'ArrowRight') audio.currentTime = Math.min(audio.duration, audio.currentTime + 5);
      if (e.key === 'ArrowLeft') audio.currentTime = Math.max(0, audio.currentTime - 5);
    });
  }

  playBtn && playBtn.addEventListener('click', () => {
    const playing = IS_YOUTUBE ? isYouTubePlaying() : !audio.paused;
    if (!playing) play(); else pause(true);
  });

  if (AUTO_START && (!saved || saved.enabled !== false)){
    const GESTURE_EVENTS = ['pointerdown', 'mousedown', 'touchstart', 'touchend', 'click', 'keydown'];
    let armed = true;
    function disarm(){
      armed = false;
      GESTURE_EVENTS.forEach(ev => document.removeEventListener(ev, onFirstInteraction, true));
    }
    function rearm(){
      armed = true;
      GESTURE_EVENTS.forEach(ev => document.addEventListener(ev, onFirstInteraction, { capture:true, passive:true }));
    }
    function onFirstInteraction(e){
      if (!armed) return;
      disarm();
      const targetIsPlayButton = playBtn && e.target && e.target.closest && e.target.closest('#trackPlayBtn');
      if (targetIsPlayButton) return;
      startFromBeginning(rearm);
    }
    GESTURE_EVENTS.forEach(ev => document.addEventListener(ev, onFirstInteraction, { capture:true, passive:true }));
  }

  if (saved && saved.enabled === true && !audio.paused){
    if (IS_YOUTUBE){
      startFromBeginning();
    } else {
      play();
    }
  }
})();
