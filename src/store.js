import fs from 'node:fs';
import fsp from 'node:fs/promises';
import path from 'node:path';
import { DB_FILE, DATA_DIR, GAME_IDS } from './config.js';
import { readJson, writeJsonAtomic, normalizeName, hash, parseTimestamp } from './utils.js';

function defaultState() {
  return {
    version: 1,
    createdAt: new Date().toISOString(),
    updatedAt: new Date().toISOString(),
    accounts: Object.fromEntries(GAME_IDS.map((g) => [g, null])),
    settings: {
      includeSyntheticInExport: true,
      showEstimated: true,
      collectorEnabled: true,
      collectorInterval: 30000,
      gameOrder: ['genshin', 'hsr', 'zzz', 'hi3', 'tot'],
      hiddenGames: [],
    },
    collector: { lastRun: null, lastEvent: null, events: [] },
  };
}

export class Store {
  constructor() {
    this.file = DB_FILE;
    this.state = defaultState();
    this._saveTimer = null;
    this._saving = null;
    this._dirty = false;
  }

  async init() {
    fs.mkdirSync(DATA_DIR, { recursive: true });
    let existing = readJson(this.file, null);
    if (!existing && fs.existsSync(`${this.file}.bak`)) existing = readJson(`${this.file}.bak`, null);
    if (existing && typeof existing === 'object') {
      this.state = {
        ...defaultState(),
        ...existing,
        accounts: { ...defaultState().accounts, ...(existing.accounts || {}) },
        settings: {
          ...defaultState().settings,
          ...(existing.settings || {}),
          gameOrder: [...new Set([...(existing.settings?.gameOrder || []), ...GAME_IDS])],
        },
        collector: { ...defaultState().collector, ...(existing.collector || {}) },
      };
    }
    if (!fs.existsSync(this.file)) await this.flush(true);
    return this;
  }

  account(game) {
    return this.state.accounts[game] || null;
  }

  ensureAccount(game, meta = {}) {
    let acc = this.state.accounts[game];
    if (!acc) {
      acc = {
        uid: String(meta.uid || ''),
        nickname: meta.nickname || '',
        region: meta.region || '',
        gameBiz: meta.gameBiz || '',
        lang: meta.lang || 'zh-cn',
        timezone: Number(meta.timezone ?? 8),
        records: [],
        totals: { exact: 0, perType: {}, currentPity: {}, fetchedAt: null },
        snapshots: [],
        createdAt: new Date().toISOString(),
        lastSync: null,
        lastSource: null,
      };
      this.state.accounts[game] = acc;
    } else {
      for (const key of ['uid', 'nickname', 'region', 'gameBiz', 'lang', 'timezone']) {
        if (meta[key] !== undefined && meta[key] !== null && meta[key] !== '') acc[key] = meta[key];
      }
    }
    return acc;
  }

  touch() {
    this.state.updatedAt = new Date().toISOString();
    this._dirty = true;
    if (this._saveTimer) return;
    this._saveTimer = setTimeout(() => {
      this._saveTimer = null;
      this.flush().catch((e) => console.error('[store] save failed', e.message));
    }, 250);
  }

  async flush(force = false) {
    if (!force && !this._dirty) return;
    if (this._saving) return this._saving;
    this._saving = (async () => {
      if (fs.existsSync(this.file)) {
        try {
          await fsp.copyFile(this.file, `${this.file}.bak`);
          if (force) {
            const backupDir = path.join(DATA_DIR, 'backups');
            await fsp.mkdir(backupDir, { recursive: true });
            const stamp = new Date().toISOString().replace(/[:.]/g, '-');
            await fsp.copyFile(this.file, path.join(backupDir, `app-${stamp}.json`));
            const old = (await fsp.readdir(backupDir)).filter((n) => n.startsWith('app-')).sort();
            for (const name of old.slice(0, Math.max(0, old.length - 10))) await fsp.unlink(path.join(backupDir, name)).catch(() => {});
          }
        } catch { /* keep writing even if backup fails */ }
      }
      await writeJsonAtomic(this.file, this.state);
      this._dirty = false;
    })().finally(() => { this._saving = null; });
    return this._saving;
  }

  async close() {
    if (this._saveTimer) clearTimeout(this._saveTimer);
    this._saveTimer = null;
    await this.flush(true);
  }

