import { Redis } from '@upstash/redis';

const COOKIE_TTL_SECONDS = 900; // 15분 (cron 주기 10분 + 여유)

type HybridCard = 'woori' | 'hana' | 'shinhan';

// 모듈 로드 시점에 env가 없어도 빌드는 통과 (실행 시점에 throw)
let _redis: Redis | null = null;
function getRedis(): Redis {
  if (!_redis) _redis = Redis.fromEnv();
  return _redis;
}

export async function getCookie(card: HybridCard): Promise<string | null> {
  return (await getRedis().get<string>(`cookie:${card}`)) ?? null;
}

export async function setCookie(card: HybridCard, value: string): Promise<void> {
  await getRedis().set(`cookie:${card}`, value, { ex: COOKIE_TTL_SECONDS });
}

export async function setWarmupMetadata(
  card: HybridCard,
  meta: { timestamp: number; success: boolean; error?: string }
): Promise<void> {
  await getRedis().set(`warmup:${card}`, meta, { ex: COOKIE_TTL_SECONDS });
}

export async function getWarmupMetadata(card: HybridCard) {
  return await getRedis().get<{ timestamp: number; success: boolean; error?: string }>(
    `warmup:${card}`
  );
}
