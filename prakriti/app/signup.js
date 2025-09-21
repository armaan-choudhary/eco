import React, { useState } from 'react';
import {
  ScrollView,
  View,
  Text,
  TextInput,
  TouchableOpacity,
  StyleSheet,
  Alert,
  ActivityIndicator,
  Platform,
  ImageBackground,
  Image,
  Dimensions,
} from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { Picker } from '@react-native-picker/picker';
import { useRouter } from 'expo-router';
import { Ionicons } from '@expo/vector-icons';

const { width: SCREEN_WIDTH } = Dimensions.get('window');
const BACKEND_URL = Platform.OS === 'android' ? 'http://10.0.2.2:8000' : 'http://192.168.29.7:8000';

export default function Signup() {
  const router = useRouter();

  // --- Form State Variables ---
  const [name, setName] = useState('');
  const [age, setAge] = useState('');
  const [gender, setGender] = useState();
  const [phone, setPhone] = useState('');
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [isPasswordVisible, setIsPasswordVisible] = useState(false);
  const [type, setType] = useState('school'); // 'school' or 'college'

  // --- UI State ---
  const [loading, setLoading] = useState(false);

  const bgSource = require('../assets/images/bg.png');
  const logoSource = require('../assets/images/prakriti-logo.png');

  const logoWidth = Math.round(SCREEN_WIDTH * 0.35);
  const asset = Image.resolveAssetSource(logoSource);
  const logoHeight = Math.round((asset.height / asset.width) * logoWidth);

  // --- Handle Signup Submission with Mock Data ---
  const handleSignup = async () => {
    // Validation check for the visible fields
    if (!name || !age || !gender || !phone || !email || !password || !type) {
      Alert.alert('Incomplete Form', 'Please fill in all fields.');
      return;
    }

    setLoading(true);

    // --- Mock Data Logic ---
    // Conditionally set the school_id based on the selected type
    const school_id = type === 'school' ? 'SHC005' : 'LPU103';

    const payload = {
      name: name.trim(),
      age: Number(age),
      gender: gender,
      phone: phone.trim(),
      email: email.trim(),
      password: password,
      school_id: school_id, // Use the mock ID
    };

    try {
      const res = await fetch(`${BACKEND_URL}/signup`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(payload),
      });

      const data = await res.json();

      if (!res.ok) {
        throw new Error(data.detail || JSON.stringify(data));
      }

      Alert.alert('Success', 'Account created! You can now log in.');
      router.replace('/login');

    } catch (error) {
      Alert.alert('Signup Failed', error.message);
    } finally {
      setLoading(false);
    }
  };

  return (
    <ImageBackground source={bgSource} style={styles.background} resizeMode="cover">
      <SafeAreaView style={styles.safeArea}>
        <Image
          source={logoSource}
          style={[styles.logo, { width: logoWidth, height: logoHeight }]}
          resizeMode="contain"
        />

        <ScrollView
          style={styles.scrollView}
          contentContainerStyle={styles.scrollContainer}
          showsVerticalScrollIndicator={false}
        >
          <Text style={styles.title}>Create an Account</Text>

          <TextInput style={styles.input} placeholder="Full Name" placeholderTextColor="#999" value={name} onChangeText={setName} />
          <TextInput style={styles.input} placeholder="Age" placeholderTextColor="#999" value={age} onChangeText={setAge} keyboardType="numeric" />

          <View style={styles.pickerContainer}>
            <Picker selectedValue={gender} onValueChange={setGender} style={styles.picker} dropdownIconColor="#fff">
              <Picker.Item label="Select Gender..." value={undefined} />
              <Picker.Item label="Male" value="Male" />
              <Picker.Item label="Female" value="Female" />
              <Picker.Item label="Other" value="Other" />
            </Picker>
          </View>

          <TextInput style={styles.input} placeholder="Phone" placeholderTextColor="#999" value={phone} onChangeText={setPhone} keyboardType="phone-pad" />
          <TextInput style={styles.input} placeholder="Email" placeholderTextColor="#999" value={email} onChangeText={setEmail} keyboardType="email-address" autoCapitalize="none" />

          <View style={styles.passwordContainer}>
            <TextInput style={styles.inputPassword} placeholder="Password" placeholderTextColor="#999" value={password} onChangeText={setPassword} secureTextEntry={!isPasswordVisible} />
            <TouchableOpacity style={styles.peakButton} onPress={() => setIsPasswordVisible(!isPasswordVisible)}>
              <Ionicons name={isPasswordVisible ? 'eye-off' : 'eye'} size={24} color="#fff" />
            </TouchableOpacity>
          </View>

          <View style={styles.pickerContainer}>
            <Picker selectedValue={type} onValueChange={setType} style={styles.picker} dropdownIconColor="#fff">
              <Picker.Item label="I am a School Student" value="school" />
              <Picker.Item label="I am a College Student" value="college" />
            </Picker>
          </View>

          <TouchableOpacity style={styles.primaryButton} onPress={handleSignup} disabled={loading}>
            {loading ? <ActivityIndicator color="#000" /> : <Text style={styles.primaryButtonText}>Create Account</Text>}
          </TouchableOpacity>
        </ScrollView>

        <TouchableOpacity style={styles.secondaryButton} onPress={() => router.replace('/login')}>
          <Text style={styles.secondaryButtonText}>Already have an account? Login</Text>
        </TouchableOpacity>
      </SafeAreaView>
    </ImageBackground>
  );
}

