import { CONFIG } from "./config.js";
import { createTicketOrder, submitForm, track, trackingState } from "./supabase.js";
import { escapeHtml, eventImage, formatDate, icon, pageHero, publicEventSlug, safeUrl, showToast } from "./ui.js";

function money(value) {
  return new Intl.NumberFormat("en-US", { style: "currency", currency: "USD" }).format(Number(value || 0));
}

function externalUrl(event, ticket) {
  const candidate = ticket?.external_purchase_url || event?.metadata?.external_ticket_url || event?.destination_url || "";
  if (!candidate) return "";
  try {
    const url = new URL(candidate, location.origin);
    const sameEvent = url.origin === location.origin && url.pathname.replace(/\/$/, "") === location.pathname.replace(/\/$/, "");
    return sameEvent ? "" : url.href;
  } catch { return ""; }
}

function ticketOption(ticket, event) {
  const remaining = ticket.quantity_total == null ? null : Math.max(0, Number(ticket.quantity_total) - Number(ticket.quantity_sold || 0));
  const external = externalUrl(event, ticket);
  const price = ticket.price_label || (Number(ticket.price_amount) ? money(ticket.price_amount) : "Free");
  return `<article class="ticket-option" data-ticket-id="${ticket.id}">
    <div class="ticket-option__head"><div><h3>${escapeHtml(ticket.name)}</h3><strong>${escapeHtml(price)}</strong></div>${external ? `<a class="button button--primary button--small js-external-ticket" href="${safeUrl(external)}" target="_blank" rel="noreferrer">Buy ${icon("external")}</a>` : `<select class="input quantity" name="qty-${ticket.id}" aria-label="Quantity for ${escapeHtml(ticket.name)}"><option value="0">0</option>${Array.from({ length: Math.max(1, Math.min(Number(ticket.max_per_order || 10), remaining == null ? 10 : remaining)) }, (_, index) => `<option value="${index + 1}">${index + 1}</option>`).join("")}</select>`}</div>
    ${ticket.description ? `<p>${escapeHtml(ticket.description)}</p>` : ""}
    ${remaining != null ? `<span class="badge${remaining < 20 ? " badge--red" : ""}">${remaining ? `${remaining} remaining` : "Sold out"}</span>` : ""}
  </article>`;
}

function ticketRequestForm(event) {
  return `<form class="js-ticket-request"><div class="form-grid"><div class="field"><label>Name</label><input name="name" required autocomplete="name" /></div><div class="field"><label>Email</label><input name="email" type="email" required autocomplete="email" /></div><div class="field"><label>Phone</label><input name="phone" type="tel" autocomplete="tel" /></div><div class="field"><label>Tickets requested</label><input name="quantity" type="number" min="1" value="2" required /></div><div class="field field--wide"><label>Notes</label><textarea name="message" placeholder="Ticket type, seating request, or question"></textarea></div><div class="field field--wide"><button class="button button--primary" type="submit">Request Tickets ${icon("arrow")}</button><p class="form-status" role="status"></p></div></div></form>`;
}

export function eventPage(site, event) {
  if (!event) return pageHero({ eyebrow: "EVENT NOT FOUND", title: "That show is not on the board.", copy: "Check the full Hangar 18 calendar for current events.", image: CONFIG.assets.interior, actions: `<a class="button button--primary js-route" href="/events">View Events</a>` });
  const tickets = event.ticket_types || [];
  const meta = event.metadata || {};
  const slug = publicEventSlug(event);
  const mainExternal = externalUrl(event);
  const image = eventImage(event);
  const price = meta.price_label || (tickets.length ? `${Math.min(...tickets.map((item) => Number(item.price_amount || 0)))}+` : "See event details");
  const eventUrl = `${location.origin}/event/${slug}`;

  return `${pageHero({ eyebrow: "LIVE AT HANGAR 18", title: event.name, copy: meta.special_guest ? `With ${meta.special_guest}` : event.description || "Live at Hangar 18.", image })}
  <section class="event-detail"><div class="container event-detail__layout"><article class="event-detail__main"><img class="event-detail__image" src="${safeUrl(image)}" alt="${escapeHtml(event.name)}" /><div class="event-detail__content"><div class="button-row"><span class="badge badge--yellow">${icon("calendar")} ${escapeHtml(formatDate(event.starts_at))}</span><span class="badge">${icon("ticket")} ${escapeHtml(String(price))}</span>${meta.tickets_remaining ? `<span class="badge badge--red">${escapeHtml(meta.tickets_remaining)} tickets reported remaining</span>` : ""}</div><h1>${escapeHtml(event.name)}</h1>${meta.special_guest ? `<p><strong>Special guest: ${escapeHtml(meta.special_guest)}</strong></p>` : ""}<p>${escapeHtml(event.description || "Join us for live music at Hangar 18 in Windsor, Illinois.")}</p><div class="button-row"><button class="button button--ghost js-share-event" type="button" data-url="${escapeHtml(eventUrl)}">${icon("share")} Share Event</button><a class="button button--ghost" href="https://www.google.com/maps/search/?api=1&query=${encodeURIComponent("Hangar 18, 1112 Maine St, Windsor, IL 61957")}" target="_blank" rel="noreferrer">${icon("pin")} Directions</a></div></div></article>
  <aside class="ticket-panel"><h2>Tickets & Entry</h2><p class="copy">Choose the available ticket option or send the venue a ticket request.</p>${tickets.length ? `<div>${tickets.map((ticket) => ticketOption(ticket, event)).join("")}</div>${tickets.some((ticket) => !externalUrl(event, ticket) && ticket.status === "active") ? `<form class="js-ticket-order" data-event-slug="${escapeHtml(event.slug)}"><div class="field"><label>Name</label><input name="name" required autocomplete="name" /></div><div class="field"><label>Email</label><input name="email" type="email" required autocomplete="email" /></div><div class="field"><label>Phone</label><input name="phone" type="tel" autocomplete="tel" /></div><button class="button button--primary" type="submit">Reserve Selected Tickets</button><p class="form-status" role="status"></p></form>` : ""}` : mainExternal ? `<a class="button button--primary js-external-ticket" href="${safeUrl(mainExternal)}" target="_blank" rel="noreferrer">Get Tickets ${icon("external")}</a><p class="copy">Ticket checkout opens in a secure window.</p>` : `${ticketRequestForm(event)}`}</aside></div></section>`;
}

