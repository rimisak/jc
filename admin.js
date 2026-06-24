import { supabase } from './supabase-config.js';

// ── Element refs ────────────────────────────────────────────────────────────
const loginCard     = document.getElementById('loginCard');
const createCard    = document.getElementById('createCard');
const eventsSection = document.getElementById('eventsSection');
const eventsList    = document.getElementById('eventsList');
const signOutBtn    = document.getElementById('signOutBtn');

const emailInput = document.getElementById('email');
const sendLinkBtn = document.getElementById('sendLinkBtn');
const loginMsg   = document.getElementById('loginMsg');

const titleInput = document.getElementById('title');
const descInput  = document.getElementById('desc');
const dateInput  = document.getElementById('dateText');
const createBtn  = document.getElementById('createBtn');
const createMsg  = document.getElementById('createMsg');

// Absolute URL to vote.html on this same site (works locally and on GitHub Pages).
const VOTE_URL = new URL('vote.html', window.location.href).href;

let currentUser = null;

// ── Helpers ─────────────────────────────────────────────────────────────────
function msg(el, text, isError = false) {
  el.innerHTML = text
    ? `<div class="notice ${isError ? 'error' : ''}">${text}</div>`
    : '';
}
function show(el, on) { el.classList.toggle('hidden', !on); }

function embedHtml(eventId) {
  const link = (choice) => `${VOTE_URL}?e=${eventId}&r=${choice}`;
  return `<table role="presentation" cellpadding="0" cellspacing="0" style="margin:16px 0">
  <tr>
    <td style="padding:0 6px">
      <a href="${link('yes')}" style="background:#16a34a;color:#fff;padding:12px 20px;border-radius:8px;text-decoration:none;font-family:sans-serif;display:inline-block">✅ I'm coming</a>
    </td>
    <td style="padding:0 6px">
      <a href="${link('no')}" style="background:#dc2626;color:#fff;padding:12px 20px;border-radius:8px;text-decoration:none;font-family:sans-serif;display:inline-block">❌ I'm not coming</a>
    </td>
    <td style="padding:0 6px">
      <a href="${link('maybe')}" style="background:#d97706;color:#fff;padding:12px 20px;border-radius:8px;text-decoration:none;font-family:sans-serif;display:inline-block">🤔 I don't know yet</a>
    </td>
  </tr>
</table>`;
}

// ── Auth ────────────────────────────────────────────────────────────────────
sendLinkBtn.addEventListener('click', async () => {
  const email = emailInput.value.trim();
  if (!email) { msg(loginMsg, 'Please enter your email.', true); return; }
  sendLinkBtn.disabled = true;
  const { error } = await supabase.auth.signInWithOtp({
    email,
    options: { emailRedirectTo: window.location.href },
  });
  sendLinkBtn.disabled = false;
  if (error) { msg(loginMsg, error.message, true); return; }
  msg(loginMsg, `Check your inbox — we sent a sign-in link to <b>${email}</b>.`);
});

signOutBtn.addEventListener('click', async () => {
  await supabase.auth.signOut();
});

function applySession(session) {
  currentUser = session?.user ?? null;
  const signedIn = !!currentUser;
  show(loginCard, !signedIn);
  show(createCard, signedIn);
  show(eventsSection, signedIn);
  show(signOutBtn, signedIn);
  if (signedIn) loadEvents();
}

supabase.auth.getSession().then(({ data }) => applySession(data.session));
supabase.auth.onAuthStateChange((_event, session) => applySession(session));

// ── Create event ────────────────────────────────────────────────────────────
createBtn.addEventListener('click', async () => {
  const title = titleInput.value.trim();
  if (!title) { msg(createMsg, 'A title is required.', true); return; }
  createBtn.disabled = true;
  const { error } = await supabase.from('events').insert({
    title,
    description: descInput.value.trim() || null,
    date_text: dateInput.value.trim() || null,
    owner_id: currentUser.id,
  });
  createBtn.disabled = false;
  if (error) { msg(createMsg, error.message, true); return; }
  titleInput.value = descInput.value = dateInput.value = '';
  msg(createMsg, 'Event created. ✅');
  loadEvents();
});

// ── Load + render events ─────────────────────────────────────────────────────
async function loadEvents() {
  const { data: events, error } = await supabase
    .from('events')
    .select('id, title, description, date_text, created_at')
    .order('created_at', { ascending: false });

  if (error) { eventsList.innerHTML =
    `<div class="notice error">${error.message}</div>`; return; }

  if (!events.length) {
    eventsList.innerHTML = '<p class="muted">No events yet. Create one above.</p>';
    return;
  }

  // Fetch all responses for these events in one go, then tally per event.
  const ids = events.map(e => e.id);
  const { data: responses } = await supabase
    .from('responses')
    .select('event_id, choice')
    .in('event_id', ids);

  const tally = {};
  for (const id of ids) tally[id] = { yes: 0, no: 0, maybe: 0 };
  for (const r of (responses || [])) {
    if (tally[r.event_id] && tally[r.event_id][r.choice] != null)
      tally[r.event_id][r.choice]++;
  }

  eventsList.innerHTML = '';
  for (const ev of events) {
    const t = tally[ev.id];
    const node = document.createElement('div');
    node.className = 'event';
    node.innerHTML = `
      <h3>${escapeHtml(ev.title)}</h3>
      ${ev.date_text ? `<p class="muted">${escapeHtml(ev.date_text)}</p>` : ''}
      ${ev.description ? `<p>${escapeHtml(ev.description)}</p>` : ''}
      <div class="counts">
        <span class="pill"><span class="dot yes"></span> Coming: <b>${t.yes}</b></span>
        <span class="pill"><span class="dot no"></span> Not coming: <b>${t.no}</b></span>
        <span class="pill"><span class="dot maybe"></span> Maybe: <b>${t.maybe}</b></span>
      </div>
      <div class="row">
        <button class="secondary copyBtn">Copy email HTML</button>
        <a class="ghost" href="vote.html?e=${ev.id}" target="_blank">Open results page ↗</a>
        <div class="spacer"></div>
        <button class="danger delBtn">Delete event</button>
      </div>
      <div class="embedWrap hidden"></div>
    `;

    const copyBtn   = node.querySelector('.copyBtn');
    const delBtn    = node.querySelector('.delBtn');
    const embedWrap = node.querySelector('.embedWrap');

    copyBtn.addEventListener('click', async () => {
      const html = embedHtml(ev.id);
      embedWrap.classList.remove('hidden');
      embedWrap.innerHTML =
        `<p class="muted" style="margin-top:12px">Paste this into your email (as HTML):</p>
         <div class="embed">${escapeHtml(html)}</div>`;
      try {
        await navigator.clipboard.writeText(html);
        copyBtn.textContent = 'Copied! ✅';
        setTimeout(() => (copyBtn.textContent = 'Copy email HTML'), 1800);
      } catch {
        copyBtn.textContent = 'Select & copy below';
      }
    });

    delBtn.addEventListener('click', async () => {
      if (!confirm(`Delete "${ev.title}" and all its responses? This cannot be undone.`))
        return;
      const { error } = await supabase.from('events').delete().eq('id', ev.id);
      if (error) { alert(error.message); return; }
      loadEvents();
    });

    eventsList.appendChild(node);
  }
}

function escapeHtml(s) {
  return String(s)
    .replaceAll('&', '&amp;').replaceAll('<', '&lt;').replaceAll('>', '&gt;')
    .replaceAll('"', '&quot;').replaceAll("'", '&#39;');
}
