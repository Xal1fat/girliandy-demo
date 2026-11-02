(function () {
  "use strict";
  var D = window.GIRLIANDY, U = window.UI, C = window.Cart, I = window.I18N;
  var ORDER_IDS = [
    "hirlianda-shtora-teple-svitlo", "pled-iz-pidihrivom", "vulychnyi-soniachnyi-svitylnyk",
    "smart-proektor-dlia-domu", "sadovi-likhtari-nabir-4", "paverbank-20000",
    "hirlianda-na-batareikakh-10m", "dekoratyvnyi-likhtar-hachok", "soniachnyi-ventylator", "portatyvnyi-ventylator"
  ];

  /* ================= КАРУСЕЛЬ (hero) ================= */
  var carouselProducts = ORDER_IDS.map(function (id) { return D.products.find(function (p) { return p.id === id; }); }).filter(Boolean);
  var carouselEl = document.getElementById("carousel");
  var prefersReduced = window.matchMedia("(prefers-reduced-motion: reduce)").matches;
  var PITCH = 196, TOTAL_SPAN = carouselProducts.length * PITCH, HALF_SPAN = TOTAL_SPAN / 2;

  function getRoundedQuadPath(corners, r) {
    var d = "";
    for (var i = 0; i < 4; i++) {
      var prev = corners[(i + 3) % 4], curr = corners[i], next = corners[(i + 1) % 4];
      var dInX = prev.x - curr.x, dInY = prev.y - curr.y, lenIn = Math.hypot(dInX, dInY) || 1;
      var pInX = curr.x + (dInX / lenIn) * Math.min(r, lenIn * 0.45), pInY = curr.y + (dInY / lenIn) * Math.min(r, lenIn * 0.45);
      var dOutX = next.x - curr.x, dOutY = next.y - curr.y, lenOut = Math.hypot(dOutX, dOutY) || 1;
      var pOutX = curr.x + (dOutX / lenOut) * Math.min(r, lenOut * 0.45), pOutY = curr.y + (dOutY / lenOut) * Math.min(r, lenOut * 0.45);
      d += (i === 0 ? "M " : "L ") + pInX.toFixed(2) + " " + pInY.toFixed(2) + " ";
      d += "Q " + curr.x.toFixed(2) + " " + curr.y.toFixed(2) + " " + pOutX.toFixed(2) + " " + pOutY.toFixed(2) + " ";
    }
    return d + "Z";
  }

  var cards = [];
  carouselProducts.forEach(function (p, i) {
    var card = document.createElement("div");
    card.className = "card";
    var photo = document.createElement("img");
    photo.className = "card__photo";
    photo.src = U.img(p);
    photo.alt = p.images[0].alt;
    photo.draggable = false;
    var info = document.createElement("div");
    info.className = "card__info";
    info.innerHTML =
      '<div class="card__text"><div class="card__name">' + U.name(p) + '</div>' +
      '<div class="card__price">' + U.fmt(p.price) + "</div></div>" +
      '<button class="card__order" type="button" aria-label="' + I.t("nav.order") + ' ' + U.name(p) + '">' + I.t("nav.order") + "</button>";
    card.appendChild(photo);
    card.appendChild(info);
    carouselEl.appendChild(card);
    var orderMsg = I.t("ord.want") + ": " + U.name(p) + " — " + U.fmt(p.price);
    info.querySelector(".card__order").addEventListener("click", function (e) { e.stopPropagation(); window.open(U.tg(orderMsg), "_blank", "noopener"); });
    card.addEventListener("click", function () { window.open(U.tg(orderMsg), "_blank", "noopener"); });
    cards.push({ el: card, index: i });
  });

  var scrollX = 0, velocity = 0, isDragging = false, lastDragX = 0, lastDragTime = 0;
  var clockAnim = document.documentElement.animate([{ opacity: 1 }, { opacity: 1 }], { duration: 1e9, iterations: 1 });
  var lastClockTime = clockAnim.currentTime || performance.now();

  function getUnit() { return window.innerWidth <= 820 ? Math.min(window.innerWidth / 640, window.innerHeight / 900) : Math.min(window.innerWidth / 1440, window.innerHeight / 1080); }

  function updateCarousel(dt) {
    var isMobile = window.innerWidth <= 820, u = getUnit();
    if (!isDragging) {
      if (Math.abs(velocity) > 0.5) { scrollX += velocity * dt; velocity *= Math.pow(0.05, dt); }
      else { velocity = 0; if (!prefersReduced) scrollX += 50 * dt; }
    }
    var cx = isMobile ? (carouselEl.offsetWidth / (2 * u)) : 720;
    var cy = isMobile ? 150 : 690;
    cards.forEach(function (c) {
      var t = (c.index * PITCH - scrollX) % TOTAL_SPAN;
      if (t < -HALF_SPAN) t += TOTAL_SPAN;
      if (t >= HALF_SPAN) t -= TOTAL_SPAN;
      var x = cx + t * (1 + 0.083 * Math.pow(t / 706, 2));
      var dd = Math.abs(x - cx) / 706;
      var W = 170 + 48 * (dd * dd);
      var centerY = cy - (isMobile ? 6 : 12) * (dd * dd);
      var xL = x - W / 2, xR = x + W / 2;
      var qL = Math.abs(xL - cx) / 706, qR = Math.abs(xR - cx) / 706;
      var baseH = isMobile ? 250 : 330, scaleH = isMobile ? 60 : 84;
      var hL = baseH + scaleH * Math.pow(qL, 2.6), hR = baseH + scaleH * Math.pow(qR, 2.6);
      var tL = centerY - hL / 2, bL = centerY + hL / 2, tR = centerY - hR / 2, bR = centerY + hR / 2;
      var boxTop = Math.min(tL, tR), boxBottom = Math.max(bL, bR), boxH = boxBottom - boxTop;
      var corners = [{ x: 0, y: (tL - boxTop) * u }, { x: W * u, y: (tR - boxTop) * u }, { x: W * u, y: (bR - boxTop) * u }, { x: 0, y: (bL - boxTop) * u }];
      var pathD = getRoundedQuadPath(corners, 15 * u);
      c.el.style.transform = "translate(" + (xL * u) + "px, " + (boxTop * u) + "px)";
      c.el.style.width = (W * u) + "px";
      c.el.style.height = (boxH * u) + "px";
      c.el.style.clipPath = "path('" + pathD + "')";
      c.el.style.webkitClipPath = "path('" + pathD + "')";
    });
  }

  carouselEl.addEventListener("pointerdown", function (e) { isDragging = true; lastDragX = e.clientX; lastDragTime = performance.now(); velocity = 0; carouselEl.classList.add("is-dragging"); try { carouselEl.setPointerCapture(e.pointerId); } catch (err) {} });
  window.addEventListener("pointermove", function (e) {
    if (!isDragging) return;
    var now = performance.now(), dx = e.clientX - lastDragX, u = getUnit();
    scrollX -= dx / u;
    var dt = (now - lastDragTime) / 1000;
    if (dt > 0.008) { velocity = -(dx / u) / dt; lastDragTime = now; lastDragX = e.clientX; }
  });
  window.addEventListener("pointerup", function (e) { if (!isDragging) return; isDragging = false; carouselEl.classList.remove("is-dragging"); try { carouselEl.releasePointerCapture(e.pointerId); } catch (err) {} });
  window.addEventListener("pointercancel", function () { isDragging = false; });

  function tick() {
    var ct = clockAnim.currentTime || performance.now();
    var dt = (ct - lastClockTime) / 1000;
    if (dt > 0.1) dt = 0.1;
    if (dt <= 0) dt = 0.016;
    lastClockTime = ct;
    updateCarousel(dt);
    requestAnimationFrame(tick);
  }
  requestAnimationFrame(tick);

  function entrance() {
    if (prefersReduced) return;
    [document.querySelector(".logo--desktop"), document.querySelector(".nav"), document.querySelector(".btn--cart"), document.querySelector(".btn--desktop")].forEach(function (el, i) {
      if (el) el.animate([{ opacity: 0, transform: "translateY(-18px)" }, { opacity: 1, transform: "translateY(0)" }], { duration: 650, delay: 50 + i * 60, easing: "cubic-bezier(.16,1,.3,1)", fill: "both" });
    });
    var badge = document.querySelector(".badge");
    if (badge) badge.animate([{ opacity: 0, transform: "scale(0.85)" }, { opacity: 1, transform: "scale(1)" }], { duration: 500, delay: 300, easing: "cubic-bezier(.34,1.56,.64,1)", fill: "both" });
    document.querySelectorAll(".headline__line").forEach(function (line, i) {
      line.animate([{ opacity: 0, filter: "blur(8px)", transform: "translateY(24px)" }, { opacity: 1, filter: "blur(0px)", transform: "translateY(0)" }], { duration: 750, delay: 400 + i * 100, easing: "cubic-bezier(.16,1,.3,1)", fill: "both" });
    });
    var sub = document.querySelector(".subline");
    if (sub) sub.animate([{ opacity: 0, transform: "translateY(16px)" }, { opacity: 1, transform: "translateY(0)" }], { duration: 650, delay: 620, easing: "cubic-bezier(.16,1,.3,1)", fill: "both" });
    if (carouselEl) carouselEl.animate([{ opacity: 0, transform: "translateY(40px)" }, { opacity: 1, transform: "translateY(0)" }], { duration: 850, delay: 520, easing: "cubic-bezier(.16,1,.3,1)", fill: "both" });
    var cta = document.querySelector(".cta-wrap");
    if (cta) cta.animate([{ opacity: 0, transform: "translateX(-50%) scale(0.85)" }, { opacity: 1, transform: "translateX(-50%) scale(1)" }], { duration: 550, delay: 760, easing: "cubic-bezier(.34,1.56,.64,1)", fill: "both" });
    document.querySelectorAll(".note").forEach(function (n, i) { n.animate([{ opacity: 0 }, { opacity: 1 }], { duration: 600, delay: 800 + i * 100, easing: "ease-out", fill: "both" }); });
  }

  /* ================= КАТАЛОГ ================= */
  var CAT_IMAGES = { hirliandy: "assets/ig/06-curtain-garland-clean.jpg", lampy: "assets/ig/04-wall-lantern-solar-clean.jpg", proektory: "assets/ig/14-portable-projector-clean.jpg", pledy: "assets/ig/01-pled-pidigriv-clean.jpg", dekor: "assets/ig/15-powerbanks-clean.jpg" };
  var state = { category: "", power: "", place: "", color: "", avail: "", min: "", max: "" };
  var sort = "popular";

  function renderCats() {
    var el = document.getElementById("cats");
    el.innerHTML = D.categories.map(function (c) {
      return '<a class="cat" href="#catalog" data-cat="' + c.id + '">' +
        '<img src="../' + CAT_IMAGES[c.id] + '" alt="' + U.catLabel(c.id) + '" loading="lazy">' +
        '<span class="cat-label">' + U.catLabel(c.id) + "</span></a>";
    }).join("");
    el.querySelectorAll(".cat").forEach(function (a) {
      a.addEventListener("click", function (e) { e.preventDefault(); state.category = a.dataset.cat; document.getElementById("f-cat").value = state.category; renderGrid(); });
    });
    var sel = document.getElementById("f-cat");
    D.categories.forEach(function (c) {
      var opt = document.createElement("option");
      opt.value = c.id;
      opt.textContent = U.catLabel(c.id);
      sel.appendChild(opt);
    });
  }

  function filtered() {
    var list = D.products.filter(function (p) {
      if (state.category && p.category !== state.category) return false;
      if (state.power && p.power.indexOf(state.power) === -1) return false;
      if (state.place && p.place !== state.place && p.place !== "both") return false;
      if (state.color && p.color !== state.color) return false;
      if (state.avail === "in" && p.stock <= 0) return false;
      if (state.min !== "" && p.price < Number(state.min)) return false;
      if (state.max !== "" && p.price > Number(state.max)) return false;
      return true;
    });
    if (sort === "cheap") list.sort(function (a, b) { return a.price - b.price; });
    else if (sort === "expensive") list.sort(function (a, b) { return b.price - a.price; });
    else if (sort === "new") list.sort(function (a, b) { return (b.isNew ? 1 : 0) - (a.isNew ? 1 : 0); });
    else list.sort(function (a, b) { return b.popularity - a.popularity; });
    return list;
  }

  function renderGrid() {
    var grid = document.getElementById("grid");
    var list = filtered();
    grid.innerHTML = list.map(U.cardHTML).join("") || '<p class="empty">' + I.t("empty") + "</p>";
    grid.querySelectorAll(".btn-add").forEach(function (b) { b.addEventListener("click", function () { C.add(b.dataset.id, 1); }); });
  }

  function bindFilters() {
    var f = document.getElementById("filters");
    f.addEventListener("change", function (e) {
      var map = { "f-cat": "category", "f-power": "power", "f-place": "place", "f-color": "color", "f-avail": "avail", "f-min": "min", "f-max": "max" };
      if (map[e.target.id]) { state[map[e.target.id]] = e.target.value; renderGrid(); }
    });
    document.getElementById("f-sort").addEventListener("change", function (e) { sort = e.target.value; renderGrid(); });
  }

  renderCats();
  renderGrid();
  bindFilters();
  C.updateBadge();
  entrance();
})();
