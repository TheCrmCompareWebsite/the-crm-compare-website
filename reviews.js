/* All Reports page: search and filters. Without JavaScript every card shows,
   the "Real Estate CRMs" checkbox still works (CSS), and the search box and sliders stay hidden. */
(function () {
  var cards = Array.prototype.slice.call(document.querySelectorAll("#review-grid .review-card"));
  var search = document.getElementById("crm-search");
  var searchForm = document.getElementById("search-form");
  var filters = document.getElementById("card-filters");
  var re = document.getElementById("re-only");
  var sc = document.getElementById("score-min");
  var lo = document.getElementById("price-min");
  var hi = document.getElementById("price-max");
  var sortBy = document.getElementById("sort-by");
  var norm = function (s) { return s.toLowerCase().replace(/[^a-z0-9]/g, ""); };

  // Fuzzy name match. Lower is better; -1 means no match.
  function rank(q, name) {
    if (!q) return 0;
    var i = name.indexOf(q);
    if (i === 0) return 0;
    if (i > 0) return 1;
    var pos = -1, gaps = 0;
    for (var k = 0; k < q.length; k++) {
      var next = name.indexOf(q[k], pos + 1);
      if (next === -1) return -1;
      if (pos >= 0) gaps += next - pos - 1;
      pos = next;
    }
    return 2 + gaps / 10;
  }

  // Price sliders are logarithmic: positions 0-1000 map to $0-max, halfway is $1,000, prices snap to $100.
  var steps = +hi.max, maxPrice = +lo.dataset.maxPrice, K = Math.log(maxPrice / 100 + 1);
  function toPrice(pos) { return Math.round(Math.exp(pos / steps * K) - 1) * 100; }
  function fmt(n) { return "$" + Number(n).toLocaleString("en-US"); }

  function run(ev) {
    var pa = +lo.value, pb = +hi.value;
    if (pa > pb) { if (ev && ev.target === lo) { pa = pb; lo.value = pb; } else { pb = pa; hi.value = pa; } }
    var a = toPrice(pa), b = toPrice(pb), s = +sc.value;
    lo.setAttribute("aria-valuetext", fmt(a)); hi.setAttribute("aria-valuetext", fmt(b));
    document.getElementById("price-lo").textContent = fmt(a) + "/yr";
    document.getElementById("price-hi").textContent = fmt(b) + "/yr";
    document.getElementById("price-fill").style.left = (pa / steps * 100) + "%";
    document.getElementById("price-fill").style.right = (100 - pb / steps * 100) + "%";
    var so = document.getElementById("score-out");
    so.textContent = s >= 10 ? "10" : s > 0 ? s.toFixed(1).replace(/\.0$/, "") + "+" : "Any";  // whole numbers without ".0", as everywhere
    so.className = "score" + (s <= 0 ? "" : s >= 7.5 ? " good" : s >= 5.5 ? " ok" : " bad");
    document.getElementById("score-fill").style.left = (s * 10) + "%";

    var q = norm(search.value);
    var ranks = cards.map(function (c) { return rank(q, norm(c.dataset.name)); });
    // Search company names only when no CRM name matches (so "real" doesn't match every "real estate").
    if (q.length >= 3 && ranks.every(function (r) { return r < 0; })) {
      ranks = cards.map(function (c) { return norm(c.dataset.extra).indexOf(q) !== -1 ? 50 : -1; });
    }
    // Sort: the "Sort by" choice, ties broken by overall score. While searching,
    // the closest name matches still come first.
    var parts = sortBy.value.split(":"), key = parts[0], dir = +parts[1];
    var place = {};
    cards.slice().sort(function (x, y) {
      return dir * (x.dataset[key] - y.dataset[key]) || (y.dataset.score - x.dataset.score);
    }).forEach(function (c, i) { place[c.dataset.slug] = i; });
    var shown = 0;
    cards.forEach(function (c, i) {
      var ok = ranks[i] >= 0 && (!re.checked || c.classList.contains("re")) &&
               +c.dataset.score >= s && +c.dataset.price >= a && +c.dataset.price <= b;
      c.hidden = !ok;
      c.style.order = (q ? Math.round(ranks[i] * 10) * 100 : 0) + place[c.dataset.slug];
      if (ok) shown++;
    });
    document.getElementById("filter-count").textContent = "Showing " + shown + " of " + cards.length + " CRMs";
    // While the Filters panel is closed, its header still says how many filters are on.
    var active = (re.checked ? 1 : 0) + (s > 0 ? 1 : 0) + (pa > 0 || pb < steps ? 1 : 0);
    var badge = document.getElementById("filter-active");
    badge.textContent = active + " active";
    badge.hidden = active === 0;
    document.getElementById("no-results").hidden = shown > 0;
  }
  search.addEventListener("input", run);
  filters.addEventListener("input", run);
  re.addEventListener("change", run);
  sortBy.addEventListener("change", run);
  filters.addEventListener("reset", function () { setTimeout(function () { search.value = ""; run(); }, 0); });
  searchForm.addEventListener("submit", function (ev) {
    ev.preventDefault();
    var first = cards.filter(function (c) { return !c.hidden; })
                     .sort(function (x, y) { return (+x.style.order || 0) - (+y.style.order || 0); })[0];
    if (first) first.querySelector(".rc-review").click();
  });

  // Compare (Add to Compare and the Compare button on each card) is in site.js: it works on every page.

  Array.prototype.forEach.call(document.querySelectorAll(".js-only"), function (el) { el.hidden = false; });
  searchForm.hidden = false;
  run();
})();
