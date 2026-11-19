/* 二游档案 · 动态主题加载器
 * 主题来自 themes/themes.json；运行时只依赖这个加载器和基础样式。
 * 不触碰原应用业务状态，只通过根属性 / 设置页主题卡 / Cookie / 主题 API 工作。
 */
(() => {
  'use strict';

  const root = document.documentElement;
  const embedded = root.dataset.mechaEmbedded === '1';
  const COOKIE_THEME = 'ga_theme';
  const COOKIE_GAMES = 'ga_theme_games';
  const BASE_THEME = 'mecha';
  const FALLBACK_THEMES = [
    { id: 'mecha', name: '机能 · 黑', en: 'MECHANICAL / DARK', description: '石墨 · 柠檬黄 · 直角', mode: 'package', variant: 'dark', assets: { css: 'theme.css' } },
    { id: 'light', name: '机能 · 白', en: 'MECHANICAL / PAPER', description: '纸白 · 灰字阴影 · 暗黄', mode: 'variant', extends: 'mecha', variant: 'light' },
    { id: 'classic', name: '经典', en: 'CLASSIC', description: '原版界面', mode: 'builtin', variant: 'classic' },
  ];
  const GAME_LABELS = {
    genshin: '原神', hsr: '崩坏：星穹铁道', zzz: '绝区零', hi3: '崩坏3',
    tot: '未定事件簿', arknights: '明日方舟', endfield: '明日方舟：终末地', nte: '异环',
  };

  let THEMES = [];
  let DEFAULT_THEME = 'mecha';
  let globalTheme = 'mecha';
  let current = '';
  let gameThemes = {};
  let currentGame = '';
  let saveToken = 0;
  let catalogReady = false;
  let lastApplied = '';
  let lastAssets = { css: null, js: null };

  const isTheme = (value) => THEMES.some((item) => item.id === value);
  const byId = (id) => THEMES.find((item) => item.id === id) || null;
  const esc = (value) => String(value ?? '').replace(/[&<>"']/g, (char) => ({
    '&': '&amp;', '<': '&lt;', '>': '&gt;', '"': '&quot;', "'": '&#39;',
  }[char]));

  function readCookieValue(name) {
    const match = document.cookie.match(new RegExp(`(?:^|;\\s*)${name}=([^;]+)`));
    if (!match) return '';
    try { return decodeURIComponent(match[1]); } catch { return match[1]; }
  }

  function readCookieTheme() {
    const value = readCookieValue(COOKIE_THEME);
    return value;
  }

  function readCookieGames() {
    const raw = readCookieValue(COOKIE_GAMES);
    if (!raw) return {};
    try {
      const parsed = JSON.parse(raw);
      if (!parsed || typeof parsed !== 'object' || Array.isArray(parsed)) return {};
      // 此时主题目录可能还没 fetch 完成，只校验结构；主题 ID 在 catalog 加载后再过滤。
      return Object.fromEntries(Object.entries(parsed).filter(([game, theme]) => GAME_LABELS[game] && typeof theme === 'string' && theme));
    } catch {
      return {};
    }
  }

  function writeCookie(name, value) {
    document.cookie = `${name}=${encodeURIComponent(value)}; Max-Age=31536000; Path=/; SameSite=Lax`;
  }

  function themeFromRoot() {
    if (root.dataset.theme === 'classic') return 'classic';
    if (root.dataset.theme === 'mecha') return root.dataset.mechaVariant === 'light' ? 'light' : 'mecha';
    return root.dataset.theme || '';
  }

  function currentGameFromDom() {
    return document.body?.dataset.game || document.querySelector('#game-tabs .game-tab.active')?.dataset.game || '';
  }

  function gameList() {
    const seen = new Map();
    document.querySelectorAll('#game-tabs [data-action="switch-game"]').forEach((node) => {
      if (node.dataset.game) seen.set(node.dataset.game, (node.textContent || '').trim());
    });
    return Object.keys(GAME_LABELS).map((id) => ({
      id,
      label: seen.get(id) || GAME_LABELS[id],
    }));
  }

  function normalizeManifest(item) {
    if (!item || typeof item !== 'object' || !item.id) return null;
    return {
      ...item,
      name: item.name || item.id,
      en: item.en || item.id.toUpperCase(),
      description: item.description || '',
      mode: item.mode || 'package',
      variant: item.variant || 'dark',
      assets: item.assets || null,
    };
  }

  function resolveTheme() {
    if (isTheme(gameThemes[currentGame])) return gameThemes[currentGame];
    if (isTheme(globalTheme)) return globalTheme;
    return isTheme(DEFAULT_THEME) ? DEFAULT_THEME : (THEMES[0]?.id || 'mecha');
  }

  function attrsFor(theme) {
    if (!theme) return { theme: 'mecha', variant: 'dark' };
    if (theme.mode === 'variant') {
      const base = byId(theme.extends);
      return { theme: base?.id || theme.extends || theme.id, variant: theme.variant || 'light' };
    }
    if (theme.mode === 'builtin') return { theme: theme.id, variant: '' };
    if (theme.id === BASE_THEME) return { theme: theme.id, variant: theme.variant === 'light' ? 'light' : 'dark' };
    return { theme: theme.id, variant: '' };
  }

  function applyRoot(themeId) {
    const theme = byId(themeId);
    const attrs = attrsFor(theme);
    root.dataset.theme = attrs.theme;
    if (attrs.variant) root.dataset.mechaVariant = attrs.variant;
    else delete root.dataset.mechaVariant;
    if (document.body) {
      document.body.dataset.theme = themeId;
      if (attrs.variant) document.body.dataset.mechaVariant = attrs.variant;
      else delete document.body.dataset.mechaVariant;
    }
  }

  function syncThemeMeta() {
    let meta = document.querySelector('meta[name="theme-color"]');
    if (!meta) {
      meta = document.createElement('meta');
      meta.name = 'theme-color';
      document.head.appendChild(meta);
    }
    const color = current === 'light' ? '#e9e6da' : current === 'classic' ? '#0b0e14' : '#0b0d0c';
    meta.setAttribute('content', color);
  }

  function themeFileUrl(themeId, file) {
    const parts = String(file || '').split('/').filter(Boolean).map((part) => encodeURIComponent(part));
    return `/__theme/files/${encodeURIComponent(themeId)}/${parts.join('/')}`;
  }

  function cssSource(theme) {
    if (!theme || theme.mode === 'builtin') return null;
    if (theme.mode === 'variant') {
      const base = byId(theme.extends);
      if (!base || base.mode !== 'package' || !base.assets?.css) return null;
      if (base.id === BASE_THEME) return null;
      return { theme: base, id: base.id };
    }
    if (theme.mode === 'package') {
      if (!theme.assets?.css || theme.id === BASE_THEME) return null;
      return { theme, id: theme.id };
    }
    return null;
  }

  function loadThemeAssets(theme) {
    document.querySelectorAll('[data-theme-asset]').forEach((node) => node.remove());
    lastAssets = { css: null, js: null };
    const source = cssSource(theme);
    if (!source) return;
    const href = themeFileUrl(source.id, source.theme.assets.css);
    const css = document.createElement('link');
    css.rel = 'stylesheet';
    css.href = href;
    css.dataset.themeAsset = 'css';
    css.dataset.themeId = source.id;
    document.head.appendChild(css);
    lastAssets.css = css;
    if (source.theme.assets?.js) {
      const script = document.createElement('script');
      script.src = themeFileUrl(source.id, source.theme.assets.js);
      script.dataset.themeAsset = 'js';
      script.dataset.themeId = source.id;
      document.body.appendChild(script);
      lastAssets.js = script;
    }
  }

  function applyTheme(themeId, { quiet = false, replay = true, announce = true } = {}) {
    const theme = byId(themeId);
    if (!theme) return '';
    current = theme.id;
    applyRoot(current);
    loadThemeAssets(theme);
    updateUI();
    syncThemeMeta();
    if (announce) {
      window.dispatchEvent(new CustomEvent('mecha-theme-change', {
        detail: { theme: current, game: currentGame },
      }));
    }
    if (!quiet) note(`${theme.name}主题已启用`);
    if (replay && lastApplied !== current) requestAnimationFrame(() => primeMotion(true));
    lastApplied = current;
    return current;
  }

  function applyResolved(options = {}) {
    const theme = resolveTheme();
    if (theme && theme !== current) applyTheme(theme, options);
    else {
      updateUI();
      if (options.replay !== false) requestAnimationFrame(() => primeMotion(true));
    }
  }

  function setSaving(active) {
    document.querySelectorAll('.ga-settings-theme').forEach((node) => {
      if (active) node.setAttribute('data-saving', '1');
      else node.removeAttribute('data-saving');
    });
  }

  function stateSnapshot() {
    return { theme: globalTheme, gameThemes: { ...gameThemes } };
  }

  function note(message, isError = false) {
    const nodes = document.querySelectorAll('.ga-theme-note');
    if (!nodes.length) return;
    nodes.forEach((node) => {
      node.textContent = message;
      node.classList.toggle('is-error', isError);
    });
  }

  async function persistState(previous) {
    const token = ++saveToken;
    setSaving(true);
    note('正在保存…');
    try {
      if (embedded) {
        writeCookie(COOKIE_THEME, globalTheme);
        writeCookie(COOKIE_GAMES, JSON.stringify(gameThemes));
        if (readCookieValue(COOKIE_THEME) !== globalTheme) throw new Error('Cookie 被浏览器拒绝');
      } else {
        const response = await fetch('/__theme/api/theme', {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({ theme: globalTheme, gameThemes }),
        });
        const data = await response.json().catch(() => ({}));
        if (!response.ok || data.ok === false) throw new Error(data.message || `保存失败（HTTP ${response.status}）`);
      }
      if (token === saveToken) note('已保存 · 下次启动沿用');
    } catch (error) {
      if (token !== saveToken) return;
      if (previous) {
        globalTheme = previous.theme;
        gameThemes = { ...previous.gameThemes };
        applyResolved({ quiet: true });
        updateUI();
      }
      note(`主题保存失败：${error.message}`, true);
    } finally {
      if (token === saveToken) setSaving(false);
    }
  }

  function chooseTheme(theme) {
    if (!isTheme(theme) || theme === globalTheme) return;
    const previous = stateSnapshot();
    globalTheme = theme;
    applyResolved({ quiet: true });
    updateUI();
    persistState(previous);
  }

  function setGameTheme(game, theme) {
    if (!GAME_LABELS[game]) return;
    const previous = stateSnapshot();
    if (theme && isTheme(theme)) gameThemes[game] = theme;
    else delete gameThemes[game];
    if (game === currentGame) applyResolved({ quiet: true });
    updateUI();
    persistState(previous);
  }

  function clearGameThemes() {
    if (!Object.keys(gameThemes).length) return;
    const previous = stateSnapshot();
    gameThemes = {};
    applyResolved({ quiet: true });
    updateUI();
    persistState(previous);
  }

  function updateUI() {
    document.querySelectorAll('.ga-settings-theme [data-theme]').forEach((button) => {
      const active = button.dataset.theme === globalTheme;
      button.classList.toggle('is-active', active);
      button.setAttribute('aria-pressed', String(active));
    });
    document.querySelectorAll('.ga-settings-theme [data-game-theme]').forEach((select) => {
      select.value = gameThemes[select.dataset.gameTheme] || '';
      select.closest('.ga-game-theme-row')?.classList.toggle('is-current', select.dataset.gameTheme === currentGame);
    });
    const currentLabel = byId(current)?.name || '';
    const globalLabel = byId(globalTheme)?.name || '';
    const gameLabel = GAME_LABELS[currentGame] || currentGame || '';
    document.querySelectorAll('[data-current-game-theme]').forEach((node) => {
      node.textContent = gameLabel ? `当前游戏：${gameLabel} · 使用 ${currentLabel}` : `当前使用 ${currentLabel}`;
    });
    document.querySelectorAll('[data-global-theme]').forEach((node) => {
      node.textContent = `全局默认：${globalLabel}`;
    });
  }

  function gameSelectRows() {
    return gameList().map((game) => `<label class="ga-game-theme-row${game.id === currentGame ? ' is-current' : ''}">
      <span>${esc(game.label)}</span>
      <select class="select ga-game-theme-select" data-game-theme="${esc(game.id)}">
        <option value="">跟随全局</option>
        ${THEMES.map((theme) => `<option value="${esc(theme.id)}">${esc(theme.name)}</option>`).join('')}
      </select>
    </label>`).join('');
  }

  function mountSettingsCard() {
    const grid = document.querySelector('#view .settings-grid');
    if (!grid || grid.querySelector('.ga-settings-theme') || !catalogReady) return;
    const hintText = embedded ? '内置主题 · 自动保存' : '独立主题接口 · 自动保存';
    const noteText = embedded ? '选择会保存到本机 · 下次启动沿用' : '选择会保存到本机主题接口';
    const metaText = embedded ? 'MECH-THEME / 内置构建' : 'MECH-THEME / 独立入口';
    const previewClass = (id) => ['mecha', 'light', 'classic'].includes(id) ? `ga-prev-${id}` : 'ga-prev-generic';
    const card = document.createElement('div');
    card.className = 'card ga-settings-theme';
    card.innerHTML = `<div class="card-head"><div class="card-title"><span class="mark"></span><h3>界面主题</h3><span>INTERFACE</span></div><span class="hint">${hintText}</span></div>
      <div class="ga-set-row">${THEMES.map((theme) => `<button class="ga-set-choice${theme.id === globalTheme ? ' is-active' : ''}" type="button" data-theme="${esc(theme.id)}" aria-pressed="${theme.id === globalTheme}">
        <span class="ga-theme-prev ${previewClass(theme.id)}" aria-hidden="true"><i></i><i></i><i></i></span>
        <span class="ga-set-copy"><strong>${esc(theme.name)}</strong><small>${esc(theme.en)}</small><em>${esc(theme.description)}</em></span>
        <span class="ga-set-check" aria-hidden="true">✓</span>
      </button>`).join('')}</div>
      <div class="ga-game-theme-list">
        <div class="ga-game-theme-head"><span data-global-theme>全局默认：${esc(byId(globalTheme)?.name || '')}</span><button class="ghost-btn" type="button" data-action="game-themes-reset">全部跟随全局</button></div>
        <div class="ga-game-theme-grid">${gameSelectRows()}</div>
        <div class="ga-game-theme-current" data-current-game-theme></div>
      </div>
      <div class="ga-set-foot"><span class="ga-theme-note" data-note>${noteText}</span><span class="ga-set-meta">${metaText}</span></div>`;
    card.addEventListener('click', (event) => {
      const choice = event.target.closest('[data-theme]');
      if (choice) {
        chooseTheme(choice.dataset.theme);
        return;
      }
      if (event.target.closest('[data-action="game-themes-reset"]')) clearGameThemes();
    });
    card.addEventListener('change', (event) => {
      const select = event.target.closest('[data-game-theme]');
      if (select) setGameTheme(select.dataset.gameTheme, select.value);
    });
    grid.prepend(card);
    updateUI();
  }

  function watchSettings() {
    const view = document.querySelector('#view');
    if (!view) return;
    new MutationObserver(() => mountSettingsCard()).observe(view, { childList: true });
    mountSettingsCard();
  }

  function watchGame() {
    const body = document.body;
    if (!body) return;
    new MutationObserver(() => {
      const game = currentGameFromDom();
      if (game === currentGame) return;
      currentGame = game;
      applyResolved({ quiet: true });
      updateUI();
    }).observe(body, { attributes: true, attributeFilter: ['data-game'] });
  }

  async function fetchCatalog() {
    const response = await fetch('/__theme/themes.json', { headers: { Accept: 'application/json' }, cache: 'no-store' });
    if (!response.ok) throw new Error(`主题目录 HTTP ${response.status}`);
    const data = await response.json();
    if (!data?.themes?.length) throw new Error('主题目录为空');
    return data;
  }

  async function fetchStandaloneState() {
    const response = await fetch('/__theme/api/state', { headers: { Accept: 'application/json' }, cache: 'no-store' });
    if (!response.ok) return null;
    const data = await response.json();
    return data?.ok ? data : null;
  }

  // ---------------- 机能风入场 / 加载 / 计数 ----------------

  const MOTION_QUERY = window.matchMedia('(prefers-reduced-motion: reduce)');

  function motionEnabled() {
    return root.dataset.theme === 'mecha' && !MOTION_QUERY.matches;
  }

  function primeMotion(force = false) {
    const view = document.querySelector('#view');
    if (!view) return;
    if (!motionEnabled()) {
      view.classList.remove('mecha-in');
      view.querySelectorAll('.rate-ring').forEach((ring) => {
        const target = ring.dataset.mechaTarget || ring.style.getPropertyValue('--p');
        if (target) ring.style.setProperty('--p', target);
        ring.dataset.mechaGaugeToken = '';
      });
      return;
    }

    const bars = view.querySelectorAll('.month-bar, .pool-bar:not(.pity-bar) > i, .pity-bar > i, .timeline-seg');
    bars.forEach((node, index) => node.style.setProperty('--mecha-i', String(Math.min(index, 18))));
    view.querySelectorAll('.stat').forEach((node, index) => node.style.setProperty('--mecha-i', String(index)));

    view.classList.remove('mecha-in');
    void view.offsetWidth;
    view.classList.add('mecha-in');

    primeGauges(view, force);
    countNumbers(view, force);
  }

  let gaugeToken = 0;

  function primeGauges(view, force) {
    view.querySelectorAll('.rate-ring').forEach((ring) => {
      if (!force && ring.dataset.mechaGauge === '1') return;
      const targetText = ring.dataset.mechaTarget || ring.style.getPropertyValue('--p');
      const target = Number.parseFloat(targetText);
      if (!Number.isFinite(target) || target <= 0) return;
      ring.dataset.mechaTarget = targetText.includes('%') ? targetText : `${target}%`;
      ring.dataset.mechaGauge = '1';
      const token = String(++gaugeToken);
      ring.dataset.mechaGaugeToken = token;
      const duration = 1250;
      const started = performance.now() + 120;
      ring.style.setProperty('--p', '0%');
      const step = (now) => {
        if (ring.dataset.mechaGaugeToken !== token || !ring.isConnected) return;
        if (now < started) { requestAnimationFrame(step); return; }
        const progress = Math.min(1, (now - started) / duration);
        const eased = 1 - Math.pow(1 - progress, 3);
        ring.style.setProperty('--p', `${(target * eased).toFixed(2)}%`);
        if (progress < 1) requestAnimationFrame(step);
      };
      requestAnimationFrame(step);
    });
  }

  const COUNT_SELECTOR = [
    '.hero-number',
    '.rate-copy .value',
    '.rate-ring strong',
    '.stat-value',
    '.hero-side > .card:last-child > div:first-child > div:last-child',
    '.month-value',
    '.record-total',
    '.pool-count b',
    '.coverage-badge',
  ].join(',');

  const numberFormats = new Map();

  function formatCount(value, decimals, grouped) {
    const key = `${decimals}|${grouped ? 1 : 0}`;
    let formatter = numberFormats.get(key);
    if (!formatter) {
      formatter = new Intl.NumberFormat('zh-CN', {
        minimumFractionDigits: decimals,
        maximumFractionDigits: decimals,
        useGrouping: grouped,
      });
      numberFormats.set(key, formatter);
    }
    return formatter.format(value);
  }

  function countOutput(text, parts, ratio) {
    let output = '';
    let cursor = 0;
    for (const part of parts) {
      output += text.slice(cursor, part.start);
      output += formatCount(part.value * ratio, part.decimals, part.grouped);
      cursor = part.end;
    }
    return output + text.slice(cursor);
  }

  function animateNumberNode(node, delay = 0) {
    const text = node.nodeValue || '';
    const pattern = /\d[\d,]*(?:\.\d+)?/g;
    const parts = [];
    let match;
    while ((match = pattern.exec(text))) {
      const raw = match[0];
      const value = Number(raw.replace(/,/g, ''));
      if (!Number.isFinite(value)) continue;
      const decimals = raw.includes('.') ? raw.split('.')[1].length : 0;
      parts.push({
        start: match.index,
        end: match.index + raw.length,
        value,
        decimals,
        grouped: raw.includes(',') || value >= 1000,
      });
    }
    if (!parts.length) return;

    // 先落到 0 态，避免用户先看到最终值再“跳回去”计数。
    node.nodeValue = countOutput(text, parts, 0);
    // 尾段多留一点时间，避免最后几位数字“弹”到终值。
    const duration = 1080;
    const started = performance.now() + delay;
    const step = (now) => {
      if (now < started) { requestAnimationFrame(step); return; }
      const progress = Math.min(1, (now - started) / duration);
      if (progress >= 1) {
        node.nodeValue = text;
        return;
      }
      const eased = 1 - Math.pow(1 - progress, 4);
      node.nodeValue = countOutput(text, parts, eased);
      requestAnimationFrame(step);
    };
    requestAnimationFrame(step);
  }

  function countNumbers(view, force = false) {
    const roots = [...view.querySelectorAll(COUNT_SELECTOR)].slice(0, 30);
    roots.forEach((rootNode, index) => {
      if (!force && rootNode.dataset.mechaCounted === '1') return;
      rootNode.dataset.mechaCounted = '1';
      const walker = document.createTreeWalker(rootNode, NodeFilter.SHOW_TEXT, {
        acceptNode(node) {
          if (!/\d/.test(node.nodeValue || '')) return NodeFilter.FILTER_REJECT;
          if (node.parentElement?.closest('small, script, style')) return NodeFilter.FILTER_REJECT;
          return NodeFilter.FILTER_ACCEPT;
        },
      });
      const nodes = [];
      while (walker.nextNode()) nodes.push(walker.currentNode);
      nodes.forEach((node, nodeIndex) => animateNumberNode(node, 80 + index * 22 + nodeIndex * 36));
    });
  }

  function watchMotion() {
    const view = document.querySelector('#view');
    if (!view) {
      setTimeout(watchMotion, 150);
      return;
    }
    let raf = 0;
    new MutationObserver(() => {
      if (raf) cancelAnimationFrame(raf);
      raf = requestAnimationFrame(() => {
        raf = 0;
        primeMotion();
      });
    }).observe(view, { childList: true });
    primeMotion();
  }

  MOTION_QUERY.addEventListener?.('change', () => primeMotion(true));

  async function init() {
    currentGame = currentGameFromDom();
    globalTheme = readCookieTheme() || themeFromRoot() || 'mecha';
    gameThemes = readCookieGames();

    try {
      const catalog = await fetchCatalog();
      THEMES = catalog.themes.map(normalizeManifest).filter(Boolean);
      DEFAULT_THEME = isTheme(catalog.defaultTheme) ? catalog.defaultTheme : (THEMES[0]?.id || 'mecha');
      catalogReady = true;
    } catch (error) {
      THEMES = FALLBACK_THEMES;
      DEFAULT_THEME = 'mecha';
      catalogReady = true;
      console.warn('[theme] 动态主题目录读取失败，使用内置回退：', error.message);
    }

    if (!embedded) {
      const state = await fetchStandaloneState().catch(() => null);
      if (state?.theme) globalTheme = state.theme;
      if (state?.gameThemes && typeof state.gameThemes === 'object') gameThemes = state.gameThemes;
    }

    if (!isTheme(globalTheme)) globalTheme = DEFAULT_THEME;
    gameThemes = Object.fromEntries(Object.entries(gameThemes || {}).filter(([game, theme]) => GAME_LABELS[game] && isTheme(theme)));
    if (!currentGame) currentGame = currentGameFromDom();

    applyResolved({ quiet: true, replay: false });
    watchSettings();
    watchGame();
    watchMotion();
  }

  if (document.readyState === 'loading') document.addEventListener('DOMContentLoaded', init, { once: true });
  else init();
})();
