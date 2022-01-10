import { createHash } from "https://deno.land/std@0.120.0/hash/mod.ts";

/** 文字列を0〜99のハッシュに変換 */
export function hash(str: string) {
  const md5 = createHash("md5");
  return parseInt(md5.update(str).toString().substring(0, 4), 16) % 100;
}
