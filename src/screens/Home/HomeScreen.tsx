import React, { useMemo, useState, useCallback, useRef } from 'react';
import {
  View,
  Text,
  StyleSheet,
  ScrollView,
  TouchableOpacity,
  Pressable,
  Alert,
  Modal,
  Dimensions,
  ActivityIndicator,
} from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { Colors, Typography, Spacing, Radius } from '../../theme';
import { Card } from '../../components/common/Card';
import { SectionHeader } from '../../components/common/SectionHeader';
import { Button } from '../../components/common/Button';
import { useAuth } from '../../hooks/useAuth';
import { useStrategies } from '../../hooks/useStrategies';
import { useRealtime, type RealtimePayload } from '../../hooks/useRealtime';
import { Strategy, fmtUSD, fmtPct } from '../../data/mockData';

interface Props {
  navigation: any;
}

const StrategyRow: React.FC<{ item: Strategy; onPress: () => void }> = ({
  item,
  onPress,
}) => (
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
          {item.startDate.slice(0, 7)} → {item.endDate.slice(0, 7)}
        </Text>
      </View>
      <View style={{ alignItems: 'flex-end' }}>
        <Text
          style={[
            S.roiText,
            { color: item.roi >= 0 ? Colors.green : Colors.red },
          ]}
        >
          {fmtPct(item.roi)}
        </Text>
        <Text style={S.valueText}>{fmtUSD(item.finalValue)}</Text>
      </View>
    </Card>
  </TouchableOpacity>
);

