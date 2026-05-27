// Polyfills — required by Hermes engine
import 'react-native-url-polyfill/auto';  // URL (Supabase)
import 'text-encoding';                   // TextEncoder (pdfmake)

import { AppRegistry } from 'react-native';
import App from './App';
import { name as appName } from './app.json';

AppRegistry.registerComponent(appName, () => App);
