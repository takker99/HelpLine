//
// HelpLineの設定画面でデータを扱う
//

function hash(str) { // 文字列を0〜99のハッシュに変換
  const md5 = crypto.createHash("md5");
  return parseInt(md5.update(str).digest("hex").substring(0, 4), 16) % 100;
}

//
// chrome.storage のデータをローカルファイルにセーブ
//
function save() {
  chrome.storage.local.get(null, function (items) { // nullだと全データ読み込み
    const data = {};
    for (const key in items) { // "suggests0" ～ "suggests255"
      const val = items[key];
      for (const entrykey in val) {
        const cmd = val[entrykey];
        data[entrykey] = cmd;
      }
    }
    const result = JSON.stringify(data);
    const url = "data:application/json;base64," +
      btoa(unescape(encodeURIComponent(result)));
    chrome.downloads.download({
      url: url,
      filename: "helpfeel.json",
    });
  });
}

//
// ローカルファイルからデータを読出して chrome.storage にデータを足す
//
function handleFileSelect(evt) {
  const f = evt.target.files[0];
  const reader = new FileReader();
  reader.onload = function (e) {
    const helpdata = JSON.parse(e.target.result);

    const suggests = [];
    for (let i = 0; i < 100; i++) {
      suggests[i] = {};
    }

    const suggestnames = [];
    for (let i = 0; i < 100; i++) {
      suggestnames[i] = `suggests${i}`;
    }
    chrome.storage.local.get(suggestnames, function (value) {
      for (let i = 0; i < 100; i++) {
        const suggest_n = `suggests${i}`;
        if (value[suggest_n]) {
          for (const desc in value[suggest_n]) {
            suggests[i][desc] = value[suggest_n][desc];
          }
        }
      }
      for (const desc in helpdata) {
        const cmd = helpdata[desc];
        const h = hash(cmd);
        suggests[h][desc] = cmd;
      }

      for (let i = 0; i < 100; i++) {
        const setval = {};
        setval[`suggests${i}`] = suggests[i];
        chrome.storage.local.set(setval, function () {});
      }
    });
  };

  reader.readAsText(f);
}

//
// chrome.storage のデータ消去
//
function clear() {
  chrome.storage.local.clear();
}

$(function () {
  $("#save").on("click", save);
  $("#read").on("change", handleFileSelect);
  $("#clear").on("click", clear);
});
