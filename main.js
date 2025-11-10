import { MersenneTwister } from "./MersenneTwister.js";

class MainLogic
{
  static rarityTable = ["N", "R", "SR", "SSR", "UR" ,"LR"];
  static baseWeights = [60, 30, 8, 1, 0.75, 0.25];
   // レアリティごとのアイテム
  static itemsByRarity = {
  };
}

function callMainAction(count) {
  // 入力値（1〜6）
  const level = parseInt(document.getElementById("rarityLevel").value);

  // 入力欄から確率を取得
  const probabilities = [];

  for(let i = 0; i < level; i++ ) {
    probabilities.push(parseFloat(document.getElementById("prob"+ MainLogic.rarityTable[i]).value));
  }
    
  // 合計チェック
  const total = probabilities.slice(0, level).reduce((a, b) => a + b, 0);
  if (Math.abs(total - 100) > 0.01) {
    document.getElementById("result").textContent = "合計が100%になるように設定してください！ (現在: " + total.toFixed(1) + "%)";
    return;
  }

  //乱数生成
  const mt = new MersenneTwister(Date.now());
  
  //計算に使う変数の作成
  const resultLen = [];

  //countに応じたループ(n連実装部)
  for(let i = 0; i < count; i++ ){
    //1抽選毎に初期化
    let rand = mt.random()*100;
    let cumulative = 0;
    let rarity = "";

    //レアリティ抽選
    for (let j = 0; j < level; j++) {
      //確率を加算して何回目で当たったかでレアリティを確定(N→0~60まで R60以上60+n以下)
      cumulative += probabilities[j];

      //当たった時の処理
      if (rand < cumulative) {
        rarity = MainLogic.rarityTable[j];
        break;
      }
    }

    // レアリティ内のアイテム抽選(Nの「○○」が何かを抽選)
    const itemList = MainLogic.itemsByRarity[rarity] || [];
    let item = "はずれ";
    if (itemList.length > 0) {
      const selected = itemList[Math.floor(mt.random() * itemList.length)];
      // 空文字なら「はずれ」にする
      item = selected && selected.trim() !== "" ? selected : "はずれ";
    }

    resultLen.push({ rarity, item });
  }
  //チェックボックスの状態を確認
  const combine = document.getElementById("combineDuplicates").checked;
  const tbody = document.getElementById("resultBody");
  tbody.innerHTML = ""; // 一旦クリア

  if (combine) {
    // 重複をまとめる
    const summary = {};

    for (const res of resultLen) {
      const key = `${res.rarity}：${res.item}`;
      summary[key] = (summary[key] || 0) + 1;
    }

    for (const [key, val] of Object.entries(summary)) {
      const [rarity, item] = key.split("：");
      const tr = document.createElement("tr");
      tr.innerHTML = `<td>${rarity}</td><td>${item}</td><td>×${val}個</td>`;
      tbody.appendChild(tr);
    }
  } else {
    // 重複をまとめない
    for (const res of resultLen) {
      const tr = document.createElement("tr");
      tr.innerHTML = `<td>${res.rarity}</td><td>${res.item}</td><td>×1個</td>`;
      tbody.appendChild(tr);
    }
  }
}

function updateLabels() {
  //レアリティの数を取得
  const level = parseInt(document.getElementById("rarityLevel").value);

  //表示を変更する為のテーブルを取得
  const container =  document.getElementById("table");

  //現在の中身を消去
  container.innerHTML="";

  // 選択レベルに応じた合計
  const selectedWeights = MainLogic.baseWeights.slice(0, level);
  const totalWeight = selectedWeights.reduce((a,b)=>a+b, 0);

  //レアリティの数だけ取得し、格納する
  for (let i = 0; i < level; i++) {
    const name = MainLogic.rarityTable[i];
    
    // 自動計算して value に設定
    let resultValue = (selectedWeights[i] / totalWeight * 100).toFixed(2);

    const label = document.createElement("label");
    label.innerHTML = `${name}: <input id="prob${name}" type="number" value="${resultValue}" step="0.1"> %`;
    container.appendChild(label);
    container.appendChild(document.createElement("br"));
  }
}

