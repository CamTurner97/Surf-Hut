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
  /** When set, only these beach IDs are shown. null/undefined = show all. */
  filterIds?: string[] | null;
}

const domain = process.env.EXPO_PUBLIC_DOMAIN;
const MAP_HTML_URL = domain ? `https://${domain}/api/map` : null;
const LEAFLET_URL = domain
  ? `https://${domain}/api/static/leaflet.min.js`
  : null;

/**
 * Small injectedJavaScript bootstrap.
 *
 * Strategy (confirmed working via diagnostic):
 *   1. injectedJavaScript runs after DOMContentLoaded — bypasses Android's
 *      inline-<script> CSP block.
 *   2. Leaflet (144 KB) is fetched INSIDE the WebView's own network stack,
 *      injected as a dynamic <script> element, then the map is initialised.
 *   3. Beach data comes from a <script type="application/json"> block in the
 *      HTML — never executed, never blocked.
 *   4. Markers are stored in window.MARKERS by beach ID so filterBeaches()
 *      can show/hide individual pins via injectJavaScript from React Native.
 */
function makeInjectedJs(leafletUrl: string): string {
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

  // Markers stored by beach ID so we can show/hide them later
  window.MARKERS={};
  window.MAP=null;

  // Filter the map to show only the given IDs (empty array or null = show all)
  window.filterBeaches=function(ids){
    if(!window.MAP||!window.MARKERS)return;
    var showAll=!ids||ids.length===0;
    Object.keys(window.MARKERS).forEach(function(id){
      var marker=window.MARKERS[id];
      if(showAll||ids.indexOf(id)!==-1){
        if(!window.MAP.hasLayer(marker))marker.addTo(window.MAP);
      }else{
        if(window.MAP.hasLayer(marker))window.MAP.removeLayer(marker);
      }
    });
    pm({type:"filter_applied",count:showAll?-1:ids.length});
  };

  function initMap(){
    pm({type:"init_map"});
    try{
      var map=L.map("map",{zoomControl:false,attributionControl:false})
        .setView([-33.86,151.21],11);
      window.MAP=map;
      L.tileLayer("https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png",{maxZoom:18}).addTo(map);

      BEACHES.forEach(function(b){
        var color=pinColor(b.label);
        var scoreText=b.score!=null?b.score:"?";
        var icon=L.divIcon({
          html:"<div class=\\"pin\\" style=\\"background:"+color+"\\">"+scoreText+"</div>",
          iconSize:[32,32],iconAnchor:[16,16],popupAnchor:[0,-20],className:""
        });
        var badgeHtml=b.label?"<span class=\\"badge\\" style=\\"background:"+color+"\\">"+b.label+"</span>":"";
        var scoreHtml=b.score!=null?"<span class=\\"popup-score\\">"+b.score+"/10</span>":"";
        var popupHtml="<div class=\\"popup-box\\">"
          +"<div class=\\"popup-name\\">"+b.name+"</div>"
          +"<div class=\\"popup-row\\">"+badgeHtml+scoreHtml+"</div>"
          +"<div class=\\"popup-hint\\" data-beach-id=\\""+b.id+"\\">Tap for full report \u2192</div>"
          +"</div>";
        var marker=L.marker([b.lat,b.lng],{icon:icon}).addTo(map);
        marker.bindPopup(popupHtml,{closeButton:false,maxWidth:220});
        window.MARKERS[b.id]=marker;
        (function(beachId){
          marker.on("popupopen",function(){
            var el=document.querySelector("[data-beach-id=\\""+beachId+"\\"]");
            if(el)el.addEventListener("click",function(){pm({type:"beach_press",id:beachId});});
          });
          marker.on("click",function(){pm({type:"select",id:beachId});});
        })(b.id);
      });

      var loadEl=document.getElementById("loading");
      if(loadEl)loadEl.style.display="none";
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

export function SydneyMap({ beaches, onBeachPress, filterIds }: SydneyMapProps) {
  const colors = useColors();
  const webViewRef = useRef<WebView>(null);
  const [fetchState, setFetchState] = useState<FetchState>({ status: "idle" });
  const mapReadyRef = useRef(false);

  useEffect(() => {
    if (!MAP_HTML_URL) return;
    setFetchState({ status: "loading" });
    mapReadyRef.current = false;

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

  // Push filter changes into the WebView whenever filterIds changes
  useEffect(() => {
    if (!mapReadyRef.current) return;
    const idsJson = filterIds && filterIds.length > 0
      ? JSON.stringify(filterIds)
      : "null";
    webViewRef.current?.injectJavaScript(
      `if(typeof window.filterBeaches==="function"){window.filterBeaches(${idsJson});}true;`
    );
  }, [filterIds]);

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
        console.log("[SydneyMap]", JSON.stringify(msg));

        if (msg.type === "map_ready") {
          mapReadyRef.current = true;
          // Apply any pending filter immediately after map is ready
          if (filterIds && filterIds.length > 0) {
            const idsJson = JSON.stringify(filterIds);
            webViewRef.current?.injectJavaScript(
              `if(typeof window.filterBeaches==="function"){window.filterBeaches(${idsJson});}true;`
            );
          }
        }

        if (msg.type === "beach_press" && msg.id) {
          const beach = beaches.find((b) => b.id === msg.id);
          if (beach) onBeachPress?.(beach);
        }
      } catch {
        // ignore
      }
    },
    [beaches, onBeachPress, filterIds],
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
