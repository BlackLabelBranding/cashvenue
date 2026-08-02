import { publicPromoter, publicShare, publicVenue, readSession, recordActivity, toggleFollow } from "./api.js";
import {
  appRoot, avatarHtml, copyText, dateBadge, escapeHtml, formatDate, formatTimeRange,
  icon, publicPage, route, safeUrl, showToast, statusPill, titleCase, wireGlobalUi
} from "./ui.js";

function address(venue = {}) {
  return [venue.address_line1, venue.city, venue.state, venue.postal_code].filter(Boolean).join(", ");
}

function directionsUrl(venue = {}) {
  return `https://www.google.com/maps/search/?api=1&query=${encodeURIComponent([venue.name, address(venue)].filter(Boolean).join(", "))}`;
}

function imageStyle(url, fallback = "linear-gradient(135deg,#17233a,#21142d)") {
  const safe = safeUrl(url, "");
  return safe ? `background-image:linear-gradient(0deg,rgba(8,11,18,.9),rgba(8,11,18,.12) 65%),url('${escapeHtml(safe)}')` : `background:${fallback}`;
}

function shiftCard(shift, { showPromoter = false } = {}) {
  const badge = dateBadge(shift.starts_at);
  const venue = shift.venue || {};
  const promoter = shift.promoter || {};
  return `<article class="shift-card">
    <div class="shift-date"><span>${escapeHtml(badge.month)}</span><b>${escapeHtml(badge.day)}</b></div>
    ${showPromoter ? avatarHtml(promoter) : ""}
    <div class="shift-card__copy">
      <strong>${showPromoter ? `<a href="/bartender/${escapeHtml(promoter.slug || "")}" data-route>${escapeHtml(promoter.display_name || "Bartender")}</a>` : `<a href="/venue/${escapeHtml(venue.slug || "")}" data-route>${escapeHtml(venue.name || "Venue")}</a>`}</strong>
      <span>${escapeHtml(formatDate(shift.starts_at, { year: false, time: false }))} · ${escapeHtml(formatTimeRange(shift.starts_at, shift.ends_at))}</span>
      ${shift.public_note ? `<span>${escapeHtml(shift.public_note)}</span>` : ""}
    </div>
    ${statusPill(shift.status || shift.approval_status || "tonight")}
  </article>`;
}

function eventCard(event, venue = null) {
  const eventVenue = event.venue || venue || {};
  const destination = event.metadata?.external_ticket_url || event.destination_url || "";
  const price = event.metadata?.price_label || (event.metadata?.ticketing_mode === "door" ? "At the door" : "Event details");
  return `<article class="event-card">
    <div class="event-card__image" style="${imageStyle(event.hero_image_url || eventVenue.cover_image_url)}"></div>
    <div class="event-card__body">
      <span class="eyebrow">${escapeHtml(eventVenue.name || "Live event")}</span>
      <h3>${escapeHtml(event.name || "Event")}</h3>
      <p>${escapeHtml(formatDate(event.starts_at))} · ${escapeHtml(price)}</p>
      ${event.description ? `<p>${escapeHtml(event.description)}</p>` : ""}
      <div class="button-row">
        ${destination ? `<a class="button button--primary button--small" href="${safeUrl(destination)}" target="_blank" rel="noreferrer" data-event-cta="${escapeHtml(event.id || "")}">${icon("ticket")} ${escapeHtml(event.call_to_action || "Event details")}</a>` : ""}
        ${eventVenue.slug ? `<a class="button button--ghost button--small" href="/venue/${escapeHtml(eventVenue.slug)}" data-route>Venue</a>` : ""}
      </div>
    </div>
  </article>`;
}

function venueTile(venue) {
  return `<a class="venue-tile" href="/venue/${escapeHtml(venue.slug || "")}" data-route style="${imageStyle(venue.cover_image_url)}">
    <div class="venue-tile__content"><h3>${escapeHtml(venue.name || "Venue")} ${venue.is_verified ? icon("verified") : ""}</h3><p>${escapeHtml([venue.city, venue.state].filter(Boolean).join(", "))}</p></div>
  </a>`;
}

