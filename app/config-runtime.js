import * as base from "https://cdn.jsdelivr.net/gh/BlackLabelBranding/cashvenue@001cb7e6bc5ad036a0bdeb82884cf354c608c0fe/app/config.js?source=base";

const ASSET_BASE = "https://cdn.jsdelivr.net/gh/BlackLabelBranding/cashvenue@001cb7e6bc5ad036a0bdeb82884cf354c608c0fe/assets";
const asset = (name) => `${ASSET_BASE}/${name}`;

export const CONFIG = Object.freeze({
  ...base.CONFIG,
  assets: Object.freeze({
    ...base.CONFIG.assets,
    logo: asset("logo.png"),
    hero: asset("hero.jpg"),
    exterior: asset("hero.jpg"),
    pizza: asset("pizza.jpg"),
    interior: asset("venue.jpg"),
    beer: asset("venue.jpg"),
    beerAlt: asset("hero.jpg"),
    bella: asset("bella.png"),
    josh: asset("josh-holland.png")
  })
});

export const FALLBACK_SITE = base.FALLBACK_SITE;
export const FALLBACK_EVENTS = (base.FALLBACK_EVENTS || []).map((event) => ({
  ...event,
  hero_image_url: typeof event.hero_image_url === "string" && event.hero_image_url.startsWith("/assets/")
    ? `${ASSET_BASE}/${event.hero_image_url.split("/").pop()}`
    : event.hero_image_url
}));
export const MENU = base.MENU;
export const BEERS = base.BEERS;
export const JOBS = base.JOBS;
