# AI 向け指示書：Stream Dock を Home Assistant のスイッチにする

> **使う人へ（人間向け）**
> Claude Code・Codex CLI・Gemini CLI など、**パソコンでコマンドを実行できる AI** に、次の1行を送ってください。
> Stream Dock をつないでいる **Windows パソコン**で AI を動かしてください。
>
> ```
> https://github.com/bey-jp/mirabox-streamdock-ha/blob/main/AI_INSTRUCTIONS.md を読んで、その手順どおりに、私の Stream Dock を Home Assistant のスイッチにしてください。
> ```
>
> あなたがやることは、HA でトークンを作ってメモ帳に貼ること、どの機器をボタンにしたいか答えること、最後に Stream Dock の画面でボタンを並べることだけです。
>
> **ChatGPT・Gemini などのチャット（Web・スマホアプリ）でも使えます。** チャットの AI はあなたのパソコンを操作できないので、AI が示すコマンドを、あなたが PowerShell に貼って実行し、表示された結果をチャットに貼り返します。次の1行を送ってください。
>
> ```
> https://github.com/bey-jp/mirabox-streamdock-ha/blob/main/AI_INSTRUCTIONS.md を読んで、「チャット型 AI の進め方」に従って、私の Stream Dock を Home Assistant のスイッチにする手順を1つずつ案内してください。
> ```
>
> **トークン（HA の合鍵）は、AI のチャットに貼らないでください。** この指示書では、あなたがメモ帳に直接貼ります。

---

ここから先は、この指示書を読んでいる AI エージェント向けです。

## あなたの役割

ユーザーは初心者かもしれません。コマンドはあなたが実行してください。ユーザーに頼むのは次のことだけにします。

- HA の画面で長期アクセストークンを作り、**メモ帳で開いた `config.js` に自分で貼って保存する**こと
- どの機器・シーンをボタンにしたいかを答えること
- Stream Dock ソフトの画面で、キーにボタンを置くこと（ドラッグとプルダウン）
- 管理者権限の承認などが出たときの操作

あなたの環境がコマンドの実行を許していない場合は、無理に回避せず、実行するコマンドを1行ずつユーザーに示して実行してもらい、出力を全部貼ってもらってください。

説明はやさしい言葉で、ユーザーの言語で行ってください。専門用語を使うときは一言で説明します（例：エンティティ＝HA に登録された機器の1つ1つのスイッチやセンサー）。

## 守ること

