// ============================================================
// Khidma v2 - Shared Config & Helpers
// ============================================================

const firebaseConfig = {
  apiKey: "AIzaSyAEQBtH17bSQlQB4yo_GpafON-zVYPhSOU",
  authDomain: "khidma-collection.firebaseapp.com",
  databaseURL: "https://khidma-collection-default-rtdb.europe-west1.firebasedatabase.app",
  projectId: "khidma-collection",
  storageBucket: "khidma-collection.firebasestorage.app",
  messagingSenderId: "584689635009",
  appId: "1:584689635009:web:d06123de63e8b6dac20e40"
};

const ADMIN_PASSWORD = "khidma2026";  // ← CHANGE THIS
const V2_ROOT = 'khidma_v2';  // Firebase root for v2 data

// ============================================================
// Auth
// ============================================================
function checkAuth() {
  if (sessionStorage.getItem('khidma_auth') === 'ok') return true;
  const pw = prompt('🔒 كلمة السر:');
  if (pw === ADMIN_PASSWORD) {
    sessionStorage.setItem('khidma_auth', 'ok');
    return true;
  }
  document.body.innerHTML = '<div style="padding:40px;text-align:center;font-family:sans-serif">كلمة سر خاطئة. <a href="home.html">رجوع</a></div>';
  return false;
}
function logout() { sessionStorage.removeItem('khidma_auth'); location.href = 'home.html'; }

// ============================================================
// Firebase
// ============================================================
let db;
function initFirebase() {
  if (!firebase.apps.length) firebase.initializeApp(firebaseConfig);
  db = firebase.database();
  return db;
}
function ref(path) { return db.ref(`${V2_ROOT}/${path}`); }

// ============================================================
// Utilities
// ============================================================
function uid() { return crypto.randomUUID().replace(/-/g, '').slice(0, 12); }

function fmt(n) { return new Intl.NumberFormat('en-US').format(Math.round(n||0)); }

function currentMonth() {
  const d = new Date();
  return `${d.getFullYear()}-${String(d.getMonth()+1).padStart(2,'0')}`;
}

// ============================================================
// Smart Month Chip — shared across all pages
// ============================================================
function getWorkingMonth() {
  const urlMonth = new URLSearchParams(location.search).get('month');
  if (urlMonth && /^\d{4}-\d{2}$/.test(urlMonth)) {
    sessionStorage.setItem('khidma_month', urlMonth);
    return urlMonth;
  }
  const stored = sessionStorage.getItem('khidma_month');
  if (stored && /^\d{4}-\d{2}$/.test(stored)) return stored;
  return currentMonth();
}

function setWorkingMonth(ym) {
  sessionStorage.setItem('khidma_month', ym);
}

function addMonths(ym, delta) {
  const [y, m] = ym.split('-').map(Number);
  const d = new Date(y, m - 1 + delta, 1);
  return `${d.getFullYear()}-${String(d.getMonth()+1).padStart(2,'0')}`;
}

async function getMonthStatus(ym) {
  const real = currentMonth();
  try {
    const snap = await ref(`months/${ym}/status`).once('value');
    const status = snap.val();
    if (status === 'closed') return 'closed';
  } catch(e) {}
  if (ym < real) return 'past';
  if (ym === real) return 'current';
  return 'future';
}

/**
 * Renders the Smart Month Chip — a styled native <select> that always works.
 * container: DOM element ID (string) — a <span> or <div> in topbar .right
 * onChange(ym): callback when month changes (falls back to location.reload)
 */
