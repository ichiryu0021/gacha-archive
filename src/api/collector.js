import { GAMES } from '../config.js';
import { getRememberedSource } from './gacha.js';
import { scanLocalLinks } from './cache.js';
import { runningGames } from './processes.js';

const DAY_MS = 24 * 60 * 60 * 1000;

export class Collector {
  constructor({ store, syncFn, zzzSyncFn, intervalMs, dailyMs = DAY_MS }) {
    this.store = store;
    this.syncFn = syncFn;
    this.zzzSyncFn = zzzSyncFn;
    this.intervalMs = Math.max(15000, Number(intervalMs || store.state.settings?.collectorInterval || 30000));
    this.dailyMs = dailyMs;
    this.timer = null;
    this.busy = false;
    this.startedAt = null;
    this.lastRun = null;
    this.lastScan = null;
    this.lastError = null;
    this.attempts = new Map();
    this.collected = new Set();
    this.running = false;
    this.runningNow = [];
    this.lastCollect = { ...(store.state.collector?.lastCollect || {}) };
  }

  get enabled() {
    return this.store.state.settings?.collectorEnabled !== false;
  }

  status() {
    return {
      enabled: this.enabled,
      running: this.running,
      intervalMs: this.intervalMs,
      startedAt: this.startedAt,
      lastRun: this.lastRun,
      lastError: this.lastError,
      runningGames: this.runningNow,
      lastCollect: this.lastCollect,
      events: this.store.state.collector?.events || [],
      lastEvent: this.store.state.collector?.lastEvent || null,
    };
  }

  async start() {
    if (!this.enabled) return this.status();
    if (this.timer) return this.status();
    this.running = true;
    this.startedAt = new Date().toISOString();
    this.timer = setInterval(() => this.tick().catch((e) => { this.lastError = e.message; }), this.intervalMs);
    if (this.timer.unref) this.timer.unref();
    setTimeout(() => this.tick().catch((e) => { this.lastError = e.message; }), 4000).unref?.();
    return this.status();
  }

  stop() {
    if (this.timer) clearInterval(this.timer);
    this.timer = null;
    this.running = false;
    return this.status();
  }

  async setEnabled(enabled) {
    this.store.setCollectorSettings({ collectorEnabled: Boolean(enabled) });
    if (enabled) {
      this.collected.clear();
      await this.start();
    } else {
      this.stop();
    }
    await this.store.flush(true);
    return this.status();
  }

  canCollect(game, now = Date.now()) {
    if (this.collected.has(game)) return false;
    const last = Date.parse(this.lastCollect[game] || '');
    return !Number.isFinite(last) || now - last >= this.dailyMs;
  }

  markCollected(game) {
    const at = new Date().toISOString();
    this.lastCollect[game] = at;
    this.collected.add(game);
    this.store.state.collector = this.store.state.collector || { events: [] };
    this.store.state.collector.lastCollect = { ...this.lastCollect };
    this.store.touch();
  }

  async tick() {
    if (!this.enabled || this.busy) return;
    this.busy = true;
    this.lastRun = new Date().toISOString();
    this.store.state.collector = this.store.state.collector || { events: [] };
    this.store.state.collector.lastRun = this.lastRun;
    try {
      const active = await runningGames().catch(() => new Set());
      this.runningNow = [...active];
      if (!active.size) {
        this.lastError = null;
        return;
      }

      // ZZZ: Miyoushe full history first, once per day.
      if (active.has('zzz') && this.zzzSyncFn && this.canCollect('zzz')) {
        try {
          const result = await this.zzzSyncFn();
          this.markCollected('zzz');
          this.store.addCollectorEvent({
            ok: true,
            game: 'zzz',
            gameName: GAMES.zzz?.name || 'zzz',
            message: `米游社同步 ${result.totalFetched || 0} 抽`,
            total: result.totalFetched || 0,
            added: result.addedFive || 0,
            upgraded: result.upgradedFive || 0,
            source: 'miyoushe',
          });
        } catch {
          // Fall through to the local cache / official link method.
        }
      }

      const scan = await scanLocalLinks();
      this.lastScan = { at: this.lastRun, found: Object.keys(scan.found || {}) };
      for (const [game, found] of Object.entries(scan.found || {})) {
        if (!active.has(game)) continue;
        if (!this.canCollect(game)) continue;
        const source = getRememberedSource(found.linkId);
        if (!source) continue;
        const key = source.fingerprint || `${game}:${found.linkId}`;
        const previous = this.attempts.get(key);
        const now = Date.now();
        if (previous?.status === 'success' && now - previous.at < this.dailyMs) continue;
        if (previous?.status === 'auth' || previous?.status === 'failed') continue;
        this.attempts.set(key, { status: 'running', at: now });
        try {
          const result = await this.syncFn(source);
          const failed = (!result.totalFetched && result.errors?.length) || result.errors?.some((e) => e.code === 'AUTH_EXPIRED');
          if (failed) {
            this.attempts.set(key, { status: 'auth', at: now });
            this.store.addCollectorEvent({
              ok: false,
              game,
              gameName: GAMES[game]?.name || game,
              message: result.errors?.[0]?.message || '链接已失效，等待游戏写入新链接',
              total: result.totalFetched || 0,
              added: 0,
              upgraded: 0,
            });
          } else {
            this.attempts.set(key, { status: 'success', at: now });
            this.markCollected(game);
            this.store.addCollectorEvent({
              ok: true,
              game,
              gameName: GAMES[game]?.name || game,
              message: `自动同步 ${result.totalFetched} 抽`,
              total: result.totalFetched || 0,
              added: result.addedFive || 0,
              upgraded: result.upgradedFive || 0,
              errors: result.errors?.length || 0,
            });
          }
        } catch (e) {
          this.attempts.set(key, { status: 'failed', at: now });
          this.store.addCollectorEvent({
            ok: false,
            game,
            gameName: GAMES[game]?.name || game,
            message: e.message,
            total: 0,
            added: 0,
            upgraded: 0,
          });
        }
      }
      this.lastError = null;
      await this.store.flush();
    } catch (e) {
      this.lastError = e.message;
    } finally {
      this.busy = false;
    }
  }
}
