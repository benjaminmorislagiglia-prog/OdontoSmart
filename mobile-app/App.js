import { useEffect } from 'react';
import { AppState, Platform } from 'react-native';
import { QueryClientProvider, focusManager } from '@tanstack/react-query';
import { StatusBar } from 'expo-status-bar';
import { SafeAreaProvider, SafeAreaView } from 'react-native-safe-area-context';
import { AuthProvider } from './src/context/AuthContext';
import AppNavigator from './src/navigation/AppNavigator';
import { ThemeProvider, useTheme } from './src/context/ThemeContext';
import { queryClient } from './src/query/queryClient';

function Content() {
  const { colors, mode, ready } = useTheme();
  useEffect(() => {
    if (Platform.OS === 'web') return;
    focusManager.setFocused(AppState.currentState === 'active');
    const subscription = AppState.addEventListener('change', state => focusManager.setFocused(state === 'active'));
    return () => subscription.remove();
  }, []);
  if (!ready) return null;
  return (
    <SafeAreaProvider>
      <SafeAreaView style={{ flex: 1, backgroundColor: colors.background }} edges={['bottom']}>
        <AuthProvider><StatusBar style={mode === 'dark' ? 'light' : 'dark'} /><AppNavigator /></AuthProvider>
      </SafeAreaView>
    </SafeAreaProvider>
  );
}
export default function App() {
  return <QueryClientProvider client={queryClient}><ThemeProvider><Content /></ThemeProvider></QueryClientProvider>;
}

