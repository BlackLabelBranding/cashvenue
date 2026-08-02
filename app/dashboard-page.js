import {
  createShare, createShift, currentUser, dashboardBundle, endShift, requestConnection,
  resetPassword, signIn, signOut, signUp, startShift, uploadProfilePhoto, upsertProfile
} from "./api.js";
import {
  appRoot, avatarHtml, copyText, escapeHtml, formatDate, formatTimeRange, icon,
  money, route, safeUrl, showToast, statusPill, titleCase
} from "./ui.js";

const dashboardState = { tab: "overview", data: null, session: null, sidebarOpen: false };
const tabs = [
  ["overview", "Overview", "home"],
  ["profile", "My Profile", "user"],
  ["shifts", "My Shifts", "calendar"],
  ["venues", "My Venues", "location"],
  ["promotions", "Promotions", "promo"],
  ["results", "Results & Rewards", "chart"]
];

function values(form) {
  return Object.fromEntries([...new FormData(form).entries()].map(([key, value]) => [key, typeof value === "string" ? value.trim() : value]));
}

function field(label, name, value = "", options = {}) {
  if (options.type === "textarea") return `<div class="field${options.wide ? " field--wide" : ""}"><label>${escapeHtml(label)}</label><textarea name="${escapeHtml(name)}" ${options.required ? "required" : ""}>${escapeHtml(value || "")}</textarea>${options.help ? `<small>${escapeHtml(options.help)}</small>` : ""}</div>`;
  if (options.type === "select") return `<div class="field${options.wide ? " field--wide" : ""}"><label>${escapeHtml(label)}</label><select name="${escapeHtml(name)}" ${options.required ? "required" : ""}>${(options.choices || []).map(([choice, text]) => `<option value="${escapeHtml(choice)}"${String(choice) === String(value) ? " selected" : ""}>${escapeHtml(text)}</option>`).join("")}</select>${options.help ? `<small>${escapeHtml(options.help)}</small>` : ""}</div>`;
  return `<div class="field${options.wide ? " field--wide" : ""}"><label>${escapeHtml(label)}</label><input name="${escapeHtml(name)}" type="${escapeHtml(options.type || "text")}" value="${escapeHtml(value || "")}" ${options.required ? "required" : ""} ${options.placeholder ? `placeholder="${escapeHtml(options.placeholder)}"` : ""} ${options.accept ? `accept="${escapeHtml(options.accept)}"` : ""} />${options.help ? `<small>${escapeHtml(options.help)}</small>` : ""}</div>`;
}

function panel(title, body, action = "") {
  return `<section class="dashboard-panel"><div class="dashboard-panel__head"><h2>${escapeHtml(title)}</h2>${action}</div><div class="dashboard-panel__body">${body}</div></section>`;
}

function metric(label, value) {
  return `<article class="card metric-card"><span>${escapeHtml(label)}</span><strong>${escapeHtml(String(value))}</strong></article>`;
}

function statusMessage(form, message, error = false) {
  const element = form.querySelector(".form-status");
  if (!element) return;
  element.textContent = message;
  element.className = `form-status${error ? " is-error" : " is-success"}`;
}

function authVisual() {
  return `<section class="auth-visual"><div class="boot-logo"><img src="/assets/pourmap-mark.svg" alt="" /><strong>POURMAP</strong></div><div class="auth-visual__pins"><div class="auth-fake-pin">${avatarHtml({ display_name:"Jessica", avatar_config:{ emoji:"🍸",background:"#ff4f9a",accent:"#ffd166" } },"lg")}<span class="status-pill status-pill--live"><span class="live-dot"></span> Pouring now</span></div><div class="auth-fake-pin">${avatarHtml({ display_name:"Mike", avatar_config:{ emoji:"🍺",background:"#22d3ee",accent:"#a7f3d0" } },"lg")}<span class="status-pill status-pill--soon">Starts soon</span></div><div class="auth-fake-pin">${avatarHtml({ display_name:"Ashley", avatar_config:{ emoji:"🥂",background:"#8b5cf6",accent:"#f0abfc" } },"lg")}<span class="status-pill status-pill--tonight">Tonight</span></div></div><div><span class="eyebrow">Tonight has a map</span><h2 style="font-family:var(--display);font-size:2.5rem;margin:.5rem 0">Your shifts become your marketing.</h2><p style="color:var(--muted);line-height:1.6">Post where you are working, grab venue-approved promotions, share tracked links, and see the results.</p></div></section>`;
}