export const HomeScreen: React.FC<Props> = ({ navigation }) => {
  const {
    strategies,
    totalValue,
    totalInvested,
    bestRoi,
    loading: strategiesLoading,
    error: strategiesError,
    refresh: refreshStrategies,
  } = useStrategies();
  const [notification, setNotification] = useState<string | null>(null);
  const [showAccountMenu, setShowAccountMenu] = useState(false);
  const [menuAnchor, setMenuAnchor] = useState<{
    top: number;
    right: number;
  } | null>(null);
  const avatarRef = useRef<null | {
    measureInWindow: (
      cb: (x: number, y: number, width: number, height: number) => void,
    ) => void;
  }>(null);
  const { user, signOut } = useAuth();
  const handleRealtimeEvent = useCallback(
    (payload: RealtimePayload) => {
      const asset = (payload.data as any)?.asset || 'Unknown';
      if (payload.event === 'INSERT') {
        setNotification(
          `📊 New ${payload.table === 'strategies' ? 'strategy' : 'backtest'}: ${asset}`,
        );
      } else if (payload.event === 'UPDATE') {
        setNotification(`🔄 ${asset} strategy updated`);
      }
      refreshStrategies();
      setTimeout(() => setNotification(null), 5000);
    },
    [refreshStrategies],
  );

  const { isConnected } = useRealtime({
    onStrategyChange: handleRealtimeEvent,
    onBacktestComplete: handleRealtimeEvent,
  });

  const overallRoi =
    totalInvested > 0
      ? ((totalValue - totalInvested) / totalInvested) * 100
      : 0;

  const displayName = useMemo(() => {
    const meta = user?.user_metadata as Record<string, unknown> | undefined;
    const fullName =
      typeof meta?.full_name === 'string' ? meta.full_name : undefined;
    const name = typeof meta?.name === 'string' ? meta.name : undefined;
    const emailName = user?.email?.split('@')[0];
    return (fullName || name || emailName || 'User').trim();
  }, [user]);

  const avatarInitial = useMemo(() => {
    const first = displayName.replace(/\s+/g, '').charAt(0);
    return first ? first.toUpperCase() : 'U';
  }, [displayName]);

  const handleLogout = async () => {
    setShowAccountMenu(false);
    try {
      await signOut();
    } catch (error) {
      const message =
        error instanceof Error
          ? error.message
          : 'Logout failed. Please try again.';
      Alert.alert('Logout failed', message);
    }
  };

  const confirmLogout = () => {
    Alert.alert('Logout', 'Are you sure you want to logout?', [
      {
        text: 'Cancel',
        style: 'cancel',
        onPress: () => setShowAccountMenu(false),
      },
      { text: 'Logout', style: 'destructive', onPress: handleLogout },
    ]);
  };

  const openAccountMenu = () => {
    if (!avatarRef.current?.measureInWindow) {
      setMenuAnchor({ top: Spacing.xl + 48, right: Spacing.xl });
      setShowAccountMenu(true);
      return;
    }

    avatarRef.current.measureInWindow((x, y, width, height) => {
      const windowWidth = Dimensions.get('window').width;
      const right = Math.max(Spacing.xl, windowWidth - (x + width));
      setMenuAnchor({ top: y + height + 8, right });
      setShowAccountMenu(true);
    });
  };

  const menuPosition = menuAnchor ?? {
    top: Spacing.xl + 48,
    right: Spacing.xl,
  };

  return (
    <SafeAreaView style={S.safe}>
      {/* ── Realtime notification banner ── */}
      {notification && (
        <View style={S.notifBanner}>
          <Text style={S.notifText}>{notification}</Text>
        </View>
      )}

      <ScrollView
        contentContainerStyle={S.content}
        showsVerticalScrollIndicator={false}
        onScrollBeginDrag={() => setShowAccountMenu(false)}
      >
        {/* ── Header ── */}
        <View style={S.header}>
          <View>
            <View
              style={{ flexDirection: 'row', alignItems: 'center', gap: 8 }}
            >
              <View
                style={[
                  S.dot,
                  { backgroundColor: isConnected ? Colors.green : Colors.red },
                ]}
              />
              <Text style={S.greeting}>Hello, {displayName} 👋</Text>
            </View>
            <Text style={S.greetSub}>Your DCA simulation hub</Text>
          </View>
          <View style={S.headerActions}>
            <TouchableOpacity
              ref={avatarRef}
              style={S.avatar}
              onPress={() =>
                showAccountMenu ? setShowAccountMenu(false) : openAccountMenu()
              }
              activeOpacity={0.75}
            >
              <Text style={S.avatarTxt}>{avatarInitial}</Text>
            </TouchableOpacity>
          </View>
        </View>

        {/* ── Hero card (purple) ── */}
        <View style={S.heroCard}>
          <Text style={S.heroTitle}>
            Simulate your{'\n'}investment strategy
          </Text>

          {/* Inner summary card */}
          <View style={S.heroInner}>
            <Text style={S.heroInnerTitle}>Portfolio Simulation</Text>
            <View style={S.heroMetrics}>
              {[
                { l: 'Total Invested', v: fmtUSD(totalInvested) },
                { l: 'Portfolio Value', v: fmtUSD(totalValue) },
                {
                  l: 'ROI',
                  v: strategies.length ? fmtPct(overallRoi) : '0.0%',
                  color: !strategies.length ? undefined : (overallRoi >= 0 ? Colors.green : Colors.red),
                },
              ].map(m => (
                <View key={m.l} style={{ flex: 1 }}>
                  <Text style={S.heroMetaLabel}>{m.l}</Text>
                  <Text
                    style={[
                      S.heroMetaValue,
                      m.color ? { color: m.color } : null,
                    ]}
                  >
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
            <Text style={S.statLabel}>📋 STRATEGIES</Text>
            <Text style={S.statVal}>{strategies.length}</Text>
          </Card>
          <Card style={[S.statCard, { marginLeft: 8 }]}>
            <Text style={S.statLabel}>🚀 BEST ROI</Text>
            <Text
              style={[
                S.statVal,
                {
                  color: !strategies.length
                    ? Colors.muted
                    : bestRoi >= 0
                    ? Colors.green
                    : Colors.red,
                },
              ]}
            >
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

        {strategiesError ? (
          <Text style={S.errorText}>{strategiesError}</Text>
        ) : null}

        {strategiesLoading ? (
          <View style={S.empty}>
            <ActivityIndicator color={Colors.purple} size="small" />
            <Text style={S.emptyText}>Loading strategies…</Text>
          </View>
        ) : strategies.length === 0 ? (
          <View style={S.empty}>
            <Text style={S.emptyIcon}>📂</Text>
            <Text style={S.emptyText}>
              No strategies yet.{'\n'}Tap Builder to create one.
            </Text>
          </View>
        ) : (
          strategies.map(item => (
            <StrategyRow
              key={item.id}
              item={item}
              onPress={() =>
                navigation.navigate('Backtest', { strategy: item })
              }
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

        {/* ── Dev: Data Layer Test ── */}
        <TouchableOpacity
          style={S.devTestBtn}
          onPress={() => navigation.navigate('DataLayerTest')}
          activeOpacity={0.7}
        >
          <Text style={S.devTestText}>🧪 Test Data Layer</Text>
        </TouchableOpacity>
      </ScrollView>

      <Modal
        transparent
        visible={showAccountMenu}
        animationType="fade"
        onRequestClose={() => setShowAccountMenu(false)}
      >
        <View style={S.modalRoot}>
          <Pressable
            style={S.overlay}
            onPress={() => setShowAccountMenu(false)}
          />
          <View
            style={[
              S.accountMenu,
              { top: menuPosition.top, right: menuPosition.right },
            ]}
          >
            <Button
              label="Logout"
              onPress={confirmLogout}
              variant="ghost"
              small
              style={S.accountBtn}
              textStyle={S.logoutText}
            />
          </View>
        </View>
      </Modal>
    </SafeAreaView>
  );
};

const S = StyleSheet.create({
  safe: { flex: 1, backgroundColor: Colors.bgPrimary },
  content: { paddingHorizontal: Spacing.xl, paddingBottom: 40 },

  /* Notification */
  notifBanner: {
    backgroundColor: Colors.purple,
    paddingVertical: 10,
    paddingHorizontal: Spacing.xl,
  },
  notifText: {
    ...Typography.bodyS,
    color: Colors.white,
    textAlign: 'center',
  },

  /* Header */
  header: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    paddingTop: Spacing.xl,
    marginBottom: Spacing.lg,
  },
  headerActions: { alignItems: 'flex-end', position: 'relative' },
  dot: { width: 8, height: 8, borderRadius: 4 },
  greeting: { ...Typography.h1, fontSize: 22 },
  greetSub: {
    ...Typography.caption,
    textTransform: 'none',
    letterSpacing: 0,
    color: Colors.muted,
    fontSize: 12,
    marginTop: 2,
  },
  avatar: {
    width: 40,
    height: 40,
    borderRadius: 20,
    backgroundColor: Colors.bgCard,
    borderWidth: 1,
    borderColor: Colors.border,
    alignItems: 'center',
    justifyContent: 'center',
  },
  avatarTxt: { color: Colors.muted, fontWeight: '700' },
  modalRoot: { flex: 1 },
  overlay: {
    ...StyleSheet.absoluteFillObject,
    backgroundColor: 'transparent',
  },
  accountMenu: {
    position: 'absolute',
    top: 48,
    right: 0,
    backgroundColor: Colors.bgCard,
    borderWidth: 1,
    borderColor: Colors.border,
    borderRadius: Radius.md,
    padding: 6,
    minWidth: 120,
    shadowColor: Colors.black,
    shadowOpacity: 0.35,
    shadowRadius: 12,
    shadowOffset: { width: 0, height: 6 },
    elevation: 10,
    zIndex: 10,
  },
  accountBtn: { paddingHorizontal: 8 },
  logoutText: { color: Colors.red },

  /* Hero */
  heroCard: {
    backgroundColor: Colors.purple,
    borderRadius: Radius.lg,
    padding: Spacing.xl,
    marginBottom: Spacing.lg,
    shadowColor: Colors.purple,
    shadowOffset: { width: 0, height: 6 },
    shadowOpacity: 0.35,
    shadowRadius: 16,
    elevation: 8,
  },
  heroTitle: {
    ...Typography.h2,
    color: Colors.white,
    marginBottom: Spacing.lg,
  },
  heroInner: {
    backgroundColor: Colors.white,
    borderRadius: Radius.md,
    padding: Spacing.lg,
  },
  heroInnerTitle: {
    fontSize: 14,
    fontWeight: '700',
    color: Colors.black,
    marginBottom: 12,
  },
  heroMetrics: { flexDirection: 'row' },
  heroMetaLabel: { fontSize: 11, color: Colors.muted, marginBottom: 4 },
  heroMetaValue: {
    fontSize: 17,
    fontWeight: '800',
    color: Colors.black,
    fontFamily: 'monospace',
  },

  /* Stats */
  statsRow: { flexDirection: 'row', marginBottom: Spacing.sm },
  statCard: { flex: 1, padding: Spacing.lg },
  statLabel: { ...Typography.label, fontSize: 10, marginBottom: 8 },
  statVal: { ...Typography.valueBig, fontSize: 22 },

  /* Strategy rows */
  stratCard: {
    flexDirection: 'row',
    alignItems: 'center',
    padding: Spacing.lg,
    marginBottom: 10,
  },
  assetBadge: {
    width: 48,
    height: 48,
    borderRadius: Radius.sm,
    backgroundColor: Colors.purpleDim,
    borderWidth: 1,
    borderColor: Colors.purpleBorder,
    alignItems: 'center',
    justifyContent: 'center',
    marginRight: 14,
  },
  assetText: { color: Colors.purple, fontWeight: '800', fontSize: 11 },
  stratName: { ...Typography.h3, fontSize: 14, marginBottom: 3 },
  stratPeriod: {
    ...Typography.caption,
    textTransform: 'none',
    letterSpacing: 0,
    fontSize: 11,
  },
  roiText: { fontSize: 20, fontWeight: '800', fontFamily: 'monospace' },
  valueText: {
    fontSize: 12,
    color: Colors.muted,
    marginTop: 2,
    fontFamily: 'monospace',
  },

  /* Empty */
  empty: { alignItems: 'center', paddingVertical: 40 },
  emptyIcon: { fontSize: 36, marginBottom: 12 },
  emptyText: {
    ...Typography.bodyS,
    color: Colors.muted,
    textAlign: 'center',
    lineHeight: 22,
  },
  errorText: {
    ...Typography.bodyS,
    color: Colors.red,
    textAlign: 'center',
    marginTop: 8,
  },

  /* CTA */
  ctaCard: { padding: Spacing.xl, alignItems: 'center', marginTop: Spacing.xl },
  ctaQuote: {
    ...Typography.bodyL,
    fontWeight: '700',
    textAlign: 'center',
    lineHeight: 26,
    marginBottom: Spacing.xl,
  },
  ctaBtn: {
    backgroundColor: Colors.purple,
    paddingHorizontal: 28,
    paddingVertical: 13,
    borderRadius: Radius.md,
  },
  ctaBtnText: {
    color: Colors.white,
    fontWeight: '800',
    fontSize: 15,
    letterSpacing: -0.3,
  },

  /* Dev test button */
  devTestBtn: {
    marginTop: Spacing.xl,
    marginBottom: 20,
    paddingVertical: 14,
    borderRadius: Radius.md,
    borderWidth: 1,
    borderColor: '#374151',
    borderStyle: 'dashed',
    alignItems: 'center',
    backgroundColor: 'rgba(108, 92, 231, 0.08)',
  },
  devTestText: { color: '#8B949E', fontSize: 14, fontWeight: '600' },
});