async function renderMonthChip(containerId, onChange) {
  const el = document.getElementById(containerId);
  if (!el) return;
  const active = getWorkingMonth();
  const real = currentMonth();

  const months = [];
  for (let i = -3; i <= 2; i++) months.push(addMonths(real, i));

  let statusList;
  try {
    statusList = await Promise.all(months.map(m => getMonthStatus(m)));
  } catch(e) {
    // Fallback if Firebase not ready — use simple date-based status
    statusList = months.map(m => m === real ? 'current' : (m < real ? 'past' : 'future'));
  }

  const statusIcon = { closed: '🔒', past: '📄', current: '✅', future: '📅' };
  const statusText = { closed: 'مقفل', past: 'مسودة', current: 'الحالي', future: 'مستقبل' };

  const activeIdx = months.indexOf(active);
  const activeStatus = (activeIdx >= 0 ? statusList[activeIdx] : null) || (active === real ? 'current' : (active < real ? 'past' : 'future'));
  const borderColor = activeStatus === 'current' ? '#86efac' : (activeStatus === 'closed' ? '#cbd5e1' : (activeStatus === 'future' ? '#93c5fd' : '#fcd34d'));

  const opts = months.map((m, i) => {
    const s = statusList[i];
    const sel = m === active ? 'selected' : '';
    return `<option value="${m}" ${sel}>${statusIcon[s]} ${arabicMonth(m)} — ${statusText[s]}</option>`;
  }).join('');

  // Visible, standalone <select> styled to look like a chip — bulletproof
  el.innerHTML = `
    <select id="_mcSel" onchange="pickMonth(this.value)" title="غيّر الشهر النشط" style="
      display:inline-flex;align-items:center;
      background:rgba(255,255,255,0.18);color:#fff;
      padding:7px 26px 7px 12px;border-radius:20px;
      border:1.5px solid ${borderColor};
      font-family:inherit;font-weight:700;font-size:12.5px;
      cursor:pointer;outline:none;
      appearance:none;-webkit-appearance:none;-moz-appearance:none;
      background-image:url('data:image/svg+xml;utf8,<svg xmlns=%22http://www.w3.org/2000/svg%22 width=%2210%22 height=%2210%22 viewBox=%220 0 10 10%22><path d=%22M2 4l3 3 3-3%22 stroke=%22white%22 fill=%22none%22 stroke-width=%221.5%22 stroke-linecap=%22round%22/></svg>');
      background-repeat:no-repeat;background-position:left 10px center;
      direction:rtl;margin:0 4px;transition:all 150ms;
    " onmouseover="this.style.background='rgba(255,255,255,0.28)'" onmouseout="this.style.background='rgba(255,255,255,0.18)'">
      ${opts}
    </select>
  `;
  window._monthChipOnChange = onChange;
  renderMonthSafetyBanner(active, real);
}

function renderMonthSafetyBanner(active, real) {
  let banner = document.getElementById('monthSafetyBanner');
  if (!banner) {
    banner = document.createElement('div');
    banner.id = 'monthSafetyBanner';
    banner.style.cssText = 'display:none;background:#fdf7e3;border-bottom:3px solid #b8860b;padding:10px 20px;text-align:center;font-size:13px;color:#6d4e00;position:sticky;top:0;z-index:5;font-weight:600';
    const topbar = document.querySelector('.topbar');
    if (topbar) topbar.insertAdjacentElement('afterend', banner);
    else document.body.insertBefore(banner, document.body.firstChild);
  }
  if (active !== real) {
    banner.style.display = 'block';
    banner.innerHTML = `⚠️ أنت تعمل على <b>${arabicMonth(active)}</b> — ليس الشهر الحالي. <a href="javascript:void(0)" onclick="switchToCurrentMonth()" style="color:#1b4332;text-decoration:underline;margin-right:8px">◄ العودة لـ ${arabicMonth(real)}</a>`;
  } else {
    banner.style.display = 'none';
  }
}

function switchToCurrentMonth() {
  const real = currentMonth();
  setWorkingMonth(real);
  location.reload();
}

function pickMonth(ym) {
  setWorkingMonth(ym);
  if (window._monthChipOnChange) window._monthChipOnChange(ym);
  else location.reload();
}

function arabicMonth(ym) {
  if (!ym) return '';
  const [y,m] = ym.split('-').map(Number);
  const names = ['يناير','فبراير','مارس','أبريل','مايو','يونيو','يوليو','أغسطس','سبتمبر','أكتوبر','نوفمبر','ديسمبر'];
  return `${names[m-1]} ${y}`;
}

function areaDisplay(slug) {
  return (slug || '').replace(/_/g, ' ');
}

function caseTypeDisplay(slug) {
  return (slug || '').replace(/_/g, ' ');
}

// ============================================================
// Audit log
// ============================================================
async function auditLog(action, path, before, after, extra={}) {
  await ref('audit').push({
    ts: Date.now(),
    author: 'youssef',
    action, path,
    before: before ?? null,
    after: after ?? null,
    ...extra
  });
}

