import React, { useState, useCallback } from 'react';
import {
  View,
  Text,
  StyleSheet,
  ScrollView,
  TouchableOpacity,
  TextInput as RNInput,
  ActivityIndicator,
} from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import DatePicker from 'react-native-date-picker';
import { Colors, Typography, Spacing, Radius } from '../../theme';
import { Card } from '../../components/common/Card';
import { useSimulation } from '../../hooks/useSimulation';
import {
  ASSETS,
  Asset,
  Frequency,
  QUICK_PRESETS,
  fmtUSD,
} from '../../data/mockData';

interface Props {
  navigation: any;
}

type AmountPreset = 10 | 25 | 50 | 100 | 250 | 500;
const AMOUNT_PRESETS: AmountPreset[] = [10, 25, 50, 100, 250, 500];
const MC_MONTHS_LIST = [6, 12, 24, 36, 60] as const;
const PERIOD_YEARS = [1, 2, 3, 5] as const;
type PeriodYears = (typeof PERIOD_YEARS)[number];

const formatDate = (date: Date): string => {
  const year = date.getFullYear();
  const month = String(date.getMonth() + 1).padStart(2, '0');
  const day = String(date.getDate()).padStart(2, '0');
  return `${year}-${month}-${day}`;
};

const parseDate = (value: string): Date => {
  const [year, month, day] = value.split('-').map(Number);
  return new Date(year, (month ?? 1) - 1, day ?? 1);
};

const addYears = (date: Date, years: number): Date => {
  const next = new Date(date);
  next.setFullYear(next.getFullYear() + years);
  return next;
};

function ChipPicker<T extends string | number>({
  items,
  selected,
  onSelect,
  labelOf,
  fullWidth = false,
}: {
  items: readonly T[];
  selected: T | null;
  onSelect: (v: T) => void;
  labelOf?: (v: T) => string;
  fullWidth?: boolean;
}) {
  return (
    <View style={[S.chipRow, fullWidth && S.chipRowFull]}>
      {items.map(item => {
        const active = selected === item;
        return (
          <TouchableOpacity
            key={String(item)}
            style={[S.chip, fullWidth && S.chipFlex, active && S.chipActive]}
            onPress={() => onSelect(item)}
            activeOpacity={0.75}
          >
            <Text style={[S.chipText, active && S.chipTextActive]}>
              {labelOf ? labelOf(item) : String(item)}
            </Text>
          </TouchableOpacity>
        );
      })}
    </View>
  );
}

