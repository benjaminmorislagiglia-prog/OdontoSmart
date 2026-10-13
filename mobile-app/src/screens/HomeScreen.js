import { ScrollView, Text, View, Pressable } from 'react-native';
import { useAuth } from '../context/AuthContext';
import { useTheme } from '../context/ThemeContext';
import { appointmentService } from '../services/appointmentService';
import { patientService } from '../services/patientService';
import { notificationService } from '../services/notificationService';
import useResource from '../hooks/useResource';
import { LoadingState, EmptyState, ErrorState } from '../components/FeedbackState';
import AppButton from '../components/AppButton';
import AppointmentCard from '../components/AppointmentCard';
import ScreenHeader from '../components/ScreenHeader';
import { formatDate } from '../utils/formatters';
async function loadHome() {
 const [appointments, patients, notifications] = await Promise.all([appointmentService.listToday(), patientService.list(), notificationService.list()]);
 return { appointments, patients, notifications };
}
export default function HomeScreen({ navigation }) {
 const { user } = useAuth();
 const { colors, styles } = useTheme();
 const { data, loading, error, retry } = useResource(loadHome);
 if (loading) return <LoadingState />;
 if (error) return <ErrorState message={error} onRetry={retry} />;
 const time = new Date().toTimeString().slice(0, 5);
 const next = data.appointments.find(a => ['Confirmado', 'Pendiente'].includes(a.status) && a.time >= time);
 const recent = data.patients.slice().sort((a,b) => b.lastVisit.localeCompare(a.lastVisit)).slice(0,3);
 const unread = data.notifications.filter(n => !n.read);
 return <ScrollView style={styles.screen} contentContainerStyle={styles.content}><ScreenHeader title={'Hola, ' + user.username} subtitle={formatDate(new Date()) + ' · Tu jornada en la clínica'} /><View style={{ flexDirection: 'row', flexWrap: 'wrap', gap: 12 }}>{[['Turnos de hoy', data.appointments.length], ['Pendientes', data.appointments.filter(a => a.status === 'Pendiente').length]].map(([label, value]) => <View key={label} style={[styles.card, { flexGrow: 1, flexBasis: 130 }]}><Text style={styles.muted}>{label}</Text><Text style={[styles.title, { color: colors.primary }]}>{value}</Text></View>)}</View><Text style={styles.sectionTitle}>Accesos rápidos</Text><AppButton title="Ver agenda" secondary onPress={() => navigation.navigate('Turnos')} /><AppButton title="Ver pacientes" secondary onPress={() => navigation.navigate('Pacientes')} /><Text style={styles.sectionTitle}>Próximo turno</Text>{next ? <AppointmentCard appointment={next} onPress={() => navigation.navigate('AppointmentDetail', { id: next.id })} /> : <EmptyState title="No hay próximos turnos para hoy" message="Podés consultar otras fechas en la agenda." />}<Text style={styles.sectionTitle}>Pacientes recientes</Text>{recent.map(p => <Pressable key={p.id} accessibilityRole="button" style={styles.card} onPress={() => navigation.navigate('PatientDetail', { id: p.id })}><Text style={styles.label}>{p.name}</Text><Text style={styles.muted}>Última visita: {formatDate(p.lastVisit)} · {p.coverage}</Text></Pressable>)}{!recent.length && <EmptyState title="No hay pacientes recientes" />}<Text style={styles.sectionTitle}>Avisos importantes</Text>{unread.length ? unread.slice(0,2).map(n => <View key={n.id} style={styles.card}><Text style={styles.label}>{n.title}</Text><Text style={styles.body}>{n.message}</Text></View>) : <EmptyState title="Estás al día con los avisos" />}<AppButton title="Ver notificaciones" secondary onPress={() => navigation.navigate('Notificaciones')} /></ScrollView>;
}
