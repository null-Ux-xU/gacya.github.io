import { gachaLogic } from "./GachaLogic/gacha.js";
import { sortByRarityFromN, sortByRarityFromLR } from "./GachaLogic/sort.js";
import { arraySummary } from "./GachaLogic/arraySummary.js";
import { createTableElement } from "./Create/createTableElement.js";
import {saveDataToLocalStorage, getDataFromLocalStorage} from "./DataSave/localStrage.js";
import {createTableHeader} from "./Create/createTableHeader.js";
import {importZipFile, getResultItemsToFile} from "./DataSave/importZip.js";
import {saveToIndexedDB, loadFromIndexedDB, clearAllIndexedDBData, showAllIndexedDBData} from "./DataSave/indexedDB.js";

class MainData
{

  //---変更されないデータ群----

  //レアリティのベース
  static rarityTable = ["N", "R", "SR", "SSR", "UR" ,"LR"];
  
  //レアリティ名、排出確率のヘッダーテキスト
  static rarityDisplayHeaderTextArray = ["表示名（編集可）", "排出確率（%）"]; 

  //アイテムのレアリティと名前編集のヘッダーテキスト
  static itemDisplayHeaderTextArray = ["レアリティ（変更可）","アイテム名（編集可）"];

  //デフォルトの確率
  static baseWeights = {
    N: 55, 
    R: 30,
    SR: 10,
    SSR: 3,
    UR: 1.5,
    LR: 0.5
  };

  //結果ツイートURL
  static tweetUrl = `https://twitter.com/intent/tweet`;

  //DBに保存されているkeyの一覧
  static dataKey = new Array;

  //現在読み込んでいるデータのkey
  static onLoadedDatakey = "";

  //データ消去の警告文
  static deleteMassage ="以下のデータが全て削除されます。よろしいですか？\n・ガチャの名前\n・読み込んだファイル\n・レアリティ表示名\n・排出確率\n・排出アイテム";
  //------------------------
  
  //---ユーザーの操作によって自由に変更されるデータ群-----

  //ガチャの名前(連想配列でdatakeyと紐づける)
  static gachaName = new Map;

  //レアリティ総数
  static rarityNum = 6;

  //ラインナップ総数
  static itemLineupNum = 5;

  //レアリティの表示変更用
  static rarityDisplayNames = {
    N: "N",
    R: "R",
    SR: "SR",
    SSR: "SSR",
    UR: "UR",
    LR: "LR"
  };

  //アイテム名とそのレアリティ
  static resultItems = {};

  //ユーザーが設定したレアリティの確率
  static editableWeights = [];
  //------------------------

  /**
   * 編集可能な値全てを取得する
   * 
   * @returns 編集可能な変数名をキーとした連想配列
   */
  static getEditableDatas() {
    const datas = {
      rarityNum: this.rarityNum,
      itemLineupNum: this.itemLineupNum,
      rarityDisplayNames: this.rarityDisplayNames,
      resultItems: this.resultItems,
      editableWeights: this.editableWeights
    }
    return datas; 
  }

  /**
   * 編集可能な値全てに対して値をセットする
   * 
   * @param {Object} datas  編集可能な変数名をキーとした連想配列
   */
  static setEditableDatas({ 
      rarityNum = null,
      itemLineupNum = null,
      rarityDisplayNames = null,
      resultItems = null,
      editableWeights = null 
    } = {}) {
    this.rarityNum = rarityNum ?? 6;
    this.itemLineupNum = itemLineupNum ?? 5;
    this.resultItems = structuredClone(resultItems || {});
    this.editableWeights = structuredClone(editableWeights || {});
    if(rarityDisplayNames) {
      this.rarityDisplayNames = structuredClone(rarityDisplayNames);
    }
    else{
      this.rarityDisplayNames = {
        N: "N",
        R: "R",
        SR: "SR",
        SSR: "SSR",
        UR: "UR",
        LR: "LR"
      };
    }
    //HTMLに対して値の変更を反映
    const elementRarityNum = document.getElementById("rarityNum");
    elementRarityNum.value = this.rarityNum;
    elementRarityNum.options[elementRarityNum.value - 1];
    document.getElementById("lineupNum").value = this.itemLineupNum;
    updateLabels();
    showLineup();
  }

