/* Black Label Venue Kit — opt-in OAuth 2.1 public client with PKCE.
 * Register each venue as its own PUBLIC OAuth client in the BLB Supabase project.
 * OAuth client_id is public; never place a client_secret in the browser.
 * Existing local email/password sign-in remains the fallback until configured.
 */
import { CONFIG } from "./config.js";
import { writeSession } from "./supabase.js";

const STORAGE_KEY = "blb-venue-oauth-v1:" + String(CONFIG.siteKey || "unknown");
const CALLBACK_PATH = "/admin";

function oauthClientId() {
  const value = String(CONFIG.oauthClientId || "").trim();
  return /^[a-zA-Z0-9_.:-]{8,160}$/.test(value) ? value : null;
}
export function hasBlackLabelSignIn() { return Boolean(oauthClientId()); }

function base64url(bytes) {
  let str = "";
  for (let i = 0; i < bytes.length; i++) str += String.fromCharCode(bytes[i]);
  return btoa(str).replace(/\+/g, "-").replace(/\//g, "_").replace(/=+$/g, "");
}
function randomString(size = 32) {
  const values = crypto.getRandomValues(new Uint8Array(size));
  return base64url(values);
}
function requireHttps() {
  if (location.protocol !== "https:") throw new Error("Secure HTTPS is required for Black Label sign-in.");
}
function callbackUrl() { return location.origin + CALLBACK_PATH; }
function oauthEndpoint(path) { return String(CONFIG.supabaseUrl || "").replace(/\/+$/, "") + "/auth/v1/oauth/" + path; }

export async function startBlackLabelSignIn() {
  requireHttps();
  const clientId = oauthClientId();
  if (!clientId) throw new Error("Black Label sign-in is not configured for this venue.");
  if (!crypto?.subtle) throw new Error("Secure browser cryptography is unavailable.");
  const verifier = randomString(48);
  const state = randomString(24);
  const digest = await crypto.subtle.digest("SHA-256", new TextEncoder().encode(verifier));
  const challenge = base64url(new Uint8Array(digest));
  sessionStorage.setItem(STORAGE_KEY, JSON.stringify({
    verifier, state, created: Date.now(), callback: callbackUrl(), clientId
  }));
  const params = new URLSearchParams({
    response_type: "code",
    client_id: clientId,
    redirect_uri: callbackUrl(),
    scope: "email profile",
    state,
    code_challenge: challenge,
    code_challenge_method: "S256",
  });
  location.assign(oauthEndpoint("authorize") + "?" + params);
}

export async function completeBlackLabelSignIn() {
  const params = new URLSearchParams(location.search);
  const isCallback = params.has("code") || (params.has("state") && params.has("error"));
  if (!isCallback || location.pathname.replace(/\/$/, "") !== CALLBACK_PATH) return false;
  const raw = sessionStorage.getItem(STORAGE_KEY);
  sessionStorage.removeItem(STORAGE_KEY);
  // Codes and errors must not remain in browser history, logs, or referrers.
  history.replaceState({}, "", CALLBACK_PATH);
  const saved = (() => {try{return JSON.parse(raw || "null")}catch{return null}})();
  const state = params.get("state");
  if (!saved || typeof saved.verifier !== "string" || !state || state !== saved.state
    || Date.now() - saved.created > 10 * 60 * 1000 || saved.callback !== callbackUrl()
    || saved.clientId !== oauthClientId()) {
    throw new Error("Your sign-in expired or could not be verified. Please start again.");
  }
  if (params.has("error")) throw new Error("Black Label sign-in was declined or could not be completed.");
  const code = params.get("code");
  if (!code) throw new Error("Authorization code is missing.");
  const response = await fetch(oauthEndpoint("token"), {
    method: "POST",
    headers: { "Content-Type": "application/x-www-form-urlencoded" },
    body: new URLSearchParams({
      grant_type: "authorization_code",
      client_id: saved.clientId,
      redirect_uri: saved.callback,
      code_verifier: saved.verifier,
      code,
    }),
  });
  if (!response.ok) throw new Error("The identity provider could not complete this sign-in.");
  const tokens = await response.json();
  if (!tokens?.access_token || !tokens?.refresh_token || !Number.isFinite(Number(tokens?.expires_in))) {
    throw new Error("The identity provider returned an incomplete session.");
  }
  // Only save the session obtained by PKCE from our registered identity provider.
  writeSession({
    session_source: "blacklabel_oauth",
    oauth_client_id: saved.clientId,
    access_token: tokens.access_token,
    refresh_token: tokens.refresh_token,
    token_type: "bearer",
    expires_in: Number(tokens.expires_in),
    expires_at: Math.floor(Date.now() / 1000) + Number(tokens.expires_in),
  });
  return true;
}