function showLineup(level) {
  const table = document.getElementById("lineup-table");
  table.innerHTML = ""; // 表をクリア

  const totalCount = parseInt(document.getElementById("lineupNum").value) || 1;

  // --- 表ヘッダー ---
  const thead = document.createElement("thead");
  const headerRow = document.createElement("tr");

  const thRarity = document.createElement("th");
  thRarity.textContent = "レアリティ（変更可）";
  const thItem = document.createElement("th");
  thItem.textContent = "アイテム名（編集可）";
  const thCount = document.createElement("th");
  thCount.textContent = "個数";

  headerRow.appendChild(thRarity);
  headerRow.appendChild(thItem);
  headerRow.appendChild(thCount);
  thead.appendChild(headerRow);
  table.appendChild(thead);

  // --- 表本体 ---
  const tbody = document.createElement("tbody");

  // すべてのアイテムをフラットに取得
  const allItems = [];
  for (let i = 0; i < level; i++) {
    const rarity = MainLogic.rarityTable[i];
    const items = MainLogic.itemsByRarity[rarity] || [];
    items.forEach(item => {
      allItems.push({ rarity, item });
    });
  }

  // totalCount に合わせて行を作る
  for (let i = 0; i < totalCount; i++) {
    const data = allItems[i] || { rarity: "N", item: "" }; // 空白はN
    const row = document.createElement("tr");

    // ▼ レアリティプルダウン
    const rarityCell = document.createElement("td");
    const select = document.createElement("select");
    MainLogic.rarityTable.forEach(r => {
      const option = document.createElement("option");
      option.value = r;
      option.textContent = r;
      if (r === data.rarity) option.selected = true;
      select.appendChild(option);
    });
    select.addEventListener("change", e => {
      const newRarity = e.target.value;
      // 元の配列から削除
      if (MainLogic.itemsByRarity[data.rarity]) {
        const index = MainLogic.itemsByRarity[data.rarity].indexOf(data.item);
        if (index >= 0) MainLogic.itemsByRarity[data.rarity].splice(index, 1);
      }
      // 新しいレアリティに追加
      if (!MainLogic.itemsByRarity[newRarity]) MainLogic.itemsByRarity[newRarity] = [];
      MainLogic.itemsByRarity[newRarity].push(data.item);
      showLineup(level);
    });
    rarityCell.appendChild(select);

    // ▼ アイテム名テキストボックス
    const itemCell = document.createElement("td");
    const input = document.createElement("input");
    input.type = "text";
    input.value = data.item;
    input.style.width = "200px";
    input.addEventListener("input", e => {
      if (!MainLogic.itemsByRarity[data.rarity]) MainLogic.itemsByRarity[data.rarity] = [];
      const idx = MainLogic.itemsByRarity[data.rarity].indexOf(data.item);
      if (idx >= 0) MainLogic.itemsByRarity[data.rarity][idx] = e.target.value;
      data.item = e.target.value;
    });
    itemCell.appendChild(input);

    // ▼ 個数入力欄
    const countCell = document.createElement("td");
    const countInput = document.createElement("input");
    countInput.type = "number";
    countInput.min = 1;
    countInput.value = 1;
    countInput.style.width = "50px";
    countCell.appendChild(countInput);

    row.appendChild(rarityCell);
    row.appendChild(itemCell);
    row.appendChild(countCell);
    tbody.appendChild(row);
  }

  table.appendChild(tbody);

  // --- 表スタイル ---
  table.style.borderCollapse = "collapse";
  table.style.marginTop = "10px";
  table.querySelectorAll("th, td").forEach(cell => {
    cell.style.border = "1px solid black";
    cell.style.padding = "4px 8px";
  });  
}

  

// イベント登録
window.addEventListener("DOMContentLoaded", () => {
  const level = parseInt(document.getElementById("rarityLevel").value) || 1;
  showLineup(level);

  // 行数変更時に再描画
  document.getElementById("lineupNum").addEventListener("change", () => {
  const level = parseInt(document.getElementById("rarityLevel").value);
  showLineup(level);
  });
  
  //rarityLevelが変更された時
  document.getElementById("rarityLevel").addEventListener("change", () => {
    updateLabels();
    const level = parseInt(document.getElementById("rarityLevel").value);
    showLineup(level);
  });

  //gachaSingleがクリックされた時
  document.getElementById("gachaSingle").addEventListener("click", () => callMainAction(1));

  //gachaTenがクリックされた時
  document.getElementById("gachaTen").addEventListener("click", () => callMainAction(10));

  //gachaCustomがクリックされた時
  document.getElementById("gachaCustom").addEventListener("click", () => {
    const count = parseInt(document.getElementById("gachaCount").value) || 1;
    callMainAction(count);
  });
});