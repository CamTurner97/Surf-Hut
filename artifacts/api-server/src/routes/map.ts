import { Router } from "express";

const router = Router();

/**
 * GET /api/map
 * Serves a self-contained Leaflet.js page that the mobile WebView loads.
 * The page fetches /api/beaches itself, renders colour-coded pins, and
 * posts messages back to React Native via ReactNativeWebView.postMessage.
 */
router.get("/map", (_req, res) => {
  const html = `<!DOCTYPE html>
<html>
<head>
  <meta charset="utf-8">
  <meta name="viewport" content="width=device-width, initial-scale=1, maximum-scale=1, user-scalable=no">
  <title>Surf Hut Map</title>
  <link rel="stylesheet" href="/api/static/leaflet.css"/>
  <script src="/api/static/leaflet.js"></script>
  <style>
    * { margin:0; padding:0; box-sizing:border-box; }
    html, body, #map { width:100%; height:100%; background:#e8e0d8; }

    .pin {
      width:32px; height:32px; border-radius:50%;
      border:2.5px solid rgba(255,255,255,0.88);
      display:flex; align-items:center; justify-content:center;
      font-family:-apple-system,BlinkMacSystemFont,sans-serif;
      font-weight:700; font-size:13px; color:#fff;
      box-shadow:0 2px 6px rgba(0,0,0,0.32);
      cursor:pointer; transition:transform 0.15s;
    }
    .pin:hover { transform:scale(1.15); }

    .popup-box { font-family:-apple-system,BlinkMacSystemFont,sans-serif; min-width:160px; }
    .popup-name { font-weight:600; font-size:15px; color:#1a1a1a; margin-bottom:6px; }
    .popup-row { display:flex; align-items:center; gap:8px; margin-bottom:4px; }
    .badge { border-radius:6px; padding:2px 8px; font-size:12px; font-weight:600; color:#fff; }
    .popup-score { font-size:13px; color:#666; }
    .popup-hint { font-size:11px; color:#999; margin-top:6px; cursor:pointer; }
    .popup-hint:hover { color:#E36322; }

    .legend {
      position:absolute; bottom:24px; right:12px;
      background:rgba(250,247,242,0.96);
      border-radius:12px; padding:10px 14px; z-index:1000;
      font-family:-apple-system,BlinkMacSystemFont,sans-serif;
      font-size:12px; color:#333;
      box-shadow:0 2px 8px rgba(0,0,0,0.12);
      pointer-events:none;
    }
    .legend-row { display:flex; align-items:center; gap:8px; margin-bottom:5px; }
    .legend-row:last-child { margin-bottom:0; }
    .legend-dot { width:9px; height:9px; border-radius:50%; flex-shrink:0; }

    .leaflet-popup-content-wrapper {
      border-radius:12px;
      box-shadow:0 4px 16px rgba(0,0,0,0.15);
      padding:0;
    }
    .leaflet-popup-content { margin:12px 14px; }
    .leaflet-popup-tip-container { display:none; }
    .leaflet-control-zoom a { border-radius:8px !important; }
  </style>
</head>
<body>
  <div id="map"></div>
  <div class="legend">
    <div class="legend-row"><div class="legend-dot" style="background:#E36322"></div>Epic</div>
    <div class="legend-row"><div class="legend-dot" style="background:#1F8A8A"></div>Good</div>
    <div class="legend-row"><div class="legend-dot" style="background:#C4921B"></div>Fair</div>
    <div class="legend-row"><div class="legend-dot" style="background:#8E8E8E"></div>Poor</div>
  </div>

  <script>
    var COLORS = { Epic:'#E36322', Good:'#1F8A8A', Fair:'#C4921B', Poor:'#8E8E8E', Flat:'#B8B0A6' };

    function pinColor(label) {
      return COLORS[label] || '#B8B0A6';
    }

    function postMsg(data) {
      if (window.ReactNativeWebView) {
        window.ReactNativeWebView.postMessage(JSON.stringify(data));
      }
    }

    var map = L.map('map', { zoomControl: false, attributionControl: false })
      .setView([-33.86, 151.21], 11);

    L.tileLayer('https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png', {
      maxZoom: 18
    }).addTo(map);

    L.control.zoom({ position: 'topright' }).addTo(map);

    function renderPins(beaches) {
      beaches.forEach(function(b) {
        var color = pinColor(b.latestScoreLabel);
        var scoreText = b.latestScore != null ? b.latestScore : '?';

        var icon = L.divIcon({
          html: '<div class="pin" style="background:' + color + '">' + scoreText + '</div>',
          iconSize: [32, 32],
          iconAnchor: [16, 16],
          popupAnchor: [0, -20],
          className: ''
        });

        var badgeHtml = b.latestScoreLabel
          ? '<span class="badge" style="background:' + color + '">' + b.latestScoreLabel + '</span>'
          : '';
        var scoreHtml = b.latestScore != null
          ? '<span class="popup-score">' + b.latestScore + '/10</span>'
          : '';

        var popupHtml = '<div class="popup-box">'
          + '<div class="popup-name">' + b.name + '</div>'
          + '<div class="popup-row">' + badgeHtml + scoreHtml + '</div>'
          + '<div class="popup-hint" onclick="postMsg({type:\'beach_press\',id:\'' + b.id + '\'})">'
          + 'Tap for full report →</div>'
          + '</div>';

        var marker = L.marker([b.latitude, b.longitude], { icon: icon }).addTo(map);
        marker.bindPopup(popupHtml, { closeButton: false, maxWidth: 220 });
        marker.on('click', function() {
          postMsg({ type: 'select', id: b.id });
        });
      });
    }

    fetch('/api/beaches')
      .then(function(r) { return r.json(); })
      .then(function(data) { renderPins(data.beaches || []); })
      .catch(function(err) {
        console.error('Failed to load beaches:', err);
        postMsg({ type: 'error', message: err.toString() });
      });
  </script>
</body>
</html>`;

  res.setHeader("Content-Type", "text/html; charset=utf-8");
  res.setHeader("Cache-Control", "no-cache");
  res.send(html);
});

export default router;
