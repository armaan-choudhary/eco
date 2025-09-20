import { View, Text, Image, ImageBackground, Dimensions, Button } from 'react-native';
import { useRouter } from 'expo-router';
import { StyleSheet } from 'react-native';

export default function Login() {
  const router = useRouter();

  const logoSource = require('../assets/images/prakriti-logo.png');
  const bgSource = require('../assets/images/bg.png');
  const { width: screenWidth } = Dimensions.get('window');

  const logoWidth = Math.round(screenWidth * 0.35);
  const asset = Image.resolveAssetSource(logoSource);
  const logoHeight = Math.round((asset.height / asset.width) * logoWidth);

  const keechakAsset = Image.resolveAssetSource(require('../assets/images/keechak.png'));
  const keechakHeight = Math.round((keechakAsset.height / keechakAsset.width) * screenWidth * 0.75)
  const keechakWidth = screenWidth;

  return (
    <ImageBackground
      source={bgSource}
      style={styles.background}
      resizeMode="cover"
    >

      <Image
        source={logoSource}
        style={[styles.logo, { width: logoWidth, height: logoHeight }]}
        resizeMode="contain"
      />
      <View>
        <Image
          source={require('../assets/images/keechak.png')}
          style={{ width: keechakWidth, height: keechakHeight }}
          resizeMode="contain"
        />
        <Button title="Log In" onPress={() => router.replace('/(tabs)')} />
      </View>
      <Text style={styles.text}>Login Screen</Text>
      {/* <Button title="Log In" onPress={() => router.replace('/(tabs)')} /> */}
    </ImageBackground>
  );
}

const styles = StyleSheet.create({
  background: {
    minHeight: '100%',
    backgroundColor: 'black', // Fallback color while image loads
    justifyContent: 'space-between',
    alignItems: 'center',
    paddingVertical: 50,
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
});