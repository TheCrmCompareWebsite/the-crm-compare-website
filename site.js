/* CRM Compare: small helpers on every page. Copied to site/site.js by the pipeline.
   The review feed pauses while it is tapped or focused.
   The section guide on the left bolds the link to the section being read.
   On a comparison page, one button opens (or closes) every feature group where the two CRMs differ. */
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
