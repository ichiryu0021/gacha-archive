const GAME_META = {
  genshin: { name: '原神', color: '#63d8c4', short: 'GI', label: '原神' },
  hsr: { name: '崩坏：星穹铁道', color: '#9b8cff', short: 'HSR', label: '星穹铁道' },
  zzz: { name: '绝区零', color: '#f4d34d', short: 'ZZZ', label: '绝区零' },
  hi3: { name: '崩坏3', color: '#8fc7ff', short: 'HI3', label: '崩坏3' },
  tot: { name: '未定事件簿', color: '#e8a6c8', short: 'TOT', label: '未定事件簿' },
};
const GAME_ORDER = ['genshin', 'hsr', 'zzz', 'hi3', 'tot'];
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
  gameOrder: ['genshin', 'hsr', 'zzz', 'hi3', 'tot'],
  hiddenGames: [],
  collector: null,
  collectorTimer: null,
  collectorSeen: '',
  iconMatch: null,
  iconIndex: {},
  update: null,
  auth: { sessionId: '', status: '', url: '', user: null, rolesByGame: {}, errors: {}, startedAt: 0 },
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
  return `<div class="empty-state">
    <div class="orb">${ICONS.spark}</div>
    <h2>暂无记录</h2>
    <div class="empty-actions">
      <button class="primary-btn" data-action="go" data-view="import">开始同步</button>
      <button class="ghost-btn" data-action="switch-import-tab" data-tab="paste">粘贴链接</button>
      <button class="ghost-btn" data-action="go" data-view="catalog">查看图鉴</button>
    </div>
  </div>`;
}

// ---------------- shell ----------------

