import { CONFIG, FALLBACK_EVENTS, FALLBACK_SITE } from "./config.js";
import { bootAdmin } from "./admin-ui.js";
import { eventPage, wireEventPage } from "./event-page.js";
import { aboutPage, beerPage, contactPage, eventsPage, homePage, jobsPage, menuPage, notFoundPage, privateEventsPage } from "./pages.js";
import { publicBundle, publicEvent, submitForm, track } from "./supabase.js";
import { appRoot, escapeHtml, navigate, publicEventSlug, publicShell, showToast, wireShell } from "./ui.js";

let bundle = { site: FALLBACK_SITE, events: FALLBACK_EVENTS };
let trackedPath = "";

function titleFor(path) {
  if (path === "/") return "Hangar 18 | Windsor, Illinois";
  if (path.startsWith("/event/")) return "Event Tickets | Hangar 18";
  const names = { "/about-us":"About", "/about":"About", "/menu":"Food Menu", "/food":"Food Menu", "/beer":"Craft Beer", "/craft-brews":"Craft Beer", "/events":"Events & Tickets", "/private-events":"Private Events", "/jobs":"Jobs", "/contact":"Contact", "/contact-us":"Contact", "/admin":"Management" };
  return `${names[path] || "Hangar 18"} | Hangar 18`;
}

function setHead(path) {
  document.title = titleFor(path);
  const canonical = document.querySelector('link[rel="canonical"]');
  if (canonical) canonical.href = `https://h18brewing.com${path === "/" ? "/" : path}`;
}

function cleanPath() {
  let path = location.pathname.replace(/\/+$/, "") || "/";
  const redirects = { "/home":"/", "/about":"/about-us", "/food":"/menu", "/craft-brews":"/beer", "/contact-us":"/contact" };
  if (redirects[path]) { history.replaceState({}, "", redirects[path] + location.search); path = redirects[path]; }
  return path;
}

async function loadBundle() {
  try {
    const result = await publicBundle();
    if (result?.site) bundle = { site: { ...FALLBACK_SITE, ...result.site }, events: Array.isArray(result.events) && result.events.length ? result.events : FALLBACK_EVENTS };
  } catch (error) {
    console.warn("Live venue data unavailable; using the cached Hangar 18 experience.", error);
  }
}

function pageFor(path) {
  const site = bundle.site;
  if (path === "/") return homePage(site, bundle.events);
  if (path === "/about-us") return aboutPage(site);
  if (path === "/menu") return menuPage(site);
  if (path === "/beer") return beerPage(site);
  if (path === "/events") return eventsPage(bundle.events);
  if (path === "/private-events") return privateEventsPage(site);
  if (path === "/jobs") return jobsPage(site);
  if (path === "/contact") return contactPage(site);
  return notFoundPage();
}

function values(form) {
  const data = Object.fromEntries(new FormData(form).entries());
  return Object.fromEntries(Object.entries(data).map(([key,value]) => [key, typeof value === "string" ? value.trim() : value]));
}

function wirePublicForms() {
  document.querySelectorAll(".js-inquiry-form").forEach((form) => form.addEventListener("submit", async (event) => {
    event.preventDefault();
    const status = form.querySelector(".form-status");
    const button = form.querySelector("button[type=submit]");
    const data = values(form);
    const reserved = new Set(["name","email","phone","subject","message"]);
    const payload = Object.fromEntries(Object.entries(data).filter(([key]) => !reserved.has(key)));
    button.disabled = true; status.textContent = "Sending to Hangar 18…"; status.className = "form-status";
    try {
      await submitForm(form.dataset.formType, { name:data.name, email:data.email, phone:data.phone, subject:data.subject, message:data.message, payload });
      form.reset(); status.textContent = "Received. Hangar 18 management will follow up."; status.className = "form-status is-success";
    } catch (error) {
      status.textContent = error.message || "The message could not be sent."; status.className = "form-status is-error"; button.disabled = false;
    }
  }));
}

function wirePublicPage() {
  wireShell();
  wirePublicForms();
  document.querySelectorAll(".js-track-order").forEach((link) => link.addEventListener("click", () => track("click", { source:"order-button", medium:"order-online", destination:link.href }).catch(() => null)));
  document.querySelectorAll(".menu-tab").forEach((button) => button.addEventListener("click", () => {
    document.querySelectorAll(".menu-tab").forEach((item) => item.classList.toggle("is-active", item === button));
    document.querySelector(`#${CSS.escape(button.dataset.menuTarget)}`)?.scrollIntoView({ behavior:"smooth", block:"start" });
  }));
}

async function renderEvent(path) {
  const publicSlug = decodeURIComponent(path.split("/").filter(Boolean)[1] || "");
  const summary = bundle.events.find((item) => publicEventSlug(item) === publicSlug || item.slug === publicSlug || item.slug === `hangar-18-${publicSlug}`);
  let event = summary || null;
  try {
    const detail = await publicEvent(summary?.slug || `hangar-18-${publicSlug}`);
    if (detail?.event) event = detail.event;
  } catch (error) { console.warn("Detailed ticket data unavailable.", error); }
  appRoot.innerHTML = publicShell(bundle.site, eventPage(bundle.site, event));
  wirePublicPage();
  wireEventPage(event || {});
}

async function render() {
  const path = cleanPath();
  setHead(path);
  if (path === "/admin") { await bootAdmin(); return; }
  if (path.startsWith("/event/")) await renderEvent(path);
  else { appRoot.innerHTML = publicShell(bundle.site, pageFor(path)); wirePublicPage(); }
  if (trackedPath !== path) {
    trackedPath = path;
    track("landing_view", { source: document.referrer || "direct", medium: "website", page: path }).catch(() => null);
  }
}

window.addEventListener("popstate", () => render().catch((error) => { console.error(error); showToast("The page could not be loaded.", true); }));
document.addEventListener("click", (event) => {
  const route = event.target.closest("a.js-route");
  if (!route || route.target === "_blank" || event.defaultPrevented || event.metaKey || event.ctrlKey || event.shiftKey || event.altKey) return;
  const url = new URL(route.href);
  if (url.origin !== location.origin) return;
  event.preventDefault(); navigate(url.pathname + url.search);
});

(async function start() {
  try { await loadBundle(); await render(); }
  catch (error) {
    console.error(error);
    appRoot.innerHTML = `<main class="boot-screen"><img src="${CONFIG.assets.logo}" alt="Hangar 18" /><h1 class="h2">The hangar needs a quick reset.</h1><p>${escapeHtml(error.message || "Refresh the page to try again.")}</p><button class="button button--primary" onclick="location.reload()">Refresh</button></main>`;
  }
})();