  mergeRecords(game, incoming, options = {}) {
    const acc = this.ensureAccount(game, options.meta || {});
    incoming = incoming.filter((r) => Number(r.rank) === 5);
    const byId = new Map(acc.records.filter((r) => r.id).map((r) => [String(r.id), r]));
    const identities = new Map();
    for (const existing of acc.records) {
      const key = `${existing.uigfType || existing.gachaType}|${normalizeName(existing.name)}`;
      if (!identities.has(key)) identities.set(key, []);
      identities.get(key).push({ r: existing, used: false });
    }
    let added = 0;
    let skipped = 0;
    let upgraded = 0;
    const stamp = (r) => parseTimestamp(r.time, Number(acc.timezone ?? 8));
    for (const raw of incoming) {
      const r = { ...raw };
      r.name = String(r.name || '').trim();
      r.time = String(r.time || '').trim();
      r.id = r.id ? String(r.id) : '';
      r.uid = String(r.uid || acc.uid || '');
      r.gachaType = String(r.gachaType || r.gacha_type || '0');
      r.uigfType = String(r.uigfType || r.uigf_gacha_type || r.gachaType);
      r.rank = Number(r.rank || r.rank_type || 0) || 0;
      r.source = r.source || options.source || 'official';
      r.synthetic = Boolean(r.synthetic || !r.id);
      if (!r.name && !r.time) { skipped++; continue; }
      if (r.id && byId.has(r.id)) {
        const existing = byId.get(r.id);
        for (const key of ['pity', 'up', 'name', 'rank', 'itemId', 'itemType', 'poolName', 'time', 'source']) {
          if (r[key] !== undefined && r[key] !== null) existing[key] = r[key];
        }
        existing.synthetic = false;
        skipped++;
        continue;
      }
      const identity = `${r.uigfType || r.gachaType}|${normalizeName(r.name)}`;
      const candidates = identities.get(identity) || [];
      let match = null;
      if (r.name && r.time) {
        const t = stamp(r);
        match = candidates.find((x) => !x.used && (x.r.synthetic || r.synthetic) && Math.abs(stamp(x.r) - t) <= 180000) || null;
      }
      // Screenshot rows often have no timestamp. Match by name + pool + pity
      // when at least one side lacks time; official rows upgrade synthetic ones.
      if (!match && r.name && (!r.time || candidates.some((x) => !x.r.time))) {
        const pity = Number(r.pity) || 0;
        match = candidates.find((x) => !x.used
          && (x.r.synthetic || r.synthetic)
          && (!x.r.time || !r.time)
          && (!pity || !Number(x.r.pity) || Number(x.r.pity) === pity)) || null;
      }
      if (match) {
        const existing = match.r;
        match.used = true;
        for (const key of ['pity', 'up', 'version', 'name', 'rank', 'itemId', 'itemType', 'poolName', 'time', 'source']) {
          if (r[key] !== undefined && r[key] !== null && r[key] !== '') existing[key] = r[key];
        }
        if (!r.id) {
          skipped++;
          continue;
        }
        if (r.id && existing.synthetic) {
          const oldId = existing.id;
          Object.assign(existing, r, {
            id: r.id,
            synthetic: false,
            source: 'official',
            pity: r.pity ?? existing.pity,
          });
          if (oldId && oldId !== r.id) byId.delete(oldId);
          byId.set(r.id, existing);
          upgraded++;
        } else {
          skipped++;
        }
        continue;
      }
      if (!r.id) {
        r.id = `s_${hash(`${r.time}|${r.name}|${r.gachaType}|${added}|${Math.random()}`, 18)}`;
      }
      acc.records.push(r);
      byId.set(r.id, r);
      if (!identities.has(identity)) identities.set(identity, []);
      identities.get(identity).push({ r, used: false });
      added++;
    }
    acc.records.sort((a, b) => (a.time || '').localeCompare(b.time || '') || String(a.id).localeCompare(String(b.id)));
    if (incoming[0]?.uid && !acc.uid) acc.uid = String(incoming[0].uid);
    if (options.meta) {
      for (const key of ['uid', 'nickname', 'region', 'gameBiz', 'lang', 'timezone']) {
        if (options.meta[key] !== undefined && options.meta[key] !== null && options.meta[key] !== '') acc[key] = options.meta[key];
      }
    }
    if (options.lastSource) acc.lastSource = options.lastSource;
    acc.lastSync = new Date().toISOString();
    this.touch();
    return { added, skipped, upgraded, total: acc.records.length };
  }

  setFullTotals(game, totals) {
    const acc = this.ensureAccount(game);
    acc.totals = { ...totals, full: true, daily: {}, updatedAt: new Date().toISOString() };
    this.touch();
    return acc.totals;
  }

