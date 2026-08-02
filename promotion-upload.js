const POURMAP_PROMO = {
  supabaseUrl: 'https://xopcttkrmjvwdddawdaa.supabase.co',
  anonKey: 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6InhvcGN0dGtybWp2d2RkZGF3ZGFhIiwicm9sZSI6ImFub24iLCJpYXQiOjE3NTYxNTQzNjgsImV4cCI6MjA3MTczMDM2OH0.5s1HHvDsDIgWw6TVR3YfhzJC9uEjcVfunRyMa6B7xYY',
  sessionKey: 'pourmap-session-v1',
};

let promoPanelBusy = false;
let promoPanelTimer = null;

function promoEscape(value = '') {
  return String(value)
    .replaceAll('&', '&amp;')
    .replaceAll('<', '&lt;')
    .replaceAll('>', '&gt;')
    .replaceAll('"', '&quot;')
    .replaceAll("'", '&#039;');
}

function promoSession() {
  try {
    return JSON.parse(localStorage.getItem(POURMAP_PROMO.sessionKey) || 'null');
  } catch {
    return null;
  }
}

function promoUserId(accessToken) {
  try {
    let payload = accessToken.split('.')[1].replace(/-/g, '+').replace(/_/g, '/');
    while (payload.length % 4) payload += '=';
    return JSON.parse(atob(payload)).sub || null;
  } catch {
    return null;
  }
}

async function promoParse(response) {
  const text = await response.text();
  let body = null;
  try {
    body = text ? JSON.parse(text) : null;
  } catch {
    body = text;
  }
  if (!response.ok) {
    throw new Error(body?.message || body?.error_description || body?.error || `Request failed (${response.status}).`);
  }
  return body;
}

async function promoRpc(name, args, token) {
  return promoParse(await fetch(`${POURMAP_PROMO.supabaseUrl}/rest/v1/rpc/${name}`, {
    method: 'POST',
    headers: {
      apikey: POURMAP_PROMO.anonKey,
      Authorization: `Bearer ${token}`,
      'Content-Type': 'application/json',
    },
    body: JSON.stringify(args || {}),
  }));
}

async function uploadPromotionGraphic(file, token, userId) {
  const allowed = new Set(['image/jpeg', 'image/png', 'image/webp']);
  if (!file || !allowed.has(file.type)) {
    throw new Error('Choose a JPG, PNG, or WebP photo or marketing graphic.');
  }
  if (file.size > 5 * 1024 * 1024) {
    throw new Error('The marketing graphic must be under 5 MB.');
  }

  const extension = (file.name.split('.').pop() || 'jpg').toLowerCase().replace(/[^a-z0-9]/g, '') || 'jpg';
  const path = `users/${userId}/promotions/${Date.now()}-${Math.random().toString(36).slice(2)}.${extension}`;
  const response = await fetch(`${POURMAP_PROMO.supabaseUrl}/storage/v1/object/pourmap-public/${path}`, {
    method: 'POST',
    headers: {
      apikey: POURMAP_PROMO.anonKey,
      Authorization: `Bearer ${token}`,
      'Content-Type': file.type,
      'x-upsert': 'true',
    },
    body: file,
  });
  await promoParse(response);
  return `${POURMAP_PROMO.supabaseUrl}/storage/v1/object/public/pourmap-public/${path}`;
}

function addPromotionUploaderStyles() {
  if (document.querySelector('#pourmap-promotion-uploader-styles')) return;
  const style = document.createElement('style');
  style.id = 'pourmap-promotion-uploader-styles';
  style.textContent = `
    .promotion-uploader { grid-column: 1 / -1; }
    .promotion-uploader__intro { color: var(--muted); line-height: 1.6; margin: 0 0 16px; }
    .promotion-uploader__drop { border: 1px dashed rgba(255,255,255,.22); border-radius: 16px; padding: 16px; background: rgba(255,255,255,.025); }
    .promotion-uploader__preview { min-height: 150px; border-radius: 13px; overflow: hidden; display: grid; place-items: center; background: rgba(0,0,0,.22); color: var(--muted); text-align: center; }
    .promotion-uploader__preview img { width: 100%; max-height: 310px; object-fit: contain; display: block; }
    .promotion-uploader__file-name { color: var(--muted); font-size: .78rem; margin-top: 8px; word-break: break-word; }
    .promotion-uploader__result { margin-top: 14px; padding: 14px; border: 1px solid rgba(54,241,221,.35); border-radius: 14px; background: rgba(54,241,221,.07); }
    .promotion-uploader__result input { margin: 8px 0 10px; }
    .promotion-uploader__status { min-height: 22px; margin-top: 10px; color: var(--cyan); font-size: .82rem; }
    .promotion-uploader__status.error { color: #ff6d8d; }
    @media (max-width: 800px) { .promotion-uploader__drop { padding: 12px; } }
  `;
  document.head.appendChild(style);
}

