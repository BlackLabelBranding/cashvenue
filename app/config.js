export const CONFIG = Object.freeze({
  siteKey: "hangar18",
  supabaseUrl: "https://xopcttkrmjvwdddawdaa.supabase.co",
  supabaseAnonKey: "eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6InhvcGN0dGtybWp2d2RkZGF3ZGFhIiwicm9sZSI6ImFub24iLCJpYXQiOjE3NTYxNTQzNjgsImV4cCI6MjA3MTczMDM2OH0.5s1HHvDsDIgWw6TVR3YfhzJC9uEjcVfunRyMa6B7xYY",
  routes: [
    ["/", "Home"],
    ["/about-us", "About"],
    ["/menu", "Menu"],
    ["/beer", "Beer"],
    ["/events", "Events"],
    ["/private-events", "Private Events"],
    ["/jobs", "Jobs"],
    ["/contact", "Contact"]
  ],
  assets: {
    logo: "/assets/logo.png",
    hero: "/assets/hero.jpg",
    exterior: "/assets/hero.jpg",
    pizza: "/assets/pizza.jpg",
    interior: "/assets/venue.jpg",
    beer: "/assets/venue.jpg",
    beerAlt: "/assets/hero.jpg",
    bella: "/assets/bella.png",
    josh: "/assets/josh-holland.png"
  }
});

export const FALLBACK_SITE = Object.freeze({
  site_key: "hangar18",
  display_name: "Hangar 18",
  domain: "h18brewing.com",
  status: "preview",
  order_provider: "chownow",
  order_url: "https://order.chownow.com/order/24977/locations/36908",
  fallback_order_url: "https://order.chownow.com/order/24977/locations/36908",
  contact_email: "management@hangar18.org",
  contact_phone: "(217) 500-1965",
  address_line1: "1112 Maine St",
  city: "Windsor",
  state: "IL",
  postal_code: "61957",
  timezone: "America/Chicago",
  hours: {
    monday: { kitchen: "11:00 AM–9:00 PM", bar: "11:00 AM–9:00 PM" },
    tuesday: { closed: true },
    wednesday: { kitchen: "11:00 AM–9:00 PM", bar: "11:00 AM–9:00 PM" },
    thursday: { kitchen: "11:00 AM–9:00 PM", bar: "11:00 AM–9:00 PM" },
    friday: { kitchen: "11:00 AM–9:00 PM", bar: "11:00 AM–11:00 PM" },
    saturday: { kitchen: "11:00 AM–9:00 PM", bar: "11:00 AM–11:00 PM" },
    sunday: { kitchen: "12:00 PM–8:00 PM", bar: "12:00 PM–8:00 PM" }
  },
  social_links: {
    facebook: "https://www.facebook.com/hangar18.il",
    instagram: "https://www.instagram.com/hangar_18_brewery/",
    tiktok: "https://www.tiktok.com/@hangar.18.brewery"
  },
  brand: { primary: "#b51018", secondary: "#fff23c", ink: "#080808" },
  content: {
    hero_eyebrow: "CRAFT BREWS • BOLD FOOD • LIVE MUSIC",
    hero_title: "Where great times take flight.",
    hero_copy: "Craft beer, loaded pizzas, live entertainment, and a one-of-a-kind outdoor venue in Windsor, Illinois.",
    about_title: "Welcome to Hangar 18",
    about_copy: "Hangar 18 blends a laid-back hometown atmosphere with handcrafted brews, crowd-pleasing food, and live entertainment. Come for dinner, stay for the show, and make a night of it.",
    private_events_copy: "Bring your celebration, fundraiser, company gathering, or private party to Hangar 18. Tell us what you are planning and our team will help you build it."
  },
  settings: { toast_ready: true, toast_order_url: null, ticketing_mode: "hybrid", promo_proof_enabled: true }
});

