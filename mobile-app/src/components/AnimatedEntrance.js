import { useCallback } from 'react';
import { Animated, useAnimatedValue } from 'react-native';
import { useFocusEffect } from '@react-navigation/native';
import { useTheme } from '../context/ThemeContext';

export default function AnimatedEntrance({ children }) {
  const progress = useAnimatedValue(1);
  const { reduceMotion } = useTheme();
  useFocusEffect(useCallback(() => {
    progress.setValue(reduceMotion ? 1 : 0);
    if (reduceMotion) return;
    const animation = Animated.timing(progress, { toValue: 1, duration: 350, useNativeDriver: true });
    animation.start();
    return () => {
      animation.stop();
      progress.setValue(1);
    };
  }, [progress, reduceMotion]));
  return (
    <Animated.View style={{ gap: 16, opacity: progress, transform: [{ translateY: progress.interpolate({ inputRange: [0, 1], outputRange: [12, 0] }) }] }}>
      {children}
    </Animated.View>
  );
}
