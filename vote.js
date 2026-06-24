import { supabase } from './supabase-config.js';

const params  = new URLSearchParams(window.location.search);
const eventId = params.get('e');
const initialChoice = params.get('r');           // yes | no | maybe | null

const CHOICES = ['yes', 'no', 'maybe'];
const LABELS  = { yes: "you're coming 🎉", no: "you're not coming", maybe: "you're not sure yet" };
const COLORS  = { yes: '#16a34a', no: '#dc2626', maybe: '#d97706' };

const $ = (id) => document.getElementById(id);
const storageKey = `vote_${eventId}`;

let chart = null;

init();

async function init() {
  if (!eventId) return fail('This link is missing an event. Please use the buttons in your invitation email.');

  // Load the event.
  const { data: event, error } = await supabase
    .from('events').select('id, title, description, date_text').eq('id', eventId).single();
  if (error || !event) return fail('Sorry, this event could not be found. It may have been deleted.');

  $('eventTitle').textContent = event.title;
  $('eventWhen').textContent  = event.date_text || '';
  $('eventDesc').textContent  = event.description || '';

  // Record / update the vote if a choice came in via the URL.
  if (CHOICES.includes(initialChoice)) {
    await castVote(initialChoice);
  } else {
    // No choice in the link — just show results, plus confirmation if they voted before.
    const existing = await loadMyResponse();
    if (existing) showConfirm(existing.choice);
  }

  // Wire up the "change answer" buttons.
  document.querySelectorAll('.choice-buttons button').forEach((btn) => {
    btn.addEventListener('click', () => castVote(btn.dataset.choice));
  });

  // Wire up the name save.
  $('saveNameBtn').addEventListener('click', saveName);

  // Prefill name field from existing response.
  const mine = await loadMyResponse();
  if (mine?.name) $('nameInput').value = mine.name;

  show('loading', false);
  show('content', true);

  await render();
  subscribeRealtime();
}

// ── Voting ──────────────────────────────────────────────────────────────────
async function castVote(choice) {
  const existingId = localStorage.getItem(storageKey);

  if (existingId) {
    const { error, count } = await supabase
      .from('responses')
      .update({ choice, updated_at: new Date().toISOString() }, { count: 'exact' })
      .eq('id', existingId);
    // If the row was deleted on the server, fall back to inserting a fresh one.
    if (!error && count === 0) {
      localStorage.removeItem(storageKey);
      return castVote(choice);
    }
    if (error) return fail(error.message);
  } else {
    const { data, error } = await supabase
      .from('responses')
      .insert({ event_id: eventId, choice })
      .select('id')
      .single();
    if (error) return fail(error.message);
    localStorage.setItem(storageKey, data.id);
  }

  showConfirm(choice);
  await render();
}

async function saveName() {
  const id = localStorage.getItem(storageKey);
  if (!id) { msg('nameMsg', 'Pick an answer first, then add your name.', true); return; }
  const name = $('nameInput').value.trim() || null;
  const { error } = await supabase
    .from('responses').update({ name, updated_at: new Date().toISOString() }).eq('id', id);
  if (error) { msg('nameMsg', error.message, true); return; }
  msg('nameMsg', name ? 'Saved your name. ✅' : 'Saved as anonymous. ✅');
  await render();
}

async function loadMyResponse() {
  const id = localStorage.getItem(storageKey);
  if (!id) return null;
  const { data } = await supabase
    .from('responses').select('id, choice, name').eq('id', id).maybeSingle();
  if (!data) { localStorage.removeItem(storageKey); return null; }
  return data;
}

// ── Rendering ────────────────────────────────────────────────────────────────
function showConfirm(choice) {
  $('confirm').innerHTML =
    `<div class="notice">Thanks — ${LABELS[choice]}. You can change your answer below.</div>`;
  document.querySelectorAll('.choice-buttons button').forEach((btn) =>
    btn.classList.toggle('active', btn.dataset.choice === choice));
}

async function render() {
  const { data: rows } = await supabase
    .from('responses').select('choice, name').eq('event_id', eventId);

  const counts = { yes: 0, no: 0, maybe: 0 };
  const names  = { yes: [], no: [], maybe: [] };
  for (const r of (rows || [])) {
    if (counts[r.choice] == null) continue;
    counts[r.choice]++;
    names[r.choice].push(r.name || 'Anonymous');
  }

  $('cYes').textContent = counts.yes;
  $('cNo').textContent = counts.no;
  $('cMaybe').textContent = counts.maybe;

  // Names breakdown
  const list = [];
  if (names.yes.length)   list.push(`<li><b>Coming:</b> ${esc(names.yes.join(', '))}</li>`);
  if (names.no.length)    list.push(`<li><b>Not coming:</b> ${esc(names.no.join(', '))}</li>`);
  if (names.maybe.length) list.push(`<li><b>Maybe:</b> ${esc(names.maybe.join(', '))}</li>`);
  $('namesList').innerHTML = list.join('');

  drawChart(counts);
}

function drawChart(counts) {
  const ctx = $('pie');
  const data = {
    labels: ['Coming', 'Not coming', 'Maybe'],
    datasets: [{
      data: [counts.yes, counts.no, counts.maybe],
      backgroundColor: [COLORS.yes, COLORS.no, COLORS.maybe],
    }],
  };
  if (chart) { chart.data = data; chart.update(); return; }
  chart = new Chart(ctx, {
    type: 'pie',
    data,
    options: { plugins: { legend: { position: 'bottom' } } },
  });
}

function subscribeRealtime() {
  supabase
    .channel(`responses-${eventId}`)
    .on('postgres_changes',
      { event: '*', schema: 'public', table: 'responses', filter: `event_id=eq.${eventId}` },
      () => render())
    .subscribe();
}

// ── Utils ────────────────────────────────────────────────────────────────────
function show(id, on) { $(id).classList.toggle('hidden', !on); }
function msg(id, text, isError = false) {
  $(id).innerHTML = text ? `<div class="notice ${isError ? 'error' : ''}">${text}</div>` : '';
}
function fail(text) {
  show('loading', false);
  show('content', false);
  show('errorCard', true);
  $('errorMsg').textContent = text;
}
function esc(s) {
  return String(s).replaceAll('&', '&amp;').replaceAll('<', '&lt;').replaceAll('>', '&gt;');
}