1. **トークンを扱わない・表示しない**：トークンはユーザーがメモ帳で `config.js` に貼ります。あなたは `config.js` の中身を画面に出したり、チャットやログに書いたりしないでください。HA に問い合わせるとき（手順 5）は、スクリプトの中で `config.js` から読み込み、値そのものは表示しないでください。
2. **既存のファイルを消さない**：plugins フォルダに同じ名前のフォルダがすでにある場合は、上書きする前に、日付を付けた名前でバックアップしてください（例 `com.bey.homeassistant.sdPlugin.bak-20261125`）。ただし、バックアップは plugins フォルダの**外**（例 `%USERPROFILE%\StreamDockHA-backup\`）に置きます。plugins の中に置くと、Stream Dock が二重に読み込むおそれがあります。
3. **Stream Dock ソフトは終了してからファイルを触る**：起動中はシーンの設定ファイルが上書きされることがあります。
4. **シーンの設定ファイル（`profiles\*\manifest.json`）は書き換えない**：キーの配置はユーザーが画面で行います。
5. **HA の設定は変えない**：この作業は HA 側に何も追加しません（読むだけ）。スクリプトやシーンを作りたいと言われたら、別の作業として、HA の画面での作り方を案内してください。
6. **想定と違う出力が出たら止まる**：推測で先に進まず、出力を見せて原因を説明します。

## チャット型 AI の進め方（コマンドを実行できない AI 向け）

1. **最初に聞く**：Windows のバージョン、Stream Dock の機種、Stream Dock ソフトが入っているか、HA の IP アドレス（分からなければ HA を開いているブラウザのアドレス欄を見てもらう）。
2. **PowerShell の開き方を教える**：スタートメニューで「PowerShell」を検索して開く。
3. **1回に1つ**：コマンドは1回に1つ（多くても、続けて実行して問題ないもの2〜3行）だけ、コードブロックで示します。各コマンドに「何をするか」を一言添えます。
4. **結果を貼ってもらう**：毎回「表示された文字を全部コピーして、ここに貼ってください」と頼みます。結果を見るまで次のコマンドを出さないでください。
5. **PowerShell を閉じたら**：`$P` などの変数が消えます。もう一度、変数を作るコマンドから示してください。
6. **エンティティの一覧（手順 5）**：トークンをチャットに貼らせないため、HA の画面（設定 → デバイスとサービス → エンティティ）で、使いたいものの「エンティティ ID」をコピーして貼ってもらいます。
7. **buttons.js（手順 6）**：あなたが完成した `buttons.js` の全文をコードブロックで示し、ユーザーにメモ帳で開いたファイルの中身を全部置き換えて保存してもらいます。保存するときの文字コードは「UTF-8」です。

## 手順

### 0. 環境を調べる

- Windows であること（このプラグインの動作確認は Windows 11 のみ）。
- Stream Dock ソフトが入っていること：`C:\Program Files (x86)\StreamDock\StreamDock.exe` があるか。無ければ、ユーザーに MiraBox の公式サイトから Stream Dock ソフトを入れてもらい、Stream Dock を USB でつないで、ソフトの画面に機種名が出ることを確かめてもらいます。インストール先が違う場合は、スタートメニューのショートカットから場所を調べます。
- プラグインのフォルダがあること：`$env:APPDATA\HotSpot\StreamDock\plugins`。無ければ、Stream Dock ソフトを一度起動して終了すると作られるか確かめます。それでも無い場合は、`$env:APPDATA` の下で `StreamDock` を含むフォルダを探し、見つかった場所をユーザーに伝えて止まってください（版によって場所が違う可能性があります）。
- HA に届くこと：HA の IP アドレスをユーザーに聞き、`Test-NetConnection <IP> -Port 8123` が `TcpTestSucceeded : True` になること。HA を https（Nabu Casa のみ、など）で使っている場合は、その URL を聞いて、手順 3 で `wss://<ホスト名>/api/websocket` を使います。

### 1. Stream Dock ソフトを終了する

```powershell
Stop-Process -Name StreamDock -ErrorAction SilentlyContinue
```

終了したことを `Get-Process StreamDock -ErrorAction SilentlyContinue` が何も表示しないことで確かめます。

### 2. プラグインをコピーする

```powershell
$W = "$env:USERPROFILE\StreamDockHA"          # 作業フォルダ
$P = "$env:APPDATA\HotSpot\StreamDock\plugins\com.bey.homeassistant.sdPlugin"
New-Item -ItemType Directory -Force $W | Out-Null
Invoke-WebRequest https://github.com/bey-jp/mirabox-streamdock-ha/archive/refs/heads/main.zip -OutFile $W\main.zip
Expand-Archive $W\main.zip -DestinationPath $W -Force
```

- `$P` がすでにある場合は「守ること 2」のとおりバックアップしてから、中の `plugin\config.js` と `plugin\buttons.js` は残すかユーザーに聞きます（以前の設定を使い続けるなら残す）。
- コピー：`Copy-Item $W\mirabox-streamdock-ha-main\com.bey.homeassistant.sdPlugin $P -Recurse`（`$P` が無いとき）。
  `$P` があるときは中身を上書きします：`Copy-Item $W\mirabox-streamdock-ha-main\com.bey.homeassistant.sdPlugin\* $P -Recurse -Force`（残すと決めた `config.js` / `buttons.js` は、事前に退避して戻す）。
- 確認：`Test-Path $P\manifest.json` と `Test-Path $P\plugin\main.js` が `True`。

### 3. アイコンのフォントと接続設定

```powershell
Invoke-WebRequest https://cdn.jsdelivr.net/npm/@mdi/font@7.4.47/fonts/materialdesignicons-webfont.ttf -OutFile $P\plugin\mdi.ttf
(Get-Item $P\plugin\mdi.ttf).Length    # 約 1.3MB 前後なら OK
Copy-Item $P\plugin\config.js.example $P\plugin\config.js
```

`config.js` の `192.168.1.10` を、手順 0 で確かめた HA の IP アドレスに置き換えます（あなたが置き換えてかまいません。トークンの行には触れないでください）。
https の場合は、`url` の行全体を `wss://<ホスト名>/api/websocket` にします。

