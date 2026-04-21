import type { Page } from 'puppeteer-core';

export type WarmupResult = { cookie: string } | { error: string };

export type WarmupScenario = (page: Page) => Promise<WarmupResult>;
