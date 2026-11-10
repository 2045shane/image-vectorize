# 图片转矢量图

在浏览器本地把 PNG / JPG 转成 SVG。图片不会上传，不需要账号。

Cut：`IMAGE-VECTORIZE-CUT-2026-11-10-v1`

更适合 logo、图标等高对比图片。复杂照片可能会被简化成色块。不会自动去除背景。

## 本地打开

用浏览器直接打开根目录的 `index.html`，或启动静态文件服务：

```bash
python3 -m http.server 8080
```

然后访问 <http://127.0.0.1:8080/>。选择 PNG 或 JPG，调节颜色数和细节，预览后下载 SVG。

## GitHub Pages

仓库根目录就是可部署的静态站点，不需要构建，也没有服务端。GitHub Pages 需要仓库所有者 Shane 在仓库 Settings → Pages 里自行开启。本仓库不包含开启 Pages 的操作。

## 控件

| 控件 | 范围 | 默认 | imagetracerjs 参数 |
| --- | --- | --- | --- |
| 颜色数 | 2–32 | 8 | `numberofcolors` |
| 细节 | 0–100 | 50 | `pathomit`（细节 100 为 0，细节 0 为 24） |

细节越高，短小路径保留越多。最长边超过 800 像素时，先在本机画布上缩小到 800 再描摹。

## 测试

```bash
npm test
```

使用 Node.js 内置测试运行器（Node 18+）。测试读取 `test/fixtures/logo.png`，用 imagetracerjs 转成 SVG，并断言结果是 SVG，且颜色数、细节不同时输出不同。没有 npm 运行时依赖。

## 第三方库

- imagetracerjs 1.2.6，The Unlicense（公有领域奉献）
- 代码：`vendor/imagetracerjs/imagetracer.js`（与上游 1.2.6 文件一致，未修改）
- 许可证：`vendor/imagetracerjs/LICENSE`
- 上游：<https://github.com/jankovicsandras/imagetracerjs/tree/1.2.6>

不使用 Potrace 或其 GPL 移植。没有支付 SDK，没有云端或 AI 接口。
