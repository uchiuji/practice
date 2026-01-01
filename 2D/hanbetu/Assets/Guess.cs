using UnityEngine;
using TMPro; // TextMesh Proを使うために必要
using UnityEngine.UI; // Buttonなどを使う場合に必要
using System.Collections.Generic; // Dictionaryのため
using System.Linq;
using System;

public class Guess : MonoBehaviour
{
    [SerializeField] private TMP_InputField gameCountField;
    [SerializeField] private TMP_InputField cherryAInputField;
    [SerializeField] private TMP_InputField cherryBInputField;
    [SerializeField] private TMP_InputField bellAInputField;
    [SerializeField] private TMP_InputField bellBInputField;
    [SerializeField] private TMP_InputField suicaAInputField;
    [SerializeField] private TMP_InputField suicaBInputField;
    // [SerializeField] private TMP_InputField bigMissInputField_vsChance;
    // [SerializeField] private TMP_InputField bigMissInputField_vsGame;

    private static int CHERRY_A  = 0;
    private static int CHERRY_B  = 1;
    private static int BELL_A   = 2;
    private static int BELL_B   = 3;
    private static int SUICA_A = 4;
    private static int SUICA_B = 5;
    private static int BIG_MISS_VSCHANCE = 6;
    private static int BIG_MISS_VSGAME = 7;

    private const string VERSUS = "ヴァーサスリヴァイズ";
    private const string THUNDER = "サンダーVライトニング";

    // ボタンが押された時に実行する関数
    public void GetInputText()
    {
        // 入力を取得
        int gameCounnt      = int.Parse(gameCountField.text);
        int cherryAInput    = int.Parse(cherryAInputField.text);
        int cherryBInput    = int.Parse(cherryBInputField.text);
        int bellAInput      = int.Parse(bellAInputField.text);
        int bellBInput      = int.Parse(bellBInputField.text);
        int suicaAInput     = int.Parse(suicaAInputField.text);
        int suicaBInput     = int.Parse(suicaBInputField.text);
        // int bigMissVsChanceInput = int.Parse(bigMissInputField_vsChance.text);
        // int bigMissVsGameInput = int.Parse(bigMissInputField_vsGame.text);

        // 入力するときようにボタンがあるとよいかも（0～9の）

        var counts = new Dictionary<int, int>()
        {
            {CHERRY_A, cherryAInput},
            {CHERRY_B, cherryBInput},
            {BELL_A, bellAInput},
            {BELL_B, bellBInput},
            {SUICA_A, suicaAInput},
            {SUICA_B, suicaBInput},
            // {BIG_MISS_VSCHANCE, bigMissVsChanceInput},
            // {BIG_MISS_VSGAME, bigMissVsGameInput},
        };
        CalculateSettings(gameCounnt, counts);
    }
    

    /// <summary>
    /// 設定クラス
    /// </summary>
    private class GameConfig
    {
        public string slotName = "";
        public Dictionary<int, double[]> settings;
    }

    private Dictionary<int, double[]> GetGameConfig(string slotName = VERSUS)
    {
        if (slotName == VERSUS)
        {
            return new Dictionary<int, double[]>()
            {
                // 子役, 設定[1, 2, 5, 6]
                {SUICA_A,   new double[] {74.5, 70.6, 72.5, 68.8}},
                {SUICA_B,   new double[] {218.5, 218.5, 218.5, 218.5}},
                {BELL_A,    new double[] {10.9, 10.7, 10.5, 10.2}},
                {BELL_B,    new double[] {20.9, 21.2, 20.3, 20.6}},
                {CHERRY_A,  new double[] {119.2, 119.2, 119.2, 118.9}},
                {CHERRY_B,  new double[] {56.2, 57.7, 53.1, 54.4}},
                // {BIG_MISS_VSCHANCE, new double[] {5.0, 4.9, 4.6, 4.5}},
                // {BIG_MISS_VSGAME,   new double[] {10.1, 9.4, 8.7, 8.1}},
            };
        }
        else if (slotName == THUNDER)
        {
            return new Dictionary<int, double[]>(){};
        }
        else
        {
            return null;
        }
    }

    // 判別結果を保持するためのクラス
    public class EstimationResult
    {
        public string SettingName;
        public double Probability; // 0.0 ~ 100.0
    }

    public void CalculateSettings(int totalGames, Dictionary<int, int> counts)
    {
        string[] settingLabels = { "設定1", "設定2", "設定5", "設定6" };
        double[] settingScores = new double[4]; // 各設定の「正解っぽさ」を貯める箱

        // 1. 各設定ごとに「その結果がどれくらい起こりやすいか」をスコア化する
        for (int i = 0; i < settingLabels.Length; i++)
        {
            foreach (var entry in counts)
            {
                int roleId = entry.Key;    // 小役の種類
                int hitCount = entry.Value; // 引いた回数

                // その設定における1回あたりの出現確率 (例: 1/7.5 = 0.133...)
                double probabilityPerSpin = 1.0 / GetGameConfig()[roleId][i];

                // 【統計計算】現在のゲーム数と回数から、この設定の「尤もらしさ（スコア）」を加算
                settingScores[i] += CalculateLogLikelihood(totalGames, hitCount, probabilityPerSpin);
            }
        }

        // 2. スコアをパーセンテージ(%)に変換する
        var finalResults = NormalizeToPercentages(settingLabels, settingScores);

        // 3. 結果を表示する
        Debug.Log($"<color=yellow>--- 判別結果 ({totalGames}G) ---</color>");
        foreach (var res in finalResults)
        {
            Debug.Log($"{res.SettingName}: {res.Probability:F2}%");
        }
    }

    /// <summary>
    /// 二項分布の対数尤度を計算する（この設定である「もっともらしさ」の計算）
    /// </summary>
    private double CalculateLogLikelihood(int total, int hit, double p)
    {
        // 確率は非常に小さい値になりやすいため、対数(Log)を使って足し算で計算します
        return hit * Math.Log(p) + (total - hit) * Math.Log(1.0 - p);
    }

    /// <summary>
    /// 計算したスコアを、合計が100%になるように変換する
    /// </summary>
    private List<EstimationResult> NormalizeToPercentages(string[] labels, double[] scores)
    {
        double maxScore = scores.Max();
        // 指数関数(Exp)を使って対数を通常の比率に戻す
        double[] relativeWeights = scores.Select(s => Math.Exp(s - maxScore)).ToArray();
        double totalWeight = relativeWeights.Sum();

        return labels.Select((name, i) => new EstimationResult
        {
            SettingName = name,
            Probability = (relativeWeights[i] / totalWeight) * 100
        }).ToList();
    }
}