次に、ユーザーにトークンを作ってもらいます。

1. ブラウザで HA を開き、左下のユーザー名 → 上のタブ「セキュリティ」→ いちばん下「長期アクセストークン」→「トークンを作成」。名前は「Stream Dock」など。
2. 表示されたトークンをコピーします（この画面を閉じると二度と表示されません）。
3. `notepad $P\plugin\config.js` でメモ帳を開き、`PASTE_TOKEN_HERE` の部分（`"` の内側）をトークンに置き換えて、上書き保存します。

ユーザーが保存したら、トークンを表示せずに次で確かめます。

```powershell
(Select-String -Path $P\plugin\config.js -Pattern 'PASTE_TOKEN_HERE').Count   # 0 なら貼れている
```

### 4. 動作確認（例のボタンのまま）

1. Stream Dock ソフトを起動：`Start-Process "C:\Program Files (x86)\StreamDock\StreamDock.exe"`
2. 10秒ほど待って、ログを確認：
   ```powershell
   Get-ChildItem $env:APPDATA\HotSpot\StreamDock\logs\log-*.txt | Sort-Object LastWriteTime | Select-Object -Last 1 |
     Select-String 'com.bey.homeassistant'
   ```
   `com.bey.homeassistant.sdPlugin is now connected` が出れば読み込みは成功です。
3. ユーザーに、画面右の一覧の「Home Assistant」→「HA Toggle」を空いているキーにドラッグしてもらいます。キーに「未設定」と出て、画面下の設定欄に「ボタン」のプルダウンが出れば OK です。
   この時点では例のエンティティなので、プルダウンで選ぶとグレー（存在しない）になるのが正常です。

一覧に「Home Assistant」が出ない場合は、フォルダの場所（`$P\manifest.json`）を確認し、ソフトを終了 → 起動し直します。

### 5. 使いたい機器を聞いて、エンティティを調べる

ユーザーに「Stream Dock で操作したいもの」を聞きます（例：リビングの照明、デスクライト、扇風機、玄関の鍵、映画シーン、全消灯）。キーの数（293S なら 15 キーのうち、シーン切替などで使っていないもの）も目安に伝えます。足りなければ、Stream Dock の「シーン」を増やしてページのように切り替えられることも伝えます。

エンティティ ID は HA から一覧で取ります。トークンは `config.js` から読み、**表示しない**こと。

```powershell
$cfg  = Get-Content $P\plugin\config.js -Raw
$tok  = [regex]::Match($cfg, 'token:\s*"([^"]+)"').Groups[1].Value
$base = [regex]::Match($cfg, 'url:\s*"wss?://([^/"]+)').Groups[1].Value
$http = if ($cfg -match 'wss://') { "https://$base" } else { "http://$base" }
$st = Invoke-RestMethod "$http/api/states" -Headers @{ Authorization = "Bearer $tok" }
$st | Where-Object { $_.entity_id -match '^(light|switch|fan|lock|scene|script|input_boolean|input_select|select|cover|climate|media_player)\.' } |
  ForEach-Object { "{0}`t{1}`t{2}`t{3}" -f $_.entity_id, $_.state, $_.attributes.friendly_name, $_.attributes.icon } |
  Out-File $W\entities.txt -Encoding utf8
