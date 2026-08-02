import { CONFIG } from "./config.js";
import { publicMap, recordActivity } from "./api.js";
import {
  appRoot, avatarHtml, crewStatus, escapeHtml, formatDate, icon, route,
  safeUrl, showToast, siteNav, statusPill, wireGlobalUi
} from "./ui.js";

const mapState = {
  map: null,
  markerLayer: null,
  markers: new Map(),
  venues: [],
  filtered: [],
  selectedVenueId: null,
  filter: "all",
  query: "",
  latitude: null,
  longitude: null,
  radius: CONFIG.defaultRadiusMiles,
  loading: false,
  debounce: null
};

function directionsUrl(venue) {
  const query = [venue.name, venue.address_line1, venue.city, venue.state, venue.postal_code].filter(Boolean).join(", ");
  return `https://www.google.com/maps/search/?api=1&query=${encodeURIComponent(query)}`;
}

function eventPrice(event) {
  return event?.metadata?.price_label || (event?.metadata?.ticketing_mode === "door" ? "At the door" : "Event details");
}

function ticketUrl(event) {
  return event?.metadata?.external_ticket_url || event?.destination_url || "";
}

function venueHasTickets(venue) {
  return (venue.events || []).some((event) => event?.metadata?.ticketing_mode === "external" || event?.metadata?.price_label);
}

function filterVenues() {
  mapState.filtered = mapState.venues.filter((venue) => {
    const crew = venue.crew || [];
    if (mapState.filter === "pouring") return crew.some((person) => ["pouring_now", "scheduled_now"].includes(person.status));
    if (mapState.filter === "tonight") return crew.length > 0;
    if (mapState.filter === "music") return (venue.events || []).length > 0;
    if (mapState.filter === "food") return Boolean(venue.order_url);
    if (mapState.filter === "tickets") return venueHasTickets(venue);
    if (mapState.filter === "verified") return Boolean(venue.is_verified);
    return true;
  });
}

function markerAvatar(person) {
  const config = person?.avatar_config || {};
  const background = config.background || "#24334d";
  const accent = config.accent || "#36f1dd";
  const emoji = escapeHtml(config.emoji || "🍸");
  if (person?.photo_url) {
    return `<span class="avatar" style="border-color:${escapeHtml(accent)}"><img src="${safeUrl(person.photo_url)}" alt="${escapeHtml(person.display_name || "Bartender")}" /></span>`;
  }
  return `<span class="avatar" style="background:${escapeHtml(background)};border-color:${escapeHtml(accent)}">${emoji}</span>`;
}

function markerHtml(venue) {
  const crew = venue.crew || [];
  const live = crew.some((person) => ["pouring_now", "scheduled_now"].includes(person.status));
  const avatars = crew.slice(0, 2).map(markerAvatar).join("") || `<span class="avatar" style="background:#20314c">🍺</span>`;
  const extra = crew.length > 2 ? `<span class="avatar avatar-more">+${crew.length - 2}</span>` : "";
  return `<div class="pourpin" data-venue-marker="${venue.id}"><div class="pourpin__bubble"><div class="avatar-stack">${avatars}${extra}</div></div>${live ? '<span class="pourpin__live"></span>' : ""}<span class="pourpin__label">${escapeHtml(venue.name)}</span></div>`;
}

function addMarkers() {
  mapState.markerLayer.clearLayers();
  mapState.markers.clear();
  mapState.filtered.forEach((venue) => {
    if (!Number.isFinite(Number(venue.latitude)) || !Number.isFinite(Number(venue.longitude))) return;
    const marker = L.marker([Number(venue.latitude), Number(venue.longitude)], {
      icon: L.divIcon({
        className: "pour-marker",
        html: markerHtml(venue),
        iconSize: [96, 92],
        iconAnchor: [48, 76]
      }),
      keyboard: true,
      title: `${venue.name}: ${(venue.crew || []).length} crew listed`
    });
    marker.on("click", () => selectVenue(venue.id, true));
    marker.addTo(mapState.markerLayer);
    mapState.markers.set(venue.id, marker);
  });
}

