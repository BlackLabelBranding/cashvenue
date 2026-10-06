// The venue database is the only source of public event listings.
export function eventHasEnded(event, now = Date.now()) {
  const start = Date.parse(event.starts_at);
  const end = Date.parse(event.ends_at);
  return Number.isFinite(end) ? end <= now : Number.isFinite(start) && start + 6 * 60 * 60 * 1000 <= now;
}

export function upcomingEvents(events, now = Date.now()) {
  return (Array.isArray(events) ? events : [])
    .filter(event => ["scheduled", "live"].includes(event.status) && Number.isFinite(Date.parse(event.starts_at)) && !eventHasEnded(event, now))
    .sort((a, b) => Date.parse(a.starts_at) - Date.parse(b.starts_at));
}

export function externalTicketUrl(event, ticket, origin) {
  // Campaign destinations are promotional links, never checkout instructions.
  const candidate = ticket?.external_purchase_url || event?.metadata?.external_ticket_url;
  if (!candidate) return "";
  try {
    const url = new URL(candidate);
    if (url.protocol !== "https:" || url.origin === origin) return "";
    const legacyVenue = ["h18brewing.com", "www.h18brewing.com"].includes(url.hostname);
    if (legacyVenue) return "";
    return url.href;
  } catch { return ""; }
}
