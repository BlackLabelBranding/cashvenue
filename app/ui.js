import { CONFIG } from "./config.js";

export const appRoot = document.querySelector("#app");

export function escapeHtml(value = "") {
  return String(value)
    .replaceAll("&", "&amp;")
    .replaceAll("<", "&lt;")
    .replaceAll(">", "&gt;")
    .replaceAll('"', "&quot;")
    .replaceAll("'", "&#039;");
}

export function safeUrl(value, fallback = "#") {
  if (!value) return fallback;
  try {
    const url = new URL(value, location.origin);
    return ["http:", "https:", "mailto:", "tel:"].includes(url.protocol) ? url.href : fallback;
  } catch {
    return fallback;
  }
}

export function icon(name, className = "icon") {
  const paths = {
    menu: '<path d="M4 6h16M4 12h16M4 18h16"/>',
    close: '<path d="M6 6l12 12M18 6L6 18"/>',
    phone: '<path d="M22 16.9v3a2 2 0 0 1-2.2 2 19.8 19.8 0 0 1-8.6-3.1 19.5 19.5 0 0 1-6-6A19.8 19.8 0 0 1 2.1 4.2 2 2 0 0 1 4.1 2h3a2 2 0 0 1 2 1.7c.1 1 .4 2 .7 2.9a2 2 0 0 1-.5 2.1L8.1 9.9a16 16 0 0 0 6 6l1.2-1.2a2 2 0 0 1 2.1-.5c1 .4 1.9.6 2.9.7A2 2 0 0 1 22 16.9z"/>',
    pin: '<path d="M21 10c0 7-9 12-9 12S3 17 3 10a9 9 0 1 1 18 0z"/><circle cx="12" cy="10" r="3"/>',
    calendar: '<rect x="3" y="4" width="18" height="17" rx="2"/><path d="M8 2v4M16 2v4M3 10h18"/>',
    ticket: '<path d="M2 9a3 3 0 0 0 0 6v4h20v-4a3 3 0 0 0 0-6V5H2v4z"/><path d="M13 5v2M13 10v2M13 15v2"/>',
    beer: '<path d="M6 3h10v17a2 2 0 0 1-2 2H8a2 2 0 0 1-2-2V3z"/><path d="M16 7h2a4 4 0 0 1 0 8h-2M6 8h10"/>',
    target: '<circle cx="12" cy="12" r="9"/><circle cx="12" cy="12" r="5"/><circle cx="12" cy="12" r="1"/>',
    game: '<path d="M7 9h10a5 5 0 0 1 4.7 6.7l-1 2.7a2 2 0 0 1-3.3.7L15 17H9l-2.4 2.1a2 2 0 0 1-3.3-.7l-1-2.7A5 5 0 0 1 7 9z"/><path d="M7 13h4M9 11v4M16 13h.01M19 15h.01"/>',
    arrow: '<path d="M5 12h14M13 6l6 6-6 6"/>',
    clock: '<circle cx="12" cy="12" r="9"/><path d="M12 7v5l3 2"/>',
    mail: '<rect x="3" y="5" width="18" height="14" rx="2"/><path d="M3 7l9 6 9-6"/>',
    users: '<path d="M16 21v-2a4 4 0 0 0-4-4H6a4 4 0 0 0-4 4v2"/><circle cx="9" cy="7" r="4"/><path d="M22 21v-2a4 4 0 0 0-3-3.9M16 3.1a4 4 0 0 1 0 7.8"/>',
    check: '<path d="M20 6L9 17l-5-5"/>',
    share: '<circle cx="18" cy="5" r="3"/><circle cx="6" cy="12" r="3"/><circle cx="18" cy="19" r="3"/><path d="M8.6 10.5l6.8-4M8.6 13.5l6.8 4"/>',
    login: '<path d="M15 3h4a2 2 0 0 1 2 2v14a2 2 0 0 1-2 2h-4M10 17l5-5-5-5M15 12H3"/>',
    home: '<path d="M3 11l9-8 9 8v10h-6v-6H9v6H3V11z"/>',
    settings: '<circle cx="12" cy="12" r="3"/><path d="M19.4 15a1.7 1.7 0 0 0 .3 1.9l.1.1-2.8 2.8-.1-.1a1.7 1.7 0 0 0-1.9-.3 1.7 1.7 0 0 0-1 1.6v.2h-4V21a1.7 1.7 0 0 0-1-1.6 1.7 1.7 0 0 0-1.9.3l-.1.1L4.2 17l.1-.1a1.7 1.7 0 0 0 .3-1.9A1.7 1.7 0 0 0 3 14H2.8v-4H3a1.7 1.7 0 0 0 1.6-1 1.7 1.7 0 0 0-.3-1.9L4.2 7 7 4.2l.1.1a1.7 1.7 0 0 0 1.9.3A1.7 1.7 0 0 0 10 3V2.8h4V3a1.7 1.7 0 0 0 1 1.6 1.7 1.7 0 0 0 1.9-.3l.1-.1L19.8 7l-.1.1a1.7 1.7 0 0 0-.3 1.9 1.7 1.7 0 0 0 1.6 1h.2v4H21a1.7 1.7 0 0 0-1.6 1z"/>',
    refresh: '<path d="M20 6v5h-5M4 18v-5h5"/><path d="M18 9a7 7 0 0 0-12-3L4 8M6 15a7 7 0 0 0 12 3l2-2"/>'
  };
  return `<svg class="${className}" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round" aria-hidden="true">${paths[name] || paths.arrow}</svg>`;
}

