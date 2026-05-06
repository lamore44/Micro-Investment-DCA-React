import React, { useState } from 'react';
import {
  View,
  Text,
  StyleSheet,
  ScrollView,
  TouchableOpacity,
  KeyboardAvoidingView,
  Platform,
} from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { Colors, Typography, Spacing, Radius } from '../../theme';
import { LogoBadge } from '../../components/common/LogoBadge';
import { TextInput }  from '../../components/common/TextInput';
import { Button }     from '../../components/common/Button';
import { Divider }    from '../../components/common/Divider';
import { Badge }      from '../../components/common/Badge';

interface Props {
  navigation: any;
}

export const LoginScreen: React.FC<Props> = ({ navigation }) => {
  const [email,    setEmail]    = useState('');
  const [password, setPassword] = useState('');
  const [loading,  setLoading]  = useState(false);
  const [error,    setError]    = useState('');

  const handleLogin = () => {
    setError('');
    if (!email || !password) {
      setError('Please fill in all fields.');
      return;
    }
    setLoading(true);
    // Mock auth delay
    setTimeout(() => {
      setLoading(false);
      navigation.replace('Main');
    }, 1200);
  };

  return (
    <SafeAreaView style={styles.safe}>
      <KeyboardAvoidingView
        style={styles.kav}
        behavior={Platform.OS === 'ios' ? 'padding' : 'height'}
      >
        <ScrollView
          contentContainerStyle={styles.scroll}
          keyboardShouldPersistTaps="handled"
          showsVerticalScrollIndicator={false}
        >
          {/* Logo row */}
          <View style={styles.logoRow}>
            <LogoBadge size={44} fontSize={18} />
            <Text style={styles.appName}>
              Micro<Text style={styles.appNamePurple}>DCA</Text>
            </Text>
          </View>

          {/* Title */}
          <Text style={styles.title}>Welcome{'\n'}Back.</Text>
          <Text style={styles.subtitle}>Sign in to your MicroDCA account</Text>

          {/* Fields */}
          <View style={styles.fields}>
            <TextInput
              label="EMAIL"
              placeholder="you@example.com"
              value={email}
              onChangeText={setEmail}
              keyboardType="email-address"
              autoCapitalize="none"
              autoComplete="email"
            />
            <TextInput
              label="PASSWORD"
              placeholder="••••••••"
              value={password}
              onChangeText={setPassword}
              isPassword
              autoComplete="password"
            />
            {error ? <Text style={styles.error}>{error}</Text> : null}
          </View>

          <Button
            label="Login"
            onPress={handleLogin}
            loading={loading}
            style={styles.btn}
          />

          <Divider style={styles.divider} />

          <TouchableOpacity
            style={styles.switchRow}
            onPress={() => navigation.navigate('Register')}
            hitSlop={{ top: 8, bottom: 8, left: 16, right: 16 }}
          >
            <Text style={styles.switchText}>
              Don't have an account?{' '}
              <Text style={styles.switchLink}>Register</Text>
            </Text>
          </TouchableOpacity>

          <Badge
            label="🔒  Simulation Only · No Real Money"
            style={styles.badge}
          />
        </ScrollView>
      </KeyboardAvoidingView>
    </SafeAreaView>
  );
};

const styles = StyleSheet.create({
  safe: {
    flex: 1,
    backgroundColor: Colors.bgPrimary,
  },
  kav: { flex: 1 },
  scroll: {
    flexGrow: 1,
    paddingHorizontal: Spacing.xxl,
    paddingTop: Spacing.xxxl,
    paddingBottom: Spacing.xxxl,
  },

  logoRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 10,
    marginBottom: Spacing.xxxl + 8,
  },
  appName: {
    ...Typography.h2,
    fontSize: 20,
  },
  appNamePurple: {
    color: Colors.purple,
  },

  title: {
    ...Typography.displayL,
    lineHeight: 36,
    marginBottom: 10,
  },
  subtitle: {
    ...Typography.bodyS,
    color: Colors.muted,
    marginBottom: Spacing.xxxl,
  },

  fields: {
    marginBottom: 4,
  },
  error: {
    ...Typography.caption,
    color: Colors.red,
    letterSpacing: 0,
    textTransform: 'none',
    fontSize: 13,
    marginBottom: Spacing.md,
  },

  btn: {
    marginTop: Spacing.md,
  },

  divider: {
    marginVertical: Spacing.xxl,
  },

  switchRow: {
    alignItems: 'center',
    marginBottom: Spacing.xxl,
  },
  switchText: {
    ...Typography.bodyS,
    color: Colors.muted,
  },
  switchLink: {
    color: Colors.purple,
    fontWeight: '700',
  },

  badge: {
    alignSelf: 'center',
  },
});