function socialLinks(promoter = {}) {
  const social = promoter.social_links || {};
  const links = [
    ["instagram", "Instagram", icon("instagram")],
    ["facebook", "Facebook", icon("facebook")],
    ["tiktok", "TikTok", icon("tiktok")]
  ].filter(([key]) => social[key]);
  if (!links.length) return "";
  return `<div class="social-row">${links.map(([key, label, glyph]) => `<a class="social-link" href="${safeUrl(social[key])}" target="_blank" rel="noreferrer">${glyph} ${label}</a>`).join("")}</div>`;
}

function tipLinks(promoter = {}) {
  const tips = promoter.tip_links || {};
  const entries = Object.entries(tips).filter(([, value]) => value);
  if (!entries.length) return "";
  return `<div class="social-row">${entries.map(([key, value]) => `<a class="social-link" href="${safeUrl(value)}" target="_blank" rel="noreferrer" data-tip-link="${escapeHtml(key)}">${icon("cash")} ${escapeHtml(titleCase(key))}</a>`).join("")}</div>`;
}

function followButton(type, target, count = 0) {
  return `<button class="button button--ghost" type="button" data-follow-type="${escapeHtml(type)}" data-follow-id="${escapeHtml(target.id || "")}" data-follow-count="${Number(count || 0)}">${icon("heart")} Follow · ${Number(count || 0)}</button>`;
}

function missingPage(label) {
  appRoot.innerHTML = publicPage(`<div class="app-container"><section class="hero-card" style="background:linear-gradient(135deg,#111d31,#25112b)"><div class="hero-card__content"><span class="eyebrow">Not on the map</span><h1 class="display">${escapeHtml(label)} was not found.</h1><p class="lead">The profile may be private, the venue may not be live yet, or the link may have expired.</p><div class="button-row" style="margin-top:1.2rem"><a class="button button--primary" href="/" data-route>${icon("map")} Return to map</a></div></div></section></div>`);
  wireGlobalUi();
}

function wirePublicActions() {
  wireGlobalUi();
  document.querySelectorAll("[data-follow-type]").forEach((button) => button.addEventListener("click", async () => {
    if (!readSession()?.access_token) {
      route(`/login?next=${encodeURIComponent(location.pathname)}`);
      return;
    }
    button.disabled = true;
    try {
      const result = await toggleFollow(button.dataset.followType, button.dataset.followId);
      let count = Number(button.dataset.followCount || 0);
      count += result?.following ? 1 : -1;
      count = Math.max(0, count);
      button.dataset.followCount = String(count);
      button.innerHTML = `${icon("heart")} ${result?.following ? "Following" : "Follow"} · ${count}`;
      showToast(result?.following ? "Added to your PourMap follows." : "Removed from your follows.");
    } catch (error) {
      showToast(error.message || "Follow could not be updated.", true);
    } finally { button.disabled = false; }
  }));

  document.querySelectorAll("[data-share-page]").forEach((button) => button.addEventListener("click", async () => {
    const url = button.dataset.sharePage || location.href;
    try {
      if (navigator.share) await navigator.share({ title: document.title, url });
      else { await copyText(url); showToast("Link copied."); }
    } catch (error) {
      if (error?.name !== "AbortError") showToast("The link could not be shared.", true);
    }
  }));

  document.querySelectorAll("[data-event-cta]").forEach((link) => link.addEventListener("click", () => {
    recordActivity("ticket_click", { campaignId: link.dataset.eventCta, source: "public-page" });
  }));
  document.querySelectorAll("[data-tip-link]").forEach((link) => link.addEventListener("click", () => {
    recordActivity("tip_click", { promoterId: link.closest("[data-promoter-id]")?.dataset.promoterId || null, source: "profile" });
  }));
  document.querySelectorAll("[data-directions-id]").forEach((link) => link.addEventListener("click", () => recordActivity("directions", { venueId: link.dataset.directionsId, source: "venue-page" })));
  document.querySelectorAll("[data-order-id]").forEach((link) => link.addEventListener("click", () => recordActivity("order_click", { venueId: link.dataset.orderId, source: "venue-page" })));
}