function renderShell() {
  document.body.dataset.game = state.game;
  $('#side-nav').innerHTML = [
    ['dashboard', '总览', 'overview'],
    ['records', '五星记录', 'records'],
    ['import', '数据补录', 'import'],
    ['catalog', '角色图鉴', 'catalog'],
    ['settings', '设置', 'settings'],
  ].map(([view, label, icon]) => `<button class="nav-item ${state.view === view ? 'active' : ''}" data-action="go" data-view="${view}">${ICONS[icon]}<span>${label}</span></button>`).join('');
  const visibleGames = state.gameOrder.filter((id) => !state.hiddenGames.includes(id));
  $('#game-tabs').innerHTML = visibleGames.map((id) => {
    const meta = GAME_META[id];
    return `<button class="game-tab ${state.game === id ? 'active' : ''}" data-action="switch-game" data-game="${id}" style="--tab-color:${meta.color}"><span class="dot"></span>${meta.label}</button>`;
  }).join('');
  const logged = state.auth.status === 'Confirmed';
  $('#account-chip').innerHTML = `<button class="auth-entry ${logged ? 'on' : ''}" data-action="open-auth"><span class="auth-entry-icon">${logged ? '米' : ICONS.qr}</span><span class="auth-entry-copy"><strong>${logged ? (esc(state.auth.user?.nickname) || '米游社') : '米游社登录'}</strong></span></button>`;
  $('#side-version').textContent = `v${state.shell?.version || '0.9.0'}`;
  const foot = $('#foot-meta');
  if (foot) foot.textContent = '';
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
    if (state.view === 'records') {
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
  state.view = view;
  if (view === 'records') state.records = null;
  if (view === 'catalog') state.catalog = null;
  renderShell();
  renderView();
  if (view === 'records') loadRecords(1).catch((e) => toast(e.message, 'err'));
  if (view === 'catalog') loadCatalog().catch((e) => toast(e.message, 'err'));
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
  toast('已刷新');
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
  const hitRate = rate == null ? null : rate;
  const currentPity = d.pity.hasCurrent ? d.pity.max : 0;
  const currentPool = d.pity.hasCurrent ? d.pools.filter((p) => p.currentPity === currentPity).sort((a, b) => b.count - a.count)[0] : null;
  const cap = currentPool ? (d.pity.cap[currentPool.type] || 90) : 90;
  const progress = Math.min(100, cap ? (currentPity / cap) * 100 : 0);
  const recent = d.recentFive?.[0];
  const warnings = (d.warnings || []).slice(0, 2);
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
        <button class="ghost-btn" data-action="go" data-view="records">${ICONS.records} 查看五星</button>
        <button class="primary-btn" data-action="go" data-view="import">${ICONS.import} 补录历史</button>
        <span class="pill ${state.collector?.enabled ? 'accent' : ''}" title="后台只读本机游戏缓存，不需要登录"><span class="pulse" style="width:4px;height:4px"></span>后台采集${state.collector?.enabled ? '中' : '已暂停'}</span>
      </div>
    </div>
    <div class="hero">
      <div class="card hero-card">
        <div class="hero-top">
          <div>
            <div class="hero-kicker"><span class="dot"></span> LIFETIME PULLS / 生涯抽数</div>
            <div class="hero-number-row"><div class="hero-number">${heroValue}</div><div class="hero-unit">${hasTotals ? '抽' : '待补录'}</div></div>
            <div class="hero-sub">已归档 <b>${fmt(d.counts.lifetimeFive)}</b> 张五星${d.meta?.uid ? ` · UID ${esc(d.meta.uid)}` : ''} · 官方窗口 ${esc(d.coverage.officialWindow)}</div>
            <div class="hero-pills">
              <span class="pill accent"><b>${d.counts.lifetimeFive}</b> 五星</span>
              <span class="pill"><b>${d.counts.limitedFive || 0}</b> 非常驻</span>
              <span class="pill"><b>${d.counts.overlapFive ? fmt(d.counts.overlapFive) : '0'}</b> 重叠五星</span>
            </div>
          </div>
          <div style="text-align:right;position:relative;z-index:1">
            <div class="hero-kicker" style="justify-content:flex-end">最新五星</div>
            <div style="margin-top:12px;display:flex;justify-content:flex-end">${recent ? itemIcon(recent.name, recent.itemId, 'large') : '<div class="item-icon large"><span class="fallback">✦</span></div>'}</div>
            <div style="font-size:10px;color:var(--muted);margin-top:8px">${recent ? esc(recent.name) : '等待记录'}</div>
          </div>
        </div>
      </div>
      <div class="hero-side">
        <div class="card rate-card">
          <div class="rate-copy">
            <div class="label">HIT RATE</div>
            <div class="value">${hitRate == null ? '—' : pct(hitRate)}<small>命中率</small></div>
            <div class="foot">命中 ${d.rates.upWins} / 五星 ${d.counts.exactFive}</div>
          </div>
          <div class="rate-ring" style="--p:${Math.min(100, (hitRate || 0) * 100).toFixed(1)}%"><div><strong>${fmt(d.counts.lifetimeFive)}</strong><span>FIVE STARS</span></div></div>
        </div>
        <div class="card" style="padding:16px 19px;min-height:105px">
          <div style="display:flex;justify-content:space-between;align-items:center">
            <div class="stat-label">当前垫抽 <span class="mini">${currentPool ? esc(currentPool.label) : '暂无'}</span></div>
            <div style="font-family:var(--mono);font-size:24px;font-weight:300;color:var(--accent)">${d.pity.hasCurrent ? currentPity : '—'}<small style="font-size:9px;color:var(--muted)">${d.pity.hasCurrent ? `/${cap}` : ''}</small></div>
          </div>
          <div class="pool-bar" style="margin-top:11px"><i style="width:${progress}%"></i></div>
          <div style="font-size:8.5px;color:var(--muted-2);margin-top:7px">${d.pity.hasCurrent ? `距离保底还有 ${Math.max(0, cap - currentPity)} 抽 · 当前垫抽为近似值` : '同步官方接口后显示当前垫抽'}</div>
        </div>
      </div>
    </div>
    <div class="stat-row">
      ${statCard('五星档案', fmt(d.counts.lifetimeFive), '张', `${d.counts.exactFive} 张有逐条明细`)}
      ${statCard('平均出金', avgValue, '', avgNote, '')}
      ${statCard('非常驻命中', fmt(d.counts.limitedFive || 0), '张', `命中 ${d.rates.upWins} / 五星 ${d.counts.exactFive}`)}
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
        <div class="card-head"><div class="card-title"><span class="mark"></span><h3>最近的金色</h3><span>RECENT FIVE-STARS</span></div></div>
        ${d.recentFive?.length ? `<div class="timeline">${d.recentFive.map((r) => itemRow(r)).join('')}</div>` : `<div class="empty-chart">还没有五星记录</div>`}
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
    segments.push(`<div class="timeline-seg exact" style="left:${pos(d.coverage.exactRange.start)}%;width:${Math.max(0.4, pos(d.coverage.exactRange.end) - pos(d.coverage.exactRange.start))}%" title="官方近期 ${d.coverage.exactRange.start} → ${d.coverage.exactRange.end}"></div>`);
  }
  if (d.counts.overlap > 0 && d.coverage.intervals.length && d.coverage.exactRange?.start) {
    const left = Math.max(pos(d.coverage.intervals[0].start), pos(d.coverage.exactRange.start));
    const right = Math.min(pos(d.coverage.intervals[d.coverage.intervals.length - 1].end), pos(d.coverage.exactRange.end));
    if (right > left) segments.push(`<div class="timeline-seg overlap" style="left:${left}%;width:${right - left}%" title="重叠段"></div>`);
  }
  const startYear = d.coverage.launchDate.slice(0, 4);
  const nowYear = new Date().getFullYear();
  return `<div class="coverage-head">
    <div><div class="card-title"><span class="mark"></span><h3>生涯覆盖</h3><span>DATA COVERAGE</span></div></div>
    <div class="coverage-summary">
      <span class="coverage-badge exact"><i class="swatch"></i>官方近期 ${fmt(d.counts.exact)} 抽</span>
      <span class="coverage-badge snapshot"><i class="swatch"></i>历史汇总 ${fmt(d.counts.snapshotOnly)} 抽</span>
      ${d.counts.overlap ? `<span class="coverage-badge overlap"><i class="swatch"></i>重叠 ${fmt(d.counts.overlap)} 抽</span>` : ''}
    </div>
  </div>
  <div class="timeline-rail">${segments.join('')}</div>
  <div class="timeline-years"><span>${startYear}</span><span>${startYear}-${Number(startYear) + 1}</span><span>${nowYear}</span></div>
  <div class="timeline-legend"><span><i style="background:var(--accent)"></i>官方接口（逐抽校验）</span><span><i style="background:#d6a45d"></i>截图 / 汇总补录</span><span><i style="background:#d87878"></i>重叠区间（已扣重）</span></div>
`;
}

