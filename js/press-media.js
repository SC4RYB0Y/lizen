/* Lightweight press-card media and slideshow support
   - Wraps existing <img> and <video> elements inside each .press-card
   - If more than one media element exists, shows prev/next controls
   - Videos keep native controls (user may enable sound)
*/
(function(){
  function initPressMedia(){
    const cards = document.querySelectorAll('.press-card');
    cards.forEach(card=>{
      const mediaEls = Array.from(card.querySelectorAll('img, video'));
      if (!mediaEls.length) return;
      // Create container
      const mediaWrap = document.createElement('div');
      mediaWrap.className = 'press-media';
      // Move media into slides
      mediaEls.forEach((el, i)=>{
        const slide = document.createElement('div');
        slide.className = 'media-slide';
        if (i===0) slide.classList.add('active');
        const bloomOnly = el.dataset.bloomOnly === 'true';
        const mainOnly = el.dataset.mainOnly === 'true';
        slide.hidden = bloomOnly || (mainOnly && document.documentElement.classList.contains('bloom-page-active'));
        // Ensure videos have controls and reasonable sizing
        if (el.tagName.toLowerCase() === 'video'){
          el.setAttribute('controls','');
          el.setAttribute('preload','metadata');
          el.style.maxWidth = '100%';
          el.style.height = 'auto';
        }
        slide.appendChild(el);
        mediaWrap.appendChild(slide);
      });
      // Insert the media wrap before the caption if present, else at top
      const cap = card.querySelector('.cap');
      if (cap) card.insertBefore(mediaWrap, cap);
      else card.insertBefore(mediaWrap, card.firstChild);

      const slides = mediaWrap.querySelectorAll('.media-slide');
      if (slides.length <= 1) return; // no controls needed

      // Add controls
      const prev = document.createElement('button');
      prev.className = 'press-slide-prev';
      prev.setAttribute('aria-label','Anterior');
      prev.innerHTML = '&#x2039;';
      const next = document.createElement('button');
      next.className = 'press-slide-next';
      next.setAttribute('aria-label','Próximo');
      next.innerHTML = '&#x203A;';
      card.appendChild(prev);
      card.appendChild(next);

      const hasVideo = mediaEls.some(el => el.tagName.toLowerCase() === 'video');
      let muted = true;
      const unmute = document.createElement('button');
      unmute.className = 'press-unmute';
      unmute.type = 'button';
      unmute.textContent = 'Som desligado';
      unmute.setAttribute('aria-label','Ativar som');
      if (hasVideo) card.appendChild(unmute);

      let idx = 0;
      const AUTOPLAY_DELAY = 4000; // ms
      let autoplayTimer = null;

      function isVisibleSlide(slide){ return !slide.hidden; }
      function firstVisibleIndex(){
        return Array.from(slides).findIndex(isVisibleSlide);
      }
      function nextVisibleIndex(current, direction){
        for (let step=1; step<=slides.length; step++){
          const candidate = (current + step * direction + slides.length) % slides.length;
          if (isVisibleSlide(slides[candidate])) return candidate;
        }
        return current;
      }

      function clearAutoplay(){ if (autoplayTimer) { clearInterval(autoplayTimer); autoplayTimer = null; } }
      function startAutoplay(){ clearAutoplay(); autoplayTimer = setInterval(()=>{ idx = nextVisibleIndex(idx, 1); show(idx); }, AUTOPLAY_DELAY); }

      function updateUnmuteState(){ if (!hasVideo) return; unmute.textContent = muted ? 'Som desligado' : 'Som ligado'; unmute.setAttribute('aria-label', muted ? 'Ativar som' : 'Desativar som'); }
      updateUnmuteState();

      unmute.addEventListener('click', ()=>{
        muted = !muted;
        const currentVideo = slides[idx].querySelector('video');
        if (currentVideo){ currentVideo.muted = muted; if (!muted) currentVideo.play().catch(()=>{}); }
        updateUnmuteState();
      });

      function show(i){
        if (!isVisibleSlide(slides[i])) i = firstVisibleIndex();
        if (i < 0) return;
        idx = i;
        slides.forEach((s,ii)=>{
          s.classList.toggle('active', ii===i);
          const v = s.querySelector('video');
          if (v){
            v.loop = true;
            v.muted = muted;
            v.playsInline = true;
            if (ii===i){
              try{ v.play().catch(()=>{}); }catch(e){}
            } else {
              try{ v.pause(); v.currentTime = 0; }catch(e){}
            }
          }
        });
      }

      prev.addEventListener('click', ()=>{ idx = nextVisibleIndex(idx, -1); show(idx); startAutoplay(); });
      next.addEventListener('click', ()=>{ idx = nextVisibleIndex(idx, 1); show(idx); startAutoplay(); });

      // Pause autoplay while user hovers or focuses the card
      card.addEventListener('mouseenter', ()=>{ clearAutoplay(); });
      card.addEventListener('mouseleave', ()=>{ startAutoplay(); });
      card.addEventListener('focusin', ()=>{ clearAutoplay(); });
      card.addEventListener('focusout', ()=>{ startAutoplay(); });

      document.addEventListener('bloom-media-change', () => {
        idx = firstVisibleIndex();
        show(idx);
        startAutoplay();
      });

      // start autoplay
      show(idx);
      startAutoplay();
    });
  }
  if (document.readyState === 'loading') document.addEventListener('DOMContentLoaded', initPressMedia);
  else initPressMedia();
})();
