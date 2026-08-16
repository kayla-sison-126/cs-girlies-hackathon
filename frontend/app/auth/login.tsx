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
  Image,
  Dimensions,
} from 'react-native';
import { useRouter, Stack } from 'expo-router';
import { Ionicons } from '@expo/vector-icons';
import { supabase } from '../../lib/supabase';
import { useFonts } from 'expo-font';
import { LinearGradient } from 'expo-linear-gradient';
import { StatusBar } from 'expo-status-bar';

const { width: SCREEN_WIDTH } = Dimensions.get('window');
const ASPECT_RATIO = 708 / 1034; // image dimensions

export default function LoginScreen() {
  const router = useRouter();

  const [fontsLoaded] = useFonts({
    Itim: require('../../assets/fonts/Itim.ttf'),
  });

  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [showPassword, setShowPassword] = useState(false);
  const [loading, setLoading] = useState(false);

  const handleLogin = async () => {
    if (!email.trim() || !password.trim()) {
      Alert.alert('Missing Fields', 'Please enter both email and password.');
      return;
    }

    setLoading(true);

    try {
      const { error } = await supabase.auth.signInWithPassword({
        email: email.trim(),
        password,
      });

      if (error) {
        throw error;
      }

      router.replace('/(tabs)');
    } catch (err: any) {
      Alert.alert(
        'Login Failed',
        err.message || 'Check your email and password.'
      );
    } finally {
      setLoading(false);
    }
  };

  

  if (!fontsLoaded) {
    return (
      <View style={{ flex: 1, justifyContent: 'center', alignItems: 'center' }}>
        <ActivityIndicator size="large" />
      </View>
    );
  }

  return (
    <LinearGradient
      colors={['#CEE1EF', '#E1EEF6']}
      style={styles.container}
    >
      <StatusBar hidden />
      <SafeAreaView style={{ flex: 1 }}>
        <Stack.Screen options={{ headerShown: false }} />

        <KeyboardAvoidingView
          behavior={Platform.OS === 'ios' ? 'padding' : 'height'}
          style={styles.innerContainer}
        >
          <View style={styles.headerSection}>
            <Image
              source={require('../../assets/images/GoatTogetherTitle.png')}
              style={styles.heroImage}
              resizeMode="contain"
              accessible={true}
              accessibilityLabel="Goat Together title"
            />
          </View>

          <View style={styles.cardWrap}>
            <Text style={styles.loginTitle}>Log In</Text>

            <View style={styles.card}>

            <View style={styles.field}>
              <Text style={styles.inputLabel}>Email</Text>
              <View style={styles.roundedInputWrap}>
                <TextInput
                  style={styles.roundedInput}
                  placeholder="Email"
                  placeholderTextColor="#CEB59F"
                  value={email}
                  onChangeText={setEmail}
                  autoCapitalize="none"
                  autoCorrect={false}
                />
              </View>
            </View>

            <View style={styles.field}>
              <View style={styles.labelRow}>
                <Text style={styles.inputLabel}>Password</Text>
                <TouchableOpacity style={styles.forgotBtn}>
                  <Text style={styles.forgotText}>Forgot Password?</Text>
                </TouchableOpacity>
              </View>
              <View style={styles.roundedInputWrap}>
                <TextInput
                  style={styles.roundedInput}
                  placeholder="Password"
                  placeholderTextColor="#CEB59F"
                  value={password}
                  onChangeText={setPassword}
                  secureTextEntry={!showPassword}
                  autoCapitalize="none"
                />
                <TouchableOpacity
                  onPress={() => setShowPassword(!showPassword)}
                  style={styles.eyeBtn}
                  activeOpacity={0.7}
                >
                  <Ionicons
                    name={showPassword ? 'eye-off-outline' : 'eye-outline'}
                    size={18}
                    color="#8A5E4B"
                  />
                </TouchableOpacity>
              </View>
            </View>

            <TouchableOpacity
              style={styles.primaryBtn}
              onPress={handleLogin}
              disabled={loading}
              activeOpacity={0.8}
            >
              {loading ? (
                <ActivityIndicator color="#FEF9F0" />
              ) : (
                <Text style={styles.primaryBtnText}>Log In</Text>
              )}
            </TouchableOpacity>
          </View>
          </View>

          <View style={styles.footerRow}>
            <Text style={styles.footerText}>Don't have an account yet? </Text>
            <TouchableOpacity onPress={() => router.push('/auth/signup')}>
              <Text style={styles.linkText}>Sign Up</Text>
            </TouchableOpacity>
          </View>
        </KeyboardAvoidingView>
        <Image
          source={require('../../assets/images/auth/GoatsAndHills.png')}
          style={styles.hills}
          accessible={false}
        />
      </SafeAreaView>
    </LinearGradient>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#DFF2FB',
  },
  innerContainer: {
    flex: 1,
    paddingHorizontal: 22,
    paddingTop: 28,
    paddingBottom: 150,
    zIndex: 2,
  },
  headerSection: {
    alignItems: 'center',
    marginBottom: 10,
  },
  heroImage: {
    width: SCREEN_WIDTH * 0.72,
    height: (SCREEN_WIDTH * 0.72) * 0.38,
    maxWidth: 320,
    maxHeight: 110,
  },
  card: {
    width: '100%',
    alignSelf: 'stretch',
    backgroundColor: '#FDF5E6',
    borderRadius: 32,
    borderWidth: 8,
    borderColor: '#C7967D',
    padding: 16,
    marginTop: 10,
    shadowColor: '#8a6b59',
    shadowOffset: { width: 6, height: 6 },
    shadowOpacity: 0.2,
    shadowRadius: 6,
  },
  cardLabel: {
    color: '#824A20',
    fontWeight: '700',
    fontSize: 20,
    fontFamily: 'Itim',
    marginBottom: 12,
  },
  cardWrap: {
    width: '100%',
    marginTop: 4,
    alignItems: 'flex-start',
    zIndex: 2,
  },
  loginTitle: {
    alignSelf: 'flex-start',
    marginLeft: 0,
    marginBottom: -4,
    paddingHorizontal: 8,
    paddingVertical: 4,
    color: '#824A20',
    fontSize: 22,
    fontFamily: 'Itim',
    fontWeight: '700',
  },
  field: {
    marginBottom: 16,
  },
  inputLabel: {
    color: '#824A20',
    fontWeight: '700',
    fontSize: 16,
    fontFamily: 'Itim',
    marginBottom: 6,
  },
  labelRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'baseline',
    marginBottom: 6,
    width: '100%',
  },
  roundedInputWrap: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: '#FEF9F0',
    borderRadius: 22,
    borderWidth: 4.5,
    borderColor: '#C7967D',
    paddingHorizontal: 12,
    paddingVertical: 6,
    width: '100%',
    alignSelf: 'stretch',
    shadowColor: '#8a6b59',
    shadowOffset: { width: 6, height: 6 },
    shadowOpacity: 0.2,
    shadowRadius: 6,
  },
  roundedInput: {
    flex: 1,
    height: 40,
    fontSize: 15,
    color: '#824A20',
    fontFamily: 'Itim',
  },
  eyeBtn: {
    paddingLeft: 8,
    paddingRight: 4,
  },
  forgotBtn: {
    marginLeft: 12,
  },
  forgotText: {
    fontSize: 13,
    color: '#D5BCA5',
    fontFamily: 'Itim',
  },
  primaryBtn: {
    marginTop: 6,
    alignSelf: 'flex-start',
    backgroundColor: '#729AB5',
    borderRadius: 20,
    paddingVertical: 10,
    paddingHorizontal: 26,
    alignItems: 'center',
    justifyContent: 'center',
    shadowColor: '#356072',
    shadowOffset: { width: 0, height: 6 },
    shadowOpacity: 0.18,
    shadowRadius: 6,
  },
  primaryBtnText: {
    color: '#FEF9F0',
    fontWeight: '700',
    fontSize: 18,
    fontFamily: 'Itim',
  },
  footerRow: {
    flexDirection: 'row',
    justifyContent: 'center',
    marginTop: 12,
    marginBottom: 24,
    zIndex: 2,
  },
  footerText: {
    fontSize: 14,
    color: '#824A20',
    fontFamily: 'Itim',
  },
  linkText: {
    color: '#824A20',
    fontWeight: '700',
    textDecorationLine: 'underline',
    marginLeft: 4,
    fontFamily: 'Itim',
  },
  hills: {
  position: 'absolute',
  left: 0,
  right: 0,
  bottom: 0,
  width: SCREEN_WIDTH,
  height: SCREEN_WIDTH * ASPECT_RATIO, // Automatically scales height proportionally
  resizeMode: 'contain',
  zIndex: 0,
},
});
 
