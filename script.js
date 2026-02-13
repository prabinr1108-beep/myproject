// script.js - sequences the unfold -> write -> zoom animations and loads Instagram embed

(function(){
  // Load Instagram embed script (only once)
  function loadInstagramEmbed() {
    if (window.instgrm) return Promise.resolve();
    return new Promise((resolve) => {
      const s = document.createElement('script');
      s.src = "https://www.instagram.com/embed.js";
      s.async = true;
      s.onload = () => {
        if (window.instgrm && window.instgrm.Embeds && window.instgrm.Embeds.process) {
          window.instgrm.Embeds.process();
        }
        resolve();
      };
      document.body.appendChild(s);
    });
  }

  // Utility: wait ms
  function wait(ms){ return new Promise(r => setTimeout(r, ms)); }

  // Sequence: unfold -> handwriting reveal -> zoom
  async function playSequence() {
    const paper = document.getElementById('paper');
    const phone = document.querySelector('.phone-frame');
    const maskRect = document.getElementById('maskRect');

    // read durations from computed styles (in ms)
    const cs = getComputedStyle(document.documentElement);
    const parse = s => {
      if (!s) return 0;
      if (s.endsWith('ms')) return parseFloat(s);
      if (s.endsWith('s')) return parseFloat(s) * 1000;
      return parseFloat(s);
    };
    const unfoldD = parse(cs.getPropertyValue('--unfold-duration')) || 900;
    const writeD = parse(cs.getPropertyValue('--write-duration')) || 1200;
    const pauseD = parse(cs.getPropertyValue('--pause-after-write')) || 400;
    const zoomD = parse(cs.getPropertyValue('--zoom-duration')) || 700;

    // ensure instagram is loaded (non-blocking)
    loadInstagramEmbed().catch(()=>{ /* ignore */ });

    // reset state
    paper.classList.remove('unfolded');
    phone.classList.remove('zoomed');
    maskRect.setAttribute('width', 0);

    // 1) unfold
    paper.classList.add('folded'); // ensure starting
    await wait(60); // allow style paint
    paper.classList.remove('folded');
    paper.classList.add('unfolded');
    await wait(unfoldD + 40);

    // 2) handwriting reveal (animate mask width 0 -> full)
    // Determine full width available in SVG viewBox coordinates
    const svg = document.querySelector('.handwriting');
    const vb = svg.viewBox.baseVal;
    const fullW = vb.width || 600;
    // animate via requestAnimationFrame for smooth progress
    const start = performance.now();
    await new Promise((resolve) => {
      function step(now){
        const t = Math.min(1, (now - start) / writeD);
        const eased = t; // linear for handwriting; change easing if needed
        const w = fullW * eased;
        maskRect.setAttribute('width', w);
        if (t < 1) requestAnimationFrame(step);
        else resolve();
      }
      requestAnimationFrame(step);
    });

    await wait(pauseD);

    // 3) zoom
    phone.classList.add('zoomed');
    await wait(zoomD + 40);

    // leave final state visible
  }

  // Hook up UI
  document.addEventListener('DOMContentLoaded', () => {
    document.getElementById('playSequence').addEventListener('click', playSequence);

    // Auto-play on first page load for preview (optional)
    setTimeout(() => {
      // playSequence(); // disabled by default to avoid surprising users
    }, 700);
  });
})();