//
//  https://developer.chrome.com/extensions/omnibox のサンプルをもとにしている
//

//
// https://developer.mozilla.org/ja/docs/Mozilla/Add-ons/WebExtensions/API/omnibox
// manifest.jsonに "omnibox": { "keyword" : "/" } というエントリを書いておくと、
// '/' と' 'を押したとき onInputChanged でキー入力を取得できるようになる
//
/// <reference no-default-lib="true" />
/// <reference lib="esnext" />
/// <reference lib="dom" />

import { Generator } from "./deps/re_expand.js";
import { browser } from "./deps/webextension.ts";
import { ensureTabId } from "./utils.ts";
import { getData } from "./storage.ts";

//
// browserActionボタンを押したときcontent_script.jsにメッセージを送る
//
browser.browserAction.onClicked.addListener(async (tab) => {
  ensureTabId(tab);
  await browser.tabs.sendMessage(tab.id, {
    type: "CLICK_POPUP",
    message: "message",
  });
});

//
// ユーザがomniboxで何か入力したとき呼ばれるもの
//
browser.omnibox.onInputChanged.addListener(async (text, suggest) => {
  const data = await getData(null);

  const candidates = search(text, data);
  console.log(candidates);
  suggest(candidates);

  // よく使うものはトップに出るようにするとか
  // data.unshift({content: "aaaaa", description: "bbbbb"})
  // 学習させておくのは良いかも
});

function search(
  text: string,
  suggests: Record<string, [string, ...string[]]>,
  limit = 10,
) {
  const results = [] as browser.Omnibox.SuggestResult[];
  for (const [command, descriptions] of Object.entries(suggests)) {
    for (
      const generator of descriptions.map((description) =>
        new Generator(description)
      )
    ) {
      try {
        const descs = generator.filter(` ${text} `).flatMap((pairs) =>
          pairs.map(([desc]) => desc)
        );
        if (descs.length > 0) {
          results.push(
            ...descs.map((description) => ({ description, content: command })),
          );
          // 候補を表示 数を制限しないと候補が出ないようだ
          if (results.length >= limit) return results.slice(0, limit);
        }
      } catch (e: unknown) {
        // TypeErrorがGeneratorで発生したら飛ばす
        if (!(e instanceof TypeError)) throw e;
      }
    }
  }
  return results.slice(0, limit);
}

//
// ユーザがメニューを選択したとき呼ばれるもの
//
browser.omnibox.onInputEntered.addListener(async (text) => {
  if (text.match(/^http/)) {
    window.open(text); // location.href = は動かない
  } else {
    const response = await fetch("https://goquick.org"); // GoQuick.orgユーザはGoQuick.orgを利用
    const data = await response.text();
    if (data.match("GoQuick Login")) {
      window.open(`https://google.com/search?q=${text}`);
    } else {
      window.open(`http://goquick.org/${text}`);
    }
  }
});