function crewNames(crew) {
  const names = (crew || []).map((person) => person.display_name).filter(Boolean);
  if (!names.length) return "Crew schedule coming soon";
  if (names.length === 1) return `${names[0]} is on the roster`;
  if (names.length === 2) return `${names[0]} and ${names[1]}`;
  return `${names.slice(0, 2).join(", ")} +${names.length - 2}`;
}

function eventMini(event) {
  if (!event) return "";
  return `<div class="event-mini"><strong>${icon("music")} ${escapeHtml(event.name)}</strong><span>${escapeHtml(formatDate(event.starts_at))} · ${escapeHtml(eventPrice(event))}</span></div>`;
}

function venueCard(venue) {
  const crew = venue.crew || [];
  const event = (venue.events || [])[0];
  const preview = crew.some((person) => person.preview);
  const avatarStack = crew.length
    ? `<div class="avatar-stack">${crew.slice(0, 3).map((person) => avatarHtml(person)).join("")}${crew.length > 3 ? `<span class="avatar avatar-more">+${crew.length - 3}</span>` : ""}</div>`
    : `<span class="avatar">🍺</span>`;
  const distance = venue.distance_miles != null ? `${Number(venue.distance_miles).toFixed(1)} mi` : titleCaseVenue(venue.venue_type);
  const liveCount = crew.filter((person) => ["pouring_now", "scheduled_now"].includes(person.status)).length;
  return `<article class="venue-result${mapState.selectedVenueId === venue.id ? " is-selected" : ""}" data-venue-card="${venue.id}">
    <div class="venue-result__cover" style="background-image:url('${safeUrl(venue.cover_image_url, "")}')"><span class="pill venue-result__distance">${escapeHtml(distance)}</span></div>
    <div class="venue-result__body">
      <div class="venue-result__title"><div><h2>${escapeHtml(venue.name)} ${venue.is_verified ? '<span title="Verified venue" style="display:inline-block;color:var(--aqua);vertical-align:-3px">' + icon("verified") + '</span>' : ""}</h2><div class="venue-result__meta">${escapeHtml([venue.city, venue.state].filter(Boolean).join(", "))} · ${escapeHtml(titleCaseVenue(venue.venue_type))}</div></div>${preview ? '<span class="status-pill status-pill--preview">Preview crew</span>' : ""}</div>
      <div class="crew-preview">${avatarStack}<div class="crew-preview__copy"><strong>${escapeHtml(crewNames(crew))}</strong><span>${liveCount ? `${liveCount} pouring now` : crew.length ? "Working tonight" : "Roster coming soon"}</span></div></div>
      ${eventMini(event)}
      <div class="venue-result__actions">
        <button class="button button--primary button--small" type="button" data-open-venue="${escapeHtml(venue.slug)}">See venue ${icon("arrow")}</button>
        <a class="button button--ghost button--small" href="${directionsUrl(venue)}" target="_blank" rel="noreferrer" data-directions="${venue.id}" aria-label="Directions to ${escapeHtml(venue.name)}">${icon("location")}</a>
        ${venue.order_url ? `<a class="button button--ghost button--small" href="${safeUrl(venue.order_url)}" target="_blank" rel="noreferrer" data-order="${venue.id}" aria-label="Order from ${escapeHtml(venue.name)}">${icon("food")}</a>` : event ? `<a class="button button--ghost button--small" href="${safeUrl(ticketUrl(event))}" target="_blank" rel="noreferrer" data-ticket="${event.id}" aria-label="Tickets for ${escapeHtml(event.name)}">${icon("ticket")}</a>` : ""}
      </div>
    </div>
  </article>`;
}

function titleCaseVenue(value = "") {
  return String(value || "Venue").replaceAll("_", " ").replace(/\b\w/g, (letter) => letter.toUpperCase());
}

