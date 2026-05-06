import React, { useState } from 'react';
import {
  View, Text, StyleSheet, ScrollView,
  TouchableOpacity, Alert,
} from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { Colors, Typography, Spacing, Radius } from '../../theme';
import { Card }          from '../../components/common/Card';
import { MetricCard }    from '../../components/common/MetricCard';
import { SectionHeader } from '../../components/common/SectionHeader';
import { Divider }       from '../../components/common/Divider';
import { MOCK_STRATEGIES, Strategy, fmtUSD, fmtPct } from '../../data/mockData';

interface Props { navigation: any; }

export const PortfolioScreen: React.FC<Props> = ({ navigation }) => {
  const [strategies, setStrategies] = useState<Strategy[]>(MOCK_STRATEGIES);

  const totalValue    = strategies.reduce((s, x) => s + x.finalValue,    0);
  const totalInvested = strategies.reduce((s, x) => s + x.totalInvested, 0);
  const avgRoi        = strategies.length
    ? strategies.reduce((s, x) => s + x.roi, 0) / strategies.length
    : 0;
  const winners  = strategies.filter(s => s.roi >= 0).length;
  const maxBarRoi = Math.max(...strategies.map(s => Math.abs(s.roi)), 1);

  const handleDelete = (id: string) => {
    Alert.alert(
      'Delete Strategy',
      'Are you sure you want to remove this strategy?',
      [
        { text: 'Cancel', style: 'cancel' },
        {
          text: 'Delete',
          style: 'destructive',
          onPress: () => setStrategies(prev => prev.filter(s => s.id !== id)),
        },
      ],
    );
  };

  return (
    <SafeAreaView style={styles.safe}>
      <ScrollView
        contentContainerStyle={styles.content}
        showsVerticalScrollIndicator={false}
      >
        {/* ── Header ── */}
        <Text style={styles.title}>Virtual Portfolio</Text>
        <Text style={styles.subtitle}>Aggregate view of all saved strategies</Text>

        {/* ── Summary metrics ── */}
        <View style={styles.metricsRow}>
          <MetricCard icon="📋" label="Total Strategies" value={`${strategies.length}`} flex={1} />
          <View style={{ width: 10 }} />
          <MetricCard
            icon="💰"
            label="Total Value"
            value={fmtUSD(totalValue)}
            valueColor={Colors.green}
            flex={1}
          />
        </View>
        <View style={[styles.metricsRow, { marginTop: 10 }]}>
          <MetricCard
            icon="📈"
            label="Avg ROI"
            value={fmtPct(avgRoi)}
            valueColor={avgRoi >= 0 ? Colors.green : Colors.red}
            flex={1}
          />
          <View style={{ width: 10 }} />
          <MetricCard
            icon="✅"
            label="Winners"
            value={`${winners}/${strategies.length}`}
            valueColor={Colors.green}
            flex={1}
          />
        </View>

        {/* ── ROI comparison bars ── */}
        {strategies.length > 0 && (
          <Card style={styles.barCard}>
            <Text style={styles.sectionLabel}>STRATEGY COMPARISON — ROI %</Text>
            {strategies.map(s => {
              const isPos  = s.roi >= 0;
              const barW   = (Math.abs(s.roi) / maxBarRoi) * 100;
              return (
                <View key={s.id} style={styles.barItem}>
                  <Text style={styles.barLabel} numberOfLines={1}>
                    {s.asset} {s.frequency}
                  </Text>
                  <View style={styles.barTrack}>
                    <View
                      style={[
                        styles.barFill,
                        {
                          width: `${barW}%`,
                          backgroundColor: isPos ? Colors.green : Colors.red,
                        },
                      ]}
                    />
                  </View>
                  <Text
                    style={[
                      styles.barValue,
                      { color: isPos ? Colors.green : Colors.red },
                    ]}
                  >
                    {fmtPct(s.roi)}
                  </Text>
                </View>
              );
            })}
          </Card>
        )}

        {/* ── All Strategies table ── */}
        <SectionHeader
          title="All Strategies"
          style={{ marginTop: Spacing.xl }}
        />

        {strategies.length === 0 ? (
          <View style={styles.empty}>
            <Text style={styles.emptyText}>No strategies saved yet.</Text>
          </View>
        ) : (
          <Card style={styles.tableCard}>
            {/* Table header */}
            <View style={styles.tableHeader}>
              <Text style={[styles.thCell, { flex: 2 }]}>ASSET</Text>
              <Text style={[styles.thCell, { flex: 1, textAlign: 'center' }]}>AMT</Text>
              <Text style={[styles.thCell, { flex: 1.4, textAlign: 'right' }]}>VALUE</Text>
              <Text style={[styles.thCell, { flex: 1.2, textAlign: 'right' }]}>ROI</Text>
              <Text style={[styles.thCell, { width: 36 }]}>{' '}</Text>
            </View>
            <Divider />
            {strategies.map((s, idx) => {
              const isPos = s.roi >= 0;
              return (
                <React.Fragment key={s.id}>
                  <TouchableOpacity
                    style={styles.tableRow}
                    onPress={() => navigation.navigate('Backtest', { strategy: s })}
                    activeOpacity={0.7}
                  >
                    {/* Asset */}
                    <View style={[styles.tdCell, { flex: 2, flexDirection: 'row', alignItems: 'center', gap: 8 }]}>
                      <View style={styles.assetMini}>
                        <Text style={styles.assetMiniText}>{s.asset}</Text>
                      </View>
                      <View>
                        <Text style={styles.tdName}>{s.asset}/USDT</Text>
                        <Text style={styles.tdSub}>{s.frequency}</Text>
                      </View>
                    </View>

                    {/* Amount */}
                    <Text style={[styles.tdMono, { flex: 1, textAlign: 'center' }]}>
                      ${s.amount}
                    </Text>

                    {/* Final Value */}
                    <Text style={[styles.tdMono, { flex: 1.4, textAlign: 'right' }]}>
                      {fmtUSD(s.finalValue)}
                    </Text>

                    {/* ROI */}
                    <Text style={[
                      styles.tdMono,
                      { flex: 1.2, textAlign: 'right', color: isPos ? Colors.green : Colors.red },
                    ]}>
                      {fmtPct(s.roi)}
                    </Text>

                    {/* Delete */}
                    <TouchableOpacity
                      style={styles.deleteBtn}
                      onPress={() => handleDelete(s.id)}
                      hitSlop={{ top: 8, bottom: 8, left: 8, right: 8 }}
                    >
                      <Text style={styles.deleteIcon}>🗑</Text>
                    </TouchableOpacity>
                  </TouchableOpacity>
                  {idx < strategies.length - 1 && <Divider />}
                </React.Fragment>
              );
            })}
          </Card>
        )}

      </ScrollView>
    </SafeAreaView>
  );
};

