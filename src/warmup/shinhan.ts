import type { WarmupScenario } from './types';

const PAGE_URL = 'https://www.shinhancard.com/hpe/HPEINFON/mchtNA01List.shc';
const WARMUP_BIZNO = '0000000000';

export const warmupShinhan: WarmupScenario = async (page) => {
  try {
    // 신한카드는 networkidle2 도달이 느려 domcontentloaded로 변경
    await page.goto(PAGE_URL, { waitUntil: 'domcontentloaded', timeout: 30000 });
    await page.type('#ssn', WARMUP_BIZNO);
    await page.evaluate(() => {
      const fn = (window as unknown as { fnSearch?: () => void }).fnSearch;
      if (typeof fn === 'function') fn();
    });
    // 네비게이션 완료 대기 (빠른 domcontentloaded)
    await page
      .waitForNavigation({ waitUntil: 'domcontentloaded', timeout: 15000 })
      .catch(() => {});
    const cookies = await page.cookies();
    const cookieHeader = cookies.map((c) => `${c.name}=${c.value}`).join('; ');
    if (!cookieHeader) return { error: 'no_cookies' };
    return { cookie: cookieHeader };
  } catch (e) {
    return { error: e instanceof Error ? e.message : String(e) };
  }
};
