import React, { useMemo } from 'react';
import {
  View, Text, StyleSheet, ScrollView,
} from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { Colors, Typography, Spacing, Radius } from '../../theme';
import { Card }          from '../../components/common/Card';
import { MetricCard }    from '../../components/common/MetricCard';
import { MCChartView }   from '../../components/charts/MCChartView';
import { Divider }       from '../../components/common/Divider';
import { MOCK_STRATEGIES, generateMonteCarlo, fmtUSD, fmtPct } from '../../data/mockData';

interface Props {
  navigation: any;
  route:      any;
}

const Row: React.FC<{ label: string; value: string; valueColor?: string }> = ({
  label, value, valueColor,
}) => (
  <View style={rowStyles.row}>
    <Text style={rowStyles.label}>{label}</Text>
    <Text style={[rowStyles.value, valueColor ? { color: valueColor } : null]}>
      {value}
    </Text>
  </View>
);

const rowStyles = StyleSheet.create({
  row:   { flexDirection: 'row', justifyContent: 'space-between', paddingVertical: 11, borderBottomWidth: 1, borderBottomColor: Colors.border },
  label: { ...Typography.bodyS, color: Colors.muted },
  value: { ...Typography.valueS, color: Colors.textPrimary },
});

export const MonteCarloScreen: React.FC<Props> = ({ route }) => {
  const strategy  = route.params?.strategy ?? MOCK_STRATEGIES[0];
  const mcMonths  = route.params?.mcMonths  ?? 24;
  const startVal  = strategy.finalValue;

  const mcData = useMemo(
    () => generateMonteCarlo(startVal, mcMonths),
    [startVal, mcMonths],
  );

  const last     = mcData[mcData.length - 1];
  const medianR  = ((last.median  - startVal) / startVal) * 100;
  const bestR    = ((last.best    - startVal) / startVal) * 100;
  const worstR   = ((last.worst   - startVal) / startVal) * 100;

  return (
    <SafeAreaView style={styles.safe}>
      <ScrollView
        contentContainerStyle={styles.content}
        showsVerticalScrollIndicator={false}
      >
        {/* ── Header ── */}
        <Text style={styles.title}>Monte Carlo</Text>
        <Text style={styles.subtitle}>
          500 simulated scenarios based on historical volatility
          · {mcMonths} months forward
        </Text>

        {/* ── Scenario metric cards ── */}
        <View style={styles.metricRow}>
          <MetricCard
            icon="📍"
            label="Starting Value"
            value={fmtUSD(startVal)}
            flex={1}
          />
          <View style={{ width: 10 }} />
          <MetricCard
            icon="🚀"
            label="Best Case (95%)"
            value={fmtUSD(last.best)}
            valueColor={Colors.green}
            sub="Top 5% scenario"
            flex={1}
          />
        </View>
        <View style={[styles.metricRow, { marginTop: 10 }]}>
          <MetricCard
            icon="⚖️"
            label="Median (50th %ile)"
            value={fmtUSD(last.median)}
            valueColor={Colors.violet}
            sub="Most likely outcome"
            flex={1}
          />
          <View style={{ width: 10 }} />
          <MetricCard
            icon="⚠️"
            label="Worst Case (5%)"
            value={fmtUSD(last.worst)}
            valueColor={Colors.red}
            sub="Bottom 5% scenario"
            flex={1}
          />
        </View>

        {/* ── Projection Cone chart ── */}
        <Card style={styles.chartCard}>
          <Text style={styles.chartTitle}>Projection Cone</Text>
          <Text style={styles.chartSub}>
            Shaded bands show 5–95%, 25–75% percentile ranges and median trajectory
          </Text>
          <MCChartView data={mcData} height={250} />
        </Card>

        {/* ── Outcome summary ── */}
        <Card style={styles.summaryCard}>
          <Text style={styles.sectionLabel}>EXPECTED OUTCOME SUMMARY</Text>
          <Row label="Probability of profit"    value="~68%"                     valueColor={Colors.green}  />
          <Row label="Median expected return"   value={fmtPct(medianR)}          valueColor={Colors.violet} />
          <Row label="Best-case return"         value={fmtPct(bestR)}            valueColor={Colors.green}  />
          <Row label="Worst-case return"        value={fmtPct(worstR)}           valueColor={Colors.red}    />
          <Row label="Simulations run"          value="500"                                                  />
          <Row label="Projection period"        value={`${mcMonths} months`}                                 />
          <Row label="Volatility model"         value="GBM"                      valueColor={Colors.violet} />
        </Card>

        {/* ── Disclaimer ── */}
        <View style={styles.disclaimer}>
          <Text style={styles.disclaimerText}>
            ⚠️{' '}
            <Text style={styles.disclaimerBold}>Disclaimer: </Text>
            Monte Carlo projections are probabilistic estimates based on historical
            volatility patterns. Past performance does not guarantee future results.
            This is a simulation tool only — not financial advice.
          </Text>
        </View>

      </ScrollView>
    </SafeAreaView>
  );
};

const styles = StyleSheet.create({
  safe:    { flex: 1, backgroundColor: Colors.bgPrimary },
  content: { paddingHorizontal: Spacing.xl, paddingBottom: Spacing.xxxl },

  title:    { ...Typography.h1, marginTop: Spacing.xl, marginBottom: 6 },
  subtitle: { ...Typography.caption, textTransform: 'none', letterSpacing: 0, fontSize: 12, lineHeight: 18, color: Colors.muted, marginBottom: Spacing.lg },

  metricRow: { flexDirection: 'row' },

  chartCard: { padding: Spacing.xl, marginTop: 18 },
  chartTitle: { ...Typography.h3, fontSize: 16, marginBottom: 4 },
  chartSub:   { ...Typography.caption, textTransform: 'none', letterSpacing: 0, fontSize: 11, lineHeight: 16, marginBottom: Spacing.lg },

  summaryCard:  { padding: Spacing.xl, marginTop: 14 },
  sectionLabel: { ...Typography.label, marginBottom: Spacing.md },

  disclaimer: {
    marginTop: Spacing.lg,
    backgroundColor: Colors.redDim,
    borderWidth: 1,
    borderColor: `${Colors.red}44`,
    borderRadius: Radius.sm,
    padding: Spacing.lg,
  },
  disclaimerText: {
    ...Typography.caption,
    textTransform: 'none',
    letterSpacing: 0,
    fontSize: 12,
    lineHeight: 18,
    color: Colors.muted,
  },
  disclaimerBold: {
    color: Colors.red,
    fontWeight: '700',
  },
});
