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


const { width: SCREEN_WIDTH, height: SCREEN_HEIGHT } = Dimensions.get('window')


export default function Login() {
    const router = useRouter()

    const logoSource = require('../assets/images/prakriti-logo.png')
    const bgSource = require('../assets/images/bg.png')

    const logoWidth = Math.round(SCREEN_WIDTH * 0.35)
    const asset = Image.resolveAssetSource(logoSource)
    const logoHeight = Math.round((asset.height / asset.width) * logoWidth)


    return (
        <ImageBackground source={bgSource} style={styles.background} resizeMode="cover">

            <Image
                source={logoSource}
                style={[styles.logo, { width: logoWidth, height: logoHeight }]}
                resizeMode="contain"
            />

            <View style={{ width: SCREEN_WIDTH, alignItems: 'center' }} pointerEvents="box-none">
                
            </View>

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
    }
})