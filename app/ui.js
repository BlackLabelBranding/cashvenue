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
    if (!["http:", "https:", "mailto:", "tel:"].includes(url.protocol)) return fallback;
    return url.href;
  } catch {
    return fallback;
  }
}

export function titleCase(value = "") {
  return String(value)
    .replaceAll("_", " ")
    .replace(/\b\w/g, (letter) => letter.toUpperCase());
}

export function formatDate(value, options = {}) {
  if (!value) return "Date TBA";
  const date = new Date(value);
  if (Number.isNaN(date.getTime())) return "Date TBA";
  return new Intl.DateTimeFormat("en-US", {
    timeZone: options.timeZone || "America/Chicago",
    weekday: options.weekday === false ? undefined : (options.weekday || "short"),
    month: options.month || "short",
    day: options.day || "numeric",
    year: options.year === false ? undefined : (options.year || "numeric"),
    hour: options.time === false ? undefined : (options.hour || "numeric"),
    minute: options.time === false ? undefined : "2-digit"
  }).format(date);
}

export function formatTimeRange(start, end) {
  if (!start) return "Time TBA";
  const startDate = new Date(start);
  const endDate = end ? new Date(end) : null;
  const formatter = new Intl.DateTimeFormat("en-US", {
    timeZone: "America/Chicago",
    hour: "numeric",
    minute: "2-digit"
  });
  return endDate && !Number.isNaN(endDate.getTime())
    ? `${formatter.format(startDate)}–${formatter.format(endDate)}`
    : formatter.format(startDate);
}

export function dateBadge(value) {
  const date = new Date(value);
  if (Number.isNaN(date.getTime())) return { month: "TBA", day: "—" };
  return {
    month: new Intl.DateTimeFormat("en-US", { timeZone: "America/Chicago", month: "short" }).format(date),
    day: new Intl.DateTimeFormat("en-US", { timeZone: "America/Chicago", day: "numeric" }).format(date)
  };
}

export function money(value) {
  return new Intl.NumberFormat("en-US", { style: "currency", currency: "USD" }).format(Number(value || 0));
}