function renderAuth(mode = "login") {
  document.body.classList.remove("map-body");
  const signup = mode === "signup";
  document.title = `${signup ? "Join" : "Sign in to"} PourMap`;
  appRoot.innerHTML = `<main class="auth-page"><div class="auth-card">${authVisual()}<section class="auth-form"><a class="brand" href="/" data-route style="margin-bottom:1.5rem"><img src="/assets/pourmap-mark.svg" alt="" /><strong>POUR<span>MAP</span></strong></a><h1>${signup ? "Build your bartender profile." : "Welcome back."}</h1><p>${signup ? "Core bartender access is free during the PourMap preview." : "Manage your profile, shifts, promotions, and proof."}</p><div class="auth-tabs"><button class="auth-tab${!signup ? " is-active" : ""}" type="button" data-auth-mode="login">Sign in</button><button class="auth-tab${signup ? " is-active" : ""}" type="button" data-auth-mode="signup">Create account</button></div><form class="js-auth-form" data-mode="${signup ? "signup" : "login"}"><div class="stack">${signup ? field("Display name","display_name","",{required:true,placeholder:"Jessica"}) : ""}${field("Email","email","",{type:"email",required:true})}${field("Password","password","",{type:"password",required:true,help:signup ? "Use at least 8 characters." : ""})}<button class="button button--primary" type="submit">${signup ? "Create PourMap account" : "Sign in"} ${icon("arrow")}</button>${!signup ? '<button class="button button--ghost js-reset" type="button">Send password reset</button>' : ""}<a class="button button--ghost" href="/" data-route>${icon("map")} Back to map</a><p class="form-status" role="status"></p></div></form><p style="font-size:.72rem;color:var(--muted-2);line-height:1.5">By continuing, you agree to the <a href="/terms" data-route>terms</a> and <a href="/privacy" data-route>privacy summary</a>.</p></section></div></main>`;
  wireAuth();
}

function wireAuth() {
  document.querySelectorAll("[data-auth-mode]").forEach((button) => button.addEventListener("click", () => route(button.dataset.authMode === "signup" ? "/signup" : "/login")));
  const form = document.querySelector(".js-auth-form");
  form?.addEventListener("submit", async (event) => {
    event.preventDefault();
    const data = values(form);
    const button = form.querySelector("button[type=submit]");
    button.disabled = true;
    statusMessage(form, form.dataset.mode === "signup" ? "Creating your account..." : "Signing in...");
    try {
      if (form.dataset.mode === "signup") {
        const result = await signUp(data.email, data.password, data.display_name);
        if (!result?.access_token) {
          statusMessage(form, "Account created. Check your email to confirm it, then sign in.");
          button.disabled = false;
          return;
        }
      } else await signIn(data.email, data.password);
      const next = new URLSearchParams(location.search).get("next") || "/dashboard";
      route(next.startsWith("/") ? next : "/dashboard");
    } catch (error) {
      statusMessage(form, error.message || "Authentication failed.", true);
      button.disabled = false;
    }
  });
  document.querySelector(".js-reset")?.addEventListener("click", async () => {
    const email = form.email.value.trim();
    if (!email) { statusMessage(form, "Enter your email first.", true); return; }
    try { await resetPassword(email); statusMessage(form, "Password reset sent. Check your email."); }
    catch (error) { statusMessage(form, error.message || "Reset could not be sent.", true); }
  });
}

