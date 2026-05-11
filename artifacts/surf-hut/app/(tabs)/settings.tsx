import React, { useState } from "react";
import {
  Platform,
  Pressable,
  ScrollView,
  StyleSheet,
  Switch,
  Text,
  View,
} from "react-native";
import { useSafeAreaInsets } from "react-native-safe-area-context";

import { useColors } from "@/hooks/useColors";
import { useUnits } from "@/hooks/useUnits";
import type { WaveHeightUnit, WindSpeedUnit, TemperatureUnit } from "@/contexts/UnitsContext";

type ColorPalette = ReturnType<typeof useColors>;

// ---------------------------------------------------------------------------
// Sub-components
// ---------------------------------------------------------------------------

function Section({
  title,
  children,
  colors,
}: {
  title: string;
  children: React.ReactNode;
  colors: ColorPalette;
}) {
  return (
    <View style={styles.section}>
      <Text style={[styles.sectionTitle, { color: colors.mutedForeground }]}>
        {title.toUpperCase()}
      </Text>
      <View
        style={[
          styles.card,
          { backgroundColor: colors.card, borderColor: colors.border },
        ]}
      >
        {children}
      </View>
    </View>
  );
}

function Divider({ colors }: { colors: ColorPalette }) {
  return (
    <View
      style={{
        height: StyleSheet.hairlineWidth,
        backgroundColor: colors.border,
        marginLeft: 16,
      }}
    />
  );
}

function SegmentedRow<T extends string>({
  label,
  options,
  value,
  onChange,
  colors,
}: {
  label: string;
  options: { key: T; label: string }[];
  value: T;
  onChange: (v: T) => void;
  colors: ColorPalette;
}) {
  return (
    <View style={styles.row}>
      <Text style={[styles.rowLabel, { color: colors.foreground }]}>
        {label}
      </Text>
      <View
        style={[
          styles.segmented,
          { backgroundColor: colors.secondary, borderColor: colors.border },
        ]}
      >
        {options.map((opt) => {
          const active = opt.key === value;
          return (
            <Pressable
              key={opt.key}
              onPress={() => onChange(opt.key)}
              style={({ pressed }) => [
                styles.segment,
                active && { backgroundColor: colors.background },
                pressed && !active && { opacity: 0.7 },
              ]}
            >
              <Text
                style={[
                  styles.segmentLabel,
                  {
                    color: active ? colors.foreground : colors.mutedForeground,
                    fontFamily: active ? "Inter_600SemiBold" : "Inter_500Medium",
                  },
                ]}
              >
                {opt.label}
              </Text>
            </Pressable>
          );
        })}
      </View>
    </View>
  );
}

function ToggleRow({
  label,
  value,
  onChange,
  colors,
}: {
  label: string;
  value: boolean;
  onChange: (v: boolean) => void;
  colors: ColorPalette;
}) {
  return (
    <View style={styles.row}>
      <Text style={[styles.rowLabel, { color: colors.foreground }]}>
        {label}
      </Text>
      <Switch
        value={value}
        onValueChange={onChange}
        trackColor={{ false: colors.border, true: colors.primary }}
        thumbColor="#FFFFFF"
        ios_backgroundColor={colors.border}
      />
    </View>
  );
}

function InfoRow({
  label,
  value,
  colors,
  dim,
}: {
  label: string;
  value: string;
  colors: ColorPalette;
  dim?: boolean;
}) {
  return (
    <View style={styles.row}>
      <Text style={[styles.rowLabel, { color: dim ? colors.mutedForeground : colors.foreground }]}>
        {label}
      </Text>
      <Text style={[styles.infoValue, { color: colors.mutedForeground }]}>
        {value}
      </Text>
    </View>
  );
}

// ---------------------------------------------------------------------------
// Screen
// ---------------------------------------------------------------------------

