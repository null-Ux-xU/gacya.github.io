import {saveToIndexedDB, getUrl, loadFromIndexedDB} from "./indexedDB.js";

/**
 * 拡張子を除いたファイル名を返す
 */
function extractFileName(filename) {
    return filename.split("/").pop().replace(/\.[^.]+$/, "");
}

/**
 * 指定したファイルの名前、ファイルデータ、子要素の名前を返す
 * 
 * @param {Blob} file 
 * @returns 
 */
async function  takeOutFileContents(file) {

    //対象となる拡張子
    const allowedExtensions = [".png", ".jpg", ".jpeg", ".webp", ".gif", ".mp3", ".wav", ".ogg", ".m4a", ".txt"];
    
    const zipFile = await JSZip.loadAsync(file);
    let files = Object.values(zipFile.files).filter(f => !f.dir);

    if (files.length === 0) {
        const topFolder = Object.values(zipFile.files).find(f => f.dir);
        if (!topFolder) {
            alert("有効なデータが含まれていません。");
            return;
        }
        const folderName = topFolder.name;
        files = Object.values(zipFile.files).filter(f =>
            !f.dir && f.name.startsWith(folderName)
        );
    }
    
    //ファイル保存用変数
    const zipId = file.name;
    const zipBlob = file;

    //return用変数
    const resultItems = {};
    let indexCount = 0;

    //名前の取り出し
    for (const fileEntry of files) {
        const lowerName = fileEntry.name.toLowerCase();

        if (!allowedExtensions.some(ext => lowerName.endsWith(ext))) continue; // 対象外のファイルはスキップ
    
        //itemName と rarity を設定
        resultItems["indexNo." + indexCount] = {
            itemName: extractFileName(lowerName),
            rarity: "N"
        };
        indexCount++;
    }    
    return {
        zipId,
        zipBlob,
        contents: {
            resultItems,
            fileNum: indexCount
        }
    };
}

/**
 * 指定したファイルを読み込む
 * 
 * @param {event} event zipファイル読み込みイベント 
 * @returns {object} {resultItems, fileNum, zipId}
 */
export async function importZipFile(event) {

    const file = event.target.files[0];
    if(!file) {
        alert("ファイルの読み込みに失敗しました");
        return;
    }

    const result = await takeOutFileContents(file);
    
    await saveToIndexedDB(
        result.zipId,
        result.zipId,
        result.zipBlob,
        {
            resultItems: result.contents.resultItems,
            itemLineupNum: result.contents.fileNum,
        }
    );
    
    alert("インポートが完了しました！");

    return {
        resultItems: result.contents.resultItems,
        itemLineupNum: result.contents.fileNum,
        zipId: result.zipId
    };
}

/**
 * 既に読み込んだファイルを取得する
 * 
 * @param {string} fileKey 
 * @returns {Map} {resultItems, fileNum, zipId, blob}
 */
export async function loadZip(fileKey) {
    const saved = await loadFromIndexedDB(fileKey);
    if(!saved || typeof saved !== "object") return;

    const result = await takeOutFileContents(saved.blob);

    return {
        resultItems: result.contents.resultItems,
        fileNum: result.contents.fileNum,
        zipId: result.zipId,
        blob: saved.blob
    };
}


/**
 * ZIPファイルをダウンロード
 * @param {string} fileId 対象ファイル
 * @param {int[]} indexNoLen 対象のindex番号
 * @returns 成功:elament
 */
export async function getResultItemsToFile(fileId, indexNoLen) {

    const anchor = document.getElementById("downloadZipBtn");

    //ファイル読み込み
    const saved = await loadFromIndexedDB(fileId);
    if (!saved || !(saved.blob instanceof Blob)) {
        console.log("ZIPデータが存在しません");
        anchor.hidden = true;
        anchor.style.display = "none";
        return;
    }
    //zip展開
    const originalZip = await JSZip.loadAsync(saved.blob);
    const newZip = new JSZip();

    const allFiles = Object.values(originalZip.files).filter(f => !f.dir);

    await Promise.all(indexNoLen.map(async (idx) => {
    if (idx < 0 || idx >= allFiles.length) return; // 範囲外はスキップ
        const file = allFiles[idx];
        const content = await file.async("blob");
        const fileName = file.name.split("/").pop();
        newZip.file(fileName, content);
    }));

    const resultZipBlob = await newZip.generateAsync({ type: "blob" });
    if(!resultZipBlob) {
        anchor.hidden = true;
        anchor.style.display = "none";
        return;
    }

    anchor.style.display = "";
    const url = URL.createObjectURL(resultZipBlob);

    anchor.className="download-button";
    anchor.href = url;
    anchor.download = `${fileId}.zip`;  

}
