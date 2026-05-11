import { LinearGradient } from "expo-linear-gradient";
import { Image } from "expo-image";
import { router, useLocalSearchParams } from "expo-router";
import React from "react";
import {
  ActivityIndicator,
  Pressable,
  ScrollView,
  StyleSheet,
  Text,
  View,
} from "react-native";
import { useSafeAreaInsets } from "react-native-safe-area-context";

import { useColors } from "@/hooks/useColors";
import { useBeaches } from "@/hooks/useBeaches";
import { useBeachReport } from "@/hooks/useBeachReport";
import { useFavourites } from "@/hooks/useFavourites";
import { useUnits } from "@/hooks/useUnits";
import { formatWaveHeight, formatWindSpeed, formatTemperature } from "@/utils/format";
import { HeartOutlineIcon, HeartFilledIcon } from "@/components/TabIcons";
import type { SurfReport } from "@workspace/api-client-react";

const SCORE_COLORS: Record<string, string> = {
  Epic: "#E36322",
  Good: "#1F8A8A",
  Fair: "#C4921B",
  Poor: "#8E8E8E",
  Flat: "#B8B0A6",
};

const WIND_LABELS: Record<string, string> = {
  offshore: "Offshore winds",
  "cross-shore": "Cross-shore winds",
  onshore: "Onshore winds",
};

function degToCompass(deg: number): string {
  const dirs = [
    "N", "NNE", "NE", "ENE", "E", "ESE", "SE", "SSE",
    "S", "SSW", "SW", "WSW", "W", "WNW", "NW", "NNW",
  ];
  return dirs[Math.round(deg / 22.5) % 16];
}

function timeAgo(iso: string): string {
  const mins = Math.floor((Date.now() - new Date(iso).getTime()) / 60000);
  if (mins < 1) return "just now";
  if (mins < 60) return `${mins}m ago`;
  return `${Math.floor(mins / 60)}h ago`;
}

function regionLabel(region: string): string {
  return region.replace(/-/g, " ").replace(/\b\w/g, (c) => c.toUpperCase());
}

interface StatCardProps {
  label: string;
  value: string;
  unit?: string;
}

function StatCard({ label, value, unit }: StatCardProps) {
  const colors = useColors();
  return (
    <View
      style={[
        styles.statCard,
        { backgroundColor: colors.card, borderColor: colors.border },
      ]}
    >
      <Text style={[styles.statLabel, { color: colors.mutedForeground }]}>
        {label}
      </Text>
      <View style={styles.statValueRow}>
        <Text style={[styles.statValue, { color: colors.foreground }]}>
          {value}
        </Text>
        {unit ? (
          <Text style={[styles.statUnit, { color: colors.mutedForeground }]}>
            {unit}
          </Text>
        ) : null}
      </View>
    </View>
  );
}

function ScoreSection({
  report,
  description,
}: {
  report: SurfReport;
  description?: string;
}) {
  const colors = useColors();
  const scoreColor = SCORE_COLORS[report.scoreLabel] ?? colors.mutedForeground;

  return (
    <View
      style={[
        styles.scoreBanner,
        { backgroundColor: colors.card, borderColor: colors.border },
      ]}
    >
      <View style={[styles.scoreBadge, { backgroundColor: scoreColor }]}>
        <Text style={styles.scoreNumber}>{report.score}</Text>
        <Text style={styles.scoreDenom}>/10</Text>
      </View>
      <View style={styles.scoreRight}>
        <View
          style={[
            styles.labelPill,
            { backgroundColor: scoreColor + "22" },
          ]}
        >
          <Text style={[styles.labelText, { color: scoreColor }]}>
            {report.scoreLabel.toUpperCase()}
          </Text>
        </View>
        <Text style={[styles.windAssess, { color: colors.foreground }]}>
          {WIND_LABELS[report.windRelative] ?? report.windRelative}
        </Text>
        {description ? (
          <Text
            style={[styles.description, { color: colors.mutedForeground }]}
            numberOfLines={2}
          >
            {description}
          </Text>
        ) : null}
      </View>
    </View>
  );
}