function onboardingPage(user) {
  const suggested = user?.user_metadata?.display_name || "";
  document.title = "Create your PourMap profile";
  appRoot.innerHTML = `<main class="auth-page"><div class="auth-card">${authVisual()}<section class="auth-form"><span class="eyebrow">One profile · Every venue</span><h1>Create your public identity.</h1><p>This profile follows you when you work at different bars. Venues still control their official events, specials, and offers.</p><form class="js-onboarding"><div class="form-grid">${field("Display name","display_name",suggested,{required:true})}${field("Profile URL","slug",suggested.toLowerCase().replace(/[^a-z0-9]+/g,"-"),{help:"pourmap.com/your-name"})}${field("Headline","headline","",{wide:true,placeholder:"Cocktails, cold beer, and a good reason to stay for one more."})}${field("Home city","home_city","Effingham")}${field("State","home_state","IL")}${field("Short bio","bio","",{type:"textarea",wide:true})}${field("Avatar emoji","emoji","🍸")}${field("Avatar color","background","#ff4f9a",{type:"color"})}</div><div class="button-row" style="margin-top:1rem"><button class="button button--primary" type="submit">Create profile ${icon("arrow")}</button><button class="button button--ghost js-onboarding-signout" type="button">Sign out</button></div><p class="form-status" role="status"></p></form></section></div></main>`;
  const form = document.querySelector(".js-onboarding");
  form.addEventListener("submit", async (event) => {
    event.preventDefault(); const data = values(form); const button = form.querySelector("button[type=submit]"); button.disabled = true; statusMessage(form,"Building your profile...");
    try {
      await upsertProfile({ displayName:data.display_name,slug:data.slug,headline:data.headline,bio:data.bio,homeCity:data.home_city,homeState:data.home_state,avatarConfig:{emoji:data.emoji || "🍸",background:data.background || "#ff4f9a",accent:"#36f1dd"},socialLinks:{},tipLinks:{} });
      route("/dashboard");
    } catch (error) { statusMessage(form,error.message || "Profile could not be created.",true); button.disabled=false; }
  });
  document.querySelector(".js-onboarding-signout").addEventListener("click", async () => { await signOut(); route("/login"); });
}

function overview(data) {
  const p = data.performance || {};
  const upcoming = (data.shifts || []).filter((shift) => new Date(shift.ends_at || shift.starts_at) >= new Date()).slice(0,5);
  return `<div class="dashboard-grid">${metric("Profile views · 30d",p.profile_views_30d || 0)}${metric("Promo clicks · 30d",p.promo_clicks_30d || 0)}${metric("Verified results · 30d",p.verified_conversions_30d || 0)}${metric("Attributed revenue · 30d",money(p.verified_revenue_30d || 0))}</div>${panel("Upcoming Shifts",upcoming.length ? `<div class="stack">${upcoming.map(dashboardShift).join("")}</div>` : '<div class="empty-state"><strong>No upcoming shifts.</strong><span>Add a shift to put yourself on the map.</span></div>', '<button class="button button--primary button--small" data-tab="shifts">Add shift</button>')}${panel("Available Promotions",(data.campaigns || []).length ? `<div class="grid grid-3">${data.campaigns.slice(0,3).map(promotionCard).join("")}</div>` : '<div class="empty-state"><strong>No venue promotions released yet.</strong><span>Connect to a venue and ask management to enable promo access.</span></div>', '<button class="button button--ghost button--small" data-tab="promotions">Open library</button>')}`;
}

function profilePage(data) {
  const p = data.promoter || {};
  const social = p.social_links || {};
  const tips = p.tip_links || {};
  const avatar = p.avatar_config || {};
  return panel("Public Profile",`<form class="js-profile-form"><div style="display:flex;align-items:center;gap:1rem;margin-bottom:1rem">${avatarHtml(p,"xl")}<div><strong style="display:block;font-size:1.2rem">${escapeHtml(p.display_name || "Bartender")}</strong><a href="/bartender/${escapeHtml(p.slug || "")}" target="_blank" style="color:var(--aqua)">pourmap.com/${escapeHtml(p.slug || "")}</a></div></div><div class="admin-form-grid form-grid">${field("Display name","display_name",p.display_name,{required:true})}${field("Profile URL","slug",p.slug,{required:true})}${field("Headline","headline",p.headline || "",{wide:true})}${field("Home city","home_city",p.home_city || "")}${field("State","home_state",p.home_state || "")}${field("Instagram URL","instagram",social.instagram || "",{type:"url"})}${field("Facebook URL","facebook",social.facebook || "",{type:"url"})}${field("TikTok URL","tiktok",social.tiktok || "",{type:"url"})}${field("Cash App / tip URL","cashapp",tips.cashapp || "",{type:"url"})}${field("Venmo / tip URL","venmo",tips.venmo || "",{type:"url"})}${field("Avatar emoji","emoji",avatar.emoji || "🍸")}${field("Avatar color","background",avatar.background || "#ff4f9a",{type:"color"})}${field("Bio","bio",p.bio || "",{type:"textarea",wide:true})}${field("Profile photo","photo_file","",{type:"file",accept:"image/jpeg,image/png,image/webp",wide:true,help:"JPG, PNG, or WebP under 5 MB."})}<input type="hidden" name="photo_url" value="${escapeHtml(p.photo_url || "")}" /><div class="field field--wide"><label><input name="allow_booking" type="checkbox" value="yes" ${p.allow_private_booking ? "checked" : ""} style="width:auto;min-height:auto" /> Allow private bartending inquiries</label></div></div><button class="button button--primary" type="submit">Save Profile</button><p class="form-status" role="status"></p></form>`);
}

