# MicroDCA — React Native App

> A mobile app to simulate, backtest, and project Dollar Cost Averaging (DCA) investment strategies using real historical cryptocurrency market data — without risking any real money.

---

## 🚀 Quick Start

### Prerequisites

| Tool | Version |
|------|---------|
| Node.js | ≥ 18 |
| Java JDK | 17 |
| Android Studio | Hedgehog or newer |
| React Native CLI | latest |

### Install dependencies

```bash
npm install
```

### Android (via Android Studio or CLI)

```bash
# Start Metro bundler
npm start

# In a second terminal:
npm run android
```

### iOS

```bash
cd ios && pod install && cd ..
npm run ios
```

---

## 📁 Project Structure

```
MicroDCA/
├── App.tsx                        # Root component
├── index.js                       # RN entry point
├── android/                       # Native Android project
│   └── app/src/main/
│       ├── AndroidManifest.xml
│       └── java/com/oksobatsister/microdca/
│           ├── MainActivity.kt
│           └── MainApplication.kt
└── src/
    ├── navigation/
    │   └── AppNavigator.tsx       # Stack + Tab navigator
    ├── screens/
    │   ├── Auth/
    │   │   ├── SplashScreen.tsx
    │   │   ├── LoginScreen.tsx
    │   │   └── RegisterScreen.tsx
    │   ├── Home/
    │   │   └── HomeScreen.tsx
    │   ├── Builder/
    │   │   └── BuilderScreen.tsx
    │   ├── Backtest/
    │   │   └── BacktestScreen.tsx
    │   ├── MonteCarlo/
    │   │   └── MonteCarloScreen.tsx
    │   └── Portfolio/
    │       └── PortfolioScreen.tsx
    ├── components/
    │   ├── common/
    │   │   ├── Button.tsx
    │   │   ├── Card.tsx
    │   │   ├── MetricCard.tsx
    │   │   ├── TextInput.tsx
    │   │   ├── Badge.tsx
    │   │   ├── Divider.tsx
    │   │   ├── LogoBadge.tsx
    │   │   └── SectionHeader.tsx
    │   └── charts/
    │       ├── AreaChartView.tsx  # Custom SVG area chart
    │       └── MCChartView.tsx    # Monte Carlo band chart
    ├── hooks/
    │   ├── useStrategies.ts       # Strategy state management
    │   └── useSimulation.ts       # Simulation runner
    ├── data/
    │   └── mockData.ts            # Mock strategies + generators
    ├── utils/
    │   └── formatters.ts          # USD, %, coin formatters
    └── theme/
        ├── colors.ts
        ├── typography.ts
        ├── spacing.ts
        └── index.ts
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
| `react-native-svg` | Custom SVG charts |
| `react-native-safe-area-context` | Safe area insets |
| `react-native-gesture-handler` | Gesture support |
| `react-native-reanimated` | Smooth animations |

---

## 🗺️ Roadmap (Backend Integration)

- [ ] Connect Supabase Auth (replace mock login)
- [ ] Fetch real OHLCV data from Bybit API
- [ ] Store strategies in PostgreSQL via Supabase
- [ ] Real DCA backtest engine (Kotlin coroutines or JS)
- [ ] Real Monte Carlo with proper GBM
- [ ] PDF/CSV export via Supabase Edge Functions
- [ ] Push notifications for portfolio alerts
- [ ] Offline-first sync with Room DB

---

## ⚠️ Disclaimer

This app is a **simulation tool only**. All data displayed is for educational purposes. This is **not financial advice**. Never invest money you cannot afford to lose.

---

*Presented by: OkSobatSister — Mobile Programming, 28 April 2026*
