import { CONFIG } from "./config.js";
import { loadAdminData, readSession, rpc } from "./supabase.js";
import { escapeHtml, showToast } from "./ui.js";

const VERSION = "artist-directory-event-builder-v1";
const state = {
  context: null,
  artists: [],
  selectedArtist: null,
  loading: false,
  queued: false
};

const entertainmentTypes = [
  "Band",
  "Solo Artist",
  "Duo",
  "DJ",
  "Tribute Act",
  "Comedian",
  "Host / MC",
  "Misc Entertainment"
];

function slugify(value = "") {
  return String(value)
    .toLowerCase()
    .trim()
    .replace(/[’']/g, "")
    .replace(/[^a-z0-9]+/g, "-")
    .replace(/^-+|-+$/g, "")
    .slice(0, 80);
}

function normalize(value = "") {
  return String(value)
    .toLowerCase()
    .trim()
    .replace(/[’']/g, "")
    .replace(/[^a-z0-9]+/g, " ")
    .replace(/\s+/g, " ");
}

function safeFileName(value = "artist") {
  return slugify(value) || "artist";
}

function session() {
  return readSession?.() || null;
}

function addStyles() {
  if (document.querySelector("#artist-event-enhancement-styles")) return;
  const style = document.createElement("style");
  style.id = "artist-event-enhancement-styles";
  style.textContent = `
    .artist-builder { display:grid; gap:1rem; }
    .artist-builder__section { border:1px solid var(--admin-line,#2b2e35); border-radius:14px; background:rgba(255,255,255,.02); overflow:hidden; }
    .artist-builder__section-head { display:flex; align-items:flex-start; justify-content:space-between; gap:1rem; padding:1rem 1.1rem; border-bottom:1px solid var(--admin-line,#2b2e35); }
    .artist-builder__section-head h3 { margin:0; font-size:1.05rem; }
    .artist-builder__section-head p { margin:.25rem 0 0; color:#969ca8; font-size:.78rem; line-height:1.5; }
    .artist-builder__body { padding:1.1rem; }
    .artist-directory-tools { display:grid; grid-template-columns:minmax(220px,.8fr) minmax(260px,1.2fr); gap:.75rem; align-items:end; }
    .artist-card { margin-top:1rem; display:grid; grid-template-columns:96px 1fr; gap:1rem; align-items:center; border:1px solid #353942; border-radius:13px; padding:.85rem; background:#111318; }
    .artist-card__media { width:96px; height:82px; border-radius:10px; overflow:hidden; background:#090a0d; display:grid; place-items:center; color:#747b87; text-align:center; font-size:.7rem; }
    .artist-card__media img { width:100%; height:100%; object-fit:cover; display:block; }
    .artist-card__body h4 { margin:0 0 .25rem; font-size:1.05rem; }
    .artist-card__body p { margin:.18rem 0; color:#aeb4bf; font-size:.78rem; }
    .artist-card__actions { display:flex; gap:.45rem; flex-wrap:wrap; margin-top:.65rem; }
    .artist-directory-note { margin:.75rem 0 0; color:#9096a3; font-size:.75rem; line-height:1.5; }
    .artist-new-panel { margin-top:1rem; border:1px dashed #414650; border-radius:13px; padding:1rem; background:rgba(255,255,255,.018); }
    .artist-match-box { margin-top:.75rem; display:grid; gap:.45rem; }
    .artist-match { display:flex; align-items:center; justify-content:space-between; gap:.75rem; padding:.7rem .8rem; border:1px solid #30343c; border-radius:10px; background:#0e1015; }
    .artist-match strong { display:block; }
    .artist-match span { color:#8f96a3; font-size:.72rem; }
    .artist-image-preview { margin-top:.65rem; min-height:110px; border:1px dashed #3b4049; border-radius:12px; display:grid; place-items:center; overflow:hidden; background:#0b0d11; color:#858c99; text-align:center; padding:.6rem; }
    .artist-image-preview img { display:block; width:100%; max-height:260px; object-fit:contain; border-radius:8px; }
    .artist-builder__status { min-height:1.4rem; margin:.8rem 0 0; color:#d6d9df; font-size:.8rem; }
    .artist-builder__status.is-error { color:#ff7d85; }
    .artist-builder__status.is-success { color:#75e09e; }
    .artist-auto-label { display:inline-flex; align-items:center; gap:.35rem; border:1px solid rgba(255,237,69,.35); background:rgba(255,237,69,.08); color:#ffed45; border-radius:999px; padding:.25rem .55rem; font-size:.68rem; font-weight:800; text-transform:uppercase; letter-spacing:.04em; }
    .artist-event-submit { display:flex; justify-content:flex-end; gap:.6rem; flex-wrap:wrap; }
    @media (max-width:800px) {
      .artist-directory-tools { grid-template-columns:1fr; }
      .artist-card { grid-template-columns:72px 1fr; }
      .artist-card__media { width:72px; height:72px; }
    }
  `;
  document.head.appendChild(style);
}

async function getContext(force = false) {
  const auth = session();
  if (!auth?.access_token) throw new Error("Your venue session has expired. Sign in again.");
  if (!force && state.context) return state.context;
  const data = await loadAdminData(auth.access_token);
  state.context = { auth, data, venueId: data.venueId, site: data.site };
  return state.context;
}

async function searchArtists(query = "", limit = 100) {
  const context = await getContext();
  const rows = await rpc("promo_proof_artist_search", {
    p_query: query || null,
    p_limit: limit
  }, context.auth.access_token);
  return Array.isArray(rows) ? rows : [];
}

async function loadDirectory(force = false) {
  if (!force && state.artists.length) return state.artists;
  state.artists = await searchArtists("", 100);
  return state.artists;
}

function artistOptionLabel(artist) {
  const detail = [artist.genre, artist.hometown].filter(Boolean).join(" - ");
  return detail ? `${artist.artist_name} (${detail})` : artist.artist_name;
}

function optionMarkup(artists, selectedId = "") {
  return [
    `<option value="">No performer / general venue event</option>`,
    ...artists.map((artist) => `<option value="${escapeHtml(artist.artist_id)}"${artist.artist_id === selectedId ? " selected" : ""}>${escapeHtml(artistOptionLabel(artist))}</option>`)
  ].join("");
}

function selectedArtistMarkup(artist) {
  if (!artist) {
    return `<div class="artist-card" data-artist-preview>
      <div class="artist-card__media">No artist selected</div>
      <div class="artist-card__body"><h4>General venue event</h4><p>The venue image will be used unless event artwork is uploaded.</p></div>
    </div>`;
  }
  const detail = [artist.entertainment_type, artist.genre, artist.hometown].filter(Boolean).join(" | ");
  return `<div class="artist-card" data-artist-preview>
    <div class="artist-card__media">${artist.image_url ? `<img src="${escapeHtml(artist.image_url)}" alt="${escapeHtml(artist.artist_name)}" />` : "No directory photo"}</div>
    <div class="artist-card__body">
      <span class="artist-auto-label">Shared artist directory</span>
      <h4>${escapeHtml(artist.artist_name)}</h4>
      <p>${escapeHtml(detail || "Performer profile")}</p>
      <p>${artist.image_url ? "This image will automatically become the event image unless an event-specific image is uploaded." : "No shared photo is stored yet. Upload one below and it will become available to every connected venue website."}</p>
      <div class="artist-card__actions">
        <button class="button button--small button--ghost" type="button" data-clear-artist>Clear selection</button>
      </div>
    </div>
  </div>`;
}

function formMarkup(context, artists) {
  const venueName = context.site?.display_name || "this venue";
  return `<form class="js-event-form artist-builder" data-artist-event-enhanced="${VERSION}">
    <section class="artist-builder__section">
      <div class="artist-builder__section-head">
        <div><h3>1. Select the performer from the shared directory</h3><p>Choosing a performer links the event to the Black Label artist record. Photos and profile data can then flow to this venue website and future connected venue websites.</p></div>
        <span class="artist-auto-label">Reusable data</span>
      </div>
      <div class="artist-builder__body">
        <div class="artist-directory-tools">
          <div class="field"><label>Filter the directory</label><input type="search" data-artist-filter placeholder="Search band, artist, DJ, genre, or hometown" /></div>
          <div class="field"><label>Performer / headliner</label><select name="artist_id" data-artist-select>${optionMarkup(artists)}</select></div>
        </div>
        <div data-artist-selected>${selectedArtistMarkup(null)}</div>
        <p class="artist-directory-note">Artist photos are inherited automatically. Event artwork remains optional and overrides the shared artist photo only for this event.</p>
        <div class="button-row" style="margin-top:.8rem"><button class="button button--small button--ghost" type="button" data-toggle-new-artist>Artist not listed? Add to directory</button></div>
        <div class="artist-new-panel" data-new-artist-panel hidden>
          <h4 style="margin-top:0">Add a new performer</h4>
          <p class="copy">The system checks for an existing match before creating a new record.</p>
          <div class="admin-form-grid">
            <div class="field"><label>Performer name</label><input name="new_artist_name" data-new-artist-name /></div>
            <div class="field"><label>Type</label><select name="new_artist_type">${entertainmentTypes.map((type) => `<option value="${escapeHtml(type)}">${escapeHtml(type)}</option>`).join("")}</select></div>
            <div class="field"><label>Genre</label><input name="new_artist_genre" placeholder="Country, rock, DJ, comedy..." /></div>
            <div class="field"><label>Hometown</label><input name="new_artist_hometown" placeholder="City, State" /></div>
            <div class="field field--wide"><label>Short artist bio</label><textarea name="new_artist_bio" rows="3"></textarea></div>
            <div class="field field--wide"><label>Shared artist photo</label><input name="new_artist_photo" type="file" accept="image/jpeg,image/png,image/webp,image/gif" /><small>This photo becomes reusable anywhere this artist is selected.</small><div class="artist-image-preview" data-new-artist-photo-preview>No photo selected</div></div>
          </div>
          <div class="artist-match-box" data-artist-matches></div>
        </div>
        <div data-existing-photo-upload hidden>
          <div class="field field--wide" style="margin-top:1rem"><label>Add a missing shared artist photo</label><input name="existing_artist_photo" type="file" accept="image/jpeg,image/png,image/webp,image/gif" /><small>This updates the artist directory, not only this event.</small><div class="artist-image-preview" data-existing-photo-preview>No photo selected</div></div>
        </div>
      </div>
    </section>

    <section class="artist-builder__section">
      <div class="artist-builder__section-head"><div><h3>2. Event details</h3><p>Selecting a performer can prefill the event name, description, caption, and image source. Everything remains editable.</p></div></div>
      <div class="artist-builder__body">
        <div class="admin-form-grid">
          <div class="field"><label>Event name</label><input name="name" data-event-name required /></div>
          <div class="field"><label>Status</label><select name="status"><option value="draft">Draft</option><option value="scheduled">Published / Scheduled</option><option value="live">Live now</option></select></div>
          <div class="field"><label>Starts</label><input name="starts_at" type="datetime-local" required /></div>
          <div class="field"><label>Ends</label><input name="ends_at" type="datetime-local" /></div>
          <div class="field field--wide"><label>Description</label><textarea name="description" data-event-description rows="4"></textarea></div>
          <div class="field"><label>Price label</label><input name="price_label" placeholder="$10, Free, $10-$25" /></div>
          <div class="field"><label>Special guest / support text</label><input name="special_guest" /></div>
          <div class="field"><label>Ticketing mode</label><select name="ticketing_mode"><option value="native">Native tickets</option><option value="external">External ticket link</option><option value="door">Pay / enter at door</option></select></div>
          <div class="field"><label>External ticket URL</label><input name="external_ticket_url" type="url" /></div>
          <div class="field field--wide"><label>Approved promotional caption</label><textarea name="default_caption" data-event-caption rows="3"></textarea></div>
          <div class="field field--wide"><label>Event-specific artwork override</label><input name="event_image" type="file" accept="image/jpeg,image/png,image/webp,image/gif" /><small>Leave blank to use the selected artist photo automatically.</small><div class="artist-image-preview" data-event-image-preview>Artist photo or ${escapeHtml(venueName)} fallback will be used</div></div>
        </div>
      </div>
    </section>

    <div class="artist-event-submit">
      <button class="button button--primary" type="submit">Create Event and Link Artist</button>
    </div>
    <p class="artist-builder__status" data-artist-event-status role="status"></p>
  </form>`;
}

function setPreview(container, file, emptyText) {
  if (!container) return;
  if (!file) {
    container.textContent = emptyText;
    return;
  }
  const url = URL.createObjectURL(file);
  container.innerHTML = `<img src="${escapeHtml(url)}" alt="Selected image preview" />`;
}

function populateFromArtist(form, artist) {
  state.selectedArtist = artist || null;
  const selectedWrap = form.querySelector("[data-artist-selected]");
  selectedWrap.innerHTML = selectedArtistMarkup(artist);
  selectedWrap.querySelector("[data-clear-artist]")?.addEventListener("click", () => {
    form.elements.artist_id.value = "";
    populateFromArtist(form, null);
  });

  const existingUpload = form.querySelector("[data-existing-photo-upload]");
  existingUpload.hidden = !artist || Boolean(artist.image_url);

  if (!artist) return;
  const eventName = form.querySelector("[data-event-name]");
  const description = form.querySelector("[data-event-description]");
  const caption = form.querySelector("[data-event-caption]");
  const venueName = state.context?.site?.display_name || "the venue";

  if (!eventName.value.trim() || eventName.dataset.autoFilled === "true") {
    eventName.value = artist.artist_name;
    eventName.dataset.autoFilled = "true";
  }
  if (!description.value.trim() || description.dataset.autoFilled === "true") {
    description.value = `${artist.artist_name} live at ${venueName}.`;
    description.dataset.autoFilled = "true";
  }
  if (!caption.value.trim() || caption.dataset.autoFilled === "true") {
    caption.value = `${artist.artist_name} is coming to ${venueName}. Get the details and make plans now.`;
    caption.dataset.autoFilled = "true";
  }

  const eventPreview = form.querySelector("[data-event-image-preview]");
  if (!form.elements.event_image.files?.[0]) {
    eventPreview.innerHTML = artist.image_url
      ? `<img src="${escapeHtml(artist.image_url)}" alt="${escapeHtml(artist.artist_name)}" />`
      : "No shared artist photo yet. The venue fallback will be used unless a photo is added.";
  }
}

function filterArtistOptions(form, query) {
  const select = form.querySelector("[data-artist-select]");
  const selectedId = select.value;
  const normalized = normalize(query);
  const filtered = !normalized ? state.artists : state.artists.filter((artist) => normalize([
    artist.artist_name,
    artist.entertainment_type,
    artist.genre,
    artist.hometown
  ].filter(Boolean).join(" ")).includes(normalized));
  select.innerHTML = optionMarkup(filtered, selectedId);
  if (selectedId && !filtered.some((artist) => artist.artist_id === selectedId)) {
    const selected = state.artists.find((artist) => artist.artist_id === selectedId);
    if (selected) select.insertAdjacentHTML("beforeend", optionMarkup([selected], selectedId).replace('<option value="">No performer / general venue event</option>', ''));
  }
}

async function showPossibleMatches(form, value) {
  const box = form.querySelector("[data-artist-matches]");
  const query = value.trim();
  if (query.length < 3) {
    box.innerHTML = "";
    return;
  }
  try {
    const matches = (await searchArtists(query, 5)).filter((artist) => artist.match_score >= 70);
    if (!matches.length) {
      box.innerHTML = `<div class="artist-directory-note">No close directory match found. A new artist record will be created when the event is saved.</div>`;
      return;
    }
    box.innerHTML = `<div class="artist-directory-note"><strong>Possible existing matches:</strong> Select one to prevent a duplicate record.</div>${matches.map((artist) => `<div class="artist-match"><div><strong>${escapeHtml(artist.artist_name)}</strong><span>${escapeHtml([artist.genre, artist.hometown].filter(Boolean).join(" | ") || artist.entertainment_type || "Performer")}</span></div><button class="button button--small button--ghost" type="button" data-use-match="${escapeHtml(artist.artist_id)}">Use this artist</button></div>`).join("")}`;
    box.querySelectorAll("[data-use-match]").forEach((button) => button.addEventListener("click", () => {
      const artist = state.artists.find((item) => item.artist_id === button.dataset.useMatch) || matches.find((item) => item.artist_id === button.dataset.useMatch);
      if (!artist) return;
      if (!state.artists.some((item) => item.artist_id === artist.artist_id)) state.artists.push(artist);
      form.elements.artist_id.innerHTML = optionMarkup(state.artists, artist.artist_id);
      form.elements.artist_id.value = artist.artist_id;
      form.querySelector("[data-new-artist-panel]").hidden = true;
      populateFromArtist(form, artist);
    }));
  } catch (error) {
    box.innerHTML = `<div class="artist-directory-note">Match check unavailable: ${escapeHtml(error.message)}</div>`;
  }
}

function validateImage(file) {
  if (!file) return;
  const allowed = new Set(["image/jpeg", "image/png", "image/webp", "image/gif"]);
  if (!allowed.has(file.type)) throw new Error("Images must be JPG, PNG, WebP, or GIF.");
  if (file.size > 10 * 1024 * 1024) throw new Error("Images must be smaller than 10 MB.");
}

async function uploadImage(bucket, folder, file, token) {
  validateImage(file);
  const extension = (file.name.split(".").pop() || "jpg").toLowerCase().replace(/[^a-z0-9]/g, "") || "jpg";
  const path = `${folder}/${Date.now()}-${Math.random().toString(36).slice(2, 8)}.${extension}`;
  const encodedPath = path.split("/").map(encodeURIComponent).join("/");
  const response = await fetch(`${CONFIG.supabaseUrl}/storage/v1/object/${encodeURIComponent(bucket)}/${encodedPath}`, {
    method: "POST",
    headers: {
      apikey: CONFIG.supabaseAnonKey,
      Authorization: `Bearer ${token}`,
      "Content-Type": file.type,
      "x-upsert": "false",
      "Cache-Control": "3600"
    },
    body: file
  });
  const text = await response.text();
  let payload = null;
  try { payload = text ? JSON.parse(text) : null; } catch { payload = text; }
  if (!response.ok) throw new Error(payload?.message || payload?.error || `Image upload failed (${response.status}).`);
  return {
    path,
    url: `${CONFIG.supabaseUrl}/storage/v1/object/public/${bucket}/${path}`
  };
}

async function submitEnhancedEvent(form) {
  const context = await getContext();
  const token = context.auth.access_token;
  const status = form.querySelector("[data-artist-event-status]");
  const button = form.querySelector("button[type='submit']");
  const values = Object.fromEntries(new FormData(form).entries());
  const selected = state.artists.find((artist) => artist.artist_id === values.artist_id) || null;
  const newArtistName = String(values.new_artist_name || "").trim();
  const usingNewArtist = !selected && newArtistName.length > 0;

  button.disabled = true;
  status.className = "artist-builder__status";
  status.textContent = "Preparing the performer and event record...";

  try {
    let artistPhotoUrl = null;
    const newArtistPhoto = form.elements.new_artist_photo?.files?.[0] || null;
    if (usingNewArtist && newArtistPhoto) {
      status.textContent = "Uploading the shared artist photo...";
      const upload = await uploadImage("artist-assets", `artists/${safeFileName(newArtistName)}`, newArtistPhoto, token);
      artistPhotoUrl = upload.url;
    }

    if (selected && !selected.image_url) {
      const existingPhoto = form.elements.existing_artist_photo?.files?.[0] || null;
      if (existingPhoto) {
        status.textContent = "Adding the photo to the shared artist directory...";
        const upload = await uploadImage("artist-assets", `artists/${safeFileName(selected.artist_name)}`, existingPhoto, token);
        await rpc("promo_proof_set_artist_photo", {
          p_venue_id: context.venueId,
          p_artist_id: selected.artist_id,
          p_file_url: upload.url,
          p_storage_bucket: "artist-assets",
          p_storage_path: upload.path,
          p_media_type: "profile",
          p_alt_text: selected.artist_name
        }, token);
        selected.image_url = upload.url;
      }
    }

    let eventImageUrl = null;
    const eventImage = form.elements.event_image?.files?.[0] || null;
    if (eventImage) {
      status.textContent = "Uploading event-specific artwork...";
      const eventName = String(values.name || selected?.artist_name || newArtistName || "event");
      const upload = await uploadImage("event-images", `venue-events/${safeFileName(context.site?.site_key || context.site?.display_name || "venue")}/${safeFileName(eventName)}`, eventImage, token);
      eventImageUrl = upload.url;
    }

    const eventName = String(values.name || selected?.artist_name || newArtistName || "Venue Event").trim();
    if (!eventName) throw new Error("Event name is required.");
    if (!values.starts_at) throw new Error("Event start time is required.");

    const publicSlug = slugify(eventName);
    const result = await rpc("promo_proof_create_event_with_artist", {
      p_venue_id: context.venueId,
      p_artist_id: selected?.artist_id || null,
      p_artist_name: usingNewArtist ? newArtistName : null,
      p_create_artist_if_missing: usingNewArtist,
      p_artist_entertainment_type: String(values.new_artist_type || "Band"),
      p_artist_genre: String(values.new_artist_genre || "").trim() || null,
      p_artist_hometown: String(values.new_artist_hometown || "").trim() || null,
      p_artist_bio: String(values.new_artist_bio || "").trim() || null,
      p_artist_profile_photo: artistPhotoUrl,
      p_event_name: eventName,
      p_slug: `${safeFileName(context.site?.site_key || "venue")}-${publicSlug}-${Math.random().toString(36).slice(2, 6)}`,
      p_description: String(values.description || "").trim() || null,
      p_status: String(values.status || "draft"),
      p_starts_at: new Date(values.starts_at).toISOString(),
      p_ends_at: values.ends_at ? new Date(values.ends_at).toISOString() : null,
      p_event_image_url: eventImageUrl,
      p_default_caption: String(values.default_caption || "").trim() || null,
      p_call_to_action: "Event Details",
      p_destination_url: null,
      p_metadata: {
        public_slug: publicSlug,
        price_label: String(values.price_label || "").trim() || null,
        special_guest: String(values.special_guest || "").trim() || null,
        ticketing_mode: String(values.ticketing_mode || "native"),
        external_ticket_url: String(values.external_ticket_url || "").trim() || null,
        category: "live music",
        artist_directory: true,
        artist_directory_version: 1,
        created_from: "venue_admin"
      },
      p_billing_role: "headliner"
    }, token);

    const createdArtist = result?.artist;
    status.className = "artist-builder__status is-success";
    status.textContent = createdArtist?.name
      ? `Event created and linked to ${createdArtist.name}. The shared artist image will now flow to connected venue websites.`
      : "Event created. The venue fallback image will be used until a performer or event image is added.";
    showToast("Event created and artist data linked.");
    form.reset();
    state.selectedArtist = null;
    setTimeout(() => document.querySelector(".js-admin-refresh")?.click(), 700);
  } catch (error) {
    console.error(error);
    status.className = "artist-builder__status is-error";
    status.textContent = error.message || "The event could not be created.";
    showToast(status.textContent, true);
    button.disabled = false;
  }
}

function wireEnhancedForm(form) {
  const select = form.querySelector("[data-artist-select]");
  const filter = form.querySelector("[data-artist-filter]");
  const newPanel = form.querySelector("[data-new-artist-panel]");
  const newArtistName = form.querySelector("[data-new-artist-name]");
  let matchTimer = null;

  select.addEventListener("change", () => {
    const artist = state.artists.find((item) => item.artist_id === select.value) || null;
    newPanel.hidden = true;
    populateFromArtist(form, artist);
  });
  filter.addEventListener("input", () => filterArtistOptions(form, filter.value));
  form.querySelector("[data-toggle-new-artist]").addEventListener("click", () => {
    newPanel.hidden = !newPanel.hidden;
    if (!newPanel.hidden) {
      select.value = "";
      populateFromArtist(form, null);
      newArtistName.focus();
    }
  });
  newArtistName.addEventListener("input", () => {
    clearTimeout(matchTimer);
    matchTimer = setTimeout(() => showPossibleMatches(form, newArtistName.value), 300);
    const eventName = form.querySelector("[data-event-name]");
    if (!eventName.value.trim() || eventName.dataset.autoFilled === "true") {
      eventName.value = newArtistName.value;
      eventName.dataset.autoFilled = "true";
    }
  });

  form.querySelector("[data-event-name]").addEventListener("input", (event) => {
    if (event.isTrusted) event.currentTarget.dataset.autoFilled = "false";
  });
  form.querySelector("[data-event-description]").addEventListener("input", (event) => {
    if (event.isTrusted) event.currentTarget.dataset.autoFilled = "false";
  });
  form.querySelector("[data-event-caption]").addEventListener("input", (event) => {
    if (event.isTrusted) event.currentTarget.dataset.autoFilled = "false";
  });

  form.elements.new_artist_photo.addEventListener("change", () => setPreview(
    form.querySelector("[data-new-artist-photo-preview]"),
    form.elements.new_artist_photo.files?.[0] || null,
    "No photo selected"
  ));
  form.elements.existing_artist_photo.addEventListener("change", () => setPreview(
    form.querySelector("[data-existing-photo-preview]"),
    form.elements.existing_artist_photo.files?.[0] || null,
    "No photo selected"
  ));
  form.elements.event_image.addEventListener("change", () => {
    const file = form.elements.event_image.files?.[0] || null;
    if (file) setPreview(form.querySelector("[data-event-image-preview]"), file, "No event-specific image selected");
    else populateFromArtist(form, state.selectedArtist);
  });

  form.addEventListener("submit", (event) => {
    event.preventDefault();
    event.stopImmediatePropagation();
    submitEnhancedEvent(form);
  }, true);
}

async function enhanceEventForm() {
  if (location.pathname !== "/admin") return;
  if (document.querySelector(".admin-topbar h1")?.textContent?.trim() !== "Events") return;
  const oldForm = document.querySelector(".js-event-form:not([data-artist-event-enhanced])");
  if (!oldForm || state.loading) return;

  state.loading = true;
  addStyles();
  try {
    const context = await getContext();
    const artists = await loadDirectory();
    const wrapper = document.createElement("div");
    wrapper.innerHTML = formMarkup(context, artists);
    const newForm = wrapper.firstElementChild;
    oldForm.replaceWith(newForm);
    wireEnhancedForm(newForm);
  } catch (error) {
    console.error("Artist event builder could not load", error);
    oldForm.insertAdjacentHTML("beforebegin", `<div class="empty-box">Artist directory unavailable: ${escapeHtml(error.message)}</div>`);
  } finally {
    state.loading = false;
  }
}

function queueEnhance() {
  if (state.queued) return;
  state.queued = true;
  setTimeout(async () => {
    state.queued = false;
    await enhanceEventForm();
  }, 60);
}

const observer = new MutationObserver(queueEnhance);
observer.observe(document.documentElement, { childList: true, subtree: true });
window.addEventListener("pageshow", queueEnhance);
window.addEventListener("popstate", queueEnhance);
queueEnhance();
