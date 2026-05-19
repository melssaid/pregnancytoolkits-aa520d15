import { beforeEach, describe, expect, it, vi } from 'vitest';

const {
  mockGetSession,
  mockSignInAnonymously,
  mockRefreshSession,
  mockGetCouponRequestHeaders,
  mockGetBackendFunctionUrl,
  mockCanAfford,
  mockConsumeQuota,
  mockGetQuotaState,
  mockSyncFromServer,
  mockSetTier,
  mockBuildCacheKey,
  mockGetCached,
  mockSetCache,
} = vi.hoisted(() => ({
  mockGetSession: vi.fn(),
  mockSignInAnonymously: vi.fn(),
  mockRefreshSession: vi.fn(),
  mockGetCouponRequestHeaders: vi.fn(),
  mockGetBackendFunctionUrl: vi.fn(),
  mockCanAfford: vi.fn(),
  mockConsumeQuota: vi.fn(),
  mockGetQuotaState: vi.fn(),
  mockSyncFromServer: vi.fn(),
  mockSetTier: vi.fn(),
  mockBuildCacheKey: vi.fn(),
  mockGetCached: vi.fn(),
  mockSetCache: vi.fn(),
}));

vi.mock('@/integrations/supabase/client', () => ({
  supabase: {
    auth: {
      getSession: mockGetSession,
      signInAnonymously: mockSignInAnonymously,
      refreshSession: mockRefreshSession,
    },
  },
}));

vi.mock('@/lib/couponRequestHeaders', () => ({
  getCouponRequestHeaders: mockGetCouponRequestHeaders,
}));

vi.mock('@/lib/backendConfig', () => ({
  getBackendFunctionUrl: mockGetBackendFunctionUrl,
}));

vi.mock('../quotaManager', () => ({
  canAfford: mockCanAfford,
  consumeQuota: mockConsumeQuota,
  getQuotaState: mockGetQuotaState,
  syncFromServer: mockSyncFromServer,
  setTier: mockSetTier,
}));

vi.mock('../cacheManager', () => ({
  buildCacheKey: mockBuildCacheKey,
  getCached: mockGetCached,
  setCache: mockSetCache,
  contentHash: vi.fn(),
}));

import { executeSmartRequest } from '../smartEngine';
import type { SmartRequest } from '../types';

const makeRequest = (overrides: Partial<SmartRequest> = {}): SmartRequest => ({
  section: 'symptoms',
  messages: [{ role: 'user', content: 'I have nausea' }],
  context: { language: 'en' },
  ...overrides,
});

const makeStream = (chunks: string[]): ReadableStream<Uint8Array> => {
  const encoder = new TextEncoder();
  return new ReadableStream<Uint8Array>({
    start(controller) {
      for (const chunk of chunks) controller.enqueue(encoder.encode(chunk));
      controller.close();
    },
  });
};

