import {saveToIndexedDB, getUrl, loadFromIndexedDB} from "./indexedDB.js";


async function  takeOutFileContents(file) {

    //対象となる拡張子
    const allowedExtensions = [".png", ".jpg", ".jpeg", ".webp", ".gif", ".mp3", ".wav", ".ogg"];
    
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
    
    await saveToIndexedDB(result.zipId, result.zipBlob);
    
    alert("インポートが完了しました！");

    return {
        resultItems: result.contents.resultItems,
        fileNum: result.contents.fileNum,
        zipId: result.zipId
    };
}

/**
 * MIME タイプを返す
 */
function getMimeType(filename) {
    if (filename.endsWith(".png")) return "image/png";
    if (filename.endsWith(".jpg") || filename.endsWith(".jpeg")) return "image/jpeg";
    if (filename.endsWith(".webp")) return "image/webp";
    if (filename.endsWith(".gif")) return "image/gif";
    if (filename.endsWith(".mp3")) return "audio/mpeg";
    if (filename.endsWith(".wav")) return "audio/wav";
    if (filename.endsWith(".ogg")) return "audio/ogg";
    return "application/octet-stream";
}

/**
 * 拡張子を除いたファイル名を返す
 */
function extractFileName(filename) {
    return filename.split("/").pop().replace(/\.[^.]+$/, "");
}

/**
 * ZIPファイルをダウンロード
 * @param {string} fileId
 */
export async function downloadZip(fileId) {
    try{
        const url = await getUrl(fileId);
        const anchor = document.getElementById("downloadZipBtn");
        anchor.id = "downloadZipBtn";
        anchor.class="download-button";
        anchor.href = url;
        anchor.download = fileId;  
    }
    catch (error) {
        console.error(error);
    }
}

export async function loadZip(fileKey) {
    const saved = await loadFromIndexedDB(fileKey);
    if (!saved) {
        throw new Error("データが見つかりません");
    }
    else if(!saved.blob) {
        throw new Error("blobデータが見つかりません");
    }

    const result = await takeOutFileContents(saved.blob);

    return {
        resultItems: result.contents.resultItems,
        fileNum: result.contents.fileNum,
        zipId: result.zipId
    };
}