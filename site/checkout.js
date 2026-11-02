(function () {
  "use strict";
  var D = window.GIRLIANDY, U = window.UI, C = window.Cart, I = window.I18N;

  var itemsEl = document.querySelector("[data-cart-items]");
  var totalEl = document.querySelector("[data-total]");

  function lineHTML(line) {
    var p = D.products.find(function (x) { return x.id === line.id; });
    if (!p) return "";
    return '<div class="cart-line">' +
      '<img src="' + U.img(p) + '" alt="">' +
      '<div class="meta"><div class="name">' + U.name(p) + '</div>' +
      '<div class="price">' + U.fmt(p.price) + "</div>" +
      '<div class="qty"><button type="button" data-dec="' + p.id + '" aria-label="' + I.t("co.dec") + '">−</button><span>' + line.qty + '</span><button type="button" data-inc="' + p.id + '" aria-label="' + I.t("co.inc") + '">+</button></div></div>' +
      '<button class="remove" type="button" data-remove="' + p.id + '">' + I.t("co.remove") + "</button></div>";
  }

  function renderCart() {
    var items = C.get();
    if (!items.length) {
      itemsEl.innerHTML = '<p class="cart-empty">' + I.t("co.empty") + "</p>";
      totalEl.textContent = "0 ₴";
    } else {
      itemsEl.innerHTML = items.map(lineHTML).join("");
      totalEl.textContent = U.fmt(C.total());
    }
    itemsEl.querySelectorAll("[data-inc]").forEach(function (b) { b.addEventListener("click", function () { change(b.dataset.inc, 1); }); });
    itemsEl.querySelectorAll("[data-dec]").forEach(function (b) { b.addEventListener("click", function () { change(b.dataset.dec, -1); }); });
    itemsEl.querySelectorAll("[data-remove]").forEach(function (b) { b.addEventListener("click", function () { C.remove(b.dataset.remove); renderCart(); }); });
  }

  function change(id, d) {
    var line = C.get().find(function (l) { return l.id === id; });
    if (line) C.setQty(id, line.qty + d);
    renderCart();
  }

  function field(name) { return document.querySelector('[data-field="' + name + '"]'); }
  function val(name) { return document.querySelector('[name="' + name + '"]').value.trim(); }

  function validate() {
    var ok = true;
    var checks = [
      ["name", val("name").length >= 2],
      ["phone", val("phone").replace(/\D/g, "").length >= 9],
      ["city", val("city").length >= 2],
      ["delivery", val("delivery") !== ""],
      ["address", val("address").length >= 2],
      ["payment", val("payment") !== ""]
    ];
    checks.forEach(function (c) { field(c[0]).classList.toggle("invalid", !c[1]); if (!c[1]) ok = false; });
    return ok;
  }

  function orderNumber() { return "G-" + Date.now().toString().slice(-6); }

  function buildMessage(num) {
    var items = C.get().map(function (l) {
      var p = D.products.find(function (x) { return x.id === l.id; });
      return "• " + U.name(p) + " — " + l.qty + " шт — " + U.fmt(p.price * l.qty);
    });
    return [
      I.t("ord.new") + " " + num,
      I.t("ord.name") + ": " + val("name"),
      I.t("ord.phone") + ": " + val("phone"),
      I.t("ord.city") + ": " + val("city"),
      I.t("ord.delivery") + ": " + val("delivery"),
      I.t("ord.address") + ": " + val("address"),
      I.t("ord.payment") + ": " + val("payment"),
      val("comment") ? I.t("ord.comment") + ": " + val("comment") : "",
      "—",
      items.join("\n"),
      I.t("ord.total") + ": " + U.fmt(C.total())
    ].filter(Boolean).join("\n");
  }

  document.querySelector("[data-form]").addEventListener("submit", function (e) {
    e.preventDefault();
    if (!C.get().length) { itemsEl.innerHTML = '<p class="cart-empty">' + I.t("co.emptyOrder") + "</p>"; return; }
    if (!validate()) return;
    var num = orderNumber();
    window.open(U.tg(buildMessage(num)), "_blank", "noopener");
    document.querySelector("[data-order-num]").textContent = I.t("co.orderNum") + " " + num;
    document.querySelector("[data-layout]").hidden = true;
    document.querySelector("[data-success]").hidden = false;
    window.scrollTo(0, 0);
    C.get().forEach(function (l) { C.remove(l.id); });
  });

  document.querySelectorAll("input, select, textarea").forEach(function (el) {
    el.addEventListener("input", function () { el.closest(".field").classList.remove("invalid"); });
  });

  renderCart();
  C.updateBadge();
})();
