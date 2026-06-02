import React from 'react';
import { StatusBar, LogBox } from 'react-native';
import { GestureHandlerRootView } from 'react-native-gesture-handler';
import { SafeAreaProvider } from 'react-native-safe-area-context';
import { AppNavigator } from './src/navigation/AppNavigator';
import { AuthProvider } from './src/hooks/useAuth';
import { StrategiesProvider } from './src/hooks/useStrategies';
import { NotificationProvider } from './src/hooks/useNotification';
import { Colors } from './src/theme';

// Suppress known noisy warnings during development
LogBox.ignoreLogs([
  'Non-serializable values were found in the navigation state',
  'ViewPropTypes will be removed',
]);

const App: React.FC = () => {
  return (
    <GestureHandlerRootView style={{ flex: 1 }}>
      <SafeAreaProvider>
        <StatusBar
          barStyle="light-content"
          backgroundColor={Colors.bgPrimary}
          translucent={false}
        />
        <AuthProvider>
          <StrategiesProvider>
            <NotificationProvider>
              <AppNavigator />
            </NotificationProvider>
          </StrategiesProvider>
        </AuthProvider>
      </SafeAreaProvider>
    </GestureHandlerRootView>
  );
};

export default App;
