import React, { useMemo, useState } from 'react';
import {
  View, Text, StyleSheet, ScrollView,
  TouchableOpacity, Alert, ActivityIndicator,
} from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { Colors, Typography, Spacing, Radius } from '../../theme';
import { Card }          from '../../components/common/Card';
import { MetricCard }    from '../../components/common/MetricCard';
import { Divider }       from '../../components/common/Divider';
import { AreaChartView } from '../../components/charts/AreaChartView';
import {
  MOCK_STRATEGIES, Strategy, generatePortfolioChart,
  fmtUSD, fmtPct, fmtCoins,
} from '../../data/mockData';
import { exportReport, exportToCsv } from '../../services/exportService';
import { useStrategies } from '../../hooks/useStrategies';

interface Props { navigation: any; route: any; }

export const BacktestScreen: React.FC<Props> = ({ navigation, route }) => {
  const strategy: Strategy = route.params?.strategy ?? MOCK_STRATEGIES[0];
  const mcMonths: number   = route.params?.mcMonths  ?? 24;
  const [saved, setSaved]  = useState(false);
  const [saving, setSaving] = useState(false);
  const { saveStrategy }   = useStrategies();

  const chartData = useMemo(() => generatePortfolioChart(strategy), [strategy]);

  const portfolioPts = chartData.map(p => ({ label: p.date, value: p.portfolioValue, value2: p.totalInvested }));
  const roiPts       = chartData.map(p => ({ label: p.date, value: p.roi }));

  const isPos = strategy.roi >= 0;
  const pnl   = strategy.finalValue - strategy.totalInvested;

  const handleSave = async () => {
    setSaving(true);
    try {
      await saveStrategy(strategy);
      setSaved(true);
      Alert.alert('✓ Saved', 'Strategy saved to your Portfolio.');
    } catch (e: any) {
      Alert.alert('Save Failed', e.message || 'An error occurred while saving.');
    } finally {
      setSaving(false);
    }
  };

  const goMC = () =>
    navigation.navigate('MonteCarlo', { strategy, mcMonths });

  return (
    <SafeAreaView style={S.safe}>
      <ScrollView contentContainerStyle={S.content} showsVerticalScrollIndicator={false}>

        {/* Strategy info row */}
        <View style={S.infoRow}>
          <View style={S.assetBadge}>
            <Text style={S.assetText}>{strategy.asset}</Text>
          </View>
          <View style={{ flex: 1 }}>
            <Text style={S.assetPair}>{strategy.asset}/USDT</Text>
            <Text style={S.assetMeta}>
              ${strategy.amount} {strategy.frequency}
              {'  ·  '}{strategy.startDate.slice(0,7)} → {strategy.endDate.slice(0,7)}
            </Text>
          </View>
          <TouchableOpacity
            style={[S.saveBtn, saved && S.saveBtnDone]}
            onPress={handleSave}
            disabled={saving || saved}
          >
            {saving ? (
              <ActivityIndicator size="small" color={Colors.purple} />
            ) : (
              <Text style={[S.saveTxt, saved && S.saveTxtDone]}>
                {saved ? '✓ Saved' : '💾 Save'}
              </Text>
            )}
          </TouchableOpacity>
        </View>

        {/* ── Metrics grid ── */}
        <View style={S.row}>
          <MetricCard icon="💰" label="Total Invested"  value={fmtUSD(strategy.totalInvested)}  flex={1} />
          <View style={S.gap} />
          <MetricCard icon="📈" label="Portfolio Value" value={fmtUSD(strategy.finalValue)} valueColor={isPos ? Colors.green : Colors.red} flex={1} />
        </View>
        <View style={[S.row, S.rowMt]}>
          <MetricCard icon="%" label="ROI"  value={fmtPct(strategy.roi)}  valueColor={isPos ? Colors.green : Colors.red} flex={1} />
          <View style={S.gap} />
          <MetricCard icon="📅" label="CAGR" value={fmtPct(strategy.cagr)} valueColor={strategy.cagr >= 0 ? Colors.green : Colors.red} sub="Annualized" flex={1} />
        </View>
        <View style={[S.row, S.rowMt]}>
          <MetricCard icon="📉" label="Max Drawdown"  value={`-${strategy.maxDrawdown.toFixed(1)}%`} valueColor={Colors.red}  sub="Peak-to-trough" flex={1} />
          <View style={S.gap} />
          <MetricCard
            icon="⚖️" label="Sharpe Ratio"
            value={strategy.sharpeRatio.toFixed(2)}
            valueColor={strategy.sharpeRatio > 1 ? Colors.green : strategy.sharpeRatio > 0 ? Colors.violet : Colors.red}
            sub="Risk-adjusted"
            flex={1}
          />
        </View>
        <View style={[S.row, S.rowMt]}>
          <MetricCard icon="🪙" label={`${strategy.asset} Coins`} value={fmtCoins(strategy.totalCoins, strategy.asset)} sub={`avg ${fmtUSD(strategy.totalInvested / strategy.totalCoins)} buy`} flex={1} />
          <View style={S.gap} />
          <MetricCard icon="💹" label="Profit / Loss" value={fmtUSD(Math.abs(pnl))} valueColor={pnl >= 0 ? Colors.green : Colors.red} sub={pnl >= 0 ? 'net profit' : 'net loss'} flex={1} />
        </View>

        {/* ── Portfolio growth chart ── */}
        <Card style={S.chartCard}>
          <Text style={S.chartTitle}>Portfolio Growth vs Total Invested</Text>
          <AreaChartView data={portfolioPts} color={Colors.purple} color2={Colors.violet} height={220} formatY={v => fmtUSD(v)} />
          <View style={S.legend}>
            {[{ color: Colors.purple, l: 'Portfolio Value' }, { color: Colors.violet, l: 'Total Invested', dash: true }].map(x => (
              <View key={x.l} style={S.legendItem}>
                <View style={[S.legendDot, { backgroundColor: x.color }]} />
                <Text style={[S.legendText, x.dash && { fontStyle: 'italic' }]}>{x.l}</Text>
              </View>
            ))}
          </View>
        </Card>

        {/* ── ROI chart ── */}
        <Card style={[S.chartCard, { marginTop: 12 }]}>
          <Text style={S.chartTitle}>ROI Over Time (%)</Text>
          <AreaChartView data={roiPts} color={Colors.green} height={180} formatY={v => `${v.toFixed(0)}%`} />
        </Card>

        <Divider style={{ marginVertical: Spacing.xl }} />

        {/* ── Action buttons ── */}
        <View style={S.actionsContainer}>
          <TouchableOpacity style={S.primaryActionBtn} onPress={goMC} activeOpacity={0.8}>
            <Text style={S.primaryActionBtnText}>📊  View Monte Carlo Forecast</Text>
          </TouchableOpacity>
          <View style={S.secondaryActionsRow}>
            <TouchableOpacity
              style={S.secondaryActionBtn}
              onPress={async () => {
                try {
                  await exportReport([strategy], `${strategy.asset} Backtest Report`);
                } catch (e: any) {
                  Alert.alert('Export Failed', e.message);
                }
              }}
              activeOpacity={0.8}
            >
              <Text style={S.secondaryActionBtnText}>📄  PDF Report</Text>
            </TouchableOpacity>
            <TouchableOpacity
              style={S.secondaryActionBtn}
              onPress={async () => {
                try {
                  await exportToCsv([strategy]);
                } catch (e: any) {
                  Alert.alert('Export Failed', e.message);
                }
              }}
              activeOpacity={0.8}
            >
              <Text style={S.secondaryActionBtnText}>📊  CSV Data</Text>
            </TouchableOpacity>
          </View>
        </View>

      </ScrollView>
    </SafeAreaView>
  );
};

