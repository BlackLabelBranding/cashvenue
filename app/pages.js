import { BEERS, CONFIG, JOBS, MENU } from "./config.js";
import { address, directionsUrl, escapeHtml, eventDateParts, eventImage, formatDate, icon, orderUrl, pageHero, publicEventSlug, routeLink, safeUrl } from "./ui.js";

export function eventCard(event) {
  const parts = eventDateParts(event.starts_at);
  const slug = publicEventSlug(event);
  const meta = event.metadata || {};
  return `<article class="event-card">
    <a href="/event/${escapeHtml(slug)}" class="event-card__media js-route">
      <img src="${safeUrl(eventImage(event))}" alt="${escapeHtml(event.name)}" loading="lazy" />
      <span class="event-card__date"><span>${escapeHtml(parts.month)}</span><b>${escapeHtml(parts.day)}</b></span>
    </a>
    <div class="event-card__body">
      <div class="event-card__meta"><span>${icon("clock")} ${escapeHtml(formatDate(event.starts_at, { weekday: "short", month: "short", year: false }))}</span>${meta.price_label ? `<span>${icon("ticket")} ${escapeHtml(meta.price_label)}</span>` : ""}</div>
      <h3><a class="js-route" href="/event/${escapeHtml(slug)}">${escapeHtml(event.name)}</a></h3>
      ${meta.special_guest ? `<p><strong>With ${escapeHtml(meta.special_guest)}</strong></p>` : ""}
      <p>${escapeHtml(event.description || "Live at Hangar 18.")}</p>
      <div class="event-card__actions"><a class="button button--primary button--small js-route" href="/event/${escapeHtml(slug)}">Details & Tickets ${icon("arrow")}</a></div>
    </div>
  </article>`;
}

function sectionHeading(eyebrow, title, copy, action = "") {
  return `<div class="section-heading"><div class="section-heading__copy"><p class="eyebrow">${escapeHtml(eyebrow)}</p><h2 class="h2">${escapeHtml(title)}</h2>${copy ? `<p>${escapeHtml(copy)}</p>` : ""}</div>${action}</div>`;
}

function feature(iconName, title, copy) {
  return `<article class="feature-card"><div class="feature-card__icon">${icon(iconName)}</div><h3>${escapeHtml(title)}</h3><p>${escapeHtml(copy)}</p></article>`;
}

