# FEATURE_MAP

Cut：`IMAGE-VECTORIZE-CUT-2026-11-10-v1`

| 能力 | 位置 | 验收 |
| --- | --- | --- |
| 本地选择 PNG/JPG（点击或拖放） | `index.html`，`js/app.js` | V1 |
| 浏览器内生成 SVG、预览、下载 | `ImageTracer.imagedataToSVG`；本机 blob，无上传 | V1、V3 |
| 颜色数滑杆 | `js/trace-options.js` → `numberofcolors`（2–32，默认 8） | V2 |
| 细节滑杆 | `js/trace-options.js` → `pathomit`（细节 100 → 0，细节 0 → 24） | V2 |
| 中文界面；说明更适合 logo / 图标，不自动去背景 | `index.html` | V1 |
| 不上传、无账号、无支付 | 页面脚本无 fetch / XHR；无 Creem / Dodo | V3 |
| 库与许可证 | `vendor/imagetracerjs/`，imagetracerjs 1.2.6，The Unlicense；无 Potrace / GPL | V4 |
| 测试 | `npm test`（`test/vectorize.test.js`，夹具 `test/fixtures/logo.png`） | V4 |
| 静态部署 | 根目录 `index.html`。Pages 由 Shane 开启，仓库不代为打开 | V5 |

不在本 cut：服务端或 AI 矢量化、Chrome 扩展、自动抠背景、路径编辑、GPL Potrace 移植、Creem / Dodo / 支付、账号、开启 GitHub Pages。
