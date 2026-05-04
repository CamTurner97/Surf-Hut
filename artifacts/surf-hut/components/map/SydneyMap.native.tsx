import React, { useCallback, useRef } from "react";
import { StyleSheet, View } from "react-native";
import { WebView, type WebViewMessageEvent } from "react-native-webview";

import type { Beach } from "@workspace/api-client-react";

import { useColors } from "@/hooks/useColors";

interface SydneyMapProps {
  beaches: Beach[];
  loading?: boolean;
  onBeachPress?: (beach: Beach) => void;
}

// ---------------------------------------------------------------------------
// JS DIAGNOSTIC
// Inline script  → green
// injectedJavaScript only → blue
// Neither ran    → red
// ---------------------------------------------------------------------------
const DIAG_HTML = `<!DOCTYPE html>
<html>
<head>
  <meta charset="utf-8">
  <meta name="viewport" content="width=device-width,initial-scale=1">
  <meta http-equiv="Content-Security-Policy"
        content="default-src * 'unsafe-inline' 'unsafe-eval' data: blob:;">
</head>
<body style="margin:0;background:#c0392b;display:flex;flex-direction:column;
             align-items:center;justify-content:center;height:100vh">
  <p id="s" style="color:#fff;font-size:22px;font-weight:bold;text-align:center;
                   padding:20px;font-family:sans-serif">
    RED<br>inline JS not running
  </p>
  <script>
    document.getElementById('s').innerHTML =
      'GREEN<br>inline JS works';
    document.body.style.background = '#27ae60';
  </script>
</body>
</html>`;

// injectedJavaScript runs after DOMContentLoaded — overrides the inline result
const INJECTED = `
  (function(){
    var el = document.getElementById('s');
    if (el) {
      el.innerHTML = 'BLUE<br>injectedJS works<br>(inline may be blocked)';
      document.body.style.background = '#2980b9';
    }
  })();
  true;
`;

export function SydneyMap({ beaches, onBeachPress }: SydneyMapProps) {
  const colors = useColors();
  const webViewRef = useRef<WebView>(null);

  const handleMessage = useCallback(
    (event: WebViewMessageEvent) => {
      try {
        const msg = JSON.parse(event.nativeEvent.data) as {
          type: string;
          id?: string;
        };
        if (msg.type === "beach_press" && msg.id) {
          const beach = beaches.find((b) => b.id === msg.id);
          if (beach) onBeachPress?.(beach);
        }
      } catch {
        // ignore
      }
    },
    [beaches, onBeachPress],
  );

  return (
    <View style={styles.container}>
      <WebView
        ref={webViewRef}
        style={styles.map}
        source={{ html: DIAG_HTML }}
        injectedJavaScript={INJECTED}
        onMessage={handleMessage}
        javaScriptEnabled
        domStorageEnabled
        scrollEnabled={false}
        bounces={false}
        onError={(e) =>
          console.error("[WebView] error", e.nativeEvent)
        }
        onHttpError={(e) =>
          console.error("[WebView] http error", e.nativeEvent.statusCode)
        }
      />
    </View>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1 },
  map: { flex: 1 },
});
