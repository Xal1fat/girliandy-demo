(function () {
  "use strict";
  var D = window.GIRLIANDY, U = window.UI, C = window.Cart, I = window.I18N;

  var slug = new URLSearchParams(location.search).get("slug");
  var p = D.products.find(function (x) { return x.slug === slug; }) || D.products[0];
  document.title = U.name(p) + " — Girliandy";
  document.querySelector("[data-bc-name]").textContent = U.name(p);

  /* Галерея */
  var main = document.querySelector("[data-main]");
  var thumbs = document.querySelector("[data-thumbs]");
  main.src = "../" + p.images[0].src;
  main.alt = p.images[0].alt;
  main.style.objectPosition = p.images[0].pos || "";
  thumbs.innerHTML = p.images.map(function (im, i) {
    return '<button type="button" class="' + (i === 0 ? "active" : "") + '" data-i="' + i + '" aria-label="' + I.t("p.photo") + " " + (i + 1) + '"><img src="../' + im.src + '" alt=""></button>';
  }).join("");
  thumbs.querySelectorAll("button").forEach(function (b) {
    b.addEventListener("click", function () {
      thumbs.querySelectorAll("button").forEach(function (x) { x.classList.remove("active"); });
      b.classList.add("active");
      main.src = "../" + p.images[Number(b.dataset.i)].src;
      main.style.objectPosition = p.images[Number(b.dataset.i)].pos || "";
    });
  });

  /* Збільшення фото */
  var lightbox = document.querySelector("[data-lightbox]");
  var lbImg = document.querySelector("[data-lightbox-img]");
  document.querySelector(".gallery__main").addEventListener("click", function () { lbImg.src = main.src; lightbox.hidden = false; });
  document.querySelector("[data-lightbox-close]").addEventListener("click", function () { lightbox.hidden = true; });
  lightbox.addEventListener("click", function (e) { if (e.target === lightbox) lightbox.hidden = true; });
  document.addEventListener("keydown", function (e) { if (e.key === "Escape") lightbox.hidden = true; });

  /* Інформація */
  var qty = 1;
  var sale = p.oldPrice ? '<span class="old">' + U.fmt(p.oldPrice) + "</span>" + '<span class="save">−' + U.discount(p) + "%</span>" : "";
  var stock = p.stock > 0 ? '<span class="stock">' + I.t("p.stockIn") + p.stock + " шт</span>" : '<span class="stock out">' + I.t("p.stockOut") + "</span>";
  var specs = U.specs(p).map(function (s) { return "<li>" + s + "</li>"; }).join("");

  var info = document.querySelector("[data-info]");
  info.innerHTML =
    '<span class="cat">' + U.catLabel(p.category) + "</span>" +
    "<h1>" + U.name(p) + "</h1>" +
    '<div class="prices"><span class="price">' + U.fmt(p.price) + "</span>" + sale + "</div>" + stock +
    '<p class="desc">' + U.desc(p) + "</p>" +
    '<ul class="specs">' + specs + "</ul>" +
    '<div class="qty"><button type="button" data-dec aria-label="' + I.t("co.dec") + '">−</button><span data-qty>1</span><button type="button" data-inc aria-label="' + I.t("co.inc") + '">+</button></div>' +
    '<div class="actions"><button class="btn-primary" type="button" data-add>' + I.t("p.add") + "</button>" +
    '<a class="btn-ghost" href="' + U.tg(I.t("ord.want") + ": " + U.name(p) + " — " + U.fmt(p.price)) + '" target="_blank" rel="noopener">' + I.t("p.order") + "</a></div>" +
    '<div class="delivery"><b>' + I.t("p.delivery") + '</b><br><b>' + I.t("p.payment") + '</b><br><i>' + I.t("p.demo") + "</i></div>";

  var qtyEl = info.querySelector("[data-qty]");
  info.querySelector("[data-dec]").addEventListener("click", function () { if (qty > 1) qty--; qtyEl.textContent = qty; });
  info.querySelector("[data-inc]").addEventListener("click", function () { if (qty < p.stock) qty++; qtyEl.textContent = qty; });

  info.querySelector("[data-add]").addEventListener("click", function () {
    C.add(p.id, qty);
    var toast = document.querySelector("[data-toast]");
    toast.textContent = I.t("card.add") + ": " + U.name(p) + " ×" + qty;
    toast.classList.add("show");
    setTimeout(function () { toast.classList.remove("show"); }, 2200);
  });

  /* SEO: Product schema */
  var seo = document.createElement("script");
  seo.type = "application/ld+json";
  seo.textContent = JSON.stringify({
    "@context": "https://schema.org",
    "@type": "Product",
    name: U.name(p),
    image: p.images.map(function (im) { return new URL("../" + im.src, location.href).href; }),
    description: U.desc(p),
    brand: { "@type": "Brand", name: "Girliandy" },
    offers: { "@type": "Offer", price: p.price, priceCurrency: "UAH", availability: "https://schema.org/" + (p.stock > 0 ? "InStock" : "OutOfStock") }
  });
  document.head.appendChild(seo);

  /* Схожі товари */
  var similar = D.products.filter(function (x) { return x.category === p.category && x.id !== p.id; }).slice(0, 4);
  var simEl = document.querySelector("[data-similar]");
  simEl.innerHTML = similar.map(U.cardHTML).join("") || '<p class="empty">' + I.t("p.noSimilar") + "</p>";
  simEl.querySelectorAll(".btn-add").forEach(function (b) { b.addEventListener("click", function () { C.add(b.dataset.id, 1); }); });

  C.updateBadge();
})();
