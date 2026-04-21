import { getCookie } from '@/lib/kv';
import type { CardChecker, Merchant } from '@/cards/types';

const API_URL = 'https://m.wooricard.com/dcmw/yh1/mcd/mcd14/getListMchNo.pwkjson';
const PAGE_URL = 'https://m.wooricard.com/dcmw/yh1/mcd/mcd14/M1MCD214S30.do';
const TIMEOUT_MS = 10000;

export const check: CardChecker = async (bizNo) => {
  const start = Date.now();
  try {
    const cookie = await getCookie('woori');
    if (!cookie) {
      return { card: '우리', status: 'error', error: 'session_not_ready', elapsedMs: Date.now() - start };
    }
    const controller = new AbortController();
    const timer = setTimeout(() => controller.abort(), TIMEOUT_MS);
    try {
      const body = {
        eaiSendVo: {
          eaiReqMap: JSON.stringify({ BZNO_10: bizNo, PAGE_NO_3: 1 }),
        },
      };
      const res = await fetch(API_URL, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'X-Requested-With': 'XMLHttpRequest',
          'Accept': 'application/json, text/javascript, */*; q=0.01',
          'Referer': PAGE_URL,
          'User-Agent': 'Mozilla/5.0 Chrome/147.0.0.0',
          'Cookie': cookie,
        },
        body: JSON.stringify(body),
        signal: controller.signal,
      });
      clearTimeout(timer);
      if (!res.ok) return { card: '우리', status: 'error', error: `HTTP ${res.status}`, elapsedMs: Date.now() - start };
      const json = await res.json();
      const resMsg: string = json?.elHeader?.resMsg ?? '';
      const resCode: string = json?.elHeader?.resCode ?? '';

      // 조회 가능 시도 횟수 초과 감지
      if (resMsg.includes('횟수가 초과') || resMsg.includes('횟수 초과')) {
        return { card: '우리', status: 'rate_limited', elapsedMs: Date.now() - start };
      }

      if (resCode && resCode !== 'ERROR.NONE' && !json?.eaiResMap) {
        return {
          card: '우리',
          status: 'error',
          error: resCode === 'ERROR.SYS.002' ? 'session_expired' : resCode,
          elapsedMs: Date.now() - start,
        };
      }
      const m = json?.eaiResMap;
      const totCn = parseInt(m?.TOT_CN_5 ?? '0', 10);
      const rows: Array<Record<string, string>> = Array.isArray(m?.R1610) ? m.R1610 : [];
      if (totCn > 0 && rows.length > 0) {
        // 우리카드 응답에는 해지일 필드가 없으므로 cancelled 미판정
        const merchants: Merchant[] = rows.map((row) => ({
          name: row?.MCH_NM_100 ?? '',
          no: row?.MCH_NO_9 ?? '',
          date: row?.OPN_ENT_DT_8,
        }));
        return { card: '우리', status: 'registered', merchants, elapsedMs: Date.now() - start };
      }
      return { card: '우리', status: 'not_registered', elapsedMs: Date.now() - start };
    } finally {
      clearTimeout(timer);
    }
  } catch (e) {
    const msg = e instanceof Error ? e.message : String(e);
    return {
      card: '우리',
      status: 'error',
      error: msg.includes('abort') ? 'timeout' : msg,
      elapsedMs: Date.now() - start,
    };
  }
};
