import chromium from '@sparticuz/chromium';
import puppeteer from 'puppeteer-core';
import { setCookie, setWarmupMetadata } from '@/lib/kv';
import { warmupWoori } from './woori';
import { warmupHana } from './hana';
import { warmupShinhan } from './shinhan';
import type { WarmupScenario } from './types';

type WarmupCard = 'woori' | 'hana' | 'shinhan';

const SCENARIOS: Array<{ card: WarmupCard; scenario: WarmupScenario }> = [
  { card: 'woori', scenario: warmupWoori },
  { card: 'hana', scenario: warmupHana },
  { card: 'shinhan', scenario: warmupShinhan },
];

export interface WarmupSummary {
  success: number;
  failed: number;
  details: Array<{ card: WarmupCard; ok: boolean; error?: string; elapsedMs: number }>;
}

export async function runWarmup(): Promise<WarmupSummary> {
  const browser = await puppeteer.launch({
    args: chromium.args,
    executablePath: await chromium.executablePath(),
    headless: true,
  });
  const details: WarmupSummary['details'] = [];
  try {
    for (const { card, scenario } of SCENARIOS) {
      const start = Date.now();
      const page = await browser.newPage();
      const result = await scenario(page);
      await page.close().catch(() => {});
      const elapsedMs = Date.now() - start;
      if ('cookie' in result) {
        await setCookie(card, result.cookie);
        await setWarmupMetadata(card, { timestamp: Date.now(), success: true });
        details.push({ card, ok: true, elapsedMs });
      } else {
        await setWarmupMetadata(card, { timestamp: Date.now(), success: false, error: result.error });
        details.push({ card, ok: false, error: result.error, elapsedMs });
      }
    }
  } finally {
    await browser.close().catch(() => {});
  }
  return {
    success: details.filter((d) => d.ok).length,
    failed: details.filter((d) => !d.ok).length,
    details,
  };
}
