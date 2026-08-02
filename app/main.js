import { CONFIG } from "./config.js";
import { bootDashboard } from "./dashboard-page.js";
import { renderMapPage } from "./map-page.js";
import {
  renderAboutPage,
  renderLegalPage,
  renderPromoterPage,
  renderSharePage,
  renderVenuePage
} from "./public-pages.js";
import { appRoot, escapeHtml, icon, publicPage, route, wireGlobalUi } from "./ui.js";

let renderSequence = 0;

function normalizePath() {
  const clean = decodeURI(location.pathname || "/").replace(/\/{2,}/g, "/");
  return clean.length > 1 ? clean.replace(/\/$/, "") : "/";
}

function routeParts(path) {
  return path.split("/").filter(Boolean).map((part) => decodeURIComponent(part));
}

function notFound() {
  document.title = "Page not found | PourMap";
  appRoot.innerHTML = publicPage(`<div class="app-container"><section class="hero-card" style="background-image:radial-gradient(circle at 82% 18%,rgba(54,241,221,.16),transparent 24rem),linear-gradient(135deg,#111d31,#25112b)"><div class="hero-card__content"><span class="eyebrow">Wrong pin</span><h1 class="display">Nothing is pouring at this address.</h1><p class="lead">Return to the live map, search a bartender, or open the bartender portal.</p><div class="button-row" style="margin-top:1.2rem"><a class="button button--primary" href="/" data-route>${icon("map")} Open the map</a><a class="button button--ghost" href="/dashboard" data-route>Bartender portal</a></div></div></section></div>`);
  wireGlobalUi();
}

function renderFailure(error) {
  console.error("[PourMap] route render failed", error);
  document.body.classList.remove("map-body");
  document.title = "PourMap needs a reset";
  appRoot.innerHTML = `<main class="boot-screen"><div class="boot-logo"><img src="/assets/pourmap-mark.svg" alt="" /><strong>POURMAP</strong></div><h1 style="margin:0;font-family:var(--display);text-transform:uppercase;text-align:center">The map hit turbulence.</h1><p>${escapeHtml(error?.message || "Refresh the page to try again.")}</p><div class="button-row"><button class="button button--primary" type="button" data-retry-route>Try again</button><a class="button button--ghost" href="/" data-route>Return to map</a></div></main>`;
  document.querySelector("[data-retry-route]")?.addEventListener("click", () => renderRoute());
  wireGlobalUi();
}

async function renderRoute() {
  const sequence = ++renderSequence;
  const path = normalizePath();
  const parts = routeParts(path);

  try {
    if (path === "/" || path === "/map") {
      await renderMapPage();
    } else if (["/dashboard", "/login", "/signup", "/account"].includes(path)) {
      await bootDashboard();
    } else if (path === "/about") {
      renderAboutPage();
    } else if (path === "/privacy") {
      renderLegalPage("privacy");
    } else if (path === "/terms") {
      renderLegalPage("terms");
    } else if (parts[0] === "venue" && parts[1] && parts.length === 2) {
      await renderVenuePage(parts[1]);
    } else if (parts[0] === "bartender" && parts[1] && parts.length === 2) {
      await renderPromoterPage(parts[1]);
    } else if (parts[0] === "r" && parts[1] && parts.length === 2) {
      await renderSharePage(parts[1]);
    } else if (parts.length === 1 && !CONFIG.reservedRoutes.has(parts[0].toLowerCase())) {
      await renderPromoterPage(parts[0]);
    } else {
      notFound();
    }
  } catch (error) {
    if (sequence === renderSequence) renderFailure(error);
  }
}

window.addEventListener("popstate", () => renderRoute());
window.addEventListener("pourmap:authenticated", () => {
  if (["/dashboard", "/login", "/signup", "/account"].includes(normalizePath())) renderRoute();
});

document.addEventListener("click", (event) => {
  const link = event.target.closest("a[data-route]");
  if (!link || event.defaultPrevented || event.metaKey || event.ctrlKey || event.shiftKey || event.altKey || link.target === "_blank") return;
  const url = new URL(link.href, location.origin);
  if (url.origin !== location.origin) return;
  event.preventDefault();
  route(`${url.pathname}${url.search}${url.hash}`);
});

renderRoute();
