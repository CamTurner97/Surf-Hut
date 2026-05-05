import React, { useCallback, useRef, useState, useEffect } from "react";
import {
  ActivityIndicator,
  StyleSheet,
  Text,
  View,
} from "react-native";
import { WebView, type WebViewMessageEvent } from "react-native-webview";

import type { Beach } from "@workspace/api-client-react";

import { useColors } from "@/hooks/useColors";

interface SydneyMapProps {
  beaches: Beach[];
  loading?: boolean;
  onBeachPress?: (beach: Beach) => void;
}

const domain = process.env.EXPO_PUBLIC_DOMAIN;
const MAP_HTML_URL = domain ? `https://${domain}/api/map` : null;
// Leaflet is served from /api/static/ — fetched inside the WebView's own
// JS context so it never crosses the React Native bridge.
const LEAFLET_URL = domain
  ? `https://${domain}/api/static/leaflet.min.js`
  : null;

/**
 * Small injectedJavaScript bootstrap (~2 KB).
 *
 * Strategy (confirmed working via diagnostic):
 *   1. injectedJavaScript runs after DOMContentLoaded — bypasses Android's
 *      inline-<script> CSP block.
 *   2. We keep this string tiny to avoid React Native bridge size limits.
 *   3. Leaflet (144 KB) is fetched INSIDE the WebView's own network stack,
 *      injected as a dynamic <script> element (allowed by 'unsafe-inline' CSP),
 *      then the map is initialised.
 *   4. Beach data comes from a <script type="application/json"> block in the
 *      HTML — never executed, never blocked.
 *   5. Every step posts a diagnostic message so Expo console can report it.
 */
function makeInjectedJs(leafletUrl: string): string {
  // IMPORTANT: this string is a TypeScript template literal.
  // \'  inside a template literal is NOT a valid escape — the backslash is
  // consumed and you get a bare ' which breaks the inner JS string literals.
  // Rule: use only double-quoted strings inside this template literal, or
  // single-quoted strings that never need an internal escaped single quote.
  return `(function(){
  function pm(obj){
    try{window.ReactNativeWebView&&window.ReactNativeWebView.postMessage(JSON.stringify(obj));}catch(e){}
  }
  function showError(msg){
    var l=document.getElementById("loading");
    var b=document.getElementById("error-box");
    var m=document.getElementById("error-msg");
    if(l)l.style.display="none";
    if(b)b.style.display="flex";
    if(m)m.textContent=msg;
    pm({type:"error",message:msg});
  }

  pm({type:"js_started"});

  var beachEl=document.getElementById("beach-data");
  if(!beachEl){showError("beach-data element missing");return;}
  var BEACHES;
  try{BEACHES=JSON.parse(beachEl.textContent||"[]");}
  catch(e){showError("beach JSON parse: "+e.message);return;}
  pm({type:"beaches_parsed",count:BEACHES.length});

  var COLORS={Epic:"#E36322",Good:"#1F8A8A",Fair:"#C4921B",Poor:"#8E8E8E",Flat:"#B8B0A6"};
  window.postMsg=function(data){pm(data);};
  function pinColor(label){return COLORS[label]||"#B8B0A6";}

  function initMap(){
    pm({type:"init_map"});
    try{
      var map=L.map("map",{zoomControl:false,attributionControl:false})
        .setView([-33.86,151.21],11);
      L.tileLayer("https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png",{maxZoom:18}).addTo(map);
      L.control.zoom({position:"topright"}).addTo(map);

      BEACHES.forEach(function(b){
        var color=pinColor(b.label);
        var scoreText=b.score!=null?b.score:"?";
        var icon=L.divIcon({
          html:"<div class=\\"pin\\" style=\\"background:"+color+"\\">"+scoreText+"</div>",
          iconSize:[32,32],iconAnchor:[16,16],popupAnchor:[0,-20],className:""
        });
        var badgeHtml=b.label?"<span class=\\"badge\\" style=\\"background:"+color+"\\">"+b.label+"</span>":"";
        var scoreHtml=b.score!=null?"<span class=\\"popup-score\\">"+b.score+"/10</span>":"";
        // Use data-id attribute — avoids any quote-nesting problem in onclick
        var popupHtml="<div class=\\"popup-box\\">"
          +"<div class=\\"popup-name\\">"+b.name+"</div>"
          +"<div class=\\"popup-row\\">"+badgeHtml+scoreHtml+"</div>"
          +"<div class=\\"popup-hint\\" data-beach-id=\\""+b.id+"\\">Tap for full report \u2192</div>"
          +"</div>";
        var marker=L.marker([b.lat,b.lng],{icon:icon}).addTo(map);
        marker.bindPopup(popupHtml,{closeButton:false,maxWidth:220});
        // Attach click handler after popup opens (data-id approach)
        (function(beachId){
          marker.on("popupopen",function(){
            var el=document.querySelector("[data-beach-id=\\""+beachId+"\\"]");
            if(el)el.addEventListener("click",function(){pm({type:"beach_press",id:beachId});});
          });
          marker.on("click",function(){pm({type:"select",id:beachId});});
        })(b.id);
      });

      var loadEl=document.getElementById("loading");
      var legEl=document.getElementById("legend");
      if(loadEl)loadEl.style.display="none";
      if(legEl)legEl.style.display="block";
      pm({type:"map_ready",pins:BEACHES.length});

    }catch(e){
      showError("Map init: "+(e&&e.message?e.message:String(e)));
    }
  }

  pm({type:"fetching_leaflet",url:"${leafletUrl}"});
  fetch("${leafletUrl}")
    .then(function(r){
      if(!r.ok)throw new Error("HTTP "+r.status);
      return r.text();
    })
    .then(function(code){
      pm({type:"leaflet_fetched",bytes:code.length});
      var s=document.createElement("script");
      s.textContent=code;
      document.head.appendChild(s);
      pm({type:"leaflet_injected",L_defined:typeof L!=="undefined"});
      if(typeof L==="undefined"){showError("L not defined after inject");return;}
      initMap();
    })
    .catch(function(e){
      showError("Leaflet fetch: "+e.message);
    });
})();
true;`;
}

