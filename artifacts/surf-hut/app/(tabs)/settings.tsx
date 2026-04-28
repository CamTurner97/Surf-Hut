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

type Units = "metric" | "imperial";

export default function SettingsTab() {
  const colors = useColors();
  const insets = useSafeAreaInsets();
  const [units, setUnits] = useState<Units>("metric");
  const [hapticsEnabled, setHapticsEnabled] = useState<boolean>(true);

  return (
    <View style={[styles.root, { backgroundColor: colors.background }]}>
      <ScrollView
        contentContainerStyle={[
          styles.scroll,
          {
            paddingBottom:
              insets.bottom + (Platform.OS === "web" ? 100 : 90),
          },
        ]}
        showsVerticalScrollIndicator={false}
      >
        <Section title="Units" colors={colors}>
          <SegmentedRow
            label="Wave height"
            options={[
              { key: "metric", label: "Metres" },
              { key: "imperial", label: "Feet" },
            ]}
            value={units}
            onChange={setUnits}
            colors={colors}
          />
          <Divider colors={colors} />
          <SegmentedRow
            label="Wind speed"
            options={[
              { key: "metric", label: "km/h" },
              { key: "imperial", label: "mph" },
            ]}
            value={units}
            onChange={setUnits}
            colors={colors}
          />
        </Section>

        <Section title="App" colors={colors}>
          <ToggleRow
            label="Haptic feedback"
            value={hapticsEnabled}
            onChange={setHapticsEnabled}
            colors={colors}
          />
        </Section>

        <Section title="About" colors={colors}>
          <InfoRow glyph="i" label="Version" value="0.1.0 (preview)" colors={colors} />
          <Divider colors={colors} />
          <InfoRow
            glyph="◐"
            label="Surf data"
            value="Open-Meteo Marine"
            colors={colors}
          />
          <Divider colors={colors} />
          <InfoRow
            glyph="◉"
            label="Region"
            value="Sydney, NSW"
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

type ColorPalette = ReturnType<typeof useColors>;

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
      <Text
        style={[styles.sectionTitle, { color: colors.mutedForeground }]}
      >
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
                    color: active
                      ? colors.foreground
                      : colors.mutedForeground,
                    fontFamily: active
                      ? "Inter_600SemiBold"
                      : "Inter_500Medium",
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
  glyph,
  label,
  value,
  colors,
}: {
  glyph: string;
  label: string;
  value: string;
  colors: ColorPalette;
}) {
  return (
    <View style={styles.row}>
      <View style={styles.infoLeft}>
        <Text style={[styles.infoGlyph, { color: colors.mutedForeground }]}>
          {glyph}
        </Text>
        <Text style={[styles.rowLabel, { color: colors.foreground }]}>
          {label}
        </Text>
      </View>
      <Text style={[styles.infoValue, { color: colors.mutedForeground }]}>
        {value}
      </Text>
    </View>
  );
}

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
  infoLeft: {
    flexDirection: "row",
    alignItems: "center",
    gap: 10,
  },
  infoGlyph: {
    fontSize: 14,
    width: 18,
    textAlign: "center",
  },
  infoValue: {
    fontFamily: "Inter_500Medium",
    fontSize: 14,
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