(Get-Content $W\entities.txt).Count
```

`$W\entities.txt` を読み、ユーザーの言葉（「リビングの照明」など）に合うものを探して、候補をユーザーに確認します。`401` が返ったらトークンの貼り間違いです。

### 6. buttons.js を書く

`$P\plugin\buttons.js` を、ユーザーの機器に合わせて書き換えます。ファイル先頭の説明に書式があります。

- **toggle できるもの**（light / switch / fan / input_boolean）：`{ cat, name, icon, entity }` だけ書く。
- **scene**：`scene(cat, 名前, アイコン, entity)`。**script**：`script(...)`。どちらも状態が無いのでアイコンは白。
- **lock**：例の `front_lock` の形（`lock: true` と `press()`）。
- **select / input_select**：選択肢ごとに `selectOption(cat, 名前, アイコン, entity, 選択肢)` を1つずつ。
- **誤操作が困るもの**（PC のシャットダウン・スリープ、全消灯、解錠など）は `confirm: true` を付けるか、ユーザーに聞く。
- `cover`（カーテン）・`climate`（エアコン）・`media_player` は toggle で動かない場合があります。`press()` に `callService("cover", "toggle", this.entity)` のように書くか、HA 側のスクリプトを呼ぶ形にします。
- `name` はキーに出る名前。日本語で4〜5文字くらいまでが見やすい（長いと自動で小さくなる）。
- `icon` は HA で付いているアイコン（`entities.txt` の4列目、`mdi:` を除く）を優先。無ければ種類に合うもの（lightbulb、fan、power-plug、lock、movie-open など）。名前は https://pictogrammers.com/library/mdi/ で確認できます。`plugin\mdi_codepoints.js` に無い名前は「？」のアイコンになるので、書いたら次で確かめます。
- `cat`（背景色）は README の表のとおり。
- `key`（行頭の名前）は英数字と `_` で、ほかと重ならないもの。一度キーに割り当てた後で変えると「未定義」になるので、決めたら変えないよう伝えます。
- 例のボタンで使わないものは消します。
- ファイルは **UTF-8** で保存します（PowerShell 5.1 の `Set-Content` 既定は UTF-8 ではないので、`-Encoding utf8` を付けるか、エディタで保存）。

書いたら、構文とアイコンを確かめます（Node.js がある場合）：

```powershell
node -e "global.window={};require(process.argv[1]);const fs=require('fs');eval(fs.readFileSync(process.argv[2],'utf8')+';global.B=BUTTONS');for(const[k,b]of Object.entries(B)){const i=b.lock?'lock':b.icon;if(!window.MDI[i])console.log('アイコンが無い',k,i)}console.log(Object.keys(B).length,'個 OK')" $P\plugin\mdi_codepoints.js $P\plugin\buttons.js
```

Node.js が無い場合は、ファイル全体を見直して、カッコ `{}`・カンマ `,`・`"` の対応を確かめます。構文エラーがあると全部のキーが動きません（手順 7 で何も表示されなければ、まず構文を疑ってください）。

### 7. 反映して、ユーザーに並べてもらう

1. Stream Dock ソフトを再起動します（終了 → 起動。手順 1 と 4 のコマンド）。
2. ユーザーに、各キーに「HA Toggle」をドラッグし、画面下の「ボタン」で割り当てを選んでもらいます。
   同じキーにすでに別の操作がある場合は、上書きしてよいか確かめてもらいます。
3. 何個か押してもらい、機器が動くこと、色が変わること（ON=黄、OFF=青）を確かめます。HA のアプリやダッシュボードで切り替えても、キーの色が追いかけて変わることも見てもらいます。

### 8. 終わったら伝えること

- ボタンを増やす・変えるときは `buttons.js` を書き換えて、Stream Dock ソフトを再起動する。
- 置き場所：`%APPDATA%\HotSpot\StreamDock\plugins\com.bey.homeassistant.sdPlugin\plugin\buttons.js`（エクスプローラーのアドレス欄にそのまま貼ると開ける）。
- `config.js` にはトークンが入っているので、人に渡したり公開したりしない。HA のトークンが漏れたと思ったら、HA の同じ画面でそのトークンを削除して作り直す。
- シーン設定の「アプリに関連付け」を「全アプリ」にすると、ほかのシーンに移っても数秒で戻されるので「なし」のままにする。

## よくあるつまずき

| 症状 | 確認すること |
|---|---|
| 一覧に「Home Assistant」が出ない | `plugins\com.bey.homeassistant.sdPlugin\manifest.json` の場所。ソフトの完全終了（タスクトレイにも残っていない）→ 起動 |
| 全部グレー | `config.js` の url（IP・ポート 8123・`/api/websocket`）とトークン。HA に届くか（`Test-NetConnection`）。https なら `wss://` |
| 何も表示されない・押しても動かない | `buttons.js` の構文エラー（手順 6 の確認） |
| 1つだけグレー | entity の綴り、または機器が応答していない（HA でも unavailable） |
| アイコンが □ | `plugin\mdi.ttf` が無い・壊れている（手順 3） |
| アイコンが「？」 | `icon` の名前が MDI に無い |
| 「未定義」 | そのキーに割り当てた key が `buttons.js` に無い |
| 押すと別のものが動く | 同じ key を2つ書いている（後の定義が勝つ） |
