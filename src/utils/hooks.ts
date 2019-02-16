import { useRef, useEffect } from 'react';
import * as swallowEquals from 'shallow-equal/objects';

function areDepsEqual(
  prev: ReadonlyArray<any>,
  current: ReadonlyArray<any>,
  isDepEqual: (prevDepValue: any, currentDepValue: any) => boolean,
): boolean {
  const currentLength = current.length;
  if (prev.length !== currentLength) {
    return false;
  }

  for (let i = 0; i < currentLength; i += 1) {
    if (!isDepEqual(prev[i], current[i])) {
      return false;
    }
  }

  return true;
}

function useSpecificMemo<T>(
  factory: () => T,
  deps: ReadonlyArray<any>,
  isDepEqual: (prevDepValue: any, currentDepValue: any) => boolean,
): T {
  const value = useRef<T | null>(null);
  const previousDeps = useRef(deps);

  if (value.current === null) {
    value.current = factory();
  }
  if (!areDepsEqual(previousDeps.current, deps, isDepEqual)) {
    previousDeps.current = deps;
    value.current = factory();
  }

  return value.current as T;
}

function useShallowEqualsMemo<T>(factory: () => T, deps: ReadonlyArray<any>): T {
  return useSpecificMemo(factory, deps, swallowEquals);
}

function useUnmount(factory: () => void) {
  useEffect(() => {
    return factory;
  }, []);
}

export { useSpecificMemo, useShallowEqualsMemo, useUnmount };
