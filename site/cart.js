/* Кошик у localStorage — спільний для всіх сторінок. */
(function () {
  "use strict";
  var KEY = "girliandy-cart";

  function read() {
    try { return JSON.parse(localStorage.getItem(KEY)) || []; }
    catch (e) { return []; }
  }
  function write(items) { localStorage.setItem(KEY, JSON.stringify(items)); }

  window.Cart = {
    get: read,
    add: function (id, qty) {
      var items = read();
      var line = items.find(function (l) { return l.id === id; });
      if (line) line.qty += qty; else items.push({ id: id, qty: qty });
      write(items);
      window.Cart.updateBadge();
    },
    setQty: function (id, qty) {
      var items = read().map(function (l) { return l.id === id ? { id: l.id, qty: qty } : l; })
        .filter(function (l) { return l.qty > 0; });
      write(items);
      window.Cart.updateBadge();
    },
    remove: function (id) {
      write(read().filter(function (l) { return l.id !== id; }));
      window.Cart.updateBadge();
    },
    count: function () { return read().reduce(function (s, l) { return s + l.qty; }, 0); },
    total: function () {
      var P = window.GIRLIANDY.products;
      return read().reduce(function (s, l) {
        var p = P.find(function (x) { return x.id === l.id; });
        return s + (p ? p.price * l.qty : 0);
      }, 0);
    },
    updateBadge: function () {
      var n = window.Cart.count();
      document.querySelectorAll("[data-cart-count]").forEach(function (el) { el.textContent = n; });
    }
  };
})();
