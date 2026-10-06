import { loadAdminData, readSession, rest } from "./supabase.js";
import { showToast } from "./ui.js";

const ENHANCEMENT_VERSION = "h18-inquiries-v2";
const state = {
  data: null,
  loadedAt: 0,
  loading: false,
  renderQueued: false,
  activeInquiryId: null,
  filters: { query: "", read: "all", status: "all", type: "all" }
};

const escapeHtml = (value = "") => String(value)
  .replaceAll("&", "&amp;")
  .replaceAll("<", "&lt;")
  .replaceAll(">", "&gt;")
  .replaceAll('"', "&quot;")
  .replaceAll("'", "&#039;");

function session() {
  return readSession?.() || null;
}

function userIdFromToken(token) {
  try {
    let payload = token.split(".")[1].replace(/-/g, "+").replace(/_/g, "/");
    while (payload.length % 4) payload += "=";
    return JSON.parse(atob(payload)).sub || null;
  } catch {
    return null;
  }
}

function formatDate(value) {
  if (!value) return "Unknown time";
  const date = new Date(value);
  if (Number.isNaN(date.getTime())) return String(value);
  return new Intl.DateTimeFormat("en-US", {
    weekday: "short",
    month: "short",
    day: "numeric",
    year: "numeric",
    hour: "numeric",
    minute: "2-digit"
  }).format(date);
}

function formatPhone(value) {
  const digits = String(value || "").replace(/\D/g, "");
  const local = digits.length === 11 && digits.startsWith("1") ? digits.slice(1) : digits;
  if (local.length === 10) return `(${local.slice(0,3)}) ${local.slice(3,6)}-${local.slice(6)}`;
  return value || "No phone provided";
}

function telValue(value) {
  const digits = String(value || "").replace(/\D/g, "");
  if (!digits) return "";
  return digits.length === 10 ? `+1${digits}` : `+${digits}`;
}

function statusBadge(status) {
  const value = String(status || "new");
  const tone = ["completed"].includes(value) ? "green" : ["new", "in_progress"].includes(value) ? "yellow" : ["spam"].includes(value) ? "red" : "";
  return `<span class="admin-badge${tone ? ` admin-badge--${tone}` : ""}">${escapeHtml(value.replaceAll("_", " "))}</span>`;
}

function typeLabel(value) {
  return String(value || "contact").replaceAll("_", " ").replace(/\b\w/g, (letter) => letter.toUpperCase());
}

