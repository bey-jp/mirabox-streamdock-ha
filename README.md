# MiraBox Stream Dock × Home Assistant

MiraBox の **Stream Dock**（キーに液晶が付いた左手デバイス）を、**Home Assistant（HA）のスイッチパネル**にするプラグインです。

Turn a MiraBox Stream Dock into a Home Assistant switch panel. Each key shows the live state of an entity (yellow = on, blue = off) and toggles it when pressed. Japanese UI; see `AI_INSTRUCTIONS.md` to let an AI agent set it up for you.

- キーを押すと、照明・プラグ・ファン・鍵・シーン・スクリプトを操作
- **今の状態がアイコンの色で分かる**（ON=黄、OFF=青、つながらない=グレー、鍵は施錠=緑／解錠=赤）
- スマホや壁のパネルで消しても、Stream Dock の表示もすぐ変わる（HA の WebSocket で状態を受け取り続ける）
- ボタンの割り当ては Stream Dock の画面で、プルダウンから選ぶだけ
- PC スリープのように間違えて押すと困るものは「2回押し」で実行
- アイコンは HA と同じ Material Design Icons（7,000 個以上）

筆者は **Stream Dock 293S V3**（Windows 11、Stream Dock ソフト 3.10）で使っています。
キーの数が違うほかの Stream Dock でも、同じ仕組みで動くはずです（未確認）。

> **AI にやってもらう**：Claude Code などに次の1行を送ると、手順どおりに設定してくれます。
>
> ```
> https://github.com/bey-jp/mirabox-streamdock-ha/blob/main/AI_INSTRUCTIONS.md を読んで、その手順どおりに、私の Stream Dock を Home Assistant のスイッチにしてください。
> ```

## 仕組み

```
[Stream Dock] ─USB─ [Windows PC]
                      Stream Dock ソフト
                        └ このプラグイン（中身は小さな Web ページ）
                             │ WebSocket（状態の受信・操作の送信）
                             ▼
                      [Home Assistant]  ws://<HA の IP>:8123/api/websocket
```

- Stream Dock のソフトは、プラグインを「見えない Web ページ」として動かします（Elgato Stream Deck と同じ方式）。
- プラグインは HA に WebSocket でつなぎ、ボタンに登録したエンティティの状態を受け取り続けます。
  状態が変わるたびに、キーの画像（144×144）を描き直して Stream Dock に送ります。
- キーを押すと、HA のサービス（`light.toggle` など）を呼びます。
- HA と切れると全キーがグレーになり、5秒ごとにつなぎ直します。

## 必要なもの

- Stream Dock 本体と、Windows 用の **Stream Dock ソフト**（MiraBox の公式サイトからダウンロード）
- 動いている **Home Assistant**（同じ LAN 内。Raspberry Pi・ミニ PC・HA Green など何でも）
- HA の **長期アクセストークン**（HA の左下のユーザー名 → セキュリティ → 長期アクセストークン → 作成）

