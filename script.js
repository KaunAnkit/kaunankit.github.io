document.addEventListener('DOMContentLoaded', function () {

  /* ── LightRays ─────────────────────────────────────────────── */
  const lrMount = document.getElementById('light-rays-mount');
  if (lrMount && window.LightRays) {
    new window.LightRays(lrMount, {
      raysOrigin:     'top-center',
      raysColor:      '#00ffff',
      raysSpeed:      1.5,
      lightSpread:    1.0,
      rayLength:      1.5,
      followMouse:    true,
      mouseInfluence: 0.1,
      noiseAmount:    0.1,
      distortion:     0.05,
      pulsating:      false,
      fadeDistance:   1.2,
      saturation:     1.0,
    });
  }

  const yearEl = document.getElementById('footer-year');
  if (yearEl) yearEl.textContent = new Date().getFullYear();

  const navbar = document.getElementById('navbar');
  if (navbar) {
    window.addEventListener('scroll', () => {
      navbar.classList.toggle('scrolled', window.scrollY > 40);
    }, { passive: true });
  }

  function openModal(modal) {
    modal.classList.add('show');
    document.body.style.overflow = 'hidden';
  }

  function closeModal(modal) {
    modal.classList.remove('show');
    document.body.style.overflow = '';
  }

  const projectMap = {
    'tfidf-box':     'projectModal',
    'parchment-box': 'parchmentModal',
    'fifa-box':      'fifaModal',
  };

  document.querySelectorAll('.project-box').forEach(box => {
    box.addEventListener('click', () => {
      const modalId = projectMap[box.id];
      if (!modalId) return;
      const modal = document.getElementById(modalId);
      if (!modal) return;

      const boxImg   = box.querySelector('img');
      const modalImg = modal.querySelector('.project-modal-img');
      if (boxImg && modalImg) modalImg.src = boxImg.src;

      openModal(modal);
    });
  });

  document.querySelectorAll('.project-modal').forEach(modal => {
    const closeBtn = modal.querySelector('.close-project-modal');
    if (closeBtn) closeBtn.addEventListener('click', () => closeModal(modal));
    modal.addEventListener('click', (e) => {
      if (e.target === modal) closeModal(modal);
    });
  });

  const certModal    = document.getElementById('modal');
  const certModalImg = document.getElementById('modal-img');
  const certClose    = certModal?.querySelector('.close');

  document.querySelectorAll('.certificates img').forEach(img => {
    img.addEventListener('click', () => {
      if (!certModal || !certModalImg) return;
      certModalImg.src = img.src;
      certModalImg.alt = img.alt;
      openModal(certModal);
    });
  });

  if (certClose) certClose.addEventListener('click', () => closeModal(certModal));
  if (certModal) {
    certModal.addEventListener('click', (e) => {
      if (e.target === certModal) closeModal(certModal);
    });
  }

  // Escape key closes any open modal
  document.addEventListener('keydown', (e) => {
    if (e.key !== 'Escape') return;
    document.querySelectorAll('.modal.show, .project-modal.show').forEach(m => closeModal(m));
  });

  const LC_USER    = 'KaunAnkit';
  const LC_API     = `https://alfa-leetcode-api.onrender.com/${LC_USER}`;
  const CACHE_KEY  = 'lc_stats_cache';
  const CACHE_TTL  = 30 * 60 * 1000; // 30 minutes

  async function fetchLeetCodeStats() {
    try {
      const cached = sessionStorage.getItem(CACHE_KEY);
      if (cached) {
        const { data, ts } = JSON.parse(cached);
        if (Date.now() - ts < CACHE_TTL) {
          renderLeetCode(data);
          return;
        }
      }
    } catch (_) { /* ignore storage errors */ }

    try {
      const [solvedRes, profileRes] = await Promise.all([
        fetch(`${LC_API}/solved`),
        fetch(`${LC_API}`),
      ]);

      if (!solvedRes.ok || !profileRes.ok) throw new Error('API error');

      const solved  = await solvedRes.json();
      const profile = await profileRes.json();

      const data = {
        total:   solved.solvedProblem   ?? 0,
        easy:    solved.easySolved      ?? 0,
        medium:  solved.mediumSolved    ?? 0,
        hard:    solved.hardSolved      ?? 0,
        ranking: profile.ranking        ?? null,
      };

      try {
        sessionStorage.setItem(CACHE_KEY, JSON.stringify({ data, ts: Date.now() }));
      } catch (_) {}

      renderLeetCode(data);

    } catch (err) {
      console.warn('LeetCode stats fetch failed:', err);
      showLeetCodeError();
    }
  }

  function animateNumber(el, target) {
    const duration = 600;
    const start    = Date.now();
    const from     = 0;
    const tick = () => {
      const progress = Math.min((Date.now() - start) / duration, 1);
      const ease     = 1 - Math.pow(1 - progress, 3);
      el.textContent = Math.round(from + (target - from) * ease);
      if (progress < 1) requestAnimationFrame(tick);
    };
    requestAnimationFrame(tick);
  }

  function formatRank(n) {
    if (!n) return '—';
    if (n >= 1_000_000) return (n / 1_000_000).toFixed(1) + 'M';
    if (n >= 1_000)     return (n / 1_000).toFixed(1) + 'K';
    return String(n);
  }

  function renderLeetCode(data) {
    document.querySelectorAll('.lc-skeleton').forEach(el => {
      el.classList.remove('lc-skeleton');
    });

    const elTotal  = document.getElementById('lc-total');
    const elEasy   = document.getElementById('lc-easy');
    const elMedium = document.getElementById('lc-medium');
    const elHard   = document.getElementById('lc-hard');
    const elRank   = document.getElementById('lc-rank');

    if (elTotal)  animateNumber(elTotal,  data.total);
    if (elEasy)   animateNumber(elEasy,   data.easy);
    if (elMedium) animateNumber(elMedium, data.medium);
    if (elHard)   animateNumber(elHard,   data.hard);
    if (elRank)   elRank.textContent = formatRank(data.ranking);

    const barWrap = document.getElementById('lc-bar-wrap');
    if (barWrap && data.total > 0) {
      barWrap.style.display = 'block';
      document.getElementById('lc-bar-easy').style.width   = (data.easy   / data.total * 100) + '%';
      document.getElementById('lc-bar-medium').style.width = (data.medium / data.total * 100) + '%';
      document.getElementById('lc-bar-hard').style.width   = (data.hard   / data.total * 100) + '%';
    }

    const status = document.getElementById('lc-status');
    if (status) status.classList.add('live');
  }

  function showLeetCodeError() {
    document.querySelectorAll('.lc-skeleton').forEach(el => {
      el.classList.remove('lc-skeleton');
    });
    ['lc-total','lc-easy','lc-medium','lc-hard','lc-rank'].forEach(id => {
      const el = document.getElementById(id);
      if (el) el.closest('.cp-stat').style.display = 'none';
    });
    const err = document.getElementById('lc-error');
    if (err) err.style.display = 'block';
  }

  fetchLeetCodeStats();
  const calendarContainer = document.querySelector('.github-calendar');
  if (!calendarContainer) return;

  function styleCalendar() {
    const svg = calendarContainer.querySelector('svg');
    if (!svg) return;
    svg.style.overflow = 'visible';


    calendarContainer.querySelectorAll('a, p, h2, h3').forEach(el => {
      el.style.display = 'none';
    });

    const levelColors = {
      '0': '#1a1a1a',
      '1': '#1a3326',
      '2': '#1e5c3a',
      '3': '#2d8f55',
      '4': '#40c06a',
    };

    svg.querySelectorAll('rect.ContributionCalendar-day, rect.day').forEach(rect => {
      rect.setAttribute('rx', '2');
      rect.setAttribute('ry', '2');
      const level = rect.getAttribute('data-level') || '0';
      const color = levelColors[level] || levelColors['0'];
      rect.style.setProperty('fill', color, 'important');
      rect.setAttribute('fill', color);
    });
  }

  try {
    GitHubCalendar('.github-calendar', 'KaunAnkit', {
      responsive: true,
      tooltips: true,
      global_stats: false,
      summary_text: false,
    });

    const poll = setInterval(() => {
      if (calendarContainer.querySelector('svg')) {
        styleCalendar();
        clearInterval(poll);
      } else if (++attempts > 60) {
        clearInterval(poll);
      }
    }, 100);

  } catch (err) {
    console.error('GitHub Calendar failed:', err);
    calendarContainer.innerHTML =
      '<p style="color:#555;text-align:center;padding:20px;">Unable to load GitHub calendar.</p>';
  }
});