function renderMonthly(monthly) {
  if (!monthly?.length) return `<div class="empty-chart">还没有五星记录</div>`;
  const data = monthly.slice(-12);
  const max = Math.max(1, ...data.map((m) => m.five));
  return `<div class="chart-wrap"><div class="month-chart">
    <div class="month-grid"><i></i><i></i><i></i></div>
    <div class="month-bars">${data.map((m) => `<div class="month-col"><span class="month-value">${m.five || ''}</span><div class="month-bar-wrap"><div class="month-bar" style="height:${(m.five / max) * 100}%"></div></div><span class="month-label">${m.label || m.month.slice(2, 7).replace('-', '/')}</span></div>`).join('')}</div>
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
    <div class="table-wrap" style="border:0"><table><thead><tr><th>卡池</th><th>抽数</th><th>五星</th><th>五星率</th><th>非常驻</th><th>常驻</th><th>命中率</th><th>当前垫抽</th></tr></thead><tbody>
      ${list.map((p) => `<tr><td><b style="color:var(--text);font-weight:550">${esc(p.label)}</b></td><td>${p.count ? fmt(p.count) : '—'}</td><td>${p.five}</td><td>${p.rate == null ? '—' : pct(p.rate)}</td><td>${p.hitApplicable ? `<span class="badge accent">${p.limited}</span>` : '<span class="muted">—</span>'}</td><td>${p.hitApplicable ? `<span class="badge">${p.standard}</span>` : '<span class="muted">—</span>'}</td><td>${p.hitRate == null ? '—' : pct(p.hitRate)}</td><td>${p.currentPity || '—'}</td></tr>`).join('')}
    </tbody></table></div>
  </div>`;
}


function renderFeatureCards() {
  return `<div class="grid cols-3" style="margin-top:15px">
    <div class="card"><div class="source-icon" style="margin-bottom:12px">${ICONS.link}</div><h3>自动读链</h3></div>
    <div class="card"><div class="source-icon" style="margin-bottom:12px">${ICONS.image}</div><h3>截图补录</h3></div>
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
  return `<div class="page-head">
    <div><div class="eyebrow">ARCHIVE · FIVE-STAR ONLY</div><h1>五星记录</h1></div>
    <div class="page-head-actions">
      <button class="ghost-btn" data-action="manual-add">+ 五星</button>
      <a class="ghost-btn" href="/api/export/uigf?game=${state.game}">${ICONS.download} UIGF</a>
      <a class="ghost-btn" href="/api/export/csv?game=${state.game}">${ICONS.download} CSV</a>
    </div>
  </div>
  <div class="toolbar">
    <div class="search-box">${ICONS.search}<input id="record-search" class="input" placeholder="搜索角色、武器或卡池…" value="${attr(state.recordFilter.search)}"></div>
    <div class="record-pools">${[{ type: 'all', label: '全部卡池' }, ...pools].map((p) => `<button class="pool-chip ${state.recordFilter.pool === p.type ? 'active' : ''}" data-action="record-pool" data-pool="${attr(p.type)}">${esc(p.label)}</button>`).join('')}</div>
    <button class="ghost-btn" data-action="records-reset">重置</button>
  </div>
  ${loading ? `<div class="loading-line"><span class="spinner"></span>读取记录…</div>` : (data.records.length ? renderRecordGroups(data.records) : `<div class="empty-state"><div class="orb">${ICONS.records}</div><h2>暂无记录</h2><div class="empty-actions"><button class="primary-btn" data-action="go" data-view="import">开始同步</button></div></div>`)}
  ${data ? `<div class="record-total">共 ${fmt(data.total)} 张五星</div>` : ''}`;
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
    pity > 0 && pity < 20 ? '<span class="luck-tag">欧</span>' : '',
    pity > 0 && pity <= 10 ? '<span class="luck-tag chain">连金</span>' : '',
  ].filter(Boolean).join('');
  return `<div class="record-row">
    <div class="record-time"><span>${esc(r.version || '未知版本')}</span><small>${r.source === 'official' ? '官方' : r.source === 'screenshot' ? '截图' : r.source === 'uigf' ? 'UIGF' : '本地'}</small></div>
    <div class="record-item">${itemIcon(r.name, r.itemId, 'small', r.rank)}<div class="record-name"><strong>${esc(r.name)}</strong><span>${esc(r.itemType || '五星')}</span></div></div>
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
  const tabs = [
    ['auto', '自动读取', 'AUTO'],
    ['paste', '粘贴链接', 'LINK'],
    ['screenshot', '截图补录', 'OCR'],
    ['summary', '历史汇总', 'SUMMARY'],
  ];
  return `<div class="page-head"><div><div class="eyebrow">SYNC · DATA RECOVERY</div><h1>数据补录</h1></div><div class="page-head-actions"><span class="pill"><b>${fmt(d?.counts.lifetime || 0)}</b> 生涯抽</span><span class="pill accent"><b>${fmt(d?.counts.lifetimeFive || 0)}</b> 五星</span></div></div>
  <div class="tabs">${tabs.map(([id, label, tag]) => `<button class="tab ${state.importTab === id ? 'active' : ''}" data-action="switch-import-tab" data-tab="${id}">${label}<span class="count">${tag}</span></button>`).join('')}</div>
  <div class="tab-panel" id="import-panel">${renderImportPanel()}</div>`;
}

