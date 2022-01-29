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

import { Asearch } from "https://raw.githubusercontent.com/takker99/deno-asearch/0.2.1/mod.ts";
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
): browser.Omnibox.SuggestResult[] {
  const matches = [[], [], [], []] as [
    [string, string][],
    [string, string][],
    [string, string][],
    [string, string][],
  ];
  const { match } = Asearch(` ${text} `);
  for (const [command, descriptions] of Object.entries(suggests)) {
    for (const description of descriptions) {
      const result = match(description);
      if (!result.found) continue;
      matches[result.distance].push([description, command]);
    }
    if (matches[0].length >= limit) break;
  }
  return matches.flat().map(([description, content]) => ({
    description,
    content,
  }));
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