export function formatDate(value, options = {}) {
  if (!value) return "Date TBA";
  const date = new Date(value);
  if (Number.isNaN(date.getTime())) return "Date TBA";
  return new Intl.DateTimeFormat("en-US", {
    timeZone: options.timeZone || "America/Chicago",
    weekday: options.weekday || "long",
    month: options.month || "long",
    day: options.day || "numeric",
    year: options.year === false ? undefined : "numeric",
    hour: options.time === false ? undefined : "numeric",
    minute: options.time === false ? undefined : "2-digit"
  }).format(date);
}

export function eventDateParts(value) {
  const date = new Date(value);
  if (Number.isNaN(date.getTime())) return { month: "TBA", day: "—" };
  return {
    month: new Intl.DateTimeFormat("en-US", { timeZone: "America/Chicago", month: "short" }).format(date),
    day: new Intl.DateTimeFormat("en-US", { timeZone: "America/Chicago", day: "numeric" }).format(date)
  };
}

export function publicEventSlug(event) {
  return event?.metadata?.public_slug || String(event?.slug || "").replace(/^truckers-pub-/, "");
}

export function eventImage(event) {
  return event?.hero_image_url || CONFIG.assets.events;
}

export function orderUrl(site) {
  return site?.settings?.toast_order_url || site?.order_url || site?.fallback_order_url || "";
}

export function address(site) {
  return [site.address_line1, site.city, site.state, site.postal_code].filter(Boolean).join(", ");
}

export function directionsUrl(site) {
  return `https://www.google.com/maps/search/?api=1&query=${encodeURIComponent(address(site))}`;
}

export function navigate(path) {
  if (path === location.pathname && !location.search) return;
  history.pushState({}, "", path);
  window.dispatchEvent(new PopStateEvent("popstate"));
  scrollTo({ top: 0, behavior: "instant" });
}

export function routeLink(path, label, className = "") {
  return `<a href="${path}" class="js-route ${className}">${label}</a>`;
}

export function showToast(message, error = false) {
  let toast = document.querySelector("#site-toast");
  if (!toast) {
    toast = document.createElement("div");
    toast.id = "site-toast";
    toast.className = "toast";
    document.body.appendChild(toast);
  }
  toast.textContent = message;
  toast.className = `toast is-visible${error ? " is-error" : ""}`;
  clearTimeout(showToast.timer);
  showToast.timer = setTimeout(() => toast.classList.remove("is-visible"), 4200);
}

export function pageHero({ eyebrow, title, copy, image = CONFIG.assets.hero, actions = "" }) {
  return `<section class="page-hero" style="--hero-image:url('${safeUrl(image)}')">
    <div class="container page-hero__inner">
      <p class="eyebrow">${escapeHtml(eyebrow)}</p>
      <h1 class="display">${escapeHtml(title)}</h1>
      ${copy ? `<p class="lead">${escapeHtml(copy)}</p>` : ""}
      ${actions ? `<div class="button-row">${actions}</div>` : ""}
    </div>
  </section>`;
}

