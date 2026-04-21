import { getCookie } from '@/lib/kv';
import type { CardChecker } from '@/cards/types';

const API_URL = 'https://www.hanacard.co.kr/OMA25000000M.ajax';
const PAGE_URL = 'https://www.hanacard.co.kr/OMA25000000M.web?schID=mcd';
const TIMEOUT_MS = 10000;

export const check: CardChecker = async (bizNo) => {
  const start = Date.now();
  try {
    const cookie = await getCookie('hana');
    if (!cookie) {
      return { card: '하나', status: 'error', error: 'session_not_ready', elapsedMs: Date.now() - start };
    }
    const controller = new AbortController();
    const timer = setTimeout(() => controller.abort(), TIMEOUT_MS);
    try {
      const res = await fetch(API_URL, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/x-www-form-urlencoded; charset=UTF-8',
          'Referer': PAGE_URL,
          'User-Agent': 'Mozilla/5.0 Chrome/147.0.0.0',
          'X-Requested-With': 'XMLHttpRequest',
          'Cookie': cookie,
        },
        body: `BZNO=${bizNo}&AMM_NEXT_KEY=`,
        signal: controller.signal,
      });
      clearTimeout(timer);
      if (!res.ok) return { card: '하나', status: 'error', error: `HTTP ${res.status}`, elapsedMs: Date.now() - start };
      const json = await res.json();
      if (json?.result !== 'success') {
        return { card: '하나', status: 'error', error: 'invalid_response', elapsedMs: Date.now() - start };
      }
      const data: Array<any> = json?.dataMap?._BeginLoop_A?.data ?? [];
      if (data.length > 0) {
        const row = data[0];
        return {
          card: '하나',
          status: 'registered',
          merchantName: row?.MC_NM,
          merchantNo: row?.MCNO,
          joinDate: row?.CON_DT,
          elapsedMs: Date.now() - start,
        };
      }
      return { card: '하나', status: 'not_registered', elapsedMs: Date.now() - start };
    } finally {
      clearTimeout(timer);
    }
  } catch (e) {
    const msg = e instanceof Error ? e.message : String(e);
    return {
      card: '하나',
      status: 'error',
      error: msg.includes('abort') ? 'timeout' : msg,
      elapsedMs: Date.now() - start,
    };
  }
};