  /**
   * 編集可能な値の初期化
   */
  static initDefaultValue(){
    MainData.onLoadedDatakey = "";
    this.setEditableDatas();
  }


  //デバッグ用
  static debugMainData() {
    let msg = "MainData Debug\n\n";

    msg += "[rarityNum]:";
    msg += `${MainData.rarityNum}\n`;

    msg += "[itemLineupNum]:";
    msg += `${MainData.itemLineupNum}\n`;

    msg += "[editableWeights]\n";

    for (const [r, v] of Object.entries(this.editableWeights)) {
      msg += `  ${r}: ${v}\n`;
    }

    msg += "\n";
    msg += "[rarityDisplayNames]\n";

    for (const [r, v] of Object.entries(this.rarityDisplayNames)) {
      msg += `  ${r}: ${v}\n`;
    }

    msg += "\n";
    msg += "[resultItems]\n";

    for (const [indexKey, itemObj] of Object.entries(this.resultItems)) {
      const name = itemObj.itemName || "[\"空文字列\"]";
      const rarity = itemObj.rarity || "(no rarity)";
      msg += `  ${indexKey}: [Rarity: ${rarity}] ${name}\n`;
    }

    msg += "[dataKey]\n";
  
    for(let i = 0; i < MainData.dataKey.length; i++){
      msg += `${i} : ${MainData.dataKey[i] || "none"}\n`;
    }


    msg += "\n";
    msg += "[gachaName]\n";

    for (const [indexKey, value] of this.gachaName) {
      const name = value || "[\"空文字列\"]";
      
      msg += `  ${indexKey}: ${name}\n`;
    }
    msg += "\n";
    msg += `[onLoadedDatakey]:${MainData.onLoadedDatakey}`;

    console.log(msg);
  }
}

/**
 * ガチャシステム
 * 
 * @param {int} count ガチャ回数
 */
async function callMainAction(count) {
  //入力欄から確率を取得
  const probabilities = MainData.rarityTable.slice(0, MainData.rarityNum).map(r => {
    return parseFloat(document.getElementById(r + "-Probability").value);
  });
  
  // 合計チェック
  const total = calcTotalValue(probabilities);
  if (Math.abs(parseFloat(total - 100)) > 0.01) {
    alert("合計確率が100%になるように設定してください！ (現在: " + parseFloat(total.toFixed(2)) + "%)");
    return;
  }

  //ガチャの処理
  let resultLen = gachaLogic({
    gachaCount: count,
    probabilities: probabilities,
    rarityNum: MainData.rarityNum,
    rarityTable: MainData.rarityTable,
    resultItems: MainData.resultItems,
    itemLineupNum: MainData.itemLineupNum,
    isFilterOnlyActiveItems: document.getElementById("isFilterOnlyActiveItems")?.checked
  });

  //レアリティソート
  switch(getSortType()) {
    case "desc": 
      sortByRarityFromLR(resultLen, MainData.rarityTable);
      break;

    case "asc":
    sortByRarityFromN(resultLen, MainData.rarityTable);
    break;

    case "none": break;
  };

  //重複をまとめた表示
  if (document.getElementById("combineDuplicates")?.checked) {
    resultLen = arraySummary(resultLen);
  }

  //表示処理
  const resultIndexNo = [];
  const tbody = document.getElementById("resultBody");
  tbody.replaceChildren(); 
  const name = MainData.gachaName.get(MainData.onLoadedDatakey) ?? document.getElementById("gachaName").value;
  let resultText = `ガチャ名:[${name?.trim() || "なし"}]${count}連\n` ?? "";
  for (const res of resultLen) {
    tbody.insertAdjacentHTML(
      "beforeend",
      `<tr><td>${MainData.rarityDisplayNames[res.rarity]}</td><td>${res.item}</td><td>×${res.val || 1}個</td></tr>`
    );
    console.log(`${res.indexNo}`);
    const index = parseInt(res.indexNo?.split(".")[1] ?? -1, 10);
    resultIndexNo.push(index);
    console.log(index);

    resultText += `${MainData.rarityDisplayNames[res.rarity]}：${res.item} ×${res.val || 1}個\n`;
  }
  document.getElementById("resultElements").hidden = false;
  
  const twitterTag = "#空のつーる";
  resultText += twitterTag; 
  MainData.tweetUrl = `https://twitter.com/intent/tweet?text=${encodeURIComponent(resultText)}`;

  if(MainData.onLoadedDatakey){
    await getResultItemsToFile(MainData.onLoadedDatakey, resultIndexNo);
  }
  else {
    const anchor = document.getElementById("downloadZipBtn");
    anchor.hidden = true;
    anchor.style.display = "none";
  }
  
}

