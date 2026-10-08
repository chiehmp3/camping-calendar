// 為每位使用者產生專屬的 .ics 訂閱檔，輸出到 feeds/<token>.ics
// 由 GitHub Actions 定時執行；需要環境變數 FIREBASE_SERVICE_ACCOUNT（服務帳戶 JSON）
const fs = require("fs");
const path = require("path");
const admin = require("firebase-admin");

admin.initializeApp({
  credential: admin.credential.cert(JSON.parse(process.env.FIREBASE_SERVICE_ACCOUNT))
});
const db = admin.firestore();
const OUT_DIR = path.join(__dirname, "..", "feeds");

const esc = (s) => String(s || "").replace(/\\/g, "\\\\").replace(/\r?\n/g, "\\n").replace(/,/g, "\\,").replace(/;/g, "\\;");

// RFC 5545：每行最多 75 bytes，超過要折行
function fold(line) {
  const out = [];
  let cur = "";
  let bytes = 0;
  for (const ch of line) {
    const n = Buffer.byteLength(ch);
    if (bytes + n > 74) { out.push(cur); cur = " " + ch; bytes = 1 + n; }
    else { cur += ch; bytes += n; }
  }
  out.push(cur);
  return out.join("\r\n");
}

function addOneDay(dateStr) {
  const [y, m, d] = dateStr.split("-").map(Number);
  const dt = new Date(Date.UTC(y, m - 1, d));
  dt.setUTCDate(dt.getUTCDate() + 1);
  return dt.toISOString().slice(0, 10);
}

function description(t) {
  const lines = [];
  if (t.siteNumber) lines.push("營位：" + t.siteNumber);
  if (t.siteFee) lines.push("營位費用：$" + t.siteFee);
  if (t.startTime) lines.push("報到時間：" + t.startTime);
  if (t.endTime) lines.push("離營時間：" + t.endTime);
  if (t.notes) lines.push(t.notes);
  return lines.join("\n");
}

// DTSTAMP 用行程自己的更新時間，內容沒變時檔案就不會變，避免產生多餘的 commit
function stamp(t) {
  const ts = t.updatedAt || t.createdAt;
  const d = ts && ts.toDate ? ts.toDate() : new Date("2020-01-01T00:00:00Z");
  return d.toISOString().replace(/[-:]/g, "").split(".")[0] + "Z";
}

function buildIcs(calName, trips) {
  const lines = [
    "BEGIN:VCALENDAR",
    "VERSION:2.0",
    "PRODID:-//camping-calendar//tw",
    "CALSCALE:GREGORIAN",
    "METHOD:PUBLISH",
    "X-WR-CALNAME:" + esc(calName),
    "REFRESH-INTERVAL;VALUE=DURATION:PT15M",
    "X-PUBLISHED-TTL:PT15M"
  ];
  for (const { id, data: t } of trips) {
    lines.push(
      "BEGIN:VEVENT",
      "UID:" + id + "@camping-calendar",
      "DTSTAMP:" + stamp(t),
      "DTSTART;VALUE=DATE:" + t.start.replace(/-/g, ""),
      "DTEND;VALUE=DATE:" + addOneDay(t.end).replace(/-/g, ""),
      "SUMMARY:" + esc((t.ownerName ? t.ownerName + "・" : "") + t.title),
      "LOCATION:" + esc(t.location),
      "DESCRIPTION:" + esc(description(t)),
      "END:VEVENT"
    );
  }
  lines.push("END:VCALENDAR");
  return lines.map(fold).join("\r\n") + "\r\n";
}

(async () => {
  const [usersSnap, tokensSnap, tripsSnap] = await Promise.all([
    db.collection("users").get(),
    db.collection("feedTokens").get(),
    db.collection("trips").get()
  ]);
  const names = {};
  usersSnap.forEach(d => { names[d.id] = d.data().displayName || ""; });

  // 只同步今年 1/1 以後的行程，避免舊紀錄塞滿手機日曆
  const cutoff = new Date().getFullYear() + "-01-01";
  const trips = [];
  tripsSnap.forEach(d => {
    const t = d.data();
    if (t.start && t.end && t.title && t.end >= cutoff) trips.push({ id: d.id, data: t });
  });

  fs.mkdirSync(OUT_DIR, { recursive: true });
  const keep = new Set();
  tokensSnap.forEach(d => {
    const token = d.data().token;
    if (!/^[0-9a-f]{32}$/.test(token || "")) return;
    const uid = d.id;
    const mine = trips.filter(({ data: t }) => t.ownerUid === uid || (t.participantUids || []).includes(uid));
    const file = token + ".ics";
    keep.add(file);
    fs.writeFileSync(path.join(OUT_DIR, file), buildIcs("露營行事曆 - " + (names[uid] || ""), mine));
  });
  for (const f of fs.readdirSync(OUT_DIR)) {
    if (f.endsWith(".ics") && !keep.has(f)) fs.unlinkSync(path.join(OUT_DIR, f));
  }
  console.log(`feeds: ${keep.size}, trips considered: ${trips.length}`);
})().catch(e => { console.error(e); process.exit(1); });