export async function renderPromoterPage(slug) {
  document.body.classList.remove("map-body");
  const result = await publicPromoter(slug);
  const promoter = result?.promoter;
  if (!promoter) { missingPage("That bartender"); return; }
  document.title = `${promoter.display_name} | PourMap`;
  const current = result.current_shift;
  const upcoming = (result.upcoming_shifts || []).filter((shift) => !current || shift.id !== current.id);
  const currentVenue = current?.venue || null;
  const heroImage = promoter.photo_url || currentVenue?.cover_image_url || "";
  const currentStatus = current ? statusPill(current.status || "pouring_now") : statusPill("tonight", "Next shift coming soon");

  appRoot.innerHTML = publicPage(`<div class="app-container" data-promoter-id="${escapeHtml(promoter.id)}">
    <section class="hero-card" style="${imageStyle(heroImage)}"><div class="hero-card__content">
      <div class="profile-hero">
        <div class="profile-hero__avatar">${avatarHtml(promoter, "xl")}${currentStatus}</div>
        <div class="profile-hero__copy"><span class="eyebrow">${promoter.verified ? `${icon("verified")} Verified bartender` : "PourMap bartender"}</span><h1>${escapeHtml(promoter.display_name)}</h1><p>${escapeHtml(promoter.headline || promoter.bio || "See where they are pouring next.")}</p></div>
        <div class="profile-hero__actions">${followButton("promoter", promoter, promoter.follower_count)}<button class="button button--primary" type="button" data-share-page="${escapeHtml(location.href)}">${icon("share")} Share profile</button></div>
      </div>
    </div></section>

    <section class="section profile-layout">
      <div class="stack">
        ${currentVenue ? `<article class="card"><div class="card__body"><span class="eyebrow">Pouring now</span><h2 style="margin:.2rem 0;font-family:var(--display);font-size:2rem"><a href="/venue/${escapeHtml(currentVenue.slug)}" data-route>${escapeHtml(currentVenue.name)}</a></h2><p>${escapeHtml([currentVenue.city,currentVenue.state].filter(Boolean).join(", "))} · ${escapeHtml(formatTimeRange(current.starts_at,current.ends_at))}</p><div class="button-row"><a class="button button--primary" href="/venue/${escapeHtml(currentVenue.slug)}" data-route>See venue ${icon("arrow")}</a><a class="button button--ghost" href="${directionsUrl(currentVenue)}" target="_blank" rel="noreferrer" data-directions-id="${escapeHtml(currentVenue.id)}">${icon("location")} Directions</a></div></div></article>` : `<div class="empty-state"><strong>Not currently checked in.</strong><span>Follow this profile to keep the next public shift within reach.</span></div>`}

        <section><div class="section-head"><div><h2>Upcoming shifts</h2><p>Public shifts follow this bartender across connected venues.</p></div></div><div class="stack">${upcoming.length ? upcoming.map((shift) => shiftCard(shift)).join("") : '<div class="empty-state"><strong>No upcoming public shifts.</strong><span>Check back as the next roster is posted.</span></div>'}</div></section>

        ${(result.events || []).length ? `<section><div class="section-head"><div><h2>Events at their venues</h2><p>Venue-approved event information and ticket links.</p></div></div><div class="grid grid-2">${result.events.map((event) => eventCard(event)).join("")}</div></section>` : ""}
      </div>

      <aside class="stack">
        <article class="card"><div class="card__body"><h3>About ${escapeHtml(promoter.display_name)}</h3><p>${escapeHtml(promoter.bio || promoter.headline || "Bartender profile on PourMap.")}</p>${socialLinks(promoter)}</div></article>
        ${Object.values(promoter.tip_links || {}).some(Boolean) ? `<article class="card"><div class="card__body"><h3>Tip links</h3><p>Tip links are supplied by the bartender.</p>${tipLinks(promoter)}</div></article>` : ""}
        ${(result.venues || []).length ? `<article class="card"><div class="card__body"><h3>Connected venues</h3><div class="stack" style="margin-top:.8rem">${result.venues.map(venueTile).join("")}</div></div></article>` : ""}
      </aside>
    </section>
  </div>`);
  wirePublicActions();
  recordActivity("profile_view", { promoterId: promoter.id, source: "public-profile" });
}

