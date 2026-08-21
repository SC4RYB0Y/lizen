/* ============================================================
   APP — page-level bootstrap. Everything here is a cross-cutting
   concern that doesn't belong to one feature module: smooth
   scrolling, in-page anchor navigation, and the finale button.

   Loads early (right after config/utils/petals-engine) so `lenis`
   exists before navigation.js runs; references to things defined
   in later files (closeIndex, engine.burst) are safe because they
   only run inside event-listener callbacks, which fire long after
   every module has finished loading.

   RESILIENCE NOTE: gsap, ScrollTrigger and Lenis all load from a
   third-party CDN (see index.html). On mobile in particular that
   request can fail or stall — flaky data connections, in-app
   browsers, ad/tracker blockers on Safari and Android all block or
   delay third-party scripts far more often than on a desktop
   connection. If that happens, `gsap`/`Lenis` simply won't exist
   yet when this file runs. Without a guard, that throws here,
   which (since `lenis` never gets defined) cascades into every
   later file that touches it — most critically intro.js, which
   calls `lenis.start()` to release the scroll lock it starts with.
   A missing library must never be able to leave the site scroll-
   locked or otherwise stuck, so every use of an external library
   in this file is guarded, and `lenis` always ends up bound to
   *something* callable — either the real thing or a no-op shim.
============================================================ */
'use strict';

const libsReady = typeof gsap !== 'undefined' && typeof Lenis !== 'undefined';

if (libsReady){
  try {
    if (typeof ScrollTrigger !== 'undefined') gsap.registerPlugin(ScrollTrigger);
  } catch (err){
    console.warn('[app] ScrollTrigger failed to register — scroll-linked effects will be skipped.', err);
  }
}

// A tiny shim matching the surface area this project actually calls
// on `lenis` (start/stop/on/scrollTo/raf), so every other file can
// keep calling `lenis.start()` etc. unconditionally instead of every
// call site needing its own existence check. When Lenis genuinely
// isn't available, scrolling simply falls back to the browser's own
// native scroll — never blocked, never hijacked.
function createNoopLenis(){
  return {
    start(){}, stop(){}, on(){}, raf(){},
    scrollTo(target){
      const el = typeof target === 'string' ? document.querySelector(target) : target;
      if (el && el.scrollIntoView) el.scrollIntoView({ behavior:'smooth', block:'start' });
    }
  };
}

let lenis;
if (libsReady){
  try {
    lenis = new Lenis({ duration: 1.15, smoothTouch:false, touchMultiplier:1.4 });
    lenis.on('scroll', () => { if (typeof ScrollTrigger !== 'undefined') ScrollTrigger.update(); });
    gsap.ticker.add((t)=> lenis.raf(t*1000));
    gsap.ticker.lagSmoothing(0);
  } catch (err){
    console.warn('[app] Lenis failed to initialize — falling back to native scroll.', err);
    lenis = createNoopLenis();
  }
} else {
  console.warn('[app] gsap/Lenis unavailable (CDN blocked or slow) — running without smooth-scroll/animation libraries. The site remains fully usable via native scroll.');
  lenis = createNoopLenis();
}
window.lenis = lenis; // intro.js, navigation.js and scroll-reveal.js all read this
lenis.stop(); // released once the intro finishes (see intro.js) — or immediately by
              // intro.js's own fail-safe if the intro can't run at all

document.querySelectorAll('a[href^="#"]').forEach(a=>{
  a.addEventListener('click', e=>{
    const targetSel = a.getAttribute('href');
    if (!targetSel || targetSel === '#') return;
    e.preventDefault();
    if (document.documentElement.classList.contains('bloom-page-active') && a.closest('.bloom-page-nav')){
      const bloomTarget = document.querySelector(targetSel);
      if (bloomTarget) lenis.scrollTo(bloomTarget, {offset:0, duration:1.3});
      return;
    }
    const el = document.querySelector(targetSel);
    if (el) lenis.scrollTo(el, {offset:0, duration:1.3});
    if (typeof closeIndex === 'function') closeIndex();
  });
});