export function icon(name, className = "icon") {
  const paths = {
    map: '<path d="M9 18l-6 3V6l6-3 6 3 6-3v15l-6 3-6-3z"/><path d="M9 3v15M15 6v15"/>',
    search: '<circle cx="11" cy="11" r="7"/><path d="M20 20l-4-4"/>',
    close: '<path d="M6 6l12 12M18 6L6 18"/>',
    location: '<path d="M12 22s7-5.5 7-13a7 7 0 1 0-14 0c0 7.5 7 13 7 13z"/><circle cx="12" cy="9" r="2.5"/>',
    food: '<path d="M4 3v8M7 3v8M4 7h3M5.5 11v10M12 3v8a3 3 0 0 0 3 3V3M15 14v7"/>',
    ticket: '<path d="M3 8a3 3 0 0 0 0 6v4h18v-4a3 3 0 0 0 0-6V4H3v4z"/><path d="M13 4v3M13 10v4M13 17v1"/>',
    music: '<path d="M9 18V5l10-2v13"/><circle cx="6" cy="18" r="3"/><circle cx="16" cy="16" r="3"/>',
    verified: '<path d="M12 2l2.1 2.1 3-.2.9 2.9 2.5 1.7-1.1 2.8 1.1 2.8-2.5 1.7-.9 2.9-3-.2L12 22l-2.1-2.1-3 .2-.9-2.9-2.5-1.7 1.1-2.8-1.1-2.8L6 8.2l.9-2.9 3 .2L12 2z"/><path d="M8.5 12l2.2 2.2L15.8 9"/>',
    arrow: '<path d="M5 12h14M13 6l6 6-6 6"/>',
    user: '<circle cx="12" cy="8" r="4"/><path d="M4 21a8 8 0 0 1 16 0"/>',
    users: '<path d="M16 21v-2a4 4 0 0 0-4-4H6a4 4 0 0 0-4 4v2"/><circle cx="9" cy="7" r="4"/><path d="M22 21v-2a4 4 0 0 0-3-3.9M16 3.1a4 4 0 0 1 0 7.8"/>',
    calendar: '<rect x="3" y="4" width="18" height="17" rx="2"/><path d="M8 2v4M16 2v4M3 10h18"/>',
    clock: '<circle cx="12" cy="12" r="9"/><path d="M12 7v5l3 2"/>',
    share: '<circle cx="18" cy="5" r="3"/><circle cx="6" cy="12" r="3"/><circle cx="18" cy="19" r="3"/><path d="M8.6 10.5l6.8-4M8.6 13.5l6.8 4"/>',
    external: '<path d="M14 3h7v7M10 14L21 3M21 14v6a1 1 0 0 1-1 1H4a1 1 0 0 1-1-1V4a1 1 0 0 1 1-1h6"/>',
    heart: '<path d="M20.8 4.6a5.5 5.5 0 0 0-7.8 0L12 5.6l-1-1a5.5 5.5 0 0 0-7.8 7.8l1 1L12 21l7.8-7.6 1-1a5.5 5.5 0 0 0 0-7.8z"/>',
    instagram: '<rect x="3" y="3" width="18" height="18" rx="5"/><circle cx="12" cy="12" r="4"/><circle cx="17.5" cy="6.5" r="1"/>',
    facebook: '<path d="M14 8h3V4h-3a5 5 0 0 0-5 5v3H6v4h3v6h4v-6h3l1-4h-4V9a1 1 0 0 1 1-1z"/>',
    tiktok: '<path d="M15 4v10a4 4 0 1 1-4-4M15 4c1 3 3 4 6 4"/>',
    cash: '<rect x="3" y="6" width="18" height="12" rx="2"/><circle cx="12" cy="12" r="2.5"/><path d="M7 9H5v2M17 15h2v-2"/>',
    link: '<path d="M10 13a5 5 0 0 0 7.5.5l2-2a5 5 0 0 0-7-7l-1.1 1.1M14 11a5 5 0 0 0-7.5-.5l-2 2a5 5 0 0 0 7 7l1.1-1.1"/>',
    copy: '<rect x="9" y="9" width="12" height="12" rx="2"/><path d="M5 15H4a2 2 0 0 1-2-2V4a2 2 0 0 1 2-2h9a2 2 0 0 1 2 2v1"/>',
    plus: '<path d="M12 5v14M5 12h14"/>',
    play: '<path d="M8 5l11 7-11 7V5z"/>',
    stop: '<rect x="6" y="6" width="12" height="12" rx="2"/>',
    promo: '<path d="M3 11l18-7-7 18-3-8-8-3z"/><path d="M11 14l4-4"/>',
    chart: '<path d="M4 20V10M10 20V4M16 20v-7M22 20H2"/>',
    settings: '<circle cx="12" cy="12" r="3"/><path d="M19.4 15a1.7 1.7 0 0 0 .3 1.9l.1.1-2.8 2.8-.1-.1a1.7 1.7 0 0 0-1.9-.3 1.7 1.7 0 0 0-1 1.6v.2h-4V21a1.7 1.7 0 0 0-1-1.6 1.7 1.7 0 0 0-1.9.3l-.1.1L4.2 17l.1-.1a1.7 1.7 0 0 0 .3-1.9A1.7 1.7 0 0 0 3 14H2.8v-4H3a1.7 1.7 0 0 0 1.6-1 1.7 1.7 0 0 0-.3-1.9L4.2 7 7 4.2l.1.1a1.7 1.7 0 0 0 1.9.3A1.7 1.7 0 0 0 10 3V2.8h4V3a1.7 1.7 0 0 0 1 1.6 1.7 1.7 0 0 0 1.9-.3l.1-.1L19.8 7l-.1.1a1.7 1.7 0 0 0-.3 1.9 1.7 1.7 0 0 0 1.6 1h.2v4H21a1.7 1.7 0 0 0-1.6 1z"/>',
    logout: '<path d="M10 17l5-5-5-5M15 12H3M15 3h4a2 2 0 0 1 2 2v14a2 2 0 0 1-2 2h-4"/>',
    upload: '<path d="M12 16V4M7 9l5-5 5 5M4 20h16"/>',
    check: '<path d="M20 6L9 17l-5-5"/>',
    mail: '<rect x="3" y="5" width="18" height="14" rx="2"/><path d="M3 7l9 6 9-6"/>',
    phone: '<path d="M22 16.9v3a2 2 0 0 1-2.2 2 19.8 19.8 0 0 1-8.6-3.1 19.5 19.5 0 0 1-6-6A19.8 19.8 0 0 1 2.1 4.2 2 2 0 0 1 4.1 2h3a2 2 0 0 1 2 1.7c.1 1 .4 2 .7 2.9a2 2 0 0 1-.5 2.1L8.1 9.9a16 16 0 0 0 6 6l1.2-1.2a2 2 0 0 1 2.1-.5c1 .4 1.9.6 2.9.7A2 2 0 0 1 22 16.9z"/>',
    menu: '<path d="M4 6h16M4 12h16M4 18h16"/>',
    home: '<path d="M3 11l9-8 9 8v10h-6v-6H9v6H3V11z"/>',
    edit: '<path d="M12 20h9M16.5 3.5a2.1 2.1 0 0 1 3 3L8 18l-4 1 1-4L16.5 3.5z"/>'
  };
  return `<svg class="${escapeHtml(className)}" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round" aria-hidden="true">${paths[name] || paths.arrow}</svg>`;
}

export function route(path) {
  const next = new URL(path, location.origin);
  history.pushState({}, "", `${next.pathname}${next.search}${next.hash}`);
  window.dispatchEvent(new PopStateEvent("popstate"));
  if (!next.hash) scrollTo({ top: 0, behavior: "instant" });
}