function renderImportPanel() {
  let main = '';
  if (state.importTab === 'auto') main = renderAutoImport();
  if (state.importTab === 'paste') main = renderPasteImport();
  if (state.importTab === 'screenshot') main = renderScreenshotImport();
  if (state.importTab === 'summary') main = renderSummaryImport();
  return `<div class="import-layout" style="grid-template-columns:1fr"><div class="import-main">${main}</div></div>`;
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
      <span style="font-size:9px;color:var(--muted-2)">${col?.lastRun ? `上次扫描 ${timeAgo(col.lastRun)}` : '等待首次扫描'} · 间隔 ${Math.round((col?.intervalMs || 30000) / 1000)} 秒</span>
    </div>
    ${events.length ? `<div style="margin-top:12px;border-top:1px solid var(--line);padding-top:8px">${events.slice(0, 4).map((e) => `<div class="kv"><span>${esc(GAME_META[e.game]?.name || e.gameName || e.game)} · ${esc(e.ok ? '已同步' : '未同步')}</span><b>${esc(e.message)}${e.added ? ` · +${e.added} 金` : ''}${e.upgraded ? ` · 提升 ${e.upgraded}` : ''}</b></div>`).join('')}</div>` : ''}
  </div>`;
  return `${collectorCard}<div class="card">
    <div class="card-head"><div class="card-title"><span class="mark"></span><h3>读取本机游戏缓存</h3><span>WEBCACHE</span></div></div>
    <div class="scan-grid" style="margin-top:16px">
      ${state.gameOrder.filter((id) => !state.hiddenGames.includes(id)).map((id) => {
        const meta = GAME_META[id];
        const found = scan?.found?.[id];
        return `<div class="scan-card"><div class="scan-head"><div class="scan-name"><span class="game-dot" style="color:${meta.color};background:${meta.color}"></span>${meta.name}</div><span class="scan-state ${found ? 'found' : ''}">${found ? '已找到链接' : scan ? '未找到' : '等待扫描'}</span></div>
          <div class="scan-meta">${found ? `${esc(found.region || found.gameBiz || '区服未知')}<br>${esc(found.preview || 'authkey 已隐藏')}` : '未找到'}</div>
          ${found ? `<button class="primary-btn compact" data-action="sync-link" data-game="${id}" data-link="${attr(found.linkId)}">读取并同步</button>` : `<button class="ghost-btn" data-action="scan-links">扫描</button>`}
        </div>`;
      }).join('')}
    </div>
    <div style="display:flex;gap:8px;margin-top:16px;flex-wrap:wrap"><button class="primary-btn" data-action="scan-links">${ICONS.refresh} 扫描本机链接</button><button class="ghost-btn" data-action="switch-import-tab" data-tab="paste">没有找到？粘贴链接</button></div>
    ${scan ? `<details style="margin-top:16px"><summary style="cursor:pointer;color:var(--muted);font-size:10px">查看扫描诊断（${scan.diagnostics?.length || 0} 项）</summary><div style="margin-top:10px;max-height:220px;overflow:auto;font-family:var(--mono);font-size:8.5px;color:var(--muted-2);line-height:1.8">${(scan.diagnostics || []).map((x) => `${esc(x.type)} · ${esc(x.game)} · ${esc(x.path || x.file || x.installDir || '')}${x.exists === false ? ' · 不存在' : ''}${x.error ? ' · ' + esc(x.error) : ''}`).join('<br>')}</div></details>` : ''}
  </div>`;
}

function renderPasteImport() {
  const link = state.pendingLink;
  return `<div class="card">
    <div class="card-head"><div class="card-title"><span class="mark"></span><h3>粘贴抽卡链接</h3><span>MANUAL URL</span></div></div>
    <div class="field" style="margin-top:14px"><label>抽卡记录链接</label><textarea id="paste-url" class="input" rows="5" placeholder="https://public-operation-hk4e.mihoyo.com/gacha_info/api/getGachaLog?authkey=..."></textarea></div>
    <div style="display:flex;gap:8px;margin-top:12px"><button class="primary-btn" data-action="parse-link">${ICONS.link} 解析链接</button>${link ? `<button class="primary-btn" data-action="sync-paste">${ICONS.download} 读取并同步</button>` : ''}</div>
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
  return { Created: '等待扫描', Scanned: '已扫描，请在手机上确认', Confirmed: '登录成功', Expired: '二维码已过期', Cancelled: '已取消' }[status] || '等待扫描';
}

