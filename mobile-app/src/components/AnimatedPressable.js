import { useEffect } from 'react';
import { Animated, Easing, Pressable, useAnimatedValue } from 'react-native';
import { useTheme } from '../context/ThemeContext';

const NativeAnimatedPressable = Animated.createAnimatedComponent(Pressable);

/** @param {Omit<import('react-native').PressableProps, 'style'> & { style?: import('react-native').StyleProp<import('react-native').ViewStyle> }} props */
export default function AnimatedPressable({ disabled = false, style, onPressIn, onPressOut, ...props }) {
  const { reduceMotion } = useTheme();
  const progress = useAnimatedValue(0);

  useEffect(() => {
    progress.stopAnimation();
    progress.setValue(0);
    return () => progress.stopAnimation();
  }, [progress, disabled, reduceMotion]);

  function animatePress(pressed) {
    progress.stopAnimation();
    if (disabled || reduceMotion) {
      progress.setValue(disabled ? 0 : pressed ? 1 : 0);
      return;
    }
    Animated.timing(progress, {
      toValue: pressed ? 1 : 0,
      duration: 100,
      easing: Easing.out(Easing.quad),
      useNativeDriver: true,
      isInteraction: false,
    }).start();
  }

  return (
    <NativeAnimatedPressable
      {...props}
      disabled={disabled}
      onPressIn={event => { animatePress(true); onPressIn?.(event); }}
      onPressOut={event => { animatePress(false); onPressOut?.(event); }}
      style={[
        style,
        !disabled && { opacity: progress.interpolate({ inputRange: [0, 1], outputRange: [1, 0.85] }) },
        {
          transform: [
            { scale: reduceMotion ? 1 : progress.interpolate({ inputRange: [0, 1], outputRange: [1, 0.92] }) },
            { translateY: reduceMotion ? 0 : progress.interpolate({ inputRange: [0, 1], outputRange: [0, 2] }) },
          ],
        },
      ]}
    />
  );
}
