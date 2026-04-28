import React from "react";
import Svg, { Circle, Path } from "react-native-svg";

type Props = { color: string; size?: number };

export function GlobeIcon({ color, size = 22 }: Props) {
  const stroke = 1.6;
  return (
    <Svg width={size} height={size} viewBox="0 0 24 24" fill="none">
      <Circle
        cx={12}
        cy={12}
        r={9}
        stroke={color}
        strokeWidth={stroke}
      />
      <Path
        d="M3 12h18"
        stroke={color}
        strokeWidth={stroke}
        strokeLinecap="round"
      />
      <Path
        d="M12 3c2.6 3 4 5.8 4 9s-1.4 6-4 9c-2.6-3-4-5.8-4-9s1.4-6 4-9z"
        stroke={color}
        strokeWidth={stroke}
        strokeLinejoin="round"
      />
    </Svg>
  );
}

export function HeartOutlineIcon({ color, size = 22 }: Props) {
  return (
    <Svg width={size} height={size} viewBox="0 0 24 24" fill="none">
      <Path
        d="M12 20.5s-7.5-4.4-7.5-10.2A4.3 4.3 0 0 1 12 7.6a4.3 4.3 0 0 1 7.5 2.7C19.5 16.1 12 20.5 12 20.5z"
        stroke={color}
        strokeWidth={1.6}
        strokeLinejoin="round"
        fill="none"
      />
    </Svg>
  );
}
