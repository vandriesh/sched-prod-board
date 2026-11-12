import { fetchIncidents, ack } from './api.js';

const REFRESH_MS = 2000; // R4

const board = document.querySelector('[data-testid="board"]');
const list = document.querySelector('[data-testid="incident-list"]');
const loader = document.querySelector('[data-testid="loader"]');
const empty = document.querySelector('[data-testid="empty"]');

// id -> <li>. Rows are kept, not re-drawn, so a refresh never wipes an acked mark
// or moves a button out from under a click (R1, R2).
const rows = new Map();
const acked = new Set();

// R5: the viewer's own zone and order. `undefined` = the browser's locale, so en-GB/de/fr get dd/mm.
const fmt = new Intl.DateTimeFormat(undefined, {
  day: '2-digit',
  month: '2-digit',
  hour: '2-digit',
  minute: '2-digit',
  timeZoneName: 'short',
});

function esc(s) {
  return String(s).replace(/[&<>"']/g, (c) => ({ '&': '&amp;', '<': '&lt;', '>': '&gt;', '"': '&quot;', "'": '&#39;' })[c]);
}

function localTime(iso) {
  const d = new Date(iso);
  return Number.isNaN(d.getTime()) ? iso : fmt.format(d);
}

function makeRow(i) {
  const li = document.createElement('li');
  li.setAttribute('data-testid', 'incident-row');
  li.dataset.id = i.id;
  li.className = `row ${esc(i.severity)}`;
  li.innerHTML = `
    <span class="id">${esc(i.id)}</span>
    <span class="sev">${esc(i.severity)}</span>
    <span class="what">${esc(i.service)} · ${esc(i.region)} · ${esc(i.summary)}</span>
    <time datetime="${esc(i.openedAt)}" title="${esc(i.openedAt)}">${esc(localTime(i.openedAt))}</time>
    <span class="act"><button type="button" data-testid="ack">Ack</button></span>`;
  li.querySelector('[data-testid="ack"]').addEventListener('click', () => onAck(i.id, li));
  return li;
}

function markAcked(li, reply) {
  const act = li.querySelector('.act');
  const t = reply?.ackedAt ? ` ${localTime(reply.ackedAt)}` : '';
  act.innerHTML = `<span data-testid="acked" class="acked">✓ acked${esc(t)}</span>`;
  li.classList.add('is-acked');
}

async function onAck(id, li) {
  if (acked.has(id)) return;
  const btn = li.querySelector('[data-testid="ack"]');
  btn.disabled = true;
  btn.textContent = 'Acking…';
  try {
    const reply = await ack(id);
    acked.add(id);
    markAcked(li, reply);
  } catch (err) {
    console.error(err);
    btn.disabled = false;
    btn.textContent = 'Retry ack';
  }
}

function render(incidents) {
  // Newest first, whatever order the API sends (R1).
  const sorted = [...incidents].sort((a, b) => Date.parse(b.openedAt) - Date.parse(a.openedAt));
  const live = new Set(sorted.map((i) => i.id));
  for (const [id, li] of rows) {
    if (!live.has(id)) {
      li.remove();
      rows.delete(id);
    }
  }
  // Put rows in order; existing rows are moved, not rebuilt. New ones land on top.
  let prev = null;
  for (const i of sorted) {
    let li = rows.get(i.id);
    if (!li) {
      li = makeRow(i);
      li.classList.add('is-new');
      setTimeout(() => li.classList.remove('is-new'), 1500);
      rows.set(i.id, li);
    }
    const want = prev ? prev.nextSibling : list.firstChild;
    if (li !== want) list.insertBefore(li, want);
    prev = li;
  }
  empty.hidden = sorted.length > 0;
  list.hidden = sorted.length === 0;
}

let firstLoad = true;
let busy = false;
async function tick() {
  if (busy) return;
  busy = true;
  try {
    const page = await fetchIncidents();
    render(page.incidents);
    board.dataset.updatedAt = page.updatedAt;
    if (firstLoad) {
      firstLoad = false;
      loader.remove(); // R3: gone once incidents load
      board.setAttribute('aria-busy', 'false');
    }
  } catch (err) {
    console.error(err);
  } finally {
    busy = false;
  }
}

await tick();
setInterval(tick, REFRESH_MS); // R4: every 2 s while open
