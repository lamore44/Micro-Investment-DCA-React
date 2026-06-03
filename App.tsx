import React, { useEffect } from 'react';
import { StatusBar, LogBox, PermissionsAndroid, Platform } from 'react-native';
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
  useEffect(() => {
    const requestAppPermissions = async () => {
      if (Platform.OS === 'android') {
        try {
          const permissions = [
            PermissionsAndroid.PERMISSIONS.ACCESS_FINE_LOCATION,
          ];

          // Android 13+ (API 33+) requires runtime permission for notifications
          if (Number(Platform.Version) >= 33) {
            permissions.push(PermissionsAndroid.PERMISSIONS.POST_NOTIFICATIONS);
          }

          await PermissionsAndroid.requestMultiple(permissions);
        } catch (err) {
          console.warn(err);
        }
      }
    };

    requestAppPermissions();
  }, []);

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
