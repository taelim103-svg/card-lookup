import type { CardChecker, Merchant } from './types';

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
    // 모든 tr 파싱: <td>가맹점번호</td><td>상호</td><td>가입일</td><td>상태</td>
    const merchants: Merchant[] = [];
    const trRegex = /<tr[^>]*>\s*<td[^>]*>([^<]+)<\/td>\s*<td[^>]*>([^<]+)<\/td>\s*<td[^>]*>([^<]+)<\/td>\s*<td[^>]*>([^<]+)<\/td>\s*<\/tr>/g;
    let m;
    while ((m = trRegex.exec(content)) !== null) {
      const status = m[4].trim();
      merchants.push({
        no: m[1].trim(),
        name: m[2].trim(),
        date: m[3].trim(),
        cancelled: status.includes('해지'),
      });
    }
    if (merchants.length === 0) {
      return { card: '롯데', status: 'not_registered', elapsedMs: Date.now() - start };
    }
    return { card: '롯데', status: 'registered', merchants, elapsedMs: Date.now() - start };
  } catch (e) {
    clearTimeout(timer);
    const msg = e instanceof Error ? e.message : String(e);
    return { card: '롯데', status: 'error', error: msg.includes('abort') ? 'timeout' : msg, elapsedMs: Date.now() - start };
  }
};
