import { useState, useEffect } from 'react';
import {
    View,
    Text,
    Image,
    ImageBackground,
    Dimensions,
    TouchableOpacity,
    StyleSheet,
    ActivityIndicator,
} from 'react-native';
import { useRouter } from 'expo-router';
import AsyncStorage from '@react-native-async-storage/async-storage';
import SpeechBubble from './components/SpeechBubble';

const { width: SCREEN_WIDTH } = Dimensions.get('window');

export default function Index() {
    const router = useRouter();
    const [isLoading, setIsLoading] = useState(true);

    useEffect(() => {
        const checkLoginState = async () => {
            try {
                const token = await AsyncStorage.getItem('userToken');
                if (token) {
                    router.replace('/dashboard');
                } else {
                    setIsLoading(false);
                }
            } catch (error) {
                console.error('Failed to load token from storage', error);
                setIsLoading(false);
            }
        };

        checkLoginState();
    }, []);

    const logoSource = require('../assets/images/prakriti-logo.png');
    const bgSource = require('../assets/images/bg.png');
    const keechakSource = require('../assets/images/keechak.png');
    const rocksSource = require('../assets/images/rocks.png');

    const logoWidth = Math.round(SCREEN_WIDTH * 0.35);
    const asset = Image.resolveAssetSource(logoSource);
    const logoHeight = Math.round((asset.height / asset.width) * logoWidth);

    const keechakAsset = Image.resolveAssetSource(keechakSource);
    const keechakHeight = Math.round(
        (keechakAsset.height / keechakAsset.width) * SCREEN_WIDTH * 0.6
    );
    const keechakWidth = SCREEN_WIDTH;

    const rocksAsset = Image.resolveAssetSource(rocksSource);
    const rocksWidth = SCREEN_WIDTH;
    const rocksHeight = Math.round((rocksAsset.height / rocksAsset.width) * rocksWidth);

    if (isLoading) {
        return (
            <View style={{ flex: 1, justifyContent: 'center', alignItems: 'center', backgroundColor: 'black' }}>
                <ActivityIndicator size="large" color="#fff" />
            </View>
        );
    }

    return (
        <ImageBackground source={bgSource} style={styles.background} resizeMode="cover">
            <Image
                source={logoSource}
                style={[styles.logo, { width: logoWidth, height: logoHeight }]}
                resizeMode="contain"
            />
            <View style={{ width: SCREEN_WIDTH, alignItems: 'center' }} pointerEvents="box-none">
                <View style={{ width: SCREEN_WIDTH, alignItems: 'center' }}>
                    <SpeechBubble>I've been waiting for you...</SpeechBubble>
                    <Image
                        source={keechakSource}
                        style={[{ width: keechakWidth, height: keechakHeight }, styles.keechak]}
                        resizeMode="contain"
                        pointerEvents="none"
                    />
                </View>
                <TouchableOpacity
                    onPress={() => router.replace('/signup')}
                    style={styles.loginBtn}
                    activeOpacity={0.75}
                >
                    <Text style={styles.loginText}>Get Started</Text>
                </TouchableOpacity>
            </View>
            <Image
                source={rocksSource}
                style={[styles.rocks, { width: rocksWidth, height: rocksHeight }]}
                resizeMode="contain"
            />
            <TouchableOpacity
                onPress={() => router.replace('/login')}
                style={styles.signupBtn}
                activeOpacity={0.75}
            >
                <Text style={styles.signupText}>Already have an account?</Text>
            </TouchableOpacity>
        </ImageBackground>
    );
}

const styles = StyleSheet.create({
    background: {
        flex: 1,
        backgroundColor: 'black',
        justifyContent: 'space-between',
        alignItems: 'center',
        paddingVertical: 69,
        position: 'relative',
    },
    logo: {
        margin: 0,
        padding: 0,
    },
    loginBtn: {
        marginTop: '-11%',
        alignSelf: 'center',
        width: SCREEN_WIDTH * 0.85,
        padding: 12,
        paddingBottom: 6,
        backgroundColor: '#FFE100',
        borderRadius: 16,
        zIndex: 2,
        elevation: 10,
    },
    keechak: {
        zIndex: 2,
        elevation: 20,
    },
    loginText: {
        color: '#111',
        textAlign: 'center',
        fontWeight: '600',
        fontFamily: 'Modak-Regular',
        fontSize: 28,
    },
    signupBtn: {
        alignSelf: 'center',
        width: SCREEN_WIDTH * 0.85,
        padding: 16,
        paddingBottom: 18,
        backgroundColor: '#111',
        borderRadius: 16,
        zIndex: 2,
        elevation: 10,
    },
    signupText: {
        textTransform: 'uppercase',
        color: '#fff',
        textAlign: 'center',
        fontWeight: '400',
        fontFamily: 'Ubuntu-Bold',
        fontSize: 16,
    },
    rocks: {
        position: 'absolute',
        bottom: 0,
        alignSelf: 'center',
        zIndex: 1,
    },
});