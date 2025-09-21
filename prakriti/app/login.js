import { useState, useEffect } from 'react';
import {
    View,
    Text,
    Image,
    ImageBackground,
    Dimensions,
    TouchableOpacity,
    StyleSheet,
    TextInput,
    Alert,
    Platform,
    ActivityIndicator, // 1. Import ActivityIndicator for the loader
} from 'react-native';
import { useRouter } from 'expo-router';
import AsyncStorage from '@react-native-async-storage/async-storage';
import { Ionicons } from '@expo/vector-icons'; // 2. Import Ionicons for the eye icon

const { width: SCREEN_WIDTH } = Dimensions.get('window');

const BACKEND_URL = Platform.OS === 'android' ? 'http://10.0.2.2:8000' : 'http://192.168.29.7:8000';

export default function Login() {
    const router = useRouter();

    const [email, setEmail] = useState('');
    const [password, setPassword] = useState('');
    const [isPasswordVisible, setIsPasswordVisible] = useState(false);
    const [loading, setLoading] = useState(false); // 3. Add loading state

    useEffect(() => {
        const checkLoginState = async () => {
            try {
                const token = await AsyncStorage.getItem('userToken');
                if (token) {
                    router.replace('/dashboard');
                }
            } catch (error) {
                console.error('Failed to load token from storage', error);
            }
        };

        checkLoginState();
    }, []);

    const logoSource = require('../assets/images/prakriti-logo.png');
    const bgSource = require('../assets/images/bg.png');

    const logoWidth = Math.round(SCREEN_WIDTH * 0.35);
    const asset = Image.resolveAssetSource(logoSource);
    const logoHeight = Math.round((asset.height / asset.width) * logoWidth);

    const handleLogin = async () => {
        if (!email || !password) {
            Alert.alert('Incomplete Form', 'Please enter both email and password.');
            return;
        }

        setLoading(true); // 4. Set loading to true when processing starts
        try {
            const response = await fetch(`${BACKEND_URL}/login`, {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({ email, password }),
            });

            const data = await response.json();

            if (!response.ok) {
                throw new Error(data.detail || 'An unknown error occurred.');
            }

            await AsyncStorage.setItem('userToken', data.access_token);
            router.replace('/dashboard');

        } catch (error) {
            Alert.alert('Login Failed', error.message);
        } finally {
            setLoading(false); // 5. Set loading to false when processing ends (success or fail)
        }
    };

    return (
        <ImageBackground source={bgSource} style={styles.background} resizeMode="cover">
            <Image
                source={logoSource}
                style={[styles.logo, { width: logoWidth, height: logoHeight }]}
                resizeMode="contain"
            />
            <View style={styles.formContainer}>
                <TextInput
                    style={styles.input}
                    placeholder="Email Address"
                    placeholderTextColor="#999"
                    value={email}
                    onChangeText={setEmail}
                    keyboardType="email-address"
                    autoCapitalize="none"
                />
                <View style={styles.passwordContainer}>
                    <TextInput
                        style={styles.inputPassword}
                        placeholder="Password"
                        placeholderTextColor="#999"
                        value={password}
                        onChangeText={setPassword}
                        secureTextEntry={!isPasswordVisible}
                    />
                    <TouchableOpacity
                        style={styles.peakButton}
                        onPress={() => setIsPasswordVisible(!isPasswordVisible)}
                    >
                        {/* 6. Replaced Text with Ionicons for the eye icon */}
                        <Ionicons
                            name={isPasswordVisible ? 'eye-off' : 'eye'}
                            size={24}
                            color="#fff"
                        />
                    </TouchableOpacity>
                </View>
                <TouchableOpacity
                    onPress={handleLogin}
                    style={styles.loginBtn}
                    activeOpacity={0.75}
                    disabled={loading} // 7. Disable button while loading
                >
                    {/* 8. Conditionally show loader or text */}
                    {loading ? (
                        <ActivityIndicator color="#000" />
                    ) : (
                        <Text style={styles.loginText}>Login</Text>
                    )}
                </TouchableOpacity>
            </View>
            <TouchableOpacity
                onPress={() => router.replace('/signup')}
                style={styles.signupBtn}
                activeOpacity={0.75}
            >
                <Text style={styles.signupText}>Don't have an account? Sign Up</Text>
            </TouchableOpacity>
        </ImageBackground>
    );
}

// Styles remain the same
const styles = StyleSheet.create({
    background: {
        flex: 1,
        justifyContent: 'space-between',
        alignItems: 'center',
        paddingVertical: 69,
    },
    logo: {
        margin: 0,
        padding: 0,
    },
    formContainer: {
        width: SCREEN_WIDTH * 0.85,
        alignItems: 'center',
    },
    input: {
        width: '100%',
        backgroundColor: 'rgba(255, 255, 255, 0.15)',
        color: '#fff',
        paddingHorizontal: 20,
        paddingVertical: 14,
        borderRadius: 12,
        fontSize: 16,
        fontFamily: 'Ubuntu-Regular',
        marginBottom: 12,
        borderWidth: 1,
        borderColor: 'rgba(255, 255, 255, 0.3)',
    },
    passwordContainer: {
        flexDirection: 'row',
        alignItems: 'center',
        width: '100%',
        backgroundColor: 'rgba(255, 255, 255, 0.15)',
        borderRadius: 12,
        borderWidth: 1,
        borderColor: 'rgba(255, 255, 255, 0.3)',
        marginBottom: 12,
    },
    inputPassword: {
        flex: 1,
        color: '#fff',
        paddingHorizontal: 20,
        paddingVertical: 14,
        fontSize: 16,
        fontFamily: 'Ubuntu-Regular',
    },
    peakButton: {
        padding: 10,
        marginRight: 5,
    },
    loginBtn: {
        width: '100%',
        paddingVertical: 18,
        backgroundColor: '#fff',
        borderRadius: 16,
        marginTop: 10,
        alignItems: 'center',
        justifyContent: 'center',
    },
    loginText: {
        textTransform: 'uppercase',
        color: '#000',
        textAlign: 'center',
        fontWeight: 'bold',
        fontSize: 16,
        fontFamily: 'Ubuntu-Bold',
    },
    signupBtn: {
        alignSelf: 'center',
        width: SCREEN_WIDTH * 0.85,
        padding: 16,
        paddingBottom: 18,
        backgroundColor: '#111',
        borderRadius: 16,
    },
    signupText: {
        textTransform: 'uppercase',
        color: '#fff',
        textAlign: 'center',
        fontWeight: '400',
        fontFamily: 'Ubuntu-Bold',
        fontSize: 16,
    },
});