export async function renderVenuePage(slug) {
  document.body.classList.remove("map-body");
  const result = await publicVenue(slug);
  const venue = result?.venue;
  if (!venue) { missingPage("That venue"); return; }
  document.title = `${venue.name} | PourMap`;
  const crew = result.crew || [];
  const events = result.events || [];
  const liveCrew = crew.filter((person) => ["pouring_now", "scheduled_now"].includes(person.status));
  appRoot.innerHTML = publicPage(`<div class="app-container">
    <section class="hero-card" style="${imageStyle(venue.cover_image_url)}"><div class="hero-card__content"><span class="eyebrow">${venue.is_verified ? `${icon("verified")} Verified venue` : titleCase(venue.venue_type)}</span><h1 class="display">${escapeHtml(venue.name)}</h1><p class="lead">${escapeHtml(venue.description || `${address(venue)} · See who is behind the bar and what is happening tonight.`)}</p><div class="button-row" style="margin-top:1.2rem">${followButton("venue", venue, venue.follower_count)}<a class="button button--primary" href="${directionsUrl(venue)}" target="_blank" rel="noreferrer" data-directions-id="${escapeHtml(venue.id)}">${icon("location")} Directions</a>${venue.order_url ? `<a class="button button--lime" href="${safeUrl(venue.order_url)}" target="_blank" rel="noreferrer" data-order-id="${escapeHtml(venue.id)}">${icon("food")} Order food</a>` : ""}${venue.website_url ? `<a class="button button--ghost" href="${safeUrl(venue.website_url)}" target="_blank" rel="noreferrer">Venue website ${icon("external")}</a>` : ""}</div></div></section>

    <section class="section"><div class="section-head"><div><h2>${liveCrew.length ? "Pouring now" : "Tonight's crew"}</h2><p>${liveCrew.length ? `${liveCrew.length} crew member${liveCrew.length === 1 ? " is" : "s are"} currently listed.` : "See the public shift roster."}</p></div></div><div class="grid grid-3">${crew.length ? crew.map((shift) => `<article class="card"><div class="card__body"><div style="display:flex;align-items:center;gap:.8rem">${avatarHtml(shift.promoter, "lg")}<div><h3><a href="/bartender/${escapeHtml(shift.promoter?.slug || "")}" data-route>${escapeHtml(shift.promoter?.display_name || "Bartender")}</a></h3><p style="margin:.25rem 0">${escapeHtml(shift.promoter?.headline || "Behind the bar")}</p>${statusPill(shift.status)}</div></div><p>${escapeHtml(formatDate(shift.starts_at, { year:false, time:false }))} · ${escapeHtml(formatTimeRange(shift.starts_at,shift.ends_at))}</p><a class="button button--ghost button--small" href="/bartender/${escapeHtml(shift.promoter?.slug || "")}" data-route>View profile</a></div></article>`).join("") : '<div class="empty-state"><strong>The public roster is not posted yet.</strong><span>Venue staff or connected bartenders can add shifts from their dashboards.</span></div>'}</div></section>

    <section class="section"><div class="section-head"><div><h2>Events and promotions</h2><p>Official information comes from the venue's Promo Proof campaign library.</p></div></div><div class="grid grid-3">${events.length ? events.map((event) => eventCard(event, venue)).join("") : '<div class="empty-state"><strong>No active venue promotions.</strong><span>Check back for the next event.</span></div>'}</div></section>

    <section class="section profile-layout"><article class="card"><div class="card__body"><h3>Visit ${escapeHtml(venue.name)}</h3><p>${escapeHtml(address(venue))}</p><div class="button-row"><a class="button button--primary" href="${directionsUrl(venue)}" target="_blank" rel="noreferrer" data-directions-id="${escapeHtml(venue.id)}">Directions</a>${venue.website_url ? `<a class="button button--ghost" href="${safeUrl(venue.website_url)}" target="_blank" rel="noreferrer">Official website</a>` : ""}</div></div></article><article class="card"><div class="card__body"><h3>Public schedule policy</h3><p>PourMap displays venue-confirmed and clearly marked bartender-submitted shifts. Off-duty locations are never shown.</p></div></article></section>
  </div>`);
  wirePublicActions();
  recordActivity("venue_view", { venueId: venue.id, source: "public-venue" });
}