function dashboardShift(shift) {
  const live = shift.map_status === "live" || shift.active_checkin;
  return `<article class="shift-card"><div class="shift-date"><span>${escapeHtml(new Intl.DateTimeFormat("en-US",{month:"short"}).format(new Date(shift.starts_at)))}</span><b>${escapeHtml(new Intl.DateTimeFormat("en-US",{day:"numeric"}).format(new Date(shift.starts_at)))}</b></div><div class="shift-card__copy"><strong>${escapeHtml(shift.venue_name || "Venue")}</strong><span>${escapeHtml(formatDate(shift.starts_at,{year:false,time:false}))} · ${escapeHtml(formatTimeRange(shift.starts_at,shift.ends_at))}</span><span>${escapeHtml(shift.public_note || titleCase(shift.approval_status || "submitted"))}</span></div>${statusPill(live ? "live" : shift.approval_status || "tonight")}<div class="dashboard-actions">${live ? `<button class="button button--danger button--small" data-end-shift="${shift.id}">${icon("stop")} End</button>` : `<button class="button button--primary button--small" data-start-shift="${shift.id}">${icon("play")} Start</button>`}</div></article>`;
}

function shiftsPage(data) {
  const venues = data.available_venues || [];
  const form = `<form class="js-shift-form"><div class="form-grid">${field("Venue","venue_id","",{type:"select",required:true,choices:[["","Select venue"],...venues.map((venue)=>[venue.id,`${venue.name} · ${[venue.city,venue.state].filter(Boolean).join(", ")}`])]})}${field("Public note","public_note","",{placeholder:"Behind the bar until close"})}${field("Starts","starts_at","",{type:"datetime-local",required:true})}${field("Ends","ends_at","",{type:"datetime-local",required:true})}</div><button class="button button--primary" type="submit">Add Public Shift</button><p class="form-status" role="status"></p></form>`;
  return `${panel("Add Shift",form)}${panel("My Schedule",(data.shifts || []).length ? `<div class="stack">${data.shifts.map(dashboardShift).join("")}</div>` : '<div class="empty-state"><strong>No shifts posted.</strong><span>Your public schedule starts here.</span></div>')}`;
}

function venuesPage(data) {
  const connections = new Map((data.connections || []).map((item)=>[item.venue.id,item]));
  return panel("Venue Connections",`<div class="grid grid-3">${(data.available_venues || []).map((venue)=>{const connection=connections.get(venue.id);return `<article class="card"><div class="card__body"><span class="eyebrow">${venue.is_verified ? `${icon("verified")} Verified` : "PourMap venue"}</span><h3>${escapeHtml(venue.name)}</h3><p>${escapeHtml([venue.city,venue.state].filter(Boolean).join(", "))}</p>${connection ? `<p>${statusPill(connection.status,`Connection: ${titleCase(connection.status)}`)}</p><p>${connection.promo_access ? "Approved promotions are available." : "Promotion access is waiting on venue approval."}</p>` : ""}<div class="button-row"><a class="button button--ghost button--small" href="/venue/${escapeHtml(venue.slug)}" target="_blank">View venue</a>${!connection ? `<button class="button button--primary button--small" data-connect-venue="${venue.id}">Request connection</button>` : ""}</div></div></article>`;}).join("") || '<div class="empty-state"><strong>No venues are accepting connections yet.</strong></div>'}</div>`);
}