export const BuilderScreen: React.FC<Props> = ({ navigation }) => {
  const [asset, setAsset] = useState<Asset>('BTC');
  const [amount, setAmount] = useState<AmountPreset | null>(50);
  const [customAmt, setCustomAmt] = useState('');
  const [frequency, setFrequency] = useState<Frequency>('weekly');
  const [startDate, setStartDate] = useState(() => formatDate(new Date()));
  const [periodYears, setPeriodYears] = useState<PeriodYears | null>(2);
  const [startPickerOpen, setStartPickerOpen] = useState(false);
  const [mcMonths, setMcMonths] = useState<number>(24);
  const { run, loading } = useSimulation();
  const todayStr = formatDate(new Date());
  const endDate = todayStr;

  const effectiveAmount = customAmt ? Number(customAmt) : (amount ?? 50);
  const freqDays = frequency === 'daily' ? 1 : frequency === 'weekly' ? 7 : 30;
  const daysDiff = Math.max(
    0,
    (new Date(endDate).getTime() - new Date(startDate).getTime()) / 86_400_000,
  );
  const steps = Math.ceil(daysDiff / freqDays);
  const estimatedTotal = effectiveAmount * steps;

  const applyPreset = useCallback((p: (typeof QUICK_PRESETS)[0]) => {
    setAsset(p.asset);
    setAmount(p.amount as AmountPreset);
    setCustomAmt('');
    setFrequency(p.frequency);
    setStartDate(p.startDate);
    setPeriodYears(null);
  }, []);

  const applyStartDate = useCallback(
    (date: Date) => {
      const today = parseDate(todayStr);
      const safeDate = date > today ? today : date;
      setStartDate(formatDate(safeDate));
      setPeriodYears(null);
    },
    [todayStr],
  );

  const handleRun = async () => {
    const res = await run({
      asset,
      amount: effectiveAmount,
      frequency,
      startDate,
      endDate,
      mcMonths,
    });
    if (res)
      navigation.navigate('Backtest', {
        strategy: res.strategy,
        chartData: res.chartData,
        mcData: res.mcData,
        mcMonths,
      });
  };

  return (
    <SafeAreaView style={S.safe}>
      <ScrollView
        contentContainerStyle={S.content}
        showsVerticalScrollIndicator={false}
        keyboardShouldPersistTaps="handled"
      >
        <Text style={S.title}>Strategy Builder</Text>
        <Text style={S.sub}>Define your DCA parameters and run a backtest</Text>

        {/* Asset */}
        <Card style={S.section}>
          <Text style={S.label}>SELECT ASSET</Text>
          <ChipPicker items={ASSETS} selected={asset} onSelect={setAsset} />
        </Card>

        {/* Amount */}
        <Card style={S.section}>
          <Text style={S.label}>INVESTMENT AMOUNT (USD)</Text>
          <ChipPicker
            items={AMOUNT_PRESETS}
            selected={customAmt ? null : amount}
            onSelect={v => {
              setAmount(v);
              setCustomAmt('');
            }}
            labelOf={v => `$${v}`}
          />
          <View style={S.amtRow}>
            <Text style={S.prefix}>$</Text>
            <RNInput
              style={S.amtInput}
              placeholder="Custom…"
              placeholderTextColor={Colors.muted}
              keyboardType="decimal-pad"
              value={customAmt}
              onChangeText={t => {
                setCustomAmt(t);
                setAmount(null);
              }}
              selectionColor={Colors.purple}
            />
          </View>
        </Card>

        {/* Frequency */}
        <Card style={S.section}>
          <Text style={S.label}>FREQUENCY</Text>
          <ChipPicker
            items={['daily', 'weekly', 'monthly'] as Frequency[]}
            selected={frequency}
            onSelect={setFrequency}
            labelOf={f => f.charAt(0).toUpperCase() + f.slice(1)}
            fullWidth
          />
        </Card>

        {/* Date range */}
        <Card style={S.section}>
          <Text style={S.label}>DATE RANGE</Text>
          <View style={S.dateRow}>
            <View style={S.dateHalf}>
              <Text style={S.dateLbl}>START</Text>
              <TouchableOpacity
                style={S.dateBtn}
                onPress={() => setStartPickerOpen(true)}
                activeOpacity={0.7}
              >
                <Text style={S.dateBtnText}>{startDate}</Text>
              </TouchableOpacity>
            </View>
            <Text style={S.dateArrow}>→</Text>
            <View style={S.dateHalf}>
              <Text style={S.dateLbl}>END</Text>
              <View style={[S.dateBtn, S.dateBtnDisabled]}>
                <Text style={S.dateBtnText}>{endDate}</Text>
              </View>
            </View>
          </View>
          <View style={S.periodRow}>
            {PERIOD_YEARS.map(years => {
              const active = periodYears === years;
              return (
                <TouchableOpacity
                  key={`${years}Y`}
                  style={[S.periodChip, active && S.periodChipActive]}
                  onPress={() => {
                    setPeriodYears(years);
                    setStartDate(
                      formatDate(addYears(parseDate(todayStr), -years)),
                    );
                  }}
                  activeOpacity={0.7}
                >
                  <Text style={[S.periodText, active && S.periodTextActive]}>
                    {years}Y
                  </Text>
                </TouchableOpacity>
              );
            })}
          </View>
        </Card>

        {/* MC months */}
        <Card style={S.section}>
          <Text style={S.label}>MONTE CARLO PROJECTION (MONTHS)</Text>
          <ChipPicker
            items={MC_MONTHS_LIST}
            selected={mcMonths}
            onSelect={setMcMonths}
            labelOf={v => `${v}m`}
          />
        </Card>

        {/* Estimated total */}
        <View style={S.estCard}>
          <Text style={S.label}>ESTIMATED TOTAL INVESTED</Text>
          <Text style={S.estValue}>{fmtUSD(estimatedTotal)}</Text>
          <Text style={S.estSub}>
            {steps} purchases × ${effectiveAmount}
          </Text>
        </View>

        {/* Quick presets */}
        <Card style={S.section}>
          <Text style={S.label}>QUICK PRESETS</Text>
          {QUICK_PRESETS.map((p, i) => (
            <TouchableOpacity
              key={i}
              style={[
                S.presetRow,
                i < QUICK_PRESETS.length - 1 && S.presetBorder,
              ]}
              onPress={() => applyPreset(p)}
              activeOpacity={0.7}
            >
              <View style={S.presetBadge}>
                <Text style={S.presetBadgeText}>{p.asset}</Text>
              </View>
              <View style={{ flex: 1 }}>
                <Text style={S.presetTitle}>{p.label}</Text>
                <Text style={S.presetMeta}>
                  ${p.amount}/{p.frequency} · {p.startDate.slice(0, 7)} →{' '}
                  {todayStr.slice(0, 7)}
                </Text>
              </View>
              <Text style={S.presetChev}>›</Text>
            </TouchableOpacity>
          ))}
        </Card>

        {/* Run button */}
        <TouchableOpacity
          style={[S.runBtn, loading && { opacity: 0.7 }]}
          onPress={handleRun}
          disabled={loading}
          activeOpacity={0.85}
        >
          {loading ? (
            <View
              style={{ flexDirection: 'row', alignItems: 'center', gap: 10 }}
            >
              <ActivityIndicator color={Colors.white} size="small" />
              <Text style={S.runText}>Running Simulation…</Text>
            </View>
          ) : (
            <Text style={S.runText}>▶ Run Backtest Simulation</Text>
          )}
        </TouchableOpacity>
      </ScrollView>
      <DatePicker
        modal
        mode="date"
        open={startPickerOpen}
        date={parseDate(startDate)}
        maximumDate={parseDate(todayStr)}
        onConfirm={date => {
          setStartPickerOpen(false);
          applyStartDate(date);
        }}
        onCancel={() => setStartPickerOpen(false)}
      />
    </SafeAreaView>
  );
};

