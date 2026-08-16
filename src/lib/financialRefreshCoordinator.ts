export interface FinancialRefreshRequest<T> {
  key: string;
  version: number;
  load: () => Promise<T>;
  apply: (value: T) => void;
  onLoadingChange: (isLoading: boolean) => void;
  onError: (error: unknown) => void;
}

interface Deferred {
  promise: Promise<void>;
  resolve: () => void;
}

interface PendingRefresh<T> {
  request: FinancialRefreshRequest<T>;
  deferred: Deferred;
}

interface ActiveRefresh<T> {
  version: number;
  promise: Promise<void>;
  pending: PendingRefresh<T> | null;
}

function createDeferred(): Deferred {
  let resolve!: () => void;
  const promise = new Promise<void>(next => { resolve = next; });
  return { promise, resolve };
}

export function createFinancialRefreshCoordinator<T>() {
  const activeByKey = new Map<string, ActiveRefresh<T>>();
  let currentKey: string | null = null;

  function start(request: FinancialRefreshRequest<T>, showLoading: boolean) {
    if (showLoading) request.onLoadingChange(true);

    const active: ActiveRefresh<T> = {
      version: request.version,
      promise: Promise.resolve(),
      pending: null,
    };
    activeByKey.set(request.key, active);

    active.promise = (async () => {
      try {
        const result = await request.load();
        const wasInvalidated = active.pending !== null
          && active.pending.request.version > active.version;
        const isLatestRequestForKey = activeByKey.get(request.key) === active;
        if (currentKey === request.key && isLatestRequestForKey && !wasInvalidated) request.apply(result);
      } catch (error) {
        request.onError(error);
      } finally {
        if (activeByKey.get(request.key) === active) {
          activeByKey.delete(request.key);
          const pending = active.pending;
          if (pending && currentKey === request.key) {
            const trailing = start(pending.request, false);
            void trailing.then(pending.deferred.resolve);
          } else {
            pending?.deferred.resolve();
            if (currentKey === request.key) request.onLoadingChange(false);
          }
        }
      }
    })();

    return active.promise;
  }

  function refresh(request: FinancialRefreshRequest<T>): Promise<void> {
    const keyChanged = currentKey !== request.key;
    if (keyChanged) {
      currentKey = request.key;
      activeByKey.get(request.key)?.pending?.deferred.resolve();
      return start(request, true);
    }

    const active = activeByKey.get(request.key);
    if (!active) return start(request, false);

    if (request.version <= active.version) return active.promise;
    if (active.pending) {
      if (request.version > active.pending.request.version) {
        active.pending.request = request;
      }
      return active.pending.deferred.promise;
    }

    const deferred = createDeferred();
    active.pending = { request, deferred };
    return deferred.promise;
  }

  return {
    refresh,
    isCurrentKey: (key: string) => currentKey === key,
  };
}