export function homePage(site, events) {
  const order = orderUrl(site);
  const upcoming = events.slice(0, 3);
  return `<section class="hero" style="--hero-image:url('${CONFIG.assets.hero}')"><div class="container hero__inner"><div class="hero__copy">
    <img class="hero__logo" src="${CONFIG.assets.logo}" alt="Hangar 18" />
    <p class="eyebrow">${escapeHtml(site.content?.hero_eyebrow || "CRAFT BREWS • BOLD FOOD • LIVE MUSIC")}</p>
    <h1 class="display">${escapeHtml(site.content?.hero_title || "Where great times take flight.")}</h1>
    <p class="lead">${escapeHtml(site.content?.hero_copy || "Craft beer, loaded pizzas, live entertainment, and a one-of-a-kind venue in Windsor, Illinois.")}</p>
    <div class="button-row">${routeLink("/events", `${icon("calendar")} See Events`, "button button--primary")}${order ? `<a class="button button--yellow js-track-order" href="${safeUrl(order)}" target="_blank" rel="noreferrer">${icon("bag")} Order Food</a>` : routeLink("/menu", `${icon("pizza")} View Menu`, "button button--yellow")}<a class="button button--ghost" href="${directionsUrl(site)}" target="_blank" rel="noreferrer">${icon("pin")} Get Directions</a></div>
    <div class="hero__facts"><span class="hero__fact">1112 Maine St • Windsor, IL</span><span class="hero__fact">Family-friendly dining</span><span class="hero__fact">Live music & ticketed events</span></div>
  </div></div></section>

  <section class="feature-strip"><div class="container feature-strip__grid">${feature("beer", "Craft Brews", "House pours and rotating taps built for dinner, a show, or a long night with friends.")}${feature("pizza", "Bold Food", "Loaded specialty pizzas, wings, shareables, burgers, baskets, and more.")}${feature("calendar", "Live Events", "National, regional, and local talent with easy event details and ticket access.")}</div></section>

  <section class="section"><div class="container split"><div class="split__media"><img src="${CONFIG.assets.exterior}" alt="Hangar 18 outdoor venue" loading="lazy" /></div><div class="split__copy"><p class="eyebrow">WELCOME TO WINDSOR</p><h2 class="h2">${escapeHtml(site.content?.about_title || "Welcome to Hangar 18")}</h2><p>${escapeHtml(site.content?.about_copy || "Hangar 18 blends a hometown atmosphere with handcrafted brews, crowd-pleasing food, and live entertainment.")}</p><div class="stat-row"><div class="stat"><strong>Food</strong><span>Lunch & dinner</span></div><div class="stat"><strong>Brews</strong><span>House & guest taps</span></div><div class="stat"><strong>Shows</strong><span>Indoor & outdoor</span></div></div>${routeLink("/about-us", `Our Story ${icon("arrow")}`, "button button--ghost")}</div></div></section>

  <section class="section section--warm"><div class="container">${sectionHeading("UPCOMING AT THE HANGAR", "Pick the next night out.", "The event calendar stays connected to the venue’s management system, so dates, details, tickets, and promotional links can be updated from one place.", routeLink("/events", "Full Calendar", "button button--ghost"))}${upcoming.length ? `<div class="event-grid">${upcoming.map(eventCard).join("")}</div>` : `<div class="empty-box">New events are being loaded. Check back shortly.</div>`}</div></section>

  <section class="section"><div class="container split split--reverse"><div class="split__media"><img src="${CONFIG.assets.pizza}" alt="Hangar 18 specialty pizza" loading="lazy" /></div><div class="split__copy"><p class="eyebrow">COME HUNGRY</p><h2 class="h2">Food built to carry the whole night.</h2><p>Make Hangar 18 the dinner plan, not just the stop after dinner. Specialty pizzas, wings, shareables, sandwiches, and baskets are designed for tables that want to stay awhile.</p><div class="button-row">${routeLink("/menu", `Explore the Menu ${icon("arrow")}`, "button button--primary")}${order ? `<a class="button button--ghost js-track-order" href="${safeUrl(order)}" target="_blank" rel="noreferrer">Order Online</a>` : ""}</div></div></div></section>

  <section class="section section--paper"><div class="container split"><div class="split__media"><img src="${CONFIG.assets.bella}" alt="Bella, Hangar 18's robotic server" loading="lazy" /></div><div class="split__copy"><p class="eyebrow" style="color:#9f0d13">MEET BELLA</p><h2 class="h2">A little extra personality on the service team.</h2><p style="color:#514841">Bella helps the crew move food and supplies while giving guests something they will remember. It is part of the Hangar 18 experience: hometown hospitality with a few surprises.</p>${routeLink("/about-us", "Discover Hangar 18", "button button--dark")}</div></div></section>

  <section class="section section--tight"><div class="container"><div class="cta-band"><div class="cta-band__inner"><div><p class="eyebrow">YOUR PARTY • OUR HANGAR</p><h2>Bring the whole guest list.</h2><p>Birthdays, fundraisers, company gatherings, celebrations, and private events.</p></div>${routeLink("/private-events", `Plan an Event ${icon("arrow")}`, "button button--yellow")}</div></div></div></section>`;
}

