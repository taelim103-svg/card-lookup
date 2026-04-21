import { Agent } from 'undici';
import { constants } from 'node:crypto';
import type { CardChecker, Merchant } from './types';

const URL = 'https://www.hyundaicard.com/csa/im/apiCSAIM1103_01pop.hc';
const REFERER = 'https://www.hyundaicard.com/csa/mb/STOREMAIN.hc';
const TIMEOUT_MS = 10000;

const agent = new Agent({
  connect: { secureOptions: constants.SSL_OP_LEGACY_SERVER_CONNECT },
});

export const check: CardChecker = async (bizNo) => {
  const start = Date.now();
  const controller = new AbortController();
  const timer = setTimeout(() => controller.abort(), TIMEOUT_MS);
  try {
    const body = `popCono=${bizNo}&popCorpjno1=&popCorpjno2=&popFormLSN=${bizNo}`;
    const res = await fetch(URL, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/x-www-form-urlencoded; charset=UTF-8',
        'Referer': REFERER,
        'User-Agent': 'Mozilla/5.0 Chrome/147.0.0.0',
        'X-Requested-With': 'XMLHttpRequest',
      },
      body,
      // @ts-expect-error - undici dispatcher
      dispatcher: agent,
      signal: controller.signal,
    });
    clearTimeout(timer);
    if (!res.ok) return { card: '현대', status: 'error', error: `HTTP ${res.status}`, elapsedMs: Date.now() - start };
    const json = await res.json();
    const errorCode: string | undefined = json?.bdy?.error_code;
    if (errorCode === 'HDCUSRINF082') {
      return { card: '현대', status: 'not_registered', elapsedMs: Date.now() - start };
    }
    const grid: Array<Record<string, string>> = json?.bdy?.result?.ha38261001TO?.gridpgt1 ?? [];
    if (grid.length > 0) {
      const merchants: Merchant[] = grid.map((row) => ({
        name: row?.mrchKorNm ?? '',
        no: row?.mcno ?? '',
        date: row?.mrchEntrDd,
      }));
      return { card: '현대', status: 'registered', merchants, elapsedMs: Date.now() - start };
    }
    if (errorCode) {
      return { card: '현대', status: 'error', error: errorCode, elapsedMs: Date.now() - start };
    }
    return { card: '현대', status: 'not_registered', elapsedMs: Date.now() - start };
  } catch (e) {
    clearTimeout(timer);
    const msg = e instanceof Error ? e.message : String(e);
    return { card: '현대', status: 'error', error: msg.includes('abort') ? 'timeout' : msg, elapsedMs: Date.now() - start };
  }
};
