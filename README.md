# PourMap MVP

PourMap is a mobile-first nightlife discovery platform that shows customers who is behind the bar, what is happening at the venue, and where to go tonight.

## Included

- Live map with venue pins and bartender PourPins
- Search and nightlife filters
- Public bartender, venue, and personalized promotion pages
- Bartender signup, profile, avatar styling, and photo uploads
- Venue connection requests and bartender-entered shifts
- Shift check-in/check-out without off-duty location tracking
- Venue promotion library with automatic Promo Proof attribution links
- Personal performance, conversion, revenue, and reward reporting
- Customer follows
- Hangar 18 as the first connected venue

## Data architecture

PourMap uses the existing Black Label Promo Proof Supabase foundation for campaigns, tracking links, conversions, and rewards. PourMap-specific tables handle check-ins, follows, share pages, discovery activity, and customer/bartender profiles.

## Privacy model

Bartenders appear at a venue only through a public shift and/or active shift check-in. PourMap does not expose home locations, background movement, last-seen locations, or off-duty tracking.

Created by Black Label Branding LLC.