export async function renderSharePage(slug) {
  document.body.classList.remove("map-body");
  const result = await publicShare(slug);
  if (!result?.share || !result?.promoter || !result?.campaign) { missingPage("That promotional link"); return; }
  const { share, promoter, venue, campaign, tracking } = result;
  document.title = `${promoter.display_name} at ${venue?.name || "a venue"} | PourMap`;
  const destination = tracking?.tracked_destination || tracking?.destination_url || campaign.destination_url || "";
  const image = share.personal_photo_url || promoter.photo_url || campaign.hero_image_url || venue?.cover_image_url || "";
  const caption = share.custom_caption || campaign.default_caption || `${promoter.display_name} is promoting ${campaign.name} at ${venue?.name || "their venue"}.`;
  appRoot.innerHTML = `<main class="share-shell"><article class="share-card"><div class="share-card__image" style="${imageStyle(image)}"><div class="share-card__identity">${avatarHtml(promoter,"lg")}<div><span class="eyebrow">Shared by ${escapeHtml(promoter.display_name)}</span><strong style="display:block;font-size:1.1rem">${escapeHtml(venue?.name || "PourMap venue")}</strong></div></div></div><div class="share-card__body"><span class="eyebrow">Venue-approved promotion</span><h1>${escapeHtml(campaign.name)}</h1><p>${escapeHtml(caption)}</p><p>${escapeHtml(formatDate(campaign.starts_at))}</p><div class="share-card__actions">${destination ? `<a class="button button--primary" href="${safeUrl(destination)}" target="_blank" rel="noreferrer" data-share-destination>${icon("ticket")} ${escapeHtml(campaign.call_to_action || "See event")}</a>` : ""}<a class="button button--ghost" href="/bartender/${escapeHtml(promoter.slug)}" data-route>${icon("user")} ${escapeHtml(promoter.display_name)}'s profile</a>${venue?.slug ? `<a class="button button--ghost" href="/venue/${escapeHtml(venue.slug)}" data-route>${icon("location")} ${escapeHtml(venue.name)}</a>` : ""}<button class="button button--ghost" type="button" data-share-page="${escapeHtml(location.href)}">${icon("share")} Share this page</button></div><p style="margin-top:1.2rem;text-align:center;font-size:.72rem">Tracked by Promo Proof · Powered by PourMap</p></div></article></main>`;
  wirePublicActions();
  document.querySelector("[data-share-destination]")?.addEventListener("click", () => {
    recordActivity(campaign.metadata?.ticketing_mode === "external" ? "ticket_click" : "share_view", { promoterId: promoter.id, venueId: venue?.id || null, campaignId: campaign.id, sharePostId: share.id, source: "share-cta" });
  });
  recordActivity("share_view", { promoterId: promoter.id, venueId: venue?.id || null, campaignId: campaign.id, sharePostId: share.id, source: "share-page" });
}

