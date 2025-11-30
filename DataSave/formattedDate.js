/**
 * フォーマットした現在日時を取得
 * 
 * @returns yyyy/mm/dd
 */
export function getFormattedDate() {
    const d = new Date();
    const year = d.getFullYear();
    const month = String(d.getMonth() + 1).padStart(2, "0");
    const day = String(d.getDate()).padStart(2, "0");

    return `${year}/${month}/${day}`;
}