function updateLineupToZip(id) {
  if(MainData.dataKey.length > 0) {
    const loadZipNameElement = document.getElementById("loadZipName");
    if (!loadZipNameElement) return;
    loadZipNameElement.replaceChildren();
    const fragment = document.createDocumentFragment();

    for(const [key ,value] of MainData.gachaName.entries()){
      const option = document.createElement("option");
      option.value = key;
      option.textContent = value;
      if(id === key)option.selected = true;
      fragment.appendChild(option);
    }

    const stringValue = "新規データ";
    const option = document.createElement("option");
    option.value = stringValue;
    option.textContent = stringValue;
    if(id === undefined || id === null) option.selected = true;
    fragment.appendChild(option);

    loadZipNameElement.appendChild(fragment);
  }
}

/**
 * レアリティ名と排出確率を表示する
 */
function updateLabels() {
   //id=tableのタグを取得し、中身を消す
  const container = document.getElementById("rarityTable");
  container.replaceChildren();

  //テーブルtagを生成
  const table = document.createElement("table");
  table.style.borderCollapse = "collapse"; 
  table.style.marginTop = "10px";

  //ヘッダーの作成と追加
  table.appendChild(createTableHeader(MainData.rarityDisplayHeaderTextArray));
  
  //bodyの作成
  const tbody = document.createElement("tbody");

  //表示される確率の格納
  const baseWeights = MainData.rarityTable.slice(0, MainData.rarityNum).map(rarity => MainData.baseWeights[rarity]);
  const editableWeights = MainData.rarityTable.slice(0, MainData.rarityNum).map(rarity => MainData.editableWeights[rarity]);

  //失われた値を最高レアリティに追加
  baseWeights[MainData.rarityNum - 1] += parseFloat(100 - calcTotalValue(baseWeights));

  //レアリティの数だけ入力欄を作成
  for (let i = 0; i < MainData.rarityNum; i++) {
    const rarity = MainData.rarityTable[i];
    const displayName = MainData.rarityDisplayNames[rarity];
    const resultValue = editableWeights[i]?.toFixed(2) || baseWeights[i].toFixed(2);
    const row = document.createElement("tr");
    
    //表示名入力
    const  tdNameInput = createTableElement({
      elementId: rarity + "-DisplayName",
      elementName: "editRarityDisplayNameForm",
      inputType: "text",
      inputValue: displayName,
      ariaLabel: "レアリティ" + rarity + "を任意の文字に置き換える為の入力欄",
    });
    tdNameInput.addEventListener("input", onNameInput);

    //確率入力
    const  tdProbInput = createTableElement({
      elementId: rarity + "-Probability",
      elementName: "editRarityProbabilityForm",
      inputType: "number",
      inputValue: resultValue,
      ariaLabel: "レアリティ" + rarity + "の排出確率を入力する欄",
      divWrapperName: "ProbabilityWrapper",
      step: parseFloat(0.1)
    });
    tdProbInput.addEventListener("input", onProbInput);

    //作成したエレメントを追加
    row.appendChild(tdNameInput);
    row.appendChild(tdProbInput);
    tbody.appendChild(row);
  }

  table.appendChild(tbody);
  container.appendChild(table);
}


