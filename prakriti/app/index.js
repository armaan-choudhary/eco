import {
    View,
    Text,
    Image,
    ImageBackground,
    Dimensions,
    TouchableOpacity,
    StyleSheet,
} from 'react-native'
import { useRouter } from 'expo-router'
import SpeechBubble from './components/SpeechBubble'


const { width: SCREEN_WIDTH, height: SCREEN_HEIGHT } = Dimensions.get('window')


export default function Index() {
    const router = useRouter()

    const logoSource = require('../assets/images/prakriti-logo.png')
    const bgSource = require('../assets/images/bg.png')

    const logoWidth = Math.round(SCREEN_WIDTH * 0.35)
    const asset = Image.resolveAssetSource(logoSource)
    const logoHeight = Math.round((asset.height / asset.width) * logoWidth)

    const keechakAsset = Image.resolveAssetSource(require('../assets/images/keechak.png'))
    const keechakHeight = Math.round(
        (keechakAsset.height / keechakAsset.width) * SCREEN_WIDTH * 0.6
    )
    const keechakWidth = SCREEN_WIDTH

    const rocksSource = require('../assets/images/rocks.png')
    const rocksAsset = Image.resolveAssetSource(rocksSource)
    const rocksWidth = SCREEN_WIDTH
    const rocksHeight = Math.round((rocksAsset.height / rocksAsset.width) * rocksWidth)


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
                        source={require('../assets/images/keechak.png')}
                        style={[{ width: keechakWidth, height: keechakHeight }, styles.keechak]}
                        resizeMode="contain"
                        pointerEvents="none"
                    />
                </View>

                <TouchableOpacity
                    onPress={() => router.replace('/login')}
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
                onPress={() => router.replace('/signup')}
                style={styles.signupBtn}
                activeOpacity={0.75}
            >
                <Text style={styles.signupText}>Already have an account?</Text>
            </TouchableOpacity>

        </ImageBackground>
    )
}


const styles = StyleSheet.create({
    background: {
        minHeight: '100%',
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
    text: {
        color: 'white',
        fontFamily: 'Modak-Regular',
        fontSize: 24,
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
})