export function aboutPage(site) {
  return `${pageHero({ eyebrow: "BEHIND THE HANGAR", title: "A hometown venue built for bigger nights.", copy: "Hangar 18 brings together food, craft beer, family, friends, and live entertainment in Windsor, Illinois.", image: CONFIG.assets.hero })}
  <section class="section"><div class="container split"><div class="split__media"><img src="${CONFIG.assets.interior}" alt="Inside Hangar 18" loading="lazy" /></div><div class="split__copy"><p class="eyebrow">ONE PLACE • MANY REASONS TO COME BACK</p><h2 class="h2">More than a stop for dinner.</h2><p>${escapeHtml(site.content?.about_copy || "Hangar 18 blends a laid-back hometown atmosphere with handcrafted brews, crowd-pleasing food, and live entertainment.")}</p><p>Families can settle in for pizza and wings. Friends can meet for a house beer. Music fans can catch an intimate show or a full outdoor event. The venue changes gears without losing its personality.</p></div></div></section>
  <section class="section section--warm"><div class="container">${sectionHeading("THE HANGAR 18 EXPERIENCE", "Built around the whole night.", "The strongest venues give people more than one reason to visit—and more than one reason to stay.")}<div class="grid grid--3">${feature("pizza", "Food First", "A complete menu makes Hangar 18 a real lunch and dinner destination.")}${feature("beer", "A Local Pour", "House beer and rotating taps give regulars a reason to keep exploring.")}${feature("users", "Room for a Crowd", "Indoor hospitality and an outdoor event setting create multiple kinds of nights.")}</div></div></section>
  <section class="section"><div class="container split split--reverse"><div class="split__media"><img src="${CONFIG.assets.exterior}" alt="Hangar 18 outdoor event area" loading="lazy" /></div><div class="split__copy"><p class="eyebrow">LIVE IN WINDSOR</p><h2 class="h2">Big-show energy without leaving town.</h2><p>Hangar 18 can host local favorites, touring acts, tribute shows, community events, and private gatherings. Check the event calendar, invite the crew, and plan to arrive hungry.</p>${routeLink("/events", `See Upcoming Events ${icon("arrow")}`, "button button--primary")}</div></div></section>`;
}

export function menuPage(site) {
  const order = orderUrl(site);
  return `${pageHero({ eyebrow: "PIZZA • WINGS • SHAREABLES", title: "Food that can carry the whole night.", copy: "Big flavor, generous portions, and a menu that works for lunch, dinner, or a table full of friends before the show.", image: CONFIG.assets.pizza, actions: order ? `<a class="button button--primary js-track-order" href="${safeUrl(order)}" target="_blank" rel="noreferrer">${icon("bag")} Order Online</a>` : "" })}
  <section class="section"><div class="container"><div class="menu-tabs">${MENU.map((section, index) => `<button type="button" class="menu-tab${index === 0 ? " is-active" : ""}" data-menu-target="menu-${index}">${escapeHtml(section.category)}</button>`).join("")}</div>${MENU.map((section, index) => `<section class="menu-section" id="menu-${index}"><h2>${escapeHtml(section.category)}</h2><div class="menu-items">${section.items.map(([name, description, price]) => `<article class="menu-item"><h3>${escapeHtml(name)}</h3><strong>${escapeHtml(price)}</strong><p>${escapeHtml(description)}</p></article>`).join("")}</div></section>`).join("")}<p class="copy"><em>Menu availability and pricing can change. Contact the venue for current options, dietary questions, and daily features.</em></p></div></section>`;
}