const S = StyleSheet.create({
  safe: { flex: 1, backgroundColor: Colors.bgPrimary },
  content: { paddingHorizontal: Spacing.xl, paddingBottom: 48 },
  title: { ...Typography.h1, marginTop: Spacing.xl, marginBottom: 4 },
  sub: { ...Typography.bodyS, color: Colors.muted, marginBottom: Spacing.lg },
  section: { padding: Spacing.xl, marginBottom: 12 },
  label: { ...Typography.label, marginBottom: Spacing.md },

  chipRow: { flexDirection: 'row', flexWrap: 'wrap', gap: 8 },
  chipRowFull: { flexWrap: 'nowrap' },
  chip: {
    paddingHorizontal: 14,
    paddingVertical: 9,
    borderRadius: Radius.sm,
    borderWidth: 1,
    borderColor: Colors.border,
  },
  chipFlex: { flex: 1, alignItems: 'center' },
  chipActive: { backgroundColor: Colors.purpleDim, borderColor: Colors.purple },
  chipText: {
    ...Typography.bodyS,
    color: Colors.muted,
    fontWeight: '600',
    fontSize: 13,
  },
  chipTextActive: { color: Colors.purple, fontWeight: '700' },

  amtRow: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: Colors.bgPrimary,
    borderWidth: 1,
    borderColor: Colors.border,
    borderRadius: Radius.sm,
    paddingHorizontal: Spacing.md,
    height: 48,
    marginTop: Spacing.md,
  },
  prefix: { color: Colors.muted, fontSize: 14, marginRight: 4 },
  amtInput: { flex: 1, color: Colors.textPrimary, fontSize: 14, padding: 0 },

  dateRow: { flexDirection: 'row', alignItems: 'center', gap: 10 },
  dateHalf: { flex: 1 },
  dateLbl: { ...Typography.caption, letterSpacing: 0.6, marginBottom: 6 },
  dateArrow: { color: Colors.muted, fontSize: 16, marginTop: 20 },
  dateBtn: {
    borderWidth: 1,
    borderColor: Colors.border,
    borderRadius: Radius.sm,
    paddingVertical: 11,
    paddingHorizontal: 12,
    alignItems: 'center',
  },
  dateBtnDisabled: { backgroundColor: Colors.bgCardElevated },
  dateBtnText: {
    color: Colors.textPrimary,
    fontSize: 13,
    fontFamily: 'monospace',
  },

  periodRow: { flexDirection: 'row', gap: 8, marginTop: Spacing.md },
  periodChip: {
    flex: 1,
    alignItems: 'center',
    paddingVertical: 7,
    borderRadius: Radius.xs,
    borderWidth: 1,
    borderColor: Colors.border,
  },
  periodChipActive: {
    backgroundColor: Colors.purpleDim,
    borderColor: Colors.purple,
  },
  periodText: { fontSize: 12, color: Colors.muted, fontWeight: '600' },
  periodTextActive: { color: Colors.purple, fontWeight: '700' },

  estCard: {
    backgroundColor: Colors.purpleDim,
    borderWidth: 1,
    borderColor: Colors.purpleBorder,
    borderRadius: Radius.md,
    padding: Spacing.xl,
    marginBottom: 12,
  },
  estValue: {
    ...Typography.valueBig,
    color: Colors.violet,
    fontSize: 30,
    marginTop: 4,
  },
  estSub: {
    ...Typography.caption,
    textTransform: 'none',
    letterSpacing: 0,
    fontSize: 11,
    marginTop: 4,
  },

  presetRow: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingVertical: 14,
    gap: 12,
  },
  presetBorder: { borderBottomWidth: 1, borderBottomColor: Colors.border },
  presetBadge: {
    width: 38,
    height: 38,
    borderRadius: 8,
    backgroundColor: Colors.purpleDim,
    borderWidth: 1,
    borderColor: Colors.purpleBorder,
    alignItems: 'center',
    justifyContent: 'center',
  },
  presetBadgeText: { color: Colors.purple, fontSize: 9, fontWeight: '800' },
  presetTitle: { ...Typography.body, fontWeight: '600', marginBottom: 2 },
  presetMeta: {
    ...Typography.caption,
    textTransform: 'none',
    letterSpacing: 0,
    fontSize: 11,
  },
  presetChev: { color: Colors.muted, fontSize: 22 },

  runBtn: {
    backgroundColor: Colors.purple,
    borderRadius: Radius.md,
    paddingVertical: 18,
    alignItems: 'center',
    marginTop: Spacing.md,
    shadowColor: Colors.purple,
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.4,
    shadowRadius: 12,
    elevation: 6,
  },
  runText: {
    color: Colors.white,
    fontWeight: '800',
    fontSize: 16,
    letterSpacing: -0.3,
  },
});