export function renderAboutPage() {
  document.title = "How PourMap works";
  appRoot.innerHTML = publicPage(`<div class="app-container"><section class="hero-card" style="background-image:radial-gradient(circle at 75% 25%,rgba(255,79,163,.22),transparent 24rem),radial-gradient(circle at 20% 70%,rgba(54,241,221,.18),transparent 25rem),linear-gradient(135deg,#111d31,#191020)"><div class="hero-card__content"><span class="eyebrow">Tonight has a map</span><h1 class="display">See who's pouring near you.</h1><p class="lead">PourMap connects public bartender schedules, venue events, food, tickets, and measurable promotion without exposing anyone's off-duty location.</p><div class="button-row" style="margin-top:1.2rem"><a class="button button--primary" href="/" data-route>${icon("map")} Open the live map</a><a class="button button--ghost" href="/signup" data-route>Join as a bartender</a></div></div></section><section class="section"><div class="grid grid-3"><article class="card"><div class="card__body"><span class="eyebrow">1 · Discover</span><h3>Find the crew</h3><p>Customers search bartenders, venues, towns, live music, food, and tickets from one map.</p></div></article><article class="card"><div class="card__body"><span class="eyebrow">2 · Share</span><h3>Promote the venue</h3><p>Bartenders grab approved venue marketing and receive a personalized Promo Proof link automatically.</p></div></article><article class="card"><div class="card__body"><span class="eyebrow">3 · Prove</span><h3>Measure results</h3><p>Clicks, ticket sales, leads, check-ins, revenue, and rewards stay attributed to the promoter who drove them.</p></div></article></div></section><section class="section profile-layout"><article class="card"><div class="card__body"><h3>Location without stalking</h3><p>A bartender appears only at a connected venue during a public shift. PourMap does not publish home addresses, background GPS trails, travel routes, or off-duty “last seen” locations.</p></div></article><article class="card"><div class="card__body"><h3>Venue marketing stays official</h3><p>The venue controls event details, specials, ordering, and ticket links. Bartenders personalize and distribute approved campaigns.</p></div></article></section></div>`, { active: "about" });
  wireGlobalUi();
}

export function renderLegalPage(type) {
  const privacy = type === "privacy";
  document.title = `${privacy ? "Privacy" : "Terms"} | PourMap`;
  appRoot.innerHTML = publicPage(`<div class="app-container"><section class="hero-card" style="min-height:300px;background:linear-gradient(135deg,#111d31,#18111f)"><div class="hero-card__content"><span class="eyebrow">PourMap</span><h1 class="display">${privacy ? "Privacy" : "Terms of use"}</h1><p class="lead">MVP policy summary for the PourMap preview.</p></div></section><section class="section"><article class="card"><div class="card__body" style="line-height:1.75">${privacy ? `<h2>Data and location</h2><p>PourMap uses venue coordinates, public shift information, optional shift check-ins, account information, and interaction analytics to operate the service. A bartender's precise device location is requested only when they actively choose to verify a shift check-in; it is not published to consumers or used for continuous tracking.</p><h2>Promotion attribution</h2><p>Promo Proof may associate campaign visits, signups, ticket activity, reservations, and verified results with a bartender or promoter tracking link.</p><h2>Public profiles</h2><p>Bartenders control the profile information, social links, tip links, images, and public schedule information they submit, subject to venue and platform moderation.</p>` : `<h2>Accurate information</h2><p>Users must submit accurate profile, venue-relationship, shift, and promotional information. Venue offers and event details may only be published or shared when authorized.</p><h2>Safety</h2><p>PourMap is a discovery and attribution service. It must not be used to track off-duty individuals, publish private addresses, harass workers, manipulate conversions, or create fraudulent rewards.</p><h2>Preview status</h2><p>This MVP may change as ticketing, rewards, notifications, venue controls, and consumer accounts are expanded.</p>`}<p>These preview summaries will be replaced by full reviewed legal policies before commercial launch.</p></div></article></section></div>`);
  wireGlobalUi();
}
