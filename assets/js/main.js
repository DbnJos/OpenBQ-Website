/* openbq.io — site interactions (vanilla JS, no dependencies) */
(function () {
  'use strict';

  document.documentElement.classList.remove('no-js');
  const reduceMotion = window.matchMedia('(prefers-reduced-motion: reduce)').matches;
  const $ = (s, el = document) => el.querySelector(s);
  const $$ = (s, el = document) => Array.from(el.querySelectorAll(s));

  /* ---------- Header: scrolled state + mobile nav ---------- */
  const header = $('.site-header');
  const onScroll = () => header && header.classList.toggle('is-scrolled', window.scrollY > 8);
  window.addEventListener('scroll', onScroll, { passive: true });
  onScroll();

  const toggle = $('.nav-toggle');
  const nav = $('#site-nav');
  if (toggle && nav) {
    const setOpen = (open) => {
      nav.classList.toggle('is-open', open);
      toggle.setAttribute('aria-expanded', String(open));
      toggle.setAttribute('aria-label', open ? 'Close menu' : 'Open menu');
    };
    toggle.addEventListener('click', () => setOpen(toggle.getAttribute('aria-expanded') !== 'true'));
    $$('a', nav).forEach((a) => a.addEventListener('click', () => setOpen(false)));
    document.addEventListener('keydown', (e) => { if (e.key === 'Escape') setOpen(false); });
  }

  /* ---------- Current page in nav ---------- */
  const page = (location.pathname.split('/').pop() || 'index.html').toLowerCase();
  $$('#site-nav a').forEach((a) => {
    const href = (a.getAttribute('href') || '').split('#')[0].toLowerCase();
    if (href === page || (page === '' && href === 'index.html')) a.setAttribute('aria-current', 'page');
  });

  /* ---------- Accessible tabs (any [role=tablist]) ---------- */
  $$('[role="tablist"]').forEach((list) => {
    const tabs = $$('[role="tab"]', list);
    // const select = (tab, focus) => {
    //   tabs.forEach((t) => {
    //     const on = t === tab;
    //     t.setAttribute('aria-selected', String(on));
    //     t.tabIndex = on ? 0 : -1;
    //     const panel = document.getElementById(t.getAttribute('aria-controls'));
    //     if (panel) panel.hidden = !on;
    //   });
      const select = (tab, focus) => {
      const activePanel = tab.getAttribute('aria-controls');
      tabs.forEach((t) => {
        const on = t === tab;
        t.setAttribute('aria-selected', String(on));
        t.tabIndex = on ? 0 : -1;
        const id = t.getAttribute('aria-controls');
        const panel = document.getElementById(id);
        if (panel) panel.hidden = id !== activePanel; // tabs may share one panel
      });
      if (focus) tab.focus();
      list.dispatchEvent(new CustomEvent('tabchange', { detail: { tab } }));
    };
    tabs.forEach((t, i) => {
      t.addEventListener('click', () => select(t));
      t.addEventListener('keydown', (e) => {
        let n = null;
        if (e.key === 'ArrowRight') n = tabs[(i + 1) % tabs.length];
        if (e.key === 'ArrowLeft') n = tabs[(i - 1 + tabs.length) % tabs.length];
        if (e.key === 'Home') n = tabs[0];
        if (e.key === 'End') n = tabs[tabs.length - 1];
        if (n) { e.preventDefault(); select(n, true); }
      });
    });
    // Deep link: #panel-id selects its tab
    const hashTab = location.hash && tabs.find((t) => '#' + t.getAttribute('aria-controls') === location.hash);
    select(hashTab || tabs.find((t) => t.getAttribute('aria-selected') === 'true') || tabs[0]);
  });

  // /* ---------- Quality scanner demo (illustrative values) ---------- */
  // const scanner = $('#scanner');
  // if (scanner) {
  //   const data = {
  //     face: { score: 87, verdict: 'Good — accept', meta: 'Example: OFIQ · ISO/IEC 29794-5', icon: 'assets/img/icons/icon-face.svg',
  //       metrics: [['Illumination', 82], ['Head pose', 91], ['Sharpness', 58], ['Expression', 76]] },
  //     fingerprint: { score: 64, verdict: 'Fair — consider re-capture', meta: 'Example: NFIQ 2.0 · ISO/IEC 29794-4', icon: 'assets/img/icons/icon-fingerprint.svg',
  //       metrics: [['Ridge clarity', 61], ['Contrast', 72], ['Completeness', 48], ['Orientation', 80]] },
  //     iris: { score: 92, verdict: 'Excellent — accept', meta: 'Example: ISO/IEC 29794-6 metrics', icon: 'assets/img/icons/icon-iris.svg',
  //       metrics: [['Sharpness', 94], ['Usable area', 89], ['Pupil contrast', 90], ['Gaze', 86]] },
  //     voice: { score: 71, verdict: 'Good — monitor noise', meta: 'Example: signal quality metrics', icon: 'assets/img/icons/icon-voice.svg',
  //       metrics: [['Signal-to-noise', 63], ['Clipping', 88], ['Duration', 79], ['Reverberation', 57]] }
  //   };
  //   const ring = $('.score-ring .value', scanner);
  //   const out = $('.score-ring output', scanner);
  //   const C = 2 * Math.PI * 40; // r = 40
  //   ring.style.strokeDasharray = C;
  //   const render = (key) => {
  //     const d = data[key];
  //     $('.scanner-sample img', scanner).src = d.icon;
  //     $('.score-verdict', scanner).textContent = d.verdict;
  //     $('.score-meta', scanner).textContent = d.meta;
  //     ring.style.strokeDashoffset = C * (1 - d.score / 100);
  //     countTo(out, d.score, 900);
  //     const list = $('.metrics', scanner);
  //     list.innerHTML = '';
  //     d.metrics.forEach(([name, v]) => {
  //       const li = document.createElement('li');
  //       li.className = 'metric';
  //       li.innerHTML = `<div class="metric-head"><span>${name}</span><span>${v}</span></div><div class="metric-bar" role="img" aria-label="${name} ${v} out of 100"><span class="${v < 60 ? 'is-warn' : ''}"></span></div>`;
  //       list.appendChild(li);
  //       requestAnimationFrame(() => requestAnimationFrame(() => { $('.metric-bar span', li).style.width = v + '%'; }));
  //     });
  //   };
  //   $('[role="tablist"]', scanner).addEventListener('tabchange', (e) => render(e.detail.tab.dataset.modality));
  //   render('face');
  // }

  /* ---------- Count-up numbers ---------- */
  function countTo(el, target, ms) {
    if (reduceMotion) { el.textContent = target; return; }
    const start = performance.now();
    const from = parseInt(el.textContent, 10) || 0;
    const step = (t) => {
      const p = Math.min(1, (t - start) / ms);
      el.textContent = Math.round(from + (target - from) * (1 - Math.pow(1 - p, 3)));
      if (p < 1) requestAnimationFrame(step);
    };
    requestAnimationFrame(step);
  }

  /* ---------- Sample assessment (hero) ----------
     Face + iris: from BQAT v1.6.4-beta EDA reports (10 images each).
     Fingerprint + voice: sample results supplied by the openbq team.
     Iris recommended values are those stated in the BQAT iris report. */
  const scanner = $('#scanner');
  if (scanner) {
    const iris = (id, q, iso, gs, conc, ipc, ratio, isc, usable) => ({
      id, score: q, headline: `ISO overall quality: ${q}`, meta: 'BIQT overall quality score (0–100)',
      metrics: [
        { name: 'Greyscale utilisation', value: gs.toFixed(2), note: 'Recommended ≥ 6', ok: gs >= 6 },
        { name: 'Iris–pupil concentricity', value: conc.toFixed(1), note: 'Recommended ≥ 90', ok: conc >= 90 },
        { name: 'Iris–pupil contrast', value: ipc.toFixed(1), note: 'Recommended ≥ 30', ok: ipc >= 30 },
        { name: 'Iris–pupil ratio', value: ratio.toFixed(1), note: 'Recommended 20–70', ok: ratio >= 20 && ratio <= 70 },
        { name: 'Iris–sclera contrast', value: isc.toFixed(1), note: 'Recommended > 5', ok: isc > 5 },
        { name: 'Usable iris area', value: usable + '%', bar: usable }
      ]
    });
    const finger = (id, q, ridge, minutiae, contrast, dpi, ts) => ({
      id, score: q, headline: `Captured at ${dpi}`, meta: ts,
      metrics: [
        { name: 'Ridge clarity', value: ridge, bar: ridge },
        { name: 'Contrast', value: contrast, bar: contrast },
        { name: 'Minutiae count', value: minutiae }
      ]
    });
    const voice = (id, q, noise, disc, col, loud, nat) => ({
      id, score: q, headline: `Loudness: ${loud} dB`, meta: 'Overall speech quality',
      metrics: [
        { name: 'Naturalness', value: nat, bar: nat },
        { name: 'Coloration', value: col, bar: col },
        { name: 'Noisiness', value: noise, bar: noise, note: 'Lower is better' },
        { name: 'Discontinuity', value: disc, bar: disc, note: 'Lower is better' }
      ]
    });

    const data = {
      iris: {
        icon: 'assets/img/icons/icon-iris.svg',
        source: 'Sample results · BQAT v1.6.4 · recommended values from the BQAT report',
        samples: [
          iris('IRIS-03', 91, 100, 6.605, 96.12, 83.94, 40.78, 31.22, 91),
          iris('IRIS-00', 69, 100, 6.768, 94.74, 82.63, 41.05, 29.13, 95),
          iris('IRIS-09', 69, 100, 7.361, 93.34, 83.02, 43.16, 40.00, 99),
          iris('IRIS-07', 55, 100, 6.608, 96.56, 83.26, 41.30, 33.33, 92),
          iris('IRIS-04', 64, 90, 7.263, 88.49, 83.36, 42.55, 39.70, 97),
          iris('IRIS-08', 18, 100, 7.413, 87.74, 82.00, 45.24, 39.33, 95)
        ]
      },
      fingerprint: {
        icon: 'assets/img/icons/icon-fingerprint.svg',
        source: 'Sample results',
        samples: [
          finger('FP001', 89, 85, 42, 76, '500 dpi', '2024-11-20 10:23:45'),
          finger('FP002', 76, 72, 38, 68, '500 dpi', '2024-11-20 10:24:12')
        ]
      },
        face: {
        icon: 'assets/img/icons/icon-face.svg',
        source: 'Dataset summary · 10 images · BQAT v1.6.4 fusion engine (BQAT + OFIQ)',
        summary: {
          label: 'Unified quality score (OFIQ, native scale)', value: '25.5', meta: 'Mean · range 21.4 – 28.4',
          metrics: [
            { name: 'Face detection confidence', value: '0.86', note: 'Mean · range 0.75 – 0.91' },
            { name: 'Inter-pupillary distance', value: '68 px', note: 'Mean · range 60 – 76 px' },
            { name: 'Head pose — yaw', value: '−1.9°', note: 'Mean · range −5.1° to 1.5°' },
            { name: 'Head pose — pitch', value: '−8.3°', note: 'Mean · range −31.1° to 23.0°' },
            { name: 'Illumination uniformity (OFIQ)', value: '0.52', note: 'Mean · range 0.08 – 0.77' },
            { name: 'Eyes closed · smiling', value: '0 · 2', note: 'Images out of 10' }
          ]
        }
      },
      voice: {
        icon: 'assets/img/icons/icon-voice.svg',
        source: 'Sample results',
        samples: [
          voice('V001', 90, 12, 8, 85, 72, 88),
          voice('V002', 75, 28, 18, 68, 65, 72),
          voice('V003', 93, 8, 5, 92, 78, 91),
          voice('V004', 68, 35, 25, 62, 58, 65)
        ]
      }
    };

    const ring = $('.score-ring', scanner);
    const ringValue = $('.score-ring .value', scanner);
    const out = $('.score-ring output', scanner);
    const chips = $('.sample-chips', scanner);
    const list = $('.metrics', scanner);
    const C = 2 * Math.PI * 40; // r = 40
    ringValue.style.strokeDasharray = C;

    const renderMetrics = (metrics) => {
      list.innerHTML = '';
      metrics.forEach((m) => {
        const li = document.createElement('li');
        li.className = 'metric';
        const status = m.ok === undefined ? '' :
          `<span class="status ${m.ok ? 'is-ok' : 'is-low'}">${m.ok ? 'Meets' : 'Below'}</span>`;
        li.innerHTML =
          `<div class="metric-head"><span>${m.name}</span><span class="metric-val">${m.value}${status}</span></div>` +
          (m.note ? `<div class="metric-note">${m.note}</div>` : '') +
          (m.bar !== undefined ? `<div class="metric-bar" aria-hidden="true"><span></span></div>` : '');
        list.appendChild(li);
        if (m.bar !== undefined) {
          requestAnimationFrame(() => requestAnimationFrame(() => { $('.metric-bar span', li).style.width = m.bar + '%'; }));
        }
      });
    };

    const renderSample = (key, i) => {
      const s = data[key].samples[i];
      $$('button', chips).forEach((b, j) => b.setAttribute('aria-pressed', String(j === i)));
      ring.hidden = false;
      ringValue.style.strokeDashoffset = C * (1 - s.score / 100);
      countTo(out, s.score, 900);
      $('.score-label', scanner).textContent = s.id + ' · Quality score';
      $('.score-verdict', scanner).textContent = s.headline;
      $('.score-meta', scanner).textContent = s.meta;
      renderMetrics(s.metrics);
    };

    const render = (key) => {
      const d = data[key];
      $('.scanner-sample img', scanner).src = d.icon;
      $('.scanner-source', scanner).textContent = d.source;
      chips.innerHTML = '';
      if (d.summary) {
        chips.hidden = true;
        ring.hidden = true;
        $('.score-label', scanner).textContent = d.summary.label;
        $('.score-verdict', scanner).textContent = d.summary.value;
        $('.score-meta', scanner).textContent = d.summary.meta;
        renderMetrics(d.summary.metrics);
        return;
      }
      chips.hidden = false;
      d.samples.forEach((s, i) => {
        const b = document.createElement('button');
        b.type = 'button';
        b.className = 'sample-chip';
        b.textContent = s.id;
        b.addEventListener('click', () => renderSample(key, i));
        chips.appendChild(b);
      });
      renderSample(key, 0);
    };

    $('[role="tablist"]', scanner).addEventListener('tabchange', (e) => render(e.detail.tab.dataset.modality));
    render('fingerprint');
  }

  /* ---------- Lifecycle wheel ---------- */
  const wheel = $('#lifecycle');
if (wheel && $('#stage-panel')) {
    const stages = [
      { name: 'Acquisition device', text: 'Benchmark capture devices before you buy them, and catch sensor issues before they reach your registry.',
        points: ['Product selection and tender evaluation', 'Device evaluations with accredited labs', 'Real-time capture feedback'] },
      { name: 'Registration client', text: 'Check quality at the moment of enrolment so operators can re-capture while the person is still present.',
        points: ['Enrolment quality checking and feedback', 'Quality metrics logged with every template', 'Operator guidance and training'] },
      { name: 'Automated Biometric Identification System', text: 'Profile the samples stored in your ABIS to find legacy quality issues that drive errors and exceptions.',
        points: ['Checking existing data', 'Find missing or inconsistent metadata', 'Prioritise records for re-enrolment'] },
      { name: 'Management, reporting & governance', text: 'Turn quality scores into evidence for policy, procurement and vendor accountability.',
        points: ['On-going quality monitoring at scale', 'Reporting and decision support', 'Clear, auditable acceptance thresholds'] },
      { name: 'Feedback to improve quality', text: 'Close the loop: use what you measure to improve devices, processes and training — then measure again.',
        points: ['Targeted training for operators', 'Equipment and environment improvements', 'Periodic audit of quality algorithms'] }
    ];
    const segs = $$('.seg', wheel);
    const panel = $('#stage-panel');
    let current = 0;
    const show = (i) => {
      current = (i + stages.length) % stages.length;
      const s = stages[current];
      segs.forEach((g, j) => { g.classList.toggle('is-active', j === current); g.setAttribute('aria-pressed', String(j === current)); });
      $('.stage-count', panel).textContent = `Stage ${current + 1} of ${stages.length}`;
      $('h3', panel).textContent = s.name;
      $('p', panel).textContent = s.text;
      $('ul', panel).innerHTML = s.points.map((p) => `<li>${p}</li>`).join('');
    };
    segs.forEach((g, i) => {
      g.addEventListener('click', () => show(i));
      g.addEventListener('keydown', (e) => { if (e.key === 'Enter' || e.key === ' ') { e.preventDefault(); show(i); } });
    });
    $('[data-stage="prev"]', panel).addEventListener('click', () => show(current - 1));
    $('[data-stage="next"]', panel).addEventListener('click', () => show(current + 1));
    show(0);
  }

  /* ---------- Architecture explorer ---------- */
  const arch = $('#architecture');
  if (arch) {
    const layers = {
      bqinsights: { title: '<b>bq</b>insights', text: 'Turns scores into decisions — for programme managers, analysts and decision makers.',
        points: ['Reports and dashboards', 'Raw data export for your own analysis', 'AI-generated analytical insights'] },
      bqconnect: { title: '<b>bq</b>connect', text: 'The ways in: use openbq in the field, in the lab or inside an automated pipeline.',
        points: ['Command line interface (CLI)', 'Desktop graphical interface (GUI)'] },
      bqcore: { title: '<b>bq</b>core', text: 'The engine. Orchestrates benchmarked quality algorithms for each modality and integrates new engines.',
        points: ['Orchestration and engine integration', 'Quality assessment engines: face, finger, iris, voice', 'Biographic data quality (roadmap)'] },
      bqlearn: { title: '<b>bq</b>learn', text: 'Training resources that run across every layer, for operators, analysts and integrators.',
        points: ['Guides and learning material', 'Operator and end-user education (roadmap)', 'Best-practice quality thresholds'] }
    };
    const btns = $$('[data-layer]', arch);
    const detail = $('#layer-detail');
    const pick = (key) => {
      btns.forEach((b) => b.setAttribute('aria-pressed', String(b.dataset.layer === key)));
      const l = layers[key];
      $('h3', detail).innerHTML = l.title;
      $('p', detail).textContent = l.text;
      $('ul', detail).innerHTML = l.points.map((p) => `<li>${p}</li>`).join('');
    };
    btns.forEach((b) => {
      b.addEventListener('click', () => pick(b.dataset.layer));
      b.addEventListener('mouseenter', () => { if (window.matchMedia('(hover: hover)').matches) pick(b.dataset.layer); });
    });
    pick('bqinsights');
  }

  /* ---------- Stats count-up + reveal on scroll ---------- */
  const io = 'IntersectionObserver' in window ? new IntersectionObserver((entries) => {
    entries.forEach((en) => {
      if (!en.isIntersecting) return;
      const el = en.target;
      el.classList.add('is-visible');
      if (el.dataset.count) countTo(el, parseInt(el.dataset.count, 10), 1200);
      io.unobserve(el);
    });
  }, { threshold: 0.15 }) : null;
  $$('.reveal, [data-count]').forEach((el) => (io ? io.observe(el) : el.classList.add('is-visible')));

  /* ---------- Copy buttons ---------- */
  $$('[data-copy]').forEach((btn) => btn.addEventListener('click', async () => {
    const src = document.getElementById(btn.dataset.copy);
    try {
      await navigator.clipboard.writeText(src.innerText.replace(/^\$ /gm, '').trim());
      btn.textContent = 'Copied';
      setTimeout(() => (btn.textContent = 'Copy'), 1800);
    } catch (e) { btn.textContent = 'Select & copy'; }
  }));

  /* ---------- Contact enquiry form → opens the matching registration form ---------- */
  const enquiry = $('#enquiry-form');
  if (enquiry) {
    enquiry.addEventListener('submit', (e) => {
      e.preventDefault();
      const area = $('#area', enquiry).value;
      const url = 'https://bixelab.snapforms.com.au/form/openbq-register-interest?area%20of%20interest=' + encodeURIComponent(area) + '&showheader=1';
      $('.form-status', enquiry).textContent = 'Opening the registration form in a new tab…';
      window.open(url, '_blank', 'noopener');
    });
  }

  /* ---------- Footer year ---------- */
  $$('[data-year]').forEach((el) => (el.textContent = new Date().getFullYear()));

  /* ---------- Newsletter iframe: auto-height ---------- */
  window.addEventListener('load', () => {
    const f = document.getElementById('sf-kHry3Pcequ');
    if (f && typeof window.iFrameResize === 'function') {
      window.iFrameResize({ checkOrigin: ['https://bixelab.snapforms.com.au'] }, f);
    }
  });
})();


