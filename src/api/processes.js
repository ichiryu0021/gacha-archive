import { execFile } from 'node:child_process';
import { promisify } from 'node:util';

const execFileAsync = promisify(execFile);

const PROCESS_NAMES = {
  genshin: ['yuanshen.exe', 'genshinimpact.exe', 'genshinimpactcloudgame.exe'],
  hsr: ['starrail.exe'],
  zzz: ['zenlesszonezero.exe'],
};

let cache = { at: 0, games: new Set() };

export async function runningGames() {
  const now = Date.now();
  if (now - cache.at < 2500) return cache.games;
  const games = new Set();
  try {
    const { stdout } = await execFileAsync('tasklist.exe', ['/FO', 'CSV', '/NH'], {
      windowsHide: true,
      timeout: 5000,
      maxBuffer: 4 * 1024 * 1024,
    });
    const names = new Set(
      String(stdout)
        .split(/\r?\n/)
        .map((line) => line.split('","')[0]?.replace(/^"/, '').trim().toLowerCase())
        .filter(Boolean),
    );
    for (const [game, processNames] of Object.entries(PROCESS_NAMES)) {
      if (processNames.some((name) => names.has(name))) games.add(game);
    }
  } catch {
    return cache.games;
  }
  cache = { at: now, games };
  return games;
}