function authRoleRows() {
  const a = state.auth;
  const order = state.gameOrder.length ? state.gameOrder : GAME_ORDER;
  return order.map((game) => {
    const meta = GAME_META[game];
    const roles = a.rolesByGame?.[game] || [];
    const error = a.errors?.[game];
    return `<div class="auth-game">
      <div class="auth-game-head"><span class="game-dot" style="background:${meta.color};color:${meta.color}"></span><strong>${meta.label}</strong><span>${roles.length} 个角色</span></div>
      ${roles.length ? roles.map((r) => `<div class="role-item"><div class="role-main"><strong>${esc(r.nickname || r.uid)}</strong><span>UID ${esc(r.uid)} · ${esc(r.regionName || r.region)}</span></div><button class="ghost-btn" data-action="auth-sync" data-game="${game}" data-uid="${attr(r.uid)}">同步</button></div>`).join('') : `<div class="auth-empty">${error ? esc(error) : '没有绑定角色'}</div>`}
    </div>`;
  }).join('');
}

function renderAuthModalBody() {
  const a = state.auth;
  if (a.status === 'Confirmed') {
    return `<div data-auth-modal>
      <h2>米游社</h2>
      <div class="qr-status ok"><span class="pulse"></span><span>已登录${a.user?.nickname ? ' · ' + esc(a.user.nickname) : ''}${a.user?.aid ? ' · ' + esc(a.user.aid) : ''}</span></div>
      <div class="auth-games">${authRoleRows()}</div>
      <div class="modal-actions" style="justify-content:space-between">
        <div style="display:flex;gap:7px"><button class="primary-btn" data-action="auth-sync-all">同步所有游戏</button><button class="ghost-btn" data-action="auth-logout">退出登录</button></div>
        <button class="ghost-btn" data-action="auth-close">关闭</button>
      </div>
    </div>`;
  }
  const qr = a.status && a.url;
  const status = a.status || '';
  return `<div data-auth-modal>
    <h2>米游社登录</h2>
    <div class="qr-login">
      <div class="qr-frame" id="auth-qr-frame">${qr ? '<img id="auth-qr-image" alt="">' : `<div class="qr-placeholder">${ICONS.qr}<br>二维码</div>`}</div>
      <div>
        <div class="qr-status ${status === 'Confirmed' ? 'ok' : ''}"><span class="pulse"></span><span>${qrStatusText(status || 'Created')}</span></div>
        <div class="qr-actions"><button class="primary-btn" data-action="auth-start">${qr ? '重新生成' : '生成二维码'}</button><button class="ghost-btn" data-action="auth-close">关闭</button></div>
        ${a.status === 'Expired' || a.status === 'Cancelled' ? '<button class="ghost-btn" style="margin-top:8px" data-action="auth-start">重新生成</button>' : ''}
      </div>
    </div>
  </div>`;
}

function drawAuthQr() {
  const img = $('#auth-qr-image');
  if (!img || !state.auth.url) return;
  try {
    const qr = qrcode(0, 'M');
    qr.addData(state.auth.url);
    qr.make();
    img.src = qr.createDataURL(7, 2);
  } catch { /* leave placeholder */ }
}

function refreshAuthModal(force = false) {
  if (!force && !$('[data-auth-modal]')) return;
  openModal(renderAuthModalBody());
  drawAuthQr();
}