const styles = StyleSheet.create({
  safe:     { flex: 1, backgroundColor: Colors.bgPrimary },
  content:  { paddingHorizontal: Spacing.xl, paddingBottom: Spacing.xxxl },

  title:    { ...Typography.h1, marginTop: Spacing.xl, marginBottom: 4 },
  subtitle: { ...Typography.bodyS, color: Colors.muted, marginBottom: Spacing.lg },

  metricsRow: { flexDirection: 'row' },

  /* Bar chart */
  barCard: { padding: Spacing.xl, marginTop: Spacing.lg },
  sectionLabel: { ...Typography.label, marginBottom: Spacing.lg },
  barItem: {
    flexDirection: 'row',
    alignItems: 'center',
    marginBottom: 12,
    gap: 8,
  },
  barLabel: {
    ...Typography.caption,
    textTransform: 'none',
    letterSpacing: 0,
    fontSize: 11,
    width: 72,
  },
  barTrack: {
    flex: 1,
    height: 8,
    backgroundColor: Colors.bgPrimary,
    borderRadius: 4,
    overflow: 'hidden',
  },
  barFill:  { height: '100%', borderRadius: 4 },
  barValue: {
    ...Typography.valueS,
    fontSize: 12,
    width: 56,
    textAlign: 'right',
  },

  /* Table */
  tableCard:   { overflow: 'hidden' },
  tableHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingHorizontal: Spacing.lg,
    paddingVertical: 10,
    backgroundColor: Colors.bgCardElevated,
  },
  thCell: {
    ...Typography.label,
    fontSize: 10,
  },
  tableRow: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingHorizontal: Spacing.lg,
    paddingVertical: 14,
  },
  tdCell: {},
  assetMini: {
    width: 32, height: 32,
    borderRadius: 6,
    backgroundColor: Colors.purpleDim,
    borderWidth: 1,
    borderColor: Colors.purpleBorder,
    alignItems: 'center',
    justifyContent: 'center',
  },
  assetMiniText: { color: Colors.purple, fontSize: 9, fontWeight: '800' },
  tdName: { ...Typography.body, fontSize: 13, fontWeight: '600', marginBottom: 2 },
  tdSub:  { ...Typography.caption, textTransform: 'none', letterSpacing: 0, fontSize: 11 },
  tdMono: { ...Typography.valueS, fontSize: 13 },
  deleteBtn: { width: 36, alignItems: 'center' },
  deleteIcon: { fontSize: 14 },

  /* Empty */
  empty: { alignItems: 'center', paddingVertical: Spacing.xxxl },
  emptyText: { ...Typography.bodyS, color: Colors.muted, textAlign: 'center' },
});
