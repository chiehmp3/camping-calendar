# 露營行事曆 — 專案現況與交接（2026-10-08）

## 一句話現況

**已上線、多人使用中。** 朋友用網址註冊登入後，可共用一個月曆新增/查看露營行程、分攤營位費用、匯入匯出日曆。

| 項目 | 內容 |
|---|---|
| 網址 | https://chiehmp3.github.io/camping-calendar/ |
| GitHub repo | https://github.com/chiehmp3/camping-calendar（public，main branch） |
| Firebase 專案 | `camping-calendar-74962`（Spark 免費方案；Authentication + Firestore） |
| 本機資料夾 | `D:\Chieh\AI Asistant\camping-calendar` |

> 關聯專案：**Camp Planner**（露營場地配置規劃工具）是**另一個 repo、另一個網站**（https://chiehmp3.github.io/camp-planner/ ，repo `chiehmp3/camp-planner`，本機 `D:\Chieh\AI Asistant\camping managemant\camp-planner`），但跟本專案**共用同一個 Firebase 專案**，並互相連動（見下方「Camp Planner 連動」）。改這邊時不要順手動到那邊的程式。

## 檔案

- `index.html` — 全部程式（HTML/CSS/JS 單檔，無建置流程，依賴 CDN：FullCalendar 6.1.11、Firebase 10.13.0 compat）
- `firestore.rules` — Firestore 安全規則（**不會自動部署**，見下方）
- `README.md` — 給沒有程式背景的人看的完整部署教學（Firebase 設定 → GitHub Pages）
- `PROJECT_STATUS.md` — 本文件

## 已完成功能

- Email/密碼登入註冊；每人可自選顏色（行事曆上以顏色區分建立者）
- 多人共用月曆；**手機預設也是月曆**（可切換 list）
- 行程欄位：日期範圍、報到/離營時間、地點、營位、營位費用、備註、分攤成員
- 地點可點擊 → 開 Google 地圖（填地名/地址，或直接貼 Google 地圖連結）
- 分攤營位費用：平均分攤；每個人只能勾自己的「已付款」，所有人看得到進度
- 匯出：「加到 Google 日曆」、「下載 .ics」（Apple 日曆等）
- 匯入：從 Apple/Google 日曆匯出的 `.ics` 檔匯入，可全選、用小月曆選日期範圍篩選、勾選後一次匯入
- 日期選擇統一為「點開始日、再點結束日」的小月曆＋年/月下拉（新增行程與匯入篩選共用同一個元件 `createRangePicker`）
- 時間選擇為時/分下拉（分鐘 15 分級距；匯入的特殊分鐘會保留）
- 主畫面年/月下拉：只列「有行程的年份＋今年」，由小到大（現有 2019、2024–2027）
- **深夜模式**（7/29 加入）：預設跟隨系統深/淺色；登入畫面與主畫面各有切換鈕；選擇記在瀏覽器 `localStorage` 的 `camping-calendar-theme`
- **Camp Planner 連動**（7/28 加入）：每個行程視窗有連結，開啟 `https://chiehmp3.github.io/camp-planner/?tripId=<行程id>` 查看/編輯該場次的場地配置

## 資料結構（Firestore）

- `users/{uid}`：`displayName`、`color`、`email`
- `trips/{id}`：`title`、`start`、`end`（含結束日，`YYYY-MM-DD`）、`startTime`、`endTime`（`HH:MM` 或空）、`location`、`siteNumber`、`siteFee`、`notes`、`participantUids[]`、`ownerUid`、`ownerName`、`color`、`createdAt`、`updatedAt`
- `trips/{id}/payments/{uid}`：`paid`、`updatedAt`
- `layouts/{layoutId}`：Camp Planner 的場地配置存檔（由 Camp Planner 讀寫，本站只負責連結過去；欄位定義看 Camp Planner 專案）

權限：登入者可讀全部；只有建立者（`ownerUid`）能改/刪自己的行程；`payments` 只能寫自己那一筆；`layouts` 同樣是「登入者可讀、只有建立者可寫」。

## 日常維護流程

1. 改 `index.html`
2. `git add` → `git commit` → `git push origin main`
3. GitHub Pages 約 1–2 分鐘生效。**CDN 有延遲**：剛推完網址可能還是舊版，驗證時網址後面加 `?cachebust=任意數字`，或等 1–2 分鐘
4. 若改了 `firestore.rules`：**要手動**到 Firebase Console → Firestore Database → 規則 → 貼上 → 發布（改 `index.html` 不會更新規則）
   - 目前 repo 裡的 `firestore.rules` 已含 `layouts` 規則；**是否已發布到 Console 沒辦法從 repo 確認**，若 Camp Planner 存檔/讀取出現權限錯誤，先去 Console 確認規則是否與 repo 一致

## 已知注意事項 / 踩過的坑

- **時區**：`addOneDay()` 原本用本地時間運算，在台灣（UTC+8）會少算一天（跨天行程少顯示/匯出一天），已改用 UTC 運算。之後動日期邏輯別換回本地時間。
- **.ics 匯入**：全天事件的 `DTEND` 在 ICS 規格是「不含」結束日，匯入時已 -1 天轉成本系統的「含」結束日。
- **刪除行程**會一併刪掉它的 `payments` 子集合。
- Firebase 設定值（apiKey 等）寫在公開的 `index.html` 是正常的，安全靠 Firestore 規則 + 登入驗證，不是靠藏金鑰。
- 年份下拉選單只含有行程的年份：新年份第一次出現（有人新增那年的行程）才會出現在選單，或用月曆 ‹ › 翻過去時會自動補上。
- 自動化測試時，原生 `alert()` / `confirm()`（匯入成功提示、刪除確認）會卡住瀏覽器控制；人工使用不受影響。
- 沒有安裝 `gh` CLI；git 推送使用電腦上已登入的 `chiehmp3` 憑證。

## 開發歷程（git log 摘要）

1. 初版上線（Firebase + GitHub Pages）
2. 新增匯出日曆、地點連 Google 地圖、營位/時間/費用、分攤付款
3. 修正跨天行程少一天的時區 bug
4. 新增 .ics 匯入 → 全選與日期篩選 → 單一範圍小月曆 → 年/月下拉
5. 新增/編輯行程改用範圍小月曆與時分下拉；主畫面年/月下拉；手機預設月曆
6. 年份選單改為動態（可回溯到 2019 的舊紀錄）→ 只列有行程的年份、由小到大
7. （使用者自行/另一個工作階段加入）行程連結到 Camp Planner 場地配置（7/28）、深夜模式（7/29）

## 可能的下一步（僅是點子，尚未承諾）

- 行程留言／討論
- 出發前提醒
- 不平均分攤（自訂每人金額）
- 分攤付款提醒或總覽
