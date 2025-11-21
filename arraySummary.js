/**
 * 配列の重複を個数表記に置き換える
 * 
 * @param {Object} array まとめたい配列
 * @returns {Object} まとめた後の配列 [{ rarity, item, val }]
 * 
 */
export function arraySummary(array) {
  const summaryMap = new Map();

  for (const obj of array) {
    const key = `${obj.rarity}-to-${obj.item}`;
    if (!summaryMap.has(key)) {
      summaryMap.set(key, { rarity: obj.rarity, item: obj.item, val: 0 });
    }
    summaryMap.get(key).val++;
  }
  return Array.from(summaryMap.values());
}