export function beerPage() {
  return `${pageHero({ eyebrow: "BREWED FOR WINDSOR", title: "House beer with its own point of view.", copy: "Crisp lagers, hoppy pours, darker malt-forward options, and rotating releases built to match a long meal or a live show.", image: CONFIG.assets.beer })}
  <section class="section"><div class="container">${sectionHeading("ON THE FLIGHT PLAN", "A pour for every kind of night.", "Tap availability rotates. Ask the bar what is pouring today and what is coming next.")}<div class="beer-grid">${BEERS.map(([name, copy, abv, style]) => `<article class="beer-card"><div class="beer-card__top"><h3>${escapeHtml(name)}</h3><span class="badge badge--yellow">${escapeHtml(abv)}</span></div><p>${escapeHtml(copy)}</p><div class="beer-card__stats"><span class="badge">${escapeHtml(style)}</span><span class="badge">Ask what’s on tap</span></div></article>`).join("")}</div></div></section>
  <section class="section section--warm"><div class="container split"><div class="split__media"><img src="${CONFIG.assets.beerAlt}" alt="Beer at Hangar 18" loading="lazy" /></div><div class="split__copy"><p class="eyebrow">TRY A FLIGHT</p><h2 class="h2">Find the one that earns a full pour.</h2><p>Flights make it easy to compare crisp, hoppy, malty, and seasonal options. Pair one with a specialty pizza, then stay for the show.</p><div class="button-row">${routeLink("/menu", "See the Food Menu", "button button--primary")}${routeLink("/events", "Plan the Next Night", "button button--ghost")}</div></div></div></section>`;
}

export function eventsPage(events) {
  return `${pageHero({ eyebrow: "LIVE MUSIC • TICKETS • GOOD NIGHTS", title: "The Hangar 18 event calendar.", copy: "Find the show, open the full event page, buy or request tickets, and share the details with your crew.", image: CONFIG.assets.interior, actions: routeLink("/private-events", `${icon("users")} Host Your Event`, "button button--primary") })}
  <section class="section"><div class="container">${events.length ? `<div class="event-grid">${events.map(eventCard).join("")}</div>` : `<div class="empty-box">The next round of events is being scheduled.</div>`}</div></section>`;
}

function formHtml(type, title, intro, fields, submitLabel) {
  return `<div class="form-card"><h2 class="h3">${escapeHtml(title)}</h2><p class="copy">${escapeHtml(intro)}</p><form class="js-inquiry-form" data-form-type="${escapeHtml(type)}"><div class="form-grid">${fields}<div class="field field--wide"><button class="button button--primary" type="submit">${escapeHtml(submitLabel)} ${icon("arrow")}</button><p class="form-status" role="status"></p></div></div></form></div>`;
}

const baseFields = `<div class="field"><label>Name</label><input name="name" autocomplete="name" required /></div><div class="field"><label>Email</label><input name="email" type="email" autocomplete="email" required /></div><div class="field"><label>Phone</label><input name="phone" type="tel" autocomplete="tel" /></div>`;

export function privateEventsPage(site) {
  const fields = `${baseFields}<div class="field"><label>Event date</label><input name="event_date" type="date" /></div><div class="field"><label>Estimated guests</label><input name="guest_count" type="number" min="1" /></div><div class="field"><label>Event type</label><select name="event_type"><option>Birthday</option><option>Company gathering</option><option>Fundraiser</option><option>Reunion</option><option>Wedding-related event</option><option>Live event</option><option>Other</option></select></div><div class="field field--wide"><label>Tell us what you are planning</label><textarea name="message" required></textarea></div>`;
  return `${pageHero({ eyebrow: "YOUR EVENT • OUR HANGAR", title: "Give the guest list somewhere memorable to land.", copy: site.content?.private_events_copy || "Bring your celebration, fundraiser, company gathering, or private party to Hangar 18.", image: CONFIG.assets.exterior })}
  <section class="section"><div class="container split"><div><p class="eyebrow">PRIVATE EVENTS</p><h2 class="h2">Start with the experience—not a generic room.</h2><p class="copy">Hangar 18 can combine food, drinks, entertainment, indoor hospitality, and outdoor atmosphere. Send the basic details and the venue will follow up about fit, availability, and options.</p><div class="stack"><span class="badge">Birthdays & celebrations</span><span class="badge">Fundraisers & benefits</span><span class="badge">Company and team gatherings</span><span class="badge">Private live events</span></div></div>${formHtml("private_event", "Request Event Information", "This sends directly into Hangar 18’s management queue.", fields, "Request Details")}</div></section>`;
}

