import { ScrollView, Text, View } from 'react-native';
import { patientCoverage } from '../services/patientService';
import { usePatient, useAppointments, usePatientCatalogs } from '../hooks/useClinicQueries';
import { LoadingState, EmptyState, ErrorState } from '../components/FeedbackState';
import AppButton from '../components/AppButton';
import AppointmentCard from '../components/AppointmentCard';
import PatientPhotoEditor from '../components/PatientPhotoEditor';
import { useTheme } from '../context/ThemeContext';
import { calculateAge, dateKey } from '../utils/dates';
import { formatDate } from '../utils/formatters';

function InfoSection({ title, fields }) {
  const { styles } = useTheme();
  return <View style={styles.card}>
    <Text accessibilityRole="header" style={styles.sectionTitle}>{title}</Text>
    {fields.map(([label, value]) => <View key={label} style={{ gap: 4, marginBottom: 8 }}>
      <Text style={styles.label}>{label}</Text>
      <Text selectable style={styles.body}>{value || 'Sin registrar'}</Text>
    </View>)}
  </View>;
}

export default function PatientDetailScreen({ route, navigation }) {
  const { styles } = useTheme();
  const patientQuery = usePatient(route.params.id);
  const appointmentsQuery = useAppointments();
  const catalogs = usePatientCatalogs();
  if (patientQuery.isPending) return <LoadingState />;
  if (patientQuery.error) return <ErrorState message={patientQuery.error.message} onRetry={() => patientQuery.refetch()} />;
  const patient = patientQuery.data;
  if (!patient) return <EmptyState title="El paciente no está disponible" />;
  const age = calculateAge(patient.birthDate);
  const address = catalogs.data?.addresses.find(item => item.idDireccion === patient.addressId);
  const locality = catalogs.data?.localities.find(item => item.idLocalidad === address?.idLocalidad);
  const unqueried = catalogs.isPending ? 'Consultando…' : 'Sin consultar';
  const appointments = (appointmentsQuery.data || []).filter(item => item.patientId === patient.id);
  const now = dateKey() + ' ' + new Date().toTimeString().slice(0, 5);
  const upcoming = appointments.filter(item => `${item.date} ${item.time}` >= now && ['Pendiente', 'Confirmado'].includes(item.status));
  const previous = appointments.filter(item => !upcoming.some(next => next.id === item.id)).reverse();
  return (
    <ScrollView style={styles.screen} contentContainerStyle={styles.content}>
      <PatientPhotoEditor key={patient.id} patient={patient} />
      <InfoSection title="Información personal" fields={[
        ['DNI', patient.dni], ['Fecha de nacimiento', formatDate(patient.birthDate)],
        ['Edad', age === null ? 'Sin dato válido' : `${age} ${age === 1 ? 'año' : 'años'}`],
        ['Estado', patient.active ? 'Activo' : 'Inactivo'],
      ]} />
      <InfoSection title="Contacto" fields={[
        ['Teléfono', patient.phone], ['Email', patient.email],
      ]} />
      <InfoSection title="Obra social" fields={[
        ['Cobertura', catalogs.data || !patient.coverageId ? patientCoverage(patient, catalogs.data) : unqueried],
      ]} />
      <InfoSection title="Dirección" fields={[
        ['Calle y número', address ? `${address.calle} ${address.numero}` : catalogs.data ? 'No disponible' : unqueried],
        ['Barrio', address ? address.barrio || 'Sin registrar' : unqueried],
        ['Localidad', locality?.nombre || (catalogs.data ? 'No disponible' : unqueried)],
        ['Código postal', address ? address.cp : unqueried],
      ]} />
      {catalogs.error && <ErrorState message={catalogs.error.message} onRetry={() => catalogs.refetch()} />}
      <View style={styles.card}>
        <Text accessibilityRole="header" style={styles.sectionTitle}>Acciones</Text>
        <AppButton title="Agendar turno" disabled={!patient.active} onPress={() => navigation.navigate('NewAppointment', { patientId: patient.id })} />
        {!patient.active && <Text style={styles.muted}>Es necesario reactivar al paciente antes de agendar un turno.</Text>}
        <AppButton title="Ver historia clínica" secondary onPress={() => navigation.navigate('ClinicalHistory', { id: patient.id })} />
        <AppButton title="Actualizar paciente" secondary disabled={patientQuery.isFetching || catalogs.isFetching}
          onPress={() => { patientQuery.refetch(); catalogs.refetch(); }} />
      </View>
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
