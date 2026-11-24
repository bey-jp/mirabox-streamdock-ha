// Stream Dock -> Home Assistant トグル (状態でアイコン色が変わる)
// ボタン定義は buttons.js（2026-11-25 に分離。Property Inspector の pi.html からも読む）。
// 各キーの Settings.key でどのボタンかを決める。key は Stream Dock の下の設定欄で選ぶ。

const COLOR = {
  on: "#ffc107",      // 点灯・ON = 黄
  off: "#2196f3",     // 消灯・OFF = 青
  offline: "#616161", // 切断(unavailable/unknown, HA未接続) = グレー
  locked: "#4caf50",  // 施錠 = 緑
  unlocked: "#f44336",// 解錠 = 赤
  moving: "#ff9800",  // 施錠中/解錠中など = オレンジ
  scene: "#e0e0e0",   // 状態を持たないシーン = 白
  confirm: "#ff9800", // confirm ボタンの「もう一度」待ち = オレンジ
};

// 種類ごとの背景色 [上, 下] のグラデーション。アイコンが埋もれないよう暗め・低彩度にしている。
const BG = {
  light: ["#6b3a12", "#241206"], // ライト = オレンジ
  plant: ["#1f5230", "#0b1f11"], // 植物 = グリーン
  fan: ["#173e63", "#08172a"],   // ファン = 青
  plug: ["#5e5010", "#211c05"],  // プラグ = 黄
  lock: ["#3e3452", "#15111f"],  // 鍵・玄関 = 紫がかったグレー
  display: ["#0f4a4f", "#05191b"], // LEDパネル表示切替 = シアン(ダッシュボードの icon_color)
  alloff: ["#5a1a1a", "#1f0808"],  // 全消灯 = 暗い赤
  pc: ["#34364a", "#12131b"],      // PC = 青みのグレー(2026-11-25)
  offline: ["#3a3a3a", "#161616"], // 切断中は種類に関係なくグレー
};

// ---------------- Home Assistant websocket ----------------
let ha = null, haReady = false, msgId = 1;
const states = {};

function stateOf(entity) { return states[entity]; }

function connectHA() {
  ha = new WebSocket(HA_CONFIG.url);
  ha.onmessage = (ev) => {
    const m = JSON.parse(ev.data);
    if (m.type === "auth_required") {
      ha.send(JSON.stringify({ type: "auth", access_token: HA_CONFIG.token }));
    } else if (m.type === "auth_ok") {
      haReady = true;
      const ids = [...new Set(Object.values(BUTTONS).map((b) => b.entity))];
      ha.send(JSON.stringify({ id: msgId++, type: "subscribe_entities", entity_ids: ids }));
    } else if (m.type === "event" && m.event) {
      const e = m.event;
      for (const [id, v] of Object.entries(e.a || {})) states[id] = v.s;
      for (const [id, v] of Object.entries(e.c || {})) if (v["+"] && "s" in v["+"]) states[id] = v["+"].s;
      for (const id of e.r || []) delete states[id];
      renderAll();
    }
  };
  ha.onclose = () => {
    haReady = false;
    renderAll();
    setTimeout(connectHA, 5000);
  };
  ha.onerror = () => ha.close();
}

function callService(domain, service, entity, data = {}) {
  if (!haReady) return;
  ha.send(JSON.stringify({
    id: msgId++, type: "call_service", domain, service,
    service_data: Object.assign({ entity_id: entity }, data),
  }));
}

// ---------------- 描画 ----------------
function colorAndIcon(btn) {
  const s = stateOf(btn.entity);
  if (!haReady || s === undefined || s === "unavailable" || s === "unknown") {
    return { color: COLOR.offline, icon: btn.lock ? "lock" : btn.icon };
  }
  if (btn.lock) {
    if (s === "locked") return { color: COLOR.locked, icon: "lock" };
    if (s === "unlocked" || s === "open") return { color: COLOR.unlocked, icon: "lock-open-variant" };
    return { color: COLOR.moving, icon: "lock" };
  }
  if (btn.stateless) return { color: COLOR.scene, icon: btn.icon };
  if (btn.selected) return { color: s === btn.selected ? COLOR.on : COLOR.off, icon: btn.icon };
  return { color: s === "on" ? COLOR.on : COLOR.off, icon: btn.icon };
}

// 種類ごとの色付き背景: 縦グラデーション + アイコン裏の暗い円 + 薄い縁取り
function drawBackground(g, S, cat) {
  const [top, bottom] = BG[cat] || BG.offline;
  const grad = g.createLinearGradient(0, 0, 0, S);
  grad.addColorStop(0, top);
  grad.addColorStop(1, bottom);
  g.fillStyle = grad;
  g.fillRect(0, 0, S, S);
  g.fillStyle = "rgba(0,0,0,0.35)";
  g.beginPath();
  g.arc(S / 2, 58, 50, 0, Math.PI * 2);
  g.fill();
  g.strokeStyle = "rgba(255,255,255,0.12)";
  g.lineWidth = 2;
  g.beginPath();
  if (g.roundRect) g.roundRect(1, 1, S - 2, S - 2, 16); // 古い WebEngine には roundRect が無い
  else g.rect(1, 1, S - 2, S - 2);
  g.stroke();
}