function promotionCard(campaign) {
  const price = campaign.metadata?.price_label || "Venue promotion";
  return `<article class="event-card"><div class="event-card__image" style="background-image:linear-gradient(0deg,rgba(8,11,18,.95),transparent),url('${safeUrl(campaign.hero_image_url || "","")}')"></div><div class="event-card__body"><span class="eyebrow">${escapeHtml(campaign.venue_name || "Venue")}</span><h3>${escapeHtml(campaign.name)}</h3><p>${escapeHtml(formatDate(campaign.starts_at))} · ${escapeHtml(price)}</p><p>${escapeHtml(campaign.description || campaign.default_caption || "Approved venue promotion")}</p><button class="button button--primary button--small" data-build-share="${campaign.id}">${icon("share")} Create my link</button></div></article>`;
}

function promotionsPage(data) {
  const campaigns = data.campaigns || [];
  const shares = data.shares || [];
  return `${panel("Venue Promotion Library",campaigns.length ? `<div class="grid grid-3">${campaigns.map(promotionCard).join("")}</div>` : '<div class="empty-state"><strong>No promotions are available.</strong><span>The venue or Black Label publishes official marketing first.</span></div>')}${panel("My Tracked Shares",shares.length ? `<div class="dashboard-table-wrap"><table class="dashboard-table"><thead><tr><th>Campaign</th><th>Venue</th><th>Channel</th><th>Created</th><th>Link</th></tr></thead><tbody>${shares.map((share)=>`<tr><td>${escapeHtml(share.campaign_name)}</td><td>${escapeHtml(share.venue_name || "")}</td><td>${escapeHtml(titleCase(share.channel))}</td><td>${escapeHtml(formatDate(share.created_at,{time:false}))}</td><td><button class="button button--ghost button--small" data-copy-share="${escapeHtml(`${location.origin}/r/${share.share_slug}`)}">${icon("copy")} Copy</button></td></tr>`).join("")}</tbody></table></div>` : '<div class="empty-state"><strong>No tracked links yet.</strong><span>Create one from an approved promotion.</span></div>')}`;
}

function resultsPage(data) {
  const p = data.performance || {};
  return `<div class="dashboard-grid">${metric("Profile views · 30d",p.profile_views_30d || 0)}${metric("Promo clicks · 30d",p.promo_clicks_30d || 0)}${metric("Verified conversions · 30d",p.verified_conversions_30d || 0)}${metric("Verified revenue · 30d",money(p.verified_revenue_30d || 0))}</div><div class="dashboard-grid" style="margin-top:.8rem">${metric("Approved points",p.approved_points || 0)}${metric("Pending points",p.pending_points || 0)}${metric("Approved cash",money(p.approved_cash || 0))}${metric("Tracking code",data.promoter?.tracking_code || "—")}</div>${panel("What counts as proof",'<div class="grid grid-3"><article class="card"><div class="card__body"><h3>Attention</h3><p>Profile views and valid campaign clicks show reach.</p></div></article><article class="card"><div class="card__body"><h3>Action</h3><p>Guest-list signups, leads, reservations, and ticket activity show intent.</p></div></article><article class="card"><div class="card__body"><h3>Verified results</h3><p>Check-ins, paid tickets, completed bookings, and attributed revenue earn the strongest proof.</p></div></article></div>')}`;
}

function tabContent() {
  const data = dashboardState.data;
  if (dashboardState.tab === "profile") return profilePage(data);
  if (dashboardState.tab === "shifts") return shiftsPage(data);
  if (dashboardState.tab === "venues") return venuesPage(data);
  if (dashboardState.tab === "promotions") return promotionsPage(data);
  if (dashboardState.tab === "results") return resultsPage(data);
  return overview(data);
}