function ConditionsGrid({ report }: { report: SurfReport }) {
  const colors = useColors();
  const { units } = useUnits();

  const waveH = formatWaveHeight(report.waveHeightM, units.waveHeight);
  const windS = formatWindSpeed(report.windSpeedKmh, units.windSpeed);

  const stats: Array<{ label: string; value: string; unit?: string }> = [
    { label: "Wave Height", value: waveH.value, unit: waveH.unit },
    { label: "Wave Period", value: report.wavePeriodS.toFixed(0), unit: "s" },
    { label: "Wind Speed", value: windS.value, unit: windS.unit },
    { label: "Wind From", value: degToCompass(report.windDirectionDeg) },
    { label: "Swell From", value: degToCompass(report.waveDirectionDeg) },
    ...(report.airTemperatureC != null
      ? [{ ...formatTemperature(report.airTemperatureC, units.temperature), label: "Air Temp" }]
      : []),
    ...(report.waterTemperatureC != null
      ? [{ ...formatTemperature(report.waterTemperatureC, units.temperature), label: "Water Temp" }]
      : []),
    ...(report.seaLevelM != null
      ? [{ label: "Sea Level", value: report.seaLevelM.toFixed(2), unit: "m" }]
      : []),
  ];

  return (
    <>
      <Text style={[styles.sectionTitle, { color: colors.foreground }]}>
        Conditions
      </Text>
      <View style={styles.grid}>
        {stats.map((s) => (
          <StatCard key={s.label} label={s.label} value={s.value} unit={s.unit} />
        ))}
      </View>
      <Text style={[styles.footer, { color: colors.mutedForeground }]}>
        {report.cached ? "Cached · " : ""}Updated {timeAgo(report.fetchedAt)}{" "}
        · Open-Meteo Marine API
      </Text>
    </>
  );
}

export default function BeachDetailScreen() {
  const { id } = useLocalSearchParams<{ id: string }>();
  const insets = useSafeAreaInsets();
  const colors = useColors();

  const { data: beachList } = useBeaches();
  const beach = beachList?.beaches.find((b) => b.id === id);

  const { data: report, isLoading, error } = useBeachReport(id ?? "");
  const { isFavourite, toggleFavourite } = useFavourites();
  const favourited = id ? isFavourite(id) : false;

  const domain = process.env.EXPO_PUBLIC_DOMAIN;
  const heroUrl =
    beach?.heroImageUrl
      ? beach.heroImageUrl.startsWith("http")
        ? beach.heroImageUrl
        : `https://${domain}${beach.heroImageUrl}`
      : null;

  return (
    <View style={[styles.root, { backgroundColor: colors.background }]}>
      {/* Hero image */}
      <View style={styles.hero}>
        {heroUrl ? (
          <Image
            source={{ uri: heroUrl }}
            style={StyleSheet.absoluteFill}
            contentFit="cover"
          />
        ) : (
          <View
            style={[StyleSheet.absoluteFill, { backgroundColor: colors.secondary }]}
          />
        )}

        {/* Top gradient + back button + heart */}
        <LinearGradient
          colors={["rgba(0,0,0,0.58)", "rgba(0,0,0,0.0)"]}
          style={[styles.heroTop, { paddingTop: insets.top + 8 }]}
        >
          <Pressable
            onPress={() => router.back()}
            style={styles.backBtn}
            hitSlop={12}
          >
            <Text style={styles.backArrow}>‹</Text>
            <Text style={styles.backText}>Back</Text>
          </Pressable>
          <Pressable
            onPress={() => id && toggleFavourite(id)}
            style={styles.heartBtn}
            hitSlop={12}
          >
            {favourited ? (
              <HeartFilledIcon color="#E36322" size={26} />
            ) : (
              <HeartOutlineIcon color="#FFFFFF" size={26} />
            )}
          </Pressable>
        </LinearGradient>

        {/* Bottom gradient + beach name */}
        <LinearGradient
          colors={["rgba(0,0,0,0)", "rgba(0,0,0,0.68)"]}
          style={styles.heroBottom}
        >
          <Text style={styles.heroName}>{beach?.name ?? "Beach"}</Text>
          <Text style={styles.heroRegion}>
            {beach ? regionLabel(beach.region) : ""}
          </Text>
        </LinearGradient>
      </View>

      <ScrollView
        style={{ flex: 1 }}
        contentContainerStyle={[
          styles.content,
          { paddingBottom: insets.bottom + 32 },
        ]}
        showsVerticalScrollIndicator={false}
      >
        {report && (
          <ScoreSection report={report} description={beach?.description} />
        )}

        {isLoading && (
          <View style={styles.loadingRow}>
            <ActivityIndicator color={colors.primary} />
            <Text style={[styles.loadingText, { color: colors.mutedForeground }]}>
              Fetching conditions…
            </Text>
          </View>
        )}

        {error && !isLoading && (
          <Text style={[styles.errorText, { color: colors.destructive }]}>
            Could not load surf report. Check your connection and try again.
          </Text>
        )}

        {report && <ConditionsGrid report={report} />}
      </ScrollView>
    </View>
  );
}

