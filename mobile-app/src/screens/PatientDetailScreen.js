import { ScrollView, Text, View } from 'react-native';
import { patientAddress, patientCoverage } from '../services/patientService';
import { usePatient, useAppointments, usePatientCatalogs } from '../hooks/useClinicQueries';
import { LoadingState, EmptyState, ErrorState } from '../components/FeedbackState';
import AppButton from '../components/AppButton';
import AppointmentCard from '../components/AppointmentCard';
import PatientPhotoEditor from '../components/PatientPhotoEditor';
import ScreenHeader from '../components/ScreenHeader';
import { useTheme } from '../context/ThemeContext';
import { dateKey } from '../utils/dates';
import { formatDate } from '../utils/formatters';

export default function PatientDetailScreen({ route, navigation }) {
  const { styles } = useTheme();
  const patientQuery = usePatient(route.params.id);
  const appointmentsQuery = useAppointments();
  const catalogs = usePatientCatalogs();
  if (patientQuery.isPending) return <LoadingState />;
  if (patientQuery.error) return <ErrorState message={patientQuery.error.message} onRetry={() => patientQuery.refetch()} />;
  const patient = patientQuery.data;
  if (!patient) return <EmptyState title="El paciente no está disponible" />;
  const appointments = (appointmentsQuery.data || []).filter(item => item.patientId === patient.id);
  const now = dateKey() + ' ' + new Date().toTimeString().slice(0, 5);
  const upcoming = appointments.filter(item => `${item.date} ${item.time}` >= now && ['Pendiente', 'Confirmado'].includes(item.status));
  const previous = appointments.filter(item => !upcoming.some(next => next.id === item.id)).reverse();
  return (
    <ScrollView style={styles.screen} contentContainerStyle={styles.content}>
      <ScreenHeader title={patient.name} subtitle={'DNI: ' + patient.dni} />
      <AppButton title="Actualizar paciente" secondary disabled={patientQuery.isFetching} onPress={() => patientQuery.refetch()} />
      <PatientPhotoEditor key={patient.id} patient={patient} />
      <View style={styles.card}>
        {[
          ['Estado', patient.active ? 'Activo' : 'Inactivo'],
          ['Nacimiento', formatDate(patient.birthDate)],
          ['Teléfono', patient.phone], ['Correo', patient.email],
          ['Obra social', patientCoverage(patient, catalogs.data)],
          ['Dirección', patientAddress(patient, catalogs.data)],
        ].map(([label, value]) => (
          <View key={label} style={{ gap: 4, marginBottom: 8 }}>
            <Text style={styles.label}>{label}</Text><Text selectable style={styles.body}>{value || 'Sin registrar'}</Text>
          </View>
        ))}
        {catalogs.isPending && <Text style={styles.muted}>Consultando obra social y dirección…</Text>}
        {catalogs.error && <ErrorState message={catalogs.error.message} onRetry={() => catalogs.refetch()} />}
      </View>
      <AppButton title="Ver historia clínica" onPress={() => navigation.navigate('ClinicalHistory', { id: patient.id })} />
      {appointmentsQuery.isPending ? <LoadingState message="Consultando turnos del paciente…" /> : appointmentsQuery.error ?
        <ErrorState message={appointmentsQuery.error.message} onRetry={() => appointmentsQuery.refetch()} /> :
        [{ title: 'Próximos turnos', items: upcoming }, { title: 'Últimos turnos', items: previous }].map(({ title, items }) => (
          <View key={title} style={{ gap: 12 }}>
            <Text style={styles.sectionTitle}>{title}</Text>
            {items.length ? items.map(item => <AppointmentCard key={item.id} appointment={item} onPress={() => navigation.navigate('AppointmentDetail', { id: item.id })} />) :
              <EmptyState title="No hay turnos en esta sección" />}
          </View>
        ))}
    </ScrollView>
  );
}