function values(form) {
  const data = Object.fromEntries(new FormData(form).entries());
  return Object.fromEntries(Object.entries(data).map(([key, value]) => [key, typeof value === "string" ? value.trim() : value]));
}

export function wireEventPage(event) {
  document.querySelectorAll(".js-external-ticket").forEach((link) => link.addEventListener("click", () => track("click", { source: "event-ticket", medium: "external-ticket", event_id: event.id }).catch(() => null)));

  document.querySelector(".js-share-event")?.addEventListener("click", async (clickEvent) => {
    const url = clickEvent.currentTarget.dataset.url;
    try {
      if (navigator.share) await navigator.share({ title: `${event.name} at Hangar 18`, text: event.description || "Live at Hangar 18", url });
      else { await navigator.clipboard.writeText(url); showToast("Event link copied."); }
      await track("share", { source: "event-detail", medium: "share", event_id: event.id });
    } catch (error) {
      if (error?.name !== "AbortError") showToast("The event link could not be shared.", true);
    }
  });

  document.querySelector(".js-ticket-order")?.addEventListener("submit", async (submitEvent) => {
    submitEvent.preventDefault();
    const form = submitEvent.currentTarget;
    const status = form.querySelector(".form-status");
    const button = form.querySelector("button[type=submit]");
    const customer = values(form);
    const items = (event.ticket_types || []).map((ticket) => ({ ticket_type_id: ticket.id, quantity: Number(form.closest(".ticket-panel").querySelector(`[name="qty-${ticket.id}"]`)?.value || 0) })).filter((item) => item.quantity > 0);
    if (!items.length) { status.textContent = "Choose at least one ticket."; status.className = "form-status is-error"; return; }
    button.disabled = true; status.textContent = "Creating your ticket order…"; status.className = "form-status";
    try {
      const result = await createTicketOrder(event.slug, customer, items);
      if (!result?.ok) throw new Error("The order could not be created.");
      const total = Number(result.total_amount || 0);
      const qr = result.qr_token ? `https://api.qrserver.com/v1/create-qr-code/?size=220x220&data=${encodeURIComponent(result.qr_token)}` : "";
      form.innerHTML = `<div class="confirmation"><strong>${result.status === "confirmed" ? "Tickets confirmed." : "Ticket reservation received."}</strong><p>Order ${escapeHtml(result.order_number)}${total ? ` • ${money(total)}` : ""}</p><p>${result.requires_payment ? "Hangar 18 will confirm payment instructions. Your tickets are held only after payment is confirmed." : "Save this confirmation and bring a photo ID to the event."}</p>${qr ? `<img src="${qr}" alt="Ticket check-in QR code" />` : ""}</div>`;
      await track("click", { source: "native-ticket-order", medium: "ticket-order", event_id: event.id, order_number: result.order_number });
    } catch (error) {
      status.textContent = error.message || "The ticket order could not be created.";
      status.className = "form-status is-error";
      button.disabled = false;
    }
  });

  document.querySelector(".js-ticket-request")?.addEventListener("submit", async (submitEvent) => {
    submitEvent.preventDefault();
    const form = submitEvent.currentTarget;
    const status = form.querySelector(".form-status");
    const button = form.querySelector("button[type=submit]");
    const data = values(form);
    button.disabled = true; status.textContent = "Sending ticket request…"; status.className = "form-status";
    try {
      await submitForm("reservation", {
        name: data.name, email: data.email, phone: data.phone,
        subject: `Ticket request: ${event.name}`,
        message: data.message || `${data.quantity || 1} ticket(s) requested`,
        payload: { event_id: event.id, event_name: event.name, quantity: Number(data.quantity || 1), tracking: trackingState() }
      });
      form.reset(); status.textContent = "Ticket request sent. Hangar 18 will follow up with availability and payment details."; status.className = "form-status is-success";
    } catch (error) {
      status.textContent = error.message || "The request could not be sent."; status.className = "form-status is-error"; button.disabled = false;
    }
  });
}
