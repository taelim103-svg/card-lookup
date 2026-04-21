import type { CardChecker } from './types';

const URL = 'https://merchant.lottecard.co.kr/app/LMSVCFA_V101.lc';
const TIMEOUT_MS = 10000;

export const check: CardChecker = async (bizNo) => {
  const start = Date.now();
  const controller = new AbortController();
  const timer = setTimeout(() => controller.abort(), TIMEOUT_MS);
  try {
    const body = new URLSearchParams({ rs0Bzno: bizNo });
    const res = await fetch(URL, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/x-www-form-urlencoded',
        'User-Agent': 'Mozilla/5.0 Chrome/147.0.0.0',
      },
      body,
      signal: controller.signal,
    });
    clearTimeout(timer);
    if (!res.ok) return { card: '롯데', status: 'error', error: `HTTP ${res.status}`, elapsedMs: Date.now() - start };
    const json = await res.json();
    if (json?.Status?.code !== 0) {
      return { card: '롯데', status: 'error', error: json?.Status?.message ?? 'unknown', elapsedMs: Date.now() - start };
    }
    const content: string = json.Content ?? '';
    const tdMatch = content.match(/<td[^>]*>([^<]+)<\/td>\s*<td[^>]*>([^<]+)<\/td>\s*<td[^>]*>([^<]+)<\/td>/);
    if (tdMatch) {
      return {
        card: '롯데',
        status: 'registered',
        merchantNo: tdMatch[1].trim(),
        merchantName: tdMatch[2].trim(),
        joinDate: tdMatch[3].trim(),
        elapsedMs: Date.now() - start,
      };
    }
    return { card: '롯데', status: 'not_registered', elapsedMs: Date.now() - start };
  } catch (e) {
    clearTimeout(timer);
    const msg = e instanceof Error ? e.message : String(e);
    return { card: '롯데', status: 'error', error: msg.includes('abort') ? 'timeout' : msg, elapsedMs: Date.now() - start };
  }
};