function addStyles() {
  if (document.querySelector("#h18-inquiries-enhancement-styles")) return;
  const style = document.createElement("style");
  style.id = "h18-inquiries-enhancement-styles";
  style.textContent = `
    .inquiry-nav-count{margin-left:auto;min-width:1.45rem;height:1.45rem;padding:0 .38rem;border-radius:999px;display:inline-grid;place-items:center;background:#b31b22;color:#fff;font:800 .72rem/1 Inter,sans-serif;box-shadow:0 0 0 2px rgba(179,27,34,.18)}
    .inquiry-summary{display:grid;grid-template-columns:repeat(3,minmax(0,1fr));gap:.8rem;margin-bottom:1rem}
    .inquiry-summary__card{border:1px solid var(--admin-line,#292c33);border-radius:12px;padding:1rem;background:rgba(255,255,255,.025)}
    .inquiry-summary__card span{display:block;color:#9096a3;font-size:.72rem;font-weight:800;letter-spacing:.08em;text-transform:uppercase}
    .inquiry-summary__card strong{display:block;margin-top:.35rem;font-family:'Barlow Condensed',sans-serif;font-size:2rem;line-height:1}
    .inquiry-toolbar{display:grid;grid-template-columns:minmax(220px,1fr) repeat(3,minmax(135px,.22fr));gap:.7rem;margin-bottom:1rem}
    .inquiry-toolbar input,.inquiry-toolbar select{width:100%;height:42px;border:1px solid #353942;border-radius:9px;background:#111318;color:#fff;padding:0 .8rem;font:600 .82rem Inter,sans-serif}
    .inquiry-toolbar-actions{display:flex;gap:.55rem;align-items:center;justify-content:flex-end;margin:0 0 1rem;flex-wrap:wrap}
    .inquiry-unread-row{background:rgba(179,27,34,.075)}
    .inquiry-unread-row td:first-child{box-shadow:inset 4px 0 0 #b31b22}
    .inquiry-read-indicator{display:inline-flex;align-items:center;gap:.42rem;font-size:.72rem;font-weight:800;text-transform:uppercase;letter-spacing:.05em}
    .inquiry-read-indicator::before{content:'';width:.58rem;height:.58rem;border-radius:50%;background:#636a77}
    .inquiry-read-indicator.is-unread{color:#ffb4b8}
    .inquiry-read-indicator.is-unread::before{background:#e7363e;box-shadow:0 0 0 4px rgba(231,54,62,.13)}
    .inquiry-contact-links{display:flex;flex-direction:column;gap:.2rem;margin-top:.3rem}
    .inquiry-contact-links a{color:#c9ced7;text-decoration:none;font-size:.78rem;word-break:break-word}
    .inquiry-contact-links a:hover{color:#fff;text-decoration:underline}
    .inquiry-preview{max-width:430px;white-space:normal}
    .inquiry-preview p{margin:.25rem 0 0;color:#c8ccd4;line-height:1.4}
    .inquiry-action-stack{display:flex;gap:.4rem;flex-wrap:wrap;min-width:250px}
    .inquiry-empty{padding:2.5rem 1rem;text-align:center;color:#9aa0ac}
    .inquiry-modal{position:fixed;inset:0;z-index:10000;display:grid;place-items:center;padding:1rem;background:rgba(0,0,0,.78);backdrop-filter:blur(7px)}
    .inquiry-modal__card{width:min(760px,100%);max-height:min(850px,92vh);overflow:auto;border:1px solid #343841;border-radius:18px;background:#101217;box-shadow:0 30px 90px rgba(0,0,0,.65)}
    .inquiry-modal__head{position:sticky;top:0;z-index:2;display:flex;justify-content:space-between;gap:1rem;align-items:flex-start;padding:1.25rem 1.35rem;border-bottom:1px solid #292c33;background:rgba(16,18,23,.96);backdrop-filter:blur(10px)}
    .inquiry-modal__head h2{margin:.15rem 0 0;font-size:1.7rem}
    .inquiry-modal__body{padding:1.35rem}
    .inquiry-detail-grid{display:grid;grid-template-columns:repeat(2,minmax(0,1fr));gap:.8rem;margin-bottom:1rem}
    .inquiry-detail-box{border:1px solid #2d3038;border-radius:11px;padding:.9rem;background:rgba(255,255,255,.025)}
    .inquiry-detail-box span{display:block;color:#858c99;font-size:.68rem;font-weight:800;letter-spacing:.08em;text-transform:uppercase;margin-bottom:.35rem}
    .inquiry-detail-box strong,.inquiry-detail-box a{color:#fff;text-decoration:none;word-break:break-word}
    .inquiry-message{border:1px solid #2d3038;border-radius:12px;padding:1rem;background:#0b0d11;white-space:pre-wrap;line-height:1.65;color:#eef0f4}
    .inquiry-payload{margin-top:1rem}
    .inquiry-payload pre{overflow:auto;padding:1rem;border:1px solid #2d3038;border-radius:10px;background:#090b0f;color:#cdd2db;font-size:.78rem;white-space:pre-wrap}
    .inquiry-modal__actions{display:flex;gap:.55rem;flex-wrap:wrap;margin-top:1rem}
    .inquiry-icon-button{width:38px;height:38px;border:1px solid #353942;border-radius:9px;background:#171920;color:#fff;font-size:1.2rem;cursor:pointer}
    .inquiry-icon-button:hover{background:#22252d}
    @media(max-width:1050px){.inquiry-toolbar{grid-template-columns:1fr 1fr}.inquiry-toolbar input{grid-column:1/-1}}
    @media(max-width:760px){.inquiry-summary{grid-template-columns:1fr}.inquiry-toolbar{grid-template-columns:1fr}.inquiry-toolbar input{grid-column:auto}.inquiry-detail-grid{grid-template-columns:1fr}.inquiry-action-stack{min-width:180px}.inquiry-modal{padding:.4rem}.inquiry-modal__card{max-height:96vh;border-radius:14px}}
  `;
  document.head.appendChild(style);
}

