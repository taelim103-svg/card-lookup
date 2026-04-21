import { Agent } from 'undici';
import type { CardChecker } from './types';

const PAGE_URL = 'https://biz.kbcard.com/CXERFMGC0009.cms';
const TIMEOUT_MS = 10000;

// KB의 TLS 체인이 불완전해 검증 완화
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
    // Korean form field names: URL-encoded UTF-8 bytes of "사업자번호"
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
    // 가맹점번호(9자리) + 가맹점명 + 가입일 매칭
    const m = html.match(/(\d{9})\s*<\/td>\s*<td[^>]*>([^<]+)<\/td>\s*<td[^>]*>(\d{4}\.\d{2}\.\d{2})/);
    if (m) {
      return {
        card: '국민',
        status: 'registered',
        merchantNo: m[1],
        merchantName: m[2].trim(),
        joinDate: m[3],
        elapsedMs: Date.now() - start,
      };
    }
    return { card: '국민', status: 'not_registered', elapsedMs: Date.now() - start };
  } catch (e) {
    clearTimeout(timer);
    const msg = e instanceof Error ? e.message : String(e);
    return { card: '국민', status: 'error', error: msg.includes('abort') ? 'timeout' : msg, elapsedMs: Date.now() - start };
  }
};