function renderResults() {
  const results = document.querySelector("#discovery-results");
  const count = document.querySelector("#result-count");
  if (!results) return;
  count.textContent = mapState.loading
    ? "Updating the map..."
    : `${mapState.filtered.length} ${mapState.filtered.length === 1 ? "place" : "places"} on tonight's map`;
  if (mapState.loading) {
    results.innerHTML = `<div class="discovery-empty"><div class="boot-spinner" style="margin:0 auto 1rem"></div><strong>Checking tonight's roster...</strong><span>Loading live venues and shifts.</span></div>`;
    return;
  }
  if (!mapState.filtered.length) {
    results.innerHTML = `<div class="discovery-empty"><strong>No matching pour yet.</strong><span>Try another town, bartender, or filter.</span></div>`;
    return;
  }
  results.innerHTML = mapState.filtered.map(venueCard).join("");
  wireResultActions();
}

function wireResultActions() {
  document.querySelectorAll("[data-venue-card]").forEach((card) => card.addEventListener("click", (event) => {
    if (event.target.closest("a,button")) return;
    selectVenue(card.dataset.venueCard, true);
  }));
  document.querySelectorAll("[data-open-venue]").forEach((button) => button.addEventListener("click", () => route(`/venue/${button.dataset.openVenue}`)));
  document.querySelectorAll("[data-directions]").forEach((link) => link.addEventListener("click", () => recordActivity("directions", { venueId: link.dataset.directions, source: "map-card" })));
  document.querySelectorAll("[data-order]").forEach((link) => link.addEventListener("click", () => recordActivity("order_click", { venueId: link.dataset.order, source: "map-card" })));
  document.querySelectorAll("[data-ticket]").forEach((link) => link.addEventListener("click", () => recordActivity("ticket_click", { campaignId: link.dataset.ticket, source: "map-card" })));
}

function selectVenue(venueId, pan = false) {
  const venue = mapState.venues.find((item) => item.id === venueId);
  if (!venue) return;
  mapState.selectedVenueId = venueId;
  renderResults();
  if (pan && mapState.map) {
    mapState.map.flyTo([Number(venue.latitude), Number(venue.longitude)], Math.max(mapState.map.getZoom(), 13), { duration: .7 });
  }
  document.querySelector(`[data-venue-card="${venueId}"]`)?.scrollIntoView({ behavior: "smooth", block: "nearest" });
  document.querySelector("#discovery-panel")?.classList.remove("is-collapsed");
  recordActivity("pin_tap", { venueId, source: "map" });
}

async function loadVenues({ recenter = false } = {}) {
  mapState.loading = true;
  renderResults();
  try {
    const result = await publicMap({
      latitude: mapState.latitude,
      longitude: mapState.longitude,
      radiusMiles: mapState.radius,
      query: mapState.query || null
    });
    mapState.venues = Array.isArray(result?.venues) ? result.venues : [];
    filterVenues();
    addMarkers();
    renderResults();
    if (recenter && mapState.latitude != null && mapState.longitude != null) {
      mapState.map.flyTo([mapState.latitude, mapState.longitude], 12, { duration: .8 });
    } else if (mapState.filtered.length === 1) {
      const venue = mapState.filtered[0];
      mapState.map.flyTo([Number(venue.latitude), Number(venue.longitude)], 13, { duration: .6 });
    }
    recordActivity("map_view", { source: mapState.latitude == null ? "default-map" : "near-me", metadata: { venue_count: mapState.filtered.length, filter: mapState.filter } });
  } catch (error) {
    console.error(error);
    mapState.venues = [];
    mapState.filtered = [];
    renderResults();
    showToast(error.message || "The live map could not load.", true);
  } finally {
    mapState.loading = false;
    renderResults();
  }
}

function locateUser() {
  if (!navigator.geolocation) {
    showToast("Location is not available in this browser.", true);
    return;
  }
  const button = document.querySelector("#locate-button");
  button.disabled = true;
  button.innerHTML = `<span class="boot-spinner" style="width:20px;height:20px"></span>`;
  navigator.geolocation.getCurrentPosition(async (position) => {
    mapState.latitude = position.coords.latitude;
    mapState.longitude = position.coords.longitude;
    await loadVenues({ recenter: true });
    button.disabled = false;
    button.innerHTML = icon("location");
    showToast("Map centered near you.");
  }, (error) => {
    button.disabled = false;
    button.innerHTML = icon("location");
    showToast(error.code === 1 ? "Location permission was not granted." : "Your location could not be determined.", true);
  }, { enableHighAccuracy: false, timeout: 9000, maximumAge: 300000 });
}

