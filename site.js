/* The CRM Compare Website: small helpers on every page. Copied to site/site.js by the pipeline.
   The review feed pauses while it is tapped or focused.
   The section guide on the left bolds the link to the section being read.
   On a comparison page, one button opens (or closes) every feature group where the two CRMs differ.
   Compare: "Add to Compare" and the Compare button on every product card, and the bar that slides up
   from the bottom. The picks are kept in localStorage, so they carry from page to page. */
(function () {
  document.querySelectorAll(".feed-window").forEach(function (w) {
    w.addEventListener("click", function () { w.classList.toggle("paused"); });
  });

  // Section guide: the current section is the last one whose heading has passed a line a third of
  // the way down the window; at the very bottom of the page it is the last section.
  var links = Array.prototype.slice.call(document.querySelectorAll(".section-guide a[href^='#']"));
  var pairs = links.map(function (a) {
    return { a: a, h: document.getElementById(decodeURIComponent(a.getAttribute("href").slice(1))) };
  }).filter(function (p) { return p.h; });
  if (!pairs.length) return;
  var current = null, queued = false;
  function update() {
    queued = false;
    var line = window.innerHeight / 3, pick = null;
    var atBottom = window.innerHeight + window.scrollY >= document.documentElement.scrollHeight - 2;
    if (atBottom) {
      pick = pairs[pairs.length - 1];
    } else {
      pairs.forEach(function (p) { if (p.h.getBoundingClientRect().top <= line) pick = p; });
    }
    if (pick === current) return;
    if (current) current.a.removeAttribute("aria-current");
    if (pick) pick.a.setAttribute("aria-current", "location");
    current = pick;
  }
  function queue() { if (!queued) { queued = true; window.requestAnimationFrame(update); } }
  window.addEventListener("scroll", queue, { passive: true });
  window.addEventListener("resize", queue);
  update();
})();

(function () {
  document.querySelectorAll(".ss-open").forEach(function (b) {
    b.hidden = false;
    b.addEventListener("click", function () {
      var open = b.dataset.open !== "1";
      document.querySelectorAll(".ss-det[data-diff]").forEach(function (d) { d.open = open; });
      b.dataset.open = open ? "1" : "0";
      b.textContent = open ? "Close every group" : "Open every group that differs";
    });
  });
})();

// Compare. Each card (product_card() in build_site.py) has data-slug, data-name and data-vs (the CRMs
// it has a comparison page with). Two CRMs can be compared only when that page exists, so once one is
// picked, cards without a page for that pair can't be added. The bar (page() in build_site.py) names
// the picks and opens the comparison page once there are two.
(function () {
  var KEY = "crmCompare";
  var bar = document.getElementById("compare-bar");
  if (!bar) return;
  var cards = Array.prototype.slice.call(document.querySelectorAll(".review-card[data-slug]"));
  var names = document.getElementById("compare-names");
  var go = document.getElementById("compare-go");
  var root = bar.getAttribute("data-root") || "";
  var picks = [];

  function load() {
    try { picks = JSON.parse(localStorage.getItem(KEY)) || []; } catch (e) { picks = []; }
    picks = picks.filter(function (p) { return p && p.slug; }).slice(0, 2);
  }
  function save() { try { localStorage.setItem(KEY, JSON.stringify(picks)); } catch (e) { /* private mode: this page only */ } }
  function info(card) {
    return { slug: card.dataset.slug, name: card.dataset.name, vs: (card.dataset.vs || "").split(" ").filter(Boolean) };
  }
  function has(slug) { return picks.some(function (p) { return p.slug === slug; }); }
  // Can this CRM be added next to what is already picked?
  function canAdd(x) {
    if (has(x.slug)) return true;
    if (picks.length >= 2) return false;
    if (picks.length === 1) return x.vs.indexOf(picks[0].slug) !== -1 || picks[0].vs.indexOf(x.slug) !== -1;
    return true;
  }
  function href() {
    var s = [picks[0].slug, picks[1].slug].sort();
    return root + "compare/" + s[0] + "-vs-" + s[1] + ".html";
  }
  function text(el, t, extra) {
    el.textContent = t;
    if (extra) { var m = document.createElement("span"); m.className = "muted"; m.textContent = extra; el.appendChild(m); }
  }

  function render() {
    cards.forEach(function (c) {
      var x = info(c), box = c.querySelector(".pick-box"), btn = c.querySelector(".rc-compare-btn");
      if (!box) return;
      var on = has(x.slug), ok = canAdd(x);
      box.checked = on;
      box.disabled = !ok;
      if (btn) btn.disabled = !ok;
      c.classList.toggle("picked", on);
      var why = ok ? "Add to Compare" : picks.length >= 2 ? "Two CRMs are already picked: clear one first"
                                                          : "No comparison page with " + picks[0].name + " yet";
      box.parentNode.title = why;
      if (btn) btn.title = ok ? (picks.length === 1 && !on ? "Compare with " + picks[0].name : "Compare " + x.name) : why;
    });
    if (!picks.length) {
      bar.classList.remove("open");
      bar.hidden = true;
      return;
    }
    if (picks.length === 2) {
      text(names, picks[0].name + " vs " + picks[1].name);
      go.href = href();
      go.removeAttribute("aria-disabled");
      go.hidden = false;
    } else {
      text(names, picks[0].name, " · add one more CRM to compare");
      go.removeAttribute("href");
      go.hidden = true;
    }
    bar.hidden = false;
    requestAnimationFrame(function () { bar.classList.add("open"); });
  }
  function nudge() {
    bar.classList.remove("nudge");
    void bar.offsetWidth;
    bar.classList.add("nudge");
  }
  function add(card) {
    var x = info(card);
    if (has(x.slug) || !canAdd(x)) return false;
    picks.push(x);
    save();
    return true;
  }

  cards.forEach(function (c) {
    var box = c.querySelector(".pick-box"), btn = c.querySelector(".rc-compare-btn");
    if (!box) return;
    box.addEventListener("change", function () {
      if (box.checked) add(c);
      else { picks = picks.filter(function (p) { return p.slug !== c.dataset.slug; }); save(); }
      render();
    });
    if (btn) btn.addEventListener("click", function () {
      add(c);
      render();
      if (picks.length === 2) window.location.href = href();
      else nudge();
    });
  });
  document.getElementById("compare-clear").addEventListener("click", function () { picks = []; save(); render(); });
  // Picks made on another page (or another tab) show when coming back to this one.
  window.addEventListener("pageshow", function () { load(); render(); });
  window.addEventListener("storage", function (ev) { if (ev.key === KEY) { load(); render(); } });

  Array.prototype.forEach.call(document.querySelectorAll(".rc-compare.js-only"), function (el) { el.hidden = false; });
  load();
  render();
})();
