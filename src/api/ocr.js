import { execFile } from 'node:child_process';
import crypto from 'node:crypto';
import fs from 'node:fs';
import fsp from 'node:fs/promises';
import path from 'node:path';
import { promisify } from 'node:util';
import { GAMES, UPLOAD_DIR, ROOT, getGame } from '../config.js';
import { median, normalizeName, similarity, sleep } from '../utils.js';
import { loadCatalog, matchItem } from './catalog.js';

const execFileAsync = promisify(execFile);
const OCR_SCRIPT = path.join(ROOT, 'scripts', 'win-ocr.ps1');

function fixDigitLike(text) {
  return String(text)
    .replace(/[０-９]/g, (c) => String.fromCharCode(c.charCodeAt(0) - 0xfee0))
    .replace(/(\d)[Ss](?=\D|$)/g, '$15')
    .replace(/(?<=\d)[Ss](?=\d)/g, '5')
    .replace(/(?<=\d)[Oo](?=\d)/g, '0')
    .replace(/(?<=\d)[Il](?=\d)/g, '1')
    .replace(/[：]/g, ':')
    .replace(/[－—–]/g, '-');
}

function parseTimeFromRow(text, game) {
  const fixed = fixDigitLike(text);
  const digits = fixed.replace(/\D/g, '');
  const candidates = [];
  for (let i = 0; i + 14 <= digits.length; i++) {
    const chunk = digits.slice(i, i + 14);
    if (!chunk.startsWith('20')) continue;
    const y = Number(chunk.slice(0, 4)); const mo = Number(chunk.slice(4, 6)); const d = Number(chunk.slice(6, 8));
    const h = Number(chunk.slice(8, 10)); const mi = Number(chunk.slice(10, 12)); const sec = Number(chunk.slice(12, 14));
    if (y < 2020 || y > 2030 || mo < 1 || mo > 12 || d < 1 || d > 31 || h > 23 || mi > 59 || sec > 59) continue;
    candidates.push(`${y}-${String(mo).padStart(2, '0')}-${String(d).padStart(2, '0')} ${String(h).padStart(2, '0')}:${String(mi).padStart(2, '0')}:${String(sec).padStart(2, '0')}`);
  }
  if (candidates.length) return candidates[candidates.length - 1];
  const m = fixed.match(/(20\d{2})[-/.年](\d{1,2})[-/.月](\d{1,2})[日]?\s*(\d{1,2})?:?(\d{1,2})?:?(\d{1,2})?/);
  if (m) {
    const [, y, mo, d, h = '0', mi = '0', sec = '0'] = m;
    return `${y}-${String(mo).padStart(2, '0')}-${String(d).padStart(2, '0')} ${String(h).padStart(2, '0')}:${String(mi).padStart(2, '0')}:${String(sec).padStart(2, '0')}`;
  }
  return null;
}

function blocksFromLines(ocr) {
  const lines = [];
  for (const line of ocr.lines || []) {
    const words = (line.words || []).filter((w) => w.text && w.text.trim());
    if (!words.length) continue;
    lines.push({
      text: line.text || words.map((w) => w.text).join(''),
      words,
      y: Math.min(...words.map((w) => w.y)),
      bottom: Math.max(...words.map((w) => w.y + w.h)),
      x: Math.min(...words.map((w) => w.x)),
    });
  }
  lines.sort((a, b) => a.y - b.y || a.x - b.x);
  const allHeights = lines.flatMap((l) => l.words.map((w) => w.h));
  const h = median(allHeights) || 20;
  const gapLimit = Math.max(26, h * 2.0);
  const blocks = [];
  for (const line of lines) {
    const last = blocks[blocks.length - 1];
    const gap = last ? line.y - last.bottom : 999;
    if (last && gap <= gapLimit) {
      last.lines.push(line);
      last.bottom = Math.max(last.bottom, line.bottom);
      last.text += line.text;
    } else {
      blocks.push({ lines: [line], y: line.y, bottom: line.bottom, text: line.text });
    }
  }
  for (const b of blocks) {
    b.lines.sort((a, c) => a.y - c.y || a.x - c.x);
    b.words = b.lines.flatMap((line, lineIndex) => line.words.map((w) => ({ ...w, lineIndex })));
    b.words.sort((a, c) => a.lineIndex - c.lineIndex || a.x - c.x);
    b.text = b.words.map((w) => w.text).join('');
    b.height = b.bottom - b.y;
  }
  return blocks;
}

function rowsFromWords(ocr) {
  return blocksFromLines(ocr);
}

function cleanNameFragment(text) {
  return String(text)
    .replace(/第\s*\d+\s*抽/g, '')
    .replace(/\d{1,2}\s*抽/g, '')
    .replace(/(六星|五星|四星|三星|6星|5星|4星|3星|S级|A级|B级|全新|NEW|UP|限定|常驻)/gi, '')
    .replace(/[|｜·•\-—–_=]+/g, ' ')
    .trim();
}