async function openAuthModal() {
  openModal(renderAuthModalBody());
  drawAuthQr();
  if (state.auth.status === 'Confirmed') {
    if (!Object.keys(state.auth.rolesByGame || {}).length) await loadAllAuthRoles();
    else refreshAuthModal(true);
    return;
  }
  if (!state.auth.sessionId) await startAuthQr();
  else {
    drawAuthQr();
    startAuthPolling();
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
  $('#modal-root').innerHTML = '';
  if (data.game && data.game !== state.game) {
    state.game = data.game;
    state.catalog = null;
    document.body.dataset.game = data.game;
  }
  await reloadAfterSync(data);
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
    <div class="card-head"><div class="card-title"><span class="mark"></span><h3>从截图补录五星</h3><span>LOCAL OCR</span></div></div>
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
    <div style="display:flex;justify-content:space-between;align-items:center;gap:10px;flex-wrap:wrap"><div class="card-title"><span class="mark"></span><h3>识别结果</h3><span>${rows.length} 条候选</span></div><div style="display:flex;gap:7px"><button class="ghost-btn" data-action="ocr-add">+ 手动一行</button><button class="primary-btn" data-action="ocr-save">${ICONS.download} 保存五星记录</button></div></div>
    <div class="ocr-summary" style="margin-bottom:12px">
      <div class="mini-stat"><span>识别候选</span><b>${rows.length}</b></div>
      <div class="mini-stat"><span>总抽数（OCR）</span><b>${result.summary?.totalPulls ?? '—'}</b></div>
      <div class="mini-stat"><span>五星数（OCR）</span><b>${result.summary?.fiveStars ?? '—'}</b></div>
    </div>
    ${rows.length ? `<div class="table-wrap"><table class="review-table"><thead><tr><th>时间</th><th>名称</th><th>星级</th><th>抽数</th><th>置信</th><th></th></tr></thead><tbody id="ocr-rows">${rows.map((r, i) => ocrRow(r, i)).join('')}</tbody></table></div>` : `<div class="empty-chart" style="height:100px">没有识别出五星行。可以换一张更清晰的截图，或手填。</div>`}
    ${result.summary?.totalPulls || result.summary?.fiveStars ? `<div style="margin-top:12px;display:flex;gap:8px;flex-wrap:wrap"><button class="ghost-btn" data-action="ocr-to-summary" data-total="${result.summary.totalPulls || ''}" data-five="${result.summary.fiveStars || ''}">填入历史汇总</button><button class="primary-btn" data-action="ocr-save-summary" data-total="${result.summary.totalPulls || ''}" data-five="${result.summary.fiveStars || ''}">保存汇总</button></div>` : ''}
  </div>`;
}

function ocrRow(r, i) {
  return `<tr data-ocr-row="${i}">
    <td><input class="input time-input" data-field="time" value="${attr(r.time || '')}" placeholder="2025-01-01 12:00:00"></td>
    <td><input class="input name-input" list="five-names" data-field="name" value="${attr(r.name || '')}" placeholder="角色 / 武器名"></td>
    <td><select class="input rank-select" data-field="rank"><option value="5" selected>五星</option><option value="4">四星</option><option value="3">三星</option></select></td>
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
    <div class="card-head"><div class="card-title"><span class="mark"></span><h3>历史汇总补录</h3><span>AGGREGATE</span></div></div>
    <form id="snapshot-form" class="form-grid" style="margin-top:16px">
      <div class="field"><label>覆盖开始</label><input class="input" type="date" name="periodStart" value="${esc(d?.coverage?.start || '2024-07-04')}" required></div>
      <div class="field"><label>覆盖结束</label><input class="input" type="date" name="periodEnd" value="${esc(new Date().toISOString().slice(0, 10))}" required></div>
      <div class="field"><label>总抽数 *</label><input class="input" type="number" min="1" max="999999" name="totalPulls" placeholder="例如 1560" value="${attr(pre.totalPulls || '')}" required></div>
      <div class="field"><label>五星数量</label><input class="input" type="number" min="0" max="99999" name="fiveStars" placeholder="例如 22" value="${attr(pre.fiveStars || '')}"></div>
      <div class="field span-2"><label>备注 / 来源</label><input class="input" name="note" placeholder="例如：提瓦特小助手 2025-01 截图"></div>
      <div class="span-2" style="display:flex;justify-content:flex-end"><button class="primary-btn" type="submit">${ICONS.download} 保存汇总</button></div>
    </form>
    ${snaps.length ? `<div style="margin-top:24px"><div class="card-title" style="margin-bottom:10px"><span class="mark"></span><h3>已录入汇总</h3><span>${snaps.length} 段</span></div><div class="table-wrap"><table><thead><tr><th>区间</th><th>来源</th><th>总抽</th><th>五星</th><th>与官方重叠</th><th></th></tr></thead><tbody>${snaps.map((s) => `<tr><td class="time-cell">${esc(String(s.periodStart || '').slice(0, 10))} → ${esc(String(s.periodEnd || '').slice(0, 10))}</td><td><span class="badge ${s.source === 'zzz-official' ? 'accent' : ''}">${s.source === 'zzz-official' ? '官方全量' : '补录'}</span></td><td>${fmt(s.totalPulls)}</td><td>${fmt(s.fiveStars)}</td><td>${s.exactFiveWithin ? `<span class="badge gold">${s.exactFiveWithin} 张五星</span>` : '<span class="muted">—</span>'}</td><td><button class="ghost-btn danger" style="padding:5px 7px" data-action="snapshot-delete" data-id="${attr(s.id)}">删除</button></td></tr>`).join('')}</tbody></table></div></div>` : ''}
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
  const types = [...new Set(c.items.map((i) => i.type))];
  const items = c.items.filter((i) => {
    if (f.type !== 'all' && i.type !== f.type) return false;
    if (f.rarity !== 'all' && String(i.rarity) !== f.rarity) return false;
    if (f.search && !i.name.includes(f.search)) return false;
    return true;
  });
  return `<div class="page-head"><div><div class="eyebrow">CATALOG · LIVE DATA</div><h1>角色图鉴</h1></div><div class="page-head-actions"><button class="ghost-btn" data-action="catalog-sync">${ICONS.refresh} 同步图鉴</button><span class="pill"><b>${fmt(c.items.length)}</b> 条目</span></div></div>
  <div class="catalog-toolbar">
    <div class="search-box">${ICONS.search}<input id="catalog-search" class="input" placeholder="搜索角色、武器、光锥、音擎…" value="${attr(f.search)}"></div>
    <select id="catalog-type" class="select" style="width:140px"><option value="all">全部类型</option>${types.map((t) => `<option value="${attr(t)}" ${f.type === t ? 'selected' : ''}>${esc(t)}</option>`).join('')}</select>
    <select id="catalog-rarity" class="select" style="width:120px"><option value="all">全部星级</option><option value="5" ${f.rarity === '5' ? 'selected' : ''}>五星</option><option value="4" ${f.rarity === '4' ? 'selected' : ''}>四星</option><option value="3" ${f.rarity === '3' ? 'selected' : ''}>三星</option></select>
    <span class="hint" style="margin-left:auto;color:var(--muted-2);font-size:9px">${c.items.length} 条 · ${esc(c.version || '')}</span>
  </div>
  <div class="card"><div class="catalog-grid">${items.length ? items.map((i) => `<div class="catalog-item"><div class="art ${i.iconUrl ? '' : 'img-missing'}"><span class="fallback">✦</span>${i.iconUrl ? `<img loading="lazy" src="${attr(i.iconUrl)}" alt="" onerror="this.remove();this.parentElement.classList.add('img-missing')">` : ''}<span class="rarity-line">${'★'.repeat(Math.min(5, i.rarity || 0))}</span>${owned.has(i.name) ? `<span class="owned">✓</span>` : ''}</div><div class="meta"><strong title="${attr(i.name)}">${esc(i.name)}</strong><span>${esc(i.type)}${i.path ? ` · ${esc(i.path)}` : ''}</span></div></div>`).join('') : `<div class="catalog-empty">没有匹配的图鉴条目</div>`}</div></div>
`;
}

// ---------------- settings ----------------

function renderSettings() {
  const c = state.catalog;
  return `<div class="page-head"><div><div class="eyebrow">SYSTEM</div><h1>设置</h1></div></div>
  <div class="settings-grid">
    <div class="card">
      <div class="card-head"><div class="card-title"><span class="mark"></span><h3>数据管理</h3><span>DATA</span></div></div>
      <div class="setting-row"><div class="setting-copy"><strong>导入 UIGF / SRGF JSON</strong></div><label class="ghost-btn" style="cursor:pointer">${ICONS.upload} 选择文件<input type="file" id="uigf-file" accept="application/json,.json" hidden></label></div>
      <div class="setting-row"><div class="setting-copy"><strong>导出当前游戏 UIGF</strong></div><a class="ghost-btn" href="/api/export/uigf?game=${state.game}">${ICONS.download} 导出</a></div>
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
      <div class="kv"><span>版本</span><b>v${esc(state.shell?.version || '0.9.0')}</b></div>
      <div class="kv"><span>数据目录</span><b>${esc(state.dataDir || './data')}</b></div>
      <div class="kv"><span>图鉴</span><b>${c ? `${c.items.length} 条 · ${esc(c.version || '')}` : '按需加载'}</b></div>
      <div class="kv"><span>当前账号</span><b>${state.dashboard?.meta?.uid ? `UID ${esc(state.dashboard.meta.uid)}` : '未绑定'}</b></div>
      <div class="kv"><span>最近同步</span><b>${state.dashboard?.meta?.lastSync ? timeAgo(state.dashboard.meta.lastSync) : '尚未同步'}</b></div>
    </div>
    <div class="card">
      <div class="card-head"><div class="card-title"><span class="mark"></span><h3>软件更新</h3><span>UPDATE</span></div></div>
      <div class="setting-row"><div class="setting-copy"><strong>当前版本</strong><span>v${esc(state.shell?.version || '1.0.0')}</span></div><button class="ghost-btn" data-action="check-update">检查更新</button></div>
      ${state.update?.checking ? '<div class="kv"><span>状态</span><b>检查中…</b></div>' : ''}
      ${state.update && !state.update.checking ? `<div class="kv"><span>最新版本</span><b>v${esc(state.update.latest || '—')}</b></div>${state.update.hasUpdate ? `<div style="padding:10px 16px 14px"><button class="primary-btn" data-action="apply-update">更新到 v${esc(state.update.latest)}</button></div>` : ''}` : ''}
    </div>
  </div>`;
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
  if (state.view === 'settings') {
    $('#uigf-file')?.addEventListener('change', importUigfFile);
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
    if (action === 'go') { e.preventDefault(); navigate(el.dataset.view); return; }
    if (action === 'switch-game') { setGame(el.dataset.game); return; }
    if (action === 'refresh') { setBusy(el, true); await refreshAll(); setBusy(el, false); return; }
    if (action === 'switch-import-tab') {
      if (el.dataset.tab === 'screenshot' && !state.catalog) await loadCatalog();
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
    if (action === 'sync-paste') {
      if (!state.pendingLink) throw new Error('请先解析链接');
      setBusy(el, true, '同步中');
      const data = await api('/api/sync', { method: 'POST', body: JSON.stringify({ game: state.game, linkId: state.pendingLink.linkId }) });
      state.pendingLink = null;
      await reloadAfterSync(data);
      setBusy(el, false);
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
      try { await window.desktop.applyUpdate(); } catch (e) { setBusy(el, false); toast(e.message, 'err', 6000); }
      return;
    }
    if (action === 'manual-add') {
      const pools = state.dashboard?.pools || [];
      const modal = openModal(`<h2>添加五星</h2><form id="manual-form" class="form-grid"><div class="field span-2"><label>名称</label><input class="input" name="name" required></div><div class="field"><label>时间</label><input class="input" type="datetime-local" name="time" required></div><div class="field"><label>卡池</label><select class="input" name="gachaType">${pools.map((p) => `<option value="${attr(p.type)}">${esc(p.label)}</option>`).join('')}</select></div><div class="field"><label>抽数</label><input class="input" type="number" min="0" name="pity"></div><div class="span-2" style="display:flex;justify-content:flex-end"><button class="primary-btn" type="submit">保存</button></div></form>`);
      $('#manual-form').onsubmit = async (ev) => {
        ev.preventDefault();
        const fd = Object.fromEntries(new FormData(ev.target).entries());
        try {
          await api('/api/records/manual', { method: 'POST', body: JSON.stringify({ game: state.game, ...fd }) });
          modal.close();
          await loadRecords(1);
          await loadDashboard();
          toast('已添加');
        } catch (err) { toast(err.message, 'err'); }
      };
      return;
    }
    if (action === 'records-page') { await loadRecords(Number(el.dataset.page)); return; }
    if (action === 'record-pool') {
      state.recordFilter.pool = el.dataset.pool || 'all';
      loadRecords(1).catch((err) => toast(err.message, 'err'));
      return;
    }
    if (action === 'records-reset') { state.recordFilter = { search: '', pool: 'all', source: 'all', page: 1 }; await loadRecords(1); return; }
    if (action === 'catalog-sync') {
      setBusy(el, true, '同步中');
      const data = await api('/api/catalog/sync', { method: 'POST', body: JSON.stringify({ game: state.game }) });
      state.catalog = null;
      await loadCatalog();
      toast(data.result?.message || `图鉴已同步：${data.result?.count || ''} 条`);
      setBusy(el, false);
      return;
    }
    if (action === 'reset-game') {
      const yes = await confirmDialog('重置当前游戏？', `将删除${gameName()}的所有五星、总抽数与历史汇总，无法恢复。建议先导出备份。`, '确认重置');
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
    if (action === 'open-auth') { await openAuthModal(); return; }
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
  toast(`已同步 ${fmt(data.totalFetched)} 抽，新增 ${added} 张五星${up}${extra}`, data.errors?.length ? 'err' : 'ok', 5000);
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

async function importUigfFile(e) {
  const file = e.target.files?.[0];
  if (!file) return;
  try {
    const text = await file.text();
    const data = JSON.parse(text);
    const result = await api('/api/import/uigf', { method: 'POST', body: JSON.stringify(data) });
    await refreshAll();
    toast(result.summary.map((s) => `${s.gameName}：${s.totalPulls} 抽 / 导入 ${s.importedFive} 张五星`).join('；'), 'ok', 6000);
  } catch (err) { toast(err.message, 'err', 6000); }
  finally { e.target.value = ''; }
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
    renderShell();
    renderView();
    startCollectorPolling();
    if (location.hash) {
      const h = location.hash.replace('#', '');
      if (['dashboard', 'records', 'import', 'catalog', 'settings'].includes(h)) navigate(h);
    }
  } catch (e) {
    $('#view').innerHTML = `<div class="empty-state"><div class="orb">${ICONS.warn}</div><h2>无法启动</h2><p>${esc(e.message)}</p><p>请确认本地服务正在运行：<code>node src/server.js</code></p></div>`;
  }
})();
