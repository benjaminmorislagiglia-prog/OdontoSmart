import { useEffect } from 'react';
import { ActivityIndicator, Animated, Pressable, Text, useAnimatedValue } from 'react-native';
import { useTheme } from '../context/ThemeContext';
export default function AppButton({
  title,
  onPress,
  loading = false,
  disabled = false,
  secondary = false,
  loadingText = 'Procesando…',
}) {
  const { colors, reduceMotion } = useTheme();
  const unavailable = disabled || loading;
  const scale = useAnimatedValue(1);
  useEffect(() => {
    if (unavailable || reduceMotion) {
      scale.stopAnimation();
      scale.setValue(1);
    }
    return () => scale.stopAnimation();
  }, [scale, unavailable, reduceMotion]);
  function animatePress(pressed) {
    scale.stopAnimation();
    if (unavailable || reduceMotion) { scale.setValue(1); return; }
    Animated.timing(scale, { toValue: pressed ? 0.96 : 1, duration: pressed ? 80 : 140, useNativeDriver: true }).start();
  }
  return (
    <Animated.View style={{ transform: [{ scale }] }}>
      <Pressable
        accessibilityRole="button"
        accessibilityState={{ disabled: unavailable, busy: loading }}
        disabled={unavailable}
        onPress={onPress}
        onPressIn={() => animatePress(true)}
        onPressOut={() => animatePress(false)}
        style={({ pressed }) => ({
          minHeight: 48,
          borderRadius: 10,
          padding: 14,
          gap: 10,
          flexDirection: 'row',
          justifyContent: 'center',
          alignItems: 'center',
          backgroundColor: secondary ? colors.soft : colors.primary,
          opacity: unavailable ? 0.65 : pressed ? 0.9 : 1,
        })}
      >
        {loading && <ActivityIndicator color={secondary ? colors.primary : colors.background} />}
        <Text
          style={{
            color: secondary ? colors.primary : colors.background,
            fontSize: 15,
            fontWeight: '600',
            textAlign: 'center',
          }}
        >
          {loading ? loadingText : title}
        </Text>
      </Pressable>
    </Animated.View>
  );
}
