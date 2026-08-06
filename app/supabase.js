import { CONFIG } from "./config.js";

const SESSION_KEY = "h18-admin-session";
const TRACKING_KEY = "h18-promo-proof";
const baseHeaders = { apikey: CONFIG.supabaseAnonKey, "Content-Type": "application/json" };

function cleanError(payload, fallback) {
  return payload?.message || payload?.msg || payload?.error_description || payload?.error || fallback;
}

async function parse(response) {
  const text = await response.text();
  let payload = null;
  try { payload = text ? JSON.parse(text) : null; } catch { payload = text; }
  if (!response.ok) {
    const error = new Error(cleanError(payload, `Request failed (${response.status}).`));
    error.status = response.status;
    error.payload = payload;
    throw error;
  }
  return payload;
}

function authHeaders(token, extra = {}) {
  return { ...baseHeaders, ...(token ? { Authorization: `Bearer ${token}` } : {}), ...extra };
}

export async function rpc(name, body = {}, token = null) {
  const response = await fetch(`${CONFIG.supabaseUrl}/rest/v1/rpc/${name}`, {
    method: "POST",
    headers: authHeaders(token),
    body: JSON.stringify(body)
  });
  return parse(response);
}

export async function rest(path, options = {}) {
  const headers = authHeaders(options.token, options.headers || {});
  const response = await fetch(`${CONFIG.supabaseUrl}/rest/v1/${path}`, {
    method: options.method || "GET",
    headers,
    body: options.body === undefined ? undefined : JSON.stringify(options.body)
  });
  return parse(response);
}

export function readSession() {
  try { return JSON.parse(localStorage.getItem(SESSION_KEY) || "null"); } catch { return null; }
}

export function writeSession(session) {
  if (!session) localStorage.removeItem(SESSION_KEY);
  else localStorage.setItem(SESSION_KEY, JSON.stringify(session));
}

export async function login(email, password) {
  const response = await fetch(`${CONFIG.supabaseUrl}/auth/v1/token?grant_type=password`, {
    method: "POST",
    headers: baseHeaders,
    body: JSON.stringify({ email, password })
  });
  const session = await parse(response);
  writeSession(session);
  return session;
}

export async function refreshSession(session = readSession()) {
  if (!session?.refresh_token) return null;
  const response = await fetch(`${CONFIG.supabaseUrl}/auth/v1/token?grant_type=refresh_token`, {
    method: "POST",
    headers: baseHeaders,
    body: JSON.stringify({ refresh_token: session.refresh_token })
  });
  const next = await parse(response);
  writeSession(next);
  return next;
}

export async function currentUser(session = readSession()) {
  if (!session?.access_token) return null;
  let active = session;
  if (session.expires_at && session.expires_at * 1000 < Date.now() + 60000) {
    active = await refreshSession(session);
  }
  if (!active?.access_token) return null;
  const response = await fetch(`${CONFIG.supabaseUrl}/auth/v1/user`, {
    headers: authHeaders(active.access_token)
  });
  if (response.status === 401) {
    writeSession(null);
    return null;
  }
  const user = await parse(response);
  return { user, session: active };
}

export async function resetPassword(email) {
  const response = await fetch(`${CONFIG.supabaseUrl}/auth/v1/recover`, {
    method: "POST",
    headers: baseHeaders,
    body: JSON.stringify({ email })
  });
  return parse(response);
}

export function logout() { writeSession(null); }

export function trackingState() {
  const params = new URLSearchParams(location.search);
  let saved = {};
  try { saved = JSON.parse(localStorage.getItem(TRACKING_KEY) || "{}"); } catch { saved = {}; }
  const next = {
    token: params.get("pp_token") || saved.token || "",
    ref: params.get("pp_ref") || saved.ref || "",
    campaign: params.get("pp_campaign") || saved.campaign || "",
    visitorKey: saved.visitorKey || crypto.randomUUID?.() || `visitor-${Date.now()}-${Math.random().toString(36).slice(2)}`,
    sessionId: sessionStorage.getItem("h18-session-id") || crypto.randomUUID?.() || `session-${Date.now()}-${Math.random().toString(36).slice(2)}`
  };
  sessionStorage.setItem("h18-session-id", next.sessionId);
  localStorage.setItem(TRACKING_KEY, JSON.stringify(next));
  return next;
}