function dashboardShell() {
  const data = dashboardState.data;
  const p = data.promoter || {};
  document.body.classList.remove("map-body");
  document.title = `${tabs.find(([id])=>id===dashboardState.tab)?.[1] || "Dashboard"} | PourMap`;
  appRoot.innerHTML = `<div class="dashboard-shell"><aside class="dashboard-sidebar${dashboardState.sidebarOpen ? " is-open" : ""}"><a class="dashboard-brand" href="/" data-route><img src="/assets/pourmap-mark.svg" alt="" /><strong>POURMAP</strong></a><div class="dashboard-user">${avatarHtml(p)}<div><strong>${escapeHtml(p.display_name || "Bartender")}</strong><span>${escapeHtml(p.tracking_code || "Profile ready")}</span></div></div><nav class="dashboard-nav">${tabs.map(([id,label,glyph])=>`<button type="button" data-tab="${id}" class="${dashboardState.tab===id ? "is-active" : ""}">${icon(glyph)} ${escapeHtml(label)}</button>`).join("")}</nav><div class="dashboard-sidebar__bottom"><a class="button button--ghost button--small" href="/bartender/${escapeHtml(p.slug || "")}" target="_blank">View Public Profile</a><a class="button button--ghost button--small" href="/" data-route>Open Map</a><button class="button button--danger button--small js-signout" type="button">${icon("logout")} Sign out</button></div></aside><main class="dashboard-main"><header class="dashboard-topbar"><div style="display:flex;align-items:center;gap:.7rem"><button class="button button--icon button--ghost dashboard-mobile-menu" type="button">${icon("menu")}</button><div><h1>${escapeHtml(tabs.find(([id])=>id===dashboardState.tab)?.[1] || "Dashboard")}</h1><small style="color:var(--muted)">${escapeHtml(dashboardState.session?.user?.email || "")}</small></div></div><button class="button button--ghost button--small js-refresh" type="button">Refresh</button></header><div class="dashboard-content">${tabContent()}</div></main></div>`;
  wireDashboard();
}

async function reload(message = "") {
  dashboardState.data = await dashboardBundle();
  dashboardShell();
  if (message) showToast(message);
}

function position() {
  return new Promise((resolve) => {
    if (!navigator.geolocation) { resolve({ latitude:null,longitude:null }); return; }
    navigator.geolocation.getCurrentPosition((value)=>resolve({latitude:value.coords.latitude,longitude:value.coords.longitude}),()=>resolve({latitude:null,longitude:null}),{timeout:7000,maximumAge:300000});
  });
}