function promotionUploaderShell() {
  return `
    <section class="dashboard-panel promotion-uploader" data-promotion-uploader>
      <div class="dashboard-panel__head">
        <div>
          <h2>Upload a marketing piece and create a link</h2>
          <p style="color:var(--muted);margin:5px 0 0;font-size:.78rem">Choose an approved venue promotion, upload your own photo or graphic, and PourMap will create your tracked share page.</p>
        </div>
        <span class="badge badge--live">Promo Proof</span>
      </div>
      <div class="dashboard-panel__body" data-promotion-uploader-body>
        <div class="empty-state"><div class="spinner" style="margin:auto"></div><h3>Opening promotion builder</h3><p>Loading your venue relationships and approved campaigns.</p></div>
      </div>
    </section>`;
}

async function renderPromotionUploader(panel) {
  const body = panel.querySelector('[data-promotion-uploader-body]');
  const session = promoSession();
  if (!session?.access_token) {
    body.innerHTML = '<div class="empty-state"><h3>Sign in required</h3><p>Sign in again to upload a marketing piece.</p></div>';
    return;
  }

  try {
    const bundle = await promoRpc('pourmap_dashboard_bundle', {}, session.access_token);
    const campaigns = bundle?.campaigns || [];
    const promoter = bundle?.promoter || {};
    const shifts = bundle?.shifts || [];

    if (!campaigns.length) {
      body.innerHTML = '<div class="empty-state"><h3>No approved campaigns yet</h3><p>A venue must approve the relationship and release a promotion before a bartender can attach a custom graphic and create a tracked link.</p></div>';
      return;
    }

    body.innerHTML = `
      <form data-promotion-upload-form>
        <div class="form-grid">
          <div class="field field--wide">
            <label>Venue promotion</label>
            <select name="campaign_id" required>
              <option value="">Choose an approved promotion</option>
              ${campaigns.map(c => `<option value="${promoEscape(c.id)}">${promoEscape(c.venue_name)} — ${promoEscape(c.name)}</option>`).join('')}
            </select>
          </div>
          <div class="field">
            <label>Share channel</label>
            <select name="channel">
              <option value="facebook">Facebook</option>
              <option value="instagram">Instagram</option>
              <option value="tiktok">TikTok</option>
              <option value="snapchat">Snapchat</option>
              <option value="sms">Text / SMS</option>
              <option value="qr">QR / print</option>
              <option value="direct">Direct link</option>
            </select>
          </div>
          <div class="field">
            <label>Related shift</label>
            <select name="shift_id">
              <option value="">No specific shift</option>
              ${shifts.map(s => `<option value="${promoEscape(s.id)}" data-venue-id="${promoEscape(s.venue_id)}">${promoEscape(s.venue_name)} — ${promoEscape(new Date(s.starts_at).toLocaleString())}</option>`).join('')}
            </select>
          </div>
          <div class="field field--wide">
            <label>Caption</label>
            <textarea name="caption" rows="4" placeholder="Tell customers why they should come see you."></textarea>
          </div>
          <div class="field field--wide promotion-uploader__drop">
            <label>Photo or marketing graphic</label>
            <input name="marketing_file" type="file" accept="image/jpeg,image/png,image/webp" data-promotion-file />
            <div class="promotion-uploader__file-name" data-promotion-file-name>JPG, PNG, or WebP · maximum 5 MB</div>
            <div class="promotion-uploader__preview" data-promotion-preview style="margin-top:12px">
              ${promoter.photo_url ? `<img src="${promoEscape(promoter.photo_url)}" alt="Current bartender photo"/>` : '<span>Your uploaded marketing piece will preview here.</span>'}
            </div>
          </div>
        </div>
        <div class="button-row" style="margin-top:14px">
          <button class="button button--pink" type="submit">Create tracked marketing link</button>
          ${promoter.photo_url ? '<button class="button button--ghost" type="button" data-use-profile-photo>Use my profile photo</button>' : ''}
        </div>
        <p class="promotion-uploader__status" data-promotion-status></p>
        <div data-promotion-result></div>
      </form>`;

    const form = body.querySelector('[data-promotion-upload-form]');
    const campaignSelect = form.elements.campaign_id;
    const shiftSelect = form.elements.shift_id;
    const caption = form.elements.caption;
    const fileInput = form.querySelector('[data-promotion-file]');
    const preview = form.querySelector('[data-promotion-preview]');
    const fileName = form.querySelector('[data-promotion-file-name]');
    const status = form.querySelector('[data-promotion-status]');
    const result = form.querySelector('[data-promotion-result]');
    let useProfilePhoto = false;

    campaignSelect.addEventListener('change', () => {
      const campaign = campaigns.find(item => item.id === campaignSelect.value);
      if (!campaign) return;
      if (!caption.value.trim()) {
        caption.value = campaign.default_caption || `I'm promoting ${campaign.name} at ${campaign.venue_name}. Come see me!`;
      }
      [...shiftSelect.options].forEach((option, index) => {
        if (index === 0) return;
        option.hidden = option.dataset.venueId !== campaign.venue_id;
      });
      if (shiftSelect.selectedOptions[0]?.hidden) shiftSelect.value = '';
    });

    fileInput.addEventListener('change', () => {
      useProfilePhoto = false;
      const file = fileInput.files?.[0];
      if (!file) return;
      fileName.textContent = `${file.name} · ${(file.size / 1024 / 1024).toFixed(2)} MB`;
      preview.innerHTML = `<img src="${URL.createObjectURL(file)}" alt="Marketing piece preview"/>`;
    });

    form.querySelector('[data-use-profile-photo]')?.addEventListener('click', () => {
      useProfilePhoto = true;
      fileInput.value = '';
      fileName.textContent = 'Using your current profile photo.';
      preview.innerHTML = `<img src="${promoEscape(promoter.photo_url)}" alt="Current bartender photo"/>`;
    });

    form.addEventListener('submit', async event => {
      event.preventDefault();
      const button = form.querySelector('button[type="submit"]');
      const campaign = campaigns.find(item => item.id === campaignSelect.value);
      if (!campaign) {
        status.textContent = 'Choose an approved venue promotion.';
        status.className = 'promotion-uploader__status error';
        return;
      }

      const file = fileInput.files?.[0] || null;
      button.disabled = true;
      status.className = 'promotion-uploader__status';
      status.textContent = file ? 'Uploading your marketing piece…' : 'Creating your tracked link…';
      result.innerHTML = '';

      try {
        let assetUrl = useProfilePhoto ? promoter.photo_url || null : null;
        if (file) {
          const userId = promoUserId(session.access_token);
          if (!userId) throw new Error('Your session could not be verified. Sign in again.');
          assetUrl = await uploadPromotionGraphic(file, session.access_token, userId);
          status.textContent = 'Upload complete. Building the Promo Proof link…';
        }

        const response = await promoRpc('pourmap_create_share', {
          p_campaign_id: campaign.id,
          p_shift_id: shiftSelect.value || null,
          p_channel: form.elements.channel.value || 'direct',
          p_custom_caption: caption.value.trim() || null,
          p_personal_photo_url: assetUrl,
        }, session.access_token);

        const shareUrl = `${location.origin}/r/${response.share_slug}`;
        try {
          await navigator.clipboard.writeText(shareUrl);
          status.textContent = 'Tracked link created and copied.';
        } catch {
          status.textContent = 'Tracked link created.';
        }
        result.innerHTML = `
          <div class="promotion-uploader__result">
            <strong>Your marketing link is ready</strong>
            <input value="${promoEscape(shareUrl)}" readonly data-created-promo-link />
            <div class="button-row">
              <button class="button button--primary button--small" type="button" data-copy-created-link>Copy link</button>
              <a class="button button--ghost button--small" href="${promoEscape(shareUrl)}" target="_blank" rel="noreferrer">Open promotion</a>
            </div>
          </div>`;
        result.querySelector('[data-copy-created-link]').addEventListener('click', async () => {
          await navigator.clipboard.writeText(shareUrl);
          status.textContent = 'Link copied.';
        });
        button.disabled = false;
      } catch (error) {
        status.textContent = error.message;
        status.className = 'promotion-uploader__status error';
        button.disabled = false;
      }
    });
  } catch (error) {
    body.innerHTML = `<div class="empty-state"><h3>Promotion builder could not load</h3><p>${promoEscape(error.message)}</p></div>`;
  }
}

async function ensurePromotionUploader() {
  if (promoPanelBusy || location.pathname !== '/dashboard') return;
  const content = document.querySelector('.dashboard-content');
  if (!content || content.querySelector('[data-promotion-uploader]')) return;
  const heading = document.querySelector('.dashboard-topbar h1')?.textContent?.trim();
  if (heading !== 'Promotions') return;

  promoPanelBusy = true;
  addPromotionUploaderStyles();
  content.insertAdjacentHTML('afterbegin', promotionUploaderShell());
  const panel = content.querySelector('[data-promotion-uploader]');
  await renderPromotionUploader(panel);
  promoPanelBusy = false;
}

const promoObserver = new MutationObserver(() => {
  clearTimeout(promoPanelTimer);
  promoPanelTimer = setTimeout(ensurePromotionUploader, 40);
});

promoObserver.observe(document.documentElement, { childList: true, subtree: true });
window.addEventListener('popstate', ensurePromotionUploader);
window.addEventListener('pageshow', ensurePromotionUploader);
ensurePromotionUploader();
