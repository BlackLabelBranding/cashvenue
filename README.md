# Truckers Pub venue site

Production: https://truckers-pub-inc.vercel.app/
Management: https://truckers-pub-inc.vercel.app/admin
Payment setup: https://truckers-pub-inc.vercel.app/admin?payments=return

This static site uses the existing Black Label shared ticketing backend, with site key `truckerspub` and venue ID `aafc14e8-eb04-4824-88a5-a3be25add2bf`. Events, ticket inventory, checkout, deposits, balances, refunds, check-in, and payment reporting are scoped to that venue. Stripe onboarding creates an independent connected account; payment credentials remain in the backend.

Truckers Pub's content, branding, assets, artist directory, and inquiry management are retained. Public listings include only scheduled/live event campaigns that have not ended. Empty results are authoritative; service failures show an unavailable message. Promotional campaign destinations are not checkout URLs.

Deploy the root as a static Vercel project with `vercel.json`. No build command is required. Keep the payment-account website origin aligned with the live URL for CORS, Stripe return URLs, and private ticket links. Online sales require completed Stripe onboarding and explicit activation in Payments & Deposits. Configure the shared backend email service before relying on automatic ticket emails.

Verification: browser checks cover public campaign filtering, reserved/sold inventory, sold-out controls, deposit totals, venue-scoped checkout and onboarding, private balance links, login restoration, deposit configuration, scanner controls, and service outage feedback. Financial requests are intercepted during automated checks; no live sale, refund, or Stripe onboarding was initiated for verification.