function matchNameFromRow(row, game, dateWord) {
  const catalog = loadCatalog(game);
  let words = [];
  if (dateWord) {
    const dateY = dateWord.cy ?? dateWord.y;
    words = row.words.filter((w) => (w.y + w.h / 2) < dateY - 2);
    if (!words.length) words = row.words.filter((w) => w.x < dateWord.x - 4);
  }
  if (!words.length) words = row.words;
  const fragments = [];
  const visible = words.map((w) => w.text).filter((t) => !/^\d{1,4}$/.test(t));
  if (visible.length) {
    fragments.push(visible.join(''));
    for (const w of visible) fragments.push(w);
    for (let i = 0; i < visible.length - 1; i++) fragments.push(visible[i] + visible[i + 1]);
    for (let i = 0; i < visible.length - 2; i++) fragments.push(visible[i] + visible[i + 1] + visible[i + 2]);
  }
  let best = { item: null, confidence: 0, raw: '' };
  for (const frag of fragments) {
    const cleaned = cleanNameFragment(frag);
    if (cleaned.length < 2) continue;
    const result = matchItem(game, cleaned);
    if (result.item && result.confidence >= 0.62 && result.confidence > best.confidence) best = { ...result, raw: cleaned };
  }
  if (!best.item) {
    const longest = fragments.map(cleanNameFragment).filter((s) => /[\u3400-\u9fff]{2,}/.test(s)).sort((a, b) => b.length - a.length)[0] || '';
    return { item: null, confidence: 0, raw: longest };
  }
  return best;
}

function detectRank(row, item) {
  if (item?.rarity) return item.rarity;
  if (/六星|6星|五星|5星|S级/.test(row.text)) return 5;
  if (/四星|4星|A级/.test(row.text)) return 4;
  if (/三星|3星|B级/.test(row.text)) return 3;
  return 0;
}

function summaryFromText(text, game) {
  const flat = fixDigitLike(text).replace(/\s+/g, ' ');
  const compact = flat.replace(/\s+/g, '').replace(/：/g, ':');
  const grab = (re) => { const m = flat.match(re); return m ? Number(m[1]) : null; };
  const cgrab = (re) => { const m = compact.match(re); return m ? Number(m[1]) : null; };
  const totalPulls = cgrab(/(\d{2,7})总抽数/i)
    ?? cgrab(/(?:总抽数|总抽|调频次数|抽卡次数|总计|共计|累计)(\d{1,6})/i)
    ?? grab(/(?:总抽数|总抽|调频次数|抽卡次数|总计|共计|累计)[^\d]{0,16}(\d{1,6})/i)
    ?? null;
  const fiveStars = cgrab(/(\d{1,5})个金/i)
    ?? cgrab(/(?:六星|6星|五星|5星|S级)(\d{1,5})个?/i)
    ?? grab(/(\d{1,5})\s*个金/i)
    ?? null;
  const fourStars = cgrab(/(\d{1,5})个四星/i) ?? grab(/(?:四星|4星|A级|A 级)[^\d]{0,14}(\d{1,5})/i);
  const limited = cgrab(/(\d{1,5})个限定五星/i);
  const standard = cgrab(/(\d{1,5})个常驻五星/i);
  const uidMatch = compact.match(/UID:?(\d{6,12})/i) || flat.match(/UID\s*[:：]?\s*(\d{6,12})/i);
  const currentPity = cgrab(/已垫(\d{1,3})抽/i) ?? grab(/已垫\s*(\d{1,3})\s*抽/i);
  return {
    totalPulls, fiveStars, fourStars,
    limitedFive: limited, standardFive: standard,
    uid: uidMatch ? uidMatch[1] : null,
    currentPity,
    raw: flat.slice(0, 1200),
  };
}

export async function runOcr(imagePath) {
  if (!fs.existsSync(OCR_SCRIPT)) throw new Error('OCR 脚本缺失');
  const { stdout, stderr } = await execFileAsync('powershell.exe', [
    '-NoProfile', '-ExecutionPolicy', 'Bypass', '-File', OCR_SCRIPT, '-ImagePath', imagePath,
  ], { timeout: 45000, maxBuffer: 12 * 1024 * 1024, windowsHide: true });
  if (stderr && !stdout.trim()) throw new Error(stderr.trim().slice(0, 500));
  const parsed = JSON.parse(stdout);
  return parsed;
}