// ============================================================
// Backup system
// ============================================================
async function createFullBackup({silent=false, snapshotOnly=false}={}) {
  if (!silent) toast('جاري عمل النسخة الاحتياطية...', 'info');
  try {
    const snap = await ref('').once('value');
    const data = snap.val() || {};
    const counts = {
      people: Object.keys(data.people||{}).length,
      kafalat: Object.keys(data.kafalat||{}).length,
      months: Object.keys(data.months||{}).length
    };
    const ts = new Date().toISOString().replace(/[:.]/g,'-');
    await ref(`backups/${ts}`).set({ts: Date.now(), counts, snapshot: data});
    if (!snapshotOnly) {
      const blob = new Blob([JSON.stringify({ts:Date.now(), counts, data}, null, 2)], {type:'application/json'});
      const a = document.createElement('a');
      a.href = URL.createObjectURL(blob);
      a.download = `khidma-v2-backup-${ts}.json`;
      a.click();
    }
    if (!silent) toast(`✓ ${counts.people} أشخاص، ${counts.kafalat} كفالة`, 'success');
    return data;
  } catch(e) {
    toast('فشل النسخ الاحتياطي: ' + e.message, 'error');
    throw e;
  }
}

// ============================================================
// Toast
// ============================================================
function toast(msg, type='info') {
  const t = document.createElement('div');
  t.className = 'toast toast-' + type;
  t.textContent = msg;
  document.body.appendChild(t);
  requestAnimationFrame(() => t.classList.add('show'));
  setTimeout(() => { t.classList.remove('show'); setTimeout(()=>t.remove(), 300); }, 3500);
}

// ============================================================
// Impact confirmation modal
// Always appears on top of any other modals (z-index 9999+)
// ============================================================
function confirmImpact({title='تأكيد', message='', impact=[], danger=false}={}) {
  return new Promise(resolve => {
    const bg = document.createElement('div');
    bg.className = 'modal-bg';
    // Compute z-index above any existing modals (base 9000 ensures top)
    const existingModals = document.querySelectorAll('.modal-bg');
    bg.style.zIndex = 9000 + existingModals.length;
    bg.innerHTML = `
      <div class="modal">
        <h3 style="color:${danger?'var(--danger)':'var(--accent)'}">${title}</h3>
        <p style="color:var(--muted);line-height:1.6">${message}</p>
        ${impact.length ? `
          <div style="background:${danger?'#fef3f2':'#f5f8f6'};border-right:4px solid ${danger?'var(--danger)':'var(--accent)'};padding:14px 18px;border-radius:8px;margin:12px 0">
            <div style="font-weight:600;font-size:13px;margin-bottom:6px;color:var(--ink)">التأثير:</div>
            <ul style="margin:0;padding-right:22px;font-size:13px;line-height:1.8;color:var(--ink)">
              ${impact.map(i => `<li>${i}</li>`).join('')}
            </ul>
          </div>` : ''}
        <div class="modal-actions">
          <button class="${danger?'btn-danger':'btn-primary'}" id="_cy">${danger?'نعم، متأكد':'تأكيد'}</button>
          <button class="btn-ghost" id="_cn">إلغاء</button>
        </div>
      </div>`;
    document.body.appendChild(bg);
    bg.querySelector('#_cy').onclick = ()=>{ bg.remove(); resolve(true); };
    bg.querySelector('#_cn').onclick = ()=>{ bg.remove(); resolve(false); };
    bg.addEventListener('click', e=>{ if(e.target===bg){ bg.remove(); resolve(false); }});
  });
}

// ============================================================
// Data helpers (v2 schema)
// ============================================================
async function fetchPeople() {
  const s = await ref('people').once('value');
  return s.val() || {};
}
async function fetchKafalat() {
  const s = await ref('kafalat').once('value');
  return s.val() || {};
}
async function fetchConfig() {
  const s = await ref('config').once('value');
  return s.val() || {};
}

function personName(people, pid) {
  if (!pid) return '—';
  return (people[pid] && people[pid].name) || '—';
}

function kafalaBaseAmount(kafala) {
  return (kafala.funding || []).reduce((s,f) => s + (f.amount||0), 0);
}

function isPrepaidFor(kafala, ym) {
  // Returns true if ALL funding sources are prepaid through at least this month
  return (kafala.funding || []).every(f => f.prepaid_through && f.prepaid_through >= ym);
}

function hasAnyPrepaid(kafala, ym) {
  return (kafala.funding || []).some(f => f.prepaid_through && f.prepaid_through >= ym);
}
