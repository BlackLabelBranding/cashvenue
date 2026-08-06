import {
  checkInOrder,
  createCampaign,
  createTicketType,
  currentUser,
  inviteAdmin,
  loadAdminData,
  login,
  logout,
  markOrderPaid,
  resetPassword,
  saveSite,
  updateAdmin,
  updateCampaign,
  updateSubmission,
  updateTicketType
} from "./supabase.js";
import { CONFIG } from "./config.js";
import { appRoot, escapeHtml, formatDate, icon, safeUrl, showToast } from "./ui.js";

const state = { session: null, user: null, data: null, tab: "dashboard", sidebar: false };

const tabs = [
  ["dashboard", "Dashboard", "home"],
  ["website", "Website", "settings"],
  ["events", "Events", "calendar"],
  ["tickets", "Tickets", "ticket"],
  ["inquiries", "Inquiries", "mail"],
  ["orders", "Orders & Door", "check"],
  ["promoters", "Promo Performance", "users"],
  ["team", "Management Team", "login"]
];

function slugify(value) {
  return String(value || "").toLowerCase().trim().replace(/[’']/g, "").replace(/[^a-z0-9]+/g, "-").replace(/^-+|-+$/g, "").slice(0, 70);
}

function money(value) {
  return new Intl.NumberFormat("en-US", { style: "currency", currency: "USD" }).format(Number(value || 0));
}

function badge(status) {
  const value = String(status || "unknown");
  const tone = ["active", "live", "confirmed", "completed", "verified"].includes(value) ? "green" : ["new", "pending_payment", "scheduled", "invited", "draft"].includes(value) ? "yellow" : ["cancelled", "refunded", "spam", "archived", "revoked"].includes(value) ? "red" : "";
  return `<span class="admin-badge${tone ? ` admin-badge--${tone}` : ""}">${escapeHtml(value.replaceAll("_", " "))}</span>`;
}

function field(label, name, value = "", options = {}) {
  if (options.type === "textarea") return `<div class="field${options.wide ? " field--wide" : ""}"><label>${escapeHtml(label)}</label><textarea name="${escapeHtml(name)}" ${options.required ? "required" : ""}>${escapeHtml(value)}</textarea></div>`;
  if (options.type === "select") return `<div class="field${options.wide ? " field--wide" : ""}"><label>${escapeHtml(label)}</label><select name="${escapeHtml(name)}">${(options.choices || []).map(([choice, text]) => `<option value="${escapeHtml(choice)}"${String(choice) === String(value) ? " selected" : ""}>${escapeHtml(text)}</option>`).join("")}</select></div>`;
  return `<div class="field${options.wide ? " field--wide" : ""}"><label>${escapeHtml(label)}</label><input name="${escapeHtml(name)}" type="${escapeHtml(options.type || "text")}" value="${escapeHtml(value ?? "")}" ${options.required ? "required" : ""} ${options.min != null ? `min="${options.min}"` : ""} ${options.step ? `step="${options.step}"` : ""} /></div>`;
}

function panel(title, body, action = "") {
  return `<section class="admin-panel"><div class="admin-panel__head"><h2>${escapeHtml(title)}</h2>${action}</div><div class="admin-panel__body">${body}</div></section>`;
}

function metric(label, value) {
  return `<article class="admin-metric"><span>${escapeHtml(label)}</span><strong>${escapeHtml(String(value))}</strong></article>`;
}

function loginView() {
  document.body.classList.add("admin-body");
  appRoot.innerHTML = `<main class="admin-login" style="--hero-image:url('${CONFIG.assets.hero}')"><section class="admin-login__visual"><img src="${CONFIG.assets.logo}" alt="Hangar 18" /><h1>Hangar 18 Management</h1></section><section class="admin-login__form"><div class="admin-login__card"><p class="eyebrow">VENUE ACCESS</p><h2>Sign in to manage the hangar.</h2><p>Events, tickets, inquiries, website content, ordering links, staff promotion, and performance data.</p><form class="js-admin-login"><div class="stack">${field("Email", "email", "", { type: "email", required: true })}${field("Password", "password", "", { type: "password", required: true })}<button class="button button--primary" type="submit">${icon("login")} Sign In</button><button class="button button--ghost js-reset-password" type="button">Send Password Reset</button><a class="button button--ghost js-route" href="/">Return to Website</a><p class="form-status" role="status"></p></div></form></div></section></main>`;

  const form = document.querySelector(".js-admin-login");
  form.addEventListener("submit", async (event) => {
    event.preventDefault();
    const data = Object.fromEntries(new FormData(form).entries());
    const status = form.querySelector(".form-status");
    const button = form.querySelector("button[type=submit]");
    button.disabled = true; status.textContent = "Signing in…";
    try {
      const session = await login(data.email.trim(), data.password);
      state.session = session; await bootAdmin();
    } catch (error) {
      status.textContent = error.message || "Sign-in failed."; status.className = "form-status is-error"; button.disabled = false;
    }
  });
  document.querySelector(".js-reset-password").addEventListener("click", async () => {
    const email = form.email.value.trim();
    const status = form.querySelector(".form-status");
    if (!email) { status.textContent = "Enter the email address first."; status.className = "form-status is-error"; return; }
    try { await resetPassword(email); status.textContent = "Password reset sent. Check your email."; status.className = "form-status is-success"; }
    catch (error) { status.textContent = error.message || "Reset could not be sent."; status.className = "form-status is-error"; }
  });
}

function dashboardView(data) {
  const thirtyDays = Date.now() - 30 * 86400000;
  const clicks = data.trackingEvents.filter((item) => item.event_type === "click" && new Date(item.occurred_at).getTime() >= thirtyDays).length;
  const views = data.trackingEvents.filter((item) => item.event_type === "landing_view" && new Date(item.occurred_at).getTime() >= thirtyDays).length;
  const verified = data.conversions.filter((item) => item.status === "verified" && new Date(item.occurred_at).getTime() >= thirtyDays);
  const revenue = verified.reduce((sum, item) => sum + Number(item.value_amount || 0), 0);
  const liveEvents = data.campaigns.filter((item) => ["scheduled", "live"].includes(item.status));
  const openInquiries = data.submissions.filter((item) => ["new", "in_progress"].includes(item.status));
  const upcoming = [...liveEvents].sort((a,b) => new Date(a.starts_at || 0) - new Date(b.starts_at || 0)).slice(0, 6);
  return `<div class="admin-metrics">${metric("Upcoming events", liveEvents.length)}${metric("Open inquiries", openInquiries.length)}${metric("Tracked clicks · 30d", clicks)}${metric("Verified revenue · 30d", money(revenue))}</div>
  ${panel("Campaign Proof · Last 30 Days", `<div class="admin-metrics">${metric("Landing views", views)}${metric("Verified conversions", verified.length)}${metric("Active promoters", data.venuePromoters.filter((item) => item.status === "active").length)}${metric("Reward entries", data.ledger.length)}</div>`)}
  ${panel("Upcoming Events", upcoming.length ? `<div class="admin-table-wrap"><table class="admin-table"><thead><tr><th>Event</th><th>Date</th><th>Status</th><th>Promote</th></tr></thead><tbody>${upcoming.map((event) => `<tr><td><strong>${escapeHtml(event.name)}</strong><br/><small>${escapeHtml(event.description || "")}</small></td><td>${escapeHtml(formatDate(event.starts_at))}</td><td>${badge(event.status)}</td><td><button class="button button--small button--ghost" data-copy-campaign="${event.id}">Copy Link</button></td></tr>`).join("")}</tbody></table></div>` : `<div class="empty-box">No upcoming events. Create one in the Events section.</div>`, `<button class="button button--small button--primary" data-tab="events">Create Event</button>`)}
  ${panel("Newest Inquiries", openInquiries.length ? `<div class="admin-table-wrap"><table class="admin-table"><thead><tr><th>Type</th><th>Contact</th><th>Message</th><th>Status</th></tr></thead><tbody>${openInquiries.slice(0,8).map((item) => `<tr><td>${escapeHtml(item.submission_type.replaceAll("_", " "))}</td><td><strong>${escapeHtml(item.name || "Unknown")}</strong><br/><small>${escapeHtml(item.email || item.phone || "")}</small></td><td>${escapeHtml((item.message || item.subject || "").slice(0,140))}</td><td>${badge(item.status)}</td></tr>`).join("")}</tbody></table></div>` : `<div class="empty-box">No open inquiries.</div>`, `<button class="button button--small button--ghost" data-tab="inquiries">Open Queue</button>`)}`;
}

function websiteView(data) {
  const site = data.site;
  const content = site.content || {};
  const settings = site.settings || {};
  const hours = site.hours || {};
  const hourFields = Object.entries(hours).map(([day, value]) => field(day[0].toUpperCase() + day.slice(1), `hour_${day}`, value.closed ? "Closed" : value.bar || value.kitchen || "")).join("");
  const body = `<form class="js-site-form"><div class="admin-form-grid">${field("Venue name", "display_name", site.display_name, { required: true })}${field("Domain", "domain", site.domain)}${field("Phone", "contact_phone", site.contact_phone)}${field("Email", "contact_email", site.contact_email, { type: "email" })}${field("Address", "address_line1", site.address_line1)}${field("City", "city", site.city)}${field("State", "state", site.state)}${field("ZIP", "postal_code", site.postal_code)}${field("Order provider", "order_provider", site.order_provider, { type: "select", choices: [["none","None"],["toast","Toast"],["chownow","ChowNow"],["external","Other external link"]] })}${field("Order URL", "order_url", settings.toast_order_url || site.order_url || "", { type: "url", wide: true })}${field("Hero headline", "hero_title", content.hero_title || "", { wide: true })}${field("Hero copy", "hero_copy", content.hero_copy || "", { type: "textarea", wide: true })}${field("About headline", "about_title", content.about_title || "", { wide: true })}${field("About copy", "about_copy", content.about_copy || "", { type: "textarea", wide: true })}${field("Private-events copy", "private_events_copy", content.private_events_copy || "", { type: "textarea", wide: true })}</div><h3>Public Hours</h3><div class="admin-form-grid">${hourFields}</div><div class="admin-actions" style="margin-top:1rem"><button class="button button--primary" type="submit">Save Website</button><a class="button button--ghost" href="/" target="_blank">Open Public Site</a></div><p class="form-status" role="status"></p></form>`;
  return panel("Website & Ordering", body);
}

function eventsView(data) {
  const newForm = `<form class="js-event-form"><div class="admin-form-grid">${field("Event name", "name", "", { required: true })}${field("Status", "status", "draft", { type: "select", choices: [["draft","Draft"],["scheduled","Published / Scheduled"],["live","Live now"]] })}${field("Starts", "starts_at", "", { type: "datetime-local", required: true })}${field("Ends", "ends_at", "", { type: "datetime-local" })}${field("Hero image URL", "hero_image_url", "", { type: "url", wide: true })}${field("Description", "description", "", { type: "textarea", wide: true })}${field("Price label", "price_label", "")}${field("Special guest", "special_guest", "")}${field("Ticketing mode", "ticketing_mode", "native", { type: "select", choices: [["native","Native tickets"],["external","External ticket link"],["door","Pay / enter at door"]] })}${field("External ticket URL", "external_ticket_url", "", { type: "url" })}${field("Approved promotional caption", "default_caption", "", { type: "textarea", wide: true })}</div><button class="button button--primary" type="submit">Create Event</button><p class="form-status" role="status"></p></form>`;
  const rows = data.campaigns.map((event) => `<tr><td><strong>${escapeHtml(event.name)}</strong><br/><small>${escapeHtml(event.description || "")}</small></td><td>${escapeHtml(formatDate(event.starts_at))}</td><td>${badge(event.status)}</td><td><div class="admin-actions"><button class="button button--small button--ghost" data-event-status="${event.id}" data-status="scheduled">Publish</button><button class="button button--small button--ghost" data-event-status="${event.id}" data-status="live">Live</button><button class="button button--small button--ghost" data-event-status="${event.id}" data-status="archived">Archive</button><a class="button button--small button--ghost" href="/event/${escapeHtml(event.metadata?.public_slug || event.slug.replace(/^hangar-18-/, ""))}" target="_blank">View</a></div></td></tr>`).join("");
  return `${panel("Create Event", newForm)}${panel("Event Library", rows ? `<div class="admin-table-wrap"><table class="admin-table"><thead><tr><th>Event</th><th>Date</th><th>Status</th><th>Actions</th></tr></thead><tbody>${rows}</tbody></table></div>` : `<div class="empty-box">No events yet.</div>`)}`;
}

function ticketsView(data) {
  const campaigns = data.campaigns.filter((item) => item.status !== "archived");
  const newForm = `<form class="js-ticket-type-form"><div class="admin-form-grid">${field("Event", "campaign_id", "", { type: "select", choices: [["","Choose an event"], ...campaigns.map((item) => [item.id,item.name])] })}${field("Ticket name", "name", "General Admission", { required: true })}${field("Price", "price_amount", "0", { type: "number", step: ".01" })}${field("Display price", "price_label", "")}${field("Quantity available", "quantity_total", "", { type: "number", min: 0 })}${field("Maximum per order", "max_per_order", "10", { type: "number", min: 1 })}${field("External checkout URL", "external_purchase_url", "", { type: "url", wide: true })}${field("Description", "description", "", { type: "textarea", wide: true })}</div><button class="button button--primary" type="submit">Create Ticket Type</button><p class="form-status" role="status"></p></form>`;
  const campaignById = Object.fromEntries(data.campaigns.map((item) => [item.id,item]));
  const rows = data.ticketTypes.map((ticket) => `<tr><td><strong>${escapeHtml(ticket.name)}</strong><br/><small>${escapeHtml(campaignById[ticket.campaign_id]?.name || "Unknown event")}</small></td><td>${escapeHtml(ticket.price_label || money(ticket.price_amount))}</td><td>${ticket.quantity_sold}${ticket.quantity_total == null ? " / Unlimited" : ` / ${ticket.quantity_total}`}</td><td>${badge(ticket.status)}</td><td><div class="admin-actions"><button class="button button--small button--ghost" data-ticket-status="${ticket.id}" data-status="active">Activate</button><button class="button button--small button--ghost" data-ticket-status="${ticket.id}" data-status="paused">Pause</button><button class="button button--small button--ghost" data-ticket-status="${ticket.id}" data-status="sold_out">Sold Out</button></div></td></tr>`).join("");
  return `${panel("Create Ticket Type", newForm)}${panel("Ticket Inventory", rows ? `<div class="admin-table-wrap"><table class="admin-table"><thead><tr><th>Ticket</th><th>Price</th><th>Sold / Capacity</th><th>Status</th><th>Actions</th></tr></thead><tbody>${rows}</tbody></table></div>` : `<div class="empty-box">No native ticket types yet. External ticket links can still be placed on events.</div>`)}`;
}

function inquiriesView(data) {
  const rows = data.submissions.map((item) => `<tr><td>${escapeHtml(formatDate(item.created_at))}</td><td>${badge(item.submission_type)}</td><td><strong>${escapeHtml(item.name || "Unknown")}</strong><br/><small>${escapeHtml(item.email || "")} ${escapeHtml(item.phone || "")}</small></td><td><strong>${escapeHtml(item.subject || "")}</strong><br/>${escapeHtml(item.message || "")}<details><summary>Submitted details</summary><pre>${escapeHtml(JSON.stringify(item.payload || {}, null, 2))}</pre></details></td><td>${badge(item.status)}</td><td><div class="admin-actions"><button class="button button--small button--ghost" data-inquiry-status="${item.id}" data-status="in_progress">Working</button><button class="button button--small button--ghost" data-inquiry-status="${item.id}" data-status="completed">Complete</button><button class="button button--small button--ghost" data-inquiry-status="${item.id}" data-status="spam">Spam</button></div></td></tr>`).join("");
  return panel("Website Inquiry Queue", rows ? `<div class="admin-table-wrap"><table class="admin-table"><thead><tr><th>Received</th><th>Type</th><th>Contact</th><th>Request</th><th>Status</th><th>Actions</th></tr></thead><tbody>${rows}</tbody></table></div>` : `<div class="empty-box">No website submissions yet.</div>`);
}

function ordersView(data) {
  const campaignById = Object.fromEntries(data.campaigns.map((item) => [item.id,item]));
  const itemsByOrder = data.orderItems.reduce((map,item) => { (map[item.order_id] ||= []).push(item); return map; }, {});
  const rows = data.orders.map((order) => `<tr><td><strong>${escapeHtml(order.order_number)}</strong><br/><small>${escapeHtml(formatDate(order.created_at))}</small></td><td><strong>${escapeHtml(order.customer_name)}</strong><br/><small>${escapeHtml(order.customer_email)} ${escapeHtml(order.customer_phone || "")}</small></td><td>${escapeHtml(campaignById[order.campaign_id]?.name || "Event")}<br/><small>${(itemsByOrder[order.id] || []).map((item) => `${item.quantity}× ${item.ticket_name}`).join(", ")}</small></td><td>${money(order.total_amount)}</td><td>${badge(order.status)}</td><td><div class="admin-actions">${order.status === "pending_payment" ? `<button class="button button--small button--primary" data-mark-paid="${order.id}" data-order-number="${escapeHtml(order.order_number)}">Mark Paid</button>` : ""}${order.status === "confirmed" ? `<button class="button button--small button--ghost" data-check-in="${order.id}">Check In</button>` : ""}</div></td></tr>`).join("");
  return `${panel("Ticket Orders", rows ? `<div class="admin-table-wrap"><table class="admin-table"><thead><tr><th>Order</th><th>Customer</th><th>Event / Tickets</th><th>Total</th><th>Status</th><th>Door Actions</th></tr></thead><tbody>${rows}</tbody></table></div>` : `<div class="empty-box">No native ticket orders yet.</div>`)}${panel("Door Workflow", `<p class="copy">Search the order table by customer name, email, order number, or event. Confirm unpaid orders only after payment is actually received. Check-in actions are written to the Promo Proof ticket-check-in ledger.</p><div class="form-grid"><div class="field field--wide"><label>Quick filter</label><input class="js-order-filter" placeholder="Type a name, email, order number, or event" /></div></div>`)}`;
}

function promotersView(data) {
  const promoterById = Object.fromEntries(data.promoters.map((item) => [item.id,item]));
  const clicksByPromoter = data.trackingEvents.reduce((map,item) => { if (item.promoter_id && item.event_type === "click") map[item.promoter_id] = (map[item.promoter_id] || 0) + 1; return map; }, {});
  const conversionsByPromoter = data.conversions.reduce((map,item) => { if (item.promoter_id && item.status === "verified") { map[item.promoter_id] ||= { count:0,revenue:0 }; map[item.promoter_id].count += 1; map[item.promoter_id].revenue += Number(item.value_amount || 0); } return map; }, {});
  const rewardByPromoter = data.ledger.reduce((map,item) => { map[item.promoter_id] ||= { points:0,cash:0 }; if (["approved","paid"].includes(item.status)) { map[item.promoter_id].points += Number(item.points_delta || 0); map[item.promoter_id].cash += Number(item.cash_delta || 0); } return map; }, {});
  const rows = data.venuePromoters.map((connection) => { const person = promoterById[connection.promoter_id] || {}; const conversion = conversionsByPromoter[connection.promoter_id] || {}; const reward = rewardByPromoter[connection.promoter_id] || {}; return `<tr><td><strong>${escapeHtml(person.display_name || "Promoter")}</strong><br/><small>${escapeHtml(person.tracking_code || "")}</small></td><td>${badge(connection.relationship_type)}</td><td>${clicksByPromoter[connection.promoter_id] || 0}</td><td>${conversion.count || 0}</td><td>${money(conversion.revenue || 0)}</td><td>${reward.points || 0} pts<br/><small>${money(reward.cash || 0)}</small></td><td>${badge(connection.status)}</td></tr>`; }).join("");
  return `${panel("Promo Proof Performance", rows ? `<div class="admin-table-wrap"><table class="admin-table"><thead><tr><th>Promoter</th><th>Role</th><th>Clicks</th><th>Verified Results</th><th>Revenue</th><th>Rewards</th><th>Status</th></tr></thead><tbody>${rows}</tbody></table></div>` : `<div class="empty-box">Connect bartenders and promoters in Promo Proof to start measuring distribution.</div>`)}${panel("How Venue Promotion Works", `<div class="grid grid--3"><article class="feature-card"><h3>1. Publish</h3><p>The venue creates the official event or promotion here.</p></article><article class="feature-card"><h3>2. Distribute</h3><p>Connected bartenders and promoters receive approved content and personalized links.</p></article><article class="feature-card"><h3>3. Prove</h3><p>Clicks, leads, tickets, check-ins, revenue, and rewards stay connected to the source.</p></article></div>`)}`;
}

function teamView(data) {
  const form = `<form class="js-team-form"><div class="admin-form-grid">${field("Email", "email", "", { type: "email", required: true })}${field("Role", "role", "manager", { type: "select", choices: [["owner","Owner"],["manager","Manager"],["marketing","Marketing"],["door","Door / Check-in"],["viewer","Viewer"]] })}</div><button class="button button--primary" type="submit">Invite Manager</button><p class="form-status" role="status"></p></form>`;
  const rows = data.admins.map((admin) => `<tr><td>${escapeHtml(admin.invite_email || admin.user_id || "User")}</td><td>${badge(admin.role)}</td><td>${badge(admin.status)}</td><td><div class="admin-actions"><button class="button button--small button--ghost" data-admin-status="${admin.id}" data-status="active">Activate</button><button class="button button--small button--ghost" data-admin-status="${admin.id}" data-status="suspended">Suspend</button><button class="button button--small button--ghost" data-admin-status="${admin.id}" data-status="revoked">Revoke</button></div></td></tr>`).join("");
  return `${panel("Invite Venue Management", form)}${panel("Management Access", rows ? `<div class="admin-table-wrap"><table class="admin-table"><thead><tr><th>User / Invite</th><th>Role</th><th>Status</th><th>Actions</th></tr></thead><tbody>${rows}</tbody></table></div>` : `<div class="empty-box">No venue-specific manager invitations yet. Black Label administrators retain internal support access.</div>`)}`;
}

function tabContent() {
  const data = state.data;
  if (state.tab === "website") return websiteView(data);
  if (state.tab === "events") return eventsView(data);
  if (state.tab === "tickets") return ticketsView(data);
  if (state.tab === "inquiries") return inquiriesView(data);
  if (state.tab === "orders") return ordersView(data);
  if (state.tab === "promoters") return promotersView(data);
  if (state.tab === "team") return teamView(data);
  return dashboardView(data);
}

function adminShell() {
  const nav = tabs.map(([id,label,iconName]) => `<button type="button" class="${state.tab === id ? "is-active" : ""}" data-tab="${id}">${icon(iconName)} ${escapeHtml(label)}</button>`).join("");
  appRoot.innerHTML = `<div class="admin-layout"><aside class="admin-sidebar${state.sidebar ? " is-open" : ""}"><div class="admin-sidebar__brand"><img src="${CONFIG.assets.logo}" alt="Hangar 18" /><span>Management Portal</span></div><nav class="admin-nav">${nav}</nav><div class="admin-sidebar__footer"><a class="button button--ghost button--small" href="/" target="_blank">Open Website</a><button class="button button--ghost button--small js-admin-logout" type="button">Sign Out</button></div></aside><main class="admin-main"><header class="admin-topbar"><div style="display:flex;align-items:center;gap:.7rem"><button class="admin-mobile-toggle" type="button">${icon("menu")}</button><div><h1>${escapeHtml(tabs.find(([id]) => id === state.tab)?.[1] || "Dashboard")}</h1><small>${escapeHtml(state.user?.email || "Hangar 18 management")}</small></div></div><button class="button button--small button--ghost js-admin-refresh" type="button">${icon("refresh")} Refresh</button></header><div class="admin-content">${tabContent()}</div></main></div>`;
  wireAdmin();
}

async function reload(message = "") {
  state.data = await loadAdminData(state.session.access_token);
  adminShell();
  if (message) showToast(message);
}

function formStatus(form, message, error = false) {
  const status = form.querySelector(".form-status");
  if (!status) return;
  status.textContent = message;
  status.className = `form-status${error ? " is-error" : " is-success"}`;
}

function formObject(form) {
  return Object.fromEntries([...new FormData(form).entries()].map(([key,value]) => [key, typeof value === "string" ? value.trim() : value]));
}

function wireAdmin() {
  document.querySelectorAll("[data-tab]").forEach((button) => button.addEventListener("click", () => { state.tab = button.dataset.tab; state.sidebar = false; adminShell(); scrollTo(0,0); }));
  document.querySelector(".admin-mobile-toggle")?.addEventListener("click", () => { state.sidebar = !state.sidebar; document.querySelector(".admin-sidebar").classList.toggle("is-open", state.sidebar); });
  document.querySelector(".js-admin-logout")?.addEventListener("click", () => { logout(); state.session = state.user = state.data = null; loginView(); });
  document.querySelector(".js-admin-refresh")?.addEventListener("click", () => reload("Hangar 18 data refreshed.").catch((error) => showToast(error.message, true)));

  document.querySelector(".js-site-form")?.addEventListener("submit", async (event) => {
    event.preventDefault(); const form = event.currentTarget; const values = formObject(form); const site = state.data.site;
    const hours = { ...(site.hours || {}) };
    Object.keys(hours).forEach((day) => { const raw = values[`hour_${day}`]; hours[day] = /^closed$/i.test(raw) ? { closed:true } : { kitchen: raw, bar: raw }; delete values[`hour_${day}`]; });
    const content = { ...(site.content || {}), hero_title: values.hero_title, hero_copy: values.hero_copy, about_title: values.about_title, about_copy: values.about_copy, private_events_copy: values.private_events_copy };
    const settings = { ...(site.settings || {}), toast_order_url: values.order_provider === "toast" ? values.order_url : site.settings?.toast_order_url || null };
    ["hero_title","hero_copy","about_title","about_copy","private_events_copy"].forEach((key) => delete values[key]);
    const orderUrl = values.order_url; delete values.order_url;
    try { await saveSite(state.session.access_token, site, { ...values, order_url: orderUrl || null, fallback_order_url: site.fallback_order_url || orderUrl || null, hours, content, settings }); await reload("Website settings saved."); }
    catch (error) { formStatus(form, error.message || "Could not save website.", true); }
  });

  document.querySelector(".js-event-form")?.addEventListener("submit", async (event) => {
    event.preventDefault(); const form = event.currentTarget; const values = formObject(form);
    const publicSlug = slugify(values.name);
    values.slug = `hangar-18-${publicSlug}-${Math.random().toString(36).slice(2,6)}`;
    values.starts_at = values.starts_at ? new Date(values.starts_at).toISOString() : null;
    values.ends_at = values.ends_at ? new Date(values.ends_at).toISOString() : null;
    values.metadata = { public_slug: publicSlug, price_label: values.price_label || null, special_guest: values.special_guest || null, ticketing_mode: values.ticketing_mode, external_ticket_url: values.external_ticket_url || null, category: "live music" };
    ["price_label","special_guest","ticketing_mode","external_ticket_url"].forEach((key) => delete values[key]);
    try { await createCampaign(state.session.access_token, state.data.venueId, values); await reload("Event created."); }
    catch (error) { formStatus(form, error.message || "Could not create event.", true); }
  });

  document.querySelectorAll("[data-event-status]").forEach((button) => button.addEventListener("click", async () => {
    button.disabled = true;
    try { await updateCampaign(state.session.access_token, button.dataset.eventStatus, { status: button.dataset.status, published_at: ["scheduled","live"].includes(button.dataset.status) ? new Date().toISOString() : null }); await reload("Event status updated."); }
    catch (error) { button.disabled = false; showToast(error.message, true); }
  }));

  document.querySelector(".js-ticket-type-form")?.addEventListener("submit", async (event) => {
    event.preventDefault(); const form = event.currentTarget; const values = formObject(form);
    if (!values.campaign_id) { formStatus(form, "Choose an event.", true); return; }
    try { await createTicketType(state.session.access_token, values); await reload("Ticket type created."); }
    catch (error) { formStatus(form, error.message || "Could not create ticket type.", true); }
  });

  document.querySelectorAll("[data-ticket-status]").forEach((button) => button.addEventListener("click", async () => {
    button.disabled = true;
    try { await updateTicketType(state.session.access_token, button.dataset.ticketStatus, { status: button.dataset.status }); await reload("Ticket status updated."); }
    catch (error) { button.disabled = false; showToast(error.message, true); }
  }));

  document.querySelectorAll("[data-inquiry-status]").forEach((button) => button.addEventListener("click", async () => {
    button.disabled = true;
    try { await updateSubmission(state.session.access_token, button.dataset.inquiryStatus, state.data.venueId, button.dataset.status); await reload("Inquiry updated."); }
    catch (error) { button.disabled = false; showToast(error.message, true); }
  }));

  document.querySelectorAll("[data-mark-paid]").forEach((button) => button.addEventListener("click", async () => {
    if (!confirm(`Confirm payment was received for ${button.dataset.orderNumber}?`)) return;
    button.disabled = true;
    try { await markOrderPaid(state.session.access_token, button.dataset.markPaid, button.dataset.orderNumber); await reload("Order confirmed paid."); }
    catch (error) { button.disabled = false; showToast(error.message, true); }
  }));

  document.querySelectorAll("[data-check-in]").forEach((button) => button.addEventListener("click", async () => {
    button.disabled = true;
    try { await checkInOrder(state.session.access_token, button.dataset.checkIn, 1); await reload("Guest checked in."); }
    catch (error) { button.disabled = false; showToast(error.message, true); }
  }));

  document.querySelector(".js-order-filter")?.addEventListener("input", (event) => {
    const value = event.target.value.toLowerCase();
    document.querySelectorAll(".admin-table tbody tr").forEach((row) => row.hidden = value && !row.textContent.toLowerCase().includes(value));
  });

  document.querySelector(".js-team-form")?.addEventListener("submit", async (event) => {
    event.preventDefault(); const form = event.currentTarget; const values = formObject(form);
    try { await inviteAdmin(state.session.access_token, state.data.venueId, values.email, values.role); await reload("Manager invitation created. They can sign in after their Supabase account is created with the same email."); }
    catch (error) { formStatus(form, error.message || "Could not create invitation.", true); }
  });

  document.querySelectorAll("[data-admin-status]").forEach((button) => button.addEventListener("click", async () => {
    button.disabled = true;
    try { await updateAdmin(state.session.access_token, button.dataset.adminStatus, state.data.venueId, { status: button.dataset.status }); await reload("Management access updated."); }
    catch (error) { button.disabled = false; showToast(error.message, true); }
  }));

  document.querySelectorAll("[data-copy-campaign]").forEach((button) => button.addEventListener("click", async () => {
    const event = state.data.campaigns.find((item) => item.id === button.dataset.copyCampaign);
    const url = `${location.origin}/event/${event?.metadata?.public_slug || event?.slug?.replace(/^hangar-18-/, "")}`;
    await navigator.clipboard.writeText(url); showToast("Event link copied.");
  }));
}

export async function bootAdmin() {
  document.body.classList.add("admin-body");
  appRoot.innerHTML = `<main class="boot-screen"><img src="${CONFIG.assets.logo}" alt="Hangar 18" /><div class="boot-spinner"></div><p>Opening management portal…</p></main>`;
  try {
    const auth = await currentUser(state.session);
    if (!auth) { loginView(); return; }
    state.user = auth.user; state.session = auth.session;
    state.data = await loadAdminData(state.session.access_token);
    adminShell();
  } catch (error) {
    console.error(error);
    if (error.status === 401) { logout(); loginView(); return; }
    appRoot.innerHTML = `<main class="admin-login"><section class="admin-login__visual" style="--hero-image:url('${CONFIG.assets.hero}')"><img src="${CONFIG.assets.logo}" alt="Hangar 18" /><h1>Hangar 18 Management</h1></section><section class="admin-login__form"><div class="admin-login__card"><h2>Access needs attention.</h2><p>${escapeHtml(error.message || "This account could not load Hangar 18 management data.")}</p><div class="button-row"><button class="button button--primary js-admin-retry">Try Again</button><button class="button button--ghost js-admin-signout">Sign Out</button><a class="button button--ghost" href="/">Public Site</a></div></div></section></main>`;
    document.querySelector(".js-admin-retry")?.addEventListener("click", bootAdmin);
    document.querySelector(".js-admin-signout")?.addEventListener("click", () => { logout(); loginView(); });
  }
}
