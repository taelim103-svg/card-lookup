# 카드사 가맹점 등록 조회

사업자번호로 8개 카드사 가맹점 등록 여부를 한 번에 조회하는 사내 웹 도구.

## 지원 카드사

- **순수 HTTP** (세션 불필요): 비씨, 롯데, 삼성, 현대, 국민
- **하이브리드** (10분마다 세션 워밍업): 우리, 하나, 신한

## 로컬 개발

```bash
npm install
cp .env.example .env.local
# .env.local 에 Upstash Redis 연결 + CRON_SECRET 작성
npm run dev
```

## 배포

Vercel에 자동 배포. main 브랜치 푸시 → 배포.

### 필수 환경변수

- `UPSTASH_REDIS_REST_URL`, `UPSTASH_REDIS_REST_TOKEN` (Vercel Marketplace → Upstash 통합 시 자동 주입)
- `CRON_SECRET` (외부에서 Cron 경로 호출 차단용)

### Cron 설정

`vercel.json`에 10분 주기 설정. **Vercel Pro 플랜 필요** (Hobby는 일 1회 제한).

## 구조

```
src/
├── app/
│   ├── page.tsx                      메인 UI
│   └── api/
│       ├── lookup/route.ts            POST 8개 병렬 조회
│       └── cron/warmup/route.ts       Cron 세션 워밍업
├── cards/               8개 카드사 모듈 (공통 시그니처)
├── warmup/              Playwright 시나리오 (3개)
├── lib/                 KV 래퍼, 검증, cn 유틸
└── components/          LookupForm, ResultCard
```

## 문제 해결

- **"세션 준비 중"**: Cron이 아직 안 돌았거나 실패. Vercel 로그에서 `/api/cron/warmup` 확인.
- **"응답 지연"**: 해당 카드사 사이트 일시 장애. 다음 조회 시 재시도.
- **카드사 페이지 구조 변경** → `src/warmup/*.ts` 셀렉터 업데이트 필요.

## 설계 문서

- 설계: `docs/2026-04-21-design.md`
- 구현 계획: `docs/2026-04-21-plan.md`
