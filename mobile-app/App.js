import { StatusBar } from 'expo-status-bar';
import { SafeAreaProvider, SafeAreaView } from 'react-native-safe-area-context';
import { AuthProvider } from './src/context/AuthContext';
import AppNavigator from './src/navigation/AppNavigator';
import { ThemeProvider, useTheme } from './src/context/ThemeContext';

function Content() {
  const { colors, mode, ready } = useTheme();
  if (!ready) return null;
  return (
    <SafeAreaProvider>
      <SafeAreaView style={{ flex: 1, backgroundColor: colors.background }} edges={['bottom']}>
        <AuthProvider><StatusBar style={mode === 'dark' ? 'light' : 'dark'} /><AppNavigator /></AuthProvider>
      </SafeAreaView>
    </SafeAreaProvider>
  );
}
export default function App() { return <ThemeProvider><Content /></ThemeProvider>; }