function drawButton(btn) {
  const S = 144, c = document.createElement("canvas");
  c.width = c.height = S;
  const g = c.getContext("2d");
  let { color, icon } = colorAndIcon(btn);
  const offline = color === COLOR.offline;
  const waiting = btn.confirm && armed[btn.key];
  if (waiting) color = COLOR.confirm;
  drawBackground(g, S, offline ? "offline" : btn.cat);
  g.textAlign = "center";
  g.textBaseline = "middle";
  g.fillStyle = color;
  g.font = "86px mdi";
  g.fillText(String.fromCodePoint(parseInt(MDI[icon] || MDI["help-box"] || "F078B", 16)), S / 2, 58);
  g.fillStyle = offline ? "#9e9e9e" : waiting ? COLOR.confirm : "#f0f0f0";
  const label = waiting ? "もう一度" : btn.name;
  // 長い名前はキー幅に収まるまで縮める
  let size = 22;
  do {
    g.font = `bold ${size}px "Yu Gothic UI", "Yu Gothic", "Meiryo", sans-serif`;
  } while (g.measureText(label).width > S - 14 && --size > 12);
  g.fillText(label, S / 2, 122);
  return c.toDataURL("image/png");
}

// ---------------- Stream Dock ----------------
let sd = null;
const contexts = {}; // context -> key
const armed = {};    // confirm ボタンの「もう一度」待ち key -> timer
for (const [k, b] of Object.entries(BUTTONS)) b.key = k;

function renderContext(ctx) {
  if (!sd) return;
  const key = contexts[ctx];
  const btn = BUTTONS[key];
  // BUTTONS に無い key は何も描かないと apply_layout.py の仮画像(天ファン)のまま残り、
  // 何が起きているか分からないので「未定義」と key を出す(2026-11-08)
  const image = btn ? drawButton(btn) : drawUnknown(key);
  sd.send(JSON.stringify({ event: "setImage", context: ctx, payload: { image, target: 0 } }));
}

function drawUnknown(key) {
  // key が空 = 置いたばかりでまだ選んでいない
  if (!key) key = "下の設定欄で選ぶ";
  const S = 144, c = document.createElement("canvas");
  c.width = c.height = S;
  const g = c.getContext("2d");
  g.fillStyle = "#3a3a3a"; g.fillRect(0, 0, S, S);
  g.fillStyle = "#ffffff"; g.textAlign = "center";
  g.font = 'bold 24px "Yu Gothic UI", "Meiryo", sans-serif';
  g.fillText(key === "下の設定欄で選ぶ" ? "未設定" : "未定義", S / 2, 60);
  let size = 20;
  do { g.font = `${size}px Consolas, monospace`; } while (g.measureText(String(key)).width > S - 10 && --size > 10);
  g.fillText(String(key), S / 2, 96);
  return c.toDataURL("image/png");
}

function renderAll() { Object.keys(contexts).forEach(renderContext); }

function connectElgatoStreamDeckSocket(port, uuid, registerEvent) {
  sd = new WebSocket("ws://127.0.0.1:" + port);
  sd.onopen = () => sd.send(JSON.stringify({ event: registerEvent, uuid }));
  sd.onmessage = (ev) => {
    const m = JSON.parse(ev.data);
    const key = m.payload && m.payload.settings && m.payload.settings.key;
    if (m.event === "willAppear" || m.event === "didReceiveSettings") {
      contexts[m.context] = key;
      renderContext(m.context);
    } else if (m.event === "sendToPlugin" && m.payload && "key" in m.payload) {
      // 設定欄(pi.html)でボタンを選んだとき。didReceiveSettings が来ない場合の保険
      contexts[m.context] = m.payload.key;
      renderContext(m.context);
    } else if (m.event === "willDisappear") {
      delete contexts[m.context];
    } else if (m.event === "keyDown") {
      const btn = BUTTONS[key];
      if (!btn) return;
      if (btn.confirm && !armed[key]) {
        // 1回目は「もう一度」を出すだけ。3秒以内にもう一度押すと実行
        armed[key] = setTimeout(() => { delete armed[key]; renderAll(); }, 3000);
        renderAll();
        return;
      }
      if (btn.confirm) { clearTimeout(armed[key]); delete armed[key]; renderAll(); }
      if (btn.press) btn.press();
      else callService(btn.entity.split(".")[0], "toggle", btn.entity);
    }
  };
}

document.fonts.load("86px mdi").then(renderAll);
connectHA();
