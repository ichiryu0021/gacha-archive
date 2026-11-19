/* 二游档案 · 「机能」主题独立入口脚本
 * 只负责主题注入与切换，不触碰原项目源码 / 原应用状态。
 */
(() => {
  'use strict';

  const THEMES = [
    { id: 'mecha', name: '机能 · 黑', en: 'MECHANICAL / DARK', desc: '石墨 · 柠檬黄 · 直角' },
    { id: 'light', name: '机能 · 白', en: 'MECHANICAL / PAPER', desc: '纸白 · 灰字阴影 · 暗黄' },
    { id: 'classic', name: '经典', en: 'CLASSIC', desc: '深色玻璃 · 圆角 · 柔和双色' },
  ];
  const root = document.documentElement;
  const embedded = root.dataset.mechaEmbedded === '1';
  const isTheme = (value) => value === 'mecha' || value === 'light' || value === 'classic';
  const byId = (id) => THEMES.find((item) => item.id === id) || THEMES[0];
  const COOKIE_NAME = 'ga_theme';

  function themeFromRoot() {
    if (root.dataset.theme === 'classic') return 'classic';
    if (root.dataset.theme === 'mecha') return root.dataset.mechaVariant === 'light' ? 'light' : 'mecha';
    return '';
  }

  function readCookieTheme() {
    const match = document.cookie.match(/(?:^|;\s*)ga_theme=(classic|mecha|light)(?:;|$)/);
    return match ? match[1] : '';
  }

  function writeCookieTheme(theme) {
    document.cookie = `${COOKIE_NAME}=${theme}; Max-Age=31536000; Path=/; SameSite=Lax`;
  }

  function applyRoot(theme) {
    if (theme === 'classic') {
      root.dataset.theme = 'classic';
      delete root.dataset.mechaVariant;
    } else {
      root.dataset.theme = 'mecha';
      root.dataset.mechaVariant = theme === 'light' ? 'light' : 'dark';
    }
    if (document.body) {
      document.body.dataset.theme = theme;
      if (theme === 'classic') delete document.body.dataset.mechaVariant;
      else document.body.dataset.mechaVariant = theme === 'light' ? 'light' : 'dark';
    }
  }

  let current = themeFromRoot() || (readCookieTheme() || 'mecha');

  function syncThemeMeta() {
    let meta = document.querySelector('meta[name="theme-color"]');
    if (!meta) {
      meta = document.createElement('meta');
      meta.name = 'theme-color';
      document.head.appendChild(meta);
    }
    meta.setAttribute('content', current === 'light' ? '#e9e6da' : current === 'classic' ? '#0b0e14' : '#0b0d0c');
  }

  function applyTheme(theme, { persist = false, quiet = false, previous = '' } = {}) {
    current = isTheme(theme) ? theme : 'mecha';
    applyRoot(current);
    updateUI();
    syncThemeMeta();
    window.dispatchEvent(new CustomEvent('mecha-theme-change', { detail: { theme: current } }));
    if (!quiet) {
      const label = byId(current).name;
      note(`${label}主题已启用`);
    }
    if (persist) {
      if (embedded) saveCookieTheme(current);
      else saveTheme(current, previous || 'mecha');
      requestAnimationFrame(() => primeMotion(true));
    }
    return current;
  }

  function saveCookieTheme(theme) {
    try {
      writeCookieTheme(theme);
      if (readCookieTheme() !== theme) throw new Error('Cookie 被浏览器拒绝');
      note('已保存 · 下次启动沿用');
    } catch (error) {
      note(`主题保存失败：${error.message}`, true);
    }
    setSaving(false);
  }

  let saveToken = 0;
  async function saveTheme(theme, previous = 'mecha') {
    const token = ++saveToken;
    try {
      const response = await fetch('/__theme/api/theme', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ theme }),
      });
      const data = await response.json().catch(() => ({}));
      if (!response.ok || data.ok === false) throw new Error(data.message || `保存失败（HTTP ${response.status}）`);
      if (token === saveToken) note('已保存 · 下次启动沿用');
      setSaving(false);
    } catch (error) {
      if (token !== saveToken) return;
      setSaving(false);
      note(`主题保存失败：${error.message}`, true);
      current = isTheme(previous) ? previous : 'mecha';
      applyRoot(current);
      updateUI();
    }
  }

  function setSaving(active) {
    document.querySelectorAll('.ga-settings-theme').forEach((node) => {
      if (active) node.setAttribute('data-saving', '1'); else node.removeAttribute('data-saving');
    });
  }

  function chooseTheme(theme) {
    if (!isTheme(theme) || theme === current) return;
    const previous = current;
    setSaving(true);
    note('正在保存…');
    applyTheme(theme, { persist: true, previous });
  }

  function note(message, isError = false) {
    const nodes = document.querySelectorAll('.ga-theme-note');
    if (!nodes.length) return;
    nodes.forEach((node) => {
      node.textContent = message;
      node.classList.toggle('is-error', isError);
    });
  }

  function updateUI() {
    document.querySelectorAll('.ga-settings-theme [data-theme]').forEach((button) => {
      const active = button.dataset.theme === current;
      button.classList.toggle('is-active', active);
      button.setAttribute('aria-pressed', String(active));
    });
  }

  function mountSettingsCard() {
    const grid = document.querySelector('#view .settings-grid');
    if (!grid || grid.querySelector('.ga-settings-theme')) return;
    const hintText = embedded ? '内置主题 · 自动保存' : '独立主题接口 · 自动保存';
    const noteText = embedded ? '选择会保存到本机 · 下次启动沿用' : '选择会保存到本机主题接口';
    const metaText = embedded ? 'MECH-THEME / 内置构建' : 'MECH-THEME / 独立入口';
    const card = document.createElement('div');
    card.className = 'card ga-settings-theme';
    card.innerHTML = `<div class="card-head"><div class="card-title"><span class="mark"></span><h3>界面主题</h3><span>INTERFACE</span></div><span class="hint">${hintText}</span></div>
      <div class="ga-set-row">${THEMES.map((theme) => `<button class="ga-set-choice${theme.id === current ? ' is-active' : ''}" type="button" data-theme="${theme.id}" aria-pressed="${theme.id === current}">
        <span class="ga-theme-prev ga-prev-${theme.id}" aria-hidden="true"><i></i><i></i><i></i></span>
        <span class="ga-set-copy"><strong>${theme.name}</strong><small>${theme.en}</small><em>${theme.desc}</em></span>
        <span class="ga-set-check" aria-hidden="true">✓</span>
      </button>`).join('')}</div>
      <div class="ga-set-foot"><span class="ga-theme-note" data-note>${noteText}</span><span class="ga-set-meta">${metaText}</span></div>`;
    card.addEventListener('click', (event) => {
      const choice = event.target.closest('[data-theme]');
      if (choice) chooseTheme(choice.dataset.theme);
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

  function init() {
    const rootTheme = themeFromRoot();
    current = rootTheme || (embedded ? (readCookieTheme() || 'mecha') : 'mecha');
    applyTheme(current, { quiet: true });
    watchSettings();
    watchMotion();
    if (embedded) return;
    fetch('/__theme/api/state', { headers: { Accept: 'application/json' } })
      .then((response) => response.json())
      .then((data) => {
        if (data?.ok && isTheme(data.theme) && data.theme !== current) {
          applyTheme(data.theme, { quiet: true });
          primeMotion(true);
        }
      })
      .catch(() => {});
  }

  if (document.readyState === 'loading') document.addEventListener('DOMContentLoaded', init, { once: true });
  else init();
})();
