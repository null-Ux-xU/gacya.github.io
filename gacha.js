import { MersenneTwister } from "./MersenneTwister.js";


/**
 * ガチャを引く
 * @param {Object} params パラメータ
 * @param {int} params.gachaCount - 回数(n連)
 * @param {float[]} params.probabilities - レアリティ毎の確率
 * @param {int} params.rarityNum - レアリティ個数
 * @param {string[]} params.rarityTable - レアリティの名前
 * @param {int} params.itemLineupNum - ラインナップの表示個数
 * @param {string[]} params.resultItems - アイテムリスト
 * @returns {Object[]} 排出されたアイテム群[({ レアリティ, アイテム })]
 */
export function gachaLogic({gachaCount, probabilities, rarityNum, rarityTable, itemLineupNum, resultItems}) {
    //ラインナップの初期化
    const itemArray = {
        N: [],
        R: [],
        SR: [],
        SSR: [],
        UR: [],
        LR: []
    };
    
    //渡された配列からレアリティと名前を取り出し、詰め替える
    const valueArray = Object.values(resultItems);
    for (const itemObj of valueArray.slice(0, itemLineupNum)) {
        if(!itemObj.rarity) continue; //意図しない値を弾く
        itemArray[itemObj.rarity]?.push(itemObj.itemName || "はずれ");
    }

    //乱数生成
    const mt = new MersenneTwister(Date.now());
  
    //結果を代入する配列
    const resultLen = [];

    //countに応じたループ(n連実装部)
    for(let i = 0; i < gachaCount; i++ ){
        
        //初期化
        let rand = mt.random()*100;
        let cumulative = 0;
        let rarity = "";

        //レアリティ抽選
        for (let j = 0; j < rarityNum; j++) {
            //確率を加算して何回目で当たったかでレアリティを確定(N→0~60まで R60以上60+n以下)
            cumulative += probabilities[j];

            //当たった時の処理
            if (rand < cumulative) {
                rarity = rarityTable[j];
                break;
            }
        }

        //アイテム抽選( "" or undefind は「はずれ」)
        const itemList = itemArray[rarity] || [];
        let item = "はずれ";

        if (itemList.length > 0) {
            const selected = itemList[Math.floor(mt.random() * itemList.length)];
            // 空文字なら「はずれ」にする
            item = selected && selected.trim() !== "" ? selected : "はずれ";
        }

        resultLen.push({ rarity, item });
    }
    return resultLen;
}