async function loadData(force = false) {
  const auth = session();
  if (!auth?.access_token) return null;
  if (!force && state.data && Date.now() - state.loadedAt < 8000) return state.data;
  if (state.loading) return state.data;
  state.loading = true;
  try {
    state.data = await loadAdminData(auth.access_token);
    state.loadedAt = Date.now();
    return state.data;
  } finally {
    state.loading = false;
  }
}

function unreadCount() {
  return (state.data?.submissions || []).filter((item) => !item.is_read && item.status !== "spam").length;
}

function updateNavBadge() {
  const button = document.querySelector('.admin-nav [data-tab="inquiries"]');
  if (!button) return;
  let badge = button.querySelector(".inquiry-nav-count");
  const count = unreadCount();
  if (!count) {
    badge?.remove();
  } else {
    if (!badge) {
      badge = document.createElement("span");
      badge.className = "inquiry-nav-count";
      button.appendChild(badge);
    }
    badge.textContent = count > 99 ? "99+" : String(count);
    badge.setAttribute("aria-label", `${count} unread inquiries`);
  }
  if (location.pathname === "/admin") {
    const base = "Hangar 18 Management";
    document.title = count ? `(${count}) ${base}` : base;
  }
}

function filteredSubmissions() {
  const query = state.filters.query.toLowerCase();
  return [...(state.data?.submissions || [])]
    .filter((item) => {
      if (state.filters.read === "unread" && item.is_read) return false;
      if (state.filters.read === "read" && !item.is_read) return false;
      if (state.filters.status !== "all" && item.status !== state.filters.status) return false;
      if (state.filters.type !== "all" && item.submission_type !== state.filters.type) return false;
      if (!query) return true;
      return [item.name,item.email,item.phone,item.subject,item.message,item.submission_type,item.status,JSON.stringify(item.payload || {})]
        .filter(Boolean).join(" ").toLowerCase().includes(query);
    })
    .sort((a,b) => Number(Boolean(a.is_read)) - Number(Boolean(b.is_read)) || new Date(b.created_at) - new Date(a.created_at));
}

function contactMarkup(item) {
  const phone = telValue(item.phone);
  const email = String(item.email || "").trim();
  return `<strong>${escapeHtml(item.name || "Unknown contact")}</strong>
    <div class="inquiry-contact-links">
      ${email ? `<a href="mailto:${encodeURIComponent(email)}">${escapeHtml(email)}</a>` : ""}
      ${phone ? `<a href="tel:${escapeHtml(phone)}">${escapeHtml(formatPhone(item.phone))}</a>` : ""}
      ${!email && !phone ? "<span>No contact details provided</span>" : ""}
    </div>`;
}

function inquiryRow(item) {
  const unread = !item.is_read;
  const preview = String(item.message || "").slice(0, 150);
  return `<tr class="${unread ? "inquiry-unread-row" : ""}" data-inquiry-row="${item.id}">
    <td><div class="inquiry-read-indicator ${unread ? "is-unread" : ""}">${unread ? "Unread" : "Read"}</div><br/><small>${escapeHtml(formatDate(item.created_at))}</small></td>
    <td>${statusBadge(item.submission_type)}</td>
    <td>${contactMarkup(item)}</td>
    <td class="inquiry-preview"><strong>${escapeHtml(item.subject || typeLabel(item.submission_type))}</strong>${preview ? `<p>${escapeHtml(preview)}${String(item.message || "").length > 150 ? "…" : ""}</p>` : ""}<button class="button button--small button--ghost" type="button" data-open-inquiry="${item.id}" style="margin-top:.55rem">View details</button></td>
    <td>${statusBadge(item.status)}</td>
    <td><div class="inquiry-action-stack">
      ${unread ? `<button class="button button--small button--ghost" type="button" data-read-inquiry="${item.id}">Mark read</button>` : `<button class="button button--small button--ghost" type="button" data-unread-inquiry="${item.id}">Mark unread</button>`}
      <button class="button button--small button--ghost" type="button" data-inquiry-workflow="${item.id}" data-status="in_progress">Working</button>
      <button class="button button--small button--ghost" type="button" data-inquiry-workflow="${item.id}" data-status="completed">Complete</button>
      <button class="button button--small button--ghost" type="button" data-inquiry-workflow="${item.id}" data-status="spam">Spam</button>
    </div></td>
  </tr>`;
}