export function jobsPage() {
  const fields = `${baseFields}<div class="field"><label>Position</label><select name="position">${JOBS.map(([name]) => `<option>${escapeHtml(name)}</option>`).join("")}</select></div><div class="field"><label>Availability</label><input name="availability" placeholder="Days, evenings, weekends…" /></div><div class="field field--wide"><label>Experience and why you want to join</label><textarea name="message" required></textarea></div>`;
  return `${pageHero({ eyebrow: "JOIN THE CREW", title: "Help build the next great night at Hangar 18.", copy: "Strong service, dependable execution, and the ability to move when the room gets busy. That is the job.", image: CONFIG.assets.interior })}
  <section class="section"><div class="container">${sectionHeading("OPEN ROLES", "There is no invisible job at a venue.", "Kitchen, bar, service, door, and event teams all affect the guest experience.")}<div class="grid grid--2">${JOBS.map(([name, description]) => `<article class="feature-card"><div class="feature-card__icon">${icon("users")}</div><h3>${escapeHtml(name)}</h3><p>${escapeHtml(description)}</p></article>`).join("")}</div></div></section>
  <section class="section section--warm"><div class="container">${formHtml("job", "Apply to Hangar 18", "Submit your contact information and availability. The management team will follow up if there is a fit.", fields, "Submit Application")}</div></section>`;
}

export function contactPage(site) {
  const phone = site.contact_phone || "(217) 500-1965";
  const email = site.contact_email || "management@hangar18.org";
  const addr = address(site);
  const fields = `${baseFields}<div class="field"><label>Subject</label><input name="subject" /></div><div class="field field--wide"><label>Message</label><textarea name="message" required></textarea></div>`;
  return `${pageHero({ eyebrow: "FIND THE HANGAR", title: "Food, drinks, music—right in Windsor.", copy: "Call, send a message, or map the drive. For private events, use the dedicated event inquiry so the venue gets the details it needs.", image: CONFIG.assets.exterior })}
  <section class="section"><div class="container"><div class="contact-cards"><article class="contact-card"><strong>${icon("pin")} Address</strong><a href="${directionsUrl(site)}" target="_blank" rel="noreferrer">${escapeHtml(addr)}</a></article><article class="contact-card"><strong>${icon("phone")} Phone</strong><a href="tel:${phone.replace(/[^+\d]/g, "")}">${escapeHtml(phone)}</a></article><article class="contact-card"><strong>${icon("mail")} Email</strong><a href="mailto:${escapeHtml(email)}">${escapeHtml(email)}</a></article></div></div></section>
  <section class="section section--warm"><div class="container split"><div><h2 class="h2">Hours</h2><div class="hours">${Object.entries(site.hours || {}).map(([day, value]) => `<div class="hours__row"><strong>${escapeHtml(day[0].toUpperCase() + day.slice(1))}</strong><span>${value.closed ? "Closed" : escapeHtml(value.bar || value.kitchen || "Call for hours")}</span></div>`).join("")}</div></div>${formHtml("contact", "Send Hangar 18 a Message", "Messages appear inside the venue’s management portal.", fields, "Send Message")}</div></section>
  <section class="section"><div class="container"><iframe class="map-frame" title="Map to Hangar 18" loading="lazy" src="https://www.google.com/maps?q=${encodeURIComponent(addr)}&output=embed"></iframe></div></section>`;
}

export function notFoundPage() {
  return `${pageHero({ eyebrow: "WRONG RUNWAY", title: "That page did not land here.", copy: "Head back to the Hangar 18 home page or check the event calendar.", image: CONFIG.assets.hero, actions: routeLink("/", "Go Home", "button button--primary") + routeLink("/events", "See Events", "button button--ghost") })}`;
}
