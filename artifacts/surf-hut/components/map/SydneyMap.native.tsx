import React, { useCallback, useEffect, useRef, useState } from "react";
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
const MAP_URL = domain ? `https://${domain}/api/map` : null;

type FetchState =
  | { status: "idle" }
  | { status: "loading" }
  | { status: "ready"; html: string }
  | { status: "error"; message: string };

export function SydneyMap({ beaches, onBeachPress }: SydneyMapProps) {
  const colors = useColors();
  const webViewRef = useRef<WebView>(null);
  const [fetchState, setFetchState] = useState<FetchState>({ status: "idle" });

  // Fetch the map HTML using React Native's own networking stack
  // (avoids any Android WebView URI-loading restrictions).
  useEffect(() => {
    if (!MAP_URL) return;
    setFetchState({ status: "loading" });

    const controller = new AbortController();
    fetch(MAP_URL, { signal: controller.signal })
      .then((r) => {
        if (!r.ok) throw new Error(`HTTP ${r.status}`);
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

  const handleMessage = useCallback(
    (event: WebViewMessageEvent) => {
      try {
        const msg = JSON.parse(event.nativeEvent.data) as {
          type: string;
          id?: string;
          message?: string;
        };
        if (msg.type === "beach_press" && msg.id) {
          const beach = beaches.find((b) => b.id === msg.id);
          if (beach) onBeachPress?.(beach);
        }
      } catch {
        // ignore malformed messages
      }
    },
    [beaches, onBeachPress],
  );

  if (!MAP_URL) {
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
          Fetching map…
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

  // HTML fetched successfully — render it inline (no URI loading in WebView)
  return (
    <View style={styles.container}>
      <WebView
        ref={webViewRef}
        style={styles.map}
        // Pass HTML directly so WebView never makes a URI request.
        // Beach data is already embedded in the HTML by the server.
        source={{
          html: fetchState.html,
          baseUrl: MAP_URL, // gives the page a real origin
        }}
        onMessage={handleMessage}
        javaScriptEnabled
        domStorageEnabled
        scrollEnabled={false}
        bounces={false}
        showsHorizontalScrollIndicator={false}
        showsVerticalScrollIndicator={false}
        allowsInlineMediaPlayback
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
