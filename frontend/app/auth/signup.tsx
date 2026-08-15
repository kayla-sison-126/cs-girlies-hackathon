import React, { useState } from 'react';
import {
  StyleSheet,
  Text,
  View,
  TextInput,
  TouchableOpacity,
  SafeAreaView,
  KeyboardAvoidingView,
  Platform,
  ActivityIndicator,
  Alert,
  ScrollView,
} from 'react-native';
import { useRouter, Stack } from 'expo-router';
import { Ionicons } from '@expo/vector-icons';

export default function SignUpScreen() {
  const router = useRouter();

  const [displayName, setDisplayName] = useState('');
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [showPassword, setShowPassword] = useState(false);
  const [loading, setLoading] = useState(false);

  const handleSignUp = async () => {
    if (!displayName.trim() || !email.trim() || !password.trim()) {
      Alert.alert('Missing Fields', 'Please fill in all required fields.');
      return;
    }

    if (password.length < 6) {
      Alert.alert('Weak Password', 'Password must be at least 6 characters long.');
      return;
    }

    setLoading(true);

    try {
      // TODO: Replace with Supabase Auth call:
      // const { data, error } = await supabase.auth.signUp({
      //   email,
      //   password,
      //   options: { data: { display_name: displayName } },
      // });
      // if (error) throw error;

      // Mock delay
      setTimeout(() => {
        setLoading(false);
        Alert.alert('Account Created!', 'Welcome to the app!', [
          { text: 'Let\'s Go', onPress: () => router.replace('/(tabs)') },
        ]);
      }, 1000);
    } catch (err: any) {
      setLoading(false);
      Alert.alert('Sign Up Failed', err.message || 'Something went wrong.');
    }
  };

  return (
    <SafeAreaView style={styles.container}>
      <Stack.Screen options={{ headerShown: false }} />

      <KeyboardAvoidingView
        behavior={Platform.OS === 'ios' ? 'padding' : 'height'}
        style={styles.innerContainer}
      >
        <ScrollView
          contentContainerStyle={styles.scrollContent}
          showsVerticalScrollIndicator={false}
        >
          {/* HEADER SECTION */}
          <View style={styles.headerSection}>
            <TouchableOpacity
              style={styles.backBtn}
              onPress={() => router.back()}
              activeOpacity={0.7}
            >
              <Ionicons name="arrow-back" size={24} color="#2D3436" />
            </TouchableOpacity>

            <View style={styles.logoBadge}>
              <Text style={styles.logoEmoji}>✨</Text>
            </View>
            <Text style={styles.title}>Create Account</Text>
            <Text style={styles.subtitle}>
              Join your friends and start holding each other accountable.
            </Text>
          </View>

          {/* FORM SECTION */}
          <View style={styles.form}>
            <View style={styles.inputContainer}>
              <Ionicons name="person-outline" size={20} color="#636E72" style={styles.inputIcon} />
              <TextInput
                style={styles.input}
                placeholder="Full Name / Display Name"
                placeholderTextColor="#B2BEC3"
                value={displayName}
                onChangeText={setDisplayName}
              />
            </View>

            <View style={styles.inputContainer}>
              <Ionicons name="mail-outline" size={20} color="#636E72" style={styles.inputIcon} />
              <TextInput
                style={styles.input}
                placeholder="Email address"
                placeholderTextColor="#B2BEC3"
                value={email}
                onChangeText={setEmail}
                keyboardType="email-address"
                autoCapitalize="none"
                autoCorrect={false}
              />
            </View>

            <View style={styles.inputContainer}>
              <Ionicons name="lock-closed-outline" size={20} color="#636E72" style={styles.inputIcon} />
              <TextInput
                style={styles.input}
                placeholder="Password (min. 6 chars)"
                placeholderTextColor="#B2BEC3"
                value={password}
                onChangeText={setPassword}
                secureTextEntry={!showPassword}
                autoCapitalize="none"
              />
              <TouchableOpacity
                onPress={() => setShowPassword(!showPassword)}
                style={styles.eyeIcon}
              >
                <Ionicons
                  name={showPassword ? 'eye-off-outline' : 'eye-outline'}
                  size={20}
                  color="#636E72"
                />
              </TouchableOpacity>
            </View>

            <TouchableOpacity
              style={styles.primaryBtn}
              onPress={handleSignUp}
              disabled={loading}
              activeOpacity={0.8}
            >
              {loading ? (
                <ActivityIndicator color="#FFFFFF" />
              ) : (
                <Text style={styles.primaryBtnText}>Sign Up</Text>
              )}
            </TouchableOpacity>
          </View>

          {/* FOOTER */}
          <View style={styles.footer}>
            <Text style={styles.footerText}>Already have an account? </Text>
            <TouchableOpacity onPress={() => router.push('/auth/login')}>
              <Text style={styles.linkText}>Log In</Text>
            </TouchableOpacity>
          </View>
        </ScrollView>
      </KeyboardAvoidingView>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#F8F9FA',
  },
  innerContainer: {
    flex: 1,
  },
  scrollContent: {
    paddingHorizontal: 24,
    paddingVertical: 20,
    justifyContent: 'center',
    flexGrow: 1,
  },
  headerSection: {
    alignItems: 'center',
    marginBottom: 28,
    position: 'relative',
  },
  backBtn: {
    position: 'absolute',
    left: 0,
    top: 0,
    width: 40,
    height: 40,
    justifyContent: 'center',
  },
  logoBadge: {
    width: 72,
    height: 72,
    borderRadius: 36,
    backgroundColor: '#EDEAFF',
    justifyContent: 'center',
    alignItems: 'center',
    marginBottom: 16,
    marginTop: 12,
  },
  logoEmoji: {
    fontSize: 36,
  },
  title: {
    fontSize: 26,
    fontWeight: '800',
    color: '#2D3436',
    marginBottom: 8,
  },
  subtitle: {
    fontSize: 14,
    color: '#636E72',
    textAlign: 'center',
    paddingHorizontal: 16,
    lineHeight: 20,
  },
  form: {
    gap: 16,
  },
  inputContainer: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: '#FFFFFF',
    borderRadius: 12,
    paddingHorizontal: 14,
    height: 52,
    borderWidth: 1,
    borderColor: '#DFE6E9',
  },
  inputIcon: {
    marginRight: 10,
  },
  input: {
    flex: 1,
    fontSize: 15,
    color: '#2D3436',
  },
  eyeIcon: {
    padding: 6,
  },
  primaryBtn: {
    backgroundColor: '#6C5CE7',
    height: 52,
    borderRadius: 12,
    justifyContent: 'center',
    alignItems: 'center',
    marginTop: 12,
    shadowColor: '#6C5CE7',
    shadowOpacity: 0.3,
    shadowRadius: 6,
    elevation: 3,
  },
  primaryBtnText: {
    color: '#FFFFFF',
    fontSize: 16,
    fontWeight: '700',
  },
  footer: {
    flexDirection: 'row',
    justifyContent: 'center',
    marginTop: 28,
  },
  footerText: {
    color: '#636E72',
    fontSize: 14,
  },
  linkText: {
    color: '#6C5CE7',
    fontSize: 14,
    fontWeight: '700',
  },
});