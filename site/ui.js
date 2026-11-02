/* Спільні хелпери для сторінок магазину. */
(function () {
  "use strict";
  var IMG = "../";

  function fmt(n) { return n.toLocaleString("uk-UA") + " ₴"; }
  function img(p) { return IMG + p.images[0].src; }
  function catLabel(id) {
    var c = (window.GIRLIANDY.categories || []).find(function (x) { return x.id === id; });
    return c ? c.label : id;
  }
  function discount(p) { return p.oldPrice ? Math.round((1 - p.price / p.oldPrice) * 100) : 0; }

  function cardHTML(p) {
    var sale = p.oldPrice ? '<span class="old">' + fmt(p.oldPrice) + "</span>" : "";
    var saleBadge = p.oldPrice ? '<span class="badge badge--sale">−' + discount(p) + "%</span>" : "";
    var badge = p.badge ? '<span class="badge">' + p.badge + "</span>" : saleBadge;
    var stock = p.stock > 0 ? '<span class="stock">В наявності</span>' : '<span class="stock out">Немає</span>';
    return '<article class="pcard">' +
      '<div class="pic"><img src="' + img(p) + '" alt="' + p.images[0].alt + '" loading="lazy">' + badge + "</div>" +
      '<div class="info"><h3 class="name">' + p.name + '</h3>' +
      '<p class="desc">' + p.specs[0] + "</p>" +
      '<div class="prices"><span class="price">' + fmt(p.price) + "</span>" + sale + "</div>" + stock +
      '<div class="actions"><a class="btn-more" href="product.html?slug=' + p.slug + '">Детальніше</a>' +
      '<button class="btn-add" type="button" data-id="' + p.id + '" aria-label="Додати в кошик">+</button></div></div></article>';
  }

  function tg(msg) { return "https://t.me/" + window.GIRLIANDY.tg + "?text=" + encodeURIComponent(msg); }

  window.UI = { fmt: fmt, img: img, catLabel: catLabel, discount: discount, cardHTML: cardHTML, tg: tg };
})();