function sessionSnapshot() {
  try { return JSON.parse(localStorage.getItem(CONFIG.sessionKey) || "null"); }
  catch { return null; }
}

export function siteNav({ active = "" } = {}) {
  const session = sessionSnapshot();
  const user = session?.user || null;
  const initial = escapeHtml((user?.email || "P").slice(0, 1).toUpperCase());
  return `<header class="site-nav"><div class="app-container site-nav__inner">
    <a class="brand" href="/" data-route><img src="/assets/pourmap-mark.svg" alt="" /><strong>POUR<span>MAP</span></strong></a>
    <nav class="nav-links" aria-label="Main navigation">
      <a class="nav-link${active === "map" ? " is-active" : ""}" href="/" data-route>${icon("map")} Map</a>
      <a class="nav-link${active === "about" ? " is-active" : ""}" href="/about" data-route>How it works</a>
    </nav>
    <div class="nav-actions">
      ${session?.access_token
        ? `<a class="button button--ghost button--small" href="/dashboard" data-route>Dashboard</a><a class="nav-avatar" href="/dashboard" data-route aria-label="Open account">${user?.user_metadata?.avatar_url ? `<img src="${safeUrl(user.user_metadata.avatar_url)}" alt="" />` : initial}</a>`
        : `<a class="button button--ghost button--small" href="/login" data-route>Sign in</a><a class="button button--primary button--small" href="/signup" data-route>Join PourMap</a>`}
      <button class="button button--icon button--ghost mobile-menu-button" type="button" aria-label="Open menu">${icon("menu")}</button>
    </div>
  </div></header>`;
}

export function publicPage(content, { active = "" } = {}) {
  document.body.classList.remove("map-body");
  return `${siteNav({ active })}<div class="page-shell"><main class="page-main">${content}</main></div>`;
}

export function avatarHtml(person = {}, size = "") {
  const config = person.avatar_config || {};
  const background = config.background || "#24334d";
  const accent = config.accent || "#36f1dd";
  const emoji = escapeHtml(config.emoji || "🍸");
  const sizeClass = size ? ` avatar--${size}` : "";
  if (person.photo_url) {
    return `<span class="avatar${sizeClass}" style="border-color:${escapeHtml(accent)}"><img src="${safeUrl(person.photo_url)}" alt="${escapeHtml(person.display_name || "Bartender")}" /></span>`;
  }
  return `<span class="avatar${sizeClass}" style="background:${escapeHtml(background)};border-color:${escapeHtml(accent)}">${emoji}</span>`;
}

export function crewStatus(person = {}) {
  const status = person.status || person.map_status || "tonight";
  if (status === "pouring_now" || status === "live" || status === "scheduled_now") return { label: "Pouring now", tone: "live" };
  if (status === "starts_soon") return { label: "Starts soon", tone: "soon" };
  if (status === "submitted") return { label: "Self-submitted", tone: "preview" };
  if (status === "confirmed") return { label: "Venue confirmed", tone: "verified" };
  if (status === "ended") return { label: "Shift ended", tone: "preview" };
  return { label: "Tonight", tone: "tonight" };
}

export function statusPill(value, label = "") {
  const status = typeof value === "string" ? crewStatus({ status: value }) : crewStatus(value || {});
  return `<span class="status-pill status-pill--${escapeHtml(status.tone)}">${status.tone === "live" ? '<span class="live-dot"></span>' : ""}${escapeHtml(label || status.label)}</span>`;
}

export function showToast(message, error = false) {
  const toast = document.querySelector("#toast");
  if (!toast) return;
  toast.textContent = String(message || "");
  toast.className = `toast is-visible${error ? " is-error" : ""}`;
  clearTimeout(showToast.timer);
  showToast.timer = setTimeout(() => { toast.className = "toast"; }, 4200);
}

export async function copyText(value) {
  if (navigator.clipboard?.writeText) {
    await navigator.clipboard.writeText(value);
    return;
  }
  const field = document.createElement("textarea");
  field.value = value;
  field.style.position = "fixed";
  field.style.opacity = "0";
  document.body.appendChild(field);
  field.select();
  document.execCommand("copy");
  field.remove();
}

export function wireGlobalUi() {
  document.querySelectorAll("[data-copy]").forEach((button) => {
    if (button.dataset.wired === "true") return;
    button.dataset.wired = "true";
    button.addEventListener("click", async () => {
      try {
        await copyText(button.dataset.copy || "");
        showToast(button.dataset.copyMessage || "Copied.");
      } catch {
        showToast("Could not copy that link.", true);
      }
    });
  });

  const mobileButton = document.querySelector(".mobile-menu-button");
  if (mobileButton && mobileButton.dataset.wired !== "true") {
    mobileButton.dataset.wired = "true";
    mobileButton.addEventListener("click", () => {
      document.querySelector(".nav-links")?.classList.toggle("is-open");
    });
  }
}