/**
 * 排出アイテムを作成する
 */
function showLineup() {
  //lineupTableの取得と初期化
  const table = document.getElementById("lineupTable");
  table.replaceChildren();

  //ラインナップの総数取得
  const totalCount = MainData.itemLineupNum;

  //ヘッダー作成
  table.appendChild(createTableHeader(MainData.itemDisplayHeaderTextArray));

  //bodyを作成
  const tbody = document.createElement("tbody");

  // totalCount に合わせて行を作る
  for (let i = 0; i < totalCount; i++) {
    //1行ごとに要素を作成
    const row = document.createElement("tr");
    const arraykey = row.id = "indexNo." + i;

    const itemData = MainData.resultItems[row.id] || { rarity: "N", itemName: "" }; // 空白はN

    //レアリティプルダウン
    const rarityCell = document.createElement("td");
    const select = document.createElement("select");
    select.id = "index-" + i + "-editItemRarityForm";
    select.name = "editItemRarityForm";
    select.ariaLabel = "上から" + (i + 1) + "番目にあるアイテムのレアリティ";

    //レアリティの数だけプルダウンの要素を作成
    MainData.rarityTable.slice(0, MainData.rarityNum).forEach(r => {
      const option = document.createElement("option");
      option.value = r;
      option.textContent =  MainData.rarityDisplayNames[r];
      if (r === itemData.rarity) option.selected = true;
      select.appendChild(option);
    });

    rarityCell.appendChild(select);

    //アイテム名テキストボックス
    const itemCell = createTableElement({
      elementId: "index-" + i + "-editItemNameForm",
      elementName: "editItemNameForm",
      inputType: "text",
      inputValue: itemData.itemName,
      ariaLabel: "上から" + (i + 1) + "番目にあるアイテム名入力欄",
    });
    
    MainData.resultItems[arraykey] = {
      itemName: itemData.itemName,
      rarity: itemData.rarity      
    };

    //名前入力欄に変更があったら登録
    itemCell.addEventListener("change", e => {
      //入力欄の番号取得
      const arraykey = row.id;

      //変更された値の取得
      const newName = e.target.value;
      
      //対象のindex番号がなかったら作成
      if (!MainData.resultItems[arraykey]) {
        MainData.resultItems[arraykey] = {
          itemName: itemData.itemName,
          rarity: itemData.rarity
        };
      }
      //新しい名前を追加
      MainData.resultItems[arraykey].itemName = newName;
    });

    //プルダウンに変更があったら登録
    select.addEventListener("change", e => {
      //入力欄の番号をチェック
      const arraykey = row.id;

      //変更された値の取得
      const newRarity = e.target.value;

      //対象のindex番号がなかったら作成
      if (!MainData.resultItems[arraykey]) {
        MainData.resultItems[arraykey] = {
          itemName: itemData.itemName,
          rarity: itemData.rarity
        };
      }
  
      //新しいレアリティに追加
      MainData.resultItems[arraykey].rarity = newRarity;
    });

    //作成したエレメントを追加
    row.appendChild(rarityCell);
    row.appendChild(itemCell);
    tbody.appendChild(row);
  }

  table.appendChild(tbody);
}

/**
 * 編集可能な情報をロードする関数
 */
function loadMainData() {
  const datas = getDataFromLocalStorage("gacyaData");
  if(!datas) {
    console.log("localStorage に保存されたデータが存在しません");
    return;
  }
  // dataKey 配列がある場合
  if(Array.isArray(datas.dataKey)) {
    MainData.dataKey = [...datas.dataKey];
  }

  // gachaName が存在していたら Map として復元
  if(datas.gachaName && typeof datas.gachaName === "object") {
    MainData.gachaName = new Map(Object.entries(datas.gachaName));
  }
}

/**
 * 編集可能な情報を保存する関数
 */