export const FALLBACK_EVENTS = [
  { name: "Emberline", slug: "hangar-18-emberline", description: "High-energy modern country and 90’s rock.", status: "live", starts_at: "2026-08-02T01:00:00Z", ends_at: "2026-08-02T04:00:00Z", hero_image_url: CONFIG.assets.interior, metadata: { public_slug: "emberline", price_label: "Free", ticketing_mode: "door" } },
  { name: "Josh Holland", slug: "hangar-18-josh-holland-2", description: "A full night of live country music at Hangar 18.", status: "scheduled", starts_at: "2026-08-09T01:00:00Z", ends_at: "2026-08-09T04:00:00Z", hero_image_url: CONFIG.assets.josh, metadata: { public_slug: "josh-holland-2", price_label: "$10–$200", special_guest: "Matt Poss", tickets_remaining: 86, ticketing_mode: "external" } },
  { name: "Fuedin’ Hillbillys", slug: "hangar-18-fuedin-hillbillys", description: "Live music under the lights at Hangar 18.", status: "scheduled", starts_at: "2026-08-15T02:00:00Z", ends_at: "2026-08-15T05:00:00Z", hero_image_url: CONFIG.assets.exterior, metadata: { public_slug: "fuedin-hillbillys", price_label: "$15–$35" } },
  { name: "Identity Crisis", slug: "hangar-18-identity-crisis", description: "Live music at Hangar 18.", status: "scheduled", starts_at: "2026-08-16T02:00:00Z", ends_at: "2026-08-16T05:00:00Z", hero_image_url: CONFIG.assets.interior, metadata: { public_slug: "identity-crisis", price_label: "$5" } },
  { name: "1973 — A Tribute to Journey", slug: "hangar-18-1973-a-tribute-to-journey-2", description: "A tribute to Journey live at Hangar 18.", status: "scheduled", starts_at: "2026-08-23T01:00:00Z", ends_at: "2026-08-23T04:00:00Z", hero_image_url: CONFIG.assets.exterior, metadata: { public_slug: "1973-a-tribute-to-journey-2", price_label: "$15–$250", tickets_remaining: 80 } },
  { name: "The Wandering Horses", slug: "hangar-18-the-wandering-horses", description: "An evening of live music featuring The Wandering Horses.", status: "scheduled", starts_at: "2026-08-29T23:30:00Z", ends_at: "2026-08-30T04:00:00Z", hero_image_url: CONFIG.assets.exterior, metadata: { public_slug: "the-wandering-horses", special_guest: "Absent Ground • 6:30–8:00 PM", ticketing_mode: "door" } }
];

export const MENU = [
  { category: "Specialty Pizzas", items: [
    ["Three Little Pigs", "Pepperoni, sausage, bacon, mozzarella, and house red sauce.", "$18"],
    ["Meat Hangar", "Pepperoni, sausage, bacon, ham, beef, mozzarella, and red sauce.", "$20"],
    ["Buffalo Chicken", "Chicken, buffalo sauce, ranch, mozzarella, and green onion.", "$18"],
    ["BBQ Chicken", "Chicken, barbecue sauce, red onion, bacon, and mozzarella.", "$18"],
    ["Supreme", "Pepperoni, sausage, mushroom, onion, green pepper, olive, and mozzarella.", "$19"],
    ["Build Your Own", "Start with cheese and add your favorite meats and vegetables.", "From $14"]
  ]},
  { category: "Wings & Shareables", items: [
    ["Traditional Wings", "Crispy wings tossed in your choice of sauce.", "$12"],
    ["Boneless Wings", "Hand-breaded chicken with your choice of sauce.", "$11"],
    ["Loaded Nachos", "Tortilla chips, queso, meat, vegetables, and house toppings.", "$13"],
    ["Pretzel Bites", "Warm pretzel bites with beer cheese.", "$9"],
    ["Mozzarella Sticks", "Breaded mozzarella with marinara.", "$9"],
    ["Fried Pickles", "Crispy pickle chips with ranch.", "$8"]
  ]},
  { category: "Sandwiches & Baskets", items: [
    ["Hangar Burger", "Seasoned beef, cheese, lettuce, tomato, onion, and house sauce.", "$13"],
    ["Chicken Bacon Ranch", "Chicken, bacon, ranch, lettuce, tomato, and cheese.", "$13"],
    ["Pulled Pork", "Slow-cooked pork, barbecue sauce, and slaw.", "$12"],
    ["Chicken Strip Basket", "Crispy chicken strips with fries and dipping sauce.", "$12"],
    ["Fish Basket", "Golden fish, fries, slaw, and tartar sauce.", "$13"]
  ]},
  { category: "Salads & Lighter Fare", items: [
    ["House Salad", "Greens, tomato, cucumber, onion, cheese, and croutons.", "$9"],
    ["Chicken Salad", "House salad topped with grilled or crispy chicken.", "$13"],
    ["Caesar Salad", "Romaine, parmesan, croutons, and Caesar dressing.", "$10"]
  ]}
];

export const BEERS = [
  ["Hangar Lager", "Crisp, clean, and built for a long night at the bar.", "4.7%", "Lager"],
  ["Citra Flight", "Bright citrus aroma, soft bitterness, and a clean finish.", "6.2%", "IPA"],
  ["Runway Amber", "Caramel malt, toasted bread, and a smooth finish.", "5.4%", "Amber Ale"],
  ["Night Mission", "Roasted malt, cocoa, and coffee character.", "6.0%", "Stout"],
  ["Radar Wheat", "Light-bodied wheat beer with a fresh citrus lift.", "5.0%", "Wheat"],
  ["Seasonal Rotation", "Ask the bar what just landed on tap.", "Varies", "Limited"]
];

export const JOBS = [
  ["Bartender", "Fast, accurate service; responsible alcohol service; strong guest connection."],
  ["Server", "Own the table, communicate clearly, and keep the room moving."],
  ["Kitchen Crew", "Consistent prep, clean execution, and calm performance under pressure."],
  ["Event & Door Crew", "Guest check-in, ticket scanning, crowd flow, and event support."]
];
