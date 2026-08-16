import { describe, expect, it, vi } from 'vitest';
import { createFinancialRefreshCoordinator } from './financialRefreshCoordinator';

function deferred<T>() {
  let resolve!: (value: T) => void;
  const promise = new Promise<T>(next => { resolve = next; });
  return { promise, resolve };
}

function request<T>(overrides: {
  key: string;
  version: number;
  result: ReturnType<typeof deferred<T>>;
  apply: (value: T) => void;
  loading: (value: boolean) => void;
}) {
  return {
    key: overrides.key,
    version: overrides.version,
    load: vi.fn(() => overrides.result.promise),
    apply: overrides.apply,
    onLoadingChange: overrides.loading,
    onError: vi.fn(),
  };
}

describe('financial refresh coordinator', () => {
  it('starts a changed key immediately and ignores the older key response', async () => {
    const coordinator = createFinancialRefreshCoordinator<string>();
    const january = deferred<string>();
    const february = deferred<string>();
    const apply = vi.fn();
    const loading = vi.fn();
    const januaryRequest = request({ key: '2026-01', version: 0, result: january, apply, loading });
    const februaryRequest = request({ key: '2026-02', version: 0, result: february, apply, loading });

    const oldPromise = coordinator.refresh(januaryRequest);
    const newPromise = coordinator.refresh(februaryRequest);

    expect(januaryRequest.load).toHaveBeenCalledTimes(1);
    expect(februaryRequest.load).toHaveBeenCalledTimes(1);
    expect(coordinator.isCurrentKey('2026-02')).toBe(true);

    january.resolve('old');
    await oldPromise;
    expect(apply).not.toHaveBeenCalled();
    expect(loading).not.toHaveBeenLastCalledWith(false);

    february.resolve('new');
    await newPromise;
    expect(apply).toHaveBeenCalledOnce();
    expect(apply).toHaveBeenCalledWith('new');
    expect(loading).toHaveBeenLastCalledWith(false);
  });

  it('starts fresh when returning to a key whose older request is unresolved', async () => {
    const coordinator = createFinancialRefreshCoordinator<string>();
    const oldJanuary = deferred<string>();
    const february = deferred<string>();
    const newJanuary = deferred<string>();
    const apply = vi.fn();
    const loading = vi.fn();
    const oldRequest = request({ key: '2026-01', version: 0, result: oldJanuary, apply, loading });
    const middleRequest = request({ key: '2026-02', version: 0, result: february, apply, loading });
    const newRequest = request({ key: '2026-01', version: 0, result: newJanuary, apply, loading });

    coordinator.refresh(oldRequest);
    coordinator.refresh(middleRequest);
    const currentPromise = coordinator.refresh(newRequest);

    expect(newRequest.load).toHaveBeenCalledTimes(1);
    oldJanuary.resolve('stale January');
    await oldRequest.load.mock.results[0].value;
    expect(apply).not.toHaveBeenCalled();

    newJanuary.resolve('fresh January');
    await currentPromise;
    expect(apply).toHaveBeenCalledWith('fresh January');
    february.resolve('stale February');
  });

  it('queues exactly one trailing fetch for newer same-key invalidations', async () => {
    const coordinator = createFinancialRefreshCoordinator<string>();
    const beforeMutation = deferred<string>();
    const afterMutation = deferred<string>();
    const apply = vi.fn();
    const loading = vi.fn();
    const initial = request({ key: '2026-08', version: 0, result: beforeMutation, apply, loading });
    const invalidated = request({ key: '2026-08', version: 1, result: afterMutation, apply, loading });
    const newerInvalidation = { ...invalidated, version: 2 };

    const initialPromise = coordinator.refresh(initial);
    const trailingPromise = coordinator.refresh(invalidated);
    const sameTrailingPromise = coordinator.refresh(newerInvalidation);

    expect(trailingPromise).toBe(sameTrailingPromise);
    expect(invalidated.load).not.toHaveBeenCalled();

    beforeMutation.resolve('stale');
    await initialPromise;
    expect(apply).not.toHaveBeenCalled();
    expect(invalidated.load).toHaveBeenCalledTimes(1);

    afterMutation.resolve('fresh');
    await trailingPromise;
    expect(apply).toHaveBeenCalledOnce();
    expect(apply).toHaveBeenCalledWith('fresh');
  });

  it('coalesces event and explicit refresh calls for the same version', async () => {
    const coordinator = createFinancialRefreshCoordinator<string>();
    const result = deferred<string>();
    const apply = vi.fn();
    const loading = vi.fn();
    const fromEvent = request({ key: '2026-08', version: 7, result, apply, loading });
    const explicit = request({ key: '2026-08', version: 7, result, apply, loading });

    const eventPromise = coordinator.refresh(fromEvent);
    const explicitPromise = coordinator.refresh(explicit);

    expect(eventPromise).toBe(explicitPromise);
    expect(fromEvent.load).toHaveBeenCalledTimes(1);
    expect(explicit.load).not.toHaveBeenCalled();

    result.resolve('fresh');
    await eventPromise;
    expect(apply).toHaveBeenCalledOnce();
  });

  it('enters loading for key changes but not same-key background refreshes', async () => {
    const coordinator = createFinancialRefreshCoordinator<string>();
    const first = deferred<string>();
    const background = deferred<string>();
    const changed = deferred<string>();
    const apply = vi.fn();
    const loading = vi.fn();

    const firstPromise = coordinator.refresh(request({ key: '2026-08', version: 0, result: first, apply, loading }));
    expect(loading).toHaveBeenLastCalledWith(true);
    first.resolve('first');
    await firstPromise;
    loading.mockClear();

    const backgroundPromise = coordinator.refresh(request({ key: '2026-08', version: 0, result: background, apply, loading }));
    expect(loading).not.toHaveBeenCalledWith(true);
    background.resolve('background');
    await backgroundPromise;

    coordinator.refresh(request({ key: '2026-09', version: 0, result: changed, apply, loading }));
    expect(loading).toHaveBeenLastCalledWith(true);
    changed.resolve('changed');
  });
});
