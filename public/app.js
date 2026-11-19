const GAME_META = {
  genshin: { name: '原神', color: '#63d8c4', short: 'GI', label: '原神', rarity: '五星' },
  hsr: { name: '崩坏：星穹铁道', color: '#9b8cff', short: 'HSR', label: '星穹铁道', rarity: '五星' },
  zzz: { name: '绝区零', color: '#f4d34d', short: 'ZZZ', label: '绝区零', rarity: '五星' },
  arknights: { name: '明日方舟', color: '#d9b96e', short: 'AK', label: '明日方舟', rarity: '六星' },
  endfield: { name: '明日方舟：终末地', color: '#7fd0c9', short: 'EF', label: '终末地', rarity: '六星' },
  nte: { name: '异环', color: '#e2a15c', short: 'NTE', label: '异环', rarity: 'S级' },
  hi3: { name: '崩坏3', color: '#8fc7ff', short: 'HI3', label: '崩坏3', rarity: '五星' },
  tot: { name: '未定事件簿', color: '#e8a6c8', short: 'TOT', label: '未定事件簿', rarity: '五星' },
};
const GAME_ORDER = ['genshin', 'hsr', 'zzz', 'arknights', 'endfield', 'nte', 'hi3', 'tot'];
function topLabel(game = state.game) { return GAME_META[game]?.rarity || '五星'; }
const ICONS = {
  overview: '<svg viewBox="0 0 24 24"><path d="M4 19V9m5 10V5m5 14v-7m5 7V3"/></svg>',
  records: '<svg viewBox="0 0 24 24"><path d="M5 4h14v16H5zM8 8h8M8 12h8M8 16h5"/></svg>',
  import: '<svg viewBox="0 0 24 24"><path d="M12 3v12m0 0 4-4m-4 4-4-4M5 19h14"/></svg>',
  catalog: '<svg viewBox="0 0 24 24"><path d="M4 5.5A2.5 2.5 0 0 1 6.5 3H20v16H6.5A2.5 2.5 0 0 0 4 21.5zM4 5.5v16M8 7h8"/></svg>',
  settings: '<svg viewBox="0 0 24 24"><path d="M12 15.2a3.2 3.2 0 1 0 0-6.4 3.2 3.2 0 0 0 0 6.4Z"/><path d="M19.4 15a1.7 1.7 0 0 0 .34 1.88l.06.06-2.83 2.83-.06-.06a1.7 1.7 0 0 0-1.88-.34 1.7 1.7 0 0 0-1.03 1.56V21h-4v-.09A1.7 1.7 0 0 0 8.95 19.4a1.7 1.7 0 0 0-1.88.34l-.06.06-2.83-2.83.06-.06A1.7 1.7 0 0 0 4.6 15a1.7 1.7 0 0 0-1.56-1.03H3v-4h.09A1.7 1.7 0 0 0 4.6 8.95a1.7 1.7 0 0 0-.34-1.88L4.2 7l2.83-2.83.06.06A1.7 1.7 0 0 0 8.95 4.6 1.7 1.7 0 0 0 9.98 3.04V3h4v.09A1.7 1.7 0 0 0 15 4.6a1.7 1.7 0 0 0 1.88-.34l.06-.06L19.77 7l-.06.06A1.7 1.7 0 0 0 19.4 8.95a1.7 1.7 0 0 0 1.56 1.03H21v4h-.09A1.7 1.7 0 0 0 19.4 15Z"/></svg>',
  spark: '<svg viewBox="0 0 24 24"><path d="m12 3 1.9 5.1L19 10l-5.1 1.9L12 17l-1.9-5.1L5 10l5.1-1.9z"/></svg>',
  link: '<svg viewBox="0 0 24 24"><path d="M10 13a5 5 0 0 0 7.5.5l2-2a5 5 0 0 0-7-7l-1.2 1.2M14 11a5 5 0 0 0-7.5-.5l-2 2a5 5 0 0 0 7 7l1.2-1.2"/></svg>',
  upload: '<svg viewBox="0 0 24 24"><path d="M12 16V4m0 0L7 9m5-5 5 5M4 16v3a1 1 0 0 0 1 1h14a1 1 0 0 0 1-1v-3"/></svg>',
  qr: '<svg viewBox="0 0 24 24"><path d="M4 4h6v6H4zM14 4h6v6h-6zM4 14h6v6H4zM14 14h2v2h-2zM18 14h2v2h-2zM14 18h2v2h-2zM18 18h2v2h-2z"/></svg>',
  image: '<svg viewBox="0 0 24 24"><rect x="3" y="4" width="18" height="16" rx="2"/><circle cx="8.5" cy="9.5" r="1.5"/><path d="m4 18 5-5 4 4 3-3 4 4"/></svg>',
  download: '<svg viewBox="0 0 24 24"><path d="M12 3v12m0 0 4-4m-4 4-4-4M5 21h14"/></svg>',
  refresh: '<svg viewBox="0 0 24 24"><path d="M20 11a8 8 0 1 0-2.34 5.66M20 4v7h-7"/></svg>',
  warn: '<svg viewBox="0 0 24 24"><path d="M12 3 2.5 20h19zM12 9v5m0 3h.01"/></svg>',
  shield: '<svg viewBox="0 0 24 24"><path d="M12 3 4 6v5c0 5 3.4 8.4 8 10 4.6-1.6 8-5 8-10V6z"/><path d="m9 12 2 2 4-4"/></svg>',
  search: '<svg viewBox="0 0 24 24"><circle cx="11" cy="11" r="7"/><path d="m20 20-4-4"/></svg>',
  close: '<svg viewBox="0 0 24 24"><path d="m6 6 12 12M18 6 6 18"/></svg>',
};

const state = {
  shell: null,
  game: 'genshin',
  view: 'dashboard',
  dashboard: null,
  catalog: null,
  catalogFilter: { search: '', type: 'all', rarity: 'all' },
  records: null,
  recordFilter: { search: '', pool: 'all', source: 'all', page: 1 },
  importTab: 'auto',
  scan: null,
  pendingLink: null,
  ocr: null,
  qr: null,
  qrTimer: null,
  authTimer: null,
  snapshots: null,
  gameOrder: ['genshin', 'hsr', 'zzz', 'arknights', 'endfield', 'nte', 'hi3', 'tot'],
  hiddenGames: [],
  collector: null,
  collectorTimer: null,
  collectorSeen: '',
  iconMatch: null,
  iconIndex: {},
  update: null,
  nteCapture: { path: '', mode: '', status: '', timer: null, startedAt: 0 },
  manualFilters: {},
  manualMode: 'single',
  auth: { sessionId: '', status: '', url: '', user: null, rolesByGame: {}, errors: {}, startedAt: 0 },
  authTab: 'miyoushe',
  accountTab: 'accounts',
  banners: null,
  thirdparty: {
    status: null,
    loading: false,
    error: '',
    qr: null,
    qrTimer: null,
    message: '',
    endfieldUrls: [],
    endfieldPreview: null,
    endfieldText: '',
    tajiduo: { deviceId: '', phone: '', code: '', sent: false, message: '' },
  },
  busy: false,
};

