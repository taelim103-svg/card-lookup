import { getCookie } from '@/lib/kv';
import type { CardChecker, Merchant } from '@/cards/types';

const URL = 'https://www.shinhancard.com/hpe/HPEINFON/mchtNA01List.shc';
const TIMEOUT_MS = 10000;

function decodeHtmlEntities(s: string): string {
  return s
    .replace(/&#(\d+);/g, (_, code) => String.fromCodePoint(parseInt(code, 10)))
    .replace(/&#x([0-9a-f]+);/gi, (_, code) => String.fromCodePoint(parseInt(code, 16)));
}

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
      // 여러 tbody 중 가맹점 결과 테이블(7 컬럼)만 파싱
      // 컬럼: 가맹점번호(10), 상호, 승인일, 해약일, 활동여부(Y/N), 법인여부, 종류
      const trRegex =
        /<tr[^>]*>\s*<td[^>]*>\s*(\d{10})\s*<\/td>\s*<td[^>]*>([^<]+)<\/td>\s*<td[^>]*>([\d.\s]+)<\/td>\s*<td[^>]*>([\d.\s]*)<\/td>\s*<td[^>]*>\s*([YN])\s*<\/td>/g;
      const merchants: Merchant[] = [];
      let m;
      while ((m = trRegex.exec(html)) !== null) {
        const cancelDate = m[4].trim();
        const active = m[5].trim() === 'Y';
        merchants.push({
          no: m[1],
          name: decodeHtmlEntities(m[2].trim()),
          date: m[3].trim(),
          cancelled: !active || !!cancelDate,
          cancelDate: cancelDate || undefined,
        });
      }
      if (merchants.length === 0) {
        return { card: '신한', status: 'not_registered', elapsedMs: Date.now() - start };
      }
      return { card: '신한', status: 'registered', merchants, elapsedMs: Date.now() - start };
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
