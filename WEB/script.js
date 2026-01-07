const CHERRY_A = "cherryA", CHERRY_B = "cherryB", BELL_A = "bellA", 
      BELL_B = "bellB", SUICA_A = "suicaA", SUICA_B = "suicaB";

const MASTER_CONFIG = {
    VERSUS: {
        labels: ["設定1", "設定2", "設定5", "設定6"],
        rates: {
            [SUICA_A]:  [74.5, 70.6, 72.5, 68.8],
            [SUICA_B]:  [218.5, 218.5, 218.5, 218.5],
            [BELL_A]:   [10.9, 10.7, 10.5, 10.2],
            [BELL_B]:   [20.9, 21.2, 20.3, 20.6],
            [CHERRY_A]: [119.2, 119.2, 119.2, 118.9],
            [CHERRY_B]: [56.2, 57.7, 53.1, 54.4]
        }
    },
    THUNDER: {
        labels: ["設定1", "設定2", "設定5", "設定6"],
        rates: {
            [SUICA_A]:  [163.8, 166.3, 159.1, 160.6],
            [SUICA_B]:  [163.8, 166.3, 159.1, 160.6],
            [BELL_A]:   [9.6, 9.3, 9.0, 8.7],
            [BELL_B]:   [26.9, 27.9, 28.4, 27.4],
            [CHERRY_A]: [18.3, 18.6, 17.2, 17,7],
            [CHERRY_B]: [1000000, 1000000, 1000000, 1000000] // 無効用（非常に低い確率）
        }
    }
};

function calculate() {
    const slotType = document.getElementById('slotType').value;
    const note = document.getElementById('slot-note');
    const cherryBInput = document.getElementById('cherryB');

    // 機種ごとの入力欄制御
    if (slotType === "THUNDER") {
        note.style.display = "block";
        cherryBInput.disabled = true;
        cherryBInput.value = -1;
    } else {
        note.style.display = "none";
        cherryBInput.disabled = false;
    }

    const currentConfig = MASTER_CONFIG[slotType];
    const totalGames = parseInt(document.getElementById('gameCount').value) || 0;
    
    const counts = {
        [CHERRY_A]: parseInt(document.getElementById('cherryA').value),
        [CHERRY_B]: parseInt(document.getElementById('cherryB').value),
        [BELL_A]:   parseInt(document.getElementById('bellA').value),
        [BELL_B]:   parseInt(document.getElementById('bellB').value),
        [SUICA_A]:  parseInt(document.getElementById('suicaA').value),
        [SUICA_B]:  parseInt(document.getElementById('suicaB').value),
    };

    let scores = currentConfig.labels.map(() => 0);

    for (let i = 0; i < currentConfig.labels.length; i++) {
        for (let key in counts) {
            const hitCount = counts[key];
            if (!isNaN(hitCount) && hitCount >= 0) {
                const probPerSpin = 1.0 / currentConfig.rates[key][i];
                scores[i] += hitCount * Math.log(probPerSpin) + (totalGames - hitCount) * Math.log(1.0 - probPerSpin);
            }
        }
    }

    const maxScore = Math.max(...scores);
    const relativeWeights = scores.map(s => Math.exp(s - maxScore));
    const totalWeight = relativeWeights.reduce((a, b) => a + b, 0);
    
    const results = currentConfig.labels.map((name, i) => ({
        name: name,
        probability: (relativeWeights[i] / totalWeight) * 100
    }));

    const output = document.getElementById('output');
    output.innerHTML = results.map(res => `
        <div class="result-row">
            <span>${res.name}</span>
            <span><b>${res.probability.toFixed(2)}%</b></span>
        </div>
    `).join('');
}


function calculate() {
    const slotType = document.getElementById('slotType').value;
    const note = document.getElementById('slot-note');
    
    // チェリーBの入力要素を取得
    const cherryBInput = document.getElementById('cherryB');

    // 機種ごとの個別制御
    if (slotType === "THUNDER") {
        note.style.display = "block";
        
        // サンダーの場合：入力を無効化し、値を-1に戻す
        cherryBInput.disabled = true;
        cherryBInput.value = -1; 
        cherryBInput.style.backgroundColor = "#e9e9e9"; // 無効化されているのが分かるように背景色を変更
    } else {
        note.style.display = "none";
        
        // ヴァーサス等の場合：有効化
        cherryBInput.disabled = false;
        cherryBInput.style.backgroundColor = ""; // 背景色を元に戻す
    }

    const noteElement = document.querySelector('.note');

    // 機種によって注釈を書き換える
    if (slotType === "THUNDER") {
        noteElement.textContent = "※サンダーVライトニングはチェリーBの入力は不要";
    } else if (slotType == "VERSUS"){
        noteElement.textContent = "※ヴァーサスリヴァイズは全ての項目を入力してください";
    }
    else{
        noteElement.textContent = "";
    }

    const currentConfig = MASTER_CONFIG[slotType];
    
    const totalGames = parseInt(document.getElementById('gameCount').value) || 0;
    
    // 入力値を取得
    const counts = {
        [CHERRY_A]: parseInt(document.getElementById('cherryA').value),
        [CHERRY_B]: parseInt(document.getElementById('cherryB').value),
        [BELL_A]:   parseInt(document.getElementById('bellA').value),
        [BELL_B]:   parseInt(document.getElementById('bellB').value),
        [SUICA_A]:  parseInt(document.getElementById('suicaA').value),
        [SUICA_B]:  parseInt(document.getElementById('suicaB').value),
    };

    // 各設定のスコアを0で初期化
    let scores = currentConfig.labels.map(() => 0);

    for (let i = 0; i < currentConfig.labels.length; i++) {
        for (let key in counts) {
            const hitCount = counts[key];

            // --- ここが重要：0以上の数値が入っている場合のみ計算 ---
            if (!isNaN(hitCount) && hitCount >= 0) {
                const probPerSpin = 1.0 / currentConfig.rates[key][i];
                
                // 対数尤度計算を加算
                scores[i] += hitCount * Math.log(probPerSpin) + (totalGames - hitCount) * Math.log(1.0 - probPerSpin);
            }
        }
    }

    // （以下、正規化と結果表示のロジックは前回と同じ）
    const maxScore = Math.max(...scores);
    const relativeWeights = scores.map(s => Math.exp(s - maxScore));
    const totalWeight = relativeWeights.reduce((a, b) => a + b, 0);
    
    const results = currentConfig.labels.map((name, i) => ({
        name: name,
        probability: (relativeWeights[i] / totalWeight) * 100
    }));

    const output = document.getElementById('output');
    output.innerHTML = results.map(res => `
        <div class="result-row">
            <span>${res.name}</span>
            <span><b>${res.probability.toFixed(2)}%</b></span>
        </div>
    `).join('');
}