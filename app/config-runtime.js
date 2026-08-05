import * as base from "https://cdn.jsdelivr.net/gh/BlackLabelBranding/cashvenue@001cb7e6bc5ad036a0bdeb82884cf354c608c0fe/app/config.js?source=base";

const REAL_LOGO = "https://hangar18pub.com/wp-content/uploads/2023/06/HANGAR-18-redraw-2.png";

export const CONFIG = Object.freeze({
  ...base.CONFIG,
  assets: Object.freeze({
    ...base.CONFIG.assets,
    logo: REAL_LOGO
  })
});

export const FALLBACK_SITE = base.FALLBACK_SITE;
export const FALLBACK_EVENTS = base.FALLBACK_EVENTS;
export const MENU = base.MENU;
export const BEERS = base.BEERS;
export const JOBS = base.JOBS;
