# mdi.css（@mdi/font 7.4.47）から全アイコンのコードポイント表 mdi_codepoints.js を作る（2026-11-25）。
# これで buttons.js の icon に MDI のどの名前を書いても表示できる（HA の "mdi:xxx" の xxx 部分）。
# 使い方: python make_mdi_codepoints.py mdi.css plugin/mdi_codepoints.js
#   mdi.css: curl -sL -o mdi.css https://cdn.jsdelivr.net/npm/@mdi/font@7.4.47/css/materialdesignicons.css
import json, re, sys

css = open(sys.argv[1], encoding="utf-8").read()
icons = dict(re.findall(r'\.mdi-([a-z0-9-]+)::before\s*\{\s*content:\s*"\\([0-9A-Fa-f]+)"', css))
open(sys.argv[2], "w", encoding="utf-8").write("window.MDI = " + json.dumps(icons, separators=(",", ":")) + ";\n")
print(len(icons), "icons")
