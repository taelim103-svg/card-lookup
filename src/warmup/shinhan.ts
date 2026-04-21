import type { WarmupScenario } from './types';

const PAGE_URL = 'https://www.shinhancard.com/hpe/HPEINFON/mchtNA01List.shc';

export const warmupShinhan: WarmupScenario = async (page) => {
  try {
    // 신한은 fnSearch() 호출 시 DOM.resolveNode 타임아웃이 빈번 → 페이지 방문만으로 세션 확보
    await page.goto(PAGE_URL, { waitUntil: 'domcontentloaded', timeout: 30000 });
    // JS 초기화 완료 대기 (세션/쿠키 스크립트 실행 시간)
    await new Promise((r) => setTimeout(r, 3000));
    const cookies = await page.cookies();
    const cookieHeader = cookies.map((c) => `${c.name}=${c.value}`).join('; ');
    if (!cookieHeader) return { error: 'no_cookies' };
    return { cookie: cookieHeader };
  } catch (e) {
    return { error: e instanceof Error ? e.message : String(e) };
  }
};