function active(path) {
  if (path === "/") return location.pathname === "/";
  return location.pathname === path || location.pathname.startsWith(`${path}/`);
}

function socialLinks(site) {
  return [
    site.social_links?.facebook && `<a href="${safeUrl(site.social_links.facebook)}" target="_blank" rel="noreferrer">Facebook</a>`,
    site.social_links?.instagram && `<a href="${safeUrl(site.social_links.instagram)}" target="_blank" rel="noreferrer">Instagram</a>`,
    site.social_links?.tiktok && `<a href="${safeUrl(site.social_links.tiktok)}" target="_blank" rel="noreferrer">TikTok</a>`
  ].filter(Boolean).join("");
}

export function publicShell(site, content) {
  const phone = site.contact_phone || "(217) 994-9294";
  const map = directionsUrl(site);
  const nav = CONFIG.routes.map(([path, label]) => `<a class="js-route${active(path) ? " is-active" : ""}" href="${path}">${label}</a>`).join("");
  document.body.classList.remove("admin-body");
  document.documentElement.style.setProperty("--brand-primary", site.brand?.primary || "#d7192d");
  return `<div class="shell">
    <div class="topbar"><div class="container topbar__inner">
      <a href="${map}" target="_blank" rel="noreferrer">${icon("pin")} ${escapeHtml(address(site))}</a>
      <a href="tel:${phone.replace(/[^+\d]/g, "")}">${icon("phone")} ${escapeHtml(phone)}</a>
      <span class="topbar__hours">Open daily 11 AM–1 AM</span>
    </div></div>
    <header class="site-header"><div class="container site-header__inner">
      <a class="brand js-route" href="/"><img src="${CONFIG.assets.logo}" alt="Truckers Pub Inc." /></a>
      <nav class="nav" aria-label="Main navigation">${nav}</nav>
      <a class="button button--primary header-action" href="tel:${phone.replace(/[^+\d]/g, "")}">${icon("phone")} Call the Pub</a>
      <button class="menu-toggle" type="button" aria-label="Open navigation" aria-expanded="false">${icon("menu")}</button>
    </div><nav class="mobile-menu" aria-label="Mobile navigation">${nav}<a href="tel:${phone.replace(/[^+\d]/g, "")}">Call the Pub</a></nav></header>
    <main>${content}</main>
    <footer class="footer"><div class="container">
      <div class="footer__grid">
        <div class="footer__brand"><img src="${CONFIG.assets.logo}" alt="Truckers Pub Inc." /><p>Drinks, games, live entertainment, and a friendly Effingham stop since 2013.</p></div>
        <div><h3>Visit</h3><p>${escapeHtml(address(site))}<br/><a href="tel:${phone.replace(/[^+\d]/g, "")}">${escapeHtml(phone)}</a><br/><a href="mailto:${escapeHtml(site.contact_email || "truckerspubinc@gmail.com")}">${escapeHtml(site.contact_email || "truckerspubinc@gmail.com")}</a></p></div>
        <div><h3>Explore</h3><div class="footer__links">${routeLink("/events", "Monthly Events")}${routeLink("/happy-hour", "Happy Hour")}${routeLink("/gallery", "Gallery")}${routeLink("/faq", "FAQ")}</div></div>
        <div><h3>Connect</h3><div class="footer__links">${socialLinks(site)}${routeLink("/contact", "Contact")}${routeLink("/admin", "Management Login")}</div></div>
      </div>
      <div class="footer__bottom"><span>© ${new Date().getFullYear()} Truckers Pub Inc. All rights reserved.</span><span class="footer__credit">Created by <a href="https://blacklabel1.com" target="_blank" rel="noreferrer">Black Label Branding LLC</a></span></div>
    </div></footer>
    <div class="mobile-actions"><a href="tel:${phone.replace(/[^+\d]/g, "")}">Call</a>${routeLink("/events", "Events")}<a href="${map}" target="_blank" rel="noreferrer">Directions</a></div>
  </div>`;
}

export function wireShell() {
  const toggle = document.querySelector(".menu-toggle");
  const mobile = document.querySelector(".mobile-menu");
  toggle?.addEventListener("click", () => {
    const open = mobile.classList.toggle("is-open");
    toggle.setAttribute("aria-expanded", String(open));
    toggle.innerHTML = icon(open ? "close" : "menu");
  });
}

