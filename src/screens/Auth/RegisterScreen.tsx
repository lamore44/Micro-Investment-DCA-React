import React, { useState } from 'react';
import {
  View, Text, StyleSheet, ScrollView,
  TouchableOpacity, KeyboardAvoidingView, Platform,
} from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { Colors, Typography, Spacing } from '../../theme';
import { LogoBadge }  from '../../components/common/LogoBadge';
import { TextInput }  from '../../components/common/TextInput';
import { Button }     from '../../components/common/Button';
import { Divider }    from '../../components/common/Divider';

interface Props { navigation: any; }

export const RegisterScreen: React.FC<Props> = ({ navigation }) => {
  const [name,    setName]    = useState('');
  const [email,   setEmail]   = useState('');
  const [pw,      setPw]      = useState('');
  const [pwConf,  setPwConf]  = useState('');
  const [loading, setLoading] = useState(false);
  const [error,   setError]   = useState('');

  const handleRegister = () => {
    setError('');
    if (!name || !email || !pw || !pwConf) {
      setError('Please fill in all fields.');
      return;
    }
    if (pw !== pwConf) {
      setError('Passwords do not match.');
      return;
    }
    if (pw.length < 8) {
      setError('Password must be at least 8 characters.');
      return;
    }
    setLoading(true);
    setTimeout(() => {
      setLoading(false);
      navigation.replace('Main');
    }, 1400);
  };

  return (
    <SafeAreaView style={styles.safe}>
      <KeyboardAvoidingView
        style={{ flex: 1 }}
        behavior={Platform.OS === 'ios' ? 'padding' : 'height'}
      >
        <ScrollView
          contentContainerStyle={styles.scroll}
          keyboardShouldPersistTaps="handled"
          showsVerticalScrollIndicator={false}
        >
          {/* Logo */}
          <View style={styles.logoRow}>
            <LogoBadge size={44} fontSize={18} />
            <Text style={styles.appName}>
              Micro<Text style={{ color: Colors.purple }}>DCA</Text>
            </Text>
          </View>

          <Text style={styles.title}>Create{'\n'}Account.</Text>
          <Text style={styles.subtitle}>Start simulating DCA strategies</Text>

          <View style={styles.fields}>
            <TextInput
              label="FULL NAME"
              placeholder="Your full name"
              value={name}
              onChangeText={setName}
              autoCapitalize="words"
            />
            <TextInput
              label="EMAIL"
              placeholder="you@example.com"
              value={email}
              onChangeText={setEmail}
              keyboardType="email-address"
              autoCapitalize="none"
            />
            <TextInput
              label="PASSWORD"
              placeholder="Min. 8 characters"
              value={pw}
              onChangeText={setPw}
              isPassword
            />
            <TextInput
              label="CONFIRM PASSWORD"
              placeholder="Repeat password"
              value={pwConf}
              onChangeText={setPwConf}
              isPassword
            />
            {error ? <Text style={styles.error}>{error}</Text> : null}
          </View>

          <Button
            label="Create Account"
            onPress={handleRegister}
            loading={loading}
            style={styles.btn}
          />

          <Divider style={styles.divider} />

          <TouchableOpacity
            style={styles.switchRow}
            onPress={() => navigation.goBack()}
          >
            <Text style={styles.switchText}>
              Already have an account?{' '}
              <Text style={styles.switchLink}>Login</Text>
            </Text>
          </TouchableOpacity>
        </ScrollView>
      </KeyboardAvoidingView>
    </SafeAreaView>
  );
};

const styles = StyleSheet.create({
  safe:    { flex: 1, backgroundColor: Colors.bgPrimary },
  scroll:  { flexGrow: 1, paddingHorizontal: Spacing.xxl, paddingTop: Spacing.xxxl, paddingBottom: Spacing.xxxl },
  logoRow: { flexDirection: 'row', alignItems: 'center', gap: 10, marginBottom: Spacing.xxxl + 8 },
  appName: { ...Typography.h2, fontSize: 20 },
  title:   { ...Typography.displayL, lineHeight: 36, marginBottom: 10 },
  subtitle:{ ...Typography.bodyS, color: Colors.muted, marginBottom: Spacing.xxxl },
  fields:  { marginBottom: 4 },
  error:   { color: Colors.red, fontSize: 13, marginBottom: Spacing.md },
  btn:     { marginTop: Spacing.md },
  divider: { marginVertical: Spacing.xxl },
  switchRow: { alignItems: 'center' },
  switchText:{ ...Typography.bodyS, color: Colors.muted },
  switchLink:{ color: Colors.purple, fontWeight: '700' },
});
