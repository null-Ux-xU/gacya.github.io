/**
 * Nからレアリティ順にソートする
 * @param {Object} resultLen ガチャ結果
 * @param {string[]} rarityTable レアリティ一覧
 * @returns sortedResultLen
 */
export function sortByRarityFromN(resultLen, rarityTable){
    const orderMap = {};
    const sortedResultLen = resultLen;

    rarityTable.forEach((r, idx) => orderMap[r] = idx);
    sortedResultLen.sort((a, b) => {
      const ra = orderMap[a.rarity] ?? 999;
      const rb = orderMap[b.rarity] ?? 999;
      return ra - rb;
    });

    return sortedResultLen;
}

/**
 * LRからレアリティ順にソートする
 * @param {Object} resultLen ガチャ結果
 * @param {string[]} rarityTable レアリティ一覧
 * @returns sortedResultLen
 */
export function sortByRarityFromLR(resultLen, rarityTable){
    const orderMap = {};
    const sortedResultLen = resultLen;

    rarityTable.forEach((r, idx) => orderMap[r] = idx);
    sortedResultLen.sort((a, b) => {
      const ra = orderMap[a.rarity] ?? 999;
      const rb = orderMap[b.rarity] ?? 999;
      return rb - ra;
    });

    return sortedResultLen;
}