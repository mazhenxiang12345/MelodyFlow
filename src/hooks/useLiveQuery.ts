import { useEffect, useState } from 'react';
import { liveQuery } from 'dexie';

export function useLiveQuery<T>(querier: () => T | Promise<T>, deps: any[] = []): T | undefined {
  const [value, setValue] = useState<T | undefined>(undefined);

  useEffect(() => {
    const observable = liveQuery(querier);
    const subscription = observable.subscribe({
      next: (val) => setValue(val),
      error: (err) => console.error('LiveQuery error:', err),
    });

    return () => subscription.unsubscribe();
  }, deps);

  return value;
}