const styles = StyleSheet.create({
  root: { flex: 1 },

  hero: {
    width: "100%",
    height: 260,
    position: "relative",
    overflow: "hidden",
  },
  heroTop: {
    position: "absolute",
    top: 0,
    left: 0,
    right: 0,
    height: 110,
    paddingHorizontal: 16,
    flexDirection: "row",
    alignItems: "flex-start",
    justifyContent: "space-between",
  },
  heartBtn: {
    paddingTop: 4,
  },
  heroBottom: {
    position: "absolute",
    bottom: 0,
    left: 0,
    right: 0,
    paddingHorizontal: 20,
    paddingTop: 40,
    paddingBottom: 18,
  },
  backBtn: {
    flexDirection: "row",
    alignItems: "center",
    gap: 2,
  },
  backArrow: {
    color: "#FFFFFF",
    fontSize: 32,
    lineHeight: 34,
    fontWeight: "300",
  },
  backText: {
    color: "#FFFFFF",
    fontSize: 16,
    fontFamily: "Inter_500Medium",
  },
  heroName: {
    color: "#FFFFFF",
    fontSize: 26,
    fontFamily: "Inter_700Bold",
    textShadowColor: "rgba(0,0,0,0.35)",
    textShadowOffset: { width: 0, height: 1 },
    textShadowRadius: 4,
  },
  heroRegion: {
    color: "rgba(255,255,255,0.75)",
    fontSize: 13,
    fontFamily: "Inter_400Regular",
    marginTop: 2,
  },

  content: {
    padding: 16,
    gap: 16,
  },

  scoreBanner: {
    flexDirection: "row",
    alignItems: "flex-start",
    gap: 14,
    padding: 16,
    borderRadius: 16,
    borderWidth: StyleSheet.hairlineWidth,
  },
  scoreBadge: {
    width: 70,
    height: 70,
    borderRadius: 12,
    alignItems: "center",
    justifyContent: "center",
    flexDirection: "row",
    gap: 1,
    flexShrink: 0,
  },
  scoreNumber: {
    color: "#FFFFFF",
    fontSize: 30,
    fontFamily: "Inter_700Bold",
    lineHeight: 34,
  },
  scoreDenom: {
    color: "rgba(255,255,255,0.65)",
    fontSize: 13,
    fontFamily: "Inter_400Regular",
    alignSelf: "flex-end",
    marginBottom: 5,
  },
  scoreRight: {
    flex: 1,
    gap: 5,
  },
  labelPill: {
    alignSelf: "flex-start",
    paddingHorizontal: 10,
    paddingVertical: 3,
    borderRadius: 20,
  },
  labelText: {
    fontSize: 11,
    fontFamily: "Inter_600SemiBold",
    letterSpacing: 1,
  },
  windAssess: {
    fontSize: 14,
    fontFamily: "Inter_500Medium",
  },
  description: {
    fontSize: 12,
    fontFamily: "Inter_400Regular",
    lineHeight: 17,
  },

  loadingRow: {
    flexDirection: "row",
    alignItems: "center",
    gap: 10,
    paddingVertical: 8,
  },
  loadingText: {
    fontSize: 14,
    fontFamily: "Inter_400Regular",
  },
  errorText: {
    fontSize: 14,
    fontFamily: "Inter_400Regular",
    textAlign: "center",
    paddingVertical: 16,
  },

  sectionTitle: {
    fontSize: 16,
    fontFamily: "Inter_600SemiBold",
    marginBottom: -4,
  },
  grid: {
    flexDirection: "row",
    flexWrap: "wrap",
    gap: 10,
  },
  statCard: {
    width: "47%",
    padding: 14,
    borderRadius: 12,
    borderWidth: StyleSheet.hairlineWidth,
    gap: 4,
  },
  statLabel: {
    fontSize: 11,
    fontFamily: "Inter_500Medium",
    textTransform: "uppercase",
    letterSpacing: 0.6,
  },
  statValueRow: {
    flexDirection: "row",
    alignItems: "flex-end",
    gap: 3,
  },
  statValue: {
    fontSize: 22,
    fontFamily: "Inter_600SemiBold",
    lineHeight: 26,
  },
  statUnit: {
    fontSize: 13,
    fontFamily: "Inter_400Regular",
    paddingBottom: 2,
  },

  footer: {
    fontSize: 11,
    fontFamily: "Inter_400Regular",
    textAlign: "center",
    marginTop: 4,
  },
});
