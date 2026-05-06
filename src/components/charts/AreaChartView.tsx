/**
 * AreaChartView
 * Uses react-native-svg to draw a clean area + line chart
 * without needing a heavy external charting library.
 */
import React, { useMemo } from 'react';
import { View, Text, StyleSheet, Dimensions } from 'react-native';
import Svg, {
  Path,
  Defs,
  LinearGradient as SvgLinearGradient,
  Stop,
  Line,
  Text as SvgText,
  Circle,
} from 'react-native-svg';
import { Colors, Typography } from '../../theme';

interface DataPoint {
  label: string;
  value: number;
  value2?: number;
}

interface AreaChartViewProps {
  data: DataPoint[];
  color?: string;
  color2?: string;
  height?: number;
  showGrid?: boolean;
  formatY?: (v: number) => string;
  title?: string;
}

const W = Dimensions.get('window').width - 40;

export const AreaChartView: React.FC<AreaChartViewProps> = ({
  data,
  color  = Colors.purple,
  color2 = Colors.violet,
  height = 200,
  showGrid = true,
  formatY = (v) => `$${(v / 1000).toFixed(0)}K`,
  title,
}) => {
  const PAD = { top: 16, bottom: 28, left: 48, right: 12 };
  const W_inner = W - PAD.left - PAD.right;
  const H_inner = height - PAD.top - PAD.bottom;

  const { minV, maxV, pts1, pts2 } = useMemo(() => {
    const vals  = data.map(d => d.value);
    const vals2 = data.map(d => d.value2 ?? 0);
    const allV  = [...vals, ...vals2.filter(v => v > 0)];
    const minV  = Math.min(...allV) * 0.9;
    const maxV  = Math.max(...allV) * 1.05;
    const range = maxV - minV || 1;

    const toXY = (i: number, v: number) => ({
      x: PAD.left + (i / (data.length - 1)) * W_inner,
      y: PAD.top  + (1 - (v - minV) / range) * H_inner,
    });

    const pts1 = data.map((d, i) => toXY(i, d.value));
    const pts2 = data[0]?.value2 !== undefined
      ? data.map((d, i) => toXY(i, d.value2!))
      : [];

    return { minV, maxV, pts1, pts2 };
  }, [data]);

  const buildPath = (pts: { x: number; y: number }[], fill?: boolean): string => {
    if (pts.length < 2) return '';
    let d = `M${pts[0].x},${pts[0].y}`;
    for (let i = 1; i < pts.length; i++) {
      const cpx = (pts[i - 1].x + pts[i].x) / 2;
      d += ` C${cpx},${pts[i - 1].y} ${cpx},${pts[i].y} ${pts[i].x},${pts[i].y}`;
    }
    if (fill) {
      const bY = PAD.top + H_inner;
      d += ` L${pts[pts.length - 1].x},${bY} L${pts[0].x},${bY} Z`;
    }
    return d;
  };

  const gridLines = 4;
  const yLabels: { v: number; y: number }[] = Array.from({ length: gridLines + 1 }, (_, i) => {
    const frac = i / gridLines;
    return {
      v: minV + frac * (maxV - minV),
      y: PAD.top + (1 - frac) * H_inner,
    };
  });

  const xStep = Math.max(1, Math.floor(data.length / 5));
  const xLabels = data
    .filter((_, i) => i % xStep === 0 || i === data.length - 1)
    .map((d, _, arr) => {
      const origIdx = data.findIndex(x => x.label === d.label);
      return {
        label: d.label,
        x: PAD.left + (origIdx / (data.length - 1)) * W_inner,
      };
    });

  return (
    <View>
      {title ? <Text style={styles.title}>{title}</Text> : null}
      <Svg width={W} height={height}>
        <Defs>
          <SvgLinearGradient id="grad1" x1="0" y1="0" x2="0" y2="1">
            <Stop offset="0%"   stopColor={color}  stopOpacity={0.35} />
            <Stop offset="100%" stopColor={color}  stopOpacity={0.0}  />
          </SvgLinearGradient>
          <SvgLinearGradient id="grad2" x1="0" y1="0" x2="0" y2="1">
            <Stop offset="0%"   stopColor={color2} stopOpacity={0.20} />
            <Stop offset="100%" stopColor={color2} stopOpacity={0.0}  />
          </SvgLinearGradient>
        </Defs>

        {/* Grid lines */}
        {showGrid && yLabels.map(({ v, y }, i) => (
          <React.Fragment key={i}>
            <Line
              x1={PAD.left} y1={y}
              x2={PAD.left + W_inner} y2={y}
              stroke={Colors.border}
              strokeWidth={1}
              strokeDasharray="4,4"
            />
            <SvgText
              x={PAD.left - 4}
              y={y + 4}
              fontSize={9}
              fill={Colors.muted}
              textAnchor="end"
            >
              {formatY(v)}
            </SvgText>
          </React.Fragment>
        ))}

        {/* X labels */}
        {xLabels.map(({ label, x }, i) => (
          <SvgText key={i} x={x} y={height - 4} fontSize={9} fill={Colors.muted} textAnchor="middle">
            {label}
          </SvgText>
        ))}

        {/* Area fills */}
        {pts2.length > 0 && (
          <Path d={buildPath(pts2, true)} fill="url(#grad2)" />
        )}
        <Path d={buildPath(pts1, true)} fill="url(#grad1)" />

        {/* Lines */}
        {pts2.length > 0 && (
          <Path
            d={buildPath(pts2)}
            stroke={color2}
            strokeWidth={1.5}
            strokeDasharray="5,3"
            fill="none"
          />
        )}
        <Path d={buildPath(pts1)} stroke={color} strokeWidth={2.5} fill="none" />

        {/* End dot */}
        {pts1.length > 0 && (
          <Circle
            cx={pts1[pts1.length - 1].x}
            cy={pts1[pts1.length - 1].y}
            r={4}
            fill={color}
          />
        )}
      </Svg>
    </View>
  );
};

const styles = StyleSheet.create({
  title: {
    ...Typography.h3,
    marginBottom: 14,
    fontSize: 15,
  },
});