function wireDashboard() {
  document.querySelectorAll("[data-tab]").forEach((button)=>button.addEventListener("click",()=>{dashboardState.tab=button.dataset.tab;dashboardState.sidebarOpen=false;dashboardShell();scrollTo(0,0);}));
  document.querySelector(".dashboard-mobile-menu")?.addEventListener("click",()=>{dashboardState.sidebarOpen=!dashboardState.sidebarOpen;document.querySelector(".dashboard-sidebar")?.classList.toggle("is-open",dashboardState.sidebarOpen);});
  document.querySelector(".js-refresh")?.addEventListener("click",()=>reload("Dashboard refreshed.").catch((error)=>showToast(error.message,true)));
  document.querySelector(".js-signout")?.addEventListener("click",async()=>{await signOut();route("/login");});

  const profileForm=document.querySelector(".js-profile-form");
  profileForm?.addEventListener("submit",async(event)=>{event.preventDefault();const data=values(profileForm);const button=profileForm.querySelector("button[type=submit]");button.disabled=true;statusMessage(profileForm,"Saving profile...");try{let photoUrl=data.photo_url || "";const file=profileForm.photo_file.files?.[0];if(file)photoUrl=await uploadProfilePhoto(file);await upsertProfile({displayName:data.display_name,slug:data.slug,headline:data.headline,bio:data.bio,photoUrl,homeCity:data.home_city,homeState:data.home_state,socialLinks:{instagram:data.instagram,facebook:data.facebook,tiktok:data.tiktok},tipLinks:{cashapp:data.cashapp,venmo:data.venmo},avatarConfig:{emoji:data.emoji || "🍸",background:data.background || "#ff4f9a",accent:dashboardState.data.promoter?.avatar_config?.accent || "#36f1dd"},allowPrivateBooking:profileForm.allow_booking.checked});await reload("Profile saved.");}catch(error){statusMessage(profileForm,error.message || "Profile could not be saved.",true);button.disabled=false;}});

  const shiftForm=document.querySelector(".js-shift-form");
  shiftForm?.addEventListener("submit",async(event)=>{event.preventDefault();const data=values(shiftForm);const button=shiftForm.querySelector("button[type=submit]");button.disabled=true;statusMessage(shiftForm,"Adding shift...");try{await createShift({venueId:data.venue_id,startsAt:new Date(data.starts_at).toISOString(),endsAt:new Date(data.ends_at).toISOString(),publicNote:data.public_note});await reload("Shift added to your schedule.");}catch(error){statusMessage(shiftForm,error.message || "Shift could not be added.",true);button.disabled=false;}});

  document.querySelectorAll("[data-start-shift]").forEach((button)=>button.addEventListener("click",async()=>{button.disabled=true;try{const where=await position();const result=await startShift(button.dataset.startShift,where.latitude,where.longitude);await reload(result?.is_verified ? "Shift started and venue location verified." : "Shift started. Venue verification is pending.");}catch(error){button.disabled=false;showToast(error.message || "Shift could not be started.",true);}}));
  document.querySelectorAll("[data-end-shift]").forEach((button)=>button.addEventListener("click",async()=>{button.disabled=true;try{await endShift(button.dataset.endShift);await reload("Shift ended and removed from the live map.");}catch(error){button.disabled=false;showToast(error.message || "Shift could not be ended.",true);}}));
  document.querySelectorAll("[data-connect-venue]").forEach((button)=>button.addEventListener("click",async()=>{button.disabled=true;try{await requestConnection(button.dataset.connectVenue);await reload("Venue connection requested.");}catch(error){button.disabled=false;showToast(error.message || "Connection request failed.",true);}}));
  document.querySelectorAll("[data-build-share]").forEach((button)=>button.addEventListener("click",async()=>{const campaign=dashboardState.data.campaigns.find((item)=>item.id===button.dataset.buildShare);const channel=prompt("Channel: direct, facebook, instagram, tiktok, snapchat, sms, email, qr, or print","direct") || "direct";const caption=prompt("Add your personal caption",campaign?.default_caption || `Come see me at ${campaign?.venue_name || "the venue"}!`) || "";button.disabled=true;try{const result=await createShare({campaignId:button.dataset.buildShare,channel:channel.toLowerCase(),customCaption:caption});const link=`${location.origin}/r/${result.share_slug}`;await copyText(link);await reload("Your personalized Promo Proof link was created and copied.");}catch(error){button.disabled=false;showToast(error.message || "Tracked link could not be created.",true);}}));
  document.querySelectorAll("[data-copy-share]").forEach((button)=>button.addEventListener("click",async()=>{await copyText(button.dataset.copyShare);showToast("Tracked link copied.");}));
}

export async function bootDashboard() {
  document.body.classList.remove("map-body");
  appRoot.innerHTML = `<main class="boot-screen"><div class="boot-logo"><img src="/assets/pourmap-mark.svg" alt="" /><strong>POURMAP</strong></div><div class="boot-spinner"></div><p>Loading your bartender portal...</p></main>`;
  const path=location.pathname.replace(/\/$/,"") || "/";
  const session=await currentUser();
  if(!session){renderAuth(path==="/signup" ? "signup" : "login");return;}
  dashboardState.session=session;
  try{
    const data=await dashboardBundle();
    if(data?.needs_profile){onboardingPage(session.user);return;}
    dashboardState.data=data;
    const requested=new URLSearchParams(location.search).get("tab");
    if(tabs.some(([id])=>id===requested))dashboardState.tab=requested;
    dashboardShell();
  }catch(error){
    if(error.status===401){renderAuth("login");return;}
    appRoot.innerHTML=`<main class="auth-page"><div class="card" style="max-width:620px"><div class="card__body"><span class="eyebrow">Dashboard error</span><h1>The bartender portal needs attention.</h1><p>${escapeHtml(error.message || "PourMap data could not be loaded.")}</p><div class="button-row"><button class="button button--primary" onclick="location.reload()">Try again</button><a class="button button--ghost" href="/" data-route>Open map</a></div></div></div></main>`;
  }
}
