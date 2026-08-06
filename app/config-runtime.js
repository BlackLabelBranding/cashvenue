import * as base from "https://cdn.jsdelivr.net/gh/BlackLabelBranding/cashvenue@001cb7e6bc5ad036a0bdeb82884cf354c608c0fe/app/config.js?source=base";

const REAL_LOGO = "https://hangar18pub.com/wp-content/uploads/2023/06/HANGAR-18-redraw-2.png";
const OUTDOOR_VENUE = "https://xopcttkrmjvwdddawdaa.supabase.co/storage/v1/object/public/venue-assets/hangar18/outdoor-venue.webp";

export const CONFIG = Object.freeze({
  ...base.CONFIG,
  assets: Object.freeze({
    ...base.CONFIG.assets,
    logo: REAL_LOGO,
    hero: OUTDOOR_VENUE,
    exterior: OUTDOOR_VENUE,
    interior: OUTDOOR_VENUE,
    beer: OUTDOOR_VENUE,
    beerAlt: OUTDOOR_VENUE,
    pizza: OUTDOOR_VENUE,
    bella: OUTDOOR_VENUE,
    josh: OUTDOOR_VENUE
  })
});

export const FALLBACK_SITE = base.FALLBACK_SITE;
export const FALLBACK_EVENTS = (base.FALLBACK_EVENTS || []).map((event) => ({
  ...event,
  hero_image_url: event.hero_image_url && !String(event.hero_image_url).startsWith('/assets/')
    ? event.hero_image_url
    : OUTDOOR_VENUE
}));
export const MENU = base.MENU;
export const BEERS = base.BEERS;
export const JOBS = base.JOBS;
