(function () {
  "use strict";
  const D = window.GIRLIANDY;
  const TG = D.tg;
  const POWER_LABELS = { batteries: "Батарейки", usb: "USB", solar: "Сонце", "220v": "220 V", powerbank: "Павербанк" };

  const $ = (s, r) => (r || document).querySelector(s);
  const $$ = (s, r) => Array.from((r || document).querySelectorAll(s));

  const grid = $("[data-grid]");
  const chips = $("[data-category-chips]");
  const countEl = $("[data-result-count]");
  const emptyEl = $("[data-empty]");
  const modal = $("[data-modal]");
  const modalBody = $("[data-modal-body]");
  const drawer = $("[data-cart]");
  const cartItemsEl = $("[data-cart-items]");
  const cartCountEl = $("[data-cart-count]");
  const cartTotalEl = $("[data-cart-total]");

  const state = { category: "", power: "", place: "", price: "" };
  let cart = [];
  let activeProduct = null;

  const fmt = (n) => n.toLocaleString("uk-UA") + " ₴";
  const catLabel = (id) => (D.categories.find((c) => c.id === id) || {}).label || id;

  function tgLink(msg) {
    return "https://t.me/" + TG + "?text=" + encodeURIComponent(msg);
  }

  /* ---------- категорії ---------- */
  function renderChips() {
    chips.innerHTML = "";
    const all = chipBtn("Усі", "");
    chips.appendChild(all);
    D.categories.forEach((c) => chips.appendChild(chipBtn(c.label, c.id)));
  }

  function chipBtn(label, id) {
    const b = document.createElement("button");
    b.type = "button";
    b.className = "chip" + (id === state.category ? " active" : "");
    b.textContent = label;
    b.addEventListener("click", () => {
      state.category = id;
      $$(".chip", chips).forEach((x) => x.classList.toggle("active", x === b));
      renderGrid();
    });
    return b;
  }

  /* ---------- фільтри + рендер ---------- */
  function filtered() {
    return D.products.filter((p) => {
      if (state.category && p.category !== state.category) return false;
      if (state.power && !p.power.includes(state.power)) return false;
      if (state.place && p.place !== state.place && p.place !== "both") return false;
      if (state.price) {
        const parts = state.price.split("-");
        const lo = parts[0] === "" ? -Infinity : Number(parts[0]);
        const hi = parts[1] === "" ? Infinity : Number(parts[1]);
        if (p.price < lo || p.price > hi) return false;
      }
      return true;
    });
  }

  function cardHTML(p) {
    const img = p.images[0];
    const badge = p.badge ? '<span class="badge">' + p.badge + "</span>" : "";
    return (
      '<button class="card" type="button" data-open="' + p.id + '">' +
      '<span class="pic"><img src="' + img.src + '" alt="' + img.alt + '" loading="lazy">' + badge + "</span>" +
      '<span class="info"><span class="name">' + p.name + "</span>" +
      '<span class="price">' + fmt(p.price) + "</span>" +
      '<span class="cat">' + catLabel(p.category) + "</span></span></button>"
    );
  }

  function renderGrid() {
    const list = filtered();
    grid.innerHTML = list.map(cardHTML).join("");
    countEl.textContent = list.length + (list.length === 1 ? " товар" : " товарів");
    emptyEl.hidden = list.length > 0;
  }

  /* ---------- модалка товару ---------- */
  function openModal(id) {
    activeProduct = D.products.find((p) => p.id === id);
    if (!activeProduct) return;
    renderModal();
    modal.hidden = false;
    document.body.style.overflow = "hidden";
    $(".modal-x", modal).focus();
  }

  function closeModal() {
    modal.hidden = true;
    if (drawer.hidden) document.body.style.overflow = "";
  }

  function renderModal() {
    const p = activeProduct;
    const main = p.images[0].src;
    const thumbs = p.images
      .map((im, i) =>
        '<button type="button" class="' + (i === 0 ? "active" : "") + '" data-thumb="' + i + '" aria-label="Фото ' + (i + 1) + '"><img src="' + im.src + '" alt=""></button>'
      )
      .join("");
    const specs = p.specs.map((s) => "<li>" + s + "</li>").join("");

    modalBody.innerHTML =
      '<div class="modal-gallery">' +
      '<img class="main" src="' + main + '" alt="' + p.images[0].alt + '" data-main>' +
      '<div class="thumbs">' + thumbs + "</div></div>" +
      '<div class="modal-info">' +
      '<span class="cat">' + catLabel(p.category) + "</span>" +
      "<h3>" + p.name + "</h3>" +
      '<div class="price">' + fmt(p.price) + "</div>" +
      '<p class="desc">' + p.description + "</p>" +
      '<ul class="specs">' + specs + "</ul>" +
      '<span class="stock">В наявності</span>' +
      '<div class="modal-actions">' +
      '<button class="btn" type="button" data-add>Додати в кошик</button>' +
      '<a class="btn ghost" href="' + tgLink(singleOrder(p)) + '" target="_blank" rel="noopener">Замовити в Telegram</a>' +
      "</div></div>";

    $$("[data-thumb]", modalBody).forEach((b) =>
      b.addEventListener("click", () => {
        $$("[data-thumb]", modalBody).forEach((x) => x.classList.remove("active"));
        b.classList.add("active");
        $("[data-main]", modalBody).src = p.images[Number(b.dataset.thumb)].src;
      })
    );
    $("[data-add]", modalBody).addEventListener("click", () => {
      addToCart(p.id, 1);
      closeModal();
    });
  }

  function singleOrder(p) {
    return "Хочу замовити: " + p.name + " — 1 шт — " + fmt(p.price);
  }

  /* ---------- кошик ---------- */
  function addToCart(id, qty) {
    const line = cart.find((l) => l.id === id);
    if (line) line.qty += qty;
    else cart.push({ id, qty });
    renderCart();
    openDrawer();
  }

  function changeQty(id, d) {
    const line = cart.find((l) => l.id === id);
    if (!line) return;
    line.qty += d;
    if (line.qty <= 0) cart = cart.filter((l) => l.id !== id);
    renderCart();
  }

  function removeLine(id) {
    cart = cart.filter((l) => l.id !== id);
    renderCart();
  }

  function cartTotal() {
    return cart.reduce((s, l) => s + D.products.find((p) => p.id === l.id).price * l.qty, 0);
  }

  function renderCart() {
    const n = cart.reduce((s, l) => s + l.qty, 0);
    cartCountEl.textContent = n;

    if (!cart.length) {
      cartItemsEl.innerHTML = '<p class="drawer-empty">Кошик порожній.</p>';
      cartTotalEl.textContent = "0 ₴";
      return;
    }

    cartItemsEl.innerHTML = cart
      .map((line) => {
        const p = D.products.find((x) => x.id === line.id);
        return (
          '<div class="cart-line"><img src="' + p.images[0].src + '" alt="">' +
          '<div class="meta"><div class="name">' + p.name + "</div>" +
          '<div class="price">' + fmt(p.price) + "</div>" +
          '<div class="qty">' +
          '<button type="button" data-dec="' + p.id + '" aria-label="Зменшити кількість">−</button>' +
          "<span>" + line.qty + "</span>" +
          '<button type="button" data-inc="' + p.id + '" aria-label="Збільшити кількість">+</button>' +
          "</div></div>" +
          '<button class="remove" type="button" data-remove="' + p.id + '">Прибрати</button></div>'
        );
      })
      .join("");
    cartTotalEl.textContent = fmt(cartTotal());

    $$("[data-inc]", cartItemsEl).forEach((b) => b.addEventListener("click", () => changeQty(b.dataset.inc, 1)));
    $$("[data-dec]", cartItemsEl).forEach((b) => b.addEventListener("click", () => changeQty(b.dataset.dec, -1)));
    $$("[data-remove]", cartItemsEl).forEach((b) => b.addEventListener("click", () => removeLine(b.dataset.remove)));
  }

  function cartOrderMessage() {
    const lines = cart.map((l) => {
      const p = D.products.find((x) => x.id === l.id);
      return "• " + p.name + " — " + l.qty + " шт — " + fmt(p.price * l.qty);
    });
    return "Замовлення Girliandy:\n" + lines.join("\n") + "\nРазом: " + fmt(cartTotal());
  }

  function openDrawer() {
    drawer.hidden = false;
    document.body.style.overflow = "hidden";
  }

  function closeDrawer() {
    drawer.hidden = true;
    if (modal.hidden) document.body.style.overflow = "";
  }

  /* ---------- плавні появи секцій ---------- */
  function initReveal() {
    const els = $$(".catalog, .help");
    els.forEach((el) => el.classList.add("reveal"));
    if (!("IntersectionObserver" in window)) {
      els.forEach((el) => el.classList.add("in"));
      return;
    }
    const io = new IntersectionObserver(
      (entries) =>
        entries.forEach((e) => {
          if (e.isIntersecting) {
            e.target.classList.add("in");
            io.unobserve(e.target);
          }
        }),
      { threshold: 0.12 }
    );
    els.forEach((el) => io.observe(el));
  }

  /* ---------- SEO: ItemList ---------- */
  function injectSeo() {
    const items = D.products.map((p, i) => ({
      "@type": "ListItem",
      position: i + 1,
      item: {
        "@type": "Product",
        name: p.name,
        image: p.images[0].src,
        description: p.description,
        offers: {
          "@type": "Offer",
          price: p.price,
          priceCurrency: "UAH",
          availability: "https://schema.org/InStock",
        },
      },
    }));
    const script = document.createElement("script");
    script.type = "application/ld+json";
    script.textContent = JSON.stringify({ "@context": "https://schema.org", "@type": "ItemList", itemListElement: items });
    document.head.appendChild(script);
  }

  /* ---------- події ---------- */
  grid.addEventListener("click", (e) => {
    const card = e.target.closest("[data-open]");
    if (card) openModal(card.dataset.open);
  });

  $("[data-filters]").addEventListener("change", (e) => {
    state[e.target.name] = e.target.value;
    renderGrid();
  });

  $("[data-cart-open]").addEventListener("click", openDrawer);
  $$("[data-cart-close]").forEach((b) => b.addEventListener("click", closeDrawer));
  $$("[data-modal-close]").forEach((b) => b.addEventListener("click", closeModal));

  $("[data-cart-order]").addEventListener("click", () => {
    if (!cart.length) return;
    const a = document.createElement("a");
    a.href = tgLink(cartOrderMessage());
    a.target = "_blank";
    a.rel = "noopener";
    a.click();
  });

  document.addEventListener("keydown", (e) => {
    if (e.key !== "Escape") return;
    if (!modal.hidden) closeModal();
    if (!drawer.hidden) closeDrawer();
  });

  /* ---------- запуск ---------- */
  renderChips();
  renderGrid();
  initReveal();
  injectSeo();
})();
