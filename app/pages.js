import { CONFIG, FAQS, HIGHLIGHTS } from "./config.js";
import { address, directionsUrl, escapeHtml, eventDateParts, eventImage, formatDate, icon, pageHero, publicEventSlug, routeLink, safeUrl } from "./ui.js";

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
      <p>${escapeHtml(event.description || "Live at Truckers Pub.")}</p>
      <a class="text-link js-route" href="/event/${escapeHtml(slug)}">Details & tickets ${icon("arrow")}</a>
    </div>
  </article>`;
}

function sectionHeading(eyebrow, title, copy, action = "") {
  return `<div class="section-heading"><div><p class="eyebrow">${escapeHtml(eyebrow)}</p><h2 class="h2">${escapeHtml(title)}</h2>${copy ? `<p>${escapeHtml(copy)}</p>` : ""}</div>${action}</div>`;
}

function feature(iconName, title, copy) {
  return `<article class="feature-card"><div class="feature-card__icon">${icon(iconName)}</div><h3>${escapeHtml(title)}</h3><p>${escapeHtml(copy)}</p></article>`;
}

function emptyEvents(unavailable = false) {
  if (unavailable) return `<div class="event-empty" role="status"><h3>Events are temporarily unavailable.</h3><p>Please refresh or call the pub for the current lineup.</p><a href="tel:2179949294" class="button button--ghost">Call the Pub</a></div>`;
  return `<div class="event-empty"><span class="event-empty__icon">${icon("calendar")}</span><div><h3>The next round is being lined up.</h3><p>Management can publish monthly events, tournaments, live music, pricing, and ticket links from the Truckers Pub portal.</p></div><a class="button button--ghost" href="tel:2179949294">Call for This Month’s Lineup</a></div>`;
}

export function homePage(site, events, unavailable = false) {
  const upcoming = events.slice(0, 3);
  return `<section class="hero">
    <div class="hero__backdrop" aria-hidden="true"></div>
    <div class="container hero__grid">
      <div class="hero__copy">
        <p class="eyebrow">${escapeHtml(site.content?.hero_eyebrow || "DRINKS • GAMES • LIVE ENTERTAINMENT")}</p>
        <h1 class="display">${escapeHtml(site.content?.hero_title || "Your off-duty destination.")}</h1>
        <p class="lead">${escapeHtml(site.content?.hero_copy || "Full bar, pool, darts, video gaming, and good times in Effingham.")}</p>
        <div class="button-row">${routeLink("/events", `${icon("calendar")} See What’s Happening`, "button button--primary")}${routeLink("/happy-hour", `${icon("beer")} Happy Hour`, "button button--light")}<a class="button button--ghost" href="${directionsUrl(site)}" target="_blank" rel="noreferrer">${icon("pin")} Get Directions</a></div>
        <div class="hero__facts"><span>Open daily 11 AM–1 AM</span><span>Effingham, Illinois</span><span>Locals • Travelers • Drivers</span></div>
      </div>
      <div class="hero__brand-card">
        <video autoplay muted loop playsinline preload="metadata" poster="${CONFIG.assets.logoPoster}" aria-label="Animated Truckers Pub logo">
          <source src="${CONFIG.assets.logoVideo}" type="video/mp4" />
        </video>
        <div class="hero__brand-caption"><strong>Est. 2013</strong><span>Pull in. Settle down. Stay awhile.</span></div>
      </div>
    </div>
  </section>

  <section class="feature-strip"><div class="container feature-grid">${HIGHLIGHTS.map(([iconName, title, copy]) => feature(iconName, title, copy)).join("")}</div></section>

  <section class="section"><div class="container split"><div class="split__media split__media--stack"><img src="${CONFIG.assets.games}" alt="Pool tables and games at Truckers Pub" loading="lazy" /><div class="photo-stamp"><strong>YOUR NEIGHBORHOOD STOP</strong><span>Serving Effingham since 2013</span></div></div><div class="split__copy"><p class="eyebrow">WELCOME TO TRUCKERS PUB</p><h2 class="h2">${escapeHtml(site.content?.about_title || "Built for good drinks and better nights.")}</h2><p>${escapeHtml(site.content?.about_copy || "A friendly Effingham bar for locals, travelers, and truck drivers.")}</p><p>This is the kind of place where you can meet friends for a drink, shoot a game of pool, catch live entertainment, or simply unwind after a long day on the road.</p><div class="stat-row"><div class="stat"><strong>7 days</strong><span>Open every week</span></div><div class="stat"><strong>15 drafts</strong><span>Plus a full bar</span></div><div class="stat"><strong>One stop</strong><span>Drinks, games, events</span></div></div>${routeLink("/about", `Get to Know the Pub ${icon("arrow")}`, "button button--dark")}</div></div></section>

  <section class="section section--events"><div class="container">${sectionHeading("MONTHLY EVENTS", "Make your next night count.", "Live entertainment, tournaments, and special nights—all connected to the same management system used by the venue.", routeLink("/events", "Full Calendar", "button button--ghost"))}${upcoming.length ? `<div class="event-grid">${upcoming.map(eventCard).join("")}</div>` : emptyEvents(unavailable)}</div></section>

  <section class="section section--light"><div class="container split split--reverse"><div class="split__media"><img src="${CONFIG.assets.bar}" alt="The full bar at Truckers Pub" loading="lazy" /></div><div class="split__copy"><p class="eyebrow">THE BAR IS OPEN</p><h2 class="h2">Cold drinks. No complicated attitude.</h2><p>Choose from 15 draft beers, cocktails, packaged liquor, and the familiar favorites you want after work, after the road, or before the night gets started.</p><div class="button-row">${routeLink("/happy-hour", `View Happy Hour ${icon("arrow")}`, "button button--primary")}<a class="button button--dark" href="tel:2179949294">Call (217) 994-9294</a></div></div></div></section>

  <section class="section section--cta"><div class="container"><div class="cta-band"><div><p class="eyebrow">POOL • DARTS • GAMING • MUSIC</p><h2>There’s always another reason to stay.</h2><p>Check the calendar, bring the crew, and make Truckers Pub the plan.</p></div>${routeLink("/events", `Plan the Next Night ${icon("arrow")}`, "button button--light")}</div></div></section>`;
}

export function aboutPage(site) {
  return `${pageHero({ eyebrow: "ABOUT TRUCKERS PUB", title: "A hometown bar built for everyone passing through.", copy: "Friendly service, familiar faces, cold drinks, and room to unwind in Effingham, Illinois.", image: CONFIG.assets.games })}
  <section class="section"><div class="container split"><div class="split__media"><img src="${CONFIG.assets.bar}" alt="Truckers Pub bar" loading="lazy" /></div><div class="split__copy"><p class="eyebrow">SINCE 2013</p><h2 class="h2">The neighborhood stop that welcomes the whole road.</h2><p>${escapeHtml(site.content?.about_copy || "Truckers Pub has welcomed locals, travelers, and truck drivers since 2013.")}</p><p>There is no dress code for a good night here. Grab a seat at the bar, meet your people, play a few games, or settle in for the evening’s entertainment.</p></div></div></section>
  <section class="section section--dark"><div class="container">${sectionHeading("WHAT YOU’LL FIND", "Everything a proper pub needs.", "A simple formula, done right.")}<div class="feature-grid">${HIGHLIGHTS.map(([iconName, title, copy]) => feature(iconName, title, copy)).join("")}</div></div></section>`;
}

export function galleryPage() {
  const photos = [
    [CONFIG.assets.bar, "Full bar at Truckers Pub", "The Bar"],
    [CONFIG.assets.games, "Pool tables at Truckers Pub", "Pool & Games"],
    [CONFIG.assets.events, "Live entertainment", "Live Events"],
    [CONFIG.assets.brandPhoto, "Truckers Pub logo", "Truckers Pub"],
    [CONFIG.assets.legacyHero, "Truckers Pub highlights", "Drinks & Fun"],
    [CONFIG.assets.happyHour, "Truckers Pub happy hour", "Happy Hour"]
  ];
  return `${pageHero({ eyebrow: "INSIDE THE PUB", title: "See where the night takes shape.", copy: "The bar, the tables, the games, and the stage—take a look around.", image: CONFIG.assets.bar })}<section class="section"><div class="container"><div class="gallery-grid">${photos.map(([src, alt, label], index) => `<figure class="gallery-card gallery-card--${index + 1}"><img src="${src}" alt="${escapeHtml(alt)}" loading="lazy" /><figcaption>${escapeHtml(label)}</figcaption></figure>`).join("")}</div></div></section>`;
}

export function happyHourPage() {
  return `${pageHero({ eyebrow: "HAPPY HOUR", title: "A better reason to clock out.", copy: "Current happy-hour offers and venue specials from Truckers Pub.", image: CONFIG.assets.bar })}<section class="section section--light"><div class="container happy-hour-layout"><div class="menu-poster"><img src="${CONFIG.assets.happyHour}" alt="Truckers Pub happy hour menu" /></div><div class="happy-hour-copy"><p class="eyebrow">CURRENT MENU</p><h2 class="h2">Pull up the full happy-hour board.</h2><p>Offers and availability can change. For today’s exact lineup, call the pub before you head over.</p><a class="button button--primary" href="${CONFIG.assets.happyHour}" target="_blank" rel="noreferrer">Open Full-Size Menu</a><a class="button button--dark" href="tel:2179949294">Call the Pub</a></div></div></section>`;
}

export function eventsPage(events, unavailable = false) {
  return `${pageHero({ eyebrow: "LIVE MUSIC • TOURNAMENTS • SPECIAL NIGHTS", title: "The Truckers Pub event calendar.", copy: "One place for the monthly lineup, event details, tickets, and the links your favorite bartenders and promoters share.", image: CONFIG.assets.events, actions: `<a class="button button--primary" href="tel:2179949294">${icon("phone")} Call About an Event</a>` })}<section class="section"><div class="container">${events.length ? `<div class="event-grid">${events.map(eventCard).join("")}</div>` : emptyEvents(unavailable)}</div></section>`;
}

function formHtml(type, title, intro, fields, submitLabel) {
  return `<div class="form-card"><p class="eyebrow">SEND A MESSAGE</p><h2 class="h3">${escapeHtml(title)}</h2><p>${escapeHtml(intro)}</p><form class="js-inquiry-form" data-form-type="${escapeHtml(type)}"><div class="form-grid">${fields}<div class="field field--wide"><button class="button button--primary" type="submit">${escapeHtml(submitLabel)} ${icon("arrow")}</button><p class="form-status" role="status"></p></div></div></form></div>`;
}

const baseFields = `<div class="field"><label for="contact-name">Name</label><input id="contact-name" name="name" autocomplete="name" required /></div><div class="field"><label for="contact-email">Email</label><input id="contact-email" name="email" type="email" autocomplete="email" required /></div><div class="field"><label for="contact-phone">Phone</label><input id="contact-phone" name="phone" type="tel" autocomplete="tel" /></div>`;

export function faqPage() {
  return `${pageHero({ eyebrow: "GOOD TO KNOW", title: "Questions before you pull in?", copy: "Hours, location, games, events, and the basics.", image: CONFIG.assets.games })}<section class="section"><div class="container faq-layout"><div>${FAQS.map(([question, answer], index) => `<details class="faq-item"${index === 0 ? " open" : ""}><summary>${escapeHtml(question)}<span>+</span></summary><p>${escapeHtml(answer)}</p></details>`).join("")}</div><aside class="faq-aside"><img src="${CONFIG.assets.logo}" alt="Truckers Pub Inc." /><h2>Still need an answer?</h2><p>Call us or send a message. We’ll get you pointed in the right direction.</p><a class="button button--primary" href="tel:2179949294">Call (217) 994-9294</a>${routeLink("/contact", "Send a Message", "button button--dark")}</aside></div></section>`;
}

export function contactPage(site) {
  const phone = site.contact_phone || "(217) 994-9294";
  const email = site.contact_email || "truckerspubinc@gmail.com";
  const addr = address(site);
  const fields = `${baseFields}<div class="field"><label for="contact-subject">Subject</label><input id="contact-subject" name="subject" /></div><div class="field field--wide"><label for="contact-message">Message</label><textarea id="contact-message" name="message" required></textarea></div>`;
  return `${pageHero({ eyebrow: "FIND TRUCKERS PUB", title: "Meet us in Effingham.", copy: "Call, send a message, or map the drive. We’re open every day from 11:00 AM to 1:00 AM.", image: CONFIG.assets.bar })}<section class="section"><div class="container contact-cards"><article><span>${icon("pin")}</span><strong>Address</strong><a href="${directionsUrl(site)}" target="_blank" rel="noreferrer">${escapeHtml(addr)}</a></article><article><span>${icon("phone")}</span><strong>Phone</strong><a href="tel:${phone.replace(/[^+\d]/g, "")}">${escapeHtml(phone)}</a></article><article><span>${icon("mail")}</span><strong>Email</strong><a href="mailto:${escapeHtml(email)}">${escapeHtml(email)}</a></article></div></section><section class="section section--light"><div class="container split"><div><p class="eyebrow">OPEN DAILY</p><h2 class="h2">11:00 AM–1:00 AM</h2><p>Holiday hours may vary. Please call for details.</p><div class="hours">${Object.entries(site.hours || {}).map(([day, value]) => `<div class="hours__row"><strong>${escapeHtml(day[0].toUpperCase() + day.slice(1))}</strong><span>${value.closed ? "Closed" : escapeHtml(value.bar || value.kitchen || "Call for hours")}</span></div>`).join("")}</div></div>${formHtml("contact", "Send Truckers Pub a Message", "Messages appear inside the venue management portal.", fields, "Send Message")}</div></section><section class="map-section"><iframe title="Map to Truckers Pub" loading="lazy" src="https://www.google.com/maps?q=${encodeURIComponent(addr)}&output=embed"></iframe></section>`;
}

export function servicesPage() {
  return `${pageHero({ eyebrow: "DRINKS • GAMES • ENTERTAINMENT", title: "Everything under one roof.", copy: "A full-service neighborhood bar with more ways to stay awhile.", image: CONFIG.assets.games })}<section class="section"><div class="container"><div class="feature-grid">${HIGHLIGHTS.map(([iconName, title, copy]) => feature(iconName, title, copy)).join("")}</div></div></section>`;
}

export function testimonialsPage() {
  return `${pageHero({ eyebrow: "LOCAL FAVORITE", title: "Built on regulars, travelers, and good nights.", copy: "Truckers Pub has welcomed Effingham and the road since 2013.", image: CONFIG.assets.bar })}<section class="section"><div class="container split"><div class="split__media"><img src="${CONFIG.assets.games}" alt="Inside Truckers Pub" /></div><div class="split__copy"><p class="eyebrow">SHARE YOUR EXPERIENCE</p><h2 class="h2">Had a great night at Truckers Pub?</h2><p>Tell management what stood out, who took care of you, or what event brought you in.</p>${routeLink("/contact", `Send Your Feedback ${icon("arrow")}`, "button button--primary")}</div></div></section>`;
}

export function newsPage(events, unavailable = false) {
  return eventsPage(events, unavailable);
}

export function notFoundPage() {
  return `${pageHero({ eyebrow: "MISSED THE EXIT", title: "That page isn’t on this route.", copy: "Head home or check the event calendar.", image: CONFIG.assets.games, actions: routeLink("/", "Go Home", "button button--primary") + routeLink("/events", "See Events", "button button--ghost") })}`;
}

