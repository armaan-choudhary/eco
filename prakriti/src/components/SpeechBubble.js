import React from 'react'
import { View, Text, StyleSheet, Dimensions } from 'react-native'

const { width: SCREEN_WIDTH } = Dimensions.get('window')

export default function SpeechBubble({
  children,
  bubbleStyle,
  pointerStyle,
  textStyle,
  pointerSize = 12,
}) {
  const flat = StyleSheet.flatten(bubbleStyle) || {}
  const pointerColor = flat.backgroundColor || '#00000050'
  const border = pointerSize

  return (
    <View style={styles.container} pointerEvents="none">
      <View style={[styles.bubble, bubbleStyle]}>
        <Text style={[styles.text, textStyle]}>{children}</Text>
      </View>
      <View
        style={[
          styles.pointer,
          {
            borderLeftWidth: border,
            borderRightWidth: border,
            borderTopWidth: border,
            borderTopColor: pointerColor,
          },
          pointerStyle,
        ]}
        pointerEvents="none"
      />
    </View>
  )
}

const styles = StyleSheet.create({
  container: {
    alignItems: 'center',
  },
  bubble: {
    alignSelf: 'center',
    backgroundColor: '#00000050',
    paddingHorizontal: 20,
    paddingVertical: 12,
    borderRadius: 14,
    maxWidth: SCREEN_WIDTH * 0.85,
    marginBottom: 0,
  },
  text: {
    color: '#fff',
    textAlign: 'center',
    fontSize: 16,
    fontFamily: 'Ubuntu-Medium',
  },
  pointer: {
    width: 0,
    height: 0,
    borderLeftColor: 'transparent',
    borderRightColor: 'transparent',
    alignSelf: 'center',
    marginTop: 0,
  },
})