export async function publicBundle() {
  return rpc("promo_proof_public_site_bundle", { p_site_key: CONFIG.siteKey });
}

export async function publicEvent(slug) {
  return rpc("promo_proof_public_event", { p_site_key: CONFIG.siteKey, p_campaign_slug: slug });
}

export async function track(eventType, metadata = {}) {
  const tracking = trackingState();
  if (!tracking.token) return { ok: false, skipped: true };
  return rpc("promo_proof_record_public_event", {
    p_token: tracking.token,
    p_event_type: eventType,
    p_session_id: tracking.sessionId,
    p_visitor_key: tracking.visitorKey,
    p_source: metadata.source || document.referrer || "direct",
    p_medium: metadata.medium || "website",
    p_metadata: { path: location.pathname, ...metadata }
  });
}

export async function submitForm(type, values) {
  const tracking = trackingState();
  return rpc("promo_proof_submit_form", {
    p_site_key: CONFIG.siteKey,
    p_submission_type: type,
    p_name: values.name || null,
    p_email: values.email || null,
    p_phone: values.phone || null,
    p_subject: values.subject || null,
    p_message: values.message || null,
    p_payload: values.payload || {},
    p_tracking_token: tracking.token || null
  });
}

export async function createTicketOrder(slug, values, items) {
  const tracking = trackingState();
  return rpc("promo_proof_create_ticket_order", {
    p_site_key: CONFIG.siteKey,
    p_campaign_slug: slug,
    p_customer_name: values.name,
    p_customer_email: values.email,
    p_customer_phone: values.phone || null,
    p_items: items,
    p_tracking_token: tracking.token || null,
    p_metadata: { source: "hangar18-site", path: location.pathname }
  });
}

function joinIn(values) {
  const list = values.filter(Boolean);
  return list.length ? `(${list.map((value) => `"${String(value).replaceAll('"', '')}"`).join(",")})` : "(00000000-0000-0000-0000-000000000000)";
}

export async function claimVenueAccess(token) {
  try { return await rpc("promo_proof_claim_venue_invite", { p_site_key: CONFIG.siteKey }, token); }
  catch (first) {
    return rpc("promo_proof_claim_venue_invitation", { p_site_key: CONFIG.siteKey }, token);
  }
}

export async function loadAdminData(token) {
  await claimVenueAccess(token).catch(() => null);
  const sites = await rest(`promo_proof_venue_sites?site_key=eq.${CONFIG.siteKey}&select=*`, { token });
  const site = sites?.[0];
  if (!site) throw new Error("This account does not have Hangar 18 management access.");
  const venueId = site.venue_id;

  const [campaigns, submissions, orders, admins, venuePromoters] = await Promise.all([
    rest(`promo_proof_campaigns?venue_id=eq.${venueId}&select=*&order=starts_at.desc`, { token }),
    rest(`promo_proof_form_submissions?venue_id=eq.${venueId}&select=*&order=created_at.desc&limit=250`, { token }),
    rest(`promo_proof_ticket_orders?venue_id=eq.${venueId}&select=*&order=created_at.desc&limit=250`, { token }),
    rest(`promo_proof_venue_admins?venue_id=eq.${venueId}&select=*&order=created_at.desc`, { token }),
    rest(`promo_proof_venue_promoters?venue_id=eq.${venueId}&select=*&order=created_at.desc`, { token })
  ]);

  const campaignIds = campaigns.map((item) => item.id);
  const promoterIds = venuePromoters.map((item) => item.promoter_id);
  const [ticketTypes, orderItems, trackingEvents, conversions, promoters, shifts, ledger] = await Promise.all([
    campaignIds.length ? rest(`promo_proof_ticket_types?campaign_id=in.${joinIn(campaignIds)}&select=*&order=sort_order.asc`, { token }) : [],
    orders.length ? rest(`promo_proof_ticket_order_items?order_id=in.${joinIn(orders.map((item) => item.id))}&select=*`, { token }) : [],
    rest(`promo_proof_tracking_events?venue_id=eq.${venueId}&select=*&order=occurred_at.desc&limit=1000`, { token }).catch(() => []),
    rest(`promo_proof_conversions?venue_id=eq.${venueId}&select=*&order=occurred_at.desc&limit=500`, { token }).catch(() => []),
    promoterIds.length ? rest(`promo_proof_promoters?id=in.${joinIn(promoterIds)}&select=*`, { token }).catch(() => []) : [],
    rest(`promo_proof_shifts?venue_id=eq.${venueId}&select=*&order=starts_at.desc&limit=300`, { token }).catch(() => []),
    rest(`promo_proof_reward_ledger?venue_id=eq.${venueId}&select=*&order=created_at.desc&limit=500`, { token }).catch(() => [])
  ]);

  return { site, venueId, campaigns, submissions, orders, admins, venuePromoters, ticketTypes, orderItems, trackingEvents, conversions, promoters, shifts, ledger };
}

