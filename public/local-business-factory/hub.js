import { DESIGN_FAMILIES, getPreset, listBusinesses } from "./businesses.js";

const businesses = listBusinesses();
const grid = document.querySelector("#demo-grid");
const familyGrid = document.querySelector("#family-grid");
const filterRoot = document.querySelector("#hub-filters");
const countNode = document.querySelector("#hub-demo-count");

function esc(value = "") {
  return String(value)
    .replaceAll("&", "&amp;")
    .replaceAll("<", "&lt;")
    .replaceAll(">", "&gt;")
    .replaceAll('"', "&quot;")
    .replaceAll("'", "&#039;");
}

function card(item) {
  const preset = getPreset(item.industry);
  return (
    '<article class="hub-card" data-family="' + esc(item.family) + '">' +
      '<div class="hub-card__media" style="background-image:url(&quot;' + esc(item.heroImage) + '&quot;)"></div>' +
      '<div class="hub-card__veil"></div>' +
      '<div class="hub-card__top">' +
        '<span class="hub-pill">' + esc(preset.label) + "</span>" +
        '<span class="hub-pill">' + esc(DESIGN_FAMILIES[item.family]?.label || item.family) + "</span>" +
      "</div>" +
      '<div class="hub-card__body">' +
        "<h3>" + esc(item.name) + "</h3>" +
        "<p>" + esc(item.description) + "</p>" +
        '<div class="hub-card__meta">' +
          '<span>' + esc(item.heroVariant) + " hero</span>" +
          '<span>mobile-first</span>' +
          '<span>' + (item.verified ? "doğrulanmış veri" : "demo içerik") + "</span>" +
        "</div>" +
        '<div class="hub-card__actions">' +
          '<a href="./business-demo.html?business=' + encodeURIComponent(item.slug) + '">Demo Aç</a>' +
          '<a href="./business-demo.html?business=' + encodeURIComponent(item.slug) + '#offers">Hizmet Yapısını Gör</a>' +
        "</div>" +
      "</div>" +
    "</article>"
  );
}

function familyCard(key, family) {
  const count = businesses.filter((item) => item.family === key).length;
  return (
    "<article>" +
      "<small>" + esc(family.label) + "</small>" +
      "<h3>" + count + " demo modeli</h3>" +
      "<p>" + esc(family.description) + "</p>" +
    "</article>"
  );
}

function render() {
  if (grid) grid.innerHTML = businesses.map(card).join("");
  if (familyGrid) {
    familyGrid.innerHTML = Object.entries(DESIGN_FAMILIES)
      .map(([key, family]) => familyCard(key, family))
      .join("");
  }
  if (countNode) countNode.textContent = String(businesses.length);
}

function applyFilter(value) {
  document.querySelectorAll(".hub-card").forEach((node) => {
    node.hidden = value !== "all" && node.dataset.family !== value;
  });
  document.querySelectorAll(".hub-filter").forEach((button) => {
    button.classList.toggle("is-active", button.dataset.filter === value);
    button.setAttribute("aria-pressed", String(button.dataset.filter === value));
  });
}

render();

filterRoot?.addEventListener("click", (event) => {
  const button = event.target.closest("[data-filter]");
  if (!button) return;
  applyFilter(button.dataset.filter || "all");
});
