import { StyleSheet, Text, View, Pressable } from 'react-native'
import { useRouter } from 'expo-router'

export default function Signup() {
  const router = useRouter();

  return (
    <View style={{flex: 1, justifyContent: 'center', alignItems: 'center'}} >
      <Text>Signup</Text>
      <Pressable onPress={() => router.replace('/')}>
        <Text>back</Text>
      </Pressable>
    </View>
  )
}

const styles = StyleSheet.create({})