export async function parseScreenshot({ game, dataUrl }) {
  if (!GAMES[game]) throw new Error('未知的游戏');
  const m = String(dataUrl || '').match(/^data:(image\/(?:png|jpeg|jpg|webp));base64,(.+)$/);
  if (!m) throw new Error('只支持 PNG / JPG / WebP 截图');
  const buf = Buffer.from(m[2], 'base64');
  if (buf.length > 14 * 1024 * 1024) throw new Error('图片超过 14MB，请压缩或裁剪后重试');
  if (buf.length < 500) throw new Error('图片内容为空');
  await fsp.mkdir(UPLOAD_DIR, { recursive: true });
  const ext = m[1].includes('png') ? 'png' : m[1].includes('webp') ? 'webp' : 'jpg';
  const name = `${Date.now()}-${crypto.randomBytes(4).toString('hex')}.${ext}`;
  const file = path.join(UPLOAD_DIR, name);
  await fsp.writeFile(file, buf);
  let ocr;
  try { ocr = await runOcr(file); } catch (e) {
    throw new Error(`Windows OCR 失败：${e.message}`);
  }
  const rows = rowsFromWords(ocr);
  const candidates = [];
  const seen = new Set();
  for (const row of rows) {
    if (row.height < 8) continue;
    const dateMatch = row.words.find((w) => /20[0-9SO]{1,3}/g.test(w.text));
    const time = parseTimeFromRow(row.text, game);
    if (!time) continue;
    const dateWord = dateMatch ? { ...dateMatch, cy: dateMatch.y + dateMatch.h / 2 } : null;
    const match = matchNameFromRow(row, game, dateWord);
    if (!match.item) continue;
    const name = match.item.name;
    const pityMatch = row.text.match(/第?\s*(\d{1,3})\s*抽/);
    const key = `${time}|${normalizeName(name)}`;
    if (seen.has(key)) continue;
    seen.add(key);
    candidates.push({
      time,
      name,
      itemId: match.item?.id || '',
      itemType: match.item?.type || '',
      rank: detectRank(row, match.item),
      pity: pityMatch ? Number(pityMatch[1]) : null,
      confidence: Number(match.confidence.toFixed(2)),
      raw: cleanNameFragment(row.text),
      source: 'screenshot',
      synthetic: true,
    });
  }
  candidates.sort((a, b) => a.time.localeCompare(b.time));
  const bars = [];
  for (const line of ocr.lines || []) {
    const text = fixDigitLike(line.text || '').replace(/\s+/g, '');
    if (/已垫/.test(text)) continue;
    const m = text.match(/^(\d{1,3})抽$/);
    if (!m) continue;
    const words = (line.words || []).filter((w) => w.text && w.text.trim());
    if (!words.length) continue;
    const x = Math.min(...words.map((w) => w.x));
    const y = Math.min(...words.map((w) => w.y));
    const bottom = Math.max(...words.map((w) => w.y + w.h));
    const height = bottom - y;
    const size = Math.max(72, Math.min(150, Math.round(height * 3.4)));
    bars.push({
      pity: Number(m[1]),
      x, y, w: Math.max(...words.map((w) => w.x + w.w)) - x, h: height,
      iconBox: { x: Math.max(0, x - size - 12), y: Math.max(0, y + height / 2 - size / 2), w: size, h: size },
    });
  }
  const rawText = (ocr.lines || []).map((l) => l.text).join('\n');
  return {
    imageUrl: `/api/uploads/${name}`,
    game,
    width: ocr.width, height: ocr.height, scale: ocr.scale,
    candidates,
    bars,
    summary: summaryFromText(rawText, game),
    rawText: rawText.slice(0, 12000),
    ocrLineCount: ocr.lines?.length || 0,
    warning: candidates.length === 0 ? '没有识别出逐条记录。可以试试更清晰的截图，或使用下方的“汇总补录”。' : '',
  };
}

export async function saveReviewedRecords(store, game, records) {
  const catalog = loadCatalog(game);
  const normalized = [];
  for (const r of records) {
    const item = r.itemId ? catalog.byId.get(String(r.itemId)) : matchItem(game, r.name).item;
    const name = item?.name || String(r.name || '').trim();
    if (!name && !r.time) continue;
    normalized.push({
      id: '',
      uid: '',
      gachaType: String(r.gachaType || (game === 'zzz' ? '2' : game === 'hsr' ? '11' : '301')),
      uigfType: String(r.uigfType || r.gachaType || (game === 'zzz' ? '2' : game === 'hsr' ? '11' : '301')),
      itemId: String(item?.id || r.itemId || ''),
      count: 1,
      time: r.time,
      name,
      itemType: item?.type || r.itemType || '',
      rank: Number(item?.rarity || r.rank) || 0,
      pity: Number(r.pity) || null,
      lang: 'zh-cn',
      poolName: getGame(game).pools[r.gachaType] || getGame(game).pools[r.uigfType] || '历史补录',
      source: 'screenshot',
      synthetic: true,
    });
  }
  return store.mergeRecords(game, normalized, { source: 'screenshot', lastSource: 'screenshot' });
}
