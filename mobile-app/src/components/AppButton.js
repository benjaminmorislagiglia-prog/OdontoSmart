import { ActivityIndicator, Text } from 'react-native';
import { useTheme } from '../context/ThemeContext';
import AnimatedPressable from './AnimatedPressable';
export default function AppButton({
  title,
  onPress,
  loading = false,
  disabled = false,
  secondary = false,
  loadingText = 'Procesando…',
}) {
  const { colors } = useTheme();
  const unavailable = disabled || loading;
  return (
    <AnimatedPressable
      accessibilityRole="button"
      accessibilityState={{ disabled: unavailable, busy: loading }}
      disabled={unavailable}
      onPress={onPress}
      style={{
        minHeight: 48,
        borderRadius: 10,
        padding: 14,
        gap: 10,
        flexDirection: 'row',
        justifyContent: 'center',
        alignItems: 'center',
        backgroundColor: secondary ? colors.soft : colors.primary,
        opacity: unavailable ? 0.65 : 1,
      }}
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
    </AnimatedPressable>
  );
}
