import React, { useCallback, useMemo, useRef } from "react";
import { ActivityIndicator, StyleSheet, Text, View } from "react-native";
import { WebView, type WebViewMessageEvent } from "react-native-webview";

import type { Beach } from "@workspace/api-client-react";

import { useColors } from "@/hooks/useColors";
import { pinColor, type ScoreLabel } from "./scoreColor";

interface SydneyMapProps {
  beaches: Beach[];
  loading?: boolean;
  onBeachPress?: (beach: Beach) => void;
}

/** Serialisable slice of a beach sent into the WebView. */
interface PinData {
  id: string;
  name: string;
  lat: number;
  lng: number;
  score: number | null;
  label: string | null;
  color: string;
}

function buildMapHtml(pins: PinData[]): string {
  const pinsJson = JSON.stringify(pins);
  return `<!DOCTYPE html>
<html>
<head>
  <meta name="viewport" content="width=device-width, initial-scale=1, maximum-scale=1, user-scalable=no">
  <link rel="stylesheet" href="https://unpkg.com/leaflet@1.9.4/dist/leaflet.css"/>
  <script src="https://unpkg.com/leaflet@1.9.4/dist/leaflet.js"></script>
  <style>
    * { margin:0; padding:0; box-sizing:border-box; }
    html, body, #map { width:100%; height:100%; background:#e8e0d8; }
    .pin {
      width:32px; height:32px; border-radius:50%;
      border:2.5px solid rgba(255,255,255,0.9);
      display:flex; align-items:center; justify-content:center;
      font-family:-apple-system,sans-serif; font-weight:700;
      font-size:13px; color:#fff;
      box-shadow:0 2px 6px rgba(0,0,0,0.32);
      cursor:pointer;
    }
    .pin.selected { width:38px; height:38px; font-size:15px; }
    .popup-box {
      font-family:-apple-system,sans-serif;
      min-width:160px;
    }
    .popup-name { font-weight:600; font-size:15px; color:#1a1a1a; margin-bottom:6px; }
    .popup-row { display:flex; align-items:center; gap:8px; margin-bottom:4px; }
    .badge {
      border-radius:6px; padding:2px 8px;
      font-size:12px; font-weight:600; color:#fff;
    }
    .popup-score { font-size:13px; color:#666; }
    .popup-hint { font-size:11px; color:#999; margin-top:4px; }
    .legend {
      position:absolute; bottom:24px; right:12px;
      background:rgba(250,247,242,0.96);
      border-radius:12px; padding:10px 14px; z-index:1000;
      font-family:-apple-system,sans-serif; font-size:12px;
      box-shadow:0 2px 8px rgba(0,0,0,0.12);
      pointer-events:none;
    }
    .legend-row { display:flex; align-items:center; gap:8px; margin-bottom:5px; }
    .legend-row:last-child { margin-bottom:0; }
    .legend-dot { width:9px; height:9px; border-radius:50%; flex-shrink:0; }
    .leaflet-popup-content-wrapper { border-radius:12px; box-shadow:0 4px 16px rgba(0,0,0,0.15); }
    .leaflet-popup-content { margin:12px 14px; }
    .leaflet-popup-tip-container { display:none; }
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
var map = L.map('map', { zoomControl: false, attributionControl: false })
  .setView([-33.86, 151.21], 11);

L.tileLayer('https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png', {
  maxZoom: 18
}).addTo(map);

L.control.zoom({ position: 'topright' }).addTo(map);

var pins = ${pinsJson};
var selectedId = null;
var markers = {};

pins.forEach(function(p) {
  var scoreText = p.score != null ? p.score : '?';
  var icon = L.divIcon({
    html: '<div class="pin" id="pin-' + p.id + '" style="background:' + p.color + '">' + scoreText + '</div>',
    iconSize: [32, 32],
    iconAnchor: [16, 16],
    popupAnchor: [0, -18],
    className: ''
  });

  var popupHtml = '<div class="popup-box">'
    + '<div class="popup-name">' + p.name + '</div>'
    + '<div class="popup-row">'
    + (p.label ? '<span class="badge" style="background:' + p.color + '">' + p.label + '</span>' : '')
    + (p.score != null ? '<span class="popup-score">' + p.score + '/10</span>' : '')
    + '</div>'
    + '<div class="popup-hint" onclick="notifyPress(\'' + p.id + '\')">Tap for full report →</div>'
    + '</div>';

  var marker = L.marker([p.lat, p.lng], { icon: icon })
    .bindPopup(popupHtml, { closeButton: false, maxWidth: 220 })
    .addTo(map);

  marker.on('click', function() {
    selectedId = p.id;
    window.ReactNativeWebView.postMessage(JSON.stringify({ type: 'select', id: p.id }));
  });

  markers[p.id] = marker;
});

function notifyPress(id) {
  window.ReactNativeWebView.postMessage(JSON.stringify({ type: 'beach_press', id: id }));
}
</script>
</body>
</html>`;
}

export function SydneyMap({ beaches, loading, onBeachPress }: SydneyMapProps) {
  const colors = useColors();
  const webViewRef = useRef<WebView>(null);

  const pins = useMemo<PinData[]>(
    () =>
      beaches.map((b) => ({
        id: b.id,
        name: b.name,
        lat: b.latitude,
        lng: b.longitude,
        score: b.latestScore ?? null,
        label: b.latestScoreLabel ?? null,
        color: pinColor(b.latestScoreLabel as ScoreLabel),
      })),
    [beaches],
  );

  const html = useMemo(() => buildMapHtml(pins), [pins]);

  const handleMessage = useCallback(
    (event: WebViewMessageEvent) => {
      try {
        const msg = JSON.parse(event.nativeEvent.data) as {
          type: string;
          id: string;
        };
        if (msg.type === "beach_press") {
          const beach = beaches.find((b) => b.id === msg.id);
          if (beach) onBeachPress?.(beach);
        }
      } catch {
        // ignore malformed messages
      }
    },
    [beaches, onBeachPress],
  );

  return (
    <View style={styles.container}>
      <WebView
        ref={webViewRef}
        style={styles.map}
        originWhitelist={["*"]}
        source={{ html }}
        onMessage={handleMessage}
        javaScriptEnabled
        domStorageEnabled
        scrollEnabled={false}
        bounces={false}
        showsHorizontalScrollIndicator={false}
        showsVerticalScrollIndicator={false}
      />

      {loading && (
        <View
          style={[
            styles.loadingOverlay,
            { backgroundColor: colors.background },
          ]}
        >
          <ActivityIndicator color={colors.primary} size="large" />
          <Text style={[styles.loadingText, { color: colors.mutedForeground }]}>
            Checking the surf…
          </Text>
        </View>
      )}
    </View>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1 },
  map: { flex: 1, backgroundColor: "transparent" },
  loadingOverlay: {
    ...StyleSheet.absoluteFillObject,
    alignItems: "center",
    justifyContent: "center",
    gap: 12,
  },
  loadingText: {
    fontFamily: "Inter_500Medium",
    fontSize: 15,
  },
});
