export const CONFIG = Object.freeze({
  name: "PourMap",
  tagline: "See who's pouring near you.",
  supabaseUrl: "https://xopcttkrmjvwdddawdaa.supabase.co",
  supabaseAnonKey: "eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6InhvcGN0dGtybWp2d2RkZGF3ZGFhIiwicm9sZSI6ImFub24iLCJpYXQiOjE3NTYxNTQzNjgsImV4cCI6MjA3MTczMDM2OH0.5s1HHvDsDIgWw6TVR3YfhzJC9uEjcVfunRyMa6B7xYY",
  defaultCenter: [39.4405, -88.5947],
  defaultZoom: 11,
  defaultRadiusMiles: 75,
  maxRadiusMiles: 500,
  storageBucket: "pourmap-public",
  sessionKey: "pourmap-session-v1",
  visitorKey: "pourmap-visitor-v1",
  reservedRoutes: new Set([
    "about", "account", "bartender", "dashboard", "following", "help", "login",
    "map", "privacy", "r", "saved", "signup", "terms", "venue"
  ])
});