const bloomPageNav = document.getElementById('bloomPageNav');
const messageTitle = document.getElementById('messageTitle');
const heroLine = document.getElementById('heroLine');
const heroSub = document.getElementById('heroSub');
const heroName = document.getElementById('heroName');
const heroEyebrow = document.getElementById('heroEyebrow');
const galleryEyebrow = document.getElementById('galleryEyebrow');
const galleryDescription = document.getElementById('galleryDescription');
const memoryCount = document.getElementById('memoryCount');
const memoryCounterLabel = document.getElementById('memoryCounterLabel');
const letterContent = document.getElementById('letterContent');
const trackTitle = document.getElementById('trackTitle');
const playlistEyebrow = document.getElementById('playlistEyebrow');
const playlistTitle = document.getElementById('playlistTitle');
const playlistDescription = document.getElementById('playlistDescription');
const bloomTimeNotice = document.getElementById('bloomTimeNotice');
const closeBloomTimeNotice = document.getElementById('closeBloomTimeNotice');
const mainMessageTitle = messageTitle ? messageTitle.innerHTML : '';
const mainHeroLine = heroLine ? heroLine.textContent : '';
const mainHeroSub = heroSub ? heroSub.textContent : '';
const mainHeroName = heroName ? heroName.textContent : '';
const mainHeroEyebrow = heroEyebrow ? heroEyebrow.textContent : '';
const mainGalleryEyebrow = galleryEyebrow ? galleryEyebrow.textContent : '';
const mainGalleryDescription = galleryDescription ? galleryDescription.textContent : '';
const mainMemoryCount = memoryCount ? memoryCount.textContent : '0';
const mainMemoryCounterLabel = memoryCounterLabel ? memoryCounterLabel.textContent : '';
const mainLetterHTML = letterContent ? letterContent.innerHTML : '';
const mainTrackTitle = trackTitle ? trackTitle.innerHTML : '';
const mainPlaylistEyebrow = playlistEyebrow ? playlistEyebrow.textContent : '';
const mainPlaylistTitle = playlistTitle ? playlistTitle.innerHTML : '';
const mainPlaylistDescription = playlistDescription ? playlistDescription.textContent : '';
let bloomTransitionActive = false;
function setPressMedia(visible){
  document.querySelectorAll('.press-card [data-main-only="true"]').forEach(image => {
    const slide = image.closest('.media-slide');
    if (slide) slide.hidden = visible;
  });
  document.querySelectorAll('.press-card [data-bloom-only="true"]').forEach(image => {
    const slide = image.closest('.media-slide');
    if (slide) slide.hidden = !visible;
  });
  document.dispatchEvent(new CustomEvent('bloom-media-change'));
}
const bloomMessageTitle = [
  'Todo bom soldado merece ter uma boa comandante,',
  'eu não sou davi pergunta na minha cidade eu sou gigante...',
  'mas eu amo os meus cristais e para mim és diamante,',
  'diamente everyday, tu para mim és diamante,',
  'eu te amo and everyway eu só não sou um bom amante,',
  'eu fui burro? Eu não sei, eu só sei sobre esse instante'
].join('<br>');
const bloomLetterHTML = `
      <p><span class="letter-drop">V</span>ocê é a melhor coisa que me aconteceu desde que te conheci.
        Todos os dias eu sou muito grato a Deus so saber que você existe na minha vida —
        e, honestamente, tu és o maior presente que já recebi ate agora.
      </p>
      <p>
        Hoje é nosso primeiro aniversário, quero que você saiba que
        <mark>nenhuma palavra é suficiente</mark>
        para descrever tudo que eu sinto at this moment,
        por saber que tu me aceitaste como teu <mark>namorado</mark> já há um ano.
      </p>
      <p>
        Senti frio, quando foste não foi facil,
        <br>espero que saibas que eu te amo.
        <br>É dificil ter te longe eu aqui e tu ai.
        <br>Amor tu sabes! não vou explicar,
        <br>amor tu foste, e eu fiquei, a tua espera mas....
      </p>
      <p>
        Enfim, poderia ficar aqui a escrever ate...
        <br>Desculpa qualquer coisa, eu sei que é um pouco triste
        <br>Completarmos 1 ano hoje e eu não tenho nada
        <br>para te dar Infelizmente
        <br>Gostaria de te dar muitos presentes
        <br>alusivo ao nossso primeiro aniversario
        <br>Mas acredita ainda seremos muito felizes juntos
        <br>e presentes não faltarão
        <br>Eu apenas peço paciencia amor,
        <br>o jogo ainda vai virar
        — <mark>I LOVE YOU, SO MUCH.</mark>
      </p>
      <p><h3><mark>Me desculpe por tudo...</mark></h3></p>
      <div class="letter-sign">
        <span class="who">Com todo meu amor</span>
        <span class="from">Jeffrey</span>
      </div>`;
