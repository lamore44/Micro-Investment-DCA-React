import React from 'react';
import { View, Text, StyleSheet, Platform } from 'react-native';
import { NavigationContainer }       from '@react-navigation/native';
import { createStackNavigator }      from '@react-navigation/stack';
import { createBottomTabNavigator }  from '@react-navigation/bottom-tabs';

import { Colors } from '../theme';

import { SplashScreen }      from '../screens/Auth/SplashScreen';
import { LoginScreen }       from '../screens/Auth/LoginScreen';
import { RegisterScreen }    from '../screens/Auth/RegisterScreen';
import { HomeScreen }        from '../screens/Home/HomeScreen';
import { BuilderScreen }     from '../screens/Builder/BuilderScreen';
import { BacktestScreen }    from '../screens/Backtest/BacktestScreen';
import { MonteCarloScreen }  from '../screens/MonteCarlo/MonteCarloScreen';
import { PortfolioScreen }   from '../screens/Portfolio/PortfolioScreen';

const AuthStack = createStackNavigator();
const Tab       = createBottomTabNavigator();
const RootStack = createStackNavigator();

type TabIconProps = { focused: boolean; emoji: string; label: string };
const TabIcon: React.FC<TabIconProps> = ({ focused, emoji, label }) => (
  <View style={tabStyles.wrap}>
    <Text style={[tabStyles.emoji, !focused && tabStyles.emojiDim]}>{emoji}</Text>
    <Text style={[tabStyles.label, focused && tabStyles.labelActive]}>{label}</Text>
    {focused && <View style={tabStyles.indicator} />}
  </View>
);

const tabStyles = StyleSheet.create({
  wrap:          { alignItems: 'center', justifyContent: 'center', paddingTop: 8, width: 60, position: 'relative' },
  emoji:         { fontSize: 20 },
  emojiDim:      { opacity: 0.4 },
  label:         { fontSize: 10, color: Colors.muted, fontWeight: '500', marginTop: 3 },
  labelActive:   { color: Colors.purple, fontWeight: '700' },
  indicator:     { position: 'absolute', bottom: -8, width: 4, height: 4, borderRadius: 2, backgroundColor: Colors.purple },
});

const MainTabs: React.FC = () => (
  <Tab.Navigator
    screenOptions={{
      headerShown: false,
      tabBarStyle: {
        backgroundColor: Colors.bgPrimary,
        borderTopColor:  Colors.border,
        borderTopWidth:  1,
        height:          Platform.OS === 'ios' ? 84 : 68,
        paddingBottom:   Platform.OS === 'ios' ? 16 : 4,
        paddingTop: 0,
      },
      tabBarShowLabel: false,
    }}
  >
    <Tab.Screen name="Home"      component={HomeScreen}      options={{ tabBarIcon: ({ focused }) => <TabIcon focused={focused} emoji="🏠" label="Home" /> }} />
    <Tab.Screen name="Builder"   component={BuilderScreen}   options={{ tabBarIcon: ({ focused }) => <TabIcon focused={focused} emoji="⚙️" label="Builder" /> }} />
    <Tab.Screen name="Portfolio" component={PortfolioScreen} options={{ tabBarIcon: ({ focused }) => <TabIcon focused={focused} emoji="💼" label="Portfolio" /> }} />
  </Tab.Navigator>
);

const AuthNavigator: React.FC = () => (
  <AuthStack.Navigator initialRouteName="Splash" screenOptions={{ headerShown: false, cardStyle: { backgroundColor: Colors.bgPrimary } }}>
    <AuthStack.Screen name="Splash"   component={SplashScreen}   />
    <AuthStack.Screen name="Login"    component={LoginScreen}    />
    <AuthStack.Screen name="Register" component={RegisterScreen} />
  </AuthStack.Navigator>
);

const HEADER_OPTS = {
  headerShown:        true,
  headerStyle:        { backgroundColor: Colors.bgPrimary },
  headerTintColor:    Colors.textPrimary,
  headerTitleStyle:   { fontWeight: '700' as const, fontSize: 17 },
  headerBackTitleVisible: false,
  headerShadowVisible: false,
};

export const AppNavigator: React.FC = () => (
  <NavigationContainer
    theme={{
      dark: true,
      colors: {
        primary:      Colors.purple,
        background:   Colors.bgPrimary,
        card:         Colors.bgCard,
        text:         Colors.textPrimary,
        border:       Colors.border,
        notification: Colors.purple,
      },
    }}
  >
    <RootStack.Navigator screenOptions={{ headerShown: false, cardStyle: { backgroundColor: Colors.bgPrimary } }}>
      <RootStack.Screen name="Auth" component={AuthNavigator} options={{ animationTypeForReplace: 'pop' }} />
      <RootStack.Screen name="Main" component={MainTabs}      options={{ animationTypeForReplace: 'push' }} />
      <RootStack.Screen name="Backtest"   component={BacktestScreen}   options={{ ...HEADER_OPTS, headerTitle: 'Backtest Results' }} />
      <RootStack.Screen name="MonteCarlo" component={MonteCarloScreen} options={{ ...HEADER_OPTS, headerTitle: 'Monte Carlo Forecast' }} />
    </RootStack.Navigator>
  </NavigationContainer>
);
