/// <reference no-default-lib="true" />
/// <reference lib="esnext" />
/// <reference lib="dom" />
import "https://esm.sh/re_expand@0.2.0";
import { hash } from "./hash.ts";

let suggests = [];
for (let i = 0; i < 100; i++) {
  suggests[i] = {};
}
const suggestnames = [];
for (let i = 0; i < 100; i++) {
  suggestnames[i] = `suggests${i}`;
}

let descs = [];

const status = $("<div>")
  .css("position", "absolute")
  .css("width", "100%")
  .css("height", "18pt")
  .css("top", `${$(window).height() - 18}px`)
  .css("left", "0pt")
  .css("background-color", "#ffd")
  .appendTo($("body"))
  .hide();

function terminate_def(cmd) {
  const h = hash(cmd);
  if (descs.length > 0) {
    for (l of descs) {
      const m = l.match(/^\?\s+(.*)/);
      expanded = m[1].replace(/[\[\]]/g, "").expand(); // Helpfeel記法の正規表現を展開
      for (s of expanded) {
        suggests[h][s] = cmd;
      }
    }
    const setval = {};
    setval[`suggests${h}`] = suggests[h];
    chrome.storage.local.set(setval, function () {});
  }
  descs = [];
}

function register_page() {
  const cmd = location.href;
  const h = hash(cmd);

  const desc = window.prompt(`Help説明文を入力`, document.title);
  if (desc) {
    const expanded = desc.expand(); // Helpfeel記法の正規表現を展開
    for (const s of expanded) {
      status.text(s);
      suggests[h][s] = cmd;
    }
    const setval = {};
    setval[`suggests${h}`] = suggests[h];
    chrome.storage.local.set(setval, function () {});
  } else if (desc == "") { // 空文字列入力
    alert(`ヘルプを消去します (${cmd})`);
    status.hide();
    // suggests[h][s] == cmd のものを削除
    const name = `suggests${h}`;
    chrome.storage.local.get(name, function (value) {
      suggests = value[name];
      for (const x in suggests) {
        if (suggests[x].match(cmd)) {
          delete suggests[x];
        }
      }
      const setval = {};
      setval[name] = suggests;
      chrome.storage.local.set(setval, function () {});
    });
  } else { // desc == null (キャンセル)
  }
}

function process(lines, project, ask) {
  //
  // Scrapboxページの内容を1行ずつ調べてHelpfeel記法を処理する
  //
  descs = []; // Helpfeel記法
  const title = lines[0].text;
  let found = false;
  for (const entry of lines) {
    const line = entry.text;
    if (line.match(/^\?\s/)) { // ? ではじまるHelpfeel記法
      desc = line.replace(/^\?\s+/, "");
      status.text(decodeURIComponent(`${title} - ${desc}`));
      descs.push(line);
      found = true;
    } else if (line.match(/^\%\s/)) { // % ではじまるコマンド指定
      if (descs.length == 0) {
        alert(`Helpfeel記法が定義されていません - ${title} / ${line}`);
      } else {
        m = line.match(/^\%\s+(echo|open)\s+(.*)/);
        if (m) {
          terminate_def(m[2]);
        }
        descs = [];
      }
    } else {
      terminate_def(`https://scrapbox.io/${project}/${title}`);
    }
  }
  terminate_def(`https://scrapbox.io/${project}/${title}`);

  if (!found && ask) {
    register_page();
  }
}

//
// コールバックでbackground.jsからの値を受け取る
//
chrome.runtime.onMessage.addListener((message) => {
  if (message.type !== "CLICK_POPUP") {
    return;
  }

  status.text("");
  status.show();

  chrome.storage.local.get(suggestnames, function (value) {
    for (let i = 0; i < 100; i++) {
      if (value[`suggests${i}`]) {
        suggests[i] = value[`suggests${i}`];
      }
    }

    ms = location.href.match(/scrapbox\.io\/([a-zA-Z0-9\-]+)(\/(.*))?$/);
    mg = location.href.match(/gyazo\.com\/([0-9a-f]{32})/i);
    if (ms && ms[1]) {
      const project = ms[1];
      const title = ms[3];
      if (!title) { // ページリスト
        fetch(`https://scrapbox.io/api/pages/${project}?limit=1000`)
          .then(function (response) {
            return response.json();
          })
          .then(function (json) {
            for (const page of json.pages) {
              const title = page.title;
              console.log(title);
              fetch(`https://scrapbox.io/api/pages/${project}/${title}`)
                .then(function (response) {
                  return response.json();
                })
                .then(function (json) {
                  process(json.lines, project, false);
                });
            }
          });
      } else { // 単独ページ
        fetch(`https://scrapbox.io/api/pages/${project}/${title}`)
          .then(function (response) {
            return response.json();
          })
          .then(function (json) {
            process(json.lines, project, true);
          });
      }
    } else if (mg && mg[1]) { // GyazoページにHelpfeel記述があれば登録
      gyazoid = mg[1];
      // lines = $('.image-desc-display').text().split(/\n/)
      if ($(".image-desc-display")[0]) {
        lines = $(".image-desc-display")[0].innerHTML.split("<br>"); // これは苦しい!
        descs = [];
        for (const line of lines) {
          if (line.match(/^\?\s/)) { // ? ではじまるHelpfeel記法
            desc = line.replace(/^\?\s+/, "");
            descs.push(line);
            status.text(decodeURIComponent(`${desc}`));
          }
        }
        if (descs.length > 0) {
          terminate_def(`https://gyazo.com/${gyazoid}`);
        } else {
          register_page();
        }
      } else {
        register_page();
      }
    } else {
      register_page();
    }

    setTimeout(function () {
      status.hide();
    }, 10000);
  });
});
