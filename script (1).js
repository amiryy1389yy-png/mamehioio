(function () {
  'use strict';

  /* ------------------------------------------------------------------
     CONFIG — edit these values in one place.
     Leave a value as its placeholder to keep the link inert; the page
     shows a notice instead of navigating to a made-up URL.
     ------------------------------------------------------------------ */
  var CONFIG = {
    DOWNLOAD_URL: 'DOWNLOAD_URL',
    DOCUMENTATION_URL: 'DOCUMENTATION_URL',
    GITHUB_URL: 'GITHUB_URL'
  };

  var doc = document;
  var reduceMotion = window.matchMedia && window.matchMedia('(prefers-reduced-motion: reduce)').matches;
  doc.documentElement.classList.add('js');

  var $ = function (s, r) { return (r || doc).querySelector(s); };
  var $$ = function (s, r) { return Array.prototype.slice.call((r || doc).querySelectorAll(s)); };

  /* ---------- toast ---------- */
  var toast = $('#toast'), toastTimer;
  function showToast(msg) {
    if (!toast) return;
    toast.textContent = msg;
    toast.classList.add('show');
    clearTimeout(toastTimer);
    toastTimer = setTimeout(function () { toast.classList.remove('show'); }, 3200);
  }

  /* ---------- configurable links ---------- */
  $$('[data-link]').forEach(function (a) {
    var key = a.getAttribute('data-link');
    var url = CONFIG[key];
    var isPlaceholder = !url || url === key;
    if (isPlaceholder) {
      a.addEventListener('click', function (e) {
        e.preventDefault();
        showToast('Set ' + key + ' in script.js to enable this link.');
      });
    } else {
      a.setAttribute('href', url);
      if (/^https?:/i.test(url)) { a.setAttribute('target', '_blank'); a.setAttribute('rel', 'noopener noreferrer'); }
    }
  });

  /* ---------- mobile menu ---------- */
  var menuBtn = $('.menu-btn'), nav = $('#primary-nav');
  function setMenu(open) {
    nav.classList.toggle('open', open);
    menuBtn.setAttribute('aria-expanded', String(open));
  }
  if (menuBtn && nav) {
    menuBtn.addEventListener('click', function () { setMenu(!nav.classList.contains('open')); });
    nav.addEventListener('click', function (e) { if (e.target.tagName === 'A') setMenu(false); });
    doc.addEventListener('keydown', function (e) {
      if (e.key === 'Escape' && nav.classList.contains('open')) { setMenu(false); menuBtn.focus(); }
    });
  }

  /* ---------- number formatting ---------- */
  var nf0 = new Intl.NumberFormat('en-US', { maximumFractionDigits: 0 });
  function fmtNum(n, d) {
    return new Intl.NumberFormat('en-US', { minimumFractionDigits: d || 0, maximumFractionDigits: d || 0 }).format(n);
  }
  function money(v) {
    if (!isFinite(v)) return '—';
    var abs = Math.abs(v), d = abs < 1 ? 4 : 2;
    return (v < 0 ? '-' : '') + '$' + new Intl.NumberFormat('en-US', { minimumFractionDigits: d, maximumFractionDigits: d }).format(abs);
  }

  /* ---------- count-up (final values are already in the HTML) ---------- */
  function countUp(el) {
    var target = parseFloat(el.getAttribute('data-count'));
    var dec = parseInt(el.getAttribute('data-decimals') || '0', 10);
    var dur = 900, start = null;
    function step(ts) {
      if (start === null) start = ts;
      var p = Math.min((ts - start) / dur, 1);
      var eased = 1 - Math.pow(1 - p, 3);
      el.textContent = fmtNum(target * eased, dec);
      if (p < 1) requestAnimationFrame(step); else el.textContent = fmtNum(target, dec);
    }
    requestAnimationFrame(step);
  }

  /* ---------- reveal / bars / counters ---------- */
  function growBars(root) {
    $$('.fill', root).forEach(function (f) { f.style.width = f.getAttribute('data-w') + '%'; });
  }

  if (reduceMotion || !('IntersectionObserver' in window)) {
    growBars(doc);
    $$('.reveal').forEach(function (n) { n.classList.add('in'); });
  } else {
    $$('.card, .flow-h, .wf, .ticks li, .chips li').forEach(function (n) { n.classList.add('reveal'); });

    var io = new IntersectionObserver(function (entries) {
      entries.forEach(function (en) {
        if (!en.isIntersecting) return;
        var t = en.target;
        t.classList.add('in');
        if (t.id === 'bars' || t.querySelector('.fill')) growBars(t);
        if (t.hasAttribute('data-count')) countUp(t.querySelector('[data-count]') || t);
        io.unobserve(t);
      });
    }, { threshold: 0.15 });

    $$('.reveal').forEach(function (n) { io.observe(n); });
    var bars = $('#bars'); if (bars) io.observe(bars);

    var cio = new IntersectionObserver(function (entries) {
      entries.forEach(function (en) {
        if (en.isIntersecting) { countUp(en.target); cio.unobserve(en.target); }
      });
    }, { threshold: 0.6 });
    $$('[data-count]').forEach(function (n) { cio.observe(n); });
  }

  /* ---------- copy buttons ---------- */
  $$('.copy').forEach(function (btn) {
    btn.addEventListener('click', function () {
      var pre = doc.getElementById(btn.getAttribute('data-copy'));
      if (!pre) return;
      var text = pre.textContent;
      function done(ok) {
        btn.textContent = ok ? 'Copied' : 'Press Ctrl+C';
        setTimeout(function () { btn.textContent = 'Copy'; }, 1600);
      }
      if (navigator.clipboard && navigator.clipboard.writeText) {
        navigator.clipboard.writeText(text).then(function () { done(true); }, function () { done(false); });
      } else {
        var r = doc.createRange(); r.selectNodeContents(pre);
        var s = window.getSelection(); s.removeAllRanges(); s.addRange(r);
        done(false);
      }
    });
  });

  /* ---------- savings calculator ---------- */
  var el = {
    orig: $('#in-orig'), opt: $('#in-opt'), price: $('#in-price'),
    day: $('#in-day'), month: $('#in-month'),
    oOrig: $('#o-orig'), oOpt: $('#o-opt'), oSave: $('#o-save'), oPct: $('#o-pct'),
    oTok: $('#o-tok'), oTokDay: $('#o-tokday'), oTokMonth: $('#o-tokmonth'), oMonthCost: $('#o-monthcost')
  };
  var DEFAULTS = { orig: 22080, opt: 12382, price: 10, day: 100, month: 3000 };
  var monthTouched = false;

  function val(input) {
    var n = parseFloat(input.value);
    return isFinite(n) && n >= 0 ? n : 0;
  }

  function calc() {
    if (!el.orig) return;
    var orig = val(el.orig), opt = val(el.opt), price = val(el.price);
    var perDay = val(el.day), perMonth = val(el.month);

    var costOrig = orig * price / 1e6;
    var costOpt = opt * price / 1e6;
    var saveReq = costOrig - costOpt;
    var tokReq = orig - opt;

    el.oOrig.textContent = money(costOrig);
    el.oOpt.textContent = money(costOpt);
    el.oSave.textContent = money(saveReq);
    el.oPct.textContent = orig > 0 ? fmtNum((tokReq / orig) * 100, 2) + '%' : '—';
    el.oTok.textContent = nf0.format(tokReq);
    el.oTokDay.textContent = nf0.format(tokReq * perDay);
    el.oTokMonth.textContent = nf0.format(tokReq * perMonth);
    el.oMonthCost.textContent = money(saveReq * perMonth);
  }

  if (el.orig) {
    [el.orig, el.opt, el.price, el.month].forEach(function (i) {
      i.addEventListener('input', function () { if (i === el.month) monthTouched = true; calc(); });
    });
    el.day.addEventListener('input', function () {
      if (!monthTouched) el.month.value = Math.round(val(el.day) * 30);
      calc();
    });
    $('#calc-reset').addEventListener('click', function () {
      el.orig.value = DEFAULTS.orig; el.opt.value = DEFAULTS.opt; el.price.value = DEFAULTS.price;
      el.day.value = DEFAULTS.day; el.month.value = DEFAULTS.month;
      monthTouched = false;
      calc();
    });
    calc();
  }
})();
