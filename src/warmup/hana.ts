import type { WarmupScenario } from './types';

const PAGE_URL = 'https://www.hanacard.co.kr/OMA25000000M.web?schID=mcd';
const WARMUP_BIZNO = '0000000000';

export const warmupHana: WarmupScenario = async (page) => {
  try {
    await page.goto(PAGE_URL, { waitUntil: 'networkidle2', timeout: 30000 });
    await page.type('#BZNO1', WARMUP_BIZNO);
    await page.evaluate(() => {
      const fn = (window as unknown as { doAjaxSubmit?: () => void }).doAjaxSubmit;
      if (typeof fn === 'function') fn();
    });
    await page
      .waitForFunction(
        () =>
          document.body.innerText.includes('조회결과가 없습니다') ||
          document.body.innerText.includes('가맹점번호'),
        { timeout: 15000 }
      )
      .catch(() => {});
    const cookies = await page.cookies();
    const cookieHeader = cookies.map((c) => `${c.name}=${c.value}`).join('; ');
    if (!cookieHeader) return { error: 'no_cookies' };
    return { cookie: cookieHeader };
  } catch (e) {
    return { error: e instanceof Error ? e.message : String(e) };
  }
};