const $ = (sel, root = document) => root.querySelector(sel);
const $$ = (sel, root = document) => [...root.querySelectorAll(sel)];
const esc = (v) => String(v ?? '').replace(/[&<>"']/g, (c) => ({ '&': '&amp;', '<': '&lt;', '>': '&gt;', '"': '&quot;', "'": '&#39;' }[c]));
const attr = (v) => esc(v).replace(/`/g, '&#96;');
const fmt = (n) => new Intl.NumberFormat('zh-CN').format(Number(n) || 0);
const pct = (n, digits = 1) => `${(Number(n || 0) * 100).toFixed(digits)}%`;
const dateShort = (s) => String(s || '').slice(5, 10);
const dateFull = (s) => String(s || '').slice(0, 16);
const timeAgo = (iso) => {
  if (!iso) return '尚未同步';
  const diff = Date.now() - Date.parse(iso);
  if (!Number.isFinite(diff)) return '尚未同步';
  if (diff < 60000) return '刚刚';
  if (diff < 3600000) return `${Math.floor(diff / 60000)} 分钟前`;
  if (diff < 86400000) return `${Math.floor(diff / 3600000)} 小时前`;
  return `${Math.floor(diff / 86400000)} 天前`;
};

function toast(message, type = 'ok', ms = 3600) {
  const root = $('#toast-root');
  const el = document.createElement('div');
  el.className = `toast ${type}`;
  el.innerHTML = `<span class="toast-icon">${type === 'err' ? '!' : '✓'}</span><span>${esc(message)}</span>`;
  root.innerHTML = '';
  root.appendChild(el);
  setTimeout(() => { el.style.opacity = '0'; el.style.transform = 'translateY(8px)'; el.style.transition = '.25s'; setTimeout(() => el.remove(), 250); }, ms);
}

async function api(path, options = {}) {
  const res = await fetch(path, {
    ...options,
    headers: { ...(options.body ? { 'Content-Type': 'application/json' } : {}), ...(options.headers || {}) },
  });
  let data;
  try { data = await res.json(); } catch { throw new Error(`服务器返回了无效响应（HTTP ${res.status}）`); }
  if (!res.ok || data.ok === false) throw new Error(data.message || `请求失败（HTTP ${res.status}）`);
  return data;
}

function openModal(html, { wide = false } = {}) {
  $('#modal-root').innerHTML = `<div class="modal-backdrop"><div class="modal" style="${wide ? 'width:min(900px,100%)' : ''}">${html}</div></div>`;
  const close = () => { $('#modal-root').innerHTML = ''; };
  $('.modal-backdrop')?.addEventListener('click', (e) => { if (e.target.classList.contains('modal-backdrop')) close(); });
  $('.modal [data-close]')?.addEventListener('click', close);
  return { close, el: $('.modal') };
}

function confirmDialog(title, description, confirmText = '确认') {
  return new Promise((resolve) => {
    const modal = openModal(`
      <h2>${esc(title)}</h2>
      <p>${description}</p>
      <div class="modal-actions">
        <button class="ghost-btn" data-close>取消</button>
        <button class="primary-btn" data-confirm>${esc(confirmText)}</button>
      </div>`);
    $('[data-confirm]').onclick = () => { modal.close(); resolve(true); };
    $('[data-close]').onclick = () => { modal.close(); resolve(false); };
  });
}

function setBusy(button, busy, label = '处理中') {
  if (!button) return;
  if (busy) {
    button.dataset.oldText = button.innerHTML;
    button.disabled = true;
    button.innerHTML = `<span class="spinner"></span>${esc(label)}…`;
  } else {
    button.disabled = false;
    if (button.dataset.oldText) button.innerHTML = button.dataset.oldText;
  }
}

function iconSvg(name, cls = '') { return `<span class="${cls}">${ICONS[name] || ''}</span>`; }

function catalogItem(name, itemId = '') {
  const items = state.catalog?.items || [];
  const norm = (v) => String(v || '').replace(/[「」『』·\s]/g, '').toLowerCase();
  const q = norm(name);
  return items.find((i) => i.id === String(itemId))
    || items.find((i) => norm(i.name) === q)
    || items.find((i) => (i.aliases || []).some((a) => norm(a) === q))
    || items.find((i) => q.length >= 2 && norm(i.name).includes(q))
    || null;
}

function itemIcon(name, itemId = '', size = '', rank = 5) {
  const item = catalogItem(name, itemId);
  const src = item?.iconUrl || '';
  const fallback = (name || '?').replace(/[「」]/g, '').slice(0, 1);
  return `<div class="item-icon ${size} ${rank === 5 ? 'rank-5' : ''} ${src ? '' : 'no-img'}"><span class="fallback">✦</span>${src ? `<img loading="lazy" src="${attr(src)}" alt="" onerror="this.remove();this.parentElement.classList.add('no-img')">` : ''}</div>`;
}

function itemRow(r, compact = false) {
  return `<div class="five-row">
    ${itemIcon(r.name, r.itemId, compact ? 'small' : '', r.rank)}
    <div class="item-meta">
      <div class="item-name">${esc(r.name)}</div>
      <div class="subline">${esc(r.poolName || '')} · ${esc(r.version || dateFull(r.time))}</div>
    </div>
    ${r.up ? `<span class="up-tag ${r.up}">${r.up === 'win' ? 'UP' : '歪'}</span>` : ''}
    <span class="pity-tag"><b>${r.pity ?? '—'}</b> 抽</span>
  </div>`;
}

function gameName(id = state.game) { return GAME_META[id]?.name || id; }

function emptyState() {
  const thirdParty = ['arknights', 'endfield', 'nte'].includes(state.game);
  return `<div class="empty-state">
    <div class="orb">${ICONS.spark}</div>
    <h2>暂无记录</h2>
    <div class="empty-actions">
      <button class="primary-btn" data-action="go" data-view="import" data-tab="${thirdParty ? 'sync' : 'auto'}">${thirdParty ? '官方同步' : '开始同步'}</button>
      ${thirdParty ? '' : `<button class="ghost-btn" data-action="switch-import-tab" data-tab="paste">粘贴链接</button>`}
      <button class="ghost-btn" data-action="go" data-view="catalog">查看图鉴</button>
    </div>
  </div>`;
}

// ---------------- shell ----------------

function renderShell() {
  document.body.dataset.game = state.game;
  $('#side-nav').innerHTML = [
    ['dashboard', '总览', 'overview'],
    ['records', `${topLabel()}记录`, 'records'],
    ['import', '数据录入', 'import'],
    ['catalog', '角色图鉴', 'catalog'],
    ['settings', '设置', 'settings'],
  ].map(([view, label, icon]) => `<button class="nav-item ${state.view === view ? 'active' : ''}" data-action="go" data-view="${view}">${ICONS[icon]}<span>${label}</span></button>`).join('');
  const visibleGames = state.gameOrder.filter((id) => !state.hiddenGames.includes(id));
  $('#game-tabs').innerHTML = visibleGames.map((id) => {
    const meta = GAME_META[id];
    return `<button class="game-tab ${state.game === id ? 'active' : ''}" data-action="switch-game" data-game="${id}" style="--tab-color:${meta.color}"><span class="dot"></span>${meta.label}</button>`;
  }).join('');
  const logged = state.auth.status === 'Confirmed';
  const avatar = state.auth.user?.avatar || '';
  const hg = state.thirdparty?.status?.hypergryph?.connected;
  const tjd = state.thirdparty?.status?.tajiduo?.connected;
  const anyLogin = logged || hg || tjd;
  const loginLabel = logged
    ? (esc(state.auth.user?.nickname) || '米游社')
    : hg && tjd ? '森空岛 / 塔吉多'
      : hg ? '森空岛'
        : tjd ? '塔吉多'
          : '账号';
  const loginIcon = logged ? (avatar ? `<img class="auth-avatar" src="${attr(avatar)}" alt="">` : '米') : hg ? '森' : tjd ? '塔' : ICONS.qr;
  $('#account-chip').innerHTML = `<button class="auth-entry ${anyLogin ? 'on' : ''}" data-action="open-auth" title="账号"><span class="auth-entry-icon">${loginIcon}</span><span class="auth-entry-copy"><strong>${loginLabel}</strong></span></button>`;
  $('#side-version').textContent = `v${state.shell?.displayVersion || state.shell?.version || '1.05'}`;
  const updateSlot = $('#update-slot');
  if (updateSlot) {
    if (state.update?.checking) updateSlot.innerHTML = '<span class="update-checking">检查更新</span>';
    else if (state.update?.hasUpdate) updateSlot.innerHTML = `<button class="update-pill" data-action="apply-update">新版本 v${esc(state.update.latest)}</button>`;
    else updateSlot.innerHTML = '';
  }
  const foot = $('#foot-meta');
  if (foot) foot.textContent = '';
}

async function checkUpdatesOnStartup() {
  if (!window.desktop?.checkUpdates) return;
  state.update = { checking: true };
  renderShell();
  try { state.update = await window.desktop.checkUpdates(); }
  catch { state.update = null; }
  renderShell();
}

async function setGame(game) {
  if (!GAME_META[game] || game === state.game) return;
  state.game = game;
  state.dashboard = null;
  state.records = null;
  state.catalog = null;
  state.scan = null;
  state.pendingLink = null;
  document.body.dataset.game = game;
  renderShell();
  renderView();
  try {
    if (state.view === 'import' && ['arknights', 'endfield', 'nte'].includes(game)) {
      await loadThirdParty();
    } else if (state.view === 'records') {
      await loadDashboard();
      await loadRecords(1);
    } else if (state.view === 'catalog') {
      await loadCatalog();
      renderView();
    } else if (state.view === 'import' && state.importTab === 'screenshot') {
      await loadCatalog();
      await loadDashboard();
    } else {
      await loadDashboard();
    }
  } catch (e) {
    toast(e.message, 'err');
  }
}

function navigate(view) {
  if (!['dashboard', 'records', 'import', 'catalog', 'settings'].includes(view)) return;
  if (view !== 'import') { clearQrTimer(); }
  clearThirdPartyQrTimer();
  $('#modal-root').innerHTML = '';
  state.view = view;
  if (view === 'records') state.records = null;
  if (view === 'catalog') state.catalog = null;
  renderShell();
  renderView();
  if (view === 'records') loadRecords(1).catch((e) => toast(e.message, 'err'));
  if (view === 'catalog') loadCatalog().catch((e) => toast(e.message, 'err'));
  if (view === 'import' && ['arknights', 'endfield', 'nte'].includes(state.game)) loadThirdParty().catch((e) => toast(e.message, 'err'));
}

async function loadDashboard() {
  if (!state.catalog || state.catalog.game !== state.game) await loadCatalog().catch(() => {});
  const data = await api(`/api/dashboard?game=${state.game}`);
  state.dashboard = data.dashboard;
  if (state.view === 'dashboard' || state.view === 'import') renderView();
  renderShell();
}

async function refreshAll() {
  const shell = await api('/api/state');
  state.shell = shell;
  await loadDashboard();
  if (state.view === 'records') await loadRecords(state.recordFilter.page || 1);
  if (state.view === 'catalog') await loadCatalog();
}

// ---------------- dashboard ----------------

function renderDashboard() {
  const d = state.dashboard;
  if (!d) return `<div class="loading-line"><span class="spinner"></span>正在读取本地档案…</div>`;
  const hasData = d.counts.lifetime > 0 || d.counts.lifetimeFive > 0 || d.records.length > 0;
  if (!hasData) {
    return `<div class="page-head"><div><div class="eyebrow">OVERVIEW · FIVE-STAR ONLY</div><h1>生涯概览</h1></div></div>${emptyState()}${renderFeatureCards()}`;
  }
  const exactPulls = d.counts.exact;
  const hasTotals = d.counts.hasExactTotals || d.counts.snapshotOnly > 0;
  const heroValue = hasTotals ? fmt(d.counts.lifetime) : '—';
  const rate = d.rates.upRate;
  const hitRate = d.rates.upDecided ? rate : null;
  const currentPity = d.pity.hasCurrent ? d.pity.max : 0;
  const currentPool = d.pity.hasCurrent ? d.pools.filter((p) => p.currentPity === currentPity).sort((a, b) => b.count - a.count)[0] : null;
  const cap = currentPool ? (d.pity.cap[currentPool.type] || 90) : 90;
  const progress = Math.min(100, cap ? (currentPity / cap) * 100 : 0);
  const recent = d.recentFive?.[0];
  const warnings = (d.warnings || []).slice(0, 2);
  const coverageOnly = state.game === 'nte' && d.counts.exactUnknown;
  const avgCharText = d.rates.avgChar != null ? d.rates.avgChar.toFixed(1) : '—';
  const avgWeaponText = d.rates.avgWeapon != null ? d.rates.avgWeapon.toFixed(1) : '—';
  const avgValue = `<span class="avg-pair"><span>角色 <b>${avgCharText}</b></span><span>武器 <b>${avgWeaponText}</b></span></span>`;
  const avgNote = `角色 ${d.rates.charSamples || 0} 次 · 武器 ${d.rates.weaponSamples || 0} 次`;


  return `
    <div class="page-head">
      <div>
        <div class="eyebrow">OVERVIEW · FIVE-STAR ONLY</div>
        <h1>生涯概览</h1>
      </div>
      <div class="page-head-actions">
        <button class="ghost-btn" data-action="share-summary">${ICONS.spark} 分享总结</button><button class="ghost-btn" data-action="go" data-view="records">${ICONS.records} 查看${topLabel()}</button>
        <button class="primary-btn" data-action="go" data-view="import">${ICONS.import} 录入历史</button>
        <span class="pill ${state.collector?.enabled ? 'accent' : ''}"><span class="pulse" style="width:4px;height:4px"></span>后台采集${state.collector?.enabled ? '中' : '已暂停'}</span>
      </div>
    </div>
    <div class="hero">
      <div class="card hero-card">
        <div class="hero-top">
          <div>
            <div class="hero-kicker"><span class="dot"></span> TOTAL PULLS / ${coverageOnly ? '已覆盖抽数' : '总抽数'}</div>
            <div class="hero-number-row"><div class="hero-number">${heroValue}</div><div class="hero-unit">${hasTotals ? (coverageOnly ? '抽（覆盖）' : '抽') : '待录入'}</div></div>
            <div class="hero-sub">限定池 <b>${fmt(d.counts.limitedExact)}</b> 抽 · <b>${fmt(d.counts.lifetimeFive)}</b> 张${topLabel()}${d.meta?.uid ? ` · UID ${esc(d.meta.uid)}` : ''}</div>
            <div class="hero-pills">
              <span class="pill accent"><b>${d.counts.lifetimeFive}</b> ${topLabel()}</span>
              <span class="pill"><b>${d.counts.limitedFiveAll || 0}</b> 限定${topLabel()}</span>
              <span class="pill"><b>${d.counts.overlapFive ? fmt(d.counts.overlapFive) : '0'}</b> 重叠${topLabel()}</span>
            </div>
          </div>
          <div style="text-align:right;position:relative;z-index:1">
            <div class="hero-kicker" style="justify-content:flex-end">最新${topLabel()}</div>
            <div style="margin-top:12px;display:flex;justify-content:flex-end">${recent ? itemIcon(recent.name, recent.itemId, 'large') : '<div class="item-icon large"><span class="fallback">✦</span></div>'}</div>
            <div style="font-size:12px;color:var(--muted);margin-top:8px">${recent ? esc(recent.name) : '等待记录'}</div>
          </div>
        </div>
      </div>
      <div class="hero-side">
        <div class="card rate-card">
          <div class="rate-copy">
            <div class="label">HIT RATE</div>
            <div class="value">${hitRate == null ? '—' : pct(hitRate)}<small>命中率</small></div>
            <div class="foot">${d.rates.upDecided ? `命中 ${d.rates.upWins} / 已判定 ${d.rates.upDecided}` : '接口未提供 UP 判定'}</div>
          </div>
          <div class="rate-ring" style="--p:${Math.min(100, (hitRate || 0) * 100).toFixed(1)}%"><div><strong>${fmt(d.counts.lifetimeFive)}</strong><span>FIVE STARS</span></div></div>
        </div>
        <div class="card" style="padding:16px 19px;min-height:105px">
          <div style="display:flex;justify-content:space-between;align-items:center">
            <div class="stat-label">当前垫抽 <span class="mini">${currentPool ? esc(currentPool.label) : '暂无'}</span></div>
            <div style="font-family:var(--mono);font-size:26px;font-weight:300;color:var(--accent)">${d.pity.hasCurrent ? currentPity : '—'}<small style="font-size:11px;color:var(--muted)">${d.pity.hasCurrent ? `/${cap}` : ''}</small></div>
          </div>
          <div class="pool-bar" style="margin-top:11px"><i style="width:${progress}%"></i></div>
          <div style="font-size:10.5px;color:var(--muted-2);margin-top:7px">${d.pity.hasCurrent ? `距离保底还有 ${Math.max(0, cap - currentPity)} 抽 · 当前垫抽为近似值` : '同步官方接口后显示当前垫抽'}</div>
        </div>
      </div>
    </div>
    <div class="stat-row">
      ${statCard(`${topLabel()}档案`, fmt(d.counts.lifetimeFive), '张', `${d.counts.exactFive} 张有逐条明细`)}
      ${statCard('平均出金', avgValue, '', avgNote, '')}
      ${statCard('UP命中', d.rates.upDecided ? fmt(d.counts.limitedFive || 0) : '—', '张', d.rates.upDecided ? `命中 ${d.rates.upWins} / 已判定 ${d.rates.upDecided}` : '接口未提供 UP 判定')}
      ${statCard('数据覆盖', `${d.coverage.percent}%`, '', `自 ${d.coverage.launchDate} 起`)}
    </div>
        <div class="card coverage-card">
      ${renderCoverage(d)}
    </div>
    ${renderPoolTable(d)}
    <div class="content-grid">
      <div class="card chart-card">
        <div class="card-head"><div class="card-title"><span class="mark"></span><h3>出金次数</h3><span>GOLD COUNT</span></div></div>
        ${renderMonthly(d.versions?.length ? d.versions : d.monthly)}
      </div>
      <div class="card">
        <div class="card-head"><div class="card-title"><span class="mark"></span><h3>卡池分布</h3><span>POOL DISTRIBUTION</span></div></div>
        ${renderPoolList(d.pools)}
      </div>
    </div>
    <div class="content-grid">
      <div class="card">
        <div class="card-head"><div class="card-title"><span class="mark"></span><h3>最近的出金</h3><span>RECENT FIVE-STARS</span></div></div>
        ${d.recentFive?.length ? `<div class="timeline">${d.recentFive.map((r) => itemRow(r)).join('')}</div>` : `<div class="empty-chart">还没有${topLabel()}记录</div>`}
      </div>
    </div>`;
}

function statCard(label, value, unit, note, tone = '') {
  return `<div class="card stat"><div class="stat-label">${label}</div><div class="stat-value">${value}${unit ? `<small>${unit}</small>` : ''}</div><div class="stat-note ${tone}">${esc(note)}</div></div>`;
}

function renderCoverage(d) {
  const start = Date.parse(`${d.coverage.launchDate}T00:00:00+08:00`);
  const end = Date.now();
  const span = Math.max(1, end - start);
  const pos = (date) => Math.max(0, Math.min(100, ((Date.parse(`${String(date).slice(0, 10)}T00:00:00+08:00`) - start) / span) * 100));
  const segments = [];
  for (const i of d.coverage.intervals) {
    segments.push(`<div class="timeline-seg snapshot" style="left:${pos(i.start)}%;width:${Math.max(0.4, pos(i.end) - pos(i.start))}%" title="历史汇总 ${i.start} → ${i.end}"></div>`);
  }
  if (d.coverage.exactRange?.start) {
    segments.push(`<div class="timeline-seg exact" style="left:${pos(d.coverage.exactRange.start)}%;width:${Math.max(0.4, pos(d.coverage.exactRange.end) - pos(d.coverage.exactRange.start))}%" title="限定池 ${d.coverage.exactRange.start} → ${d.coverage.exactRange.end}"></div>`);
  }
  if (d.counts.overlap > 0 && d.coverage.intervals.length && d.coverage.exactRange?.start) {
    const left = Math.max(pos(d.coverage.intervals[0].start), pos(d.coverage.exactRange.start));
    const right = Math.min(pos(d.coverage.intervals[d.coverage.intervals.length - 1].end), pos(d.coverage.exactRange.end));
    if (right > left) segments.push(`<div class="timeline-seg overlap" style="left:${left}%;width:${right - left}%" title="重叠段"></div>`);
  }
  const startYear = Number(d.coverage.launchDate.slice(0, 4));
  const nowYear = new Date().getFullYear();
  const years = [];
  for (let y = startYear; y <= nowYear; y++) years.push(y);
  const coverageLabels = d.versionLabels?.length ? d.versionLabels : (d.versions || []).map((v) => v.label);
  return `<div class="coverage-head">
    <div><div class="card-title"><span class="mark"></span><h3>生涯覆盖</h3><span>DATA COVERAGE</span></div></div>
    <div class="coverage-summary">
      <span class="coverage-badge exact"><i class="swatch"></i>限定池 ${fmt(d.counts.limitedExact)} 抽</span>
      <span class="coverage-badge snapshot"><i class="swatch"></i>历史汇总 ${fmt(d.counts.snapshotOnly)} 抽</span>
      ${d.counts.overlap ? `<span class="coverage-badge overlap"><i class="swatch"></i>重叠 ${fmt(d.counts.overlap)} 抽</span>` : ''}
    </div>
  </div>
  <div class="timeline-rail">${segments.join('')}</div>
  <div class="timeline-years">${(coverageLabels.length ? coverageLabels : years).map((y) => `<span>${esc(String(y))}</span>`).join('')}</div>
`;
}

function renderMonthly(monthly) {
  if (!monthly?.length) return `<div class="empty-chart">还没有${topLabel()}记录</div>`;
  const data = monthly.slice(-12);
  const max = Math.max(1, ...data.map((m) => m.five));
  return `<div class="chart-wrap"><div class="month-chart">
    <div class="month-grid"><i></i><i></i><i></i></div>
    <div class="month-bars">${data.map((m) => `<div class="month-col"><span class="month-value">${m.five || ''}</span><div class="month-bar-wrap"><div class="month-bar" style="height:${(m.five / max) * 100}%"></div></div><span class="month-label">${esc(String(m.label || m.month.slice(2, 7).replace('-', '/')))}</span></div>`).join('')}</div>
  </div></div>`;
}

function renderPoolList(pools) {
  const list = (pools || []).filter((p) => p.count > 0 || p.five > 0).sort((a, b) => b.count - a.count);
  if (!list.length) return `<div class="empty-chart">还没有卡池数据</div>`;
  const max = Math.max(1, ...list.map((p) => p.count));
  return `<div class="pool-list">${list.slice(0, 6).map((p) => `<div class="pool-item">
    <div class="pool-top"><span class="pool-name">${esc(p.label)}</span><span class="pool-count"><b>${p.count ? fmt(p.count) : '—'}</b> 抽 · ${p.five} 金</span></div>
    <div class="pool-bar"><i style="width:${(p.count / max) * 100}%"></i></div>
    <div class="pool-sub"><span>${p.currentPity ? `当前垫抽 ${p.currentPity}` : '垫抽未知'}</span><span>命中率 ${p.hitRate == null ? '—' : pct(p.hitRate)}</span></div>
  </div>`).join('')}</div>`;
}

function renderPoolTable(d) {
  const list = (d.pools || []).filter((p) => p.count > 0 || p.five > 0);
  if (!list.length) return '';
  const totalLimited = d.counts.limitedFive || 0;
  const totalStandard = d.counts.standardFive || 0;
  return `<div class="card" style="margin-bottom:15px">
    <div class="card-head"><div class="card-title"><span class="mark"></span><h3>卡池命中统计</h3><span>POOL PERFORMANCE</span></div></div>
    <div class="table-wrap" style="border:0"><table><thead><tr><th>卡池</th><th>抽数</th><th>${topLabel()}</th><th>${topLabel()}率</th><th>UP</th><th>常驻</th><th>命中率</th><th>当前垫抽</th></tr></thead><tbody>
      ${list.map((p) => `<tr><td><b style="color:var(--text);font-weight:550">${esc(p.label)}</b></td><td>${p.count ? fmt(p.count) : '—'}</td><td>${p.five}</td><td>${p.rate == null ? '—' : pct(p.rate)}</td><td>${p.hitApplicable ? `<span class="badge accent">${p.limited}</span>` : '<span class="muted">—</span>'}</td><td>${p.hitApplicable ? `<span class="badge">${p.standard}</span>` : '<span class="muted">—</span>'}</td><td>${p.hitRate == null ? '—' : pct(p.hitRate)}</td><td>${p.currentPity || '—'}</td></tr>`).join('')}
    </tbody></table></div>
  </div>`;
}


function renderFeatureCards() {
  return `<div class="grid cols-3" style="margin-top:15px">
    <div class="card"><div class="source-icon" style="margin-bottom:12px">${ICONS.link}</div><h3>自动读链</h3></div>
    <div class="card"><div class="source-icon" style="margin-bottom:12px">${ICONS.image}</div><h3>截图录入</h3></div>
    <div class="card"><div class="source-icon" style="margin-bottom:12px">${ICONS.catalog}</div><h3>官方图鉴</h3></div>
  </div>`;
}

// ---------------- records ----------------

async function loadRecords(page = 1) {
  const f = state.recordFilter;
  const q = new URLSearchParams({ game: state.game, page: String(page), pageSize: '500', search: f.search, pool: f.pool, source: f.source });
  const data = await api(`/api/records?${q}`);
  state.records = data;
  state.recordFilter.page = page;
  if (state.view === 'records') renderView();
}

function renderRecords() {
  const d = state.dashboard;
  const data = state.records;
  const pools = d?.pools || [];
  const loading = !data;
  const thirdParty = ['arknights', 'endfield', 'nte'].includes(state.game);
  return `<div class="page-head">
    <div><div class="eyebrow">ARCHIVE · FIVE-STAR ONLY</div><h1>${topLabel()}记录</h1></div>
    <div class="page-head-actions">
      <button class="ghost-btn" data-action="manual-add">+ ${topLabel()}</button>
      ${thirdParty ? '' : `<a class="ghost-btn" href="/api/export/uigf?game=${state.game}">${ICONS.download} UIGF</a>`}
      <a class="ghost-btn" href="/api/export/csv?game=${state.game}">${ICONS.download} CSV</a>
    </div>
  </div>
  <div class="toolbar">
    <div class="search-box">${ICONS.search}<input id="record-search" class="input" placeholder="搜索角色、武器或卡池…" value="${attr(state.recordFilter.search)}"></div>
    <div class="record-pools">${[{ type: 'all', label: '全部卡池' }, ...pools].map((p) => `<button class="pool-chip ${state.recordFilter.pool === p.type ? 'active' : ''}" data-action="record-pool" data-pool="${attr(p.type)}">${esc(p.label)}</button>`).join('')}</div>
    <button class="ghost-btn" data-action="records-reset">重置</button>
  </div>
  ${loading ? `<div class="loading-line"><span class="spinner"></span>读取记录…</div>` : (data.records.length ? renderRecordGroups(data.records) : `<div class="empty-state"><div class="orb">${ICONS.records}</div><h2>暂无记录</h2><div class="empty-actions"><button class="primary-btn" data-action="go" data-view="import">开始同步</button></div></div>`)}
  ${data ? `<div class="record-total">共 ${fmt(data.total)} 张${topLabel()}</div>` : ''}`;
}

function renderRecordGroups(records) {
  const d = state.dashboard;
  const maxPity = Math.max(90, ...records.map((r) => Number(r.pity) || 0));
  const groups = new Map();
  for (const r of records) {
    const key = r.poolName || r.uigfType || '其他';
    if (!groups.has(key)) groups.set(key, []);
    groups.get(key).push(r);
  }
  const order = (d?.pools || []).map((p) => p.label);
  const sorted = [...groups.entries()].sort((a, b) => {
    const ia = order.indexOf(a[0]);
    const ib = order.indexOf(b[0]);
    return (ia < 0 ? 99 : ia) - (ib < 0 ? 99 : ib);
  });
  return sorted.map(([pool, rows]) => {
    const poolInfo = d?.pools?.find((p) => p.label === pool);
    return `<section class="record-pool">
      <div class="record-pool-head">
        <div><span class="mark"></span><h2>${esc(pool)}</h2></div>
        <div class="record-pool-meta"><span>${rows.length} 金</span><span>${poolInfo?.count ? `${fmt(poolInfo.count)} 抽` : ''}</span></div>
      </div>
      <div class="record-list">${rows.map((r) => recordRow(r, maxPity)).join('')}</div>
    </section>`;
  }).join('');
}

function recordRow(r, maxPity) {
  const d = state.dashboard;
  const cap = d?.pity?.cap?.[r.uigfType] || 90;
  const pity = Number(r.pity) || 0;
  const tone = pity > 20 ? 'over' : pity < 20 ? 'under' : 'even';
  const wide = pity ? Math.min(100, (pity / maxPity) * 100) : 0;
  const tags = [
    r.up ? `<span class="up-tag ${r.up === 'win' ? 'win' : 'loss'}">${r.up === 'win' ? 'UP' : '歪'}</span>` : '',
    pity > 0 && pity < 20 && r.up !== 'loss' ? '<span class="luck-tag">欧</span>' : '',
    pity > 0 && pity <= 10 ? '<span class="luck-tag chain">连金</span>' : '',
  ].filter(Boolean).join('');
  return `<div class="record-row">
    <div class="record-time"><span>${esc(r.version || '未知版本')}</span><small>${r.source === 'official' ? '官方' : r.source === 'screenshot' ? '截图' : r.source === 'uigf' ? 'UIGF' : '本地'}</small></div>
    <div class="record-item">${itemIcon(r.name, r.itemId, 'small', r.rank)}<div class="record-name"><strong>${esc(r.name)}</strong><span>${esc(r.itemType || topLabel())}</span></div></div>
    <div class="record-bar-line">
      <span class="pity-number">${pity || '—'}</span>
      <div class="pity-bar ${tone}"><i style="width:${wide}%"></i></div>
      <div class="record-tags">${tags}</div>
      <span class="pity-cap">/${cap}</span>
    </div>
  </div>`;
}

// ---------------- import ----------------

function renderImport() {
  const d = state.dashboard;
  const thirdParty = ['arknights', 'endfield', 'nte'].includes(state.game);
  const tabs = thirdParty ? [
    ['sync', '官方同步', 'SYNC'],
    ['heybox', '小黑盒', 'HEYBOX'],
    ['screenshot', '截图录入', 'OCR'],
    ...(state.game === 'endfield' ? [['paste', '粘贴链接', 'LINK']] : []),
    ...(state.game === 'nte' ? [['nteuid', '导入 NTEUID', 'JSON'], ['nteexport', '导入 NTE 导出', 'JSON']] : []),
    ['summary', '历史汇总', 'SUMMARY'],
    ['manual', '手动添加', 'MANUAL'],
  ] : [
    ['auto', '自动读取', 'AUTO'],
    ['paste', '粘贴链接', 'LINK'],
    ['screenshot', '截图录入', 'OCR'],
    ['summary', '历史汇总', 'SUMMARY'],
    ['uigf', '导入 UIGF', 'UIGF'],
    ['heybox', '小黑盒', 'HEYBOX'],
    ['manual', '手动添加', 'MANUAL'],
  ];
  const validTabs = tabs.map(([id]) => id);
  if (!validTabs.includes(state.importTab)) state.importTab = tabs[0][0];
  return `<div class="page-head"><div><div class="eyebrow">SYNC · DATA RECOVERY</div><h1>数据录入</h1></div><div class="page-head-actions"><span class="pill"><b>${fmt(d?.counts.lifetime || 0)}</b> 生涯抽</span><span class="pill accent"><b>${fmt(d?.counts.lifetimeFive || 0)}</b> ${topLabel()}</span></div></div>
  <div class="tabs">${tabs.map(([id, label, tag]) => `<button class="tab ${state.importTab === id ? 'active' : ''}" data-action="switch-import-tab" data-tab="${id}">${label}<span class="count">${tag}</span></button>`).join('')}</div>
  <div class="tab-panel" id="import-panel">${renderImportPanel()}</div>`;
}

function renderImportPanel() {
  let main = '';
  if (state.importTab === 'sync') main = renderThirdPartySyncCard();
  if (state.importTab === 'heybox') main = renderHeyboxImport();
  if (state.importTab === 'auto') main = renderAutoImport();
  if (state.importTab === 'paste') main = renderEndfieldPasteImport();
  if (state.importTab === 'screenshot') main = renderScreenshotImport();
  if (state.importTab === 'summary') main = renderSummaryImport();
  if (state.importTab === 'uigf') main = renderUigfImport();
  if (state.importTab === 'nteuid') main = renderNteuidImport();
  if (state.importTab === 'nteexport') main = renderNteExportImport();
  if (state.importTab === 'manual') main = renderManualImport();
  return `<div class="import-layout" style="grid-template-columns:1fr"><div class="import-main">${main}</div></div>`;
}

function renderThirdPartySyncCard() {
  const tp = state.thirdparty || {};
  const status = tp.status || {};
  const hg = status.hypergryph || {};
  const tjd = status.tajiduo || {};
  const bindings = hg.bindings || [];
  const game = state.game;
  const binding = bindings.find((b) => b.appCode === game);
  const loginPrompt = (type, label) => `<div class="auth-empty">${label}未登录</div><button class="primary-btn" data-action="open-login" data-tab="${type}">去账号登录</button>`;
  const bindingRow = (b, type, label) => {
    if (!b) return `<div class="auth-empty">森空岛账号未绑定${label}角色</div><button class="ghost-btn" data-action="tp-skland-refresh">刷新绑定</button>`;
    const role = b.roles?.[0];
    return `<div class="role-item"><div class="role-main"><strong>${esc(b.nickname || role?.nickname || b.uid)}</strong><span>UID ${esc(b.uid)} · ${esc(b.channelName || role?.serverName || '')}${role?.level ? ` · Lv.${esc(role.level)}` : ''}</span></div><button class="primary-btn" data-action="tp-skland-sync" data-game="${type}">同步${label}</button></div>`;
  };
  const badge = (connected, text) => `<span class="badge ${connected ? 'accent' : ''}">${text}</span>`;
  const error = tp.error ? `<div class="notice red">${ICONS.warn}<div>${esc(tp.error)}</div></div>` : '';
  const current = state.banners?.current || [];
  const bannerNotice = current.length
    ? `<div class="notice blue" style="margin-top:12px">${ICONS.shield}<div>当前卡池：${current.map((b) => `${esc(b.name)}${b.up?.length ? `（UP ${b.up.map(esc).join(' / ')}）` : ''}`).join('；')}</div></div>`
    : '';
  if (game === 'arknights') {
    return `${error}<div class="card">
      <div class="card-head"><div class="card-title"><span class="mark"></span><h3>明日方舟官方寻访</h3><span>SKLAND</span></div>${badge(Boolean(binding), binding ? '已绑定' : hg.connected ? '未绑定' : '未登录')}</div>
      <div class="role-list" style="margin-top:14px">${hg.connected ? bindingRow(binding, 'arknights', '明日方舟') : loginPrompt('skland', '森空岛')}</div>
      <div class="auto-hint" style="margin-top:12px">森空岛登录后读取官方寻访记录，官方只保留约 90 天；更早的数据可用截图或手动补录。</div>
      ${bannerNotice}
    </div>`;
  }
  if (game === 'endfield') {
    const logLinks = status.endfieldLog || [];
    return `${error}<div class="card" style="margin-bottom:15px">
      <div class="card-head"><div class="card-title"><span class="mark"></span><h3>终末地官方寻访</h3><span>ENDFIELD</span></div>${badge(Boolean(binding), binding ? '已绑定' : hg.connected ? '未绑定' : '未登录')}</div>
      <div class="role-list" style="margin-top:14px">${hg.connected ? bindingRow(binding, 'endfield', '终末地') : loginPrompt('skland', '森空岛')}</div>
      <div class="auto-hint" style="margin-top:14px;padding-top:12px;border-top:1px solid var(--line)">也可以不登录森空岛，直接读取本机日志或粘贴终末地抽卡链接。</div>
      <div style="display:flex;gap:8px;flex-wrap:wrap;margin-top:12px"><button class="ghost-btn" data-action="tp-ef-scan">${ICONS.refresh} 读取本机链接</button>${logLinks.length ? `<button class="ghost-btn" data-action="tp-ef-sync-log">${ICONS.download} 同步最新链接</button>` : ''}</div>
      ${logLinks.length ? `<div class="kv" style="margin-top:10px"><span>最近链接</span><b>${esc(logLinks[logLinks.length - 1].preview || '')}</b></div>` : ''}
      ${bannerNotice}
    </div>
    <div class="card">
      <div class="card-head"><div class="card-title"><span class="mark"></span><h3>粘贴终末地链接</h3><span>MANUAL URL</span></div></div>
      <div class="field" style="margin-top:14px"><label>抽卡记录链接</label><textarea id="tp-ef-url" class="input" rows="5" placeholder="https://ef-webview.hypergryph.com/page/gacha_...?u8_token=...&server_id=1">${esc(tp.endfieldText || '')}</textarea></div>
      <div style="display:flex;gap:8px;margin-top:12px"><button class="primary-btn" data-action="tp-ef-sync-paste">${ICONS.link} 解析并同步</button></div>
      ${tp.endfieldPreview ? `<div class="link-preview"><div class="lp-icon">${ICONS.link}</div><div class="lp-copy"><strong>已识别终末地链接</strong><span>${esc(tp.endfieldPreview)}</span></div><span class="badge accent">待同步</span></div>` : ''}
    </div>`;
  }
  if (game === 'nte') {
    return `${error}<div class="card">
      <div class="card-head"><div class="card-title"><span class="mark"></span><h3>异环官方记录</h3><span>TAJIDUO</span></div>${badge(tjd.connected, tjd.connected ? '已登录' : '未登录')}</div>
      <div class="role-list" style="margin-top:14px">${tjd.connected ? `<div class="role-item"><div class="role-main"><strong>${esc(tjd.user?.nickname || tjd.user?.roleId || '已登录')}</strong><span>UID ${esc(tjd.user?.uid || '')} · 官方抽卡记录约保留 180 天</span></div><button class="primary-btn" data-action="tp-tjd-sync">同步异环</button></div>` : loginPrompt('tajiduo', '塔吉多')}</div>
      <div class="auto-hint" style="margin-top:12px">官方接口只返回 S 级记录和 S 间隔，当前垫抽无法从接口还原；导入 NTEUID 可以补齐历史。塔吉多登录在右上角账号入口。</div>
      ${bannerNotice}
    </div>`;
  }
  return '';
}

function renderEndfieldPasteImport() {
  const tp = state.thirdparty || {};
  const logLinks = tp.status?.endfieldLog || [];
  return `<div class="card">
    <div class="card-head"><div class="card-title"><span class="mark"></span><h3>粘贴终末地抽卡链接</h3><span>ENDFIELD URL</span></div></div>
    <div class="auto-hint" style="margin-top:10px">在游戏内打开「寻访记录」，或从日志里读取链接后粘贴到这里。</div>
    <div style="display:flex;gap:8px;flex-wrap:wrap;margin-top:12px"><button class="primary-btn" data-action="tp-ef-scan">${ICONS.refresh} 读取本机链接</button>${logLinks.length ? `<button class="ghost-btn" data-action="tp-ef-sync-log">同步最新链接</button>` : ''}</div>
    <div class="field" style="margin-top:14px"><label>终末地抽卡链接</label><textarea id="tp-ef-url" class="input" rows="5" placeholder="https://ef-webview.hypergryph.com/page/gacha_...?u8_token=...&server_id=1">${esc(tp.endfieldText || '')}</textarea></div>
    <div style="display:flex;gap:8px;margin-top:12px"><button class="primary-btn" data-action="tp-ef-sync-paste">${ICONS.link} 解析并同步</button></div>
    ${tp.endfieldPreview ? `<div class="link-preview"><div class="lp-icon">${ICONS.link}</div><div class="lp-copy"><strong>已识别终末地链接</strong><span>${esc(tp.endfieldPreview)}</span></div><span class="badge accent">待同步</span></div>` : ''}
  </div>`;
}

function renderManualImport() {
  const d = state.dashboard;
  const game = state.game;
  const pools = (d?.pools || []).filter((p) => p.type);
  const items = (state.catalog?.items || []).filter((i) => i.type === '角色' || i.type === '代理人');
  const f = state.manualFilters || {};
  const field = game === 'hsr' ? 'path' : game === 'genshin' ? 'region' : game === 'zzz' ? 'path' : '';
  const versions = d?.versionLabels || (d?.versions || []).map((v) => v.label);
  const attrs = [...new Set(items.map((i) => i.element).filter(Boolean))].sort();
  const factions = field ? [...new Set(items.map((i) => i[field]).filter(Boolean))].sort() : [];
  const recordNames = new Set((d?.records || []).filter((r) => !f.version || r.version === f.version).map((r) => r.name));
  const filtered = items.filter((i) => {
    if (f.attr && i.element !== f.attr) return false;
    if (f.field && i[field] !== f.field) return false;
    if (f.version && i.version !== f.version && !recordNames.has(i.name)) return false;
    return true;
  });
  const factionLabel = game === 'hsr' ? '命途' : game === 'genshin' ? '地区' : game === 'zzz' ? '职业' : '';
  const mode = state.manualMode || 'single';
  const single = `<form id="manual-form" class="form-grid" style="margin-top:14px">
      <div class="field"><label>角色</label><select class="input" name="name"><option value="">选择角色</option>${filtered.map((i) => `<option value="${attr(i.name)}">${esc(i.name)}</option>`).join('')}</select></div>
      <div class="field"><label>其他名称</label><input class="input" name="manualName" placeholder="找不到时手动输入"></div>
      <div class="field"><label>卡池</label><select class="input" name="gachaType">${pools.map((p) => `<option value="${attr(p.type)}">${esc(p.label)}</option>`).join('')}</select></div>
      <div class="field"><label>版本</label><select class="input" name="version"><option value="">不填</option>${versions.map((v) => `<option value="${attr(v)}" ${f.version === v ? 'selected' : ''}>${esc(v)}</option>`).join('')}</select></div>
      <div class="field"><label>抽数</label><input class="input" type="number" min="1" name="pity"></div>
      <div class="field"><label>时间（可选）</label><input class="input" type="datetime-local" name="time"></div>
      <div class="span-2"><button class="primary-btn" type="submit">保存记录</button></div>
    </form>
    <div class="manual-filter">
      <span class="manual-filter-label">筛选</span>
      <select class="input" id="manual-version"><option value="">全部版本</option>${versions.map((v) => `<option value="${attr(v)}" ${f.version === v ? 'selected' : ''}>${esc(v)}</option>`).join('')}</select>
      <select class="input" id="manual-attr"><option value="">全部属性</option>${attrs.map((v) => `<option value="${attr(v)}" ${f.attr === v ? 'selected' : ''}>${esc(v)}</option>`).join('')}</select>
      ${factionLabel ? `<select class="input" id="manual-field"><option value="">全部${factionLabel}</option>${factions.map((v) => `<option value="${attr(v)}" ${f.field === v ? 'selected' : ''}>${esc(v)}</option>`).join('')}</select>` : ''}
      <span class="manual-count">${filtered.length}</span>
    </div>`;
  const table = `<div class="manual-table">
    <div class="manual-note">第一行最新，向下按从新到旧填写；UP/歪由软件判断。</div>
    <div class="manual-table-head"><span>Excel 表格</span><a class="ghost-btn" href="/api/manual/template?game=${state.game}">${ICONS.download} 下载模板</a></div>
    <div class="dropzone" id="manual-excel-drop" style="margin-top:14px">${ICONS.upload}<strong>拖入 Excel，或点击选择</strong><input type="file" id="manual-excel-file" accept=".xlsx,.xls,.csv" hidden></div>
  </div>`;
  return `<div class="card">
    <div class="card-head"><div class="card-title"><span class="mark"></span><h3>手动添加</h3><span>MANUAL</span></div></div>
    <div class="manual-modes"><button class="ghost-btn ${mode === 'single' ? 'active' : ''}" data-action="manual-mode" data-mode="single">单个添加</button><button class="ghost-btn ${mode === 'table' ? 'active' : ''}" data-action="manual-mode" data-mode="table">表格导入</button></div>
    ${mode === 'table' ? table : single}
  </div>`;
}

function renderHeyboxImport() {
  const desktop = Boolean(window.desktop?.heybox);
  const label = GAME_META[state.game]?.label || state.game;
  return `<div class="card" style="margin-bottom:15px">
    <div class="card-head"><div class="card-title"><span class="mark"></span><h3>从黑盒导入 · ${esc(label)}</h3><span>HEYBOX LIVE</span></div><span class="badge gold">实验性</span></div>
    <div class="notice red" style="margin-top:12px">${ICONS.warn}<div>会打开隔离的小黑盒窗口，由你手动登录并打开对应游戏的抽卡/祈愿分析页。软件只截取页面 JSON 响应到内存，不保存小黑盒密码或登录 Cookie；关闭窗口后会话销毁。小黑盒没有公开抽卡 API，改版后可能失效。</div></div>
    <div style="display:flex;gap:8px;flex-wrap:wrap;margin-top:14px">
      <button class="primary-btn" data-action="heybox-open" ${desktop ? '' : 'disabled'}>${ICONS.link} 打开小黑盒登录窗口</button>
      <button class="ghost-btn" data-action="heybox-collect" ${desktop ? '' : 'disabled'}>${ICONS.download} 采集当前数据并导入</button>
      <button class="ghost-btn" data-action="heybox-close" ${desktop ? '' : 'disabled'}>关闭窗口</button>
    </div>
    <div class="auto-hint" style="margin-top:12px">操作：登录小黑盒 → 找到「${esc(label)}」→ 打开抽卡/祈愿分析 → 等页面数据加载完 → 回到这里点「采集当前数据并导入」。如果识别失败，请确认页面已经显示抽卡统计，而不是只打开社区首页。</div>
    ${desktop ? '' : '<div class="notice blue" style="margin-top:10px">小黑盒窗口只在便携版/桌面版可用；网页版请使用 JSON 导入。</div>'}
  </div>
  ${state.game === 'arknights' ? `<div class="card">
    <div class="card-head"><div class="card-title"><span class="mark"></span><h3>导入小黑盒 JSON</h3><span>HEYBOX JSON</span></div></div>
    <div class="auto-hint" style="margin-top:10px">已有小黑盒导出的 JSON 时，可以直接拖进来；会读取六星、时间和卡池，并按完整序列计算垫抽。</div>
    <div class="dropzone" id="heybox-dropzone" style="margin-top:14px">${ICONS.upload}<strong>拖入小黑盒 JSON，或点击选择</strong><input type="file" id="heybox-file" accept="application/json,.json" hidden></div>
  </div>` : ''}`;
}

function renderUigfImport() {
  return `<div class="card">
    <div class="card-head"><div class="card-title"><span class="mark"></span><h3>导入 UIGF / SRGF</h3><span>JSON</span></div></div>
    <div class="dropzone" id="uigf-dropzone" style="margin-top:14px">${ICONS.upload}<strong>拖入 JSON 文件，或点击选择</strong><input type="file" id="uigf-tab-file" accept="application/json,.json" multiple hidden></div>
  </div>`;
}

function renderNteuidImport() {
  return `<div class="card">
    <div class="card-head"><div class="card-title"><span class="mark"></span><h3>导入 NTEUID 存档</h3><span>NTEUID JSON</span></div></div>
    <div class="auto-hint" style="margin-top:10px">NTEUID 是异环社区通用的抽卡存档格式，只包含已出 S 的明细和抽数，可以绕开官方 180 天窗口。导入会合并到本地档案，不覆盖已有记录。</div>
    <div class="dropzone" id="nteuid-dropzone" style="margin-top:14px">${ICONS.upload}<strong>拖入 nteuid JSON，或点击选择</strong><input type="file" id="nteuid-file" accept="application/json,.json" hidden></div>
  </div>`;
}

function renderNteCaptureCard() {
  const desktop = Boolean(window.desktop?.nteCapture);
  const status = state.nteCapture;
  return `<div class="card" style="margin-bottom:15px;border-color:rgba(var(--accent-rgb),.38);background:linear-gradient(135deg,rgba(var(--accent-rgb),.08),rgba(0,0,0,0) 55%)">
    <div class="card-head"><div class="card-title"><span class="mark"></span><h3>自动录入 · 异环抽卡</h3><span>NTE CAPTURE</span></div><span class="badge accent">推荐</span></div>
    <div class="auto-hint" style="margin-top:8px">自动翻页读取游戏封包，完整抓取后自动导入，不需要手动找文件。首次启动会弹一次 Windows 管理员权限。</div>
    <div style="display:flex;justify-content:space-between;align-items:center;gap:14px;flex-wrap:wrap;margin-top:14px;padding:14px;border:1px solid rgba(var(--accent-rgb),.3);border-radius:10px;background:rgba(var(--accent-rgb),.07)">
      <div style="min-width:220px">
        <div style="font-size:13px;font-weight:600;color:var(--text)">自动翻页录入 <span style="font-size:10px;color:var(--accent);border:1px solid rgba(var(--accent-rgb),.4);padding:1px 5px;border-radius:999px;margin-left:4px">首选</span></div>
        <div style="font-size:11.5px;color:var(--muted);margin-top:5px;line-height:1.55">游戏停在抽卡记录页 → 软件自动翻页 → 完整导入。会操作游戏界面，但不会修改账号/抽卡数据。</div>
      </div>
      <button class="primary-btn" data-action="nte-capture-auto" ${desktop ? '' : 'disabled'}>${ICONS.spark} 开始自动录入</button>
    </div>
    <div style="display:flex;justify-content:space-between;align-items:center;gap:12px;flex-wrap:wrap;margin-top:10px;padding:10px 14px;opacity:.58">
      <div style="font-size:11.5px;color:var(--muted);line-height:1.55"><b style="color:var(--muted)">手动翻页兜底：</b>不操作游戏；你在游戏里翻完抽卡记录，然后在黑色窗口按 <b>q</b> 结束并自动导入。</div>
      <button class="ghost-btn" data-action="nte-capture-manual" ${desktop ? '' : 'disabled'}>手动只读捕获</button>
    </div>
    <div id="nte-capture-status" style="margin-top:10px;font-size:12px;color:var(--muted)">${esc(status.status || (desktop ? '等待开始' : '仅桌面版可用'))}</div>
  </div>`;
}

function renderNteExportImport() {
  return `${renderNteCaptureCard()}<div class="card">
    <div class="card-head"><div class="card-title"><span class="mark"></span><h3>导入 NTE Gacha Exporter</h3><span>NTE EXPORT JSON</span></div></div>
    <div class="auto-hint" style="margin-top:10px">NTE Gacha Exporter 通过 pktmon/WinDivert 抓取游戏内完整抽卡记录（含所有低稀有度），导出 JSON 后可直接导入。这样可以得到完整总抽数；本软件只保存 S 级，低稀有度只用于总数和垫抽计算。</div>
    <div class="dropzone" id="nteexport-dropzone" style="margin-top:14px">${ICONS.upload}<strong>拖入 NTE 导出 JSON，或点击选择</strong><input type="file" id="nteexport-file" accept="application/json,.json" hidden></div>
  </div>`;
}

function renderAutoImport() {
  const scan = state.scan;
  const col = state.collector;
  const colOn = col ? col.enabled : true;
  const events = col?.events || [];
  const collectorCard = `<div class="card" style="margin-bottom:15px;border-color:rgba(var(--accent-rgb),.16)">
    <div class="card-head" style="margin-bottom:10px"><div class="card-title"><span class="mark"></span><h3>后台半自动采集</h3><span>AUTO COLLECTOR</span></div><span class="badge ${colOn ? 'accent' : ''}">${colOn ? '运行中' : '已暂停'}</span></div>
    <div style="display:flex;align-items:center;gap:10px;flex-wrap:wrap;margin-top:12px">
      <button class="primary-btn" data-action="collector-toggle" data-enabled="${colOn ? 'false' : 'true'}">${colOn ? '暂停后台采集' : '开启后台采集'}</button>
      <span style="font-size:11px;color:var(--muted-2)">${col?.lastRun ? `上次扫描 ${timeAgo(col.lastRun)}` : '等待游戏启动'} · 间隔 ${Math.round((col?.intervalMs || 30000) / 1000)} 秒</span>
    </div>
    ${(col?.runningGames || []).length ? `<div style="margin-top:12px;border-top:1px solid var(--line);padding-top:8px">${(col.runningGames || []).map((game) => {
      const e = events.find((item) => item.game === game);
      return `<div class="kv"><span>${esc(GAME_META[game]?.name || game)} · ${esc(e ? (e.ok ? '已同步' : '未同步') : '等待同步')}</span><b>${esc(e?.message || '游戏已启动')}${e?.added ? ` · +${e.added} 金` : ''}${e?.upgraded ? ` · 提升 ${e.upgraded}` : ''}</b></div>`;
    }).join('')}</div>` : ''}
  </div>`;
  return `${collectorCard}<div class="card">
    <div class="card-head"><div class="card-title"><span class="mark"></span><h3>读取本机游戏缓存</h3><span>WEBCACHE</span></div></div>
    <div class="auto-hint">需要打开游戏内抽卡历史</div>
    <div class="scan-grid" style="margin-top:16px">
      ${state.gameOrder.filter((id) => !state.hiddenGames.includes(id)).map((id) => {
        const meta = GAME_META[id];
        const found = scan?.found?.[id];
        return `<div class="scan-card"><div class="scan-head"><div class="scan-name"><span class="game-dot" style="color:${meta.color};background:${meta.color}"></span>${meta.name}</div><span class="scan-state ${found ? 'found' : ''}">${found ? '已找到链接' : scan ? '未找到' : '等待扫描'}</span></div>
          <div class="scan-meta">${found ? `${esc(found.region || found.gameBiz || '区服未知')}<br>${esc(found.preview || 'authkey 已隐藏')}` : '未找到'}</div>
          ${found ? `<button class="ghost-btn" data-action="copy-scan-link" data-link="${attr(found.linkId)}">复制链接</button><button class="primary-btn compact" data-action="sync-link" data-game="${id}" data-link="${attr(found.linkId)}">读取并同步</button>` : `<button class="ghost-btn" data-action="scan-links">扫描</button>`}
        </div>`;
      }).join('')}
    </div>
    <div style="display:flex;gap:8px;margin-top:16px;flex-wrap:wrap"><button class="primary-btn" data-action="scan-links">${ICONS.refresh} 扫描本机链接</button><button class="ghost-btn" data-action="switch-import-tab" data-tab="paste">没有找到？粘贴链接</button></div>
    ${scan ? `<details style="margin-top:16px"><summary style="cursor:pointer;color:var(--muted);font-size:12px">查看扫描诊断（${scan.diagnostics?.length || 0} 项）</summary><div style="margin-top:10px;max-height:220px;overflow:auto;font-family:var(--mono);font-size:10.5px;color:var(--muted-2);line-height:1.8">${(scan.diagnostics || []).map((x) => `${esc(x.type)} · ${esc(x.game)} · ${esc(x.path || x.file || x.installDir || '')}${x.exists === false ? ' · 不存在' : ''}${x.error ? ' · ' + esc(x.error) : ''}`).join('<br>')}</div></details>` : ''}
  </div>`;
}

function renderPasteImport() {
  const link = state.pendingLink;
  return `<div class="card">
    <div class="card-head"><div class="card-title"><span class="mark"></span><h3>粘贴抽卡链接</h3><span>MANUAL URL</span></div></div>
    <div class="field" style="margin-top:14px"><label>抽卡记录链接</label><textarea id="paste-url" class="input" rows="5" placeholder="https://public-operation-hk4e.mihoyo.com/gacha_info/api/getGachaLog?authkey=..."></textarea></div>
    <div style="display:flex;gap:8px;margin-top:12px"><button class="primary-btn" data-action="parse-link">${ICONS.link} 解析链接</button><button class="ghost-btn" data-action="copy-paste-link">复制链接</button>${link ? `<button class="primary-btn" data-action="sync-paste">${ICONS.download} 读取并同步</button>` : ''}</div>
    ${link ? `<div class="link-preview"><div class="lp-icon">${ICONS.check || ICONS.link}</div><div class="lp-copy"><strong>${esc(link.gameName)} · 已识别${link.isOversea ? '国际服' : '国服'}</strong><span>${esc(link.preview)}</span></div><span class="badge accent">待同步</span></div>` : ''}
  </div>`;
}

function renderQrImport() {
  const qr = state.qr;
  return `<div class="card">
    <div class="card-head"><div class="card-title"><span class="mark"></span><h3>米游社扫码登录</h3><span>MIYOUSHE QR</span></div></div>
    <div class="qr-login">
      <div class="qr-frame" id="qr-frame">${qr?.url ? `<img id="qr-image" alt="米游社登录二维码">` : `<div class="qr-placeholder">${ICONS.qr}<br>生成二维码后<br>用米游社 App 扫描</div>`}</div>
      <div>
        <div class="qr-status ${qr?.status === 'Confirmed' ? 'ok' : ''}"><span class="pulse"></span><span id="qr-status-text">${qr ? qrStatusText(qr.status) : '未开始'}</span></div>
        ${qr?.status === 'Confirmed' ? `<div class="notice blue" style="margin-top:10px">${ICONS.shield}<div>已登录${qr.user?.nickname ? `：${esc(qr.user.nickname)}` : ''}${qr.user?.aid ? ` · 账号 ${esc(qr.user.aid)}` : ''}。凭据不会落盘。</div></div>` : ''}
        <div class="qr-actions">
          <button class="primary-btn" data-action="qr-start">${qr ? '重新生成' : '生成登录二维码'}</button>
          ${qr?.status === 'Confirmed' ? `<button class="ghost-btn" data-action="qr-roles">读取游戏角色</button><button class="primary-btn" data-action="qr-zzz">读取绝区零全量统计</button>` : ''}
        </div>
        ${qr?.roles?.length ? `<div class="role-list">${qr.roles.map((r) => `<div class="role-item"><div class="role-main"><strong>${esc(r.nickname || r.uid)}</strong><span>UID ${esc(r.uid)} · ${esc(r.regionName || r.region)} · Lv.${esc(r.level || '?')}</span></div>${state.game === 'hsr' ? `<span class="badge">星铁暂不支持</span>` : `<button class="ghost-btn" data-action="qr-link" data-uid="${attr(r.uid)}">获取链接</button>`}</div>`).join('')}</div>` : ''}
        ${qr?.rolesError ? `<div class="notice red" style="margin-top:10px">${ICONS.warn}<div>${esc(qr.rolesError)}</div></div>` : ''}
        ${qr?.statsMessage ? `<div class="notice blue" style="margin-top:10px">${ICONS.shield}<div>${esc(qr.statsMessage)}</div></div>` : ''}
      </div>
    </div>
  </div>`;
}

function qrStatusText(status) {
  return { Created: '等待扫描', Scanned: '已扫描，请在手机上确认', Confirmed: '登录成功', Expired: '二维码已过期', Cancelled: '已取消', Error: '登录失败' }[status] || '等待扫描';
}

function authRoleRows() {
  const a = state.auth;
  const order = ['genshin', 'hsr', 'zzz'];
  const rows = order.map((game) => {
    const roles = a.rolesByGame?.[game] || [];
    const error = a.errors?.[game];
    if (!roles.length && !error) return '';
    const meta = GAME_META[game];
    return `<div class="auth-game">
      <div class="auth-game-head"><span class="game-dot" style="background:${meta.color};color:${meta.color}"></span><strong>${meta.label}</strong><span>${roles.length} 个角色</span></div>
      ${roles.length ? roles.map((r) => `<div class="role-item"><div class="role-main"><strong>${esc(r.nickname || r.uid)}</strong><span>UID ${esc(r.uid)} · ${esc(r.regionName || r.region)}</span></div><button class="ghost-btn" data-action="auth-sync" data-game="${game}" data-uid="${attr(r.uid)}">同步</button></div>`).join('') : `<div class="auth-empty">${error ? esc(error) : '没有绑定角色'}</div>`}
    </div>`;
  }).filter(Boolean);
  return rows.length ? rows.join('') : '<div class="auth-empty">没有绑定米哈游角色</div>';
}

function authTabsHtml() {
  const tabs = [
    ['miyoushe', '米游社', 'QR'],
    ['skland', '森空岛', 'QR'],
    ['tajiduo', '塔吉多', 'SMS'],
  ];
  return `<div class="tabs auth-tabs">${tabs.map(([id, label, tag]) => `<button class="tab ${state.authTab === id ? 'active' : ''}" data-action="login-tab" data-tab="${id}">${label}<span class="count">${tag}</span></button>`).join('')}</div>`;
}

function renderLoginMiyousheBody() {
  const a = state.auth;
  if (a.status === 'Confirmed') {
    return `<div class="qr-status ok"><span class="pulse"></span><span>已登录${a.user?.nickname ? ' · ' + esc(a.user.nickname) : ''}${a.user?.aid ? ' · ' + esc(a.user.aid) : ''}</span></div>
      <div class="auto-hint">角色和同步操作在「游戏账号」页，这里只负责登录。</div>
      <div class="modal-actions" style="justify-content:flex-start"><button class="primary-btn" data-action="auth-start">重新扫码</button><button class="ghost-btn" data-action="account-tab" data-tab="accounts">游戏账号</button></div>`;
  }
  const qr = a.status && a.url;
  const status = a.status || '';
  return `<div class="qr-login">
      <div class="qr-frame" id="login-auth-qr-frame">${qr ? '<img id="login-auth-qr-image" alt="米游社登录二维码">' : `<div class="qr-placeholder">${ICONS.qr}<br>生成二维码后<br>用米游社 App 扫描</div>`}</div>
      <div>
        <div class="qr-status"><span class="pulse"></span><span>${qrStatusText(status || 'Created')}</span></div>
        <div class="qr-actions"><button class="primary-btn" data-action="auth-start">${qr ? '重新生成' : '生成二维码'}</button></div>
        <div class="auto-hint" style="margin-top:12px">登录后可在「游戏账号」页读取角色并同步。</div>
      </div>
    </div>`;
}

function renderLoginSklandBody() {
  const hg = state.thirdparty?.status?.hypergryph || {};
  const qr = state.thirdparty?.qr;
  if (hg.connected && (!qr?.url || qr.status === 'Confirmed')) {
    return `<div class="qr-status ok"><span class="pulse"></span><span>已登录${hg.user?.nickname ? ' · ' + esc(hg.user.nickname) : ''}</span></div>
      <div class="auto-hint">明日方舟 / 终末地的绑定和同步操作在「游戏账号」页。</div>
      <div class="modal-actions" style="justify-content:flex-start"><button class="primary-btn" data-action="tp-skland-start">重新扫码</button><button class="ghost-btn" data-action="account-tab" data-tab="accounts">游戏账号</button></div>`;
  }
  return `<div class="qr-login">
      <div class="qr-frame" id="login-tp-qr-frame">${qr?.url ? '<img id="login-tp-qr-image" alt="森空岛登录二维码">' : `<div class="qr-placeholder">${ICONS.qr}<br>用森空岛 App<br>扫描登录</div>`}</div>
      <div>
        <div class="qr-status"><span class="pulse"></span><span>${qr ? qrStatusText(qr.status) : '未登录'}</span></div>
        <div class="qr-actions"><button class="primary-btn" data-action="tp-skland-start">${qr ? '重新生成二维码' : '生成二维码'}</button></div>
        <div class="auto-hint" style="margin-top:12px">扫码后读取明日方舟和终末地的绑定角色。</div>
        ${qr?.message ? `<div class="notice ${qr.status === 'Error' ? 'red' : 'blue'}" style="margin-top:10px">${ICONS.warn}<div>${esc(qr.message)}</div></div>` : ''}
      </div>
    </div>`;
}

function renderLoginTajiduoBody() {
  const tjd = state.thirdparty?.status?.tajiduo || {};
  const tj = state.thirdparty?.tajiduo || {};
  if (tjd.connected) {
    return `<div class="qr-status ok"><span class="pulse"></span><span>已登录${tjd.user?.nickname ? ' · ' + esc(tjd.user.nickname) : ''}</span></div>
      <div class="auto-hint">异环同步和退出登录在「游戏账号」页。</div>
      <div class="modal-actions" style="justify-content:flex-start"><button class="ghost-btn" data-action="account-tab" data-tab="accounts">游戏账号</button></div>`;
  }
  return `<div class="auto-hint">使用塔吉多官方接口登录。验证码由鹰角 / 完美世界账号系统发送，凭据只加密保存在本机。</div>
    <div class="form-grid" style="margin-top:14px">
      <div class="field"><label>手机号</label><input id="login-tjd-phone" class="input" inputmode="numeric" placeholder="11 位手机号" value="${attr(tj.phone || '')}"></div>
      <div class="field"><label>短信验证码</label><input id="login-tjd-code" class="input" inputmode="numeric" placeholder="验证码" value="${attr(tj.code || '')}"></div>
      <div class="span-2" style="display:flex;gap:8px"><button class="ghost-btn" data-action="tp-tjd-send">发送验证码</button><button class="primary-btn" data-action="tp-tjd-login">登录并保存</button></div>
    </div>
    ${tj.message ? `<div class="notice blue" style="margin-top:10px">${ICONS.shield}<div>${esc(tj.message)}</div></div>` : ''}
    ${state.thirdparty?.status?.tajiduo?.lastError ? `<div class="notice red" style="margin-top:10px">${ICONS.warn}<div>${esc(state.thirdparty.status.tajiduo.lastError.stage)}：${esc(state.thirdparty.status.tajiduo.lastError.message)}</div></div>` : ''}`;
}

function renderAccountLoginTab() {
  const tab = state.authTab || 'miyoushe';
  const body = tab === 'skland' ? renderLoginSklandBody() : tab === 'tajiduo' ? renderLoginTajiduoBody() : renderLoginMiyousheBody();
  return `<div class="auto-hint">登录成功后会自动切回游戏账号列表。</div>
    ${authTabsHtml()}
    <div class="auth-tab-body">${body}</div>`;
}

function renderAccountListTab() {
  const a = state.auth;
  const hg = state.thirdparty?.status?.hypergryph || {};
  const tjd = state.thirdparty?.status?.tajiduo || {};
  const miLogged = a.status === 'Confirmed';
  const hgBindings = hg.bindings || [];
  const loginCard = (type, title, subtitle) => `<div class="auth-game"><div class="auth-game-head"><strong>${title}</strong><span>${subtitle}</span></div><div class="role-item"><div class="role-main"><strong>未登录</strong><span>${subtitle}</span></div><button class="ghost-btn" data-action="account-login-go" data-tab="${type}">去登录</button></div></div>`;
  const sklandRow = (game, label) => {
    const binding = hgBindings.find((b) => b.appCode === game);
    const role = binding?.roles?.[0];
    return `<div class="auth-game"><div class="auth-game-head"><strong>${label}</strong><span>森空岛</span></div>
      ${binding ? `<div class="role-item"><div class="role-main"><strong>${esc(binding.nickname || role?.nickname || binding.uid)}</strong><span>UID ${esc(binding.uid)} · ${esc(binding.channelName || role?.serverName || '')}</span></div><button class="ghost-btn" data-action="tp-skland-sync" data-game="${game}">同步</button></div>` : `<div class="auth-empty">未绑定角色</div>`}
    </div>`;
  };
  const nteCard = `<div class="auth-game"><div class="auth-game-head"><strong>异环</strong><span>塔吉多</span></div>${tjd.connected ? `<div class="role-item"><div class="role-main"><strong>${esc(tjd.user?.nickname || tjd.user?.roleId || '已登录')}</strong><span>UID ${esc(tjd.user?.uid || '')} · 官方记录约 180 天</span></div><button class="ghost-btn" data-action="tp-tjd-sync">同步</button></div>` : `<div class="role-item"><div class="role-main"><strong>未登录</strong><span>塔吉多</span></div><button class="ghost-btn" data-action="account-login-go" data-tab="tajiduo">去登录</button></div>`}</div>`;
  const sklandCards = hg.connected
    ? `${sklandRow('arknights', '明日方舟')}${sklandRow('endfield', '终末地')}${hgBindings.length ? '' : '<div class="auth-game"><div class="auth-empty">没有读取到森空岛绑定角色</div><button class="ghost-btn" data-action="tp-skland-refresh">刷新绑定</button></div>'}`
    : loginCard('skland', '森空岛', '明日方舟 / 终末地');
  return `<div class="account-summary">
      <span class="badge ${miLogged ? 'accent' : ''}">米游社 ${miLogged ? '已登录' : '未登录'}</span>
      <span class="badge ${hg.connected ? 'accent' : ''}">森空岛 ${hg.connected ? '已登录' : '未登录'}</span>
      <span class="badge ${tjd.connected ? 'accent' : ''}">塔吉多 ${tjd.connected ? '已登录' : '未登录'}</span>
    </div>
    <div class="auth-games">
      ${miLogged ? authRoleRows() : loginCard('miyoushe', '米游社', '原神 / 星铁 / 绝区零')}
      ${sklandCards}
      ${nteCard}
    </div>`;
}

function renderAccountModalBody() {
  const tab = state.accountTab === 'login' ? 'login' : 'accounts';
  return `<div data-auth-modal>
    <h2>账号</h2>
    <div class="tabs auth-tabs">
      <button class="tab ${tab === 'accounts' ? 'active' : ''}" data-action="account-tab" data-tab="accounts">游戏账号</button>
      <button class="tab ${tab === 'login' ? 'active' : ''}" data-action="account-tab" data-tab="login">账号登录</button>
    </div>
    <div class="auth-tab-body">${tab === 'login' ? renderAccountLoginTab() : renderAccountListTab()}</div>
    <div class="modal-actions" style="justify-content:flex-end"><button class="ghost-btn" data-action="auth-close">关闭</button></div>
  </div>`;
}

function drawAuthQr() {
  const img = $('#auth-qr-image') || $('#login-auth-qr-image');
  if (!img || !state.auth.url) return;
  try {
    const qr = qrcode(0, 'M');
    qr.addData(state.auth.url);
    qr.make();
    img.src = qr.createDataURL(7, 2);
  } catch { /* leave placeholder */ }
}

function refreshAuthModal() {
  if (!$('[data-auth-modal]')) return;
  openModal(renderAccountModalBody());
  if (state.accountTab === 'login') {
    if (state.authTab === 'miyoushe') drawAuthQr();
    else if (state.authTab === 'skland') drawThirdPartyQr();
  }
}

async function openAccountModal() {
  if (!state.thirdparty.status) await loadThirdParty().catch(() => {});
  const hg = state.thirdparty.status?.hypergryph;
  if (hg?.connected && !(hg.bindings || []).length) {
    try {
      await api('/api/thirdparty/skland/bindings');
      await loadThirdParty();
    } catch { /* show empty state below */ }
  }
  openModal(renderAccountModalBody());
  if (state.accountTab === 'login') {
    if (state.authTab === 'miyoushe') drawAuthQr();
    else if (state.authTab === 'skland') drawThirdPartyQr();
  }
  if (state.auth.status === 'Confirmed' && !Object.keys(state.auth.rolesByGame || {}).length) {
    loadAllAuthRoles().catch(() => {});
  }
  ensureLoginTab();
}

function ensureLoginTab() {
  if (!$('[data-auth-modal]') || state.accountTab !== 'login') return;
  if (state.authTab === 'miyoushe' && state.auth.status !== 'Confirmed') {
    if (!state.auth.sessionId) startAuthQr().catch((e) => toast(e.message, 'err'));
    else if (state.auth.url) startAuthPolling();
  }
  if (state.authTab === 'skland' && state.thirdparty?.qr?.url && state.thirdparty.qr.status !== 'Confirmed') {
    startThirdPartyQrPolling();
  }
}

async function startAuthQr() {
  clearQrTimer();
  const data = await api('/api/auth/qr', { method: 'POST', body: '{}' });
  state.auth = { sessionId: data.sessionId, status: 'Created', url: data.url, user: null, rolesByGame: {}, errors: {}, startedAt: Date.now() };
  refreshAuthModal(true);
  startAuthPolling();
}

function startAuthPolling() {
  if (state.authTimer) clearInterval(state.authTimer);
  state.authTimer = setInterval(pollAuth, 1800);
}

async function pollAuth() {
  if (!state.auth.sessionId) return;
  try {
    const data = await api('/api/auth/qr/' + encodeURIComponent(state.auth.sessionId));
    state.auth.status = data.session.status;
    state.auth.user = data.session.user || state.auth.user;
    if (['Confirmed', 'Expired', 'Cancelled'].includes(state.auth.status)) {
      clearQrTimer();
      if (state.auth.status === 'Confirmed') {
        state.accountTab = 'accounts';
        await loadAllAuthRoles();
        renderShell();
        toast('米游社登录成功');
      } else {
        refreshAuthModal();
      }
    } else {
      refreshAuthModal();
    }
  } catch (e) {
    clearQrTimer();
    toast(e.message, 'err');
  }
}

async function loadAllAuthRoles() {
  if (!state.auth.sessionId) return;
  try {
    const data = await api('/api/auth/roles-all?sessionId=' + encodeURIComponent(state.auth.sessionId));
    state.auth.rolesByGame = data.roles || {};
    state.auth.errors = data.errors || {};
    renderShell();
    refreshAuthModal(true);
  } catch (e) {
    toast(e.message, 'err', 5000);
  }
}

async function syncAuthRole(game, uid) {
  const role = (state.auth.rolesByGame?.[game] || []).find((r) => String(r.uid) === String(uid));
  if (!role) throw new Error('找不到该角色');
  const data = await api('/api/auth/link', { method: 'POST', body: JSON.stringify({ sessionId: state.auth.sessionId, game, role }) });
  state.accountTab = 'accounts';
  if (data.game && data.game !== state.game) {
    state.game = data.game;
    state.catalog = null;
    document.body.dataset.game = data.game;
  }
  await reloadAfterSync(data);
  refreshAuthModal();
}

async function syncAllAuthGames() {
  const sessionId = state.auth.sessionId;
  if (!sessionId) throw new Error('请先登录米游社');
  const roleMap = state.auth.rolesByGame || {};
  const results = [];
  for (const game of ['genshin', 'hsr', 'zzz']) {
    const role = (roleMap[game] || [])[0];
    if (!role) { results.push({ game, ok: false, message: '无角色' }); continue; }
    try {
      const data = await api('/api/auth/link', { method: 'POST', body: JSON.stringify({ sessionId, game, role }) });
      results.push({ game, ok: true, added: data.addedFive || 0, total: data.totalFetched || 0 });
    } catch (e) {
      results.push({ game, ok: false, message: e.message });
    }
  }
  try { await api('/api/auth/zzz-stats', { method: 'POST', body: JSON.stringify({ sessionId }) }); } catch { /* optional */ }
  $('#modal-root').innerHTML = '';
  state.records = null;
  await loadDashboard();
  await loadCatalog().catch(() => {});
  renderShell();
  renderView();
  const ok = results.filter((r) => r.ok).length;
  const failed = results.filter((r) => !r.ok);
  toast(ok ? `已同步 ${ok} 个游戏${failed.length ? `，${failed.length} 个失败` : ''}` : (failed[0]?.message || '同步失败'), ok ? 'ok' : 'err', 5000);
}

async function authZzzStats() {
  if (!state.auth.sessionId) throw new Error('请先登录米游社');
  const data = await api('/api/auth/zzz-stats', { method: 'POST', body: JSON.stringify({ sessionId: state.auth.sessionId }) });
  $('#modal-root').innerHTML = '';
  state.game = 'zzz';
  state.catalog = null;
  document.body.dataset.game = 'zzz';
  await loadDashboard();
  await loadCatalog().catch(() => {});
  renderShell();
  renderView();
  toast('绝区零全量统计已更新');
}

async function logoutAuth() {
  if (state.auth.sessionId) await api('/api/auth/logout', { method: 'POST', body: JSON.stringify({ sessionId: state.auth.sessionId }) }).catch(() => {});
  state.auth = { sessionId: '', status: '', url: '', user: null, rolesByGame: {}, errors: {}, startedAt: 0 };
  clearQrTimer();
  $('#modal-root').innerHTML = '';
  renderShell();
  toast('已退出米游社');
}


function renderScreenshotImport() {
  const ocr = state.ocr;
  const items = state.catalog?.items || [];
  const fiveNames = [...new Set(items.filter((i) => i.rarity === 5).map((i) => i.name))];
  return `<div class="card">
    <div class="card-head"><div class="card-title"><span class="mark"></span><h3>从截图录入${topLabel()}</h3><span>LOCAL OCR</span></div></div>
    <div class="dropzone" id="ocr-dropzone" style="margin-top:14px">${ICONS.upload}<strong>拖入截图，或点击选择</strong><input type="file" id="ocr-file" accept="image/png,image/jpeg,image/webp" hidden></div>
    ${ocr?.preview ? `<div style="margin-top:16px"><div class="ocr-zoom"><img id="ocr-preview-img" class="preview-img click-crop" src="${attr(ocr.preview)}" alt=""></div><div style="display:flex;justify-content:center;margin-top:10px"><button class="primary-btn" data-action="ocr-run">${ICONS.spark} 开始识别</button></div></div>` : ''}
    ${state.iconMatch ? renderIconMatch() : ''}
    ${ocr?.result ? renderOcrResult(ocr.result, fiveNames) : ''}
    ${ocr?.error ? `<div class="notice red" style="margin-top:14px">${ICONS.warn}<div>${esc(ocr.error)}</div></div>` : ''}
  </div>
  <datalist id="five-names">${fiveNames.map((n) => `<option value="${attr(n)}">`).join('')}</datalist>`;
}

function renderIconMatch() {
  const m = state.iconMatch;
  if (m.loading) return `<div class="icon-match"><div class="loading-line"><span class="spinner"></span>匹配中…</div></div>`;
  if (!m.candidates?.length) return '';
  return `<div class="icon-match">
    <div class="match-preview"><img src="${attr(m.crop)}" alt=""></div>
    <div class="match-body"><div class="card-title"><span class="mark"></span><h3>图标匹配</h3></div><div class="match-candidates">${m.candidates.map((c, i) => `<button class="match-candidate" data-action="icon-pick" data-index="${i}"><strong>${esc(c.name)}</strong><span>${esc(c.type)} · ${c.rarity}★</span><small>${Math.round((c.score || 0) * 100)}%</small></button>`).join('')}</div></div>
  </div>`;
}

function loadImageElement(src) {
  return new Promise((resolve) => {
    const img = new Image();
    img.decoding = 'async';
    img.onload = () => resolve(img);
    img.onerror = () => resolve(null);
    img.src = src;
  });
}

const shareImageCache = new Map();

function loadCorsImage(src) {
  return new Promise((resolve) => {
    const img = new Image();
    img.crossOrigin = 'anonymous';
    img.decoding = 'async';
    const timer = setTimeout(() => resolve(null), 5000);
    const finish = (value) => { clearTimeout(timer); resolve(value); };
    img.onload = () => finish(img);
    img.onerror = () => finish(null);
    img.src = src;
  });
}

async function loadShareImage(iconUrl) {
  if (!iconUrl) return null;
  if (shareImageCache.has(iconUrl)) return shareImageCache.get(iconUrl);
  if (iconUrl.startsWith('/api/asset')) return loadImageElement(iconUrl);
  const direct = /^https?:/i.test(iconUrl) ? await loadCorsImage(iconUrl) : null;
  const proxied = direct || await Promise.race([
    loadImageElement(`/api/asset?u=${encodeURIComponent(iconUrl)}`),
    new Promise((resolve) => setTimeout(() => resolve(null), 6000)),
  ]);
  if (proxied) shareImageCache.set(iconUrl, proxied);
  return proxied;
}

function canvasDescriptor(source, margin = 0.08) {
  const size = 64;
  const c = document.createElement('canvas');
  c.width = size;
  c.height = size;
  const ctx = c.getContext('2d', { willReadFrequently: true });
  ctx.fillStyle = '#ffffff';
  ctx.fillRect(0, 0, size, size);
  const sw = source.naturalWidth || source.width;
  const sh = source.naturalHeight || source.height;
  ctx.drawImage(source, sw * margin, sh * margin, sw * (1 - margin * 2), sh * (1 - margin * 2), 0, 0, size, size);
  const data = ctx.getImageData(0, 0, size, size).data;
  const gray = new Float32Array(size * size);
  for (let i = 0; i < gray.length; i++) gray[i] = (data[i * 4] * 0.299 + data[i * 4 + 1] * 0.587 + data[i * 4 + 2] * 0.114) / 255;

  const cells = 8, bins = 9, cell = size / cells;
  const hist = new Float32Array(cells * cells * bins);
  for (let y = 1; y < size - 1; y++) {
    for (let x = 1; x < size - 1; x++) {
      const gx = gray[y * size + x + 1] - gray[y * size + x - 1];
      const gy = gray[(y + 1) * size + x] - gray[(y - 1) * size + x];
      const mag = Math.hypot(gx, gy);
      let ang = (Math.atan2(gy, gx) + Math.PI) % Math.PI;
      let bin = Math.floor((ang / Math.PI) * bins) % bins;
      const cx = Math.min(cells - 1, Math.floor(x / cell));
      const cy = Math.min(cells - 1, Math.floor(y / cell));
      hist[(cy * cells + cx) * bins + bin] += mag;
    }
  }
  const hog = [];
  for (let y = 0; y < cells - 1; y++) {
    for (let x = 0; x < cells - 1; x++) {
      let norm = 0;
      const block = [];
      for (let dy = 0; dy < 2; dy++) for (let dx = 0; dx < 2; dx++) for (let b = 0; b < bins; b++) {
        const v = hist[((y + dy) * cells + x + dx) * bins + b];
        block.push(v); norm += v * v;
      }
      norm = Math.sqrt(norm) + 1e-6;
      for (const v of block) hog.push(v / norm);
    }
  }

  const cs = document.createElement('canvas');
  cs.width = 16; cs.height = 16;
  const cctx = cs.getContext('2d', { willReadFrequently: true });
  cctx.fillStyle = '#fff'; cctx.fillRect(0, 0, 16, 16);
  cctx.drawImage(c, 0, 0, 16, 16);
  const cdata = cctx.getImageData(0, 0, 16, 16).data;
  const color = new Float32Array(64);
  for (let i = 0; i < 256; i++) {
    const r = Math.min(3, Math.floor(cdata[i * 4] / 64));
    const g = Math.min(3, Math.floor(cdata[i * 4 + 1] / 64));
    const b = Math.min(3, Math.floor(cdata[i * 4 + 2] / 64));
    color[r * 16 + g * 4 + b] += 1 / 256;
  }
  return { hog: Float32Array.from(hog), color };
}

function descriptorScore(a, b) {
  let dot = 0, na = 0, nb = 0;
  for (let i = 0; i < a.hog.length; i++) { dot += a.hog[i] * b.hog[i]; na += a.hog[i] ** 2; nb += b.hog[i] ** 2; }
  const hog = dot / (Math.sqrt(na) * Math.sqrt(nb) + 1e-6);
  let color = 0;
  for (let i = 0; i < a.color.length; i++) color += Math.min(a.color[i], b.color[i]);
  return hog * 0.7 + color * 0.3;
}

async function loadIconIndex(game) {
  state.iconIndex = state.iconIndex || {};
  if (state.iconIndex[game]) return state.iconIndex[game];
  if (state.catalog && state.catalog.game !== game) state.catalog = null;
  if (!state.catalog) await loadCatalog();
  const items = (state.catalog?.items || []).filter((i) => i.rarity === 5 && i.iconUrl);
  const out = [];
  let cursor = 0;
  const worker = async () => {
    while (cursor < items.length) {
      const item = items[cursor++];
      const img = await loadImageElement(item.iconUrl);
      if (!img || !img.naturalWidth) continue;
      out.push({ item, desc: canvasDescriptor(img, 0.12) });
    }
  };
  await Promise.all(Array.from({ length: 6 }, () => worker()));
  state.iconIndex[game] = out;
  return out;
}

async function matchIconAt(img, ev) {
  const rect = img.getBoundingClientRect();
  if (!rect.width || !img.naturalWidth) return;
  const scale = img.naturalWidth / rect.width;
  const size = 110;
  const cx = (ev.clientX - rect.left) * scale;
  const cy = (ev.clientY - rect.top) * scale;
  const canvas = document.createElement('canvas');
  canvas.width = size;
  canvas.height = size;
  const ctx = canvas.getContext('2d');
  ctx.drawImage(img, Math.max(0, cx - size / 2), Math.max(0, cy - size / 2), size, size, 0, 0, size, size);
  const crop = canvas.toDataURL('image/png');
  state.iconMatch = { loading: true, crop, candidates: [] };
  renderView();
  try {
    const index = await loadIconIndex(state.game);
    const desc = canvasDescriptor(canvas, 0.08);
    const candidates = index.map(({ item, desc: d }) => ({ ...item, score: descriptorScore(desc, d) }))
      .sort((a, b) => b.score - a.score).slice(0, 6);
    state.iconMatch = { loading: false, crop, candidates };
    renderView();
  } catch (e) {
    state.iconMatch = { loading: false, crop, candidates: [] };
    renderView();
    toast(e.message, 'err', 5000);
  }
}

function renderOcrResult(result, fiveNames) {
  const rows = result.candidates || [];
  return `<div style="margin-top:18px">
    <div style="display:flex;justify-content:space-between;align-items:center;gap:10px;flex-wrap:wrap"><div class="card-title"><span class="mark"></span><h3>识别结果</h3><span>${rows.length} 条候选</span></div><div style="display:flex;gap:7px"><button class="ghost-btn" data-action="ocr-add">+ 手动一行</button><button class="primary-btn" data-action="ocr-save">${ICONS.download} 保存${topLabel()}记录</button></div></div>
    <div class="ocr-summary" style="margin-bottom:12px">
      <div class="mini-stat"><span>识别候选</span><b>${rows.length}</b></div>
      <div class="mini-stat"><span>总抽数（OCR）</span><b>${result.summary?.totalPulls ?? '—'}</b></div>
      <div class="mini-stat"><span>${topLabel()}数（OCR）</span><b>${result.summary?.fiveStars ?? '—'}</b></div>
    </div>
    ${rows.length ? `<div class="table-wrap"><table class="review-table"><thead><tr><th>时间</th><th>名称</th><th>星级</th><th>抽数</th><th>置信</th><th></th></tr></thead><tbody id="ocr-rows">${rows.map((r, i) => ocrRow(r, i)).join('')}</tbody></table></div>` : `<div class="empty-chart" style="height:100px">没有识别出${topLabel()}行。可以换一张更清晰的截图，或手填。</div>`}
    ${result.summary?.totalPulls || result.summary?.fiveStars ? `<div style="margin-top:12px;display:flex;gap:8px;flex-wrap:wrap"><button class="ghost-btn" data-action="ocr-to-summary" data-total="${result.summary.totalPulls || ''}" data-five="${result.summary.fiveStars || ''}">填入历史汇总</button><button class="primary-btn" data-action="ocr-save-summary" data-total="${result.summary.totalPulls || ''}" data-five="${result.summary.fiveStars || ''}">保存汇总</button></div>` : ''}
  </div>`;
}

function ocrRow(r, i) {
  return `<tr data-ocr-row="${i}">
    <td><input class="input time-input" data-field="time" value="${attr(r.time || '')}" placeholder="2025-01-01 12:00:00"></td>
    <td><input class="input name-input" list="five-names" data-field="name" value="${attr(r.name || '')}" placeholder="角色 / 武器名"></td>
    <td><select class="input rank-select" data-field="rank"><option value="5" selected>${topLabel()}</option><option value="4">四星</option><option value="3">三星</option></select></td>
    <td><input class="input" style="width:58px" data-field="pity" value="${attr(r.pity ?? '')}" placeholder="—"></td>
    <td><span class="badge ${r.confidence >= .8 ? 'accent' : 'gold'}">${Math.round((r.confidence || 0) * 100)}%</span></td>
    <td><button class="ghost-btn danger" style="padding:5px 7px" data-action="ocr-remove" data-index="${i}">×</button></td>
  </tr>`;
}

function renderSummaryImport() {
  const d = state.dashboard;
  const snaps = d?.snapshots || [];
  const pre = state.pendingSummary || {};
  return `<div class="card">
    <div class="card-head"><div class="card-title"><span class="mark"></span><h3>历史汇总录入</h3><span>AGGREGATE</span></div></div>
    <form id="snapshot-form" class="form-grid" style="margin-top:16px">
      <div class="field"><label>覆盖开始</label><input class="input" type="date" name="periodStart" value="${esc(d?.coverage?.start || d?.coverage?.launchDate || '2024-07-04')}" required></div>
      <div class="field"><label>覆盖结束</label><input class="input" type="date" name="periodEnd" value="${esc(new Date().toISOString().slice(0, 10))}" required></div>
      <div class="field"><label>总抽数 *</label><input class="input" type="number" min="1" max="999999" name="totalPulls" placeholder="例如 1560" value="${attr(pre.totalPulls || '')}" required></div>
      <div class="field"><label>${topLabel()}数量</label><input class="input" type="number" min="0" max="99999" name="fiveStars" placeholder="例如 22" value="${attr(pre.fiveStars || '')}"></div>
      <div class="field span-2"><label>备注 / 来源</label><input class="input" name="note" placeholder="例如：提瓦特小助手 2025-01 截图"></div>
      <div class="span-2" style="display:flex;justify-content:flex-end"><button class="primary-btn" type="submit">${ICONS.download} 保存汇总</button></div>
    </form>
    ${snaps.length ? `<div style="margin-top:24px"><div class="card-title" style="margin-bottom:10px"><span class="mark"></span><h3>已录入汇总</h3><span>${snaps.length} 段</span></div><div class="table-wrap"><table><thead><tr><th>区间</th><th>来源</th><th>总抽</th><th>五星</th><th>与官方重叠</th><th></th></tr></thead><tbody>${snaps.map((s) => `<tr><td class="time-cell">${esc(String(s.periodStart || '').slice(0, 10))} → ${esc(String(s.periodEnd || '').slice(0, 10))}</td><td><span class="badge ${s.source === 'zzz-official' ? 'accent' : ''}">${s.source === 'zzz-official' ? '官方全量' : '录入'}</span></td><td>${fmt(s.totalPulls)}</td><td>${fmt(s.fiveStars)}</td><td>${s.exactFiveWithin ? `<span class="badge gold">${s.exactFiveWithin} 张五星</span>` : '<span class="muted">—</span>'}</td><td><button class="ghost-btn danger" style="padding:5px 7px" data-action="snapshot-delete" data-id="${attr(s.id)}">删除</button></td></tr>`).join('')}</tbody></table></div></div>` : ''}
  </div>`;
}

// ---------------- catalog ----------------

async function loadCatalog() {
  if (state.catalog && state.catalog.game !== state.game) state.catalog = null;
  if (state.catalog) { renderView(); return; }
  const data = await api(`/api/catalog?game=${state.game}`);
  state.catalog = data.catalog;
  if (state.view === 'catalog' || state.view === 'import') renderView();
}

function renderCatalog() {
  const c = state.catalog;
  const d = state.dashboard;
  const owned = new Set((d?.fiveItems || []).map((i) => i.name));
  const f = state.catalogFilter;
  if (!c) return `<div class="loading-line"><span class="spinner"></span>载入图鉴…</div>`;
  if (!c.items.length) {
    return `<div class="page-head"><div><div class="eyebrow">CATALOG · NULL</div><h1>角色图鉴</h1></div></div><div class="empty-state"><div class="orb">${ICONS.catalog}</div><h2>暂无图鉴</h2><p>${GAME_META[state.game]?.name || state.game}暂未内置图鉴；手动录入、Excel 和同步不受影响。</p></div>`;
  }
  const types = [...new Set(c.items.map((i) => i.type))];
  const rankGame = ['arknights', 'endfield'].includes(state.game);
  const top = rankGame ? 6 : 5;
  const rarityText = (r) => state.game === 'nte'
    ? (r === 5 ? 'S级' : r === 4 ? 'A级' : 'B级')
    : `${rankGame ? (r === 5 ? '六星' : r === 4 ? '五星' : '四星') : (r === 5 ? '五星' : r === 4 ? '四星' : '三星')}`;
  const rarityLine = (r) => state.game === 'nte'
    ? (r === 5 ? 'S' : r === 4 ? 'A' : 'B')
    : '★'.repeat(top === 6 ? (r === 5 ? 6 : r === 4 ? 5 : 4) : (r === 5 ? 5 : r === 4 ? 4 : 3));
  const items = c.items.filter((i) => {
    if (f.type !== 'all' && i.type !== f.type) return false;
    if (f.rarity !== 'all' && String(i.rarity) !== f.rarity) return false;
    if (f.search && !i.name.includes(f.search)) return false;
    return true;
  });
  return `<div class="page-head"><div><div class="eyebrow">CATALOG · LIVE DATA</div><h1>角色图鉴</h1></div><div class="page-head-actions"><button class="ghost-btn" data-action="catalog-sync">${ICONS.refresh} 同步图鉴</button><span class="pill"><b>${fmt(c.items.length)}</b> 条目</span></div></div>
  <div class="catalog-toolbar">
    <div class="search-box">${ICONS.search}<input id="catalog-search" class="input" placeholder="搜索名称、角色、武器…" value="${attr(f.search)}"></div>
    <select id="catalog-type" class="select" style="width:140px"><option value="all">全部类型</option>${types.map((t) => `<option value="${attr(t)}" ${f.type === t ? 'selected' : ''}>${esc(t)}</option>`).join('')}</select>
    <select id="catalog-rarity" class="select" style="width:120px"><option value="all">全部稀有度</option><option value="5" ${f.rarity === '5' ? 'selected' : ''}>${rarityText(5)}</option><option value="4" ${f.rarity === '4' ? 'selected' : ''}>${rarityText(4)}</option><option value="3" ${f.rarity === '3' ? 'selected' : ''}>${rarityText(3)}</option></select>
    <span class="hint" style="margin-left:auto;color:var(--muted-2);font-size:11px" title="${attr(c.source || '')}">${c.items.length} 条 · ${esc(c.version || '')} · ${esc(c.source || '')}</span>
  </div>
  <div class="card"><div class="catalog-grid">${items.length ? items.map((i) => `<div class="catalog-item"><div class="art ${i.iconUrl ? '' : 'img-missing'}"><span class="fallback">✦</span>${i.iconUrl ? `<img loading="${['arknights', 'endfield', 'nte'].includes(state.game) ? 'eager' : 'lazy'}" src="${attr(i.iconUrl)}" alt="" onerror="this.onerror=null;this.parentElement?.classList.add('img-missing');this.remove()">` : ''}<span class="rarity-line">${rarityLine(i.rarity || 0)}</span>${owned.has(i.name) ? `<span class="owned">✓</span>` : ''}</div><div class="meta"><strong title="${attr(i.name)}">${esc(i.name)}</strong><span>${esc(i.type)}${i.path ? ` · ${esc(i.path)}` : ''}</span></div></div>`).join('') : `<div class="catalog-empty">没有匹配的图鉴条目</div>`}</div></div>
`;
}

// ---------------- settings ----------------

function renderSettings() {
  const c = state.catalog;
  const thirdParty = ['arknights', 'endfield', 'nte'].includes(state.game);
  return `<div class="page-head"><div><div class="eyebrow">SYSTEM</div><h1>设置</h1></div></div>
  <div class="settings-grid">
    <div class="card">
      <div class="card-head"><div class="card-title"><span class="mark"></span><h3>数据管理</h3><span>DATA</span></div></div>
      ${thirdParty ? '' : `<div class="setting-row"><div class="setting-copy"><strong>导入 UIGF / SRGF JSON</strong></div><label class="ghost-btn" style="cursor:pointer">${ICONS.upload} 选择文件<input type="file" id="uigf-file" accept="application/json,.json" hidden></label></div>
      <div class="setting-row"><div class="setting-copy"><strong>导出当前游戏 UIGF</strong></div><a class="ghost-btn" href="/api/export/uigf?game=${state.game}">${ICONS.download} 导出</a></div>`}
      <div class="setting-row"><div class="setting-copy"><strong>导出 CSV</strong></div><a class="ghost-btn" href="/api/export/csv?game=${state.game}">${ICONS.download} 导出</a></div>
      <div class="setting-row"><div class="setting-copy"><strong>整库备份</strong></div><a class="ghost-btn" href="/api/backup">${ICONS.download} 备份</a></div>
      <div class="setting-row"><div class="setting-copy"><strong>重置当前游戏</strong></div><button class="ghost-btn danger" data-action="reset-game">重置</button></div>
    </div>
    <div class="card">
      <div class="card-head"><div class="card-title"><span class="mark"></span><h3>游戏顺序</h3><span>ORDER</span></div></div>
      ${state.gameOrder.map((id, i) => `<div class="setting-row" style="${state.hiddenGames.includes(id) ? 'opacity:.45' : ''}"><div class="setting-copy"><strong>${GAME_META[id].label}</strong></div><div style="display:flex;gap:6px"><button class="ghost-btn" data-action="toggle-game" data-game="${id}">${state.hiddenGames.includes(id) ? '显示' : '隐藏'}</button><button class="ghost-btn" data-action="move-game" data-game="${id}" data-dir="-1" ${i === 0 ? 'disabled' : ''}>↑</button><button class="ghost-btn" data-action="move-game" data-game="${id}" data-dir="1" ${i === state.gameOrder.length - 1 ? 'disabled' : ''}>↓</button></div></div>`).join('')}
    </div>
    <div class="card">
      <div class="card-head"><div class="card-title"><span class="mark"></span><h3>运行信息</h3><span>ABOUT</span></div></div>
      <div class="kv"><span>版本</span><b>v${esc(state.shell?.displayVersion || state.shell?.version || '1.06')}</b></div>
      <div class="kv"><span>开源协议</span><b>MIT License</b></div>
      <div class="kv"><span>项目地址</span><b><a href="https://github.com/ichiryu0021/eryou-archive" target="_blank" rel="noreferrer" style="color:var(--accent)">GitHub</a></b></div>
      <div class="kv"><span>开源组件</span><b>Electron · QR Code · genshin-db</b></div>
      <div class="kv"><span>数据来源</span><b>HoYoWiki · genshin-db</b></div>
      <div class="kv"><span>数据目录</span><b>${esc(state.dataDir || './data')}</b></div>
      <div class="kv"><span>图鉴</span><b>${c ? `${c.items.length} 条 · ${esc(c.version || '')}` : '按需加载'}</b></div>
      <div class="kv"><span>当前账号</span><b>${state.dashboard?.meta?.uid ? `UID ${esc(state.dashboard.meta.uid)}` : '未绑定'}</b></div>
      <div class="kv"><span>最近同步</span><b>${state.dashboard?.meta?.lastSync ? timeAgo(state.dashboard.meta.lastSync) : '尚未同步'}</b></div>
    </div>
    <div class="card">
      <div class="card-head"><div class="card-title"><span class="mark"></span><h3>软件更新</h3><span>UPDATE</span></div></div>
      <div class="setting-row"><div class="setting-copy"><strong>当前版本</strong><span>v${esc(state.shell?.displayVersion || state.shell?.version || '1.06')}</span></div><button class="ghost-btn" data-action="check-update">检查更新</button></div>
      ${state.update?.checking ? '<div class="kv"><span>状态</span><b>检查中…</b></div>' : ''}
      ${state.update && !state.update.checking ? `<div class="kv"><span>最新版本</span><b>v${esc(state.update.latest || '—')}</b></div>${state.update.hasUpdate ? `<div style="padding:10px 16px 14px"><button class="primary-btn" data-action="apply-update">更新到 v${esc(state.update.latest)}</button></div>` : ''}` : ''}
    </div>
  </div>`;
}

// ---------------- third-party sync ----------------

function clearThirdPartyQrTimer() {
  if (state.thirdparty?.qrTimer) clearInterval(state.thirdparty.qrTimer);
  if (state.thirdparty) state.thirdparty.qrTimer = null;
}

function drawThirdPartyQr() {
  if (!state.thirdparty?.qr?.url) return;
  let dataUrl = '';
  try {
    const qr = qrcode(0, 'M');
    qr.addData(state.thirdparty.qr.url);
    qr.make();
    dataUrl = qr.createDataURL(7, 2);
  } catch { /* leave placeholder */ }
  for (const [imageSel, frameSel] of [['#login-tp-qr-image', '#login-tp-qr-frame'], ['#auth-tp-qr-image', '#auth-tp-qr-frame'], ['#tp-qr-image', '#tp-qr-frame']]) {
    const img = $(imageSel);
    if (img && dataUrl) img.src = dataUrl;
    if (!dataUrl) {
      const frame = $(frameSel);
      if (frame) frame.innerHTML = '<div class="qr-placeholder">二维码生成失败</div>';
    }
  }
}

async function loadThirdParty() {
  state.thirdparty.loading = true;
  try {
    const [data, banners] = await Promise.all([
      api('/api/thirdparty/status'),
      api(`/api/banners?game=${encodeURIComponent(state.game)}`).catch(() => null),
    ]);
    state.thirdparty.status = data.thirdparty;
    state.banners = banners;
    state.thirdparty.error = '';
  } catch (e) {
    state.thirdparty.error = e.message;
  } finally {
    state.thirdparty.loading = false;
  }
  renderShell();
  if (state.view === 'import') renderView();
}

function startThirdPartyQrPolling() {
  clearThirdPartyQrTimer();
  state.thirdparty.qrTimer = setInterval(async () => {
    const id = state.thirdparty.qr?.id;
    if (!id || state.thirdparty.qrBusy) return;
    state.thirdparty.qrBusy = true;
    try {
      const data = await api(`/api/thirdparty/skland/qr/${encodeURIComponent(id)}`);
      const session = data.session || {};
      state.thirdparty.qr = { ...state.thirdparty.qr, ...session };
      if (session.status === 'Confirmed') {
        state.accountTab = 'accounts';
        state.thirdparty.qr = null;
        clearThirdPartyQrTimer();
        await loadThirdParty();
        toast('森空岛登录成功');
      } else if (session.status === 'Error' || session.status === 'Expired') {
        clearThirdPartyQrTimer();
      }
      if (state.view === 'import') renderView();
      if ($('[data-auth-modal]') && state.authTab === 'skland') refreshAuthModal(true);
    } catch (e) {
      clearThirdPartyQrTimer();
      state.thirdparty.qr = { ...(state.thirdparty.qr || {}), status: 'Error', message: e.message };
      if (state.view === 'import') renderView();
      if ($('[data-auth-modal]') && state.authTab === 'skland') refreshAuthModal(true);
    } finally {
      state.thirdparty.qrBusy = false;
    }
  }, 2000);
}

// ---------------- render & events ----------------

function renderView() {
  const root = $('#view');
  if (!root) return;
  if (state.view === 'dashboard') root.innerHTML = renderDashboard();
  else if (state.view === 'records') root.innerHTML = renderRecords();
  else if (state.view === 'import') root.innerHTML = renderImport();
  else if (state.view === 'catalog') root.innerHTML = renderCatalog();
  else if (state.view === 'settings') root.innerHTML = renderSettings();
  bindView();
  if (state.view === 'import' && state.importTab === 'manual') {
    const setFilter = (key, value) => { state.manualFilters = { ...(state.manualFilters || {}), [key]: value }; renderView(); };
    $('#manual-version')?.addEventListener('change', (e) => setFilter('version', e.target.value));
    $('#manual-attr')?.addEventListener('change', (e) => setFilter('attr', e.target.value));
    $('#manual-field')?.addEventListener('change', (e) => setFilter('field', e.target.value));
    $('#manual-form')?.addEventListener('submit', saveManualRecord);
    const excel = $('#manual-excel-file');
    const excelDrop = $('#manual-excel-drop');
    excel?.addEventListener('change', () => { if (excel.files?.[0]) importManualExcel(excel.files[0]); });
    if (excelDrop) {
      excelDrop.addEventListener('click', (e) => { if (e.target !== excel) excel?.click(); });
      for (const type of ['dragenter', 'dragover']) excelDrop.addEventListener(type, (e) => { e.preventDefault(); excelDrop.classList.add('dragover'); });
      excelDrop.addEventListener('dragleave', () => excelDrop.classList.remove('dragover'));
      excelDrop.addEventListener('drop', (e) => { e.preventDefault(); excelDrop.classList.remove('dragover'); const file = e.dataTransfer.files?.[0]; if (file) importManualExcel(file); });
    }
  }
  if (state.view === 'import' && state.importTab === 'qr' && state.qr?.url) drawQr();
}

function bindView() {
  if (state.view === 'records') {
    let timer = null;
    $('#record-search')?.addEventListener('input', (e) => {
      state.recordFilter.search = e.target.value;
      clearTimeout(timer);
      timer = setTimeout(() => loadRecords(1).catch((err) => toast(err.message, 'err')), 280);
    });
  }
  if (state.view === 'catalog') {
    let timer = null;
    $('#catalog-search')?.addEventListener('input', (e) => {
      state.catalogFilter.search = e.target.value;
      clearTimeout(timer);
      timer = setTimeout(renderView, 180);
    });
    $('#catalog-type')?.addEventListener('change', (e) => { state.catalogFilter.type = e.target.value; renderView(); });
    $('#catalog-rarity')?.addEventListener('change', (e) => { state.catalogFilter.rarity = e.target.value; renderView(); });
  }
  if (state.view === 'import' && state.importTab === 'screenshot') {
    const dz = $('#ocr-dropzone');
    const input = $('#ocr-file');
    dz?.addEventListener('click', () => input?.click());
    dz?.addEventListener('dragover', (e) => { e.preventDefault(); dz.classList.add('drag'); });
    dz?.addEventListener('dragleave', () => dz.classList.remove('drag'));
    dz?.addEventListener('drop', (e) => {
      e.preventDefault(); dz.classList.remove('drag');
      const file = e.dataTransfer.files?.[0];
      if (file) readScreenshot(file);
    });
    input?.addEventListener('change', () => { if (input.files?.[0]) readScreenshot(input.files[0]); });
    $('#ocr-preview-img')?.addEventListener('click', (e) => matchIconAt(e.currentTarget, e));
  }
  if (state.view === 'import' && state.importTab === 'summary') {
    $('#snapshot-form')?.addEventListener('submit', saveSnapshot);
  }
  if (state.view === 'import' && state.importTab === 'uigf') {
    const dz = $('#uigf-dropzone');
    const input = $('#uigf-tab-file');
    dz?.addEventListener('click', () => input?.click());
    dz?.addEventListener('dragover', (e) => { e.preventDefault(); dz.classList.add('drag'); });
    dz?.addEventListener('dragleave', () => dz.classList.remove('drag'));
    dz?.addEventListener('drop', (e) => {
      e.preventDefault(); dz.classList.remove('drag');
      importUigfFiles([...(e.dataTransfer.files || [])]);
    });
    input?.addEventListener('change', importUigfFile);
  }
  if (state.view === 'import' && state.importTab === 'nteuid') {
    const dz = $('#nteuid-dropzone');
    const input = $('#nteuid-file');
    dz?.addEventListener('click', () => input?.click());
    dz?.addEventListener('dragover', (e) => { e.preventDefault(); dz.classList.add('drag'); });
    dz?.addEventListener('dragleave', () => dz.classList.remove('drag'));
    dz?.addEventListener('drop', (e) => {
      e.preventDefault(); dz.classList.remove('drag');
      const file = e.dataTransfer.files?.[0];
      if (file) importNteuidFile(file);
    });
    input?.addEventListener('change', () => { if (input.files?.[0]) importNteuidFile(input.files[0]); });
  }
  if (state.view === 'import' && state.importTab === 'heybox') {
    const dz = $('#heybox-dropzone');
    const input = $('#heybox-file');
    dz?.addEventListener('click', () => input?.click());
    dz?.addEventListener('dragover', (e) => { e.preventDefault(); dz.classList.add('drag'); });
    dz?.addEventListener('dragleave', () => dz.classList.remove('drag'));
    dz?.addEventListener('drop', (e) => {
      e.preventDefault(); dz.classList.remove('drag');
      const file = e.dataTransfer.files?.[0];
      if (file) importHeyboxFile(file);
    });
    input?.addEventListener('change', () => { if (input.files?.[0]) importHeyboxFile(input.files[0]); });
  }
  if (state.view === 'import' && state.importTab === 'nteexport') {
    const dz = $('#nteexport-dropzone');
    const input = $('#nteexport-file');
    dz?.addEventListener('click', () => input?.click());
    dz?.addEventListener('dragover', (e) => { e.preventDefault(); dz.classList.add('drag'); });
    dz?.addEventListener('dragleave', () => dz.classList.remove('drag'));
    dz?.addEventListener('drop', (e) => {
      e.preventDefault(); dz.classList.remove('drag');
      const file = e.dataTransfer.files?.[0];
      if (file) importNteExportFile(file);
    });
    input?.addEventListener('change', () => { if (input.files?.[0]) importNteExportFile(input.files[0]); });
  }
  if (state.view === 'settings') {
    $('#uigf-file')?.addEventListener('change', importUigfFile);
  }
  if (state.view === 'import') {
  }
  if (state.view === 'import' && state.importTab === 'qr' && state.qr?.url) drawQr();
}

function drawQr() {
  const img = $('#qr-image');
  if (!img || !state.qr?.url) return;
  try {
    const qr = qrcode(0, 'M');
    qr.addData(state.qr.url);
    qr.make();
    img.src = qr.createDataURL(7, 2);
  } catch (e) {
    const frame = $('#qr-frame');
    if (frame) frame.innerHTML = `<div class="qr-placeholder">二维码生成失败<br>${esc(e.message)}</div>`;
  }
}

// Event delegation
document.addEventListener('click', async (e) => {
  const el = e.target.closest('[data-action]');
  if (!el) return;
  const action = el.dataset.action;
  try {
    if (action === 'go') {
      e.preventDefault();
      if (el.dataset.tab) state.importTab = el.dataset.tab;
      navigate(el.dataset.view);
      return;
    }
    if (action === 'switch-game') { setGame(el.dataset.game); return; }
    if (action === 'refresh') { await refreshAll(); toast('已刷新'); return; }
    if (action === 'tp-refresh') {
      await loadThirdParty();
      toast('官方同步状态已刷新');
      return;
    }
    if (action === 'tp-skland-start') {
      setBusy(el, true, '生成中');
      const data = await api('/api/thirdparty/skland/qr', { method: 'POST', body: '{}' });
      state.thirdparty.qr = { id: data.id, url: data.url, status: 'Created', message: '' };
      state.thirdparty.message = '';
      setBusy(el, false);
      renderView();
      if ($('[data-auth-modal]')) refreshAuthModal(true);
      startThirdPartyQrPolling();
      return;
    }
    if (action === 'tp-skland-refresh') {
      setBusy(el, true, '刷新中');
      await api('/api/thirdparty/skland/bindings');
      await loadThirdParty();
      setBusy(el, false);
      if ($('[data-auth-modal]')) refreshAuthModal(true);
      toast('绑定角色已刷新');
      return;
    }
    if (action === 'tp-skland-logout') {
      await api('/api/thirdparty/skland/logout', { method: 'POST', body: '{}' });
      clearThirdPartyQrTimer();
      state.thirdparty.qr = null;
      await loadThirdParty();
      if ($('[data-auth-modal]')) refreshAuthModal(true);
      toast('已退出森空岛');
      return;
    }
    if (action === 'tp-skland-sync') {
      setBusy(el, true, '同步中');
      const data = await api('/api/thirdparty/sync', { method: 'POST', body: JSON.stringify({ game: el.dataset.game }) });
      setBusy(el, false);
      await reloadAfterSync(data);
      if ($('[data-auth-modal]')) {
        await loadThirdParty();
        refreshAuthModal(true);
      }
      toast(`同步完成：${fmt(data.totalFetched)} 抽，新增 ${data.addedFive || 0} 张${topLabel(data.game)}`, 'ok', 5000);
      return;
    }
    if (action === 'tp-ef-scan') {
      setBusy(el, true, '扫描中');
      const data = await api('/api/thirdparty/endfield/scan', { method: 'POST', body: '{}' });
      state.thirdparty.status = { ...(state.thirdparty.status || {}), endfieldLog: data.links || [] };
      setBusy(el, false);
      renderView();
      toast(data.links?.length ? `找到 ${data.links.length} 条终末地链接` : '没有找到链接，请先在游戏内打开寻访记录');
      return;
    }
    if (action === 'tp-ef-sync-log') {
      setBusy(el, true, '同步中');
      const data = await api('/api/thirdparty/endfield/sync', { method: 'POST', body: JSON.stringify({ useLog: true }) });
      setBusy(el, false);
      await reloadAfterSync(data);
      toast(`终末地同步完成：${fmt(data.totalFetched)} 抽，新增 ${data.addedFive || 0} 张六星`, 'ok', 5000);
      return;
    }
    if (action === 'tp-ef-sync-paste') {
      const url = $('#tp-ef-url')?.value.trim();
      if (!url) throw new Error('请先粘贴终末地抽卡链接');
      setBusy(el, true, '同步中');
      const data = await api('/api/thirdparty/endfield/sync', { method: 'POST', body: JSON.stringify({ url }) });
      state.thirdparty.endfieldText = '';
      setBusy(el, false);
      await reloadAfterSync(data);
      toast(`终末地同步完成：${fmt(data.totalFetched)} 抽，新增 ${data.addedFive || 0} 张六星`, 'ok', 5000);
      return;
    }
    if (action === 'tp-tjd-send') {
      const phone = ($('#login-tjd-phone') || $('#auth-tjd-phone') || $('#tp-tjd-phone'))?.value.trim();
      if (!phone) throw new Error('请先填写手机号');
      setBusy(el, true, '发送中');
      const data = await api('/api/thirdparty/tajiduo/captcha', { method: 'POST', body: JSON.stringify({ phone }) });
      state.thirdparty.tajiduo = { ...state.thirdparty.tajiduo, phone, deviceId: data.deviceId || '', sent: true, message: '验证码已发送，请查看手机短信' };
      setBusy(el, false);
      if ($('[data-auth-modal]')) refreshAuthModal(true);
      else renderView();
      toast('验证码已发送');
      return;
    }
    if (action === 'tp-tjd-login') {
      const phone = ($('#login-tjd-phone') || $('#auth-tjd-phone') || $('#tp-tjd-phone'))?.value.trim();
      const code = ($('#login-tjd-code') || $('#auth-tjd-code') || $('#tp-tjd-code'))?.value.trim();
      if (!phone || !code) throw new Error('请填写手机号和验证码');
      if (!state.thirdparty.tajiduo.deviceId) throw new Error('请先点击“发送验证码”');
      setBusy(el, true, '登录中');
      await api('/api/thirdparty/tajiduo/login', { method: 'POST', body: JSON.stringify({ phone, code, deviceId: state.thirdparty.tajiduo.deviceId }) });
      state.thirdparty.tajiduo = { ...state.thirdparty.tajiduo, phone: '', code: '', sent: false, message: '' };
      state.accountTab = 'accounts';
      setBusy(el, false);
      await loadThirdParty();
      if ($('[data-auth-modal]')) refreshAuthModal();
      toast('塔吉多登录成功');
      return;
    }
    if (action === 'tp-tjd-sync') {
      setBusy(el, true, '同步中');
      const data = await api('/api/thirdparty/sync', { method: 'POST', body: JSON.stringify({ game: 'nte' }) });
      setBusy(el, false);
      await reloadAfterSync(data);
      if ($('[data-auth-modal]')) {
        await loadThirdParty();
        refreshAuthModal(true);
      }
      toast(`异环同步完成：${fmt(data.totalFetched)} 抽，新增 ${data.addedFive || 0} 个 S 级`, 'ok', 5000);
      return;
    }
    if (action === 'tp-tjd-logout') {
      await api('/api/thirdparty/tajiduo/logout', { method: 'POST', body: '{}' });
      await loadThirdParty();
      if ($('[data-auth-modal]')) refreshAuthModal(true);
      toast('已退出塔吉多');
      return;
    }
    if (action === 'switch-import-tab') {
      if ((el.dataset.tab === 'screenshot' || el.dataset.tab === 'manual') && !state.catalog) await loadCatalog();
      state.importTab = el.dataset.tab;
      state.pendingLink = null;
      if (state.importTab !== 'qr') clearQrTimer();
      state.view = 'import';
      renderShell(); renderView();
      return;
    }
    if (action === 'toggle-game') {
      const visibleCount = state.gameOrder.filter((g) => !state.hiddenGames.includes(g)).length;
      if (!state.hiddenGames.includes(el.dataset.game) && visibleCount <= 1) { toast('至少保留一个游戏卡片', 'err'); return; }
      const hidden = state.hiddenGames.includes(el.dataset.game) ? state.hiddenGames.filter((g) => g !== el.dataset.game) : [...state.hiddenGames, el.dataset.game];
      const data = await api('/api/settings/visibility', { method: 'POST', body: JSON.stringify({ hidden }) });
      state.hiddenGames = data.hiddenGames;
      if (state.hiddenGames.includes(state.game)) {
        state.game = state.gameOrder.find((g) => !state.hiddenGames.includes(g)) || state.game;
        state.dashboard = null;
        document.body.dataset.game = state.game;
        await loadDashboard();
      }
      renderShell();
      renderView();
      return;
    }
    if (action === 'move-game') {
      const order = [...state.gameOrder];
      const i = order.indexOf(el.dataset.game);
      const j = i + Number(el.dataset.dir);
      if (i >= 0 && j >= 0 && j < order.length) {
        [order[i], order[j]] = [order[j], order[i]];
        const data = await api('/api/settings/order', { method: 'POST', body: JSON.stringify({ order }) });
        state.gameOrder = data.gameOrder;
        renderShell();
        renderView();
      }
      return;
    }
    if (action === 'collector-toggle') {
      const enabled = el.dataset.enabled === 'true';
      setBusy(el, true, enabled ? '启动中' : '暂停中');
      const data = await api('/api/collector', { method: 'POST', body: JSON.stringify({ enabled }) });
      state.collector = data.collector;
      setBusy(el, false);
      renderView();
      toast(enabled ? '后台采集已开启：打开游戏记录页后会自动同步' : '后台采集已暂停');
      return;
    }
    if (action === 'scan-links') {
      setBusy(el, true, '扫描中');
      state.scan = await api('/api/links/scan', { method: 'POST', body: '{}' });
      setBusy(el, false);
      renderView();
      const found = Object.keys(state.scan.found || {}).length;
      toast(found ? `找到 ${found} 个可用的抽卡链接` : '没有找到链接，请先打开游戏内记录页');
      return;
    }
    if (action === 'copy-scan-link') {
      const data = await api(`/api/links/url?linkId=${encodeURIComponent(el.dataset.link || '')}`);
      await copyText(data.url);
      toast('链接已复制');
      return;
    }
    if (action === 'sync-link') {
      setBusy(el, true, '同步中');
      const data = await api('/api/sync', { method: 'POST', body: JSON.stringify({ game: el.dataset.game, linkId: el.dataset.link }) });
      state.scan = null;
      await reloadAfterSync(data);
      setBusy(el, false);
      return;
    }
    if (action === 'parse-link') {
      const url = $('#paste-url')?.value.trim();
      if (!url) throw new Error('请先粘贴抽卡链接');
      setBusy(el, true, '解析中');
      const data = await api('/api/links/parse', { method: 'POST', body: JSON.stringify({ game: state.game, url }) });
      state.pendingLink = data.link;
      setBusy(el, false);
      renderView();
      toast('链接已识别，可以开始同步');
      return;
    }
    if (action === 'copy-paste-link') {
      const url = $('#paste-url')?.value?.trim();
      if (!url) throw new Error('没有可复制的链接');
      await copyText(url);
      toast('链接已复制');
      return;
    }
    if (action === 'sync-paste') {
      if (!state.pendingLink) throw new Error('请先解析链接');
      setBusy(el, true, '同步中');
      const data = await api('/api/sync', { method: 'POST', body: JSON.stringify({ game: state.game, linkId: state.pendingLink.linkId }) });
      state.pendingLink = null;
      await reloadAfterSync(data);
      setBusy(el, false);
      return;
    }
    if (action === 'share-summary') {
      await openShareSummary();
      return;
    }
    if (action === 'check-update') {
      if (!window.desktop?.checkUpdates) { toast('仅桌面版支持更新', 'err'); return; }
      state.update = { checking: true };
      renderView();
      try {
        const info = await window.desktop.checkUpdates();
        state.update = info;
        renderView();
        toast(info.hasUpdate ? `发现新版本 v${info.latest}` : '已是最新版本');
      } catch (e) {
        state.update = null;
        renderView();
        toast(e.message, 'err', 5000);
      }
      return;
    }
    if (action === 'apply-update') {
      if (!window.desktop?.applyUpdate) return;
      setBusy(el, true, '更新中');
      try {
        const result = await window.desktop.applyUpdate();
        if (result && result.ok === false) {
          if (result.code === 'HOTFIX_FAILED' && result.canFull) {
            const yes = await confirmDialog('热更新失败', '是否下载完整版？不会丢失数据。', '下载完整版');
            if (!yes) { setBusy(el, false); return; }
            setBusy(el, true, '下载完整版');
            const full = await window.desktop.applyUpdate({ full: true });
            if (full && full.ok === false) { setBusy(el, false); toast(full.message || '完整版更新失败', 'err', 7000); }
          } else {
            setBusy(el, false);
            toast(result.message || '更新失败', 'err', 7000);
          }
        }
      } catch (e) { setBusy(el, false); toast(e.message, 'err', 6000); }
      return;
    }
    if (action === 'manual-mode') {
      state.manualMode = el.dataset.mode === 'table' ? 'table' : 'single';
      renderView();
      return;
    }
    if (action === 'manual-add') {
      state.importTab = 'manual';
      if (!state.catalog) await loadCatalog().catch(() => {});
      state.view = 'import';
      renderShell(); renderView();
      return;
    }
    if (action === 'records-page') { await loadRecords(Number(el.dataset.page)); return; }
    if (action === 'record-pool') {
      state.recordFilter.pool = el.dataset.pool || 'all';
      loadRecords(1).catch((err) => toast(err.message, 'err'));
      return;
    }
    if (action === 'records-reset') { state.recordFilter = { search: '', pool: 'all', source: 'all', page: 1 }; await loadRecords(1); return; }
    if (action === 'nte-capture-manual' || action === 'nte-capture-auto') {
      await startNteCapture(action === 'nte-capture-auto' ? 'auto' : 'manual');
      return;
    }
    if (action === 'heybox-open') {
      if (!window.desktop?.heybox) throw new Error('小黑盒窗口仅桌面版可用');
      await window.desktop.heybox.open();
      toast('小黑盒窗口已打开，登录后打开对应游戏的抽卡分析页');
      return;
    }
    if (action === 'heybox-collect') {
      if (!window.desktop?.heybox) throw new Error('小黑盒窗口仅桌面版可用');
      setBusy(el, true, '采集中');
      try {
        const capture = await window.desktop.heybox.collect();
        if (!capture?.responses?.length) {
          throw new Error('还没有捕获到数据。请在小黑盒窗口里登录，并打开对应游戏的抽卡/祈愿分析页');
        }
        const data = await api('/api/import/heybox-live', {
          method: 'POST',
          body: JSON.stringify({ game: state.game, responses: capture.responses }),
        });
        await refreshAll();
        renderShell();
        renderView();
        toast(`小黑盒采集完成：识别 ${data.totalChecked} 条，新增 ${data.imported} 条${data.totalPulls ? `，总抽数 ${fmt(data.totalPulls)}` : ''}`, 'ok', 7000);
      } finally {
        setBusy(el, false);
      }
      return;
    }
    if (action === 'heybox-close') {
      await window.desktop?.heybox?.close?.();
      toast('小黑盒窗口已关闭');
      return;
    }
    if (action === 'catalog-sync') {
      setBusy(el, true, '同步中');
      const data = await api('/api/catalog/sync', { method: 'POST', body: JSON.stringify({ game: state.game }) });
      state.catalog = null;
      await loadCatalog();
      toast(data.result?.message || `图鉴已同步：${data.result?.count || ''} 条${data.result?.source ? ` · ${data.result.source}` : ''}`);
      setBusy(el, false);
      return;
    }
    if (action === 'reset-game') {
      const yes = await confirmDialog('重置当前游戏？', `将删除${gameName()}的所有${topLabel()}、总抽数与历史汇总，无法恢复。建议先导出备份。`, '确认重置');
      if (yes) {
        await api('/api/reset', { method: 'POST', body: JSON.stringify({ game: state.game, confirm: 'RESET' }) });
        await refreshAll();
        toast('已重置当前游戏');
      }
      return;
    }
    if (action === 'snapshot-delete') {
      const yes = await confirmDialog('删除这段汇总？', '删除后，生涯总抽数与出金率会重新计算。', '删除');
      if (yes) {
        await api(`/api/snapshots/${encodeURIComponent(el.dataset.id)}?game=${state.game}`, { method: 'DELETE' });
        await loadDashboard();
        renderView();
        toast('已删除汇总');
      }
      return;
    }
    if (action === 'ocr-run') { await runOcr(); return; }
    if (action === 'ocr-save') { await saveOcrRows(); return; }
    if (action === 'ocr-add') {
      state.ocr.result.candidates.push({ time: '', name: '', rank: 5, pity: null, confidence: 1 });
      renderView();
      return;
    }
    if (action === 'ocr-remove') {
      state.ocr.result.candidates.splice(Number(el.dataset.index), 1);
      renderView();
      return;
    }
    if (action === 'icon-pick') {
      const c = state.iconMatch?.candidates?.[Number(el.dataset.index)];
      if (!c) return;
      if (!state.ocr.result) state.ocr.result = { candidates: [], summary: {} };
      state.ocr.result.candidates.push({ time: '', name: c.name, itemId: c.id, itemType: c.type, rank: c.rarity || 5, pity: null, confidence: c.score || 0 });
      renderView();
      toast(c.name);
      return;
    }
    if (action === 'ocr-save-summary') {
      const total = Number(el.dataset.total) || 0;
      const five = Number(el.dataset.five) || 0;
      if (!total) throw new Error('未识别到总抽数');
      setBusy(el, true, '保存中');
      await api('/api/snapshots', { method: 'POST', body: JSON.stringify({ game: state.game, periodStart: state.dashboard?.coverage?.launchDate || '2024-01-01', periodEnd: new Date().toISOString().slice(0, 10), totalPulls: total, fiveStars: five, note: 'OCR 汇总', source: 'screenshot' }) });
      await loadDashboard();
      state.importTab = 'summary';
      setBusy(el, false);
      renderView();
      toast('汇总已保存');
      return;
    }
    if (action === 'ocr-to-summary') {
      state.importTab = 'summary';
      state.pendingSummary = { totalPulls: el.dataset.total, fiveStars: el.dataset.five };
      renderView();
      return;
    }
    if (action === 'open-auth') { state.accountTab = 'accounts'; await openAccountModal(); return; }
    if (action === 'open-login') {
      state.accountTab = 'login';
      state.authTab = ['skland', 'tajiduo'].includes(el.dataset.tab) ? el.dataset.tab : 'miyoushe';
      await openAccountModal();
      return;
    }
    if (action === 'account-tab') {
      state.accountTab = el.dataset.tab === 'login' ? 'login' : 'accounts';
      if (state.accountTab === 'accounts') {
        if (state.authTimer) { clearInterval(state.authTimer); state.authTimer = null; }
        clearThirdPartyQrTimer();
      }
      refreshAuthModal();
      ensureLoginTab();
      return;
    }
    if (action === 'account-login-go') {
      state.accountTab = 'login';
      state.authTab = ['skland', 'tajiduo'].includes(el.dataset.tab) ? el.dataset.tab : 'miyoushe';
      refreshAuthModal();
      ensureLoginTab();
      return;
    }
    if (action === 'login-tab') {
      if (state.authTimer) { clearInterval(state.authTimer); state.authTimer = null; }
      state.accountTab = 'login';
      state.authTab = ['skland', 'tajiduo'].includes(el.dataset.tab) ? el.dataset.tab : 'miyoushe';
      if (state.authTab !== 'skland') clearThirdPartyQrTimer();
      refreshAuthModal();
      ensureLoginTab();
      return;
    }
    if (action === 'auth-start') { await startAuthQr(); return; }
    if (action === 'auth-sync') { await syncAuthRole(el.dataset.game, el.dataset.uid); return; }
    if (action === 'auth-sync-all') { setBusy(el, true, '同步中'); await syncAllAuthGames(); setBusy(el, false); return; }
    if (action === 'auth-zzz') { await authZzzStats(); return; }
    if (action === 'auth-logout') { await logoutAuth(); return; }
    if (action === 'auth-close') { $('#modal-root').innerHTML = ''; return; }
    if (action === 'qr-start') { await startQr(el); return; }
    if (action === 'qr-roles') { await loadQrRoles(el); return; }
    if (action === 'qr-zzz') { await loadZzzStats(el); return; }
    if (action === 'qr-link') { await qrGetLink(el); return; }
  } catch (err) {
    setBusy(el, false);
    toast(err.message, 'err', 5200);
  }
});

async function loadCollector() {
  try {
    const data = await api('/api/collector');
    state.collector = data.collector;
    state.collectorSeen = data.collector?.lastEvent?.time || '';
  } catch { /* collector is optional */ }
}

async function pollCollector() {
  if (!state.collector?.enabled) return;
  try {
    const data = await api('/api/collector');
    const previous = state.collectorSeen;
    state.collector = data.collector;
    const event = data.collector?.lastEvent;
    if (event && event.time !== previous) {
      state.collectorSeen = event.time;
      if (event.ok) {
        toast(`后台采集：${GAME_META[event.game]?.name || event.game} ${event.message}${event.added ? `，新增 ${event.added} 张五星` : ''}`);
        await loadDashboard();
        if (state.view === 'import') renderView();
      } else {
        toast(`后台采集：${event.message}`, 'err', 4200);
      }
    }
  } catch { /* ignore polling failures */ }
}

function startCollectorPolling() {
  if (state.collectorTimer) clearInterval(state.collectorTimer);
  state.collectorTimer = setInterval(pollCollector, 15000);
}

async function reloadAfterSync(data) {
  const added = data.addedFive ?? 0;
  if (data.game && data.game !== state.game) {
    state.game = data.game;
    state.catalog = null;
    document.body.dataset.game = data.game;
  }
  await loadDashboard();
  state.records = null;
  await loadCatalog().catch(() => {});
  if (state.view === 'import') state.importTab = 'auto';
  renderShell();
  renderView();
  const extra = data.errors?.length ? `；${data.errors.length} 个卡池读取失败` : '';
  const up = data.upgradedFive ? `，自动匹配 ${data.upgradedFive} 张旧截图` : '';
  toast(`已同步 ${fmt(data.totalFetched)} 抽，新增 ${added} 张${topLabel()}${up}${extra}`, data.errors?.length ? 'err' : 'ok', 5000);
}

async function saveSnapshot(e) {
  e.preventDefault();
  const form = e.target;
  const btn = form.querySelector('button[type=submit]');
  const payload = Object.fromEntries(new FormData(form).entries());
  setBusy(btn, true, '保存中');
  try {
    await api('/api/snapshots', { method: 'POST', body: JSON.stringify({ game: state.game, ...payload }) });
    state.pendingSummary = null;
    await loadDashboard();
    renderView();
    toast('历史汇总已保存，已自动扣重');
  } catch (err) { toast(err.message, 'err'); }
  finally { setBusy(btn, false); }
}

function readScreenshot(file) {
  if (!file.type.match(/^image\/(png|jpeg|webp)$/)) { toast('只支持 PNG / JPG / WebP 截图', 'err'); return; }
  if (file.size > 14 * 1024 * 1024) { toast('图片超过 14MB，请压缩后重试', 'err'); return; }
  const reader = new FileReader();
  reader.onload = () => {
    state.ocr = { imageData: reader.result, preview: reader.result, result: null, error: '' };
    renderView();
  };
  reader.readAsDataURL(file);
}

async function autoMatchBars(result) {
  if (!result?.bars?.length) return;
  const img = await loadImageElement(state.ocr.preview);
  if (!img?.naturalWidth) return;
  const allIndex = await loadIconIndex(state.game);
  const wanted = state.game === 'hsr' ? '角色' : state.game === 'zzz' ? '代理人' : state.game === 'genshin' ? '角色' : '';
  const preferred = wanted ? allIndex.filter((entry) => entry.item.type === wanted) : [];
  const index = preferred.length ? preferred : allIndex;
  if (!index.length) return;
  const added = [];
  for (const bar of result.bars) {
    if (!bar.iconBox) continue;
    const box = bar.iconBox;
    const canvas = document.createElement('canvas');
    canvas.width = 110;
    canvas.height = 110;
    const ctx = canvas.getContext('2d', { willReadFrequently: true });
    ctx.fillStyle = '#fff';
    ctx.fillRect(0, 0, 110, 110);
    ctx.drawImage(img, box.x, box.y, box.w, box.h, 0, 0, 110, 110);
    const desc = canvasDescriptor(canvas, 0.08);
    let best = null;
    for (const entry of index) {
      const score = descriptorScore(desc, entry.desc);
      if (!best || score > best.score) best = { item: entry.item, score };
    }
    if (!best || best.score < 0.3) continue;
    const item = best.item;
    added.push({
      time: '', name: item.name, itemId: item.id, itemType: item.type,
      rank: item.rarity || 5, pity: bar.pity, confidence: best.score, source: 'screenshot',
    });
  }
  if (!added.length) return;
  const existing = result.candidates || [];
  const seen = new Set(existing.map((r) => `${r.pity}|${r.name}`));
  for (const row of added) {
    const key = `${row.pity}|${row.name}`;
    if (!seen.has(key)) { existing.push(row); seen.add(key); }
  }
  result.candidates = existing;
}

async function runOcr() {
  if (!state.ocr?.imageData) return;
  state.ocr.result = null; state.ocr.error = '';
  renderView();
  const btn = $('[data-action="ocr-run"]');
  setBusy(btn, true, '识别中');
  try {
    const data = await api('/api/ocr', { method: 'POST', body: JSON.stringify({ game: state.game, imageData: state.ocr.imageData }) });
    state.ocr.result = data.result;
    state.ocr.imageData = null;
    await autoMatchBars(data.result);
    renderView();
    toast(data.result.candidates.length ? `识别到 ${data.result.candidates.length} 条五星候选` : '没有识别到五星行');
  } catch (err) {
    state.ocr.error = err.message;
    renderView();
    toast(err.message, 'err', 5500);
  }
}

function collectOcrRows() {
  const rows = [];
  for (const tr of $$('#ocr-rows tr')) {
    const get = (field) => tr.querySelector(`[data-field="${field}"]`)?.value ?? '';
    rows.push({
      time: get('time').trim(), name: get('name').trim(), rank: Number(get('rank')) || 5,
      pity: get('pity') ? Number(get('pity')) : null,
      source: 'screenshot', synthetic: true,
    });
  }
  return rows;
}

async function saveOcrRows() {
  const rows = collectOcrRows().filter((r) => r.name && r.rank === 5);
  if (!rows.length) throw new Error('至少需要一条完整的五星记录（名称 + 时间）');
  const btn = $('[data-action="ocr-save"]');
  setBusy(btn, true, '保存中');
  try {
    const data = await api('/api/ocr/save', { method: 'POST', body: JSON.stringify({ game: state.game, records: rows }) });
    await loadDashboard();
    state.ocr = null;
    state.importTab = 'summary';
    renderView();
    toast(`已写入 ${data.result.added} 张五星`);
  } catch (err) { toast(err.message, 'err'); }
  finally { setBusy(btn, false); }
}

async function startQr(el) {
  setBusy(el, true, '生成中');
  clearQrTimer();
  try {
    const data = await api('/api/auth/qr', { method: 'POST', body: '{}' });
    state.qr = { sessionId: data.sessionId, url: data.url, status: 'Created', user: null, roles: [] };
    renderView();
    toast('二维码已生成，请用米游社 App 扫描');
    state.qrTimer = setInterval(pollQr, 1800);
  } catch (err) { toast(err.message, 'err'); }
  finally { setBusy(el, false); }
}

async function pollQr() {
  if (!state.qr?.sessionId) return;
  try {
    const data = await api(`/api/auth/qr/${state.qr.sessionId}`);
    const s = data.session;
    state.qr.status = s.status;
    state.qr.user = s.user;
    if (['Confirmed', 'Expired', 'Cancelled'].includes(s.status)) {
      clearQrTimer();
      renderView();
      if (s.status === 'Confirmed') {
        toast('米游社登录成功');
        await loadQrRoles(null, true);
      }
    } else {
      const txt = $('#qr-status-text');
      if (txt) txt.textContent = qrStatusText(s.status);
    }
  } catch (e) {
    clearQrTimer();
    toast(e.message, 'err');
  }
}

function clearQrTimer() {
  if (state.qrTimer) clearInterval(state.qrTimer);
  if (state.authTimer) clearInterval(state.authTimer);
  state.qrTimer = null;
  state.authTimer = null;
}

async function loadQrRoles(el, silent = false) {
  if (!state.qr?.sessionId) throw new Error('请先生成并完成扫码');
  if (el) setBusy(el, true, '读取中');
  try {
    const data = await api(`/api/auth/roles?sessionId=${encodeURIComponent(state.qr.sessionId)}&game=${state.game}`);
    state.qr.roles = data.roles || [];
    state.qr.rolesError = '';
    renderView();
    if (!silent) toast(state.qr.roles.length ? `找到 ${state.qr.roles.length} 个角色` : '没有找到绑定角色');
  } catch (err) {
    state.qr.rolesError = err.message;
    renderView();
    if (!silent) toast(err.message, 'err', 5000);
  } finally { if (el) setBusy(el, false); }
}

async function loadZzzStats(el) {
  if (!state.qr?.sessionId) throw new Error('请先完成扫码登录');
  setBusy(el, true, '读取中');
  try {
    const data = await api('/api/auth/zzz-stats', { method: 'POST', body: JSON.stringify({ sessionId: state.qr.sessionId }) });
    state.qr.statsMessage = `已读取：${fmt(data.snapshot.totalPulls)} 抽 / ${fmt(data.snapshot.fiveStars)} 个 S 级。`;
    if (state.game !== 'zzz') {
      state.game = 'zzz';
      state.catalog = null;
      document.body.dataset.game = 'zzz';
    }
    await loadDashboard();
    await loadCatalog().catch(() => {});
    state.view = 'dashboard';
    renderShell(); renderView();
    toast(`绝区零官方全量统计已接入：${fmt(data.snapshot.totalPulls)} 抽`);
  } catch (err) { toast(err.message, 'err', 6000); }
  finally { setBusy(el, false); }
}

async function qrGetLink(el) {
  if (!state.qr?.sessionId) throw new Error('请先完成扫码登录');
  const role = state.qr.roles.find((r) => r.uid === el.dataset.uid);
  if (!role) throw new Error('没有找到该角色');
  setBusy(el, true, '签发中');
  try {
    const data = await api('/api/auth/link', { method: 'POST', body: JSON.stringify({ sessionId: state.qr.sessionId, game: state.game, role }) });
    await reloadAfterSync(data);
  } catch (err) { toast(err.message, 'err', 6500); }
  finally { setBusy(el, false); }
}

async function copyText(text) {
  try {
    await navigator.clipboard.writeText(text);
    return;
  } catch {}
  const ta = document.createElement('textarea');
  ta.value = text;
  ta.style.position = 'fixed';
  ta.style.opacity = '0';
  document.body.appendChild(ta);
  ta.select();
  document.execCommand('copy');
  ta.remove();
}

async function importUigfFile(e) {
  const files = [...(e.target.files || [])];
  await importUigfFiles(files);
  e.target.value = '';
}

async function importNteuidFile(file) {
  try {
    const data = JSON.parse(await file.text());
    const result = await api('/api/import/nteuid', { method: 'POST', body: JSON.stringify({ data }) });
    await refreshAll();
    toast(`已导入 NTEUID：${result.result.imported} 个 S，覆盖 ${fmt(result.result.totalPulls)} 抽`);
  } catch (err) {
    toast(err.message, 'err', 6000);
  }
}

async function importHeyboxFile(file) {
  try {
    const data = JSON.parse(await file.text());
    const result = await api('/api/import/heybox', { method: 'POST', body: JSON.stringify({ game: 'arknights', data }) });
    await refreshAll();
    toast(`已导入小黑盒：${fmt(result.totalPulls)} 抽，新增 ${result.imported} 条六星`);
  } catch (err) {
    toast(err.message, 'err', 6000);
  }
}

function setNteCaptureStatus(text) {
  state.nteCapture.status = text;
  const el = document.getElementById('nte-capture-status');
  if (el) el.textContent = text;
}

function stopNteCapturePolling() {
  if (state.nteCapture.timer) clearTimeout(state.nteCapture.timer);
  state.nteCapture.timer = null;
}

async function pollNteCapture() {
  const cap = state.nteCapture;
  if (!cap.path) return;
  try {
    const info = await window.desktop.nteCapture.status(cap.path);
    if (info?.exists && info.size > 200) {
      const text = await window.desktop.nteCapture.read(cap.path);
      let data;
      try { data = JSON.parse(text); } catch { data = null; }
      const list = data?.nte?.list || data?.list;
      if (Array.isArray(list) && list.length) {
        stopNteCapturePolling();
        setNteCaptureStatus('捕获完成，正在导入…');
        const result = await api('/api/import/nte-export', { method: 'POST', body: JSON.stringify({ data }) });
        state.nteCapture.path = '';
        await refreshAll();
        renderShell();
        renderView();
        toast(`异环抓取完成：总抽 ${fmt(result.totalPulls)}，S ${result.topCount} 个`, 'ok', 7000);
        return;
      }
    }
    if (Date.now() - cap.startedAt > 20 * 60 * 1000) {
      stopNteCapturePolling();
      setNteCaptureStatus('捕获超时。请确认游戏已打开抽卡记录页；手动模式需在黑色窗口按 q 结束。');
      return;
    }
    setNteCaptureStatus(cap.mode === 'auto'
      ? '自动翻页捕获中…请不要操作游戏窗口'
      : '后台只读捕获中…翻完抽卡记录后在黑色窗口按 q 结束');
    cap.timer = setTimeout(pollNteCapture, 1500);
  } catch (err) {
    stopNteCapturePolling();
    setNteCaptureStatus(`捕获状态读取失败：${err.message}`);
  }
}

async function startNteCapture(mode) {
  if (!window.desktop?.nteCapture) throw new Error('内置抓取仅桌面版可用');
  if (mode === 'auto') {
    const yes = await confirmDialog('自动翻页读取', '软件会控制游戏窗口自动翻页，期间请不要操作鼠标键盘。<br>这会改变游戏页面，但不会修改抽卡数据或账号数据。', '开始自动捕获');
    if (!yes) return;
  }
  stopNteCapturePolling();
  const result = await window.desktop.nteCapture.start({ mode });
  state.nteCapture = { path: result.path, mode, status: '正在请求管理员权限…', timer: null, startedAt: Date.now() };
  setNteCaptureStatus(mode === 'auto'
    ? '正在请求管理员权限；允许后自动翻页捕获，期间不要操作游戏'
    : '正在请求管理员权限；允许后在游戏里翻完记录，回到黑色窗口按 q');
  toast(mode === 'auto' ? '自动捕获已启动，请在 UAC 提示中允许' : '手动捕获已启动，请在 UAC 提示中允许', 'ok', 7000);
  state.nteCapture.timer = setTimeout(pollNteCapture, 1500);
}

async function importNteExportFile(file) {
  try {
    const data = JSON.parse(await file.text());
    const result = await api('/api/import/nte-export', { method: 'POST', body: JSON.stringify({ data }) });
    await refreshAll();
    toast(`已导入 NTE 导出：总抽 ${fmt(result.totalPulls)}，新增 ${result.imported} 个 S`);
  } catch (err) {
    toast(err.message, 'err', 6000);
  }
}

async function importUigfFiles(files) {
  if (!files.length) return;
  const messages = [];
  for (const file of files) {
    if (!/\.json$/i.test(file.name) && file.type && !/json/i.test(file.type)) { messages.push(`${file.name}：不是 JSON`); continue; }
    try {
      const data = JSON.parse(await file.text());
      const result = await api('/api/import/uigf', { method: 'POST', body: JSON.stringify(data) });
      messages.push(...result.summary.map((x) => `${x.gameName}：${x.totalPulls} 抽 / ${x.importedFive} 张五星`));
    } catch (err) {
      messages.push(`${file.name}：${err.message}`);
    }
  }
  await refreshAll();
  toast(messages.join('；'), 'ok', 6000);
}

async function importManualExcel(file) {
  if (!file) return;
  try {
    const buffer = await file.arrayBuffer();
    let binary = '';
    const bytes = new Uint8Array(buffer);
    for (let i = 0; i < bytes.length; i += 0x8000) binary += String.fromCharCode(...bytes.subarray(i, i + 0x8000));
    const data = await api('/api/manual/import', { method: 'POST', body: JSON.stringify({ game: state.game, fileName: file.name, data: btoa(binary) }) });
    await refreshAll();
    toast(`已导入 ${data.count || 0} 条${data.skipped ? `，跳过 ${data.skipped} 行` : ''}`);
  } catch (err) {
    toast(err.message, 'err', 6000);
  }
}

async function saveManualRecord(e) {
  e.preventDefault();
  const fd = Object.fromEntries(new FormData(e.target).entries());
  const name = String(fd.name || fd.manualName || '').trim();
  if (!name) { toast('请选择或填写名称', 'err'); return; }
  try {
    await api('/api/records/manual', { method: 'POST', body: JSON.stringify({ ...fd, game: state.game, name }) });
    await refreshAll();
    toast(`已添加 1 张${topLabel()}`);
  } catch (err) { toast(err.message, 'err', 5000); }
}

async function drawShareCard() {
  const d = state.dashboard;
  if (!d) throw new Error('还没有可分享的数据');
  const W = 1200, H = 1800;
  const canvas = document.createElement('canvas');
  canvas.width = W; canvas.height = H;
  const ctx = canvas.getContext('2d');
  const accent = GAME_META[state.game]?.color || '#9b8cff';
  const gameName = GAME_META[state.game]?.name || '二游档案';
  const pad = 72;
  const round = (x, y, w, h, r) => roundRect(ctx, x, y, w, h, r);
  const font = (size, weight = 400) => `${weight} ${size}px "Microsoft YaHei", "PingFang SC", sans-serif`;

  const bg = ctx.createLinearGradient(0, 0, W, H);
  bg.addColorStop(0, '#090d16');
  bg.addColorStop(0.55, '#111526');
  bg.addColorStop(1, '#171226');
  ctx.fillStyle = bg; ctx.fillRect(0, 0, W, H);

  const glow = ctx.createRadialGradient(W * 0.86, 80, 10, W * 0.86, 80, 600);
  glow.addColorStop(0, `${accent}42`);
  glow.addColorStop(1, `${accent}00`);
  ctx.fillStyle = glow; ctx.fillRect(0, 0, W, 900);

  ctx.fillStyle = accent; round(pad, 62, 8, 38, 4); ctx.fill();
  ctx.fillStyle = '#f5f2ff'; ctx.font = font(28, 600); ctx.fillText('二游档案', pad + 26, 92);
  ctx.fillStyle = '#8e96ab'; ctx.font = font(16, 400); ctx.fillText('MIYOU ARCHIVE · SHARE', pad + 26, 120);

  ctx.fillStyle = '#f7f5ff'; ctx.font = font(64, 700); ctx.fillText(gameName, pad, 238);
  ctx.fillStyle = '#8e96ab'; ctx.font = font(20, 400);
  ctx.fillText(d.meta?.uid ? `UID ${d.meta.uid}` : '本地抽卡档案', pad, 278);

  const currency = {
    genshin: { unit: '原石', rate: 160 },
    hsr: { unit: '星琼', rate: 160 },
    zzz: { unit: '菲林', rate: 160 },
    hi3: { unit: '水晶', rate: 280 },
    tot: { unit: '未名星石', rate: 180 },
  }[state.game] || { unit: '抽卡资源', rate: 160 };
  const spent = d.counts.exact * currency.rate;
  ctx.fillStyle = '#a9a3c7'; ctx.font = font(18, 500); ctx.fillText('总共消耗（估测）', pad, 372);
  ctx.fillStyle = '#ffffff'; ctx.font = font(124, 700); ctx.fillText(fmt(spent), pad, 492);
  ctx.fillStyle = accent; ctx.font = font(22, 600); ctx.fillText(currency.unit, pad + 10, 530);

  const cardY = 596, cardW = 490, cardH = 142, gap = 20;
  const charPools = {
    genshin: ['301', '400'],
    hsr: ['11', '21'],
    zzz: ['2', '102'],
    arknights: ['limited', 'standard', 'kernel', 'collab', 'other'],
    endfield: ['char_special', 'char_rerun', 'char_joint', 'char_standard', 'char_beginner'],
    nte: ['limited', 'permanent'],
  }[state.game];
  const limitedCharFive = charPools && d.rates.upDecided
    ? (d.records || []).filter((r) => charPools.includes(String(r.uigfType || r.gachaType)) && r.up === 'win').length
    : (d.counts.limitedFiveAll || 0);
  const stats = [
    [`限定${topLabel()}角色`, String(limitedCharFive), 'LIMITED CHARACTERS'],
    ['总抽数', fmt(d.counts.exact), 'TOTAL PULLS'],
    ['命中率', d.rates.upRate == null ? '—' : pct(d.rates.upRate), 'WIN RATE'],
    ['平均出金', d.rates.avgChar != null ? d.rates.avgChar.toFixed(1) : '—', 'AVG PITY'],
  ];
  stats.forEach(([label, value, en], i) => {
    const x = pad + (i % 2) * (cardW + gap);
    const y = cardY + Math.floor(i / 2) * (cardH + gap);
    ctx.fillStyle = 'rgba(255,255,255,0.045)'; round(x, y, cardW, cardH, 22); ctx.fill();
    ctx.strokeStyle = 'rgba(255,255,255,0.08)'; ctx.lineWidth = 1; round(x, y, cardW, cardH, 22); ctx.stroke();
    ctx.fillStyle = '#8e96ab'; ctx.font = font(18, 400); ctx.fillText(label, x + 28, y + 42);
    ctx.fillStyle = '#f7f5ff'; ctx.font = font(44, 700); ctx.fillText(value, x + 28, y + 100);
    ctx.fillStyle = '#6f7890'; ctx.font = font(13, 500); ctx.fillText(en, x + 30, y + 126);
  });

  const limitedTypes = {
    genshin: { char: ['301', '400'], weapon: ['302'] },
    hsr: { char: ['11', '21'], weapon: ['12', '22'] },
    zzz: { char: ['2', '102'], weapon: ['3', '103'] },
    arknights: { char: ['limited', 'standard', 'kernel', 'collab', 'other'], weapon: [] },
    endfield: { char: ['char_special', 'char_rerun', 'char_joint', 'char_standard', 'char_beginner'], weapon: ['weapon_special', 'weapon_constant', 'weapon_rerun'] },
    nte: { char: ['limited', 'permanent'], weapon: ['weapon'] },
  }[state.game] || { char: [], weapon: [] };
  const allRecords = d.records || [];
  const typeOf = (r) => String(r.uigfType || r.gachaType || '');
  const charRows = (limitedTypes.char.length ? allRecords.filter((r) => limitedTypes.char.includes(typeOf(r))) : allRecords).slice(0, 6);
  const weaponRows = allRecords.filter((r) => limitedTypes.weapon.includes(typeOf(r))).slice(0, 6);
  const loadRows = (rows) => Promise.all(rows.map(async (r) => {
    const item = catalogItem(r.name, r.itemId);
    if (!item?.iconUrl) return null;
    return loadShareImage(item.iconUrl);
  }));
  const [charImages, weaponImages] = await Promise.all([loadRows(charRows), loadRows(weaponRows)]);

  const sectionY = 960;
  ctx.fillStyle = '#d9d3ec'; ctx.font = font(24, 600); ctx.fillText('欧皇时刻（也许）', pad, sectionY);
  ctx.strokeStyle = 'rgba(255,255,255,0.08)'; ctx.beginPath(); ctx.moveTo(pad, sectionY + 22); ctx.lineTo(W - pad, sectionY + 22); ctx.stroke();

  const drawColumn = (rows, images, x, label) => {
    ctx.fillStyle = accent; ctx.font = font(16, 600); ctx.fillText(label, x, sectionY + 62);
    if (!rows.length) {
      ctx.fillStyle = '#6f7890'; ctx.font = font(16, 400); ctx.fillText('暂无记录', x, sectionY + 96);
      return;
    }
    rows.forEach((r, i) => {
      const y = sectionY + 80 + i * 64;
      ctx.fillStyle = 'rgba(255,255,255,0.04)'; round(x, y, 500, 56, 14); ctx.fill();
      const image = images[i];
      if (image) {
        ctx.save(); ctx.beginPath(); ctx.arc(x + 28, y + 28, 23, 0, Math.PI * 2); ctx.clip();
        ctx.drawImage(image, x + 5, y + 5, 46, 46); ctx.restore();
        ctx.strokeStyle = `${accent}55`; ctx.lineWidth = 1.5; ctx.beginPath(); ctx.arc(x + 28, y + 28, 23, 0, Math.PI * 2); ctx.stroke();
      } else {
        ctx.fillStyle = `${accent}33`; ctx.beginPath(); ctx.arc(x + 28, y + 28, 23, 0, Math.PI * 2); ctx.fill();
        ctx.fillStyle = accent; ctx.font = font(17, 600); ctx.textAlign = 'center'; ctx.fillText(r.name.slice(0, 1), x + 28, y + 35); ctx.textAlign = 'left';
      }
      ctx.fillStyle = '#f7f5ff'; ctx.font = font(18, 600); ctx.fillText(r.name, x + 64, y + 34);
      if (r.pity) {
        const result = r.up === 'win' ? '欧' : r.up === 'loss' ? '非' : '';
        ctx.fillStyle = result === '欧' ? '#f08b8b' : result === '非' ? '#7fe0a8' : accent;
        ctx.font = font(15, 500); ctx.textAlign = 'right';
        ctx.fillText(`${r.pity} 抽${result ? ` · ${result}` : ''}`, x + 475, y + 34);
        ctx.textAlign = 'left';
      }
    });
  };
  drawColumn(charRows, charImages, pad, '限定角色');
  drawColumn(weaponRows, weaponImages, W / 2 + 24, '限定武器');

  ctx.strokeStyle = 'rgba(255,255,255,0.09)'; ctx.beginPath(); ctx.moveTo(pad, 1720); ctx.lineTo(W - pad, 1720); ctx.stroke();
  ctx.fillStyle = '#6f7890'; ctx.font = font(14, 400); ctx.fillText('MIYOU ARCHIVE · 本地抽卡档案', pad, 1762);
  ctx.textAlign = 'right'; ctx.fillText(new Date().toLocaleDateString('zh-CN'), W - pad, 1762); ctx.textAlign = 'left';

  return canvas.toDataURL('image/jpeg', 0.95);
}

function roundRect(ctx, x, y, w, h, r) {
  const radius = Math.min(r, w / 2, h / 2);
  ctx.beginPath();
  ctx.moveTo(x + radius, y);
  ctx.arcTo(x + w, y, x + w, y + h, radius);
  ctx.arcTo(x + w, y + h, x, y + h, radius);
  ctx.arcTo(x, y + h, x, y, radius);
  ctx.arcTo(x, y, x + w, y, radius);
  ctx.closePath();
}

async function openShareSummary() {
  const modal = openModal(`<h2>分享抽卡总结</h2><div class="share-preview" id="share-preview"><div class="loading-line"><span class="spinner"></span>正在生成分享图…</div></div><div class="modal-actions"><button class="ghost-btn" data-share-copy disabled>复制图片</button><button class="primary-btn" data-share-save disabled>保存 JPG</button><button class="ghost-btn" data-close>关闭</button></div>`);
  try {
    const dataUrl = await drawShareCard();
    const preview = $('#share-preview');
    if (preview) preview.innerHTML = `<img src="${attr(dataUrl)}" alt="抽卡总结">`;
    const copy = $('[data-share-copy]');
    const save = $('[data-share-save]');
    if (copy) { copy.disabled = false; copy.onclick = () => copyShareImage(dataUrl); }
    if (save) { save.disabled = false; save.onclick = () => saveShareImage(dataUrl); }
  } catch (err) {
    modal.close();
    toast(`分享图生成失败：${err.message}`, 'err', 6000);
  }
}

async function imageDataToPng(dataUrl) {
  const img = new Image();
  img.src = dataUrl;
  await img.decode();
  const canvas = document.createElement('canvas');
  canvas.width = img.width; canvas.height = img.height;
  canvas.getContext('2d').drawImage(img, 0, 0);
  return await new Promise((resolve) => canvas.toBlob(resolve, 'image/png'));
}

async function copyShareImage(dataUrl) {
  try {
    if (window.desktop?.copyImage) {
      await window.desktop.copyImage(dataUrl);
    } else {
      const png = await imageDataToPng(dataUrl);
      await navigator.clipboard.write([new ClipboardItem({ 'image/png': png })]);
    }
    toast('图片已复制到剪贴板');
  } catch (err) { toast(`复制失败：${err.message}`, 'err', 5000); }
}

async function saveShareImage(dataUrl) {
  try {
    if (window.desktop?.saveImage) {
      const result = await window.desktop.saveImage(dataUrl, `二游档案-${GAME_META[state.game]?.label || '分享'}-${new Date().toISOString().slice(0, 10)}.jpg`);
      if (!result?.canceled) toast('JPG 已保存');
      return;
    }
    const a = document.createElement('a');
    a.href = dataUrl;
    a.download = `二游档案-${GAME_META[state.game]?.label || '分享'}-${new Date().toISOString().slice(0, 10)}.jpg`;
    a.click();
  } catch (err) { toast(`保存失败：${err.message}`, 'err', 5000); }
}

// boot
(async function boot() {
  try {
    const shell = await api('/api/state');
    state.shell = shell;
    try {
      const saved = await api('/api/auth/session');
      if (saved.session) {
        state.auth = { ...state.auth, sessionId: saved.session.sessionId, status: 'Confirmed', user: saved.session.user || null };
      }
    } catch {}
    state.dataDir = shell.dataDir || '';
    state.gameOrder = Array.isArray(shell.gameOrder) && shell.gameOrder.length ? shell.gameOrder : GAME_ORDER;
    state.hiddenGames = Array.isArray(shell.hiddenGames) ? shell.hiddenGames : [];
    state.game = state.gameOrder.find((g) => !state.hiddenGames.includes(g)) || state.gameOrder[0] || 'genshin';
    renderShell();
    await loadDashboard();
    await loadCatalog().catch(() => {});
    await loadCollector();
    await loadThirdParty().catch(() => {});
    renderShell();
    renderView();
    startCollectorPolling();
    checkUpdatesOnStartup().catch(() => {});
    if (location.hash) {
      const h = location.hash.replace('#', '');
      if (['dashboard', 'records', 'import', 'catalog', 'settings'].includes(h)) navigate(h);
    }
  } catch (e) {
    $('#view').innerHTML = `<div class="empty-state"><div class="orb">${ICONS.warn}</div><h2>无法启动</h2><p>${esc(e.message)}</p><p>请确认本地服务正在运行：<code>node src/server.js</code></p></div>`;
  }
})();
