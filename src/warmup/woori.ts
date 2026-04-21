import type { WarmupScenario } from './types';

const PAGE_URL = 'https://m.wooricard.com/dcmw/yh1/mcd/mcd14/M1MCD214S30.do';
const WARMUP_BIZNO = '0000000000';
const EMPTY_MARKER = '조회조건에 해당하는 내역이 없습니다';

export const warmupWoori: WarmupScenario = async (page) => {
  try {
    await page.goto(PAGE_URL, { waitUntil: 'networkidle2', timeout: 30000 });
    await page.type('#bzNo', WARMUP_BIZNO);
    await page.click('#btnRetrieve');
    await page
      .waitForFunction(
        (marker: string) =>
          document.body.innerText.includes(marker) ||
          /가맹점번호[\s\S]{0,80}\d{9}/.test(document.body.innerText),
        { timeout: 15000 },
        EMPTY_MARKER
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
