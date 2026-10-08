export const CONFIG = Object.freeze({
  siteKey: "truckerspub",
  supabaseUrl: "https://xopcttkrmjvwdddawdaa.supabase.co",
  supabaseAnonKey: "eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6InhvcGN0dGtybWp2d2RkZGF3ZGFhIiwicm9sZSI6ImFub24iLCJpYXQiOjE3NTYxNTQzNjgsImV4cCI6MjA3MTczMDM2OH0.5s1HHvDsDIgWw6TVR3YfhzJC9uEjcVfunRyMa6B7xYY",
  routes: [
    ["/", "Home"],
    ["/about", "About"],
    ["/events", "Events"],
    ["/happy-hour", "Happy Hour"],
    ["/gallery", "Gallery"],
    ["/faq", "FAQ"],
    ["/contact", "Contact"]
  ],
  assets: {
    logo: "/assets/logo.jpg",
    brandPhoto: "/assets/truckers-pub-inc.jpg",
    logoVideo: "/assets/logo-animation.mp4",
    logoPoster: "/assets/logo-poster.jpg",
    hero: "/assets/bar.png",
    about: "/assets/games.png",
    events: "/assets/special-events.png",
    bar: "/assets/bar.png",
    games: "/assets/games.png",
    happyHour: "/assets/happy-hour.webp",
    legacyHero: "/assets/current-main.png"
  }
});

export const FALLBACK_SITE = Object.freeze({
  site_key: "truckerspub",
  display_name: "Truckers Pub Inc.",
  domain: "truckerspubinc.com",
  status: "preview",
  order_provider: "none",
  order_url: null,
  fallback_order_url: null,
  contact_email: "truckerspubinc@gmail.com",
  contact_phone: "(217) 994-9294",
  address_line1: "1707 Avenue of Mid-America Suite C",
  city: "Effingham",
  state: "IL",
  postal_code: "62401",
  timezone: "America/Chicago",
  hours: {
    monday: { bar: "11:00 AM–1:00 AM" },
    tuesday: { bar: "11:00 AM–1:00 AM" },
    wednesday: { bar: "11:00 AM–1:00 AM" },
    thursday: { bar: "11:00 AM–1:00 AM" },
    friday: { bar: "11:00 AM–1:00 AM" },
    saturday: { bar: "11:00 AM–1:00 AM" },
    sunday: { bar: "11:00 AM–1:00 AM" }
  },
  social_links: {
    facebook: "",
    instagram: "",
    tiktok: ""
  },
  brand: { primary: "#d7192d", secondary: "#174f91", ink: "#070a10" },
  content: {
    hero_eyebrow: "DRINKS • GAMES • LIVE ENTERTAINMENT",
    hero_title: "Your off-duty destination.",
    hero_copy: "Full bar, 15 draft beers, pool, darts, video gaming, and a laid-back Effingham atmosphere that feels like your regular stop from the first visit.",
    about_title: "Built for good drinks and better nights.",
    about_copy: "Truckers Pub Inc. has been a favorite neighborhood bar in Effingham, Illinois, since 2013. We welcome locals, travelers, and truck drivers with friendly service, a full bar, packaged liquor, games, and entertainment.",
    private_events_copy: "Planning a tournament, celebration, fundraiser, or live event? Send the details and our management team will follow up."
  },
  settings: { ticketing_mode: "hybrid", promo_proof_enabled: true }
});

// Public events come from the shared venue database. Empty fallbacks avoid publishing
// dates or performers that management has not approved.
export const FALLBACK_EVENTS = [];

export const HIGHLIGHTS = [
  ["beer", "Full Bar & 15 Drafts", "Cold drafts, cocktails, packaged liquor, and plenty of choices for the whole crew."],
  ["target", "Pool & Darts", "Rack a game, throw a round, or watch for tournaments and monthly competitions."],
  ["game", "Video Gaming", "Settle in, play, and enjoy a relaxed neighborhood-bar atmosphere."],
  ["calendar", "Special Events", "Live entertainment, themed nights, tournaments, and venue events managed in one calendar."]
];

export const FAQS = [
  ["What are your hours?", "Truckers Pub is open every day from 11:00 AM to 1:00 AM. Holiday hours may vary, so call ahead for details."],
  ["Do you have pool tables and darts?", "Yes. Truckers Pub has pool tables and dart boards, with tournaments and special game nights announced through the event calendar."],
  ["Do you offer packaged liquor?", "Yes. In addition to the full bar, Truckers Pub offers a selection of packaged liquor. Call for current availability."],
  ["Where are you located?", "We are at 1707 Avenue of Mid-America, Suite C, in Effingham, Illinois—convenient for locals and travelers."],
  ["Can I host an event or tournament?", "Use the contact form with your date, group size, and event idea. Management will follow up about availability and options."],
  ["Do holiday hours change?", "They may. Call (217) 994-9294 for the most current holiday schedule."]
];

