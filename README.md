# MicroDCA — React Native App

> A mobile app to simulate, backtest, and project Dollar Cost Averaging (DCA) investment strategies using real historical cryptocurrency market data — without risking any real money.

---

## 🚀 Quick Start

### Prerequisites

| Tool | Version |
|------|---------|
| Node.js | ≥ 18 |
| Java JDK | **17** (21 not supported) |
| Android Studio | Hedgehog or newer |
| Android SDK | CMake 3.22.1 installed via SDK Manager |
| React Native CLI | latest |

### Environment Variables

Copy `.env.example` → `.env` and fill:

```env
SUPABASE_URL=https://xxxxxxxxxxxx.supabase.co
SUPABASE_ANON_KEY=eyJhbGciOi...
```

### Install dependencies

```bash
npm install
```

### Supabase Setup (one-time)

1. Create project at [supabase.com](https://supabase.com)
2. Copy URL + anon key to `.env`
3. Run `supabase_setup.sql` in Supabase SQL Editor
4. Enable Auth providers: Email → ON

### Android — Online Mode (Metro dev server)

```bash
# Terminal 1: Start Metro
npm start

# Terminal 2: Build & install
npm run android
```

### Android — Offline Mode (embedded bundle, no Metro)

Use when USB/WiFi debugging is unreliable. Bundle is embedded in APK — no network needed.

```bash
# One command: bundle → build → install
npm run offline

# Or step-by-step:
npm run bundle-offline   # Generate index.android.bundle
npm run build-android     # Compile APK
npm run install-apk       # Install to device
```

| Script | What it does |
|--------|-------------|
| `npm run offline` | Full pipeline: bundle + build + install |
| `npm run bundle-offline` | Generate offline JS bundle in `android/app/src/main/assets/` |
| `npm run build-android` | Run Gradle `assembleDebug` |
| `npm run install-apk` | ADB install last built APK |
| `npm run start-fresh` | Metro with `--reset-cache` |

### iOS

```bash
cd ios && pod install && cd ..
npm run ios
```

---

## 📁 Project Structure

```
MicroDCA/
├── App.tsx                              # Root component (wraps AuthProvider)
├── index.js                             # RN entry point
├── .env                                 # Supabase keys (gitignored)
├── .env.example                         # Template for .env
├── supabase_setup.sql                   # Full DB schema + RLS + triggers
├── supabase/
│   └── functions/
│       └── fetch-price-cache/           # Edge Function (Bybit proxy cache)
├── coverage/
│   ├── progress.md                      # Aril task tracker
│   └── material/                        # Sprint planning
├── .github/workflows/ci.yml             # CI/CD pipeline
├── babel.config.js                      # Babel + module-resolver + dotenv
├── android/                             # Native Android project
│   ├── local.properties                 # sdk.dir (gitignored)
│   └── app/src/main/
│       ├── AndroidManifest.xml
│       ├── assets/                      # Offline bundle target
│       └── java/com/oksobatsister/microdca/
│           ├── MainActivity.kt
│           └── MainApplication.kt
└── src/
    ├── navigation/
    │   └── AppNavigator.tsx             # Stack + Tab navigator (auth-aware)
    ├── screens/
    │   ├── Auth/
    │   │   ├── SplashScreen.tsx
    │   │   ├── LoginScreen.tsx          # Supabase signIn
    │   │   └── RegisterScreen.tsx       # Supabase signUp
    │   ├── Home/    HomeScreen.tsx
    │   ├── Builder/ BuilderScreen.tsx
    │   ├── Backtest/ BacktestScreen.tsx
    │   ├── MonteCarlo/ MonteCarloScreen.tsx
    │   ├── Portfolio/ PortfolioScreen.tsx
    │   └── Debug/    DataLayerTestScreen.tsx
    ├── components/
    │   ├── common/ (Button, Card, MetricCard, TextInput, Badge, ...)
    │   └── charts/ (AreaChartView, MCChartView)
    ├── hooks/
    │   ├── useAuth.tsx                  # AuthContext: session, signIn, signUp, signOut
    │   ├── useStrategies.ts
    │   └── useSimulation.ts
    ├── services/
    │   ├── api/
    │   │   ├── bybitApi.ts             # Bybit v5 kline endpoint
    │   │   ├── supabase.ts             # Supabase client (AsyncStorage session)
    │   │   └── types.ts                # CandleData, KlineInterval, etc.
    │   ├── cache/
    │   │   ├── cacheService.ts         # AsyncStorage TTL cache
    │   │   └── cacheKeys.ts            # Key generators
    │   └── marketRepository.ts         # Cache-first data layer
    ├── data/    mockData.ts
    ├── utils/   formatters.ts
    ├── types/   env.d.ts               # TS types for @env module
    └── theme/   (colors, typography, spacing)
```

---

## 🎨 Design System

| Token | Value |
|-------|-------|
| Background | `#050507` |
| Card | `#0E0E14` |
| Purple Primary | `#6C47FF` |
| Green (positive) | `#00E5A0` |
| Red (negative) | `#FF4757` |
| Violet accent | `#A78BFA` |
| Muted text | `#5C5C7A` |

---

## 📱 Screens

| Screen | Description |
|--------|-------------|
| **Splash** | Animated logo intro → auto-navigates to Login |
| **Login** | Email + password authentication form |
| **Register** | Full name, email, password registration |
| **Home** | Dashboard: hero card, quick stats, strategy list |
| **Builder** | Asset picker, amount, frequency, date range, MC months |
| **Backtest** | ROI metrics + portfolio growth + ROI-over-time charts |
| **Monte Carlo** | 500-path projection cone + outcome summary |
| **Portfolio** | Aggregate stats + ROI bar comparison + strategy table |

---

## 🔑 Key Libraries

| Library | Purpose |
|---------|---------|
| `@react-navigation/native` | Screen navigation |
| `@react-navigation/bottom-tabs` | Tab bar |
| `@react-navigation/stack` | Stack navigation |
| `@supabase/supabase-js` | Supabase Auth + DB + Realtime |
| `react-native-dotenv` | `.env` variable loading |
| `react-native-svg` | Custom SVG charts |
| `react-native-safe-area-context` | Safe area insets |
| `react-native-gesture-handler` | Gesture support |
| `react-native-reanimated` | Smooth animations |

---

## 🩺 Troubleshooting

| Symptom | Fix |
|---------|-----|
| `SDK location not found` | Create `android/local.properties` → `sdk.dir=C:\\Users\\...\\AppData\\Local\\Android\\Sdk` |
| `jlink.exe` error / JDK mismatch | Install **JDK 17** and set `JAVA_HOME` |
| `CMake 3.22.1` not found | Install via Android Studio → SDK Manager → SDK Tools → CMake |
| `debug.keystore` not found | Keystore auto-generated at `~/.android/debug.keystore` on first build |
| `Unable to load script` (online mode) | `adb reverse tcp:8081 tcp:8081` then reload app |
| Metro `Unexpected token` JSX in `.ts` | Rename file to `.tsx` + restart Metro with `--reset-cache` |
| Metro cache stale after rename | `rm -rf node_modules/.cache` then `npm run start-fresh` |
| Device still can't reach Metro | Use **offline mode** — `npm run offline` |
| `.env` variables not loading | Restart Metro with `--reset-cache` after changing `.env` |
| Supabase Auth `session` null | Check `.env` → `SUPABASE_URL` + `SUPABASE_ANON_KEY` are correct |

---

## 🗺️ Roadmap (Backend Integration)

### ✅ Done
- [x] Fetch real OHLCV data from Bybit API (`src/services/api/bybitApi.ts`)
- [x] Data cache layer with TTL (`src/services/cache/cacheService.ts`)
- [x] Market repository with offline-stale fallback (`src/services/marketRepository.ts`)
- [x] Supabase project setup + `supabase_setup.sql` (profiles, portfolios, strategies, backtest_results, mc_projections)
- [x] RLS enabled on all tables
- [x] Supabase Auth client integrated (`src/services/api/supabase.ts`)
- [x] AuthContext with `signIn` / `signUp` / `signOut` + session persistence (`src/hooks/useAuth.tsx`)
- [x] Auth-aware navigation (unauthenticated → AuthStack, authenticated → MainTabs)

### 🚧 In Progress / Next
- [ ] Real DCA backtest engine + Monte Carlo GBM (JS/TS — on-device)
- [ ] Store strategies & backtest results in Supabase PostgreSQL
- [ ] Implement sync with `react-native-background-fetch` + NetInfo listener
- [ ] Supabase Edge Function: `fetch-price-cache` (proxy Bybit API)
- [ ] Supabase Realtime for portfolio/strategy notifications
- [ ] PDF/CSV export via `react-native-fs` + `react-native-share`
- [ ] Push notifications via Firebase Cloud Messaging (FCM)

---

## ⚠️ Disclaimer

This app is a **simulation tool only**. All data displayed is for educational purposes. This is **not financial advice**. Never invest money you cannot afford to lose.

---

*Presented by: OkSobatSister — Mobile Programming, 28 April 2026*