export default function SettingsTab() {
  const colors = useColors();
  const insets = useSafeAreaInsets();
  const { units, setWaveHeight, setWindSpeed, setTemperature } = useUnits();
  const [hapticsEnabled, setHapticsEnabled] = useState(true);

  return (
    <View style={[styles.root, { backgroundColor: colors.background }]}>
      <ScrollView
        contentContainerStyle={[
          styles.scroll,
          { paddingBottom: insets.bottom + (Platform.OS === "web" ? 100 : 90) },
        ]}
        showsVerticalScrollIndicator={false}
      >
        {/* ── Units ── */}
        <Section title="Units" colors={colors}>
          <SegmentedRow<WaveHeightUnit>
            label="Wave height"
            options={[
              { key: "metric", label: "Metres" },
              { key: "imperial", label: "Feet" },
            ]}
            value={units.waveHeight}
            onChange={setWaveHeight}
            colors={colors}
          />
          <Divider colors={colors} />
          <SegmentedRow<WindSpeedUnit>
            label="Wind speed"
            options={[
              { key: "metric", label: "km/h" },
              { key: "imperial", label: "mph" },
            ]}
            value={units.windSpeed}
            onChange={setWindSpeed}
            colors={colors}
          />
          <Divider colors={colors} />
          <SegmentedRow<TemperatureUnit>
            label="Temperature"
            options={[
              { key: "metric", label: "°C" },
              { key: "imperial", label: "°F" },
            ]}
            value={units.temperature}
            onChange={setTemperature}
            colors={colors}
          />
        </Section>

        {/* ── App ── */}
        <Section title="App" colors={colors}>
          <ToggleRow
            label="Haptic feedback"
            value={hapticsEnabled}
            onChange={setHapticsEnabled}
            colors={colors}
          />
        </Section>

        {/* ── About ── */}
        <Section title="About" colors={colors}>
          <View style={[styles.aboutHero, { borderBottomColor: colors.border }]}>
            <Text style={[styles.aboutTitle, { color: colors.foreground }]}>
              Surf Hut
            </Text>
            <Text style={[styles.aboutTagline, { color: colors.primary }]}>
              Where's it firing?
            </Text>
            <Text style={[styles.aboutBody, { color: colors.mutedForeground }]}>
              Surf reports for 20 Sydney beaches, updated every 30 minutes. The
              surf score (1–10) weights wave height, wind direction, wind speed,
              and swell period against each beach's ideal conditions.
            </Text>
          </View>
          <InfoRow label="Version" value="0.1.0 (preview)" colors={colors} />
          <Divider colors={colors} />
          <InfoRow label="Region" value="Sydney, NSW" colors={colors} />
        </Section>

        {/* ── Credits ── */}
        <Section title="Credits" colors={colors}>
          <InfoRow
            label="Surf & weather data"
            value="Open-Meteo"
            colors={colors}
          />
          <Divider colors={colors} />
          <InfoRow
            label="Map tiles"
            value="OpenStreetMap"
            colors={colors}
          />
          <Divider colors={colors} />
          <InfoRow
            label="Built with"
            value="Expo / React Native"
            colors={colors}
          />
        </Section>

        <Text style={[styles.footer, { color: colors.mutedForeground }]}>
          SURF HUT  ·  MADE FOR SYDNEY
        </Text>
      </ScrollView>
    </View>
  );
}

// ---------------------------------------------------------------------------
// Styles
// ---------------------------------------------------------------------------

const styles = StyleSheet.create({
  root: { flex: 1 },
  scroll: {
    paddingHorizontal: 18,
    paddingTop: 24,
  },
  section: {
    marginBottom: 28,
  },
  sectionTitle: {
    fontFamily: "Inter_500Medium",
    fontSize: 11,
    letterSpacing: 0.8,
    marginBottom: 8,
    marginLeft: 4,
  },
  card: {
    borderRadius: 14,
    borderWidth: StyleSheet.hairlineWidth,
    overflow: "hidden",
  },
  row: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "space-between",
    paddingHorizontal: 16,
    paddingVertical: 14,
    minHeight: 52,
  },
  rowLabel: {
    fontFamily: "Inter_500Medium",
    fontSize: 15,
    flexShrink: 1,
    marginRight: 12,
  },
  segmented: {
    flexDirection: "row",
    borderRadius: 8,
    borderWidth: StyleSheet.hairlineWidth,
    padding: 2,
  },
  segment: {
    paddingHorizontal: 12,
    paddingVertical: 6,
    borderRadius: 6,
  },
  segmentLabel: {
    fontSize: 13,
  },
  infoValue: {
    fontFamily: "Inter_500Medium",
    fontSize: 14,
  },
  aboutHero: {
    paddingHorizontal: 16,
    paddingTop: 18,
    paddingBottom: 16,
    gap: 4,
    borderBottomWidth: StyleSheet.hairlineWidth,
  },
  aboutTitle: {
    fontFamily: "Inter_700Bold",
    fontSize: 20,
  },
  aboutTagline: {
    fontFamily: "Inter_500Medium",
    fontSize: 13,
    marginBottom: 6,
  },
  aboutBody: {
    fontFamily: "Inter_400Regular",
    fontSize: 13,
    lineHeight: 19,
  },
  footer: {
    fontFamily: "Inter_400Regular",
    fontSize: 11,
    textAlign: "center",
    letterSpacing: 0.8,
    marginTop: 8,
    marginBottom: 16,
  },
});
