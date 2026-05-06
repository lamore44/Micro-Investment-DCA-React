import React from 'react';
import {
  View, Text, StyleSheet, ScrollView, TouchableOpacity,
} from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { Colors, Typography, Spacing, Radius } from '../../theme';
import { Card }          from '../../components/common/Card';
import { SectionHeader } from '../../components/common/SectionHeader';
import { useStrategies } from '../../hooks/useStrategies';
import { Strategy, fmtUSD, fmtPct } from '../../data/mockData';

interface Props { navigation: any; }

const StrategyRow: React.FC<{ item: Strategy; onPress: () => void }> = ({ item, onPress }) => (
  <TouchableOpacity onPress={onPress} activeOpacity={0.75}>
    <Card style={S.stratCard}>
      <View style={S.assetBadge}>
        <Text style={S.assetText}>{item.asset}</Text>
      </View>
      <View style={{ flex: 1 }}>
        <Text style={S.stratName} numberOfLines={1}>
          {item.asset}/USDT · ${item.amount} {item.frequency}
        </Text>
        <Text style={S.stratPeriod}>
          {item.startDate.slice(0,7)} → {item.endDate.slice(0,7)}
        </Text>
      </View>
      <View style={{ alignItems: 'flex-end' }}>
        <Text style={[S.roiText, { color: item.roi >= 0 ? Colors.green : Colors.red }]}>
          {fmtPct(item.roi)}
        </Text>
        <Text style={S.valueText}>{fmtUSD(item.finalValue)}</Text>
      </View>
    </Card>
  </TouchableOpacity>
);

export const HomeScreen: React.FC<Props> = ({ navigation }) => {
  const { strategies, totalValue, totalInvested, avgRoi, bestRoi } = useStrategies();
  const overallRoi = totalInvested > 0
    ? ((totalValue - totalInvested) / totalInvested) * 100
    : 37.5;

  return (
    <SafeAreaView style={S.safe}>
      <ScrollView contentContainerStyle={S.content} showsVerticalScrollIndicator={false}>

        {/* ── Header ── */}
        <View style={S.header}>
          <View>
            <Text style={S.greeting}>Hello, User 👋</Text>
            <Text style={S.greetSub}>Your DCA simulation hub</Text>
          </View>
          <TouchableOpacity style={S.avatar}>
            <Text style={S.avatarTxt}>U</Text>
          </TouchableOpacity>
        </View>

        {/* ── Hero card (purple) ── */}
        <View style={S.heroCard}>
          <Text style={S.heroTitle}>Simulate your{'\n'}investment strategy</Text>

          {/* Inner summary card */}
          <View style={S.heroInner}>
            <Text style={S.heroInnerTitle}>Portfolio Simulation</Text>
            <View style={S.heroMetrics}>
              {[
                { l: 'Total Invested',  v: fmtUSD(totalInvested || 1200) },
                { l: 'Portfolio Value', v: fmtUSD(totalValue    || 1650) },
                { l: 'ROI',             v: fmtPct(overallRoi), color: Colors.green },
              ].map(m => (
                <View key={m.l} style={{ flex: 1 }}>
                  <Text style={S.heroMetaLabel}>{m.l}</Text>
                  <Text style={[S.heroMetaValue, m.color ? { color: m.color } : null]}>
                    {m.v}
                  </Text>
                </View>
              ))}
            </View>
          </View>
        </View>

        {/* ── Quick stat row ── */}
        <View style={S.statsRow}>
          <Card style={[S.statCard, { marginRight: 8 }]}>
            <Text style={S.statLabel}>📋  STRATEGIES</Text>
            <Text style={S.statVal}>{strategies.length}</Text>
          </Card>
          <Card style={[S.statCard, { marginLeft: 8 }]}>
            <Text style={S.statLabel}>🚀  BEST ROI</Text>
            <Text style={[S.statVal, { color: Colors.green }]}>
              {strategies.length ? fmtPct(bestRoi) : '—'}
            </Text>
          </Card>
        </View>

        {/* ── Strategies list ── */}
        <SectionHeader
          title="Your Strategies"
          actionLabel="+ New"
          onAction={() => navigation.navigate('Builder')}
          style={{ marginTop: Spacing.xl }}
        />

        {strategies.length === 0 ? (
          <View style={S.empty}>
            <Text style={S.emptyIcon}>📂</Text>
            <Text style={S.emptyText}>No strategies yet.{'\n'}Tap Builder to create one.</Text>
          </View>
        ) : (
          strategies.map(item => (
            <StrategyRow
              key={item.id}
              item={item}
              onPress={() => navigation.navigate('Backtest', { strategy: item })}
            />
          ))
        )}

        {/* ── CTA card ── */}
        <Card highlight style={S.ctaCard}>
          <Text style={S.ctaQuote}>
            "What if I invested $50/week{'\n'}in BTC for the last 3 years?"
          </Text>
          <TouchableOpacity
            style={S.ctaBtn}
            onPress={() => navigation.navigate('Builder')}
            activeOpacity={0.8}
          >
            <Text style={S.ctaBtnText}>Start Simulating →</Text>
          </TouchableOpacity>
        </Card>

      </ScrollView>
    </SafeAreaView>
  );
};