function saveMainData() {
  const saveData = {
    dataKey: [...MainData.dataKey],
    gachaName: Object.fromEntries(MainData.gachaName)
  };
  saveDataToLocalStorage("gacyaData",saveData);
  alert("保存しました！");
}
/**
 * 文字列と一致するlocalstlageのデータを削除
 * 
 * @param {string} text localstrageの名前
 */
function deleteLocalStrageData(text) {
  if(typeof text === "string") {
    localStorage.removeItem(text);
  }
  else {
    console.log("文字列じゃないよ");
  }
}

/**
 * メインデータの削除
 */
function deleteMainData() {
  deleteLocalStrageData("gacyaData");
}

/**
 * 配列内の合計値を求める関数
 * 
 * @param {number[]} numberArray
 * @returns 合計値 
 */
function calcTotalValue(numberArray){
  const totalWeight = numberArray.reduce((a, b) => a + b, 0);
  return totalWeight;
}

//表示名変更
function onNameInput(e) {
  const rarity = e.target.id.replace(/-DisplayName$/, "");
  const text = e.target.value.trim() || rarity;

  MainData.rarityDisplayNames[rarity] = text;
  showLineup();
}

//確率変更
function onProbInput(e) {
  const rarity = e.target.id.replace(/-Probability$/, "");
  MainData.editableWeights[rarity] = parseFloat(e.target.value) ?? MainData.baseWeights[rarity];
}

function getSortType() {
  const selected = document.querySelector('input[name="raritySort"]:checked');
  return selected?.value ?? "none";
}

