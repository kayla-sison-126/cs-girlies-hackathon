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

export default function SignUpScreen() {
  const router = useRouter();

  const [fontsLoaded] = useFonts({
    Itim: require('../../assets/fonts/Itim.ttf'),
  });

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
      const { data, error } = await supabase.auth.signUp({
        email: email.trim(),
        password,
        options: {
          data: {
            username: displayName.trim(),
          },
        },
      });

      if (error) {
        throw error;
      }

      if (!data.user) {
        throw new Error('Account could not be created.');
      }

      Alert.alert('Account Created!', 'Welcome to the app!', [
        {
          text: "Let's Go",
          onPress: () => router.replace('/(tabs)'),
        },
      ]);
    } catch (err: any) {
      Alert.alert('Sign Up Failed', err.message || 'Something went wrong.');
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
    <LinearGradient colors={['#CEE1EF', '#E1EEF6']} style={styles.container}>
      <StatusBar hidden />
      <SafeAreaView style={{ flex: 1 }}>
        <Stack.Screen options={{ headerShown: false }} />

        <KeyboardAvoidingView
          behavior={Platform.OS === 'ios' ? 'padding' : 'height'}
          style={styles.innerContainer}
        >
          <ScrollView
            contentContainerStyle={styles.scrollContent}
            showsVerticalScrollIndicator={false}
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
              <Text style={styles.loginTitle}>Sign Up</Text>

              {/* <View style={styles.card}> */}
                <View style={styles.card}>
                <View style={styles.field}>
                  <Text style={styles.inputLabel}>Username</Text>
                  <View style={styles.roundedInputWrap}>
                    <TextInput
                      style={styles.roundedInput}
                      placeholder="Username"
                      placeholderTextColor="#CEB59F"
                      value={displayName}
                      onChangeText={setDisplayName}
                      autoCapitalize="none"
                      autoCorrect={false}
                    />
                  </View>
                </View>

                <View style={styles.field}>
                  <Text style={styles.inputLabel}>Email</Text>
                  <View style={styles.roundedInputWrap}>
                    <TextInput
                      style={styles.roundedInput}
                      placeholder="Email"
                      placeholderTextColor="#CEB59F"
                      value={email}
                      onChangeText={setEmail}
                      keyboardType="email-address"
                      autoCapitalize="none"
                      autoCorrect={false}
                    />
                  </View>
                </View>

                <View style={styles.field}>
                  <Text style={styles.inputLabel}>Password</Text>
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
                  onPress={handleSignUp}
                  disabled={loading}
                  activeOpacity={0.8}
                >
                  {loading ? (
                    <ActivityIndicator color="#FEF9F0" />
                  ) : (
                    <Text style={styles.primaryBtnText}>Create Account</Text>
                  )}
                </TouchableOpacity>
                </View>
              {/* </View> */}
            </View>

            <View style={styles.footerRow}>
              <Text style={styles.footerText}>Already have an account? </Text>
              <TouchableOpacity onPress={() => router.push('/auth/login')}>
                <Text style={styles.linkText}>Log In</Text>
              </TouchableOpacity>
            </View>
          </ScrollView>
        </KeyboardAvoidingView>

        <Image
          source={require('../../assets/images/auth/GrayGoatAndHill.png')}
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
  },
  innerContainer: {
    flex: 1,
    paddingHorizontal: 22,
    paddingTop: 0,
    paddingBottom: 20,
    zIndex: 2,
  },
  scrollContent: {
    flexGrow: 1,
    justifyContent: 'flex-start',
    paddingTop: 15,
    paddingHorizontal: 10,
    overflow: 'visible',
  },
  headerSection: {
    alignItems: 'center',
    marginBottom: 8,
    marginTop: 8,
  },
  heroImage: {
    width: SCREEN_WIDTH * 0.72,
    height: (SCREEN_WIDTH * 0.72) * 0.38,
    maxWidth: 320,
    maxHeight: 110,
  },
  cardWrap: {
    width: '100%',
    marginTop: 0,
    alignItems: 'flex-start',
    zIndex: 2,
  },
  loginTitle: {
    alignSelf: 'flex-start',
    marginLeft: 0,
    marginBottom: -2,
    paddingHorizontal: 8,
    paddingVertical: 4,
    color: '#824A20',
    fontSize: 18,
    fontFamily: 'Itim',
    fontWeight: '700',
  },
  card: {
    width: '100%',
    alignSelf: 'stretch',
    backgroundColor: '#FDF5E6',
    borderRadius: 32,
    borderWidth: 8,
    borderColor: '#C7967D',
    padding: 14,
    marginTop: 8,shadowColor: '#8a6b59',
    shadowOffset: { width: 0, height: 6 },
    shadowOpacity: 0.2,
    shadowRadius: 6,
  },

  // shadowContainer: {
  //   width: '100%',
  //   alignSelf: 'stretch',
  //   marginTop: 8,
  //   paddingHorizontal: 8,
  //   // Shadow for iOS
  //   shadowColor: '#8a6b59',
  //   shadowOffset: { width: 6, height: 6 },
  //   shadowOpacity: 0.2,
  //   shadowRadius: 6,
  //   // Elevation for Android
  //   elevation: 6,
  //   // Allow shadow to be visible outside bounds
  //   overflow: 'visible',
  //   zIndex: 3,
  // },
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
  roundedInputWrap: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: '#FEF9F0',
    borderRadius: 22,
    borderWidth: 4.5,
    borderColor: '#C7967D',
    paddingHorizontal: 12,
    paddingVertical: 4,
    width: '100%',
    alignSelf: 'stretch',
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
    height: SCREEN_WIDTH * 0.48,
    resizeMode: 'cover',
    zIndex: 0,
  },
});