export async function saveSite(token, site, patch) {
  return rest(`promo_proof_venue_sites?id=eq.${site.id}`, {
    method: "PATCH", token, headers: { Prefer: "return=representation" }, body: patch
  });
}

export async function createCampaign(token, venueId, values) {
  return rest("promo_proof_campaigns", {
    method: "POST", token, headers: { Prefer: "return=representation" },
    body: {
      venue_id: venueId,
      name: values.name,
      slug: values.slug,
      description: values.description || null,
      campaign_type: values.campaign_type || "event",
      owner_type: "venue",
      status: values.status || "draft",
      starts_at: values.starts_at || null,
      ends_at: values.ends_at || null,
      destination_url: values.destination_url || null,
      hero_image_url: values.hero_image_url || null,
      default_caption: values.default_caption || null,
      call_to_action: values.call_to_action || "Event Details",
      allow_connected_promoters: true,
      published_at: ["scheduled", "live"].includes(values.status) ? new Date().toISOString() : null,
      metadata: values.metadata || {}
    }
  });
}

export async function updateCampaign(token, id, patch) {
  return rest(`promo_proof_campaigns?id=eq.${id}`, { method: "PATCH", token, headers: { Prefer: "return=representation" }, body: patch });
}

export async function createTicketType(token, values) {
  return rest("promo_proof_ticket_types", {
    method: "POST", token, headers: { Prefer: "return=representation" },
    body: {
      campaign_id: values.campaign_id,
      name: values.name,
      description: values.description || null,
      price_amount: Number(values.price_amount || 0),
      price_label: values.price_label || null,
      quantity_total: values.quantity_total === "" ? null : Number(values.quantity_total),
      min_per_order: 1,
      max_per_order: Number(values.max_per_order || 10),
      external_purchase_url: values.external_purchase_url || null,
      status: values.status || "active",
      sort_order: Number(values.sort_order || 0),
      metadata: {}
    }
  });
}

export async function updateTicketType(token, id, patch) {
  return rest(`promo_proof_ticket_types?id=eq.${id}`, { method: "PATCH", token, headers: { Prefer: "return=representation" }, body: patch });
}

export async function updateSubmission(token, id, venueId, status) {
  return rest(`promo_proof_form_submissions?id=eq.${id}&venue_id=eq.${venueId}`, { method: "PATCH", token, headers: { Prefer: "return=representation" }, body: { status } });
}

export async function markOrderPaid(token, orderId, orderNumber) {
  return rpc("promo_proof_mark_ticket_order_paid", {
    p_order_id: orderId,
    p_payment_provider: "manual",
    p_payment_session_id: `manual-${orderNumber}`,
    p_payment_reference: "Confirmed in Hangar 18 management"
  }, token);
}

export async function checkInOrder(token, orderId, quantity = 1) {
  return rpc("promo_proof_check_in_ticket_order", { p_order_id: orderId, p_quantity: quantity }, token);
}

export async function inviteAdmin(token, venueId, email, role = "manager") {
  return rest("promo_proof_venue_admins", {
    method: "POST", token, headers: { Prefer: "return=representation" },
    body: { venue_id: venueId, invite_email: email.toLowerCase(), role, status: "invited", permissions: {} }
  });
}

export async function updateAdmin(token, id, venueId, patch) {
  return rest(`promo_proof_venue_admins?id=eq.${id}&venue_id=eq.${venueId}`, { method: "PATCH", token, headers: { Prefer: "return=representation" }, body: patch });
}
