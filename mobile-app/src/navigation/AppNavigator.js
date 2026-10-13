import { NavigationContainer, DefaultTheme, DarkTheme } from '@react-navigation/native';
import { createNativeStackNavigator } from '@react-navigation/native-stack';
import { createBottomTabNavigator } from '@react-navigation/bottom-tabs';
import Ionicons from '@expo/vector-icons/Ionicons';
import { useAuth } from '../context/AuthContext';
import { useTheme } from '../context/ThemeContext';
import LoginScreen from '../screens/LoginScreen';
import HomeScreen from '../screens/HomeScreen';
import AppointmentsScreen from '../screens/AppointmentsScreen';
import PatientsScreen from '../screens/PatientsScreen';
import NotificationsScreen from '../screens/NotificationsScreen';
import ProfileScreen from '../screens/ProfileScreen';
import AppointmentDetailScreen from '../screens/AppointmentDetailScreen';
import PatientDetailScreen from '../screens/PatientDetailScreen';
import ClinicalHistoryScreen from '../screens/ClinicalHistoryScreen';
import { LoadingState, ErrorState } from '../components/FeedbackState';
const Stack = createNativeStackNavigator();
const Tabs = createBottomTabNavigator();
const icons = { Inicio: 'home-outline', Turnos: 'calendar-outline', Pacientes: 'people-outline', Notificaciones: 'notifications-outline', Perfil: 'person-outline' };
function MainTabs() {
 const { colors } = useTheme();
 return <Tabs.Navigator id="MainTabs" screenOptions={({ route }) => ({ headerTitle: 'OdontoSmart', headerStyle: { backgroundColor: colors.surface }, headerTintColor: colors.text, tabBarStyle: { backgroundColor: colors.surface, borderTopColor: colors.border }, tabBarActiveTintColor: colors.primary, tabBarInactiveTintColor: colors.muted, tabBarLabelStyle: { fontSize: 12 }, tabBarHideOnKeyboard: true, tabBarIcon: ({ color, size }) => <Ionicons name={icons[route.name]} color={color} size={size} />, sceneStyle: { backgroundColor: colors.background } })}>
 <Tabs.Screen name="Inicio" component={HomeScreen} /><Tabs.Screen name="Turnos" component={AppointmentsScreen} /><Tabs.Screen name="Pacientes" component={PatientsScreen} /><Tabs.Screen name="Notificaciones" component={NotificationsScreen} options={{ tabBarLabel: 'Avisos' }} /><Tabs.Screen name="Perfil" component={ProfileScreen} />
 </Tabs.Navigator>;
}
export default function AppNavigator() {
 const { user, restoring, restoreError, restore } = useAuth();
 const { colors, mode } = useTheme();
 if (restoring) return <LoadingState message="OdontoSmart · Cargando…" />;
 if (restoreError) return <ErrorState message={restoreError} onRetry={restore} />;
 const base = mode === 'dark' ? DarkTheme : DefaultTheme;
 return <NavigationContainer theme={{ ...base, colors: { ...base.colors, primary: colors.primary, background: colors.background, card: colors.surface, text: colors.text, border: colors.border } }}><Stack.Navigator id="RootStack" screenOptions={{ headerStyle: { backgroundColor: colors.surface }, headerTintColor: colors.text, contentStyle: { backgroundColor: colors.background } }}>
 {user ? <Stack.Group navigationKey="authenticated"><Stack.Screen name="App" component={MainTabs} options={{ headerShown: false }} /><Stack.Screen name="AppointmentDetail" component={AppointmentDetailScreen} options={{ title: 'Detalle del turno' }} /><Stack.Screen name="PatientDetail" component={PatientDetailScreen} options={{ title: 'Detalle del paciente' }} /><Stack.Screen name="ClinicalHistory" component={ClinicalHistoryScreen} options={{ title: 'Historia clínica' }} /></Stack.Group> : <Stack.Screen name="Login" component={LoginScreen} options={{ headerShown: false }} />}
 </Stack.Navigator></NavigationContainer>;
}