const styles = StyleSheet.create({
  background: { flex: 1, backgroundColor: 'black' },
  safeArea: { flex: 1, alignItems: 'center', justifyContent: 'space-between' },
  logo: { marginTop: 40, marginBottom: 20 },
  scrollView: { width: SCREEN_WIDTH, flex: 1 },
  scrollContainer: { alignItems: 'center', paddingHorizontal: SCREEN_WIDTH * 0.075, paddingBottom: 20 },
  title: { fontSize: 28, fontWeight: 'bold', color: '#fff', marginBottom: 20, textAlign: 'center', fontFamily: 'Ubuntu-Bold' },
  input: { width: '100%', backgroundColor: 'rgba(255, 255, 255, 0.15)', color: '#fff', paddingHorizontal: 20, paddingVertical: 14, borderRadius: 12, fontSize: 16, fontFamily: 'Ubuntu-Regular', marginBottom: 12, borderWidth: 1, borderColor: 'rgba(255, 255, 255, 0.3)' },
  passwordContainer: { flexDirection: 'row', alignItems: 'center', width: '100%', backgroundColor: 'rgba(255, 255, 255, 0.15)', borderRadius: 12, borderWidth: 1, borderColor: 'rgba(255, 255, 255, 0.3)', marginBottom: 12 },
  inputPassword: { flex: 1, color: '#fff', paddingHorizontal: 20, paddingVertical: 14, fontSize: 16, fontFamily: 'Ubuntu-Regular' },
  peakButton: { padding: 10, marginRight: 5 },
  pickerContainer: { width: '100%', backgroundColor: 'rgba(255, 255, 255, 0.15)', borderRadius: 12, borderWidth: 1, borderColor: 'rgba(255, 255, 255, 0.3)', marginBottom: 12, justifyContent: 'center' },
  picker: { color: '#fff', height: 50 },
  primaryButton: { width: '100%', paddingVertical: 18, backgroundColor: '#fff', borderRadius: 16, marginTop: 10, alignItems: 'center', justifyContent: 'center' },
  primaryButtonText: { textTransform: 'uppercase', color: '#000', textAlign: 'center', fontWeight: 'bold', fontSize: 16, fontFamily: 'Ubuntu-Bold' },
  secondaryButton: { width: SCREEN_WIDTH * 0.85, paddingVertical: 18, backgroundColor: '#111', borderRadius: 16, marginBottom: 20 },
  secondaryButtonText: { textTransform: 'uppercase', color: '#fff', textAlign: 'center', fontSize: 16, fontFamily: 'Ubuntu-Bold' },
});