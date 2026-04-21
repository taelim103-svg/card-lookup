import { getCookie } from '@/lib/kv';
import type { CardChecker, Merchant } from '@/cards/types';

const API_URL = 'https://www.hanacard.co.kr/OMA25000000M.ajax';
const PAGE_URL = 'https://www.hanacard.co.kr/OMA25000000M.web?schID=mcd';
const TIMEOUT_MS = 10000;

// 하나카드 MC_STC: "30" = 정상, 그 외 = 해지 (추정)
const STATUS_ACTIVE = '30';

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
      const buf = await res.arrayBuffer();
      const text = new TextDecoder('euc-kr').decode(buf);
      const json = JSON.parse(text);
      if (json?.result !== 'success') {
        return { card: '하나', status: 'error', error: 'invalid_response', elapsedMs: Date.now() - start };
      }
      const data: Array<Record<string, string>> = json?.dataMap?._BeginLoop_A?.data ?? [];
      if (data.length === 0) {
        return { card: '하나', status: 'not_registered', elapsedMs: Date.now() - start };
      }
      const merchants: Merchant[] = data.map((row) => {
        const cancelDate = (row?.RSG_DT ?? '').trim();
        const mcStc = (row?.MC_STC ?? '').trim();
        return {
          name: row?.MC_NM ?? '',
          no: row?.MCNO ?? '',
          date: row?.CON_DT,
          cancelled: !!cancelDate || (mcStc !== '' && mcStc !== STATUS_ACTIVE),
          cancelDate: cancelDate || undefined,
        };
      });
      return { card: '하나', status: 'registered', merchants, elapsedMs: Date.now() - start };
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
