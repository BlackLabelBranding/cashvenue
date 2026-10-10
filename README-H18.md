# Hangar 18 Website

This branch contains the mobile-first Hangar 18 venue website and venue-branded management portal.

## Public website

- Home, About, Food Menu, Craft Beer, Events, Event Detail, Private Events, Jobs, and Contact
- Responsive navigation and persistent mobile actions
- Online-ordering button with a configurable Toast URL and current ChowNow fallback
- Event pages with external ticket checkout, native free/paid ticket reservations, ticket-request fallback, and QR confirmation
- Private-event, job, contact, reservation, and newsletter submissions
- Footer attribution: **Created by Black Label Branding LLC**

## Venue management

`/admin` is branded as **Hangar 18 Management**. Venue users do not see Black Label Hub branding.

The portal manages:

- Website contact details, hours, content, and online-ordering link
- Venue-owned daily campaigns and events
- Ticket types, pricing, capacity, and status
- Website inquiries
- Ticket orders, manual payment confirmation, and door check-in
- Venue management invitations and roles
- Bartender/promoter attribution, conversions, revenue, and rewards

## Promo Proof connection

The site’s only shared business-data integration is the Promo Proof module in the Black Label Supabase project. Public data uses restricted database functions. Administrative access uses Supabase authentication and row-level security.

Promo Proof handles:

- Venue tenant configuration
- Campaigns and event assets
- Bartender/promoter tracking links
- Tracking events and conversions
- Ticket types, orders, and check-ins
- Reward programs and ledger entries
- Venue website forms and management access

## Deployment

This is a dependency-free static application configured for Vercel. Import the `h18brewing-site` branch with the repository root set to `/`.

Before production DNS cutover:

1. Replace the fallback ordering URL with Hangar 18’s exact Toast storefront URL.
2. Confirm native paid-ticket payment handling or use an approved external ticket checkout.
3. Invite venue managers using emails that match their Supabase login accounts.
4. Review event dates, pricing, and content in `/admin`.
5. Attach `h18brewing.com` and `www.h18brewing.com` to the Vercel project after approval.

Created by Black Label Branding LLC.
