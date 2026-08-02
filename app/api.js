import { CONFIG } from "./config.js";

const JSON_HEADERS = { apikey: CONFIG.supabaseAnonKey, "Content-Type": "application/json" };

function errorMessage(payload, fallback = "The request could not be completed.") {
  if (!payload) return fallback;
  if (typeof payload === "string") return payload;
  return payload.message || payload.msg || payload.error_description || payload.error || fallback;
}

async function parseResponse(response, fallback) {
  const text = await response.text();
  let payload = null;
  try { payload = text ? JSON.parse(text) : null; }
  catch { payload = text || null; }
  if (!response.ok) {
    const error = new Error(errorMessage(payload, fallback || `Request failed (${response.status}).`));
    error.status = response.status;
    error.payload = payload;
    throw error;
  }
  return payload;
}

function headers(token = null, extra = {}) {
  return {
    ...JSON_HEADERS,
    ...(token ? { Authorization: `Bearer ${token}` } : {}),
    ...extra
  };
}

export function readSession() {
  try { return JSON.parse(localStorage.getItem(CONFIG.sessionKey) || "null"); }
  catch { return null; }
}

export function writeSession(session) {
  if (!session) localStorage.removeItem(CONFIG.sessionKey);
  else localStorage.setItem(CONFIG.sessionKey, JSON.stringify(session));
}

function emitAuth() {
  window.dispatchEvent(new CustomEvent("pourmap:authenticated", { detail: readSession() }));
}

export async function rpc(name, body = {}, token = null) {
  const response = await fetch(`${CONFIG.supabaseUrl}/rest/v1/rpc/${name}`, {
    method: "POST",
    headers: headers(token),
    body: JSON.stringify(body)
  });
  return parseResponse(response, `${name} failed.`);
}

export async function signIn(email, password) {
  const response = await fetch(`${CONFIG.supabaseUrl}/auth/v1/token?grant_type=password`, {
    method: "POST",
    headers: JSON_HEADERS,
    body: JSON.stringify({ email: String(email || "").trim().toLowerCase(), password })
  });
  const session = await parseResponse(response, "Email or password was not accepted.");
  writeSession(session);
  emitAuth();
  return session;
}

export async function signUp(email, password, displayName = "") {
  const response = await fetch(`${CONFIG.supabaseUrl}/auth/v1/signup`, {
    method: "POST",
    headers: JSON_HEADERS,
    body: JSON.stringify({
      email: String(email || "").trim().toLowerCase(),
      password,
      data: { display_name: String(displayName || "").trim(), source: "pourmap" }
    })
  });
  const result = await parseResponse(response, "The PourMap account could not be created.");
  if (result?.access_token) {
    writeSession(result);
    emitAuth();
  }
  return result;
}

export async function resetPassword(email) {
  const response = await fetch(`${CONFIG.supabaseUrl}/auth/v1/recover`, {
    method: "POST",
    headers: JSON_HEADERS,
    body: JSON.stringify({ email: String(email || "").trim().toLowerCase() })
  });
  return parseResponse(response, "The reset email could not be sent.");
}

export async function refreshSession(session = readSession()) {
  if (!session?.refresh_token) return null;
  const response = await fetch(`${CONFIG.supabaseUrl}/auth/v1/token?grant_type=refresh_token`, {
    method: "POST",
    headers: JSON_HEADERS,
    body: JSON.stringify({ refresh_token: session.refresh_token })
  });
  if (!response.ok) {
    writeSession(null);
    return null;
  }
  const next = await parseResponse(response);
  writeSession(next);
  return next;
}

export async function currentUser() {
  let session = readSession();
  if (!session?.access_token) return null;
  const expiresAt = Number(session.expires_at || 0) * 1000;
  if (expiresAt && expiresAt < Date.now() + 60_000) session = await refreshSession(session);
  if (!session?.access_token) return null;
  const response = await fetch(`${CONFIG.supabaseUrl}/auth/v1/user`, {
    headers: { apikey: CONFIG.supabaseAnonKey, Authorization: `Bearer ${session.access_token}` }
  });
  if (response.status === 401) {
    session = await refreshSession(session);
    if (!session?.access_token) return null;
    const retry = await fetch(`${CONFIG.supabaseUrl}/auth/v1/user`, {
      headers: { apikey: CONFIG.supabaseAnonKey, Authorization: `Bearer ${session.access_token}` }
    });
    const user = await parseResponse(retry, "Your session expired.");
    const next = { ...session, user };
    writeSession(next);
    return next;
  }
  const user = await parseResponse(response, "Your account could not be loaded.");
  const next = { ...session, user };
  writeSession(next);
  return next;
}

export async function signOut() {
  const session = readSession();
  try {
    if (session?.access_token) {
      await fetch(`${CONFIG.supabaseUrl}/auth/v1/logout`, {
        method: "POST",
        headers: { apikey: CONFIG.supabaseAnonKey, Authorization: `Bearer ${session.access_token}` }
      });
    }
  } finally {
    writeSession(null);
    emitAuth();
  }
}

function visitorState() {
  let visitorKey = localStorage.getItem(CONFIG.visitorKey);
  if (!visitorKey) {
    visitorKey = globalThis.crypto?.randomUUID?.() || `visitor-${Date.now()}-${Math.random().toString(36).slice(2)}`;
    localStorage.setItem(CONFIG.visitorKey, visitorKey);
  }
  let sessionId = sessionStorage.getItem(`${CONFIG.visitorKey}-session`);
  if (!sessionId) {
    sessionId = globalThis.crypto?.randomUUID?.() || `session-${Date.now()}-${Math.random().toString(36).slice(2)}`;
    sessionStorage.setItem(`${CONFIG.visitorKey}-session`, sessionId);
  }
  return { visitorKey, sessionId };
}