  setTotals(game, totals) {
    const acc = this.ensureAccount(game);
    const prev = acc.totals || {};
    if (prev.full && !totals.replaceFull) {
      acc.totals = { ...prev, currentPity: totals.currentPity || prev.currentPity, updatedAt: new Date().toISOString() };
      this.touch();
      return acc.totals;
    }
    const mergedDaily = { ...(prev.daily || {}) };
    for (const [key, count] of Object.entries(totals.daily || {})) {
      mergedDaily[key] = Math.max(Number(mergedDaily[key]) || 0, Number(count) || 0);
    }
    const perType = {};
    let exact = 0;
    for (const [key, count] of Object.entries(mergedDaily)) {
      const type = key.split('|')[1] || key;
      perType[type] = perType[type] || { total: 0, five: 0 };
      perType[type].total += Number(count) || 0;
      exact += Number(count) || 0;
    }
    const dates = Object.keys(mergedDaily).map((k) => k.split('|')[0]).filter(Boolean).sort();
    acc.totals = {
      ...prev,
      ...totals,
      exact: Object.keys(mergedDaily).length ? exact : Math.max(Number(prev.exact) || 0, Number(totals.exact) || 0),
      perType: Object.keys(mergedDaily).length ? perType : (totals.perType || prev.perType || {}),
      daily: mergedDaily,
      start: dates[0] ? `${dates[0]} 00:00:00` : (totals.start || prev.start || null),
      end: dates.at(-1) ? `${dates.at(-1)} 23:59:59` : (totals.end || prev.end || null),
      currentPity: totals.currentPity || prev.currentPity || {},
      updatedAt: new Date().toISOString(),
    };
    this.touch();
    return acc.totals;
  }

  setGameOrder(order) {
    const valid = Array.isArray(order) ? order.filter((g) => GAME_IDS.includes(g)) : [];
    const final = [...new Set([...valid, ...GAME_IDS])];
    this.state.settings.gameOrder = final;
    this.touch();
    return final;
  }

  setHiddenGames(games) {
    const hidden = Array.isArray(games) ? games.filter((g) => GAME_IDS.includes(g)) : [];
    this.state.settings.hiddenGames = [...new Set(hidden)];
    this.touch();
    return this.state.settings.hiddenGames;
  }

  addCollectorEvent(event) {
    const item = { time: new Date().toISOString(), ...event };
    this.state.collector = this.state.collector || { events: [] };
    this.state.collector.lastEvent = item;
    this.state.collector.events = [item, ...(this.state.collector.events || [])].slice(0, 30);
    this.touch();
    return item;
  }

  setCollectorSettings(patch) {
    this.state.settings = { ...(this.state.settings || {}), ...patch };
    this.touch();
    return this.state.settings;
  }

  addSnapshot(game, snapshot) {
    const acc = this.ensureAccount(game);
    const snap = {
      id: snapshot.id || `snap_${Date.now()}_${Math.random().toString(36).slice(2, 7)}`,
      createdAt: new Date().toISOString(),
      source: snapshot.source || 'manual',
      title: snapshot.title || '历史汇总',
      periodStart: snapshot.periodStart || null,
      periodEnd: snapshot.periodEnd || null,
      totalPulls: Math.max(0, Number(snapshot.totalPulls) || 0),
      fiveStars: Math.max(0, Number(snapshot.fiveStars) || 0),
      fourStars: Math.max(0, Number(snapshot.fourStars) || 0),
      perType: snapshot.perType || {},
      fiveStarItems: Array.isArray(snapshot.fiveStarItems) ? snapshot.fiveStarItems : [],
      note: String(snapshot.note || ''),
      fullHistory: Boolean(snapshot.fullHistory),
      rawPools: snapshot.rawPools || null,
    };
    // Replace an existing official snapshot, keep manual history snapshots additive.
    if (snap.source === 'zzz-official') {
      acc.snapshots = acc.snapshots.filter((s) => s.source !== 'zzz-official');
    }
    acc.snapshots.push(snap);
    acc.snapshots.sort((a, b) => String(a.periodStart || '').localeCompare(String(b.periodStart || '')));
    this.touch();
    return snap;
  }

  deleteSnapshot(game, id) {
    const acc = this.ensureAccount(game);
    const before = acc.snapshots.length;
    acc.snapshots = acc.snapshots.filter((s) => s.id !== id);
    this.touch();
    return before !== acc.snapshots.length;
  }

  resetGame(game) {
    this.state.accounts[game] = null;
    this.touch();
  }

  summary() {
    return {
      version: this.state.version,
      updatedAt: this.state.updatedAt,
      accounts: Object.fromEntries(GAME_IDS.map((g) => {
        const a = this.state.accounts[g];
        return [g, a ? {
          uid: a.uid, nickname: a.nickname, region: a.region,
          recordCount: a.records.length, totalPulls: a.totals?.exact || 0, snapshotCount: a.snapshots.length,
          lastSync: a.lastSync,
        } : null];
      })),
    };
  }

  exportAll() {
    return this.state;
  }
}
