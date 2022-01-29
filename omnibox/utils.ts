import { browser } from "./deps/webextension.ts";

type PickRequired<T, K extends keyof T> =
  & T
  & {
    [P in K]-?: T[P];
  };
export function ensureTabId(
  tab: browser.Tabs.Tab,
): asserts tab is PickRequired<browser.Tabs.Tab, "id"> {
  if (tab.id !== undefined) return;
  throw TypeError("The value must has id.");
}

export function hasItem<T>(list: T[]): list is [T, ...T[]] {
  return list.length > 0;
}

export type OneByOneResult<T> = {
  state: "fulfilled";
  value: T;
} | {
  state: "rejected";
  reason: unknown;
};

/** Promiseを解決した順に返す函数 */
export async function* oneByOne<T>(
  promises: Iterable<Promise<T>>,
) {
  const queue = [] as OneByOneResult<T>[];
  let resolve: ((item: OneByOneResult<T>) => void) | undefined;
  const push = (item: OneByOneResult<T>) => {
    if (!resolve) {
      queue.push(item);
      return;
    }
    resolve(item);
    resolve = undefined;
  };
  const pop = () => {
    if (queue.length > 0) {
      return Promise.resolve(queue.pop()!);
    }
    return new Promise<OneByOneResult<T>>((res) => resolve = res);
  };

  let count = 0;
  for (const promise of promises) {
    promise
      .then((value) =>
        push({
          state: "fulfilled",
          value,
        })
      )
      .catch((reason) =>
        push({
          state: "rejected",
          reason,
        })
      );
    count++;
  }

  for (let i = 0; i < count; i++) {
    yield await pop();
  }
}
