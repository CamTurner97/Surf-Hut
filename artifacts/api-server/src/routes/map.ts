import { Router } from "express";
import { readFileSync } from "fs";
import { join, dirname } from "path";
import { fileURLToPath } from "url";
import { beachesTable, db, surfReportsTable } from "@workspace/db";
import { asc, eq } from "drizzle-orm";

const router = Router();

const publicDir = join(dirname(fileURLToPath(import.meta.url)), "../public");
const leafletJs = readFileSync(join(publicDir, "leaflet.js"), "utf-8");
const leafletCss = readFileSync(join(publicDir, "leaflet.css"), "utf-8");

/**
 * GET /api/map
 * Fully self-contained Leaflet map page for the mobile WebView.
 * Beach data is embedded directly in the HTML — no fetch() needed.
 */
router.get("/map", async (req, res, next) => {
  try {
    const rows = await db
      .select({
        id: beachesTable.id,
        name: beachesTable.name,
        latitude: beachesTable.latitude,
        longitude: beachesTable.longitude,
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
    }));

    const beachesJson = JSON.stringify(beaches);

    const html = `<!DOCTYPE html>
<html>
<head>
  <meta charset="utf-8">
  <meta name="viewport" content="width=device-width, initial-scale=1, maximum-scale=1, user-scalable=no">
  <title>Surf Hut Map</title>
  <style>${leafletCss}</style>
  <style>
    * { margin:0; padding:0; box-sizing:border-box; }
    html, body { height:100%; width:100%; overflow:hidden; }
    #map { position:fixed; top:0; left:0; right:0; bottom:0; background:#e8e0d8; }

    #loading {
      position:fixed; top:0; left:0; right:0; bottom:0;
      display:flex; flex-direction:column;
      align-items:center; justify-content:center;
      background:#FAF7F2; z-index:9999;
      font-family:-apple-system,BlinkMacSystemFont,sans-serif;
    }
    #loading .dot {
      width:40px; height:40px; border-radius:50%;
      background:#E36322; margin-bottom:16px;
      animation:pulse 1.2s ease-in-out infinite;
    }
    @keyframes pulse {
      0%,100% { transform:scale(1); opacity:1; }
      50% { transform:scale(1.2); opacity:0.7; }
    }
    #loading .txt { font-size:16px; font-weight:600; color:#333; }
    #loading .sub { font-size:13px; color:#888; margin-top:6px; }

    #error-box {
      display:none; position:fixed; top:0; left:0; right:0; bottom:0;
      flex-direction:column; align-items:center; justify-content:center;
      background:#FAF7F2; z-index:9999; padding:32px;
      font-family:-apple-system,BlinkMacSystemFont,sans-serif;
    }
    #error-box .etitle { font-size:16px; font-weight:700; color:#c0392b; margin-bottom:8px; }
    #error-box .emsg  { font-size:13px; color:#555; text-align:center; word-break:break-all; }

    .pin {
      width:32px; height:32px; border-radius:50%;
      border:2.5px solid rgba(255,255,255,0.88);
      display:flex; align-items:center; justify-content:center;
      font-family:-apple-system,BlinkMacSystemFont,sans-serif;
      font-weight:700; font-size:13px; color:#fff;
      box-shadow:0 2px 6px rgba(0,0,0,0.32); cursor:pointer;
    }
    .popup-box { font-family:-apple-system,BlinkMacSystemFont,sans-serif; min-width:160px; }
    .popup-name { font-weight:600; font-size:15px; color:#1a1a1a; margin-bottom:6px; }
    .popup-row { display:flex; align-items:center; gap:8px; margin-bottom:4px; }
    .badge { border-radius:6px; padding:2px 8px; font-size:12px; font-weight:600; color:#fff; }
    .popup-score { font-size:13px; color:#666; }
    .popup-hint { font-size:11px; color:#E36322; margin-top:6px; cursor:pointer; font-weight:600; }

    .legend {
      position:fixed; bottom:24px; right:12px;
      background:rgba(250,247,242,0.96); border-radius:12px;
      padding:10px 14px; z-index:1000;
      font-family:-apple-system,BlinkMacSystemFont,sans-serif;
      font-size:12px; color:#333;
      box-shadow:0 2px 8px rgba(0,0,0,0.12); pointer-events:none;
      display:none;
    }
    .legend-row { display:flex; align-items:center; gap:8px; margin-bottom:5px; }
    .legend-row:last-child { margin-bottom:0; }
    .legend-dot { width:9px; height:9px; border-radius:50%; flex-shrink:0; }

    .leaflet-popup-content-wrapper { border-radius:12px; box-shadow:0 4px 16px rgba(0,0,0,0.15); }
    .leaflet-popup-content { margin:12px 14px; }
    .leaflet-popup-tip-container { display:none; }
    .leaflet-control-zoom a { border-radius:8px !important; }
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

  <script>${leafletJs}</script>
  <script>
    // Beach data embedded at render time — no fetch() needed
    var BEACHES = ${beachesJson};
    var COLORS = { Epic:'#E36322', Good:'#1F8A8A', Fair:'#C4921B', Poor:'#8E8E8E', Flat:'#B8B0A6' };

    function pinColor(label) { return COLORS[label] || '#B8B0A6'; }

    function postMsg(data) {
      try {
        if (window.ReactNativeWebView) {
          window.ReactNativeWebView.postMessage(JSON.stringify(data));
        }
      } catch(e) {}
    }

    function showError(msg) {
      document.getElementById('loading').style.display = 'none';
      var box = document.getElementById('error-box');
      box.style.display = 'flex';
      document.getElementById('error-msg').textContent = msg;
      postMsg({ type: 'error', message: msg });
    }

    try {
      var map = L.map('map', { zoomControl: false, attributionControl: false })
        .setView([-33.86, 151.21], 11);

      L.tileLayer('https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png', {
        maxZoom: 18
      }).addTo(map);

      L.control.zoom({ position: 'topright' }).addTo(map);

      BEACHES.forEach(function(b) {
        var color = pinColor(b.label);
        var scoreText = b.score != null ? b.score : '?';

        var icon = L.divIcon({
          html: '<div class="pin" style="background:' + color + '">' + scoreText + '</div>',
          iconSize: [32, 32], iconAnchor: [16, 16], popupAnchor: [0, -20], className: ''
        });

        var badgeHtml = b.label
          ? '<span class="badge" style="background:' + color + '">' + b.label + '</span>' : '';
        var scoreHtml = b.score != null
          ? '<span class="popup-score">' + b.score + '/10</span>' : '';
        var popupHtml = '<div class="popup-box">'
          + '<div class="popup-name">' + b.name + '</div>'
          + '<div class="popup-row">' + badgeHtml + scoreHtml + '</div>'
          + '<div class="popup-hint" onclick="postMsg({type:\'beach_press\',id:\'' + b.id + '\'})">'
          + 'Tap for full report \u2192</div></div>';

        var marker = L.marker([b.lat, b.lng], { icon: icon }).addTo(map);
        marker.bindPopup(popupHtml, { closeButton: false, maxWidth: 220 });
        marker.on('click', function() { postMsg({ type: 'select', id: b.id }); });
      });

      // All pins rendered — hide loading overlay
      document.getElementById('loading').style.display = 'none';
      document.getElementById('legend').style.display = 'block';

    } catch(e) {
      showError('Map error: ' + (e && e.message ? e.message : String(e)));
    }
  </script>
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
