import React, { useEffect, useRef } from 'react';
import { View, Animated, StyleSheet } from 'react-native';
import { T } from '../styles/tokens';

export default function ProgressBar({ progress }: { progress: number }) {
  const anim = useRef(new Animated.Value(0)).current;

  useEffect(() => {
    Animated.timing(anim, { toValue: progress, duration: 300, useNativeDriver: false }).start();
  }, [progress]);

  return (
    <View style={s.track}>
      <Animated.View style={[s.fill, {
        width: anim.interpolate({ inputRange: [0, 100], outputRange: ['0%', '100%'] }),
      }]} />
    </View>
  );
}

const s = StyleSheet.create({
  track: { height: 3, backgroundColor: 'rgba(255,255,255,0.06)', borderRadius: 2, overflow: 'hidden' },
  fill:  { height: '100%', backgroundColor: T.accent, borderRadius: 2 },
});