const S = StyleSheet.create({
  safe:    { flex: 1, backgroundColor: Colors.bgPrimary },
  content: { paddingHorizontal: Spacing.xl, paddingBottom: 40 },

  /* Header */
  header:    { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center', paddingTop: Spacing.xl, marginBottom: Spacing.lg },
  greeting:  { ...Typography.h1, fontSize: 22 },
  greetSub:  { ...Typography.caption, textTransform: 'none', letterSpacing: 0, color: Colors.muted, fontSize: 12, marginTop: 2 },
  avatar:    { width: 40, height: 40, borderRadius: 20, backgroundColor: Colors.bgCard, borderWidth: 1, borderColor: Colors.border, alignItems: 'center', justifyContent: 'center' },
  avatarTxt: { color: Colors.muted, fontWeight: '700' },

  /* Hero */
  heroCard:  { backgroundColor: Colors.purple, borderRadius: Radius.lg, padding: Spacing.xl, marginBottom: Spacing.lg, shadowColor: Colors.purple, shadowOffset: { width: 0, height: 6 }, shadowOpacity: 0.35, shadowRadius: 16, elevation: 8 },
  heroTitle: { ...Typography.h2, color: Colors.white, marginBottom: Spacing.lg },
  heroInner: { backgroundColor: Colors.white, borderRadius: Radius.md, padding: Spacing.lg },
  heroInnerTitle: { fontSize: 14, fontWeight: '700', color: Colors.black, marginBottom: 12 },
  heroMetrics:    { flexDirection: 'row' },
  heroMetaLabel:  { fontSize: 11, color: Colors.muted, marginBottom: 4 },
  heroMetaValue:  { fontSize: 17, fontWeight: '800', color: Colors.black, fontFamily: 'monospace' },

  /* Stats */
  statsRow:  { flexDirection: 'row', marginBottom: Spacing.sm },
  statCard:  { flex: 1, padding: Spacing.lg },
  statLabel: { ...Typography.label, fontSize: 10, marginBottom: 8 },
  statVal:   { ...Typography.valueBig, fontSize: 22 },

  /* Strategy rows */
  stratCard:  { flexDirection: 'row', alignItems: 'center', padding: Spacing.lg, marginBottom: 10 },
  assetBadge: { width: 48, height: 48, borderRadius: Radius.sm, backgroundColor: Colors.purpleDim, borderWidth: 1, borderColor: Colors.purpleBorder, alignItems: 'center', justifyContent: 'center', marginRight: 14 },
  assetText:  { color: Colors.purple, fontWeight: '800', fontSize: 11 },
  stratName:  { ...Typography.h3, fontSize: 14, marginBottom: 3 },
  stratPeriod:{ ...Typography.caption, textTransform: 'none', letterSpacing: 0, fontSize: 11 },
  roiText:    { fontSize: 20, fontWeight: '800', fontFamily: 'monospace' },
  valueText:  { fontSize: 12, color: Colors.muted, marginTop: 2, fontFamily: 'monospace' },

  /* Empty */
  empty:     { alignItems: 'center', paddingVertical: 40 },
  emptyIcon: { fontSize: 36, marginBottom: 12 },
  emptyText: { ...Typography.bodyS, color: Colors.muted, textAlign: 'center', lineHeight: 22 },

  /* CTA */
  ctaCard:    { padding: Spacing.xl, alignItems: 'center', marginTop: Spacing.xl },
  ctaQuote:   { ...Typography.bodyL, fontWeight: '700', textAlign: 'center', lineHeight: 26, marginBottom: Spacing.xl },
  ctaBtn:     { backgroundColor: Colors.purple, paddingHorizontal: 28, paddingVertical: 13, borderRadius: Radius.md },
  ctaBtnText: { color: Colors.white, fontWeight: '800', fontSize: 15, letterSpacing: -0.3 },
});
