import { useCallback } from 'react';
import { AccessibilityInfo, Animated, useAnimatedValue } from 'react-native';
import { useFocusEffect } from '@react-navigation/native';

export default function AnimatedEntrance({ children }) {
  const progress = useAnimatedValue(1);
  useFocusEffect(useCallback(() => {
    let active = true;
    let animation;
    function animate(reduceMotion) {
      if (!active) return;
      animation?.stop();
      progress.setValue(reduceMotion ? 1 : 0);
      if (!reduceMotion) {
        animation = Animated.timing(progress, { toValue: 1, duration: 350, useNativeDriver: true });
        animation.start();
      }
    }
    AccessibilityInfo.isReduceMotionEnabled().then(animate).catch(() => animate(true));
    const subscription = AccessibilityInfo.addEventListener('reduceMotionChanged', animate);
    return () => { active = false; animation?.stop(); subscription.remove(); };
  }, [progress]));
  return (
    <Animated.View style={{ gap: 16, opacity: progress, transform: [{ translateY: progress.interpolate({ inputRange: [0, 1], outputRange: [12, 0] }) }] }}>
      {children}
    </Animated.View>
  );
}
