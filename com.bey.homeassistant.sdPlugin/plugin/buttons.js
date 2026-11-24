// ボタン定義（このファイルだけ書き換えればボタンを増やせます）
//
// 1ボタン = key: { cat: 背景の種類, name: 表示名, icon: アイコン名, entity: HA のエンティティ ID }
//   key     : 英数字と _ の名前（ほかと重ならなければ何でもよい）
//   cat     : 背景色の種類 light(オレンジ) / plant(緑) / fan(青) / plug(黄) / lock(紫グレー)
//             / display(シアン) / alloff(暗い赤) / pc(青グレー)
//   name    : キーに出す名前（長いと自動で文字が小さくなる）
//   icon    : Material Design Icons の名前。HA の「mdi:lightbulb」なら "lightbulb"
//             一覧: https://pictogrammers.com/library/mdi/
//   entity  : HA の エンティティ ID（設定 → デバイスとサービス → エンティティ で確認）
//
// 押したときの動作:
//   何も書かない        → toggle（ON/OFF 切り替え。light / switch / fan / input_boolean など）
//   scene(...)          → シーンを実行（状態が無いのでアイコンは白のまま）
//   script(...)         → スクリプトを実行（同上）
//   confirm: true       → 誤操作防止。1回目で「もう一度」と出て、3秒以内にもう一度押すと実行
//   lock: true          → 鍵。施錠=緑・解錠=赤。押すたびに施錠⇔解錠
//   selectOption(...)   → select / input_select の項目を選ぶ。今その項目なら黄
//
// アイコンの色: ON=黄、OFF=青、HA につながらない・機器が応答しない=グレー
//
// 下は例です。entity をあなたの HA のものに書き換え、使わない行は消してください。

const BUTTONS = {
  // ----- 照明・スイッチ（押すと ON/OFF） -----
  living_light: { cat: "light", name: "リビング", icon: "lightbulb", entity: "light.living_room" },
  desk_lamp: { cat: "light", name: "デスク", icon: "desk-lamp", entity: "switch.desk_lamp" },
  led_tape: { cat: "light", name: "LEDテープ", icon: "led-strip-variant", entity: "switch.led_tape" },
  printer_3d: { cat: "plug", name: "3D", icon: "printer-3d", entity: "switch.printer_3d_plug" },
  plant_light: { cat: "plant", name: "植物", icon: "sprout-outline", entity: "switch.plant_light" },
  circulator: { cat: "fan", name: "サーキュ", icon: "fan", entity: "fan.circulator" },

  // ----- シーン・スクリプト（押すと実行） -----
  movie: scene("light", "映画", "movie-open", "scene.movie"),
  all_off: script("alloff", "全消灯", "power", "script.all_off"),
  pc_monitor_off: script("pc", "PC画面", "monitor-off", "script.pc_monitor_off"),
  // 間違えて押すと困るものは confirm: true（2回押しで実行）
  pc_sleep: Object.assign(script("pc", "PCスリープ", "power-sleep", "script.pc_sleep"), { confirm: true }),

  // ----- 鍵 -----
  front_lock: {
    cat: "lock", name: "鍵", entity: "lock.front_door", lock: true,
    press() { callService("lock", stateOf(this.entity) === "locked" ? "unlock" : "lock", this.entity); },
  },

  // ----- 選択肢から選ぶ（今その項目ならアイコンが黄） -----
  mode_home: selectOption("display", "在宅", "home", "input_select.house_mode", "在宅"),
  mode_away: selectOption("display", "外出", "home-export-outline", "input_select.house_mode", "外出"),
};

// ---- 定義用の小さな関数（ここは書き換えなくてよい） ----
function scene(cat, name, icon, entity) {
  return { cat, name, icon, entity, stateless: true, press() { callService("scene", "turn_on", entity); } };
}

function script(cat, name, icon, entity) {
  return { cat, name, icon, entity, stateless: true, press() { callService("script", "turn_on", entity); } };
}

function selectOption(cat, name, icon, entity, option) {
  return {
    cat, name, icon, entity, selected: option,
    press() { callService(entity.split(".")[0], "select_option", entity, { option }); },
  };
}
