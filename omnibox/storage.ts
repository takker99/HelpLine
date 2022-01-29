/// <reference no-default-lib="true" />
/// <reference lib="esnext" />
/// <reference lib="dom" />

import { browser } from "./deps/webextension.ts";

export interface Suggest {
  descriptions: [string, ...string[]];
  command: string;
}

export async function setData(suggests: Iterable<Suggest>) {
  const items = {} as Record<string, [string, ...string[]]>;
  for (const { command, descriptions } of suggests) {
    items[command] = [
      ...(items[command] ?? []),
      ...descriptions.map((description) => description.replace(/[\[\]]/g, "")),
    ];
  }

  // 既に存在するデータとmergeする
  for (
    const [command, descriptions] of Object.entries(
      await getData(Object.keys(items)),
    )
  ) {
    items[command] = [...descriptions, ...items[command]];
  }

  await browser.storage.local.set(items);
}

export async function getData(
  commands: string[] | null,
) {
  const values = await browser.storage.local.get(commands);
  return values as Record<string, [string, ...string[]]>;
}
