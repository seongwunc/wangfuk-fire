# 宏福苑火災網頁 README

這個資料夾已經包含完整網頁成品，主要文件如下：

## 線上版本

網頁已成功部署到 GitHub Pages，可直接打開：

```text
https://seongwunc.github.io/wangfuk-fire/
```

- `index.html`：網頁主頁
- `styles.css`：樣式表
- `script.js`：互動與圖表腳本
- `d3.min.js`：本地 D3 函式庫
- `assets/`：圖片素材

## 怎麼打開網頁

最簡單的方法有兩種。

### 方法一：直接打開

1. 在 Finder 進入這個資料夾：
   `/Users/sylviachan/Documents/New project 21`
2. 直接雙擊 `index.html`
3. 瀏覽器就會打開網頁

如果只是看基本排版，這個方法通常就可以。

### 方法二：用本地伺服器打開

如果你想更穩定地查看圖片、腳本和互動效果，建議用這個方法。

1. 打開 Terminal
2. 進入專案資料夾：

```bash
cd "/Users/sylviachan/Documents/New project 21"
```

3. 啟動本地伺服器：

```bash
python3 -m http.server 8765
```

4. 在瀏覽器打開：

```text
http://localhost:8765
```

5. 看完後回到 Terminal，按 `Ctrl + C` 關閉伺服器

## 建議使用

- 建議用 `Google Chrome` 開啟
- 如果頁面看起來沒有更新，請強制重新整理一次

## 交付時如果要給老師或組員

請至少一起打包這些內容：

- `index.html`
- `styles.css`
- `script.js`
- `d3.min.js`
- `assets/`

不要只單獨傳 `index.html`，否則圖片和圖表可能無法正常顯示。

## 部署到 GitHub Pages

本資料夾已整理成 GitHub Pages 可直接部署的靜態網站，入口文件是 `index.html`。目前已成功部署，正式網址為：

```text
https://seongwunc.github.io/wangfuk-fire/
```

以下步驟保留作為日後重新部署或更新頁面時使用。

### 1. 在 GitHub 建立新倉庫

在 GitHub 網站建立一個新的 repository，例如：

```text
wangfuk-fire-story
```

建立時可以先不要勾選 README，因為本資料夾已經有 README。

### 2. 綁定遠端倉庫並推送

在 Terminal 進入本資料夾後，執行以下命令。請把 `<你的GitHub用戶名>` 和 repository 名稱換成自己的。

```bash
cd "/Users/sylviachan/Documents/New project 21"
git add .
git commit -m "Deploy Wang Fuk Court fire story page"
git remote add origin https://github.com/<你的GitHub用戶名>/wangfuk-fire-story.git
git push -u origin main
```

### 3. 開啟 GitHub Pages

進入 GitHub repository 頁面後：

```text
Settings → Pages → Build and deployment → Source 選 Deploy from a branch
Branch 選 main
Folder 選 /root
Save
```

等待約 1 至 3 分鐘後，GitHub Pages 會生成網址，通常格式是：

```text
https://<你的GitHub用戶名>.github.io/wangfuk-fire-story/
```

如果頁面顯示舊版本，請等待一會兒再重新整理，或用無痕視窗打開。