function renderQueue() {
  const content = document.querySelector(".admin-content");
  if (!content || document.querySelector(".admin-topbar h1")?.textContent?.trim() !== "Inquiries") return;
  const submissions = state.data?.submissions || [];
  const rows = filteredSubmissions();
  const types = [...new Set(submissions.map((item) => item.submission_type).filter(Boolean))].sort();
  const unread = unreadCount();
  const open = submissions.filter((item) => ["new","in_progress"].includes(item.status)).length;
  content.dataset.inquiryEnhancement = ENHANCEMENT_VERSION;
  content.innerHTML = `<section class="admin-panel">
    <div class="admin-panel__head"><div><h2>Website Inquiry Queue</h2><small>${unread ? `${unread} message${unread === 1 ? "" : "s"} need attention` : "Everything has been read"}</small></div><div class="inquiry-toolbar-actions"><button class="button button--small button--ghost" type="button" data-refresh-inquiries>Refresh</button>${unread ? `<button class="button button--small button--ghost" type="button" data-read-all>Mark all read</button>` : ""}</div></div>
    <div class="admin-panel__body">
      <div class="inquiry-summary">
        <article class="inquiry-summary__card"><span>Unread</span><strong>${unread}</strong></article>
        <article class="inquiry-summary__card"><span>Open</span><strong>${open}</strong></article>
        <article class="inquiry-summary__card"><span>Total</span><strong>${submissions.length}</strong></article>
      </div>
      <div class="inquiry-toolbar">
        <input type="search" placeholder="Search name, email, phone, subject, or message" value="${escapeHtml(state.filters.query)}" data-inquiry-search />
        <select data-inquiry-read-filter><option value="all"${state.filters.read === "all" ? " selected" : ""}>All messages</option><option value="unread"${state.filters.read === "unread" ? " selected" : ""}>Unread only</option><option value="read"${state.filters.read === "read" ? " selected" : ""}>Read only</option></select>
        <select data-inquiry-status-filter><option value="all">All workflow statuses</option>${["new","in_progress","completed","spam"].map((value) => `<option value="${value}"${state.filters.status === value ? " selected" : ""}>${escapeHtml(typeLabel(value))}</option>`).join("")}</select>
        <select data-inquiry-type-filter><option value="all">All inquiry types</option>${types.map((value) => `<option value="${escapeHtml(value)}"${state.filters.type === value ? " selected" : ""}>${escapeHtml(typeLabel(value))}</option>`).join("")}</select>
      </div>
      ${rows.length ? `<div class="admin-table-wrap"><table class="admin-table"><thead><tr><th>Received</th><th>Type</th><th>Contact</th><th>Request</th><th>Status</th><th>Actions</th></tr></thead><tbody>${rows.map(inquiryRow).join("")}</tbody></table></div>` : `<div class="inquiry-empty"><h3>No inquiries match these filters.</h3><p>Change the filters or refresh the queue.</p></div>`}
    </div>
  </section>`;
  wireQueue();
}

async function patchInquiry(id, patch, message) {
  const auth = session();
  if (!auth?.access_token || !state.data?.venueId) throw new Error("Your management session expired.");
  const body = { ...patch, updated_at: new Date().toISOString() };
  const result = await rest(`promo_proof_form_submissions?id=eq.${id}&venue_id=eq.${state.data.venueId}`, {
    method: "PATCH",
    token: auth.access_token,
    headers: { Prefer: "return=representation" },
    body
  });
  const updated = result?.[0];
  if (updated) {
    const index = state.data.submissions.findIndex((item) => item.id === id);
    if (index >= 0) state.data.submissions[index] = updated;
  }
  updateNavBadge();
  renderQueue();
  if (state.activeInquiryId === id) openInquiry(id, false);
  if (message) showToast(message);
  return updated;
}

