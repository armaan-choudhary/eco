import React, { useEffect, useRef, useState } from 'react'
import { View, Text, StyleSheet, Dimensions } from 'react-native'

const { width: SCREEN_WIDTH } = Dimensions.get('window')

export default function SpeechBubble({
  children,
  bubbleStyle,
  pointerStyle,
  textStyle,
  pointerSize = 12,
  typing = false,
  typingSpeed = 40,
  onTypingEnd,
}) {
  const flattened = StyleSheet.flatten(bubbleStyle) || {}
  const pointerColor = flattened.backgroundColor || '#00000050'
  const border = pointerSize

  const childText = typeof children === 'string' ? children : null
  const [displayText, setDisplayText] = useState(childText ?? '')
  const indexRef = useRef(0)
  const timerRef = useRef(null)

  useEffect(() => {
    if (!childText) {
      setDisplayText(children)
      return
    }

    if (!typing) {
      setDisplayText(childText)
      indexRef.current = childText.length
      return
    }

    setDisplayText('')
    indexRef.current = 0
    if (timerRef.current) {
      clearInterval(timerRef.current)
      timerRef.current = null
    }

    timerRef.current = setInterval(() => {
      indexRef.current += 1
      setDisplayText(childText.slice(0, indexRef.current))

      if (indexRef.current >= childText.length) {
        clearInterval(timerRef.current)
        timerRef.current = null
        if (typeof onTypingEnd === 'function') onTypingEnd()
      }
    }, Math.max(10, typingSpeed))

    return () => {
      if (timerRef.current) {
        clearInterval(timerRef.current)
        timerRef.current = null
      }
    }
  }, [childText, typing, typingSpeed, children, onTypingEnd])

  return (
    <View style={styles.container} pointerEvents="none">
      <View style={[styles.bubble, bubbleStyle]}>
        <Text style={[styles.text, textStyle]}>
          {childText ? displayText : children}
        </Text>
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
    paddingVertical: 16,
    borderRadius: 16,
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