// イベント登録
window.addEventListener("DOMContentLoaded", () => {
  // --- 初期化処理 ---
  loadMainData();
  updateLineupToZip();
  updateLabels();
  showLineup();

  const input = document.querySelector('input[type="text"][name="editRarityDisplayNameForm"]');
  input.addEventListener('input', () => {
    if (input.value.length > 10) {
      input.value = input.value.slice(0, 10);
    }
  });

  // --- データ管理イベント ---
  const loadZipNameElement = document.getElementById("loadZipName");

  //新規ファイルのインポート
  const element = document.getElementById("importZip");
  element.addEventListener("change", async(e)=>{
    const returnParam = await importZipFile(e);
    if(!returnParam) return;
    
    MainData.resultItems = returnParam.resultItems;
    MainData.dataKey.push(returnParam.zipId);
    MainData.gachaName.set(returnParam.zipId, returnParam.zipId);
    document.getElementById("lineupNum").value = MainData.itemLineupNum = returnParam.itemLineupNum;
    loadZipNameElement.value = returnParam.zipId;
    showLineup();
    updateLineupToZip(returnParam.zipId);
    MainData.onLoadedDatakey = returnParam.zipId;
    saveMainData();
    element.value = "";
  });
  
  //過去に読み込んだファイルのロード
  loadZipNameElement.addEventListener("change", async(e) => {
    const loadDataKey = e.target.value;

    //キーが存在しない(新規データ想定)
    if(!MainData.dataKey.includes(loadDataKey)) {
      console.log("指定されたキーは存在しません");
      MainData.initDefaultValue();
      return;
    }
    //読み込み処理
    const returnParam = await loadFromIndexedDB(loadDataKey);   
    console.log(returnParam);
    //データが無い(例外処理) 
    if (!returnParam) {
      console.log("データが見つかりません");
      MainData.initDefaultValue();
      return;
    }
    MainData.onLoadedDatakey = returnParam.id;
    MainData.setEditableDatas(returnParam.editableMainData);
  });

  //データ保存イベント
  document.getElementById("saveButton").addEventListener("click", async() =>{
    //保存する名前の取得
    const nameField = document.getElementById("gachaName");
    const gachaName = nameField.value.trim();

    if(!gachaName) {
      alert("ガチャの名前を入力してください！");
      return;
    }

    //表示しているデータが既に存在するかチェック
    if(MainData.dataKey.includes(MainData.onLoadedDatakey)) {
      //ガチャの名前を変更
      MainData.gachaName.set(MainData.onLoadedDatakey, gachaName);
      const newData = await loadFromIndexedDB(MainData.onLoadedDatakey);
      newData.editableMainData = structuredClone(MainData.getEditableDatas());
      saveToIndexedDB(newData.id, gachaName, newData.blob ?? null, newData.editableMainData);
      saveMainData();
      updateLineupToZip(newData.id);
      MainData.onLoadedDatakey = newData.id;
    }
    else {
      //新規作成
      MainData.dataKey.push(gachaName);
      MainData.gachaName.set(gachaName, gachaName);
      const saveData = MainData.getEditableDatas();
      saveToIndexedDB(gachaName, gachaName, null, saveData);
      saveMainData();
      updateLineupToZip(gachaName);
      MainData.onLoadedDatakey = gachaName;  
    }
    nameField.value = "";
  });

  //データの全削除イベント
  document.getElementById("deleteDataButton").addEventListener("click", () =>{
    // 確認ポップアップ
    if (confirm(MainData.deleteMassage)) {
        //全削除
        clearAllIndexedDBData().then(() => {
          deleteMainData();   //localstrageも削除
          location.reload();  //ページのリロード
          alert("削除が完了しました。");
        }).catch(err => {
          console.error("削除に失敗しました:", err);
          alert("削除に失敗しました。");
        });
    }
  });


  // --- 基本ロジックイベント群 ---

  //アイテム表示数変更時に再描画
  const lineupNum = document.getElementById("lineupNum");
    lineupNum.addEventListener("change", (e) => {
    MainData.itemLineupNum = e.target.value;
    showLineup();
  });
  
  document.getElementById("lineupPlus").onclick = () => { 
    lineupNum.stepUp();
    MainData.itemLineupNum = lineupNum.value;
    showLineup();
    
  };

  document.getElementById("lineupMinus").onclick = () => {
    lineupNum.stepDown();
    MainData.itemLineupNum = lineupNum.value;
    showLineup();
  };

  //rarityNumが変更された時
  document.getElementById("rarityNum").addEventListener("change", (e) => {
    MainData.rarityNum = parseInt(e.target.value);
    updateLabels();
    showLineup();
  });

  // --- ガチャ実行イベント群 ---

  //gachaSingleがクリックされた時
  document.getElementById("gachaSingle").addEventListener("click", async() => await callMainAction(1));

  //gachaTenがクリックされた時
  document.getElementById("gachaTen").addEventListener("click", async() => await callMainAction(10));

  //gachaCustomがクリックされた時
  document.getElementById("gachaCustom").addEventListener("click", async () => {
    const element = document.getElementById("gachaCount")
    const count = parseInt(element.value);

    //自分のPCで動く限界値(適当)
    if(count > 1000001) {
      alert("回数は1000000以下にしてください");
      element.value = 1000000;
    }
    else {
      await callMainAction(count);
    }
  });

  document.getElementById("tweetButton").addEventListener("click", ()=> {
    //新しいタブで開く
    window.open(MainData.tweetUrl, "_blank");
  });

  // --- デバッグ用 ---
  document.getElementById("showMaindatabutton").addEventListener("click", () => MainData.debugMainData());
  document.getElementById("showDB").addEventListener("click", async () => {
    const allData = await showAllIndexedDBData();
    console.log("取得結果 →", allData);
  });
  document.getElementById("showlocalstrage").addEventListener("click", () =>{

    //keyの情報取得
    const datas = getDataFromLocalStorage("gacyaData");
    if(!datas) {
      console.log("localdataが存在しない");
      return;
    }
    
    if(datas.dataKey) {
      for(let i = 0; i < datas.dataKey.length; i++) {
        console.log(`${i} : ${datas.dataKey[i]}\n`);
      }
    }

    if(datas.gachaName) {
      for (const [indexKey, itemObj] of Object.entries(datas.gachaName)) {
        const name = itemObj.itemName || "[\"空文字列\"]";
        const rarity = itemObj.rarity || "(no rarity)";
        msg += `  ${indexKey}: [Rarity: ${rarity}] ${name}\n`;
      }
    }
  });
});