function setBloomPageVisible(visible){
  document.documentElement.classList.toggle('bloom-page-active', visible);
  if (bloomPageNav) bloomPageNav.setAttribute('aria-hidden', String(!visible));
  if (messageTitle) messageTitle.innerHTML = visible ? bloomMessageTitle : '';
  if (messageTitle && !visible) messageTitle.innerHTML = mainMessageTitle;
  if (heroLine) heroLine.textContent = visible
    ? 'Foi numa Quinta-feira exatamente no dia 21 de agosto de 2025 em que você se tornou a razão pela qual meus dias fazem sentido. Hoje, eu sou feliz por comemorar 1 ano desde o o tal acontecimento.'
    : mainHeroLine;
  if (heroSub){
    heroSub.textContent = visible ? 'Marlize + Jeffrey <3' : mainHeroSub;
    heroSub.hidden = false;
  }
  if (heroName) heroName.textContent = visible ? 'MJ' : mainHeroName;
  if (heroEyebrow) heroEyebrow.textContent = visible ? '' : mainHeroEyebrow;
  if (galleryEyebrow) galleryEyebrow.textContent = visible ? 'Coleção de espécies' : mainGalleryEyebrow;
  if (galleryDescription) galleryDescription.textContent = visible
    ? 'Cinco dos ultimos momentos que estivemos juntos, que vou lembrar na memoria'
    : mainGalleryDescription;
  if (memoryCount) memoryCount.textContent = visible ? '5' : mainMemoryCount;
  if (memoryCounterLabel) memoryCounterLabel.textContent = visible ? 'memórias, lindas' : mainMemoryCounterLabel;
  if (letterContent) letterContent.innerHTML = visible ? bloomLetterHTML : mainLetterHTML;
  if (trackTitle) trackTitle.innerHTML = visible ? 'Diamante &lt;3' : mainTrackTitle;
  if (playlistEyebrow) playlistEyebrow.textContent = visible ? 'Trilha sonora' : mainPlaylistEyebrow;
  if (playlistTitle) playlistTitle.textContent = visible ? 'Uma canção que dedico a ti' : '';
  if (playlistTitle && !visible) playlistTitle.innerHTML = mainPlaylistTitle;
  if (playlistDescription) playlistDescription.textContent = visible ? 'A faixa é essa' : mainPlaylistDescription;
  setPressMedia(visible);
  document.querySelectorAll('[data-bloom-src]').forEach(image => {
    if (visible){
      if (!image.dataset.mainSrc) image.dataset.mainSrc = image.src;
      image.src = image.dataset.bloomSrc;
    } else if (image.dataset.mainSrc){
      image.src = image.dataset.mainSrc;
    }
  });
  if (typeof window.setBloomAudio === 'function') window.setBloomAudio(visible);
}

/* ---- finale confetti — also seeds a burst into the petal engine ---- */
function triggerCelebration(event, multiplier=1, intense=false){
  try {
    if (typeof confetti === 'function'){
      const colors = [CONFIG.colors.rose, CONFIG.colors.roseSoft, CONFIG.colors.gold, CONFIG.colors.roseBright];
      const ticks = intense ? 420 : 200;
      const speed = intense ? 1.35 : 1;
      const count = intense ? multiplier * 1.4 : multiplier;
      confetti({ particleCount: 120*count, spread: 100, startVelocity: 36*speed, gravity:intense ? .55 : .7, scalar:1.1, ticks, colors, origin:{y:.7} });
      confetti({ particleCount: 50*count, spread: 140, startVelocity: 20*speed, gravity:intense ? .4 : .5, scalar:.8, ticks, colors, origin:{y:.6}, angle:60 });
      confetti({ particleCount: 50*count, spread: 140, startVelocity: 20*speed, gravity:intense ? .4 : .5, scalar:.8, ticks, colors, origin:{y:.6}, angle:120 });
    }
    if (typeof engine !== 'undefined' && engine.burst){
      const r = event.currentTarget.getBoundingClientRect();
      engine.burst(r.left+r.width/2, r.top, 22*multiplier, {
        spread:Math.PI*1.4,
        minSpeed:intense ? 2.7 : 2,
        maxSpeed:intense ? 8 : 6,
        gravity:intense ? .07 : .1,
        maxLife:intense ? 7000 : 5200
      });
    }
  } catch (err){
    console.warn('[app] finale celebration effect failed — non-fatal.', err);
  }
}

const confettiBtn = document.getElementById('confettiBtn');
if (confettiBtn) confettiBtn.addEventListener('click', event => triggerCelebration(event));

const bloomBtn = document.getElementById('bloomBtn');
if (bloomBtn){
  bloomBtn.addEventListener('click', event => {
    if (bloomTransitionActive) return;
    bloomTransitionActive = true;
    event.preventDefault();
    document.documentElement.classList.add('bloom-overload');
    triggerCelebration(event, 5, true);
    window.setTimeout(() => {
      const bloomAvailable = typeof CONFIG !== 'undefined'
        && CONFIG.countdown.exactDate
        && new Date() >= CONFIG.countdown.exactDate;
      if (bloomAvailable){
        lenis.stop();
        window.scrollTo(0, 0);
        document.documentElement.scrollTop = 0;
        document.body.scrollTop = 0;
        setBloomPageVisible(true);
        requestAnimationFrame(() => {
          window.scrollTo(0, 0);
          lenis.scrollTo(0, {immediate:true});
          lenis.start();
        });
      } else if (bloomTimeNotice){
        bloomTimeNotice.classList.add('open');
        bloomTimeNotice.setAttribute('aria-hidden', 'false');
        if (closeBloomTimeNotice) closeBloomTimeNotice.focus();
      }
      document.documentElement.classList.remove('bloom-overload');
      bloomTransitionActive = false;
    }, 7000);
  });
}

if (closeBloomTimeNotice){
  closeBloomTimeNotice.addEventListener('click', () => {
    bloomTimeNotice.classList.remove('open');
    bloomTimeNotice.setAttribute('aria-hidden', 'true');
    if (bloomBtn) bloomBtn.focus();
  });
}