function initMap() {
  if (!window.L) throw new Error("The map library did not load.");
  mapState.map = L.map("map", { zoomControl: false, attributionControl: true }).setView(CONFIG.defaultCenter, CONFIG.defaultZoom);
  L.control.zoom({ position: "bottomleft" }).addTo(mapState.map);
  L.tileLayer("https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png", {
    maxZoom: 19,
    attribution: '&copy; <a href="https://www.openstreetmap.org/copyright" target="_blank">OpenStreetMap</a>'
  }).addTo(mapState.map);
  mapState.markerLayer = L.layerGroup().addTo(mapState.map);
}

function wireMapUi() {
  wireGlobalUi();
  const search = document.querySelector("#map-search-input");
  search.addEventListener("input", () => {
    mapState.query = search.value.trim();
    clearTimeout(mapState.debounce);
    mapState.debounce = setTimeout(() => {
      loadVenues();
      if (mapState.query) recordActivity("search", { source: "map-search", metadata: { query: mapState.query.slice(0, 80) } });
    }, 350);
  });
  search.addEventListener("keydown", (event) => {
    if (event.key === "Enter") { clearTimeout(mapState.debounce); loadVenues(); }
  });
  document.querySelector("#clear-search")?.addEventListener("click", () => {
    search.value = "";
    mapState.query = "";
    loadVenues();
  });
  document.querySelectorAll("[data-map-filter]").forEach((button) => button.addEventListener("click", () => {
    mapState.filter = button.dataset.mapFilter;
    document.querySelectorAll("[data-map-filter]").forEach((item) => item.classList.toggle("is-active", item === button));
    filterVenues();
    addMarkers();
    renderResults();
  }));
  document.querySelector("#locate-button")?.addEventListener("click", locateUser);
  document.querySelector("#panel-handle")?.addEventListener("click", () => {
    document.querySelector("#discovery-panel")?.classList.toggle("is-collapsed");
  });
  window.addEventListener("pourmap:authenticated", () => renderMapPage());
}

export async function renderMapPage() {
  document.body.classList.add("map-body");
  document.title = "PourMap — See who's pouring near you";
  appRoot.innerHTML = `${siteNav({ active: "map" })}<main class="map-app">
    <div id="map" aria-label="Map of PourMap venues"></div>
    <div class="map-search-wrap">
      <div class="map-search">${icon("search")}<input id="map-search-input" type="search" autocomplete="off" placeholder="Search bartenders, venues, towns..." aria-label="Search PourMap" /><button class="button button--icon button--dark" id="clear-search" type="button" aria-label="Clear search">${icon("close")}</button></div>
      <div class="map-filter-bar" aria-label="Map filters">
        <button class="filter-chip is-active" type="button" data-map-filter="all">Everything</button>
        <button class="filter-chip" type="button" data-map-filter="pouring"><span class="live-dot" style="color:var(--success)"></span> Pouring now</button>
        <button class="filter-chip" type="button" data-map-filter="tonight">Tonight</button>
        <button class="filter-chip" type="button" data-map-filter="music">${icon("music")} Live music</button>
        <button class="filter-chip" type="button" data-map-filter="food">${icon("food")} Food</button>
        <button class="filter-chip" type="button" data-map-filter="tickets">${icon("ticket")} Tickets</button>
        <button class="filter-chip" type="button" data-map-filter="verified">${icon("verified")} Verified</button>
      </div>
    </div>
    <aside class="discovery-panel" id="discovery-panel">
      <button class="panel-handle" id="panel-handle" type="button" aria-label="Expand or collapse results"></button>
      <header class="discovery-panel__head"><h1>Tonight near you</h1><p id="result-count">Checking the map...</p></header>
      <div class="discovery-results" id="discovery-results"><div class="discovery-empty"><div class="boot-spinner" style="margin:0 auto 1rem"></div><strong>Checking tonight's roster...</strong></div></div>
    </aside>
    <button class="location-fab" id="locate-button" type="button" aria-label="Use my location">${icon("location")}</button>
  </main>`;
  wireMapUi();
  initMap();
  await loadVenues();
}
