import * as base from "https://cdn.jsdelivr.net/gh/BlackLabelBranding/cashvenue@001cb7e6bc5ad036a0bdeb82884cf354c608c0fe/app/supabase.js?source=base";
import { CONFIG } from "./config-runtime.js";

export * from "https://cdn.jsdelivr.net/gh/BlackLabelBranding/cashvenue@001cb7e6bc5ad036a0bdeb82884cf354c608c0fe/app/supabase.js?source=base";

const baseHeaders = {
  apikey: CONFIG.supabaseAnonKey,
  "Content-Type": "application/json"
};

async function parse(response) {
  const text = await response.text();
  let payload = null;
  try { payload = text ? JSON.parse(text) : null; } catch { payload = text; }
  if (!response.ok) {
    const error = new Error(payload?.message || payload?.msg || payload?.error_description || payload?.error || `Request failed (${response.status}).`);
    error.status = response.status;
    error.payload = payload;
    throw error;
  }
  return payload;
}

export async function currentUser(session) {
  let active = session || base.readSession();
  if (!active?.access_token && active?.refresh_token) {
    active = await base.refreshSession(active).catch(() => null);
  }
  if (!active?.access_token) return null;

  if (active.expires_at && active.expires_at * 1000 < Date.now() + 60000) {
    active = await base.refreshSession(active).catch(() => null);
  }
  if (!active?.access_token) return null;

  const response = await fetch(`${CONFIG.supabaseUrl}/auth/v1/user`, {
    headers: { ...baseHeaders, Authorization: `Bearer ${active.access_token}` }
  });

  if (response.status === 401 && active.refresh_token) {
    const refreshed = await base.refreshSession(active).catch(() => null);
    if (refreshed?.access_token) {
      const retry = await fetch(`${CONFIG.supabaseUrl}/auth/v1/user`, {
        headers: { ...baseHeaders, Authorization: `Bearer ${refreshed.access_token}` }
      });
      if (retry.ok) return { user: await parse(retry), session: refreshed };
    }
    base.writeSession(null);
    return null;
  }

  if (response.status === 401) {
    base.writeSession(null);
    return null;
  }

  return { user: await parse(response), session: active };
}
