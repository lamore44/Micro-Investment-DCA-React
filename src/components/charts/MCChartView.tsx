import React, { useMemo } from 'react';
import { View, Text, StyleSheet, useWindowDimensions } from 'react-native';
import Svg, {
  Path,
  Defs,
  LinearGradient as SvgLinearGradient,
  Stop,
  Line,
  Text as SvgText,
} from 'react-native-svg';
import { Colors, Typography } from '../../theme';
import { MCResult } from '../../data/mockData';

const CARD_GUTTER = 80;

interface MCChartViewProps {
  data: MCResult[];
  height?: number;
}

export const MCChartView: React.FC<MCChartViewProps> = ({
  data,
  height = 240,
}) => {
  const { width: windowWidth } = useWindowDimensions();
  const chartWidth = Math.max(0, windowWidth - CARD_GUTTER);
  const PAD = { top: 16, bottom: 28, left: 52, right: 12 };
  const Wi = chartWidth - PAD.left - PAD.right;
  const Hi = height - PAD.top - PAD.bottom;

  const { minV, maxV, xOf, yOf } = useMemo(() => {
    const allV = data.flatMap(d => [d.worst, d.best]);
    const minV = Math.min(...allV) * 0.88;
    const maxV = Math.max(...allV) * 1.06;
    const range = maxV - minV || 1;
    const xOf = (i: number) => PAD.left + (i / (data.length - 1)) * Wi;
    const yOf = (v: number) => PAD.top + (1 - (v - minV) / range) * Hi;
    return { minV, maxV, xOf, yOf };
  }, [data]);

  const band = (
    lo: (d: MCResult) => number,
    hi: (d: MCResult) => number,
  ): string => {
    const top = data.map((d, i) => ({ x: xOf(i), y: yOf(hi(d)) }));
    const bot = [...data]
      .reverse()
      .map((d, i) => ({ x: xOf(data.length - 1 - i), y: yOf(lo(d)) }));
    const all = [...top, ...bot];
    return (
      all
        .map(
          (p, i) => `${i === 0 ? 'M' : 'L'}${p.x.toFixed(1)},${p.y.toFixed(1)}`,
        )
        .join(' ') + ' Z'
    );
  };

  const line = (
    getter: (d: MCResult) => number,
    dash?: string,
  ): { d: string; dash?: string } => {
    const pts = data.map((d, i) => ({ x: xOf(i), y: yOf(getter(d)) }));
    let d = `M${pts[0].x},${pts[0].y}`;
    for (let i = 1; i < pts.length; i++) {
      const cx = (pts[i - 1].x + pts[i].x) / 2;
      d += ` C${cx},${pts[i - 1].y} ${cx},${pts[i].y} ${pts[i].x},${pts[i].y}`;
    }
    return { d, dash };
  };

  const gridLines = 4;
  const yLabels = Array.from({ length: gridLines + 1 }, (_, i) => {
    const frac = i / gridLines;
    const v = minV + frac * (maxV - minV);
    const y = PAD.top + (1 - frac) * Hi;
    const label =
      v >= 1_000_000
        ? `$${(v / 1_000_000).toFixed(1)}M`
        : v >= 1_000
          ? `$${(v / 1_000).toFixed(0)}K`
          : `$${v.toFixed(0)}`;
    return { label, y };
  });

  const xStep = Math.max(1, Math.floor(data.length / 5));
  const xLabels = data
    .filter((_, i) => i % xStep === 0 || i === data.length - 1)
    .map(d => ({
      label: `M${d.month}`,
      x: xOf(data.indexOf(d)),
    }));

  return (
    <View>
      <Svg width={chartWidth} height={height}>
        <Defs>
          <SvgLinearGradient id="mcBest" x1="0" y1="0" x2="0" y2="1">
            <Stop offset="0%" stopColor={Colors.green} stopOpacity={0.18} />
            <Stop offset="100%" stopColor={Colors.green} stopOpacity={0.0} />
          </SvgLinearGradient>
          <SvgLinearGradient id="mcMid" x1="0" y1="0" x2="0" y2="1">
            <Stop offset="0%" stopColor={Colors.violet} stopOpacity={0.18} />
            <Stop offset="100%" stopColor={Colors.violet} stopOpacity={0.0} />
          </SvgLinearGradient>
          <SvgLinearGradient id="mcWorst" x1="0" y1="0" x2="0" y2="1">
            <Stop offset="0%" stopColor={Colors.red} stopOpacity={0.12} />
            <Stop offset="100%" stopColor={Colors.red} stopOpacity={0.0} />
          </SvgLinearGradient>
        </Defs>

        {/* Grid */}
        {yLabels.map(({ label, y }, i) => (
          <React.Fragment key={i}>
            <Line
              x1={PAD.left}
              y1={y}
              x2={PAD.left + Wi}
              y2={y}
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
              {label}
            </SvgText>
          </React.Fragment>
        ))}
        {xLabels.map(({ label, x }, i) => (
          <SvgText
            key={i}
            x={x}
            y={height - 4}
            fontSize={9}
            fill={Colors.muted}
            textAnchor="middle"
          >
            {label}
          </SvgText>
        ))}

        {/* Bands */}
        <Path
          d={band(
            d => d.low,
            d => d.best,
          )}
          fill="url(#mcBest)"
        />
        <Path
          d={band(
            d => d.low,
            d => d.high,
          )}
          fill="url(#mcMid)"
        />
        <Path
          d={band(
            d => d.worst,
            d => d.low,
          )}
          fill="url(#mcWorst)"
        />

        {/* Lines */}
        <Path
          {...line(d => d.best)}
          stroke={Colors.green}
          strokeWidth={1.2}
          fill="none"
          opacity={0.7}
        />
        <Path
          {...line(d => d.high)}
          stroke={Colors.violet}
          strokeWidth={1.2}
          fill="none"
          opacity={0.7}
        />
        <Path
          {...line(d => d.median)}
          stroke={Colors.purple}
          strokeWidth={2.5}
          fill="none"
        />
        <Path
          {...line(d => d.low, '5,3')}
          stroke={Colors.orange}
          strokeWidth={1.2}
          fill="none"
          opacity={0.7}
          strokeDasharray="5,3"
        />
        <Path
          {...line(d => d.worst)}
          stroke={Colors.red}
          strokeWidth={1.2}
          fill="none"
          opacity={0.7}
        />
      </Svg>

      {/* Legend */}
      <View style={styles.legend}>
        {[
          { color: Colors.green, label: 'Best (95%)' },
          { color: Colors.violet, label: 'High (75%)' },
          { color: Colors.purple, label: 'Median' },
          { color: Colors.orange, label: 'Low (25%)' },
          { color: Colors.red, label: 'Worst (5%)' },
        ].map(item => (
          <View key={item.label} style={styles.legendItem}>
            <View style={[styles.legendDot, { backgroundColor: item.color }]} />
            <Text style={styles.legendText}>{item.label}</Text>
          </View>
        ))}
      </View>
    </View>
  );
};

const styles = StyleSheet.create({
  legend: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: 10,
    marginTop: 8,
    paddingHorizontal: 4,
  },
  legendItem: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 5,
  },
  legendDot: {
    width: 8,
    height: 8,
    borderRadius: 4,
  },
  legendText: {
    ...Typography.caption,
    fontSize: 10,
    letterSpacing: 0,
    textTransform: 'none',
  },
});
