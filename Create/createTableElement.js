
/**
 * テーブルの要素を作成する関数
 * 
 * @param {object} params パラメータ
 * @param {string} params.elementId id (HTML全体でユニークなもの)
 * @param {string} params.elementName name (重複可)
 * @param {string} params.inputType inputのtype
 * @param {object} params.inputValue 初期値
 * @param {string} params.ariaLabel 補助テキスト
 * @param {string}  params.divWrapperName HTML装飾用className
 * @param {number} params.step ナンバーのstep数
 * @returns  ```<td> <input> </td>``` || null 
 */
export function createTableElement({elementId, elementName, inputType, inputValue, ariaLabel, divWrapperName = null, step = "1"}) {
    const tdElement = document.createElement("td"); //td作成
    const input = document.createElement("input");  //input作成
    const frag = document.createDocumentFragment(); //DOMアクセスを減らせるらしい

    input.id = elementId;                       //id指定
    input.name = elementName;                   //name指定
    input.type = inputType;                     //type指定
    input.value = inputValue;                   //vaue指定
    input.ariaLabel = ariaLabel;                //補助テキスト

    //ネストを深くしたくない
    let wrapper = input;

    if(input.type === "number") {

        //スマホ画面用のステップ作成
        const numberFrag = document.createDocumentFragment();
        const numberDiv = document.createElement("div");
        const plus = document.createElement("button");
        const minus = document.createElement("button");

        numberDiv.className = "numberInputDiv";
        numberDiv.className = "stepper";
        plus.textContent = "+";
        plus.className = "plus";
        minus.textContent = "-";
        minus.className = "minus";

        plus.onclick = () => { 
            input.stepUp();
            const newvalue = parseFloat(input.value);
            input.value = newvalue.toFixed(2);
        };
        minus.onclick = () => {
            input.stepDown();
            const newvalue = parseFloat(input.value);
            input.value = newvalue.toFixed(2);
        };


        input.step = parseFloat(step);
        
        numberFrag.append(input, plus, minus);
        numberDiv.appendChild(numberFrag);

        wrapper = numberDiv;
    }
    if(divWrapperName) {

        //装飾用の名前をつける
        const div = document.createElement("div");
        div.className = divWrapperName;
        div.appendChild(wrapper);
        wrapper = div;
        
    }
    frag.appendChild(wrapper);
    tdElement.appendChild(frag);

    return tdElement;
    
}