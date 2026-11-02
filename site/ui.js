/* Спільні хелпери для сторінок магазину (з i18n). */
(function () {
  "use strict";
  var IMG = "../";
  var I = window.I18N;
  var BADGE_RU = { "Хіт": "Хит", "Гарантія 2 роки": "Гарантия 2 года" };

  function isRu() { return I.lang() === "ru"; }
  function fmt(n) { return n.toLocaleString("uk-UA") + " ₴"; }
  function img(p) { return IMG + p.images[0].src; }
  function name(p) { return isRu() && p.name_ru ? p.name_ru : p.name; }
  function desc(p) { return isRu() && p.description_ru ? p.description_ru : p.description; }
  function specs(p) { return (isRu() && p.specs_ru) || p.specs; }
  function badge(p) { if (!p.badge) return ""; return isRu() ? (BADGE_RU[p.badge] || p.badge) : p.badge; }
  function catLabel(id) {
    var c = (window.GIRLIANDY.categories || []).find(function (x) { return x.id === id; });
    if (!c) return id;
    return isRu() && c.label_ru ? c.label_ru : c.label;
  }
  function discount(p) { return p.oldPrice ? Math.round((1 - p.price / p.oldPrice) * 100) : 0; }
  function tg(msg) { return "https://t.me/" + window.GIRLIANDY.tg + "?text=" + encodeURIComponent(msg); }

  function cardHTML(p) {
    var sale = p.oldPrice ? '<span class="old">' + fmt(p.oldPrice) + "</span>" : "";
    var saleBadge = p.oldPrice ? '<span class="badge badge--sale">−' + discount(p) + "%</span>" : "";
    var b = badge(p);
    var bEl = b ? '<span class="badge">' + b + "</span>" : saleBadge;
    var stock = p.stock > 0 ? '<span class="stock">' + I.t("stock.in") + "</span>" : '<span class="stock out">' + I.t("stock.out") + "</span>";
    return '<article class="pcard">' +
      '<div class="pic"><img src="' + img(p) + '" alt="' + p.images[0].alt + '" loading="lazy">' + bEl + "</div>" +
      '<div class="info"><h3 class="name">' + name(p) + "</h3>" +
      '<p class="desc">' + specs(p)[0] + "</p>" +
      '<div class="prices"><span class="price">' + fmt(p.price) + "</span>" + sale + "</div>" + stock +
      '<div class="actions"><a class="btn-more" href="product.html?slug=' + p.slug + '">' + I.t("card.more") + "</a>" +
      '<button class="btn-add" type="button" data-id="' + p.id + '" aria-label="' + I.t("card.add") + '">+</button></div></div></article>';
  }

  window.UI = { fmt: fmt, img: img, name: name, desc: desc, specs: specs, badge: badge, catLabel: catLabel, discount: discount, tg: tg, cardHTML: cardHTML };
})();