async function setRead(id, isRead, message = "") {
  const auth = session();
  return patchInquiry(id, {
    is_read: isRead,
    read_at: isRead ? new Date().toISOString() : null,
    read_by: isRead ? userIdFromToken(auth?.access_token || "") : null
  }, message || (isRead ? "Inquiry marked read." : "Inquiry marked unread."));
}

function closeModal() {
  document.querySelector(".inquiry-modal")?.remove();
  state.activeInquiryId = null;
}

async function openInquiry(id, autoMarkRead = true) {
  let item = state.data?.submissions?.find((entry) => entry.id === id);
  if (!item) return;
  state.activeInquiryId = id;
  if (autoMarkRead && !item.is_read) {
    item = await setRead(id, true, "");
  }
  item = state.data?.submissions?.find((entry) => entry.id === id) || item;
  document.querySelector(".inquiry-modal")?.remove();
  const phone = telValue(item.phone);
  const email = String(item.email || "").trim();
  const subject = item.subject || typeLabel(item.submission_type);
  document.body.insertAdjacentHTML("beforeend", `<div class="inquiry-modal" role="dialog" aria-modal="true" aria-label="Inquiry from ${escapeHtml(item.name || "contact")}">
    <section class="inquiry-modal__card">
      <header class="inquiry-modal__head"><div><span class="inquiry-read-indicator ${item.is_read ? "" : "is-unread"}">${item.is_read ? "Read" : "Unread"}</span><h2>${escapeHtml(subject)}</h2><small>${escapeHtml(formatDate(item.created_at))}</small></div><button class="inquiry-icon-button" type="button" data-close-inquiry aria-label="Close">×</button></header>
      <div class="inquiry-modal__body">
        <div class="inquiry-detail-grid">
          <div class="inquiry-detail-box"><span>Contact</span><strong>${escapeHtml(item.name || "Unknown contact")}</strong></div>
          <div class="inquiry-detail-box"><span>Inquiry type</span><strong>${escapeHtml(typeLabel(item.submission_type))}</strong></div>
          <div class="inquiry-detail-box"><span>Email</span>${email ? `<a href="mailto:${encodeURIComponent(email)}?subject=${encodeURIComponent(`Re: ${subject}`)}">${escapeHtml(email)}</a>` : "Not provided"}</div>
          <div class="inquiry-detail-box"><span>Phone</span>${phone ? `<a href="tel:${escapeHtml(phone)}">${escapeHtml(formatPhone(item.phone))}</a>` : "Not provided"}</div>
          <div class="inquiry-detail-box"><span>Workflow status</span>${statusBadge(item.status)}</div>
          <div class="inquiry-detail-box"><span>Last updated</span><strong>${escapeHtml(formatDate(item.updated_at || item.created_at))}</strong></div>
        </div>
        <div class="inquiry-message">${escapeHtml(item.message || "No written message was submitted.")}</div>
        ${Object.keys(item.payload || {}).length ? `<details class="inquiry-payload"><summary>Submitted form details</summary><pre>${escapeHtml(JSON.stringify(item.payload, null, 2))}</pre></details>` : ""}
        <div class="inquiry-modal__actions">
          ${phone ? `<a class="button button--primary" href="tel:${escapeHtml(phone)}">Call ${escapeHtml(formatPhone(item.phone))}</a>` : ""}
          ${email ? `<a class="button button--ghost" href="mailto:${encodeURIComponent(email)}?subject=${encodeURIComponent(`Re: ${subject}`)}">Reply by email</a>` : ""}
          ${item.is_read ? `<button class="button button--ghost" type="button" data-unread-inquiry="${item.id}">Mark unread</button>` : `<button class="button button--ghost" type="button" data-read-inquiry="${item.id}">Mark read</button>`}
          <button class="button button--ghost" type="button" data-inquiry-workflow="${item.id}" data-status="in_progress">Working</button>
          <button class="button button--ghost" type="button" data-inquiry-workflow="${item.id}" data-status="completed">Complete</button>
          <button class="button button--ghost" type="button" data-inquiry-workflow="${item.id}" data-status="spam">Spam</button>
        </div>
      </div>
    </section>
  </div>`);
  wireModal();
}

