import type { CardChecker, Merchant } from './types';

const URL = 'https://www.bccard.com/app/merchant/StoreNoInqActn.do';
const TIMEOUT_MS = 10000;

export const check: CardChecker = async (bizNo) => {
  const start = Date.now();
  const controller = new AbortController();
  const timer = setTimeout(() => controller.abort(), TIMEOUT_MS);
  try {
    const body = new URLSearchParams({
      bizregno1: bizNo.slice(0, 3),
      bizregno2: bizNo.slice(3, 5),
      bizregno3: bizNo.slice(5, 10),
      step: '2',
      firstPageYN: 'Y',
    });
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
    if (!res.ok) {
      return { card: '비씨', status: 'error', error: `HTTP ${res.status}`, elapsedMs: Date.now() - start };
    }
    const json = await res.json();
    const size = parseInt(json?.resData?.result_size ?? '0', 10);
    if (size === 0) {
      return { card: '비씨', status: 'not_registered', elapsedMs: Date.now() - start };
    }
    const merchants: Merchant[] = [];
    for (const key of Object.keys(json.resData)) {
      if (!key.startsWith('rsMCN')) continue;
      const row = json.resData[key]?.rowData;
      if (!row) continue;
      const rawCancel = row.cnlDate;
      const cancelDate =
        typeof rawCancel === 'string'
          ? rawCancel.trim()
          : Array.isArray(rawCancel)
            ? String(rawCancel[0] ?? '').trim()
            : '';
      merchants.push({
        name: row.merNm ?? '',
        no: row.merNo ?? '',
        date: row.regDate,
        cancelled: !!cancelDate,
        cancelDate: cancelDate || undefined,
      });
    }
    if (merchants.length === 0) {
      return { card: '비씨', status: 'not_registered', elapsedMs: Date.now() - start };
    }
    return { card: '비씨', status: 'registered', merchants, elapsedMs: Date.now() - start };
  } catch (e) {
    clearTimeout(timer);
    const msg = e instanceof Error ? e.message : String(e);
    return { card: '비씨', status: 'error', error: msg.includes('abort') ? 'timeout' : msg, elapsedMs: Date.now() - start };
  }
};
