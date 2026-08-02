# PourMap MVP

PourMap is a mobile-first nightlife discovery platform that answers one question: **who is behind the bar, where are they working, and what is happening there tonight?**

## Working MVP

- Live map with venue pins and stacked bartender PourPins
- Search by bartender, venue, town, or state
- Filters for pouring now, tonight, live music, food, tickets, and verified venues
- Public bartender profiles at `/{slug}` and `/bartender/{slug}`
- Public venue profiles at `/venue/{slug}`
- Share pages at `/r/{slug}`
- Bartender authentication and onboarding
- Profile photo uploads to the public PourMap Supabase bucket
- Venue connection requests
- Bartender-entered shifts with venue-confirmed or self-submitted status
- Start/end shift check-ins without exposing off-duty locations
- Approved venue promotions and automatic Promo Proof tracking links
- Personal results for profile views, clicks, conversions, revenue, points, and cash rewards
- Consumer follows for venues and bartenders

## Architecture

- Static HTML/CSS/JavaScript application deployed on Vercel
- Leaflet + OpenStreetMap for the discovery map
- Supabase authentication, storage, database, RPCs, and row-level security
- Existing Black Label Promo Proof module for campaigns, tracking, conversions, and rewards
- Hangar 18 is the first connected venue and provides preview data for launch testing

## Privacy model

PourMap is a shift map, not a people-tracking map. Bartenders appear at a venue tied to a public shift. It does not publish home locations, off-duty movement, travel routes, or background GPS history.

## Branch isolation

This build is maintained on the `pourmap-mvp` branch while a dedicated PourMap repository and production domain are prepared. Do not merge it into the CashVenue main branch.

## Local validation

```bash
find app -type f -name '*.js' -print0 | xargs -0 -n1 node --check
python -m json.tool manifest.webmanifest >/dev/null
python -m json.tool vercel.json >/dev/null
python -m http.server 8080
```

Built by Black Label Branding LLC.