const S = StyleSheet.create({
  safe:    { flex: 1, backgroundColor: Colors.bgPrimary },
  content: { paddingHorizontal: Spacing.xl, paddingBottom: 48 },

  infoRow: { flexDirection: 'row', alignItems: 'center', paddingTop: Spacing.lg, marginBottom: Spacing.xl, gap: 12 },
  assetBadge: { width: 52, height: 52, borderRadius: Radius.md, backgroundColor: Colors.purpleDim, borderWidth: 1, borderColor: Colors.purpleBorder, alignItems: 'center', justifyContent: 'center' },
  assetText:  { color: Colors.purple, fontWeight: '800', fontSize: 12 },
  assetPair:  { ...Typography.h3, marginBottom: 4 },
  assetMeta:  { ...Typography.caption, textTransform: 'none', letterSpacing: 0, fontSize: 12, lineHeight: 17 },
  saveBtn:    { borderWidth: 1, borderColor: Colors.purple, borderRadius: Radius.sm, paddingHorizontal: 14, paddingVertical: 8 },
  saveBtnDone:{ borderColor: Colors.green },
  saveTxt:    { color: Colors.purple, fontWeight: '700', fontSize: 13 },
  saveTxtDone:{ color: Colors.green },

  row:   { flexDirection: 'row' },
  rowMt: { marginTop: 10 },
  gap:   { width: 10 },

  chartCard:  { padding: Spacing.xl, marginTop: 18 },
  chartTitle: { ...Typography.h3, fontSize: 15, marginBottom: Spacing.lg },
  legend:     { flexDirection: 'row', gap: 16, marginTop: Spacing.sm },
  legendItem: { flexDirection: 'row', alignItems: 'center', gap: 6 },
  legendDot:  { width: 8, height: 8, borderRadius: 4 },
  legendText: { ...Typography.caption, textTransform: 'none', letterSpacing: 0, fontSize: 11 },

  actionsContainer: { gap: 10, marginTop: Spacing.md },
  primaryActionBtn: { backgroundColor: Colors.purple, borderRadius: Radius.md, paddingVertical: 15, alignItems: 'center', justifyContent: 'center', shadowColor: Colors.purple, shadowOffset: { width: 0, height: 4 }, shadowOpacity: 0.3, shadowRadius: 8, elevation: 4 },
  primaryActionBtnText: { color: Colors.white, fontWeight: '700', fontSize: 15 },
  secondaryActionsRow: { flexDirection: 'row', gap: 10 },
  secondaryActionBtn: { flex: 1, backgroundColor: 'transparent', borderWidth: 1, borderColor: Colors.border, borderRadius: Radius.md, paddingVertical: 14, alignItems: 'center', justifyContent: 'center' },
  secondaryActionBtnText: { color: Colors.textSecondary, fontWeight: '600', fontSize: 14 },
});
