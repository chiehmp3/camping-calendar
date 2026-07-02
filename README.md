# 露營行事曆 — 部署教學（給沒有寫過程式的你）

這個工具有 2 個檔案：
- `index.html`：整個網頁應用程式（畫面 + 功能都在這一個檔案裡）
- `firestore.rules`：資料安全規則（決定誰能讀/寫什麼資料）

網頁本身會發佈在 **GitHub Pages**（免費、公開網址），但登入帳號、密碼、露營行程等資料還是要靠 **Firebase**（Google 提供的免費雲端資料庫）來儲存。所以要先設定 Firebase，再把網頁放到 GitHub。

整個流程大約 20-30 分鐘，完成後會拿到一個網址，6-15 位朋友都可以用手機或電腦打開來用。

---

## 第一步：建立 Firebase 專案

1. 瀏覽器打開 https://console.firebase.google.com
2. 用你的 Google 帳號登入
3. 點「新增專案」（Add project）
4. 專案名稱輸入，例如 `camping-calendar`，點「繼續」
5. 「為此專案啟用 Google Analytics」可以直接關掉（不需要），點「建立專案」
6. 等待約 30 秒，出現「你的新專案已就緒」，點「繼續」

## 第二步：啟用登入功能（Authentication）

> Firebase 主控台改版過，如果你左側選單沒看到「建構」(Build)，代表你用的是新版介面，請照下面的路徑找。

1. 左側選單點「**安全性**」，展開後點「**Authentication**」
2. 點「開始使用」(Get started)
3. 在「登入方式」清單中，找到「電子郵件/密碼」(Email/Password)，點進去
4. 把第一個開關（電子郵件/密碼）打開，點「儲存」

## 第三步：建立資料庫（Firestore）

1. 左側選單點「**資料庫和儲存空間**」，展開後在「NoSQL」區塊點「**Firestore**」（不是 SQL Connect，也不是 Realtime Database）
2. 點「建立資料庫」(Create database)
3. 位置選擇離台灣近的，例如 `asia-east1 (台灣)`，點「下一步」
4. 安全性規則先選「以測試模式啟動」(Start in test mode)，點「建立」
   - 沒關係，等一下我們會換上正式的安全規則

## 第四步：取得 Firebase 設定值

1. 點左上角齒輪圖示 ⚙️ → 「專案設定」(Project settings)
2. 往下捲到「你的應用程式」(Your apps)，點網頁圖示 `</>`
3. 應用程式暱稱輸入 `camping-calendar-web`，不用勾「同時設定 Firebase Hosting」，點「註冊應用程式」
4. 畫面會出現一段 `firebaseConfig = { ... }` 的程式碼，裡面有 `apiKey`、`authDomain`、`projectId`、`storageBucket`、`messagingSenderId`、`appId` 共 6 個值
5. **把這 6 個值貼給 Claude（我），我會直接幫你填進 `index.html`**，你不用自己開檔案編輯

> 補充說明：這 6 個值不是密碼，Google 官方設計上就是公開的（因為網頁程式碼本來就會被瀏覽器看到）。真正保護資料安全的是下一步的「安全規則」，不是靠隱藏這些值。

## 第五步：套用安全規則

1. 回到 Firebase Console，左側「Firestore Database」→ 上方分頁點「規則」(Rules)
2. 把畫面上原本的內容全部刪除
3. 打開 `firestore.rules` 檔案，把裡面全部內容複製，貼到 Firebase 的規則編輯區
4. 點「發布」(Publish)

## 第六步：在 GitHub 建立 repo

1. 瀏覽器打開 https://github.com/new （用 `chiehmp3` 這個帳號登入）
2. Repository name 輸入 `camping-calendar`
3. 選擇 **Public**（公開）— GitHub Pages 免費方案需要公開的 repo
4. **不要**勾選「Add a README file」「Add .gitignore」「Choose a license」，保持空的 repo
5. 點「Create repository」
6. 建立好之後告訴 Claude 一聲，我會把檔案推送上去

## 第七步：啟用 GitHub Pages

（等 Claude 推送完檔案後再做這一步）

1. 到 repo 頁面，點「Settings」
2. 左側選單點「Pages」
3. 「Build and deployment」→ Source 選 `Deploy from a branch`
4. Branch 選 `main`，資料夾選 `/ (root)`，點「Save」
5. 等 1-2 分鐘，重新整理頁面，會看到網址，格式類似：
   ```
   https://chiehmp3.github.io/camping-calendar/
   ```
   這個網址就是給大家用的行事曆網址，傳給朋友、存到手機主畫面即可。

---

## 使用方式

1. 打開網址後，第一次使用點「第一次使用？註冊新帳號」，輸入 Email、密碼、顯示名稱
2. 登入後，右上角圓形色塊可以點選改成自己喜歡的顏色，之後你新增的行程都會用這個顏色顯示
3. 點右下角「＋」新增露營行程（名稱、開始/結束日期、備註）
4. 行事曆上會顯示所有人的行程，並依照建立者的顏色區分，點行程可以看詳情；只有本人能編輯/刪除自己的行程
5. 手機瀏覽器打開網址後，可以用「加入主畫面」功能把它變成一個 App 圖示，方便之後直接點開

---

## 之後想再找我調整

如果之後想加功能（例如：出發前自動提醒、行程留言、匯出 Google 日曆等），把這個 README.md 和 index.html 拿給我，告訴我想加什麼即可。
