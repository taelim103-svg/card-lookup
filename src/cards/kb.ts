import { Agent } from 'undici';
import type { CardChecker, Merchant } from './types';

const PAGE_URL = 'https://biz.kbcard.com/CXERFMGC0009.cms';
const TIMEOUT_MS = 10000;

const agent = new Agent({
  connect: { rejectUnauthorized: false },
});

async function getSessionCookies(): Promise<string> {
  const res = await fetch(PAGE_URL, {
    headers: { 'User-Agent': 'Mozilla/5.0 Chrome/147.0.0.0' },
    // @ts-expect-error - undici dispatcher
    dispatcher: agent,
  });
  const setCookie = res.headers.getSetCookie?.() ?? [];
  return setCookie.map((c) => c.split(';')[0]).join('; ');
}

export const check: CardChecker = async (bizNo) => {
  const start = Date.now();
  const controller = new AbortController();
  const timer = setTimeout(() => controller.abort(), TIMEOUT_MS);
  try {
    const cookies = await getSessionCookies();
    const KEY = '%EC%82%AC%EC%97%85%EC%9E%90%EB%B2%88%ED%98%B8';
    const body = `isAjax=Y&isNoFrame=Y&mainCC=a&pageCount=1&${KEY}=${bizNo}&${KEY}1=${bizNo.slice(0, 3)}&${KEY}2=${bizNo.slice(3, 5)}&${KEY}3=${bizNo.slice(5, 10)}`;
    const res = await fetch(PAGE_URL, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/x-www-form-urlencoded;charset=UTF-8',
        'Referer': PAGE_URL,
        'User-Agent': 'Mozilla/5.0 Chrome/147.0.0.0',
        'Cookie': cookies,
        'X-Requested-With': 'XMLHttpRequest',
      },
      body,
      // @ts-expect-error
      dispatcher: agent,
      signal: controller.signal,
    });
    clearTimeout(timer);
    if (!res.ok) return { card: '국민', status: 'error', error: `HTTP ${res.status}`, elapsedMs: Date.now() - start };
    const buf = await res.arrayBuffer();
    const html = new TextDecoder('euc-kr').decode(buf);
    // tbody 안 tr들을 전부 파싱. 각 tr: <td>가맹점번호</td><td>이름</td><td>가입일</td><td>해지일</td><td>주소</td><td>인쇄버튼</td>
    // 가맹점번호는 7~10자리 숫자 (8자리 경우도 있음 예: 82945314)
    const tbody = html.match(/<tbody[\s\S]*?<\/tbody>/)?.[0] ?? '';
    const merchants: Merchant[] = [];
    const trRegex =
      /<tr[^>]*>\s*<td[^>]*>\s*(\d{7,10})\s*<\/td>\s*<td[^>]*>([^<]+)<\/td>\s*<td[^>]*>(\d{4}\.\d{2}\.\d{2})<\/td>\s*<td[^>]*>([^<]*)<\/td>/g;
    let m;
    while ((m = trRegex.exec(tbody)) !== null) {
      const cancelDate = m[4].trim();
      merchants.push({
        no: m[1],
        name: m[2].trim(),
        date: m[3],
        cancelled: !!cancelDate,
        cancelDate: cancelDate || undefined,
      });
    }
    if (merchants.length === 0) {
      return { card: '국민', status: 'not_registered', elapsedMs: Date.now() - start };
    }
    return { card: '국민', status: 'registered', merchants, elapsedMs: Date.now() - start };
  } catch (e) {
    clearTimeout(timer);
    const msg = e instanceof Error ? e.message : String(e);
    return { card: '국민', status: 'error', error: msg.includes('abort') ? 'timeout' : msg, elapsedMs: Date.now() - start };
  }
};
