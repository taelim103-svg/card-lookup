import type { CardChecker, Merchant } from './types';

const URL = 'https://www.samsungcard.com/service/SHPMCO0202S02';
const REFERER = 'https://www.samsungcard.com/merchant/number/UHPMMM0101M0.jsp';
const TIMEOUT_MS = 10000;

// mrcStc: '30' = 정상, '60' = 해지. 빈 문자열이면 전체 조회.
const STATUS_ACTIVE = '30';

export const check: CardChecker = async (bizNo) => {
  const start = Date.now();
  const controller = new AbortController();
  const timer = setTimeout(() => controller.abort(), TIMEOUT_MS);
  try {
    const today = new Date().toISOString().slice(0, 10).replace(/-/g, '');
    const body = {
      bzrno: bizNo,
      mrcStc: '', // 전체 상태(정상+해지) 조회
      common: {
        dlngEvnDvC: 'S',
        scrnId: 'UHPMMM0101M0',
        stdEtxtCrtDt: today,
        stdEtxtCrtSysNm: 'P9303294',
        stdEtxtSn: `${Date.now()}`.slice(-14).padStart(14, '0'),
        stdEtxtPrgDvNo: 0,
        stdEtxtPrgNo: 0,
        indvInfIncYn: 'N',
        usid: 'USERID0',
      },
    };
    const res = await fetch(URL, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'Referer': REFERER,
        'User-Agent': 'Mozilla/5.0 Chrome/147.0.0.0',
      },
      body: JSON.stringify(body),
      signal: controller.signal,
    });
    clearTimeout(timer);
    if (!res.ok) return { card: '삼성', status: 'error', error: `HTTP ${res.status}`, elapsedMs: Date.now() - start };
    const json = await res.json();
    const grid: Array<Record<string, string>> = json?.grid ?? [];
    if (grid.length === 0) {
      return { card: '삼성', status: 'not_registered', elapsedMs: Date.now() - start };
    }
    const merchants: Merchant[] = grid.map((row) => ({
      name: row?.mrcNm ?? '',
      no: row?.mrcno ?? '',
      date: row?.mrcCntrDt,
      cancelled: row?.mrcStc !== STATUS_ACTIVE,
    }));
    return { card: '삼성', status: 'registered', merchants, elapsedMs: Date.now() - start };
  } catch (e) {
    clearTimeout(timer);
    const msg = e instanceof Error ? e.message : String(e);
    return { card: '삼성', status: 'error', error: msg.includes('abort') ? 'timeout' : msg, elapsedMs: Date.now() - start };
  }
};
