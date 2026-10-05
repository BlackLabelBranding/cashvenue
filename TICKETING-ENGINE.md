# Hangar 18 native ticketing

Companion to the BlackLabelBranding/BLBDashboard shared-ticketing engine branch. Deploy its reviewed migration and both Edge Functions first. This site adds hosted checkout, deposit selection, private `/ticket` pages, locally rendered QR codes, Payments & Deposits admin controls and door scanning. All amounts, payments, inventory and venue access are checked on the server. Venue owners connect their own Stripe account and bank details; Black Label fees default to zero.

This branch has not been deployed. Current production imports immutable GitHub CDN module revisions; update that revision during the approved deployment or deploy the complete static branch. A branch push alone does not update production.

Payment secrets belong only in Supabase Edge Function secrets. The existing browser configuration contains a public Supabase anon key. Venue account onboarding and server webhook setup are required before paid sales are enabled. Email needs a verified sender. Test full payment, deposit/balance, refunds and door admission in Stripe test mode before live payments.

`app/vendor/qrcode.js` is bundled from MIT-licensed `qrcode@1.5.4` with `esbuild@0.25.12`, using its browser entrypoint and `--bundle --format=esm --platform=browser --minify`; the license is included alongside it. No remote QR service receives ticket tokens.

The standalone config uses the same real logo and venue photograph as the current production runtime overlay; the older checked-in image files contain downloaded HTML rather than usable images.