type FetchState =
  | { status: "idle" }
  | { status: "loading" }
  | { status: "ready"; html: string }
  | { status: "error"; message: string };

export function SydneyMap({ beaches, onBeachPress }: SydneyMapProps) {
  const colors = useColors();
  const webViewRef = useRef<WebView>(null);
  const [fetchState, setFetchState] = useState<FetchState>({ status: "idle" });

  useEffect(() => {
    if (!MAP_HTML_URL) return;
    setFetchState({ status: "loading" });

    const controller = new AbortController();
    fetch(MAP_HTML_URL, { signal: controller.signal })
      .then((r) => {
        if (!r.ok) throw new Error(`HTML: HTTP ${r.status}`);
        return r.text();
      })
      .then((html) => setFetchState({ status: "ready", html }))
      .catch((err: Error) => {
        if (err.name !== "AbortError") {
          setFetchState({ status: "error", message: err.message });
        }
      });

    return () => controller.abort();
  }, []);

  const injectedJs =
    MAP_HTML_URL && LEAFLET_URL ? makeInjectedJs(LEAFLET_URL) : "";

  const handleMessage = useCallback(
    (event: WebViewMessageEvent) => {
      try {
        const msg = JSON.parse(event.nativeEvent.data) as {
          type: string;
          id?: string;
          message?: string;
          [key: string]: unknown;
        };
        // Log all diagnostic messages to Expo console
        console.log("[SydneyMap]", JSON.stringify(msg));

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

  if (!MAP_HTML_URL) {
    return (
      <View style={[styles.centered, { backgroundColor: colors.background }]}>
        <Text style={[styles.msgText, { color: colors.mutedForeground }]}>
          Map unavailable — EXPO_PUBLIC_DOMAIN not configured.
        </Text>
      </View>
    );
  }

  if (fetchState.status === "idle" || fetchState.status === "loading") {
    return (
      <View style={[styles.centered, { backgroundColor: colors.background }]}>
        <ActivityIndicator color={colors.primary} size="large" />
        <Text style={[styles.msgText, { color: colors.mutedForeground }]}>
          Loading map…
        </Text>
      </View>
    );
  }

  if (fetchState.status === "error") {
    return (
      <View style={[styles.centered, { backgroundColor: colors.background }]}>
        <Text style={[styles.msgText, { color: colors.destructive }]}>
          Could not load map
        </Text>
        <Text
          style={[styles.subText, { color: colors.mutedForeground }]}
          selectable
        >
          {fetchState.message}
        </Text>
      </View>
    );
  }

  return (
    <View style={styles.container}>
      <WebView
        ref={webViewRef}
        style={styles.map}
        source={{ html: fetchState.html }}
        injectedJavaScript={injectedJs}
        onMessage={handleMessage}
        javaScriptEnabled
        domStorageEnabled
        scrollEnabled={false}
        bounces={false}
        showsHorizontalScrollIndicator={false}
        showsVerticalScrollIndicator={false}
        onError={(e) =>
          console.error("[SydneyMap] WebView error:", e.nativeEvent)
        }
        onHttpError={(e) =>
          console.error("[SydneyMap] HTTP error:", e.nativeEvent.statusCode)
        }
      />
    </View>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1 },
  map: { flex: 1, backgroundColor: "#FAF7F2" },
  centered: {
    flex: 1,
    alignItems: "center",
    justifyContent: "center",
    padding: 32,
    gap: 12,
  },
  msgText: {
    fontFamily: "Inter_500Medium",
    fontSize: 15,
    textAlign: "center",
  },
  subText: {
    fontFamily: "Inter_400Regular",
    fontSize: 13,
    textAlign: "center",
  },
});
