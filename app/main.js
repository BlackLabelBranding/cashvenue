import { upcomingEvents } from "./event-data.js";
import { ticketPage } from "./ticketing.js";
import { CONFIG, FALLBACK_SITE } from "./config.js";
import { bootAdmin } from "./admin-ui.js";
import { eventPage, wireEventPage } from "./event-page.js";
import { aboutPage, contactPage, eventsPage, faqPage, galleryPage, happyHourPage, homePage, newsPage, notFoundPage, servicesPage, testimonialsPage } from "./pages.js";
import { publicBundle, publicEvent, submitForm, track } from "./supabase.js";
import { appRoot, escapeHtml, navigate, publicEventSlug, publicShell, showToast, wireShell } from "./ui.js";

let bundle = { site: FALLBACK_SITE, events: [], eventsUnavailable: false };
let trackedPath = "";

function titleFor(path) {
  if (path === "/") return "Truckers Pub Inc. | Drinks, Games & Events in Effingham, IL";
  if (path.startsWith("/event/")) return "Event Details | Truckers Pub Inc.";
  const names = {
    "/about": "About",
    "/events": "Monthly Events",
    "/happy-hour": "Happy Hour",
    "/gallery": "Gallery",
    "/faq": "FAQ",
    "/contact": "Contact",
    "/services": "Drinks & Games",
    "/testimonials": "Guest Feedback",
    "/news": "News & Events",
    "/ticket": "Your Tickets",
    "/admin": "Management"
  };
  return `${names[path] || "Truckers Pub"} | Truckers Pub Inc.`;
}

function setHead(path) {
  document.title = titleFor(path);
  const canonical = document.querySelector('link[rel="canonical"]');
  if (canonical) canonical.href = `https://truckerspubinc.com${path === "/" ? "/" : path}`;
}

function cleanPath() {
  let path = location.pathname.replace(/\/+$/, "") || "/";
  const redirects = {
    "/home": "/",
    "/about-us": "/about",
    "/monthly-events": "/events",
    "/menu": "/happy-hour",
    "/contact-us": "/contact"
  };
  if (redirects[path]) {
    history.replaceState({}, "", redirects[path] + location.search);
    path = redirects[path];
  }
  return path;
}

async function loadBundle() {
  try {
    const result = await publicBundle();
    if (!result?.site || !Array.isArray(result.events)) throw new Error("Invalid venue event response");
    bundle = { site: { ...FALLBACK_SITE, ...result.site }, events: upcomingEvents(result.events), eventsUnavailable: false };
  } catch (error) {
    bundle.events = [];
    bundle.eventsUnavailable = true;
    console.warn("Live venue events unavailable.", error);
  }
}

function pageFor(path) {
  const site = bundle.site;
  if (path === "/") return homePage(site, bundle.events, bundle.eventsUnavailable);
  if (path === "/about") return aboutPage(site);
  if (path === "/events") return eventsPage(bundle.events, bundle.eventsUnavailable);
  if (path === "/happy-hour") return happyHourPage();
  if (path === "/gallery") return galleryPage();
  if (path === "/faq") return faqPage();
  if (path === "/contact") return contactPage(site);
  if (path === "/services") return servicesPage();
  if (path === "/testimonials") return testimonialsPage();
  if (path === "/news") return newsPage(bundle.events, bundle.eventsUnavailable);
  return notFoundPage();
}

function values(form) {
  const data = Object.fromEntries(new FormData(form).entries());
  return Object.fromEntries(Object.entries(data).map(([key, value]) => [key, typeof value === "string" ? value.trim() : value]));
}

function wirePublicForms() {
  document.querySelectorAll(".js-inquiry-form").forEach((form) => form.addEventListener("submit", async (event) => {
    event.preventDefault();
    const status = form.querySelector(".form-status");
    const button = form.querySelector("button[type=submit]");
    const data = values(form);
    const reserved = new Set(["name", "email", "phone", "subject", "message"]);
    const payload = Object.fromEntries(Object.entries(data).filter(([key]) => !reserved.has(key)));
    button.disabled = true;
    status.textContent = "Sending to Truckers Pub…";
    status.className = "form-status";
    try {
      await submitForm(form.dataset.formType, {
        name: data.name,
        email: data.email,
        phone: data.phone,
        subject: data.subject,
        message: data.message,
        payload
      });
      form.reset();
      status.textContent = "Received. Truckers Pub management will follow up.";
      status.className = "form-status is-success";
    } catch (error) {
      status.textContent = error.message || "The message could not be sent. Please call (217) 994-9294.";
      status.className = "form-status is-error";
      button.disabled = false;
    }
  }));
}

function wirePublicPage() {
  wireShell();
  wirePublicForms();
}

async function renderEvent(path) {
  const publicSlug = decodeURIComponent(path.split("/").filter(Boolean)[1] || "");
  const summary = bundle.events.find((item) => publicEventSlug(item) === publicSlug || item.slug === publicSlug || item.slug === `truckers-pub-${publicSlug}`);
  let event = summary || null;
  try {
    const detail = await publicEvent(summary?.slug || `truckers-pub-${publicSlug}`);
    if (detail?.event?.campaign_type === "event") event = detail.event;
  } catch (error) {
    console.info("Detailed event data is not available.", error);
  }
  appRoot.innerHTML = publicShell(bundle.site, eventPage(bundle.site, event));
  wirePublicPage();
  wireEventPage(event || {});
}

async function render() {
  const path = cleanPath();
  setHead(path);
  if (path === "/admin") {
    await bootAdmin();
    return;
  }
  if (path === "/ticket") { await ticketPage(bundle.site); wirePublicPage(); return; }
  if (path.startsWith("/event/")) await renderEvent(path);
  else {
    appRoot.innerHTML = publicShell(bundle.site, pageFor(path));
    wirePublicPage();
  }
  if (trackedPath !== path) {
    trackedPath = path;
    track("landing_view", { source: document.referrer || "direct", medium: "website", page: path }).catch(() => null);
  }
}

window.addEventListener("popstate", () => render().catch((error) => {
  console.error(error);
  showToast("The page could not be loaded.", true);
}));

document.addEventListener("click", (event) => {
  const route = event.target.closest("a.js-route");
  if (!route || route.target === "_blank" || event.defaultPrevented || event.metaKey || event.ctrlKey || event.shiftKey || event.altKey) return;
  const url = new URL(route.href);
  if (url.origin !== location.origin) return;
  event.preventDefault();
  navigate(url.pathname + url.search);
});

(async function start() {
  try {
    await loadBundle();
    await render();
  } catch (error) {
    console.error(error);
    appRoot.innerHTML = `<main class="boot-screen"><img src="${CONFIG.assets.logo}" alt="Truckers Pub Inc." /><h1 class="h2">We hit a rough patch in the road.</h1><p>${escapeHtml(error.message || "Refresh the page to try again.")}</p><button class="button button--primary" onclick="location.reload()">Refresh</button></main>`;
  }
})();

