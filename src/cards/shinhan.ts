import { getCookie } from '@/lib/kv';
import type { CardChecker } from '@/cards/types';

const URL = 'https://www.shinhancard.com/hpe/HPEINFON/mchtNA01List.shc';
const TIMEOUT_MS = 10000;

export const check: CardChecker = async (bizNo) => {
  const start = Date.now();
  try {
    const cookie = await getCookie('shinhan');
    if (!cookie) {
      return { card: '신한', status: 'error', error: 'session_not_ready', elapsedMs: Date.now() - start };
    }
    const controller = new AbortController();
    const timer = setTimeout(() => controller.abort(), TIMEOUT_MS);
    try {
      const body = `NXT_QY_KEY=&pre_pageFlag=&scr_id=${bizNo}&Flag=Y&ssn=${bizNo}`;
      const res = await fetch(URL, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/x-www-form-urlencoded',
          'Referer': URL,
          'User-Agent': 'Mozilla/5.0 Chrome/147.0.0.0',
          'Cookie': cookie,
        },
        body,
        signal: controller.signal,
      });
      clearTimeout(timer);
      if (!res.ok) return { card: '신한', status: 'error', error: `HTTP ${res.status}`, elapsedMs: Date.now() - start };
      const buf = await res.arrayBuffer();
      const html = new TextDecoder('euc-kr').decode(buf);
      const m = html.match(
        /<tbody[\s\S]*?<tr[^>]*>[\s\S]*?<td[^>]*>\s*(\d{10})\s*<\/td>\s*<td[^>]*>([^<]+)<\/td>\s*<td[^>]*>([\d.\s]+)<\/td>/
      );
      if (m) {
        return {
          card: '신한',
          status: 'registered',
          merchantNo: m[1],
          merchantName: m[2].trim(),
          joinDate: m[3].trim(),
          elapsedMs: Date.now() - start,
        };
      }
      return { card: '신한', status: 'not_registered', elapsedMs: Date.now() - start };
    } finally {
      clearTimeout(timer);
    }
  } catch (e) {
    const msg = e instanceof Error ? e.message : String(e);
    return {
      card: '신한',
      status: 'error',
      error: msg.includes('abort') ? 'timeout' : msg,
      elapsedMs: Date.now() - start,
    };
  }
};