describe('executeSmartRequest', () => {
  beforeEach(() => {
    vi.clearAllMocks();
    localStorage.clear();

    mockCanAfford.mockReturnValue(true);
    mockConsumeQuota.mockReturnValue(undefined);
    mockGetQuotaState.mockReturnValue({ used: 8, limit: 8 });
    mockBuildCacheKey.mockReturnValue('smart_cache_key');
    mockGetCached.mockReturnValue(null);
    mockGetSession.mockResolvedValue({ data: { session: { access_token: 'access-token' } } });
    mockSignInAnonymously.mockResolvedValue({ data: { session: null }, error: null });
    mockRefreshSession.mockResolvedValue({ data: { session: null } });
    mockGetCouponRequestHeaders.mockResolvedValue({ 'X-Device-Fingerprint': 'fp-1' });
    mockGetBackendFunctionUrl.mockReturnValue('https://backend.example/functions/v1/pregnancy-ai-perplexity');
    vi.stubGlobal('fetch', vi.fn());
  });

  it('returns quota_exhausted immediately when user cannot afford request cost', async () => {
    mockCanAfford.mockReturnValue(false);

    const onDelta = vi.fn();
    const onDone = vi.fn();
    const onError = vi.fn();

    await executeSmartRequest({ request: makeRequest(), onDelta, onDone, onError });

    expect(onDelta).not.toHaveBeenCalled();
    expect(onDone).not.toHaveBeenCalled();
    expect(onError).toHaveBeenCalledWith({
      type: 'quota_exhausted',
      message: 'Monthly limit reached (8/8)',
      retryable: false,
    });
    expect(fetch).not.toHaveBeenCalled();
  });

  it('serves cached content and skips remote call when cache exists', async () => {
    mockGetCached.mockReturnValue({
      content: 'cached insight',
      section: 'symptoms',
      timestamp: 123456,
      expiresAt: Date.now() + 60_000,
      contentHash: 'hash',
    });

    const onDelta = vi.fn();
    const onDone = vi.fn();
    const onError = vi.fn();

    await executeSmartRequest({ request: makeRequest(), onDelta, onDone, onError });

    expect(onDelta).toHaveBeenCalledWith('cached insight');
    expect(onDone).toHaveBeenCalledWith({
      content: 'cached insight',
      section: 'symptoms',
      timestamp: 123456,
      cached: true,
      cost: 0,
    });
    expect(onError).not.toHaveBeenCalled();
    expect(fetch).not.toHaveBeenCalled();
    expect(mockConsumeQuota).not.toHaveBeenCalled();
  });

  it('streams successful response, syncs quota from headers, and caches final content', async () => {
    vi.mocked(fetch).mockResolvedValue({
      ok: true,
      status: 200,
      headers: new Headers({
        'X-Daily-Used': '3.5',
        'X-Subscription-Tier': 'premium',
        'X-Daily-Limit': '90',
      }),
      body: makeStream([
        'data: {"choices":[{"delta":{"content":"Hello "}}]}\n',
        'data: {"choices":[{"delta":{"content":"Mama"}}]}\n',
        'data: [DONE]\n',
      ]),
    } as Response);

    const onDelta = vi.fn();
    const onDone = vi.fn();
    const onError = vi.fn();

    await executeSmartRequest({ request: makeRequest({ section: 'bump-photos' }), onDelta, onDone, onError });

    expect(mockSyncFromServer).toHaveBeenCalledWith(3.5, 'premium', 90);
    expect(onDelta).toHaveBeenNthCalledWith(1, 'Hello ');
    expect(onDelta).toHaveBeenNthCalledWith(2, 'Mama');
    expect(mockConsumeQuota).toHaveBeenCalledWith(5);
    expect(mockSetCache).toHaveBeenCalledTimes(1);
    expect(onDone).toHaveBeenCalledWith(
      expect.objectContaining({
        content: 'Hello Mama',
        section: 'bump-photos',
        cached: false,
        cost: 5,
      }),
    );
    expect(onError).not.toHaveBeenCalled();
  });

  it('returns network error when response body is missing', async () => {
    vi.mocked(fetch).mockResolvedValue({
      ok: true,
      status: 200,
      headers: new Headers(),
      body: null,
    } as Response);

    const onDone = vi.fn();
    const onError = vi.fn();

    await executeSmartRequest({ request: makeRequest(), onDelta: vi.fn(), onDone, onError });

    expect(onDone).not.toHaveBeenCalled();
    expect(onError).toHaveBeenCalledWith({
      type: 'network',
      message: 'No response body',
      retryable: true,
    });
  });

  it('retries on 401 with refreshed token and succeeds on second stream', async () => {
    const firstResponse = {
      ok: false,
      status: 401,
      headers: new Headers(),
      json: vi.fn().mockResolvedValue({ error: 'token_expired' }),
      body: null,
    } as unknown as Response;

    const secondResponse = {
      ok: true,
      status: 200,
      headers: new Headers({ 'X-Subscription-Tier': 'premium' }),
      body: makeStream([
        'data: {"choices":[{"delta":{"content":"Retried "}}]}\n',
        'data: {"choices":[{"delta":{"content":"success"}}]}\n',
        'data: [DONE]\n',
      ]),
    } as unknown as Response;

    vi.mocked(fetch)
      .mockResolvedValueOnce(firstResponse)
      .mockResolvedValueOnce(secondResponse);

    mockRefreshSession.mockResolvedValue({ data: { session: { access_token: 'new-token' } } });

    const onDelta = vi.fn();
    const onDone = vi.fn();
    const onError = vi.fn();

    await executeSmartRequest({ request: makeRequest(), onDelta, onDone, onError });

    expect(fetch).toHaveBeenCalledTimes(2);
    expect(mockSetTier).toHaveBeenCalledWith('premium');
    expect(mockConsumeQuota).toHaveBeenCalledWith(2);
    expect(onDone).toHaveBeenCalledWith(
      expect.objectContaining({
        content: 'Retried success',
        section: 'symptoms',
        cached: false,
        cost: 2,
      }),
    );
    expect(onError).not.toHaveBeenCalled();
  });

  it('classifies thrown fetch errors as network errors', async () => {
    vi.mocked(fetch).mockRejectedValue(new Error('Failed to fetch')); 

    const onDone = vi.fn();
    const onError = vi.fn();

    await executeSmartRequest({ request: makeRequest(), onDelta: vi.fn(), onDone, onError });

    expect(onDone).not.toHaveBeenCalled();
    expect(onError).toHaveBeenCalledWith({
      type: 'network',
      message: 'Failed to fetch',
      retryable: true,
    });
  });
});