HA 本体がまだ無い場合は [home-assistant-setup](https://github.com/bey-jp/home-assistant-setup) を見てください。

## 入れ方（手作業の場合）

PowerShell で実行します（スタートメニューで「PowerShell」と検索）。

1. **Stream Dock ソフトを終了**します（タスクトレイのアイコンを右クリック → 終了、または次のコマンド）。
   ```powershell
   Stop-Process -Name StreamDock -ErrorAction SilentlyContinue
   ```
2. このリポジトリをダウンロードして、プラグインのフォルダを Stream Dock の plugins フォルダにコピーします。
   ```powershell
   cd $env:USERPROFILE\Downloads
   Invoke-WebRequest https://github.com/bey-jp/mirabox-streamdock-ha/archive/refs/heads/main.zip -OutFile streamdock-ha.zip
   Expand-Archive streamdock-ha.zip -DestinationPath streamdock-ha -Force
   $P = "$env:APPDATA\HotSpot\StreamDock\plugins\com.bey.homeassistant.sdPlugin"
   Copy-Item streamdock-ha\mirabox-streamdock-ha-main\com.bey.homeassistant.sdPlugin $P -Recurse
   ```
3. アイコン用のフォント（Material Design Icons）をダウンロードします。
   ```powershell
   Invoke-WebRequest https://cdn.jsdelivr.net/npm/@mdi/font@7.4.47/fonts/materialdesignicons-webfont.ttf -OutFile $P\plugin\mdi.ttf
   ```
4. 接続先とトークンを書きます。`config.js.example` をコピーして `config.js` を作り、メモ帳で開きます。
   ```powershell
   Copy-Item $P\plugin\config.js.example $P\plugin\config.js
   notepad $P\plugin\config.js
   ```
   `192.168.1.10` を HA の IP アドレスに、`PASTE_TOKEN_HERE` をトークンに書き換えて保存します。
5. ボタンを決めます。`buttons.js` をメモ帳で開き、例の `entity` を自分の HA のエンティティ ID に書き換えます（書き方はファイルの先頭に説明があります）。
   ```powershell
   notepad $P\plugin\buttons.js
   ```
6. Stream Dock ソフトを起動します。
   ```powershell
   Start-Process "C:\Program Files (x86)\StreamDock\StreamDock.exe"
   ```
7. 画面右の一覧の **「Home Assistant」→「HA Toggle」** を、使いたいキーにドラッグします。
   キーを選ぶと画面下に設定欄が出るので、**「ボタン」** のプルダウンから割り当てるボタンを選びます。

### うまくいかないとき

| 症状 | 原因と対策 |
|---|---|
| 一覧に「Home Assistant」が出ない | フォルダの場所・名前を確認（`plugins\com.bey.homeassistant.sdPlugin\manifest.json` があるか）。Stream Dock ソフトを完全に終了してから起動し直す |
| 全部のキーがグレー | HA につながっていない。`config.js` の IP・トークンを確認。HA を https で使っているなら `wss://` |
| 1つだけグレー | そのエンティティが無い・応答しない。`buttons.js` の entity の綴りを確認 |
| アイコンが □ になる | `plugin\mdi.ttf` が無い（手順 3） |
| 「未設定」と出る | 下の設定欄でボタンを選ぶ |
| 「未定義」と出る | `buttons.js` からそのボタンを消した・名前を変えた |
| ほかのシーンに移っても数秒で戻る | シーン設定の「アプリに関連付け」が「全アプリ」になっている →「なし」に |

読み込めたかは `%APPDATA%\HotSpot\StreamDock\logs\` のログに `com.bey.homeassistant.sdPlugin is now connected` が出ているかで分かります。

### 変更したら

`buttons.js` や `config.js` を書き換えたら、**Stream Dock ソフトを再起動**すると反映されます。

## ファイル

| ファイル | 内容 |
|---|---|
| `com.bey.homeassistant.sdPlugin/manifest.json` | プラグインの情報。アクション「HA Toggle」 |
| `plugin/index.html` | プラグイン本体のページ（下の js を読む） |
| `plugin/main.js` | 本体。HA との接続・キーの描画・押したときの処理 |
| `plugin/buttons.js` | **ボタンの定義（ここを書き換える）** |
| `plugin/pi.html` | 画面下の設定欄（どのボタンにするか選ぶ） |
| `plugin/config.js.example` | 接続先とトークンのひな形 → `config.js` にコピーして使う |
| `plugin/mdi_codepoints.js` | アイコン名 → 文字コードの表（MDI 7.4.47 の全アイコン） |
| `plugin/mdi.ttf` | アイコンのフォント（**同梱していません**。手順 3 でダウンロード） |
| `scripts/make_mdi_codepoints.py` | `mdi_codepoints.js` を作り直すスクリプト（MDI の新しい版に合わせるとき） |

`config.js` にはトークン（HA の合鍵）が入ります。人に渡したり、公開したりしないでください。

## キーの見た目

| 種類（`cat`） | 背景 |
|---|---|
| light | オレンジ |
| plant | 緑 |
| fan | 青 |
| plug | 黄 |
| lock | 紫がかったグレー |
| display | シアン |
| alloff | 暗い赤 |
| pc | 青みのグレー |

アイコンの後ろに暗い円を敷いているので、青い背景の上の青いアイコン（OFF）でも見分けられます。

## 関連

- ブログ: [bey.jp](https://bey.jp/)
- ほかの「ガジェットを HA のリモコンにする」プロジェクト: [github.com/bey-jp](https://github.com/bey-jp)

アイコンは [Pictogrammers](https://pictogrammers.com/) の Material Design Icons を使っています。Stream Dock は MiraBox（HotSpot）の製品です。このプラグインは非公式です。

## ライセンス

MIT