function wireCommonActions(root = document) {
  root.querySelectorAll("[data-open-inquiry]").forEach((button) => button.addEventListener("click", () => openInquiry(button.dataset.openInquiry).catch((error) => showToast(error.message, true))));
  root.querySelectorAll("[data-read-inquiry]").forEach((button) => button.addEventListener("click", async () => {
    button.disabled = true;
    try { await setRead(button.dataset.readInquiry, true); } catch (error) { button.disabled = false; showToast(error.message, true); }
  }));
  root.querySelectorAll("[data-unread-inquiry]").forEach((button) => button.addEventListener("click", async () => {
    button.disabled = true;
    try { await setRead(button.dataset.unreadInquiry, false); } catch (error) { button.disabled = false; showToast(error.message, true); }
  }));
  root.querySelectorAll("[data-inquiry-workflow]").forEach((button) => button.addEventListener("click", async () => {
    button.disabled = true;
    try { await patchInquiry(button.dataset.inquiryWorkflow, { status: button.dataset.status }, "Inquiry workflow updated."); } catch (error) { button.disabled = false; showToast(error.message, true); }
  }));
}

function wireModal() {
  const modal = document.querySelector(".inquiry-modal");
  if (!modal) return;
  modal.querySelector("[data-close-inquiry]")?.addEventListener("click", closeModal);
  modal.addEventListener("click", (event) => { if (event.target === modal) closeModal(); });
  wireCommonActions(modal);
}

function wireQueue() {
  const content = document.querySelector(".admin-content");
  if (!content) return;
  content.querySelector("[data-inquiry-search]")?.addEventListener("input", (event) => { state.filters.query = event.target.value; renderQueue(); });
  content.querySelector("[data-inquiry-read-filter]")?.addEventListener("change", (event) => { state.filters.read = event.target.value; renderQueue(); });
  content.querySelector("[data-inquiry-status-filter]")?.addEventListener("change", (event) => { state.filters.status = event.target.value; renderQueue(); });
  content.querySelector("[data-inquiry-type-filter]")?.addEventListener("change", (event) => { state.filters.type = event.target.value; renderQueue(); });
  content.querySelector("[data-refresh-inquiries]")?.addEventListener("click", async (event) => {
    event.currentTarget.disabled = true;
    try { await loadData(true); updateNavBadge(); renderQueue(); showToast("Inquiry queue refreshed."); } catch (error) { event.currentTarget.disabled = false; showToast(error.message, true); }
  });
  content.querySelector("[data-read-all]")?.addEventListener("click", async (event) => {
    const ids = state.data.submissions.filter((item) => !item.is_read && item.status !== "spam").map((item) => item.id);
    if (!ids.length) return;
    event.currentTarget.disabled = true;
    try {
      for (const id of ids) await setRead(id, true, "");
      showToast("All inquiries marked read.");
    } catch (error) { showToast(error.message, true); }
  });
  wireCommonActions(content);
}

async function enhance() {
  if (location.pathname !== "/admin") return;
  const layout = document.querySelector(".admin-layout");
  if (!layout || !session()?.access_token) return;
  addStyles();
  try {
    await loadData();
    updateNavBadge();
    const isInquiryTab = document.querySelector(".admin-topbar h1")?.textContent?.trim() === "Inquiries";
    const content = document.querySelector(".admin-content");
    if (isInquiryTab && content?.dataset.inquiryEnhancement !== ENHANCEMENT_VERSION) renderQueue();
  } catch (error) {
    console.error("Inquiry enhancement failed", error);
  }
}

function queueEnhance() {
  if (state.renderQueued) return;
  state.renderQueued = true;
  setTimeout(async () => {
    state.renderQueued = false;
    await enhance();
  }, 40);
}

const observer = new MutationObserver(queueEnhance);
observer.observe(document.documentElement, { childList: true, subtree: true });
window.addEventListener("pageshow", queueEnhance);
window.addEventListener("popstate", queueEnhance);
document.addEventListener("keydown", (event) => { if (event.key === "Escape") closeModal(); });
queueEnhance();
