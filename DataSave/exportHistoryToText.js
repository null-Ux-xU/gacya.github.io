export function createURL(text) {

    const link = document.getElementById("resultdownload");

    // Blobオブジェクトを作成
    const blob = new Blob([text], { type: "text/plain" });

    // ダウンロード用リンクを作成
    link.href = URL.createObjectURL(blob);
    link.download = "ガチャ履歴.txt"; // 保存するファイル名
}