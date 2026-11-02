import { RefreshControl, ScrollView, Text, View } from 'react-native';
import { useAuth } from '../context/AuthContext';
import { useTheme } from '../context/ThemeContext';
import { useAppointments, useAppointmentStates, usePatients } from '../hooks/useClinicQueries';
import { LoadingState, EmptyState, ErrorState } from '../components/FeedbackState';
import AppButton from '../components/AppButton';
import AnimatedPressable from '../components/AnimatedPressable';
import AppointmentCard from '../components/AppointmentCard';
import AnimatedEntrance from '../components/AnimatedEntrance';
import ScreenHeader from '../components/ScreenHeader';
import StatusBadge from '../components/StatusBadge';
import { dateKey } from '../utils/dates';
import { formatDate } from '../utils/formatters';

export default function HomeScreen({ navigation }) {
  const { user } = useAuth();
  const { colors, styles } = useTheme();
  const appointments = useAppointments();
  const patients = usePatients();
  const states = useAppointmentStates();
  const queries = [appointments, patients, states];
  const retry = () => { queries.forEach(query => query.refetch()); };
  if (queries.some(query => query.isPending)) return <LoadingState />;
  const error = queries.find(query => query.error)?.error;
  if (error) return <ErrorState message={error.message} onRetry={retry} />;
  const today = dateKey();
  const time = new Date().toTimeString().slice(0, 5);
  const todayAppointments = appointments.data.filter(item => item.date === today);
  const upcoming = appointments.data.filter(item =>
    ['Confirmado', 'Pendiente'].includes(item.status) && `${item.date} ${item.time}` >= `${today} ${time}`,
  ).slice(0, 3);
  const recentPatients = patients.data.map(patient => ({
    ...patient,
    lastAttendance: appointments.data.filter(item => item.patientId === patient.id && item.status === 'Atendido' &&
      `${item.date} ${item.time}` <= `${today} ${time}`).at(-1),
  })).filter(patient => patient.lastAttendance)
    .sort((a, b) => `${b.lastAttendance.date} ${b.lastAttendance.time}`.localeCompare(`${a.lastAttendance.date} ${a.lastAttendance.time}`)).slice(0, 3);
  return (
    <ScrollView style={styles.screen} contentContainerStyle={styles.content}
      refreshControl={<RefreshControl refreshing={queries.some(query => query.isRefetching)} onRefresh={retry} tintColor={colors.primary} />}>
      <AnimatedEntrance>
        <ScreenHeader title={'Hola, ' + user.username} subtitle={formatDate(new Date())} />
        <View style={{ flexDirection: 'row', flexWrap: 'wrap', gap: 12 }}>
          {[
            ['Pacientes activos', patients.data.length],
            ['Turnos de hoy', todayAppointments.length],
          ].map(([label, value]) => (
            <View key={label} style={[styles.card, { flexGrow: 1, flexBasis: 130 }]}>
              <Text style={styles.muted}>{label}</Text>
              <Text style={[styles.title, { color: colors.primary }]}>{value}</Text>
            </View>
          ))}
        </View>
        <Text style={styles.sectionTitle}>Turnos por estado · Hoy</Text>
        <View style={styles.card}>
          {states.data.map(state => (
            <View key={state.id} style={{ flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between' }}>
              <StatusBadge status={state.name} />
              <Text style={styles.label}>{todayAppointments.filter(item => item.statusId === state.id).length}</Text>
            </View>
          ))}
          {!states.data.length && <EmptyState title="No hay estados registrados" />}
        </View>
        <Text style={styles.sectionTitle}>Accesos rápidos</Text>
        <AppButton title="Ver agenda" secondary onPress={() => navigation.navigate('Turnos')} />
        <AppButton title="Ver pacientes" secondary onPress={() => navigation.navigate('Pacientes')} />
        <Text style={styles.sectionTitle}>Próximos turnos</Text>
        {upcoming.length ? upcoming.map(item => (
          <AppointmentCard key={item.id} appointment={item} onPress={() => navigation.navigate('AppointmentDetail', { id: item.id })} />
        )) : <EmptyState title="No hay próximos turnos" message="Podés consultar otras fechas en la agenda." />}
        <Text style={styles.sectionTitle}>Pacientes recientes</Text>
        {recentPatients.length ? recentPatients.map(patient => (
          <AnimatedPressable key={patient.id} accessibilityRole="button" style={styles.card} onPress={() => navigation.navigate('PatientDetail', { id: patient.id })}>
            <Text style={styles.label}>{patient.name}</Text>
            <Text style={styles.muted}>Último turno atendido: {formatDate(patient.lastAttendance.date)}</Text>
          </AnimatedPressable>
        )) : <EmptyState title="No hay pacientes con turnos atendidos anteriores" />}
        <AppButton title="Ver avisos de demostración" secondary onPress={() => navigation.navigate('Notificaciones')} />
      </AnimatedEntrance>
    </ScrollView>
  );
}
