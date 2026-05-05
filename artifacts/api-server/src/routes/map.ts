import { Router } from "express";
import { readFileSync } from "fs";
import { join, dirname } from "path";
import { fileURLToPath } from "url";
import { beachesTable, db, surfReportsTable } from "@workspace/db";
import { asc, eq } from "drizzle-orm";

const router = Router();

const publicDir = join(dirname(fileURLToPath(import.meta.url)), "../public");
const leafletCss = readFileSync(join(publicDir, "leaflet.css"), "utf-8");

/**
 * GET /api/map
 * HTML shell — DOM structure + CSS + beach data embedded as a JSON data block
 * (<script type="application/json"> is never executed by the browser, so it
 * bypasses Android WebView inline-script restrictions entirely).
 *
 * Zero executable <script> tags. JavaScript is injected by the React Native
 * WebView via injectedJavaScript, which fetches Leaflet from /api/static/
 * within the WebView's own network context.
 */
router.get("/map", async (req, res, next) => {
  try {
    const rows = await db
      .select({
        id: beachesTable.id,
        name: beachesTable.name,
        latitude: beachesTable.latitude,
        longitude: beachesTable.longitude,
        heroImageUrl: beachesTable.heroImageUrl,
        latestScore: surfReportsTable.score,
        latestScoreLabel: surfReportsTable.scoreLabel,
      })
      .from(beachesTable)
      .leftJoin(
        surfReportsTable,
        eq(surfReportsTable.beachId, beachesTable.id),
      )
      .orderBy(asc(beachesTable.region), asc(beachesTable.name));

    const beaches = rows.map((r) => ({
      id: r.id,
      name: r.name,
      lat: r.latitude,
      lng: r.longitude,
      score: r.latestScore,
      label: r.latestScoreLabel,
      imageUrl: r.heroImageUrl,
    }));

    const beachesJson = JSON.stringify(beaches);

    const html = `<!DOCTYPE html>
<html>
<head>
  <meta charset="utf-8">
  <meta name="viewport" content="width=device-width,initial-scale=1,maximum-scale=1,user-scalable=no">
  <meta http-equiv="Content-Security-Policy"
        content="default-src * 'unsafe-inline' 'unsafe-eval' data: blob:;">
  <title>Surf Hut Map</title>
  <style>${leafletCss}</style>
  <style>
    *{margin:0;padding:0;box-sizing:border-box}
    html,body{height:100%;width:100%;overflow:hidden}
    #map{position:fixed;top:0;left:0;right:0;bottom:0;background:#e8e0d8}

    #loading{
      position:fixed;top:0;left:0;right:0;bottom:0;
      display:flex;flex-direction:column;
      align-items:center;justify-content:center;
      background:#FAF7F2;z-index:9999;
      font-family:-apple-system,BlinkMacSystemFont,sans-serif;
    }
    #loading .dot{
      width:40px;height:40px;border-radius:50%;
      background:#E36322;margin-bottom:16px;
      animation:pulse 1.2s ease-in-out infinite;
    }
    @keyframes pulse{0%,100%{transform:scale(1);opacity:1}50%{transform:scale(1.2);opacity:.7}}
    #loading .txt{font-size:16px;font-weight:600;color:#333}
    #loading .sub{font-size:13px;color:#888;margin-top:6px}

    #error-box{
      display:none;position:fixed;top:0;left:0;right:0;bottom:0;
      flex-direction:column;align-items:center;justify-content:center;
      background:#FAF7F2;z-index:9999;padding:32px;
      font-family:-apple-system,BlinkMacSystemFont,sans-serif;
    }
    #error-box .etitle{font-size:16px;font-weight:700;color:#c0392b;margin-bottom:8px}
    #error-box .emsg{font-size:13px;color:#555;text-align:center;word-break:break-all}

    .pin{
      width:32px;height:32px;border-radius:50%;
      border:2.5px solid rgba(255,255,255,.88);
      display:flex;align-items:center;justify-content:center;
      font-family:-apple-system,BlinkMacSystemFont,sans-serif;
      font-weight:700;font-size:13px;color:#fff;
      box-shadow:0 2px 6px rgba(0,0,0,.32);cursor:pointer;
    }
    .popup-box{font-family:-apple-system,BlinkMacSystemFont,sans-serif;min-width:160px}
    .popup-name{font-weight:600;font-size:15px;color:#1a1a1a;margin-bottom:6px}
    .popup-row{display:flex;align-items:center;gap:8px;margin-bottom:4px}
    .badge{border-radius:6px;padding:2px 8px;font-size:12px;font-weight:600;color:#fff}
    .popup-score{font-size:13px;color:#666}
    .popup-hint{font-size:11px;color:#E36322;margin-top:6px;cursor:pointer;font-weight:600}

    .legend{
      position:fixed;bottom:24px;right:12px;
      background:rgba(250,247,242,.96);border-radius:12px;
      padding:10px 14px;z-index:1000;
      font-family:-apple-system,BlinkMacSystemFont,sans-serif;
      font-size:12px;color:#333;
      box-shadow:0 2px 8px rgba(0,0,0,.12);pointer-events:none;
      display:none;
    }
    .legend-row{display:flex;align-items:center;gap:8px;margin-bottom:5px}
    .legend-row:last-child{margin-bottom:0}
    .legend-dot{width:9px;height:9px;border-radius:50%;flex-shrink:0}

    .leaflet-popup-content-wrapper{border-radius:12px;box-shadow:0 4px 16px rgba(0,0,0,.15);overflow:hidden}
    .leaflet-popup-content{margin:12px 14px}
    .leaflet-popup-tip-container{display:none}
    .popup-img{display:block;width:calc(100% + 28px);height:100px;object-fit:cover;margin:-12px -14px 10px -14px;border-radius:0}
    .leaflet-control-zoom a{border-radius:8px!important}
  </style>
</head>
<body>
  <div id="loading">
    <div class="dot"></div>
    <div class="txt">Checking the surf\u2026</div>
    <div class="sub">Loading map</div>
  </div>
  <div id="error-box">
    <div class="etitle">Could not load map</div>
    <div class="emsg" id="error-msg"></div>
  </div>
  <div id="map"></div>
  <div class="legend" id="legend">
    <div class="legend-row"><div class="legend-dot" style="background:#E36322"></div>Epic</div>
    <div class="legend-row"><div class="legend-dot" style="background:#1F8A8A"></div>Good</div>
    <div class="legend-row"><div class="legend-dot" style="background:#C4921B"></div>Fair</div>
    <div class="legend-row"><div class="legend-dot" style="background:#8E8E8E"></div>Poor</div>
  </div>

  <!-- Beach data as non-executable JSON data block — never blocked by CSP -->
  <script type="application/json" id="beach-data">${beachesJson}</script>
</body>
</html>`;

    res.setHeader("Content-Type", "text/html; charset=utf-8");
    res.setHeader("Cache-Control", "no-store");
    res.send(html);
  } catch (err) {
    next(err);
  }
});

export default router;