export function publicMap({ latitude = null, longitude = null, radiusMiles = CONFIG.defaultRadiusMiles, query = null } = {}) {
  return rpc("pourmap_public_map", {
    p_latitude: latitude,
    p_longitude: longitude,
    p_radius_miles: Math.min(CONFIG.maxRadiusMiles, Math.max(1, Number(radiusMiles || CONFIG.defaultRadiusMiles))),
    p_query: query || null
  });
}

export function publicPromoter(slug) {
  return rpc("pourmap_public_promoter", { p_slug: slug });
}

export function publicVenue(slug) {
  return rpc("pourmap_public_venue", { p_slug: slug });
}

export function publicShare(slug) {
  return rpc("pourmap_public_share", { p_share_slug: slug });
}

export function recordActivity(eventType, options = {}) {
  const { visitorKey, sessionId } = visitorState();
  return rpc("pourmap_record_activity", {
    p_event_type: eventType,
    p_promoter_id: options.promoterId || null,
    p_venue_id: options.venueId || null,
    p_shift_id: options.shiftId || null,
    p_campaign_id: options.campaignId || null,
    p_share_post_id: options.sharePostId || null,
    p_session_id: sessionId,
    p_visitor_key: visitorKey,
    p_source: options.source || document.referrer || "direct",
    p_medium: options.medium || "website",
    p_metadata: { path: location.pathname, ...(options.metadata || {}) }
  }, readSession()?.access_token || null).catch((error) => {
    console.warn("[PourMap] activity record failed", error);
    return { ok: false };
  });
}

export async function toggleFollow(targetType, targetId) {
  const session = await requireSession();
  return rpc("pourmap_toggle_follow", { p_target_type: targetType, p_target_id: targetId }, session.access_token);
}

export async function requireSession() {
  const session = await currentUser();
  if (!session?.access_token) {
    const error = new Error("Sign in required.");
    error.status = 401;
    throw error;
  }
  return session;
}

export async function dashboardBundle() {
  const session = await requireSession();
  return rpc("pourmap_dashboard_bundle", {}, session.access_token);
}

export async function upsertProfile(values) {
  const session = await requireSession();
  return rpc("pourmap_upsert_my_profile", {
    p_display_name: values.displayName,
    p_slug: values.slug || null,
    p_bio: values.bio || null,
    p_headline: values.headline || null,
    p_photo_url: values.photoUrl || null,
    p_social_links: values.socialLinks || {},
    p_tip_links: values.tipLinks || {},
    p_avatar_config: values.avatarConfig || {},
    p_allow_private_booking: Boolean(values.allowPrivateBooking),
    p_home_city: values.homeCity || null,
    p_home_state: values.homeState || null
  }, session.access_token);
}

export async function requestConnection(venueId) {
  const session = await requireSession();
  return rpc("pourmap_request_connection", { p_venue_id: venueId }, session.access_token);
}

export async function createShift({ venueId, startsAt, endsAt, publicNote = "" }) {
  const session = await requireSession();
  return rpc("pourmap_create_shift", {
    p_venue_id: venueId,
    p_starts_at: startsAt,
    p_ends_at: endsAt,
    p_public_note: publicNote || null
  }, session.access_token);
}

export async function startShift(shiftId, latitude = null, longitude = null) {
  const session = await requireSession();
  return rpc("pourmap_start_shift", {
    p_shift_id: shiftId,
    p_latitude: latitude,
    p_longitude: longitude
  }, session.access_token);
}

export async function endShift(shiftId) {
  const session = await requireSession();
  return rpc("pourmap_end_shift", { p_shift_id: shiftId }, session.access_token);
}

export async function createShare({ campaignId, shiftId = null, channel = "direct", customCaption = "", personalPhotoUrl = "" }) {
  const session = await requireSession();
  return rpc("pourmap_create_share", {
    p_campaign_id: campaignId,
    p_shift_id: shiftId || null,
    p_channel: channel,
    p_custom_caption: customCaption || null,
    p_personal_photo_url: personalPhotoUrl || null
  }, session.access_token);
}

export async function uploadProfilePhoto(file) {
  if (!(file instanceof File)) throw new Error("Choose an image file.");
  if (!/^image\/(jpeg|png|webp)$/i.test(file.type)) throw new Error("Use a JPG, PNG, or WebP image.");
  if (file.size > 5 * 1024 * 1024) throw new Error("Profile images must be under 5 MB.");
  const session = await requireSession();
  const extension = (file.name.split(".").pop() || file.type.split("/").pop() || "jpg").toLowerCase().replace(/[^a-z0-9]/g, "");
  const objectPath = `users/${session.user.id}/profile-${Date.now()}.${extension}`;
  const response = await fetch(`${CONFIG.supabaseUrl}/storage/v1/object/${CONFIG.storageBucket}/${objectPath}`, {
    method: "POST",
    headers: {
      apikey: CONFIG.supabaseAnonKey,
      Authorization: `Bearer ${session.access_token}`,
      "Content-Type": file.type,
      "x-upsert": "true"
    },
    body: file
  });
  await parseResponse(response, "The image could not be uploaded.");
  return `${CONFIG.supabaseUrl}/storage/v1/object/public/${CONFIG.storageBucket}/${objectPath}`;
}
